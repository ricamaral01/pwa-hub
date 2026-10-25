const assert = require('assert');

let captured;
const databasePath = require.resolve('../src/config/database');
require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true,
  exports: { query: async (sql, args) => { captured = { sql, args }; } } };

const { audit } = require('../src/services/auditService');

(async () => {
  const req = { user: { id: 'synthetic-user', company_id: 'synthetic-company' }, ip: '127.0.0.1',
    headers: { authorization: 'Bearer SECRET_HEADER' }, body: { password: 'SECRET_BODY' } };
  await audit({ req, action: 'documents.pdf_stamp_fallback', entityType: 'version',
    entityId: 'synthetic-version', after: { processing_warning: 'Carimbo não aplicado.' } });
  assert(captured.sql.includes('INSERT INTO audit_logs'));
  assert.strictEqual(captured.args[2], 'documents.pdf_stamp_fallback');
  assert.strictEqual(captured.args[4], 'synthetic-version');
  assert.strictEqual(JSON.parse(captured.args[7]).processing_warning, 'Carimbo não aplicado.');
  const serialized = JSON.stringify(captured);
  assert(!serialized.includes('SECRET_HEADER') && !serialized.includes('SECRET_BODY'));
  console.log('PDF fallback audit payload excludes request headers and body');
})().catch((error) => { console.error(error); process.exitCode = 1; });
