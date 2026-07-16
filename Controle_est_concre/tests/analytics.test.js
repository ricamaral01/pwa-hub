const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const database = require('../src/core/database');
const { createApp } = require('../src/app');
const { calculateStdDev } = require('../src/services/analytics_service');
const { analyticsCache } = require('../src/core/analytics_cache');

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
  const app = createApp();
  const ctx = await listen(app);
  analyticsCache.clear();
  try {
    await fn(ctx);
  } finally {
    database.query = originalQuery;
    analyticsCache.clear();
    await new Promise((resolve) => ctx.server.close(resolve));
  }
}

test('calculo de desvio padrao populacional (mesmo calculo do frontend)', () => {
  // Test case matching standard standard deviation of [10, 20, 30]
  // Mean = 20
  // Variance = ((10-20)^2 + (20-20)^2 + (30-20)^2) / 3 = (100 + 0 + 100) / 3 = 200 / 3 = 66.6666...
  // StdDev = sqrt(66.6666...) = 8.1649...
  const sd = calculateStdDev([10, 20, 30]);
  assert.ok(Math.abs(sd - 8.16496580927726) < 0.0001);

  // Less than 2 items must return null
  assert.equal(calculateStdDev([10]), null);
  assert.equal(calculateStdDev([]), null);
});

test('GET /api/v2/controle-estatistico/rompimentos-grupos retorna dados e usa cache', async () => {
  await withServer(async ({ baseUrl }) => {
    let queryCount = 0;
    database.query = async (sql, params) => {
      queryCount++;
      return {
        rows: [{
          data_moldagem: '2026-07-07',
          data_ruptura: '2026-07-08',
          traco_id: '29689',
          idade_dias: 1,
          mpa_cp1: 18.50,
          mpa_cp2: 19.50,
          media_mpa: 19.00,
          status_resultado: 'OK'
        }]
      };
    };

    // First request - MISS
    const res1 = await fetch(`${baseUrl}/api/v2/controle-estatistico/rompimentos-grupos?ano=2026&mes=07`);
    const json1 = await res1.json();
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('X-Cache'), 'MISS');
    assert.equal(json1.success, true);
    assert.equal(json1.rows[0].media_mpa, 19.00);
    assert.equal(queryCount, 1);

    // Second request - HIT (no database query should run)
    const res2 = await fetch(`${baseUrl}/api/v2/controle-estatistico/rompimentos-grupos?ano=2026&mes=07`);
    const json2 = await res2.json();
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('X-Cache'), 'HIT');
    assert.equal(json2.rows[0].media_mpa, 19.00);
    assert.equal(queryCount, 1); // Query count still 1
  });
});

test('GET /api/v2/controle-estatistico/estatistica-mensal e invalidacao seletiva de cache', async () => {
  await withServer(async ({ baseUrl }) => {
    let queryCount = 0;
    database.query = async (sql, params) => {
      queryCount++;
      return {
        rows: [{
          ano_mes: '2026-07',
          traco_id: '29689',
          idade_dias: 28,
          quantidade_grupos: 15,
          media_mpa: 36.5
        }]
      };
    };

    // 1. Fetch data - MISS
    const res1 = await fetch(`${baseUrl}/api/v2/controle-estatistico/estatistica-mensal?ano=2026&mes=07`);
    assert.equal(res1.headers.get('X-Cache'), 'MISS');
    assert.equal(queryCount, 1);

    // 2. Fetch data again - HIT
    const res2 = await fetch(`${baseUrl}/api/v2/controle-estatistico/estatistica-mensal?ano=2026&mes=07`);
    assert.equal(res2.headers.get('X-Cache'), 'HIT');
    assert.equal(queryCount, 1);

    // 3. Invalidate month 2026-07
    analyticsCache.invalidateForMonth('2026-07');

    // 4. Fetch data again - MISS (cache was invalidated)
    const res3 = await fetch(`${baseUrl}/api/v2/controle-estatistico/estatistica-mensal?ano=2026&mes=07`);
    assert.equal(res3.headers.get('X-Cache'), 'MISS');
    assert.equal(queryCount, 2);
  });
});
