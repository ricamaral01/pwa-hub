/* =============================================
  CONCRETRACK HUB — Service Worker Unificado
  Cacheia Home + todos os sub-apps
  ============================================= */

const CACHE = "ct-hub-v27";

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
  "./massadas/index.html",

  /* ---- Setor Botões ---- */
  "./setor_botoes/index.html",

  /* ---- Dosagem Concreto ---- */
  "./dosagem-concreto/index.html",
  "./dosagem-concreto/manual.html",

  /* ---- Carta Traço ---- */
  "./carta-traco/index.html",

  /* ---- Mapa de Concretagem ---- */
  "./mapa-concretagem/index.html",
  "./mapa-concretagem/app.js",
  "./mapa-concretagem/styles.css",

  /* ---- Alertas ---- */
  "./alertas.html",

  /* ---- Controle Estatístico ---- */
  "./controle-estatistico/index.html",
  "./controle-estatistico/resultado-cp.html",
  "./controle-estatistico/relatorio.html"
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

/* ---- FETCH: network-first p/ HTML, cache-first p/ assets ---- */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear chamadas do Google Apps Script
  if (url.href.includes("script.google.com")) return;

  // Nunca cachear chamadas externas de CDN (html5-qrcode etc.)
  if (url.origin !== location.origin) return;

  // HTML / navegação → network-first (sempre pega a versão mais recente)
  if (event.request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // Assets estáticos (CSS, JS, imagens) → cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (event.request.mode === "navigate") {
        return caches.match("./index.html");
      }
    })
  );
});

// ── Push — exibe notificação ─────────────────────────────────
self.addEventListener('push', e => {
  let data = {
    title: 'ConcreTrack',
    body:  '',
    url:   'https://ricamaral01.github.io/pwa-hub/'
  };
  try { data = Object.assign(data, e.data.json()); } catch (_) {}

  _storeAlert(data.title, data.body, Date.now());

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:               data.body,
      icon:               '/pwa-hub/assets/img/logo-concretrack.png',
      badge:              '/pwa-hub/assets/img/logo-concretrack.png',
      vibrate:            [200, 100, 200],
      requireInteraction: true,
      data:               { url: data.url }
    })
  );
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url)
    ? e.notification.data.url
    : 'https://ricamaral01.github.io/pwa-hub/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith('https://ricamaral01.github.io/pwa-hub/') && 'focus' in c)
          return c.focus();
      }
      return clients.openWindow(target);
    })
  );
});

// ── IndexedDB: histórico de alertas ──────────────────────────
function _storeAlert(title, body, ts) {
  try {
    const req = indexedDB.open('ct-alerts-db', 1);
    req.onupgradeneeded = ev => {
      ev.target.result.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = ev => {
      const db  = ev.target.result;
      const tx  = db.transaction('alerts', 'readwrite');
      const str = tx.objectStore('alerts');
      str.add({ title, body, ts });
      const cnt = str.count();
      cnt.onsuccess = () => {
        if (cnt.result > 100) {
          str.openCursor().onsuccess = ce => {
            if (ce.target.result) ce.target.result.delete();
          };
        }
      };
    };
  } catch (_) {}
}
