PWA MEDIATHEQUE DE PORT-DE-BOUC — V5

Fonctionnement :
- Le mois actuel est toujours affiché.
- Le PDF est ouvert directement depuis le site de la médiathèque.
- Aucun ancien PDF n'est conservé par l'application.
- Le mois suivant est préparé automatiquement à partir du format AAAA_MM.pdf.

POINT TECHNIQUE :
Le serveur de la médiathèque ne fournit pas actuellement l'autorisation CORS
nécessaire pour qu'une PWA hébergée ailleurs puisse tester automatiquement
l'existence d'un PDF distant avec JavaScript.

La V5 conserve donc volontairement le mois actuel fonctionnel et le design final.
La détection automatique du mois suivant nécessitera une petite vérification
côté serveur (ou une autorisation CORS du site). Cela n'oblige pas à changer
la gestion des PDF par le webmaster.

Pour tester la PWA, elle doit être hébergée en HTTPS.
