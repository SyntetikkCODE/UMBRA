# Validation UMBRA 0.15.2

Vérifications le 18 octobre 2026 :

- 104 tests unitaires/API réussis.
- Onglet Applications affiché par défaut et limité aux fenêtres ; onglet Écran entier limité aux écrans.
- Bouton Partager désactivé avant le choix d’une source ; sélection effacée au changement d’onglet, navigation par touches fléchées et annulation sans capture.
- Essais de médias à deux clients sur l’exécutable empaqueté : vrais pixels d’une fenêtre native de test, caméra synthétique, partages simultanés, réception à la demande et arrêt au déplacement vocal.
- Contrôle visuel du sélecteur avec une fenêtre de test isolée, sans publier de capture d’écran personnelle.
- Installeur comparé aux 99 fichiers source embarqués ; manifeste du canal de mise à jour signé avec la clé existante.

Mise à jour du client uniquement ; L’API reste en version 0.15.1 et le moteur vocal en place est conservé. Les essais synthétiques ne remplacent pas une validation de chaque webcam physique ni une session de 40 joueurs. La signature Authenticode SignPath n’est pas encore acquise.
