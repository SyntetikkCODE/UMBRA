import {_electron as electron} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=await fs.mkdtemp(path.join(path.resolve('artifacts'),'hardware-'));
const env={...process.env,UMBRA_DATA_DIR:dir,UMBRA_OFFLINE:'1'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({...(process.env.UMBRA_TEST_EXE?{executablePath:process.env.UMBRA_TEST_EXE}:{}),args:process.env.UMBRA_TEST_EXE?[]:[path.resolve('.')],env});
try{
 const page=await app.firstWindow();await page.locator('#auth-form').waitFor();assert.ok((await page.locator('.auth-version').textContent()).includes('0.8.0'));
 const result=await page.evaluate(async()=>{
  const devices=await navigator.mediaDevices.enumerateDevices(),inputs=devices.filter(d=>d.kind==='audioinput'),outputs=devices.filter(d=>d.kind==='audiooutput');
  const el=document.createElement('audio'),output=outputs.find(d=>d.deviceId!=='default'&&d.deviceId!=='communications');if(output)await el.setSinkId(output.deviceId);
  return {inputs:inputs.map(d=>({label:d.label,alias:['default','communications'].includes(d.deviceId)})),outputs:outputs.map(d=>({label:d.label,alias:['default','communications'].includes(d.deviceId)})),outputSelection:!!output&&el.sinkId===output.deviceId};
 });
 assert.ok(result.inputs.some(d=>!d.alias&&d.label));assert.ok(result.outputs.some(d=>!d.alias&&d.label));assert.equal(result.outputSelection,true);
 await fs.writeFile(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log('REAL WINDOWS DEVICE ENUMERATION PASS',JSON.stringify(result));
}finally{await app.close();}
