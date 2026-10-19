import assert from 'node:assert/strict';
export async function testAdminMove({a,b,c,d,qA,qC,until,action,hold,hears,release}){
 const before=(await b.page.evaluate(()=>window.desktop.load())).state.squads.find(q=>q.id===qA.id);
 assert.equal(await b.page.locator('.rail-person[draggable=true]').count(),0);
 await assert.rejects(()=>b.page.evaluate(({id,target})=>window.desktop.moveVoice({playerId:id,squadId:target}),{id:d.id,target:qA.id}),/admin/i);
 await assert.rejects(()=>a.page.evaluate(id=>window.desktop.moveVoice({playerId:id,squadId:'missing'}),b.id),/introuvable/);
 const member=a.page.locator('.rail-person[data-player="'+b.id+'"]');await member.waitFor();
 await member.dragTo(a.page.locator('.rail-squad[data-id="'+qC.id+'"]'));
 await until(()=>b.page.locator('.sidebar [data-voice-label]').textContent().then(t=>t==='BRAVO'),'Admin drag moves ordinary member to foreign vocal');
 await until(()=>c.page.locator('[data-rail-squad="'+qC.id+'"] [data-player="'+b.id+'"].rail-person').count().then(n=>n===1),'Moved guest visible under target channel');
 const after=(await b.page.evaluate(()=>window.desktop.load())).state;assert.deepEqual(after.squads.find(q=>q.id===qA.id),before);assert.ok(!after.squads.find(q=>q.id===qC.id).slots.some(t=>t.playerId===b.id));
 await hold(c,'primary');await hears(b,'primary');await release(c);
 await a.page.locator('.rail-person[data-player="'+b.id+'"]').dragTo(a.page.locator('.rail-squad[data-action=voiceLobby]'));
 await until(()=>b.page.locator('.sidebar [data-voice-label]').textContent().then(t=>t==='Accueil'),'Admin drag moves member to lobby');
 await b.page.locator('.rail-squad[data-id="'+qA.id+'"]').click();await until(()=>b.page.locator('.sidebar [data-voice-label]').textContent().then(t=>t==='ALPHA'),'Voluntary return clears admin guest permission');
 await until(()=>c.page.locator('[data-rail-squad="'+qC.id+'"] .rail-person[data-player="'+b.id+'"]').count().then(n=>n===0),'Guest leaves destination roster');
 console.log('PASS admin drag/drop: server rejects ordinary admin requests, member moves squad/lobby with actual audio, membership stays unchanged and own-channel return revokes guest access.');
}
