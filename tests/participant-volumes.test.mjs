import test from 'node:test';
import assert from 'node:assert/strict';
import {ParticipantVolumes,participantVolume} from '../src/participant-volumes.mjs';
test('Participant volume is bounded, isolated by server/account, remembered by identity and resettable',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)},first=new ParticipantVolumes(storage);first.load('team|alice');assert.equal(first.get('bob'),100);first.set('bob',300);first.set('charlie',0);assert.equal(first.get('bob'),300);assert.equal(first.get('charlie'),0);
 const restarted=new ParticipantVolumes(storage);restarted.load('team|alice');assert.equal(restarted.get('bob'),300);restarted.load('team|charlie');assert.equal(restarted.get('bob'),100);restarted.load('other-team|alice');assert.equal(restarted.get('bob'),100);restarted.load('team|alice');assert.equal(restarted.get('bob'),300);restarted.set('bob',100);assert.equal(JSON.parse(storage.getItem('umbra-player-volumes:team|alice')).bob,undefined);
 for(const value of [-1,301,Infinity,NaN,'300'])assert.throws(()=>participantVolume(value));
 storage.setItem('umbra-player-volumes:team|malformed',JSON.stringify({bob:999,charlie:'300',valid:200}));restarted.load('team|malformed');assert.equal(restarted.get('bob'),100);assert.equal(restarted.get('charlie'),100);assert.equal(restarted.get('valid'),200);
});
