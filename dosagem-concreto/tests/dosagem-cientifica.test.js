'use strict';

const assert = require('node:assert/strict');
const dc = require('../dosagem-cientifica.js');

const peneiras = dc.PENEIRAS_PADRAO;
const agregados = [
    { chave:'an', nome:'Areia Natural', rho:2.63, curva:[100,100,100,100,100,99,85,65,40,15,3,0.5] },
    { chave:'ai', nome:'Areia Industrial', rho:2.66, curva:[100,100,100,100,100,95,72,50,30,12,4,1.5] },
    { chave:'b0', nome:'Brita 0', rho:2.68, curva:[100,100,100,95,45,8,2,1,0.5,0,0,0] },
    { chave:'b1', nome:'Brita 1/2', rho:2.70, curva:[100,95,40,10,2,1,0.5,0,0,0,0,0] }
];

const resultado = dc.calcularDosagemPorCimento({
    peneiras,
    cimentoKgM3: 380,
    relacaoAguaCimento: 0.45,
    arPct: 2.5,
    adicaoKgM3: 50,
    aditivoKgM3: 3.8,
    rho: { cim:3.12, adic:2.70, agua:1, adit:1.10 },
    agregados,
    dmax: 19,
    expoenteFuller: 0.45,
    otimizacao: { passoPct: 10 }
});

assert.equal(resultado.metodo, 'cimento_curva');
assert.ok(Math.abs(resultado.volumeTotalLitros - 1000) < 0.01);
assert.equal(resultado.massas.cim, 380);
assert.equal(resultado.massas.agua, 171);
assert.ok(resultado.massas.an + resultado.massas.ai + resultado.massas.b0 + resultado.massas.b1 > 1000);
assert.ok(resultado.erroCurvaRmse >= 0);
assert.equal(Object.values(resultado.participacaoAgregadosPct).reduce((s, v) => s + v, 0), 100);

const volume = dc.calcularDosagemPorVolumeAbsoluto({
    arPct: 2.5,
    materiais: [
        { chave:'cim', nome:'Cimento', massaKg:380, rho:3.12, usar:true },
        { chave:'an', nome:'Areia', massaKg:800, rho:2.63, usar:true },
        { chave:'b1', nome:'Brita', massaKg:750, rho:2.70, usar:true },
        { chave:'agua', nome:'Agua', massaKg:180, rho:1, usar:true }
    ]
});

assert.equal(volume.metodo, 'volume_absoluto');
assert.ok(Math.abs(volume.volumeTotalLitros - 1000) < 0.01);
assert.ok(volume.fatorEscala > 1);
assert.ok(volume.traco.agua > 0);

assert.throws(() => dc.calcularDosagemPorCimento({
    cimentoKgM3: 380,
    rho: { cim:3.12, agua:1 },
    agregados: [{ chave:'an', nome:'Areia', rho:0, curva:peneiras.map(() => 100) }]
}), /massa especifica/i);

console.log('dosagem-cientifica: testes concluidos com sucesso');
