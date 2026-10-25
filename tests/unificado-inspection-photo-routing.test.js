'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('foto da inspeção chega à API unificada com a tela autorizadora', async () => {
  const calls = [];
  const context = {
    URL, URLSearchParams, Headers, Request,
    location: { href: 'https://concrefer.concretrack.com.br/unificado/mapa/operacao/?tela=INSPECAO' },
    state: { mode: 'INSPECAO' },
    window: {
      fetch: async (url, options) => {
        calls.push({ url, options });
        return { ok: true };
      }
    },
    document: {
      head: { append: () => {} },
      createElement: () => ({}),
      addEventListener: () => {}
    }
  };
  const root = path.join(__dirname, '..', 'unificado', 'mapa', 'operacao');
  vm.runInNewContext(fs.readFileSync(path.join(root, 'bridge.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'screen-context.js'), 'utf8'), context);

  await context.window.fetch('https://dautomacao.com/api/inspecoes/poste-123/fotos', {
    method: 'POST', body: 'photo'
  });
  assert.equal(calls[0].url, '/unificado/mapa/api/inspecoes/poste-123/fotos');
  assert.equal(calls[0].options.headers.get('X-Unificado-Screen'), 'INSPECAO');

  await context.window.fetch('https://dautomacao.com/api/inspecoes/poste-123/fotos');
  assert.equal(calls[1].options.headers.get('X-Unificado-Screen'), 'INSPECAO');
});
