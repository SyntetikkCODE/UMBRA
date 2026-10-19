export function participantVolume(value){if(!Number.isFinite(value)||value<0||value>300)throw new Error('Choisis un volume entre 0 et 300 %.');return Math.round(value);}
export class ParticipantVolumes {
 constructor(storage=globalThis.localStorage){this.storage=storage;this.scope=null;this.values=new Map();}
 load(scope){if(scope===this.scope)return false;this.scope=scope;this.values.clear();try{const saved=JSON.parse(this.storage.getItem('umbra-player-volumes:'+scope)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [id,value]of Object.entries(saved).slice(0,300)){if(id&&id.length<=80&&Number.isFinite(value)&&value>=0&&value<=300)this.values.set(id,Math.round(value));}}catch{}return true;}
 get(id){return this.values.get(id)??100;}
 set(id,value){if(typeof id!=='string'||!id||id.length>80)throw new Error('Joueur invalide.');const volume=participantVolume(value);if(volume===100)this.values.delete(id);else this.values.set(id,volume);this.storage.setItem('umbra-player-volumes:'+this.scope,JSON.stringify(Object.fromEntries(this.values)));return volume;}
}
// The destination stream keeps ordinary audio elements and their selected Windows sink.
export function receivedAudioGraph(context,track,meter=false){
 const source=context.createMediaStreamSource(new MediaStream([track])),gain=context.createGain(),destination=context.createMediaStreamDestination(),analyser=meter?context.createAnalyser():null,nodes=[];
 if(analyser){analyser.fftSize=1024;source.connect(analyser);analyser.connect(gain);}else source.connect(gain);
 let left,right,currentEar;
 if(meter){
  // Mix voice to mono once, then explicitly feed each ear. No center-pan loss,
  // and the unselected ear is silent even if the incoming microphone is stereo.
  const mono=context.createGain(),merger=context.createChannelMerger(2);left=context.createGain();right=context.createGain();mono.channelCount=1;mono.channelCountMode='explicit';mono.channelInterpretation='speakers';
  gain.connect(mono);mono.connect(left);mono.connect(right);left.connect(merger,0,0);right.connect(merger,0,1);merger.connect(destination);nodes.push(mono,left,right,merger);
 }else gain.connect(destination);
 return {source,gain,analyser,samples:analyser?new Float32Array(analyser.fftSize):null,stream:destination.stream,setEar(ear){if(left&&ear!==currentEar){const method=currentEar?'setTargetAtTime':'setValueAtTime';left.gain[method](ear==='right'?0:1,context.currentTime,.015);right.gain[method](ear==='left'?0:1,context.currentTime,.015);currentEar=ear;}},close(){source.disconnect();analyser?.disconnect();gain.disconnect();nodes.forEach(node=>node.disconnect());destination.stream.getTracks().forEach(t=>t.stop());}};
}
