const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const database = require('../src/core/database');
const { config } = require('../src/core/config');
const { cache } = require('../src/services/controle_estatistico_service');
const { createApp } = require('../src/app');

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

async function withServer(fn) {
  const originalQuery = database.query;
  const originalFetch = global.fetch;
  const originalFallback = config.googleSheets.fallbackEnabled;
  const originalSheetsUrl = config.googleSheets.apiUrl;
  const originalCache = config.api.cacheEnabled;
  const app = createApp();
  const ctx = await listen(app);
  cache.clear();
  try {
    await fn(ctx);
  } finally {
    database.query = originalQuery;
    global.fetch = originalFetch;
    config.googleSheets.fallbackEnabled = originalFallback;
    config.googleSheets.apiUrl = originalSheetsUrl;
    config.api.cacheEnabled = originalCache;
    cache.clear();
    await new Promise((resolve) => ctx.server.close(resolve));
  }
}

test('retorna contrato padronizado quando banco esta disponivel', async () => {
  await withServer(async ({ baseUrl }) => {
    config.api.cacheEnabled = false;
    database.query = async () => ({
      rows: [{
        data_moldagem: '2026-07-07',
        data_ruptura: '2026-07-08',
        traco_id: '29689',
        idade_dias: 1,
        cp: '1',
        mpa: '18.50',
      }],
    });

    const res = await fetch(`${baseUrl}/api/controle-estatistico/rompimentos-grupos?limit=10&ano=2026&mes=07`);
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.source, 'database');
    assert.equal(json.count, 1);
    assert.equal(json.rows[0].data_moldagem, '2026-07-07');
    assert.equal(json.rows[0].cp, 1);
    assert.equal(json.pagination.has_more, false);
  });
});

test('rejeita parametros invalidos', async () => {
  await withServer(async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/controle-estatistico/rompimentos-grupos?mes=99`);
    const json = await res.json();

    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_PARAMETER');
  });
});

test('rejeita limit acima do maximo configurado', async () => {
  await withServer(async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/controle-estatistico/rompimentos-grupos?limit=999999`);
    const json = await res.json();

    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_PARAMETER');
  });
});

test('retorna 503 quando banco falha e fallback esta desabilitado', async () => {
  await withServer(async ({ baseUrl }) => {
    config.api.cacheEnabled = false;
    config.googleSheets.fallbackEnabled = false;
    database.query = async () => {
      throw new Error('database down');
    };

    const res = await fetch(`${baseUrl}/api/controle-estatistico/rompimentos-grupos`);
    const json = await res.json();

    assert.equal(res.status, 503);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'DATA_SOURCE_UNAVAILABLE');
  });
});

test('usa fallback Google Sheets quando banco falha e fallback esta habilitado', async () => {
  await withServer(async ({ baseUrl }) => {
    const nativeFetch = global.fetch.bind(global);
    config.api.cacheEnabled = false;
    config.googleSheets.fallbackEnabled = true;
    config.googleSheets.apiUrl = 'https://example.test/sheets';
    database.query = async () => {
      throw new Error('database down');
    };
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        rows: [{
          traco_id: '29689',
          data_moldagem: 'Tue Jul 07 2026 00:00:00 GMT-0300',
          data_ruptura: 'Wed Jul 08 2026 00:00:00 GMT-0300',
          idade_dias: '1',
          cp: '1',
          mpa: '18.5',
        }],
      }),
    });

    const res = await nativeFetch(`${baseUrl}/api/controle-estatistico/rompimentos-grupos?ano=2026&mes=07`);
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(json.source, 'google_sheets_fallback');
    assert.equal(json.warning, 'A fonte principal de dados esta temporariamente indisponivel.');
    assert.equal(json.rows[0].traco_id, '29689');
  });
});

test('retorno vazio preserva contrato', async () => {
  await withServer(async ({ baseUrl }) => {
    config.api.cacheEnabled = false;
    database.query = async () => ({ rows: [] });

    const res = await fetch(`${baseUrl}/api/controle-estatistico/rompimentos-grupos`);
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.count, 0);
    assert.deepEqual(json.rows, []);
  });
});
