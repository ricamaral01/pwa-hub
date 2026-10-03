'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('Mandril preserva SC01 e exige confirmação da linha de concretagem no Supabase', async () => {
  let payload;
  let filters;
  let updateResult = [{ id: 'producao-1', modelo: '9x200', descricao_poste: '9x200', codigo_produto: '915' }];
  const context = {
    normalizeUpper: value => String(value || '').trim().toUpperCase(),
    normalizeProductionModelKey: value => String(value || '').toUpperCase().replace(/\s+/g, ''),
    escapeHtml: value => String(value || ''),
    getProductionPosteFields: () => ({ descricaoPoste: '9x200', codigoProduto: '915' }),
    supabaseClient: {
      from(table) {
        assert.equal(table, 'producao');
        return {
          update(value) {
            payload = value;
            filters = [];
            return {
              eq(column, expected) { filters.push([column, expected]); return this; },
              async select() { return { data: updateResult, error: null }; }
            };
          }
        };
      }
    }
  };
  vm.runInNewContext(section('function normalizeMandrilForma(', 'function getMandrilModeloEntry('), context);
  vm.runInNewContext(section('async function persistirMandrilModeloNaConcretagem(', 'async function sincronizarMandrilModelosPendentes('), context);

  assert.equal(context.normalizeMandrilForma('SC1'), 'SC01');
  const saved = await context.persistirMandrilModeloNaConcretagem('2026-09-30', 'SC01', '9x200', 'producao-1');
  assert.equal(saved.id, 'producao-1');
  assert.deepEqual(Array.from(filters, pair => Array.from(pair)), [
    ['id', 'producao-1'], ['data_fabricacao', '2026-09-30'], ['setor', 'Setor 3'], ['status', 'LIBERADO']
  ]);
  assert.equal(payload.modelo, '9x200');
  assert.equal(payload.descricao_poste, '9x200');
  assert.equal(payload.codigo_produto, '915');

  const lookupFilters = [];
  const originalFrom = context.supabaseClient.from;
  context.supabaseClient.from = table => ({
    ...originalFrom(table),
    select() {
      return {
        eq(column, expected) { lookupFilters.push([column, expected]); return this; },
        order() { return this; },
        async limit() { return { data: [{ id: 'producao-1' }], error: null }; }
      };
    }
  });
  await context.persistirMandrilModeloNaConcretagem('2026-09-30', 'SC1', '9x200');
  assert.ok(lookupFilters.some(([column, value]) => column === 'forma' && value === 'SC01'));

  updateResult = [];
  await assert.rejects(context.persistirMandrilModeloNaConcretagem('2026-09-30', 'SC01', '9x200', 'producao-1'), /não foi confirmado no banco/);
});

test('Mandril recupera seleção antiga SC1 e sincroniza quando o banco ainda tem SC', async () => {
  const cache = { '2026-09-30||SC1': { modelo: '9x200', pendingSync: false, updatedAt: '2026-09-30T10:00:00Z' } };
  let persisted;
  const context = {
    MANDRIL_MODELOS_PRODUZIDOS_KEY: 'mandril-test',
    localStorage: {
      getItem: () => JSON.stringify(cache),
      setItem: (_, value) => { Object.keys(cache).forEach(key => delete cache[key]); Object.assign(cache, JSON.parse(value)); }
    },
    normalizeUpper: value => String(value || '').trim().toUpperCase(),
    normalizeProductionModelKey: value => String(value || '').toUpperCase().replace(/\s+/g, ''),
    escapeHtml: value => String(value || ''),
    window: { getModelosForFormaS3: forma => forma === 'SC01' ? ['', '9x200'] : [''] },
    navigator: { onLine: true },
    hasApiConfigured: () => true,
    persistirMandrilModeloNaConcretagem: async (date, forma, modelo, id) => {
      persisted = { date, forma, modelo, id };
      return { id, modelo, descricao_poste: modelo, codigo_produto: '915' };
    },
    console
  };
  vm.runInNewContext(section('function readMandrilModelosProduzidos(', 'async function persistirMandrilModeloNaConcretagem('), context);
  vm.runInNewContext(section('async function sincronizarMandrilModelosPendentes(', 'async function salvarMandrilModeloProduzido('), context);

  const field = context.renderMandrilModeloSelect('SC01', '9 X 200', true, 'producao-1', true);
  assert.match(field, /data-mc-producao-id="producao-1"/);
  assert.match(field, /value="9x200" selected/);
  assert.match(field, /Pendente de sincronização/);

  const rows = [{ id: 'producao-1', forma: 'SC01', modelo: 'SC' }];
  await context.sincronizarMandrilModelosPendentes('2026-09-30', rows);
  assert.deepEqual(persisted, { date: '2026-09-30', forma: 'SC01', modelo: '9x200', id: 'producao-1' });
  assert.equal(cache['2026-09-30||SC1'], undefined);
  assert.equal(cache['2026-09-30||SC01'].pendingSync, false);
  assert.equal(rows[0].modelo, '9x200');
});
