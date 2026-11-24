export class ChannelDrag{
 constructor(options){this.options=options;this.drag=null;
  document.addEventListener('dragstart',e=>{const row=e.target.closest('.rail-text[data-chat-select]');if(!row)return;this.drag=row.dataset.chatSelect;this.source=row;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-hexagone-text-order',this.drag);row.classList.add('is-channel-dragging');});
  document.addEventListener('dragover',e=>{if(!this.drag)return;const row=e.target.closest('.rail-text[data-chat-select]');if(!row||row.dataset.chatSelect===this.drag||this.options.pinned(row.dataset.chatSelect)!==this.options.pinned(this.drag)){this.clearTarget();return;}e.preventDefault();e.dataTransfer.dropEffect='move';const r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;if(this.target!==row||this.after!==after){this.clearTarget();this.target=row;this.after=after;row.classList.add('order-target',after?'order-after':'order-before');}});
  document.addEventListener('drop',e=>{if(!this.drag)return;const row=e.target.closest('.rail-text[data-chat-select]'),id=this.drag,after=this.after,valid=row&&row===this.target;this.clear();if(!valid)return;e.preventDefault();e.stopImmediatePropagation();try{this.options.reorder(id,row.dataset.chatSelect,after);}catch(error){this.options.error(error);}});
  document.addEventListener('dragend',()=>this.clear());
 }
 clearTarget(){this.target?.classList.remove('order-target','order-after','order-before');this.target=null;}
 clear(){this.clearTarget();this.source?.classList.remove('is-channel-dragging');this.source=null;this.drag=null;}
}
