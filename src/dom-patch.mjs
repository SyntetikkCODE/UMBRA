// Compare against the last rendered template, not live DOM (voice, media and
// form controls also update themselves between renders).
const templates=new WeakMap();
const attributes=new WeakMap();
function key(node){
 if(node.nodeType!==1)return null;
 for(const attr of ['id','data-scroll-key','data-operation-group','data-operation','data-squad','data-rail-squad','data-chat-select','data-scroll-anchor','data-message','data-message-id','data-media-id','data-dom-key'])if(node.hasAttribute(attr))return attr+':'+node.getAttribute(attr);
 return null;
}
function remember(node){
 templates.set(node,node.nodeType===1?node.outerHTML:node.nodeValue);
 if(node.nodeType===1)attributes.set(node,new Map([...node.attributes].map(a=>[a.name,a.value])));
 for(const child of node.childNodes)remember(child);
}
function patch(node,next){
 const html=next.nodeType===1?next.outerHTML:next.nodeValue;
 if(templates.get(node)===html)return;
 if(next.nodeType!==1){if(node.nodeValue!==next.nodeValue)node.nodeValue=next.nodeValue;templates.set(node,html);return;}
 const before=attributes.get(node)||new Map([...node.attributes].map(a=>[a.name,a.value]));
 const after=new Map([...next.attributes].map(a=>[a.name,a.value]));
 for(const name of before.keys())if(!after.has(name))node.removeAttribute(name);
 for(const [name,value]of after)if(before.get(name)!==value)node.setAttribute(name,value);
 if(node.tagName==='INPUT'){
  if(before.get('value')!==after.get('value'))node.value=next.value;
  if(before.has('checked')!==after.has('checked'))node.checked=next.checked;
 }
 children(node,next);
 if(node.tagName==='TEXTAREA'&&templates.get(node)!==html&&node.defaultValue!==next.defaultValue){node.value=next.value;node.defaultValue=next.defaultValue;}
 attributes.set(node,after);templates.set(node,html);
}
function children(root,next){
 const old=[...root.childNodes],keyed=new Map(old.filter(n=>key(n)).map(n=>[key(n),n])),used=new Set();let cursor=root.firstChild;
 for(const wanted of next.childNodes){
  const id=key(wanted);let node=id?keyed.get(id):old.find(n=>!used.has(n)&&!key(n)&&n.nodeType===wanted.nodeType&&n.nodeName===wanted.nodeName);
  if(node&&(node.nodeType!==wanted.nodeType||node.nodeName!==wanted.nodeName))node=null;
  if(!node){node=wanted.cloneNode(true);remember(node);root.insertBefore(node,cursor);}
  else{if(node!==cursor)root.insertBefore(node,cursor);patch(node,wanted);}
  used.add(node);cursor=node.nextSibling;
 }
 for(const node of old)if(!used.has(node))node.remove();
}
export function patchHTML(root,html){
 if(!root)return;const next=document.createElement('template');next.innerHTML=html;children(root,next.content);
}
export function setText(node,text){if(node&&node.textContent!==String(text))node.textContent=String(text);}
export function animateReorder(root,change){
 const rows=root?[...root.querySelectorAll('.rail-squad[data-id],.rail-text[data-chat-select],.rail-person')]:[];
 const viewport=(root?.closest('#channel-rail')||root)?.getBoundingClientRect();const before=new Map(rows.map(n=>[n,n.getBoundingClientRect()]));const exiting=rows.filter(n=>n.matches('.rail-person')&&before.get(n).top>=Math.max(0,viewport.top)&&before.get(n).bottom<=Math.min(innerHeight,viewport.bottom)).map(n=>({node:n,copy:n.cloneNode(true),rect:before.get(n)}));change();
 if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 for(const {node,copy,rect}of exiting)if(!node.isConnected&&rect.width&&rect.height){for(const el of [copy,...copy.querySelectorAll('*')])for(const a of [...el.attributes])if(a.name==='id'||a.name.startsWith('data-')||a.name==='draggable')el.removeAttribute(a.name);copy.inert=true;copy.setAttribute('aria-hidden','true');Object.assign(copy.style,{position:'fixed',top:rect.top+'px',left:rect.left+'px',width:rect.width+'px',height:rect.height+'px',pointerEvents:'none',zIndex:20});document.body.append(copy);copy.animate([{opacity:.65},{opacity:0,transform:'translateY(-4px)'}],{duration:120,easing:'ease-out'}).finished.finally(()=>copy.remove());}
 for(const node of root?.querySelectorAll('.rail-squad[data-id],.rail-text[data-chat-select],.rail-person')||[]){const old=before.get(node),now=node.getBoundingClientRect();if(old){const dy=old.top-now.top;if(Math.abs(dy)>.5&&Math.abs(dy)<350)node.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:160,easing:'ease-out'});}else if(node.matches('.rail-person'))node.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:140,easing:'ease-out'});}
}
