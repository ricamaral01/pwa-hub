'use strict';

const assert = require('node:assert/strict');
const { calcularTaxaArgamassa, classificarTaxa } = require('../argamassa-calculo.js');

const materiais = [
    { chave:'cim', nome:'Cimento', massa_kg:380, massa_especifica_kg_l:3.10, categoria:'argamassa' },
    { chave:'adic', nome:'Adição / filler', massa_kg:50, massa_especifica_kg_l:2.70, categoria:'argamassa' },
    { chave:'an', nome:'Areia natural', massa_kg:420, massa_especifica_kg_l:2.63, categoria:'argamassa' },
    { chave:'ai', nome:'Areia industrial', massa_kg:380, massa_especifica_kg_l:2.66, categoria:'argamassa' },
    { chave:'agua', nome:'Água', massa_kg:185, massa_especifica_kg_l:1, categoria:'argamassa' },
    { chave:'adit', nome:'Aditivo', massa_kg:4.5, massa_especifica_kg_l:1.09, categoria:'argamassa' },
    { chave:'b0', nome:'Brita 0', massa_kg:330, massa_especifica_kg_l:2.68, categoria:'graudo' },
    { chave:'b1', nome:'Brita ½', massa_kg:300, massa_especifica_kg_l:2.70, categoria:'graudo' }
];

const resultado = calcularTaxaArgamassa(materiais);
assert.equal(resultado.massa_argamassa_kg, 1419.5);
assert.equal(resultado.massa_total_kg, 2049.5);
assert.ok(Math.abs(resultado.taxa_argamassa_massa_pct - 69.2608) < 0.001);
assert.ok(resultado.volume_argamassa_l > 0);
assert.ok(resultado.volume_total_l > resultado.volume_argamassa_l);
assert.equal(resultado.memoria_de_calculo.materiais.length, 8);
assert.equal(classificarTaxa(47.9), 'baixo');
assert.equal(classificarTaxa(48), 'adequado');
assert.equal(classificarTaxa(55), 'adequado');
assert.equal(classificarTaxa(55.1), 'alto');

assert.throws(() => calcularTaxaArgamassa([
    { chave:'cim', nome:'Cimento', massa_kg:100, massa_especifica_kg_l:0, categoria:'argamassa' }
]), /informe manualmente/i);

console.log('argamassa-calculo: testes concluídos com sucesso');
