import test from 'node:test';
import assert from 'node:assert/strict';
import {ChannelsView} from '../src/channels-view.mjs';
import {voiceChannels} from '../server/routing.mjs';
import {VoiceVisits} from '../server/voice-visits.mjs';
import {fixture} from './fixture.mjs';
test('Ordinary unread messages have a white dot; only direct/everyone mentions get a yellow count and ping, once per event',()=>{
 globalThis.document={hasFocus:()=>true};const pings=[],v=new ChannelsView({},()=>{},()=>{},m=>pings.push(m.id),()=>false);v.userId='me';
 const send=(id,extra={})=>v.event({type:'chat',channelId:'general',message:{id,authorId:'other',text:'hello',...extra}});
 send('normal');assert.match(v.badge('general'),/chat-unread-dot/);assert.equal(pings.length,0);
 send('someone-else',{mentions:['someone']});assert.equal(pings.length,0);
 send('direct',{mentions:['me']});send('direct',{mentions:['me']});assert.match(v.badge('general'),/chat-mention-count/);assert.equal(v.mentions.get('general'),1);
 send('all',{everyone:true});send('own',{authorId:'me',everyone:true});assert.deepEqual(pings,['direct','all']);assert.equal(v.mentions.get('general'),2);
 v.channels=[{id:'general'}];v.load=()=>{};v.choose('general');assert.equal(v.badge('general'),'');v.reset();assert.equal(v.mentions.size,0);delete globalThis.document;
});
test('Admin-directed voice destination adds a temporary guest to the correct audience, without changing membership or leader rights',()=>{
 const s=fixture(),guest='regret',target=s.squads[1].id,before=JSON.stringify(s),baseline=voiceChannels(s,s.squads[1].leaderId)[0].room,forcedDestinations=new Map([[guest,target]]),options={forcedDestinations};
 const moved=voiceChannels(s,guest,options),host=voiceChannels(s,s.squads[1].leaderId,options);assert.equal(moved[0].room,host[0].room);assert.equal(moved[0].room,baseline);assert.equal(moved[0].squadId,target);assert.equal(moved.some(c=>c.kind==='leaders'),voiceChannels(s,guest).some(c=>c.kind==='leaders'));assert.equal(JSON.stringify(s),before);
 forcedDestinations.delete(guest);assert.equal(voiceChannels(s,s.squads[1].leaderId,options)[0].room,baseline);assert.notEqual(voiceChannels(s,guest,options)[0].room,host[0].room);
 forcedDestinations.set(guest,'lobby');assert.equal(voiceChannels(s,guest,options)[0].label,'Accueil');
 s.operations=[{id:'test-op',name:'Brief test',squadIds:[target],briefingSquadIds:[target],phase:'Préparation'}];forcedDestinations.set(guest,target);const brief=voiceChannels(s,guest,options)[0];assert.equal(brief.operationId,'test-op');assert.equal(brief.room,voiceChannels(s,s.squads[1].leaderId,options)[0].room);
});
test('Guest arrival preserves the destination; revocation rotates every private room actually granted, even across briefing changes',()=>{
 const s=fixture(),visits=new VoiceVisits(),guest='regret',target=s.squads[1].id,host=s.squads[1].leaderId,baseline=visits.plan(s,host)[0];visits.set(guest,target);const privatePlan=visits.plan(s,guest)[0];assert.equal(privatePlan.room,baseline.room);visits.record(s,guest,privatePlan);
 s.operations=[{id:'op',name:'Brief',squadIds:[target],briefingSquadIds:[target],phase:'Préparation'}];const brief=visits.plan(s,guest)[0];visits.record(s,guest,brief);assert.equal(brief.room,visits.plan(s,host)[0].room);s.operations[0].phase='Terminée';visits.clear(guest);assert.notEqual(visits.plan(s,host)[0].room,privatePlan.room);s.operations[0].phase='Préparation';assert.notEqual(visits.plan(s,host)[0].room,brief.room);assert.notEqual(visits.plan(s,guest)[0].room,visits.plan(s,host)[0].room);
});
test('No unnecessary rotation for an unused guest grant, an admin or a member returning to a naturally accessible room',()=>{
 const s=fixture(),v=new VoiceVisits(),target=s.squads[1].id,baseline=v.plan(s,s.squads[1].leaderId)[0].room;v.set('regret',target);v.clear('regret');assert.equal(v.plan(s,s.squads[1].leaderId)[0].room,baseline);v.set('me',target);v.record(s,'me',v.plan(s,'me')[0]);v.clear('me');assert.equal(v.plan(s,s.squads[1].leaderId)[0].room,baseline);v.set('fraisou',target);v.record(s,'fraisou',v.plan(s,'fraisou')[0]);v.clear('fraisou');assert.equal(v.plan(s,'fraisou')[0].room,baseline);
});
