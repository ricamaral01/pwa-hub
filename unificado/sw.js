const CACHE = 'concrefer-unificado-shell-v1.4.29';
const CRONO_CACHE = 'concrefer-cronoanalise-v1';
const QUALITY_CACHE = 'concrefer-qualidade-static-v1.2.7';
const ROOT = '/unificado/';
const CORE = [ROOT+'shell/busca.js?v=1.4.29',ROOT+'shell/busca.css?v=1.4.29',ROOT+'shell/busca-sinonimos.json',ROOT+'shell/review-complete.css?v=1.4.29',ROOT+'shell/components.js?v=1.4.29',ROOT + 'shell/tokens.css?v=1.4.29', ROOT + 'shell/visual-shell.css?v=1.4.29', ROOT + 'shell/icons.js?v=1.4.29',ROOT+'shell/quick-access.js?v=1.4.29',ROOT+'shell/quick-access.css?v=1.4.29',ROOT+'shell/fonts/Geist-Regular.woff2',ROOT+'shell/fonts/Geist-Medium.woff2',ROOT+'shell/fonts/Geist-SemiBold.woff2',ROOT + 'index.html', ROOT + 'shell/shell.css?v=1.4.29',
  ROOT + 'shell/shared-menu.css?v=1.4.29',
  ROOT + 'shell/modelo-a/menu.css?v=1.4.29', ROOT + 'shell/modelo-a-host.css?v=1.4.29',
  ROOT + 'shell/modelo-a/menu.js?v=1.4.29',
  ROOT + 'shell/modelo-a-loader.js?v=1.4.29',
  ROOT + 'shell/menu.config.js?v=1.4.29', ROOT + 'shell/auth.js?v=1.4.29',
  ROOT + 'shell/shell.js?v=1.4.29', ROOT + 'shell/navigation.css?v=1.4.29',
  ROOT + 'shell/navigation.js?v=1.4.29', ROOT + 'shell/router.js?v=1.4.29',
  ROOT + 'shell/module-pages-mobile.js?v=1.4.29', ROOT + 'shell/module-pages.js?v=1.4.29',
  ROOT + 'shell/module-pages-a.css?v=1.4.29', ROOT + 'shell/module-cards.css?v=1.4.29',
  ROOT + 'shell/module-theme.js?v=1.4.29',
  ROOT + 'shell/home-header-compact.css?v=1.4.29',
  ROOT + 'shell/home-header-compact.js?v=1.4.29',
  ROOT + 'shell/embedded.css?v=1.4.29'];
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(CORE.map(asset => new Request(asset, {cache:'reload'}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const upgrading = keys.some(key => key.startsWith('concrefer-unificado-shell-v') && key !== CACHE);
    await Promise.all(keys.filter(key =>
      (key.startsWith('concrefer-unificado-shell-v') && key !== CACHE) ||
      (key.startsWith('concrefer-qualidade-static-v') && key !== QUALITY_CACHE)
    ).map(key => caches.delete(key)));
    await self.clients.claim();
    if (!upgrading) return;
    // An open module menu must receive the new shell after activation. Views
    // containing forms are left to the existing explicit update action.
    const clients = await self.clients.matchAll({type:'window'});
    for (const client of clients) {
      const url = new URL(client.url);
      if ([ROOT, ROOT + 'index.html'].includes(url.pathname) && !url.searchParams.has('view')) {
        // Navigation fetches wait for activation. Awaiting them here would
        // make activation and navigation wait on each other indefinitely.
        client.navigate(client.url).catch(() => {});
      }
    }
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === ROOT || url.pathname === ROOT + 'index.html') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      if (response.ok && !response.redirected) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(ROOT + 'index.html', copy));
      }
      return response;
    }).catch(() => caches.match(ROOT + 'index.html')));
    return;
  }
  if (url.pathname.startsWith(ROOT + 'laboratorio/cronoanalise') &&
      !url.pathname.includes('/api/')) {
    const page = !/\.(?:js|css|html|png|jpg|svg|woff2?)$/i.test(url.pathname) ||
      url.pathname.endsWith('metodologia-conteudo.html');
    event.respondWith(caches.open(CRONO_CACHE).then(async cache => {
      const fallback = page && !url.pathname.endsWith('metodologia-conteudo.html')
        ? await cache.match(ROOT + 'laboratorio/cronoanalise') : null;
      try {
        const response = await fetch(event.request, {cache:'no-store'});
        if (response.ok && !response.redirected && response.type === 'basic') {
          await cache.put(event.request, response.clone());
          if (page && !url.pathname.endsWith('metodologia-conteudo.html'))
            await cache.put(ROOT + 'laboratorio/cronoanalise', response.clone());
        }
        return response;
      } catch {
        return await cache.match(event.request) || fallback || Response.error();
      }
    }));
    return;
  }
  if (url.pathname.startsWith(ROOT + 'qualidade/') && !url.pathname.includes('/api/')) {
    event.respondWith(caches.open(QUALITY_CACHE).then(async cache => {
      try {
        const response = await fetch(event.request, {cache:'no-store'});
        if (response.ok && !response.redirected && response.type === 'basic') {
          await cache.put(event.request, response.clone());
          if (!/\.[a-z0-9]{2,6}$/i.test(url.pathname))
            await cache.put(ROOT + 'qualidade/', response.clone());
        }
        return response;
      } catch {
        return await cache.match(event.request) ||
          await cache.match(ROOT + 'qualidade/') || Response.error();
      }
    }));
    return;
  }
  // Generated GED CSS previously imported Inter. Revalidate its immutable URL
  // after a shell upgrade; authentication/API requests stay outside this rule.
  if(url.pathname.startsWith(ROOT+'ged/') && url.pathname.endsWith('.css')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  if (!url.pathname.startsWith(ROOT + 'shell/')) return;
  event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
    if (response.ok && !response.redirected && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => await caches.match(event.request) || Response.error()));
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = {}; }
  const url = new URL(data.url || '/unificado/?view=qualidade%2Ftarefas', self.location.origin);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(ROOT))
    url.href = self.location.origin + ROOT;
  event.waitUntil(self.registration.showNotification(String(data.title || 'Tarefas · Concrefer'), {
    body: String(data.body || ''), icon: ROOT + 'assets/img/logo-concrefer.png',
    tag: String(data.tag || ''), data: {url: url.href}
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || self.location.origin + ROOT;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients => {
    const current = clients.find(client => client.url.startsWith(self.location.origin + ROOT));
    if (current) { await current.navigate(url); return current.focus(); }
    return self.clients.openWindow(url);
  }));
});
