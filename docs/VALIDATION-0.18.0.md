# Validation HEXAGONE 0.18.0

Vérifications le 21 novembre 2026. Cette version adapte l’identité UMBRA à la nouvelle structure HEXAGONE.

- 121 tests unitaires/API existants réussis, contrôle des sources publiques et cohérence des 28 fiches de version.
- Logo original fourni par le mainteneur conservé dans `assets/hexagone-source.png`. Les versions PNG et ICO utilisent le même dessin, recadré sur son contenu visible et redimensionné. Aucune recoloration ni reconstruction des lettres. Le script `scripts/build-brand-assets.py` permet de les régénérer avec Pillow.
- Nom HEXAGONE dans l’app, la connexion, les réglages, le téléchargement, les notes et les métadonnées de l’exécutable. Palette gris/noir, bleu pour les actions et rouge pour les mentions/alertes. Les anciens contours jaunes d’escouades sont affichés en bleu sans réécrire les données stockées.
- Test de continuité réel depuis l’archive 0.17.0, puis lancement de la source 0.18.0 et de l’exécutable distribué avec le même profil isolé : session chiffrée mémorisée, identifiant, joueurs, escouade, volumes, écoute par oreille, raccourcis et préférences Chromium conservés. La sauvegarde d’un réglage et la consultation des notes fonctionnent après le changement de nom. Les comptes de test restent hors production.
- Les fenêtres de ces tests sont positionnées sur l’écran à droite avant leur premier affichage ; leur géométrie est vérifiée. Elles s’ouvrent sans activation explicite. Aucun test de touches globales ni de capture du bureau de l’utilisateur n’est exécuté pour cette adaptation visuelle.
- Captures de connexion, escouades et réglages inspectées. Le site est contrôlé dans un navigateur sans fenêtre, à 1440, 390 et 320 pixels de largeur : nouveau logo, bouton bleu, lien EXE HEXAGONE et 28 notes, sans débordement horizontal.
- Le véritable vérificateur extrait de l’archive UMBRA 0.17.0 accepte le manifeste signé 0.18.0, le nouveau nom du fichier et l’empreinte SHA-512 de l’installeur final. La clé de mise à jour, l’App ID Windows/NSIS, le marqueur d’installation, le répertoire de données et l’origine Chromium restent compatibles.
- 101 fichiers de code/ressources embarqués comparés aux sources, passerelle audio native et source C# distribuée identiques. Nom, description et version du fichier Windows : HEXAGONE, 0.18.0.0. Le manifeste Ed25519 est vérifié ; cela ne constitue pas une signature Authenticode.

L’installeur NSIS n’est pas exécuté sur l’installation personnelle active de l’utilisateur. La reprise des données est testée dans un profil distinct, et l’identité d’installation ainsi que les règles de renommage des raccourcis du modèle NSIS sont contrôlées. Les échanges vocaux/vidéo et la charge à 40 joueurs ne sont pas retestés pour ce changement de présentation.

L’API de production reste en 0.17.0 : le nouveau client conserve les formats et couleurs acceptés par ce serveur. Cette publication du client et du site ne nécessite pas de redémarrer les services API/LiveKit.

Pour reproduire le test de continuité : conserver `app.asar` et `app.asar.unpacked` de la version 0.17.0 dans `artifacts/brand-legacy/resources/`, puis lancer `npm run test:branding`. Un écran situé à droite et une session Windows permettant le chiffrement local sont requis. `UMBRA_TEST_EXE` permet de viser l’exécutable empaqueté.
