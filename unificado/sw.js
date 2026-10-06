const CACHE = 'concrefer-unificado-shell-v0.6.24';
const ROOT = '/unificado/';
const CORE = [ROOT + 'index.html', ROOT + 'shell/shell.css?v=0.6.24',
  ROOT + 'shell/menu.config.js?v=0.6.7', ROOT + 'shell/auth.js?v=0.6.24',
  ROOT + 'shell/shell.js?v=0.6.24', ROOT + 'shell/router.js?v=0.6.24',
  ROOT + 'shell/embedded.css?v=0.6.24'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
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
  if (!url.pathname.startsWith(ROOT + 'shell/')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
