const C='jido-f7acbc9d39';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
const TILES='jido-tiles-1';
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.hostname==='server.arcgisonline.com'){
    // 한 번 본 위성사진 조각은 폰에 두고 다음엔 바로 꺼낸다(전파 약한 바다에서도 본 곳은 뜸)
    e.respondWith(caches.open(TILES).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
      if(r.ok){c.put(e.request,r.clone());if(Math.random()<0.02)c.keys().then(k=>{if(k.length>4000)k.slice(0,k.length-3000).forEach(x=>c.delete(x))})}
      return r}))));
    return;
  }
  if(u.origin!==location.origin)return;
  // 앱 파일은 늘 서버에서 새로 확인(브라우저가 10분 묵은 걸 주지 않게) · 안 되면 저장해둔 것
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
