export const DEFAULT_STREAM_AUDIO=Object.freeze({volume:100,muted:false,attenuation:true,strength:50});
export function streamAudio(value={}){
 const number=(key,max)=>Number.isFinite(value[key])&&value[key]>=0&&value[key]<=max?Math.round(value[key]):DEFAULT_STREAM_AUDIO[key];
 return {volume:number('volume',200),muted:typeof value.muted==='boolean'?value.muted:false,attenuation:typeof value.attenuation==='boolean'?value.attenuation:true,strength:number('strength',100)};
}
export function streamGain(preferences,speaking=false){const p=streamAudio(preferences);return p.muted?0:p.volume/100*(speaking&&p.attenuation?1-p.strength/100:1);}
export class StreamAudioPreferences{
 constructor(storage=globalThis.localStorage){this.storage=storage;this.scope=null;this.values=new Map();}
 load(scope){if(scope===this.scope)return false;this.scope=scope;this.values.clear();try{const saved=JSON.parse(this.storage.getItem('umbra-stream-audio:'+scope)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [id,value]of Object.entries(saved).slice(0,300))if(id&&id.length<=80&&value&&typeof value==='object')this.values.set(id,streamAudio(value));}catch{}return true;}
 get(id){return {...(this.values.get(id)||DEFAULT_STREAM_AUDIO)};}
 set(id,patch){if(typeof id!=='string'||!id||id.length>80)throw new Error('Partage invalide.');const next=streamAudio({...this.get(id),...patch});this.values.set(id,next);this.storage.setItem('umbra-stream-audio:'+this.scope,JSON.stringify(Object.fromEntries(this.values)));return {...next};}
}
