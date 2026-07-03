(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.ArgamassaCalculo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function numero(value, campo) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${campo}: massa inválida.`);
        return parsed;
    }

    function calcularTaxaArgamassa(materiais) {
        if (!Array.isArray(materiais) || materiais.length === 0) {
            throw new Error('Informe ao menos um material para calcular a taxa de argamassa.');
        }

        const memoriaMateriais = materiais.map(function (material) {
            const nome = material.nome || material.chave || 'Material';
            const massa = numero(material.massa_kg, nome);
            const rho = material.chave === 'agua' ? 1 : Number(material.massa_especifica_kg_l);

            if (massa > 0 && (!Number.isFinite(rho) || rho <= 0)) {
                throw new Error(`${nome}: informe manualmente a massa específica em kg/L.`);
            }

            const volume = massa > 0 ? massa / rho : 0;
            return {
                chave: material.chave,
                nome,
                categoria: material.categoria === 'graudo' ? 'graudo' : 'argamassa',
                massa_kg: massa,
                massa_especifica_kg_l: massa > 0 ? rho : (Number.isFinite(rho) ? rho : null),
                volume_absoluto_l: volume
            };
        });

        const argamassa = memoriaMateriais.filter(item => item.categoria === 'argamassa');
        const soma = (lista, campo) => lista.reduce((total, item) => total + item[campo], 0);
        const massaArgamassa = soma(argamassa, 'massa_kg');
        const massaTotal = soma(memoriaMateriais, 'massa_kg');
        const volumeArgamassa = soma(argamassa, 'volume_absoluto_l');
        const volumeTotal = soma(memoriaMateriais, 'volume_absoluto_l');

        const dryExclusions = ['agua', 'adit', 'adit2'];
        const materiaisSeco = memoriaMateriais.filter(item => !dryExclusions.includes(item.chave));
        const argamassaSeco = materiaisSeco.filter(item => item.categoria === 'argamassa');
        const massaArgamassaSeco = soma(argamassaSeco, 'massa_kg');
        const massaTotalSeco = soma(materiaisSeco, 'massa_kg');
        const volumeArgamassaSeco = soma(argamassaSeco, 'volume_absoluto_l');
        const volumeTotalSeco = soma(materiaisSeco, 'volume_absoluto_l');

        return {
            taxa_argamassa_massa_pct: massaTotal > 0 ? massaArgamassa / massaTotal * 100 : 0,
            taxa_argamassa_volume_pct: volumeTotal > 0 ? volumeArgamassa / volumeTotal * 100 : 0,
            massa_argamassa_kg: massaArgamassa,
            massa_total_kg: massaTotal,
            volume_argamassa_l: volumeArgamassa,
            volume_total_l: volumeTotal,
            seco: {
                taxa_argamassa_massa_pct: massaTotalSeco > 0 ? massaArgamassaSeco / massaTotalSeco * 100 : 0,
                taxa_argamassa_volume_pct: volumeTotalSeco > 0 ? volumeArgamassaSeco / volumeTotalSeco * 100 : 0,
                massa_argamassa_kg: massaArgamassaSeco,
                massa_total_kg: massaTotalSeco,
                volume_argamassa_l: volumeArgamassaSeco,
                volume_total_l: volumeTotalSeco
            },
            memoria_de_calculo: {
                criterio_real: 'Real/Úmido: Inclui cimento, água, aditivos, adições/filler, areias e pó de pedra.',
                criterio_seco: 'Seco/Tradicional (ABNT/IPT): Inclui apenas cimento, adições/filler e areias (água e aditivos excluídos).',
                formula_massa_real: 'massa_argamassa_real / massa_total_real × 100',
                formula_volume_real: 'volume_argamassa_real / volume_total_real × 100',
                formula_massa_seca: 'massa_argamassa_seca / massa_total_seca × 100',
                formula_volume_seca: 'volume_argamassa_seca / volume_total_seca × 100',
                conversao_volume: 'massa_kg / massa_especifica_kg_l',
                materiais: memoriaMateriais
            }
        };
    }

    function classificarTaxa(taxa) {
        if (taxa < 48) return 'baixo';
        if (taxa <= 55) return 'adequado';
        return 'alto';
    }

    return { calcularTaxaArgamassa, classificarTaxa };
});
