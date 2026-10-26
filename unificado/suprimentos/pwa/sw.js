const CACHE = 'suprimentos-shell-s1-v1.0.100';
const SCOPE = '/unificado/suprimentos/pwa/';
const SHELL = [SCOPE, SCOPE+'index.html', SCOPE+'app.css', SCOPE+'app.js',
  '/unificado/suprimentos/frontend/dialog.js', '/unificado/suprimentos/frontend/dialog.css',
  SCOPE+'manifest.webmanifest', SCOPE+'icons/icon-192.png',
  SCOPE+'icons/icon-512.png', SCOPE+'icons/maskable-512.png',
  SCOPE+'icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key.startsWith('suprimentos-shell-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      !SHELL.includes(url.pathname)) return; // API e fotos nunca entram no cache do SW.
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
self.addEventListener('sync', event => {
  if (event.tag !== 'suprimentos-queue') return;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients => {
    clients.forEach(client => client.postMessage({type:'SYNC_QUEUE'}));
  }));
});
