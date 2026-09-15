importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:"AIzaSyCJJxvObJI51b5Vi6hpZMojWZMqRV_ObTQ",
  authDomain:"programme-mediatheque.firebaseapp.com",
  projectId:"programme-mediatheque",
  storageBucket:"programme-mediatheque.firebasestorage.app",
  messagingSenderId:"354485728688",
  appId:"1:354485728688:web:23fb86a48297a71b8d1275"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  const n=payload.notification||{};
  self.registration.showNotification(
    n.title||"Médiathèque Boris Vian",
    {
      body:n.body||"Un nouveau programme est disponible.",
      icon:"./assets/logo-boris-vian.png",
      badge:"./assets/logo-boris-vian.png",
      data:{url:n.click_action||self.registration.scope}
    }
  );
});

const CACHE="mediatheque-pwa-v8";
const FILES=["./","./index.html","./style.css","./app.js","./manifest.json","./assets/logo-boris-vian.png"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(FILES))
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=event.notification.data?.url||event.notification?.data?.link||self.registration.scope;

  event.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
      for(const client of list){
        if("focus"in client){
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);

  if(url.origin!==location.origin)return;
  if(url.pathname.endsWith("/program.json"))return;

  // Network first for the PWA files so installed devices actually update.
  event.respondWith(
    fetch(request).then(response=>{
      if(request.method==="GET"){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }).catch(()=>caches.match(request))
  );
});