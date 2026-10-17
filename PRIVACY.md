# Confidentialité

UMBRA est un outil communautaire de communication. Le serveur par défaut est celui de la team ; son adresse peut être changée dans l’application. L’hébergeur de chaque serveur est responsable de ses données et de sa politique de conservation.

## Données et échanges

- À la connexion : pseudo et mot de passe sont transmis au serveur choisi en HTTPS. Le serveur conserve un hachage scrypt du mot de passe.
- Le serveur conserve profils, images de profil/bannières, grades, compositions, opérations, messages, réactions et pièces jointes. Ces informations sont partagées selon les droits et salons accessibles.
- Le vocal transmet le micro aux salons autorisés via LiveKit/WebRTC. Caméra et partage d’écran transmettent aussi les images aux membres du vocal actuel, uniquement après action de l’utilisateur. Les autres membres choisissent le flux à regarder. L’application ne réalise pas d’enregistrement audio ou vidéo. Les tests micro et caméra restent locaux.
- Le serveur reçoit la présence et les états parole/micro/casque afin d’afficher les participants et indicateurs.
- Le service de mise à jour est contacté au lancement et périodiquement pour rechercher une version. Des métadonnées réseau comme l’adresse IP peuvent être visibles par les services contactés.
- Les échanges de fichiers passent par le serveur de la team et sont accessibles selon les permissions du salon.

## Sur le PC

Les modèles d’escouades (sans membres), préférences caméra/audio, volumes individuels et raccourcis sont enregistrés localement. Le hook global ne transmet au rendu que l’état des raccourcis configurés ; il ne conserve pas l’historique des touches ni des clics. La fonction Rester connecté protège la session locale avec le chiffrement Windows via Electron safeStorage. Le mot de passe n’est pas mémorisé par cette fonction.

Les autorisations micro sont demandées pour le vocal ou le test. L’utilisateur peut quitter le vocal, couper son micro/casque et se déconnecter. La caméra s’active par son bouton ou un raccourci configuré. Le partage demande de sélectionner une fenêtre ou un écran à chaque démarrage ; le son complet de Windows peut être partagé sur choix explicite. Les captures s’arrêtent à la sortie ou au changement de vocal.

## Demandes

Pour une suppression de compte ou de données, contacter l’administrateur du serveur utilisé. Pour la team P.H.A.N.T.O.M, passer par le staff de la communauté. Ne pas publier de mot de passe, de token ou de conversation privée dans les issues GitHub.

Cette notice décrit le comportement du code actuel ; elle ne fixe pas à la place de chaque hébergeur une durée de conservation ou une procédure légale.

