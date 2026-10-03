const CACHE_NAME = "concrefer-unificado-mapa-operacao-v1";
const SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./bridge.js"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("concrefer-unificado-mapa-operacao-") && key !== CACHE_NAME)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin
      || !url.pathname.startsWith("/unificado/mapa/operacao/")) return;
  if (/\.(?:js|css|html|png|svg|woff2?)$/.test(url.pathname) || event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(event.request)) || cache.match("./index.html");
    }));
  }
});
