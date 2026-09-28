const CACHE = 'fittrack-pro-v17-nutrition-2';
const APP_ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png',
  './js/core/runtime.js','./js/core/storage.js','./js/data/catalog.js','./js/exercises/library.js','./js/analytics/metrics.js','./js/workout/engine.js','./js/workout/intelligence.js','./js/nutrition/engine.js','./js/wearables/protocol.js'
];
const SHELL_RE = /^(?:text\/html|text\/css|application\/javascript|application\/json)$/i;
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fittrack-pro-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  const isNavigation=event.request.mode==='navigate';
  const isShellAsset=SHELL_RE.test(event.request.destination==='script'?'application/javascript':event.request.destination==='style'?'text/css':event.request.destination==='document'?'text/html':'');
  if(isNavigation||isShellAsset){event.respondWith(fetch(event.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(event.request,r.clone())).catch(()=>{});return r;}).catch(()=>caches.match(event.request).then(c=>c||caches.match('./index.html'))));return;}
  event.respondWith(caches.match(event.request).then(c=>c||fetch(event.request).then(r=>{if(r.ok)caches.open(CACHE).then(x=>x.put(event.request,r.clone())).catch(()=>{});return r;}).catch(()=>caches.match('./index.html'))));
});
