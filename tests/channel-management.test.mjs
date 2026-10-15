import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ChatStore} from '../server/chat.mjs';
test('Channel management: rename preserves history, audience changes revoke access, duplicate preserves permissions without copying messages',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/channel-management-')),chat=new ChatStore(dir);await chat.open();
 const state={players:[{id:'a',name:'Admin',admin:true},{id:'b',name:'Member',admin:false},{id:'c',name:'Outside',admin:false}],squads:[{id:'one',name:'Squad',slots:[{playerId:'a'},{playerId:'b'}]}]},getState=()=>state;
 const channel=await chat.create(getState,'a',{name:'organisation'});await chat.send(getState,'a',{channelId:channel.id,text:'Existing message'});
 await assert.rejects(chat.update(getState,'b',{channelId:channel.id,name:'Hack',description:''}),/admins/);await assert.rejects(chat.duplicate(getState,'b',channel.id),/admins/);
 await chat.update(getState,'a',{channelId:channel.id,name:'ordres',description:'Private',scope:'squad',squadId:'one',announcements:true});assert.equal(chat.list(state,'a',channel.id).messages[0].text,'Existing message');assert.throws(()=>chat.channel(state,'c',channel.id),/inaccessible/);assert.equal(chat.channel(state,'b',channel.id).canWrite,false);
 const copy=await chat.duplicate(getState,'a',channel.id);assert.equal(copy.name,'ordres · copie');assert.equal(copy.squadId,'one');assert.equal(copy.announcements,true);assert.equal(chat.list(state,'a',copy.id).messages.length,0);assert.throws(()=>chat.channel(state,'c',copy.id),/inaccessible/);assert.equal(chat.channel(state,'b',copy.id).canWrite,false);
 const second=await chat.duplicate(getState,'a',channel.id);assert.notEqual(second.name,copy.name);
 await chat.update(getState,'a',{channelId:'general',name:'Bienvenue',description:'Discussion de la team'});assert.equal(chat.channel(state,'b','general').name,'Bienvenue');assert.equal(chat.channel(state,'b','general').canWrite,true);
 await assert.rejects(chat.update(getState,'a',{channelId:'announcements',name:'News',description:'',announcements:false}),/automatiques/);
 await chat.update(getState,'a',{channelId:'squad:one',name:'Discussion alpha',description:'Préparation'});assert.equal(chat.channel(state,'b','squad:one').name,'Discussion alpha');assert.throws(()=>chat.channel(state,'c','squad:one'),/inaccessible/);
 const reopened=new ChatStore(dir);await reopened.open();assert.equal(reopened.channel(state,'a',channel.id).name,'ordres');assert.equal(reopened.channel(state,'a','general').name,'Bienvenue');assert.equal(reopened.channel(state,'a','squad:one').name,'Discussion alpha');assert.equal(reopened.list(state,'a',channel.id).messages.length,1);
 await assert.rejects(chat.update(getState,'a',{channelId:channel.id,name:'x'.repeat(41),description:''}),/invalide/);
});
test('Queued edit and duplicate recheck admin rights at commit time; channel limits apply to duplication',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/channel-management-')),chat=new ChatStore(dir);await chat.open();const state={players:[{id:'a',name:'Admin',admin:true}],squads:[]};
 let release;chat.serialized(()=>new Promise(resolve=>release=resolve));await new Promise(resolve=>setImmediate(resolve));const edit=chat.update(()=>state,'a',{channelId:'general',name:'Hack',description:''}),duplicate=chat.duplicate(()=>state,'a','general');state.players[0].admin=false;release();await assert.rejects(edit,/admins/);await assert.rejects(duplicate,/admins/);
 state.players[0].admin=true;chat.db.channels=Array.from({length:30},(_,i)=>({id:'text:'+i,name:'Custom '+i,scope:'team',custom:true}));await assert.rejects(chat.duplicate(()=>state,'a','general'),/30 salons/);
});
