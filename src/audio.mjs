export const DEFAULT_AUDIO=Object.freeze({mic:'',output:'',inputVolume:100,outputVolume:100,squadVolume:85,leadersVolume:100,ducking:true,notificationSounds:true,soundsVolume:35,audioProfile:'standard',noiseSuppression:true,echoCancellation:true,autoGainControl:false,vadThresholdDb:-48});
export function captureOptions(settings){const s=audioSettings(settings);return {echoCancellation:s.echoCancellation,noiseSuppression:s.noiseSuppression,autoGainControl:s.autoGainControl};}
export const audioSettings=value=>({...DEFAULT_AUDIO,...value});
export function validateAudio(t){
 if(!t||![t.mic,t.output??''].every(x=>typeof x==='string'&&x.length<=300)||typeof t.ducking!=='boolean')throw new Error('Réglages audio invalides.');
 for(const [key,max]of [['squadVolume',100],['leadersVolume',100],['inputVolume',200],['outputVolume',100],['soundsVolume',100]]){
  const v=t[key]??DEFAULT_AUDIO[key];if(!Number.isFinite(v)||v<0||v>max)throw new Error('Réglages invalides : volume audio hors limites.');
 }
 if(t.notificationSounds!==undefined&&typeof t.notificationSounds!=='boolean')throw new Error('Réglages des sons invalides.');
 if(t.audioProfile!==undefined&&!['standard','studio','custom'].includes(t.audioProfile))throw new Error('Profil audio invalide.');
 for(const key of ['noiseSuppression','echoCancellation','autoGainControl'])if(t[key]!==undefined&&typeof t[key]!=='boolean')throw new Error('Traitement audio invalide.');
 if(t.vadThresholdDb!==undefined&&(!Number.isFinite(t.vadThresholdDb)||t.vadThresholdDb< -65||t.vadThresholdDb> -20))throw new Error('Seuil de détection invalide (-65 à -20 dB).');
}
export const primaryDestination=c=>c?c.operationId?'brief:'+c.operationId:c.squadId?'squad:'+c.squadId:'lobby':null;
export function playbackVolume(kind,settings,{deafened=false,leadersActive=false}={}){
 if(deafened)return 0;
 const s=audioSettings(settings),channel=kind==='primary'?s.squadVolume:s.leadersVolume;
 return channel/100*s.outputVolume/100*(kind==='primary'&&leadersActive&&s.ducking ? .25 : 1);
}
// A permanently silent branch keeps analysis running without microphone feedback.
export async function microphoneGraph(stream,volume=100){
 const context=new AudioContext();await context.resume();
 const source=context.createMediaStreamSource(stream),gain=context.createGain(),analyser=context.createAnalyser(),detector=context.createAnalyser(),destination=context.createMediaStreamDestination();
 gain.gain.value=volume/100;analyser.fftSize=1024;detector.fftSize=1024;
 const silent=context.createGain();silent.gain.value=0;
 source.connect(gain);gain.connect(detector);gain.connect(analyser);gain.connect(destination);analyser.connect(silent);detector.connect(silent);silent.connect(context.destination);
 return {context,gain,analyser,detector,stream:destination.stream};
}
export function audioDeviceOptions(devices,kind){
 return devices.filter(d=>d.kind===kind&&d.deviceId&&d.deviceId!=='default'&&d.deviceId!=='communications').map((d,i)=>({deviceId:d.deviceId,label:d.label||(kind==='audioinput'?'Microphone':'Sortie audio')+' '+(i+1)}));
}
