/* Each PCP page asks the server before showing a restricted screen. */
(() => {
  document.documentElement.style.visibility = 'hidden';
  const path = location.pathname.replace(/index\.html$/, '');
  const screen = window.__unificadoPathScreens?.[path];
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/unificado/pcp/api/')) return originalFetch(input, options);
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    if (screen) headers.set('X-Unificado-Screen', screen);
    return originalFetch(input, {...options, headers});
  };
  document.addEventListener('DOMContentLoaded', async () => {
    if (screen === 'pcpUsuarios' && window.__unificadoAllowedScreens?.includes('prodUsuarios') &&
        parent !== window && parent.UnificadoRouter) {
      parent.UnificadoRouter.open('/unificado/mapa/operacao/?tela=USUARIOS');
      return;
    }
    try {
      const token = localStorage.getItem('pcp_token');
      if (!screen || !token) throw new Error();
      if (!Array.isArray(window.__unificadoAllowedScreens)) {
        const grantResponse = await originalFetch('/unificado/mapa/api/unified/planning-screen-access/me', {
          headers:{Authorization:'Bearer ' + token},cache:'no-store'
        });
        if (!grantResponse.ok) throw new Error();
        window.__unificadoAllowedScreens = (await grantResponse.json()).screens || [];
        const allowed = new Set(window.__unificadoAllowedScreens);
        document.querySelectorAll('#sidebar a.nav-link').forEach(link => {
          const route = new URL(link.href,location.href).pathname.replace(/index\.html$/,'');
          const id = window.__unificadoPathScreens?.[route];
          if (id && !allowed.has(id)) link.style.display = 'none';
        });
      }
      const response = await originalFetch('/unificado/mapa/api/unified/screen-authorize', {
        headers: {'Authorization':'Bearer ' + token, 'X-Original-URI':location.pathname + location.search,
                  'X-Unificado-Screen':screen}, cache:'no-store', credentials:'same-origin'
      });
      if (!response.ok) throw new Error();
    } catch {
      document.body.replaceChildren();
      const message = document.createElement('main');
      message.textContent = 'Você não tem acesso a esta tela';
      message.style.cssText = 'margin:24px;padding:24px;background:#fff;border-radius:12px;font:600 16px system-ui;color:#0b1730';
      document.body.append(message);
    }
    document.documentElement.style.visibility = 'visible';
  });
})();
