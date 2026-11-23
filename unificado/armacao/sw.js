const CACHE='armacao-shell-v20261030-2';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([
  new Request('/unificado/armacao/',{cache:'reload'}),
  new Request('/unificado/armacao/manifest.webmanifest',{cache:'reload'})
])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys
  .filter(key=>key.startsWith('armacao-shell-v')&&key!==CACHE)
  .map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/unificado/armacao/api/')||!url.pathname.startsWith('/unificado/armacao/'))return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok&&!response.redirected&&response.type==='basic'){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
    }
    return response;
  }).catch(async()=>await caches.match(event.request)||Response.error()));
});
