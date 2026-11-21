# Validation HEXAGONE 0.18.1

Vérifications le 21 novembre 2026, après le signalement d’un échec vocal immédiat sans message. Le mainteneur a confirmé que le choix manuel des périphériques Windows par défaut rétablit la connexion dans son installation.

- Reproduction avec un identifiant de microphone devenu invalide : Chromium renvoie `OverconstrainedError`, contrainte `deviceId`, avec un message vide. La version 0.18.0 affichait alors une notification et un état d’erreur vides.
- Récupération ciblée : nouveau choix du micro Windows uniquement si le périphérique sélectionné est introuvable. Aucun changement automatique en cas d’autorisation refusée, micro occupé ou contrainte de traitement incompatible. La sortie mémorisée est vérifiée après ouverture du micro ; un identifiant absent revient à la sortie Windows. Les choix récupérés sont enregistrés localement, les volumes et traitements restent inchangés.
- 126 tests unitaires/API réussis, dont cinq cas de récupération de périphériques et d’erreurs sans texte. Contrôle des sources publiques et génération cohérente des 29 notes de version.
- Test Electron de connexion avec API et LiveKit locaux, profil isolé et capture audio simulée : état Connexion dès la demande d’accès ; refus de salon encore affiché après disparition de la notification ; autorisation micro refusée sans texte expliquée ; récupération et sauvegarde des deux identifiants invalides ; connexion des canaux avec piste micro active. Aucun compte ou message fictif en production, aucun test d’appui natif global. Fenêtre vérifiée sur l’écran droit.
- Test séparé de la version empaquetée 0.18.0 contre le vrai point d’entrée LiveKit : connexion réussie à un salon diagnostic temporaire, sans autorisation de publier de l’audio ou de la vidéo. Salon et jeton temporaire supprimés après le test. Ce test isole la disponibilité réseau du problème de périphérique.

Le site officiel passe sur `https://hexagone.lotus-order.fr/`, avec un enregistrement A OVH vers le même VPS et un certificat Let’s Encrypt à renouvellement automatique. Les pages de l’ancien sous-domaine redirigent vers le nouveau ; ses chemins de téléchargement et de manifeste signé restent servis directement pour les clients existants qui refusent les redirections de mise à jour.

L’API et LiveKit restent en place, sans redémarrage et sans migration des données. Sauvegarde avant changement du domaine : `/var/backups/umbra/pre-hexagone-domain-20261121/`. Les identifiants techniques UMBRA de stockage, d’installation et de protocole restent inchangés.
