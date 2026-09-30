'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('cada defeito mantém uma cor exclusiva no total e nos setores', () => {
  const context = {
    normalizarTexto: value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
  };
  vm.runInNewContext(section('const DASHBOARD_DEFEITOS_COLORS_BY_TYPE', 'function criarParticipacaoDefeitosPorSetor('), context);

  const total = context.criarRankingParticipacaoDefeitos({
    'Bolhas em excesso': 32,
    'Falhas de Preenchimento': 10,
    'Pequenas avarias': 6
  }, 48);
  const setor1 = context.criarRankingParticipacaoDefeitos({
    'Falhas de Preenchimento': 7,
    'Bolhas em excesso': 2
  }, 9);
  const setor2 = context.criarRankingParticipacaoDefeitos({
    'Pequenas avarias': 4,
    'Falhas de Preenchimento': 1
  }, 5);
  const color = (ranking, name) => ranking.find(item => item.tipo === name).cor;
  assert.equal(color(total, 'Bolhas em excesso'), color(setor1, 'Bolhas em excesso'));
  assert.equal(color(total, 'Falhas de Preenchimento'), color(setor1, 'Falhas de Preenchimento'));
  assert.equal(color(total, 'Falhas de Preenchimento'), color(setor2, 'Falhas de Preenchimento'));
  assert.equal(color(total, 'Pequenas avarias'), color(setor2, 'Pequenas avarias'));
  assert.equal(new Set(total.map(item => item.cor)).size, total.length);
  const knownColors = vm.runInNewContext('Object.values(DASHBOARD_DEFEITOS_COLORS_BY_TYPE)', context);
  assert.equal(new Set(knownColors).size, knownColors.length);
});

test('trocar filtros no mesmo período reutiliza a base e Atualizar refaz a consulta', async () => {
  let calls = 0;
  const context = {
    DASHBOARD_DEFEITOS_MONTAGEM_SELECT: 'montagem',
    DASHBOARD_DEFEITOS_PRODUCAO_SELECT: 'producao',
    carregarLinhasSupabaseComCache: async options => {
      calls++;
      return { rows: [{ table: options.table }], state: 'SUCCESS' };
    }
  };
  vm.runInNewContext(section('let dashboardDefeitosBaseCache = null;', 'async function carregarDashboardDefeitos('), context);

  const [first, simultaneous] = await Promise.all([
    context.obterBaseDashboardDefeitos('2026-09-01', '2026-09-30'),
    context.obterBaseDashboardDefeitos('2026-09-01', '2026-09-30')
  ]);
  assert.equal(calls, 2);
  assert.equal(first, simultaneous);

  await context.obterBaseDashboardDefeitos('2026-09-01', '2026-09-30');
  assert.equal(calls, 2);
  await context.obterBaseDashboardDefeitos('2026-09-01', '2026-09-30', true);
  assert.equal(calls, 4);
  await context.obterBaseDashboardDefeitos('2026-08-01', '2026-08-31');
  assert.equal(calls, 6);
});

test('paginação paralela conserva a ordem e detecta limite sem truncar dados', async () => {
  const requested = [];
  const pages = {
    0: [{ id: 1 }, { id: 2 }],
    2: [{ id: 3 }, { id: 4 }],
    4: [{ id: 5 }]
  };
  const context = {
    MAPA_REPORT_DEFAULT_TIMEOUT_MS: 15000,
    AbortController,
    setTimeout,
    clearTimeout,
    supabaseClient: {
      from() {
        return {
          select() { return this; },
          range(from) { this.fromIndex = from; return this; },
          order() { return this; },
          abortSignal() { return this; },
          then(resolve) {
            requested.push(this.fromIndex);
            resolve({ data: pages[this.fromIndex] || [], error: null });
          }
        };
      }
    }
  };
  vm.runInNewContext(section('async function carregarLinhasSupabaseComCache(options)', 'function setSyncStatus('), context);
  const result = await context.carregarLinhasSupabaseComCache({
    table: 'montagem_poste', select: 'id', pageSize: 2, maxPages: 5,
    pageConcurrency: 2, requireComplete: true, orderBy: 'id'
  });
  assert.deepEqual(Array.from(result.rows, row => row.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(requested, [0, 2, 4]);

  await assert.rejects(context.carregarLinhasSupabaseComCache({
    table: 'montagem_poste', select: 'id', pageSize: 2, maxPages: 2,
    requireComplete: true, orderBy: 'id'
  }), /Limite de 4 linhas/);
});

test('mudar o período cancela a consulta antiga', async () => {
  const signals = [];
  const context = {
    AbortController,
    DASHBOARD_DEFEITOS_MONTAGEM_SELECT: 'montagem',
    DASHBOARD_DEFEITOS_PRODUCAO_SELECT: 'producao',
    carregarLinhasSupabaseComCache: options => {
      signals.push(options.signal);
      if (options.cacheKey.includes('2026-09')) {
        return new Promise((_, reject) => {
          options.signal.addEventListener('abort', () => reject(new Error('cancelada')), { once: true });
        });
      }
      return Promise.resolve({ rows: [], state: 'SUCCESS' });
    }
  };
  vm.runInNewContext(section('let dashboardDefeitosBaseCache = null;', 'async function carregarDashboardDefeitos('), context);
  const oldRequest = context.obterBaseDashboardDefeitos('2026-09-01', '2026-09-30');
  const rejected = assert.rejects(oldRequest, /cancelada/);
  await context.obterBaseDashboardDefeitos('2026-08-01', '2026-08-31');
  await rejected;
  assert.equal(signals[0].aborted, true);
});
