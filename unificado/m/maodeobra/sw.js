/* Escopo exclusivo de /unificado/m/maodeobra/. Nenhuma resposta da API entra no cache. */
const CACHE = 'maodeobra-shell-20261021-refresh1';
const SHELL = [
  '/unificado/m/maodeobra/',
  '/unificado/m/maodeobra/index.html',
  '/unificado/m/maodeobra/login.html',
  '/unificado/m/maodeobra/entry.js?v=20261021-refresh1',
  '/unificado/m/maodeobra/entry.css?v=20261017-prod-v1',
  '/unificado/m/maodeobra/icons/icon-192.png',
  '/unificado/m/maodeobra/icons/icon-512.png',
  '/unificado/m/maodeobra/icons/icon-maskable-512.png',
  '/unificado/m/maodeobra/icons/apple-touch-icon.png',
  '/unificado/pcp/static/css/maodeobra-mobile.css?v=20261017-prod-v1',
  '/unificado/pcp/static/js/maodeobra-mobile.js?v=20261017-prod-v1',
  '/unificado/pcp/static/js/maodeobra-core.js?v=20261017-prod-v1',
  '/unificado/pcp/static/js/app.js?v=20261017-prod-v1',
  '/unificado/pcp/unificado-bridge.js?v=20261021-refresh1',
  '/unificado/shell/auth.js?v=20261021-refresh1',
  '/unificado/shell/shell.css?v=1.0',
  '/unificado/shell/password-visibility.js?v=2',
  '/unificado/shell/password-visibility.css?v=2'
];
const ALLOWED = new Set(SHELL.map(url => new URL(url, self.location.origin).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('maodeobra-shell-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !ALLOWED.has(url.href)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
