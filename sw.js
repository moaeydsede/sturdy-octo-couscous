const CACHE="sweetlab-store-v1";
const ASSETS=["./","./index.html","./styles.css","./app.js","./products.json","./manifest.json","./favicon.svg","./icon-192.png","./icon-512.png","./pay-cod.svg","./pay-visa.svg","./pay-master.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy)).catch(()=>{});return r;}).catch(()=>c))));
