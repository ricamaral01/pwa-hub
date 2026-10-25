(() => {
  const prefix = '/unificado/laboratorio';
  const official = 'https://concrefer.concretrack.com.br:18445/novo';
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) input = prefix + input;
    else if (input instanceof Request && new URL(input.url).pathname.startsWith('/api/')) {
      const url = new URL(input.url);
      url.pathname = prefix + url.pathname;
      input = new Request(url, input);
    }
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.pathname.startsWith(prefix + '/api/')) {
      const tab = new URLSearchParams(location.search).get('tab');
      const view = new URLSearchParams(location.search).get('view');
      let screen = tab === 'absorcao' ? 'labAbsorption' : tab === 'historico' ? 'labTests' :
        tab === 'cadastros' ? 'labRegisters' : tab === 'criterios' ? 'labCriteria' :
        view === 'history' ? 'labHistory' : view === 'settings' ? 'labDevice' :
        view === 'help' ? 'labHelp' : location.pathname.includes('/postes') ? 'labPole' : 'labMonitor';
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (method !== 'GET' && method !== 'HEAD') {
        if (url.pathname.includes('/api/ensaios')) screen = 'labPole';
        else if (url.pathname.includes('/api/absorcao')) screen = 'labAbsorption';
        else if (url.pathname.includes('/api/criterios')) screen = 'labCriteria';
        else if (url.pathname.includes('/api/equipamentos') || url.pathname.includes('/api/responsaveis')) screen = 'labRegisters';
      }
      if (url.pathname.includes('/api/auth/users')) screen = 'labUsuarios';
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      headers.set('X-Unificado-Screen', screen);
      init = {...init, headers};
    }
    return originalFetch(input, init);
  };
  const originalOpen = window.open.bind(window);
  window.open = (url, ...args) => {
    if (typeof url === 'string' && url.startsWith('/api/')) url = prefix + url;
    return originalOpen(url, ...args);
  };
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const target = new URL(link.href);
    if (target.origin !== location.origin) return;
    const path = target.pathname;
    if (path === '/novo' || path === '/novo/postes' || path === '/postes') {
      link.href = prefix + (path === '/novo' ? '/' : path === '/postes' ? '/novo/postes' : path) + target.search;
    }
  }, true);
  function unavailable(button, url) {
    if (!button || button.dataset.labUnavailable) return;
    button.dataset.labUnavailable = '1';
    button.disabled = true;
    const note = document.createElement('span');
    note.className = 'lab-official-note';
    note.textContent = 'Disponível na tela oficial · ';
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Abrir tela oficial';
    note.append(link);
    button.insertAdjacentElement('afterend', note);
  }
  function enforce() {
    unavailable(document.getElementById('saveConfig'), official + '?view=settings');
    unavailable(document.getElementById('addEventTop'), official);
    unavailable(document.getElementById('addEventSmall'), official);
    for (const link of document.querySelectorAll('a[href^="/api/"],img[src^="/api/"]')) {
      if (link.hasAttribute('href')) link.setAttribute('href', prefix + link.getAttribute('href'));
      if (link.hasAttribute('src')) link.setAttribute('src', prefix + link.getAttribute('src'));
    }
  }
  document.addEventListener('submit', event => {
    if (event.target?.id === 'configForm' || event.target?.id === 'eventForm') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    enforce();
    new MutationObserver(enforce).observe(document.body, {childList:true, subtree:true});
  });
})();
