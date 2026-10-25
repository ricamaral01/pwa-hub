// Run via stdin inside an isolated GED backend container. No URL or secret is printed.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('/app/node_modules/pg');
const { signature } = require('/app/src/controllers/previewController');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
const root = process.env.PREVIEW_PROBE_ORIGIN || 'http://127.0.0.1:4000';
let stage = 'fixture';

async function main() {
  const fixtures = [
    ['docx', `lower(v.file_name) LIKE '%.docx'`],
    ['IT-CQC-03', `d.code='IT-CQC-03' AND v.id=d.current_version_id`],
    ['xls', `lower(v.file_name) LIKE '%.xls'`],
    ['obsolete', `v.drive_file_id LIKE 'obsoletos/%'`],
  ];
  let version;
  for (const [label, condition] of fixtures) {
    stage = `fixture-${label}`;
    const { rows } = await pool.query(
      `SELECT v.id, v.document_id, v.drive_file_id FROM versions v
       JOIN documents d ON d.id=v.document_id WHERE ${condition} ORDER BY v.id LIMIT 1`
    );
    assert.equal(rows.length, 1, `${label} fixture unavailable`);
    const current = rows[0];
    if (!version) version = current;
    const expires = Math.floor(Date.now() / 1000) + 240;
    const mac = signature(current.document_id, current.id, current.drive_file_id, expires);
    stage = `signed-${label}`;
    const response = await fetch(`${root}/previews/${current.id}/${expires}/${mac}`);
    assert.equal(response.status, 200, `${label} preview status=${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    const local = fs.readFileSync(path.join('/app/uploads', current.drive_file_id));
    stage = `exact-${label}`;
    assert.equal(crypto.createHash('sha256').update(body).digest('hex'),
      crypto.createHash('sha256').update(local).digest('hex'), `${label} exact version`);
  }

  const expires = Math.floor(Date.now() / 1000) + 240;
  const expiredAt = Math.floor(Date.now() / 1000) - 1;
  const expiredMac = signature(version.document_id, version.id, version.drive_file_id, expiredAt);
  stage = 'expired';
  assert.equal((await fetch(`${root}/previews/${version.id}/${expiredAt}/${expiredMac}`)).status, 403);
  stage = 'tampered';
  assert.equal((await fetch(`${root}/previews/${version.id}/${expires}/${'0'.repeat(64)}`)).status, 403);
  stage = 'ordinary-anonymous';
  assert.equal((await fetch(`${root}/uploads/${version.drive_file_id}`)).status, 401);
  stage = 'issue-anonymous';
  assert.equal((await fetch(`${root}/api/documents/${version.document_id}/versions/${version.id}/preview-link`)).status, 401);
  process.stdout.write('office-docx,IT-CQC-03,xls,obsolete=200 exact-file; expired=403; tampered=403; ordinary-anonymous=401; issue-anonymous=401\n');
}

main().catch((error) => {
  const detail = error.name === 'AssertionError' ? `; detail=${error.message}` : '';
  process.stderr.write(`preview-probe-failed; stage=${stage}; type=${error.name}${detail}\n`);
  process.exitCode = 1;
}).finally(async () => pool.end());
