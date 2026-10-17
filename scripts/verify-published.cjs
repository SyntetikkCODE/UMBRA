const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {verifyManifest,validateManifest}=require('../src/update-verification.cjs');
const yaml=require('js-yaml');
(async()=>{
 const base='https://umbra.lotus-order.fr/umbra-updates/';
 const bytes=Buffer.from(await (await fetch(base+'latest.yml')).arrayBuffer()),signature=await (await fetch(base+'latest.yml.sig')).text();
 verifyManifest(bytes,signature,fs.readFileSync(path.join(__dirname,'../assets/update-public-key.pem')));
 const info=validateManifest(yaml.load(bytes.toString('utf8')));assert.equal(info.version,require('../package.json').version);
 const head=await fetch(base+info.files[0].url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(Number(head.headers.get('content-length')),info.files[0].size);
 console.log('PUBLIC UPDATE CHANNEL PASS: publisher signature, version, installer availability and size.');
})().catch(e=>{console.error(e);process.exitCode=1;});
