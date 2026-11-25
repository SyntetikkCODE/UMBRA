# Validation HEXAGONE 0.21.3

25 novembre 2026. Client 0.21.3 ; API de production conservée en 0.20.0.

- 161 tests unitaires/API réussis. Le nouveau modèle de liste distingue les présences dans un briefing, dans une squad et dans l’accueil. Les participants sont regroupés par opération, sans doublons, même lorsque leur métadonnée de squad d’origine est conservée par le serveur.
- Un salon « Briefing · nom de l’opération » apparaît au-dessus des squads de l’opération lorsqu’au moins une squad est rassemblée. Il disparaît lorsque le dernier rassemblement est terminé. Une opération terminée ou une référence de squad périmée ne crée pas de salon fictif.
- Le compteur et les joueurs sous le salon suivent les présences vocales réelles. Les joueurs rassemblés ne restent pas affichés dans leurs vocaux de squad. Le repère de connexion est porté par le briefing, avec une mention Connecté, plutôt que par la squad d’origine.
- Clic direct pour les membres des squads rassemblées et les admins. Un membre d’une autre squad, même inscrite dans l’opération, ne reçoit pas d’accès supplémentaire. L’admin utilise la visite existante d’une squad rassemblée ; le client ne crée ni jeton ni salle serveur supplémentaire.
- Le déplacement admin d’un joueur dans le briefing réutilise le déplacement vers une squad rassemblée. La destination est revérifiée au dépôt ; une fin de briefing ne doit pas envoyer le joueur vers une ancienne destination mémorisée dans le DOM.

Le scénario Windows à trois clients couvre le rassemblement depuis le bouton réel, une conférence commune à deux squads, la parole sous le bon salon, la connexion par clic, le passage par l’accueil, le déplacement admin par glisser-déposer, une visite admin sans sa propre squad et la disparition du salon avec retour des joueurs à leurs vocaux. Les actions successives attendent la fin du changement de salle précédent.

Une liste volontairement réduite et défilée vérifie que le briefing devient visible quand l’utilisateur y arrive, sans changer le défilement de la page centrale. Ce déplacement de la liste n’est déclenché que par l’entrée dans un briefing différent, pas par les synchronisations ordinaires.

Les profils, comptes et pistes audio sont isolés ; les fenêtres sont sur l’écran droit. Aucune création de compte de démonstration en production ni injection de touches natives. La fonctionnalité réutilise le serveur actuel, sans redémarrer l’API ou LiveKit. Les diagnostics de réception et de relance audio de la version précédente sont conservés ; aucune nouvelle conclusion n’est tirée sur le signalement de faibles volumes.

Le scénario Briefing et les contrôles Opérations/vocal et Outils de squad sont également réussis sur l’exécutable final. Les 123 fichiers source/ressources empaquetés correspondent à la copie contrôlée. Les pages de téléchargement et les 35 entrées d’historique sont contrôlées en formats ordinateur et mobile ; le vérificateur de mise à jour 0.17 accepte le manifeste et l’installeur.

Installeur : `HEXAGONE-Setup-0.21.3-win64.exe`, 118 597 596 octets. SHA-256 : `339609c082e7edb51cb7ead809e6513b3a37ff7552e8b22ede629a45c212851c`.
