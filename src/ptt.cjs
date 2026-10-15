const {uIOhook,UiohookKey}=require('uiohook-napi');
const KEYS=[...Object.keys(UiohookKey).filter(k=>typeof UiohookKey[k]==='number'),...Array.from({length:5},(_,i)=>'Mouse'+(i+1))];
const padAliases={Numpad0:'NumpadInsert',Numpad1:'NumpadEnd',Numpad2:'NumpadArrowDown',Numpad3:'NumpadPageDown',Numpad4:'NumpadArrowLeft',Numpad6:'NumpadArrowRight',Numpad7:'NumpadHome',Numpad8:'NumpadArrowUp',Numpad9:'NumpadPageUp',NumpadDecimal:'NumpadDelete'};
function createPtt(send,hook=uIOhook){
 let running=false,config={primary:'F8',leaders:'F9',broadcast:'F10'},held={primary:false,leaders:false,broadcast:false};
 const change=(e,down,mouse=false)=>{if(!running)return;let changed=false;for(const[k,key]of Object.entries(config)){const matches=mouse?key==='Mouse'+e.button:!key.startsWith('Mouse')&&(UiohookKey[key]===e.keycode||padAliases[key]&&UiohookKey[padAliases[key]]===e.keycode);if(matches&&held[k]!==down){held[k]=down;changed=true;}}if(changed)send({...held});};
 hook.on('keydown',e=>change(e,true));hook.on('keyup',e=>change(e,false));
 hook.on('mousedown',e=>change(e,true,true));hook.on('mouseup',e=>change(e,false,true));
 return {start(next){if(!next||!['primary','leaders','broadcast'].every(k=>KEYS.includes(next[k]))||Object.keys(next).length!==3||new Set(Object.values(next)).size!==3)throw new Error('Choisis trois touches différentes.');config={...next};held={primary:false,leaders:false,broadcast:false};if(!running){hook.start();running=true;}send({...held});},stop(){held={primary:false,leaders:false,broadcast:false};send({...held});if(running){running=false;hook.stop();}},keys:KEYS};
}
module.exports={createPtt};
