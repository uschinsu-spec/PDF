const CACHE='pdf-made-by-nghia-20260916f';
const SHELL=[
 './','./index.html','./manifest.webmanifest',
 './assets/app.css?v=20260916f',
 './assets/app.js?v=20260916f',
 './assets/cutpaste-editor.js?v=20260916f',
 './assets/fontkit-loader.js?v=20260916f',
 './assets/text-editor.js?v=20260916f',
 './assets/advanced-tools.js?v=20260916f',
 './assets/runtime-guard.js?v=20260916f'
];
self.addEventListener('install',e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(CACHE).then(async c=>{
  for(const u of SHELL){try{await c.add(u)}catch(err){console.warn('SW cache skip',u,err)}}
 }));
});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 const isNav=e.request.mode==='navigate';
 e.respondWith((async()=>{
  try{
   const r=await fetch(e.request,{cache:'no-store'});
   if(r&&r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{});}
   return r;
  }catch(err){
   return (await caches.match(e.request)) || (isNav?await caches.match('./index.html'):Response.error());
  }
 })());
});