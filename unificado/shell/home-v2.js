/* Home v2 — padrão. ?home=v1 volta à home antiga (persistido em localStorage); ?home=v2 reativa. */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.has('home')) {
    try { localStorage.setItem('unificado_home', params.get('home') === 'v1' ? 'v1' : 'v2'); } catch { /* sem storage */ }
  }
  let enabled = params.get('home') !== 'v1';
  if (!params.has('home')) {
    try { enabled = localStorage.getItem('unificado_home') !== 'v1'; } catch { enabled = true; }
  }
  if (!enabled || params.has('view')) return;
  document.body.classList.add('home-v2');

  const fmt = n => Number(n).toLocaleString('pt-BR');
  const num = text => { const v = Number(String(text).replace(/\./g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };

  // A sessão do Mapa vem do login unificado; PCP atende contas sem vínculo no Mapa.
  const mapaSession = read('pwa_mapa_auth_session_v1') || {};
  const pcpSession = read('pcp_user') || {};
  const firstFilled = values => values.find(value => typeof value === 'string' && value.trim())?.trim() || '';
  const displayName = firstFilled([mapaSession.name, mapaSession.nome, pcpSession.nome, pcpSession.name]);
  const loginName = firstFilled([mapaSession.username, mapaSession.usuario, mapaSession.login,
    pcpSession.username, pcpSession.usuario, pcpSession.login, mapaSession.id, pcpSession.id]);
  const firstName = (displayName || loginName).split(/\s+/)[0];
  const compactTitle = document.querySelector('.opening-compact-title');
  if (compactTitle) {
    compactTitle.textContent = firstName ? `Bem-vindo, ${firstName}` : 'Bem-vindo';
    const period = document.createElement('span');
    period.className = 'accent-mark';
    period.textContent = '.';
    compactTitle.append(period);
  }
  const compactDate = document.getElementById('opening-compact-date');
  if (compactDate) compactDate.textContent = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  const updateButton = document.getElementById('platform-update');
  const updateStatus = document.getElementById('platform-update-status');
  const compactUpdateLabel = document.querySelector('.opening-update-compact-label');
  if (updateButton && updateStatus && compactUpdateLabel) {
    const syncUpdateLabel = () => {
      const status = updateStatus.textContent || '';
      const version = status.match(/v([\d.]+)\s+disponível/i)?.[1];
      compactUpdateLabel.textContent = version ? `Atualizar v${version}` :
        (status.startsWith('Atualizando') ? 'Atualizando…' : '');
    };
    new MutationObserver(syncUpdateLabel).observe(updateStatus, {childList:true, subtree:true, characterData:true});
    syncUpdateLabel();
  }

  // Saudação compacta e personalizada
  const user = read('pcp_user') || read('pwa_mapa_auth_session_v1') || {};
  const fullName = String(user.nome || user.name || user.username || user.usuario || '').trim();
  const first = fullName.split(/\s+/)[0];
  const hour = Number(new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false}).format(new Date()));
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const h1 = document.querySelector('.opening-hero h1');
  if (h1) h1.innerHTML = `${greeting}${first ? ', ' + first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : ''}<span class="accent-mark">.</span>`;

  // Faixa de KPIs (calculada a partir dos cards de setor já carregados)
  const content = document.querySelector('.content');
  const strip = document.createElement('section');
  strip.className = 'kpi-strip';
  strip.setAttribute('aria-label', 'Indicadores de hoje');
  const kpis = [
    ['programado', 'Programado hoje', 'bi-calendar3'],
    ['realizado', 'Realizado hoje', 'bi-check2-circle'],
    ['aderencia', 'Aderência', 'bi-speedometer2'],
    ['saldo', 'Falta produzir', 'bi-hourglass-split'],
  ];
  strip.innerHTML = kpis.map(([id, label, icon]) =>
    `<article class="kpi-card" data-kpi="${id}"><span class="kpi-label"><i class="bi ${icon}" aria-hidden="true"></i>${label}</span>` +
    `<strong class="kpi-value">—</strong></article>`).join('');
  const modules = document.querySelector('.opening-modules');
  content.insertBefore(strip, document.querySelector('section[aria-labelledby="sectors-title"]'));
  void modules;

  const setKpi = (id, value) => { const el = strip.querySelector(`[data-kpi="${id}"] .kpi-value`); if (el) el.textContent = value; };

  function refresh() {
    let prog = 0, real = 0, any = false;
    document.querySelectorAll('.sector-card').forEach(card => {
      const p = num(card.querySelector('[data-stat="programado"]')?.textContent);
      const r = num(card.querySelector('[data-stat="realizado"]')?.textContent);
      if (p !== null) { prog += p; any = true; }
      if (r !== null) real += r;
      const pct = p > 0 ? Math.min(100, Math.round(100 * (r || 0) / p)) : 0;
      let ring = card.querySelector('.sector-ring');
      if (!ring) {
        ring = document.createElement('div');
        ring.className = 'sector-ring';
        ring.setAttribute('aria-hidden', 'true');
        card.querySelector('.sector-stats')?.before(ring);
      }
      ring.style.setProperty('--p', pct);
      ring.innerHTML = `<span>${p === null ? '—' : pct + '%'}</span>`;
    });
    if (!any) return;
    setKpi('programado', fmt(prog));
    setKpi('realizado', fmt(real));
    setKpi('aderencia', prog > 0 ? Math.round(100 * real / prog) + '%' : '—');
    setKpi('saldo', fmt(Math.max(0, prog - real)));
  }

  const target = document.getElementById('sector-cards');
  if (target) new MutationObserver(refresh).observe(target, {childList: true, subtree: true, characterData: true});
  refresh();

  // Ícones por módulo
  const moduleIcons = {planejamento: 'bi-calendar3', produção: 'bi-gear-wide-connected', producao: 'bi-gear-wide-connected',
    qualidade: 'bi-patch-check', laboratório: 'bi-eyedropper', laboratorio: 'bi-eyedropper',
    usinas: 'bi-buildings', ged: 'bi-folder2-open', pederh: 'bi-people', faleaqui: 'bi-chat-dots'};
  const grid = document.getElementById('opening-module-grid');
  const decorate = () => grid?.querySelectorAll('.opening-module:not([data-v2])').forEach(link => {
    link.dataset.v2 = '1';
    const key = (link.querySelector('strong')?.textContent || '').trim().toLowerCase();
    link.dataset.module = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (link.querySelector('.opening-app-icon')) return;
    const icon = document.createElement('i');
    icon.className = `bi ${moduleIcons[key] || 'bi-grid'} module-icon`;
    icon.setAttribute('aria-hidden', 'true');
    link.prepend(icon);
  });
  if (grid) new MutationObserver(decorate).observe(grid, {childList: true});
  decorate();
})();
