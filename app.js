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
  if(!("Notification" in window)||!("serviceWorker" in navigator)||!window.firebaseConfig){
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
    firebase.initializeApp(window.firebaseConfig);
    const auth=firebase.auth();
    const db=firebase.firestore();
    const messaging=firebase.messaging();
    const registration=await navigator.serviceWorker.ready;
    const user=(await auth.signInAnonymously()).user;
    button.addEventListener("click",async()=>{
      button.disabled=true;
      status.textContent="Demande d’autorisation…";
      try{
        const permission=await Notification.requestPermission();
        if(permission!=="granted"){
          status.textContent="Notifications non activées.";
          button.disabled=false;
          return;
        }
        const token=await messaging.getToken({vapidKey:window.FIREBASE_VAPID_KEY,serviceWorkerRegistration:registration});
        if(!token)throw new Error("Token FCM absent");
        await db.collection("subscribers").doc(user.uid).set({
          token:token,
          updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
          userAgent:navigator.userAgent
        });
        localStorage.setItem("notificationsEnabled","1");
        status.textContent="Notifications activées. Vous serez prévenu lors de la publication d’un nouveau programme.";
        button.textContent="Notifications activées ✓";
      }catch(e){
        console.error(e);
        status.textContent="Impossible d’activer les notifications pour le moment.";
        button.disabled=false;
      }
    });
    if(localStorage.getItem("notificationsEnabled")==="1"){
      status.textContent="Notifications activées. Vous serez prévenu lors de la publication d’un nouveau programme.";
      button.textContent="Notifications activées ✓";
    }
    messaging.onTokenRefresh?.(async()=>{
      try{
        const token=await messaging.getToken({vapidKey:window.FIREBASE_VAPID_KEY,serviceWorkerRegistration:registration});
        await db.collection("subscribers").doc(user.uid).set({token,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),userAgent:navigator.userAgent});
      }catch(e){console.warn("Actualisation du token FCM impossible",e)}
    });
  }catch(e){
    console.error(e);
    status.textContent="Le service de notifications n’est pas encore disponible.";
  }
}

load();
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",async()=>{
  try{await navigator.serviceWorker.register("./service-worker.js");await setupNotifications()}catch(e){console.error(e)}
});