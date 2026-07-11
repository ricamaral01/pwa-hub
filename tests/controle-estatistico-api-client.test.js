const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadClient(fetchImpl, storage) {
  const code = fs.readFileSync('controle-estatistico/api-client.js', 'utf8');
  const context = {
    window: {
      location: { origin: 'https://concretrack.local' },
    },
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: fetchImpl,
    localStorage: storage,
  };
  context.window.window = context.window;
  context.window.URL = URL;
  context.window.AbortController = AbortController;
  context.window.setTimeout = setTimeout;
  context.window.clearTimeout = clearTimeout;
  context.window.fetch = fetchImpl;
  context.window.localStorage = storage;
  context.fetch = fetchImpl;
  context.localStorage = storage;
  vm.runInNewContext(code, context);
  return context.window.ControleEstatisticoApi;
}

function storage(seed) {
  const data = new Map(Object.entries(seed || {}));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, value); },
    removeItem(key) { data.delete(key); },
  };
}

test('cliente retorna SUCCESS e grava cache local', async () => {
  const store = storage();
  const api = loadClient(async (url) => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      source: 'database',
      generated_at: '2026-07-11T12:00:00.000Z',
      count: 1,
      pagination: { limit: 1000, offset: 0, has_more: false },
      rows: [{ traco_id: '29689', data_moldagem: '2026-07-07', idade_dias: 1, cp: 1, mpa: 18.5 }],
    }),
  }), store);

  const result = await api.loadRows({ cacheKey: 'k', filters: { mes: '07' } });

  assert.equal(result.state, 'SUCCESS');
  assert.equal(result.rows.length, 1);
  assert.match(store.getItem('k'), /29689/);
});

test('cliente usa cache local apenas quando API falha', async () => {
  const cached = JSON.stringify({
    ts: Date.UTC(2026, 6, 10, 18, 45),
    generated_at: '2026-07-10T18:45:00.000Z',
    source: 'database',
    rows: [{ traco_id: '29689', data_moldagem: '2026-07-07', idade_dias: 1, cp: 1, mpa: 18.5 }],
  });
  const api = loadClient(async () => ({
    ok: false,
    status: 503,
    json: async () => ({ success: false, error: { message: 'indisponivel' } }),
  }), storage({ k: cached }));

  const result = await api.loadRows({ cacheKey: 'k' });

  assert.equal(result.state, 'OFFLINE_CACHE');
  assert.equal(result.rows.length, 1);
});

test('cliente encerra em ERROR sem API e sem cache', async () => {
  const api = loadClient(async () => {
    throw new Error('network');
  }, storage());

  const result = await api.loadRows({ cacheKey: 'k' });

  assert.equal(result.state, 'ERROR');
  assert.equal(result.rows.length, 0);
});
