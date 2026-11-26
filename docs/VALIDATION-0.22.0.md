# HEXAGONE 0.22.0 — 26 novembre 2026

Version cliente uniquement. API de production compatible 0.20.0 ; aucun redémarrage de l’API ou de LiveKit.

## Changements

- Overlay : placement libre temporairement interactif, glisser-déposer, validation ou annulation, position relative à l’écran et bornée à sa zone utile. Les anciens réglages des quatre coins restent valables. Le mode normal conserve le fond transparent et laisse passer les clics.
- Membres : colonne à droite accessible à tous, ouvrable et fermable. Présence sur l’app distincte du vocal ; grades permanents classés Admin, Commandant, Squad leader, Membre. Hors ligne et présence indisponible distingués. Profils et menu joueur réutilisés ; ouverture et groupes repliés mémorisés par compte et serveur.
- Administration : gestion des membres, permissions et récupération de mot de passe déplacées dans Réglages → Membres. Entrée retirée de la navigation principale, onglet et actions toujours réservés aux admins.
- Le panneau central et ses nœuds restent en place lors de l’ouverture de la colonne. La lecture et le brouillon du chat sont conservés.

## Vérifications

- `npm test` : 166 tests réussis, dont migration et bornage des coordonnées, grades multiples sans doublon, présence inconnue en cas de déconnexion, préférences séparées et stockage indisponible.
- `tests/members-overlay-ui.mjs` sur sources puis sur le binaire empaqueté : trois clients isolés, présence sans vocal et passage hors ligne ; profils accessibles sans droits admin ; administration dans les réglages et accès refusé à un membre ; groupes repliés et ouverture conservés après redémarrage ; mise en page 1120 × 740 sans débordement global ; position de lecture et brouillon du chat conservés.
- Même test : fenêtre native de l’overlay déplacée sur l’écran droit, enregistrement et annulation, redémarrage, retour aux coins, validation sans déplacement en bas de l’écran ; glisser-déposer du rendu testé avec un curseur natif simulé dans le seul processus de test. Retour à une fenêtre transparente, non déplaçable et non focalisable après validation.
- `tests/overlay-ui.mjs` : quatre coins, voix reçue et silence, présence sur fenêtre principale réduite, sourdine, disparition à la déconnexion, amplification de sortie à 300 %, retour micro et sons. Ces essais utilisent un serveur local et des périphériques simulés.
- `tests/team-ui.mjs` : droits admin, grade permanent sans accès vocal supplémentaire, actions sur messages, récupération de mot de passe et ancien mot de passe rejeté.
- `tests/navigation-ui.mjs` sur sources puis binaire empaqueté : positions de lecture du chat et des vocaux, messages, réactions et historique, brouillon, réglages et notifications Windows.
- `tests/operation-voice-ui.mjs` sur binaire empaqueté : trois clients et deux opérations ; radio limitée à l’opération, maintien du vocal principal, classement de l’overlay et salon de briefing, visites et déplacements admin.
- Les fenêtres de test visibles ont utilisé un profil isolé et `UMBRA_TEST_DISPLAY=right`. Aucun test de charge à 40 joueurs ni preuve de fonctionnement au-dessus d’un jeu en plein écran exclusif.
- 125 fichiers source et assets identiques au contenu de l’archive empaquetée ; exécutable natif et sources de licence concordants.
- Manifeste Ed25519, taille et empreinte de l’installeur validés ; le vérificateur réel de la version 0.17 accepte le nouveau manifeste et l’installeur. Identité d’installation, répertoire des données et protocole conservés. Aucune signature Authenticode reconnue n’est revendiquée.
- Page de téléchargement testée sans fenêtre visible sur ordinateur et mobile ; 36 entrées de patchnotes générées et cohérentes. Contrôles des sources publiques et des différences réussis.

## Publication vérifiée

- Téléchargement : https://hexagone.lotus-order.fr/
- Installeur : `HEXAGONE-Setup-0.22.0-win64.exe`, 118602443 octets.
- SHA-256 : `0099118deac9c7e5260bc5d060ba931940e4cf3b491d2b92534efa4744222353`.
- Manifeste signé et début du fichier EXE servis directement sur les routes de mises à jour des deux domaines, sans redirection. Anciennes pages redirigées vers le domaine HEXAGONE ; lien, empreinte et 36 patchnotes vérifiés en HTTPS.
- Flux courant : `/opt/umbra/updates/releases/0.22.0`. API conservée dans `/opt/umbra/releases/0.20.0` ; PID 3029732 identique avant et après ; LiveKit actif.
- Sauvegarde du site avant publication : `/var/backups/umbra/pre-0.22.0-20261126`.
