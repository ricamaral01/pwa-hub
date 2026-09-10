'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'mapa-concretagem-teste', 'app.js'), 'utf8');

function criarSupabaseMock(handler) {
  return {
    from(table) {
      const state = { table };
      const query = {
        select(value) { state.select = value; return query; },
        gte(column, value) { state.gte = [column, value]; return query; },
        lte(column, value) { state.lte = [column, value]; return query; },
        order(column, options) { state.order = [column, options]; return query; },
        range(from, to) { state.range = [from, to]; return query; },
        in(column, values) { state.in = [column, [...values]]; return query; },
        abortSignal() { return query; },
        then(onFulfilled, onRejected) {
          return Promise.resolve()
            .then(() => handler({ ...state }))
            .then(onFulfilled, onRejected);
        }
      };
      return query;
    }
  };
}

function carregarApiTeste(supabaseClient) {
  const start = appSource.indexOf('function somarDiasYmd');
  const end = appSource.indexOf('async function salvarWorkbookXlsx', start);
  assert.ok(start >= 0 && end > start);

  const logs = [];
  const warnings = [];
  const timersLongos = new Set();
  const windowMock = {
    setTimeout(callback, delay) {
      if (delay >= 120000) {
        const token = { callback };
        timersLongos.add(token);
        return token;
      }
      return setTimeout(callback, 0);
    },
    clearTimeout(token) {
      if (timersLongos.has(token)) timersLongos.delete(token);
      else clearTimeout(token);
    }
  };
  const context = vm.createContext({
    supabaseClient,
    AbortController,
    Promise,
    Map,
    Date,
    String,
    Array,
    Math,
    JSON,
    window: windowMock,
    console: {
      log: (...args) => logs.push(args),
      warn: (...args) => warnings.push(args),
      error: (...args) => logs.push(args)
    }
  });
  vm.runInContext(`${appSource.slice(start, end)}\nglobalThis.api = { carregarBaseExportacaoPorPeriodo, carregarLookupProducaoPorRecordIds };`, context);
  return { api: context.api, logs, warnings };
}

test('paginacao usa ranges inclusivos de 500 e consolida todas as linhas', async () => {
  const requests = [];
  const supabase = criarSupabaseMock(state => {
    requests.push(state);
    const [from] = state.range;
    const size = from === 0 ? 500 : 1;
    return {
      data: Array.from({ length: size }, (_, index) => ({
        id: from + index + 1,
        data_fabricacao: '2026-08-01'
      })),
      error: null
    };
  });
  const { api } = carregarApiTeste(supabase);
  const rows = await api.carregarBaseExportacaoPorPeriodo({
    table: 'montagem_poste', select: 'id,data_fabricacao', inicio: '2026-08-01', fim: '2026-08-01'
  });

  assert.equal(rows.length, 501);
  assert.deepEqual(requests.map(item => item.range), [[0, 499], [500, 999]]);
});

test('lote diario aborta a exportacao depois de tres falhas transitorias', async () => {
  let attempts = 0;
  const supabase = criarSupabaseMock(() => {
    attempts++;
    const error = new Error('canceling statement due to statement timeout');
    error.code = '57014';
    return { data: null, error };
  });
  const { api } = carregarApiTeste(supabase);

  await assert.rejects(
    api.carregarBaseExportacaoPorPeriodo({
      table: 'montagem_poste', select: 'id', inicio: '2026-08-01', fim: '2026-08-01'
    }),
    /Lote \[2026-08-01\].*carregado/
  );
  assert.equal(attempts, 3);
});

test('limite de 50 mil linhas gera erro explicito em vez de retorno parcial', async () => {
  let requests = 0;
  const pagina = Array.from({ length: 500 }, (_, index) => ({ id: index + 1, data_fabricacao: '2026-08-01' }));
  const supabase = criarSupabaseMock(() => {
    requests++;
    return { data: pagina, error: null };
  });
  const { api } = carregarApiTeste(supabase);

  await assert.rejects(
    api.carregarBaseExportacaoPorPeriodo({
      table: 'montagem_poste', select: 'id', inicio: '2026-08-01', fim: '2026-08-01'
    }),
    /Intervalo \[2026-08-01 a 2026-08-01\] excedeu 50\.000 linhas/
  );
  assert.equal(requests, 100);
});

test('ids nulos sao descartados antes da deduplicacao', async () => {
  const supabase = criarSupabaseMock(() => ({
    data: [
      { id: null, data_fabricacao: '2026-08-01' },
      { id: 7, data_fabricacao: '2026-08-01', valor: 'antigo' },
      { id: 7, data_fabricacao: '2026-08-01', valor: 'novo' }
    ],
    error: null
  }));
  const { api, warnings } = carregarApiTeste(supabase);
  const rows = await api.carregarBaseExportacaoPorPeriodo({
    table: 'montagem_poste', select: 'id,data_fabricacao', inicio: '2026-08-01', fim: '2026-08-01'
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].valor, 'novo');
  assert.ok(warnings.some(args => String(args[0]).includes('id nulo')));
});

test('lookup de producao usa lotes sequenciais de no maximo 300 ids', async () => {
  const requests = [];
  const supabase = criarSupabaseMock(state => {
    requests.push(state);
    const ids = state.in[1];
    const data = ids
      .filter(id => id !== 301)
      .map(id => ({ id, codigo_poste: `P${id}`, descricao_poste: `Poste ${id}`, codigo_produto: `C${id}` }));
    return { data, error: null };
  });
  const { api, warnings } = carregarApiTeste(supabase);
  const montagem = Array.from({ length: 301 }, (_, index) => ({ id: index + 1, record_id: index + 1 }));
  const lookup = await api.carregarLookupProducaoPorRecordIds(montagem);

  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(item => item.in[1].length), [300, 1]);
  assert.ok(requests.every(item => item.table === 'producao'));
  assert.ok(requests.every(item => item.select === 'id,codigo_poste,descricao_poste,codigo_produto'));
  assert.equal(lookup.size, 300);
  assert.ok(warnings.some(args => String(args[0]).includes('record_id 301 sem correspondente')));
});
