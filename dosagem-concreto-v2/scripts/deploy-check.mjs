import { execFileSync } from 'node:child_process';
const changed = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: '..', encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const allowed = /^(dosagem-concreto-v2\/|dosagem-concreto\/v2\/|docs\/dosagem-v2\/|sw\.js$)/;
const outside = changed.map(line => line.slice(3).replaceAll('\\', '/')).filter(path => !allowed.test(path));
if (outside.length) { console.error(`${outside.length} arquivos fora do escopo já alterados nesta árvore. Primeiros 20: ${outside.slice(0, 20).join(', ')}`); process.exitCode = 1; }
else console.log('Alterações dentro do escopo v2.');
