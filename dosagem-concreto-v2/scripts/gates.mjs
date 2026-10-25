import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const perfil = process.argv.slice(2);
if (perfil.length && (perfil.length !== 2 || perfil[0] !== '--perfil' || perfil[1] !== 'piloto')) {
  process.stderr.write('Uso: npm run gates [-- --perfil piloto]\n');
  process.exit(2);
}
const piloto = perfil.length === 2;
const output = resolve(root, `../docs/dosagem-v2/${piloto ? 'GATES-PILOTO' : 'GATES'}.json`);
const gateIds = piloto ? ['P-F1', 'P-F2', 'P-F3', 'P-F4'] : ['F1', 'F2', 'F3', 'F4'];
const result = {
  release: 1,
  ...(piloto ? { perfil: 'piloto' } : {}),
  startedAt: new Date().toISOString(),
  finishedAt: null,
  gates: Object.fromEntries(gateIds.map(id => [id, { green: false, commands: [] }])),
};

function persist() {
  mkdirSync(resolve(root, '../docs/dosagem-v2'), { recursive: true });
  const tmp = `${output}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(result, null, 2)}\n`);
  renameSync(tmp, output);
}

function count(outputText) {
  const matches = [...outputText.matchAll(/(?:Tests?\s+|\b)(\d+)\s+passed\b|\b(\d+)\s+passed\b/gim)];
  return matches.length ? Number(matches.at(-1)[1] || matches.at(-1)[2]) : null;
}

function run(gate, command, { minTests = 0, env = {}, retries = 0 } = {}) {
  process.stdout.write(`\n[${gate}] ${command}\n`);
  const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh';
  const shellArgs = process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-c', command];
  const options = { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, PYTHONPATH: 'api', PYTHONIOENCODING: 'utf-8',
      DATABASE_URL: 'postgresql+psycopg://localhost/dosagem_gate_offline',
      COMPOSE_PROJECT_NAME: 'dosagem-v2-hml', ...env } };
  let execution;
  let attempts = 0;
  do {
    attempts++;
    execution = command.endsWith('.sh')
      ? spawnSync(process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash', [command], options)
      : spawnSync(shell, shellArgs, options);
    if (execution.status !== 0 && attempts <= retries) {
      process.stderr.write(`[${gate}] tentativa ${attempts} falhou; repetindo ${command}\n`);
    }
  } while (execution.status !== 0 && attempts <= retries);
  const stdout = execution.stdout || '';
  const stderr = execution.stderr || '';
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  const tests = count(`${stdout}\n${stderr}`);
  const exitCode = execution.status ?? -1;
  const passed = exitCode === 0 && (minTests === 0 || (tests !== null && tests >= minTests));
  result.gates[gate].commands.push({ command, exitCode, attempts, tests, minTests, passed, at: new Date().toISOString(),
    error: execution.error?.message || (minTests && tests !== null && tests < minTests ? `Expected at least ${minTests} passing tests` : null) });
  result.gates[gate].green = result.gates[gate].commands.every(item => item.passed);
  persist();
  return passed;
}

function seedSmokeUsers(gate, compose) {
  for (const project of ['desktop', 'tablet-retrato', 'tablet-paisagem', 'celular']) {
    run(gate, `${compose} exec -T -e HML_TEST_EMAIL=smoke-${project}@example.test -e HML_TEST_PASSWORD=Hml-Test-2026! -e HML_TEST_INITIAL=1 api python -m app.hml_seed`);
  }
}

function seedRelease1Users(gate, compose) {
  for (const project of ['desktop', 'tablet-retrato', 'tablet-paisagem', 'celular']) {
    run(gate, `${compose} exec -T -e HML_TEST_EMAIL=r1-local-${project}@example.test -e HML_TEST_PASSWORD=Hml-Test-2026! -e HML_TEST_INITIAL=1 api python -m app.hml_seed`);
  }
  run(gate, `${compose} exec -T -e HML_TEST_EMAIL=r1-hub@example.test -e HML_TEST_PASSWORD=Hml-Test-2026! api python -m app.hml_seed`);
}

persist();
const f1 = piloto ? 'P-F1' : 'F1';
const f2 = piloto ? 'P-F2' : 'F2';
const f3 = piloto ? 'P-F3' : 'F3';
const f4 = piloto ? 'P-F4' : 'F4';
run(f1, 'npm run test:core', { minTests: 25 });
run(f1, 'python -m pytest api/tests/core -q', { minTests: 17 });
run(f1, 'node scripts/check-core-ids.mjs');
run(f2, 'python -m pytest api/tests -q', { minTests: 30 });
run(f2, 'npx vitest run tests/unit/release1-import.test.ts', { minTests: 3 });
run(f2, 'cd api && python -m alembic upgrade head --sql | python ../deploy/scripts/verificar-migracoes.py');
run(f2, 'node scripts/release1-audit.mjs F2');
run(f3, 'npm run build');
const compose = 'docker compose -f docker-compose.hml.yml';
run(f3, `${compose} up -d --build --wait`, { retries: 2 });
run(f3, `${compose} exec -T -e HML_TEST_PASSWORD=Hml-Test-2026! api python -m app.hml_seed`);
if (!piloto) seedRelease1Users(f3, compose);
if (piloto) {
  seedSmokeUsers(f3, compose);
  run(f3, 'npx playwright test --config=playwright.pilot.config.ts', { minTests: 20 });
} else {
  run(f3, 'npx playwright test --project=desktop --project=tablet-retrato --project=tablet-paisagem --project=celular',
    { minTests: 56, env: { E2E_HML: '1' } });
  run(f3, 'node scripts/release1-audit.mjs F3');
}

try {
  run(f4, `${compose} up -d --build`, { retries: 2 });
  run(f4, `${compose} up -d --wait`, { retries: 2 });
  run(f4, `${compose} exec -T -e HML_TEST_PASSWORD=Hml-Test-2026! api python -m app.hml_seed`);
  if (!piloto) seedRelease1Users(f4, compose);
  if (piloto) seedSmokeUsers(f4, compose);
  run(f4, `npx playwright test --config=${piloto ? 'playwright.pilot.config.ts' : 'playwright.hml.config.ts'}`, { minTests: piloto ? 20 : 56 });
  if (!piloto) run(f4, 'node scripts/release1-audit.mjs F4');
  run(f4, 'scripts/teste-backup-restauracao.sh');
  run(f4, 'scripts/teste-compat-n-1.sh', { minTests: 1 });
} finally {
  run(f4, `${compose} down`);
}

result.finishedAt = new Date().toISOString();
persist();
const failed = Object.entries(result.gates).filter(([, gate]) => !gate.green).map(([id]) => id);
process.stdout.write(`\nGATES: ${failed.length ? `red ${failed.join(', ')}` : 'all green'}\n`);
process.exitCode = failed.length ? 1 : 0;
