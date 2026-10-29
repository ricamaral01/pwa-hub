'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'unificado/pcp/static/js/etiquetas.js'), 'utf8');

function labelsFor({ schedule = [], production = [], saques = [], mode = 'sc' }) {
  const context = {
    document: { body: { dataset: { labelMode: mode } }, addEventListener() {} },
    API: { get: async url => url.includes('programacao-circular-s' + (mode === 'dt' ? '4' : '3')) ? schedule
      : url.includes('circular-formas') ? production : saques },
    showToast() {},
    URLSearchParams,
    console,
  };
  vm.runInNewContext(source, context);
  return context.buscarProgramacao('2026-10-22', '3');
}

test('etiquetas SC mostram forma programada mesmo sem saque de mandril', async () => {
  const rows = await labelsFor({ schedule: [{ codigo_forma: 'SC01', modelo: '9x200' }] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].codigo_forma, 'SC01');
  assert.equal(rows[0].modelo_sc, '9X200');
  assert.equal(rows[0].quantidade_programada, 1);
});

test('etiquetas SC não duplicam forma e usam modelo produzido quando disponível', async () => {
  const rows = await labelsFor({
    schedule: [{ codigo_forma: 'SC02', modelo: '9x200' }],
    production: [{ forma: 'SC02', tipo_programado: '9x200', tipo_realizado: '11x300', programado: 1, realizado: 1 }],
    saques: [{ codigo_forma: 'SC02' }],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].modelo_sc, '11X300');
});

test('etiquetas SC também aceitam programação anterior vinda da produção', async () => {
  const rows = await labelsFor({
    production: [{ forma: 'SC03', tipo_programado: '10x250', programado: 1, realizado: 0 }],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].modelo_sc, '10X250');
});

test('etiquetas do setor 4 mostram apenas formas DT programadas no setor 4', async () => {
  const rows = await labelsFor({mode: 'dt', schedule: [{codigo_forma: 'DT15', modelo: '14X1000'}],
    production: [{forma: 'SC01', tipo_realizado: '9X200', realizado: 1}]});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].codigo_forma, 'DT15');
  assert.equal(rows[0].modelo_dt, '14X1000');
  assert.equal(rows[0].setor_id, 4);
});
