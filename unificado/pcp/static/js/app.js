/* ============================================================
   PCP Concrefer — API helper + Auth + Utils
   ============================================================ */

const API = (() => {
  const BASE = '';  // mesmo host

  function getToken() {
    return localStorage.getItem('pcp_token');
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('pcp_user') || 'null'); }
    catch { return null; }
  }

  function saveSession(tokenData) {
    localStorage.setItem('pcp_token', tokenData.access_token);
    localStorage.setItem('pcp_user', JSON.stringify(tokenData.usuario));
  }

  function clearSession() {
    localStorage.removeItem('pcp_token');
    localStorage.removeItem('pcp_user');
  }

  async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(BASE + path, opts);

    if (res.status === 401) {
      clearSession();
      unificadoUnavailableOrLogin();
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Erro ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  return {
    get:    (path)         => request('GET',    path),
    post:   (path, body)   => request('POST',   path, body),
    patch:  (path, body)   => request('PATCH',  path, body),
    delete: (path)         => request('DELETE', path),
    getToken,
    getUser,
    saveSession,
    clearSession,
  };
})();

/* ─── Auth guard ─────────────────────────────────────────────── */
function requireAuth() {
  if (!API.getToken()) {
    unificadoUnavailableOrLogin();
    return null;
  }
  const user = API.getUser();
  const path = window.location.pathname || '';
  if (user?.trocar_senha_primeiro_acesso && !path.includes('/unificado/pcp/primeiro-acesso/')) {
    window.location.href = '/unificado/pcp/primeiro-acesso/';
    return null;
  }
  return user;
}

let unificadoAuthRecoveryStarted = false;
function unificadoUnavailableOrLogin() {
  if (unificadoAuthRecoveryStarted) return;
  unificadoAuthRecoveryStarted = true;
  const next = location.pathname.replace(/^\/unificado\//, '') + location.search;
  const login = () => location.replace('/unificado/login.html?next=' + encodeURIComponent(next));
  if (!localStorage.getItem('pwa_mapa_auth_session_v1')) return login();
  fetch('/unificado/mapa/api/me', {credentials:'same-origin',cache:'no-store'})
    .then(response => {
      if (!response.ok) return login();
      if (document.getElementById('unificado-module-unavailable')) return;
      const notice = document.createElement('div');
      notice.id = 'unificado-module-unavailable';
      notice.setAttribute('role','status');
      notice.style.cssText = 'position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;background:#0B1730;color:white;font:600 22px system-ui;text-align:center;padding:24px';
      notice.innerHTML = '<div>Planejamento indispon\u00edvel para esta conta.<br><a style="color:#E8762A;font-size:16px" href="/unificado/">Voltar ao In\u00edcio</a></div>';
      document.body.append(notice);
    }).catch(() => {});
}

function checkRole(allowedRoles) {
  const user = requireAuth();
  if (!user) return false;
  if (!allowedRoles.includes(user.nivel_acesso)) {
    showToast('Acesso não autorizado para esta ação.', 'error');
    return false;
  }
  return true;
}

/* ─── Sidebar helpers ────────────────────────────────────────── */
function initSidebar(activePage) {
  const user = requireAuth();
  if (!user) return;

  // Preenche info do usuário na topbar
  const elNome = document.getElementById('user-nome');
  const elNivel = document.getElementById('user-nivel');
  if (elNome) elNome.textContent = user.nome;
  if (elNivel) elNivel.textContent = user.nivel_acesso;

  // Marca link ativo
  document.querySelectorAll('#sidebar .nav-link').forEach(a => {
    if (a.dataset.page === 'programacao') {
      a.innerHTML = '<i class="bi bi-calendar-plus"></i> Programação Setor 3 e 4';
    }
    if (a.dataset.page === 'programacao-alex') {
      a.innerHTML = '<i class="bi bi-file-earmark-excel"></i> Programação Setor 1 e 2';
    }
    if (a.dataset.page === 'etiquetas') {
      a.innerHTML = '<i class="bi bi-printer"></i> Etiquetas Padrão';
    }
    if (a.dataset.page === activePage) a.classList.add('active');
  });

  const nav = document.querySelector('#sidebar nav');
  nav?.querySelectorAll('[data-page="controle-armaduras"], a[href^="/armaduras/"]').forEach(link => link.remove());
  if (nav && !nav.querySelector('[data-page="pcp-diario"]')) {
    const diarioLink = document.createElement('a');
    diarioLink.className = 'nav-link';
    diarioLink.href = '/unificado/pcp/pcp-diario/';
    diarioLink.dataset.page = 'pcp-diario';
    diarioLink.dataset.require = 'PRODUCAO';
    diarioLink.innerHTML = '<i class="bi bi-table"></i> PCP Diário';
    if (activePage === 'pcp-diario') diarioLink.classList.add('active');
    const apontamento = nav.querySelector('[data-page="apontamento-mega"]');
    if (apontamento?.nextSibling) nav.insertBefore(diarioLink, apontamento.nextSibling);
    else nav.appendChild(diarioLink);
  }

  if (nav && !nav.querySelector('[data-page="mapa-producao"]')) {
    const mapaLink = document.createElement('a');
    mapaLink.className = 'nav-link';
    mapaLink.href = 'https://usina.concretrack.com.br/mapa-concretagem/index.html';
    mapaLink.target = '_blank';
    mapaLink.rel = 'noopener noreferrer';
    mapaLink.dataset.page = 'mapa-producao';
    mapaLink.innerHTML = '<i class="bi bi-map"></i> Mapa de Produção';
    const diario = nav.querySelector('[data-page="pcp-diario"]');
    const apontamento = nav.querySelector('[data-page="apontamento-mega"]');
    const after = diario || apontamento;
    if (after?.nextSibling) nav.insertBefore(mapaLink, after.nextSibling);
    else nav.appendChild(mapaLink);
  }

  if (nav && !nav.querySelector('[data-page="relatorio-producao"]')) {
    const reportLink = document.createElement('a');
    reportLink.className = 'nav-link';
    reportLink.href = '/unificado/pcp/relatorio-producao/';
    reportLink.dataset.page = 'relatorio-producao';
    reportLink.dataset.require = 'PCP';
    reportLink.innerHTML = '<i class="bi bi-file-earmark-spreadsheet"></i> Relatório de Produção - Setores 1 e 2';
    if (activePage === 'relatorio-producao') reportLink.classList.add('active');
    const prog12 = nav.querySelector('[data-page="programacao-alex"]');
    if (prog12?.nextSibling) nav.insertBefore(reportLink, prog12.nextSibling);
    else nav.appendChild(reportLink);
  }

  for (const sector of [3, 4]) {
    const page = `relatorio-programacao-s${sector}`;
    if (nav && !nav.querySelector(`[data-page="${page}"]`)) {
      const reportLink = document.createElement('a');
      reportLink.className = 'nav-link';
      reportLink.href = `/unificado/pcp/${page}/`;
      reportLink.dataset.page = page;
      reportLink.dataset.require = 'PCP';
      reportLink.innerHTML = `<i class="bi bi-file-earmark-spreadsheet"></i> Relatório de Produção - Setor ${sector}`;
      if (activePage === page) reportLink.classList.add('active');
      nav.appendChild(reportLink);
    }
  }

  if (nav && !nav.querySelector('[data-page="programacao-circular-s3"]')) {
    const circularLink = document.createElement('a');
    circularLink.className = 'nav-link';
    circularLink.href = '/unificado/pcp/programacao-circular-s3/';
    circularLink.dataset.page = 'programacao-circular-s3';
    circularLink.dataset.require = 'PCP';
    circularLink.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> Programação Circular Setor 3';
    if (activePage === 'programacao-circular-s3') circularLink.classList.add('active');
    const prog34 = nav.querySelector('[data-page="programacao"]');
    if (prog34?.nextSibling) nav.insertBefore(circularLink, prog34.nextSibling);
    else nav.appendChild(circularLink);
  }

  if (nav && !nav.querySelector('[data-page="programacao-circular-s4"]')) {
    const circularLink = document.createElement('a');
    circularLink.className = 'nav-link';
    circularLink.href = '/unificado/pcp/programacao-circular-s4/';
    circularLink.dataset.page = 'programacao-circular-s4';
    circularLink.dataset.require = 'PCP';
    circularLink.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> Programação DT Setor 4';
    if (activePage === 'programacao-circular-s4') circularLink.classList.add('active');
    const circular3 = nav.querySelector('[data-page="programacao-circular-s3"]');
    if (circular3?.nextSibling) nav.insertBefore(circularLink, circular3.nextSibling);
    else nav.appendChild(circularLink);
  }

  if (nav && !nav.querySelector('[data-page="programacao-final"]')) {
    const finalLink = document.createElement('a');
    finalLink.className = 'nav-link';
    finalLink.href = '/unificado/pcp/programacao-final/';
    finalLink.dataset.page = 'programacao-final';
    finalLink.dataset.require = 'PCP';
    finalLink.innerHTML = '<i class="bi bi-calendar-check"></i> Programação Final';
    if (activePage === 'programacao-final') finalLink.classList.add('active');
    const prog34 = nav.querySelector('[data-page="programacao"]');
    if (prog34?.nextSibling) nav.insertBefore(finalLink, prog34.nextSibling);
    else nav.appendChild(finalLink);
  }

  if (nav && !nav.querySelector('[data-page="etiquetas"]')) {
    const etiquetasLink = document.createElement('a');
    etiquetasLink.className = 'nav-link';
    etiquetasLink.href = '/unificado/pcp/etiquetas/';
    etiquetasLink.dataset.page = 'etiquetas';
    etiquetasLink.dataset.require = 'PCP';
    etiquetasLink.innerHTML = '<i class="bi bi-printer"></i> Etiquetas Padrão';
    if (activePage === 'etiquetas') etiquetasLink.classList.add('active');
    const finalLink = nav.querySelector('[data-page="programacao-final"]');
    const prog34 = nav.querySelector('[data-page="programacao"]');
    const anchor = finalLink || prog34;
    if (anchor?.nextSibling) nav.insertBefore(etiquetasLink, anchor.nextSibling);
    else nav.appendChild(etiquetasLink);
  }

  if (nav && !nav.querySelector('[data-page="etiquetas-sc"]')) {
    const etiquetasSC = document.createElement('a');
    etiquetasSC.className = 'nav-link';
    etiquetasSC.href = '/unificado/pcp/etiquetas-sc/';
    etiquetasSC.dataset.page = 'etiquetas-sc';
    etiquetasSC.dataset.require = 'PCP';
    etiquetasSC.innerHTML = '<i class="bi bi-printer-fill"></i> Etiquetas SC / Prod.';
    if (activePage === 'etiquetas-sc') etiquetasSC.classList.add('active');
    nav.appendChild(etiquetasSC);
  }

  if (nav && !nav.querySelector('[data-page="etiquetas-armaduras"]')) {
    const armadurasLabel = document.createElement('a');
    armadurasLabel.className = 'nav-link';
    armadurasLabel.href = '/unificado/pcp/etiquetas-armaduras/';
    armadurasLabel.dataset.page = 'etiquetas-armaduras';
    armadurasLabel.dataset.require = 'PCP';
    armadurasLabel.innerHTML = '<i class="bi bi-tags-fill"></i> Etiquetas Armaduras';
    if (activePage === 'etiquetas-armaduras') armadurasLabel.classList.add('active');
    nav.appendChild(armadurasLabel);
  }

  setupSidebarGroups(activePage);
  orderSidebarNav();

  // Toggle mobile
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar && overlay) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  const titleWrap = document.querySelector('.topbar .d-flex.align-items-center');
  if (titleWrap && !document.getElementById('sidebar-hide-toggle')) {
    const hideBtn = document.createElement('button');
    hideBtn.id = 'sidebar-hide-toggle';
    hideBtn.type = 'button';
    hideBtn.className = 'sidebar-hide-btn desktop-only';
    const plannerMenu = document.body.classList.contains('circular-planner');
    const updateHideButton = hidden => {
      const label = hidden ? 'Mostrar menu' : 'Ocultar menu';
      hideBtn.title = hidden ? 'Mostrar menu lateral' : 'Ocultar menu lateral';
      hideBtn.setAttribute('aria-label', hideBtn.title);
      hideBtn.innerHTML = `<i class="bi ${hidden ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}"></i>${plannerMenu ? `<span>${label}</span>` : ''}`;
    };
    titleWrap.insertBefore(hideBtn, titleWrap.firstChild);

    const hidden = localStorage.getItem('pcp_sidebar_hidden') === '1';
    document.body.classList.toggle('sidebar-force-hidden', hidden);
    updateHideButton(hidden);

    hideBtn.addEventListener('click', () => {
      const nextHidden = !document.body.classList.contains('sidebar-force-hidden');
      document.body.classList.toggle('sidebar-force-hidden', nextHidden);
      localStorage.setItem('pcp_sidebar_hidden', nextHidden ? '1' : '0');
      updateHideButton(nextHidden);
    });
  }

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    API.clearSession();
    window.location.href = '/unificado/login.html';
  });

  // Oculta itens de menu por nível
  applyMenuVisibility(user.nivel_acesso);
  updateSidebarGroupVisibility();
}

function setupSidebarGroups(activePage) {
  const nav = document.querySelector('#sidebar nav');
  if (!nav || nav.dataset.grouped === '1') return;

  const groups = [
    {
      id: 'programacao',
      label: 'Programação',
      icon: 'bi-kanban',
      pages: ['programacao-alex', 'programacao', 'programacao-circular-s3', 'programacao-circular-s4', 'programacao-final', 'maodeobra', 'teste-programacao'],
    },
    {
      id: 'relatorios-programacao',
      label: 'Relatórios de Programação',
      icon: 'bi-file-earmark-spreadsheet',
      pages: ['relatorio-producao', 'relatorio-programacao-s3', 'relatorio-programacao-s4'],
    },
    {
      id: 'etiquetas',
      label: 'Etiquetas',
      icon: 'bi-tags',
      pages: ['etiquetas', 'etiquetas-sc', 'etiquetas-armaduras'],
    },
    {
      id: 'acompanhamento',
      label: 'Acompanhamento',
      icon: 'bi-clipboard-data',
      pages: ['producao', 'pcp-diario', 'apontamento-mega', 'acompanhamento-mensal', 'acompanhamento-mensal-setor-34'],
    },
  ];

  groups.forEach(group => {
    const links = group.pages
      .map(page => nav.querySelector(`.nav-link[data-page="${page}"]`))
      .filter(Boolean);
    if (!links.length) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group';
    wrapper.dataset.group = group.id;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-group-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `<i class="bi ${group.icon}"></i><span>${group.label}</span><i class="bi bi-chevron-down nav-group-caret"></i>`;

    const items = document.createElement('div');
    items.className = 'nav-group-items';

    links[0].parentNode.insertBefore(wrapper, links[0]);
    wrapper.appendChild(toggle);
    wrapper.appendChild(items);
    links.forEach(link => items.appendChild(link));

    const shouldOpen = links.some(link => link.dataset.page === activePage || link.classList.contains('active'));
    wrapper.classList.toggle('open', shouldOpen);
    toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

    toggle.addEventListener('click', () => {
      const open = !wrapper.classList.contains('open');
      wrapper.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  nav.dataset.grouped = '1';
}

function updateSidebarGroupVisibility() {
  document.querySelectorAll('#sidebar .nav-group').forEach(group => {
    const visibleLinks = [...group.querySelectorAll('.nav-link')]
      .filter(link => link.style.display !== 'none');
    group.style.display = visibleLinks.length ? '' : 'none';
  });
}

function orderSidebarNav() {
  const nav = document.querySelector('#sidebar nav');
  if (!nav) return;

  const ordered = [
    nav.querySelector('[data-page="dashboard"]'),
    nav.querySelector('[data-page="comparacao"]'),
    nav.querySelector('.nav-group[data-group="programacao"]'),
    nav.querySelector('.nav-group[data-group="relatorios-programacao"]'),
    nav.querySelector('.nav-group[data-group="etiquetas"]'),
    nav.querySelector('.nav-group[data-group="acompanhamento"]'),
    nav.querySelector('[data-page="mapa-producao"]'),
    nav.querySelector('[data-page="usuarios"]'),
  ].filter(Boolean);

  ordered.forEach(node => nav.appendChild(node));
}

function applyMenuVisibility(nivel) {
  // Rateio MOI oculto no momento
  document.querySelectorAll('[data-page="maodeobra-rateio"]').forEach(el => {
    el.style.display = 'none';
  });

  // Somente ADMIN vê seção de usuários
  if (nivel !== 'ADMIN') {
    document.querySelectorAll('[data-require="ADMIN"]').forEach(el => {
      el.style.display = 'none';
    });
  }

  // CONSULTA não vê programação nem mão de obra (somente leitura)
  if (nivel === 'CONSULTA') {
    document.querySelectorAll('[data-require]').forEach(el => {
      if (el.dataset.require !== 'CONSULTA') el.style.display = 'none';
    });
  }
  // PRODUCAO não vê programação
  if (nivel === 'PRODUCAO') {
    document.querySelectorAll('[data-require="PCP"]').forEach(el => {
      el.style.display = 'none';
    });
  }
}

/* ─── Toast notifications ────────────────────────────────────── */
function showToast(msg, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill' };
  const toast = document.createElement('div');
  toast.className = `pcp-toast ${type}`;
  toast.innerHTML = `<i class="bi ${icons[type] || icons.success}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ─── Eficiência helpers ─────────────────────────────────────── */
function efClass(pct) {
  if (pct >= 90) return 'good';
  if (pct >= 70) return 'warn';
  return 'bad';
}

function efBadge(pct) {
  const cls = efClass(pct);
  return `<span class="badge-ef ${cls}">${pct.toFixed(1)}%</span>`;
}

function efBar(pct) {
  const cls = efClass(pct);
  const w = Math.min(pct, 100).toFixed(1);
  return `<div class="ef-bar-wrap"><div class="ef-bar ${cls}" style="width:${w}%"></div></div>`;
}

/* ─── Formatação ─────────────────────────────────────────────── */
function fmtM3(v) {
  return parseFloat(v || 0).toFixed(3).replace('.', ',') + ' m³';
}
function fmtN(v) {
  return parseInt(v || 0).toLocaleString('pt-BR');
}
function fmtDate(d) {
  if (!d) return '-';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}
