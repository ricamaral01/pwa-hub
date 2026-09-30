'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const catalog = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'modelos-formas.js'), 'utf8');
const section = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));
const context = {
  window: {},
  normalizeUpper: value => String(value || '').trim().toUpperCase()
};

vm.runInNewContext(catalog, context);
vm.runInNewContext(
  section('const SETOR_1_LEFT_FORMS =', 'function getSectorForms(setor)')
    + section('window.getModelosForFormaS3 = function(forma)', 'window.renderSequenciaS3 ='),
  context
);

test('produção oferece os modelos cadastrados para cada grupo de forma circular', () => {
  const pequenas = context.getProductionModelOptions('SC01', 'Setor 3', 'SC');
  const grandes = context.getProductionModelOptions('SC40', 'Setor 3', 'SC');
  const finais = context.getProductionModelOptions('SC52', 'Setor 3', 'SC');

  assert.ok(pequenas.includes('7x300'));
  assert.ok(pequenas.includes('9x200'));
  assert.ok(!pequenas.includes('25x1000'));
  assert.ok(grandes.includes('14x600'));
  assert.ok(!grandes.includes('25x1000'));
  assert.ok(!grandes.includes('7x300'));
  assert.ok(finais.includes('25x1000'));
  assert.ok(finais.includes('20x3000'));
  assert.ok(!pequenas.includes('SC'));
  assert.ok(!grandes.includes('SC'));
  assert.ok(!Object.values(context.window.PRODUCTION_MODELS_BY_FORMA['Setor 3']).flat().includes('Nova'));
});

test('produção mantém o modelo específico das formas dos outros setores', () => {
  assert.deepEqual(Array.from(context.getProductionModelOptions('AE-01', 'Setor 1')), ['1 CX VR']);
  assert.deepEqual(Array.from(context.getProductionModelOptions('A-10', 'Setor 2')), ['1 CX VR']);
  assert.deepEqual(Array.from(context.getProductionModelOptions('C-F1-1', 'Setor 4')), ['6,0 x 90']);
  assert.ok(context.getProductionModelOptions('DTB 01', 'Setor 4').includes('12x600'));
  assert.ok(!context.getProductionModelOptions('DTB 01', 'Setor 4').includes('25x600'));
  assert.ok(context.getProductionModelOptions('DTBM 02', 'Setor 4').includes('25x600'));
  assert.ok(context.getProductionModelOptions('DTD 01', 'Setor 4').includes('12x200'));
});

test('produto gravado acompanha o modelo dimensional escolhido', () => {
  context.getPosteFieldsForForma = () => ({ codigoPoste: 'DTB', descricaoPoste: 'Genérico', codigoProduto: '13580' });
  vm.runInNewContext(
    section('function getProductionPosteFields(', 'function dateToYmd('),
    context
  );
  const sc = context.getProductionPosteFields('SC01', 'Setor 3', '9x200', { dataset: {} });
  const dt = context.getProductionPosteFields('DTB 01', 'Setor 4', '12x600', { dataset: { codigoPoste: 'DTB', codigoProduto: '13580' } });
  const semCodigo = context.getProductionPosteFields('DTB 01', 'Setor 4', '7x300', { dataset: { codigoPoste: 'DTB', codigoProduto: '13580' } });

  assert.equal(sc.descricaoPoste, '9x200');
  assert.equal(dt.codigoProduto, '914');
  assert.equal(dt.descricaoPoste, '12x600 DT');
  assert.equal(semCodigo.codigoProduto, '');
  assert.equal(semCodigo.descricaoPoste, '7x300 DT');
});

test('modelo escolhido substitui SC no apontamento e no registro local já liberado', async () => {
  const record = {
    id: 'registro-1', dataFabricacao: '2026-09-30', setor: 'Setor 3',
    formaNumero: 'SC01', modelo: 'SC', liberacao: { status: 'L' }
  };
  const badge = { textContent: '', style: {} };
  const card = { dataset: { modelo: 'SC' }, querySelector: selector => selector === '.fc-tipo' ? badge : null };
  let sent;
  let saved;
  const saveContext = {
    el: { libData: { value: '2026-09-30' } },
    getProductionCollaborator: () => 'Mario',
    setCardState: () => {},
    postToApiWithTimeout: async (_action, payload) => { sent = payload; return { ok: false, skipped: true }; },
    getPosteFieldsForForma: () => ({ codigoPoste: '', descricaoPoste: '', codigoProduto: '' }),
    getProductionPosteFields: (_forma, _setor, modelo) => ({ codigoPoste: '', descricaoPoste: modelo, codigoProduto: '' }),
    readDb: () => ({ records: [record], events: [] }),
    findRecordByKey: () => record,
    normalizeUpper: value => String(value || '').trim().toUpperCase(),
    upsertRecord: () => {},
    addEvent: () => {},
    writeDb: db => { saved = db; },
    uuid: () => 'evento-1',
    nowIso: () => '2026-09-30T12:00:00Z',
    markFormaClicked: () => {},
    updateSectorCounters: () => {},
    setSyncStatus: () => {},
    showLibFeedback: () => {}
  };
  vm.runInNewContext(
    section('function formatFormaConcreteBadge(record)', 'function getClickedFormsToday()')
      + section('async function salvarFormaClicada(', 'function getInspecaoCodeOptions('),
    saveContext
  );

  await saveContext.salvarFormaClicada('SC01', 'Setor 3', card, '9x300', 'Concreto Segregado');
  assert.equal(sent.modelo, '9x300');
  assert.equal(saved.records[0].modelo, '9x300');
  assert.equal(card.dataset.modelo, '9x300');
  assert.match(badge.textContent, /9x300/);
});
