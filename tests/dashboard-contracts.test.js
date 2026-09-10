'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const sliceBetween = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0, `Inicio nao encontrado: ${start}`);
  assert.ok(to > from, `Fim nao encontrado: ${end}`);
  return source.slice(from, to);
};

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
  assert.match(app, /function isLinhaAvaliacaoDefeitosDashboard/);
  assert.match(app, /montagem_poste:local-v2/);
  assert.doesNotMatch(app, /chamarDashboardRpcComCache\("rpc_dashboard_defeitos_resumo_v1"/);
});

test('exportacoes dos dashboards possuem acionamento e dependencias locais', () => {
  const html = read('mapa-concretagem-teste/index.html');
  const app = read('mapa-concretagem-teste/app.js');
  const sw = read('mapa-concretagem-teste/sw.js');
  const xlsxPath = path.join(root, 'mapa-concretagem-teste/xlsx.full.min.js');

  assert.match(html, /id="dfBtnExportarCsv"/);
  assert.match(app, /dfBtnExportarCsv[^\n]+exportarDashboardDefeitosCsv/);
  assert.match(app, /function exportarDashboardDefeitosCsv/);
  assert.match(html, /src="xlsx\.full\.min\.js\?v=v1\.78"/);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net\/npm\/xlsx/);
  assert.match(sw, /xlsx\.full\.min\.js\?v=v1\.78/);
  assert.ok(fs.statSync(xlsxPath).size > 100000);
});

test('XLSX v1.77 exporta montagem completa e usa producao somente como lookup', () => {
  const app = read('mapa-concretagem-teste/app.js');
  const loader = sliceBetween(app, 'async function carregarBaseExportacaoPorPeriodo', 'async function carregarLookupProducaoPorRecordIds');
  const lookup = sliceBetween(app, 'async function carregarLookupProducaoPorRecordIds', 'async function salvarWorkbookXlsx');
  const exporter = sliceBetween(app, 'async function exportarMontagemIndicadoresXlsx', 'function obterItensRejeitadosLinha');

  assert.match(app, /function dividirPeriodoYmd\(inicio, fim, diasPorLote = 7\)/);
  assert.match(app, /const EXPORTACAO_MONTAGEM_PAGE_SIZE = 500/);
  assert.match(app, /const EXPORTACAO_MONTAGEM_TIMEOUT_MS = 120000/);
  assert.match(loader, /table !== "montagem_poste"/);
  assert.match(loader, /\.gte\("data_fabricacao", loteInicio\)/);
  assert.match(loader, /\.lte\("data_fabricacao", loteFim\)/);
  assert.match(loader, /const from = pagina \* EXPORTACAO_MONTAGEM_PAGE_SIZE/);
  assert.match(loader, /const to = pagina \* EXPORTACAO_MONTAGEM_PAGE_SIZE \+ 499/);
  assert.match(loader, /Intervalo \[\$\{loteInicio\} a \$\{loteFim\}\] excedeu 50\.000 linhas/);
  assert.match(app, /Lote \[\$\{loteInicio\}\].*carregado/);
  assert.match(loader, /row\?\.id === null \|\| row\?\.id === undefined/);
  assert.match(loader, /for \(let index = 0; index < lotes\.length; index\+\+\)/);
  assert.doesNotMatch(loader, /carregarLinhasSupabaseComCache|localStorage|Promise\.all/);

  assert.match(app, /const EXPORTACAO_PRODUCAO_LOOKUP_SIZE = 300/);
  assert.match(lookup, /recordIds\.length/);
  assert.match(lookup, /\.select\("id,codigo_poste,descricao_poste,codigo_produto"\)/);
  assert.match(lookup, /\.in\("id", lote\)/);
  assert.doesNotMatch(lookup, /data_fabricacao|localStorage|Promise\.all/);

  assert.match(exporter, /`base_montagem_\$\{dStart\}_a_\$\{dEnd\}\.xlsx`/);
  assert.match(exporter, /carregarLookupProducaoPorRecordIds\(montagemRows\)/);
  assert.match(exporter, /book_append_sheet\(wb, wsResumo, "Resumo"\)/);
  assert.match(exporter, /book_append_sheet\(wb, wsMontagem, "Base Montagem"\)/);
  assert.match(exporter, /baixarArquivoBlob|salvarWorkbookXlsx/);
  assert.doesNotMatch(exporter, /Base Producao|showSaveFilePicker|localStorage|Promise\.all/);
  assert.doesNotMatch(app, /async function escolherDestinoExportacaoXlsx/);
  assert.doesNotMatch(app, /DASHBOARD_MONTAGEM_SELECT = "[^"]*codigo_poste/);
});

test('arquivos publicos apontam integralmente para v1.78', () => {
  const app = read('mapa-concretagem-teste/app.js');
  const html = read('mapa-concretagem-teste/index.html');
  const manifest = read('mapa-concretagem-teste/manifest.json');
  const reset = read('mapa-concretagem-teste/reset-cache.html');
  const sw = read('mapa-concretagem-teste/sw.js');

  for (const source of [app, html, manifest, reset, sw]) {
    assert.doesNotMatch(source, /v1\.77/);
  }
  assert.match(app, /sw\.js\?v=v1\.78/);
  assert.match(app, /badge\.textContent = "v1\.78"/);
  assert.match(html, /app\.js\?v=v1\.78/);
  assert.match(manifest, /cache-reset=v1\.78/);
  assert.match(reset, /abrir v1\.78/);
  assert.match(sw, /mapa-concretagem-teste-v1\.78/);
});

test('grafico de participacao ordena defeitos e calcula percentual sobre o total', () => {
  const app = read('mapa-concretagem-teste/app.js');
  const rankingSource = sliceBetween(app, 'const DASHBOARD_DEFEITOS_BAR_COLORS', 'function renderIndicadoresDefeitosMontagem');
  const context = {};
  vm.runInNewContext(`${rankingSource}\nglobalThis.ranking = criarRankingParticipacaoDefeitos({ G: 158, J: 56, C: 15 }, 229);`, context);

  assert.equal(context.ranking.length, 3);
  assert.equal(context.ranking[0].tipo, 'G');
  assert.equal(context.ranking[0].total, 158);
  assert.equal(context.ranking[0].larguraRelativa, 100);
  assert.ok(Math.abs(context.ranking[0].percentual - ((158 / 229) * 100)) < 0.000001);
  assert.ok(Math.abs(context.ranking.reduce((soma, item) => soma + item.percentual, 0) - 100) < 0.000001);
  assert.match(app, /class="df-defect-share-percent">\$\{formatPct\(item\.percentual\)\}/);
});

test('carregamentos refatorados dos dashboards usam colunas explicitas', () => {
  const app = read('mapa-concretagem-teste/app.js');

  assert.match(app, /const DASHBOARD_PRODUCAO_SELECT = "/);
  assert.match(app, /const DASHBOARD_MONTAGEM_SELECT = "/);
  assert.match(app, /const DASHBOARD_MONTAGEM_SCREEN_SELECT = "/);
  assert.match(app, /O antigo RPC de[\s\S]+statement_timeout/);
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
