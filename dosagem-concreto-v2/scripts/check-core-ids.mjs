import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const json = path => JSON.parse(read(path));
const expected = ['P1', 'P1b', 'P2', 'P3', 'P3b', 'P5', 'P6', 'P7',
  'A1', 'A2', 'A3', 'I1', 'O1', 'N1', 'R1', 'C40-conferencia'];
const principal = json('shared/golden/principal-4.1.json');
const adjustment = json('shared/golden/adjustment-4.1.json');
const ids = new Set([...principal.cases.map(item => item.id), ...adjustment.cases.map(item => item.id),
  'P2', 'P6', 'A1', 'A2', 'A3', 'I1', 'O1', 'N1', 'R1', 'C40-conferencia']);
const python = read('api/tests/core/test_core_cases.py');
const ts = ['principal41', 'adjustment41', 'alternative41', 'curves41', 'moisture41', 'rules41', 'c40', 'parity41']
  .map(name => read(`tests/golden/${name}.test.ts`)).join('\n');
const dynamic = new Set(['P1', 'P1b', 'P3', 'P3b', 'P5', 'P7']);
const missing = expected.filter(id => !ids.has(id) || !python.includes(`"${id}"`) ||
  !(dynamic.has(id) ? (id.startsWith('P3') ? read('tests/golden/adjustment41.test.ts') : read('tests/golden/principal41.test.ts')).includes('testCase.id')
    : ts.includes(id === 'C40-conferencia' ? 'C40' : id)));
for (const id of missing) process.stderr.write(`Missing core ID in golden fixture or TS/Python test: ${id}\n`);
if (!ts.includes('200 valid random mixes') || !python.includes('test_volume_property_200') ||
    !ts.includes('paridade direta TS × Python')) {
  process.stderr.write('Property or parity test missing\n');
  process.exitCode = 1;
}
if (missing.length) process.exitCode = 1;
if (!process.exitCode) process.stdout.write(`Core IDs verified in TS and Python: ${expected.join(', ')}\n`);
