import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import WebSocket from 'ws';
import {startApi} from '../server/api.mjs';
import {ChatStore} from '../server/chat.mjs';
test('Shared text: private ACL, authenticated author, announcement rights, realtime filtering and restart persistence',async()=>{
 const directory=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/chat-'));
 const config={dataDir:directory,port:0,bind:'127.0.0.1',apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test-code'};
 let api=await startApi(config);const sockets=[];
 const request=async(token,route,body)=>{const r=await fetch('http://127.0.0.1:'+api.port+'/'+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 const register=async name=>(await request(null,'auth/register',{name,password:'test-password',joinCode:'test-code'})).data;
 try{
  const a=await register('Admin'),b=await register('Member'),c=await register('Outside');const aid=a.state.currentUserId,bid=b.state.currentUserId;
  const created=await request(a.token,'action',{type:'create',name:'PRIVATE',kind:'Infanterie',mood:'Tactique',role:'Medic',roles:['Recon']}),q=created.data.state.squads[0],channel='squad:'+q.id;
  await request(b.token,'action',{type:'join',squadId:q.id,slotId:q.slots[1].id});
  assert.ok((await request(b.token,'chat/channels')).data.channels.some(c=>c.id===channel));assert.ok(!(await request(c.token,'chat/channels')).data.channels.some(c=>c.id===channel));
  assert.equal((await request(c.token,'chat/messages?channelId='+encodeURIComponent(channel))).status,400);
  assert.equal((await request(b.token,'chat/send',{channelId:'announcements',text:'Not allowed'})).status,400);
  assert.equal((await request(b.token,'chat/create',{name:'Forbidden'})).status,400);
  const custom=await request(a.token,'chat/create',{name:'Logistique',scope:'squad',squadId:q.id});assert.equal(custom.status,200);
  assert.equal((await request(c.token,'chat/messages?channelId='+encodeURIComponent(custom.data.channel.id))).status,400);
  const events={member:[],outside:[]};
  for(const [user,label]of [[b,'member'],[c,'outside']]){const ws=new WebSocket('ws://127.0.0.1:'+api.port+'/events',{headers:{Authorization:'Bearer '+user.token}});sockets.push(ws);ws.on('message',raw=>events[label].push(JSON.parse(raw)));await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});}
  const accountsBefore=await fs.readFile(api.accounts.file);
  const sent=await request(a.token,'chat/send',{channelId:channel,text:'<script>safe text</script>',authorId:bid});assert.equal(sent.status,200);assert.equal(sent.data.message.authorId,aid);
  await new Promise(resolve=>setTimeout(resolve,100));assert.ok(events.member.some(e=>e.type==='chat'&&e.message.id===sent.data.message.id));assert.ok(!events.outside.some(e=>e.type==='chat'));
  assert.deepEqual(await fs.readFile(api.accounts.file),accountsBefore);
  const rows=await request(b.token,'chat/messages?channelId='+encodeURIComponent(channel));assert.equal(rows.data.messages[0].text,'<script>safe text</script>');
  for(const text of ['', 'x'.repeat(2001), {}])assert.equal((await request(a.token,'chat/send',{channelId:channel,text})).status,400);
  assert.equal((await request(a.token,'chat/delete',{channelId:'general'})).status,400);
  assert.equal((await request(b.token,'chat/delete',{channelId:custom.data.channel.id})).status,400);
  await request(b.token,'action',{type:'leave',squadId:q.id});assert.equal((await request(b.token,'chat/send',{channelId:channel,text:'After leave'})).status,400);assert.equal((await request(b.token,'chat/messages?channelId='+encodeURIComponent(channel))).status,400);
  const reopened=new ChatStore(directory);await reopened.open();assert.equal(reopened.list(api.accounts.session(aid).state,aid,channel).messages[0].id,sent.data.message.id);
  assert.equal((await request(null,'chat/channels')).status,401);
 }finally{for(const ws of sockets)ws.terminate();await api.close();}
});
test('Queued text rechecks membership; bounded history paginates and chat rate limit holds',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/chat-')),store=new ChatStore(dir);await store.open();
 const state={players:[{id:'leader',admin:false},{id:'member',admin:false}],squads:[{id:'one',slots:[{playerId:'leader'},{playerId:'member'}]}]};
 let release;store.serialized(()=>new Promise(resolve=>release=resolve));await new Promise(resolve=>setImmediate(resolve));
 const pending=store.send(()=>state,'member',{channelId:'squad:one',text:'Cannot bypass leave'});state.squads[0].slots[1].playerId=null;release();await assert.rejects(pending,/inaccessible/);
 for(let i=0;i<8;i++)await store.send(()=>state,'leader',{channelId:'general',text:'Message '+i});await assert.rejects(store.send(()=>state,'leader',{channelId:'general',text:'Too fast'}),/Attends/);
 store.db.messages.general=Array.from({length:60},(_,i)=>({id:'m'+i,sequence:i+1,text:'History'}));const page=store.list(state,'leader','general');assert.equal(page.messages.length,50);assert.equal(page.hasMore,true);assert.equal(store.list(state,'leader','general',page.messages[0].sequence).messages.length,10);
});

test('Private media upload and mentions: real HTTP bytes, owner binding, published reads, revocation and persistent files',async()=>{
 const directory=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/chat-media-'));
 const api=await startApi({dataDir:directory,port:0,apiKey:'test',apiSecret:'0'.repeat(64),livekitUrl:'http://127.0.0.1:65530',publicVoiceUrl:'ws://127.0.0.1:65530',joinCode:'test-code'});
 const base='http://127.0.0.1:'+api.port;
 const request=async(token,route,body)=>{const r=await fetch(base+'/'+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 const upload=(token,channel,bytes,name='test.png')=>fetch(base+'/chat/upload?channelId='+encodeURIComponent(channel)+'&name='+encodeURIComponent(name),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream'},body:bytes});
 const read=(token,id)=>fetch(base+'/chat/attachment?id='+id,{headers:{Authorization:'Bearer '+token}});
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6AAAAAElFTkSuQmCC','base64');
 try{
  const register=async name=>(await request(null,'auth/register',{name,password:'test-password',joinCode:'test-code'})).data;
  const a=await register('Admin'),b=await register('Member'),c=await register('Outside');
  const made=await request(a.token,'action',{type:'create',name:'Private',kind:'Infanterie',mood:'Tactique',role:'Medic',roles:['Recon']}),q=made.data.state.squads[0],channel='squad:'+q.id;
  await request(b.token,'action',{type:'join',squadId:q.id,slotId:q.slots[1].id});
  assert.equal((await upload(c.token,channel,png)).status,400);assert.equal((await upload(b.token,'announcements',png)).status,400);assert.equal((await upload(a.token,channel,Buffer.from('<svg onload="evil()"></svg>'),'evil.svg')).status,400);
  assert.equal((await upload(a.token,channel,Buffer.alloc(25*1024*1024+1))).status,400);
  const uploaded=await upload(a.token,channel,png);assert.equal(uploaded.status,200);const attachment=(await uploaded.json()).attachment;
  assert.equal((await read(b.token,attachment.id)).status,400);assert.equal((await read(c.token,attachment.id)).status,400);
  assert.equal((await request(b.token,'chat/send',{channelId:channel,text:'Stolen',attachments:[attachment.id]})).status,400);
  assert.equal((await request(a.token,'chat/send',{channelId:'general',text:'Wrong room',attachments:[attachment.id]})).status,400);
  const sent=await request(a.token,'chat/send',{channelId:channel,text:'Salut @Member @Outside @everyone `@Outside`',attachments:[attachment.id],mentions:[c.state.currentUserId],everyone:false});assert.equal(sent.status,200);assert.deepEqual(sent.data.message.mentions,[b.state.currentUserId]);assert.equal(sent.data.message.everyone,true);
  const received=await read(b.token,attachment.id);assert.equal(received.status,200);assert.equal(received.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await received.arrayBuffer()),png);assert.equal((await read(c.token,attachment.id)).status,400);
  const reopened=new ChatStore(directory);await reopened.open();assert.deepEqual((await reopened.attachment(()=>api.accounts.session(a.state.currentUserId).state,a.state.currentUserId,attachment.id)).bytes,png);
  await request(b.token,'action',{type:'leave',squadId:q.id});assert.equal((await read(b.token,attachment.id)).status,400);
  const second=(await (await upload(a.token,channel,png)).json()).attachment;assert.equal((await request(a.token,'chat/discard',{id:second.id})).status,200);assert.equal((await read(a.token,second.id)).status,400);
 }finally{await api.close();}
});
