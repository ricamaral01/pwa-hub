/* Installed at the legacy Mapa service-worker URL during the VPS cutover. */
const MAPA_NEW_HOME = "https://concrefer.concretrack.com.br/unificado/";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("mapa-concretagem-v"))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  const path = new URL(event.request.url).pathname;
  if (path.endsWith("/pendencias-migracao.html")) return;
  if (path.startsWith("/mapa-concretagem/") ||
      path.startsWith("/concretrack/mapa-concretagem/")) {
    event.respondWith(Response.redirect(MAPA_NEW_HOME, 302));
  }
});
