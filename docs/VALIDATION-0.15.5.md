# Validation UMBRA 0.15.5

Vérifications le 18 octobre 2026 :

- Historique de 23 fiches : prototypes 0.1 à 0.3.1 explicitement regroupés, puis chaque version conservée de 0.4.0 à 0.15.5. Les dates anciennes non confirmées ne sont pas inventées. Provenance documentée dans `HISTORY-SOURCES.md`.
- Source commune pour les notes embarquées, le CHANGELOG GitHub et la page web statique. Vérification de cohérence des fichiers générés et refus de construction si la version du paquet ne possède pas son entrée.
- 106 tests unitaires/API réussis.
- Parcours Electron sur la source et l’exécutable Windows empaqueté : connexion avec compte local isolé, nouvel onglet des réglages, version installée, 23 entrées, dépliage des anciennes versions au clavier et à la souris, lecture hors connexion et absence de mutation des comptes, escouades ou réglages.
- Contrôle visuel de l’application en fenêtre compacte, du site sur ordinateur et mobile. Correction d’une rotation des titres héritée du style de la FAQ du site.
- Site servi localement avec une politique sans JavaScript : navigation depuis la page de téléchargement, contenu identique à celui de l’app et absence de débordement horizontal sur mobile, y compris dans la navigation d’accueil.
- Installeur comparé aux 103 fichiers source embarqués ; manifeste du canal de mise à jour signé avec la clé UMBRA existante.

Cette version ajoute un historique et sa navigation ; aucun traitement vocal ni service serveur n’est modifié. L’API reste en 0.15.1, sans redémarrage du vocal. L’installeur n’a toujours pas de signature Authenticode reconnue.
