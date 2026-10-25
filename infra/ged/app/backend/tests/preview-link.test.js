const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'src/config/database.js');
const rbacPath = path.join(root, 'src/services/rbacService.js');
let allowed = true;
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true,
  exports: { query: async () => ({ rows: [{
    id: '11111111-1111-4111-8111-111111111111',
    preview_version_id: '22222222-2222-4222-8222-222222222222',
    preview_file_id: 'vigentes/teste.doc', preview_file_name: 'teste.doc',
  }] }) } };
require.cache[rbacPath] = { id: rbacPath, filename: rbacPath, loaded: true,
  exports: { canAccessDocument: async () => allowed } };

const { issuePreviewLink } = require('../src/controllers/previewController');
process.env.JWT_SECRET = 'synthetic-preview-test-key';
process.env.CORS_ORIGIN = 'https://concrefer.concretrack.com.br';

function response() {
  return { code: 200, body: null,
    status(code) { this.code = code; return this; },
    set() { return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

const req = { params: {
  id: '11111111-1111-4111-8111-111111111111',
  versionId: '22222222-2222-4222-8222-222222222222',
}, user: { id: '33333333-3333-4333-8333-333333333333', company_id: '44444444-4444-4444-8444-444444444444' } };

test('authorized document reader receives only a short-lived version URL', async () => {
  allowed = true;
  const res = response();
  await issuePreviewLink(req, res);
  assert.equal(res.code, 200);
  assert.match(res.body.url, /^https:\/\/concrefer\.concretrack\.com\.br\/unificado\/ged\/previews\/2222/);
  assert.equal(new URL(res.body.url).search, '');
  const ttl = (Date.parse(res.body.expires_at) - Date.now()) / 1000;
  assert.ok(ttl > 0 && ttl <= 300);
});

test('reader without document access receives no link', async () => {
  allowed = false;
  const res = response();
  await issuePreviewLink(req, res);
  assert.equal(res.code, 403);
  assert.equal(res.body, null);
});
