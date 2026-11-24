# Validation HEXAGONE 0.21.2

24 novembre 2026. Client 0.21.2 ; API de production conservée en 0.20.0.

Le signalement décrit un auditeur qui entend deux joueurs très faiblement alors que les autres auditeurs les entendent normalement. Ce cas précis n’est pas reproduit dans les essais locaux et n’est pas déclaré résolu par cette livraison.

- 157 tests unitaires/API réussis. Les nouveaux cas couvrent la sélection de sortie avant lecture, la remontée d’un refus de sortie ou de lecture, la reprise après réussite, l’absence de lecture sur une ancienne piste désabonnée, les mesures réseau par différence et la suppression des secrets/identifiants du diagnostic copiable.
- Comparaison de quatre clients Windows isolés : deux émetteurs et deux auditeurs, dans Squad, Leaders et Opération. Les niveaux reçus par les deux auditeurs sont comparés ; le gain général et le volume individuel sont exercés ensemble. Le réglage 300 % × 300 % produit un gain de graphe de 9, mesuré sur les flux traités. Une reconnexion conserve les préférences.
- Échec de sortie simulé sur la lecture d’un seul joueur : l’erreur apparaît dans l’interface. Clic droit → Relancer son audio reconstruit ses graphes reçus sans quitter les salons ni recréer le graphe de l’autre joueur. Les volumes et le canal courant sont conservés. Les relances simultanées d’un même joueur partagent une seule tâche.
- Le diagnostic est déclenché explicitement dans Voix & vidéo. Il relève les niveaux reçus et traités, les gains, le routage par oreille, l’état de lecture, les problèmes de sortie et les compteurs RTP disponibles. Il n’enregistre aucun son et n’envoie aucun rapport automatiquement. Les identités techniques, périphériques techniques, SDP, candidats ICE, adresses et jetons ne sont pas copiés.
- Les mesures s’arrêtent avant le contrôle Windows, les traitements du pilote et le casque. Les sorties des essais sont rendues silencieuses pour laisser travailler l’utilisateur ; aucune affirmation de restitution physique sur le matériel de l’auditeur concerné n’est faite.

Pour poursuivre le diagnostic réel : relever un rapport chez l’auditeur touché et un rapport chez un auditeur qui entend normalement, pendant que les mêmes joueurs parlent sur le même canal. La comparaison sert à distinguer un signal reçu faible d’une atténuation dans le client ou d’un traitement après l’application.

Les fenêtres et profils de test sont isolés sur l’écran droit. Aucun compte fictif n’est créé en production. Aucun redémarrage de l’API ou de LiveKit n’est nécessaire pour cette livraison.

Les scénarios Réception, Opérations/vocal, Overlay/gain et Connexion/périphériques sont réussis sur l’exécutable empaqueté. Le flux de quatre clients confirme le maintien des autres participants pendant une relance ciblée ; les reprises de salle et de périphérique, l’overlay et le gain de sortie à 300 % restent fonctionnels. Les 122 fichiers source/ressources empaquetés correspondent à la copie contrôlée. Le vérificateur de mise à jour 0.17 accepte le nouveau manifeste et l’installeur.

Installeur : `HEXAGONE-Setup-0.21.2-win64.exe`, 118 596 357 octets. SHA-256 : `ac5822d44bd7d034db5ec03cc54a6f5974614d06545603a4c9d1b843b59b808c`.
