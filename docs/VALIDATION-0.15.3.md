# Validation UMBRA 0.15.3

Vérifications le 18 octobre 2026 :

- 105 tests unitaires/API réussis ; permission de plein écran limitée à l’application de confiance.
- Essais à deux clients sur la source puis sur l’exécutable Windows empaqueté : entrée et sortie du plein écran, Échap, micro, casque, caméra, ouverture/annulation du sélecteur et déconnexion depuis les commandes du lecteur.
- Une actualisation des données du profil conserve le lecteur en plein écran. Les commandes de caméra et de partage conservent le flux d’un autre joueur déjà regardé.
- Lecteur réduit natif testé depuis le plein écran, conservé pendant la navigation puis fermé explicitement, à la fin du flux ou au déplacement vers un briefing.
- Capture native de la même fenêtre animée : environ 15,0 FPS reçues sur l’ancien exécutable 0.15.2, puis 30,0 FPS sur la source et 30,1 FPS sur l’exécutable 0.15.3 (comptage des images décodées pendant cinq secondes).
- Caméra synthétique, choix des applications/écrans, annulation sans capture, réception à la demande, partages simultanés et arrêt des médias à la déconnexion vérifiés.
- Contrôle visuel de la barre en plein écran ; installeur comparé aux 99 fichiers source embarqués ; manifeste du canal de mise à jour signé avec la clé existante.

Les clients de test utilisent une caméra et un microphone synthétiques, une véritable fenêtre native de test et une instance LiveKit locale. L’accélération GPU est désactivée uniquement dans ces processus de test pour fiabiliser la caméra synthétique ; elle reste activée dans l’application livrée. Ces mesures ne garantissent pas 30 FPS dans chaque jeu, sur chaque PC ou connexion, ni le comportement avec 40 participants.

Mise à jour du client uniquement : l’API reste en version 0.15.1 et le moteur vocal en place est conservé. La signature Authenticode SignPath n’est pas encore acquise.
