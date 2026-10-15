import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url),{verifyManifest,validateManifest,verifyInstaller}=require('../src/update-verification.cjs'),{updateFeed}=require('../src/updates.cjs');
test('Signed update metadata accepts the publisher and rejects tampering or another key',()=>{
 const {privateKey,publicKey}=generateKeyPairSync('ed25519'),bytes=Buffer.from('version: 0.6.0\n');
 const signature=sign(null,bytes,privateKey).toString('base64');assert.doesNotThrow(()=>verifyManifest(bytes,signature,publicKey));
 assert.throws(()=>verifyManifest(Buffer.from('version: 9.9.9\n'),signature,publicKey));
 assert.throws(()=>verifyManifest(bytes,signature,generateKeyPairSync('ed25519').publicKey));assert.throws(()=>verifyManifest(bytes,'unsigned',publicKey));
});
test('Update manifest rejects arbitrary executables, remote paths and oversized installers',()=>{
 const base={version:'0.6.0',files:[{url:'UMBRA-Setup-0.6.0-win64.exe',size:123,sha512:Buffer.alloc(64).toString('base64')}]};assert.equal(validateManifest(base),base);
 for(const url of ['https://evil.test/a.exe','../a.exe','file:///a.exe','command.cmd'])assert.throws(()=>validateManifest({...base,files:[{...base.files[0],url}]}));
 assert.throws(()=>validateManifest({...base,files:[{...base.files[0],size:2**32}]}));assert.throws(()=>validateManifest({...base,packages:{x64:{path:'extra.7z'}}}));
});
test('Downloaded and cached installers are checked again before installation',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'umbra-update-integrity-')),file=path.join(dir,'installer.exe'),bytes=Buffer.from('signed test payload');
 try{await fs.writeFile(file,bytes);const expected={size:bytes.length,sha512:createHash('sha512').update(bytes).digest('base64')};await verifyInstaller(file,expected);await fs.writeFile(file,Buffer.from('modified test payload'));await assert.rejects(()=>verifyInstaller(file,expected));}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('Internet update feed needs HTTPS; isolated localhost tests remain possible',()=>{
 assert.equal(updateFeed(),'https://umbra.lotus-order.fr/umbra-updates/');assert.equal(updateFeed('http://127.0.0.1:8080'),'http://127.0.0.1:8080/');
 for(const url of ['http://evil.test/','https://user:password@evil.test/','file:///a','https://a/?token=secret'])assert.throws(()=>updateFeed(url));
});
