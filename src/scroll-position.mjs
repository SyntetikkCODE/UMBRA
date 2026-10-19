// Preserve reading positions when synchronized data replaces a view.
export function readScroll(element,{followBottom=false,anchorAttribute=null}={}){
 const position={top:element.scrollTop,left:element.scrollLeft,bottom:followBottom&&element.scrollHeight-element.clientHeight-element.scrollTop<60};
 if(anchorAttribute&&!position.bottom){const top=element.getBoundingClientRect().top;const row=[...element.querySelectorAll('['+anchorAttribute+']')].find(row=>row.getBoundingClientRect().bottom>top);if(row){position.anchor=row.getAttribute(anchorAttribute);position.offset=row.getBoundingClientRect().top-top;position.attribute=anchorAttribute;}}
 return position;
}
export function restoreScroll(element,position){
 if(!position)return;
 element.scrollLeft=position.left;
 if(position.bottom){element.scrollTop=element.scrollHeight;return;}
 element.scrollTop=position.top;
 if(position.anchor){const row=[...element.querySelectorAll('['+position.attribute+']')].find(row=>row.getAttribute(position.attribute)===position.anchor);if(row)element.scrollTop+=row.getBoundingClientRect().top-element.getBoundingClientRect().top-position.offset;}
}
export class ScrollPositions {
 constructor(){this.positions=new Map();}
 capture(root){for(const element of root.querySelectorAll('[data-scroll-key]'))this.positions.set(element.dataset.scrollKey,readScroll(element,{anchorAttribute:element.dataset.scrollAnchorAttribute}));}
 restore(root){for(const element of root.querySelectorAll('[data-scroll-key]'))restoreScroll(element,this.positions.get(element.dataset.scrollKey));}
 clear(){this.positions.clear();}
}
