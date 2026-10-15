import {Room,RoomEvent,LocalAudioTrack,Track,AudioPresets} from '../assets/livekit.mjs';
import {rmsLevel,createVoiceGate,thresholdAmplitude,updateMicMeter} from './activity.mjs';
import {audioSettings,microphoneGraph,playbackVolume,primaryDestination,captureOptions} from './audio.mjs';
import {VoiceSounds} from './voice-sounds.mjs';
import {validateKeys,prettyKey} from './shortcut-keys.mjs';
import {ParticipantVolumes,receivedAudioGraph} from './participant-volumes.mjs';
export class VoiceClient {
 constructor(bridge,changed=()=>{}) {
  this.bridge=bridge;this.changed=changed;this.enabled=false;this.connecting=false;this.rooms=new Map();this.stream=null;this.audioContext=null;this.frame=null;this.queue=Promise.resolve();this.txQueue=Promise.resolve();this.transmitting=null;this.speaking=false;this.error='';this.muted=false;this.deafened=false;
  this.networkDown=false;this.keys={primary:'F8',leaders:'F9',broadcast:'F10'};this.mode='vad';this.nativeHeld={};this.pointerHeld={};this.settings=audioSettings();this.hooksStarted=false;
  this.voiceDetected=false;this.graph=null;this.sounds=new VoiceSounds();this.lastDestination=null;this.presenceInitialized=false;this.presencePeers=new Set();
  this.participantVolumes=new ParticipantVolumes();
   this.keyLabels={};this.capturingKey=false;
   try{const preferences=JSON.parse(localStorage.getItem('umbra-voice')||'{}');this.mode=preferences.mode==='ptt'?'ptt':'vad';this.keys=validateKeys({...this.keys,...preferences.keys});this.keyLabels=preferences.labels||{};}catch{}
  bridge.onPtt(held=>{this.nativeHeld=held;this.applyTransmit();});
 }
 get label(){return this.rooms.get('primary')?.channel.label||'Vocal déconnecté';}
 setVolumeScope(scope){if(this.participantVolumes.load(scope))this.applyVolumes();}
 participantVolume(id){return this.participantVolumes.get(id);}
 setParticipantVolume(id,value){const saved=this.participantVolumes.set(id,value);this.applyVolumes();return saved;}
 notify(){this.changed();}
 reportStatus(){this.bridge.voiceStatus?.({connected:this.enabled&&this.rooms.get('primary')?.room.state==='connected',muted:this.muted,deafened:this.deafened});}
 async connect(settings){this.enabled=true;this.error='';try{await this.sync(settings);}catch(e){this.error=e.message;await this.disconnect();throw e;}}
 sync(settings=this.settings){this.settings=audioSettings(settings);this.applyAudioSettings();const task=this.queue.catch(()=>{}).then(()=>this.reconcile());this.queue=task;return task;}
 async reconcile(attempt=0){
  if(!this.enabled)return;
  this.connecting=true;this.notify();
  try{
   const plan=await this.bridge.voicePlan();
   if(!this.enabled)return;
   if(this.stream&&this.device!==this.settings.mic)await this.clearMedia();
    const capture=captureOptions(this.settings);
    if(this.stream&&JSON.stringify(capture)!==JSON.stringify(this.captureOptions)){await this.stream.getAudioTracks()[0].applyConstraints(capture);this.captureOptions=capture;}
    if(!this.stream){
     this.stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:this.settings.mic?{exact:this.settings.mic}:undefined,...capture},video:false});this.device=this.settings.mic;this.captureOptions=capture;
    if(!this.enabled){this.stream.getTracks().forEach(t=>t.stop());this.stream=null;return;}
    this.graph=await microphoneGraph(this.stream,this.settings.inputVolume);this.audioContext=this.graph.context;const analyser=this.graph.detector;
    const samples=new Float32Array(analyser.fftSize),gate=createVoiceGate();let lastReport=0,lastSpeaking=false,lastChannel='';
    const tick=()=>{
     if(!this.enabled||!this.stream)return;analyser.getFloatTimeDomainData(samples);const level=rmsLevel(samples),detected=gate(level,performance.now(),thresholdAmplitude(this.vadPreview??this.settings.vadThresholdDb));
     if(detected!==this.voiceDetected){this.voiceDetected=detected;if(this.mode==='vad')this.applyTransmit();}
     const active=detected&&!!this.transmitting;
     this.speaking=active;
     if(active!==lastSpeaking||this.transmitting!==lastChannel||performance.now()-lastReport>650){lastSpeaking=active;lastChannel=this.transmitting;lastReport=performance.now();this.bridge.voiceActivity(active,this.transmitting||'primary');this.reportStatus();}
     if(active!==this.lastUiSpeaking){this.lastUiSpeaking=active;this.notify();}
     updateMicMeter(level,this.settings,this.vadPreview);
    };tick();this.frame=setInterval(tick,25);
   }
   const desired=new Map(plan.channels.map(c=>[c.kind,c]));
   for(const[k,entry]of this.rooms)if(desired.get(k)?.room!==entry.channel.room){await entry.track?.mute();await entry.room.disconnect();this.rooms.delete(k);}
   for(const c of plan.channels){
    if(this.rooms.has(c.kind)){this.rooms.get(c.kind).channel=c;continue;}
    const room=new Room({adaptiveStream:false,dynacast:false,disconnectOnPageLeave:true,audioOutput:{deviceId:this.settings.output||''},publishDefaults:{audioPreset:AudioPresets.speech,dtx:true,red:true}});
    const entry={room,channel:c,track:null,elements:new Set(),received:new Map()};this.rooms.set(c.kind,entry);
    room.on(RoomEvent.TrackSubscribed,(track,publication,participant)=>{
     if(track.kind!==Track.Kind.Audio||!this.enabled||!this.audioContext||this.rooms.get(c.kind)!==entry)return;const attached=track.attach();attached.muted=true;attached.volume=0;attached.hidden=true;document.body.append(attached);
     const graph=receivedAudioGraph(this.audioContext,track.mediaStreamTrack),element=document.createElement('audio');element.srcObject=graph.stream;element.dataset.voiceKind=c.kind;element.dataset.voiceParticipant=participant.identity;element.autoplay=true;element.hidden=true;document.body.append(element);entry.elements.add(element);entry.received.set(track,{graph,element,attached});this.applyVolumes();if(element.setSinkId)element.setSinkId(this.settings.output||'').catch(()=>{});element.play().catch(()=>{this.error='Clique sur Activer le son pour autoriser la lecture.';this.notify();});
    });
    room.on(RoomEvent.TrackUnsubscribed,track=>{const received=entry.received.get(track);if(received){received.graph.close();received.element.pause();received.element.srcObject=null;received.element.remove();entry.elements.delete(received.element);entry.received.delete(track);}for(const el of track.detach())el.remove();});
    room.on(RoomEvent.ActiveSpeakersChanged,()=>this.applyVolumes());
    room.on(RoomEvent.Reconnecting,()=>{this.connecting=true;this.notify();});
    room.on(RoomEvent.Reconnected,()=>{this.connecting=false;this.applyTransmit();this.notify();});
    room.on(RoomEvent.Disconnected,()=>{for(const received of entry.received.values()){received.graph.close();received.element.pause();received.element.srcObject=null;received.element.remove();received.attached.remove();}entry.received.clear();entry.elements.clear();this.notify();});
    await room.connect(plan.url,c.token);
    if(!this.enabled){await room.disconnect();return;}
    if(c.canPublish){entry.track=new LocalAudioTrack(this.graph.stream.getAudioTracks()[0].clone(),undefined,true);await entry.track.mute();await room.localParticipant.publishTrack(entry.track,{source:Track.Source.Microphone,audioPreset:AudioPresets.speech,dtx:true,red:true});}
   }
   if(!this.hooksStarted){await this.bridge.pttStart(this.keys);this.hooksStarted=true;}
   await Promise.all([...this.rooms.values()].map(e=>e.room.switchActiveDevice('audiooutput',this.settings.output||'')));
   await Promise.all([...this.rooms.values()].flatMap(e=>[...e.elements].filter(el=>el.setSinkId).map(el=>el.setSinkId(this.settings.output||''))));
   await this.applyTransmit();await this.bridge.voicePresence();this.applyAudioSettings();this.error='';
   const destination=primaryDestination(this.rooms.get('primary')?.channel);
   if(destination!==this.lastDestination){const sound=this.lastDestination?'move':'join';this.lastDestination=destination;this.presenceInitialized=false;this.sounds.play(sound);}
   if(this.lastPresence)this.observePresence(this.lastPresence.users,this.lastPresence.selfId);
   }catch(e){
    // A second squad joining a briefing can rotate its room while we connect.
    // Fetch a fresh plan instead of leaving the user disconnected on that race.
    await this.clearMedia();this.hooksStarted=false;await this.bridge.pttStop().catch(()=>{});
    if(this.enabled&&attempt<2&&!['NotAllowedError','NotFoundError','OverconstrainedError'].includes(e.name)){
     this.error='Reconnexion au vocal…';this.notify();await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
     if(this.enabled)return await this.reconcile(attempt+1);return;
    }
    this.error=e.message;this.enabled=false;throw e;
   }
  finally{this.connecting=false;this.reportStatus();this.notify();}
 }
 chosenChannel(){
   if(!this.enabled||this.capturingKey||this.monitoring||this.muted||this.deafened||this.networkDown||this.settings.inputVolume===0)return null;
  const held=k=>this.nativeHeld[k]||this.pointerHeld[k];
  if(held('broadcast')&&this.rooms.get('broadcast')?.track)return 'broadcast';
  if(held('leaders')&&this.rooms.get('leaders')?.track)return 'leaders';
  if((this.mode==='vad'&&this.voiceDetected||held('primary'))&&this.rooms.get('primary')?.track)return 'primary';return null;
 }
 applyTransmit(){
  const task=this.txQueue.catch(()=>{}).then(async()=>{
   const chosen=this.chosenChannel();
   await Promise.all([...this.rooms].filter(([k,e])=>k!==chosen&&e.track).map(([,e])=>e.track.mute()));
   const entry=this.rooms.get(chosen);if(entry?.track&&entry.room.state==='connected')await entry.track.unmute();
   this.transmitting=entry?.track&&!entry.track.isMuted?chosen:null;this.notify();
  });this.txQueue=task;return task;
 }
 setPointer(channel,down){this.pointerHeld[channel]=down;this.applyTransmit();}
 releasePointers(){this.pointerHeld={};this.applyTransmit();}
 setMute(value){this.muted=value;this.applyTransmit();this.reportStatus();this.notify();}
 setDeafen(value){this.deafened=value;this.applyTransmit();this.applyAudioSettings();this.reportStatus();this.notify();}
   keyLabel(kind){return this.keyLabels[kind]||prettyKey(this.keys[kind]);}
   async configure({mode=this.mode,keys=this.keys,labels=this.keyLabels}={}){
    if(!['ptt','vad'].includes(mode))throw new Error('Mode vocal invalide.');validateKeys(keys);
    if(this.enabled&&!this.capturingKey)await this.bridge.pttStart(keys);
    this.mode=mode;this.keys={...keys};this.keyLabels=Object.fromEntries(['primary','leaders','broadcast'].filter(k=>typeof labels[k]==='string'&&labels[k].length<=24).map(k=>[k,labels[k]]));
    localStorage.setItem('umbra-voice',JSON.stringify({mode,keys:this.keys,labels:this.keyLabels}));await this.applyTransmit();this.notify();
   }
   async captureShortcut(active){this.capturingKey=active;this.nativeHeld={};this.pointerHeld={};await this.applyTransmit();if(active){await this.bridge.pttStop();this.hooksStarted=false;}else if(this.enabled){await this.bridge.pttStart(this.keys);this.hooksStarted=true;}}
 applyAudioSettings(){if(this.graph)this.graph.gain.gain.value=this.settings.inputVolume/100;this.sounds.configure(this.settings,this.deafened);this.applyVolumes();}
 applyVolumes(){
  const leadersActive=this.rooms.get('leaders')?.room.activeSpeakers.some(p=>p.identity!==this.rooms.get('leaders')?.room.localParticipant.identity);
  for(const[k,e]of this.rooms)for(const el of e.elements)el.volume=playbackVolume(k,this.settings,{deafened:this.deafened,leadersActive});
  for(const e of this.rooms.values())for(const received of e.received?.values()||[]){const volume=this.participantVolume(received.element.dataset.voiceParticipant);received.graph.gain.gain.setTargetAtTime(volume/100,this.audioContext.currentTime,.015);received.element.dataset.participantGain=String(volume/100);}
 }
 observePresence(users,selfId){
  this.lastPresence={users,selfId};
  const destination=primaryDestination(this.rooms.get('primary')?.channel);
  if(!this.enabled||!destination)return;
  const peers=new Set(users.filter(p=>p.id!==selfId&&p.channels.some(c=>c.kind==='primary'&&primaryDestination(c)===destination)).map(p=>p.id));
  if(this.presenceInitialized&&!this.connecting&&destination===this.lastDestination&&[...peers].some(id=>!this.presencePeers.has(id)))this.sounds.play('peer-join');
   if(this.presenceInitialized&&!this.connecting&&destination===this.lastDestination&&[...this.presencePeers].some(id=>!peers.has(id)))this.sounds.play('leave');
  this.presencePeers=peers;this.presenceInitialized=true;
 }
 async startAudio(){await this.audioContext?.resume();await Promise.all([...this.rooms.values()].map(e=>e.room.startAudio()));for(const e of this.rooms.values()){for(const received of e.received?.values()||[])received.attached.muted=true;await Promise.all([...e.elements].map(el=>el.play()));}this.error='';this.notify();}
 async clearMedia(){
  if(this.frame)clearInterval(this.frame);this.frame=null;
  for(const e of this.rooms.values()){try{await e.track?.mute();await e.room.disconnect();}catch{}for(const el of e.elements)el.remove();}
  this.rooms.clear();this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.graph?.stream.getTracks().forEach(t=>t.stop());this.graph=null;this.voiceDetected=false;
  if(this.audioContext)await this.audioContext.close().catch(()=>{});this.audioContext=null;this.transmitting=null;this.speaking=false;
 }
  async disconnect(){const joined=!!this.lastDestination;this.enabled=false;this.reportStatus();this.hooksStarted=false;this.nativeHeld={};this.pointerHeld={};this.lastDestination=null;this.presenceInitialized=false;this.presencePeers.clear();this.sounds.stop();if(joined)await this.sounds.play('leave');await this.clearMedia();await this.bridge.pttStop().catch(()=>{});this.bridge.voiceActivity(false,'primary');await this.bridge.voiceDisconnect().catch(()=>{});this.connecting=false;this.notify();}
}
