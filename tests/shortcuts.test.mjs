import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import {captureKey,captureMouse,prettyKey,validateKeys} from '../src/shortcut-keys.mjs';
const require=createRequire(import.meta.url),{createPtt}=require('../src/ptt.cjs'),{UiohookKey}=require('uiohook-napi');
const idle={primary:false,leaders:false,broadcast:false};
function setup(){const hook=new EventEmitter(),sent=[];hook.start=()=>{};hook.stop=()=>{};return {hook,sent,ptt:createPtt(state=>sent.push(state),hook)};}

test('Mouse capture translates DOM order into native button names and preserves keyboard layout labels',()=>{
 for(const [button,key]of [[0,'Mouse1'],[1,'Mouse3'],[2,'Mouse2'],[3,'Mouse4'],[4,'Mouse5']])assert.deepEqual(captureMouse({button}),{key,label:prettyKey(key)});
 assert.equal(captureMouse({button:5}),null);
 assert.deepEqual(captureKey({code:'KeyQ',key:'a'}),{key:'Q',label:'A'});
 assert.equal(prettyKey('Mouse4'),'Souris 4 · Précédent');
});
test('Mixed keyboard and mouse shortcuts validate with duplicate and unsupported buttons rejected',()=>{
 validateKeys({primary:'Mouse4',leaders:'Mouse5',broadcast:'F10'});
 for(const keys of [{primary:'Mouse4',leaders:'Mouse4',broadcast:'F10'},{primary:'Mouse6',leaders:'F9',broadcast:'F10'}])assert.throws(()=>validateKeys(keys));
 const {ptt}=setup();for(let n=1;n<=5;n++)ptt.start({primary:'Mouse'+n,leaders:'F9',broadcast:'F10'});ptt.stop();
 assert.throws(()=>ptt.start({primary:'Mouse4',leaders:'Mouse4',broadcast:'F10'}));
});
test('Native side buttons hold and release independently, with repeat and unrelated events ignored',()=>{
 const {hook,sent,ptt}=setup();ptt.start({primary:'Mouse4',leaders:'Mouse5',broadcast:'F10'});
 hook.emit('mousedown',{button:4});assert.deepEqual(sent.at(-1),{...idle,primary:true});const length=sent.length;
 hook.emit('mousedown',{button:4});hook.emit('keydown',{keycode:4});hook.emit('mousedown',{button:2});assert.equal(sent.length,length);
 hook.emit('mousedown',{button:5});assert.deepEqual(sent.at(-1),{...idle,primary:true,leaders:true});
 hook.emit('mouseup',{button:4});assert.deepEqual(sent.at(-1),{...idle,leaders:true});
 hook.emit('mouseup',{button:5});assert.deepEqual(sent.at(-1),idle);ptt.stop();
});
test('Mouse buttons never trigger matching keyboard scan codes; keyboard and numpad still work',()=>{
 const {hook,sent,ptt}=setup();ptt.start({primary:'Escape',leaders:'Numpad1',broadcast:'F10'});
 hook.emit('mousedown',{button:1});assert.deepEqual(sent.at(-1),idle);
 hook.emit('keydown',{keycode:UiohookKey.Escape});assert.deepEqual(sent.at(-1),{...idle,primary:true});
 hook.emit('keyup',{keycode:UiohookKey.Escape});hook.emit('keydown',{keycode:UiohookKey.NumpadEnd});assert.deepEqual(sent.at(-1),{...idle,leaders:true});ptt.stop();
});
test('Stopping or rebinding a held mouse button clears transmission and ignores events while stopped',()=>{
 const {hook,sent,ptt}=setup();ptt.start({primary:'Mouse4',leaders:'F9',broadcast:'F10'});hook.emit('mousedown',{button:4});ptt.stop();assert.deepEqual(sent.at(-1),idle);
 const length=sent.length;hook.emit('mousedown',{button:4});hook.emit('keydown',{keycode:UiohookKey.F9});assert.equal(sent.length,length);
 ptt.start({primary:'Mouse5',leaders:'F9',broadcast:'F10'});hook.emit('mouseup',{button:4});hook.emit('mousedown',{button:4});assert.deepEqual(sent.at(-1),idle);
 hook.emit('mousedown',{button:5});assert.equal(sent.at(-1).primary,true);ptt.start({primary:'F8',leaders:'F9',broadcast:'F10'});assert.deepEqual(sent.at(-1),idle);ptt.stop();
});
