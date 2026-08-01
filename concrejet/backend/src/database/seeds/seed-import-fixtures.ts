import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import * as XLSX from 'xlsx';

const root = resolve(process.cwd(), '..', 'imports', 'historico', 'exemplos');
mkdirSync(root, { recursive: true });
writeFileSync(
  join(root, 'apontamentos-exemplo.csv'),
  [
    'data;maquina;operador;item;molde;pecas_boas;refugo;borra_kg',
    '2026-08-01;INJ-01;OP001;ITEM-001;MOLDE-001;100;2;0,500',
    '2026-08-01;INJ-01;OP001;ITEM-001;MOLDE-001;80;1;0,250',
  ].join('\n'),
);
const umaAba = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  umaAba,
  XLSX.utils.aoa_to_sheet([
    ['data', 'maquina', 'operador', 'pecas_boas', 'refugo', 'borra_kg'],
    [new Date('2026-08-01T08:00:00-03:00'), 'INJ-01', 'OP001', 100, 2, 0.5],
    [new Date('2026-08-01T09:00:00-03:00'), 'INJ-01', 'OP001', 100, 2, 0.5],
    [null, null, null, null, null, null],
  ]),
  'Apontamentos',
);
XLSX.writeFile(umaAba, join(root, 'apontamentos-uma-aba.xlsx'));

const multiAba = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  multiAba,
  XLSX.utils.aoa_to_sheet([
    ['data_producao', 'maq', 'operador', 'valor_decimal'],
    [new Date('2026-08-02T08:00:00-03:00'), 'INJ-01', 'OP001', '10,75'],
    ['linha-invalida', '', '', 'abc'],
  ]),
  'Producao',
);
XLSX.utils.book_append_sheet(
  multiAba,
  XLSX.utils.aoa_to_sheet([
    ['codigo', 'descricao', 'quantidade'],
    ['LOTE-XLSX-01', 'Lote fixture', 123.45],
  ]),
  'Lotes',
);
XLSX.writeFile(multiAba, join(root, 'historico-multiplas-abas.xlsx'));
// eslint-disable-next-line no-console
console.log(`Fixture sintetica criada em ${root}`);
