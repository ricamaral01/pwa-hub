/* =========================================================
   Mapa de Concretagem - Service Worker reset
   v5.8: renomeia indice de reprovacao e adiciona total de postes reprovados
   ========================================================= */

const CACHE_NAME = "mapa-concretagem-v5.8";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.includes("mapa-concretagem"))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "SW_RESET_DONE", version: CACHE_NAME });
        }
      })
  );
});

self.addEventListener("fetch", () => {
  return;
});
