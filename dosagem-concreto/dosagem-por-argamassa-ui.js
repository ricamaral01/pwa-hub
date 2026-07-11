'use strict';

(function () {
    const SECTION_ID = 'sec-dosagem-argamassa';
    const STORAGE_KEY = 'ct_dosagem_por_argamassa_v1';
    const MATERIAIS = [
        { chave:'cimento', nome:'Cimento', grupo:'-', rho:'ta-rho-cimento' },
        { chave:'areiaFina', nome:'Areia natural fina', grupo:'areiaFina', rho:'ta-rho-areia-fina' },
        { chave:'areiaMedia', nome:'Areia natural m&eacute;dia', grupo:'areiaMedia', rho:'ta-rho-areia-media' },
        { chave:'areiaIndustrial', nome:'Areia industrial', grupo:'areiaIndustrial', rho:'ta-rho-areia-industrial' },
        { chave:'brita0', nome:'Brita 0', grupo:'brita0', rho:'ta-rho-brita0' },
        { chave:'brita1', nome:'Brita 1/2', grupo:'brita1', rho:'ta-rho-brita1' },
        { chave:'agua', nome:'&Aacute;gua', grupo:'-', rho:'ta-rho-agua' },
        { chave:'aditivo', nome:'Aditivo', grupo:'-', rho:'ta-rho-aditivo' }
    ];
    let ultimoResultado = null;
    let restaurouDados = false;

    function byId(id) {
        return document.getElementById(id);
    }

    function valor(id) {
        return Number(byId(id)?.value);
    }

    function formatar(valorNumero, casas) {
        const numero = Number(valorNumero);
        if (!Number.isFinite(numero)) return '-';
        return numero.toLocaleString('pt-BR', {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas
        });
    }

    function criarNavegacao() {
        const botaoDosagem = document.querySelector('#sidebar .sidebar-btn[data-sec="sec-dosagem"]');
        if (botaoDosagem && !document.querySelector(`#sidebar .sidebar-btn[data-sec="${SECTION_ID}"]`)) {
            const botao = document.createElement('button');
            botao.className = 'sidebar-btn';
            botao.dataset.sec = SECTION_ID;
            botao.type = 'button';
            botao.setAttribute('onclick', `showSection('${SECTION_ID}',this)`);
            botao.innerHTML = '<span class="sb-num">2B</span><span class="sb-icon">&alpha;</span><span class="sb-label">Dosagem por Argamassa</span>';
            botaoDosagem.insertAdjacentElement('afterend', botao);
        }

        const opcaoDosagem = document.querySelector('#quickSectionSelect option[value="sec-dosagem"]');
        if (opcaoDosagem && !document.querySelector(`#quickSectionSelect option[value="${SECTION_ID}"]`)) {
            const opcao = document.createElement('option');
            opcao.value = SECTION_ID;
            opcao.textContent = 'Dosagem por teor de argamassa';
            opcaoDosagem.insertAdjacentElement('afterend', opcao);
        }

        const cardDosagem = document.querySelector('#sec-hub .hub-card[onclick*="sec-dosagem"]');
        if (cardDosagem && !document.querySelector(`#sec-hub .hub-card[data-target="${SECTION_ID}"]`)) {
            const card = document.createElement('button');
            card.className = 'hub-card';
            card.type = 'button';
            card.dataset.target = SECTION_ID;
            card.setAttribute('onclick', `showSection('${SECTION_ID}')`);
            card.innerHTML = '<span class="hub-icon">&alpha;</span><span class="hub-title">Dosagem por Argamassa</span><span class="hub-desc">&Aacute;gua, A/C, distribui&ccedil;&atilde;o dos agregados e teor alvo</span>';
            cardDosagem.insertAdjacentElement('afterend', card);
        }
    }

    function criarPagina() {
        if (byId(SECTION_ID)) return;
        const workspace = document.querySelector('.app-layout');
        if (!workspace) return;
        const pagina = document.createElement('div');
        pagina.id = SECTION_ID;
        pagina.className = 'section ta-page';
        pagina.innerHTML = `
            <div class="card">
                <div class="ta-page-head">
                    <div>
                        <span class="ta-eyebrow">Dosagem 2 &middot; volume absoluto</span>
                        <h2><span class="ta-alpha">&alpha;</span> Dosagem por Teor de Argamassa</h2>
                        <p class="subtitle">Composi&ccedil;&atilde;o para 1 m&sup3; com tr&ecirc;s areias, duas britas e fechamento volum&eacute;trico.</p>
                    </div>
                    <button type="button" class="ta-btn ta-btn-secondary" id="ta-sync-rhos">Puxar densidades da Dosagem 1</button>
                </div>

                <div class="ta-formula-strip" aria-label="Sequencia de calculo">
                    <div><span>1</span><strong>Cimento</strong><small>C = &aacute;gua / (a/c)</small></div>
                    <div><span>2</span><strong>Aditivo</strong><small>C x percentual</small></div>
                    <div><span>3</span><strong>Agregados</strong><small>Teor e distribui&ccedil;&otilde;es</small></div>
                    <div><span>4</span><strong>Fechamento</strong><small>Volumes + ar = 1.000 L</small></div>
                </div>

                <form id="ta-form" novalidate>
                    <fieldset class="ta-band">
                        <legend>Par&acirc;metros da mistura</legend>
                        <div class="ta-grid ta-grid-main">
                            <label>&Aacute;gua efetiva (kg/m&sup3;)
                                <input type="number" id="ta-agua" value="185" min="1" step="1" inputmode="decimal">
                            </label>
                            <label>Rela&ccedil;&atilde;o &aacute;gua/cimento
                                <input type="number" id="ta-ac" value="0.45" min="0.20" max="0.99" step="0.01" inputmode="decimal">
                            </label>
                            <label>Aditivo (% do cimento)
                                <input type="number" id="ta-aditivo-pct" value="1.00" min="0" step="0.05" inputmode="decimal">
                            </label>
                            <label>Teor de argamassa alvo (%)
                                <input type="number" id="ta-teor-argamassa" value="52" min="1" max="99" step="0.1" inputmode="decimal">
                            </label>
                            <label>Ar incorporado (%)
                                <input type="number" id="ta-ar" value="2.5" min="0" max="20" step="0.1" inputmode="decimal">
                            </label>
                        </div>
                        <div class="ta-criterion-row">
                            <span>Base do teor</span>
                            <div class="ta-segmented" role="radiogroup" aria-label="Base do teor de argamassa">
                                <label><input type="radio" name="ta-criterio" value="massa_seca" checked><span>Massa seca (IPT)</span></label>
                                <label><input type="radio" name="ta-criterio" value="volume_seco"><span>Volume absoluto seco</span></label>
                            </div>
                            <small>&Aacute;gua e aditivo n&atilde;o entram no teor seco.</small>
                        </div>
                    </fieldset>

                    <div class="ta-two-col">
                        <fieldset class="ta-band ta-distribution">
                            <legend>Distribui&ccedil;&atilde;o das areias</legend>
                            <div class="ta-total-line"><span>Percentuais em massa no grupo</span><strong id="ta-total-areias">100,0%</strong></div>
                            <label>Areia natural fina (%)<input type="number" id="ta-pct-areia-fina" value="35" min="0" max="100" step="0.1"></label>
                            <label>Areia natural m&eacute;dia (%)<input type="number" id="ta-pct-areia-media" value="30" min="0" max="100" step="0.1"></label>
                            <label>Areia industrial (%)<input type="number" id="ta-pct-areia-industrial" value="35" min="0" max="100" step="0.1"></label>
                        </fieldset>

                        <fieldset class="ta-band ta-distribution">
                            <legend>Distribui&ccedil;&atilde;o das britas</legend>
                            <div class="ta-total-line"><span>Percentuais em massa no grupo</span><strong id="ta-total-britas">100,0%</strong></div>
                            <label>Brita 0 (%)<input type="number" id="ta-pct-brita0" value="45" min="0" max="100" step="0.1"></label>
                            <label>Brita 1/2 (%)<input type="number" id="ta-pct-brita1" value="55" min="0" max="100" step="0.1"></label>
                        </fieldset>
                    </div>

                    <fieldset class="ta-band">
                        <legend>Massas espec&iacute;ficas (kg/L ou g/cm&sup3;)</legend>
                        <div class="ta-grid ta-density-grid">
                            <label>Cimento<input type="number" id="ta-rho-cimento" value="3.12" min="0.1" step="0.01"></label>
                            <label>Areia natural fina<input type="number" id="ta-rho-areia-fina" value="2.63" min="0.1" step="0.01"></label>
                            <label>Areia natural m&eacute;dia<input type="number" id="ta-rho-areia-media" value="2.63" min="0.1" step="0.01"></label>
                            <label>Areia industrial<input type="number" id="ta-rho-areia-industrial" value="2.66" min="0.1" step="0.01"></label>
                            <label>Brita 0<input type="number" id="ta-rho-brita0" value="2.68" min="0.1" step="0.01"></label>
                            <label>Brita 1/2<input type="number" id="ta-rho-brita1" value="2.70" min="0.1" step="0.01"></label>
                            <label>&Aacute;gua<input type="number" id="ta-rho-agua" value="1.000" min="0.1" step="0.001"></label>
                            <label>Aditivo<input type="number" id="ta-rho-aditivo" value="1.080" min="0.1" step="0.001"></label>
                        </div>
                    </fieldset>

                    <div class="ta-page-actions">
                        <button type="submit" class="ta-btn ta-btn-primary" id="ta-calcular">Calcular dosagem</button>
                        <button type="button" class="ta-btn ta-btn-quiet" id="ta-reset">Restaurar valores iniciais</button>
                        <span id="ta-form-status" role="status" aria-live="polite"></span>
                    </div>
                </form>

                <div id="ta-resultado" class="ta-result" aria-live="polite"></div>
            </div>
        `;
        workspace.appendChild(pagina);
    }

    function criarEstilos() {
        if (byId('ta-page-styles')) return;
        const style = document.createElement('style');
        style.id = 'ta-page-styles';
        style.textContent = `
            .ta-page{overflow-x:hidden}.ta-page .card{width:100%;max-width:1240px;margin:0 auto;box-sizing:border-box}.ta-page .card *{box-sizing:border-box}
            .ta-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:1px solid #d7dee7;padding-bottom:18px;margin-bottom:16px}
            .ta-page-head h2{margin:5px 0 4px;color:#16324f;letter-spacing:0}.ta-page-head .subtitle{margin:0}
            .ta-eyebrow{font-size:.72rem;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:0}.ta-alpha{display:inline-grid;place-items:center;width:32px;height:32px;background:#0f766e;color:#fff;border-radius:6px;margin-right:7px;font-size:1.25rem}
            .ta-formula-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #d7dee7;border-radius:8px;margin:0 0 18px;background:#fff;overflow:hidden}
            .ta-formula-strip>div{display:grid;grid-template-columns:28px 1fr;column-gap:8px;align-items:center;padding:11px 12px;border-right:1px solid #d7dee7;min-width:0}.ta-formula-strip>div:last-child{border-right:0}
            .ta-formula-strip span{grid-row:1/3;display:grid;place-items:center;width:26px;height:26px;border:1px solid #0f766e;border-radius:50%;color:#0f766e;font-weight:900}.ta-formula-strip strong{font-size:.82rem;color:#16324f}.ta-formula-strip small{font-size:.72rem;color:#64748b;white-space:normal}
            .ta-band{border:1px solid #d7dee7;border-radius:8px;padding:14px 16px 16px;margin:0 0 14px;background:#f8fafc;min-width:0}.ta-band legend{padding:0 7px;color:#16324f;font-size:.86rem;font-weight:900}
            .ta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:11px}.ta-grid label,.ta-distribution label{display:flex;flex-direction:column;gap:5px;color:#334155;font-size:.78rem;font-weight:800;min-width:0}
            .ta-grid input,.ta-distribution input{width:100%;height:40px;border:1px solid #b8c3d1;border-radius:6px;background:#fff;color:#102a43;padding:7px 9px;font-size:.9rem;box-sizing:border-box}.ta-grid input:focus,.ta-distribution input:focus{outline:2px solid #5eead4;outline-offset:1px;border-color:#0f766e}
            .ta-criterion-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid #d7dee7}.ta-criterion-row>span{font-size:.8rem;font-weight:900;color:#334155}.ta-criterion-row>small{font-size:.74rem;color:#64748b}
            .ta-segmented{display:inline-flex;max-width:100%;border:1px solid #94a3b8;border-radius:7px;overflow:hidden;background:#fff}.ta-segmented label{min-width:0;margin:0;cursor:pointer}.ta-segmented input{position:absolute;opacity:0;pointer-events:none}.ta-segmented span{display:block;min-width:0;padding:8px 11px;font-size:.76rem;font-weight:800;color:#475569;border-right:1px solid #cbd5e1;white-space:normal;overflow-wrap:anywhere}.ta-segmented label:last-child span{border-right:0}.ta-segmented input:checked+span{background:#16324f;color:#fff}.ta-segmented input:focus-visible+span{outline:2px solid #0f766e;outline-offset:-2px}
            .ta-two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ta-distribution{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-content:start}.ta-distribution legend,.ta-distribution .ta-total-line{grid-column:1/-1}.ta-two-col .ta-distribution:last-child{grid-template-columns:repeat(2,minmax(0,1fr))}
            .ta-total-line{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #d7dee7;padding-bottom:9px;margin-bottom:2px;font-size:.74rem;color:#64748b}.ta-total-line strong{padding:3px 7px;border-radius:5px;background:#dcfce7;color:#166534}.ta-total-line strong.is-invalid{background:#fee2e2;color:#991b1b}
            .ta-page-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:3px 0 4px}.ta-btn{min-height:40px;border-radius:7px;border:1px solid transparent;padding:9px 14px;font-size:.82rem;font-weight:900;cursor:pointer}.ta-btn-primary{background:#0f766e;color:#fff}.ta-btn-primary:hover{background:#115e59}.ta-btn-secondary{background:#fff;color:#16324f;border-color:#94a3b8}.ta-btn-secondary:hover{border-color:#0f766e;color:#0f766e}.ta-btn-quiet{background:#eef2f6;color:#475569}.ta-btn:disabled{opacity:.5;cursor:not-allowed}
            #ta-form-status{font-size:.78rem;font-weight:800;color:#64748b}.ta-status-ok{color:#047857!important}.ta-status-error{color:#b91c1c!important}.ta-status-warn{color:#b45309!important}
            .ta-result{margin-top:20px}.ta-result.is-stale{opacity:.62}.ta-error{border-left:4px solid #dc2626;background:#fef2f2;color:#991b1b;padding:12px 14px;border-radius:6px;font-weight:800;font-size:.84rem}
            .ta-result-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border-top:2px solid #0f766e;padding-top:16px}.ta-result-head h3{margin:0;color:#16324f;font-size:1.05rem}.ta-result-head p{margin:3px 0 0;color:#64748b;font-size:.78rem}
            .ta-result-actions{display:flex;gap:8px;flex-wrap:wrap}.ta-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #d7dee7;border-radius:8px;margin:14px 0;overflow:hidden}.ta-kpi{padding:12px;border-right:1px solid #d7dee7;background:#fff;min-width:0}.ta-kpi:last-child{border-right:0}.ta-kpi span{display:block;font-size:.68rem;text-transform:uppercase;font-weight:800;color:#64748b}.ta-kpi strong{display:block;margin-top:3px;font-size:1.08rem;color:#16324f;overflow-wrap:anywhere}.ta-kpi small{display:block;margin-top:2px;font-size:.68rem;color:#64748b}
            .ta-balance{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(0,1.2fr);gap:16px;border:1px solid #d7dee7;border-radius:8px;padding:13px 14px;margin-bottom:14px;background:#f8fafc}.ta-balance h4{margin:0 0 8px;color:#16324f;font-size:.86rem}.ta-balance table{width:100%;border-collapse:collapse}.ta-balance td{padding:5px 2px;border-bottom:1px solid #e2e8f0;font-size:.76rem}.ta-balance td:last-child{text-align:right;font-weight:900;color:#16324f}.ta-stack{display:flex;width:100%;height:34px;border-radius:6px;overflow:hidden;margin-top:9px;background:#e2e8f0}.ta-stack span{display:grid;place-items:center;min-width:0;color:#fff;font-size:.72rem;font-weight:900;white-space:nowrap}.ta-stack-mortar{background:#0f766e}.ta-stack-gravel{background:#b45309}
            .ta-table-wrap{overflow-x:auto;border:1px solid #d7dee7;border-radius:8px}.ta-table{width:100%;border-collapse:collapse;min-width:760px;background:#fff}.ta-table th,.ta-table td{padding:9px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:.77rem}.ta-table th{background:#16324f;color:#fff;font-size:.7rem;text-transform:uppercase}.ta-table th:first-child,.ta-table td:first-child{text-align:left}.ta-table tbody tr:last-child td{border-bottom:0}.ta-table .ta-total-row td{background:#ecfdf5;font-weight:900;color:#16324f}
            .ta-trace{margin:13px 0 0;padding:11px 13px;border-left:4px solid #b45309;background:#fffbeb;color:#713f12;font-size:.8rem;line-height:1.5}.ta-memory{margin-top:12px;border-top:1px solid #d7dee7;padding-top:10px}.ta-memory summary{cursor:pointer;color:#0f766e;font-weight:900;font-size:.8rem}.ta-memory ul{margin:9px 0 0;padding-left:20px;color:#475569;font-size:.78rem;line-height:1.6}
            .ta-assumption{margin-top:11px;padding:9px 11px;border-left:3px solid #64748b;background:#f8fafc;color:#475569;font-size:.74rem;line-height:1.5}
            @media(max-width:900px){.ta-formula-strip{grid-template-columns:1fr 1fr}.ta-formula-strip>div:nth-child(2){border-right:0}.ta-formula-strip>div:nth-child(-n+2){border-bottom:1px solid #d7dee7}.ta-kpis{grid-template-columns:repeat(2,1fr)}.ta-kpi{border-bottom:1px solid #d7dee7}.ta-kpi:nth-child(2n){border-right:0}.ta-kpi:last-child{grid-column:1/-1;border-bottom:0}.ta-balance{grid-template-columns:1fr}}
            @media(max-width:700px){.ta-page .card{padding:16px 13px}.ta-page-head,.ta-result-head{display:block}.ta-page-head .ta-btn{width:100%;margin-top:12px}.ta-two-col,.ta-grid{grid-template-columns:1fr}.ta-page-actions .ta-btn,.ta-result-actions .ta-btn{width:100%}.ta-result-actions{margin-top:10px}.ta-distribution{grid-template-columns:1fr!important}.ta-distribution label{grid-column:1/-1}.ta-segmented{width:100%}.ta-segmented label{flex:1;text-align:center}.ta-segmented span{height:100%;display:grid;place-items:center;padding:8px 6px}.ta-criterion-row>small{width:100%}}
            @media(max-width:460px){.ta-formula-strip{grid-template-columns:1fr}.ta-formula-strip>div{border-right:0!important;border-bottom:1px solid #d7dee7}.ta-formula-strip>div:last-child{border-bottom:0}.ta-kpis{grid-template-columns:1fr}.ta-kpi,.ta-kpi:nth-child(2n){border-right:0}.ta-kpi:last-child{grid-column:auto}.ta-grid{grid-template-columns:1fr}}
            @media print{.ta-page-head .ta-btn,.ta-formula-strip,#ta-form,.ta-result-actions{display:none!important}.ta-result{margin-top:0}.ta-page .card{box-shadow:none;border:0}.ta-table{min-width:0}}
        `;
        document.head.appendChild(style);
    }

    function coletarEntrada() {
        return {
            aguaKg: valor('ta-agua'),
            relacaoAguaCimento: valor('ta-ac'),
            aditivoPctCimento: valor('ta-aditivo-pct'),
            teorArgamassaPct: valor('ta-teor-argamassa'),
            teorArPct: valor('ta-ar'),
            criterioTeor: document.querySelector('input[name="ta-criterio"]:checked')?.value,
            distribuicaoAreiasPct: {
                areiaFina: valor('ta-pct-areia-fina'),
                areiaMedia: valor('ta-pct-areia-media'),
                areiaIndustrial: valor('ta-pct-areia-industrial')
            },
            distribuicaoBritasPct: {
                brita0: valor('ta-pct-brita0'),
                brita1: valor('ta-pct-brita1')
            },
            massasEspecificas: {
                cimento: valor('ta-rho-cimento'),
                areiaFina: valor('ta-rho-areia-fina'),
                areiaMedia: valor('ta-rho-areia-media'),
                areiaIndustrial: valor('ta-rho-areia-industrial'),
                brita0: valor('ta-rho-brita0'),
                brita1: valor('ta-rho-brita1'),
                agua: valor('ta-rho-agua'),
                aditivo: valor('ta-rho-aditivo')
            }
        };
    }

    function atualizarTotais() {
        const grupos = [
            { ids:['ta-pct-areia-fina','ta-pct-areia-media','ta-pct-areia-industrial'], total:'ta-total-areias' },
            { ids:['ta-pct-brita0','ta-pct-brita1'], total:'ta-total-britas' }
        ];
        grupos.forEach(grupo => {
            const soma = grupo.ids.reduce((total, id) => total + (valor(id) || 0), 0);
            const elemento = byId(grupo.total);
            if (!elemento) return;
            elemento.textContent = `${formatar(soma, 1)}%`;
            elemento.classList.toggle('is-invalid', Math.abs(soma - 100) > 0.05);
        });
    }

    function definirStatus(texto, classe) {
        const status = byId('ta-form-status');
        if (!status) return;
        status.textContent = texto || '';
        status.className = classe ? `ta-status-${classe}` : '';
    }

    function distribuicaoDoMaterial(resultado, chave) {
        if (Object.prototype.hasOwnProperty.call(resultado.distribuicaoAreiasPct, chave)) {
            return resultado.distribuicaoAreiasPct[chave];
        }
        if (Object.prototype.hasOwnProperty.call(resultado.distribuicaoBritasPct, chave)) {
            return resultado.distribuicaoBritasPct[chave];
        }
        return null;
    }

    function renderizarResultado(resultado) {
        const container = byId('ta-resultado');
        const criterioNome = resultado.criterioTeor === 'massa_seca' ? 'massa seca' : 'volume absoluto seco';
        const linhas = MATERIAIS.map(material => {
            const distribuicao = distribuicaoDoMaterial(resultado, material.chave);
            return `
                <tr>
                    <td>${material.nome}</td>
                    <td>${distribuicao == null ? '-' : `${formatar(distribuicao, 1)}%`}</td>
                    <td>${formatar(resultado.massas[material.chave], 2)}</td>
                    <td>${formatar(resultado.massasEspecificas[material.chave], 3)}</td>
                    <td>${formatar(resultado.volumes[material.chave], 2)}</td>
                    <td>${formatar(resultado.tracoUnitario[material.chave], 3)}</td>
                </tr>`;
        }).join('');
        const teorGrafico = Math.max(0, Math.min(100, resultado.teorAtingidoPct));
        const traco = window.DosagemPorArgamassa.formatarTraco(resultado, 3);

        container.classList.remove('is-stale');
        container.innerHTML = `
            <div class="ta-result-head">
                <div>
                    <h3>Dosagem calculada para 1 m&sup3;</h3>
                    <p>Teor alvo atingido por ${criterioNome}; distribui&ccedil;&otilde;es mantidas exatamente como informadas.</p>
                </div>
                <div class="ta-result-actions">
                    <button type="button" class="ta-btn ta-btn-primary" id="ta-aplicar">Aplicar na Dosagem 1</button>
                    <button type="button" class="ta-btn ta-btn-secondary" id="ta-imprimir">Imprimir resultado</button>
                </div>
            </div>
            <div class="ta-kpis">
                <div class="ta-kpi"><span>Cimento calculado</span><strong>${formatar(resultado.massas.cimento, 1)} kg</strong><small>${formatar(resultado.massas.agua, 1)} / ${formatar(resultado.relacaoAguaCimento, 3)}</small></div>
                <div class="ta-kpi"><span>Areias</span><strong>${formatar(resultado.grupos.areiasKg, 1)} kg</strong><small>${formatar(resultado.grupos.areiasL, 1)} L</small></div>
                <div class="ta-kpi"><span>Britas</span><strong>${formatar(resultado.grupos.britasKg, 1)} kg</strong><small>${formatar(resultado.grupos.britasL, 1)} L</small></div>
                <div class="ta-kpi"><span>Teor atingido</span><strong>${formatar(resultado.teorAtingidoPct, 2)}%</strong><small>alvo ${formatar(resultado.teorAlvoPct, 2)}%</small></div>
                <div class="ta-kpi"><span>Volume fechado</span><strong>${formatar(resultado.volumeTotalLitros, 1)} L</strong><small>desvio ${formatar(resultado.fechamentoLitros, 3)} L</small></div>
            </div>
            <div class="ta-balance">
                <div>
                    <h4>Verifica&ccedil;&atilde;o dos teores</h4>
                    <table>
                        <tr><td>Massa seca</td><td>${formatar(resultado.teores.massaSecaPct, 2)}%</td></tr>
                        <tr><td>Volume seco</td><td>${formatar(resultado.teores.volumeSecoPct, 2)}%</td></tr>
                        <tr><td>Massa real/&uacute;mida</td><td>${formatar(resultado.teores.massaRealPct, 2)}%</td></tr>
                        <tr><td>Volume real/&uacute;mido</td><td>${formatar(resultado.teores.volumeRealPct, 2)}%</td></tr>
                    </table>
                </div>
                <div>
                    <h4>Balan&ccedil;o seco pelo crit&eacute;rio selecionado</h4>
                    <div class="ta-stack" aria-label="Argamassa ${formatar(teorGrafico, 1)} por cento e britas ${formatar(100 - teorGrafico, 1)} por cento">
                        <span class="ta-stack-mortar" style="width:${teorGrafico}%">Argamassa ${formatar(teorGrafico, 1)}%</span>
                        <span class="ta-stack-gravel" style="width:${100 - teorGrafico}%">Britas ${formatar(100 - teorGrafico, 1)}%</span>
                    </div>
                    <p class="ta-trace"><strong>Tra&ccedil;o unit&aacute;rio:</strong> ${traco}</p>
                </div>
            </div>
            <div class="ta-table-wrap">
                <table class="ta-table">
                    <thead><tr><th>Material</th><th>% no grupo</th><th>Massa (kg/m&sup3;)</th><th>rho (kg/L)</th><th>Volume (L)</th><th>Tra&ccedil;o / cimento</th></tr></thead>
                    <tbody>
                        ${linhas}
                        <tr><td>Ar incorporado</td><td>-</td><td>-</td><td>-</td><td>${formatar(resultado.volumes.ar, 2)}</td><td>-</td></tr>
                        <tr class="ta-total-row"><td>Total</td><td>-</td><td>${formatar(resultado.massaTotalKg, 2)}</td><td>-</td><td>${formatar(resultado.volumeTotalLitros, 2)}</td><td>-</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="ta-assumption"><strong>Base de c&aacute;lculo:</strong> massas de refer&ecirc;ncia secas e &aacute;gua efetiva. Umidade, absor&ccedil;&atilde;o, consist&ecirc;ncia e resist&ecirc;ncia devem ser ajustadas no tra&ccedil;o experimental.</div>
            <details class="ta-memory">
                <summary>Mem&oacute;ria das equa&ccedil;&otilde;es</summary>
                <ul>
                    <li>Cimento: ${formatar(resultado.massas.agua, 2)} / ${formatar(resultado.relacaoAguaCimento, 3)} = ${formatar(resultado.massas.cimento, 2)} kg/m&sup3;.</li>
                    <li>Aditivo: ${formatar(resultado.aditivoPctCimento, 3)}% do cimento = ${formatar(resultado.massas.aditivo, 3)} kg/m&sup3;.</li>
                    <li>Ar: ${formatar(resultado.teorArPct, 2)}% = ${formatar(resultado.volumes.ar, 2)} L/m&sup3;.</li>
                    <li>${resultado.memoria.volume}.</li>
                    <li>${resultado.criterioTeor === 'massa_seca' ? resultado.memoria.teorMassa : resultado.memoria.teorVolume}.</li>
                </ul>
            </details>
        `;
        byId('ta-aplicar')?.addEventListener('click', aplicarNaDosagemPrincipal);
        byId('ta-imprimir')?.addEventListener('click', imprimirResultado);
    }

    function calcular(evento) {
        if (evento) evento.preventDefault();
        const container = byId('ta-resultado');
        try {
            if (!window.DosagemPorArgamassa) throw new Error('M&oacute;dulo de c&aacute;lculo indispon&iacute;vel.');
            ultimoResultado = window.DosagemPorArgamassa.calcularDosagem(coletarEntrada());
            renderizarResultado(ultimoResultado);
            definirStatus('Dosagem fechada em 1.000 L.', 'ok');
            salvarEntradas();
        } catch (error) {
            ultimoResultado = null;
            if (container) container.innerHTML = `<div class="ta-error">${error.message}</div>`;
            definirStatus('Revise os campos destacados pelo resultado.', 'error');
        }
    }

    function definirCampo(id, valorNumero, casas) {
        const campo = byId(id);
        if (!campo) return;
        campo.value = Number(valorNumero).toFixed(casas);
        campo.dispatchEvent(new Event('input', { bubbles:true }));
        campo.dispatchEvent(new Event('change', { bubbles:true }));
    }

    function aplicarNaDosagemPrincipal() {
        if (!ultimoResultado) return;
        const r = ultimoResultado;
        const an2Wrap = byId('dos-an2-wrap');
        if (r.massas.areiaMedia > 0 && an2Wrap && an2Wrap.style.display === 'none' && typeof window.toggleAn2 === 'function') {
            window.toggleAn2();
        }

        const usarGran = byId('dos_usar_gran');
        if (usarGran) usarGran.checked = false;
        if (typeof window.toggleModoGran === 'function') window.toggleModoGran();

        definirCampo('dos_cim', r.massas.cimento, 2);
        definirCampo('dos_adic', 0, 2);
        definirCampo('dos_an', r.massas.areiaFina, 2);
        definirCampo('dos_an2', r.massas.areiaMedia, 2);
        definirCampo('dos_ai', r.massas.areiaIndustrial, 2);
        definirCampo('dos_b0', r.massas.brita0, 2);
        definirCampo('dos_b1', r.massas.brita1, 2);
        definirCampo('dos_agua', r.massas.agua, 2);
        definirCampo('dos_adit', r.massas.aditivo, 3);
        definirCampo('dos_adit2', 0, 3);
        definirCampo('dos_ar', r.teorArPct, 2);
        definirCampo('dos_rho_cim', r.massasEspecificas.cimento, 3);
        definirCampo('dos_rho_an', r.massasEspecificas.areiaFina, 3);
        definirCampo('dos_rho_an2', r.massasEspecificas.areiaMedia, 3);
        definirCampo('dos_rho_ai', r.massasEspecificas.areiaIndustrial, 3);
        definirCampo('dos_rho_b0', r.massasEspecificas.brita0, 3);
        definirCampo('dos_rho_b1', r.massasEspecificas.brita1, 3);
        definirCampo('dos_rho_agua', r.massasEspecificas.agua, 3);
        definirCampo('dos_rho_adit', r.massasEspecificas.aditivo, 3);

        if (typeof window.calcularDosagem === 'function') window.calcularDosagem();
        if (typeof window.updateDosagemCockpit === 'function') window.updateDosagemCockpit();
        if (typeof window.syncResumoFieldsFromDosagem === 'function') window.syncResumoFieldsFromDosagem();
        if (typeof window.showSection === 'function') window.showSection('sec-dosagem');
    }

    function imprimirResultado() {
        if (typeof window.imprimirSecao === 'function') {
            window.imprimirSecao(SECTION_ID, 'Dosagem por Teor de Argamassa');
        } else {
            window.print();
        }
    }

    function sincronizarDensidades(mostrarStatus) {
        const fontes = {
            'ta-rho-cimento':['dos_rho_cim','rho_cim'],
            'ta-rho-areia-fina':['dos_rho_an','rho_an'],
            'ta-rho-areia-media':['dos_rho_an2','dos_rho_an','rho_an'],
            'ta-rho-areia-industrial':['dos_rho_ai','rho_ai'],
            'ta-rho-brita0':['dos_rho_b0','rho_b0'],
            'ta-rho-brita1':['dos_rho_b1','rho_b1'],
            'ta-rho-agua':['dos_rho_agua'],
            'ta-rho-aditivo':['dos_rho_adit','rho_adit']
        };
        let atualizados = 0;
        const tinhaResultado = !!ultimoResultado;
        Object.entries(fontes).forEach(([destino, candidatos]) => {
            const encontrado = candidatos.map(id => Number(byId(id)?.value)).find(numero => Number.isFinite(numero) && numero > 0);
            if (encontrado) {
                byId(destino).value = encontrado;
                atualizados += 1;
            }
        });
        if (atualizados && tinhaResultado) {
            ultimoResultado = null;
            byId('ta-resultado')?.classList.add('is-stale');
            const aplicar = byId('ta-aplicar');
            if (aplicar) aplicar.disabled = true;
        }
        if (mostrarStatus) {
            const texto = atualizados
                ? `${atualizados} densidades sincronizadas.${tinhaResultado ? ' Calcule novamente.' : ''}`
                : 'Nao ha densidades preenchidas na Dosagem 1.';
            definirStatus(texto, atualizados && !tinhaResultado ? 'ok' : 'warn');
        }
        salvarEntradas();
    }

    function salvarEntradas() {
        const form = byId('ta-form');
        if (!form) return;
        const dados = {};
        form.querySelectorAll('input[id]').forEach(campo => { dados[campo.id] = campo.value; });
        dados.criterio = document.querySelector('input[name="ta-criterio"]:checked')?.value || 'massa_seca';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    }

    function restaurarEntradas() {
        try {
            const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (!dados) return;
            Object.entries(dados).forEach(([id, conteudo]) => {
                const campo = byId(id);
                if (campo && campo.matches('input[id]')) campo.value = conteudo;
            });
            const criterio = document.querySelector(`input[name="ta-criterio"][value="${dados.criterio}"]`);
            if (criterio) criterio.checked = true;
            restaurouDados = true;
        } catch (error) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function marcarResultadoDesatualizado(evento) {
        atualizarTotais();
        salvarEntradas();
        if (!ultimoResultado || evento?.target?.id === 'ta-calcular') return;
        ultimoResultado = null;
        byId('ta-resultado')?.classList.add('is-stale');
        const aplicar = byId('ta-aplicar');
        if (aplicar) aplicar.disabled = true;
        definirStatus('Entradas alteradas. Calcule novamente.', 'warn');
    }

    function restaurarPadroes() {
        const form = byId('ta-form');
        if (!form) return;
        form.reset();
        localStorage.removeItem(STORAGE_KEY);
        ultimoResultado = null;
        byId('ta-resultado').innerHTML = '';
        atualizarTotais();
        salvarEntradas();
        definirStatus('Valores iniciais restaurados.', 'ok');
    }

    function vincularEventos() {
        const form = byId('ta-form');
        form?.addEventListener('submit', calcular);
        form?.querySelectorAll('input').forEach(campo => {
            campo.addEventListener('input', marcarResultadoDesatualizado);
            campo.addEventListener('change', marcarResultadoDesatualizado);
        });
        byId('ta-sync-rhos')?.addEventListener('click', () => sincronizarDensidades(true));
        byId('ta-reset')?.addEventListener('click', restaurarPadroes);
    }

    function iniciar() {
        criarNavegacao();
        criarPagina();
        criarEstilos();
        restaurarEntradas();
        vincularEventos();
        atualizarTotais();
        document.addEventListener('DOMContentLoaded', function () {
            if (!restaurouDados) sincronizarDensidades(false);
        }, { once:true });
    }

    iniciar();
})();
