import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fixture} from './fixture.mjs';
import {reduce,leaderAccess} from '../src/model.mjs';
import {voiceChannels} from '../server/routing.mjs';
import {roleLabel} from '../src/roles.mjs';
import {screenShareOptions,screenQuality} from '../src/screen-quality.mjs';
import {startApi} from '../server/api.mjs';
test('Changing own slot preserves leadership, deputy rights and voice rooms; occupied and foreign slots stay protected',()=>{
 let s=fixture();s.currentUserId='swade';const q=s.squads[0];q.slots.push({id:'move-free',role:'Sniper',playerId:null});s=reduce(s,{type:'deputy',squadId:q.id,playerId:'regret'});const before=voiceChannels(s,'swade');
 const moved=reduce(s,{type:'moveSlot',squadId:q.id,slotId:'move-free',playerId:'regret'});assert.equal(moved.squads[0].leaderId,'swade');assert.equal(moved.squads[0].slots[0].playerId,null);assert.equal(moved.squads[0].slots.at(-1).playerId,'swade');assert.equal(moved.squads[0].slots.find(t=>t.playerId==='regret').id,q.slots.find(t=>t.playerId==='regret').id);assert.deepEqual(voiceChannels(moved,'swade'),before);assert.equal(leaderAccess(moved),true);assert.equal(s.squads[0].slots.at(-1).playerId,null);
 moved.currentUserId='regret';const deputy=reduce(moved,{type:'moveSlot',squadId:q.id,slotId:q.slots[0].id});assert.equal(deputy.squads[0].deputyId,'regret');assert.equal(leaderAccess(deputy),true);
 assert.throws(()=>reduce(deputy,{type:'moveSlot',squadId:q.id,slotId:'move-free'}),/disponible/);assert.throws(()=>reduce(deputy,{type:'moveSlot',squadId:s.squads[1].id,slotId:s.squads[1].slots[1].id}),/appartenir/);
});
test('Slot claim API serializes competing requests without losing the losing player or granting permission to move another player',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/slot-api-')),api=await startApi({dataDir:dir,port:0,apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test-code'});
 try{const ids=[];for(const name of ['SlotLeader','SlotMember','SlotOther'])ids.push((await api.accounts.register({name,password:'slot-test-password'})).state.currentUserId);const [leader,member,other]=ids;await api.accounts.action({type:'create',name:'SLOTS',kind:'Infanterie',mood:'Tactique',role:'Medic',roles:['Recon','Sniper']},leader);const q=api.accounts.db.state.squads[0];await api.accounts.action({type:'join',squadId:q.id,slotId:q.slots[1].id},member);const tokens=new Map();for(const id of ids)tokens.set(id,(await api.issue(id)).token);
 const move=async(id,target,extra={})=>{const r=await fetch('http://127.0.0.1:'+api.port+'/action',{method:'POST',headers:{Authorization:'Bearer '+tokens.get(id),'Content-Type':'application/json'},body:JSON.stringify({type:'moveSlot',squadId:q.id,slotId:target,...extra})});return {status:r.status,body:await r.json()};};assert.equal((await move(other,q.slots[2].id,{playerId:leader})).status,400);
 const results=await Promise.all([move(leader,q.slots[2].id),move(member,q.slots[2].id)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);const slots=api.accounts.db.state.squads[0].slots;assert.equal(slots.filter(t=>t.playerId===leader).length,1);assert.equal(slots.filter(t=>t.playerId===member).length,1);assert.equal(api.accounts.db.state.squads[0].leaderId,leader);
 }finally{await api.close();}
});
test('New role labels preserve old stored identities and custom posts',()=>{assert.equal(roleLabel('Infanterie'),'Entry Frag');assert.equal(roleLabel('Sniper'),'Recon');assert.equal(roleLabel('Recon'),'Breacher');assert.equal(roleLabel('Recon mobile'),'Recon mobile');assert.equal(roleLabel('constructor'),'constructor');});
test('Screen quality caps video but Source remains uncapped; stream audio is stereo without speech processing or discontinuous encoding',()=>{
 for(const [id,height]of [['480p',480],['720p',720],['1080p',1080]]){const {capture,publish}=screenShareOptions(id,true);assert.equal(capture.video.height.max,height);assert.equal(capture.video.frameRate.max,30);assert.equal(publish.audioPreset.maxBitrate,128000);assert.equal(publish.forceStereo,true);assert.equal(publish.dtx,false);assert.equal(publish.red,true);assert.deepEqual(capture.audio,{channelCount:2,sampleRate:48000,echoCancellation:false,noiseSuppression:false,autoGainControl:false});}
 const source=screenShareOptions('source',false);assert.ok(!('width' in source.capture.video));assert.ok(!('height' in source.capture.video));assert.equal(source.capture.resolution.width,0);assert.equal(source.capture.audio,false);assert.throws(()=>screenQuality('4k'),/invalide/);
});
