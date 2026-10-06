/* Keep one browser document and one visible shell while either module loads. */
(() => {
  const root = '/unificado/';
  const host = document.getElementById('module-host');
  const homeContent = document.querySelector('.main-panel > .content');
  const frames = new Map();
  const lastRoute = new Map();
  let current = null;
  let pending = 0;

  function resolve(value) {
    let url;
    try { url = new URL(value, location.href); } catch { return null; }
    if (url.origin !== location.origin || !url.pathname.startsWith(root)) return null;
    const path = url.pathname.slice(root.length).replace(/index\.html$/, '');
    if (path !== url.pathname.slice(root.length)) url.pathname = root + path;
    if (/^pcp\/[a-z0-9-]+\/$/.test(path)) return {url, module:'planejamento', path};
    if (path === 'mapa/operacao/') return {url, module:'producao', path};
    return null;
  }

  function label(route, itemId) {
    if (itemId && MENU_ITEMS[itemId]) return MENU_ITEMS[itemId].label;
    const found = Object.values(MENU_ITEMS).find(item => item.url === route.url.href);
    if (found) return found.label;
    if (route.module === 'producao') return 'Produção / Liberação';
    const slug = route.path.split('/')[1] || '';
    return slug.replaceAll('-', ' ').replace(/^./, s => s.toUpperCase());
  }

  function updateShell(route, itemId, push) {
    const moduleChanged = currentModule !== route.module;
    currentModule = route.module;
    activeItem = itemId || Object.entries(MENU_ITEMS).find(([,item]) => item.url === route.url.href)?.[0] || null;
    localStorage.setItem('unificado_modulo', currentModule);
    lastRoute.set(currentModule, route.url.href);
    localStorage.setItem('unificado_last_' + currentModule, route.url.href);
    if (moduleChanged) renderSidebar();
    else {
      document.querySelector('#sidebar .nav-home')?.classList.toggle('is-active', !activeItem);
      document.querySelectorAll('#sidebar .nav-link').forEach(link =>
        link.classList.toggle('is-active', link.dataset.item === activeItem));
    }
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = currentModule === 'producao' ? 'Produção' : 'Planejamento';
    crumb.querySelector('span:last-child').textContent = label(route, activeItem);
    if (push) history.pushState({view: route.path + route.url.search}, '', root + '?view=' + encodeURIComponent(route.path + route.url.search));
  }

  function hideHome() {
    homeContent.hidden = true;
    host.hidden = false;
    document.documentElement.classList.remove('unificado-routing');
  }

  function show(record) {
    for (const other of frames.values()) other.frame.classList.toggle('is-active', other === record);
    hideHome();
    current = record;
    record.frame.focus({preventScroll:true});
  }

  async function ensurePcpSession() {
    if (!hasMapa) return Boolean(localStorage.getItem('pcp_token'));
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
        style.href = root + 'shell/embedded.css?v=0.6.21';
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
    if (route.module === 'planejamento' && !hasPcp) return;
    if (route.module === 'producao' && !hasMapa) return;
    const ticket = ++pending;
    if (route.module === 'planejamento' && !(await ensurePcpSession())) {
      if (ticket === pending) location.assign(root + 'login.html?next=' + encodeURIComponent(route.path));
      return;
    }
    if (ticket !== pending) return;
    const previous = frames.get(route.module);
    if (previous && previous.route.url.href === route.url.href && previous.ready) {
      show(previous); updateShell(route, itemId, push); return;
    }
    if (previous && route.module === 'producao' && previous.ready &&
        typeof previous.frame.contentWindow.setMode === 'function') {
      const mode = route.url.searchParams.get('tela') || 'HUB';
      previous.frame.contentWindow.setMode(mode);
      previous.route = route;
      show(previous); updateShell(route, itemId, push); return;
    }
    const frame = document.createElement('iframe');
    frame.title = route.module === 'producao' ? 'Produção' : 'Planejamento';
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

  function openModule(module) {
    if (module === 'planejamento' && !hasPcp || module === 'producao' && !hasMapa) return;
    const stored = resolve(localStorage.getItem('unificado_last_' + module));
    open(lastRoute.get(module) || (stored?.module === module && stored.url.href) || (module === 'planejamento'
      ? root + 'pcp/dashboard/' : root + 'mapa/operacao/?tela=LIBERACAO'));
  }

  function home(push = true) {
    ++pending;
    for (const record of frames.values()) record.frame.classList.remove('is-active');
    current = null;
    host.hidden = true;
    homeContent.hidden = false;
    activeItem = null;
    renderSidebar();
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = 'Concrefer';
    crumb.querySelector('span:last-child').textContent = 'Início';
    if (push) history.pushState({}, '', root);
  }

  window.UnificadoRouter = Object.freeze({open, openModule, home});
  addEventListener('popstate', () => {
    const view = new URLSearchParams(location.search).get('view');
    if (view && resolve(root + view)) open(root + view, null, false);
    else home(false);
  });
  const view = new URLSearchParams(location.search).get('view');
  const initialRoute = view && resolve(root + view);
  if (initialRoute) {
    const canonical = initialRoute.path + initialRoute.url.search;
    if (canonical !== view) history.replaceState({view:canonical}, '', root + '?view=' + encodeURIComponent(canonical));
    open(initialRoute.url.href, null, false);
  }
  else if (view) {
    history.replaceState({}, '', root);
    document.documentElement.classList.remove('unificado-routing');
    home(false);
  }
})();
