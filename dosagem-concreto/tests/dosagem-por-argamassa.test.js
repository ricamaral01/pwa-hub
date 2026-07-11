'use strict';

const assert = require('node:assert/strict');
const dosagem = require('../dosagem-por-argamassa.js');

const entradaBase = {
    aguaKg: 185,
    relacaoAguaCimento: 0.45,
    aditivoPctCimento: 1,
    teorArgamassaPct: 52,
    teorArPct: 2.5,
    distribuicaoAreiasPct: {
        areiaFina: 35,
        areiaMedia: 30,
        areiaIndustrial: 35
    },
    distribuicaoBritasPct: {
        brita0: 45,
        brita1: 55
    },
    massasEspecificas: {
        cimento: 3.12,
        areiaFina: 2.63,
        areiaMedia: 2.64,
        areiaIndustrial: 2.66,
        brita0: 2.68,
        brita1: 2.70,
        agua: 1,
        aditivo: 1.08
    }
};

const porMassa = dosagem.calcularDosagem({ ...entradaBase, criterioTeor:'massa_seca' });
assert.ok(Math.abs(porMassa.massas.cimento - (185 / 0.45)) < 0.001);
assert.ok(Math.abs(porMassa.volumeTotalLitros - 1000) < 0.001);
assert.ok(Math.abs(porMassa.teores.massaSecaPct - 52) < 0.001);
assert.ok(Math.abs(porMassa.teorAtingidoPct - porMassa.teorAlvoPct) < 0.001);
assert.ok(Math.abs(porMassa.massas.areiaFina / porMassa.grupos.areiasKg * 100 - 35) < 0.001);
assert.ok(Math.abs(porMassa.massas.areiaMedia / porMassa.grupos.areiasKg * 100 - 30) < 0.001);
assert.ok(Math.abs(porMassa.massas.brita0 / porMassa.grupos.britasKg * 100 - 45) < 0.001);
assert.equal(porMassa.tracoUnitario.agua, 0.45);

const porVolume = dosagem.calcularDosagem({
    ...entradaBase,
    criterioTeor:'volume_seco',
    teorArgamassaPct: 54
});
assert.ok(Math.abs(porVolume.volumeTotalLitros - 1000) < 0.001);
assert.ok(Math.abs(porVolume.teores.volumeSecoPct - 54) < 0.001);
assert.ok(Math.abs(porVolume.teorAtingidoPct - 54) < 0.001);
assert.notEqual(porVolume.teores.massaSecaPct, porVolume.teores.volumeSecoPct);

assert.throws(() => dosagem.calcularDosagem({
    ...entradaBase,
    criterioTeor:'massa_seca',
    distribuicaoAreiasPct: { areiaFina:40, areiaMedia:30, areiaIndustrial:20 }
}), /deve somar 100%/i);

assert.throws(() => dosagem.calcularDosagem({
    ...entradaBase,
    criterioTeor:'massa_seca',
    massasEspecificas: { ...entradaBase.massasEspecificas, brita0:0 }
}), /massa especifica/i);

assert.throws(() => dosagem.calcularDosagem({
    ...entradaBase,
    criterioTeor:'volume_seco',
    teorArgamassaPct: 5
}), /cimento sozinho/i);

console.log('dosagem-por-argamassa: testes concluidos com sucesso');
