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

const CACHE="mediatheque-pwa-v20";
const FILES=[
  "./",
  "./index.html",
  "./install.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/logo-boris-vian.png",
  "./assets/logo-boris-vian-icon-96.png",
  "./assets/logo-boris-vian-icon-512.svg"
];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);

  if(url.origin!==location.origin)return;
  if(url.pathname.endsWith("/program.json"))return;

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
