import assert from 'node:assert/strict';
import {_electron as electron} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {RoomServiceClient} from 'livekit-server-sdk';
import {startApi} from '../server/api.mjs';

const root=path.resolve(import.meta.dirname,'..'),dir=await fs.mkdtemp(path.join(root,'artifacts/voice-connection-'));
const key='diagnostic',secret=randomBytes(32).toString('hex'),config=path.join(dir,'livekit.yaml');
await fs.writeFile(config,`port: 19890\nbind_addresses: ["127.0.0.1"]\nrtc:\n  tcp_port: 19891\n  udp_port: 19892\n  node_ip: 127.0.0.1\n  use_external_ip: false\n  enable_loopback_candidate: true\nkeys:\n  ${key}: ${secret}\n`);
const engine=spawn(process.env.UMBRA_LIVEKIT_EXE||path.resolve('../umbra/runtime/livekit-server.exe'),['--config',config],{windowsHide:true,stdio:'ignore'});
let api,app;const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const rtc=new RoomServiceClient('http://127.0.0.1:19890',key,secret);
 for(let i=0;;i++){try{await rtc.listRooms();break;}catch(e){if(i>30)throw e;await pause(100);}}
 api=await startApi({dataDir:path.join(dir,'server'),port:0,bind:'127.0.0.1',joinCode:'diagnostic',apiKey:key,apiSecret:secret,livekitUrl:'http://127.0.0.1:19890',publicVoiceUrl:'ws://127.0.0.1:19890'});
 const profile=path.join(dir,'profile');await fs.mkdir(profile);await fs.writeFile(path.join(profile,'connection.json'),JSON.stringify({url:'http://127.0.0.1:'+api.port,audioPreferences:{mic:'obsolete-input',output:'obsolete-output'}}));
 const env={...process.env,UMBRA_DATA_DIR:profile,UMBRA_TEST_DISPLAY:'right',UMBRA_SERVER_URL:'http://127.0.0.1:'+api.port};delete env.ELECTRON_RUN_AS_NODE;delete env.UMBRA_OFFLINE;
 const executablePath=process.env.UMBRA_TEST_EXE;app=await electron.launch({...(executablePath?{executablePath}:{}),args:[...(!executablePath?[root]:[]),'--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'],env});
 const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const placement=await app.evaluate(({BrowserWindow,screen})=>{const bounds=BrowserWindow.getAllWindows()[0].getBounds(),primary=screen.getPrimaryDisplay().id,display=screen.getDisplayMatching(bounds);return {right:display.id!==primary&&display.bounds.x>0};});assert.equal(placement.right,true);
 await page.locator('#auth-name').fill('VoiceDiagnostic');await page.locator('#auth-password').fill('diagnostic-password');await page.locator('[name=joinCode]').fill('diagnostic');await page.locator('#auth-form [type=submit]').click();await page.locator('#tour-skip').click();
 await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('voice:visit');ipcMain.handle('voice:visit',async()=>{await new Promise(r=>setTimeout(r,700));throw Error('Salon inaccessible pour ce test');});});
 await page.locator('#channel-rail [data-action=voiceLobby]').click();await page.waitForFunction(()=>document.querySelector('[data-voice-status]')?.textContent==='Connexion…');
 await page.waitForFunction(()=>document.querySelector('[data-voice-error]')?.textContent.includes('Salon inaccessible'));await pause(4700);assert.match(await page.locator('[data-voice-error]').textContent(),/Salon inaccessible/);
 await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('voice:visit');ipcMain.handle('voice:visit',()=>{});});
 await page.evaluate(()=>{window.__capture=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('','NotAllowedError');};});
 await page.locator('#channel-rail [data-action=voiceLobby]').click();await page.waitForFunction(()=>document.querySelector('[data-voice-error]')?.textContent.includes('Accès au microphone refusé'));
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=window.__capture;});await page.locator('#channel-rail [data-action=voiceLobby]').click();await page.waitForFunction(()=>document.querySelector('[data-voice-status]')?.textContent==='Voix connectée',{},{timeout:20000});
 const result=await page.evaluate(async()=>{const {voice}=await import('./src/app.mjs'),state=(await window.desktop.load()).state;return {mic:state.settings.mic,output:state.settings.output,rooms:[...voice.rooms.values()].map(e=>e.room.state),live:voice.stream.getAudioTracks()[0].readyState,error:voice.error};});
 assert.equal(result.mic,'');assert.equal(result.output,'');assert.ok(result.rooms.length>=1&&result.rooms.every(s=>s==='connected'));assert.equal(result.live,'live');assert.equal(result.error,'');assert.deepEqual(errors,[]);
 const saved=JSON.parse(await fs.readFile(path.join(profile,'connection.json'),'utf8'));assert.equal(saved.audioPreferences.mic,'');assert.equal(saved.audioPreferences.output,'');await page.screenshot({path:path.join(dir,'connected.png')});
 await page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');await voice.disconnect();});
 console.log('VOICE CONNECTION PASS: immediate pending state; persistent visit/empty permission errors; obsolete mic/speaker recovery saved; LiveKit connected with live audio; isolated right display. '+dir);
}finally{if(app)await app.close();if(api)await api.close();engine.kill();}
