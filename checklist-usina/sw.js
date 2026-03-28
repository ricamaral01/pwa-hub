/* ============================================================
   Checklist Usina — Service Worker v1
   - Offline cache (network-first)
   - Push notifications (checklist enviada + alerta 08:30)
   ============================================================ */

const CACHE = 'checklist-usina-v1';
const CHECKLIST_ORIGIN = 'https://ricamaral01.github.io';
const CHECKLIST_URL    = CHECKLIST_ORIGIN + '/pwa-hub/checklist-usina/';

const PRECACHE = [
  './checklist_industrial_usina_mobile_v3.html',
  './manifest.json'
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate — limpa versões antigas ─────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — network-first, cache como fallback ───────────────
self.addEventListener('fetch', e => {
  // Não intercepta chamadas ao GAS nem a CDNs externas
  if (!e.request.url.startsWith(CHECKLIST_ORIGIN)) return;
  if (e.request.url.includes('script.google')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push — exibe notificação ─────────────────────────────────
self.addEventListener('push', e => {
  let data = {
    title: 'Checklist Usina',
    body:  '',
    url:   CHECKLIST_URL
  };
  try { data = Object.assign(data, e.data.json()); } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:             data.body,
      icon:             '/pwa-hub/assets/img/logo-concretrack.png',
      badge:            '/pwa-hub/assets/img/logo-concretrack.png',
      vibrate:          [200, 100, 200],
      requireInteraction: true,
      data:             { url: data.url }
    })
  );
});

// ── Notification click — abre a checklist ────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url)
    ? e.notification.data.url
    : CHECKLIST_URL;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith(CHECKLIST_URL) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(target);
    })
  );
});
