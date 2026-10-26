const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../unificado/laboratorio/service/server/static/novo/postes/novo.html'), 'utf8');
const asset = html.match(/assets\/(novo-(?:manual|norm)-[a-f0-9]+\.js)/)?.[1];
assert.ok(asset, 'manual limits asset referenced by the page');
const bundle = fs.readFileSync(path.join(__dirname, '../unificado/laboratorio/service/server/static/novo/postes/assets', asset), 'utf8');
const start = bundle.indexOf('function cqManualLimits(');
const end = bundle.indexOf('function Sm(', start);
assert.ok(start > 0 && end > start);
const mn = Object.fromEntries([
  'comprimento', 'largura_base', 'largura_topo', 'espessura_base', 'espessura_topo',
  'diametro_base', 'diametro_topo', 'engastamento', 'furacao_f', 'furacao_j',
].map(key => [key, key]));
const ye = value => value == null || value === '' ? null : Number(value);
const { Rr } = new Function('mn', 'ye', `${bundle.slice(start, end)};return {Rr}`)(mn, ye);
const criteria = { dimensional: {
  usar_nominais_modelo: true, tolerancia_secao_mm: 5,
  tolerancia_comprimento_mm: 50, tolerancia_engastamento_mm: 15,
  tolerancia_furacao_mm: null, fonte: 'Tabela A.1/A.2', modelos: {},
} };
const pole = { tipo: 'C', face: 'C', conicidade: 'A', altura_m: 10,
  resistencia_daN: 250, dimensoes_nominais: {} };
const empty = { checklist: {}, medidas: {}, fonte_limites: '' };
const blank = Rr(empty, pole, criteria);
assert.equal(blank.medidas.diametro_base.origem, 'manual');
assert.equal(blank.medidas.diametro_base.aplicavel, false);
assert.equal(blank.medidas.diametro_base.min_mm, '');
assert.equal(blank.medidas.furacao_f.origem, undefined);

const entered = Rr({ ...empty, medidas: {
  diametro_base: { min_mm: '300', max_mm: '320', leitura_mm: '311' },
} }, pole, criteria);
assert.deepEqual([
  entered.medidas.diametro_base.min_mm,
  entered.medidas.diametro_base.max_mm,
  entered.medidas.diametro_base.leitura_mm,
  entered.medidas.diametro_base.aplicavel,
], ['300', '320', '311', true]);

const sourced = Rr({ ...empty, medidas: {
  diametro_base: { min_mm: '100', max_mm: '400', leitura_mm: '311' },
} }, { ...pole, dimensoes_nominais: { diametro_base: 320 } }, criteria);
assert.equal(sourced.medidas.diametro_base.origem, 'tabela');
assert.equal(sourced.medidas.diametro_base.min_mm, '315');
assert.equal(sourced.medidas.diametro_base.max_mm, '325');
const nonstandard = Rr({ ...empty, medidas: {
  diametro_base: { min_mm: '300', max_mm: '340', leitura_mm: '321' },
} }, { ...pole, nao_normatizado_8451: true,
  dimensoes_nominais: { comprimento: 9000, diametro_base: 320 } }, criteria);
assert.equal(nonstandard.medidas.diametro_base.origem, 'manual');
assert.equal(nonstandard.medidas.diametro_base.min_mm, '300');
assert.equal(nonstandard.medidas.diametro_base.max_mm, '340');
assert.equal(nonstandard.medidas.comprimento.origem, 'tabela');
assert.ok(bundle.includes('Poste não normatizado conforme ABNT NBR 8451'));
assert.ok(bundle.includes('nao_normatizado_8451:q.nao_normatizado_8451===!0'));
console.log('Poste manual limits bundle: OK');
