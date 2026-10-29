const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../unificado/relatorios/acmp-concretagem/confirmacao.js'), 'utf8');

async function render(pode_confirmar) {
  const root = {innerHTML: '', querySelectorAll: () => [], querySelector: () => ({
    addEventListener(_type, callback) { root.filterHandler = callback; }
  })};
  const snapshot = {data: '2026-10-29', pode_confirmar, formas: [
    {setor: 'Setor 1', forma: 'AE-13', lado: 'Esquerda', posicao: 1, concretada: true, confirmada: false},
    {setor: 'Setor 1', forma: 'AE-14', lado: 'Esquerda', posicao: 2, concretada: true, confirmada: true},
    {setor: 'Setor 1', forma: 'AE-15', lado: 'Esquerda', posicao: 3, concretada: false, confirmada: false},
  ]};
  let printed;
  const context = {
    document: {getElementById: id => id === 'confirmacao-formas' ? root : null},
    window: {onAcmpView: (_data, _selected, forms) => { printed = forms; }},
    fetch: async () => ({ok: true, json: async () => snapshot}),
    console,
  };
  vm.runInNewContext(source, context);
  await context.window.loadConfirmacaoFormas(snapshot.data);
  const allHtml = root.innerHTML;
  root.filterHandler({target: {checked: true}});
  return {allHtml, filteredHtml: root.innerHTML, printed};
}

test('all forms remain in physical order and the filter finds pending confirmations', async () => {
  const {allHtml, filteredHtml, printed} = await render(true);
  assert.match(allHtml, /AE-13/);
  assert.match(allHtml, /AE-14/);
  assert.match(allHtml, /AE-15/);
  assert.match(filteredHtml, /AE-13/);
  assert.match(filteredHtml, /Confirmar produção/);
  assert.doesNotMatch(filteredHtml, /AE-14/);
  assert.doesNotMatch(filteredHtml, /AE-15/);
  assert.equal(printed.length, 3);
});

test('other users see who can confirm instead of unexplained disabled buttons', async () => {
  const {allHtml} = await render(false);
  assert.match(allHtml, /Confirmação reservada a José Carlos da Silva ou administrador/);
  assert.doesNotMatch(allHtml, /data-confirm-index/);
});
