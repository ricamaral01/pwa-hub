const CACHE_NAME = "concrefer-unificado-mapa-operacao-v__UNIFICADO_VERSION__";
const SHELL = ["./index.html", "./manifest.json", "./test-icon.png",
  "./styles.css", "./dashboard-defeitos-v4.css", "./assets/msgbox.css",
  "./supabase.js", "./chart.min.js", "./chartjs-plugin-datalabels.min.js",
  "./assets/msgbox.js", "./xlsx.full.min.js", "./modelos-formas.js",
  "./bridge.js", "./app.js", "./unificado-bridge.css", "./unificado-bridge.js"];
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
      if (event.request.mode === "navigate") return cache.match("./index.html");
      return (await cache.match(event.request, {ignoreSearch: true})) || Response.error();
    }));
  }
});
