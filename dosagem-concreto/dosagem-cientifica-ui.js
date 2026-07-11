'use strict';

(function () {
    const MAT_META = [
        { chave:'an', nome:'Areia Natural', grupo:'miudo', massa:'dos_an', rho:'dos_rho_an', rhoMat:'rho_an' },
        { chave:'ai', nome:'Areia Industrial', grupo:'miudo', massa:'dos_ai', rho:'dos_rho_ai', rhoMat:'rho_ai' },
        { chave:'b0', nome:'Brita 0', grupo:'graudo', massa:'dos_b0', rho:'dos_rho_b0', rhoMat:'rho_b0' },
        { chave:'b1', nome:'Brita 1/2', grupo:'graudo', massa:'dos_b1', rho:'dos_rho_b1', rhoMat:'rho_b1' }
    ];
    const CAMPOS_MASSA = ['dos_cim','dos_adic','dos_an','dos_ai','dos_b0','dos_b1','dos_agua','dos_adit','dos_adit2'];
    const PENEIRAS_FALLBACK = [25, 19, 12.5, 9.5, 6.3, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];
    let ultimoResultado = null;

    function byId(id) { return document.getElementById(id); }
    function n(id, padrao) {
        const el = byId(id);
        const val = Number(el && el.value);
        return Number.isFinite(val) ? val : (padrao || 0);
    }
    function set(id, valor) {
        const el = byId(id);
        if (!el) return;
        el.value = Number.isFinite(valor) ? String(Math.round((valor + Number.EPSILON) * 10) / 10) : '';
        el.dispatchEvent(new Event('input', { bubbles:true }));
        el.dispatchEvent(new Event('change', { bubbles:true }));
    }
    function fmt(v, c) {
        if (v == null || !Number.isFinite(Number(v))) return '-';
        return Number(v).toLocaleString('pt-BR', { minimumFractionDigits:c || 0, maximumFractionDigits:c == null ? 1 : c });
    }
    function peneiras() {
        return Array.isArray(window.PENEIRAS) ? window.PENEIRAS : PENEIRAS_FALLBACK;
    }
    function curva(chave) {
        return peneiras().map(p => n(`gran_${chave}_${p}`, 0));
    }
    function rho(chave) {
        const meta = MAT_META.find(m => m.chave === chave);
        return n(meta.rho, 0) || n(meta.rhoMat, 0);
    }
    function curvasPreenchidas() {
        return MAT_META.some(m => curva(m.chave).some(v => v > 0));
    }
    function syncRhos() {
        if (typeof window.sincronizarRhosDosagem === 'function') window.sincronizarRhosDosagem();
        set('dos_rho_agua', 1);
    }

    function criarPainel() {
        const card = document.querySelector('#sec-dosagem > .card');
        if (!card || byId('dc-sci-panel')) return;
        const anchor = byId('dosagem-modo-box') || card.querySelector('.info-box');
        const panel = document.createElement('section');
        panel.id = 'dc-sci-panel';
        panel.className = 'dc-sci-panel';
        panel.innerHTML = `
            <div class="dc-sci-head">
                <div>
                    <span class="dc-sci-eyebrow">Dosagem cientifica por volume absoluto</span>
                    <h3>Metodo de dosagem por curva granulometrica</h3>
                    <p>Leia a curva da aba Materiais, selecione os agregados e calcule o traco por fechamento volumetrico de 1 m3.</p>
                </div>
                <button type="button" class="dc-sci-btn" id="dc-sci-read">Ler curva da aba Materiais</button>
            </div>
            <div class="dc-sci-grid">
                <label>Metodo
                    <select id="dc-sci-method">
                        <option value="cimento_curva">Cimento + curva granulometrica</option>
                        <option value="volume_absoluto">Volume absoluto dos materiais atuais</option>
                    </select>
                </label>
                <label>Cimento (kg/m3)<input type="number" id="dc-sci-cim" value="${n('dos_cim', 380)}" step="1"></label>
                <label>Relacao a/c<input type="number" id="dc-sci-ac" value="0.45" step="0.01" min="0.25" max="0.8"></label>
                <label>Ar (%)<input type="number" id="dc-sci-ar" value="${n('dos_ar', 2.5)}" step="0.1" min="0" max="10"></label>
                <label>Adicao (kg/m3)<input type="number" id="dc-sci-adic" value="${n('dos_adic', 0)}" step="1"></label>
                <label>Aditivo (% cimento)<input type="number" id="dc-sci-adit-pct" value="1.0" step="0.05" min="0"></label>
                <label>Dmax Fuller (mm)<input type="number" id="dc-sci-dmax" value="19" step="0.5"></label>
                <label>Expoente Fuller<input type="number" id="dc-sci-n" value="0.45" step="0.01"></label>
            </div>
            <div class="dc-sci-materials">
                ${MAT_META.map(m => `
                    <label class="dc-sci-check">
                        <input type="checkbox" id="dc-sci-use-${m.chave}" checked>
                        <span><strong>${m.nome}</strong><small id="dc-sci-rho-${m.chave}">rho ${fmt(rho(m.chave), 2)} kg/L</small></span>
                    </label>
                `).join('')}
            </div>
            <div class="dc-sci-actions">
                <button type="button" class="dc-sci-primary" id="dc-sci-calc">Calcular dosagem</button>
                <button type="button" class="dc-sci-btn" id="dc-sci-apply" disabled>Aplicar no traco atual</button>
                <span id="dc-sci-status"></span>
            </div>
            <div id="dc-sci-result" class="dc-sci-result"></div>
        `;
        anchor.parentNode.insertBefore(panel, anchor.nextSibling);
        injectCss();
        bind();
        atualizarStatusCurva();
    }

    function bind() {
        byId('dc-sci-read').addEventListener('click', () => {
            syncRhos();
            atualizarStatusCurva();
        });
        byId('dc-sci-calc').addEventListener('click', calcular);
        byId('dc-sci-apply').addEventListener('click', aplicar);
        byId('dc-sci-method').addEventListener('change', atualizarModo);
        MAT_META.forEach(m => byId(`dc-sci-use-${m.chave}`).addEventListener('change', atualizarStatusCurva));
        atualizarModo();
    }

    function atualizarModo() {
        const volume = byId('dc-sci-method').value === 'volume_absoluto';
        ['dc-sci-ac','dc-sci-adit-pct','dc-sci-dmax','dc-sci-n'].forEach(id => {
            const el = byId(id);
            if (el) el.closest('label').style.display = volume ? 'none' : '';
        });
    }

    function atualizarStatusCurva() {
        syncRhos();
        MAT_META.forEach(m => {
            const el = byId(`dc-sci-rho-${m.chave}`);
            if (el) el.textContent = `rho ${fmt(rho(m.chave), 2)} kg/L`;
        });
        const status = byId('dc-sci-status');
        const ok = curvasPreenchidas();
        status.textContent = ok ? 'Curva granulometrica carregada da aba Materiais.' : 'Preencha ou carregue a curva granulometrica na aba Materiais.';
        status.className = ok ? 'ok' : 'warn';
    }

    function agregadosSelecionados() {
        return MAT_META
            .filter(m => byId(`dc-sci-use-${m.chave}`)?.checked)
            .map(m => ({ chave:m.chave, nome:m.nome, grupo:m.grupo, rho:rho(m.chave), curva:curva(m.chave), usar:true }));
    }

    function calcular() {
        try {
            atualizarStatusCurva();
            const dc = window.DosagemCientifica;
            const metodo = byId('dc-sci-method').value;
            if (!dc) throw new Error('Modulo DosagemCientifica nao carregado.');
            if (metodo === 'cimento_curva' && !curvasPreenchidas()) throw new Error('A curva da aba Materiais esta vazia.');
            if (metodo === 'cimento_curva') {
                const cimento = n('dc-sci-cim', 380);
                ultimoResultado = dc.calcularDosagemPorCimento({
                    peneiras: peneiras(),
                    cimentoKgM3: cimento,
                    relacaoAguaCimento: n('dc-sci-ac', 0.45),
                    arPct: n('dc-sci-ar', 2.5),
                    adicaoKgM3: n('dc-sci-adic', 0),
                    aditivoKgM3: cimento * n('dc-sci-adit-pct', 1) / 100,
                    dmax: n('dc-sci-dmax', 19),
                    expoenteFuller: n('dc-sci-n', 0.45),
                    rho: { cim:n('dos_rho_cim', 3.12), adic:n('dos_rho_adic', 2.7), agua:1, adit:n('dos_rho_adit', 1.1) },
                    agregados: agregadosSelecionados(),
                    otimizacao: { passoPct: 5 }
                });
            } else {
                ultimoResultado = dc.calcularDosagemPorVolumeAbsoluto({
                    arPct: n('dc-sci-ar', 2.5),
                    materiais: [
                        { chave:'cim', nome:'Cimento', massaKg:n('dos_cim', 0), rho:n('dos_rho_cim', 3.12), usar:true },
                        { chave:'adic', nome:'Adicao', massaKg:n('dos_adic', 0), rho:n('dos_rho_adic', 2.7), usar:n('dos_adic', 0) > 0 },
                        ...MAT_META.map(m => ({ chave:m.chave, nome:m.nome, massaKg:n(m.massa, 0), rho:rho(m.chave), usar:byId(`dc-sci-use-${m.chave}`)?.checked })),
                        { chave:'agua', nome:'Agua', massaKg:n('dos_agua', 0), rho:1, usar:true },
                        { chave:'adit', nome:'Aditivo', massaKg:n('dos_adit', 0), rho:n('dos_rho_adit', 1.1), usar:n('dos_adit', 0) > 0 }
                    ]
                });
            }
            renderResultado();
            byId('dc-sci-apply').disabled = false;
        } catch (err) {
            byId('dc-sci-result').innerHTML = `<div class="dc-sci-error">${err.message}</div>`;
            byId('dc-sci-apply').disabled = true;
        }
    }

    function renderResultado() {
        const r = ultimoResultado;
        const nomes = { cim:'Cimento', adic:'Adicao', an:'Areia Natural', ai:'Areia Industrial', b0:'Brita 0', b1:'Brita 1/2', agua:'Agua', adit:'Aditivo', ar:'Ar' };
        const linhas = Object.keys(r.volumes).filter(k => k !== 'ar' || r.volumes[k] > 0).map(k => `
            <tr><td>${nomes[k] || k}</td><td>${fmt(r.massas[k] || 0, 1)}</td><td>${fmt(r.volumes[k] || 0, 1)}</td><td>${fmt(r.traco[k] || 0, 3)}</td></tr>
        `).join('');
        const part = Object.entries(r.participacaoAgregadosPct || {}).map(([k, v]) => `${nomes[k] || k}: ${fmt(v, 1)}%`).join(' | ');
        const curva = r.curvaCombinada && r.curvaCombinada.length ? `
            <details class="dc-sci-curve"><summary>Ver curva combinada x Fuller</summary>
            <table><thead><tr><th>Peneira</th><th>Combinada</th><th>Alvo</th></tr></thead><tbody>
            ${peneiras().map((p, i) => `<tr><td>${p}</td><td>${fmt(r.curvaCombinada[i], 1)}%</td><td>${fmt(r.curvaAlvo[i], 1)}%</td></tr>`).join('')}
            </tbody></table></details>` : '';
        byId('dc-sci-result').innerHTML = `
            <div class="dc-sci-summary">
                <strong>Volume fechado: ${fmt(r.volumeTotalLitros, 1)} L</strong>
                <span>Massa total: ${fmt(r.massaTotalKg, 1)} kg/m3</span>
                ${r.erroCurvaRmse != null ? `<span>Erro da curva: ${fmt(r.erroCurvaRmse, 2)} RMSE</span>` : `<span>Fator escala: ${fmt(r.fatorEscala, 4)}</span>`}
            </div>
            ${part ? `<div class="dc-sci-note">Participacao volumetrica dos agregados: ${part}</div>` : ''}
            <table><thead><tr><th>Material</th><th>kg/m3</th><th>L/m3</th><th>Traco/cim</th></tr></thead><tbody>${linhas}</tbody></table>
            <div class="dc-sci-note">${r.memoria.join(' ')}</div>
            ${curva}
        `;
    }

    function aplicar() {
        if (!ultimoResultado) return;
        const m = ultimoResultado.massas;
        CAMPOS_MASSA.forEach(id => {
            const key = id.replace('dos_', '');
            set(id, m[key] || 0);
        });
        set('dos_ar', n('dc-sci-ar', 2.5));
        const usarGran = byId('dos_usar_gran');
        if (usarGran) usarGran.checked = false;
        if (typeof window.toggleModoGran === 'function') window.toggleModoGran();
        if (typeof window.calcularDosagem === 'function') window.calcularDosagem();
        if (typeof window.updateDosagemCockpit === 'function') window.updateDosagemCockpit();
        if (typeof window.syncResumoFieldsFromDosagem === 'function') window.syncResumoFieldsFromDosagem();
        const status = byId('dc-sci-status');
        status.textContent = 'Dosagem aplicada nos campos atuais.';
        status.className = 'ok';
    }

    function injectCss() {
        if (byId('dc-sci-style')) return;
        const style = document.createElement('style');
        style.id = 'dc-sci-style';
        style.textContent = `
            .dc-sci-panel{margin:18px 0;padding:18px;border:2px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#0f172a}
            .dc-sci-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px}
            .dc-sci-eyebrow{display:block;font-size:.75rem;font-weight:800;text-transform:uppercase;color:#0f766e;letter-spacing:.04em}
            .dc-sci-head h3{margin:3px 0 4px;font-size:1.05rem;color:#102a43}
            .dc-sci-head p{margin:0;color:#52616b;font-size:.88rem}
            .dc-sci-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
            .dc-sci-grid label{font-weight:700;font-size:.78rem;color:#334155}
            .dc-sci-grid input,.dc-sci-grid select{width:100%;box-sizing:border-box;margin-top:4px;padding:8px 10px;border:1.5px solid #cbd5e1;border-radius:7px;background:#fff}
            .dc-sci-materials{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:12px 0}
            .dc-sci-check{display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #dbe3ea;border-radius:8px;padding:9px 10px}
            .dc-sci-check span{display:flex;flex-direction:column;gap:1px}.dc-sci-check small{color:#64748b;font-size:.72rem}
            .dc-sci-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}
            .dc-sci-primary,.dc-sci-btn{border:0;border-radius:7px;padding:9px 14px;font-weight:800;cursor:pointer}
            .dc-sci-primary{background:#0f766e;color:#fff}.dc-sci-btn{background:#e2e8f0;color:#102a43}.dc-sci-btn:disabled{opacity:.5;cursor:not-allowed}
            #dc-sci-status{font-size:.82rem;font-weight:700}.ok{color:#047857}.warn{color:#b45309}
            .dc-sci-result{margin-top:12px}.dc-sci-error{padding:10px;border-radius:8px;background:#fee2e2;color:#991b1b;font-weight:700}
            .dc-sci-summary{display:flex;gap:12px;flex-wrap:wrap;padding:10px;background:#ecfeff;border:1px solid #99f6e4;border-radius:8px;margin-bottom:8px}
            .dc-sci-note{font-size:.82rem;color:#475569;margin:8px 0}
            .dc-sci-result table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
            .dc-sci-result th,.dc-sci-result td{padding:8px 9px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:.82rem}
            .dc-sci-result th:first-child,.dc-sci-result td:first-child{text-align:left}
            .dc-sci-curve{margin-top:8px}.dc-sci-curve summary{cursor:pointer;font-weight:800;color:#0f766e}
            @media(max-width:700px){.dc-sci-head{display:block}.dc-sci-actions button{width:100%}}
        `;
        document.head.appendChild(style);
    }

    document.addEventListener('DOMContentLoaded', criarPainel);
})();
