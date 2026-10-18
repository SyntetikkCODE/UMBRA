import {escapeText} from './message-format.mjs';
import {mediaIcons} from './media-icons.mjs';
export class StreamMenu{
 constructor(){
  document.addEventListener('pointerdown',event=>{if(this.element&&!this.element.contains(event.target))this.close();});
  document.addEventListener('scroll',event=>{if(this.element&&!this.element.contains(event.target))this.close();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.element){event.preventDefault();event.stopPropagation();this.close(true);}},true);
  window.addEventListener('blur',()=>this.close());document.addEventListener('fullscreenchange',()=>this.close());
 }
 close(restore=false){const anchor=this.anchor;this.element?.remove();this.element=null;this.anchor=null;if(restore&&anchor?.isConnected)anchor.focus();}
 reconcile(){if(this.element&&!this.anchor?.isConnected)this.close();}
 open({item,tile,voice,x,y,pip,fullscreen,run}){
  this.close();document.dispatchEvent(new Event('umbra:stream-menu'));this.anchor=tile;
  const menu=document.createElement('div'),screen=item.source==='screen_share',available=screen&&!item.local&&voice.streamHasAudio(item.participantId);
  menu.className='stream-context-menu';menu.dataset.streamMenu='';menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Options du partage de '+item.name);
  const pref=voice.streamAudio(item.participantId);
  menu.innerHTML=`<div class="stream-menu-title">${escapeText(item.name)} · ${screen?'Partage d’écran':'Caméra'}</div><button type="button" data-stream-stop>${mediaIcons.stop}Arrêter de regarder</button>${screen?`<div class="stream-menu-divider"></div><label class="stream-check"><span>Rendre muet</span><input type="checkbox" data-stream-muted ${pref.muted?'checked':''} ${available?'':'disabled'}></label><label class="stream-range"><span>Volume du stream <output data-stream-volume-label>${pref.volume} %</output></span><input type="range" data-stream-volume min="0" max="200" step="1" value="${pref.volume}" aria-label="Volume du stream" ${available?'':'disabled'}></label>${available?'':`<p class="stream-menu-note">${item.local?'Ton propre partage n’est pas réécouté.':'Ce partage ne transmet pas de son.'}</p>`}`:''}<div class="stream-menu-divider"></div><button type="button" data-stream-pip ${document.pictureInPictureEnabled?'':'disabled'}>${mediaIcons.pip}Ouvrir en lecteur réduit</button>${screen?`<div class="stream-menu-divider"></div><label class="stream-check"><span>Atténuation du stream<small>Réduit le son du partage lorsque les personnes du vocal parlent.</small></span><input type="checkbox" data-stream-attenuation ${pref.attenuation?'checked':''}></label><label class="stream-range"><span>Force d’atténuation <output data-stream-strength-label>${pref.strength} %</output></span><input type="range" data-stream-strength min="0" max="100" step="1" value="${pref.strength}" aria-label="Force d’atténuation" ${pref.attenuation?'':'disabled'}></label>`:''}<div class="stream-menu-divider"></div><details><summary>Plus d’options <span aria-hidden="true">›</span></summary><button type="button" data-stream-fullscreen>${mediaIcons.fullscreen}${document.fullscreenElement===tile?'Quitter le plein écran':'Plein écran'}</button>${screen?'<button type="button" data-stream-reset>Réinitialiser le son du stream</button>':''}</details><p class="stream-menu-note">Réglages d’écoute personnels.</p>`;
  const parent=document.fullscreenElement===tile?tile:document.body;parent.append(menu);this.element=menu;
  const place=()=>{const r=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-r.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-r.height-8))+'px';};place();menu.querySelector('details').ontoggle=place;
  const update=patch=>{try{voice.setStreamAudio(item.participantId,patch);const p=voice.streamAudio(item.participantId);for(const key of ['volume','strength']){const input=menu.querySelector('[data-stream-'+key+']');if(input)input.value=p[key];const label=menu.querySelector('[data-stream-'+key+'-label]');if(label)label.value=p[key]+' %';}const muted=menu.querySelector('[data-stream-muted]'),attenuation=menu.querySelector('[data-stream-attenuation]');if(muted)muted.checked=p.muted;if(attenuation)attenuation.checked=p.attenuation;const strength=menu.querySelector('[data-stream-strength]');if(strength)strength.disabled=!p.attenuation;}catch(error){run(()=>{throw error;});}};
  for(const key of ['volume','strength']){const input=menu.querySelector('[data-stream-'+key+']');if(input)input.oninput=()=>update({[key]:Number(input.value)});}
  for(const key of ['muted','attenuation']){const input=menu.querySelector('[data-stream-'+key+']');if(input)input.onchange=()=>update({[key]:input.checked});}
  menu.querySelector('[data-stream-reset]')?.addEventListener('click',()=>update({volume:100,muted:false,attenuation:true,strength:50}));
  for(const [selector,action]of [['stop',()=>voice.watchMedia(null)],['pip',pip],['fullscreen',fullscreen]])menu.querySelector('[data-stream-'+selector+']').onclick=()=>{this.close();run(action);};
  menu.querySelector('button').focus();
 }
}
