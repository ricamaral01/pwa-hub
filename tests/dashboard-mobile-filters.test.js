'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const section = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));

test('atalhos de período respeitam dias inclusivos e a virada do ano', () => {
  const context = {
    todayYmd: () => '2026-01-15',
    document: { getElementById: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: () => null },
    console
  };
  vm.runInNewContext(section('const DASHBOARD_FILTER_FIELDS =', 'function readMapaReportPayloadCache('), context);
  assert.deepEqual(Array.from(context.getDashboardPresetDates('7')), ['2026-01-09', '2026-01-15']);
  assert.deepEqual(Array.from(context.getDashboardPresetDates('30')), ['2025-12-17', '2026-01-15']);
  assert.deepEqual(Array.from(context.getDashboardPresetDates('previous')), ['2025-12-01', '2025-12-31']);
});

test('busca do dashboard de defeitos mantém produção ligada ao montador encontrado', async () => {
  const montage = [
    { data_fabricacao: '2026-09-30', setor: 'Setor 3', forma_numero: 'SC01', modelo: '9x200', montador_nome: 'Ana', status_montagem: 'A' },
    { data_fabricacao: '2026-09-30', setor: 'Setor 3', forma_numero: 'SC02', modelo: '8x200', montador_nome: 'Bruno', status_montagem: 'A' }
  ];
  const production = [
    { data_fabricacao: '2026-09-30', setor: 'Setor 3', forma: 'SC01', modelo: '9x200' },
    { data_fabricacao: '2026-09-30', setor: 'Setor 3', forma: 'SC02', modelo: '8x200' }
  ];
  let captured;
  const context = {
    supabaseClient: {}, dashboardRequestSeq: { defeitos: 0 },
    todayYmd: () => '2026-09-30',
    getDashboardFilterValue: (name, fallback) => ({ DataInicio: '2026-09-30', DataFim: '2026-09-30', FiltroPesquisa: 'ana' })[name] || fallback,
    aplicarLayoutDashboardDefeitos: () => {}, atualizarResumoFiltrosDefeitos: () => {}, setSyncStatus: () => {},
    getDashboardScopeFromSetor: () => 'TOTAL',
    carregarLinhasSupabaseComCache: async ({ table }) => ({ rows: table === 'montagem_poste' ? montage : production, state: 'ONLINE' }),
    DASHBOARD_DEFEITOS_MONTAGEM_SELECT: '', DASHBOARD_DEFEITOS_PRODUCAO_SELECT: '',
    removerReprovacoesDuplicadasDashboard: rows => rows,
    getMiDataReferencia: row => row.data_fabricacao,
    isLinhaAvaliacaoDefeitosDashboard: () => true,
    isLinhaDefeitoDashboard: () => false,
    normalizarTexto: value => String(value || '').toLowerCase(),
    normalizeForma: value => String(value || '').replace(/[\s-]/g, '').toUpperCase(),
    calcularIndicadoresDefeitosMontagem: (rows, products) => {
      captured = { rows, products };
      return { producao: products.length, postes: rows.length, totalErros: 0, totalPossivel: 0, postesReprovados: 0, retrabalho: 0, porSetor: [], porTipo: [], matriz: [] };
    },
    renderIndicadoresDefeitosMontagem: () => {},
    document: { getElementById: () => null },
    miDefeitosExportData: null,
    console
  };
  vm.runInNewContext(section('let dashboardDefeitosBaseCache = null;', 'function aplicarFiltrosEExibirMontagem()'), context);
  await context.carregarDashboardDefeitos();
  assert.deepEqual(captured.rows.map(row => row.forma_numero), ['SC01']);
  assert.deepEqual(captured.products.map(row => row.forma), ['SC01']);
});
