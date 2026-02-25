/* =============================================
   CONCRETRACK HUB — Service Worker Unificado
   Cacheia Home + todos os 5 sub-apps
   ============================================= */

const CACHE = "ct-hub-v2";

const ASSETS = [
  /* ---- Splash ---- */
  "./splash.html",

  /* ---- Home ---- */
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",

  /* ---- Assets ---- */
  "./assets/img/icon.png",
  "./assets/img/logo-concretrack.png",
  "./assets/img/logo-concrefer.png",

  /* ---- QR Concreto ---- */
  "./qr-concreto/index.html",
  "./qr-concreto/assets/icon-192x192.png",
  "./qr-concreto/assets/icon-256x256.png",
  "./qr-concreto/assets/icon-384x384.png",
  "./qr-concreto/assets/icon-512x512.png",

  /* ---- Setor Count ---- */
  "./setor_count/index.html",

  /* ---- Slump / Flow ---- */
  "./slump/index.html",

  /* ---- Parada Usina ---- */
  "./parada-usina/index.html",

  /* ---- Massadas ---- */
  "./massadas/index.html"
];

/* ---- INSTALL: cacheia tudo ---- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ---- ACTIVATE: limpa caches antigos ---- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          // Remove qualquer cache antigo (hub ou sub-apps individuais)
          if (k !== CACHE) return caches.delete(k);
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- FETCH: cache-first, exceto Apps Script ---- */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear chamadas do Google Apps Script
  if (url.href.includes("script.google.com")) return;

  // Nunca cachear chamadas externas de CDN (html5-qrcode etc.)
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cacheia novos recursos do mesmo origin
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: volta pra home
      if (event.request.mode === "navigate") {
        return caches.match("./index.html");
      }
    })
  );
});
