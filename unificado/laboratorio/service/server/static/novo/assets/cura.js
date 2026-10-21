(() => {
  const $ = (selector) => document.querySelector(selector);
  const app = $('.app');
  if (!app) return;
  app.classList.add('preview-shell', 'preview-cura');
  $('.sidebar')?.classList.add('preview-sidebar');
  $('.main')?.classList.add('preview-main');
  $('.topbar')?.classList.add('preview-top');
  $('.content')?.classList.add('preview-content');

  const sidebar = $('.sidebar');
  const brand = sidebar?.querySelector('.brand');
  if (brand) {
    brand.innerHTML = '<a href="/novo" class="preview-brand-link" aria-label="Concretrack, início da prévia"><span class="brand-mark">CT</span><span><strong>Concretrack</strong><small>INSPEÇÃO E ENSAIOS</small></span></a>';
  }
  const nav = sidebar?.querySelector('.nav');
  let helpNav = null;
  if (nav) {
    const links = [...nav.children];
    helpNav = links[3];
    nav.innerHTML = '';
    const section = (label, items) => {
      const title = document.createElement('div');
      title.className = 'preview-nav-title';
      title.textContent = label;
      nav.append(title, ...items);
    };
    section('CURA TÉRMICA', links.slice(0, 3));
    section('POSTES', links.slice(4, 6));
    for (const link of nav.querySelectorAll('a')) {
      if (link.href.includes('tab=absorcao')) { link.href = '/novo/postes?tab=absorcao'; link.dataset.icon = '◉'; }
      else { link.href = '/novo/postes'; link.dataset.icon = '▤'; }
    }
    const postLink = (label, href, icon) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.dataset.icon = icon;
      nav.append(link);
      return link;
    };
    postLink('Histórico de ensaios', '/novo/postes?tab=historico', '▦');
    postLink('Cadastros', '/novo/postes?tab=cadastros', '▧');
    const criteriaLink = postLink('Critérios', '/novo/postes?tab=criterios', '⚑');
    criteriaLink.hidden = true;
    fetch('/api/auth/me', {credentials:'same-origin'}).then(response => response.ok ? response.json() : null).then(user => {
      criteriaLink.hidden = !user || !['admin','engenheiro'].includes(user.role);
      const mobileCriteria = $('#previewMobileCriteria');
      if (mobileCriteria) mobileCriteria.hidden = criteriaLink.hidden;
      const username = sidebar?.querySelector('.preview-sidebar-user');
      if (username && user) username.textContent = `${user.username} · ${user.role}`;
    }).catch(() => {});
    const monitorLink = document.createElement('a');
    monitorLink.href = '/novo';
    monitorLink.className = 'preview-sidebar-sub';
    monitorLink.textContent = 'Visão geral';
    nav.querySelector('button[data-view="history"]')?.before(monitorLink);
  }
  sidebar?.querySelector('.navlabel')?.remove();
  const sideBottom = sidebar?.querySelector('.sidebottom');
  if (sideBottom) {
    sideBottom.innerHTML = '<span class="preview-sidebar-user">Concretrack · operador</span><a href="/">Voltar ao layout atual ↗</a>';
    if (helpNav) sideBottom.prepend(helpNav);
    const logout = $('#logout');
    if (logout) sideBottom.append(logout);
  }

  const top = $('.topbar');
  if (top) {
    top.querySelector('.crumb')?.replaceChildren(document.createTextNode('Início / Cura térmica'));
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'preview-back';
    back.textContent = '← Voltar';
    back.setAttribute('aria-label', 'Voltar à tela anterior');
    back.onclick = () => {
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) history.back();
      else location.assign('/unificado/');
    };
    top.prepend(back);
    const theme = document.createElement('button');
    theme.type = 'button';
    theme.className = 'preview-theme';
    theme.setAttribute('aria-label', 'Alternar tema');
    theme.textContent = '◐';
    top.querySelector('.user')?.prepend(theme);
    const applyTheme = (value) => { app.dataset.theme = value; document.documentElement.dataset.previewTheme = value; localStorage.setItem('concretrack-preview-theme', value); };
    applyTheme(localStorage.getItem('concretrack-preview-theme') || (matchMedia('(min-width: 1200px)').matches ? 'dark' : 'light'));
    theme.onclick = () => applyTheme(app.dataset.theme === 'dark' ? 'light' : 'dark');
    const connection = document.createElement('span');
    connection.className = 'preview-chip';
    connection.id = 'previewConnection';
    top.querySelector('.user')?.insertBefore(connection, $('#fullscreenButton'));
    const online = $('#onlineBadge');
    const updateConnection = () => { connection.textContent = online?.textContent || 'Aguardando dados'; };
    if (online) new MutationObserver(updateConnection).observe(online, {childList: true, subtree: true, characterData: true});
    updateConnection();
  }
  const monitor = $('#view-monitor');
  const context = monitor?.querySelector('.contextbar');
  if (context) {
    const data = document.createElement('div');
    data.className = 'item';
    data.innerHTML = '<span>SITUAÇÃO DOS DADOS</span><strong id="previewDataStatus">Aguardando primeiro pacote</strong>';
    context.querySelector('.status')?.before(data);
    const last = $('#lastUpdate');
    const syncData = () => { data.querySelector('strong').textContent = last?.textContent || 'Aguardando primeiro pacote'; };
    if (last) new MutationObserver(syncData).observe(last, {childList:true,subtree:true,characterData:true});
    syncData();
  }
  const middle = monitor?.querySelector('.middle');
  const summary = middle?.querySelector('.summary');
  const events = monitor?.querySelector('.events');
  if (middle && summary && events) {
    const side = document.createElement('div');
    side.className = 'preview-monitor-side';
    side.append(summary, events);
    middle.append(side);
    const storage = monitor.querySelector('.storagecard');
    if (storage) { storage.querySelector('h2').textContent = 'Armazenamento'; $('#view-settings .two-col')?.append(storage); }
    monitor.querySelector('.bottom')?.remove();
  }

  const cards = $('#sensorCards');
  const delta = $('#deltaValue');
  const syncDelta = () => {
    if (!cards || !delta) return;
    let card = $('#previewDeltaCard');
    if (!card) {
      card = document.createElement('article');
      card.id = 'previewDeltaCard';
      card.className = 'card preview-delta-card';
      card.innerHTML = '<div class="preview-delta-label">DIFERENÇA NÚCLEO − AMBIENTE</div><div class="preview-delta-value"></div><p>Concreto em relação ao ambiente</p>';
      cards.prepend(card);
    }
    card.querySelector('.preview-delta-value').innerHTML = delta.innerHTML;
    const readingAt = typeof status !== 'undefined' ? (status?.live?.received_at_ms || history?.latest?.ts_ms) : null;
    for (const sensor of cards.querySelectorAll('.sensor')) {
      let time = sensor.querySelector('.preview-reading-time');
      if (!time) { time = document.createElement('time'); time.className = 'preview-reading-time'; sensor.append(time); }
      time.textContent = readingAt ? new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(readingAt) : 'Sem horário de leitura';
    }
  };
  if (cards) new MutationObserver(syncDelta).observe(cards, {childList: true});
  if (delta) new MutationObserver(syncDelta).observe(delta, {childList: true, subtree: true, characterData: true});
  syncDelta();

  const chart = $('#chart');
  const chartLabels = () => {
    if (!chart || chart.querySelector('.preview-chart-end')) return;
    const colors = ['#2F6FED', '#12A5A5', '#8A5CF6', '#7A8496'];
    for (const [index, color] of colors.entries()) {
      const path = [...chart.querySelectorAll('path')].find(p => p.getAttribute('stroke') === color);
      if (!path) continue;
      const distance = path.getTotalLength();
      const lastMatch = [...(path.getAttribute('d') || '').matchAll(/[ML]([\d.]+),([\d.]+)/g)].at(-1);
      const point = distance ? path.getPointAtLength(distance) : lastMatch ? {x:Number(lastMatch[1]),y:Number(lastMatch[2])} : null;
      if (!point) continue;
      if (!distance) {
        for (const match of (path.getAttribute('d') || '').matchAll(/M([\d.]+),([\d.]+)/g)) {
          const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          marker.setAttribute('class', 'preview-chart-end');
          marker.setAttribute('cx', match[1]);
          marker.setAttribute('cy', match[2]);
          marker.setAttribute('r', '2.6');
          marker.setAttribute('fill', color);
          chart.append(marker);
        }
      }
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'preview-chart-end');
      label.setAttribute('x', String(point.x - 5));
      label.setAttribute('y', String(point.y - 7));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('style', `fill:${color};font-weight:700;font-size:11px`);
      label.textContent = `T${index + 1}`;
      chart.append(label);
    }
  };
  if (chart) new MutationObserver(chartLabels).observe(chart, {childList: true});
  chartLabels();

  const initialView = new URLSearchParams(location.search).get('view');
  if (['monitor', 'history', 'settings', 'help'].includes(initialView)) {
    sidebar?.querySelector(`button[data-view="${initialView}"]`)?.click();
  }
  const bottom = document.createElement('nav');
  bottom.className = 'preview-bottom-nav';
  bottom.setAttribute('aria-label', 'Navegação da prévia');
  bottom.innerHTML = '<a href="/novo"><span class="preview-nav-icon">◫</span>Cura</a><a href="/novo/postes"><span class="preview-nav-icon">▤</span>Postes</a><a href="/novo/postes?tab=absorcao"><span class="preview-nav-icon">◉</span>Absorção</a><button type="button" id="previewMore"><span class="preview-nav-icon">☰</span>Mais</button>';
  app.append(bottom);
  const more = document.createElement('div');
  more.className = 'preview-mobile-more';
  more.hidden = true;
  more.innerHTML = '<a href="/novo?view=history">Histórico de cura</a><a href="/novo?view=settings">Dispositivo</a><a href="/novo/postes?tab=historico">Histórico de ensaios</a><a href="/novo/postes?tab=cadastros">Cadastros</a><a href="/novo/postes?tab=criterios" id="previewMobileCriteria" hidden>Critérios</a><a href="/novo?view=help">Como funciona</a><button type="button" id="previewMobileLogout">Sair</button>';
  app.append(more);
  $('#previewMore').onclick = () => { more.hidden = !more.hidden; };
  $('#previewMobileLogout').onclick = () => $('#logout')?.click();
})();
