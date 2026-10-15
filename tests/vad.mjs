import {_electron as electron} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {RoomServiceClient} from 'livekit-server-sdk';
import {startApi} from '../server/api.mjs';
const root=path.resolve(import.meta.dirname,'..'),dir=await fs.mkdtemp(path.join(root,'artifacts/vad-'));
const apps=[];let api,engine;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){const end=Date.now()+20000;while(Date.now()<end){if(await fn())return;await pause(100);}throw new Error(label);}
const wav=Buffer.alloc(44+48000*12*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
for(let i=0;i<48000*12;i++)wav.writeInt16LE(Math.round(Math.sin(i/48000*440*Math.PI*2)*400),44+i*2);
const signal=path.join(dir,'quiet.wav');await fs.writeFile(signal,wav);
async function client(name){
 const env={...process.env,UMBRA_DATA_DIR:path.join(dir,name),UMBRA_SERVER_URL:'http://127.0.0.1:'+api.port};delete env.ELECTRON_RUN_AS_NODE;delete env.UMBRA_OFFLINE;
 const executablePath=process.env.UMBRA_TEST_EXE;
 const app=await electron.launch({...(executablePath?{executablePath}:{}),args:[...(!executablePath?[root]:[]),'--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+signal],env});apps.push(app);
 const page=await app.firstWindow();await page.locator('#auth-form').waitFor();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].hide());
 if(await page.getByRole('heading',{name:'Se connecter'}).count())await page.locator('[data-action=auth-mode]').click();
 await page.locator('#auth-name').fill(name);await page.locator('#auth-password').fill('vad-test-password');await page.locator('[name=joinCode]').fill('vad-test');await page.locator('#auth-form [type=submit]').click();await page.locator('#tour').waitFor();await page.locator('#tour-skip').click();await page.locator('#tour').waitFor({state:'detached'});
 await page.evaluate(()=>window.desktop.action({type:'settings',values:{audioProfile:'studio',noiseSuppression:false,echoCancellation:false,autoGainControl:false,outputVolume:0}}));
 return {app,page};
}
async function action(c,a){return c.page.evaluate(a=>window.desktop.action(a),a);}
async function level(c){return c.page.evaluate(async()=>{
 const el=document.querySelector('audio[data-voice-kind=primary]');if(!el?.srcObject)return 0;
 if(!window.__probe||window.__probe.stream!==el.srcObject){const ctx=new AudioContext();await ctx.resume();const detector=ctx.createAnalyser();detector.fftSize=1024;ctx.createMediaStreamSource(el.srcObject).connect(detector);window.__probe={ctx,detector,data:new Float32Array(1024),stream:el.srcObject};}
 const {detector,data}=window.__probe;detector.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length);
});}
async function setting(c,key,value){await c.page.locator('[data-setting="'+key+'"]').first().evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));},value);await until(()=>c.page.evaluate(async({key,value})=>(await window.desktop.load()).state.settings[key]===value,{key,value}),'Setting '+key);}
try{
 const secret=randomBytes(32).toString('hex'),config=path.join(dir,'livekit.yaml');await fs.writeFile(config,`port: 19980\nbind_addresses: ["127.0.0.1"]\nrtc:\n  tcp_port: 19981\n  udp_port: 19982\n  node_ip: 127.0.0.1\n  use_external_ip: false\n  enable_loopback_candidate: true\nkeys:\n  test: ${secret}\n`);
 engine=spawn(path.join(root,'runtime/livekit-server.exe'),['--config',config],{windowsHide:true,stdio:'ignore'});
 const rtc=new RoomServiceClient('http://127.0.0.1:19980','test',secret);await until(async()=>{try{await rtc.listRooms();return true;}catch{return false;}},'LiveKit');
 api=await startApi({dataDir:path.join(dir,'server'),port:0,bind:'127.0.0.1',joinCode:'vad-test',apiKey:'test',apiSecret:secret,livekitUrl:'http://127.0.0.1:19980',publicVoiceUrl:'ws://127.0.0.1:19980',namespace:'vad-acceptance'});
 const a=await client('GateSender'),created=await action(a,{type:'create',name:'LOW VOICE',kind:'Infanterie',mood:'Tactique',role:'Medic',roles:['Recon']}),q=created.squads[0];
 const b=await client('GateReceiver');await action(b,{type:'join',squadId:q.id,slotId:q.slots[1].id});
 for(const c of [a,b]){await c.page.locator('.sidebar [data-action=voiceConnect]').click();await until(()=>c.page.locator('[data-voice-status]').textContent().then(t=>t==='Voix connectée'),'Connected');}
 await a.page.locator('[data-nav=settings]').click();await until(()=>a.page.locator('.microphone-meter').getAttribute('data-level-db').then(v=>v!==null&&Number(v)>-48),'Quiet input metered');
 const measured=Number(await a.page.locator('.microphone-meter').getAttribute('data-level-db'));assert.ok(measured< -35&&measured> -48,'Signal below old gate, above new gate: '+measured);
 await until(async()=>await level(b)>.001,'Quiet voice received without holding a key');assert.ok((await a.page.locator('[data-vad-level]').textContent()).includes('Voix détectée'));
 await setting(a,'vadThresholdDb',-30);await pause(700);assert.ok(await level(b)<.0005,'Higher threshold closes gate');
 await setting(a,'vadThresholdDb',-48);await until(async()=>await level(b)>.001,'Lower threshold opens live without reconnecting');
 await setting(a,'inputVolume',25);await pause(700);assert.ok(await level(b)<.0005,'Detection observes microphone gain');
 await setting(a,'inputVolume',100);await until(async()=>await level(b)>.001,'Gain restores detection');
 await setting(a,'inputVolume',0);await pause(700);assert.ok(await level(b)<.0005,'Zero gain remains silent');
 await fs.writeFile(path.join(dir,'result.json'),JSON.stringify({quietInputDb:measured,belowOldGate:true,receivedWithoutPTT:true,liveThreshold:true,gainAffectsDetection:true,zeroGainSilent:true},null,2));
 console.log('LOW VOICE PASS: '+measured+' dB input received in VAD, threshold live, gain respected, zero silent.');
}finally{for(const app of apps)await app.close().catch(()=>{});if(api)await api.close();engine?.kill();}
