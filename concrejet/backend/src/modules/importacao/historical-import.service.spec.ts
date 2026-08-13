import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { HistoricalImportService } from './historical-import.service';

describe('HistoricalImportService XLSX', () => {
  const root = join(process.cwd(), 'tmp-import-test');

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('analisa XLSX real com multiplas abas, datas e decimais', async () => {
    mkdirSync(root, { recursive: true });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['data', 'maquina', 'valor_decimal'],
        [new Date('2026-08-01T08:00:00-03:00'), 'INJ-01', '10,50'],
      ]),
      'Producao',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['codigo', 'quantidade'],
        ['LOTE-1', 20.25],
      ]),
      'Lotes',
    );
    XLSX.writeFile(workbook, join(root, 'fixture.xlsx'));

    const savedRows: Array<Record<string, unknown>> = [];
    const dataSource = {
      query: jest.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes('insert into import_batches')) return [{ id: 'batch-1' }];
        if (sql.includes('insert into import_files')) return [{ id: 'file-1' }];
        if (sql.includes('insert into import_sheets')) {
          return [{ id: `sheet-${params[2]}`, nome: params[1], headers: params[3] }];
        }
        if (sql.includes('insert into import_rows')) {
          savedRows.push(JSON.parse(params[2] as string) as Record<string, unknown>);
          return [];
        }
        if (sql.includes('update import_batches')) return [];
        if (sql.includes('select * from import_batches')) {
          return [{ id: 'batch-1', total_arquivos: 1, total_abas: 2, total_linhas: 2, validas: 2 }];
        }
        return [];
      }),
    };

    const result = await new HistoricalImportService(dataSource as never).analyzePath(root);

    expect(result.total_abas).toBe(2);
    expect(result.total_linhas).toBe(2);
    expect(savedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ maquina: 'INJ-01', valor_decimal: 10.5 }),
        expect.objectContaining({ codigo: 'LOTE-1', quantidade: 20.25 }),
      ]),
    );
  });
});
