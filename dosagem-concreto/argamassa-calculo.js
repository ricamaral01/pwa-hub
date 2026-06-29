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

        return {
            taxa_argamassa_massa_pct: massaTotal > 0 ? massaArgamassa / massaTotal * 100 : 0,
            taxa_argamassa_volume_pct: volumeTotal > 0 ? volumeArgamassa / volumeTotal * 100 : 0,
            massa_argamassa_kg: massaArgamassa,
            massa_total_kg: massaTotal,
            volume_argamassa_l: volumeArgamassa,
            volume_total_l: volumeTotal,
            memoria_de_calculo: {
                criterio_argamassa: 'Cimento, água, aditivos, adições/filler, areias, pó de pedra e outros finos.',
                criterio_graudos: 'Britas e demais agregados graúdos.',
                formula_massa: 'massa_argamassa / massa_total_concreto × 100',
                formula_volume: 'volume_argamassa / volume_total_concreto × 100',
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
