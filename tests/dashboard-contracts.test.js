'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('dataset ouro preserva invariantes de Total e S1_S2', () => {
  const dataset = JSON.parse(read('docs/dataset-ouro-dashboards-v1.json'));
  const rows = dataset.rows.filter((row) => ['S1', 'S2', 'S3', 'S4'].includes(row.scope));
  const sum = (scopes, field) => rows
    .filter((row) => scopes.includes(row.scope))
    .reduce((total, row) => total + Number(row[field] || 0), 0);

  assert.equal(sum(['S1', 'S2', 'S3', 'S4'], 'producao'), dataset.expected.TOTAL.producao);
  assert.equal(sum(['S1', 'S2', 'S3', 'S4'], 'oportunidades'), dataset.expected.TOTAL.oportunidades);
  assert.equal(sum(['S1', 'S2'], 'producao'), dataset.expected.S1_S2.producao);
  assert.equal(sum(['S1', 'S2'], 'oportunidades'), dataset.expected.S1_S2.oportunidades);
  assert.equal(sum(['S1', 'S2'], 'ocorrencias'), dataset.expected.S1_S2.ocorrencias);
});

test('Dashboard Defeitos possui view e filtros proprios', () => {
  const html = read('mapa-concretagem-teste/index.html');
  const app = read('mapa-concretagem-teste/app.js');

  assert.match(html, /id="viewDashboardDefeitos"/);
  assert.match(html, /id="dfDataInicio"/);
  assert.match(html, /id="dfFiltroSetor"/);
  assert.match(html, /id="dfContent"/);
  assert.match(app, /function carregarDashboardDefeitos/);
  assert.match(app, /rpc_dashboard_defeitos_resumo_v1/);
});

test('carregamentos refatorados dos dashboards usam colunas explicitas', () => {
  const app = read('mapa-concretagem-teste/app.js');

  assert.match(app, /const DASHBOARD_PRODUCAO_SELECT = "/);
  assert.match(app, /const DASHBOARD_MONTAGEM_SELECT = "/);
  assert.doesNotMatch(app, /select:\s*["']\*["']/);
  assert.doesNotMatch(app, /\.select\(opts\.select \|\| ["']\*["']\)/);
});

test('migration versiona contratos analiticos v1', () => {
  const sql = read('supabase/migrations/202608200002_dashboard_analytics_v1.sql');

  for (const token of [
    'dashboard_sector_code_v1',
    'dashboard_scope_sectors_v1',
    'vw_dashboard_producao_base_v1',
    'vw_dashboard_montagem_base_v1',
    'rpc_dashboard_produtividade_resumo_v1',
    'rpc_dashboard_montagem_resumo_v1',
    'rpc_dashboard_defeitos_resumo_v1',
  ]) {
    assert.match(sql, new RegExp(token));
  }
});

test('migration das fases 7 8 e 9 versiona custos paginacao e tendencia', () => {
  const sql = read('supabase/migrations/202608200003_dashboards_fases_7_8_9_v1.sql');

  for (const token of [
    'dashboard_retrabalho_eventos_v1',
    'rpc_dashboard_retrabalho_resumo_v1',
    'rpc_dashboard_montagem_lista_v1',
    'rpc_dashboard_montagem_ranking_v1',
    'rpc_dashboard_produtividade_tendencia_v1',
    'rpc_dashboard_produtividade_detalhe_v1',
    'enable row level security',
    'costs_visible',
  ]) {
    assert.match(sql, new RegExp(token));
  }
});

test('correcao do contrato de defeitos inclui pareto e matriz server-side', () => {
  const sql = read('supabase/migrations/202608200004_dashboard_defeitos_contract_fix_v1.sql');

  for (const token of [
    'dashboard_jsonb_rejected_labels_v1',
    'rpc_dashboard_defeitos_resumo_v1',
    'by_defect',
    'defect_matrix',
    'fissuras_circulares',
  ]) {
    assert.match(sql, new RegExp(token));
  }
});
