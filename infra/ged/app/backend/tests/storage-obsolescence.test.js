const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ged-storage-'));
process.env.GED_UPLOAD_DIR = root;
process.env.FILE_BASE_URL = 'https://concrefer.concretrack.com.br/unificado/ged';
const storage = require('../src/services/storageService');

(async () => {
  const original = await storage.uploadFile(Buffer.from('revisao 1'), 'IT-CQC-03_Rev01.doc', 'application/msword', 'VIGENTES');
  const moved = await storage.moveFile(original.id, 'VIGENTES', 'OBSOLETOS');
  assert.equal(moved.id, 'obsoletos/IT-CQC-03_Rev01.doc');
  assert.equal(moved.webViewLink, 'https://concrefer.concretrack.com.br/unificado/ged/uploads/obsoletos/IT-CQC-03_Rev01.doc');
  assert.equal(fs.readFileSync(path.join(root, moved.id), 'utf8'), 'revisao 1');
  assert.equal(fs.existsSync(path.join(root, original.id)), false);
  await assert.rejects(storage.moveFile(original.id, 'VIGENTES', 'OBSOLETOS'), /Arquivo de origem ausente/);
  console.log('storage-obsolescence: ok');
})().finally(() => fs.rmSync(root, { recursive: true, force: true }));
