import {validateKeys,SHORTCUT_KEYS} from './shortcut-keys.mjs';
export const SHORTCUT_ACTIONS=[
 ['muteHold','Rendre muet pendant l’appui'],['toggleMute','Activer / désactiver le micro'],
 ['toggleDeafen','Activer / désactiver le son'],['toggleScreen','Démarrer / arrêter le partage d’écran'],
 ['toggleCamera','Activer / désactiver la caméra'],['disconnect','Quitter le vocal'],['openVoiceSettings','Ouvrir les réglages Voix & vidéo']
];
export function validateBindings(keys,bindings=[]){
 validateKeys(keys);
 if(!Array.isArray(bindings)||bindings.length>20)throw new Error('20 raccourcis personnalisés maximum.');
 const used=new Set(Object.values(keys)),ids=new Set();
 for(const b of bindings){
  if(!b||!/^custom_[a-zA-Z0-9-]{1,60}$/.test(b.id)||ids.has(b.id)||!SHORTCUT_ACTIONS.some(([a])=>a===b.action)||!SHORTCUT_KEYS.includes(b.key)||typeof b.label!=='string'||b.label.length>24)throw new Error('Raccourci personnalisé invalide.');
  if(used.has(b.key))throw new Error('Cette touche est déjà utilisée par un autre raccourci.');
  used.add(b.key);ids.add(b.id);
 }
 return bindings.map(({id,action,key,label})=>({id,action,key,label}));
}
// French AZERTY ² is DOM Backquote, but Windows reports VK_OEM_7, which
// libuiohook translates to Quote. Use the saved label so old bindings work too.
const nativeKey=(key,label)=>key==='Backquote'&&label==='²'?'Quote':key;
export function nativeBindings(keys,bindings,labels={}){
 const result={...Object.fromEntries(Object.entries(keys).map(([kind,key])=>[kind,nativeKey(key,labels[kind])])),...Object.fromEntries(validateBindings(keys,bindings).map(b=>[b.id,nativeKey(b.key,b.label)]))};
 if(new Set(Object.values(result)).size!==Object.keys(result).length)throw new Error('Cette touche est déjà utilisée par un autre raccourci.');
 return result;
}
