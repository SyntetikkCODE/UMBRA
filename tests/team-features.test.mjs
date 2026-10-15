import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Accounts} from '../src/accounts.mjs';
import {ChatStore} from '../server/chat.mjs';
import {leaderAccess} from '../src/model.mjs';
import {voiceState,voiceIndicator} from '../src/voice-state.mjs';
import {startApi} from '../server/api.mjs';
const dir=()=>fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/team-features-'));
test('Squad leader is an admin-assigned permanent grade; profile editing cannot grant it and it grants no leaders access',async()=>{
 const a=new Accounts(await dir());await a.open();const admin=await a.register({name:'Admin',password:'password-123'}),member=await a.register({name:'Member',password:'password-456'}),id=member.state.currentUserId;
 await assert.rejects(()=>a.action({type:'rights',playerId:id,admin:false,commander:false,squadLeader:true},id),/admins/);
 await a.action({type:'profile',name:'Member',squadLeader:true},id);assert.equal(a.session(id).state.players.find(p=>p.id===id).squadLeader,false);
 await a.action({type:'rights',playerId:id,admin:false,commander:false,squadLeader:true},admin.state.currentUserId);assert.equal(a.session(id).state.players.find(p=>p.id===id).squadLeader,true);assert.equal(!!leaderAccess(a.session(id).state,id),false);
 const reopened=new Accounts(path.dirname(a.file));await reopened.open();assert.equal(reopened.session(id).state.players.find(p=>p.id===id).squadLeader,true);
});
test('Password recovery is admin-only, hashed, expiring, single-use; resetting preserves profile and grade',async()=>{
 const a=new Accounts(await dir());await a.open();const admin=await a.register({name:'Admin',password:'password-123'}),member=await a.register({name:'Member',password:'password-456'}),id=member.state.currentUserId;
 await assert.rejects(()=>a.beginPasswordReset(id,id),/administrateurs/);const code=await a.beginPasswordReset(id,admin.state.currentUserId);assert.ok(!(await fs.readFile(a.file,'utf8')).includes(code.code));await assert.rejects(()=>a.resetPassword({name:'Member',code:'wrong',password:'new-password'}),/invalide/);await assert.rejects(()=>a.resetPassword({name:'Member',code:code.code,password:'short'}),/8 à 128/);
 await a.resetPassword({name:'Member',code:code.code,password:'new-password'});await assert.rejects(()=>a.login({name:'Member',password:'password-456'}),/incorrect/);assert.equal((await a.login({name:'Member',password:'new-password'})).state.currentUserId,id);await assert.rejects(()=>a.resetPassword({name:'Member',code:code.code,password:'other-password'}),/invalide/);
 const expired=await a.beginPasswordReset(id,admin.state.currentUserId);a.db.accounts.find(p=>p.id===id).resetExpires=Date.now()-1;await assert.rejects(()=>a.resetPassword({name:'Member',code:expired.code,password:'other-password'}),/expiré/);
});
test('A password reset invalidates remembered sessions across server restarts and keeps ordinary profiles intact',async()=>{
 const dataDir=await dir(),config={dataDir,port:0,apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test'},api=await startApi(config);let next;
 const request=(base,route,body,token)=>fetch(base+'/'+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 try{const base='http://127.0.0.1:'+api.port,admin=await (await request(base,'auth/register',{name:'Admin',password:'password-123',joinCode:'test'})).json(),member=await (await request(base,'auth/register',{name:'Member',password:'password-456',joinCode:'test',remember:true})).json();const reset=await (await request(base,'admin/password-reset',{playerId:member.state.currentUserId},admin.token)).json();assert.equal((await request(base,'admin/password-reset',{playerId:admin.state.currentUserId},member.token)).status,400);assert.equal((await request(base,'auth/reset',{name:'Member',code:reset.code,password:'new-password'})).status,200);assert.equal((await request(base,'state',undefined,member.token)).status,401);await api.close();next=await startApi(config);assert.equal((await request('http://127.0.0.1:'+next.port,'state',undefined,member.token)).status,401);}finally{if(next)await next.close();else await api.close();}
});
test('Manual mute/deafen has priority over talking; absence of an active voice clears old flags',()=>{
 assert.equal(voiceIndicator({connected:true,muted:true},true),'muted');assert.equal(voiceIndicator({connected:true,muted:true,deafened:true},true),'deafened');assert.equal(voiceIndicator({connected:true},true),'speaking');assert.equal(voiceIndicator({connected:false,muted:true,deafened:true}),'idle');assert.deepEqual(voiceState({connected:true,deafened:true,userId:'forged'}),{connected:true,muted:true,deafened:true});
});
test('Replies, reactions and pins persist privately; delete is admin-only and removes media, references and pins',async()=>{
 const folder=await dir(),chat=new ChatStore(folder);await chat.open();const s={players:[{id:'a',name:'Admin',admin:true},{id:'b',name:'Member',admin:false},{id:'c',name:'Outside',admin:false}],squads:[{id:'one',name:'Alpha',slots:[{playerId:'a'},{playerId:'b'}]}]},get=()=>s,id='squad:one';
 const bytes=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082','hex'),file=await chat.upload(get,'a',{channelId:id,name:'test.png'},bytes),m=await chat.send(get,'a',{channelId:id,text:'Ordre',attachments:[file.id]}),reply=await chat.send(get,'b',{channelId:id,text:'Reçu',replyToId:m.id});assert.equal(reply.reply.text,'Ordre');assert.deepEqual(reply.mentions,['a']);
 await chat.mutate(get,'b','react',{channelId:id,messageId:m.id,emoji:'👍',active:true});await chat.mutate(get,'b','react',{channelId:id,messageId:m.id,emoji:'👍',active:true});assert.equal(chat.getMessage(s,'b',id,m.id).reactions[0].userIds.length,1);await chat.mutate(get,'b','pin',{channelId:id,messageId:m.id,active:true});const reopened=new ChatStore(folder);await reopened.open();assert.equal(reopened.pins(s,'a',id).messages[0].id,m.id);assert.throws(()=>reopened.pins(s,'c',id),/inaccessible/);
 await assert.rejects(()=>chat.mutate(get,'b','delete',{channelId:id,messageId:m.id}),/admins/);await assert.rejects(()=>chat.mutate(get,'c','react',{channelId:id,messageId:m.id,emoji:'👍',active:true}),/inaccessible/);await assert.rejects(()=>chat.mutate(get,'b','react',{channelId:id,messageId:m.id,emoji:'<img>',active:true}),/invalide/);
 await chat.mutate(get,'a','delete',{channelId:id,messageId:m.id});assert.equal(chat.pins(s,'a',id).messages.length,0);assert.equal(chat.getMessage(s,'b',id,reply.id).reply.deleted,true);assert.ok(!chat.db.attachments[file.id]);await assert.rejects(()=>chat.attachment(get,'b',file.id),/introuvable/);await assert.rejects(()=>fs.stat(path.join(chat.mediaDirectory,file.id)),{code:'ENOENT'});
});
test('Pinned messages survive history pruning; reactions remain available in announcements but pinning respects write rights',async()=>{
 const chat=new ChatStore(await dir());await chat.open();const s={players:[{id:'a',name:'Admin',admin:true},{id:'b',name:'Member',admin:false}],squads:[]},get=()=>s;
 const pinned=await chat.send(get,'a',{channelId:'general',text:'Pinned instruction'});await chat.mutate(get,'b','pin',{channelId:'general',messageId:pinned.id,active:true});
 chat.db.messages.general.push(...Array.from({length:500},(_,i)=>({id:'old-'+i,channelId:'general',authorId:'a',sequence:i+2,text:'Archived text',createdAt:new Date().toISOString(),attachments:[]})));chat.db.sequence=501;chat.limits.delete('a');await chat.send(get,'a',{channelId:'general',text:'Latest message'});assert.equal(chat.db.messages.general.length,501);assert.equal(chat.pins(s,'b','general').messages[0].id,pinned.id);assert.ok(!chat.db.messages.general.some(m=>m.id==='old-0'));
 const announcement=await chat.send(get,'a',{channelId:'announcements',text:'Announcement'});await chat.mutate(get,'b','react',{channelId:'announcements',messageId:announcement.id,emoji:'👍',active:true});await assert.rejects(()=>chat.mutate(get,'b','pin',{channelId:'announcements',messageId:announcement.id,active:true}),/lecture seule/);
});
test('Queued message deletion rechecks current admin rights at commit time',async()=>{
 const chat=new ChatStore(await dir());await chat.open();const s={players:[{id:'a',name:'Admin',admin:true}],squads:[]},get=()=>s,m=await chat.send(get,'a',{channelId:'general',text:'Keep me'});let release;chat.serialized(()=>new Promise(resolve=>release=resolve));await new Promise(r=>setImmediate(r));const pending=chat.mutate(get,'a','delete',{channelId:'general',messageId:m.id});s.players[0].admin=false;release();await assert.rejects(pending,/admins/);assert.equal(chat.getMessage(s,'a','general',m.id).text,'Keep me');
});
