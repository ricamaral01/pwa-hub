const CACHE_NAME = 'concretrack-leitura-v4';
const ASSETS = [
  '/unificado/laboratorio/cec/leitura/',
  '/unificado/laboratorio/cec/assets/img/icon-192.png',
  '/unificado/laboratorio/cec/assets/img/icon-512.png',
  '/unificado/laboratorio/cec/assets/img/logo.png',
  '/unificado/laboratorio/cec/assets/vendor/fonts/bootstrap-icons.woff2',
  '/unificado/laboratorio/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459W1hyzbi.woff2',
  '/unificado/laboratorio/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459Wdhyzbi.woff2',
  '/unificado/laboratorio/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
  '/unificado/laboratorio/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459WRhyzbi.woff2',
  '/unificado/laboratorio/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459WZhyzbi.woff2',

  '/unificado/laboratorio/cec/assets/vendor/bootstrap.min.css',
  '/unificado/laboratorio/cec/assets/vendor/bootstrap-icons.min.css',
  '/unificado/laboratorio/cec/assets/vendor/montserrat.css',
  '/unificado/laboratorio/cec/assets/vendor/html5-qrcode.min.js',
  '/unificado/laboratorio/cec/assets/vendor/bootstrap.bundle.min.js',
];

// Install — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for assets, network-first for API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls: always try network
  if (url.pathname.startsWith('/unificado/laboratorio/cec-api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Navegações devem buscar a versão atual antes de recorrer ao cache. Isso
  // impede que o PWA instalado continue exibindo uma tela antiga após deploys.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
