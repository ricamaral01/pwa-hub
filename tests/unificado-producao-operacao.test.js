'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = execFileSync('python', ['-c', [
  'import sys',
  'from pathlib import Path',
  "sys.stdout.reconfigure(encoding='utf-8')",
  "sys.path.insert(0, 'scripts')",
  'from patch_unificado_producao import apply',
  "print(apply(Path('mapa-concretagem/app.js').read_text(encoding='utf-8')))"
].join(';')], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('Unificado distingue apontamento padrão de liberação e atualiza o produto do Setor 3', async () => {
  let rows = [{
    data_fabricacao: '2026-10-13', setor: 'Setor 3', forma: 'SC01',
    prod_id: 'producao-1', prod_tipo_concreto: 'Padrão', prod_modelo: 'SC',
    prod_codigo_produto: '', prod_descricao_poste: '', prod_data_hora: '2026-10-13T12:00:00Z'
  }];
  const db = { records: [], events: [] };
  let clicked;
  const context = {
    el: { libData: { value: '2026-10-13' } },
    hasApiConfigured: () => true,
    supabaseClient: { from: () => ({ select() { return this; }, async eq() { return { data: rows, error: null }; } }) },
    getClickedFormsToday: () => ({ formas: {} }),
    readDb: () => db,
    writeDb: () => {},
    findRecordByKey: (_db, date, sector, form) => db.records.find(record =>
      record.dataFabricacao === date && record.setor === sector && record.formaNumero === form),
    upsertRecord: (_db, record) => { if (!db.records.includes(record)) db.records.push(record); },
    localStorage: { setItem: (_key, value) => { clicked = JSON.parse(value); } },
    CLICKED_FORMS_KEY: 'clicked',
    normalizeUpper: value => String(value).toUpperCase(),
    nowIso: () => '2026-10-13T12:00:00Z',
    uuid: () => 'local-1',
    console
  };
  vm.runInNewContext(section('async function loadClickedFormsFromSupabase(', 'function getOperationalFormsForSector('), context);
  await context.loadClickedFormsFromSupabase();
  assert.equal(clicked.formas['Setor 3||SC01'], '1');
  assert.equal(db.records[0].modelo, 'SC');

  rows = [{ ...rows[0], prod_tipo_concreto: 'Concreto Padrão', prod_modelo: '9x200',
    prod_codigo_produto: '678', prod_descricao_poste: '9x200' }];
  await context.loadClickedFormsFromSupabase();
  assert.equal(clicked.formas['Setor 3||SC01'], '1');
  assert.equal(db.records[0].modelo, '9x200');
  assert.equal(db.records[0].codigoProduto, '678');

  rows = [{ data_fabricacao: '2026-10-13', setor: 'Setor 1', forma: 'A-01',
    lib_id: 'liberacao-1', lib_data_hora: '2026-10-13T12:30:00Z' }];
  await context.loadClickedFormsFromSupabase();
  assert.equal(clicked.formas['Setor 1||A-01'], 'L');
});

test('Unificado só grava saque do mandril após confirmar o modelo', async () => {
  const calls = [];
  const select = { value: '9x200' };
  let saved = false;
  const cache = {};
  const context = {
    window: {},
    el: { mcFiltroData: { value: '2026-10-13' }, mcTabelaBody: { querySelector: () => select } },
    normalizeMandrilForma: value => value,
    normalizeForma: value => value,
    salvarMandrilModeloProduzido: async () => { calls.push('modelo'); return saved; },
    showMsgBox: () => {},
    fetch: async () => { calls.push('saque'); return { ok: true }; },
    lerSaquesMandrilLocais: () => ({}),
    localStorage: {
      getItem: key => cache[key] || null,
      setItem: (key, value) => { cache[key] = value; }
    },
    SAQUE_MANDRIL_API: '/api/saques-mandril',
    SAQUE_MANDRIL_MIGRATED_KEY: 'migrated',
    carregarMandrilCircular: () => calls.push('atualizar')
  };
  vm.runInNewContext(section('window.registrarSaque = async function(forma)', 'window.limparSaque ='), context);
  await context.window.registrarSaque('SC01');
  assert.deepEqual(calls, ['modelo']);
  saved = true;
  await context.window.registrarSaque('SC01');
  assert.deepEqual(calls, ['modelo', 'modelo', 'saque', 'atualizar']);
});
