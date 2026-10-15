export function participantVolume(value){if(!Number.isFinite(value)||value<0||value>300)throw new Error('Choisis un volume entre 0 et 300 %.');return Math.round(value);}
export class ParticipantVolumes {
 constructor(storage=globalThis.localStorage){this.storage=storage;this.scope=null;this.values=new Map();}
 load(scope){if(scope===this.scope)return false;this.scope=scope;this.values.clear();try{const saved=JSON.parse(this.storage.getItem('umbra-player-volumes:'+scope)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [id,value]of Object.entries(saved).slice(0,300)){if(id&&id.length<=80&&Number.isFinite(value)&&value>=0&&value<=300)this.values.set(id,Math.round(value));}}catch{}return true;}
 get(id){return this.values.get(id)??100;}
 set(id,value){if(typeof id!=='string'||!id||id.length>80)throw new Error('Joueur invalide.');const volume=participantVolume(value);if(volume===100)this.values.delete(id);else this.values.set(id,volume);this.storage.setItem('umbra-player-volumes:'+this.scope,JSON.stringify(Object.fromEntries(this.values)));return volume;}
}
// The destination stream keeps ordinary audio elements and their selected Windows sink.
export function receivedAudioGraph(context,track){const source=context.createMediaStreamSource(new MediaStream([track])),gain=context.createGain(),destination=context.createMediaStreamDestination();source.connect(gain);gain.connect(destination);return {source,gain,stream:destination.stream,close(){source.disconnect();gain.disconnect();destination.stream.getTracks().forEach(t=>t.stop());}};}
