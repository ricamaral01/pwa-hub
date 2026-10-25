const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../../unificado/pcp/static/js/maodeobra-core.js');
const core = global.MaoDeObraCore;

const activities = [
  {id: 8, tipo: 'MOI', ordem: 20},
  {id: 3, tipo: 'MOD', ordem: 10},
  {id: 7, tipo: 'MOI', ordem: 10},
];

test('vírgula, meio período, limites e totais preservam a regra desktop', () => {
  assert.equal(core.parseQuantity('12,5'), 12.5);
  assert.equal(core.parseQuantity(''), 0);
  for (const invalid of ['-0,5', '1,25', '1000', 'a']) {
    assert.ok(Number.isNaN(core.parseQuantity(invalid)), invalid);
  }
  assert.deepEqual(core.sortActivities(activities).map(item => item.id), [3, 7, 8]);
  assert.deepEqual(core.calculate([
    {atividade_id: 3, tipo: 'MOD', value: '12,5'},
    {atividade_id: 7, tipo: 'MOI', value: '1'},
    {atividade_id: 8, tipo: 'MOI', value: '0,5'},
  ]), {MOD: 12.5, MOI: 1.5, total: 14, valid: true, invalid: []});
});

test('desktop e mobile podem enviar o mesmo payload pelo POST único', async () => {
  const calls = [];
  const api = {post: async (path, body) => {calls.push({path, body}); return {lancado: true};}};
  const options = {data: '2026-10-17', grupo_setor: '12', activities,
    values: {3: '12,5', 7: '1', 8: '0,5'}};
  const result = await core.saveGroup(api, options);
  assert.equal(result.totals.total, 14);
  assert.equal(calls[0].path, '/api/maodeobra/grupo');
  assert.deepEqual(calls[0].body, {data: '2026-10-17', grupo_setor: '12', sem_producao: false,
    itens: [{atividade_id: 8, quantidade_pessoas: 0.5},
      {atividade_id: 3, quantidade_pessoas: 12.5},
      {atividade_id: 7, quantidade_pessoas: 1}]});
  await assert.rejects(core.saveGroup(api, {...options, values: {...options.values, 3: '1,25'}}),
    /0,5 em 0,5/);
  assert.equal(calls.length, 1);
});

test('sem produção zera os itens; timeout consulta o dia antes de reenviar', async () => {
  const api = {
    post: async (_path, body) => ({lancado: true, sem_producao: body.sem_producao}),
    get: async () => ({lancado: true, sem_producao: true, motivo: 'Chuva', itens: activities.map(item =>
      ({atividade_id: item.id, quantidade_pessoas: 0}))}),
  };
  const {payload} = await core.saveGroup(api, {data: '2026-10-17', grupo_setor: '12',
    activities, values: {3: '12,5', 7: '1', 8: '1,25'}, sem_producao: true, motivo: 'Chuva'});
  assert.equal(payload.motivo, 'Chuva');
  assert.ok(payload.itens.every(item => item.quantidade_pessoas === 0));
  const check = await core.readBeforeRetry(api, payload);
  assert.equal(check.matches, true);
});

test('timeout confirma no GET antes de permitir novo envio; divergência preserva o erro', async () => {
  const options = {data: '2026-10-17', grupo_setor: '12', activities,
    values: {3: '12,5', 7: '1', 8: '0,5'}};
  let posts = 0;
  const api = {
    post: async () => {posts++; throw new TypeError('Falha de rede');},
    get: async () => ({lancado: true, sem_producao: false,
      itens: [{atividade_id: 3, quantidade_pessoas: 12.5},
        {atividade_id: 7, quantidade_pessoas: 1}, {atividade_id: 8, quantidade_pessoas: 0.5}]}),
  };
  const result = await core.saveGroup(api, options);
  assert.equal(result.confirmedAfterTimeout, true);
  assert.equal(posts, 1);
  api.get = async () => ({lancado: false, sem_producao: false, itens: []});
  await assert.rejects(core.saveGroup(api, options), /Falha de rede/);
  assert.equal(posts, 2);
});

test('confirmação usa o carimbo salvo_em e detecta edição sem duplicar cálculo', async () => {
  const values = {3: '12,5', 7: '1', 8: '0,5'};
  const day = {lancado: true, itens: [
    {atividade_id: 3, quantidade_pessoas: 12.5},
    {atividade_id: 7, quantidade_pessoas: 1},
    {atividade_id: 8, quantidade_pessoas: 0.5},
  ]};
  assert.equal(core.hasEdits(activities, values, day), false);
  assert.equal(core.hasEdits(activities, {...values, 3: '13'}, day), true);
  const calls = [];
  const api = {post: async (path, body) => {calls.push({path, body}); return {confirmado: true};}};
  await core.saveGroup(api, {data:'2026-10-17', grupo_setor:'12', activities, values, confirmar:true});
  assert.equal(calls[0].body.confirmar, true);
  await core.confirmGroup(api, {data:'2026-10-17', grupo_setor:'12', salvo_em:'2026-10-17T17:00:00Z'});
  assert.deepEqual(calls[1], {path:'/api/maodeobra/grupo/confirmar', body:{
    data:'2026-10-17', grupo_setor:'12', salvo_em:'2026-10-17T17:00:00Z',
  }});
  await assert.rejects(core.confirmGroup(api, {data:'2026-10-17', grupo_setor:'12'}), /Recarregue/);
});
