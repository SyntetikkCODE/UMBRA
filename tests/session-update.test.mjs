import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import {Sessions,sessionKey} from '../server/sessions.mjs';
const require=createRequire(import.meta.url),{createUpdates}=require('../src/updates.cjs'),{RememberedSession}=require('../src/remembered-session.cjs');
test('Remembered sessions survive server restart as hashes, expire and revoke; ordinary sessions do not persist',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'umbra-sessions-')),a=new Sessions(dir);await a.open(()=>true);
 const token=await a.issue('member',true),plain=await a.issue('other');assert.equal(a.identify(token),'member');
 const file=await fs.readFile(a.file,'utf8');assert.ok(!file.includes(token));assert.ok(file.includes(sessionKey(token)));assert.ok(!file.includes('other'));
 const b=new Sessions(dir);await b.open(()=>true);assert.equal(b.identify(token),'member');assert.throws(()=>b.identify(plain),/Session/);
 const replacement=await b.issue('member',true);assert.throws(()=>b.identify(token),/Session/);await b.revoke(replacement);const c=new Sessions(dir);await c.open(()=>true);assert.throws(()=>c.identify(replacement),/Session/);
 const expiring=await c.issue('member',true);c.values.get(sessionKey(expiring)).expires=Date.now()-1;assert.throws(()=>c.identify(expiring),/Session/);await c.expire();assert.deepEqual(JSON.parse(await fs.readFile(c.file,'utf8')),[]);
 const d=new Sessions(dir);await d.open(()=>false);assert.equal(d.values.size,0);
});
test('Saved desktop session requires encryption, stays bound to its server and is removed on logout',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'umbra-desktop-session-'));
 const disabled=new RememberedSession(dir,{isEncryptionAvailable:()=>false});await assert.rejects(()=>disabled.save({}),/Windows/);await assert.rejects(()=>fs.stat(disabled.file),{code:'ENOENT'});
 const encrypted=new RememberedSession(dir,{isEncryptionAvailable:()=>true,encryptString:s=>Buffer.from(s).map(n=>n^0xa5),decryptString:b=>Buffer.from(b).map(n=>n^0xa5).toString()});
 const token='a'.repeat(64);await encrypted.save({base:'https://team.example/api',token});assert.ok(!(await fs.readFile(encrypted.file)).includes(Buffer.from(token)));assert.equal((await encrypted.load('https://team.example/api')).token,token);assert.equal(await encrypted.load('https://other.example/api'),null);await encrypted.clear();assert.equal(await encrypted.load('https://team.example/api'),null);
});
test('An open app discovers a pushed update without downloading or restarting; explicit update verifies and installs',async()=>{
 const fake=new EventEmitter();let published=false,downloads=0,installs=0,checks=0,verified=0,before=0;
 fake.checkForUpdates=async()=>{checks++;return {isUpdateAvailable:published,updateInfo:{version:'0.14.0',files:[{url:'test.exe'}]}};};
 fake.downloadUpdate=async()=>{downloads++;fake.installerPath='test.exe';fake.emit('download-progress',{percent:76});};fake.quitAndInstall=()=>installs++;
 const updates=createUpdates({app:{getVersion:()=> '0.13.0'},isInstalled:true,makeUpdater:()=>fake,verifyDownload:async()=>{verified++;},beforeInstall:async()=>{before++;},pollMs:10});
 try{await updates.start();assert.equal(updates.status().phase,'current');published=true;await new Promise(r=>setTimeout(r,60));assert.ok(checks>1);assert.equal(updates.status().phase,'available');assert.equal(downloads,0);assert.equal(installs,0);assert.equal(updates.status().startup,false);await updates.check();assert.equal(updates.status().phase,'ready');assert.equal(downloads,1);assert.equal(installs,0);await updates.install();assert.equal(installs,1);assert.equal(before,1);assert.equal(verified,2);}finally{updates.stop();}
});
test('Invalid installer never triggers an installation; a concurrent background probe does not swallow a click',async()=>{
 const fake=new EventEmitter();let resolveCheck,installs=0,downloads=0;
 fake.checkForUpdates=()=>new Promise(resolve=>{resolveCheck=resolve;});fake.downloadUpdate=async()=>{downloads++;fake.installerPath='invalid.exe';};fake.quitAndInstall=()=>installs++;
 const updates=createUpdates({app:{getVersion:()=> '0.13.0'},isInstalled:true,makeUpdater:()=>fake,verifyDownload:async()=>{throw new Error('Invalid hash');}});
 const result={isUpdateAvailable:true,updateInfo:{version:'0.14.0',files:[{url:'test.exe'}]}};
 const probe=updates.probe(),click=updates.check();resolveCheck(result);await probe;await new Promise(r=>setImmediate(r));resolveCheck(result);await click;assert.equal(downloads,1);assert.equal(updates.status().phase,'error');assert.equal(installs,0);await assert.rejects(()=>updates.install(),/Aucune/);updates.stop();
});
