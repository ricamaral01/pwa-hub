(() => {
  'use strict';
  const dedicated = '/unificado/m/maodeobra/';
  window.MaoDeObraPWA = {dedicated:true};
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/unificado/pcp/api/'))
      return originalFetch(input, options);
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('X-Unificado-Screen', 'maodeobra');
    return originalFetch(input, {...options, headers, cache:'no-store'});
  };
  // Mantém o login do Unificado dentro do escopo do app no iPhone instalado.
  unificadoUnavailableOrLogin = () => location.replace(dedicated + 'login.html?next=m%2Fmaodeobra%2F%3Flaunch%3D1');
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register(dedicated + 'sw.js', {scope:dedicated}).catch(() => {}));
  }
  const install = document.getElementById('mdo-install');
  const installButton = document.getElementById('mdo-install-button');
  let promptEvent = null;
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    installButton.hidden = false;
    document.getElementById('mdo-android-help').hidden = true;
  });
  addEventListener('appinstalled', () => { promptEvent = null; install.hidden = true; launch(); });
  installButton.addEventListener('click', async () => {
    if (!promptEvent) return;
    const current = promptEvent;
    promptEvent = null;
    await current.prompt();
    await current.userChoice;
    installButton.hidden = true;
  });
  async function launch() {
    if (window.MaoDeObraPWA.launched) return;
    window.MaoDeObraPWA.launched = true;
    install.hidden = true;
    if (location.search !== '?launch=1') history.replaceState(null, '', dedicated + '?launch=1');
    const recovered = await window.unificadoRecoverPcpSession();
    if (!recovered && !localStorage.getItem('pcp_token')) {
      location.replace(dedicated + 'login.html?next=m%2Fmaodeobra%2F%3Flaunch%3D1');
      return;
    }
    const script = document.createElement('script');
    script.src = '/unificado/pcp/static/js/maodeobra-mobile.js?v=20261017-prod-v1';
    document.body.append(script);
  }
  document.getElementById('mdo-continue').addEventListener('click', launch);
  if (standalone || new URLSearchParams(location.search).get('launch') === '1') {
    launch();
  } else {
    install.hidden = false;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    document.getElementById('mdo-ios-help').hidden = !ios;
    document.getElementById('mdo-android-help').hidden = ios;
  }
})();
