export function voiceOverlayState(voice,state,activity,flags,networkOnline){
 const primary=voice.rooms.get('primary'),connected=voice.enabled&&primary?.room.state==='connected'&&networkOnline&&!voice.networkDown,speakers=new Map();
 if(connected){
  const local=state.players.find(p=>p.id===state.currentUserId);if(local)speakers.set(local.id,{id:local.id,name:local.name,channel:voice.transmitting||'primary',speaking:voice.speaking&&!!voice.transmitting&&!voice.effectiveMuted&&!voice.deafened});
  for(const id of primary.room.remoteParticipants.keys()){const p=state.players.find(p=>p.id===id);if(p)speakers.set(id,{id,name:p.name,channel:'primary',speaking:false});}
  if(!voice.deafened)for(const [id,event]of activity){const room=voice.rooms.get(event.channel)?.room,p=state.players.find(p=>p.id===id),status=flags.get(id);if(p&&id!==state.currentUserId&&event.speaking&&room?.state==='connected'&&room.remoteParticipants.has(id)&&!status?.muted&&!status?.deafened)speakers.set(id,{id,name:p.name,channel:event.channel,speaking:true});}
 }
 return {connected:!!connected,label:primary?.channel.label||'',muted:voice.effectiveMuted,deafened:voice.deafened,speakers:[...speakers.values()]};
}
