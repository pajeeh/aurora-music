const CACHE='aurora-shell-v7';
const APP_SHELL=['./','./offline.html','./manifest.webmanifest','./aurora-icon.svg','./aurora-icon-192.png','./aurora-icon-512.png','./aurora-maskable-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith('aurora-')&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});

async function cacheResponse(request,response){
  if(response.ok&&response.type==='basic'){
    const cache=await caches.open(CACHE);
    await cache.put(request,response.clone());
  }
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request)
      .then(response=>cacheResponse('./',response))
      .catch(async()=>await caches.match('./')||await caches.match('./offline.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>{
    const network=fetch(request).then(response=>cacheResponse(request,response)).catch(()=>cached);
    return cached||network;
  }));
});
