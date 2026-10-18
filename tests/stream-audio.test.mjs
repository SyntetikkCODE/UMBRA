import test from 'node:test';
import assert from 'node:assert/strict';
import {StreamAudioPreferences,streamAudio,streamGain} from '../src/stream-audio.mjs';
test('Stream volume, mute and ducking are independent, bounded and isolated by account/server',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},prefs=new StreamAudioPreferences(storage);prefs.load('team|alice');
 assert.deepEqual(prefs.get('bob'),{volume:100,muted:false,attenuation:true,strength:50});prefs.set('bob',{volume:175,strength:70});assert.equal(streamGain(prefs.get('bob'),true),.5250000000000001);assert.equal(streamGain(prefs.get('bob'),false),1.75);
 prefs.set('bob',{muted:true});assert.equal(streamGain(prefs.get('bob')),0);prefs.set('bob',{muted:false,attenuation:false});assert.equal(streamGain(prefs.get('bob'),true),1.75);assert.equal(prefs.get('charlie').volume,100);
 const restart=new StreamAudioPreferences(storage);restart.load('team|alice');assert.equal(restart.get('bob').volume,175);restart.load('team|bob');assert.equal(restart.get('bob').volume,100);restart.load('other|alice');assert.equal(restart.get('bob').volume,100);assert.throws(()=>prefs.set('',{}));
 assert.deepEqual(streamAudio({volume:999,muted:'true',strength:-1,attenuation:'false'}),{volume:100,muted:false,strength:50,attenuation:true});assert.equal(streamGain({volume:200,strength:100},true),0);assert.equal(streamGain({volume:0},false),0);
 storage.setItem('umbra-stream-audio:malformed',JSON.stringify({bob:null,charlie:{volume:'200'},valid:{volume:150,muted:true}}));restart.load('malformed');assert.equal(restart.get('bob').volume,100);assert.equal(restart.get('charlie').volume,100);assert.equal(restart.get('valid').muted,true);
});
