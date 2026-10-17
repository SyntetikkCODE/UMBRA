import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import {SquadTemplates,templateDefinition} from '../src/squad-templates.mjs';
import {validateBindings,nativeBindings} from '../src/custom-shortcuts.mjs';
import {diagnosticChecks} from '../src/voice-diagnostics.mjs';
const require=createRequire(import.meta.url),{createCaptureSelection}=require('../src/screen-capture.cjs'),{createPtt}=require('../src/ptt.cjs');
const keys={primary:'F8',leaders:'F9',broadcast:'F10'};
test('Media permission checks include Chromium generic checks but refuse other origins, frames and permissions',()=>{
 const {mediaPermissionCheck:check}=require('../src/media-permissions.cjs');
 for(const type of [undefined,'unknown','audio','video'])assert.equal(check(true,'media','umbra://app/',type),true);
 assert.equal(check(false,'media','umbra://app/','video'),false);assert.equal(check(true,'media','https://example.com','video'),false);assert.equal(check(true,'media','umbra://app.evil/','video'),false);assert.equal(check(true,'geolocation','umbra://app/',undefined),false);
});
test('Custom shortcuts reject radio conflicts, duplicate keys, arbitrary actions and invalid native IDs',()=>{
 const b={id:'custom_one',action:'toggleMute',key:'Mouse4',label:'Souris 4'};
 assert.deepEqual(nativeBindings(keys,[b]),{...keys,custom_one:'Mouse4'});
 for(const bindings of [[{...b,key:'F8'}],[b,{...b,id:'custom_two'}],[{...b,action:'shell'}],[{...b,id:'__proto__'}]])assert.throws(()=>validateBindings(keys,bindings));
});
test('Global custom bindings preserve hold/release edges and clear held state when rebinding or stopping',()=>{
 const hook=new EventEmitter(),sent=[];hook.start=()=>{};hook.stop=()=>{};const ptt=createPtt(v=>sent.push(v),hook);
 ptt.start({...keys,custom_hold:'Mouse4'});hook.emit('mousedown',{button:4});assert.equal(sent.at(-1).custom_hold,true);const n=sent.length;hook.emit('mousedown',{button:4});assert.equal(sent.length,n);hook.emit('mouseup',{button:4});assert.equal(sent.at(-1).custom_hold,false);hook.emit('mousedown',{button:4});ptt.stop();assert.equal(sent.at(-1).custom_hold,false);assert.throws(()=>ptt.start({...keys,anything:'Mouse4'}));
});
test('Templates retain the leader post and appearance but never member identities; isolated, persistent and removable',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},templates=new SquadTemplates(storage);templates.load('server|alice');
 const q={name:'Alpha',type:'Infanterie',mood:'Tactique',icon:'target',color:'#6486ae',leaderId:'bob',slots:[{id:'a',role:'Medic',playerId:'alice'},{id:'b',role:'Pilote',playerId:'bob'}]};
 const saved=templates.save(q);assert.deepEqual(saved.roles,['Pilote','Medic']);assert.equal(saved.color,'#6486ae');assert.ok(!JSON.stringify(saved).includes('alice'));assert.ok(!JSON.stringify(saved).includes('bob'));
 templates.load('server|bob');assert.equal(templates.items.length,0);templates.load('server|alice');assert.equal(templates.items.length,1);templates.save({...saved,name:'Bravo'},saved.id);assert.equal(templates.items[0].name,'Bravo');templates.remove(saved.id);assert.equal(templates.items.length,0);
 assert.throws(()=>templateDefinition({...q,roles:[]}));assert.throws(()=>templateDefinition({...q,roles:Array(17).fill('Medic')}));
});
test('Screen consent is limited to listed sources, expires, is single use and rejects unchosen capture',()=>{
 let time=0;const consent=createCaptureSelection(()=>time);assert.equal(consent.consume(),null);consent.list([{id:'window:1'}]);assert.throws(()=>consent.select('screen:all'));consent.select('window:1',true);assert.deepEqual(consent.consume(),{id:'window:1',audio:true});assert.equal(consent.consume(),null);consent.list([{id:'window:1'}]);consent.select('window:1');time=90001;assert.equal(consent.consume(),null);assert.throws(()=>consent.select('window:1'));
});
test('Diagnostic distinguishes offline, poor network, unavailable devices, local test and silent gate',()=>{
 const checks=diagnosticChecks({shared:true,online:true,enabled:true,roomState:'connected',quality:'poor',muted:false,deafened:false,micLive:true,testing:true,detected:false,peakDb:-60,threshold:-48,inputVolume:100,outputVolume:0});
 assert.equal(checks.find(c=>c[0]==='Qualité du réseau')[1],'bad');assert.equal(checks.find(c=>c[0]==='Microphone')[1],'ok');assert.match(checks.find(c=>c[0]==='Transmission')[2],/aucun son transmis/);assert.match(checks.find(c=>c[0]==='Détection de voix')[2],/sous la gate/);assert.equal(checks.find(c=>c[0]==='Sortie audio')[1],'bad');
});

test('Desktop capture media permission needs a pending explicit choice',()=>{const {mediaPermissionRequest:allow}=require('../src/media-permissions.cjs');assert.equal(allow(true,'media',['video']),true);assert.equal(allow(true,'media',[]),false);assert.equal(allow(true,'media',[],true),true);assert.equal(allow(false,'media',[],true),false);assert.equal(allow(true,'display-capture',[],true),true);assert.equal(allow(true,'display-capture',[]),false);});
