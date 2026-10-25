const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'unificado/pcp/static/js/etiquetas.js'), 'utf8');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {
    value: '', textContent: '', innerHTML: '',
    style: {setProperty() {}, removeProperty() {}},
  });
  return elements.get(id);
};
const checked = [{value: '0'}];
const document = {
  body: {dataset: {}},
  addEventListener() {},
  getElementById: element,
  querySelectorAll(selector) {
    if (selector === '.poste-check:checked') return checked;
    return [];
  },
  createElement(tag) {
    if (tag === 'canvas') return {getContext: () => ({measureText: text => ({width: text.length * 20})})};
    const div = {innerHTML: ''};
    Object.defineProperty(div, 'textContent', {set(value) { this.innerHTML = String(value); }});
    return div;
  },
};
const context = vm.createContext({document, URLSearchParams, showToast() {}});
vm.runInContext(source, context);
element('f-data').value = '2026-10-15';
element('f-fonte-data').value = '20.16';
element('f-fonte-tipo').value = '29.7';
vm.runInContext(`programacaoDisponivel = [{quantidade_programada: 1,
  codigo_tipo_forma: 'AE', produto: {nome: 'ELEKTRO 1 CX VR', codigo: '4031'},
  setor: {nome: 'Setor 1'}}]`, context);
assert.equal(vm.runInContext('gerarEtiquetasSelecionadas()', context), true);
const output = element('labels-output').innerHTML;
assert.match(output, /15\/10\/26/);
assert.match(output, /class="label-preview label-type"[^>]*><span[^>]*>AE<\/span>/);
assert.doesNotMatch(output, /4031/);

vm.runInContext(`programacaoDisponivel = [{quantidade_programada: 1,
  codigo_tipo_forma: null, produto: {nome: 'POSTE CAIXA LENTE', codigo: '934'},
  setor: {nome: 'Setor 2'}}]`, context);
assert.equal(vm.runInContext('gerarEtiquetasSelecionadas()', context), false);
assert.doesNotMatch(element('labels-output').innerHTML, /934/);

for (const [setor, codigo, esperado] of [
  [2, 'SC 9X200', '9X200'],
  [4, 'DT-12X200', '12X200'],
  [4, 'DT12X200', '12X200'],
]) {
  vm.runInContext(`programacaoDisponivel = [{quantidade_programada: 1,
    codigo_tipo_forma: '${codigo}', produto: {nome: 'POSTE'},
    setor_id: ${setor}, setor: {nome: 'Setor ${setor}'}}]`, context);
  assert.equal(vm.runInContext('gerarEtiquetasSelecionadas()', context), true);
  assert.match(element('labels-output').innerHTML,
    new RegExp(`class="label-preview label-type"[^>]*><span[^>]*>${esperado}<\\/span>`));
  assert.doesNotMatch(element('labels-output').innerHTML, new RegExp(codigo));
}
assert.equal(vm.runInContext("inferCodigoForma({setor_id: 4, codigo_tipo_forma: 'DTB'})", context), 'DTB');

const circularContext = vm.createContext({
  document: {...document, body: {dataset: {labelMode: 'sc'}}},
  URLSearchParams,
  showToast() {},
});
vm.runInContext(source, circularContext);
vm.runInContext(`programacaoDisponivel = [{quantidade_programada: 1,
  modelo_sc: 'SC 9X200', produto: {nome: '9X200'},
  setor_id: 3, setor: {nome: 'Setor 3'}}]`, circularContext);
assert.equal(vm.runInContext('gerarEtiquetasSelecionadas()', circularContext), true);
assert.match(element('labels-output').innerHTML, /class="label-preview label-type"[^>]*><span[^>]*>9X200<\/span>/);
assert.doesNotMatch(element('labels-output').innerHTML, /SC 9X200/);

console.log('standard labels print the selected date and registered type code');
