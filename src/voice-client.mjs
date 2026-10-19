import {Room,RoomEvent,LocalAudioTrack,LocalVideoTrack,Track,AudioPresets} from '../assets/livekit.mjs';
import {rmsLevel,createVoiceGate,thresholdAmplitude,updateMicMeter} from './activity.mjs';
import {audioSettings,microphoneGraph,playbackVolume,primaryDestination,captureOptions} from './audio.mjs';
import {VoiceSounds} from './voice-sounds.mjs';
import {validateKeys,prettyKey} from './shortcut-keys.mjs';
import {ParticipantVolumes,receivedAudioGraph} from './participant-volumes.mjs';
import {validateBindings,nativeBindings} from './custom-shortcuts.mjs';
import {StreamAudioPreferences,streamGain} from './stream-audio.mjs';
import {screenQuality,screenShareOptions} from './screen-quality.mjs';
export class VoiceClient {
 constructor(bridge,changed=()=>{}) {
  this.bridge=bridge;this.changed=changed;this.enabled=false;this.connecting=false;this.rooms=new Map();this.stream=null;this.audioContext=null;this.frame=null;this.queue=Promise.resolve();this.txQueue=Promise.resolve();this.transmitting=null;this.speaking=false;this.error='';this.muted=false;this.deafened=false;
  this.networkDown=false;this.keys={primary:'F8',leaders:'F9',broadcast:'F10'};this.mode='vad';this.nativeHeld={};this.pointerHeld={};this.settings=audioSettings();this.hooksStarted=false;
  this.voiceDetected=false;this.graph=null;this.sounds=new VoiceSounds();this.lastDestination=null;this.presenceInitialized=false;this.presencePeers=new Set();
  this.participantVolumes=new ParticipantVolumes();
  this.streamAudioPreferences=new StreamAudioPreferences();this.streamDucking=false;
  this.screenQuality='720p';try{const saved=localStorage.getItem('umbra-screen-quality');if(saved)this.screenQuality=screenQuality(saved).id;}catch{}
   this.keyLabels={};this.capturingKey=false;this.bindings=[];this.mediaBusy=false;this.mediaTracks=new Map();this.watching=new Set();this.cameraDevice='';this.lastLevelDb=null;this.onShortcut=()=>{};
   try{const preferences=JSON.parse(localStorage.getItem('umbra-voice')||'{}');this.mode=preferences.mode==='ptt'?'ptt':'vad';this.keys=validateKeys({...this.keys,...preferences.keys});this.keyLabels=preferences.labels||{};}catch{}
  try{this.bindings=validateBindings(this.keys,JSON.parse(localStorage.getItem('umbra-custom-shortcuts')||'[]'));}catch{}
  bridge.onPtt(held=>{const previous=this.nativeHeld;this.nativeHeld=held;this.applyTransmit();this.reportStatus();this.applyVolumes();for(const b of this.bindings)if(b.action!=='muteHold'&&held[b.id]&&!previous[b.id]&&!this.capturingKey)this.onShortcut(b.action);this.notify();});
 }
 get effectiveMuted(){return this.muted||this.bindings.some(b=>b.action==='muteHold'&&this.nativeHeld[b.id]);}
 get primaryRoom(){return this.rooms.get('primary')?.room;}
 get cameraEnabled(){return !!this.primaryRoom?.localParticipant.isCameraEnabled;}
 get screenEnabled(){return !!this.primaryRoom?.localParticipant.isScreenShareEnabled;}
 get quality(){return this.primaryRoom?.localParticipant.connectionQuality||'unknown';}
 get shortcutKeys(){return nativeBindings(this.keys,this.bindings,this.keyLabels);}
 mediaParticipants(){const room=this.primaryRoom;if(!room)return [];return [room.localParticipant,...room.remoteParticipants.values()].map(p=>({id:p.identity,name:p.name||p.identity,local:p===room.localParticipant,screen:!!p.getTrackPublication(Track.Source.ScreenShare)&&!p.getTrackPublication(Track.Source.ScreenShare).isMuted,camera:!!p.getTrackPublication(Track.Source.Camera)&&!p.getTrackPublication(Track.Source.Camera).isMuted})).filter(p=>p.screen||p.camera);}
 watchMedia(id,source){this.watching.clear();if(id)this.watching.add(id+':'+source);this.updateSubscriptions();this.notify();}
 updateSubscriptions(){const room=this.primaryRoom;if(!room)return;for(const p of room.remoteParticipants.values())for(const publication of p.trackPublications.values()){const source=publication.source,subscribe=source===Track.Source.Microphone||this.watching.has(p.identity+':'+source)||source===Track.Source.ScreenShareAudio&&this.watching.has(p.identity+':'+Track.Source.ScreenShare);if(publication.isSubscribed!==subscribe)publication.setSubscribed(subscribe);}}
 async configureBindings(bindings){const next=validateBindings(this.keys,bindings),native=nativeBindings(this.keys,next,this.keyLabels);if(this.enabled&&!this.capturingKey)await this.bridge.pttStart(native);localStorage.setItem('umbra-custom-shortcuts',JSON.stringify(next));this.bindings=next;this.nativeHeld={};await this.applyTransmit();this.reportStatus();this.notify();}
 get label(){return this.rooms.get('primary')?.channel.label||'Vocal déconnecté';}
 setVolumeScope(scope){const players=this.participantVolumes.load(scope),streams=this.streamAudioPreferences.load(scope);if(players||streams)this.applyVolumes();}
 participantVolume(id){return this.participantVolumes.get(id);}
 setParticipantVolume(id,value){const saved=this.participantVolumes.set(id,value);this.applyVolumes();return saved;}
 streamAudio(id){return this.streamAudioPreferences.get(id);}
 setStreamAudio(id,patch){const saved=this.streamAudioPreferences.set(id,patch);this.applyVolumes();this.notify();return saved;}
 streamHasAudio(id){return !!this.primaryRoom?.remoteParticipants.get(id)?.getTrackPublication(Track.Source.ScreenShareAudio);}
 notify(){this.changed();}
 reportStatus(){this.bridge.voiceStatus?.({connected:this.enabled&&this.rooms.get('primary')?.room.state==='connected',muted:this.effectiveMuted,deafened:this.deafened});}
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
     this.lastLevelDb=20*Math.log10(Math.max(level,1e-8));
     if(detected!==this.voiceDetected){this.voiceDetected=detected;if(this.mode==='vad')this.applyTransmit();}
     const active=detected&&!!this.transmitting;
     this.speaking=active;
     this.updateStreamDucking();
     if(active!==lastSpeaking||this.transmitting!==lastChannel||performance.now()-lastReport>650){lastSpeaking=active;lastChannel=this.transmitting;lastReport=performance.now();this.bridge.voiceActivity(active,this.transmitting||'primary');this.reportStatus();}
     if(active!==this.lastUiSpeaking){this.lastUiSpeaking=active;this.notify();}
     updateMicMeter(level,this.settings,this.vadPreview);
    };tick();this.frame=setInterval(tick,25);
   }
   const desired=new Map(plan.channels.map(c=>[c.kind,c]));
   for(const[k,entry]of this.rooms)if(desired.get(k)?.room!==entry.channel.room){if(k==='primary')await this.stopVisualMedia();await entry.track?.mute();await entry.room.disconnect();this.rooms.delete(k);}
   for(const c of plan.channels){
    if(this.rooms.has(c.kind)){this.rooms.get(c.kind).channel=c;continue;}
    const room=new Room({adaptiveStream:false,dynacast:false,disconnectOnPageLeave:true,audioOutput:{deviceId:this.settings.output||''},publishDefaults:{audioPreset:AudioPresets.speech,dtx:true,red:true}});
    const entry={room,channel:c,ready:false,track:null,elements:new Set(),received:new Map()};this.rooms.set(c.kind,entry);
    room.on(RoomEvent.TrackSubscribed,(track,publication,participant)=>{
     if(!this.enabled||this.rooms.get(c.kind)!==entry)return;
     if(track.kind===Track.Kind.Video){if(c.kind==='primary')this.addVisualTrack(track,publication,participant);return;}
     if(track.kind!==Track.Kind.Audio||!this.audioContext)return;const attached=track.attach();attached.muted=true;attached.volume=0;attached.hidden=true;document.body.append(attached);
     const graph=receivedAudioGraph(this.audioContext,track.mediaStreamTrack,publication.source===Track.Source.Microphone),element=document.createElement('audio');element.srcObject=graph.stream;element.dataset.voiceKind=c.kind;element.dataset.voiceParticipant=participant.identity;element.dataset.voiceSource=publication.source;element.autoplay=true;element.hidden=true;document.body.append(element);entry.elements.add(element);entry.received.set(track,{graph,element,attached,source:publication.source,gate:createVoiceGate()});this.applyVolumes();if(element.setSinkId)element.setSinkId(this.settings.output||'').catch(()=>{});element.play().catch(()=>{this.error='Clique sur Activer le son pour autoriser la lecture.';this.notify();});
    });
    room.on(RoomEvent.TrackUnsubscribed,track=>{this.removeVisualTrack(track);const received=entry.received.get(track);if(received){received.graph.close();received.element.pause();received.element.srcObject=null;received.element.remove();entry.elements.delete(received.element);entry.received.delete(track);}for(const el of track.detach())el.remove();});
    if(c.kind==='primary'){
     room.on(RoomEvent.TrackPublished,publication=>{if(entry.ready&&this.enabled&&this.rooms.get('primary')===entry&&publication.source===Track.Source.ScreenShare)this.sounds.play('share-start');this.updateSubscriptions();this.notify();});room.on(RoomEvent.TrackUnpublished,()=>{this.updateSubscriptions();this.notify();});
     room.on(RoomEvent.ParticipantDisconnected,()=>this.notify());
     room.on(RoomEvent.LocalTrackPublished,publication=>{if(publication.track?.kind===Track.Kind.Video)this.addVisualTrack(publication.track,publication,room.localParticipant,true);this.notify();});
     room.on(RoomEvent.LocalTrackUnpublished,publication=>{if(publication.track)this.removeVisualTrack(publication.track);this.notify();});
     room.on(RoomEvent.TrackMuted,()=>this.notify());room.on(RoomEvent.TrackUnmuted,()=>this.notify());
     room.on(RoomEvent.ConnectionQualityChanged,()=>this.notify());
    }
    room.on(RoomEvent.ActiveSpeakersChanged,()=>this.applyVolumes());
    room.on(RoomEvent.Reconnecting,()=>{this.connecting=true;this.notify();});
    room.on(RoomEvent.Reconnected,()=>{this.connecting=false;this.applyTransmit();this.notify();});
    room.on(RoomEvent.Disconnected,()=>{if(c.kind==='primary'&&this.rooms.get(c.kind)===entry)this.stopVisualMedia().catch(()=>{});for(const received of entry.received.values()){received.graph.close();received.element.pause();received.element.srcObject=null;received.element.remove();received.attached.remove();}entry.received.clear();entry.elements.clear();this.notify();});
    await room.connect(plan.url,c.token,{autoSubscribe:c.kind!=='primary'});entry.ready=true;if(c.kind==='primary')this.updateSubscriptions();
    if(!this.enabled){await room.disconnect();return;}
    if(c.canPublish){entry.track=new LocalAudioTrack(this.graph.stream.getAudioTracks()[0].clone(),undefined,true);await entry.track.mute();await room.localParticipant.publishTrack(entry.track,{source:Track.Source.Microphone,audioPreset:AudioPresets.speech,dtx:true,red:true});}
   }
   if(!this.hooksStarted){await this.bridge.pttStart(this.shortcutKeys);this.hooksStarted=true;}
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
   if(!this.enabled||this.capturingKey||this.monitoring||this.effectiveMuted||this.deafened||this.networkDown||this.settings.inputVolume===0)return null;
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
    if(!['ptt','vad'].includes(mode))throw new Error('Mode vocal invalide.');const native=nativeBindings(keys,this.bindings,labels);
    if(this.enabled&&!this.capturingKey)await this.bridge.pttStart(native);
    this.mode=mode;this.keys={...keys};this.keyLabels=Object.fromEntries(['primary','leaders','broadcast'].filter(k=>typeof labels[k]==='string'&&labels[k].length<=24).map(k=>[k,labels[k]]));
    localStorage.setItem('umbra-voice',JSON.stringify({mode,keys:this.keys,labels:this.keyLabels}));await this.applyTransmit();this.notify();
   }
   async captureShortcut(active){this.capturingKey=active;this.nativeHeld={};this.pointerHeld={};await this.applyTransmit();if(active){await this.bridge.pttStop();this.hooksStarted=false;}else if(this.enabled){await this.bridge.pttStart(this.shortcutKeys);this.hooksStarted=true;}}
 addVisualTrack(track,publication,participant,local=false){
  this.mediaTracks.set(track,{track,source:publication.source,participantId:participant.identity,name:participant.name||participant.identity,local});
  this.notify();
 }
 removeVisualTrack(track){if(this.mediaTracks.delete(track)){for(const el of track.detach())el.remove();this.notify();}}
 async setCamera(enabled,deviceId=this.cameraDevice){
  const room=this.primaryRoom;if(!this.enabled||room?.state!=='connected')throw new Error('Rejoins un vocal avant d’activer la caméra.');
  if(this.mediaBusy)throw new Error('Un changement vidéo est déjà en cours.');this.mediaBusy=true;this.notify();
  let captured;try{if(enabled){captured=await navigator.mediaDevices.getUserMedia({audio:false,video:{deviceId:deviceId?{exact:deviceId}:undefined,width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24,max:30}}});if(this.primaryRoom!==room||!this.enabled){captured.getTracks().forEach(t=>t.stop());return;}const track=new LocalVideoTrack(captured.getVideoTracks()[0],undefined,true);await room.localParticipant.publishTrack(track,{source:Track.Source.Camera,simulcast:true,videoEncoding:{maxBitrate:1500000,maxFramerate:24}});}else{const track=room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;if(track){await room.localParticipant.unpublishTrack(track,true);track.stop();}}if(this.primaryRoom!==room||!this.enabled){const track=room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;if(track){await room.localParticipant.unpublishTrack(track,true);track.stop();}return;}this.cameraDevice=deviceId;}catch(e){captured?.getTracks().forEach(t=>t.stop());throw e;}finally{this.mediaBusy=false;this.notify();}
 }
 async startScreen(sourceId,audio=false,quality=this.screenQuality){
  const room=this.primaryRoom;if(!this.enabled||room?.state!=='connected')throw new Error('Rejoins un vocal avant de partager ton écran.');
  const options=screenShareOptions(quality,audio);
  if(this.mediaBusy)throw new Error('Un changement vidéo est déjà en cours.');this.mediaBusy=true;this.notify();
  try{await this.bridge.selectCapture(sourceId,audio);await room.localParticipant.setScreenShareEnabled(true,options.capture,options.publish);if(this.primaryRoom!==room||!this.enabled)await room.localParticipant.setScreenShareEnabled(false);else{this.screenQuality=quality;localStorage.setItem('umbra-screen-quality',quality);}}finally{await this.bridge.cancelCapture().catch(()=>{});this.mediaBusy=false;this.notify();}
 }
 async stopScreen(){await this.primaryRoom?.localParticipant.setScreenShareEnabled(false);this.notify();}
 async stopVisualMedia(){this.watching.clear();const room=this.primaryRoom;if(room){const tracks=[...room.localParticipant.trackPublications.values()].filter(p=>[Track.Source.Camera,Track.Source.ScreenShare,Track.Source.ScreenShareAudio].includes(p.source)).map(p=>p.track).filter(Boolean);await Promise.allSettled(tracks.map(track=>room.localParticipant.unpublishTrack(track,true)));for(const track of tracks)track.stop();}for(const {track,local}of this.mediaTracks.values()){for(const el of track.detach())el.remove();if(local)track.stop();}this.mediaTracks.clear();this.notify();}
 applyAudioSettings(){if(this.graph)this.graph.gain.gain.value=this.settings.inputVolume/100;this.sounds.configure(this.settings,this.deafened);this.applyVolumes();}
 updateStreamDucking(){
  let active=this.speaking&&!this.effectiveMuted&&!this.deafened;
  for(const [kind,entry]of this.rooms)for(const received of entry.received?.values()||[]){if(!received.graph.analyser)continue;received.graph.analyser.getFloatTimeDomainData(received.graph.samples);const talking=received.gate(rmsLevel(received.graph.samples),performance.now(),thresholdAmplitude(-48));if(talking&&this.participantVolume(received.element.dataset.voiceParticipant)>0&&playbackVolume(kind,this.settings,{deafened:this.deafened})>0)active=true;}
  if(active!==this.streamDucking){this.streamDucking=active;this.applyVolumes();}
 }
 applyVolumes(){
  const leadersActive=this.rooms.get('leaders')?.room.activeSpeakers.some(p=>p.identity!==this.rooms.get('leaders')?.room.localParticipant.identity);
  for(const[k,e]of this.rooms)for(const el of e.elements)el.volume=el.dataset.voiceSource===Track.Source.ScreenShareAudio?(this.deafened?0:this.settings.outputVolume/100):playbackVolume(k,this.settings,{deafened:this.deafened,leadersActive});
  for(const e of this.rooms.values())for(const received of e.received?.values()||[]){const id=received.element.dataset.voiceParticipant,isStream=received.source===Track.Source.ScreenShareAudio,gain=isStream?streamGain(this.streamAudio(id),this.streamDucking):this.participantVolume(id)/100;received.graph.gain.gain.setTargetAtTime(gain,this.audioContext.currentTime,isStream?.08:.015);received.element.dataset.participantGain=String(gain);}
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
  await this.stopVisualMedia();this.lastLevelDb=null;
  if(this.frame)clearInterval(this.frame);this.frame=null;
  for(const e of this.rooms.values()){try{await e.track?.mute();await e.room.disconnect();}catch{}for(const el of e.elements)el.remove();}
  this.rooms.clear();this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.graph?.stream.getTracks().forEach(t=>t.stop());this.graph=null;this.voiceDetected=false;
  if(this.audioContext)await this.audioContext.close().catch(()=>{});this.audioContext=null;this.transmitting=null;this.speaking=false;this.streamDucking=false;
 }
  async disconnect(){const joined=!!this.lastDestination;this.enabled=false;this.reportStatus();this.hooksStarted=false;this.nativeHeld={};this.pointerHeld={};this.lastDestination=null;this.presenceInitialized=false;this.presencePeers.clear();this.sounds.stop();if(joined)await this.sounds.play('leave');await this.clearMedia();await this.bridge.pttStop().catch(()=>{});this.bridge.voiceActivity(false,'primary');await this.bridge.voiceDisconnect().catch(()=>{});this.connecting=false;this.notify();}
}
