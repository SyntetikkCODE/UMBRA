# UMBRA — Wardogs Companion

Application Windows pour organiser les escouades et les communications de la team P.H.A.N.T.O.M : squads, opérations, briefing, vocal squad/leaders, salons textuels et profils.

Projet communautaire indépendant. Aucune affiliation ou validation par l’éditeur du jeu n’est revendiquée.

## État de cette copie

Cette version 0.14.3 prépare une candidature à SignPath Foundation. **Aucune signature Authenticode SignPath ni acceptation du projet n’est encore acquise.** La production reste sur la version 0.14.2. Les builds non signés de CI sont destinés à la revue, pas à remplacer le téléchargement officiel.

L’origine et le statut des icônes de rôle sont décrits dans [ASSET-REVIEW.md](docs/ASSET-REVIEW.md). Ce point doit être clarifié avant de présenter l’ensemble des ressources comme couvertes par une licence open source.

## Fonctionnalités

- Escouades, postes prédéfinis ou personnalisés, chefs et adjoints.
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
npm start
```

Le mode de préparation hors ligne se lance en définissant `UMBRA_OFFLINE=1`. Pour une autre communauté, définir `UMBRA_SERVER_URL` ou changer le serveur dans les réglages. `UMBRA_DATA_DIR` permet d’isoler les données de développement. Ne pas utiliser de vrais comptes de joueurs dans les tests.

## Fabriquer un installeur de revue

```powershell
npm run dist:unsigned
```

Résultat : `dist/UMBRA-Setup-0.14.3-win64.exe`. Les licences sont générées dans le projet, sans dépendre du dossier personnel d’un développeur. Le paquet contient les sources correspondantes LGPL du hook et les notices des dépendances.

## Signature et mises à jour

[Code signing policy](CODE_SIGNING_POLICY.md) décrit les responsables, le workflow et les étapes d’activation. [SIGNPATH.md](docs/SIGNPATH.md) explique la candidature et les variables à fournir après acceptation.

La signature Authenticode et la signature Ed25519 des annonces de mise à jour sont distinctes. La clé privée de publication existante ne doit pas être envoyée au dépôt ou aux logs GitHub. Les sources ne contiennent que sa clé publique. Aucun workflow ne déploie sur le VPS ni ne publie automatiquement les fichiers sur le site.

## Comptes et hébergement

Le serveur Node et le moteur LiveKit sont des services distincts. `server/run.mjs` lit une configuration privée à l’emplacement indiqué par `UMBRA_SERVER_CONFIG`. Ne jamais versionner ce fichier, les bases de comptes ou les clés LiveKit. Le serveur applique les droits avec l’identité de session ; les mots de passe sont hachés avec scrypt.

## Licence et contributions

Le code propre à UMBRA est proposé sous [MIT](LICENSE), avec les exceptions et licences tierces décrites dans [THIRD_PARTY.md](THIRD_PARTY.md). Les marques tierces ne sont pas concédées. Ouvrir une proposition de modification avant les changements importants ; les demandes de signature de production nécessitent une approbation humaine.

[Confidentialité](PRIVACY.md) · [Sécurité](SECURITY.md) · [Dossier de candidature](docs/SIGNPATH-APPLICATION.md)

