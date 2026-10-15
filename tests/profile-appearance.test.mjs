import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Accounts} from '../src/accounts.mjs';
import {validateProfileAppearance,PROFILE_ROLES} from '../src/profile-appearance.mjs';
import {upgradeState} from '../src/model.mjs';
import {roleIcons} from '../assets/role-icons.mjs';
test('Profile appearance persists without changing account rights or assigned squad posts',async()=>{
 const dir=await fs.mkdtemp(path.resolve(import.meta.dirname,'../artifacts/profile-appearance-')),accounts=new Accounts(dir);await accounts.open();const admin=await accounts.register({name:'Admin',password:'test-password'}),member=await accounts.register({name:'Member',password:'test-password'}),aid=admin.state.currentUserId,bid=member.state.currentUserId;
 await accounts.action({type:'create',name:'Alpha',kind:'Infanterie',mood:'Tactique',role:'Infanterie',roles:['Recon']},aid);const q=accounts.db.state.squads[0];await accounts.action({type:'join',squadId:q.id,slotId:q.slots[1].id},bid);
 const values={type:'profile',name:'Member',description:'Medic et pilote',primaryRole:'Medic',secondaryRole:'Pilote',banner:'data:image/png;base64,AAAA',profileGradient:{start:'#334455',end:'#112233',angle:210},admin:true,commander:true,playerId:aid};await accounts.action(values,bid);
 const reopened=new Accounts(dir);await reopened.open();const p=reopened.db.state.players.find(p=>p.id===bid);assert.equal(p.primaryRole,'Medic');assert.equal(p.secondaryRole,'Pilote');assert.equal(p.banner,values.banner);assert.deepEqual(p.profileGradient,values.profileGradient);assert.equal(p.admin,false);assert.equal(p.commander,false);assert.equal(reopened.db.state.squads[0].slots[1].role,'Recon');assert.equal(reopened.db.state.players.find(p=>p.id===aid).name,'Admin');
 for(const role of PROFILE_ROLES)assert.ok(roleIcons[role].includes('<svg'));assert.equal(new Set(Object.values(roleIcons)).size,PROFILE_ROLES.length);
});
test('Invalid profile style and executable images are rejected; legacy profiles migrate without lost identity',()=>{
 for(const values of [{banner:'https://tracking.example/image.png'},{banner:'data:image/svg+xml;base64,AAAA'},{profileGradient:{start:'url(javascript:alert(1))',end:'#000000',angle:135}},{profileGradient:{start:'#000000',end:'#ffffff',angle:999}},{primaryRole:'Admin'},{primaryRole:'Medic',secondaryRole:'Medic'}])assert.throws(()=>validateProfileAppearance(values));
 const legacy={players:[{id:'a',name:'Admin',description:'Existing bio',picture:'data:image/png;base64,AAAA'}],settings:{}};const next=upgradeState(legacy);assert.equal(next.players[0].name,'Admin');assert.equal(next.players[0].description,'Existing bio');assert.equal(next.players[0].picture,legacy.players[0].picture);assert.equal(next.players[0].primaryRole,'Libre');assert.equal(next.players[0].secondaryRole,'');assert.ok(!('primaryRole' in legacy.players[0]));
 const corrupt=upgradeState({...legacy,players:[{...legacy.players[0],profileGradient:[]} ]});assert.throws(()=>validateProfileAppearance(corrupt.players[0]));
});
