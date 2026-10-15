import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const {createSigner}=createRequire(import.meta.url)('../build/signpath-sign.cjs');
async function fixture(t,overrides={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'umbra-signpath-test-'));t.after(async()=>{assert.equal(path.dirname(root),os.tmpdir());assert.ok(path.basename(root).startsWith('umbra-signpath-test-'));await fs.rm(root,{recursive:true,force:true});});
 await fs.writeFile(path.join(root,'package.json'),JSON.stringify({version:'0.14.3'}));const file=path.join(root,'UMBRA.exe');await fs.writeFile(file,'original');
 const env={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_REPOSITORY:'SyntetikkCODE/UMBRA',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch',SIGNPATH_API_TOKEN:'test-only-not-a-token',SIGNPATH_ORGANIZATION_ID:'test',SIGNPATH_PUBLISHER:'Test identity',GITHUB_TOKEN:'test-only',RUNNER_TEMP:root,SIGNPATH_ACTION_PATH:root};
 const calls=[];const dependencies={env,root,upload:async(name,file)=>{calls.push('upload');assert.equal(await fs.readFile(file,'utf8'),'original');return 123;},submit:async({artifactId,directory,version})=>{calls.push('submit');assert.equal(artifactId,123);assert.equal(version,'0.14.3.0');await fs.mkdir(directory);await fs.writeFile(path.join(directory,'umbra-signable.exe'),'signed');},verify:async(file,publisher,version)=>{calls.push('verify');assert.equal(await fs.readFile(file,'utf8'),'signed');assert.equal(publisher,'Test identity');assert.equal(version,'0.14.3.0');},...overrides};
 return {root,file,env,calls,dependencies};
}
test('SignPath returns only verified bytes and preserves build version metadata',async t=>{
 const f=await fixture(t);await createSigner(f.dependencies)({path:f.file,hash:'sha256'});assert.deepEqual(f.calls,['upload','submit','verify']);assert.equal(await fs.readFile(f.file,'utf8'),'signed');assert.equal((await fs.readdir(f.root)).some(n=>n.startsWith('umbra-signpath-')),false);
});
test('Rejected Authenticode publisher or signature leaves the original file untouched',async t=>{
 const f=await fixture(t,{verify:async()=>{throw new Error('invalid signature');}});await assert.rejects(createSigner(f.dependencies)({path:f.file,hash:'sha256'}),/invalid signature/);assert.equal(await fs.readFile(f.file,'utf8'),'original');
});
test('Signing service failure never silently falls back to an unsigned release',async t=>{
 const f=await fixture(t,{submit:async()=>{throw new Error('service unavailable');}});await assert.rejects(createSigner(f.dependencies)({path:f.file,hash:'sha256'}),/service unavailable/);assert.equal(await fs.readFile(f.file,'utf8'),'original');
});
test('Local builds, forks, pull requests, wrong branches and self-hosted runners cannot use release signing',async t=>{
 for(const [key,value]of [['GITHUB_ACTIONS','false'],['GITHUB_REPOSITORY','someone/UMBRA'],['GITHUB_REF','refs/heads/feature'],['GITHUB_EVENT_NAME','pull_request'],['RUNNER_ENVIRONMENT','self-hosted']]){const f=await fixture(t);f.env[key]=value;await assert.rejects(createSigner(f.dependencies)({path:f.file,hash:'sha256'}),/requires a manual build/);assert.deepEqual(f.calls,[]);}
});
test('Unexpected third-party binaries and SHA1 requests are rejected before upload',async t=>{
 for(const configuration of [{path:'elevate.exe',hash:'sha256'},{path:'UMBRA.exe',hash:'sha1'}]){const f=await fixture(t);await assert.rejects(createSigner(f.dependencies)({...configuration,path:path.join(f.root,configuration.path)}),/Refusing|SHA-256/);assert.deepEqual(f.calls,[]);}
});
