(() => {
  const base = '/unificado/m/inspecao/';
  const status = document.getElementById('pwa-connection');
  const main = document.getElementById('insDefApp');
  main.hidden = true;
  document.getElementById('pwa-logout').addEventListener('click', async () => {
    await fetch('/unificado/mapa/api/logout',{method:'POST',credentials:'same-origin',cache:'no-store'}).catch(() => {});
    location.replace(base + 'login.html');
  });
  fetch('/unificado/mapa/api/me',{credentials:'same-origin',cache:'no-store'})
    .then(async response => {
      if (response.status === 401) { location.replace(base + 'login.html'); return; }
      if (!response.ok) throw new Error('Não foi possível verificar o acesso.');
      const access = await fetch('/unificado/mapa/api/unified/screen-access/me',{
        credentials:'same-origin',cache:'no-store'
      });
      if (!access.ok) throw new Error('Não foi possível verificar a permissão de inspeção.');
      const data = await access.json();
      if (!data.allowed?.includes('inspecao') && !data.screens?.includes?.('inspecao'))
        throw new Error('Seu usuário não tem acesso à inspeção dos setores 3 e 4.');
      main.hidden = false;
      status.textContent = 'Conectado ao banco de inspeções';
    })
    .catch(error => { status.textContent = error.message; status.classList.add('error'); });
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register(base + 'sw.js',{scope:base}).catch(() => {}));
  const install = document.getElementById('pwa-install');
  const installButton = document.getElementById('pwa-install-button');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let promptEvent;
  if (!standalone && !sessionStorage.getItem('inspecao-install-dismissed')) {
    install.hidden = false;
    document.getElementById('pwa-ios-help').hidden = !/iPad|iPhone|iPod/.test(navigator.userAgent);
  }
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); promptEvent = event; install.hidden = false; installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!promptEvent) return;
    await promptEvent.prompt(); await promptEvent.userChoice;
    promptEvent = null; installButton.hidden = true;
  });
  document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
    install.hidden = true; sessionStorage.setItem('inspecao-install-dismissed','1');
  });
  addEventListener('appinstalled', () => { install.hidden = true; });
})();
