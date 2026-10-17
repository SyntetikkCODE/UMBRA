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
