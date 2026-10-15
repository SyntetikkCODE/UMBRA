import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audioSettings,validateAudio,playbackVolume,primaryDestination,audioDeviceOptions} from '../src/audio.mjs';
import {createVoiceGate,rmsLevel,DEFAULT_VAD_DB,thresholdAmplitude} from '../src/activity.mjs';
test('Legacy audio preferences keep choices and gain neutral defaults',()=>{
 const s=audioSettings({mic:'usb-mic',squadVolume:42,leadersVolume:80,ducking:false});
 validateAudio(s);assert.equal(s.mic,'usb-mic');assert.equal(s.inputVolume,100);assert.equal(s.outputVolume,100);assert.equal(s.squadVolume,42);assert.equal(s.output,'');
 assert.equal(s.vadThresholdDb,-48);assert.equal(audioSettings({vadThresholdDb:-55}).vadThresholdDb,-55);
});
test('Master output affects every channel and zero silences them',()=>{
 const s=audioSettings({outputVolume:50,squadVolume:80,leadersVolume:60});
 assert.equal(playbackVolume('primary',s),.4);assert.equal(playbackVolume('leaders',s),.3);assert.equal(playbackVolume('broadcast',s),.3);
 assert.equal(playbackVolume('primary',{...s,outputVolume:0}),0);assert.equal(playbackVolume('broadcast',s,{deafened:true}),0);
});
test('Priority ducking affects only the squad and respects the toggle',()=>{
 const s=audioSettings({squadVolume:100});assert.equal(playbackVolume('primary',s,{leadersActive:true}),.25);assert.equal(playbackVolume('leaders',s,{leadersActive:true}),1);assert.equal(playbackVolume('primary',{...s,ducking:false},{leadersActive:true}),1);
});
test('Invalid gains, volumes and output IDs are rejected',()=>{
 for(const [key,value]of [['inputVolume',201],['inputVolume',-1],['outputVolume',101],['outputVolume',NaN],['soundsVolume',Infinity],['output',{}],['notificationSounds','yes']])assert.throws(()=>validateAudio({...audioSettings(),[key]:value}));
});
test('VAD opens on voice and closes after the short silence hold',()=>{
 const gate=createVoiceGate();assert.equal(gate(0,0),false);assert.equal(gate(.04,20),true);assert.equal(gate(0,150),true);assert.equal(gate(0,241),false);
});
test('Quiet microphone signal opens the new gate but not the old one; silence stays closed',()=>{
 const samples=Float32Array.from({length:1024},(_,i)=>Math.sin(i*.2)*.009),level=rmsLevel(samples);
 assert.ok(level<.018&&level>thresholdAmplitude(DEFAULT_VAD_DB));assert.equal(createVoiceGate({threshold:.018})(level,0),false);assert.equal(createVoiceGate()(level,0),true);
 const gate=createVoiceGate();assert.equal(gate(.0005,0),false);assert.equal(gate(0,30),false);assert.equal(gate(level,100),true);assert.equal(gate(0,321),false);
 assert.equal(gate(level,400,thresholdAmplitude(-30)),false);assert.equal(gate(level,500,thresholdAmplitude(-55)),true);
 for(const value of [-66,-19,Infinity,NaN,'-48'])assert.throws(()=>validateAudio({...audioSettings(),vadThresholdDb:value}));
});
test('A shared briefing has one destination across squads and room rotations',()=>{
 assert.equal(primaryDestination({squadId:'alpha',operationId:'brief'}),primaryDestination({squadId:'bravo',operationId:'brief'}));
 assert.equal(primaryDestination({squadId:'alpha',room:'rotated'}),'squad:alpha');assert.notEqual(primaryDestination({squadId:'alpha'}),primaryDestination({squadId:'bravo'}));assert.equal(primaryDestination({squadId:null}),'lobby');
});
test('Microphones and speakers are listed independently without Windows aliases',()=>{
 const devices=[{kind:'audioinput',deviceId:'default'},{kind:'audioinput',deviceId:'communications'},{kind:'audioinput',deviceId:'usb',label:'USB mic'},{kind:'audiooutput',deviceId:'headset',label:'Headset'},{kind:'videoinput',deviceId:'cam'}];
 assert.deepEqual(audioDeviceOptions(devices,'audioinput'),[{deviceId:'usb',label:'USB mic'}]);assert.deepEqual(audioDeviceOptions(devices,'audiooutput'),[{deviceId:'headset',label:'Headset'}]);
});
