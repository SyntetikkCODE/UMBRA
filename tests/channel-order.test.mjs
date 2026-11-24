import {test} from 'node:test';import assert from 'node:assert/strict';import {ChannelOrder} from '../src/channel-order.mjs';
test('Text order is personal per account/server, survives reload and keeps pin priority',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},channels=[{id:'general'},{id:'squad:a'},{id:'squad:b'},{id:'custom'}];
 const a=new ChannelOrder(()=> 'one|alice',storage);a.move(channels,'squad:b','general');assert.deepEqual(a.ordered(channels).map(c=>c.id),['squad:b','general','squad:a','custom']);
 assert.deepEqual(new ChannelOrder(()=> 'one|alice',storage).ordered(channels,['custom']).map(c=>c.id),['custom','squad:b','general','squad:a']);
 for(const key of ['one|bob','two|alice'])assert.deepEqual(new ChannelOrder(()=>key,storage).ordered(channels),channels);
 assert.deepEqual(channels.map(c=>c.id),['general','squad:a','squad:b','custom']);
 assert.deepEqual(a.ordered([...channels,{id:'new'}]).map(c=>c.id),['squad:b','general','squad:a','custom','new']);
});
