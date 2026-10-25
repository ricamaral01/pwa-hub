import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const phase = process.argv[2];
const issues = [];

function files(dir, suffixes) {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? files(path, suffixes) : suffixes.some(suffix => path.endsWith(suffix)) ? [path] : [];
  });
}

const testFiles = [...files('tests', ['.ts', '.tsx']), ...files('api/tests', ['.py'])];
for (const path of testFiles) {
  const contents = readFileSync(resolve(root, path), 'utf8');
  if (/\b(?:test|it|describe)\.(?:skip|only)\s*\(|\bpytest\.mark\.(?:skip|xfail)\b/.test(contents)) {
    issues.push(`${path}: skip/only/xfail is forbidden`);
  }
}

const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh';
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npx playwright test --config=playwright.hml.config.ts --list']
  : ['-c', 'npx playwright test --config=playwright.hml.config.ts --list'];
const listed = spawnSync(shell, args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
if (listed.status !== 0) issues.push(`Playwright list failed: ${listed.stderr}`);
const list = listed.stdout || '';
const projects = ['desktop', 'tablet-retrato', 'tablet-paisagem', 'celular'];
const requireFlow = tag => {
  const missing = projects.filter(project => !list.split('\n').some(line => line.includes(`[${project}]`) && line.includes(tag)));
  if (missing.length) issues.push(`${tag} missing for ${missing.join(', ')}`);
};

if (phase === 'F2') {
  const tests = files('api/tests', ['.py']).map(path => readFileSync(resolve(root, path), 'utf8')).join('\n');
  for (const tag of ['R1-IMPORT-RICA', 'R1-S1-DECISAO', 'R1-CAA', 'R1-PRODUCAO', 'R1-DESFORMA']) {
    if (!tests.includes(tag)) issues.push(`${tag} API test missing`);
  }
} else if (phase === 'F3' || phase === 'F4') {
  for (let n = 1; n <= 14; n++) requireFlow(`R1-${String(n).padStart(2, '0')}:`);
} else {
  issues.push(`Unknown phase: ${phase}`);
}

if (issues.length) {
  for (const issue of issues) process.stderr.write(`${issue}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${phase} Release 1 coverage: verified\n`);
}
