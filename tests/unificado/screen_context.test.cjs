const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const calls = [];
const sandbox = { URL, URLSearchParams, Request, Headers,
  location: { href: 'https://test.local/unificado/mapa/operacao/', search: '' },
  state: {mode: 'HUB'},
  window: { fetch: (url, options) => calls.push({url, options}) }
};
vm.runInNewContext(fs.readFileSync('unificado/mapa/operacao/screen-context.js', 'utf8'), sandbox);
sandbox.window.fetch('/unificado/mapa/api/operations/programmed-forms', {headers: {'X-Unificado-Screen': 'LIBERACAO_S3'}});
assert.equal(calls.at(-1).options.headers.get('X-Unificado-Screen'), 'LIBERACAO_S3');
sandbox.state.mode = 'INSPECAO';
sandbox.window.fetch('/unificado/mapa/api/rest/v1/producao');
assert.equal(calls.at(-1).options.headers.get('X-Unificado-Screen'), 'INSPECAO');
sandbox.window.fetch('/unificado/mapa/api/unified/screen-access/me');
assert.equal(calls.at(-1).options.headers, undefined);
console.log('Screen context: sector initialization, active screen and IAM lookup passed.');
