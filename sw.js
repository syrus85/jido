const C='jido-11eccfec68';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
const TILES='jido-s2-2025-11-22';
// 옛 Esri 위성 조각 저장분(jido-tiles-1)도 여기서 지워진다 — 센티넬로 바꾼 뒤엔 남겨 두면 안 됨
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.includes('/tiles/')){
    // 센티넬 위성 조각(우리가 만든 것) — 한 번 본 건 폰에 두고 다음엔 바로 꺼낸다(전파 약한 바다에서도 본 곳은 뜸)
    e.respondWith(caches.open(TILES).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}))));
    return;
  }
  // 앱 파일은 늘 서버에서 새로 확인(브라우저가 10분 묵은 걸 주지 않게) · 안 되면 저장해둔 것
  // 새 판을 먼저 찾되 3초 안에 안 오면 저장해 둔 판으로 연다 (신호 약한 바다에서 하얀 화면으로 오래 기다리지 않게)
  e.respondWith((async()=>{
    const net=fetch(e.request,{cache:'no-cache'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r});
    const hit=await caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'));
    if(!hit)return net;
    return Promise.race([net.catch(()=>hit),new Promise(res=>setTimeout(()=>res(hit),3000))]);
  })());
});
