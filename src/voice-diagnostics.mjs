export function diagnosticChecks({shared,online,enabled,connecting,roomState,quality,muted,deafened,micLive,testing,detected,peakDb,threshold,inputVolume,outputVolume,micAvailable=true,outputAvailable=true,error=''}){
 return [
  ['Serveur de la team',!shared?'warn':online?'ok':'bad',!shared?'Mode hors ligne : choisis le serveur de la team.':online?'Connexion au serveur établie.':'Serveur inaccessible : vérifie ta connexion Internet.'],
  ['Connexion vocale',connecting?'warn':roomState==='connected'?'ok':enabled?'bad':'warn',connecting?'Connexion ou reconnexion en cours…':roomState==='connected'?'Connecté au salon vocal.':'Rejoins un vocal pour vérifier le réseau audio.'],
  ['Qualité du réseau',quality==='poor'||quality==='lost'?'bad':quality==='excellent'||quality==='good'?'ok':'warn',quality==='poor'||quality==='lost'?'Connexion instable : rapproche-toi du Wi-Fi ou utilise un câble.':quality==='excellent'?'Excellente':quality==='good'?'Bonne':'Mesure disponible une fois connecté.'],
  ['Microphone',!micAvailable||inputVolume===0?'bad':micLive?'ok':'warn',!micAvailable?'Microphone sélectionné débranché ou indisponible.':inputVolume===0?'Volume d’entrée à zéro.':micLive?'Microphone ouvert et piste active.':'Lance le test du micro pour vérifier la capture.'],
  ['Transmission',muted||deafened||testing?'warn':'ok',deafened?'Casque coupé : ton micro est aussi coupé.':muted?'Ton micro est coupé.':testing?'Test local actif : aucun son transmis à la team.':'Micro autorisé · selon ton mode vocal et la gate.'],
  ['Détection de voix',detected?'ok':'warn',detected?'Voix détectée.':Number.isFinite(peakDb)&&peakDb<threshold?'Signal sous la gate : baisse le seuil si ta voix est coupée.':'Parle normalement pour vérifier la jauge du micro.'],
  ['Sortie audio',!outputAvailable||outputVolume===0?'bad':deafened?'warn':'ok',!outputAvailable?'Sortie sélectionnée indisponible.':outputVolume===0?'Volume de sortie à zéro.':deafened?'Son désactivé.':'Utilise « Tester le son » pour vérifier ton casque.'],
  ...(error?[['Dernière erreur','bad',error]]:[])
 ];
}
