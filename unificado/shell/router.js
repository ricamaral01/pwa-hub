/* Keep one browser document and one visible shell while either module loads. */
(() => {
  const root = '/unificado/';
  const host = document.getElementById('module-host');
  const homeContent = document.querySelector('.main-panel > .content');
  const accessDenied = document.createElement('section');
  accessDenied.className = 'unificado-access-denied';
  accessDenied.textContent = 'Você não tem acesso a esta tela';
  accessDenied.hidden = true;
  homeContent.after(accessDenied);
  const frames = new Map();
  const lastRoute = new Map();
  let current = null;
  let pending = 0;
  let activeGed = null;
  let expectedGedRoute = null;
  let gedLoadTimer = null;
  let gedBootstrapAbort = null;
  const gedRoutes = new Set(['dashboard', 'documents', 'approvals', 'tasks', 'calibrations']);

  function updateModelAPath(view = '') {
    window.UnificadoSidebarActivePath = root + (view ? '?view=' + encodeURIComponent(view) : '');
    dispatchEvent(new Event('unificado-sidebar-model-a-update'));
  }

  function syncGedMenu(route = activeGed) {
    if (!route) return;
    activeGed = route;
    document.body.classList.add('unificado-ged-active');
    document.querySelectorAll('#sidebar .is-active').forEach(el => el.classList.remove('is-active'));
    document.querySelectorAll('#sidebar .module-button[aria-pressed="true"]').forEach(button =>
      button.setAttribute('aria-pressed', 'false'));
    document.querySelectorAll('#sidebar .module-button.is-active').forEach(button =>
      button.classList.remove('is-active'));
    document.querySelectorAll('#sidebar [data-ged-route]').forEach(link => {
      const selected = link.dataset.gedRoute === route;
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = 'GED';
    crumb.querySelector('span:last-child').textContent =
      ({dashboard:'Painel', documents:'Documentos', approvals:'Aprovações',
        tasks:'Tarefas', calibrations:'Calibrações'})[route];
    updateModelAPath('ged/' + route);
  }

  function resolve(value) {
    let url;
    try { url = new URL(value, location.href); } catch { return null; }
    if (url.origin !== location.origin || !url.pathname.startsWith(root)) return null;
    const path = url.pathname.slice(root.length).replace(/index\.html$/, '');
    if (path !== url.pathname.slice(root.length)) url.pathname = root + path;
    if (path === 'pcp/usuarios/' && hasMapa && mapaUser?.role === 'GERENCIA' &&
        window.UnificadoScreenAccess?.allowed('prodUsuarios'))
      return resolve(root + 'mapa/operacao/?tela=USUARIOS');
    if (/^pcp\/[a-z0-9-]+\/$/.test(path)) return {url, module:'planejamento', path};
    if (path === 'mapa/operacao/') return {url, module:'producao', path};
    if (path === 'producao/pederneiras/') return {url, module:'producao', path};
    if (path === 'usinas/') return {url, module:'usinas', path};
    if (path === 'relatorios/fechamento-diario/') return {url, module:'producao', path};
    if (path === 'laboratorio/' || path === 'laboratorio/certificados-qualidade/' || path === 'laboratorio/dosagem/' || path === 'laboratorio/slump' || path === 'laboratorio/slump/' || path === 'laboratorio/novo/postes' ||
        /^laboratorio\/cec(?:\/(?:resultados|relatorio|analise|etiquetas|leitura))?\/?$/.test(path) ||
        /^laboratorio\/cec\/analise\/(?:resultado-cp|relatorio)\.html$/.test(path) ||
        /^laboratorio\/cronoanalise(?:\/(?:inicio|coletar|medicoes|catalogo|dimensionar|simular|metodologia))?\/?$/.test(path))
      return {url, module:'laboratorio', path};
    if (path === 'qualidade/' || path === 'qualidade/abrir' ||
        path === 'qualidade/cadastros' || /^qualidade\/nc\/[a-zA-Z0-9-]+$/.test(path))
      return {url, module:'qualidade', path};
    return null;
  }

  function screenFor(route) {
    if (route.path === 'laboratorio/dosagem/') return 'labDosagem';
    if (route.path === 'pcp/usuarios/') return 'pcpUsuarios';
    if (route.module === 'producao' && route.url.searchParams.get('tela') === 'USUARIOS') return 'prodUsuarios';
    if (route.module === 'laboratorio' && route.url.searchParams.get('tab') === 'usuarios') return 'labUsuarios';
    if (route.module === 'qualidade' && route.path.startsWith('qualidade/nc/')) return 'qualidadeTratativa';
    const found = Object.entries(MENU_ITEMS).find(([, item]) => item.url === route.url.href);
    if (found) return found[0];
    if (route.module === 'producao' && !route.url.search) return 'liberacao';
    if (route.module === 'laboratorio' && route.path === 'laboratorio/' && !route.url.search) return 'labMonitor';
    return null;
  }

  function deny(ged = false) {
    ++pending;
    clearTimeout(gedLoadTimer);
    gedBootstrapAbort?.abort();
    gedLoadTimer = null;
    gedBootstrapAbort = null;
    host.classList.remove('is-loading', 'is-ged-loading');
    host.classList.remove('is-native');
    host.removeAttribute('aria-busy');
    activeGed = null;
    expectedGedRoute = null;
    document.body.classList.remove('unificado-ged-active');
    document.querySelectorAll('#sidebar [data-ged-route].is-active').forEach(link => {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });
    for (const record of frames.values()) record.frame.classList.remove('is-active');
    host.hidden = true;
    homeContent.hidden = true;
    accessDenied.hidden = false;
    accessDenied.textContent = ged
      ? 'Você ainda não tem acesso ao GED. Peça ao administrador.'
      : 'Você não tem acesso a esta tela';
    if (ged) document.querySelector('.breadcrumb strong').textContent = 'GED';
    document.querySelector('.breadcrumb span:last-child').textContent = 'Sem acesso';
  }

  function gedTimeout(path, push) {
    ++pending;
    gedBootstrapAbort?.abort();
    gedBootstrapAbort = null;
    gedLoadTimer = null;
    activeGed = null;
    expectedGedRoute = null;
    host.hidden = true;
    host.classList.remove('is-loading', 'is-ged-loading');
    host.removeAttribute('aria-busy');
    homeContent.hidden = true;
    accessDenied.replaceChildren();
    const message = document.createElement('p');
    message.textContent = 'Não foi possível abrir o GED. Tente novamente.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.addEventListener('click', () => openGed(path, push));
    accessDenied.append(message, retry);
    accessDenied.hidden = false;
  }

  function label(route, itemId) {
    if (itemId && MENU_ITEMS[itemId]) return MENU_ITEMS[itemId].label;
    if (route.path === 'mapa/operacao/' && route.url.searchParams.get('tela') === 'USUARIOS') return 'Usuários';
    if (route.path === 'pcp/usuarios/') return 'Usuários';
    const found = Object.values(MENU_ITEMS).find(item => item.url === route.url.href);
    if (found) return found.label;
    if (route.module === 'producao') return 'Produção / Liberação';
    if (route.module === 'laboratorio') return 'Monitoramento';
    const slug = route.path.split('/')[1] || '';
    return slug.replaceAll('-', ' ').replace(/^./, s => s.toUpperCase());
  }

  function updateShell(route, itemId, push) {
    clearTimeout(gedLoadTimer);
    gedBootstrapAbort?.abort();
    gedLoadTimer = null;
    gedBootstrapAbort = null;
    const wasGed = Boolean(activeGed);
    activeGed = null;
    expectedGedRoute = null;
    document.body.classList.remove('unificado-ged-active');
    const moduleChanged = currentModule !== route.module;
    currentModule = route.module;
    activeItem = itemId || screenFor(route) || null;
    localStorage.setItem('unificado_modulo', currentModule);
    lastRoute.set(currentModule, route.url.href);
    localStorage.setItem('unificado_last_' + currentModule, route.url.href);
    if (moduleChanged || wasGed) renderSidebar();
    else {
      document.querySelector('#sidebar .nav-home')?.classList.toggle('is-active', !activeItem);
      document.querySelectorAll('#sidebar .nav-link').forEach(link =>
        link.classList.toggle('is-active', link.dataset.item === activeItem));
      document.querySelector('#sidebar .nav-footer')?.classList.toggle('is-active',
        activeItem === 'prodUsuarios' || activeItem === 'pcpUsuarios');
    }
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = MENU_CONFIG[currentModule].label;
    crumb.querySelector('span:last-child').textContent = label(route, activeItem);
    const nativeHash = route.path === 'laboratorio/dosagem/' ? route.url.hash : '';
    if (push) history.pushState({view: route.path + route.url.search + nativeHash}, '', root + '?view=' + encodeURIComponent(route.path + route.url.search + nativeHash) + nativeHash);
    updateModelAPath(route.path + route.url.search + nativeHash);
  }

  function hideHome() {
    homeContent.hidden = true;
    host.hidden = false;
    document.documentElement.classList.remove('unificado-routing');
  }

  function show(record) {
    accessDenied.hidden = true;
    host.classList.remove('is-native');
    for (const other of frames.values()) other.frame.classList.toggle('is-active', other === record);
    hideHome();
    host.classList.remove('is-loading', 'is-ged-loading');
    host.removeAttribute('aria-busy');
    current = record;
    record.frame.focus({preventScroll:true});
  }

  async function ensurePcpSession() {
    if (!hasMapa) return Boolean(localStorage.getItem('pcp_token'));
    const currentToken = localStorage.getItem('pcp_token');
    if (currentToken) {
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (Number(payload.exp) * 1000 > Date.now() + 5 * 60 * 1000) return true;
      } catch { /* Refresh malformed or opaque tokens through the session endpoint. */ }
    }
    const response = await fetch(root + 'mapa/api/unified/pcp-session', {
      credentials:'same-origin', cache:'no-store'
    });
    if (response.status === 401 && localStorage.getItem('pcp_token')) return true;
    if (!response.ok) return false;
    const data = await response.json();
    if (!data.access_token || !data.usuario) return false;
    localStorage.setItem('pcp_token', data.access_token);
    localStorage.setItem('pcp_user', JSON.stringify(data.usuario));
    return true;
  }

  function bindFrame(record) {
    const frame = record.frame;
    frame.addEventListener('load', () => {
      let doc;
      try { doc = frame.contentDocument; } catch { return; }
      if (!doc) return;
      if (frame.contentWindow.location.href === 'about:blank') return;
      if (frame.contentWindow.location.pathname === root + 'login.html') {
        location.assign(root + 'login.html?next=' + encodeURIComponent(record.route.path + record.route.url.search));
        return;
      }
      doc.documentElement.classList.add('unificado-embedded');
      let style = doc.getElementById('unificado-embedded-style');
      if (!style) {
        style = doc.createElement('link');
        style.id = 'unificado-embedded-style';
        style.rel = 'stylesheet';
        style.href = root + 'shell/embedded.css?v=1.0';
        doc.head.append(style);
      }
      doc.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link || link.target === '_blank' || link.hasAttribute('download') || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (new URL(link.href).pathname === root) {
          event.preventDefault(); event.stopImmediatePropagation(); home(); return;
        }
        const route = resolve(link.href);
        if (route) { event.preventDefault(); event.stopImmediatePropagation(); open(route.url.href); }
      }, true);
      const reveal = () => {
        record.ready = true;
        if (record.onReady) { const callback = record.onReady; record.onReady = null; callback(); }
      };
      if (style.sheet) reveal();
      else { style.addEventListener('load', reveal, {once:true}); style.addEventListener('error', reveal, {once:true}); }
    });
  }

  async function open(value, itemId, push = true) {
    const route = resolve(value);
    if (!route) return;
    await window.UnificadoScreenAccess.ready;
    const screenId = screenFor(route);
    if (!screenId || !window.UnificadoScreenAccess.moduleAllowed(route.module) ||
        !window.UnificadoScreenAccess.allowed(screenId)) { deny(); return; }
    if (route.module === 'planejamento' && !hasPcp) return;
    if (route.module === 'producao' && !hasMapa) return;
    if (route.module === 'usinas' && !hasMapa) return;
    if (route.module === 'laboratorio' && !hasLab) return;
    if (route.module === 'qualidade' && !hasMapa) return;
    const ticket = ++pending;
    host.hidden = false;
    homeContent.hidden = true;
    host.classList.add('is-loading');
    host.setAttribute('aria-busy', 'true');
    if (route.module === 'planejamento' && !(await ensurePcpSession())) {
      if (ticket === pending) location.assign(root + 'login.html?next=' + encodeURIComponent(route.path));
      return;
    }
    if (route.module === 'laboratorio') {
      const response = await fetch(root + 'mapa/api/unified/laboratorio-bootstrap', {
        method:'POST', credentials:'same-origin', cache:'no-store'
      });
      if (!response.ok) {
        if (ticket === pending) location.assign(root + 'login.html');
        return;
      }
    }
    if (route.module === 'qualidade') {
      const response = await fetch(root + 'mapa/api/unified/qualidade-bootstrap', {
        method:'POST', credentials:'same-origin', cache:'no-store'
      });
      if (!response.ok) { if (ticket === pending) deny(); return; }
    }
    if (ticket !== pending) return;
    if (route.path === 'laboratorio/dosagem/') {
      try {
        if (!mapaUser?.id) throw new Error('Identidade do Unificado indisponível');
        window.__DOSAGEM_NATIVE__ = true;
        window.__DOSAGEM_NATIVE_USER_ID__ = String(mapaUser.id);
        const native = await import(root + 'laboratorio/dosagem/native/dosagem-native.js?v=1.0.35');
        if (ticket !== pending) return;
        let container = document.getElementById('dosagem-native-host');
        if (!container) {
          container = document.createElement('div');
          container.id = 'dosagem-native-host';
          host.append(container);
        }
        await native.mountDosagem(container);
        if (ticket !== pending) return;
        for (const record of frames.values()) record.frame.classList.remove('is-active');
        host.classList.add('is-native');
        accessDenied.hidden = true;
        hideHome();
        host.classList.remove('is-loading', 'is-ged-loading');
        host.removeAttribute('aria-busy');
        const selected = Object.entries(MENU_ITEMS).find(([, item]) => item.url === route.url.href)?.[0] || 'labDosagem';
        updateShell(route, selected, push);
        const hash = route.url.hash || '#/';
        if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash);
        dispatchEvent(new Event('hashchange'));
        dispatchEvent(new CustomEvent('dosagem:external-route', { detail: { path: hash.slice(1) } }));
      } catch (error) {
        if (ticket !== pending) return;
        console.error('Falha ao abrir a Dosagem', error);
        host.classList.remove('is-loading');
        host.removeAttribute('aria-busy');
        deny();
      }
      return;
    }
    host.classList.remove('is-native');
    const previous = frames.get(route.module);
    if (previous && previous.route.url.href === route.url.href && previous.ready) {
      show(previous); updateShell(route, itemId, push); return;
    }
    if (previous && route.path === 'mapa/operacao/' && previous.route.path === 'mapa/operacao/' && previous.ready &&
        route.url.searchParams.get('tela') !== 'USUARIOS' &&
        typeof previous.frame.contentWindow.setMode === 'function') {
      const mode = route.url.searchParams.get('tela') || 'HUB';
      previous.frame.contentWindow.setMode(mode);
      previous.route = route;
      show(previous); updateShell(route, itemId, push); return;
    }
    const frame = document.createElement('iframe');
    frame.title = MENU_CONFIG[route.module].label;
    frame.allow = 'camera; microphone; fullscreen; clipboard-read; clipboard-write';
    frame.allowFullscreen = true;
    const record = {frame, route, ready:false, onReady:null};
    bindFrame(record);
    host.hidden = false;
    host.append(frame);
    record.onReady = () => {
      if (ticket !== pending) { frame.remove(); return; }
      if (previous) previous.frame.remove();
      frames.set(route.module, record);
      show(record);
      updateShell(route, itemId, push);
    };
    frame.src = route.url.href;
  }

  async function openModule(module) {
    await window.UnificadoScreenAccess.ready;
    if (!window.UnificadoScreenAccess.moduleAllowed(module)) return;
    const stored = resolve(localStorage.getItem('unificado_last_' + module));
    const candidate = lastRoute.get(module) || (stored?.module === module && stored.url.href);
    const candidateRoute = candidate && resolve(candidate);
    const first = Object.entries(MENU_ITEMS).find(([, item]) => item.module === module &&
      window.UnificadoScreenAccess.allowed(item.id) && canUse(item));
    const firstUrl = first?.[1]?.url;
    open(candidateRoute && window.UnificadoScreenAccess.allowed(screenFor(candidateRoute))
      ? candidate : firstUrl);
  }

  async function openGed(path = 'dashboard', push = true) {
    if (typeof path === 'boolean') { push = path; path = 'dashboard'; }
    if (!gedRoutes.has(path)) path = 'dashboard';
    await window.UnificadoScreenAccess.ready;
    if (!previewModules || !hasMapa) { deny(true); return; }
    const ticket = ++pending;
    expectedGedRoute = path;
    clearTimeout(gedLoadTimer);
    gedBootstrapAbort?.abort();
    gedBootstrapAbort = new AbortController();
    host.hidden = false;
    homeContent.hidden = true;
    accessDenied.hidden = true;
    host.classList.add('is-loading', 'is-ged-loading');
    host.setAttribute('aria-busy', 'true');
    frames.get('ged')?.frame.classList.remove('is-active');
    syncGedMenu(path);
    gedLoadTimer = setTimeout(() => {
      if (ticket === pending) gedTimeout(path, push);
    }, 10000);
    let bootstrap;
    try {
      bootstrap = await fetch(root + 'ged/api/auth/unified-session', {
        credentials:'same-origin', cache:'no-store', signal:gedBootstrapAbort.signal
      });
    } catch { if (ticket === pending) gedTimeout(path, push); return; }
    if (ticket !== pending) return;
    if (bootstrap.status === 401 || bootstrap.status === 403) { deny(true); return; }
    if (!bootstrap.ok) { gedTimeout(path, push); return; }
    let existing = frames.get('ged');
    if (existing && !existing.ready) {
      existing.frame.remove();
      frames.delete('ged');
      existing = null;
    }
    const reveal = record => {
      if (ticket !== pending) return;
      clearTimeout(gedLoadTimer);
      gedLoadTimer = null;
      show(record);
      activeItem = null;
      syncGedMenu(path);
      if (push) history.pushState({view:'ged/' + path}, '', root + '?view=ged/' + path);
    };
    if (existing) {
      existing.path = path;
      existing.ready = false;
      existing.reveal = reveal;
      let sameReadyPage = false;
      try {
        sameReadyPage = existing.frame.contentWindow.location.pathname === root + 'ged/' + path &&
          Boolean(existing.frame.contentDocument?.querySelector('main h1'));
      } catch { /* An error page is isolated; navigate the iframe again. */ }
      if (sameReadyPage) reveal(existing);
      else existing.frame.src = root + 'ged/' + path + '?embed=1';
      return;
    }
    const frame = document.createElement('iframe');
    frame.title = 'GED — Documentos e calibrações';
    frame.allow = 'camera; fullscreen';
    const record = {frame, ready:false, path};
    record.reveal = reveal;
    frames.set('ged', record);
    frame.src = root + 'ged/' + path + '?embed=1';
    host.append(frame);
  }

  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frames.get('ged')?.frame.contentWindow ||
        !['unificado-ged-route', 'unificado-ged-ready'].includes(event.data?.type) || !activeGed) return;
    const route = String(event.data.path || '').replace(/^\/unificado\/ged\//, '/').split('/').filter(Boolean)[0];
    const currentPath = frames.get('ged').frame.contentWindow.location.pathname;
    const currentRoute = currentPath.replace(/^\/unificado\/ged\//, '/').split('/').filter(Boolean)[0];
    if (route !== currentRoute) return;
    if (event.data.type === 'unificado-ged-ready') {
      const record = frames.get('ged');
      if (route === expectedGedRoute && !record.ready) {
        record.ready = true;
        record.reveal?.(record);
        expectedGedRoute = null;
      }
      return;
    }
    if (gedRoutes.has(route) && (!expectedGedRoute || route === expectedGedRoute)) {
      syncGedMenu(route);
    }
  });

  function home(push = true) {
    ++pending;
    clearTimeout(gedLoadTimer);
    gedBootstrapAbort?.abort();
    gedLoadTimer = null;
    gedBootstrapAbort = null;
    activeGed = null;
    expectedGedRoute = null;
    document.body.classList.remove('unificado-ged-active');
    host.classList.remove('is-loading', 'is-ged-loading');
    host.classList.remove('is-native');
    host.removeAttribute('aria-busy');
    for (const record of frames.values()) record.frame.classList.remove('is-active');
    current = null;
    host.hidden = true;
    homeContent.hidden = false;
    accessDenied.hidden = true;
    activeItem = null;
    renderSidebar();
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = 'Concrefer';
    crumb.querySelector('span:last-child').textContent = 'Início';
    if (push) history.pushState({}, '', root);
    updateModelAPath();
  }

  window.UnificadoRouter = Object.freeze({open, openModule, openGed, home, syncGedMenu});
  addEventListener('dosagem:navigate', () => dispatchEvent(new Event('hashchange')));
  addEventListener('hashchange', () => {
    if (!document.getElementById('dosagem-native-host') || !host.classList.contains('is-native')) return;
    const hash = location.hash || '#/';
    const route = resolve(root + 'laboratorio/dosagem/' + hash);
    if (!route) return;
    const item = Object.entries(MENU_ITEMS).find(([, entry]) => entry.url === route.url.href)?.[0] || 'labDosagem';
    history.replaceState({view: route.path + hash}, '', root + '?view=' + encodeURIComponent(route.path + hash) + hash);
    updateShell(route, item, false);
  });
  addEventListener('popstate', () => {
    const view = new URLSearchParams(location.search).get('view');
    if (view?.startsWith('ged/')) openGed(view.slice(4).split('/')[0] || 'dashboard', false);
    else if (view && resolve(root + view)) open(root + view, null, false);
    else home(false);
  });
  const view = new URLSearchParams(location.search).get('view');
  const initialRoute = view && resolve(root + view);
  if (view?.startsWith('ged/')) openGed(view.slice(4).split('/')[0] || 'dashboard', false);
  else if (initialRoute) {
    const canonical = initialRoute.path + initialRoute.url.search + initialRoute.url.hash;
    if (canonical !== view) history.replaceState({view:canonical}, '', root + '?view=' + encodeURIComponent(canonical) + initialRoute.url.hash);
    open(initialRoute.url.href, null, false);
  }
  else if (view) {
    history.replaceState({}, '', root);
    document.documentElement.classList.remove('unificado-routing');
    home(false);
  }
})();
