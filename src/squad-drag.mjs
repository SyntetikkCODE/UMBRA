export class SquadDrag{
 constructor(options){this.options=options;this.drag=null;
  document.addEventListener('dragstart',e=>{const row=e.target.closest('.rail-squad[data-id],.squad-card[data-squad]');if(!row)return;const rail=row.matches('.rail-squad'),id=rail?row.dataset.id:row.dataset.squad;if(!rail&&!this.options.admin())return;this.drag={id,rail};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData(rail?'application/x-hexagone-voice-order':'application/x-hexagone-squad',id);row.classList.add('is-squad-dragging');});
  document.addEventListener('dragover',e=>{const target=this.target(e);this.clear();if(!target)return;e.preventDefault();e.dataTransfer.dropEffect='move';target.classList.add(this.drag.rail?'voice-order-target':'operation-drop-target');});
  document.addEventListener('drop',async e=>{const target=this.target(e),drag=this.drag;this.drag=null;this.clear();if(!target||!drag)return;e.preventDefault();e.stopImmediatePropagation();try{if(drag.rail){const r=target.getBoundingClientRect();this.options.reorder(drag.id,target.dataset.id,e.clientY>r.top+r.height/2);}else await this.options.assign(drag.id,target.dataset.operationGroup||null);}catch(error){this.options.error(error);}});
  document.addEventListener('dragend',()=>{this.drag=null;this.clear();});
 }
 target(e){if(!this.drag)return null;if(this.drag.rail){const row=e.target.closest('.rail-squad[data-id]');return row&&row.dataset.id!==this.drag.id&&this.options.group(row.dataset.id)===this.options.group(this.drag.id)?row:null;}if(!this.options.admin())return null;const group=e.target.closest('[data-operation-group],.free-squads');return group&&this.options.group(this.drag.id)!==(group.dataset.operationGroup||null)?group:null;}
 clear(){document.querySelectorAll('.voice-order-target,.operation-drop-target,.is-squad-dragging').forEach(el=>el.classList.remove('voice-order-target','operation-drop-target','is-squad-dragging'));}
}
