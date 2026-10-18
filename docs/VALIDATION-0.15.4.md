# Validation UMBRA 0.15.4

Vérifications le 18 octobre 2026 :

- 106 tests unitaires/API réussis, dont la séparation des préférences de stream par compte et serveur, leur persistance, les bornes de volume et l’atténuation.
- Essais à deux clients sur la source et l’exécutable Windows empaqueté, avec capture native d’une fenêtre de test et piste sonore synthétique ajoutée à cette capture. Aucun son du bureau n’est capturé dans cet essai.
- La forme d’onde effectivement reçue baisse à environ un quart de son amplitude au réglage 25 %, puis devient silencieuse avec la sourdine du stream. Le volume du micro du joueur reste indépendant.
- Le son du stream seul ne déclenche pas l’atténuation. Un microphone distant ou le microphone local qui transmet déclenche la baisse réglée ; le niveau initial revient après la conversation. Désactiver l’atténuation restaure immédiatement le niveau pendant la parole.
- Menus au clic droit et au clavier, curseur sous la vidéo, réinitialisation, menu inclus dans l’élément en plein écran, Échap, lecteur réduit natif et arrêt du visionnage vérifiés.
- L’arrêt du visionnage désabonne aussi le son du partage. Le réglage personnel est repris à la nouvelle souscription ; couper le casque coupe également le stream.
- Les essais existants de caméra, plein écran, partage à la demande, partages simultanés et arrêt des médias au déplacement/débranchement passent. Capture animée reçue à environ 30 FPS en local.
- Contrôle visuel du menu gris/noir/jaune ; installeur comparé aux 101 fichiers source embarqués et manifeste de mise à jour signé avec la clé existante.

Les tests utilisent un microphone et une caméra synthétiques et un moteur LiveKit local. L’accélération GPU est désactivée uniquement dans les processus de test pour fiabiliser la caméra synthétique ; elle reste activée dans l’application livrée. Ces essais ne remplacent pas une session en jeu avec les périphériques physiques et les connexions de 40 joueurs.

Mise à jour du client uniquement : l’API reste en version 0.15.1, sans redémarrage du moteur vocal. La candidature SignPath Foundation a été refusée faute de visibilité publique suffisante ; l’installeur reste sans signature Authenticode.
