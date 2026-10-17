import {icons} from '../assets/icons.mjs';
import {mediaIcons} from './media-icons.mjs';
const icon=name=>mediaIcons[name]||icons[name];
let currentVoice=null,reportError=()=>{},pip=null,pipGeneration=0;
export function videoRoomPanel(){return `<section class="panel video-room" id="video-room"><div class="panel-heading"><span data-media-room-label>Vidéo du vocal</span><button class="btn ghost" data-action="stopWatching">Arrêter de regarder</button></div><div class="video-grid" id="video-grid"></div><p class="settings-note video-empty">En attente du flux choisi. Si le joueur a arrêté son partage, choisis un autre « En direct » près de son pseudo.</p></section>`;}
function cleanPip(state){
 if(!state)return;if(pip===state)pip=null;state.video.pause();state.track.detach(state.video);state.video.remove();syncControls();
}
async function closePip(){
 pipGeneration++;const state=pip;if(!state)return;
 try{if(document.pictureInPictureElement===state.video)await document.exitPictureInPicture();}finally{cleanPip(state);}
}
async function togglePip(item){
 if(pip?.track===item.track){await closePip();return;}
 if(document.fullscreenElement)await document.exitFullscreen();
 await closePip();const generation=++pipGeneration,video=document.createElement('video');
 video.autoplay=true;video.playsInline=true;video.muted=true;video.className='pip-source';video.setAttribute('aria-hidden','true');
 const state={video,track:item.track,participantId:item.participantId,source:item.source};pip=state;
 // A separate attached element keeps the native mini player alive across page renders. It never captures or subscribes to another stream.
 item.track.attach(video);document.body.append(video);video.addEventListener('leavepictureinpicture',()=>cleanPip(state),{once:true});
 try{await video.play();if(generation!==pipGeneration)return;await video.requestPictureInPicture();if(generation!==pipGeneration){if(document.pictureInPictureElement===video)await document.exitPictureInPicture();cleanPip(state);return;}syncControls();}
 catch(error){cleanPip(state);if(generation===pipGeneration)throw error;}
}
function control(name,label,action){
 const b=document.createElement('button');b.type='button';b.className='btn ghost video-icon-button';b.dataset.iconOnly='1';b.innerHTML=icon(name);b.title=label;b.setAttribute('aria-label',label);if(action)b.dataset.action=action;return b;
}
function syncControls(){
 if(!currentVoice)return;const voice=currentVoice,connected=voice.enabled&&voice.primaryRoom?.state==='connected';
 for(const tile of document.querySelectorAll('.video-tile')){
  const full=tile.querySelector('[data-video-fullscreen]'),isFull=document.fullscreenElement===tile;
  if(full.dataset.mode!==String(isFull)){full.dataset.mode=String(isFull);full.innerHTML=icon(isFull?'fullscreenExit':'fullscreen');full.title=isFull?'Quitter le plein écran':'Plein écran';full.setAttribute('aria-label',full.title);full.setAttribute('aria-pressed',String(isFull));}
  const mini=tile.querySelector('[data-video-pip]'),active=!!pip&&pip.track===tile._videoItem.track;
  mini.disabled=!document.pictureInPictureEnabled;mini.title=active?'Fermer le lecteur réduit':'Lecteur réduit';mini.setAttribute('aria-label',mini.title);mini.setAttribute('aria-pressed',String(active));
  for(const [action,on,label]of [['voiceMute',voice.effectiveMuted||voice.deafened,voice.effectiveMuted?'Activer mon micro':'Couper mon micro'],['voiceDeafen',voice.deafened,voice.deafened?'Activer le son':'Couper le son'],['cameraToggle',voice.cameraEnabled,voice.cameraEnabled?'Couper la caméra':'Activer la caméra'],['screenToggle',voice.screenEnabled,voice.screenEnabled?'Arrêter le partage':'Partager l’écran']]){
   const b=tile.querySelector('[data-action='+action+']');b.disabled=!connected||(['cameraToggle','screenToggle'].includes(action)&&voice.mediaBusy);b.classList.toggle('media-active',on&&['cameraToggle','screenToggle'].includes(action));b.classList.toggle('icon-struck',action==='cameraToggle'?!on:on&&['voiceMute','voiceDeafen'].includes(action));b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(on));
  }
 }
}
document.addEventListener('fullscreenchange',syncControls);
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||!document.fullscreenElement?.matches('.video-tile')||document.querySelector('dialog[open]'))return;
 event.preventDefault();document.exitFullscreen().catch(reportError);
});
export function updateVideoRoom(voice,onError=()=>{}){
 currentVoice=voice;reportError=onError;
 if(pip&&(!voice.enabled||!voice.mediaTracks.has(pip.track)||pip.track.isMuted||!voice.watching.has(pip.participantId+':'+pip.source)))closePip().catch(()=>{});
 const panel=document.querySelector('#video-room');if(!panel)return;
 panel.hidden=!voice.enabled;panel.querySelector('[data-media-room-label]').textContent='Vidéo · '+voice.label;
 const grid=panel.querySelector('#video-grid'),tracks=[...voice.mediaTracks.values()].filter(v=>!v.track.isMuted&&voice.watching.has(v.participantId+':'+v.source));
 const wanted=new Set(tracks.map(v=>v.track.sid||v.participantId+':'+v.source));
 for(const tile of [...grid.children])if(!wanted.has(tile.dataset.track)){const old=tile.querySelector('video');tile._videoItem?.track.detach(old);tile.remove();}
 for(const item of tracks){const id=item.track.sid||item.participantId+':'+item.source;if([...grid.children].some(el=>el.dataset.track===id))continue;
  const tile=document.createElement('article');tile.className='video-tile';tile.dataset.track=id;tile._videoItem=item;
  const surface=document.createElement('div');surface.className='video-surface';const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;video.className=item.source==='camera'?'camera-feed':'';
  for(const old of item.track.attachedElements||[])if(!old.isConnected)item.track.detach(old);
  item.track.attach(video);surface.append(video);tile.append(surface);
  const error=document.createElement('p');error.className='video-error';error.setAttribute('role','alert');error.hidden=true;tile.append(error);
  const run=async fn=>{error.hidden=true;try{await fn();}catch(e){error.textContent='Impossible de changer le mode vidéo : '+e.message;error.hidden=false;reportError(e);}};
  const footer=document.createElement('footer'),label=document.createElement('span');label.className='video-owner';label.textContent=item.name+(item.local?' · toi':'')+' · '+(item.source==='camera'?'Caméra':'Écran');footer.append(label);
  const calls=document.createElement('div');calls.className='video-call-controls';calls.setAttribute('aria-label','Commandes du vocal');
  for(const [name,action,label]of [['mic','voiceMute','Couper mon micro'],['headset','voiceDeafen','Couper le son'],['camera','cameraToggle','Activer la caméra'],['screen','screenToggle','Partager l’écran'],['hangup','voiceConnect','Quitter le vocal']]){const b=control(name,label,action);if(action==='voiceConnect')b.classList.add('video-hangup');calls.append(b);}footer.append(calls);
  const views=document.createElement('div');views.className='video-view-controls';
  const mini=control('pip','Lecteur réduit');mini.dataset.videoPip='';mini.onclick=()=>run(()=>togglePip(item));views.append(mini);
  const full=control('fullscreen','Plein écran');full.dataset.videoFullscreen='';full.onclick=()=>run(()=>document.fullscreenElement===tile?document.exitFullscreen():tile.requestFullscreen());views.append(full);footer.append(views);tile.append(footer);grid.append(tile);video.play().catch(()=>{});
 }
 panel.querySelector('.video-empty').hidden=tracks.length>0;syncControls();
}
