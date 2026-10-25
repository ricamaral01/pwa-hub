// Read-only check of Office embed response for a signed GED file. Never prints URLs.
const { Pool } = require('/app/node_modules/pg');
const { signature } = require('/app/src/controllers/previewController');
const pool = new Pool({ connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });

async function main() {
  const { rows } = await pool.query(
    `SELECT v.id,v.document_id,v.drive_file_id FROM versions v JOIN documents d ON d.id=v.document_id
     WHERE d.code='IT-CQC-03' AND v.id=d.current_version_id LIMIT 1`
  );
  if (rows.length !== 1) throw new Error('FixtureUnavailable');
  const v = rows[0];
  const expires = Math.floor(Date.now() / 1000) + 240;
  const mac = signature(v.document_id, v.id, v.drive_file_id, expires);
  const src = `https://concrefer.concretrack.com.br/unificado/ged/previews/${v.id}/${expires}/${mac}`;
  const viewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`;
  const response = await fetch(viewer, { signal: AbortSignal.timeout(15000) });
  const html = await response.text();
  const failed = /we can't open|não conseguimos abrir|ocorreu um erro|something went wrong/i.test(html);
  process.stdout.write(`office-embed-http=${response.status}; immediate-error=${failed}; html-bytes=${html.length}\n`);
  if (response.status !== 200 || failed) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`office-viewer-probe-failed; type=${error.name}\n`);
  process.exitCode = 1;
}).finally(async () => pool.end());
