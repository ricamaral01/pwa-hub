/* =========================================================
   MAPA DE CONCRETAGEM TESTE - Service Worker
   v1.73: filtra o Dashboard Montagem pela data real da montagem
   ========================================================= */

const CACHE_NAME = "mapa-concretagem-teste-v1.73";
const APP_SHELL = [
  "./index.html",
  "./manifest.json?v=v1.73",
  "./styles.css?v=v1.73",
  "./dashboard-defeitos-v4.css?v=v1.73",
  "./app.js?v=v1.73",
  "./xlsx.full.min.js?v=v1.73",
  "./supabase.js",
  "./chart.min.js",
  "./chartjs-plugin-datalabels.min.js",
  "../assets/msgbox.css",
  "../assets/msgbox.js",
  "/auth/config.js?v=2",
  "/auth/client.js",
  "/auth/guard.js?v=2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("mapa-concretagem-teste-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isStaticRequest(request, url) {
  if (request.destination && ["document", "script", "style", "image", "font", "manifest"].includes(request.destination)) {
    return true;
  }
  return /\.(?:html|css|js|json|png|jpe?g|gif|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname);
}

async function networkFirst(request, navigation = false) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (navigation) {
      const fallback = await cache.match("./index.html");
      if (fallback) return fallback;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, true));
    return;
  }

  if (isStaticRequest(request, url)) {
    event.respondWith(networkFirst(request));
  }
});
