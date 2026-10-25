// Run inside the isolated destination backend container; never prints JWT or user data.
const assert = require('assert');
const fs = require('fs');
const { query, pool } = require('/app/src/config/database');
const { sign } = require('/app/src/config/jwt');
const { getUserPermissions, canAccessDocument } = require('/app/src/services/rbacService');

const base = 'http://127.0.0.1:4000';
(async () => {
  const relative = 'obsoletos/IT-CQC-03_Rev01.doc';
  const privateUrl = `${base}/uploads/${relative}`;
  const noToken = await fetch(privateUrl);
  assert.equal(noToken.status, 401);

  const { rows: versions } = await query(
    `SELECT d.* FROM versions v JOIN documents d ON d.id=v.document_id WHERE v.drive_file_id=$1`,
    [relative]
  );
  assert.equal(versions.length, 1);
  const { rows: users } = await query('SELECT * FROM users WHERE active=TRUE');
  let user;
  for (const candidate of users) {
    if ((await getUserPermissions(candidate.id)).has('documents.download') && await canAccessDocument(candidate, versions[0])) {
      user = candidate;
      break;
    }
  }
  assert.ok(user, 'Nenhum usuário apto para o ensaio de download');
  const token = sign({ id: user.id, session_version: user.session_version });
  const headers = { Cookie: `ged_download_session=${token}` };
  const allowed = await fetch(privateUrl, { headers });
  assert.equal(allowed.status, 200);
  assert.equal(Buffer.from(await allowed.arrayBuffer()).length, 408064);
  let forbiddenUser;
  for (const candidate of users) {
    if (candidate.id === user.id) continue;
    const canDownload = (await getUserPermissions(candidate.id)).has('documents.download');
    if (candidate.company_id !== user.company_id || !canDownload || !await canAccessDocument(candidate, versions[0])) {
      forbiddenUser = candidate;
      break;
    }
  }
  if (forbiddenUser) {
    const forbiddenToken = sign({ id: forbiddenUser.id, session_version: forbiddenUser.session_version });
    const forbidden = await fetch(privateUrl, { headers: { Cookie: `ged_download_session=${forbiddenToken}` } });
    assert.equal(forbidden.status, 403);
  }
  const denied = await fetch(`${base}/uploads/obsoletos/not-referenced.doc`, { headers });
  assert.equal(denied.status, 403);
  const traversal = await fetch(`${base}/uploads/../server.js`, { headers });
  assert.notEqual(traversal.status, 200);

  const { rows: certs } = await query('SELECT id, file_url, qr_code_url FROM calibration_certificates');
  let publicChecked = 0;
  for (const cert of certs) {
    for (const url of [cert.file_url, cert.qr_code_url]) {
      if (!url) continue;
      const relativeUrl = url.replace(/^\/unificado\/ged/, '');
      if (!fs.existsSync(`/app${relativeUrl}`)) continue;
      const response = await fetch(base + relativeUrl);
      assert.equal(response.status, 200);
      publicChecked++;
    }
    const verify = await fetch(`${base}/api/calibrations/public/${cert.id}`);
    assert.equal(verify.status, 200);
  }
  assert.ok(publicChecked > 0, 'Nenhum arquivo público de calibração disponível');

  const evil = await fetch(privateUrl, { headers: { ...headers, Origin: 'https://evil.example' } });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  const own = await fetch(privateUrl, { headers: { ...headers, Origin: 'https://concrefer.concretrack.com.br' } });
  assert.equal(own.headers.get('access-control-allow-origin'), 'https://concrefer.concretrack.com.br');
  console.log(`downloads: 401/403/200 ok; 403 usuario sem acesso: ${forbiddenUser ? 'testado' : 'sem usuario elegivel'}; calibracoes publicas: ${publicChecked}; CORS ok`);
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => pool.end());
