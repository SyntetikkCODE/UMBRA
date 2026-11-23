import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {voiceOverlayState} from '../src/overlay-state.mjs';import {splitOutputGain} from '../src/output-gain.mjs';import {audioSettings,validateAudio,playbackVolume} from '../src/audio.mjs';
const require=createRequire(import.meta.url),{CORNERS,overlaySettings,overlayBounds,overlayPayload,overlayProfiles}=require('../src/overlay-model.cjs');
test('Overlay avatars only accept bounded raster images, without fetching external URLs',()=>{
 const result=overlayProfiles([{id:'a',picture:'https://example.com/photo.png'},{id:'b',picture:'data:image/svg+xml;base64,PHN2Zz4='},{id:'c',picture:'data:image/png;base64,AQID'},{id:'d',picture:'data:image/png;base64,'+'A'.repeat(400000)}]);assert.deepEqual(result.map(p=>!!p.picture),[false,false,true,false]);
});
test('Overlay stays inside the selected display for every corner, including negative desktop coordinates',()=>{
 const area={x:-1920,y:180,width:1920,height:1040};for(const corner of CORNERS){const b=overlayBounds(area,corner,8);assert.ok(b.x>=area.x&&b.y>=area.y&&b.x+b.width<=area.x+area.width&&b.y+b.height<=area.y+area.height);assert.equal(corner.endsWith('right')?b.x+b.width: b.x,corner.endsWith('right')?area.x+area.width-16:area.x+16);}
 assert.equal(overlaySettings({enabled:true,corner:'bottom-right',displayId:42}).displayId,42);for(const value of [{enabled:true,corner:'middle',displayId:null},{enabled:'yes',corner:'top-left',displayId:null},{enabled:true,corner:'top-left',displayId:'42'}])assert.throws(()=>overlaySettings(value));
});
test('Overlay payload is bounded, deduplicated and strips control characters',()=>{
 const value=overlayPayload({connected:true,label:'Vocal\nname',speakers:Array.from({length:60},(_,i)=>({id:String(i),name:'Player '+i,channel:'primary'}))});assert.equal(value.speakers.length,50);assert.equal(value.extra,10);assert.equal(value.label,'Vocalname');assert.deepEqual(overlayPayload({speakers:[{id:'1',name:'A',channel:'unknown'}]}).speakers,[]);
 assert.equal(overlayPayload({speakers:[{id:'1',name:'A',channel:'primary'},{id:'1',name:'A',channel:'broadcast'}]}).speakers.length,1);
});
test('Overlay keeps the whole channel roster and highlights only transmitted voices in listened channels',()=>{
 const room={state:'connected',remoteParticipants:new Map([['peer',{}]])},voice={enabled:true,rooms:new Map([['primary',{room,channel:{label:'Alpha'}}]]),speaking:true,transmitting:'primary',effectiveMuted:false,deafened:false},state={currentUserId:'self',players:[{id:'self',name:'Self'},{id:'peer',name:'Peer'},{id:'outside',name:'Outside'}]},activity=new Map([['peer',{channel:'primary',speaking:true}],['outside',{channel:'primary',speaking:true}]]);
 assert.deepEqual(voiceOverlayState(voice,state,activity,new Map(),true).speakers.map(p=>p.id),['self','peer']);
 assert.deepEqual(voiceOverlayState({...voice,effectiveMuted:true},state,activity,new Map([['peer',{muted:true}]]),true).speakers.filter(p=>p.speaking),[]);
 assert.equal(voiceOverlayState(voice,state,activity,new Map(),false).connected,false);assert.equal(voiceOverlayState({...voice,enabled:false},state,activity,new Map(),true).speakers.length,0);
 assert.equal(voiceOverlayState(voice,state,new Map([['peer',{channel:'leaders',speaking:true}]]),new Map(),true).speakers.filter(p=>p.speaking).length,1);
});
test('300% master uses Web Audio gain without invalid HTML media volume or changing 100% defaults',()=>{
 validateAudio(audioSettings({outputVolume:300}));for(const value of [0,.2,1,2.55,3,9]){const split=splitOutputGain(value);assert.ok(split.volume>=0&&split.volume<=1);assert.equal(split.volume*split.boost,value);}
 assert.deepEqual(splitOutputGain(playbackVolume('primary',{outputVolume:300,squadVolume:100})),{volume:1,boost:3});assert.deepEqual(splitOutputGain(playbackVolume('primary',{outputVolume:100,squadVolume:85})),{volume:.85,boost:1});assert.equal(playbackVolume('leaders',{outputVolume:300},{deafened:true}),0);
});
