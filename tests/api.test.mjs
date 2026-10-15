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
