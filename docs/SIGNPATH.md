# Activation SignPath

## Ce qui est préparé

La copie source est indépendante de l’installation locale. `build.yml` compile une version de revue non signée. `signpath.yml` prépare une vraie chaîne de signature pendant la fabrication NSIS, sans déployer sur le VPS. Les actions sont épinglées à des commits.

La candidature et la configuration XML sont des propositions. Elles ne prouvent ni l’acceptation du projet, ni le bon fonctionnement d’un compte SignPath réel. La référence des icônes est décrite sans masquer l’absence de licence tierce dans ASSET-REVIEW.md.

## Ordre d’activation

1. Relire le contenu exporté et régler le point des icônes/licences.
2. Publier le dépôt public sous SyntetikkCODE/UMBRA, avec les sources et politiques. La clé publique de mise à jour est publiable ; aucune clé privée ne l’est.
3. Activer la double authentification GitHub et créer une protection de main. Activer le signalement privé des vulnérabilités.
4. Remplir la candidature officielle avec le texte de SIGNPATH-APPLICATION.md et ton email de contact. Ne pas cocher un engagement de licence tant que les ressources ne le respectent pas.
5. Attendre la réponse de la fondation ; préciser que la même personne tient actuellement les rôles de mainteneur et d’approbateur.
6. Après acceptation, installer leur GitHub App uniquement sur ce dépôt et configurer le projet `umbra`, la politique `release-signing` avec approbation humaine et l’artefact `umbra-pe-v1`. Valider avec SignPath l’usage du paramètre `version` dans les restrictions PE.
7. Créer l’environnement GitHub `signpath` avec approbateur et branche main seulement. Ajouter le secret `SIGNPATH_API_TOKEN`. Ajouter les variables `SIGNPATH_ORGANIZATION_ID` et `SIGNPATH_PUBLISHER` avec le CN exact du certificat, puis `SIGNPATH_READY=true` uniquement lorsque tout est opérationnel.
8. Lancer manuellement Sign UMBRA with SignPath depuis main. Chaque demande attend l’approbation ; les trois exécutables sont signés avant leur intégration dans le conteneur suivant.
9. Contrôler les signatures et télécharger les artefacts signés pour une recette locale d’installation/mise à jour. Conserver la clé Ed25519 de publication hors GitHub ; signer le manifeste final localement avant toute publication sur le site.

Pour reproduire sans service de signature : `npm ci`, `npm run build:vendors`, `npm test`, `npm run test:ui`, `npm run dist:unsigned`. Pour la recette vocale locale, installer le moteur LiveKit de validation dans runtime, avec ses contrôles d’intégrité ; ne jamais faire ces tests sur les comptes de production.

## Points à valider sur le premier vrai build

- Prise en compte par SignPath des artefacts envoyés par `@actions/artifact` et origine du job GitHub.
- Production des métadonnées UMBRA et produit/version : Electron ajoute `.0` au ProductVersion de l’app, tandis que NSIS utilise la version simple.
- Signature valide et horodatée de UMBRA.exe et du désinstalleur dans l’installeur final.
- Identité exacte de la fondation dans les vérifications de l’updater, sans casser l’arrivée depuis 0.14.2.
- Aucun fichier signé ne doit être modifié avant recalcul du blockmap et des hashes finaux.

Le mode SignPath refuse une machine locale, une branche différente, un fork, un événement pull_request, un binaire tiers ou une signature incorrecte. Les tests locaux de ces refus utilisent des doubles, pas un faux certificat de production.

Sources : [conditions](https://signpath.org/terms.html), [intégration GitHub](https://docs.signpath.io/trusted-build-systems/github), [action officielle](https://github.com/SignPath/github-action-submit-signing-request), [configuration des artefacts](https://docs.signpath.io/artifact-configuration/reference).
