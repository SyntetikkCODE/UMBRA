# UMBRA — Wardogs Companion

Application Windows pour organiser les escouades et les communications de la team P.H.A.N.T.O.M : squads, opérations, briefing, vocal squad/leaders, salons textuels et profils.

Projet communautaire indépendant. Aucune affiliation ou validation par l’éditeur du jeu n’est revendiquée.

## État de cette copie

La version 0.16.1 corrige les raccourcis ² sur clavier français, y compris ceux déjà mémorisés et les actions personnalisées. Le serveur reste en 0.16.0. La version 0.16.0 ajoute le changement de poste dans sa squad, les noms Entry Frag / Recon / Breacher, quatre qualités de partage et un son stéréo à 128 kbit/s. La 0.15.5 ajoute les notes de mise à jour sur le site, GitHub et dans les réglages hors connexion. La 0.15.4 ajoute un volume indépendant du partage d’écran, un menu au clic droit et une atténuation réglable du stream pendant les conversations. Elle conserve le plein écran, le lecteur réduit et le partage ciblant 30 FPS. Le sélecteur sépare les applications et les écrans entiers dans le sélecteur de partage. Elle conserve la connexion par clic sur les vocaux, l’accueil ouvert à tous et les ajouts 0.15.0 : diagnostic vocal, caméra et partage d’écran à la demande, modèles d’escouades et raccourcis personnalisés. La candidature SignPath Foundation a été refusée faute de visibilité publique suffisante. **Aucune signature Authenticode SignPath n’est acquise.** Les builds de CI non signés sont destinés à la revue ; le téléchargement officiel reste sur le site.

L’origine et le statut des icônes de rôle sont décrits dans [ASSET-REVIEW.md](docs/ASSET-REVIEW.md). Ce point doit être clarifié avant de présenter l’ensemble des ressources comme couvertes par une licence open source.

## Notes de mise à jour

[Historique complet depuis les premiers prototypes](CHANGELOG.md) · [Version sur le site](https://umbra.lotus-order.fr/patchnotes/). Dans l’application : **Réglages → Notes de mise à jour**, même hors connexion.

Les notes se maintiennent dans `src/release-notes.mjs`. `npm run build:notes` régénère le CHANGELOG GitHub et la page statique `site/patchnotes/` ; `npm run check:notes` vérifie leur cohérence. Chaque nouvelle version doit posséder son entrée avant la construction.

## Fonctionnalités

- Escouades, postes prédéfinis ou personnalisés, chefs et adjoints.
- Modèles de composition locaux par compte et serveur, sans copier les joueurs.
- Caméra et partage de fenêtre/écran, indicateurs En direct et réception à la demande dans le vocal actuel.
- Diagnostic vocal local et raccourcis personnalisés (maintenir pour mute, micro, son, caméra, partage, départ, réglages).
- Opérations, rassemblement en briefing et retour au vocal de squad.
- Voix avec micro/sortie, niveaux, gate, détection et push-to-talk clavier/souris en arrière-plan.
- Salons textuels, Markdown, pièces jointes, réponses, réactions et épingles.
- Profils personnalisés, portraits et contours d’activité vocale.
- Droits vérifiés par le serveur et comptes sans utilisateurs de démonstration.

## Développer sur Windows

Node.js 24 et les outils C++ Windows sont nécessaires si les bindings natifs doivent être reconstruits.

```powershell
npm ci
npm run build:vendors
npm test
npm run test:ui
npm run test:companion
npm start
```

Le mode de préparation hors ligne se lance en définissant `UMBRA_OFFLINE=1`. Pour une autre communauté, définir `UMBRA_SERVER_URL` ou changer le serveur dans les réglages. `UMBRA_DATA_DIR` permet d’isoler les données de développement. Ne pas utiliser de vrais comptes de joueurs dans les tests.

## Vérifications voix et vidéo

Les tests de vocal et de médias utilisent un moteur LiveKit local séparé : définir `UMBRA_LIVEKIT_EXE` avec le chemin de son exécutable, puis lancer `npm run test:voice` et `npm run test:media` séparément. Aucun compte de production n’est créé.

Le test médias utilise une caméra et un micro générés, capture une fenêtre de test native explicitement choisie et vérifie les images reçues entre deux clients. `UMBRA_FAKE_MEDIA=1` permet un deuxième passage avec les périphériques Chromium synthétiques. Les essais vidéo désactivent le GPU uniquement pour leurs processus, à cause d’un échec de capture synthétique observé avec le rendu accéléré local. Les vrais périphériques, Wardogs au premier plan et la charge à 40 joueurs restent à vérifier avec l’équipe.

## Fabriquer un installeur de revue

```powershell
npm run dist:unsigned
```

Résultat : `dist/UMBRA-Setup-0.16.1-win64.exe`. Les licences sont générées dans le projet, sans dépendre du dossier personnel d’un développeur. Le paquet contient les sources correspondantes LGPL du hook et les notices des dépendances.

## Signature et mises à jour

[Code signing policy](CODE_SIGNING_POLICY.md) décrit les responsables, le workflow et les étapes d’activation. [SIGNPATH.md](docs/SIGNPATH.md) explique la candidature et les variables à fournir après acceptation.

La signature Authenticode et la signature Ed25519 des annonces de mise à jour sont distinctes. La clé privée de publication existante ne doit pas être envoyée au dépôt ou aux logs GitHub. Les sources ne contiennent que sa clé publique. Aucun workflow ne déploie sur le VPS ni ne publie automatiquement les fichiers sur le site.

## Comptes et hébergement

Le serveur Node et le moteur LiveKit sont des services distincts. `server/run.mjs` lit une configuration privée à l’emplacement indiqué par `UMBRA_SERVER_CONFIG`. Ne jamais versionner ce fichier, les bases de comptes ou les clés LiveKit. Le serveur applique les droits avec l’identité de session ; les mots de passe sont hachés avec scrypt.

## Licence et contributions

Le code propre à UMBRA est proposé sous [MIT](LICENSE), avec les exceptions et licences tierces décrites dans [THIRD_PARTY.md](THIRD_PARTY.md). Les marques tierces ne sont pas concédées. Ouvrir une proposition de modification avant les changements importants ; les demandes de signature de production nécessitent une approbation humaine.

[Confidentialité](PRIVACY.md) · [Sécurité](SECURITY.md) · [Dossier de candidature](docs/SIGNPATH-APPLICATION.md)


## Recette média isolée

`npm run test:media` démarre deux clients et une API de validation séparée. Fournir le moteur LiveKit Windows via `UMBRA_LIVEKIT_EXE` (ou runtime/livekit-server.exe). La caméra est synthétique ; le partage capture une fenêtre de mire créée par le test. Aucun compte réel n’est utilisé. Les vraies webcams, le partage du son Windows et la charge à 40 joueurs doivent aussi être vérifiés avec la team.

Les clés de rôles enregistrées restent stables : `Infanterie` s’affiche Entry Frag, `Sniper` s’affiche Recon et `Recon` s’affiche Breacher. Cette présentation préserve les anciennes affectations, profils et modèles sans migration ambiguë entre les deux Recon. Les postes personnalisés conservent leur nom.

La 0.16.0 ajoute aussi le signal de début de partage dans le vocal actuel, le déplacement vocal administrateur par glisser-déposer et des notifications textuelles séparées : point blanc silencieux pour un message ordinaire, compteur jaune et son pour les mentions reçues.
