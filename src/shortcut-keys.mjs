const named=['Backspace','Tab','Enter','CapsLock','Escape','Space','PageUp','PageDown','End','Home','ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Insert','Delete','Semicolon','Equal','Comma','Minus','Period','Slash','Backquote','BracketLeft','Backslash','BracketRight','Quote','Ctrl','CtrlRight','Alt','AltRight','Shift','ShiftRight','Meta','MetaRight','NumLock','ScrollLock','PrintScreen','NumpadMultiply','NumpadAdd','NumpadSubtract','NumpadDecimal','NumpadDivide','NumpadEnter'];
export const SHORTCUT_KEYS=[...named,...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',...'0123456789',...Array.from({length:24},(_,i)=>'F'+(i+1)),...Array.from({length:10},(_,i)=>'Numpad'+i),...Array.from({length:5},(_,i)=>'Mouse'+(i+1))];
const mouseLabels={Mouse1:'Clic gauche',Mouse2:'Clic droit',Mouse3:'Clic molette',Mouse4:'Souris 4 · Précédent',Mouse5:'Souris 5 · Suivant'};
// DOM uses left=0, middle=1, right=2; native libuiohook uses left=1, right=2, middle=3.
export function captureMouse(event){
 const key=({0:'Mouse1',1:'Mouse3',2:'Mouse2',3:'Mouse4',4:'Mouse5'})[event.button];
 return key?{key,label:mouseLabels[key]}:null;
}
const modifiers={ControlLeft:'Ctrl',ControlRight:'CtrlRight',AltLeft:'Alt',AltRight:'AltRight',ShiftLeft:'Shift',ShiftRight:'ShiftRight',MetaLeft:'Meta',MetaRight:'MetaRight'};
export function captureKey(event){
 const code=event.code,key=modifiers[code]||(/^Key[A-Z]$/.test(code)?code.slice(3):/^Digit[0-9]$/.test(code)?code.slice(5):code);
 if(!SHORTCUT_KEYS.includes(key))return null;
 const label=key.startsWith('Numpad')?'Pavé '+(event.key==='Enter'?'Entrée':event.key):modifiers[code]?prettyKey(key):event.key===' '? 'Espace':event.key.length===1?event.key.toUpperCase():prettyKey(key);
 return {key,label:label.slice(0,24)};
}
export function validateKeys(keys){
 if(!keys||Object.keys(keys).length!==3||!['primary','leaders','broadcast'].every(k=>SHORTCUT_KEYS.includes(keys[k]))||new Set(Object.values(keys)).size!==3)throw new Error('Choisis trois touches différentes.');
 return keys;
}
export const prettyKey=key=>mouseLabels[key]||({Space:'Espace',Enter:'Entrée',Escape:'Échap',Backspace:'Retour arrière',Delete:'Suppr',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',CtrlRight:'Ctrl droit',AltRight:'Alt droit',Shift:'Maj',ShiftRight:'Maj droite',Meta:'Windows',MetaRight:'Windows droit'})[key]||key;
