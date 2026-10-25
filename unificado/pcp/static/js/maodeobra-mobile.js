/* Vista funcional de Mão de Obra no celular; regras e transporte em MaoDeObraCore. */
(() => {
  'use strict';
  if (!matchMedia('(max-width: 600px)').matches) return;
  document.body.classList.add('mdo-mobile-mode');
  const root = document.getElementById('mdo-mobile');
  const core = window.MaoDeObraCore;
  // No celular, esta rota usa todo o viewport da casca. A classe sai quando
  // outra tela assume o quadro; desktop, tablet e demais módulos não mudam.
  if (window.frameElement && window.parent !== window) {
    const shell = window.parent.document;
    if (!shell.getElementById('mdo-mobile-shell-style')) {
      const style = shell.createElement('style');
      style.id = 'mdo-mobile-shell-style';
      style.textContent = `@media(max-width:600px){
        body.unificado-maodeobra-mobile{overflow:hidden}
        body.unificado-maodeobra-mobile .desktop-only{display:block;padding:0;min-height:100dvh}
        body.unificado-maodeobra-mobile #sidebar,
        body.unificado-maodeobra-mobile .main-panel>.topbar{display:none!important}
        body.unificado-maodeobra-mobile .main-panel{min-height:100dvh;border-radius:0}
        body.unificado-maodeobra-mobile #module-host{margin-top:0;
          height:calc(100dvh - var(--mdo-shell-top,0px))!important;min-height:0!important}
      }`;
      shell.head.append(style);
    }
    if (shell.querySelector('.test-environment-bar'))
      shell.body.style.setProperty('--mdo-shell-top', '31px');
    const frame = window.frameElement;
    const syncShell = () => shell.body.classList.toggle('unificado-maodeobra-mobile',
      frame.classList.contains('is-active'));
    new MutationObserver(syncShell).observe(frame, {attributes:true,attributeFilter:['class']});
    window.addEventListener('pagehide', () => shell.body.classList.remove('unificado-maodeobra-mobile'));
    syncShell();
  }
  const account = API.getUser();
  if (!account || !API.getToken()) {
    requireAuth();
    return;
  }
  const canWrite = ['ADMIN', 'PCP', 'PRODUCAO'].includes(account.nivel_acesso);
  const state = {
    screen: 'launch', data: todayISO(), group: '12', activities: [], day: null,
    values: {}, reason: '', loading: false, sending: false, error: '',
    uncertain: false, pendingPayload: null, lastResponse: null, intentConfirm: false,
    history: [], historyEnd: todayISO(), historyFilter: 'all', requestId: 0,
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
    char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const groupLabel = group => group === '12' ? 'S1 / S2' : 'S3 / S4';
  const qty = core.formatQuantity;
  const dateLabel = iso => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', {timeZone:'UTC', weekday:'short',
      day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date(Date.UTC(year, month - 1, day)))
      .replace(/\./g, '').replace(/^./, first => first.toUpperCase());
  };
  const savedLabel = iso => iso ? new Intl.DateTimeFormat('pt-BR', {
    timeZone:'America/Sao_Paulo', hour:'2-digit', minute:'2-digit',
  }).format(new Date(iso)) : null;
  const draftKey = () => `maodeobra-draft-v1:${account.id}:${state.data}:${state.group}`;
  const entries = () => state.activities.map(item => ({atividade_id:item.id, tipo:item.tipo,
    value:state.values[item.id] ?? ''}));
  const totals = () => core.calculate(entries());
  const snapshot = () => ({data:state.data, grupo_setor:state.group,
    activities:state.activities, values:state.values});
  function saveDraft() {
    try { localStorage.setItem(draftKey(), JSON.stringify(state.values)); } catch (_) { /* storage optional */ }
  }
  function clearDraft() {
    try { localStorage.removeItem(draftKey()); } catch (_) { /* storage optional */ }
  }
  function getDraft() {
    try { return JSON.parse(localStorage.getItem(draftKey()) || 'null'); } catch (_) { return null; }
  }
  function statusText(day) {
    if (!day?.lancado) return 'Ainda não lançado';
    if (day.sem_producao) return 'Sem produção';
    return day.confirmado ? 'Confirmado' : 'Aguardando confirmação';
  }
  function metadata(day) {
    if (!day?.lancado) return `Grupo ${groupLabel(state.group)}`;
    if (day.sem_producao) return day.salvo_em ? `Sem produção desde ${savedLabel(day.salvo_em)}` : 'Horário indisponível';
    if (day.confirmado) return day.confirmado_em
      ? `Confirmado às ${savedLabel(day.confirmado_em)} por ${day.confirmado_por?.nome || 'usuário indisponível'}`
      : 'Confirmação registrada; horário indisponível';
    return day.salvo_em ? `Lançado às ${savedLabel(day.salvo_em)} · aguardando confirmação`
      : 'Lançado · aguardando confirmação; horário indisponível';
  }
  const changed = () => core.hasEdits(state.activities, state.values, state.day);
  const canConfirmOnly = () => Boolean(state.day?.lancado && !state.day.sem_producao &&
    !state.day.confirmado && state.day.salvo_em && !changed());
  function heading(title='Mão de Obra', eyebrow='Planejamento', back='launch', history=true) {
    const backAction = back === 'exit' ? 'data-exit' : `data-screen="${back}"`;
    return `<div class="heading"><div class="heading-left"><button class="icon-button" type="button" ${backAction} aria-label="Voltar">‹</button><div class="heading-text"><span class="eyebrow">${eyebrow}</span><strong class="heading-title">${title}</strong></div></div>${history ? '<button class="icon-button" type="button" data-screen="history" aria-label="Histórico">◷</button>' : ''}</div>`;
  }
  function cards(type) {
    return state.activities.filter(item => item.tipo === type).map(item => {
      const extra = item.responsavel ? `<span class="activity-info">${escapeHtml(item.responsavel)}${item.fator == null ? '' : ` · fator ${qty(item.fator)}`}</span>` : '';
      const value = state.values[item.id] ?? '';
      const invalid = Number.isNaN(core.parseQuantity(value));
      return `<div class="activity-card"><div class="activity-name">${escapeHtml(item.descricao)}${extra}</div><div class="stepper"><button type="button" data-step="-0.5" data-id="${item.id}" aria-label="Diminuir 0,5 em ${escapeHtml(item.descricao)}">−</button><input data-id="${item.id}" inputmode="decimal" autocomplete="off" aria-label="Pessoas em ${escapeHtml(item.descricao)}" aria-invalid="${invalid}" value="${escapeHtml(value)}"><button type="button" data-step="0.5" data-id="${item.id}" aria-label="Aumentar 0,5 em ${escapeHtml(item.descricao)}">+</button></div></div>`;
    }).join('');
  }
  function primaryAction(sum) {
    const finished = state.day?.confirmado && !changed();
    const noProduction = state.day?.sem_producao && !changed();
    const confirmOnly = canConfirmOnly();
    const label = finished ? 'Mão de obra confirmada' : noProduction ? 'Sem produção registrada'
      : confirmOnly ? 'Confirmar mão de obra'
      : state.day?.lancado ? 'Salvar e confirmar' : 'Conferir e enviar';
    const disabled = state.loading || !sum.valid || !canWrite || !state.activities.length || finished || noProduction;
    return `<button class="primary" type="button" data-primary-action data-screen="${confirmOnly?'confirm':'review'}" ${disabled?'disabled':''}>${label} <span aria-hidden="true">→</span></button>`;
  }
  function launch() {
    const sum = totals();
    return `<main class="screen"><header class="hero hero-main">${heading('Mão de Obra', 'Planejamento', 'exit')}<label class="date-label">Data do lançamento<span class="date-box"><span>${dateLabel(state.data)}</span><span aria-hidden="true">▦</span><input id="mdo-m-date" type="date" value="${state.data}" aria-label="Data do lançamento"></span></label><div class="segments" role="group" aria-label="Grupo"><button type="button" class="segment ${state.group==='12'?'active':''}" data-group="12">S1 / S2</button><button type="button" class="segment ${state.group==='34'?'active':''}" data-group="34">S3 / S4</button></div></header><div class="scroll">${state.loading ? '<div class="loading">Carregando atividades e dia…</div>' : `<div class="status ${state.error ? 'error' : ''}"><span class="status-dot"></span><strong>${state.error ? 'Confira o lan\u00e7amento' : statusText(state.day)}</strong><span class="muted">· ${groupLabel(state.group)}</span><span class="status-detail">${state.error ? escapeHtml(state.error) : escapeHtml(metadata(state.day))}</span></div><div class="section-heading"><h2>Mão de obra direta</h2><span>MOD <strong data-total="MOD">${sum.valid ? qty(sum.MOD) : '—'}</strong></span></div><div class="activity-list">${cards('MOD')}</div><div class="section-heading"><h2>Mão de obra indireta</h2><span>MOI <strong data-total="MOI">${sum.valid ? qty(sum.MOI) : '—'}</strong></span></div><div class="activity-list">${cards('MOI')}</div>${!sum.valid ? '<p class="field-error">Use valores de 0,5 em 0,5, com ponto ou vírgula.</p>' : ''}<div style="height:14px"></div>${canWrite ? '<button class="link-button" type="button" data-screen="no-production">Marcar dia sem produção</button>' : '<p class="field-error">Esta conta pode consultar, mas não enviar lançamentos.</p>'}`}</div><footer class="footer"><div class="total-row"><span class="muted" data-total="parts">MOD ${sum.valid?qty(sum.MOD):'—'} + MOI ${sum.valid?qty(sum.MOI):'—'}</span><span>Total <strong data-total="all">${sum.valid?qty(sum.total):'—'}</strong></span></div>${primaryAction(sum)}</footer></main>`;
  }
  function reviewRows(changedOnly=false, showDifference=false) {
    const server = new Map((state.day?.itens || []).map(item => [Number(item.atividade_id), Number(item.quantidade_pessoas)]));
    const list = changedOnly ? state.activities.filter(item => core.parseQuantity(state.values[item.id]) !== (server.get(item.id) ?? 0)) : state.activities;
    return list.length ? list.map(item => `<div class="review-item"><span>${escapeHtml(item.descricao)}</span><strong>${showDifference ? `${qty(server.get(item.id) ?? 0)} → ` : ''}${escapeHtml(state.values[item.id] || '0')}</strong></div>`).join('') : '<div class="review-item">Nenhuma diferença nos valores</div>';
  }
  function review() {
    const sum = totals();
    return `<main class="screen"><div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-label="Conferir lançamento"><div class="handle"></div><h1>${state.intentConfirm ? 'Salvar e confirmar' : 'Conferir lan\u00e7amento'}</h1><div class="sheet-sub">${dateLabel(state.data)} · Grupo ${groupLabel(state.group)}</div><div class="summary-grid"><div class="summary-box"><span>MOD</span><strong>${qty(sum.MOD)}</strong></div><div class="summary-box"><span>MOI</span><strong>${qty(sum.MOI)}</strong></div><div class="summary-box total"><span>Total</span><strong>${qty(sum.total)}</strong></div></div><div class="review-list"><div class="review-head"><span>Atividade alterada</span><span>${state.intentConfirm ? 'Anterior \u2192 novo' : 'Pessoas'}</span></div>${reviewRows(true, state.intentConfirm)}</div>${state.day?.lancado ? `<div class="warning"><span aria-hidden="true">ⓘ</span><span>Este envio substitui os valores do grupo ${groupLabel(state.group)} em ${dateLabel(state.data)}.</span></div>` : ''}<div class="sheet-actions"><button class="secondary" type="button" data-screen="launch">Voltar e corrigir</button><button class="primary" type="button" data-send="production" ${state.sending?'disabled':''}>${state.sending?'Enviando...':state.intentConfirm?'Salvar e confirmar':'Enviar'}</button></div></section></div></main>`;
  }
  function confirmSheet() {
    const sum = totals();
    return `<main class="screen"><div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-label="Confirmar mão de obra"><div class="handle"></div><h1>Confirmar mão de obra</h1><div class="sheet-sub">${dateLabel(state.data)} · Grupo ${groupLabel(state.group)}</div><p>Confira os totais do lançamento salvo às ${state.day?.salvo_em ? savedLabel(state.day.salvo_em) : '—'}.</p><div class="summary-grid"><div class="summary-box"><span>MOD</span><strong>${qty(sum.MOD)}</strong></div><div class="summary-box"><span>MOI</span><strong>${qty(sum.MOI)}</strong></div><div class="summary-box total"><span>Total</span><strong>${qty(sum.total)}</strong></div></div><div class="sheet-actions"><button class="secondary" type="button" data-screen="launch">Voltar</button><button class="primary" type="button" data-confirm-only ${state.sending?'disabled':''}>${state.sending?'Confirmando…':'Confirmar'}</button></div></section></div></main>`;
  }
  function sent() {
    const sum = totals();
    const response = state.lastResponse || {};
    const byline = response.confirmado && response.confirmado_em
      ? `Confirmado às ${savedLabel(response.confirmado_em)} por ${escapeHtml(response.confirmado_por?.nome || 'usuário indisponível')}`
      : response.salvo_em && response.salvo_por?.nome
        ? `Salvo às ${savedLabel(response.salvo_em)} por ${escapeHtml(response.salvo_por.nome)}` : 'Horário e usuário indisponíveis';
    return `<main class="screen center-screen"><header class="hero hero-main" style="width:100%">${heading('Mão de Obra','Planejamento','launch',false)}</header><div class="center-content"><div class="check-circle" aria-hidden="true">✓</div><h1>${response.confirmado ? 'M\u00e3o de obra confirmada' : 'Lan\u00e7amento enviado'}</h1><p>${response.confirmado ? 'Valores salvos e confirmados no servidor.' : 'Grava\u00e7\u00e3o recebida do servidor; aguarda confirma\u00e7\u00e3o.'}</p><div class="detail-card"><div class="detail-line"><span>Data</span><strong>${dateLabel(state.data)}</strong></div><div class="detail-line"><span>Grupo</span><strong>${groupLabel(state.group)}</strong></div><div class="detail-line"><span>MOD + MOI</span><strong>${qty(sum.MOD)} + ${qty(sum.MOI)}</strong></div><div class="detail-line detail-total"><span>Total de pessoas</span><strong>${qty(sum.total)}</strong></div><div class="byline">${byline}</div></div></div><footer class="center-actions"><button class="primary" type="button" data-other-group>Lançar ${groupLabel(state.group==='12'?'34':'12')}</button><button class="secondary" type="button" data-screen="history">Ver histórico</button></footer></main>`;
  }
  function errorScreen() {
    const sum = totals();
    return `<main class="screen error-screen"><header class="hero hero-main">${heading()}<div class="date-box">${dateLabel(state.data)} · ${groupLabel(state.group)}</div></header><div class="scroll"><div class="error-banner" role="alert"><span aria-hidden="true">⌁</span><div><strong>Não enviado</strong><span>${escapeHtml(state.error || 'Verifique a conexão e tente novamente.')} Seus números foram mantidos neste aparelho.</span></div></div><div class="draft-label">● Rascunho local · confirme o estado no servidor antes de reenviar</div><div class="review-list">${reviewRows()}</div><button class="small-link" type="button" data-screen="launch">Editar valores</button></div><footer class="footer"><div class="total-row"><span class="muted">MOD ${qty(sum.MOD)} + MOI ${qty(sum.MOI)}</span><span>Total <strong>${qty(sum.total)}</strong></span></div><button class="primary" type="button" data-retry ${state.sending?'disabled':''}>${state.sending?'Verificando…':'Tentar de novo'}</button></footer></main>`;
  }
  function noProduction() {
    return `<main class="screen"><div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-label="Marcar dia sem produção"><div class="handle"></div><div class="no-production-icon" aria-hidden="true">▣</div><h1>Marcar dia sem produção?</h1><p>Todas as atividades deste grupo ficam com 0 e o dia aparece como <strong>sem produção</strong> no histórico e nos relatórios.</p><div class="detail-card"><div class="detail-line"><span>Data</span><strong>${dateLabel(state.data)}</strong></div><div class="detail-line"><span>Grupo</span><strong>${groupLabel(state.group)}</strong></div><div class="detail-line"><span>Atividades zeradas</span><strong>${state.activities.length}</strong></div></div><label class="reason">Motivo (opcional)<input id="mdo-m-reason" maxlength="255" placeholder="Ex.: feriado, manutenção, chuva" value="${escapeHtml(state.reason)}"></label><div class="sheet-actions"><button class="secondary" type="button" data-screen="launch">Cancelar</button><button class="navy-button" type="button" data-send="no-production" ${state.sending?'disabled':''}>${state.sending?'Enviando…':'Confirmar'}</button></div></section></div></main>`;
  }
  function historyStatus(group) {
    if (group.sem_producao) return 'Sem produção';
    if (group.confirmado) return 'Confirmado';
    return group.lancado ? 'Aguardando confirmação' : 'Não lançado';
  }
  function historyClass(group) {
    return group.sem_producao ? 'no-production' : group.confirmado ? ''
      : group.lancado ? 'awaiting' : 'pending';
  }
  function history() {
    const rows = state.history.filter(day => day.data === todayISO() || day.grupos.some(group => group.lancado));
    const visible = rows.filter(day => state.historyFilter === 'all' || day.grupos.find(group => group.grupo_setor === state.historyFilter)?.lancado || day.data === todayISO());
    return `<main class="screen"><header class="hero hero-main">${heading('Histórico','Mão de Obra','launch',false)}<div class="segments history-tabs" role="group" aria-label="Filtro de grupo"><button class="segment ${state.historyFilter==='all'?'active':''}" data-filter="all">Todos</button><button class="segment ${state.historyFilter==='12'?'active':''}" data-filter="12">S1 / S2</button><button class="segment ${state.historyFilter==='34'?'active':''}" data-filter="34">S3 / S4</button></div></header><div class="scroll history-scroll">${state.loading?'<div class="loading">Carregando histórico…</div>':''}<label class="history-date">Período até <input id="mdo-m-history-end" type="date" value="${state.historyEnd}"></label><div class="history-pager"><button type="button" data-page="older">← Dias anteriores</button><button type="button" data-page="newer" ${state.historyEnd>=todayISO()?'disabled':''}>Dias seguintes →</button></div><div class="history-title"><span>PERÍODO DE 31 DIAS</span><small>${visible.length} dias</small></div>${visible.slice().reverse().map(day => `<div class="history-card"><div class="history-top"><strong>${dateLabel(day.data)}</strong><span>Total <strong>${qty(day.grupos.reduce((sum,group)=>sum+Number(group.total),0))}</strong></span></div>${day.grupos.filter(group => state.historyFilter==='all' || group.grupo_setor===state.historyFilter).map(group => `<button type="button" class="history-line" data-open-date="${day.data}" data-open-group="${group.grupo_setor}"><strong>${groupLabel(group.grupo_setor)}</strong><span class="pill ${historyClass(group)}">${historyStatus(group)}</span><small>MOD ${qty(group.mod)} · MOI ${qty(group.moi)}</small></button>`).join('')}</div>`).join('') || '<p>Nenhum lançamento nesse período.</p>'}</div></main>`;
  }
  const screens = {launch, review, confirm:confirmSheet, sent, error:errorScreen, 'no-production':noProduction, history};
  function render() {
    root.innerHTML = screens[state.screen]();
    if (state.screen === 'launch' && !window.MaoDeObraPWA?.dedicated) {
      const scroll = root.querySelector('.scroll');
      if (scroll) {
        const link = document.createElement('a');
        link.className = 'mdo-install-link';
        link.href = '/unificado/m/maodeobra/';
        link.target = '_top';
        link.textContent = 'Instalar no celular';
        scroll.append(link);
      }
    }
  }
  function refreshTotals() {
    const sum = totals();
    root.querySelector('[data-total="MOD"]')?.replaceChildren(document.createTextNode(sum.valid?qty(sum.MOD):'—'));
    root.querySelector('[data-total="MOI"]')?.replaceChildren(document.createTextNode(sum.valid?qty(sum.MOI):'—'));
    root.querySelector('[data-total="all"]')?.replaceChildren(document.createTextNode(sum.valid?qty(sum.total):'—'));
    root.querySelector('[data-total="parts"]')?.replaceChildren(document.createTextNode(`MOD ${sum.valid?qty(sum.MOD):'—'} + MOI ${sum.valid?qty(sum.MOI):'—'}`));
    const primaryButton = root.querySelector('[data-primary-action]');
    if (primaryButton) primaryButton.outerHTML = primaryAction(sum);
    root.querySelectorAll('[data-id][value]').forEach(input => input.setAttribute('aria-invalid',
      String(Number.isNaN(core.parseQuantity(input.value)))));
  }
  async function loadDay() {
    const requestId = ++state.requestId;
    state.loading = true; state.error = ''; state.screen = 'launch'; render();
    try {
      const {activities, day} = await core.loadDay(API, state.data, state.group);
      if (requestId !== state.requestId) return;
      state.activities = activities; state.day = day;
      const serverValues = Object.fromEntries((day.itens || []).map(item => [item.atividade_id, qty(item.quantidade_pessoas)]));
      const draft = getDraft();
      state.values = Object.fromEntries(activities.map(item => [item.id,
        draft?.[item.id] ?? serverValues[item.id] ?? '']));
      state.reason = day.motivo || '';
    } catch (error) {
      if (requestId !== state.requestId) return;
      state.error = error.message || 'Falha ao carregar o dia.';
      state.activities = []; state.day = null; state.values = {};
    } finally {
      if (requestId === state.requestId) { state.loading = false; render(); }
    }
  }
  async function loadHistory() {
    state.screen = 'history'; state.loading = true; render();
    const end = state.historyEnd;
    const endDate = new Date(`${end}T12:00:00Z`);
    endDate.setUTCDate(endDate.getUTCDate() - 30);
    const start = endDate.toISOString().slice(0,10);
    try {
      const summary = await API.get(`/api/maodeobra/resumo?data_inicio=${start}&data_fim=${end}`);
      state.history = summary.dias;
    } catch (error) {
      state.error = error.message || 'Falha ao carregar histórico.';
    } finally { state.loading = false; render(); }
  }
  function showSuccess(response, semProducao, payload=state.pendingPayload) {
    clearDraft(); state.lastResponse = response; state.error = ''; state.uncertain = false;
    state.pendingPayload = null;
    state.day = {...state.day, ...response, lancado:true, sem_producao:semProducao,
      itens:Array.isArray(response.itens) ? response.itens : (payload?.itens || state.day?.itens || [])};
    if (semProducao) state.values = Object.fromEntries(state.activities.map(item => [item.id,'0']));
    state.screen = 'sent'; render();
  }
  async function confirmOnly() {
    if (state.sending || !canWrite || !canConfirmOnly()) return;
    state.sending = true; render();
    try {
      const response = await core.confirmGroup(API, {
        data: state.data, grupo_setor: state.group, salvo_em: state.day.salvo_em,
      });
      state.day = {...state.day, ...response};
      clearDraft();
      state.error = '';
      state.screen = 'launch';
    } catch (error) {
      if (error.status === 409) {
        await loadDay();
        state.error = 'O lançamento mudou desde a sua leitura. Confira os valores atualizados antes de confirmar.';
      } else {
        state.error = error.message || 'Não foi possível confirmar. Tente novamente.';
      }
      state.screen = 'launch';
    } finally { state.sending = false; render(); }
  }
  async function send(semProducao=false, confirmar=false) {
    if (state.sending || !canWrite) return;
    state.sending = true; render();
    try {
      const result = await core.saveGroup(API, {...snapshot(), sem_producao:semProducao, confirmar,
        motivo:semProducao?state.reason:null});
      showSuccess(result.response, semProducao, result.payload);
    } catch (error) {
      state.error = error.message || 'Verifique a conexão e tente novamente.';
      state.uncertain = error?.name === 'TypeError' || error?.name === 'AbortError';
      try { state.pendingPayload = core.prepareSubmission({...snapshot(), sem_producao:semProducao, confirmar,
        motivo:semProducao?state.reason:null}).payload; } catch (_) { state.pendingPayload = null; }
      state.screen = 'error'; render();
    } finally { state.sending = false; render(); }
  }
  async function retry() {
    if (state.sending) return;
    state.sending = true; render();
    if (state.uncertain && state.pendingPayload) {
      try {
        const check = await core.readBeforeRetry(API, state.pendingPayload);
        if (check.matches) { state.sending = false; showSuccess(check.day, state.pendingPayload.sem_producao); return; }
      } catch (_) {
        state.error = 'Não foi possível confirmar o estado no servidor. Conecte-se para tentar novamente.';
        state.sending = false; render(); return;
      }
    }
    state.sending = false;
    await send(Boolean(state.pendingPayload?.sem_producao), Boolean(state.pendingPayload?.confirmar));
  }
  root.addEventListener('click', async event => {
    if (event.target.closest('[data-exit]')) { window.parent.location.assign('/unificado/'); return; }
    const step = event.target.closest('[data-step]');
    if (step) {
      const id = step.dataset.id;
      const current = core.parseQuantity(state.values[id]);
      if (Number.isNaN(current)) return;
      const next = Math.max(0, current + Number(step.dataset.step));
      if (next > 999.5) return;
      state.values[id] = qty(next);
      const input = step.closest('.stepper')?.querySelector('input[data-id]');
      if (input) input.value = state.values[id];
      saveDraft();
      refreshTotals();
      return;
    }
    const group = event.target.closest('[data-group]');
    if (group) { state.group = group.dataset.group; await loadDay(); return; }
    const filter = event.target.closest('[data-filter]');
    if (filter) { state.historyFilter = filter.dataset.filter; render(); return; }
    const open = event.target.closest('[data-open-date]');
    if (open) { state.data = open.dataset.openDate; state.group = open.dataset.openGroup; await loadDay(); return; }
    const page = event.target.closest('[data-page]');
    if (page) {
      const dt = new Date(`${state.historyEnd}T12:00:00Z`);
      dt.setUTCDate(dt.getUTCDate() + (page.dataset.page==='older'?-31:31));
      state.historyEnd = dt.toISOString().slice(0,10) > todayISO() ? todayISO() : dt.toISOString().slice(0,10);
      await loadHistory(); return;
    }
    if (event.target.closest('[data-other-group]')) { state.group = state.group==='12'?'34':'12'; await loadDay(); return; }
    if (event.target.closest('[data-retry]')) { await retry(); return; }
    if (event.target.closest('[data-confirm-only]')) { await confirmOnly(); return; }
    const sendButton = event.target.closest('[data-send]');
    if (sendButton) { await send(sendButton.dataset.send==='no-production', state.intentConfirm); return; }
    const target = event.target.closest('[data-screen]');
    if (!target) return;
    if (target.dataset.screen === 'history') { await loadHistory(); return; }
    if (target.dataset.screen === 'review') {
      if (!totals().valid) return;
      state.intentConfirm = Boolean(state.day?.lancado && !state.day.sem_producao);
    }
    state.screen = target.dataset.screen; render();
  });
  root.addEventListener('change', async event => {
    if (event.target.id === 'mdo-m-date') { state.data = event.target.value || state.data; await loadDay(); }
    if (event.target.id === 'mdo-m-history-end') { state.historyEnd = event.target.value || state.historyEnd; await loadHistory(); }
  });
  root.addEventListener('input', event => {
    if (event.target.id === 'mdo-m-reason') { state.reason = event.target.value; return; }
    const id = event.target.dataset.id;
    if (!id) return;
    state.values[id] = event.target.value; saveDraft(); refreshTotals();
  });
  loadDay();
})();
