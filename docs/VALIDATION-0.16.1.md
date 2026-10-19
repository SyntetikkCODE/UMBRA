# Validation UMBRA 0.16.1

Vérifications le 19 octobre 2026 :

- Cause confirmée dans le code natif de libuiohook Windows : la touche française ² est capturée comme `Backquote` par le navigateur, mais son code Windows `VK_OEM_7` est traduit en `Quote` par le hook global.
- La correspondance native tient compte du libellé ² mémorisé pour les trois radios et les actions personnalisées. La représentation enregistrée reste compatible avec les préférences existantes ; aucune migration ni suppression de raccourci n’est effectuée. Un Backquote QWERTY conserve sa correspondance habituelle.
- Les conflits entre touches qui aboutissent au même code natif sont refusés avant leur sauvegarde, même hors vocal.
- 114 tests unitaires/API réussis, dont deux nouveaux scénarios couvrant capture, ancien format enregistré, touches QWERTY inchangées, conflits, appui/répétition/relâchement et actions personnalisées.
- Essai Electron à deux clients isolés réussi sur la source puis l’exécutable Windows empaqueté. La capture du formulaire utilise un événement DOM représentatif (`code=Backquote`, `key=²`) ; les appuis suivants passent réellement par Windows (`keybd_event`, VK 222), sans injecter directement les événements du hook.
- UMBRA émetteur est réellement en arrière-plan, sa fenêtre masquée. Maintenir ² déclenche le push-to-talk et un signal audio est effectivement reçu dans l’autre client. Relâcher la touche arrête la transmission ; un appui répété reste sans effet supplémentaire.
- Pour une action personnalisée, ² coupe le micro une seule fois malgré une répétition et un nouvel appui le réactive. La reconstruction du client depuis les préférences mémorisées conserve la bonne correspondance pour la radio et l’action personnalisée.
- Vérification de cohérence des 25 fiches de version (application, site et GitHub) et contrôle de l’arbre public réussis.

Le serveur reste en 0.16.0. Cette correction concerne uniquement les clients Windows et ne nécessite pas d’interrompre les vocaux sur le VPS. L’essai utilise des comptes locaux isolés et un micro synthétique ; aucune donnée ni compte de test n’est ajouté en production.
