'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const section = source.slice(
  source.indexOf('function criarLinhasDetalheDefeito('),
  source.indexOf('function renderIndicadoresDefeitosMontagem(')
);

function contextWith(overrides = {}) {
  const context = {
    ETAPA_HISTORICO_REPROVACAO: 'HISTORICO_REPROVACAO',
    DASHBOARD_DEFEITOS_PRODUCAO_SELECT: 'data_fabricacao,setor,forma,modelo,tipo_concreto,data_hora,status',
    normalizeUpper: value => String(value || '').trim().toUpperCase(),
    normalizeForma: value => String(value || '').toUpperCase().replace(/[\s-]/g, '').replace(/^([A-Z]+)0+(\d+)$/, '$1$2'),
    escapeHtml: value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    ...overrides
  };
  vm.runInNewContext(section, context);
  return context;
}

test('detalhe usa concretagem LIBERADO da mesma forma e preserva a inspeção posterior', () => {
  const context = contextWith();
  const inspecao = {
    id: 'poste-1||HISTORICO_REPROVACAO||2026-09-02T13:00:00Z',
    record_id: 'poste-1', data_fabricacao: '2026-09-01', setor: 'Setor 1',
    forma_numero: 'F01', modelo: '9x200', finalizado_em: '2026-09-02T13:00:00Z'
  };
  const producao = [
    { data_fabricacao: '2026-09-01', setor: 'Setor 1', forma: 'F01', status: 'INSPECIONADO', tipo_concreto: 'INSPECIONADO' },
    { data_fabricacao: '2026-09-01', setor: 'Setor 1', forma: 'F01', status: 'LIBERADO', tipo_concreto: 'Concreto Padrão', data_hora: '2026-09-01T14:30:00Z' }
  ];
  const rows = context.criarLinhasDetalheDefeito([inspecao], producao);
  assert.equal(rows[0].tipoConcreto, 'Concreto Padrão');
  assert.equal(rows[0].horaConcretagem, '2026-09-01T14:30:00Z');
  assert.equal(rows[0].dataInspecao, '2026-09-02T13:00:00Z');
  const html = context.renderHtmlDetalheDefeito('Falhas de Preenchimento', [inspecao], producao);
  assert.match(html, /01\/09\/2026/);
  assert.match(html, /02\/09\/2026/);
  assert.match(html, /Concreto Padrão/);
  assert.match(html, /11:30/);
  assert.match(html, /Setor 1/);
});

test('detalhe busca concretagem anterior ao período de inspeção quando falta na base', async () => {
  const filters = {};
  const production = { data_fabricacao: '2026-08-31', setor: 'Setor 2', forma: 'F02', status: 'LIBERADO', tipo_concreto: 'Concreto Seco', data_hora: '2026-08-31T15:00:00Z' };
  const context = contextWith({
    hasApiConfigured: () => true,
    navigator: { onLine: true },
    console,
    carregarLinhasSupabaseComCache: async options => {
      const query = { in(column, values) { filters[column] = values; return this; } };
      options.applyFilters(query);
      return { rows: [production] };
    }
  });
  const detailData = { producaoRows: [], queriedKeys: new Set() };
  const inspecao = { data_fabricacao: '2026-08-31', setor: 'Setor 2', forma_numero: 'F02', finalizado_em: '2026-09-02T13:00:00Z' };
  await context.carregarConcretagensDetalheDefeito([inspecao], detailData);
  assert.deepEqual(Array.from(filters.data_fabricacao), ['2026-08-31']);
  assert.deepEqual(Array.from(filters.status), ['LIBERADO', 'CONCRETADO']);
  assert.deepEqual(Array.from(filters.forma), ['F02', 'F2', 'F002']);
  assert.equal(detailData.producaoRows[0].tipo_concreto, 'Concreto Seco');
});

test('detalhe ordena postes pela produção mais recente, mesmo com inspeções em outra ordem', () => {
  const context = contextWith();
  const ocorrencias = [
    { id: 'antigo', data_fabricacao: '2026-09-01', finalizado_em: '2026-09-30T12:00:00Z', forma_numero: 'F01' },
    { id: 'novo', data_fabricacao: '2026-09-29', finalizado_em: '2026-09-29T12:00:00Z', forma_numero: 'F02' },
    { id: 'intermediario', data_fabricacao: '2026-09-15', finalizado_em: '2026-09-20T12:00:00Z', forma_numero: 'F03' }
  ];
  const linhas = context.criarLinhasDetalheDefeito(ocorrencias, []);
  assert.deepEqual(Array.from(linhas, row => row.posteKey), ['novo', 'intermediario', 'antigo']);
});
