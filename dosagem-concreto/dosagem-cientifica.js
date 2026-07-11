'use strict';

(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.DosagemCientifica = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    const PENEIRAS_PADRAO = [25, 19, 12.5, 9.5, 6.3, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];
    const EPS = 1e-9;

    function numero(valor, padrao) {
        const n = Number(valor);
        return Number.isFinite(n) ? n : padrao;
    }

    function arred(valor, casas) {
        const f = Math.pow(10, casas == null ? 3 : casas);
        return Math.round((valor + Number.EPSILON) * f) / f;
    }

    function validarRho(material) {
        if (!material.rho || material.rho <= 0) {
            throw new Error(`Informe a massa especifica de ${material.nome || material.chave}.`);
        }
    }

    function massaParaVolumeLitros(massaKg, rhoKgL) {
        if (!rhoKgL || rhoKgL <= 0) throw new Error('Massa especifica invalida.');
        return massaKg / rhoKgL;
    }

    function volumeParaMassaKg(volumeL, rhoKgL) {
        if (!rhoKgL || rhoKgL <= 0) throw new Error('Massa especifica invalida.');
        return volumeL * rhoKgL;
    }

    function curvaFuller(peneiras, dmax, expoente) {
        const d = numero(dmax, 19);
        const n = numero(expoente, 0.45);
        return peneiras.map(p => {
            if (p >= d) return 100;
            return arred(Math.max(0, Math.min(100, 100 * Math.pow(p / d, n))), 3);
        });
    }

    function combinarCurvas(materiais, proporcoes) {
        if (!materiais.length) throw new Error('Selecione pelo menos um agregado.');
        const total = proporcoes.reduce((s, v) => s + v, 0);
        if (total <= EPS) throw new Error('As proporcoes dos agregados devem somar mais que zero.');
        const n = materiais[0].curva.length;
        return Array.from({ length: n }, (_, i) => {
            const passante = materiais.reduce((s, mat, idx) => {
                return s + (numero(mat.curva[i], 0) * proporcoes[idx] / total);
            }, 0);
            return arred(Math.max(0, Math.min(100, passante)), 3);
        });
    }

    function erroCurva(curvaAlvo, curvaCombinada, pesos) {
        const e = curvaAlvo.reduce((s, alvo, i) => {
            const peso = pesos && pesos[i] ? pesos[i] : 1;
            const dif = numero(curvaCombinada[i], 0) - numero(alvo, 0);
            return s + peso * dif * dif;
        }, 0);
        return Math.sqrt(e / curvaAlvo.length);
    }

    function gerarCombinacoes(qtd, passoPct) {
        const passo = Math.max(1, Math.round(numero(passoPct, 5)));
        const out = [];
        function rec(pos, restante, atual) {
            if (pos === qtd - 1) {
                out.push([...atual, restante / 100]);
                return;
            }
            for (let v = 0; v <= restante; v += passo) {
                atual.push(v / 100);
                rec(pos + 1, restante - v, atual);
                atual.pop();
            }
        }
        rec(0, 100, []);
        return out;
    }

    function otimizarAgregados(materiais, curvaAlvo, opcoes) {
        const opts = opcoes || {};
        const selecionados = materiais.filter(m => m.usar !== false);
        if (!selecionados.length) throw new Error('Selecione ao menos um agregado para a dosagem.');
        selecionados.forEach(m => {
            if (!Array.isArray(m.curva) || m.curva.length !== curvaAlvo.length) {
                throw new Error(`Curva granulometrica incompleta para ${m.nome || m.chave}.`);
            }
        });
        let melhor = null;
        gerarCombinacoes(selecionados.length, opts.passoPct || 5).forEach(props => {
            if (props.some((p, i) => {
                const min = numero(selecionados[i].min, 0);
                const max = numero(selecionados[i].max, 1);
                return p + EPS < min || p - EPS > max;
            })) return;
            const combinada = combinarCurvas(selecionados, props);
            const erro = erroCurva(curvaAlvo, combinada, opts.pesos);
            if (!melhor || erro < melhor.erro) {
                melhor = { materiais: selecionados, proporcoes: props, curva: combinada, erro };
            }
        });
        if (!melhor) throw new Error('Nao foi encontrada combinacao valida com as restricoes atuais.');
        melhor.participacao = {};
        melhor.materiais.forEach((m, i) => { melhor.participacao[m.chave] = arred(melhor.proporcoes[i] * 100, 2); });
        melhor.erro = arred(melhor.erro, 3);
        return melhor;
    }

    function calcularDosagemPorCimento(input) {
        const peneiras = input.peneiras || PENEIRAS_PADRAO;
        const cimentoKg = numero(input.cimentoKgM3, 0);
        if (cimentoKg <= 0) throw new Error('Informe o consumo de cimento em kg/m3.');
        const ac = numero(input.relacaoAguaCimento, 0.45);
        const arPct = numero(input.arPct, 2);
        const rho = input.rho || {};
        const adicaoKg = numero(input.adicaoKgM3, 0);
        const aditivoKg = numero(input.aditivoKgM3, 0);
        const aguaKg = numero(input.aguaKgM3, cimentoKg * ac);
        const curvaAlvo = input.curvaAlvo || curvaFuller(peneiras, input.dmax || 19, input.expoenteFuller || 0.45);

        ['cim', 'agua'].forEach(k => validarRho({ chave:k, nome:k, rho:rho[k] }));
        const volumesFixos = {
            cim: massaParaVolumeLitros(cimentoKg, rho.cim),
            adic: adicaoKg > 0 ? massaParaVolumeLitros(adicaoKg, rho.adic || 2.7) : 0,
            agua: massaParaVolumeLitros(aguaKg, rho.agua || 1),
            adit: aditivoKg > 0 ? massaParaVolumeLitros(aditivoKg, rho.adit || 1.1) : 0,
            ar: Math.max(0, arPct) * 10
        };
        const volumeAgregados = 1000 - Object.values(volumesFixos).reduce((s, v) => s + v, 0);
        if (volumeAgregados <= 0) throw new Error('Volumes de cimento, agua, adicao, aditivo e ar ultrapassam 1 m3.');

        const materiais = (input.agregados || []).filter(m => m.usar !== false).map(m => ({ ...m, rho: numero(m.rho, 0) }));
        materiais.forEach(validarRho);
        const ajuste = otimizarAgregados(materiais, curvaAlvo, input.otimizacao);
        const massas = { cim: cimentoKg, adic: adicaoKg, agua: aguaKg, adit: aditivoKg, ar: 0 };
        const volumes = { ...volumesFixos };
        ajuste.materiais.forEach((mat, i) => {
            const vol = volumeAgregados * ajuste.proporcoes[i];
            volumes[mat.chave] = arred(vol, 3);
            massas[mat.chave] = arred(volumeParaMassaKg(vol, mat.rho), 3);
        });

        return montarResultado({ massas, volumes, rho, peneiras, curvaAlvo, ajuste, metodo:'cimento_curva' });
    }

    function calcularDosagemPorVolumeAbsoluto(input) {
        const materiais = (input.materiais || []).filter(m => m.usar !== false);
        if (!materiais.length) throw new Error('Selecione materiais e informe massas para calcular o volume absoluto.');
        const massasOriginais = {};
        const volumesOriginais = {};
        materiais.forEach(m => {
            validarRho(m);
            const massa = numero(m.massaKg, 0);
            massasOriginais[m.chave] = massa;
            volumesOriginais[m.chave] = massaParaVolumeLitros(massa, m.rho);
        });
        const arL = Math.max(0, numero(input.arPct, 0)) * 10;
        volumesOriginais.ar = arL;
        const volumeTotal = Object.values(volumesOriginais).reduce((s, v) => s + v, 0);
        if (volumeTotal <= 0) throw new Error('Informe pelo menos uma massa maior que zero.');
        const fator = 1000 / volumeTotal;
        const massas = {};
        const volumes = {};
        materiais.forEach(m => {
            massas[m.chave] = arred(massasOriginais[m.chave] * fator, 3);
            volumes[m.chave] = arred(volumesOriginais[m.chave] * fator, 3);
        });
        volumes.ar = arred(arL * fator, 3);
        massas.ar = 0;
        return montarResultado({
            massas,
            volumes,
            rho: Object.fromEntries(materiais.map(m => [m.chave, m.rho])),
            peneiras: input.peneiras || PENEIRAS_PADRAO,
            curvaAlvo: input.curvaAlvo || [],
            ajuste: null,
            metodo:'volume_absoluto',
            fatorEscala: arred(fator, 5),
            volumeOriginalLitros: arred(volumeTotal, 3)
        });
    }

    function montarResultado(ctx) {
        const cimento = ctx.massas.cim || 0;
        const traco = {};
        Object.keys(ctx.massas).forEach(k => {
            if (k !== 'ar') traco[k] = cimento > 0 ? arred(ctx.massas[k] / cimento, 3) : 0;
        });
        const volumeTotal = Object.values(ctx.volumes).reduce((s, v) => s + v, 0);
        const massaTotal = Object.values(ctx.massas).reduce((s, v) => s + v, 0);
        return {
            metodo: ctx.metodo,
            massas: ctx.massas,
            volumes: ctx.volumes,
            traco,
            volumeTotalLitros: arred(volumeTotal, 3),
            massaTotalKg: arred(massaTotal, 3),
            curvaAlvo: ctx.curvaAlvo,
            curvaCombinada: ctx.ajuste ? ctx.ajuste.curva : [],
            participacaoAgregadosPct: ctx.ajuste ? ctx.ajuste.participacao : {},
            erroCurvaRmse: ctx.ajuste ? ctx.ajuste.erro : null,
            fatorEscala: ctx.fatorEscala || 1,
            volumeOriginalLitros: ctx.volumeOriginalLitros || null,
            memoria: [
                'Metodo dos volumes absolutos: soma(massa/rho) + ar = 1000 L.',
                ctx.ajuste ? 'Agregados proporcionados por ajuste numerico da curva combinada contra Fuller.' : 'Massas informadas foram escaladas para 1 m3 pelo volume absoluto.'
            ]
        };
    }

    function formatarTraco(massas) {
        const cim = massas.cim || 0;
        if (cim <= 0) return '';
        return ['cim', 'adic', 'an', 'ai', 'b0', 'b1', 'agua', 'adit', 'adit2']
            .filter(k => massas[k] > 0)
            .map(k => `${k}:${arred(massas[k] / cim, 3)}`)
            .join(' | ');
    }

    return {
        PENEIRAS_PADRAO,
        curvaFuller,
        combinarCurvas,
        erroCurva,
        otimizarAgregados,
        calcularDosagemPorCimento,
        calcularDosagemPorVolumeAbsoluto,
        massaParaVolumeLitros,
        volumeParaMassaKg,
        formatarTraco
    };
}));
