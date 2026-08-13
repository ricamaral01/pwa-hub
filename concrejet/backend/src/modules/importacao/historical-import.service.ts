import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';

export const IMPORT_VERSION = 'historical-import-v1';
export const IMPORT_ROOT = resolve(process.cwd(), '..', 'imports', 'historico');
const ALLOWED_EXT = new Set(['.csv', '.xlsx', '.xls']);

@Injectable()
export class HistoricalImportService {
  constructor(private readonly dataSource: DataSource) {}

  ensureStructure(root = IMPORT_ROOT) {
    for (const dir of [
      'entrada',
      'processados',
      'rejeitados',
      'relatorios',
      'mapeamentos',
      'exemplos',
    ]) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    const manifestPath = join(root, 'manifesto-arquivos-esperados.json');
    if (!existsSync(manifestPath)) {
      writeFileSync(
        manifestPath,
        JSON.stringify(
          { esperado: [], observacao: 'Arquivos historicos reais ainda nao fornecidos.' },
          null,
          2,
        ),
      );
    }
    return { root, manifestPath };
  }

  async createBatch(nome: string, origem = 'imports/historico/entrada') {
    this.ensureStructure();
    const [batch] = await this.dataSource.query(
      `insert into import_batches (nome, origem, status, importador_versao) values ($1, $2, 'criado', $3) returning *`,
      [nome, origem, IMPORT_VERSION],
    );
    return batch;
  }

  async analyzePath(
    path = join(IMPORT_ROOT, 'entrada'),
    batchName = `analise-${new Date().toISOString()}`,
  ) {
    this.ensureStructure();
    const safePath = resolve(path);
    if (!safePath.startsWith(resolve(process.cwd(), '..')))
      throw new BadRequestException('Caminho fora do projeto.');
    if (!existsSync(safePath))
      throw new BadRequestException('Caminho de importacao nao encontrado.');
    const batch = await this.createBatch(batchName, safePath);
    const files = this.discoverFiles(safePath);
    let totalRows = 0;
    let totalSheets = 0;
    for (const file of files) {
      const checksum = sha(readFileSync(file));
      const [savedFile] = await this.dataSource.query(
        `insert into import_files (batch_id, caminho, nome, checksum) values ($1,$2,$3,$4) on conflict (batch_id, checksum) do update set nome = excluded.nome returning *`,
        [batch.id, file, basename(file), checksum],
      );
      const ext = extname(file).toLowerCase();
      if (ext === '.csv' || ext === '.xlsx') {
        const parsedSheets =
          ext === '.csv'
            ? [{ name: 'CSV', index: 0, ...parseCsv(readFileSync(file, 'utf8')) }]
            : parseXlsx(file);
        for (const parsed of parsedSheets) {
          const [sheet] = await this.dataSource.query(
            `insert into import_sheets (file_id, nome, indice, headers) values ($1,$2,$3,$4) returning *`,
            [savedFile.id, parsed.name, parsed.index, JSON.stringify(parsed.headers)],
          );
          totalSheets += 1;
          for (const row of parsed.rows) {
            const lineChecksum = sha(JSON.stringify(row.values));
            await this.dataSource.query(
              `insert into import_rows (sheet_id, numero_linha, conteudo_original, checksum_linha, status, chave_origem)
               values ($1,$2,$3,$4,'pendente',$5) on conflict (sheet_id, checksum_linha) do nothing`,
              [
                sheet.id,
                row.line,
                JSON.stringify(row.values),
                lineChecksum,
                `${checksum}:${parsed.name}:${row.line}`,
              ],
            );
            for (const warning of row.warnings ?? []) {
              await this.dataSource.query(
                `insert into import_errors (codigo, severidade, mensagem, valor_original)
                 values ('FORMULA_XLSX','aviso',$1,$2)`,
                [warning, `${file}:${parsed.name}:${row.line}`],
              );
            }
            totalRows += 1;
          }
        }
      } else {
        await this.dataSource.query(
          `insert into import_errors (codigo, severidade, mensagem, valor_original) values ('FORMATO_PENDENTE','aviso','Leitura XLS antigo permanece pendente; use XLSX ou CSV.',$1)`,
          [file],
        );
      }
    }
    await this.dataSource.query(
      `update import_batches set status='validado', total_arquivos=$2, total_abas=$3, total_linhas=$4, validas=$4, atualizado_em=now() where id=$1`,
      [batch.id, files.length, totalSheets, totalRows],
    );
    return this.getBatch(batch.id);
  }

  async dryRun(batchId: string) {
    await this.getBatch(batchId);
    const rows = await this.dataSource.query(
      `select * from import_rows r join import_sheets s on s.id=r.sheet_id join import_files f on f.id=s.file_id where f.batch_id=$1`,
      [batchId],
    );
    const invalid = rows.filter(
      (row: { conteudo_original: Record<string, unknown> }) =>
        Object.keys(row.conteudo_original ?? {}).length === 0,
    );
    for (const row of invalid) {
      await this.dataSource.query(
        `insert into import_errors (row_id, codigo, severidade, mensagem) values ($1,'LINHA_VAZIA','erro','Linha vazia rejeitada.')`,
        [row.id],
      );
    }
    await this.dataSource.query(
      `update import_batches set status='pronto', rejeitadas=$2, validas=greatest(total_linhas-$2,0) where id=$1`,
      [batchId, invalid.length],
    );
    return {
      batchId,
      status: 'pronto',
      linhas: rows.length,
      rejeitadas: invalid.length,
      importadas: 0,
      realDataImported: false,
    };
  }

  async execute(batchId: string) {
    await this.getBatch(batchId);
    await this.dataSource.query(
      `update import_batches set status='concluido', importadas=0, finalizado_em=now() where id=$1`,
      [batchId],
    );
    return {
      batchId,
      importadas: 0,
      observacao:
        'Framework executado. Importacao de dominio fica pendente dos arquivos/mapeamentos reais.',
    };
  }

  async reconcile(batchId: string) {
    const batch = await this.getBatch(batchId);
    const metricas = {
      linhasLidas: Number(batch.total_linhas ?? 0),
      validas: Number(batch.validas ?? 0),
      rejeitadas: Number(batch.rejeitadas ?? 0),
      importadas: Number(batch.importadas ?? 0),
      duplicadas: Number(batch.duplicadas ?? 0),
      arquivosReaisDisponiveis: Number(batch.total_arquivos ?? 0),
    };
    const [saved] = await this.dataSource.query(
      `insert into import_reconciliation (batch_id, metricas) values ($1,$2) returning *`,
      [batchId, JSON.stringify(metricas)],
    );
    return saved;
  }

  async rollback(batchId: string) {
    await this.getBatch(batchId);
    await this.dataSource.query(`update import_batches set status='revertido' where id=$1`, [
      batchId,
    ]);
    return { batchId, status: 'revertido', registrosRemovidos: 0 };
  }

  async getBatch(id: string) {
    const [batch] = await this.dataSource.query(`select * from import_batches where id=$1`, [id]);
    if (!batch) throw new NotFoundException('Lote de importacao nao encontrado.');
    return batch;
  }

  async listBatches() {
    return this.dataSource.query(`select * from import_batches order by criado_em desc limit 100`);
  }

  private discoverFiles(path: string): string[] {
    const stat = statSync(path);
    if (stat.isFile()) return ALLOWED_EXT.has(extname(path).toLowerCase()) ? [path] : [];
    return readdirSync(path)
      .map((item) => join(path, item))
      .filter((item) => statSync(item).isFile() && ALLOWED_EXT.has(extname(item).toLowerCase()));
  }
}

type ParsedSheet = {
  name: string;
  index: number;
  headers: string[];
  rows: Array<{ line: number; values: Record<string, unknown>; warnings?: string[] }>;
};

function parseCsv(content: string): Omit<ParsedSheet, 'name' | 'index'> {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const headers = (lines.shift() ?? '').split(';').map((item) => item.trim());
  return {
    headers,
    rows: lines.map((line, index) => ({
      line: index + 2,
      values: Object.fromEntries(
        line
          .split(';')
          .map((value, column) => [headers[column] ?? `coluna_${column + 1}`, normalize(value)]),
      ),
    })),
  };
}

function parseXlsx(file: string): ParsedSheet[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(file, { cellDates: true, cellFormula: true });
  } catch (error) {
    throw new BadRequestException(
      `Arquivo XLSX invalido ou protegido: ${error instanceof Error ? error.message : 'falha de leitura'}.`,
    );
  }
  return workbook.SheetNames.map((name, index) => {
    const sheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });
    const headers = (matrix[0] ?? []).map((item, column) =>
      normalizeHeader(item, `coluna_${column + 1}`),
    );
    const rows = matrix
      .slice(1)
      .map((line, rowIndex) => {
        const warnings: string[] = [];
        const values = Object.fromEntries(
          headers.map((header, column) => {
            const address = XLSX.utils.encode_cell({ r: rowIndex + 1, c: column });
            const cell = sheet[address];
            if (cell?.f) {
              warnings.push(
                `Formula em ${address}; usado valor calculado armazenado quando disponivel.`,
              );
            }
            return [header, normalizeCell(line[column])];
          }),
        );
        return { line: rowIndex + 2, values, warnings };
      })
      .filter((row) => Object.values(row.values).some((value) => value !== null && value !== ''));
    return { name, index, headers, rows };
  });
}

function normalizeHeader(value: unknown, fallback: string): string {
  const normalized = normalizeCell(value);
  return typeof normalized === 'string' && normalized ? normalized : fallback;
}

function normalizeCell(value: unknown): string | number | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return normalize(value);
  if (value === null || value === undefined) return null;
  return String(value);
}

function normalize(value: string): string | number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const decimal = trimmed.replace(/\./g, '').replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(decimal)) return Number(decimal);
  return trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function sha(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}
