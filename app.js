const BASE="https://www.mediatheque-portdebouc.com/userfiles/file/Fichiers_adultes/Programmes/";
const M=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function local(d){return{year:d.getFullYear(),month:d.getMonth()+1,label:`${M[d.getMonth()]} ${d.getFullYear()}`,url:`${BASE}${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,"0")}.pdf`}}

function render(p){
  let c=p.current;
  document.getElementById("currentTitle").textContent=c.label;
  document.getElementById("currentMonthNumber").textContent=String(c.month).padStart(2,"0");
  let l=document.getElementById("currentLink"),d=document.getElementById("currentDescription");
  l.href=c.url;l.hidden=!c.available;
  d.textContent=c.available?"Le programme actuellement proposé à la médiathèque.":"Le programme de ce mois n'est pas encore disponible.";
  let n=p.next,card=document.getElementById("nextCard");
  card.hidden=!(n&&n.available);
  if(n&&n.available){
    document.getElementById("nextTitle").textContent=n.label;
    document.getElementById("nextLink").href=n.url;
    document.getElementById("nextMonthNumber").textContent=String(n.month).padStart(2,"0")
  }
}

async function load(){
  try{
    let r=await fetch("./program.json?ts="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw 0;
    render(await r.json())
  }catch(e){
    let d=new Date(),n=new Date(d.getFullYear(),d.getMonth()+1,1);
    render({current:{...local(d),available:true},next:{...local(n),available:false}})
  }
}

async function setupNotifications(){
  const button=document.getElementById("notificationButton");
  const status=document.getElementById("notificationStatus");
  if(!button||!status)return;

  if(!window.firebaseConfig||!("Notification"in window)||!("serviceWorker"in navigator)){
    button.hidden=true;
    status.textContent="Les notifications ne sont pas disponibles sur ce navigateur.";
    return;
  }

  if(Notification.permission==="denied"){
    button.disabled=true;
    status.textContent="Les notifications sont bloquées dans les réglages du navigateur.";
    return;
  }

  try{
    if(!firebase.apps.length)firebase.initializeApp(window.firebaseConfig);

    const auth=firebase.auth();
    const db=firebase.firestore();

    if(!firebase.messaging.isSupported()){
      throw new Error("FCM_NOT_SUPPORTED");
    }

    const messaging=firebase.messaging();

    // Force the browser to check for the newest service worker.
    const registration=await navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"});
    await registration.update();

    const user=(await auth.signInAnonymously()).user;

    button.addEventListener("click",async()=>{
      button.disabled=true;
      status.textContent="Activation des notifications…";

      try{
        const permission=await Notification.requestPermission();

        if(permission!=="granted"){
          status.textContent="Notifications non activées.";
          button.disabled=false;
          return;
        }

        const token=await messaging.getToken({
          vapidKey:window.FIREBASE_VAPID_KEY,
          serviceWorkerRegistration:registration
        });

        if(!token)throw new Error("FCM_TOKEN_EMPTY");

        await db.collection("subscribers").doc(user.uid).set({
          token,
          updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
          userAgent:navigator.userAgent
        });

        localStorage.setItem("notificationsEnabled","1");
        status.textContent="Notifications activées ✓";
        button.textContent="Notifications activées ✓";
      }catch(e){
        console.error("[Notifications]",e);
        status.textContent="Échec : "+(e.code||e.message||"erreur inconnue");
        button.disabled=false;
      }
    });

    messaging.onMessage(payload=>{
      const n=payload.notification||{};
      if(Notification.permission==="granted"){
        new Notification(n.title||"Médiathèque Boris Vian",{
          body:n.body||"Un nouveau programme est disponible.",
          icon:"./assets/logo-boris-vian.png"
        });
      }
    });

    if(localStorage.getItem("notificationsEnabled")==="1"){
      status.textContent="Notifications activées ✓";
      button.textContent="Notifications activées ✓";
    }
  }catch(e){
    console.error("[Notifications setup]",e);
    status.textContent="Échec : "+(e.code||e.message||"configuration impossible");
  }
}

load();
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",()=>setupNotifications());