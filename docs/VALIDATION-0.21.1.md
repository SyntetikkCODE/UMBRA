# Validation HEXAGONE 0.21.1

24 novembre 2026. Client 0.21.1 ; API de production conservée en 0.20.0.

- 152 tests unitaires/API réussis, dont le calcul des patchs manqués, le tri numérique des versions, l’exclusion des archives et des versions futures, l’absence de répétition, la séparation par compte et serveur et le comportement en cas de retour à une version plus ancienne.
- Une nouvelle inscription termine son guide avant la présentation de l’overlay et ne reçoit pas l’archive complète des anciens patchs. Les comptes existants sans historique de lancement reçoivent uniquement le patch installé : les anciens clients ne permettent pas de reconstituer leur dernière version lancée.
- Essais Windows isolés avec redémarrages réels : une seule version manquée, trois versions manquées, aucun changement, reprise de session mémorisée et passage entre deux comptes. Les patchs déjà présentés et l’annonce de l’overlay ne reviennent pas au redémarrage suivant.
- La présentation de l’overlay apparaît une fois, indépendamment de la fenêtre des patchs. Continuer, la croix ou Échap permettent de fermer chaque fenêtre. La seconde attend la fermeture de la première. Le guide de première ouverture passe avant les annonces.
- Le bouton de découverte ouvre la catégorie Voix & vidéo, fait défiler jusqu’à Overlay vocal et place le focus sur son activation. Il conserve aussi bien un overlay désactivé qu’un overlay déjà activé par le joueur.
- Fenêtres centrées, focus contenu dans le dialogue et notes longues défilantes à 1100 × 740. Le contenu des patchs est partagé avec l’archive des réglages et du site ; les identifiants HTML de la fenêtre sont distincts de ceux de l’archive.
- Les scénarios existants disposent d’une fermeture explicite des annonces de première ouverture. Aucun contournement de ces fenêtres n’est ajouté au code de production pour les tests.

Les tests utilisent des profils locaux séparés sur l’écran droit, sans comptes fictifs en production ni injection de touches natives. Aucune modification de compte, de réglage vocal ou de session sur le VPS n’est nécessaire. Le serveur API et LiveKit ne sont pas redémarrés pour cette livraison.

Les scénarios de démarrage, de session/mise à jour et de lecture de l’archive sont également réussis sur le véritable exécutable empaqueté. Les 120 fichiers source/ressources correspondent à la copie contrôlée. Le vérificateur 0.17 accepte le manifeste et l’installeur ; le site est contrôlé aux formats ordinateur et mobile avec 33 entrées d’historique.

Installeur : `HEXAGONE-Setup-0.21.1-win64.exe`, 118 592 682 octets. SHA-256 : `48e38f8fb3b76472053cf50ccc8c3306a13f22c5c26cf46001b39a9fb0603918`.
