# Validation HEXAGONE 0.21.0

24 novembre 2026. Client 0.21.0 ; API de production conservée en 0.20.0.

- 145 tests unitaires/API, dont la conservation de l’ordre personnel des textuels par compte/serveur et la priorité des salons épinglés.
- Essai Electron isolé de la présentation : opérations compactes, détails repliables conservés pendant les synchronisations et la navigation, cartes stables après une modification de profil distante, menu de gestion, insertion des textuels par glisser-déposer et ordre conservé après rechargement. Un autre compte garde son propre ordre. La préférence Windows de réduction des animations est respectée.
- Le rapprochement des modèles HTML conserve les nœuds identifiés : escouades, listes vocales, discussions, messages, médias et éléments de l’overlay. Une mise à jour distante conserve les brouillons et les classes d’activité appliquées pendant l’affichage. Les gestionnaires d’upload et de chargement des anciens messages sont remplacés, sans accumuler d’abonnements sur les éléments conservés.
- Scénario de navigation avec historique chargé : ancre de lecture préservée lors d’une synchronisation, d’un nouveau message, d’une réaction et de la récupération des messages anciens ; suivi du bas seulement quand le lecteur y est déjà. Défilement, brouillon, focus et position dans les réglages restent conservés.
- Essai vocal avec trois clients et deux opérations locales : émission réservée à la bonne opération, arrivée et départ de l’opération sans perte du vocal principal, leader extérieur regroupé par salon dans l’overlay. L’activité ne remplace ni la ligne du joueur ni la page ; les compteurs d’opération incluent ses salons de squad et son briefing.
- Les droits et outils 0.20 sont conservés : accès direct au vocal, visiteurs admin, création d’escouades préparées, rangement personnel des vocaux et déplacement admin d’une carte entre opérations. Le bouton connecté permet toujours de quitter le vocal au survol/clic. La déconnexion du compte reste uniquement dans Mon compte.

Les profils et serveurs de test sont isolés ; les fenêtres sont placées sur l’écran droit. Aucun compte de démonstration n’est ajouté en production, aucune touche native n’est injectée. Ces essais ne constituent pas une mesure de charge à 40 joueurs ou un test en match.

La livraison conserve les identifiants d’installation, le répertoire de données, la clé de vérification des mises à jour et les flux directs sur les deux domaines. Le serveur API et LiveKit ne sont pas redémarrés pour cette version. Les notes de mise à jour sont communes à l’application, au site et au changelog GitHub.

L’exécutable final a passé les scénarios `polish-ui`, `navigation-ui`, `operation-voice-ui`, `overlay-ui` et `channels-ui`. Les menus, droits, mentions, images PNG/GIF et médias WebM/MP4 des discussions sont conservés. Les 117 fichiers source/ressources empaquetés correspondent à la copie contrôlée. Le vérificateur de mise à jour 0.17 accepte le nouveau manifeste et l’installeur ; les pages de téléchargement sont contrôlées en formats ordinateur et mobile.

Installeur : `HEXAGONE-Setup-0.21.0-win64.exe`, 118 589 996 octets. SHA-256 : `461c28deb547c9590066460d42fc3aa2052179c46500c223538c30381113feec`.
