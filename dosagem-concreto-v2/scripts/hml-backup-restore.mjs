import { spawnSync } from 'node:child_process';

const compose = ['compose', '-p', 'dosagem-v2-hml', '-f', 'docker-compose.hml.yml', 'exec', '-T', 'postgres'];
const db = 'concretrack_dosagem_hml';
const user = 'dosagem_hml';
const temporary = `dosagem_restore_${process.pid}`;

function docker(args, input) {
  const result = spawnSync('docker', [...compose, ...args], { input, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`docker ${args.join(' ')} failed (${result.status}): ${String(result.stderr)}`);
  }
  return result.stdout;
}

const describe = name => String(docker(['psql', '-U', user, '-d', name, '-At', '-c',
  "SELECT (SELECT version_num FROM alembic_version) || ':' || (SELECT count(*) FROM information_schema.tables WHERE table_schema='public')"])).trim();

let created = false;
try {
  const source = describe(db);
  const archive = docker(['pg_dump', '-U', user, '-Fc', '--no-owner', db]);
  if (archive.length === 0) throw new Error('Empty PostgreSQL archive');
  docker(['createdb', '-U', user, temporary]);
  created = true;
  docker(['pg_restore', '-U', user, '-d', temporary, '--no-owner', '--exit-on-error'], archive);
  const restored = describe(temporary);
  if (source !== restored) throw new Error(`Restore mismatch: ${source} != ${restored}`);
  process.stdout.write(`PostgreSQL restore passed: ${source}, ${archive.length} bytes\n`);
} finally {
  if (created) docker(['dropdb', '-U', user, '--if-exists', '--force', temporary]);
}
