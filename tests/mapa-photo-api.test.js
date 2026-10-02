'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('../mapa-concretagem/node_modules/sharp');

test('foto da inspeção é enviada, listada, aberta e excluída', async () => {
  const prefix = path.join(os.tmpdir(), 'mapa-photo-api-');
  const storageDir = await fs.mkdtemp(prefix);
  process.env.PHOTO_STORAGE_DIR = storageDir;
  const app = require('../mapa-concretagem/server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const image = await sharp({ create: { width: 3, height: 3, channels: 3, background: '#ff0000' } })
      .png().toBuffer();
    const form = new FormData();
    form.append('foto', new Blob([image], { type: 'image/png' }), 'inspecao.png');
    form.append('usuario', 'teste');
    const upload = await fetch(`${base}/api/inspecoes/poste-123/fotos`, {
      method: 'POST',
      headers: { Origin: 'https://usina.concretrack.com.br' },
      body: form
    });
    assert.equal(upload.status, 201);
    assert.equal(upload.headers.get('access-control-allow-origin'), 'https://usina.concretrack.com.br');
    const { data } = await upload.json();
    assert.match(data.url, /^\/api\/fotos\/[a-f0-9-]+\/arquivo$/);

    const list = await fetch(`${base}/api/inspecoes/poste-123/fotos`);
    assert.equal((await list.json()).data.length, 1);
    const photo = await fetch(base + data.url);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get('content-type'), 'image/jpeg');
    assert.ok((await photo.arrayBuffer()).byteLength > 0);

    const removed = await fetch(`${base}/api/fotos/${data.id}`, { method: 'DELETE' });
    assert.equal(removed.status, 200);
    assert.equal((await (await fetch(base + data.url)).json()).error, 'Foto não encontrada.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    assert.ok(storageDir.startsWith(prefix));
    await fs.rm(storageDir, { recursive: true, force: true });
  }
});
