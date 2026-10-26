const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 21v-7h6v7"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3"/></svg>',
  production: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V9l6 3V7l6 3V3l6 3v15zM7 17h2m3 0h2m3 0h2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V12m5 8V5m5 15v-9m5 9V8M2 21h20"/></svg>'
};

const PCP_ICONS = {dashboard:'bi-speedometer2',comparacao:'bi-bar-chart',programacao12:'bi-calendar3',
  programacao34:'bi-calendar3',circular3:'bi-circle',dt4:'bi-circle',programacaoFinal:'bi-calendar-check',
  relatorio12:'bi-file-earmark-text',relatorio3:'bi-file-earmark-text',relatorio4:'bi-file-earmark-text',
  etiquetas:'bi-upc',etiquetasSc:'bi-upc',etiquetasArmaduras:'bi-upc',pcpDiario:'bi-journal-text',
  acompMensal:'bi-graph-up',acompMensal34:'bi-graph-up',apontamentoMega:'bi-clipboard-data',
  producaoPcp:'bi-gear',maodeobra:'bi-people',maodeobraRateio:'bi-people',
  formasPorSetor:'bi-grid-3x3-gap',fechamentoDiarioPcp:'bi-file-earmark-text',testeProgramacao:'bi-wrench'};
const sidebar = document.getElementById('sidebar');
const installedPwa = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const phoneDevice = navigator.userAgentData?.mobile === true || /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
const tabletDevice = /iPad|Tablet|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const sharedMenuViewport = matchMedia('(min-width: 601px)');
const narrowTabletViewport = matchMedia('(min-width: 601px) and (max-width: 1024px)');
const tabletMenuMode = () => sharedMenuViewport.matches &&
  (narrowTabletViewport.matches || tabletDevice);
const sharedMenuAllowed = () => !installedPwa && !phoneDevice && sharedMenuViewport.matches &&
  !document.body.classList.contains('kiosk-active');
const modelASidebarAllowed = () => sharedMenuAllowed() &&
  !document.body.classList.contains('unificado-model-a-failed');
document.body.classList.toggle('unificado-model-a', modelASidebarAllowed());
document.body.classList.toggle('unificado-shared-menu', sharedMenuAllowed());
document.body.classList.toggle('unificado-tablet-menu', sharedMenuAllowed() && tabletMenuMode());
document.body.classList.toggle('unificado-menu-collapsed',
  localStorage.getItem('unificado_menu_collapsed') === '1' && !tabletMenuMode());
const pcpUser = (() => { try { return JSON.parse(localStorage.getItem('pcp_user') || 'null'); } catch { return null; } })();
const mapaUser = (() => { try { return JSON.parse(localStorage.getItem('pwa_mapa_auth_session_v1') || 'null'); } catch { return null; } })();
const hasPcp = Boolean(localStorage.getItem('pcp_token') && pcpUser);
const hasMapa = Boolean(mapaUser?.id && mapaUser?.role);
const masterIds = new Set(['user-ricardo', 'marcelo', 'alex', 'philippe']);
let hasLab = hasMapa;
let previewModules = false;
let hasGedAccess = false;
let suprimentosFlags = {};
let grantedScreens = null;
const moduleHasScreens = module => grantedScreens === null || Object.values(MENU_ITEMS).some(
  item => item.module === module && grantedScreens.has(item.permissionId || item.id));
const canAccessModule = module =>
  (masterIds.has(mapaUser?.id) && hasMapa ? true :
   module === 'qualidade' ? previewModules && hasMapa :
   module === 'planejamento' ? hasPcp : module === 'producao' || module === 'usinas' ? hasMapa :
   module === 'suprimentos' ? hasMapa && suprimentosFlags.S1 === true : hasLab) &&
   (module !== 'suprimentos' || suprimentosFlags.S1 === true) && moduleHasScreens(module);
async function recoverMdoShellSession() {
  const view = new URLSearchParams(location.search).get('view');
  if (view !== 'pcp/maodeobra/') return false;
  const token = localStorage.getItem('pcp_token');
  let session;
  try {
    const response = await fetch('/unificado/mapa/api/unified/pcp-session', {
      credentials:'same-origin', cache:'no-store',
      headers:token ? {Authorization:'Bearer ' + token} : {}
    });
    if (response.ok) session = await response.json();
  } catch { /* The login page can retry when connectivity returns. */ }
  if (!session?.access_token || !session.usuario) {
    location.replace('/unificado/login.html?next=pcp%2Fmaodeobra%2F');
    return true;
  }
  localStorage.setItem('pcp_token', session.access_token);
  localStorage.setItem('pcp_user', JSON.stringify(session.usuario));
  localStorage.removeItem('pwa_mapa_auth_session_v1');
  location.reload();
  return true;
}
const accessReady = hasMapa ? fetch('/unificado/mapa/api/unified/screen-access/me', {
  credentials:'same-origin', cache:'no-store'
}).then(async response => {
  if (response.status === 401 && await recoverMdoShellSession()) return false;
  if (response.status === 401) {
    grantedScreens = new Set();
    localStorage.removeItem('pwa_mapa_auth_session_v1');
    location.replace(new URL('login.html?next=index.html', UNIFICADO_BASE));
    return false;
  }
  if (!response.ok) throw new Error('screen access');
  const result = await response.json();
  grantedScreens = new Set(result.screens || []);
  previewModules = result.preview_modules === true;
  hasGedAccess = hasMapa && (result.ged_access === true || previewModules);
  suprimentosFlags = result.suprimentos_flags || {};
  hasLab = hasLab && moduleHasScreens('laboratorio');
  if (!canAccessModule(currentModule))
    currentModule = ['planejamento','producao','laboratorio'].find(canAccessModule) || '';
  renderSidebar();
  renderGuestHome();
  document.body.classList.remove('unificado-permissions-loading');
  return true;
}).catch(() => {
  grantedScreens = new Set(); hasLab = false; renderSidebar();
  document.body.classList.remove('unificado-permissions-loading'); return false;
})
  : hasPcp ? fetch('/unificado/mapa/api/unified/planning-screen-access/me', {
      headers:{Authorization:'Bearer ' + localStorage.getItem('pcp_token')}, cache:'no-store'
    }).then(async response => {
      if (response.status === 401) {
        if (await recoverMdoShellSession()) return false;
        localStorage.removeItem('pcp_token');
        localStorage.removeItem('pcp_user');
        const next = new URLSearchParams(location.search).get('view') || 'pcp/dashboard/';
        location.replace(new URL('login.html?next=' + encodeURIComponent(next), UNIFICADO_BASE));
        return false;
      }
      if (!response.ok) throw new Error('screen access');
      const result = await response.json();
      grantedScreens = new Set(result.screens || []);
      previewModules = result.preview_modules === true;
      if (!canAccessModule(currentModule)) currentModule = 'planejamento';
      renderSidebar();
      document.body.classList.remove('unificado-permissions-loading');
      return true;
    }).catch(() => {
      grantedScreens = new Set(); renderSidebar();
      document.body.classList.remove('unificado-permissions-loading'); return false;
    })
    : Promise.resolve(true);
window.UnificadoScreenAccess = Object.freeze({ready:accessReady,
  allowed: id => grantedScreens === null || grantedScreens.has(MENU_ITEMS[id]?.permissionId || id), moduleAllowed:canAccessModule});
document.body.classList.toggle('unificado-permissions-loading', hasMapa || hasPcp);
if (!hasPcp && !hasMapa) location.replace(new URL('login.html', UNIFICADO_BASE));
const storedModule = localStorage.getItem('unificado_modulo');
let currentModule = MENU_CONFIG[storedModule] && (storedModule === 'planejamento' ? hasPcp : storedModule === 'laboratorio' ? hasLab : hasMapa)
  ? storedModule : (hasPcp ? 'planejamento' : 'producao');
let activeItem = null;
let menuModuleOverride = null;

function canUse(item) {
  const route = MENU_ITEMS[item.id] || item;
  if (route.module === 'suprimentos' && (!suprimentosFlags.S1 || route.futurePhase && !suprimentosFlags[route.futurePhase])) return false;
  if (route.dosagemAdmin && !masterIds.has(mapaUser?.id)) return false;
  if (grantedScreens !== null && !grantedScreens.has(route.permissionId || route.id)) return false;
  if (masterIds.has(mapaUser?.id) && hasMapa) return true;
  if (route.module === 'qualidade') return previewModules && hasMapa;
  if (route.module === 'laboratorio') return hasLab;
  if (route.module === 'producao') return hasMapa;
  if (route.module === 'usinas') return hasMapa;
  if (route.module === 'suprimentos') return hasMapa;
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
  a.title = item.label;
  a.setAttribute('aria-label', item.label);
  if (!canUse(item)) a.title = 'Sem acesso a este módulo';
  if (item.mono) {
    const mono = document.createElement('span');
    mono.className = 'mono';
    mono.textContent = item.mono;
    a.append(mono);
  } else if (item.module === 'planejamento') {
    const icon = document.createElement('i');
    icon.className = `bi ${PCP_ICONS[item.id] || 'bi-grid-3x3-gap'} pcp-nav-icon`;
    icon.setAttribute('aria-hidden', 'true');
    a.append(icon);
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
    if (item.id === 'tvFormas') {
      if (phoneDevice || installedPwa) return;
      event.preventDefault();
      window.open(a.href, '_blank', 'noopener');
      return;
    }
    if (window.UnificadoRouter) {
      event.preventDefault();
      window.UnificadoRouter.open(a.href, item.id);
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

function appendGedPreviewGroup(container, shared = false) {
  if (!hasGedAccess) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-group ged-preview-group';
  const heading = document.createElement('div');
  heading.className = 'group-title';
  heading.textContent = 'GED';
  const items = document.createElement('div');
  items.className = 'group-items';
  for (const [route, label, code] of [
    ['dashboard', 'Painel', 'PN'],
    ['documents', 'Documentos', 'DC'],
    ['approvals', 'Aprovações', 'AP'],
    ['tasks', 'Tarefas', 'TF'],
    ['calibrations', 'Calibrações', 'CL'],
  ]) {
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.dataset.gedRoute = route;
    link.href = new URL('ged/' + route, UNIFICADO_BASE).href;
    link.innerHTML = `<span class="mono">${code}</span><span class="nav-link-label">${label}</span>`;
    link.setAttribute('aria-label', 'GED — ' + label);
    link.addEventListener('click', event => {
      if (!window.UnificadoRouter?.openGed) return;
      event.preventDefault();
      window.UnificadoRouter.openGed(route);
      closeTabletMenu();
    });
    items.append(shared ? sharedMenuChip(link, code) : link);
  }
  wrapper.append(heading, items);
  container.append(wrapper);
}

function closeTabletMenu() {
  if (!tabletMenuMode()) return;
  document.body.classList.remove('unificado-tablet-menu-open');
  const toggle = sidebar.querySelector('.shared-menu-toggle');
  if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '›'; }
}

const SHARED_MENU_CODES = {
  labDosagem:'DO',
  labSlump:'SL',
  labMonitor:'MC', labHistory:'HM', labDevice:'DP', labPole:'EP',
  labAbsorption:'AB', labTests:'HI', labRegisters:'CD', labCriteria:'CR', labHelp:'CF'
};
function sharedMenuCode(item) {
  return item.mono || SHARED_MENU_CODES[item.id] ||
    item.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 2).toUpperCase();
}
function sharedMenuChip(link, code) {
  link.querySelector('.mono,.pcp-nav-icon')?.remove();
  const chip = document.createElement('span');
  chip.className = 'mono';
  chip.textContent = code;
  link.prepend(chip);
  return link;
}

const APP_VERSION = '1.0.43';
let platformUpdateAvailable = false;
async function checkPlatformUpdate() {
  const button = document.getElementById('platform-update');
  const status = document.getElementById('platform-update-status');
  if (!button || !status) return;
  try {
    const response = await fetch('/unificado/VERSION', {cache:'no-store'});
    if (!response.ok) throw new Error('Versão indisponível');
    const latest = (await response.text()).trim();
    if (!latest) throw new Error('Versão indisponível');
    platformUpdateAvailable = latest.localeCompare(APP_VERSION, undefined, {numeric:true}) > 0;
    button.disabled = !platformUpdateAvailable;
    status.textContent = platformUpdateAvailable ? `v${latest} disponível` : `v${APP_VERSION} em dia`;
    button.title = platformUpdateAvailable ? `Atualizar aplicação para a versão ${latest}` : `Aplicação atualizada na versão ${APP_VERSION}`;
  } catch {
    platformUpdateAvailable = false;
    button.disabled = true;
    button.title = 'Não foi possível verificar a versão';
    status.textContent = 'Não verificado';
  }
}
function waitForWorkerState(worker, accepted, timeoutMs = 15000) {
  if (accepted.includes(worker.state)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = error => {
      clearTimeout(timeout);
      worker.removeEventListener('statechange', check);
      if (error) reject(error);
      else resolve();
    };
    const check = () => {
      if (accepted.includes(worker.state)) finish();
      else if (worker.state === 'redundant') finish(new Error('A atualização do aplicativo falhou.'));
    };
    const timeout = setTimeout(() => finish(new Error('A atualização demorou mais que o esperado.')), timeoutMs);
    worker.addEventListener('statechange', check);
    check();
  });
}
async function activateUpdatedWorker(registration) {
  await registration.update();
  const worker = registration.waiting || registration.installing;
  if (!worker) return registration.active;
  if (worker.state === 'installing')
    await waitForWorkerState(worker, ['installed', 'activating', 'activated']);
  if (worker.state === 'installed') worker.postMessage({type:'SKIP_WAITING'});
  await waitForWorkerState(worker, ['activated']);
  return worker;
}
async function waitForController(worker) {
  if (!worker || navigator.serviceWorker.controller === worker) return;
  await new Promise(resolve => {
    const finish = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', check);
      resolve();
    };
    const check = () => {
      if (navigator.serviceWorker.controller === worker) finish();
    };
    const timeout = setTimeout(finish, 5000);
    navigator.serviceWorker.addEventListener('controllerchange', check);
    check();
  });
}
async function updateApplication(button) {
  if (button.disabled || !platformUpdateAvailable) return;
  const label = button.querySelector('#platform-update-status, .sb-label') || button;
  const originalLabel = label.textContent;
  button.disabled = true;
  label.textContent = 'Atualizando…';
  try {
    const version = await fetch('/unificado/VERSION', {cache:'no-store'});
    if (!version.ok) throw new Error('Não foi possível consultar a versão.');
    if ('serviceWorker' in navigator) {
      await accessReady;
      const shell = await navigator.serviceWorker.register('/unificado/sw.js',
        {scope:'/unificado/', updateViaCache:'none'});
      const rootScope = new URL('/unificado/', location.origin).href;
      const registrations = (await navigator.serviceWorker.getRegistrations())
        .filter(registration => registration.scope.startsWith(rootScope) &&
          registration.scope !== shell.scope &&
          (!registration.scope.includes('/mapa/operacao/') || canAccessModule('producao')));
      registrations.unshift(shell);
      const updates = await Promise.allSettled(registrations.map(activateUpdatedWorker));
      const shellUpdate = updates[0];
      if (shellUpdate.status === 'rejected') throw shellUpdate.reason;
      for (const [index, result] of updates.entries()) {
        if (result.status === 'rejected' && registrations[index] !== shell)
          console.warn('SW do módulo não atualizou:', result.reason);
      }
      await waitForController(shellUpdate.value);
    }
    location.reload();
  } catch (error) {
    label.textContent = 'Falha ao atualizar';
    button.title = error.message || 'Tente novamente.';
    setTimeout(() => { label.textContent = originalLabel; button.disabled = !platformUpdateAvailable; }, 4000);
  }
}
function appendVersionBadge(container) {
  const badge = document.createElement('span');
  badge.className = 'app-version-badge';
  badge.textContent = `Versão ${APP_VERSION}`;
  container.append(badge);
}

function renderSharedSidebar() {
  sidebar.dataset.module = currentModule;
  sidebar.replaceChildren();
  let scrim = document.querySelector('.shared-menu-scrim');
  if (!scrim) {
    scrim = document.createElement('button');
    scrim.type = 'button';
    scrim.className = 'shared-menu-scrim';
    scrim.setAttribute('aria-label', 'Fechar menu');
    scrim.addEventListener('click', closeTabletMenu);
    sidebar.after(scrim);
  }

  const brandRow = document.createElement('div');
  brandRow.className = 'shared-brand-row';
  const plaque = document.createElement('a');
  plaque.className = 'shared-brand-plaque';
  plaque.href = UNIFICADO_BASE.href;
  plaque.setAttribute('aria-label', 'Ir ao menu principal');
  plaque.innerHTML = '<img class="shared-logo-concrefer" src="/unificado/assets/img/logo-concrefer.png" alt="Concrefer"><span class="shared-brand-divider" aria-hidden="true"></span><span class="shared-logo-concretrack" role="img" aria-label="ConcreTrack"></span>';
  plaque.addEventListener('click', event => {
    if (!window.UnificadoRouter) return;
    event.preventDefault();
    window.UnificadoSidebarModelA.navigate(UNIFICADO_BASE.href);
  });
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'shared-menu-toggle';
  toggle.textContent = tabletMenuMode() || document.body.classList.contains('unificado-menu-collapsed') ? '›' : '‹';
  toggle.setAttribute('aria-label', 'Recolher ou expandir menu');
  toggle.setAttribute('aria-expanded', String(tabletMenuMode()
    ? document.body.classList.contains('unificado-tablet-menu-open')
    : !document.body.classList.contains('unificado-menu-collapsed')));
  toggle.addEventListener('click', () => {
    if (tabletMenuMode()) {
      const open = !document.body.classList.contains('unificado-tablet-menu-open');
      document.body.classList.toggle('unificado-tablet-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '‹' : '›';
      return;
    }
    const collapsed = !document.body.classList.contains('unificado-menu-collapsed');
    document.body.classList.toggle('unificado-menu-collapsed', collapsed);
    localStorage.setItem('unificado_menu_collapsed', collapsed ? '1' : '0');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.textContent = collapsed ? '›' : '‹';
  });
  brandRow.append(plaque, toggle);
  sidebar.append(brandRow);
  appendVersionBadge(sidebar);

  const moduleLabel = document.createElement('div');
  moduleLabel.className = 'shared-module-label';
  moduleLabel.textContent = 'Módulo';
  sidebar.append(moduleLabel);
  const switcher = document.createElement('div');
  switcher.className = 'shared-module-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Módulo');
  for (const [key, config] of Object.entries(MENU_CONFIG)) {
    if (!canAccessModule(key)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `module-button${key === currentModule ? ' is-active' : ''}`;
    button.dataset.module = key;
    button.dataset.short = key === 'planejamento' ? 'PL' : key === 'producao' ? 'PR' : key === 'qualidade' ? 'QL' : key === 'usinas' ? 'US' : key === 'suprimentos' ? 'SU' : 'LB';
    button.dataset.railName = key === 'planejamento' ? 'Plan.' : key === 'producao' ? 'Prod.' : key === 'qualidade' ? 'Qual.' : key === 'usinas' ? 'Usinas' : key === 'suprimentos' ? 'Supri.' : 'Lab.';
    button.innerHTML = `<span class="shared-module-dot" aria-hidden="true"></span><span class="shared-module-code">${button.dataset.short}</span><span class="shared-module-name">${config.label}</span>`;
    button.title = config.label;
    button.setAttribute('aria-label', config.label);
    button.setAttribute('aria-pressed', key === currentModule ? 'true' : 'false');
    button.addEventListener('click', () => {
      closeTabletMenu();
      if (window.UnificadoSidebarModelA) { window.UnificadoSidebarModelA.selectModule(key); return; }
      currentModule = key;
      localStorage.setItem('unificado_modulo', key);
      renderSidebar();
    });
    switcher.append(button);
  }
  sidebar.append(switcher);

  const scroll = document.createElement('div');
  scroll.className = 'shared-nav-scroll';
  const home = document.createElement('a');
  home.href = new URL('index.html', UNIFICADO_BASE).href;
  home.className = `nav-home${activeItem ? '' : ' is-active'}`;
  home.innerHTML = '<span class="mono">IN</span><span class="nav-link-label">Início</span>';
  home.setAttribute('aria-label', 'Início');
  home.addEventListener('click', event => {
    closeTabletMenu();
    activeItem = null;
    if (window.UnificadoRouter) { event.preventDefault(); window.UnificadoRouter.home(); }
  });
  scroll.append(home);
  (MENU_CONFIG[currentModule]?.groups || []).forEach(group => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group';
    if (group.label) {
      const heading = document.createElement('div');
      heading.className = 'group-title';
      heading.textContent = group.label;
      wrapper.append(heading);
    }
    const items = document.createElement('div');
    items.className = 'group-items';
    group.items.filter(item => item.id !== 'labHelp' && canUse(item)).forEach(item => {
      const link = sharedMenuChip(makeLink(item), sharedMenuCode(item));
      if (activeItem === item.id) link.classList.add('is-active');
      link.addEventListener('click', closeTabletMenu);
      items.append(link);
    });
    wrapper.append(items);
    if (items.children.length) scroll.append(wrapper);
  });
  appendGedPreviewGroup(scroll, true);
  const footer = document.createElement('div');
  footer.className = 'shared-user-footer';
  const usersAllowed = (pcpUser?.nivel_acesso === 'ADMIN' && (grantedScreens === null || grantedScreens.has('pcpUsuarios')))
    || (hasMapa && mapaUser?.role === 'GERENCIA' && (grantedScreens === null || grantedScreens.has('prodUsuarios')));
  if (usersAllowed) {
    const users = document.createElement('a');
    users.className = 'nav-footer nav-footer-users' + (activeItem === 'prodUsuarios' || activeItem === 'pcpUsuarios' ? ' is-active' : '');
    users.href = hasMapa && mapaUser?.role === 'GERENCIA' && (grantedScreens === null || grantedScreens.has('prodUsuarios'))
      ? new URL('operacao/?tela=USUARIOS', MAPA_BASE).href
      : new URL('usuarios/', PCP_BASE).href;
    users.innerHTML = '<span class="mono">US</span><span class="nav-link-label">Usuários</span>';
    users.addEventListener('click', event => {
      closeTabletMenu();
      if (window.UnificadoRouter) { event.preventDefault(); window.UnificadoRouter.open(users.href); }
    });
    footer.append(users);
  }
  const report = document.createElement('a');
  report.className = 'nav-footer';
  report.href = new URL('testar/#relatar', UNIFICADO_BASE).href;
  report.innerHTML = '<span class="mono">RP</span><span class="nav-link-label">Relatar problema</span>';
  report.addEventListener('click', closeTabletMenu);
  footer.append(report);
  if (currentModule === 'laboratorio' && canUse(MENU_ITEMS.labHelp)) {
    const help = sharedMenuChip(makeLink(MENU_ITEMS.labHelp), 'CF');
    if (activeItem === 'labHelp') help.classList.add('is-active');
    help.addEventListener('click', closeTabletMenu);
    footer.append(help);
  }
  sidebar.append(scroll);
  const userRow = document.createElement('div');
  userRow.className = 'shared-user-row';
  const userName = displayUser?.nome || displayUser?.name || 'Usuário';
  const role = hasPcp && hasMapa ? `${pcpUser.nivel_acesso} · ${mapaUser.role === 'GERENCIA' ? 'GERÊNCIA' : mapaUser.role}` :
    (hasPcp ? pcpUser.nivel_acesso : mapaUser?.role || '');
  const avatar = document.createElement('span');
  avatar.className = 'shared-avatar';
  avatar.textContent = userName.slice(0, 1).toUpperCase();
  const userText = document.createElement('span');
  userText.className = 'shared-user-text';
  const strong = document.createElement('strong');
  strong.textContent = userName;
  const small = document.createElement('small');
  small.textContent = role;
  userText.append(strong, small);
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.className = 'shared-logout';
  logout.textContent = 'Sair';
  logout.setAttribute('aria-label', 'Sair');
  logout.title = 'Sair';
  logout.addEventListener('click', () => UnificadoAuth.logout());
  userRow.append(avatar, userText, logout);
  footer.append(userRow);
  sidebar.append(footer);
}

function renderSidebar() {
  document.body.classList.toggle('unificado-model-a', modelASidebarAllowed());
  if (modelASidebarAllowed()) {
    document.querySelector('.shared-menu-scrim')?.remove();
    dispatchEvent(new Event('unificado-sidebar-model-a-update'));
    return;
  }
  sidebar.dataset.module = currentModule;
  if (sharedMenuAllowed()) {
    renderSharedSidebar();
    window.UnificadoRouter?.syncGedMenu?.();
    return;
  }
  document.querySelector('.shared-menu-scrim')?.remove();
  const existingBrand = sidebar.querySelector(':scope > .brand');
  const existingCollapse = sidebar.querySelector(':scope > .nav-collapse');
  sidebar.replaceChildren();
  const brand = existingBrand || document.createElement('div');
  if (!existingBrand) {
    brand.className = 'brand';
    brand.innerHTML = '<a href="/unificado/" aria-label="Ir ao menu principal"><img src="/unificado/assets/img/logo-concrefer.png" alt="Concrefer" width="112"><img src="/unificado/assets/img/logo-concretrack.png" alt="ConcreTrack" width="34" height="34"></a>';
  }
  if (!brand.dataset.homeBound) {
    brand.dataset.homeBound = '1';
    brand.querySelector('a[href="/unificado/"]')?.addEventListener('click', event => {
      if (!window.UnificadoRouter) return;
      event.preventDefault();
      window.UnificadoSidebarModelA.navigate(UNIFICADO_BASE.href);
    });
  }
  sidebar.append(brand);
  appendVersionBadge(sidebar);
  const collapse = existingCollapse || document.createElement('button');
  if (!existingCollapse) {
  collapse.type = 'button';
  collapse.className = 'nav-collapse';
  collapse.textContent = '☰';
  collapse.title = 'Recolher ou expandir menu';
  collapse.setAttribute('aria-label', collapse.title);
  collapse.setAttribute('aria-expanded', String(!document.body.classList.contains('unificado-menu-collapsed')));
  collapse.addEventListener('click', () => {
    const collapsed = !document.body.classList.contains('unificado-menu-collapsed');
    document.body.classList.toggle('unificado-menu-collapsed', collapsed);
    localStorage.setItem('unificado_menu_collapsed', collapsed ? '1' : '0');
    collapse.setAttribute('aria-expanded', String(!collapsed));
  });
  }
  sidebar.append(collapse);

  const switcher = document.createElement('div');
  switcher.className = 'module-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Módulo');
  for (const [key, config] of Object.entries(MENU_CONFIG)) {
    if (!canAccessModule(key)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `module-button${key === currentModule ? ' is-active' : ''}`;
    button.dataset.module = key;
    button.textContent = config.label;
    button.dataset.short = key === 'planejamento' ? 'PL' : key === 'producao' ? 'PR' : key === 'qualidade' ? 'QL' : key === 'usinas' ? 'US' : key === 'suprimentos' ? 'SU' : 'LB';
    button.title = config.label;
    button.setAttribute('aria-label', config.label);
    button.setAttribute('aria-pressed', key === currentModule ? 'true' : 'false');
    button.addEventListener('click', () => {
      if (window.UnificadoSidebarModelA) {
        window.UnificadoSidebarModelA.selectModule(key);
        return;
      }
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
  home.title = 'Início';
  home.setAttribute('aria-label', 'Início');
  home.addEventListener('click', event => {
    activeItem = null;
    if (window.UnificadoRouter) { event.preventDefault(); window.UnificadoRouter.home(); }
  });
  scroll.append(home);

  (MENU_CONFIG[currentModule]?.groups || []).forEach((group, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group';
    if (group.label) {
      if (currentModule === 'planejamento') {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'group-title';
        toggle.innerHTML = `<span>${group.label}</span>${ICONS.chevron}`;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.dataset.short = group.label.slice(0, 2).toUpperCase();
        toggle.title = group.label;
        toggle.setAttribute('aria-label', group.label);
        const items = document.createElement('div');
        items.className = 'group-items';
        toggle.addEventListener('click', () => {
          if (document.body.classList.contains('unificado-menu-collapsed') && matchMedia('(min-width:1025px)').matches) {
            sidebar.querySelectorAll('.nav-group.flyout-open').forEach(node => { if (node !== wrapper) node.classList.remove('flyout-open'); });
            const open = !wrapper.classList.contains('flyout-open');
            wrapper.classList.toggle('flyout-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            items.hidden = !open;
            return;
          }
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
  appendGedPreviewGroup(scroll);
  sidebar.append(scroll);
  const users = document.createElement('a');
  users.className = 'nav-footer nav-footer-users' + (activeItem === 'prodUsuarios' || activeItem === 'pcpUsuarios' ? ' is-active' : '');
  users.href = hasMapa && mapaUser?.role === 'GERENCIA' && (grantedScreens === null || grantedScreens.has('prodUsuarios'))
    ? new URL('operacao/?tela=USUARIOS', MAPA_BASE).href
    : new URL('usuarios/', PCP_BASE).href;
  users.innerHTML = `${ICONS.users}<span>Usuários</span>`;
  users.addEventListener('click', event => {
    if (window.UnificadoRouter) { event.preventDefault(); window.UnificadoRouter.open(users.href); }
  });
  if (pcpUser?.nivel_acesso === 'ADMIN' && (grantedScreens === null || grantedScreens.has('pcpUsuarios')) ||
      hasMapa && mapaUser?.role === 'GERENCIA' && (grantedScreens === null || grantedScreens.has('prodUsuarios'))) sidebar.append(users);
  const report = document.createElement('a');
  report.className = 'nav-footer';
  report.href = new URL('testar/#relatar', UNIFICADO_BASE).href;
  report.innerHTML = '<span class="mono">RP</span><span>Relatar problema</span>';
  sidebar.append(report);
  window.UnificadoRouter?.syncGedMenu?.();
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
      a.addEventListener('click', event => {
        if (window.UnificadoRouter) { event.preventDefault(); window.UnificadoRouter.open(a.href, item.id); }
      });
      actions.append(a);
    }
    target.append(card);
  });
}

function renderGuestHome() {
  if (mapaUser?.role !== 'CONVIDADO' || grantedScreens === null) return;
  const home = document.querySelector('.content');
  const empty = grantedScreens.size === 0;
  home.querySelector('section[aria-labelledby="sectors-title"]').hidden = empty;
  home.querySelector('.shortcuts-section').hidden = empty;
  home.querySelector('.opening-modules').hidden = !document.getElementById('opening-module-grid')?.children.length;
  let notice = document.getElementById('guest-access-notice');
  if (!notice) {
    notice = document.createElement('p');
    notice.id = 'guest-access-notice';
    notice.className = 'unified-user-editor-note';
    home.querySelector('.welcome').after(notice);
  }
  notice.hidden = !empty;
  notice.textContent = 'Sua conta de convidado está aguardando a liberação de telas e ações pelo administrador Master.';
  if (!empty) {
    document.getElementById('sector-cards').replaceChildren();
    document.getElementById('shortcut-grid').replaceChildren();
    renderSectors(); renderShortcuts();
  }
}

function renderShortcuts() {
  const groups = [
    { title: 'Planejamento', icon: ICONS.plan, items: [['programacao12', 'Programação'], ['relatorio12', 'Relatórios de Programação'], ['etiquetas', 'Etiquetas'], ['acompMensal'], ['formasPorSetor'], ['apontamentoMega']] },
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

function renderOpeningModules() {
  const target = document.getElementById('opening-module-grid');
  target.replaceChildren();
  const modules = [
    {id:'planejamento', description:'Programação, PCP e relatórios'},
    {id:'producao', description:'Mapa, inspeção e montagem'},
    {id:'qualidade', description:'Não conformidades e controle'},
    {id:'laboratorio', description:'Ensaios e acompanhamento'},
    {id:'usinas', description:'Operação e acompanhamento das usinas'},
  ];
  for (const [index, module] of modules.entries()) {
    if (!canAccessModule(module.id)) continue;
    const item = MENU_CONFIG[module.id].groups.flatMap(group => group.items).find(canUse);
    if (!item) continue;
    const link = document.createElement('a');
    link.className = 'opening-module';
    link.dataset.module = module.id;
    link.href = new URL('?module=' + encodeURIComponent(module.id), UNIFICADO_BASE).href;
    link.innerHTML = `<span class="opening-module-copy"><span class="opening-module-number">${String(index + 1).padStart(2, '0')} / MÓDULO</span><span><strong class="opening-module-title"></strong><small></small></span></span>${ICONS.arrow}`;
    link.querySelector('.opening-module-title').textContent = MENU_CONFIG[module.id].label;
    link.querySelector('small').textContent = module.description;
    link.addEventListener('click', event => {
      if (phoneDevice || installedPwa || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
          !window.UnificadoSidebarModelA?.selectModule || !window.UnificadoModulePages?.show) return;
      event.preventDefault();
      window.UnificadoSidebarModelA.selectModule(module.id);
    });
    target.append(link);
  }
  if (hasGedAccess) {
    const link = document.createElement('a');
    link.className = 'opening-module';
    link.dataset.module = 'ged';
    link.href = new URL('?module=ged', UNIFICADO_BASE).href;
    link.innerHTML = `<span class="opening-module-copy"><span class="opening-module-number">06 / MÓDULO</span><span><strong class="opening-module-title">GED</strong><small>Documentos e aprovações</small></span></span>${ICONS.arrow}`;
    link.addEventListener('click', event => {
      if (phoneDevice || installedPwa || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
          !window.UnificadoSidebarModelA?.selectModule || !window.UnificadoModulePages?.show) return;
      event.preventDefault();
      window.UnificadoSidebarModelA.selectModule('ged');
    });
    target.append(link);
  }
  if (canAccessModule('suprimentos')) {
    const link = document.createElement('a');
    link.className = 'opening-module';
    link.dataset.module = 'suprimentos';
    link.href = new URL('?module=suprimentos', UNIFICADO_BASE).href;
    link.innerHTML = `<span class="opening-module-copy"><span class="opening-module-number">07 / MÓDULO</span><span><strong class="opening-module-title">Suprimentos</strong><small>Solicitações e almoxarifado geral</small></span></span>${ICONS.arrow}`;
    link.addEventListener('click', event => {
      if (phoneDevice || installedPwa || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
          !window.UnificadoSidebarModelA?.selectModule || !window.UnificadoModulePages?.show) return;
      event.preventDefault();
      window.UnificadoSidebarModelA.selectModule('suprimentos');
    });
    target.append(link);
  }
  for (const [module, number, title, description, url, icon] of [
    ['pederh', '07', 'PedeRH', 'Solicitações e fluxos de RH', 'https://rh.concretrack.com.br/', 'pederh-icon.png'],
    ['faleaqui', '08', 'FaleAqui', 'Solicitações e atendimento', 'https://faleaqui.concretrack.com.br/', 'faleaqui-icon.png'],
  ]) {
    const link = document.createElement('a');
    link.className = 'opening-module';
    link.dataset.module = module;
    link.href = url;
    const newTab = !phoneDevice && !installedPwa;
    if (newTab) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.setAttribute('aria-label', newTab ? `Abrir ${title} em uma nova aba` : `Abrir ${title}`);
    link.innerHTML = `<span class="opening-module-copy"><span class="opening-module-number">${number} / APLICAÇÃO</span><span><strong class="opening-module-title"></strong><small></small></span></span><img class="opening-app-icon" src="assets/img/${icon}" alt="" aria-hidden="true">${ICONS.arrow}`;
    link.querySelector('.opening-module-title').textContent = title;
    link.querySelector('small').textContent = description;
    target.append(link);
  }
  document.querySelector('.opening-modules').hidden = !target.children.length;
}

function selectModuleMenu(moduleId, push = true) {
  if (moduleId === 'ged' ? !hasGedAccess : !MENU_CONFIG[moduleId] || !canAccessModule(moduleId)) return;
  if (!document.getElementById('module-host')?.hidden) window.UnificadoRouter?.home(false);
  menuModuleOverride = moduleId;
  if (MENU_CONFIG[moduleId]) {
    currentModule = moduleId;
    localStorage.setItem('unificado_modulo', moduleId);
  }
  renderSidebar();
  window.UnificadoModulePages?.show(moduleId, push);
  dispatchEvent(new Event('unificado-sidebar-module-selected'));
}

const today = new Date();
const dateISO = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Sao_Paulo',
  year:'numeric', month:'2-digit', day:'2-digit'}).format(today);
document.getElementById('today').textContent = new Intl.DateTimeFormat('pt-BR', {
  timeZone:'America/Sao_Paulo', weekday:'long', day:'numeric', month:'long', year:'numeric'
}).format(today);
const displayUser = hasPcp ? pcpUser : mapaUser;
window.UnificadoSidebarModelA = Object.freeze({
  snapshot: () => {
    const master = masterIds.has(mapaUser?.id) && hasMapa;
    const allowedModuleIds = Object.keys(MENU_CONFIG).filter(canAccessModule);
    if (hasGedAccess) allowedModuleIds.push('ged');
    const allowedItemIds = Object.values(MENU_ITEMS)
      .filter(canUse)
      .map(item => item.id);
    if (hasGedAccess) allowedItemIds.push(
      'ged-dashboard', 'ged-documents', 'ged-approvals', 'ged-tasks', 'ged-calibrations');
    const pcpUsers = pcpUser?.nivel_acesso === 'ADMIN' &&
      (grantedScreens === null || grantedScreens.has('pcpUsuarios'));
    const mapaUsers = hasMapa && mapaUser?.role === 'GERENCIA' &&
      (grantedScreens === null || grantedScreens.has('prodUsuarios'));
    if (pcpUsers) allowedItemIds.push('pcpUsuarios');
    if (mapaUsers) allowedItemIds.push('prodUsuarios');
    const footerItemIds = [];
    if (master && canUse(MENU_ITEMS.labHelp)) footerItemIds.push('labHelp');
    if (pcpUsers || mapaUsers) footerItemIds.push('usuarios');
    footerItemIds.push('reportProblem');
    const name = displayUser?.nome || displayUser?.name || 'Usuário';
    const role = hasPcp && hasMapa ? `${pcpUser.nivel_acesso} / ${mapaUser.role}` :
      (hasPcp ? pcpUser.nivel_acesso : mapaUser?.role || '');
    return {
      activeModuleId: document.body.classList.contains('unificado-ged-active') ? 'ged' :
        (activeItem ? currentModule : menuModuleOverride || currentModule),
      activePath: window.UnificadoSidebarActivePath || location.pathname + location.search,
      allowedModuleIds, allowedItemIds, footerItemIds,
      user: {name, role}, version: APP_VERSION,
      updateAvailable: false,
    };
  },
  navigate: href => {
    const url = new URL(href, location.origin);
    if (url.origin === location.origin && url.pathname === '/unificado/testar/') {
      location.assign(url.href);
      return;
    }
    if (url.origin !== location.origin || url.pathname !== UNIFICADO_BASE.pathname) return;
    const view = url.searchParams.get('view');
    menuModuleOverride = null;
    window.UnificadoModulePages?.hide();
    if (!view) { window.UnificadoRouter?.home(); return; }
    if (view === 'tv/formas/') {
      window.open(new URL(view, UNIFICADO_BASE).href, '_blank', 'noopener');
      return;
    }
    if (view.startsWith('ged/')) {
      window.UnificadoRouter?.openGed(view.slice(4).split('/')[0]);
      return;
    }
    window.UnificadoRouter?.open(new URL(view, UNIFICADO_BASE).href);
  },
  selectModule: selectModuleMenu,
  update: () => {
    const button = document.getElementById('platform-update');
    if (button) updateApplication(button);
  },
  logout: () => UnificadoAuth.logout(),
});
document.querySelector('.user-pill strong').textContent = displayUser?.nome || displayUser?.name || 'Usuário';
document.querySelector('.user-pill small').textContent = hasPcp && hasMapa ?
  `${pcpUser.nivel_acesso} / ${mapaUser.role}` : (hasPcp ? pcpUser.nivel_acesso : mapaUser?.role);
document.querySelector('.user-pill .avatar').textContent = (displayUser?.nome || displayUser?.name || 'U').slice(0,1).toUpperCase();
const exit = document.querySelector('.exit-button');
exit.disabled = false;
exit.title = 'Sair';
exit.addEventListener('click', () => UnificadoAuth.logout());
renderSidebar();
sharedMenuViewport.addEventListener('change', () => {
  const enabled = sharedMenuAllowed();
  document.body.classList.toggle('unificado-shared-menu', enabled);
  document.body.classList.toggle('unificado-tablet-menu', enabled && tabletMenuMode());
  document.body.classList.toggle('unificado-menu-collapsed',
    localStorage.getItem('unificado_menu_collapsed') === '1' && !tabletMenuMode());
  document.body.classList.remove('unificado-tablet-menu-open');
  renderSidebar();
});
function refreshTabletMode() {
  document.body.classList.toggle('unificado-tablet-menu', sharedMenuAllowed() && tabletMenuMode());
  document.body.classList.toggle('unificado-menu-collapsed',
    localStorage.getItem('unificado_menu_collapsed') === '1' && !tabletMenuMode());
  document.body.classList.remove('unificado-tablet-menu-open');
  if (sharedMenuAllowed()) renderSidebar();
}
narrowTabletViewport.addEventListener('change', refreshTabletMode);
renderSectors();
renderShortcuts();
document.getElementById('platform-update')?.addEventListener('click', event => updateApplication(event.currentTarget));
checkPlatformUpdate();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkPlatformUpdate();
});

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
accessReady.then(() => {
  renderOpeningModules();
  renderGuestHome();
  if (mapaUser?.role !== 'CONVIDADO' || grantedScreens?.has('dashboard') ||
      grantedScreens?.has('produtividade')) loadSectorData();
});
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/unificado/sw.js', {scope:'/unificado/'}).catch(() => {}));
}
