const CACHE_NAME = "concrefer-unificado-mapa-operacao-v__UNIFICADO_VERSION__-insdef5-d6";
const SHELL = ["./index.html", "./manifest.json", "./unificado-icon.png",
  "./styles.css", "./inspecao-defeitos.css", "./inspecao-defeitos.js", "./dashboard-defeitos-v4.css", "./dashboard-defeitos-v5.css", "./dashboards-v6.css", "./assets/msgbox.css",
  "./supabase.js", "./chart.min.js", "./chartjs-plugin-datalabels.min.js",
  "./assets/msgbox.js", "./xlsx.full.min.js", "./modelos-formas.js",
  "./bridge.js", "./app.js", "./unificado-bridge.css", "./unificado-bridge.js", "./dashboard-defeitos-v5.js", "./dashboards-v6.js",
  "/unificado/vendor/html2pdf/html2pdf.bundle.min.js"];
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
      || !(url.pathname.startsWith("/unificado/mapa/operacao/")
        || url.pathname === "/unificado/vendor/html2pdf/html2pdf.bundle.min.js")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return cache.match("./index.html");
    }));
    return;
  }
  if (/\.(?:js|css|png|svg|woff2?)$/.test(url.pathname)) {
    const version = CACHE_NAME.slice("concrefer-unificado-mapa-operacao-v".length);
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
      const cached = url.searchParams.get("v") && url.searchParams.get("v") !== version
        ? null : await cache.match(event.request, {ignoreSearch:true});
      return cached || fetch(event.request).then(response => {
        if (response.ok && !url.searchParams.get("v")) cache.put(event.request, response.clone());
        return response;
      });
    }));
  }
});
