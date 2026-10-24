/* Dedicated shell cache. API, sessions and inspection records stay on the network. */
const CACHE = 'inspecao-s34-shell-20261021e';
const SHELL = [
  '/unificado/m/inspecao/', '/unificado/m/inspecao/index.html',
  '/unificado/m/inspecao/menu.html',
  '/unificado/m/inspecao/login.html', '/unificado/m/inspecao/manifest.webmanifest',
  '/unificado/m/inspecao/api.js?v=20261021a',
  '/unificado/m/inspecao/app.js?v=20261021c',
  '/unificado/m/inspecao/app.css?v=20261021c',
  '/unificado/m/inspecao/menu.js?v=20261021a',
  '/unificado/m/inspecao/icons/icon-192.png',
  '/unificado/m/inspecao/icons/icon-512.png',
  '/unificado/m/inspecao/icons/icon-maskable-512.png',
  '/unificado/m/inspecao/icons/apple-touch-icon.png',
  '/unificado/mapa/operacao/inspecao-defeitos.js?v=20261021f',
  '/unificado/mapa/operacao/inspecao-defeitos.css?v=20261021e',
  '/unificado/shell/auth.js?v=20261021-inspecao1',
  '/unificado/shell/shell.css?v=1.0',
  '/unificado/shell/password-visibility.js?v=2',
  '/unificado/shell/password-visibility.css?v=2',
  '/unificado/assets/img/logo-concrefer.png',
  '/unificado/assets/img/logo-concretrack.png'
];
const allowed = new Set(SHELL.map(path => new URL(path,self.location.origin).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    for (const path of SHELL) await cache.add(path);
  }));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('inspecao-s34-shell-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !allowed.has(url.href)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
