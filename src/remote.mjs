import WebSocket from 'ws';
import {isIP} from 'node:net';
import {voiceState} from './voice-state.mjs';
export function serverUrl(input) {
 const url=new URL(input);if(url.username||url.password||url.search||url.hash)throw new Error('Adresse de serveur invalide.');
 const ip=isIP(url.hostname),parts=url.hostname.split('.').map(Number);
 const privateHost=url.hostname==='localhost'||url.hostname==='[::1]'||url.hostname.endsWith('.local')||ip===4&&(parts[0]===127||parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&privateHost))throw new Error('Utilise HTTPS, ou HTTP pour les essais sur le réseau local.');
 return url.href.replace(/\/$/,'');
}
export class Remote {
 constructor(base,onEvent=()=>{}) {this.base=serverUrl(base);this.onEvent=onEvent;this.token=null;this.socket=null;this.retry=null;this.closed=false;this.voiceFlags=voiceState();}
 async request(route,body) {
  const response=await fetch(this.base+'/'+route,{method:body===undefined?'GET':'POST',redirect:'error',headers:{...(this.token?{Authorization:'Bearer '+this.token}:{}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const result=await response.json();if(!response.ok){const error=new Error(result.error||'Serveur indisponible.');error.status=response.status;throw error;}return result;
 }
 async upload(channelId,name,bytes){
  const response=await fetch(this.base+'/chat/upload?channelId='+encodeURIComponent(channelId)+'&name='+encodeURIComponent(name),{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+this.token,'Content-Type':'application/octet-stream'},body:bytes,signal:AbortSignal.timeout(180000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Envoi du fichier impossible.');return result;
 }
 async attachment(id){
  const response=await fetch(this.base+'/chat/attachment?id='+encodeURIComponent(id),{redirect:'error',headers:{Authorization:'Bearer '+this.token},signal:AbortSignal.timeout(180000)});
  if(!response.ok){const result=await response.json();throw new Error(result.error||'Média inaccessible.');}
  if(Number(response.headers.get('content-length'))>25*1024*1024)throw new Error('Média trop volumineux.');return {bytes:new Uint8Array(await response.arrayBuffer()),type:response.headers.get('content-type')};
 }
 async auth(kind,credentials) {const result=await this.request('auth/'+kind,credentials);this.token=result.token;this.closed=false;this.listen();const {token,...publicResult}=result;return publicResult;}
 async resume(token){this.token=token;try{const result=await this.request('state');this.closed=false;this.listen();return result;}catch(error){this.token=null;throw error;}}
 listen() {
  clearTimeout(this.retry);this.socket?.removeAllListeners();this.socket?.on('error',()=>{});this.socket?.terminate();
  const address=this.base.replace(/^http/,'ws')+'/events';
  const ws=new WebSocket(address,{headers:{Authorization:'Bearer '+this.token}});this.socket=ws;
  ws.on('message',raw=>{try{this.onEvent(JSON.parse(raw));}catch{}});
  ws.on('open',()=>{this.voiceStatus(this.voiceFlags);this.onEvent({type:'network',connected:true});});
  ws.on('error',()=>{});
  ws.on('unexpected-response',(_,response)=>{response.resume();if(response.statusCode===401){this.close();this.onEvent({type:'sessionExpired'});}else ws.terminate();});
  ws.on('close',code=>{if(code===4001){this.close();this.onEvent({type:'sessionExpired'});return;}this.onEvent({type:'network',connected:false});if(!this.closed&&this.token)this.retry=setTimeout(()=>this.listen(),2000);});
 }
 activity(speaking,channel) {if(this.socket?.readyState===1)this.socket.send(JSON.stringify({type:'activity',speaking,channel}));}
 voiceStatus(value){this.voiceFlags=voiceState(value);if(this.socket?.readyState===1)this.socket.send(JSON.stringify({type:'voiceState',...this.voiceFlags}));}
 async logout() {this.closed=true;clearTimeout(this.retry);this.socket?.removeAllListeners();this.socket?.on('error',()=>{});this.socket?.terminate();try{if(this.token)await this.request('logout',{});}finally{this.close();}}
 close(){this.closed=true;clearTimeout(this.retry);this.socket?.removeAllListeners();this.socket?.on('error',()=>{});this.socket?.terminate();this.token=null;this.voiceFlags=voiceState();}
}
