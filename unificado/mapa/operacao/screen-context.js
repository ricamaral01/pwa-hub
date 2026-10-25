/* Label Mapa data requests with the visible screen for the server guard. */
(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    // The bridge rewrites the legacy PCP URL to the local protected proxy.
    // Tag it before that rewrite so the proxy can authorize the visible screen.
    const legacyPcp = url.hostname === 'pcp.concretrack.com.br' &&
      url.pathname.startsWith('/api/');
    const legacyPhoto = url.hostname === 'dautomacao.com' &&
      url.pathname.startsWith('/api/');
    if ((!url.pathname.startsWith('/unificado/mapa/api/') && !legacyPcp && !legacyPhoto) ||
        url.pathname.includes('/unified/screen-access/'))
      return originalFetch(input, options);
    const mode = typeof state !== 'undefined' && state?.mode ||
      new URLSearchParams(location.search).get('tela') || 'HUB';
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('X-Unificado-Screen', mode);
    return originalFetch(input, {...options, headers});
  };
})();
