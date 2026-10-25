/* Dados reais do painel. Layout, cores e tempos seguem o mockup aprovado. */
(() => {
  'use strict';
  const zone = 'America/Sao_Paulo';
  const params = new URLSearchParams(location.search);
  let unit = (params.get('unidade') || 'campinas').toLowerCase();
  if (unit === 'pederneiras') {
    unit = 'campinas';
    params.set('unidade', unit);
    history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`);
  }
  const fixedDate = params.get('data'); // conferência histórica no ambiente de teste
  const durations = [30, 20, 20, 20, 20];
  const names = ['Visão geral', 'Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'];
  const view = document.getElementById('view');
  const timer = document.getElementById('timer');
  const pause = document.getElementById('pause');
  const alert = document.getElementById('tv-alert');
  let payload = null;
  let current = 0;
  let paused = false;
  let started = Date.now();
  let elapsed = 0;
  let wakeLock = null;

  const text = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const localDate = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const localTime = value => new Intl.DateTimeFormat('pt-BR', {
    timeZone: zone, hour: '2-digit', minute: '2-digit'
  }).format(value ? new Date(value) : new Date());
  const fmt = value => value == null ? '—' : Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1, maximumFractionDigits: 1
  });
  const pct = (part, whole) => whole ? Math.min(100, Math.round(part * 100 / whole)) : 0;
  const percentage = item => item.percentual_realizado == null ? '—' : `${item.percentual_realizado}%`;
  const sector = i => payload?.setores?.[i];
  const tiles = rows => (rows || []).map(row => {
    const kind = {sem_programacao: 'livre', programada: 'prog', concretada: 'real', liberada: 'lib'}[row.estado] || 'livre';
    const details = `Forma ${row.codigo} · ${row.tipo || 'tipo não identificado'}${row.fora_programacao ? ' · concretada fora da programação' : ''}`;
    return `<div class="f ${kind}" title="${text(details)}" aria-label="${text(details)}">${text(row.codigo)}</div>`;
  }).join('');
  const bar = (item, className) => {
    const ready = (item.formas || []).filter(form => form.estado === 'liberada').length;
    const green = pct(item.concretadas, item.programadas);
    const blue = pct(ready, item.programadas);
    const missing = Math.max(0, 100 - green - blue);
    return `<div class="${className}" role="img" aria-label="${percentage(item)} conciliado com a programação"><i class="b-real" style="width:${green}%"></i><i class="b-lib" style="width:${blue}%"></i><i class="b-falta" style="width:${missing}%"></i></div>`;
  };
  const volume = item => {
    const actual = item.volume_realizado_m3;
    const planned = item.volume_previsto_m3;
    const ratio = actual != null && planned ? pct(actual, planned) : 0;
    return `<div class="vol"><span>Concreto conciliado${actual != null ? ' · estimado' : ''}</span><div class="vbar" role="img" aria-label="Volume de concreto conciliado"><i style="width:${ratio}%"></i></div><span><b>${fmt(actual)}</b> / ${fmt(planned)} m³${planned && actual != null ? ` (${ratio}%)` : ''}</span></div>`;
  };
  const heading = item => {
    const p = item.percentual_realizado;
    const capacity = item.formas_confirmadas !== item.formas_cadastradas
      ? `${item.formas_confirmadas} formas confirmadas · ${item.formas_cadastradas} cadastradas no PCP`
      : `${item.formas_cadastradas} formas cadastradas`;
    return `<div class="sh"><h2>${text(item.nome)}<small>${text(item.fonte_programacao)} · ${capacity}</small></h2>
      <div class="pct ${p != null && p < 60 ? 'alerta' : ''}"><b>${percentage(item)}</b><span>conciliado</span></div></div>
      <div class="barwrap">${bar(item, 'bar')}<div class="nums">
      <span>Programadas <b>${item.programadas}</b></span>
      <span>Realizado Mapa <b>${item.apontadas_mapa}</b> <small>etiquetas${item.concretadas_fora_programacao ? `; ${item.concretadas_fora_programacao} fora da programação` : ''}</small></span>
      <span>Conciliadas <b>${item.concretadas}</b></span>
      ${item.referencia_planilha_realizado != null ? `<span>Planilha <b>${item.referencia_planilha_realizado}</b> <small>postes; diferença ${item.apontadas_mapa - item.referencia_planilha_realizado > 0 ? '+' : ''}${item.apontadas_mapa - item.referencia_planilha_realizado}</small></span>` : ''}
      <span>Liberadas <b>${item.liberadas}</b></span>
      <span class="nf">Sem conciliação <b>${item.faltam} (${item.percentual_falta == null ? '—' : item.percentual_falta + '%'})</b></span>
      </div></div>${volume(item)}`;
  };
  const overview = () => `<div class="grid">${payload.setores.map(item =>
    `<section class="setor" aria-label="${text(item.nome)}">${heading(item)}<div class="formas" style="--cols:24">${tiles(item.formas)}</div></section>`
  ).join('')}</div>`;
  const detail = index => {
    const item = sector(index);
    const byCode = new Map(item.formas.map(row => [row.codigo, row]));
    const groups = (item.tipos || []).filter(group => group.programadas || group.formas.length);
    const rows = groups.map(group => {
      const forms = group.formas.map(code => byCode.get(code)).filter(Boolean);
      const groupStats = {...group, formas: forms};
      const p = pct(group.concretadas, group.programadas);
      return `<div class="tipo"><h3>${text(group.tipo)}<small>Concreto ${fmt(group.volume_realizado_m3)} / ${fmt(group.volume_previsto_m3)} m³</small></h3>
        <div class="formas">${tiles(forms)}</div><div class="tres"><div class="big" style="color:${p < 60 ? 'var(--falta)' : 'var(--real)'}">${group.concretadas}<em> / ${group.programadas} · ${group.programadas ? p + '%' : '—'}</em></div>
        ${bar(groupStats, 'tbar')}<div class="mini"><span>Liberadas <b>${group.liberadas}</b></span><span class="nf">Faltam <b>${Math.max(0, group.programadas - group.concretadas)}</b></span></div></div></div>`;
    }).join('');
    const free = item.formas.filter(form => form.estado === 'sem_programacao').length;
    return `<section class="det${groups.length >= 6 ? ' dense' : ''}" aria-label="${text(item.nome)} por tipo de poste">${heading(item)}<div class="tipos">${rows}</div>
      ${free ? `<div class="livres">${free} formas do layout sem programação neste setor</div>` : ''}</section>`;
  };
  function render(animate = false) {
    if (!payload) return;
    document.getElementById('kpis').innerHTML = (() => {
      const item = payload.total;
      return `<div class="kpi prog"><span>Programado</span><b>${item.programadas}</b><small>formas alocadas</small></div>
        <div class="kpi real"><span>Realizado Mapa</span><b>${item.apontadas_mapa}</b><small>etiquetas apontadas</small></div>
        <div class="kpi real"><span>Conciliação</span><b>${percentage(item)}</b><small>${item.concretadas} formas programadas</small></div>
        <div class="kpi falta"><span>Sem conciliação</span><b>${item.faltam}</b><small>${item.percentual_falta == null ? '—' : item.percentual_falta + '%'} do programado</small></div>
        <div class="kpi lib"><span>Liberadas</span><b>${item.liberadas}</b></div>
        <div class="kpi"><span>Concreto conciliado m³</span><b>${fmt(item.volume_realizado_m3)}</b><small>de ${fmt(item.volume_previsto_m3)} previstos · estimado</small></div>`;
    })();
    view.innerHTML = current === 0 ? overview() : detail(current - 1);
    if (animate) { view.classList.remove('entra'); void view.offsetWidth; view.classList.add('entra'); }
    document.querySelectorAll('.tab').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.i) === current)));
    const warnings = payload.avisos || [];
    const warning = document.getElementById('warnings');
    warning.textContent = warnings.slice(0, 2).join(' · ') + (warnings.length > 2 ? ` · +${warnings.length - 2} avisos` : '');
    warning.title = warnings.join('\n');
    document.getElementById('atualizado').textContent = `lido às ${localTime(payload.lido_em)}`;
  }
  function show(index) {
    current = (index + 5) % 5;
    started = Date.now(); elapsed = 0; timer.style.width = '0%';
    render(true);
  }
  function tick() {
    if (paused) return;
    const fraction = (Date.now() - started) / (durations[current] * 1000);
    timer.style.width = `${Math.min(100, fraction * 100)}%`;
    if (fraction >= 1) show(current + 1);
  }
  function clock() {
    document.getElementById('hora').textContent = localTime();
    const dateValue = fixedDate ? new Date(`${fixedDate}T12:00:00-03:00`) : new Date();
    document.getElementById('data').textContent = new Intl.DateTimeFormat('pt-BR', {
      timeZone: zone, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(dateValue);
  }
  async function refresh() {
    const day = fixedDate || localDate();
    const url = `/unificado/painel-tv/api/resumo?unidade=${encodeURIComponent(unit)}&data=${day}`;
    try {
      const renewed = await fetch('/unificado/mapa/api/unified/screen-access/me', {
        cache: 'no-store', credentials: 'same-origin'
      });
      if (!renewed.ok) throw new Error(`Sessão indisponível (HTTP ${renewed.status})`);
      const response = await fetch(url, {cache: 'no-store', credentials: 'same-origin'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const fresh = await response.json();
      if (!Array.isArray(fresh.setores) || fresh.setores.length !== 4) throw new Error('Resumo incompleto');
      payload = fresh;
      sessionStorage.setItem(`painel-tv:${unit}:${day}`, JSON.stringify(fresh));
      alert.hidden = true;
      render();
    } catch (error) {
      if (!payload || payload.data !== day) {
        try { payload = JSON.parse(sessionStorage.getItem(`painel-tv:${unit}:${day}`) || 'null'); } catch (_) { payload = null; }
      }
      if (payload) render();
      else view.innerHTML = '<div class="loading">Aguardando dados da produção…</div>';
      alert.textContent = `Sem atualização desde ${payload ? localTime(payload.lido_em) : '—:—'}. ${error.message}`;
      alert.hidden = false;
    }
  }
  async function requestWakeLock() {
    if (!navigator.wakeLock || document.visibilityState !== 'visible') return;
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { wakeLock = null; }
  }
  document.getElementById('tabs').innerHTML = names.map((name, i) =>
    `<button class="tab" type="button" data-i="${i}">${name}</button>`).join('');
  document.getElementById('tabs').addEventListener('click', event => {
    const button = event.target.closest('.tab'); if (button) show(Number(button.dataset.i));
  });
  pause.addEventListener('click', () => {
    paused = !paused; pause.textContent = paused ? 'Continuar' : 'Pausar';
    if (paused) elapsed = Date.now() - started; else started = Date.now() - elapsed;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') show(current + 1);
    if (event.key === 'ArrowLeft') show(current - 1);
  });
  document.addEventListener('visibilitychange', requestWakeLock);
  clock(); refresh(); requestWakeLock();
  setInterval(tick, 250);
  setInterval(clock, 10000);
  setInterval(refresh, 60000);
})();
