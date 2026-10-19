import http from 'node:http';
import {isIP} from 'node:net';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {WebSocketServer} from 'ws';
import {AccessToken,RoomServiceClient,TrackSource} from 'livekit-server-sdk';
import {Accounts} from '../src/accounts.mjs';
import {VoiceVisits} from './voice-visits.mjs';
import {ChatStore} from './chat.mjs';
import {MAX_MEDIA} from './chat-media.mjs';
import {Sessions,sessionKey} from './sessions.mjs';
import {voiceState} from '../src/voice-state.mjs';

const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export async function startApi(config) {
 const accounts=new Accounts(config.dataDir);await accounts.open();
 const chat=new ChatStore(config.dataDir);await chat.open();
 const rtc=new RoomServiceClient(config.livekitUrl,config.apiKey,config.apiSecret);
 const epoch=randomBytes(8).toString('hex'),namespace=config.namespace||'umbra';
 const sessions=new Sessions(config.dataDir);await sessions.open(id=>accounts.db.accounts.some(a=>a.id===id));
 const forced=new VoiceVisits(),forcedDestinations=forced.destinations,visits=new Map(),sockets=new Map(),issued=new Map(),activity=new Map(),voiceStates=new Map();
 let stopping=false,revision=0,liveUsers=[],presenceBusy=false;
 const allowed=id=>{const state=accounts.session(id).state,visit=visits.get(id);return forced.plan(state,id,{visitLobby:visit==='lobby',visitSquadId:state.players.find(p=>p.id===id)?.admin&&state.squads.some(q=>q.id===visit)?visit:null,namespace,epoch});};
 const voiceMoved=()=>broadcast({type:'voiceMove'});
 const online=()=>[...sockets].filter(([,set])=>[...set].some(ws=>ws.readyState===1)).map(([id])=>id);
 const snapshot=id=>{const session=accounts.session(id);return {...session,state:{...session.state,settings:{mic:'',squadVolume:85,leadersVolume:100,ducking:true}},revision,onlineIds:online(),voiceUsers:liveUsers,voiceStates:[...voiceStates].map(([userId,value])=>({userId,...value}))};};
 const issue=async(id,remember=false,passwordVersion=accounts.session(id).passwordVersion)=>{if(accounts.session(id).passwordVersion!==passwordVersion)throw new Error('Session expirée. Reconnecte-toi.');const token=await sessions.issue(id,remember,passwordVersion);clearVoice(id);for(const ws of sockets.get(id)||[])ws.close(4001,'session replaced');return {token,...snapshot(id)};};
 const identifyToken=token=>{const id=sessions.identify(token);if((sessions.values.get(sessionKey(token)).passwordVersion||0)!==accounts.session(id).passwordVersion)throw new Error('Session expirée. Reconnecte-toi.');return id;};
 const identify=req=>identifyToken((req.headers.authorization||'').replace(/^Bearer /,''));
 const send=(ws,payload)=>{if(ws.readyState===1)ws.send(JSON.stringify(payload));};
 const broadcast=payload=>{for(const set of sockets.values())for(const ws of set)send(ws,payload);};
 const clearVoice=id=>{if(voiceStates.delete(id))broadcast({type:'voiceState',userId:id,...voiceState()});};
 const notify=()=>{revision++;for(const[id,set]of sockets)for(const ws of set)send(ws,{type:'state',...snapshot(id)});};
 const notifyChat=event=>{for(const[id,set]of sockets){if(event.channelId&&!chat.channels(accounts.session(id).state,id).some(c=>c.id===event.channelId))continue;for(const ws of set)send(ws,event);}};
 async function refreshPresence(){
  if(presenceBusy||!accounts.db.state)return;presenceBusy=true;
  try{
   const rooms=await rtc.listRooms(),wanted=new Set(accounts.db.state.players.flatMap(p=>allowed(p.id).map(c=>c.room))),present=new Map();
   await Promise.all(rooms.filter(r=>wanted.has(r.name)).map(async r=>{try{present.set(r.name,new Set((await rtc.listParticipants(r.name)).map(p=>p.identity)));}catch{}}));
   const next=accounts.db.state.players.map(p=>({id:p.id,channels:allowed(p.id).filter(c=>present.get(c.room)?.has(p.id)).map(({kind,room,label,squadId,operationId})=>({kind,room,label,squadId,operationId}))})).filter(p=>p.channels.length);
   if(JSON.stringify(next)!==JSON.stringify(liveUsers)){liveUsers=next;notify();}
  }catch{}finally{presenceBusy=false;}
 }

 async function reconcile() {
  // Rotated room names prevent old valid JWTs from reaching remaining members.
  const activeRooms=new Set();
  for(const p of accounts.db.state?.players||[])for(const c of allowed(p.id))activeRooms.add(c.room);
  for(const[id,rooms]of issued){
   const desired=new Set(allowed(id).map(c=>c.room));
   for(const room of rooms)if(!desired.has(room)){
    try{await rtc.removeParticipant(room,id);}catch{}
    if(!activeRooms.has(room))try{await rtc.deleteRoom(room);}catch{}
    rooms.delete(room);
   }
  }
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try{
   const route=new URL(req.url,'http://localhost').pathname;
   if(req.method==='GET'&&route==='/health')return reply(200,{name:'UMBRA',version:'0.17.0',needsRegistration:accounts.status().needsRegistration});
   if(req.method==='POST'&&route==='/chat/upload'){
    const id=identify(req),params=new URL(req.url,'http://localhost').searchParams,channelId=params.get('channelId');
    const c=chat.channel(accounts.session(id).state,id,channelId);if(!c.canWrite)throw new Error('Salon en lecture seule.');
    if(Number(req.headers['content-length'])>MAX_MEDIA)throw new Error('Limite de 25 Mo par fichier.');
    const chunks=[];let total=0;for await(const chunk of req){total+=chunk.length;if(total>MAX_MEDIA)throw new Error('Limite de 25 Mo par fichier.');chunks.push(chunk);}
    const attachment=await chat.upload(()=>accounts.session(identify(req)).state,id,{channelId,name:params.get('name')},Buffer.concat(chunks));return reply(200,{attachment});
   }
   if(req.method==='GET'&&route==='/chat/attachment'){
    const id=identify(req),params=new URL(req.url,'http://localhost').searchParams,{attachment,bytes}=await chat.attachment(()=>accounts.session(identify(req)).state,id,params.get('id'));
    res.writeHead(200,{'Content-Type':attachment.type,'Content-Length':bytes.length,'Content-Disposition':"inline; filename*=UTF-8''"+encodeURIComponent(attachment.name),'Content-Security-Policy':"default-src 'none'; sandbox"});res.end(bytes);return;
   }
   let body={};if(req.method==='POST'){
    const chunks=[];let total=0;for await(const chunk of req){total+=chunk.length;if(total>20000000)throw new Error('Requête trop volumineuse.');chunks.push(chunk);}body=JSON.parse(Buffer.concat(chunks).toString()||'{}');
   }
   if(req.method==='POST'&&route==='/auth/register'){
    if(!equal(body.joinCode,config.joinCode))return reply(403,{error:'Code de la team incorrect.'});
    const result=await accounts.register(body);await reconcile();notify();return reply(200,await issue(result.state.currentUserId,body.remember===true,result.passwordVersion));
   }
   if(req.method==='POST'&&route==='/auth/login'){
    const result=await accounts.login(body,config.trustProxy&&isIP(req.headers['x-real-ip']||'')?req.headers['x-real-ip']:req.socket.remoteAddress);return reply(200,await issue(result.state.currentUserId,body.remember===true,result.passwordVersion));
   }
   if(req.method==='POST'&&route==='/auth/reset'){
    const reset=await accounts.resetPassword(body,config.trustProxy&&isIP(req.headers['x-real-ip']||'')?req.headers['x-real-ip']:req.socket.remoteAddress);await sessions.revokeUser(reset.userId);clearVoice(reset.userId);for(const ws of sockets.get(reset.userId)||[])ws.close(4001,'password reset');for(const c of allowed(reset.userId))try{await rtc.removeParticipant(c.room,reset.userId);}catch{}return reply(200,{ok:true});
   }
   const id=identify(req);
   if(req.method==='POST'&&route==='/admin/password-reset')return reply(200,await accounts.beginPasswordReset(body.playerId,id));
   if(req.method==='GET'&&route==='/chat/channels')return reply(200,{channels:chat.channels(accounts.session(id).state,id)});
   if(req.method==='GET'&&route==='/chat/messages'){const params=new URL(req.url,'http://localhost').searchParams;return reply(200,chat.list(accounts.session(id).state,id,params.get('channelId'),params.has('before')?Number(params.get('before')):undefined));}
   if(req.method==='GET'&&route==='/chat/message'){const p=new URL(req.url,'http://localhost').searchParams;return reply(200,{message:chat.getMessage(accounts.session(id).state,id,p.get('channelId'),p.get('messageId'))});}
   if(req.method==='GET'&&route==='/chat/pins'){const p=new URL(req.url,'http://localhost').searchParams;return reply(200,chat.pins(accounts.session(id).state,id,p.get('channelId')));}
   if(req.method==='POST'&&['/chat/react','/chat/pin','/chat/delete-message'].includes(route)){const kind=route==='/chat/delete-message'?'delete':route.slice(6),result=await chat.mutate(()=>accounts.session(identify(req)).state,id,kind,body);notifyChat({type:'chatMutation',...result});return reply(200,result);}
   if(req.method==='POST'&&route==='/chat/send'){const message=await chat.send(()=>accounts.session(id).state,id,body);notifyChat({type:'chat',channelId:message.channelId,message});return reply(200,{message});}
   if(req.method==='POST'&&route==='/chat/create'){const channel=await chat.create(()=>accounts.session(id).state,id,body);notifyChat({type:'chatChannels'});return reply(200,{channel});}
   if(req.method==='POST'&&route==='/chat/update'){const channel=await chat.update(()=>accounts.session(id).state,id,body);notifyChat({type:'chatChannels'});return reply(200,{channel});}
   if(req.method==='POST'&&route==='/chat/duplicate'){const channel=await chat.duplicate(()=>accounts.session(id).state,id,body.channelId);notifyChat({type:'chatChannels'});return reply(200,{channel});}
   if(req.method==='POST'&&route==='/chat/delete'){await chat.remove(()=>accounts.session(id).state,id,body.channelId);notifyChat({type:'chatChannels'});return reply(200,{ok:true});}
   if(req.method==='POST'&&route==='/chat/discard'){return reply(200,await chat.discard(()=>accounts.session(id).state,id,body.id));}
   if(req.method==='GET'&&route==='/state')return reply(200,snapshot(id));
   if(req.method==='POST'&&route==='/action'){
    if(body.type==='settings')throw new Error('Les réglages audio restent locaux à chaque PC.');
    const memberships=()=>new Map(accounts.db.state.squads.flatMap(q=>q.slots.filter(t=>t.playerId).map(t=>[t.playerId,q.id]))),before=memberships();
    await accounts.action(body,id);const after=memberships();
    // Joining/changing a squad and a leader's new briefing call restore its normal voice destination.
    for(const [playerId,target]of visits)if(target==='lobby'&&(before.get(playerId)!==after.get(playerId)||body.type==='briefingJoin'&&after.get(playerId)===body.squadId))visits.delete(playerId);
    for(const [playerId,target]of forcedDestinations)if(before.get(playerId)!==after.get(playerId)||!accounts.db.state.squads.some(q=>q.id===target)&&target!=='lobby'||body.type==='briefingJoin'&&after.get(playerId)===body.squadId)forced.clear(playerId);
    await reconcile();notify();return reply(200,snapshot(id));
   }
   if(req.method==='POST'&&route==='/replace'){await accounts.replace(body,id);await reconcile();notify();return reply(200,snapshot(id));}
   if(req.method==='POST'&&route==='/tutorial'){await accounts.tutorialDone(id);return reply(200,{ok:true});}
   if(req.method==='POST'&&route==='/logout'){
    const token=req.headers.authorization.slice(7);await sessions.revoke(token);for(const ws of sockets.get(id)||[])ws.close(4001,'logout');
    for(const c of allowed(id))try{await rtc.removeParticipant(c.room,id);}catch{}if(forced.clear(id)){await reconcile();voiceMoved();}return reply(200,{ok:true});
   }
   if(req.method==='GET'&&route==='/admin/invite'){accounts.admin(id);return reply(200,{joinCode:config.joinCode});}
   if(req.method==='POST'&&route==='/voice/presence'){await refreshPresence();return reply(200,{ok:true});}
   if(req.method==='POST'&&route==='/voice/move'){
    accounts.admin(id);const target=body.squadId,playerId=body.playerId;if(!accounts.db.state.players.some(p=>p.id===playerId))throw new Error('Joueur introuvable.');
    if(target!=='lobby'&&!accounts.db.state.squads.some(q=>q.id===target))throw new Error('Salon introuvable.');
    const source=allowed(playerId).find(c=>c.kind==='primary');let connected=false;try{connected=(await rtc.listParticipants(source.room)).some(p=>p.identity===playerId);}catch{}if(!connected)throw new Error('Ce joueur n’est plus connecté au vocal.');
    accounts.admin(id);if(target!=='lobby'&&!accounts.db.state.squads.some(q=>q.id===target))throw new Error('Salon introuvable.');
    forced.set(playerId,target);visits.delete(playerId);await reconcile();voiceMoved();notify();return reply(200,{ok:true});
   }
   if(req.method==='POST'&&route==='/voice/visit'){
    if(body.squadId&&body.squadId!=='lobby'){accounts.admin(id);if(!accounts.db.state.squads.some(q=>q.id===body.squadId))throw new Error('Escouade introuvable.');}
    if(body.squadId)visits.set(id,body.squadId);else visits.delete(id);const forcedChanged=forced.clear(id);await reconcile();if(forcedChanged)voiceMoved();return reply(200,{ok:true});
   }
   if(req.method==='GET'&&route==='/voice/plan'){
    const channels=allowed(id),p=accounts.db.state.players.find(p=>p.id===id);
    for(const c of channels){
     forced.record(accounts.session(id).state,id,c,{namespace,epoch});
     const token=new AccessToken(config.apiKey,config.apiSecret,{identity:id,name:p.name,ttl:120});
     token.addGrant({room:c.room,roomJoin:true,canSubscribe:true,canPublish:c.canPublish,canPublishData:false,canPublishSources:c.kind==='primary'?[TrackSource.MICROPHONE,TrackSource.CAMERA,TrackSource.SCREEN_SHARE,TrackSource.SCREEN_SHARE_AUDIO]:[TrackSource.MICROPHONE],canUpdateOwnMetadata:false});
     c.token=await token.toJwt();if(!issued.has(id))issued.set(id,new Set());issued.get(id).add(c.room);
    }
    return reply(200,{url:config.publicVoiceUrl,channels,visitSquadId:visits.get(id)||null});
   }
   if(req.method==='POST'&&route==='/voice/disconnect'){for(const c of allowed(id))try{await rtc.removeParticipant(c.room,id);}catch{}if(forced.clear(id)){await reconcile();voiceMoved();}clearVoice(id);activity.delete(id);broadcast({type:'activity',userId:id,speaking:false});return reply(200,{ok:true});}
   return reply(404,{error:'Route introuvable.'});
  }catch(error){reply(error.message.includes('Session')?401:400,{error:error.message});}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:2048});
 server.on('upgrade',(req,socket,head)=>{
  try{if(new URL(req.url,'http://localhost').pathname!=='/events')throw new Error('Route');const id=identify(req);wss.handleUpgrade(req,socket,head,ws=>{ws.userId=id;ws.authToken=(req.headers.authorization||'').slice(7);wss.emit('connection',ws);});}
  catch{socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');socket.destroy();}
 });
 wss.on('connection',ws=>{
  const id=ws.userId;if(!sockets.has(id))sockets.set(id,new Set());sockets.get(id).add(ws);ws.alive=true;
  ws.on('pong',()=>ws.alive=true);notify();
  ws.on('message',raw=>{try{if(identifyToken(ws.authToken)!==id)return;const m=JSON.parse(raw);if(m.type==='voiceState'){const value=voiceState(m),last=voiceStates.get(id);if(JSON.stringify(value)!==JSON.stringify(last)){voiceStates.set(id,value);broadcast({type:'voiceState',userId:id,...value});}if(value.muted&&activity.get(id)?.speaking){activity.get(id).speaking=false;broadcast({type:'activity',userId:id,speaking:false});}return;}if(m.type!=='activity')return;const permitted=!voiceStates.get(id)?.muted&&allowed(id).some(c=>c.kind===m.channel&&c.canPublish&&liveUsers.some(p=>p.id===id&&p.channels.some(t=>t.room===c.room)));const speaking=m.speaking===true&&permitted;const last=activity.get(id);activity.set(id,{speaking,channel:m.channel,at:Date.now()});if(last?.speaking!==speaking||last?.channel!==m.channel)broadcast({type:'activity',userId:id,speaking,channel:m.channel});}catch{}});
  ws.on('close',()=>{sockets.get(id)?.delete(ws);if(!sockets.get(id)?.size){clearVoice(id);activity.delete(id);broadcast({type:'activity',userId:id,speaking:false});}if(!stopping)notify();});
 });
 let heartbeatAt=Date.now(),presenceAt=0;
 const timer=setInterval(()=>{
  if(Date.now()-heartbeatAt>10000){heartbeatAt=Date.now();for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}}
  if(Date.now()-presenceAt>3000){presenceAt=Date.now();refreshPresence();}
  for(const[id,a]of activity)if(a.speaking&&Date.now()-a.at>1500){a.speaking=false;broadcast({type:'activity',userId:id,speaking:false});}
  sessions.expire().then(keys=>{for(const ws of wss.clients)if(keys.includes(sessionKey(ws.authToken)))ws.close(4001,'session expired');}).catch(()=>{});
 },1000);timer.unref();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port??8787,config.bind||'127.0.0.1',resolve);});
 return {accounts,chat,server,port:server.address().port,issue,close:async()=>{stopping=true;clearInterval(timer);for(const ws of wss.clients)ws.terminate();wss.close();await new Promise(r=>server.close(r));await chat.queue;await sessions.queue;}};
}
