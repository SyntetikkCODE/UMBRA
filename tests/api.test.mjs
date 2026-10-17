import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {startApi} from '../server/api.mjs';
test('API partagée : identité explicite et aucun périphérique audio d’un autre PC dans le snapshot',async()=>{
 const root=path.resolve(import.meta.dirname,'../artifacts');await fs.mkdir(root,{recursive:true});const dir=await fs.mkdtemp(path.join(root,'api-test-'));
 const api=await startApi({dataDir:dir,port:0,apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test-code'});
 try{
  const user=await api.accounts.register({name:'Player',password:'password-123'});api.accounts.db.state.settings.mic='device-of-another-PC';
  const session=await api.issue(user.state.currentUserId);const response=await fetch('http://127.0.0.1:'+api.port+'/state',{headers:{Authorization:'Bearer '+session.token}});const data=await response.json();
  assert.equal(data.state.settings.mic,'');assert.equal(data.state.currentUserId,user.state.currentUserId);assert.ok(!JSON.stringify(data).includes('hash'));assert.ok(!JSON.stringify(data).includes('device-of-another-PC'));
  const denied=await fetch('http://127.0.0.1:'+api.port+'/state');assert.equal(denied.status,401);
 }finally{await api.close();}
});
test('Media grants allow camera and screen only in the authorized primary room, never leader or broadcast networks',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/media-grants-'));
 const api=await startApi({dataDir:dir,port:0,apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test-code'});
 try{const result=await api.accounts.register({name:'MediaGrantTest',password:'test-password'}),id=result.state.currentUserId;await api.accounts.action({type:'create',name:'Test',kind:'Infanterie',mood:'Tactique',role:'Medic',roles:[]},id);await api.accounts.action({type:'rights',playerId:id,admin:true,commander:true},id);const session=await api.issue(id),response=await fetch('http://127.0.0.1:'+api.port+'/voice/plan',{headers:{Authorization:'Bearer '+session.token}}),plan=await response.json();assert.equal(response.status,200);assert.equal(plan.channels.length,3);for(const c of plan.channels){const jwt=JSON.parse(Buffer.from(c.token.split('.')[1],'base64url'));assert.equal(jwt.video.room,c.room);assert.deepEqual(jwt.video.canPublishSources,c.kind==='primary'?['microphone','camera','screen_share','screen_share_audio']:['microphone']);}}
 finally{await api.close();}
});

test('voice destination API: members can enter lobby and return home, only admins can visit other squads',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/click-voice-'));
 const api=await startApi({dataDir:dir,port:0,apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test-code'});
 try{
  const admin=(await api.accounts.register({name:'ClickAdmin',password:'test-password'})).state.currentUserId,member=(await api.accounts.register({name:'ClickMember',password:'test-password'})).state.currentUserId,other=(await api.accounts.register({name:'ClickOther',password:'test-password'})).state.currentUserId;
  const tokens=new Map();for(const id of [admin,member,other])tokens.set(id,(await api.issue(id)).token);
  const request=async(id,route,body)=>{const r=await fetch('http://127.0.0.1:'+api.port+'/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+tokens.get(id),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
  const create=await request(member,'action',{type:'create',name:'CLICK',role:'Medic',roles:[],kind:'Infanterie',mood:'Tactique'}),q=create.data.state.squads[0],own=(await request(member,'voice/plan')).data.channels[0];
  assert.equal((await request(other,'voice/visit',{squadId:q.id})).status,400);
  assert.equal((await request(member,'voice/visit',{squadId:'lobby'})).status,200);
  const lobby=(await request(member,'voice/plan')).data.channels[0];assert.equal(lobby.label,'Accueil');assert.equal(lobby.room,(await request(other,'voice/plan')).data.channels[0].room);
  assert.equal((await request(member,'voice/visit',{squadId:null})).status,200);assert.equal((await request(member,'voice/plan')).data.channels[0].room,own.room);
  assert.equal((await request(admin,'voice/visit',{squadId:q.id})).status,200);assert.equal((await request(admin,'voice/plan')).data.channels[0].room,own.room);
  await request(member,'voice/visit',{squadId:'lobby'});const op=(await request(member,'action',{type:'operationCreate',name:'CLICK BRIEF',kind:'Match',server:'',description:'',startsAt:''})).data.state.operations[0];assert.equal((await request(member,'action',{type:'briefingJoin',operationId:op.id,squadId:q.id})).status,200);assert.match((await request(member,'voice/plan')).data.channels[0].label,/Briefing/);
  await request(other,'voice/visit',{squadId:'lobby'});assert.equal((await request(other,'action',{type:'create',name:'OTHER',role:'Recon',roles:[],kind:'Infanterie',mood:'Tactique'})).status,200);assert.equal((await request(other,'voice/plan')).data.channels[0].label,'OTHER');
  const state=api.accounts.db.state;assert.equal(state.squads.find(t=>t.id===q.id).slots[0].playerId,member);
 }finally{await api.close();}
});
