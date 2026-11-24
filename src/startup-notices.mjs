import {StartupHistory} from './startup-history.mjs';
import {RELEASE_NOTES,releaseNotesListHtml} from './release-notes.mjs';
export class StartupNotices{
 constructor({blocked=()=>false,openOverlay}){this.blocked=blocked;this.openOverlay=openOverlay;this.queue=[];document.addEventListener('close',()=>queueMicrotask(()=>this.showNext()),true);}
 prepare(scope,version,existing){this.cancel();this.history=new StartupHistory(scope);this.version=version;this.queue=[];const plan=this.history.plan(version,RELEASE_NOTES,{existing});if(plan.releases.length)this.queue.push({kind:'updates',releases:plan.releases});else this.history.seenVersion(version);if(plan.overlay)this.queue.push({kind:'overlay'});}
 ready(){this.enabled=true;this.showNext();}
 cancel(){this.enabled=false;this.queue=[];if(this.dialog){this.dialog.onclose=null;this.dialog.close();this.dialog.remove();this.dialog=null;}}
 showNext(){
  if(!this.enabled||this.dialog||this.blocked())return;const item=this.queue.shift();if(!item)return;
  const dialog=document.createElement('dialog');dialog.id='startup-notice';dialog.className='startup-notice';dialog.dataset.notice=item.kind;dialog.setAttribute('aria-labelledby','startup-notice-title');
  const updates=item.kind==='updates';
  dialog.innerHTML=`<header class="startup-notice-head"><div><span class="startup-eyebrow">HEXAGONE</span><h2 id="startup-notice-title">${updates?'Quoi de neuf ?':'L’overlay vocal est disponible'}</h2></div><button type="button" data-startup-close aria-label="Fermer">×</button></header><div class="startup-notice-body">${updates?`<p class="startup-summary">${item.releases.length===1?'Une mise à jour à découvrir.':item.releases.length+' mises à jour à découvrir.'}</p><div class="patchnotes startup-changelog">${releaseNotesListHtml(item.releases,{openAll:true,idPrefix:'startup-'})}</div>`:'<div class="overlay-intro-visual" aria-hidden="true"><span>TON SALON</span><div><i></i><strong>Toi</strong></div><div class="intro-speaking"><i></i><strong>Un coéquipier</strong></div></div><p class="overlay-intro-copy">Vois les joueurs de ton vocal et qui parle, directement au-dessus du jeu.</p><p class="overlay-intro-note">Choisis un coin et un écran dans les réglages. L’activation reste à ton choix.</p>'}</div><footer class="startup-notice-foot">${updates?'<button type="button" class="btn gold" data-startup-close autofocus>Continuer</button>':'<button type="button" class="btn ghost" data-startup-close>Plus tard</button><button type="button" class="btn gold" data-startup-overlay autofocus>Ouvrir les réglages de l’overlay</button>'}</footer>`;
  let navigate=false;dialog.onclick=e=>{if(e.target.closest('[data-startup-overlay]')){navigate=true;dialog.close();}else if(e.target.closest('[data-startup-close]'))dialog.close();};
  dialog.onclose=()=>{dialog.remove();if(this.dialog!==dialog)return;this.dialog=null;if(navigate)this.openOverlay();queueMicrotask(()=>this.showNext());};
  document.body.append(dialog);this.dialog=dialog;dialog.showModal();if(updates)this.history.seenVersion(this.version);else this.history.seenOverlay();
 }
}
