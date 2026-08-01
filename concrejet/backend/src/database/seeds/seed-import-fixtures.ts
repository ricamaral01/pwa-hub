import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

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
// eslint-disable-next-line no-console
console.log(`Fixture sintetica criada em ${root}`);
