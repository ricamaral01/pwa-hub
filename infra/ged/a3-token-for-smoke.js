// Invoked only by a local test runner. Its stdout is captured in memory, not logged.
const { query, pool } = require('/app/src/config/database');
const { getUserPermissions, canAccessDocument } = require('/app/src/services/rbacService');
const { sign } = require('/app/src/config/jwt');

(async () => {
  const { rows: docs } = await query(
    `SELECT d.* FROM versions v JOIN documents d ON d.id=v.document_id WHERE v.drive_file_id=$1`,
    ['obsoletos/IT-CQC-03_Rev01.doc']
  );
  const { rows: users } = await query('SELECT * FROM users WHERE active=TRUE');
  for (const user of users) {
    if ((await getUserPermissions(user.id)).has('documents.download') && await canAccessDocument(user, docs[0])) {
      process.stdout.write(sign({ id: user.id, session_version: user.session_version }));
      return;
    }
  }
  throw new Error('Sem usuário para o smoke');
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => pool.end());
