const CACHE = 'concrefer-unificado-shell-v20261028-modulos-a-2';
const CRONO_CACHE = 'concrefer-cronoanalise-v1';
const ROOT = '/unificado/';
const CORE = [ROOT + 'index.html', ROOT + 'shell/shell.css?v=1.0.105',
  ROOT + 'shell/shared-menu.css?v=1.0.36-usinas',
  ROOT + 'shell/modelo-a/menu.css?v=1.0.98', ROOT + 'shell/modelo-a-host.css?v=20261028-tablet-scroll',
  ROOT + 'shell/modelo-a/menu.js?v=1.0.98',
  ROOT + 'shell/modelo-a-loader.js?v=1.0.98',
  ROOT + 'shell/menu.config.js?v=20261028-indicador-geral-1', ROOT + 'shell/auth.js?v=1.0.18-fechamento-menu',
  ROOT + 'shell/shell.js?v=20261028-modulos-a-1', ROOT + 'shell/navigation.css?v=20261028-mobile-scroll',
  ROOT + 'shell/navigation.js?v=1.0.107-ribeirao', ROOT + 'shell/router.js?v=20261028-indicador-geral-1',
  ROOT + 'shell/module-pages.js?v=20261028-modulos-a-2', ROOT + 'shell/module-pages-a.css?v=20261028-1',
  ROOT + 'shell/embedded.css?v=1.0'];
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(CORE.map(asset => new Request(asset, {cache:'reload'}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('concrefer-unificado-shell-v') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === ROOT || url.pathname === ROOT + 'index.html') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      if (response.ok && !response.redirected) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(ROOT + 'index.html', copy));
      }
      return response;
    }).catch(() => caches.match(ROOT + 'index.html')));
    return;
  }
  if (url.pathname.startsWith(ROOT + 'laboratorio/cronoanalise') &&
      !url.pathname.includes('/api/')) {
    const page = !/\.(?:js|css|html|png|jpg|svg|woff2?)$/i.test(url.pathname) ||
      url.pathname.endsWith('metodologia-conteudo.html');
    event.respondWith(caches.open(CRONO_CACHE).then(async cache => {
      const fallback = page && !url.pathname.endsWith('metodologia-conteudo.html')
        ? await cache.match(ROOT + 'laboratorio/cronoanalise') : null;
      try {
        const response = await fetch(event.request, {cache:'no-store'});
        if (response.ok && !response.redirected && response.type === 'basic') {
          await cache.put(event.request, response.clone());
          if (page && !url.pathname.endsWith('metodologia-conteudo.html'))
            await cache.put(ROOT + 'laboratorio/cronoanalise', response.clone());
        }
        return response;
      } catch {
        return await cache.match(event.request) || fallback || Response.error();
      }
    }));
    return;
  }
  if (!url.pathname.startsWith(ROOT + 'shell/')) return;
  event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
    if (response.ok && !response.redirected && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => await caches.match(event.request) || Response.error()));
});
