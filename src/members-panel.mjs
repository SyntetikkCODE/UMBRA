export const MEMBER_GRADES=[['admin','Admins'],['commander','Commandants'],['squadLeader','Squad leaders'],['member','Membres']];
export function memberGroups(players,{onlineIds=[],selfId,shared=true,connected=true}={}){
 const online=new Set(onlineIds);online.add(selfId);const unknown=shared&&!connected;
 const sections=(unknown?['unknown']:['online','offline']).map(status=>({status,groups:MEMBER_GRADES.map(([id,label])=>({id,label,players:[]}))}));
 for(const p of players){const status=unknown?'unknown':online.has(p.id)?'online':'offline',grade=MEMBER_GRADES.find(([id])=>p[id])?.[0]||'member';sections.find(s=>s.status===status).groups.find(g=>g.id===grade).players.push(p);}
 for(const section of sections){section.groups=section.groups.filter(g=>g.players.length);for(const group of section.groups)group.players.sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'})||a.id.localeCompare(b.id));section.count=section.groups.reduce((n,g)=>n+g.players.length,0);}
 return sections.filter(s=>s.count);
}
export class MembersPreferences{
 constructor(scope,storage=globalThis.localStorage){this.scope=scope;this.storage=storage;this.values=new Map();}
 key(){return 'hexagone-members-panel:'+this.scope();}
 read(){const key=this.key();if(this.values.has(key))return this.values.get(key);let value={open:false,collapsed:[]};try{const p=JSON.parse(this.storage.getItem(key)||'{}');value={open:p?.open===true,collapsed:Array.isArray(p?.collapsed)?p.collapsed.filter(v=>typeof v==='string').slice(0,16):[]};}catch{}this.values.set(key,value);return value;}
 write(value){this.values.set(this.key(),value);try{this.storage.setItem(this.key(),JSON.stringify(value));}catch{}}
 toggle(){const p=this.read();p.open=!p.open;this.write(p);return p.open;}
 collapse(key,value){const p=this.read();p.collapsed=p.collapsed.filter(k=>k!==key);if(value)p.collapsed.push(key);this.write(p);}
}
