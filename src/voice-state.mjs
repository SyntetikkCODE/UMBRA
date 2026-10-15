export function voiceState(value={}){const connected=value?.connected===true,deafened=connected&&value?.deafened===true;return {connected,muted:connected&&(value?.muted===true||deafened),deafened};}
export function voiceIndicator(value={},speaking=false){const s=voiceState(value);return s.deafened?'deafened':s.muted?'muted':speaking?'speaking':'idle';}
