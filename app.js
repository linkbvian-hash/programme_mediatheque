const BASE_URL="https://www.mediatheque-portdebouc.com/userfiles/file/Fichiers_adultes/Programmes/";
const MONTHS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function makeProgram(date){
  const year=date.getFullYear(), month=date.getMonth()+1;
  return {
    label:`${MONTHS[month-1]} ${year}`,
    url:`${BASE_URL}${year}_${String(month).padStart(2,"0")}.pdf`
  };
}

// Le mois actuel est toujours affiché.
const now=new Date();
const current=makeProgram(now);
document.getElementById("currentTitle").textContent=current.label;
document.getElementById("currentLink").href=current.url;

// IMPORTANT : un navigateur ne peut pas déterminer de façon fiable, depuis
// une PWA hébergée sur un autre domaine, si un PDF existe sans autorisation
// CORS du serveur. On prépare donc l'URL du mois suivant ici. La détection
// automatique sera branchée côté serveur dans la prochaine étape, sans
// modifier le fonctionnement du reste de l'application.
const next=makeProgram(new Date(now.getFullYear(),now.getMonth()+1,1));

// Pour le test, laisse false. Une fois le contrôle serveur disponible,
// cette valeur sera pilotée automatiquement.
const NEXT_PROGRAM_AVAILABLE=false;

if(NEXT_PROGRAM_AVAILABLE){
  document.getElementById("nextCard").hidden=false;
  document.getElementById("nextTitle").textContent=next.label;
  document.getElementById("nextLink").href=next.url;
}

if("serviceWorker" in navigator && location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}
