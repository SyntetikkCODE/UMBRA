import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {membership} from '../src/model.mjs';
import {formatMessage,EMOJIS} from '../src/message-format.mjs';
import {MAX_MEDIA,mediaType,writeMedia,removeMedia} from './chat-media.mjs';
const MAX_HISTORY=500;
const REACTION_EMOJIS=new Set(Object.values(EMOJIS).flat());
export class ChatStore {
 constructor(directory){this.file=path.join(directory,'text-channels.json');this.mediaDirectory=path.join(directory,'chat-media');this.db={version:1,channels:[],messages:{},attachments:{},sequence:0};this.queue=Promise.resolve();this.limits=new Map();}
 async open(){try{const db=JSON.parse(await fs.readFile(this.file,'utf8'));if(db.version!==1||!Array.isArray(db.channels)||!db.messages||typeof db.messages!=='object'||!Number.isSafeInteger(db.sequence))throw new Error('Format invalide');db.attachments||={};this.db=db;}catch(e){if(e.code!=='ENOENT')throw new Error('Les données textuelles sont illisibles ; fichier conservé.');}}
 serialized(fn){const task=this.queue.then(fn);this.queue=task.catch(()=>{});return task;}
 async commit(db){await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file+'.tmp',JSON.stringify(db),{encoding:'utf8',mode:0o600});await fs.rename(this.file+'.tmp',this.file);this.db=db;}
 channels(state,userId){
  const user=state.players.find(p=>p.id===userId);if(!user)throw new Error('Compte introuvable.');
  const all=[{id:'general',name:'général',description:'Discussions de la team.',scope:'team'},
   {id:'announcements',name:'annonces',description:'Informations du commandement.',scope:'team',announcements:true},
   ...state.squads.map(q=>({id:'squad:'+q.id,name:q.name,description:'Salon des membres de '+q.name+'.',scope:'squad',squadId:q.id})),...this.db.channels];
  return all.filter(c=>c.scope==='team'||state.squads.some(q=>q.id===c.squadId)&&(user.admin||membership(state,userId)?.id===c.squadId)).map(c=>({...c,...(this.db.channelOverrides?.[c.id]||{}),canWrite:!!(!c.announcements||user.admin||user.commander),canDelete:!!c.custom&&user.admin,canEdit:user.admin,canDuplicate:user.admin}));
 }
 channel(state,userId,id){const c=this.channels(state,userId).find(c=>c.id===id);if(!c)throw new Error('Salon inaccessible.');return c;}
 decorate(message){const parent=message.replyToId?(this.db.messages[message.channelId]||[]).find(m=>m.id===message.replyToId):null;return {...message,...(message.replyToId?{reply:parent?{id:parent.id,authorId:parent.authorId,text:parent.text.slice(0,180)}:{id:message.replyToId,deleted:true}}:{})};}
 getMessage(state,userId,channelId,messageId){this.channel(state,userId,channelId);const message=(this.db.messages[channelId]||[]).find(m=>m.id===messageId);if(!message)throw new Error('Message introuvable.');return this.decorate(message);}
 pins(state,userId,id){this.channel(state,userId,id);return {messages:(this.db.messages[id]||[]).filter(m=>m.pinned).map(m=>this.decorate(m))};}
 list(state,userId,id,before){this.channel(state,userId,id);if(before!==undefined&&(!Number.isSafeInteger(before)||before<1))throw new Error('Page de messages invalide.');const messages=(this.db.messages[id]||[]).filter(m=>!before||m.sequence<before),page=messages.slice(-50);return {messages:page.map(m=>this.decorate(m)),hasMore:messages.length>page.length};}
 mutate(getState,userId,kind,{channelId,messageId,emoji,active}={}){return this.serialized(async()=>{
  const state=getState(),c=this.channel(state,userId,channelId),user=state.players.find(p=>p.id===userId),db=structuredClone(this.db),rows=db.messages[channelId]||[],message=rows.find(m=>m.id===messageId);if(!message)throw new Error('Message introuvable.');
  const key='message:'+userId,now=Date.now(),times=(this.limits.get(key)||[]).filter(t=>now-t<10000);if(times.length>=30)throw new Error('Attends quelques secondes avant de modifier un message.');
  let files=[];
  if(kind==='delete'){if(!user.admin)throw new Error('Suppression de message réservée aux admins.');db.messages[channelId]=rows.filter(m=>m.id!==messageId);files=(message.attachments||[]).map(a=>a.id);for(const id of files)delete db.attachments[id];}
  else if(kind==='pin'){if(!c.canWrite)throw new Error('Salon en lecture seule.');if(typeof active!=='boolean')throw new Error('Épinglage invalide.');if(active&&!message.pinned&&rows.filter(m=>m.pinned).length>=30)throw new Error('Limite de 30 messages épinglés dans ce salon.');message.pinned=active;}
  else if(kind==='react'){if(!REACTION_EMOJIS.has(emoji)||typeof active!=='boolean')throw new Error('Réaction invalide.');message.reactions||=[];let reaction=message.reactions.find(r=>r.emoji===emoji);if(active){if(!reaction){if(message.reactions.length>=20)throw new Error('Limite de 20 réactions différentes sur ce message.');reaction={emoji,userIds:[]};message.reactions.push(reaction);}if(!reaction.userIds.includes(userId))reaction.userIds.push(userId);}else if(reaction){reaction.userIds=reaction.userIds.filter(id=>id!==userId);if(!reaction.userIds.length)message.reactions=message.reactions.filter(r=>r!==reaction);}}
  else throw new Error('Action de message invalide.');
  if(kind!=='delete')message.version=(message.version||0)+1;await this.commit(db);await removeMedia(this.mediaDirectory,files);this.limits.set(key,[...times,now]);return kind==='delete'?{deleted:true,messageId,channelId}:{message:this.decorate(message),channelId};
 });}
 create(getState,userId,{name,description='',scope='team',squadId}={}){return this.serialized(async()=>{
  const state=getState(),user=state.players.find(p=>p.id===userId);if(!user?.admin)throw new Error('Création de salon réservée aux admins.');
  if(typeof name!=='string'||!name.trim()||name.length>40||typeof description!=='string'||description.length>200||!['team','squad'].includes(scope)||scope==='squad'&&!state.squads.some(q=>q.id===squadId))throw new Error('Salon invalide.');
  if(this.db.channels.length>=30)throw new Error('Limite de 30 salons personnalisés atteinte.');
  const channel={id:'text:'+randomUUID(),name:name.trim(),description:description.trim(),scope,squadId:scope==='squad'?squadId:null,custom:true},db=structuredClone(this.db);db.channels.push(channel);await this.commit(db);return channel;
 });}
 update(getState,userId,{channelId,name,description,scope,squadId,announcements}={}){return this.serialized(async()=>{
  const state=getState(),c=this.channel(state,userId,channelId);if(!c.canEdit)throw new Error('Modification de salon réservée aux admins.');
  if(typeof name!=='string'||!name.trim()||name.length>40||typeof description!=='string'||description.length>200)throw new Error('Nom ou description invalide.');
  const db=structuredClone(this.db),values={name:name.trim(),description:description.trim()};
  if(c.custom){
   scope??=c.scope;squadId??=c.squadId;announcements??=!!c.announcements;
   if(!['team','squad'].includes(scope)||scope==='squad'&&!state.squads.some(q=>q.id===squadId)||typeof announcements!=='boolean')throw new Error('Accès du salon invalide.');
   const stored=db.channels.find(channel=>channel.id===channelId);Object.assign(stored,values,{scope,squadId:scope==='squad'?squadId:null,announcements});
  }else{if(scope!==undefined&&scope!==c.scope||squadId!==undefined&&squadId!==c.squadId||announcements!==undefined&&announcements!==!!c.announcements)throw new Error('Les accès des salons automatiques restent liés à leur fonction.');db.channelOverrides||={};db.channelOverrides[channelId]=values;}
  await this.commit(db);return this.channel(getState(),userId,channelId);
 });}
 duplicate(getState,userId,channelId){return this.serialized(async()=>{
  const state=getState(),c=this.channel(state,userId,channelId);if(!c.canDuplicate)throw new Error('Duplication de salon réservée aux admins.');
  if(this.db.channels.length>=30)throw new Error('Limite de 30 salons personnalisés atteinte.');
  const names=new Set(this.channels(state,userId).map(c=>c.name.toLocaleLowerCase())),base=c.name.slice(0,28);let name=base+' · copie',number=2;while(names.has(name.toLocaleLowerCase()))name=base+' · copie '+number++;
  const channel={id:'text:'+randomUUID(),name,description:c.description,scope:c.scope,squadId:c.squadId||null,announcements:!!c.announcements,custom:true},db=structuredClone(this.db);db.channels.push(channel);await this.commit(db);return this.channel(getState(),userId,channel.id);
 });}
 remove(getState,userId,id){return this.serialized(async()=>{const state=getState(),c=this.channel(state,userId,id);if(!c.canDelete)throw new Error('Suppression réservée aux admins, pour les salons personnalisés.');const db=structuredClone(this.db),files=Object.values(db.attachments).filter(a=>a.channelId===id).map(a=>a.id);db.channels=db.channels.filter(c=>c.id!==id);delete db.messages[id];for(const file of files)delete db.attachments[file];await this.commit(db);await removeMedia(this.mediaDirectory,files);return {ok:true};});}
 upload(getState,userId,{channelId,name},bytes){return this.serialized(async()=>{
  const c=this.channel(getState(),userId,channelId);if(!c.canWrite)throw new Error('Salon en lecture seule.');
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_MEDIA)throw new Error('Limite de 25 Mo par fichier.');
  const type=mediaType(bytes),db=structuredClone(this.db),expired=Object.values(db.attachments).filter(a=>!a.messageId&&Date.now()-Date.parse(a.createdAt)>86400000).map(a=>a.id);
  for(const id of expired)delete db.attachments[id];
  if(Object.values(db.attachments).filter(a=>a.authorId===userId&&!a.messageId).length>=10)throw new Error('Trop de pièces jointes en attente. Envoie ton message ou retire les fichiers.');
  if(Object.values(db.attachments).reduce((sum,a)=>sum+a.size,0)+bytes.length>5*1024**3)throw new Error('Stockage des médias plein. Contacte un admin.');
  const attachment={id:randomUUID(),channelId,authorId:userId,name:String(name||'média').replace(/[\x00-\x1f/\\]/g,'_').slice(0,140),type,size:bytes.length,createdAt:new Date().toISOString()};
  await writeMedia(this.mediaDirectory,attachment.id,bytes);db.attachments[attachment.id]=attachment;
  try{await this.commit(db);}catch(e){await removeMedia(this.mediaDirectory,[attachment.id]);throw e;}await removeMedia(this.mediaDirectory,expired);return attachment;
 });}
 async attachment(getState,userId,id){const a=this.db.attachments[id];if(!a)throw new Error('Pièce jointe introuvable.');this.channel(getState(),userId,a.channelId);if(!a.messageId&&a.authorId!==userId)throw new Error('Pièce jointe non publiée.');const bytes=await fs.readFile(path.join(this.mediaDirectory,a.id));this.channel(getState(),userId,a.channelId);return {attachment:a,bytes};}
 discard(getState,userId,id){return this.serialized(async()=>{const a=this.db.attachments[id];if(!a)return {ok:true};this.channel(getState(),userId,a.channelId);if(a.authorId!==userId||a.messageId)throw new Error('Pièce jointe déjà publiée ou inaccessible.');const db=structuredClone(this.db);delete db.attachments[id];await this.commit(db);await removeMedia(this.mediaDirectory,[id]);return {ok:true};});}
 send(getState,userId,{channelId,text='',attachments=[],replyToId}={}){return this.serialized(async()=>{
  const state=getState(),c=this.channel(state,userId,channelId);if(!c.canWrite)throw new Error('Seul le commandement ou un admin peut écrire dans les annonces.');
  if(typeof text!=='string'||text.length>2000||text.includes('\0')||!Array.isArray(attachments)||attachments.length>4||new Set(attachments).size!==attachments.length||!text.trim()&&!attachments.length)throw new Error('Message invalide (2 000 caractères, 4 pièces jointes maximum).');
  const parent=replyToId?(this.db.messages[channelId]||[]).find(m=>m.id===replyToId):null;if(replyToId&&!parent)throw new Error('Le message auquel tu réponds a été supprimé.');
  const files=attachments.map(id=>{const a=this.db.attachments[id];if(!a||a.authorId!==userId||a.channelId!==channelId||a.messageId)throw new Error('Pièce jointe inaccessible.');return a;});
  const now=Date.now(),times=(this.limits.get(userId)||[]).filter(t=>now-t<10000);if(times.length>=8)throw new Error('Attends quelques secondes avant de renvoyer un message.');
  const db=structuredClone(this.db),format=formatMessage(text,state.players),visible=new Set(state.players.filter(p=>this.channels(state,p.id).some(c=>c.id===channelId)).map(p=>p.id)),message={id:randomUUID(),sequence:++db.sequence,channelId,authorId:userId,text:text.trim(),createdAt:new Date(now).toISOString(),mentions:format.mentions.filter(id=>visible.has(id)),everyone:format.everyone,attachments:files.map(({id,name,type,size})=>({id,name,type,size}))};
  for(const file of files)db.attachments[file.id].messageId=message.id;
  if(parent){message.replyToId=parent.id;if(parent.authorId!==userId&&visible.has(parent.authorId)&&!message.mentions.includes(parent.authorId))message.mentions.push(parent.authorId);}
  const rows=db.messages[channelId]||[],all=[...rows,message],recent=new Set(all.filter(m=>!m.pinned).slice(-MAX_HISTORY).map(m=>m.id)),retained=all.filter(m=>m.pinned||recent.has(m.id)),dropped=all.filter(m=>!m.pinned&&!recent.has(m.id)).flatMap(m=>(m.attachments||[]).map(a=>a.id));
  db.messages[channelId]=retained;for(const id of dropped)delete db.attachments[id];await this.commit(db);await removeMedia(this.mediaDirectory,dropped);this.limits.set(userId,[...times,now]);return this.decorate(message);
 });}
}
