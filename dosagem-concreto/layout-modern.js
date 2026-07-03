(function () {
    'use strict';

    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('modernMenuToggle');
    const overlay = document.getElementById('modernSidebarOverlay');
    const loadModal = document.getElementById('dosLoadModal');
    const openLoadModal = document.getElementById('dosOpenLoadModal');
    const closeLoadModal = document.getElementById('dosCloseLoadModal');
    const confirmLoadModal = document.getElementById('dosConfirmLoadModal');

    function placeDosagemIdentification() {
        const card = document.querySelector('#sec-dosagem > .card');
        const subtitle = card && card.querySelector(':scope > .subtitle');
        const identification = document.getElementById('dos-carta-box');
        if (card && subtitle && identification) subtitle.insertAdjacentElement('afterend', identification);
    }

    placeDosagemIdentification();
    document.addEventListener('DOMContentLoaded', placeDosagemIdentification);

    const argamassaCampos = [
        { chave:'cim', nome:'Cimento', massa:'dos_cim', rho:'dos_rho_cim', categoria:'argamassa' },
        { chave:'adic', nome:'Adição / filler / outros finos', massa:'dos_adic', rho:'dos_rho_adic', categoria:'argamassa' },
        { chave:'an', nome:'Areia natural', massa:'dos_an', rho:'dos_rho_an', categoria:'argamassa' },
        { chave:'an2', nome:'Areia natural 2', massa:'dos_an2', rho:'dos_rho_an2', categoria:'argamassa', wrapper:'dos-an2-wrap' },
        { chave:'ai', nome:'Areia industrial / pó de pedra', massa:'dos_ai', rho:'dos_rho_ai', categoria:'argamassa' },
        { chave:'agua', nome:'Água', massa:'dos_agua', rho:'dos_rho_agua', categoria:'argamassa' },
        { chave:'adit', nome:'Aditivo', massa:'dos_adit', rho:'dos_rho_adit', categoria:'argamassa' },
        { chave:'adit2', nome:'Aditivo 2', massa:'dos_adit2', rho:'dos_rho_adit2', categoria:'argamassa', wrapper:'dos-adit2-wrap' },
        { chave:'b0', nome:'Brita 0', massa:'dos_b0', rho:'dos_rho_b0', categoria:'graudo' },
        { chave:'b1', nome:'Brita ½', massa:'dos_b1', rho:'dos_rho_b1', categoria:'graudo' }
    ];

    function campoNumero(id) {
        const value = Number(document.getElementById(id)?.value);
        return Number.isFinite(value) ? value : 0;
    }

    window.calcularTaxaArgamassaDaTela = function () {
        if (!window.ArgamassaCalculo) throw new Error('Módulo de cálculo da argamassa indisponível.');
        const materiais = argamassaCampos.map(function (campo) {
            const visivel = !campo.wrapper || document.getElementById(campo.wrapper)?.style.display !== 'none';
            return {
                chave: campo.chave,
                nome: campo.nome,
                massa_kg: visivel ? campoNumero(campo.massa) : 0,
                massa_especifica_kg_l: campo.chave === 'agua' ? 1 : campoNumero(campo.rho),
                categoria: campo.categoria
            };
        });
        return window.ArgamassaCalculo.calcularTaxaArgamassa(materiais);
    };

    function formatarNumero(value, digits) {
        return Number(value).toLocaleString('pt-BR', { minimumFractionDigits:digits, maximumFractionDigits:digits });
    }

    function renderTaxaArgamassa() {
        const status = document.getElementById('dos-argamassa-status');
        const message = document.getElementById('dos-argamassa-message');
        if (!status || !message) return;
        document.querySelectorAll('.arg-density-error').forEach(item => item.classList.remove('arg-density-error'));

        try {
            const result = window.calcularTaxaArgamassaDaTela();
            const classificacao = window.ArgamassaCalculo.classificarTaxa(result.seco.taxa_argamassa_massa_pct);
            const set = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
            
            // Real / Úmida
            set('arg-taxa-massa', `${formatarNumero(result.taxa_argamassa_massa_pct, 1)}%`);
            set('arg-taxa-volume', `${formatarNumero(result.taxa_argamassa_volume_pct, 1)}%`);
            set('arg-massa', `${formatarNumero(result.massa_argamassa_kg, 1)} kg`);
            set('arg-volume', `${formatarNumero(result.volume_argamassa_l, 1)} L`);
            set('arg-volume-total', `${formatarNumero(result.volume_total_l, 1)} L`);

            // Seco / Tradicional
            set('arg-taxa-massa-seca', `${formatarNumero(result.seco.taxa_argamassa_massa_pct, 1)}%`);
            set('arg-taxa-volume-seca', `${formatarNumero(result.seco.taxa_argamassa_volume_pct, 1)}%`);
            set('arg-massa-seca', `${formatarNumero(result.seco.massa_argamassa_kg, 1)} kg`);
            set('arg-volume-seca', `${formatarNumero(result.seco.volume_argamassa_l, 1)} L`);
            set('arg-volume-total-seca', `${formatarNumero(result.seco.volume_total_l, 1)} L`);

            status.textContent = classificacao.charAt(0).toUpperCase() + classificacao.slice(1);
            status.className = `dos-argamassa-status is-${classificacao}`;
            message.textContent = classificacao === 'baixo'
                ? 'Taxa Seca abaixo de 48%: teor de argamassa seco baixo.'
                : classificacao === 'adequado'
                    ? 'Taxa Seca entre 48% e 55%: teor de argamassa seco adequado.'
                    : 'Taxa Seca acima de 55%: teor de argamassa seco alto.';
            message.className = `dos-argamassa-message is-${classificacao}`;
            
            const memory = document.getElementById('dos-argamassa-memory');
            if (memory) {
                const listItems = result.memoria_de_calculo.materiais.map(item =>
                    `<div><span>${item.nome}</span><strong>${formatarNumero(item.massa_kg,1)} kg ÷ ${item.massa_especifica_kg_l ? formatarNumero(item.massa_especifica_kg_l,3) : '—'} kg/L = ${formatarNumero(item.volume_absoluto_l,1)} L</strong></div>`
                ).join('');

                const dryExclusions = ['agua', 'adit', 'adit2'];
                const mArgRealList = result.memoria_de_calculo.materiais.filter(i => i.categoria === 'argamassa');
                const mTotalRealList = result.memoria_de_calculo.materiais;
                const mArgSecaList = mArgRealList.filter(i => !dryExclusions.includes(i.chave));
                const mTotalSecaList = mTotalRealList.filter(i => !dryExclusions.includes(i.chave));

                const formulaExplanation = `
                <div style="border-top:1px dashed #ccc; margin: 12px 0; padding-top: 10px; font-size:0.85rem; line-height: 1.5;">
                    <strong style="color: #1a5276; display: block; margin-bottom: 4px;">💧 Abordagem Real / Úmida (Inclui Água e Aditivos)</strong>
                    <strong>Massa da Argamassa:</strong> ${mArgRealList.map(i => `${formatarNumero(i.massa_kg, 1)}kg (${i.nome.split(' ')[0]})`).join(' + ')} = <strong>${formatarNumero(result.massa_argamassa_kg, 1)} kg</strong><br>
                    <strong>Massa Total Concreto:</strong> ${mTotalRealList.map(i => `${formatarNumero(i.massa_kg, 1)}kg (${i.nome.split(' ')[0]})`).join(' + ')} = <strong>${formatarNumero(result.massa_total_kg, 1)} kg</strong><br>
                    <strong>Taxa em Massa Real:</strong> ${result.memoria_de_calculo.formula_massa_real} = <strong>${formatarNumero(result.taxa_argamassa_massa_pct, 1)}%</strong><br>
                    <strong>Taxa em Volume Real:</strong> ${result.memoria_de_calculo.formula_volume_real} = <strong>${formatarNumero(result.taxa_argamassa_volume_pct, 1)}%</strong>
                    
                    <div style="border-top:1px dashed #ccc; margin: 12px 0; padding-top: 10px;"></div>
                    <strong style="color: #7f8c8d; display: block; margin-bottom: 4px;">🪵 Abordagem Seca / Tradicional (Apenas Sólidos — IPT/ABNT)</strong>
                    <strong>Massa da Argamassa Seca:</strong> ${mArgSecaList.map(i => `${formatarNumero(i.massa_kg, 1)}kg (${i.nome.split(' ')[0]})`).join(' + ')} = <strong>${formatarNumero(result.seco.massa_argamassa_kg, 1)} kg</strong><br>
                    <strong>Massa Total Seca:</strong> ${mTotalSecaList.map(i => `${formatarNumero(i.massa_kg, 1)}kg (${i.nome.split(' ')[0]})`).join(' + ')} = <strong>${formatarNumero(result.seco.massa_total_kg, 1)} kg</strong><br>
                    <strong>Taxa em Massa Seca:</strong> ${result.memoria_de_calculo.formula_massa_seca} = <strong>${formatarNumero(result.seco.taxa_argamassa_massa_pct, 1)}%</strong><br>
                    <strong>Taxa em Volume Seca:</strong> ${result.memoria_de_calculo.formula_volume_seca} = <strong>${formatarNumero(result.seco.taxa_argamassa_volume_pct, 1)}%</strong>
                </div>`;

                memory.innerHTML = listItems + formulaExplanation;
            }
            return result;
        } catch (error) {
            ['arg-taxa-massa','arg-taxa-volume','arg-massa','arg-volume','arg-volume-total',
             'arg-taxa-massa-seca','arg-taxa-volume-seca','arg-massa-seca','arg-volume-seca','arg-volume-total-seca'].forEach(id => {
                const element = document.getElementById(id); if (element) element.textContent = '—';
            });
            status.textContent = 'Dados incompletos';
            status.className = 'dos-argamassa-status is-pending';
            message.textContent = error.message;
            message.className = 'dos-argamassa-message is-pending';
            argamassaCampos.forEach(campo => {
                if (campo.chave !== 'agua' && campoNumero(campo.massa) > 0 && campoNumero(campo.rho) <= 0) {
                    document.getElementById(campo.rho)?.classList.add('arg-density-error');
                }
            });
            return null;
        }
    }

    argamassaCampos.forEach(function (campo) {
        [campo.massa, campo.rho].forEach(function (id) {
            document.getElementById(id)?.addEventListener('input', renderTaxaArgamassa);
        });
    });

    if (typeof window.calcularDosagem === 'function') {
        const originalCalcularDosagem = window.calcularDosagem;
        window.calcularDosagem = function () {
            const result = originalCalcularDosagem.apply(this, arguments);
            renderTaxaArgamassa();
            return result;
        };
    }

    ['toggleAn2','toggleAdit2'].forEach(function (name) {
        if (typeof window[name] !== 'function') return;
        const originalToggle = window[name];
        window[name] = function () {
            const result = originalToggle.apply(this, arguments);
            renderTaxaArgamassa();
            return result;
        };
    });

    renderTaxaArgamassa();

    function setLoadModal(open) {
        if (!loadModal) return;
        loadModal.classList.toggle('is-open', open);
        loadModal.setAttribute('aria-hidden', String(!open));
        body.style.overflow = open ? 'hidden' : '';
        if (open && typeof window.dosCarregarSelectCartas === 'function') window.dosCarregarSelectCartas();
    }

    if (openLoadModal) openLoadModal.addEventListener('click', function () { setLoadModal(true); });
    if (closeLoadModal) closeLoadModal.addEventListener('click', function () { setLoadModal(false); });
    if (loadModal) loadModal.addEventListener('click', function (event) { if (event.target === loadModal) setLoadModal(false); });
    if (confirmLoadModal) confirmLoadModal.addEventListener('click', function () {
        const selected = document.getElementById('dos-carregar-sel');
        if (selected && selected.value) setTimeout(function () { setLoadModal(false); }, 50);
    });

    function setNavigation(open) {
        body.classList.toggle('modern-nav-open', open);
        if (toggle) toggle.setAttribute('aria-expanded', String(open));
        if (overlay) overlay.setAttribute('aria-hidden', String(!open));
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            setNavigation(!body.classList.contains('modern-nav-open'));
        });
    }

    if (overlay) overlay.addEventListener('click', function () { setNavigation(false); });

    if (sidebar) {
        sidebar.addEventListener('click', function (event) {
            if (event.target.closest('.sidebar-btn') && window.innerWidth <= 980) setNavigation(false);
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setNavigation(false);
            setLoadModal(false);
        }
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 980) setNavigation(false);
    });

    if (typeof window.showSection === 'function') {
        const originalShowSection = window.showSection;
        window.showSection = function (id, btn) {
            const result = originalShowSection.apply(this, arguments);
            body.classList.toggle('modern-home-active', id === 'sec-hub');
            document.querySelectorAll('.sidebar-btn').forEach(function (item) {
                item.classList.toggle('active', item.dataset.sec === id);
            });
            setNavigation(false);
            return result;
        };
    }

    body.classList.toggle('modern-home-active', document.querySelector('.section.active')?.id === 'sec-hub');
})();
