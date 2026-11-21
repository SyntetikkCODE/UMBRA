import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureMicrophone,voiceError} from '../src/audio-devices.mjs';

const failure=(name,constraint)=>Object.assign(new Error(''),{name,constraint});
test('An obsolete microphone and speaker recover to Windows defaults without changing processing or volumes',async()=>{
 const calls=[],stream={getTracks:()=>[]};
 const result=await captureMicrophone({mic:'obsolete',output:'obsolete-output',inputVolume:65,noiseSuppression:false},{getUserMedia:async options=>{calls.push(options);if(options.audio.deviceId)throw failure('OverconstrainedError','deviceId');return stream;},enumerateDevices:async()=>[{kind:'audiooutput',deviceId:'current-output'}]});
 assert.deepEqual(result.changes,{mic:'',output:''});assert.equal(result.stream,stream);assert.equal(result.settings.inputVolume,65);assert.equal(calls.length,2);assert.equal(calls[1].audio.noiseSuppression,false);assert.equal(calls[1].audio.deviceId,undefined);
});
test('A valid selected device is kept, including Windows aliases',async()=>{
 for(const output of ['usb-output','default','communications']){
  const result=await captureMicrophone({mic:'usb-input',output},{getUserMedia:async options=>{assert.deepEqual(options.audio.deviceId,{exact:'usb-input'});return {getTracks:()=>[]};},enumerateDevices:async()=>[{kind:'audiooutput',deviceId:'usb-output'}]});
  assert.deepEqual(result.changes,{});assert.equal(result.settings.output,output);
 }
});
test('Permission, busy-device and processing failures do not silently switch microphones',async()=>{
 for(const error of [failure('NotAllowedError'),failure('NotReadableError'),failure('OverconstrainedError','sampleRate')]){
  let attempts=0;await assert.rejects(captureMicrophone({mic:'chosen'},{getUserMedia:async()=>{attempts++;throw error;}}),e=>e===error);assert.equal(attempts,1);
 }
});
test('No default microphone produces a readable error instead of repeated retries',async()=>{
 let attempts=0;await assert.rejects(captureMicrophone({mic:'missing'},{getUserMedia:async()=>{attempts++;throw failure('NotFoundError');}}),e=>voiceError(e).includes('Aucun microphone'));assert.equal(attempts,2);
});
test('Failures after capture release the microphone, and empty errors have useful messages',async()=>{
 let stopped=false;await assert.rejects(captureMicrophone({output:'selected'},{getUserMedia:async()=>({getTracks:()=>[{stop:()=>{stopped=true;}}]}),enumerateDevices:async()=>{throw Error('enumeration failed');}}));assert.equal(stopped,true);
 for(const name of ['NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError','Error'])assert.ok(voiceError(failure(name)).length>20);
 assert.equal(voiceError(Error("Error invoking remote method 'voice:visit': Error: Salon inaccessible")),'Salon inaccessible');
});
