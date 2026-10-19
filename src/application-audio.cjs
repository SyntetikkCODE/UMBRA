const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os');
const message='Le son de cette application ne peut pas être capturé. Réessaie sans partager le son.';
function createApplicationAudio({executable,send,platform=process.platform,build=Number(os.release().split('.')[2]),launch=spawn,now=Date.now}){
 let grant=null,active=null;
 const supported=()=>platform==='win32'&&build>=20348&&fs.existsSync(executable);
 function stop(id){if(!id)grant=null;const entry=active;if(!entry||id&&entry.id!==id)return true;active=null;clearTimeout(entry.timer);entry.reject(new Error(message));entry.child.stdin.end();const timer=setTimeout(()=>{if(entry.child.exitCode===null)entry.child.kill();},1000);timer.unref();return true;}
 return {supported,authorize(sourceId){grant={sourceId,until:now()+15000};},cancelGrant(){grant=null;},stop,
  start(sourceId,id){const permission=grant;grant=null;
   if(!supported())throw new Error('Le son d’une application n’est pas disponible sur cette version de Windows. Partage l’image sans le son.');
   if(!permission||permission.sourceId!==sourceId||now()>permission.until||!/^window:[1-9]\d*:\d+$/.test(sourceId)||typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw new Error('Rouvre le sélecteur pour partager le son de cette application.');
   const handle=sourceId.split(':')[1];if(BigInt(handle)>0x7fffffffffffffffn)throw new Error('Fenêtre invalide.');stop();
   return new Promise((resolve,reject)=>{
    const child=launch(executable,[handle],{windowsHide:true,stdio:['pipe','pipe','pipe']}),entry={child,id,reject,ready:false,pending:Buffer.alloc(0)};active=entry;
    const fail=()=>{if(active!==entry)return;const ready=entry.ready;stop(id);if(ready)send({type:'ended',sessionId:id,error:message});};
    entry.timer=setTimeout(fail,10000);entry.timer.unref();child.on('error',fail);child.on('exit',fail);child.stdin.on('error',()=>{});child.stderr.on('data',()=>{});
    child.stdout.on('data',chunk=>{if(active!==entry)return;entry.pending=Buffer.concat([entry.pending,chunk]);if(!entry.ready){if(entry.pending.length<16)return;const b=entry.pending;if(b.subarray(0,8).toString()!=='UMBRAPCM'||b.readUInt32LE(8)!==48000||b.readUInt16LE(12)!==2||b.readUInt16LE(14)!==16){fail();return;}entry.pending=b.subarray(16);entry.ready=true;clearTimeout(entry.timer);resolve({sessionId:id,rate:48000,channels:2});}
     const count=entry.pending.length-entry.pending.length%4;if(count){const data=new Uint8Array(entry.pending.subarray(0,count));entry.pending=entry.pending.subarray(count);try{if(send({type:'pcm',sessionId:id,data})===false)stop(id);}catch{stop(id);}}
    });
   });
  }
 };
}
module.exports={createApplicationAudio};
