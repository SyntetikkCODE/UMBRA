import assert from 'node:assert/strict';
export async function testAdminMove({a,b,c,d,qA,qC,until,action,hold,hears,release}){
 const before=(await b.page.evaluate(()=>window.desktop.load())).state.squads.find(q=>q.id===qA.id);
 assert.equal(await b.page.locator('.rail-person[draggable=true]').count(),0);
 await assert.rejects(()=>b.page.evaluate(({id,target})=>window.desktop.moveVoice({playerId:id,squadId:target}),{id:d.id,target:qA.id}),/admin/i);
 await assert.rejects(()=>a.page.evaluate(id=>window.desktop.moveVoice({playerId:id,squadId:'missing'}),b.id),/introuvable/);
 const member=a.page.locator('.rail-person[data-player="'+b.id+'"]');await member.waitFor();
 const unchanged=[];for(const client of [c,d])unchanged.push(await client.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');window.__destinationDisconnects=0;voice.primaryRoom.on('disconnected',()=>window.__destinationDisconnects++);return voice.primaryRoom.name;}));
 await member.dragTo(a.page.locator('.rail-squad[data-id="'+qC.id+'"]'));
 await until(()=>b.page.locator('.sidebar [data-voice-label]').textContent().then(t=>t==='BRAVO'),'Admin drag moves ordinary member to foreign vocal');
 await until(()=>c.page.locator('[data-rail-squad="'+qC.id+'"] [data-player="'+b.id+'"].rail-person').count().then(n=>n===1),'Moved guest visible under target channel');
 for(const [index,client]of [c,d].entries())assert.deepEqual(await client.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');return {room:voice.primaryRoom.name,state:voice.primaryRoom.state,disconnects:window.__destinationDisconnects};}),{room:unchanged[index],state:'connected',disconnects:0},'Destination members never disconnect when a guest arrives');
 const after=(await b.page.evaluate(()=>window.desktop.load())).state;assert.deepEqual(after.squads.find(q=>q.id===qA.id),before);assert.ok(!after.squads.find(q=>q.id===qC.id).slots.some(t=>t.playerId===b.id));
 await hold(c,'primary');await hears(b,'primary');await release(c);
 await d.app.evaluate(({BrowserWindow})=>{const wc=BrowserWindow.getAllWindows()[0].webContents,send=wc.send.bind(wc);wc.send=(channel,event,...args)=>{if(channel==='network:event'&&event?.type==='voiceMove')return;return send(channel,event,...args);};});
 await a.page.locator('.rail-person[data-player="'+b.id+'"]').dragTo(a.page.locator('.rail-squad[data-action=voiceLobby]'));
 await until(()=>b.page.locator('.sidebar [data-voice-label]').textContent().then(t=>t==='Accueil'),'Admin drag moves member to lobby');
 for(const client of [c,d])await until(()=>client.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');return voice.enabled&&!voice.connecting&&voice.primaryRoom?.state==='connected';}),'Remaining destination member recovers automatically after private guest access is revoked');
 await hold(c,'primary');await hears(d,'primary');await release(c);
 await d.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');await voice.primaryRoom.disconnect();});await until(()=>d.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');return voice.enabled&&!voice.connecting&&voice.primaryRoom?.state==='connected';}),'An unexpectedly disconnected room is rejoined even with an unchanged plan');await hold(c,'primary');await hears(d,'primary');await release(c);
 await b.page.locator('.rail-squad[data-id="'+qA.id+'"]').click();await until(()=>b.page.locator('.sidebar [data-voice-label]').textContent().then(t=>t==='ALPHA'),'Voluntary return clears admin guest permission');
 await until(()=>c.page.locator('[data-rail-squad="'+qC.id+'"] .rail-person[data-player="'+b.id+'"]').count().then(n=>n===0),'Guest leaves destination roster');
 console.log('PASS admin drag/drop: guest arrives without disconnecting destination members; ordinary move requests rejected; received audio and unchanged membership; automatic recovery after revocation with dropped routing notification and after same-room disconnect.');
}
