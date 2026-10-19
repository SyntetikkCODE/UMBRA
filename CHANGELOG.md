# Notes de mise à jour UMBRA

Historique reconstitué à partir des archives et des versions conservées. Les prototypes 0.1 à 0.3.1 sont regroupés ; les versions suivantes sont détaillées séparément. Les notes décrivent les changements de chaque époque, pas uniquement le fonctionnement actuel.

[Application et téléchargement](https://umbra.lotus-order.fr/) · [Historique sur le site](https://umbra.lotus-order.fr/patchnotes/)

## 0.16.2 — Son de l’application partagée (2026-10-19)

- Quand tu partages une fenêtre avec le son, seul le programme sélectionné est transmis. Plusieurs fenêtres d’un même programme peuvent partager leur son. Sur une version de Windows incompatible, le partage de fenêtre reste disponible sans son.
- Le partage d’un écran entier conserve l’option de transmettre tous les sons du PC. La case audio est remise à zéro au changement d’onglet pour confirmer le nouveau périmètre.
- Un son de confirmation est maintenant joué pour le diffuseur après le lancement réussi du partage, en plus de l’alerte reçue par les autres joueurs. Les réglages de notification et de sortie audio sont respectés.
- La capture du son de l’application s’arrête avec le partage, le changement de vocal, la fermeture de la fenêtre ou de l’app. Si elle échoue, aucun remplacement par le son global du PC n’est effectué.
- Déplacements administrateurs : l’arrivée d’un joueur ne recrée plus le salon de destination et laisse les membres présents connectés. Une reconnexion automatique restaure aussi un vocal coupé sans demander de cliquer sur Connexion.

## 0.16.1 — Raccourci ² sur clavier français (2026-10-19)

- Correction de la touche ² des claviers AZERTY français : son code Windows est maintenant correctement reconnu pour le push-to-talk et les actions personnalisées, y compris en arrière-plan.
- Les raccourcis ² déjà enregistrés sont pris en charge grâce au libellé mémorisé, sans devoir les recréer. Les appuis répétés ne déclenchent pas plusieurs bascules et le relâchement arrête la transmission.
- Les conflits entre touches aboutissant au même raccourci Windows sont refusés avant l’enregistrement. Aucun redémarrage du serveur vocal n’est nécessaire pour cette mise à jour.

## 0.16.0 — Partages, déplacements vocaux et notifications (2026-10-19)

- Dans Mon escouade, Prendre ce poste permet de rejoindre une place libre sans quitter sa squad. Le poste précédent est libéré ; les responsabilités de chef ou d’adjoint et le vocal sont conservés.
- Les rôles sont renommés : Infanterie devient Entry Frag, Sniper devient Recon et l’ancien Recon devient Breacher, avec une nouvelle icône. Les affectations et spécialités existantes restent associées au bon rôle.
- Le diffuseur choisit 480p, 720p, 1080p ou Source avant de lancer son partage. Le choix est mémorisé sur le PC ; Source conserve la définition native et chaque profil cible 30 FPS selon les ressources disponibles.
- Le son du partage utilise un profil stéréo à 128 kbit/s, sans traitement de microphone ni coupure d’encodage dans les silences, à la place du profil voix à 24 kbit/s. Les volumes et l’atténuation personnels restent réglables.
- Une notification sonore annonce le démarrage du partage d’un autre joueur dans le salon vocal actuel, même sans regarder son stream. Les réglages de sons, la sortie et le casque coupé sont respectés.
- Les admins peuvent glisser un joueur connecté depuis la liste sous son vocal vers une autre escouade ou l’accueil. Le déplacement vocal conserve son escouade et son poste ; une escouade en briefing conduit à ce briefing.
- Un message textuel ordinaire non lu affiche un petit point blanc, sans son. Une mention personnelle ou @everyone affiche un compteur jaune et joue un son pour ses destinataires, selon leurs réglages de notifications.

## 0.15.5 — Tout l’historique des mises à jour (2026-10-18)

- Nouvelle rubrique Notes de mise à jour dans les réglages, accessible à tous les membres et lisible hors connexion.
- Historique publié sur le site UMBRA et dans le fichier CHANGELOG du dépôt GitHub.
- Une source commune maintient les trois présentations cohérentes ; les anciennes versions restent consultables en dépliant leur fiche.

## 0.15.4 — Volume et options du partage d’écran (2026-10-18)

- Volume du stream de 0 à 200 % et sourdine sous la vidéo, indépendants du volume du micro du joueur.
- Menu au clic droit : arrêter de regarder, rendre muet, ouvrir le lecteur réduit, passer en plein écran et réinitialiser le son.
- Atténuation du stream pendant les conversations, avec interrupteur et force réglable. Le son du partage seul ne déclenche pas la baisse.
- Préférences d’écoute mémorisées sur le PC, par joueur, compte et serveur. Menu utilisable au clavier et en plein écran.

## 0.15.3 — Plein écran, lecteur réduit et fluidité (2026-10-18)

- Correction du plein écran et remplacement du bouton Agrandir par des icônes Plein écran et Lecteur réduit.
- Commandes micro, casque, caméra, partage et déconnexion accessibles en plein écran ; sortie par le bouton ou Échap.
- Lecteur réduit flottant conservé pendant la navigation et fermé à l’arrêt du flux ou au changement de vocal.
- Partage d’écran ciblant 720p à 30 FPS au lieu de 15, avec un débit adapté et priorité à la fluidité. La cadence réelle dépend du PC et du réseau.

## 0.15.2 — Choisir une application ou un écran entier (2026-10-18)

- Sélecteur de partage séparé en Applications et Écran entier, avec Applications affiché par défaut.
- Choix explicite d’une source avant de partager. Changer d’onglet efface la sélection précédente ; annuler ne démarre aucune capture.
- Navigation du sélecteur au clavier et vignettes des sources disponibles.

## 0.15.1 — Rejoindre les vocaux en un clic (2026-10-17)

- Un clic gauche sur son salon vocal connecte directement, sans ouvrir un panneau puis cliquer sur Connexion.
- Les admins peuvent visiter tous les vocaux d’escouades en un clic sans occuper de poste.
- L’accueil vocal est ouvert à toute la team, y compris aux membres déjà inscrits dans une escouade.
- Cliquer une escouade sans droit vocal ouvre uniquement ses informations ; l’appartenance à sa squad est conservée lors d’une visite à l’accueil.

## 0.15.0 — Caméra, partage d’écran et outils de préparation (2026-10-17)

- Caméra et partage d’écran dans le panneau vocal en bas à gauche. Chaque membre du salon peut publier son propre flux.
- Indicateurs caméra et En direct près du pseudo ; les autres joueurs choisissent le flux qu’ils souhaitent regarder.
- Arrêt des captures à la déconnexion ou au déplacement vers un autre vocal.
- Diagnostic vocal simple dans Voix & vidéo : connexion, périphériques, qualité réseau, niveau et état de transmission.
- Modèles d’escouades réutilisables avec postes, icône et couleur, sans copier les membres.
- Raccourcis personnalisés : choisir une action puis une touche clavier ou souris pour le micro, le son, la caméra, le partage, les réglages ou la déconnexion.

## 0.14.2 — Photos de profil et activité vocale

- La photo de profil apparaît dans un cercle agrandi à gauche du pseudo.
- Le contour gris devient jaune pendant la parole, sans halo ni remplissage qui masque la photo.
- Micro ou casque coupé restent visibles dans un badge sur le portrait. Sans photo, une silhouette neutre est utilisée.
- Affichage harmonisé dans les escouades, Mon escouade, les briefings, l’accueil et les listes de membres.

## 0.14.1 — Raccourcis avec les boutons de souris

- Les raccourcis vocaux acceptent clic gauche, clic droit, clic molette, Souris 4 et Souris 5.
- Capture du bouton choisi dans les réglages, validation avec Entrée ou Enregistrer, annulation avec Échap et refus des doublons.
- Maintien et relâchement suivis lorsque l’app est en arrière-plan. La transmission est suspendue pendant la modification du raccourci.

## 0.14.0 — Messages, états vocaux et administration

- Les autres joueurs voient un micro barré en cas de mute et un casque barré lorsque le son est coupé ; le casque est prioritaire.
- Clic droit sur un message : Répondre, Ajouter une réaction, Copier le texte et Épingler ; les admins peuvent aussi supprimer le message après confirmation.
- Réponses liées au message d’origine, compteurs de réactions et liste des messages épinglés du salon.
- Page Membres réservée aux admins. Ajout du grade permanent Squad leader, attribué par les admins et purement visuel.
- Récupération du mot de passe avec un code temporaire à usage unique créé par un admin. Les anciennes sessions sont invalidées après réinitialisation.

## 0.13.1 — Suppression des salons textuels

- Option Supprimer le salon dans le menu au clic droit, réservée aux admins et aux salons personnalisés.
- Confirmation avant suppression des messages et fichiers. Les salons automatiques général, annonces et escouades sont protégés.
- Suppression synchronisée chez les autres membres et retour vers un salon accessible si nécessaire.

## 0.13.0 — P.H.A.N.T.O.M, alertes et connexion mémorisée

- Nom de la team P.H.A.N.T.O.M affiché en haut à droite, y compris sur la connexion.
- Bouton jaune Mise à jour disponible lorsqu’une nouvelle version paraît pendant que l’app est ouverte. L’installation et le redémarrage demandent une action du joueur.
- Case Rester connecté : session mémorisée sur ce PC pendant 30 jours, protégée par Windows, sans enregistrer le mot de passe.
- Déconnexion et connexion sur un autre PC révoquent la session précédente.

## 0.12.1 — Nouvelles icônes de spécialités

- Symboles redessinés à partir de la référence Wardogs fournie pour Infanterie, Medic, Builders, Pilote et Driver.
- Recon conserve les jumelles ; Sniper reprend la mire ; Launcher reçoit un lance-roquettes ; Libre conserve son cercle en pointillés.
- Icônes utilisées dans le choix des spécialités, les profils et à gauche des pseudos, sans changer les rôles déjà enregistrés.

## 0.12.0 — Volume individuel et édition directe du profil

- Clic droit sur un joueur pour ouvrir son profil ou régler son volume personnel de 0 à 300 %.
- Volume individuel mémorisé sur le PC, par compte et serveur, avec réinitialisation à 100 %. Les autres joueurs ne sont pas affectés.
- Photo et bannière modifiables en cliquant directement dessus ; retrait des boutons supplémentaires sous les images.
- Les sélecteurs de couleurs du dégradé affichent la couleur choisie et son code.

## 0.11.0 — Gestion des salons, test micro et profils enrichis

- Menu au clic droit sur un salon : ouvrir, modifier, dupliquer et épingler en haut. Les droits de modification restent réservés aux admins.
- Renommage, description et réglages des salons personnalisés ; duplication sans reprendre les messages ni les fichiers.
- Les curseurs des réglages ne reconstruisent plus la page : le défilement et le focus sont conservés.
- Retour audio du test micro dans la sortie sélectionnée. La transmission à la team est suspendue pendant le test.
- Bannière, dégradé à deux couleurs, spécialités principale et secondaire dans le profil. L’icône de spécialité principale précède le pseudo.

## 0.10.0 — Navigation directe et chat enrichi

- Retrait des boutons Vocaux / Textuels : cliquer un salon textuel ouvre la discussion, cliquer une escouade ouvre son panneau vocal.
- Correction de l’animation latérale rejouée à chaque changement de page ; affichage des joueurs connectés sous les vocaux.
- Mentions @pseudo et @everyone, pings et indicateurs de messages non lus.
- Mise en forme des messages : gras, italique, souligné, barré, titres, listes, citations, spoilers et blocs de code avec coloration.
- Sélecteur d’émojis et envoi d’images, GIF et vidéos par bouton +, glisser-déposer ou collage d’image. Les médias suivent les droits du salon.

## 0.9.0 — Salons textuels et nouvelle présentation en essai

- Ajout du général, des annonces, du texte privé d’escouade et de salons personnalisés créés par les admins.
- Messages synchronisés et conservés sur le serveur. Entrée envoie ; Maj + Entrée ajoute une ligne.
- Présentation latérale des escouades et salons après avoir rejoint une squad, avec animation courte et respect de la réduction des animations.
- Option dans Réglages → Application pour désactiver la présentation expérimentale sans supprimer les messages.
- Réglage manuel de la gate directement sur la jauge du microphone, par clic, glissement ou clavier.

## 0.8.1 — Meilleure détection des microphones faibles

- Seuil de détection par défaut abaissé d’environ −35 dB à −48 dB pour éviter de devoir parler trop fort.
- Sensibilité réglable de −65 à −20 dB, avec niveau mesuré et indications Voix détectée / Sous le seuil.
- Détection effectuée après le volume d’entrée : augmenter le gain aide aussi à ouvrir la gate. Les modifications s’appliquent au vocal déjà connecté.

## 0.8.0 — Réglages organisés et raccourcis capturés

- Réglages répartis entre Voix & vidéo, Raccourcis, Mon compte et Application.
- Choix d’une touche en appuyant dessus puis Entrée, avec annulation et détection des doublons, à la place d’une liste déroulante.
- Profils audio Standard, Studio et Personnalisé pour la réduction du bruit, l’écho et le gain automatique. Krisp n’est pas intégré.
- Cartes d’escouades : Rejoindre avec choix d’un poste libre, ou Connexion qui devient Connectée une fois en vocal.
- Sons de départ du vocal, marque UMBRA jaune et nom Wardogs Companion harmonisés sur le site et dans l’app.

## 0.7.0 — Escouades et panneau vocal plus clairs

- Création et gestion des opérations depuis Escouades ; retrait de la page Opérations séparée et de son affichage dans Mon escouade.
- Liste unique des membres de la squad et des admins visiteurs, sans compter les visiteurs dans l’effectif.
- Accueil vocal visible et connexion à son vocal depuis la carte de squad.
- Panneau vocal enrichi : connexion, destination de parole, activité et états micro/casque.
- Choix d’une icône et d’une couleur discrète pour chaque escouade.

## 0.6.0 — Installeur Windows et mises à jour automatiques

- Remplacement du téléchargement portable par un installeur Windows .exe, avec raccourcis Bureau et menu Démarrer.
- Recherche et installation des mises à jour au lancement, avec conservation des comptes et réglages.
- Vérification manuelle et installation au choix depuis les réglages ; une erreur de mise à jour laisse démarrer la version actuelle.
- Contrôle de l’intégrité des mises à jour par un manifeste signé. Cette protection est distincte d’une signature Windows reconnue de l’installeur.

## 0.5.0 — Périphériques, volumes et notifications vocales

- Choix d’un microphone précis et du casque ou des haut-parleurs ; actualisation des périphériques et retour au défaut Windows en cas de débranchement.
- Réglages des volumes d’entrée, de sortie, de squad, de leaders et des notifications.
- Choix entre détection de voix et push-to-talk pour la squad et le briefing ; leaders et annonces restent en push-to-talk.
- Sons de confirmation de connexion, d’arrivée d’un membre et de déplacement entre squads ou briefing.

## 0.4.0 — Comptes partagés et véritable vocal de team

- Organisation synchronisée entre les joueurs : comptes de la team, escouades et opérations hébergés sur un serveur partagé.
- Vocal de squad ou briefing, réseau leaders et annonces du commandement, avec accès selon les responsabilités.
- Raccourcis vocaux globaux pour communiquer lorsque le jeu est au premier plan.
- Les chefs peuvent rassembler les membres connectés dans le briefing d’une opération puis les ramener dans leur vocal.
- Présence et activité vocale réelles, visites admin sans occuper de poste, inscription avec le code de la team.

## 0.1 à 0.3.1 — Premiers prototypes et organisation locale

- Premier prototype Windows d’organisation des escouades et de leurs postes, avec préparation des réseaux squad, leaders et commandement.
- Refonte sobre noir, gris et jaune ; police Inter et icônes Lucide embarquées.
- Création de comptes locaux et guide de première ouverture. Retrait des profils et effectifs de démonstration.
- Postes prédéfinis à la création et à la modification : Infanterie, Medic, Pilote, Builders, Recon, Sniper, Driver, Launcher, Libre et Autre.
- Opérations avec description, type, serveur et horaire ; inscriptions des squads, regroupement des cartes sous leur opération et correction du passage d’une opération à une autre.
- Profils avec photo et description, indicateurs d’activité et présentation simplifiée des membres et postes.
- Ces prototypes conservent l’organisation sur le PC : le vocal partagé et la synchronisation entre joueurs arrivent en 0.4.0.
