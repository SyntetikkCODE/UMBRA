export function playbackMessage(error,phase,name){const subject=name||'ce joueur';if(phase==='output')return 'Sortie audio indisponible pour '+subject+'. Sélectionne une autre sortie ou relance son audio.';return 'Lecture audio bloquée pour '+subject+'. Clique sur « Relancer son audio ».';}
export async function playReceived(client,entry,track,received){
 const generation=received.playGeneration=(received.playGeneration||0)+1,current=()=>client.enabled&&client.rooms.get(entry.channel.kind)===entry&&entry.received.get(track)===received&&received.playGeneration===generation;
 const oldError=received.error;let phase='output';
 try{if(received.element.setSinkId)await received.element.setSinkId(client.settings.output||'');if(!current())return false;received.outputError=null;phase='play';await received.element.play();if(!current())return false;received.playError=null;received.error='';if(oldError&&client.error===oldError)client.error=[...client.rooms.values()].flatMap(e=>[...e.received.values()]).find(r=>r.error)?.error||'';return true;}
 catch(error){if(!current())return false;received[phase==='output'?'outputError':'playError']=error?.name||'Error';received.error=playbackMessage(error,phase,received.name);client.error=received.error;return false;}
 finally{if(current())client.notify();}
}
