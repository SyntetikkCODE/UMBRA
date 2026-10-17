export function videoRoomPanel(){return `<section class="panel video-room" id="video-room"><div class="panel-heading"><span data-media-room-label>Vidéo du vocal</span><button class="btn ghost" data-action="stopWatching">Arrêter de regarder</button></div><div class="video-grid" id="video-grid"></div><p class="settings-note video-empty">En attente du flux choisi. Si le joueur a arrêté son partage, choisis un autre « En direct » près de son pseudo.</p></section>`;}
export function updateVideoRoom(voice){
 const panel=document.querySelector('#video-room');if(!panel)return;
 panel.hidden=!voice.enabled;
 panel.querySelector('[data-media-room-label]').textContent='Vidéo · '+voice.label;
 const grid=panel.querySelector('#video-grid'),tracks=[...voice.mediaTracks.values()].filter(v=>!v.track.isMuted&&voice.watching.has(v.participantId+':'+v.source));
 const wanted=new Set(tracks.map(v=>v.track.sid||v.participantId+':'+v.source));
 for(const tile of grid.children)if(!wanted.has(tile.dataset.track)){tile.remove();}
 for(const item of tracks){const id=item.track.sid||item.participantId+':'+item.source;if([...grid.children].some(el=>el.dataset.track===id))continue;
  const tile=document.createElement('article');tile.className='video-tile';tile.dataset.track=id;
  const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;video.className=item.source==='camera'?'camera-feed':'';
  for(const old of item.track.attachedElements||[])if(!old.isConnected)item.track.detach(old);
  item.track.attach(video);tile.append(video);const footer=document.createElement('footer'),label=document.createElement('span');label.textContent=item.name+(item.local?' · toi':'')+' · '+(item.source==='camera'?'Caméra':'Écran');footer.append(label);
  const full=document.createElement('button');full.type='button';full.className='btn ghost';full.textContent='Agrandir';full.onclick=()=>tile.requestFullscreen?.().catch(()=>{});footer.append(full);tile.append(footer);grid.append(tile);video.play().catch(()=>{});
 }
 panel.querySelector('.video-empty').hidden=tracks.length>0;
}
