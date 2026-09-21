const CACHE_NAME="carlog-v0.14";
const APP_FILES=["./","./index.html","./style.css?v=0.14","./app.js?v=0.14","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url); if(u.origin!==self.location.origin)return;
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok)caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone()));return r;}).catch(async()=>{const c=await caches.match(e.request);if(c)return c;if(e.request.mode==="navigate")return caches.match("./index.html");return new Response("Offline",{status:503});}));
});