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
const storedModule = localStorage.getItem('unificado_modulo');
let currentModule = MENU_CONFIG[storedModule] ? storedModule : 'planejamento';
let activeItem = null;

function makeLink(item, className = 'nav-link') {
  const a = document.createElement('a');
  a.className = className;
  a.href = MENU_ITEMS[item.id].url;
  a.setAttribute('aria-disabled', String(!item.available));
  if (!item.available) a.classList.add('is-unavailable');
  a.dataset.item = item.id;
  if (!item.available) a.title = 'Disponível após integrar e validar este módulo';
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
    if (!item.available) {
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
  brand.innerHTML = '<span class="brand-icon">C</span><span><span class="brand-name">Concrefer</span><span class="brand-subtitle">Planejamento e produção</span></span>';
  sidebar.append(brand);

  const switcher = document.createElement('div');
  switcher.className = 'module-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Módulo');
  for (const [key, config] of Object.entries(MENU_CONFIG)) {
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
    group.items.forEach(item => {
      const link = makeLink(item);
      if (activeItem === item.id) link.classList.add('is-active');
      container.append(link);
    });
    if (!group.label && index === 0) wrapper.classList.add('ungrouped');
    scroll.append(wrapper);
  });
  sidebar.append(scroll);
  const users = document.createElement('a');
  users.className = 'nav-footer';
  users.href = new URL('usuarios/', PCP_BASE).href;
  users.setAttribute('aria-disabled', 'true');
  users.classList.add('is-unavailable');
  users.addEventListener('click', (event) => event.preventDefault());
  users.innerHTML = `${ICONS.users}<span>Usuários</span>`;
  sidebar.append(users);
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
  [90, 80, 52, 86].forEach((capacity, index) => {
    const sector = index + 1;
    const card = document.createElement('article');
    card.className = 'sector-card';
    card.innerHTML = `<div class="sector-top"><span class="sector-number">S0${sector}</span><span class="capacity">${capacity} formas</span></div><h3>Setor ${sector}</h3><div class="sector-stats"><div><span class="stat-label">Programado</span><span class="stat-value">—</span></div><div><span class="stat-label">Realizado</span><span class="stat-value">—</span></div></div><div class="progress-track" aria-label="Progresso sem dados"></div><div class="sector-actions"></div>`;
    const actions = card.querySelector('.sector-actions');
    const plan = MENU_ITEMS[sector <= 2 ? 'programacao12' : 'programacao34'];
    const production = MENU_ITEMS[`setor${sector}`];
    for (const [item, label, className] of [[plan, 'Programação', 'button-secondary'], [production, 'Produção', 'button-primary']]) {
      const a = document.createElement('a');
      a.className = `button ${className}`;
      a.href = item.url;
      a.setAttribute('aria-disabled', String(!item.available));
      if (!item.available) {
        a.classList.add('is-unavailable');
        a.addEventListener('click', (event) => event.preventDefault());
      }
      a.textContent = label;
      if (!item.available) a.title = 'Disponível após integrar e validar este módulo';
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
    group.items.forEach(([id, label]) => list.append(shortcutLink(id, label)));
    target.append(card);
  });
}

document.getElementById('today').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
renderSidebar();
renderSectors();
renderShortcuts();
