import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
export const sessionKey=token=>createHash('sha256').update(typeof token==='string'?token:'').digest('hex');
export class Sessions{
 constructor(directory){this.file=path.join(directory,'remembered-sessions.json');this.values=new Map();this.queue=Promise.resolve();}
 async open(validId){
  try{const rows=JSON.parse(await fs.readFile(this.file,'utf8'));if(!Array.isArray(rows)||rows.length>300)throw new Error('Invalid sessions');for(const row of rows)if(/^[a-f0-9]{64}$/.test(row.key)&&validId(row.id)&&Number.isFinite(row.expires)&&row.expires>Date.now())this.values.set(row.key,{id:row.id,expires:row.expires,remember:true,passwordVersion:row.passwordVersion||0});}
  catch(error){if(error.code!=='ENOENT')throw new Error('Les sessions enregistrées sont illisibles. Le fichier a été conservé.');}
 }
 serialized(fn){const task=this.queue.then(fn);this.queue=task.catch(()=>{});return task;}
 async commit(){const rows=[...this.values].filter(([,v])=>v.remember&&v.expires>Date.now()).map(([key,v])=>({key,id:v.id,expires:v.expires,passwordVersion:v.passwordVersion||0}));await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file+'.tmp',JSON.stringify(rows),{mode:0o600});await fs.rename(this.file+'.tmp',this.file);}
 issue(id,remember=false,passwordVersion=0){return this.serialized(async()=>{
  const previous=new Map(this.values),token=randomBytes(32).toString('hex');
  for(const[key,value]of this.values)if(value.id===id)this.values.delete(key);
  this.values.set(sessionKey(token),{id,remember,passwordVersion,expires:Date.now()+(remember?30:1)*86400000});
  try{await this.commit();}catch(error){this.values=previous;throw error;}return token;
 });}
 identify(token){const session=this.values.get(sessionKey(token));if(!session||session.expires<=Date.now())throw new Error('Session expirée. Reconnecte-toi.');return session.id;}
 revoke(token){return this.serialized(async()=>{const key=sessionKey(token),previous=this.values.get(key);this.values.delete(key);try{await this.commit();}catch(error){if(previous)this.values.set(key,previous);throw error;}});}
 revokeUser(id){return this.serialized(async()=>{for(const[key,value]of this.values)if(value.id===id)this.values.delete(key);await this.commit();});}
 expire(){return this.serialized(async()=>{const expired=[...this.values].filter(([,v])=>v.expires<=Date.now());for(const[key]of expired)this.values.delete(key);if(expired.some(([,v])=>v.remember))await this.commit();return expired.map(([key])=>key);});}
}
