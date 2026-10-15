export class VoiceSounds {
 constructor(){this.elements=new Map();this.settings={};this.deafened=false;this.queue=Promise.resolve();this.error='';this.generation=0;}
 configure(settings,deafened=false){
  this.settings=settings;this.deafened=deafened;
  for(const el of this.elements.values()){el.volume=this.volume;if(!this.volume)el.pause();}
 }
 get volume(){return this.deafened||this.settings.notificationSounds===false?0:(this.settings.outputVolume??100)/100*(this.settings.soundsVolume??35)/100;}
 play(kind){
  const generation=this.generation;
  const task=this.queue.catch(()=>{}).then(async()=>{
   if(!this.volume||generation!==this.generation)return;this.error='';
   let el=this.elements.get(kind);
   if(!el){el=new Audio(new URL('../assets/sounds/'+kind+'.wav',import.meta.url).href);el.dataset.voiceSound=kind;el.hidden=true;el.preload='auto';document.body.append(el);this.elements.set(kind,el);}
   el.volume=this.volume;
   if(el.setSinkId&&el.sinkId!==(this.settings.output||''))await el.setSinkId(this.settings.output||'');
   if(!this.volume||generation!==this.generation)return;el.currentTime=0;await el.play();
  }).catch(e=>{this.error='Lecture du son de notification impossible : '+e.message;});
  this.queue=task;return task;
 }
 stop(){this.generation++;for(const el of this.elements.values())el.pause();}
}
