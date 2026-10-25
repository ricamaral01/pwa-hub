const CACHE = "ct-controle-est-v10";
const ASSETS = [
  "./index.html",
  "./resultado-cp.html",
  "./relatorio.html",
  "./api-client.js",
  "./manifest.json",
  "./relatorio-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();

    // A release can replace a report already open under an older cache.
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.filter((client) =>
      new URL(client.url).pathname.endsWith("/controle-estatistico/relatorio.html")
    ).map((client) => client.navigate(client.url).catch(() => {})));
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET" || url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(req).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)));
        }
        return response;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE });
  }
});
