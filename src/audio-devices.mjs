import {audioSettings,captureOptions} from './audio.mjs';

// Chromium device identifiers can change after an update or a device replacement.
// Retry only an unavailable selected device, never a denied microphone permission.
export async function captureMicrophone(settings,devices=navigator.mediaDevices){
 const next=audioSettings(settings),changes={};let stream;
 const capture=()=>devices.getUserMedia({audio:{...captureOptions(next),deviceId:next.mic?{exact:next.mic}:undefined},video:false});
 try{stream=await capture();}
 catch(error){
  if(!next.mic||!(error.name==='NotFoundError'||error.name==='OverconstrainedError'&&error.constraint==='deviceId'))throw error;
  next.mic='';changes.mic='';stream=await capture();
 }
 try{
  if(next.output&&!['default','communications'].includes(next.output)){
   const outputs=(await devices.enumerateDevices()).filter(d=>d.kind==='audiooutput'&&d.deviceId);
   if(outputs.length&&!outputs.some(d=>d.deviceId===next.output)){next.output='';changes.output='';}
  }
  return {stream,settings:next,changes};
 }catch(error){stream.getTracks().forEach(track=>track.stop());throw error;}
}

export function voiceError(error){
 if(error?.name==='NotAllowedError'||error?.name==='SecurityError')return 'Accès au microphone refusé. Vérifie les autorisations du micro dans les paramètres Windows.';
 if(error?.name==='NotFoundError')return 'Aucun microphone disponible. Branche ton micro puis réessaie.';
 if(error?.name==='NotReadableError')return 'Impossible d’ouvrir le microphone. Vérifie son branchement et les applications qui l’utilisent.';
 if(error?.name==='OverconstrainedError')return 'Le microphone sélectionné ne prend pas en charge ces réglages. Choisis un autre micro dans Voix & vidéo.';
 return error?.message?.replace(/^Error invoking remote method '[^']+': (Error: )?/, '').trim()||'La connexion vocale a échoué. Réessaie ou consulte le diagnostic dans Voix & vidéo.';
}
