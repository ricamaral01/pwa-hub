'use strict';

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.DosagemPorArgamassa = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const EPS = 1e-9;
    const CHAVES_AREIAS = ['areiaFina', 'areiaMedia', 'areiaIndustrial'];
    const CHAVES_BRITAS = ['brita0', 'brita1'];

    function numero(valor, campo) {
        const parsed = typeof valor === 'string'
            ? Number(valor.trim().replace(',', '.'))
            : Number(valor);
        if (!Number.isFinite(parsed)) throw new Error(`${campo}: informe um numero valido.`);
        return parsed;
    }

    function positivo(valor, campo, aceitarZero) {
        const parsed = numero(valor, campo);
        if (aceitarZero ? parsed < 0 : parsed <= 0) {
            throw new Error(`${campo}: informe um valor ${aceitarZero ? 'maior ou igual a zero' : 'maior que zero'}.`);
        }
        return parsed;
    }

    function arredondar(valor, casas) {
        const fator = Math.pow(10, casas == null ? 3 : casas);
        return Math.round((valor + Number.EPSILON) * fator) / fator;
    }

    function arredondarMapa(mapa, casas) {
        return Object.fromEntries(Object.entries(mapa).map(([chave, valor]) => [chave, arredondar(valor, casas)]));
    }

    function validarDistribuicao(distribuicao, chaves, nome) {
        const percentuais = {};
        chaves.forEach(chave => {
            percentuais[chave] = positivo(distribuicao && distribuicao[chave], `${nome} - ${chave}`, true);
        });
        const soma = Object.values(percentuais).reduce((total, valor) => total + valor, 0);
        if (Math.abs(soma - 100) > 0.05) {
            throw new Error(`A distribuicao de ${nome} deve somar 100%. Soma atual: ${arredondar(soma, 2)}%.`);
        }
        return Object.fromEntries(chaves.map(chave => [chave, percentuais[chave] / soma]));
    }

    function validarMassasEspecificas(rhos, fracoesAreias, fracoesBritas, aditivoKg) {
        const resultado = {
            cimento: positivo(rhos && rhos.cimento, 'Massa especifica do cimento'),
            agua: positivo(rhos && rhos.agua, 'Massa especifica da agua'),
            aditivo: aditivoKg > EPS
                ? positivo(rhos && rhos.aditivo, 'Massa especifica do aditivo')
                : positivo((rhos && rhos.aditivo) || 1, 'Massa especifica do aditivo')
        };

        CHAVES_AREIAS.forEach(chave => {
            if (fracoesAreias[chave] > EPS) {
                resultado[chave] = positivo(rhos && rhos[chave], `Massa especifica de ${chave}`);
            } else {
                resultado[chave] = positivo((rhos && rhos[chave]) || 1, `Massa especifica de ${chave}`);
            }
        });
        CHAVES_BRITAS.forEach(chave => {
            if (fracoesBritas[chave] > EPS) {
                resultado[chave] = positivo(rhos && rhos[chave], `Massa especifica de ${chave}`);
            } else {
                resultado[chave] = positivo((rhos && rhos[chave]) || 1, `Massa especifica de ${chave}`);
            }
        });
        return resultado;
    }

    function coeficienteVolume(fracoes, rhos, chaves) {
        return chaves.reduce((total, chave) => total + fracoes[chave] / rhos[chave], 0);
    }

    function somar(mapa, chaves) {
        return chaves.reduce((total, chave) => total + (mapa[chave] || 0), 0);
    }

    function calcularTeores(massas, volumes) {
        const massaAreias = somar(massas, CHAVES_AREIAS);
        const massaBritas = somar(massas, CHAVES_BRITAS);
        const volumeAreias = somar(volumes, CHAVES_AREIAS);
        const volumeBritas = somar(volumes, CHAVES_BRITAS);
        const massaArgamassaSeca = massas.cimento + massaAreias;
        const massaTotalSeca = massaArgamassaSeca + massaBritas;
        const volumeArgamassaSeca = volumes.cimento + volumeAreias;
        const volumeTotalSeco = volumeArgamassaSeca + volumeBritas;
        const massaArgamassaReal = massaArgamassaSeca + massas.agua + massas.aditivo;
        const massaTotalReal = massaArgamassaReal + massaBritas;
        const volumeArgamassaReal = volumeArgamassaSeca + volumes.agua + volumes.aditivo;
        const volumeTotalReal = volumeArgamassaReal + volumeBritas;

        return {
            massaSecaPct: massaTotalSeca > 0 ? massaArgamassaSeca / massaTotalSeca * 100 : 0,
            volumeSecoPct: volumeTotalSeco > 0 ? volumeArgamassaSeca / volumeTotalSeco * 100 : 0,
            massaRealPct: massaTotalReal > 0 ? massaArgamassaReal / massaTotalReal * 100 : 0,
            volumeRealPct: volumeTotalReal > 0 ? volumeArgamassaReal / volumeTotalReal * 100 : 0,
            massaArgamassaSecaKg: massaArgamassaSeca,
            volumeArgamassaSecaL: volumeArgamassaSeca
        };
    }

    function calcularDosagem(entrada) {
        const dados = entrada || {};
        const aguaKg = positivo(dados.aguaKg, 'Agua');
        const relacaoAC = positivo(dados.relacaoAguaCimento, 'Relacao agua/cimento');
        const aditivoPct = positivo(dados.aditivoPctCimento == null ? 0 : dados.aditivoPctCimento, 'Percentual de aditivo', true);
        const teorArPct = positivo(dados.teorArPct == null ? 0 : dados.teorArPct, 'Teor de ar', true);
        const teorArgamassaPct = positivo(dados.teorArgamassaPct, 'Teor de argamassa');
        const criterio = dados.criterioTeor || 'massa_seca';

        if (!['massa_seca', 'volume_seco'].includes(criterio)) {
            throw new Error('Criterio do teor de argamassa invalido.');
        }
        if (relacaoAC >= 1) throw new Error('Relacao agua/cimento: informe um valor menor que 1,00.');
        if (teorArPct >= 100) throw new Error('Teor de ar: informe um valor menor que 100%.');
        if (teorArgamassaPct >= 100) throw new Error('Teor de argamassa: informe um valor menor que 100%.');

        const fracoesAreias = validarDistribuicao(dados.distribuicaoAreiasPct, CHAVES_AREIAS, 'areias');
        const fracoesBritas = validarDistribuicao(dados.distribuicaoBritasPct, CHAVES_BRITAS, 'britas');
        const cimentoKg = aguaKg / relacaoAC;
        const aditivoKg = cimentoKg * aditivoPct / 100;
        const rhos = validarMassasEspecificas(dados.massasEspecificas || {}, fracoesAreias, fracoesBritas, aditivoKg);
        const volumeArL = teorArPct * 10;
        const volumesFixos = {
            cimento: cimentoKg / rhos.cimento,
            agua: aguaKg / rhos.agua,
            aditivo: aditivoKg / rhos.aditivo,
            ar: volumeArL
        };
        const volumeFixoTotal = Object.values(volumesFixos).reduce((total, valor) => total + valor, 0);
        const volumeAgregadosL = 1000 - volumeFixoTotal;
        if (volumeAgregadosL <= 0) {
            throw new Error('Cimento, agua, aditivo e ar ocupam todo o volume disponivel de 1 m3.');
        }

        const volumePorKgAreias = coeficienteVolume(fracoesAreias, rhos, CHAVES_AREIAS);
        const volumePorKgBritas = coeficienteVolume(fracoesBritas, rhos, CHAVES_BRITAS);
        const alfa = teorArgamassaPct / 100;
        let areiaTotalKg;
        let britaTotalKg;

        if (criterio === 'massa_seca') {
            const massaTotalSeca = (volumeAgregadosL + cimentoKg * volumePorKgAreias)
                / (alfa * volumePorKgAreias + (1 - alfa) * volumePorKgBritas);
            areiaTotalKg = alfa * massaTotalSeca - cimentoKg;
            britaTotalKg = (1 - alfa) * massaTotalSeca;
        } else {
            const volumeTotalSeco = 1000 - volumesFixos.agua - volumesFixos.aditivo - volumesFixos.ar;
            const volumeAreiasL = alfa * volumeTotalSeco - volumesFixos.cimento;
            const volumeBritasL = (1 - alfa) * volumeTotalSeco;
            areiaTotalKg = volumeAreiasL / volumePorKgAreias;
            britaTotalKg = volumeBritasL / volumePorKgBritas;
        }

        if (areiaTotalKg < -EPS) {
            throw new Error('Teor de argamassa inviavel: o cimento sozinho ultrapassa o teor solicitado. Aumente o teor de argamassa.');
        }
        if (britaTotalKg < -EPS) {
            throw new Error('Teor de argamassa inviavel: nao restou volume para as britas. Reduza o teor de argamassa.');
        }
        areiaTotalKg = Math.max(0, areiaTotalKg);
        britaTotalKg = Math.max(0, britaTotalKg);

        const massas = {
            cimento: cimentoKg,
            areiaFina: areiaTotalKg * fracoesAreias.areiaFina,
            areiaMedia: areiaTotalKg * fracoesAreias.areiaMedia,
            areiaIndustrial: areiaTotalKg * fracoesAreias.areiaIndustrial,
            brita0: britaTotalKg * fracoesBritas.brita0,
            brita1: britaTotalKg * fracoesBritas.brita1,
            agua: aguaKg,
            aditivo: aditivoKg
        };
        const volumes = {
            cimento: massas.cimento / rhos.cimento,
            areiaFina: massas.areiaFina / rhos.areiaFina,
            areiaMedia: massas.areiaMedia / rhos.areiaMedia,
            areiaIndustrial: massas.areiaIndustrial / rhos.areiaIndustrial,
            brita0: massas.brita0 / rhos.brita0,
            brita1: massas.brita1 / rhos.brita1,
            agua: massas.agua / rhos.agua,
            aditivo: massas.aditivo / rhos.aditivo,
            ar: volumeArL
        };
        const teoresBrutos = calcularTeores(massas, volumes);
        const volumeTotalLitros = Object.values(volumes).reduce((total, valor) => total + valor, 0);
        const massaTotalKg = Object.values(massas).reduce((total, valor) => total + valor, 0);
        const tracoUnitario = Object.fromEntries(
            Object.entries(massas).map(([chave, massa]) => [chave, massa / cimentoKg])
        );
        const teorAtingidoPct = criterio === 'massa_seca' ? teoresBrutos.massaSecaPct : teoresBrutos.volumeSecoPct;

        return {
            criterioTeor: criterio,
            teorAlvoPct: arredondar(teorArgamassaPct, 3),
            teorAtingidoPct: arredondar(teorAtingidoPct, 3),
            desvioTeorPct: arredondar(teorAtingidoPct - teorArgamassaPct, 6),
            relacaoAguaCimento: arredondar(relacaoAC, 4),
            aditivoPctCimento: arredondar(aditivoPct, 3),
            teorArPct: arredondar(teorArPct, 3),
            massas: arredondarMapa(massas, 3),
            volumes: arredondarMapa(volumes, 3),
            massasEspecificas: arredondarMapa(rhos, 4),
            distribuicaoAreiasPct: arredondarMapa(Object.fromEntries(CHAVES_AREIAS.map(chave => [chave, fracoesAreias[chave] * 100])), 3),
            distribuicaoBritasPct: arredondarMapa(Object.fromEntries(CHAVES_BRITAS.map(chave => [chave, fracoesBritas[chave] * 100])), 3),
            grupos: {
                areiasKg: arredondar(areiaTotalKg, 3),
                areiasL: arredondar(somar(volumes, CHAVES_AREIAS), 3),
                britasKg: arredondar(britaTotalKg, 3),
                britasL: arredondar(somar(volumes, CHAVES_BRITAS), 3)
            },
            teores: arredondarMapa(teoresBrutos, 3),
            tracoUnitario: arredondarMapa(tracoUnitario, 4),
            volumeTotalLitros: arredondar(volumeTotalLitros, 3),
            fechamentoLitros: arredondar(volumeTotalLitros - 1000, 6),
            massaTotalKg: arredondar(massaTotalKg, 3),
            memoria: {
                cimento: 'C = agua / (a/c)',
                aditivo: 'Aditivo = cimento x percentual / 100',
                volume: 'Soma(massa / massa especifica) + volume de ar = 1000 L',
                teorMassa: 'alfa = (cimento + areias) / (cimento + areias + britas)',
                teorVolume: 'alfa = (volume do cimento + volumes das areias) / volume total seco'
            }
        };
    }

    function formatarTraco(resultado, casas) {
        if (!resultado || !resultado.tracoUnitario) return '';
        const digitos = casas == null ? 3 : casas;
        const t = resultado.tracoUnitario;
        return [
            `1 cimento`,
            `${arredondar(t.areiaFina, digitos)} areia fina`,
            `${arredondar(t.areiaMedia, digitos)} areia media`,
            `${arredondar(t.areiaIndustrial, digitos)} areia industrial`,
            `${arredondar(t.brita0, digitos)} brita 0`,
            `${arredondar(t.brita1, digitos)} brita 1/2`,
            `a/c ${arredondar(resultado.relacaoAguaCimento, 3)}`
        ].join(' : ');
    }

    return {
        CHAVES_AREIAS,
        CHAVES_BRITAS,
        calcularDosagem,
        formatarTraco
    };
});
