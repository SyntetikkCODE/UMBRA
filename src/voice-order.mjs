export class VoiceOrder{
 constructor(key,storage=globalThis.localStorage){this.key=key;this.storage=storage;}
 ids(){try{const values=JSON.parse(this.storage.getItem('hexagone-voice-order:'+this.key())||'[]');return Array.isArray(values)?[...new Set(values.filter(v=>typeof v==='string'))].slice(0,100):[];}catch{return [];}}
 ordered(squads){const ids=this.ids(),rank=new Map(ids.map((id,i)=>[id,i]));return [...squads].sort((a,b)=>(rank.get(a.id)??1000)-(rank.get(b.id)??1000));}
 move(squads,id,target,after=false){if(id===target||!squads.some(q=>q.id===id)||!squads.some(q=>q.id===target))return;const ids=this.ordered(squads).map(q=>q.id).filter(v=>v!==id),at=ids.indexOf(target);ids.splice(at+(after?1:0),0,id);this.storage.setItem('hexagone-voice-order:'+this.key(),JSON.stringify(ids));}
}
