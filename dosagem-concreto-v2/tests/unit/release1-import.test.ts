import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { converterPlanilhaRelease1 } from '../../src/data/release1Importer';

const reference = resolve(import.meta.dirname, '../../../docs/dosagem-v2/referencia');
function workbook(file: string) {
  const bytes = readFileSync(resolve(reference, file));
  return XLSX.read(bytes, { type: 'buffer' });
}

describe('Release 1 spreadsheet import', () => {
  it('reads the four requested Rica tabs and warns on physical volume', () => {
    const book = workbook('Dosagem_Concreto_Rica_v4.xlsx');
    const tabs = ['R10 (2)', 'FILLER V2', 'MARCOS', 'TESTE AGREGADO V2'];
    const part = converterPlanilhaRelease1({ SheetNames: tabs, Sheets: book.Sheets }, 'Dosagem_Concreto_Rica_v4.xlsx', 'campinas');
    expect(part.lidos).toBe(4);
    expect(part.convertidos).toHaveLength(4);
    for (const item of part.convertidos) {
      expect(item.tipo).toBe('ensaios');
      expect(item.origem).toBe('rica-v4');
      expect(item.documento.tipo).toBe('conferencia_traco');
      expect((item.documento.dados as { volumeCalculadoL: number }).volumeCalculadoL).toBeGreaterThan(0);
    }
    expect(part.avisos.some(warning => warning.includes('FILLER V2') && warning.includes('volume físico'))).toBe(true);
  });

  it('reads the Udemy reference without inventing materials or approval', () => {
    const book = workbook('1.Dosagem-Udemy.xlsx');
    const part = converterPlanilhaRelease1(book, '1.Dosagem-Udemy.xlsx', 'campinas');
    const item = part.convertidos.find(value => value.origem === 'udemy-dosagem');
    expect(item).toBeDefined();
    const data = item!.documento.dados as { fckMPa: number; aguaL: number; cimentoKg: number };
    expect(data).toMatchObject({ fckMPa: 30, aguaL: 189, cimentoKg: 321 });
    expect(item!.documento.status).toBe('conferencia');
  });

  it('reads five measured Abrams points and excludes the incomplete second curve', () => {
    const book = workbook('RECURSOS-CURVADEABRAMS-UDEMY.xlsx');
    const part = converterPlanilhaRelease1(book, 'RECURSOS-CURVADEABRAMS-UDEMY.xlsx', 'campinas');
    const first = part.convertidos.find(value => value.id_antigo === 'Curva de abrams 1');
    const second = part.convertidos.find(value => value.id_antigo === 'Curva de abrams 2');
    expect((first!.documento.dados as { pontos: unknown[] }).pontos).toHaveLength(5);
    expect((second!.documento.dados as { pontos: unknown[] }).pontos).toHaveLength(0);
    expect(part.avisos.some(warning => warning.includes('Curva de abrams 2'))).toBe(true);
  });
});
