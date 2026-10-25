import type { PreviaLegado, RegistroLegado } from './legacyConverter';

type Cell = { v?: unknown };
type Sheet = Record<string, Cell>;
type Book = { SheetNames: string[]; Sheets: Record<string, Sheet> };

const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value: unknown): string => String(value ?? '').trim();
const read = (sheet: Sheet, address: string) => sheet[address]?.v;
const now = () => new Date().toISOString();

function record(origin: string, sheetName: string, unit: string, kind: string, data: Record<string, unknown>): RegistroLegado {
  return {
    tipo: 'ensaios', origem: origin, id_antigo: sheetName,
    documento: {
      id: crypto.randomUUID(), unidade: unit, nome: sheetName, tipo: kind,
      data: now(), status: 'conferencia', dados: data,
      auditoria: { criadoPor: 'importacao', criadoEm: now(), alteradoPor: 'importacao', alteradoEm: now() },
    },
  };
}

export function converterPlanilhaRelease1(book: Book, fileName: string, unit: string): PreviaLegado {
  const result: PreviaLegado = { lidos: 0, convertidos: [], avisos: [] };
  const lower = fileName.toLowerCase();
  const isRica = lower.includes('rica');
  const isUdemy = lower.includes('udemy') && !lower.includes('curva');
  const isAbrams = lower.includes('curva') && lower.includes('abrams');
  if (!isRica && !isUdemy && !isAbrams) throw new Error('Planilha fora dos três formatos da Release 1.');
  for (const name of book.SheetNames) {
    const sheet = book.Sheets[name];
    if (!sheet) continue;
    if (isRica) {
      if (number(read(sheet, 'C15')) === null || number(read(sheet, 'X15')) === null) continue;
      result.lidos++;
      const columns = [
        ['C', 'cimento'], ['F', 'adicao'], ['H', 'areia'], ['K', 'areia'],
        ['N', 'areia'], ['P', 'areia'], ['R', 'brita'], ['V', 'brita'],
        ['X', 'agua'], ['Y', 'aditivo'], ['Z', 'aditivo'],
      ] as const;
      const items: { nome: string; categoria: string; massaKgM3: number; massaEspecificaKgDm3: number; fornecedor: string; observacao: string }[] = [];
      let invalid = false;
      for (const [col, category] of columns) {
        const mass = number(read(sheet, `${col}15`));
        const density = number(read(sheet, `${col}14`));
        if (mass === null || mass <= 0) continue;
        if (density === null || density <= 0) {
          result.avisos.push(`${name}: densidade ausente para ${col}; aba não importada.`);
          invalid = true;
          break;
        }
        items.push({ nome: text(read(sheet, `${col}11`)) || col, categoria: category,
          massaKgM3: mass, massaEspecificaKgDm3: density,
          fornecedor: text(read(sheet, `${col}12`)), observacao: text(read(sheet, `${col}13`)) });
      }
      if (invalid) continue;
      const air = number(read(sheet, 'X9')) ?? 0;
      const volumeL = items.reduce((sum, item) => sum + Number(item.massaKgM3) / Number(item.massaEspecificaKgDm3), air * 1000);
      if (Math.abs(volumeL - 1000) > 0.01) result.avisos.push(`${name}: volume físico ${volumeL.toFixed(2)} L; conferir antes de usar em engenharia.`);
      result.convertidos.push(record('rica-v4', name, unit, 'conferencia_traco', {
        itens: items, arIncorporadoPct: air * 100, volumeCalculadoL: volumeL,
        relacaoAguaCimentoPlanilha: number(read(sheet, 'D7')),
        statusEngenharia: 'conferencia_sem_aprovacao',
      }));
    } else if (isUdemy && name.trim() === 'Dosagem') {
      result.lidos++;
      const fck = number(read(sheet, 'E9'));
      const water = number(read(sheet, 'I9'));
      const cement = number(read(sheet, 'J9'));
      if (fck === null || water === null || cement === null || cement <= 0) {
        result.avisos.push(`${name}: parâmetros fck, água ou cimento ausentes.`);
        continue;
      }
      result.convertidos.push(record('udemy-dosagem', name, unit, 'referencia_dosagem', {
        fckMPa: fck, aguaL: water, cimentoKg: cement,
        relacaoAguaCimento: water / cement, teorArgamassa: number(read(sheet, 'L9')),
        arIncorporado: number(read(sheet, 'M9')),
        materiais: [13, 15, 16, 18, 19].map(row => ({
          nome: text(read(sheet, `F${row}`)), massaEspecificaKgDm3: number(read(sheet, `I${row}`)),
        })),
      }));
    } else if (isAbrams && name.toLowerCase().includes('curva de abrams')) {
      result.lidos++;
      const points = [];
      for (let row = 5; row <= 20; row++) {
        const ac = number(read(sheet, `D${row}`));
        const strength = number(read(sheet, `F${row}`));
        const water = number(read(sheet, `E${row}`));
        if (ac !== null && strength !== null && ac > 0 && strength > 0) points.push({ ac, resistencia28MPa: strength, aguaL: water });
      }
      if (points.length < 3) {
        result.avisos.push(`${name}: menos de três pares a/c × R28; guardar apenas como referência.`);
      }
      result.convertidos.push(record('curva-abrams-udemy', name, unit, 'curva_abrams_referencia', { pontos: points }));
    }
  }
  if (!result.lidos) result.avisos.push(`${fileName}: nenhuma aba reconhecida para conferência.`);
  return result;
}

export async function converterArquivoRelease1(file: File, unit: string): Promise<PreviaLegado> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Escolha uma planilha .xlsx da Release 1.');
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
  return converterPlanilhaRelease1(book, file.name, unit);
}
