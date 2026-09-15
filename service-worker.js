importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({"apiKey":"AIzaSyCJJxvObJI51b5Vi6hpZMojWZMqRV_ObTQ","authDomain":"programme-mediatheque.firebaseapp.com","projectId":"programme-mediatheque","storageBucket":"programme-mediatheque.firebasestorage.app","messagingSenderId":"354485728688","appId":"1:354485728688:web:23fb86a48297a71b8d1275"});

const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const notification=payload.notification||{};
  const title=notification.title||"Médiathèque Boris Vian";
  const options={
    body:notification.body||"Un nouveau programme est disponible.",
    icon:"./assets/logo-boris-vian.png",
    badge:"./assets/logo-boris-vian.png",
    data:{url:notification.click_action||self.registration.scope}
  };
  self.registration.showNotification(title,options);
});

const CACHE="mediatheque-pwa-v6-logo";
const FILES=["./","./index.html","./style.css","./app.js","./manifest.json","./assets/logo-boris-vian.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const url=e.notification.data?.url||self.registration.scope;
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list)if("focus"in client){client.navigate(url);return client.focus()}
    return clients.openWindow(url);
  }));
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.endsWith("/program.json"))return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))
});