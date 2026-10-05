const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 21v-7h6v7"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3"/></svg>',
  production: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V9l6 3V7l6 3V3l6 3v15zM7 17h2m3 0h2m3 0h2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V12m5 8V5m5 15v-9m5 9V8M2 21h20"/></svg>'
};

const sidebar = document.getElementById('sidebar');
const unificadoVersion = document.createElement('small');
unificadoVersion.id = 'unificado-version';
Object.assign(unificadoVersion.style, {position:'fixed',right:'6px',bottom:'5px',zIndex:'99999',
  background:'#0B1730',color:'white',padding:'3px 7px',borderRadius:'6px',font:'11px monospace'});
document.body.append(unificadoVersion);
fetch('/unificado/VERSION',{cache:'no-store'}).then(r=>r.ok?r.text():'')
  .then(value=>{unificadoVersion.textContent='v'+value.trim();}).catch(()=>{});
const pcpUser = (() => { try { return JSON.parse(localStorage.getItem('pcp_user') || 'null'); } catch { return null; } })();
const mapaUser = (() => { try { return JSON.parse(localStorage.getItem('pwa_mapa_auth_session_v1') || 'null'); } catch { return null; } })();
const hasPcp = Boolean(localStorage.getItem('pcp_token') && pcpUser);
const hasMapa = Boolean(mapaUser?.id && mapaUser?.role);
if (!hasPcp && !hasMapa) location.replace(new URL('login.html', UNIFICADO_BASE));
const storedModule = localStorage.getItem('unificado_modulo');
let currentModule = MENU_CONFIG[storedModule] && (storedModule === 'planejamento' ? hasPcp : hasMapa)
  ? storedModule : (hasPcp ? 'planejamento' : 'producao');
let activeItem = null;

function canUse(item) {
  const route = MENU_ITEMS[item.id] || item;
  if (route.module === 'producao') return hasMapa;
  if (!hasPcp) return false;
  const role = pcpUser?.nivel_acesso;
  if (route.require === 'ADMIN') return role === 'ADMIN';
  if (route.require === 'PCP') return role === 'ADMIN' || role === 'PCP';
  if (route.require === 'PRODUCAO') return role !== 'CONSULTA';
  return true;
}

function makeLink(item, className = 'nav-link') {
  const a = document.createElement('a');
  a.className = className;
  a.href = MENU_ITEMS[item.id].url;
  a.setAttribute('aria-disabled', String(!canUse(item)));
  if (!canUse(item)) a.classList.add('is-unavailable');
  a.dataset.item = item.id;
  if (!canUse(item)) a.title = 'Sem acesso a este módulo';
  if (item.mono) {
    const mono = document.createElement('span');
    mono.className = 'mono';
    mono.textContent = item.mono;
    a.append(mono);
  }
  const label = document.createElement('span');
  label.className = 'nav-link-label';
  label.textContent = item.label;
  a.append(label);
  a.addEventListener('click', (event) => {
    if (!canUse(item)) {
      event.preventDefault();
      return;
    }
    activeItem = item.id;
    sidebar.querySelectorAll('.is-active').forEach(el => {
      if (el.classList.contains('nav-link') || el.classList.contains('nav-home')) el.classList.remove('is-active');
    });
    a.classList.add('is-active');
  });
  return a;
}

function renderSidebar() {
  sidebar.replaceChildren();
  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = '<img src="/unificado/assets/img/logo-concrefer.png" alt="Concrefer" width="112"><img src="/unificado/assets/img/logo-concretrack.png" alt="ConcreTrack" width="34" height="34">';
  sidebar.append(brand);

  const switcher = document.createElement('div');
  switcher.className = 'module-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Módulo');
  for (const [key, config] of Object.entries(MENU_CONFIG)) {
    if (key === 'planejamento' && !hasPcp || key === 'producao' && !hasMapa) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `module-button${key === currentModule ? ' is-active' : ''}`;
    button.textContent = config.label;
    button.setAttribute('aria-pressed', key === currentModule ? 'true' : 'false');
    button.addEventListener('click', () => {
      currentModule = key;
      localStorage.setItem('unificado_modulo', key);
      renderSidebar();
    });
    switcher.append(button);
  }
  sidebar.append(switcher);

  const scroll = document.createElement('div');
  scroll.className = 'nav-scroll';
  const home = document.createElement('a');
  home.href = new URL('index.html', UNIFICADO_BASE).href;
  home.className = `nav-home${activeItem ? '' : ' is-active'}`;
  home.innerHTML = `${ICONS.home}<span>Início</span>`;
  home.addEventListener('click', () => { activeItem = null; });
  scroll.append(home);

  MENU_CONFIG[currentModule].groups.forEach((group, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group';
    if (group.label) {
      if (currentModule === 'planejamento') {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'group-title';
        toggle.innerHTML = `<span>${group.label}</span>${ICONS.chevron}`;
        toggle.setAttribute('aria-expanded', 'true');
        const items = document.createElement('div');
        items.className = 'group-items';
        toggle.addEventListener('click', () => {
          const open = toggle.getAttribute('aria-expanded') !== 'true';
          toggle.setAttribute('aria-expanded', String(open));
          items.hidden = !open;
        });
        wrapper.append(toggle, items);
      } else {
        const heading = document.createElement('div');
        heading.className = 'group-title';
        heading.textContent = group.label;
        wrapper.append(heading);
        const items = document.createElement('div');
        items.className = 'group-items';
        wrapper.append(items);
      }
    }
    const container = group.label ? wrapper.querySelector('.group-items') : wrapper;
    group.items.filter(canUse).forEach(item => {
      const link = makeLink(item);
      if (activeItem === item.id) link.classList.add('is-active');
      container.append(link);
    });
    if (!group.label && index === 0) wrapper.classList.add('ungrouped');
    if (container.children.length) scroll.append(wrapper);
  });
  sidebar.append(scroll);
  const users = document.createElement('a');
  users.className = 'nav-footer';
  users.href = hasPcp && pcpUser?.nivel_acesso === 'ADMIN'
    ? new URL('usuarios/', PCP_BASE).href
    : new URL('operacao/?tela=USUARIOS', MAPA_BASE).href;
  users.innerHTML = `${ICONS.users}<span>Usuários</span>`;
  if (pcpUser?.nivel_acesso === 'ADMIN' || hasMapa && mapaUser?.role === 'GERENCIA') sidebar.append(users);
}

function shortcutLink(id, label) {
  const item = MENU_ITEMS[id];
  const a = makeLink(item, 'shortcut-link');
  a.replaceChildren();
  const span = document.createElement('span');
  span.textContent = label || item.label;
  a.append(span);
  a.insertAdjacentHTML('beforeend', ICONS.arrow);
  return a;
}

function renderSectors() {
  const target = document.getElementById('sector-cards');
  [1, 2, 3, 4].forEach((sector) => {
    const card = document.createElement('article');
    card.className = 'sector-card';
    card.dataset.sector = String(sector);
    card.innerHTML = `<div class="sector-top"><span class="sector-number">S0${sector}</span><span class="capacity">Hoje</span></div><h3>Setor ${sector}</h3><div class="sector-stats"><div><span class="stat-label">Programado (PCP)</span><span class="stat-value" data-stat="programado">—</span></div><div><span class="stat-label">Realizado (Mapa)</span><span class="stat-value" data-stat="realizado">—</span></div></div><div class="progress-track" aria-label="Dados em carregamento"></div><div class="sector-actions"></div>`;
    const actions = card.querySelector('.sector-actions');
    const plan = MENU_ITEMS[sector <= 2 ? 'programacao12' : 'programacao34'];
    const production = MENU_ITEMS[`setor${sector}`];
    for (const [item, label, className] of [[plan, 'Programação', 'button-secondary'], [production, 'Produção', 'button-primary']]) {
      const a = document.createElement('a');
      a.className = `button ${className}`;
      a.href = item.url;
      if (!canUse(item)) continue;
      a.textContent = label;
      actions.append(a);
    }
    target.append(card);
  });
}

function renderShortcuts() {
  const groups = [
    { title: 'Planejamento', icon: ICONS.plan, items: [['programacao12', 'Programação'], ['relatorio12', 'Relatórios de Programação'], ['etiquetas', 'Etiquetas'], ['acompMensal'], ['apontamentoMega']] },
    { title: 'Produção e montagem', icon: ICONS.production, items: [['liberacao'], ['mandril'], ['inspecao'], ['montagem'], ['manutencao']] },
    { title: 'Indicadores', icon: ICONS.chart, items: [['comparacao'], ['dashMontagem'], ['dashDefeitos'], ['produtividade'], ['historico']] }
  ];
  const target = document.getElementById('shortcut-grid');
  groups.forEach(group => {
    const card = document.createElement('article');
    card.className = 'shortcut-card';
    card.innerHTML = `<div class="shortcut-card-header"><span class="shortcut-icon">${group.icon}</span><h3>${group.title}</h3></div><div class="shortcut-list"></div>`;
    const list = card.querySelector('.shortcut-list');
    group.items.filter(([id]) => canUse(MENU_ITEMS[id]))
      .forEach(([id, label]) => list.append(shortcutLink(id, label)));
    if (list.children.length) target.append(card);
  });
}

const today = new Date();
const dateISO = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Sao_Paulo',
  year:'numeric', month:'2-digit', day:'2-digit'}).format(today);
document.getElementById('today').textContent = new Intl.DateTimeFormat('pt-BR', {
  timeZone:'America/Sao_Paulo', weekday:'long', day:'numeric', month:'long', year:'numeric'
}).format(today);
const displayUser = hasPcp ? pcpUser : mapaUser;
document.querySelector('.user-pill strong').textContent = displayUser?.nome || displayUser?.name || 'Usuário';
document.querySelector('.user-pill small').textContent = hasPcp && hasMapa ?
  `${pcpUser.nivel_acesso} / ${mapaUser.role}` : (hasPcp ? pcpUser.nivel_acesso : mapaUser?.role);
document.querySelector('.user-pill .avatar').textContent = (displayUser?.nome || displayUser?.name || 'U').slice(0,1).toUpperCase();
const exit = document.querySelector('.exit-button');
exit.disabled = false;
exit.title = 'Sair';
exit.addEventListener('click', () => UnificadoAuth.logout());
renderSidebar();
renderSectors();
renderShortcuts();

async function loadSectorData() {
  const requests = [];
  if (hasPcp) requests.push(fetch(`/unificado/pcp/api/dashboard?data_inicio=${dateISO}&data_fim=${dateISO}`, {
    headers: {Authorization: `Bearer ${localStorage.getItem('pcp_token')}`}, cache:'no-store'
  }).then(async response => { if (!response.ok) throw new Error(`PCP HTTP ${response.status}`); return response.json(); }));
  else requests.push(Promise.resolve(null));
  if (hasMapa) requests.push(fetch(`/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1?p_data_inicio=${dateISO}&p_data_fim=${dateISO}&p_scope=ALL`, {
    credentials:'same-origin', cache:'no-store'
  }).then(async response => { if (!response.ok) throw new Error(`Mapa HTTP ${response.status}`); return response.json(); }));
  else requests.push(Promise.resolve(null));
  const [pcpResult, mapaResult] = await Promise.allSettled(requests);
  const pcpData = pcpResult.status === 'fulfilled' ? pcpResult.value : null;
  const mapaData = mapaResult.status === 'fulfilled' ? mapaResult.value : null;
  for (const card of document.querySelectorAll('.sector-card')) {
    const sector = Number(card.dataset.sector);
    const programmed = pcpData?.por_setor?.find(row => Number(row.setor_id) === sector)?.qtd_programada;
    const produced = mapaData?.by_sector?.[`S${sector}`] ?? (mapaData ? 0 : null);
    card.querySelector('[data-stat="programado"]').textContent = programmed == null ? '—' :
      Number(programmed).toLocaleString('pt-BR');
    card.querySelector('[data-stat="realizado"]').textContent = produced == null ? '—' :
      Number(produced).toLocaleString('pt-BR');
    const ratio = Number(programmed) > 0 ? Math.min(100, 100 * Number(produced || 0) / Number(programmed)) : 0;
    card.querySelector('.progress-track').style.background =
      `linear-gradient(90deg, #E8762A ${ratio}%, #F1F3F6 ${ratio}%)`;
    card.querySelector('.progress-track').setAttribute('aria-label',
      programmed == null || produced == null ? 'Um módulo sem acesso ou sem resposta' :
      `${Math.round(ratio)}% do programado`);
  }
  const note = document.querySelector('.sample-note');
  note.textContent = `Dados de ${dateISO.split('-').reverse().join('/')}` +
    (pcpResult.status === 'rejected' || mapaResult.status === 'rejected' ?
     ' · Uma fonte não respondeu' : '');
}
loadSectorData();
