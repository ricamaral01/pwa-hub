const CACHE = "ct-controle-est-v7";
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
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve())))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname.startsWith("/api/")) return;

  // Passthrough: recursos externos
  if (
    url.hostname !== self.location.hostname ||
    url.href.includes("cdn.jsdelivr.net")
  ) return;

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE });
  }
});
