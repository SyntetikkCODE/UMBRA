# Validation UMBRA 0.15.0

Contrôles effectués le 17 octobre 2026 :

- 102 tests unitaires/API : permissions, modèles, raccourcis, comptes et fonctionnalités existantes.
- Interface source : création/réutilisation des modèles sans joueurs, conservation après reconnexion, raccourcis clavier/souris et conflits, diagnostic et test caméra local.
- Vocal local à quatre clients : squad, leaders, briefing, annonces, isolation, gain individuel, périphériques, VAD, sons, touches globales et boutons de souris.
- Médias entre deux clients : caméra synthétique, sélection explicite d’une fenêtre native de test et vérification des pixels reçus, deux partages simultanés, réception à la demande, annulation, arrêt au changement de vocal et à la déconnexion.
- Derniers contrôles d’interface et de médias répétés avec l’exécutable empaqueté.
- Installeur comparé aux sources embarquées ; manifeste Ed25519 signé avec la clé de publication existante.

Les comptes et données des essais sont isolés. Les essais vidéo utilisent le rendu logiciel pour contourner un problème de capture synthétique avec le GPU local. Ils ne prouvent pas le fonctionnement de chaque webcam/casque réel, du partage de son système, de Wardogs au premier plan ou de 40 joueurs simultanés. Ces vérifications restent à faire avec l’équipe.

La candidature SignPath est en attente. Cet installeur n’a pas de signature Authenticode ; la signature Ed25519 protège le canal des mises à jour.
