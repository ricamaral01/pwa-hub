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
    DASHBOARD_MONTAGEM_SELECT: 'montagem',
    DASHBOARD_PRODUCAO_SELECT: 'producao',
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
