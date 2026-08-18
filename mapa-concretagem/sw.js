/* =========================================================
   MAPA DE CONCRETAGEM — Service Worker v5.3-dashboard-defeitos
   Deploy: 2026-07-24
   ========================================================= */

const CACHE_NAME = "mapa-concretagem-v5.3-dashboard-defeitos";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./supabase.js",
  "./chart.min.js",
  "./chartjs-plugin-datalabels.min.js",
  "./manifest.json",
  "../assets/msgbox.css",
  "../assets/msgbox.js",
  "../assets/img/icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Pular requisicoes de API e Supabase
  if (url.href.includes("script.google.com") || url.href.includes("supabase.co")) return;

  // network-first para HTML / navegacao
  if (event.request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // cache-first para recursos estaticos
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
