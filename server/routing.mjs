import {createHash} from 'node:crypto';
import {membership,operationForSquad,leaderAccess} from '../src/model.mjs';
export function voiceChannels(state,userId,{visitSquadId=null,visitLobby=false,forcedDestinations=new Map(),namespace='umbra',epoch=''}={}) {
 const player=state.players.find(p=>p.id===userId);if(!player)throw new Error('Compte introuvable.');
 const admins=state.players.filter(p=>p.admin).map(p=>p.id);
 const make=(kind,base,label,allowed,publish=true)=>({kind,label,canPublish:publish,room:namespace+'-'+base+'-'+createHash('sha256').update(epoch+'|'+[...new Set(allowed)].sort().join('|')).digest('hex').slice(0,14)});
 let q=membership(state,userId);
 if(visitSquadId){if(!player.admin)throw new Error('Visite vocale réservée aux admins.');q=state.squads.find(q=>q.id===visitSquadId);if(!q)throw new Error('Escouade introuvable.');}
 if(visitLobby)q=null;
 const forced=forcedDestinations.get(userId);if(forced)q=forced==='lobby'?null:state.squads.find(s=>s.id===forced)||q;
 const guests=squads=>[...forcedDestinations].filter(([,target])=>squads.includes(target)).map(([id])=>id);
 let primary;
 const op=q&&operationForSquad(state,q.id),brief=op?.briefingSquadIds.includes(q.id)&&op.phase!=='Terminée';
 if(brief){const ids=state.squads.filter(s=>op.briefingSquadIds.includes(s.id)).flatMap(s=>s.slots.filter(t=>t.playerId).map(t=>t.playerId));primary=make('primary','brief-'+op.id,'Briefing · '+op.name,[...ids,...admins,...guests(op.briefingSquadIds)]);}
 else if(q)primary=make('primary','squad-'+q.id,q.name,[...q.slots.filter(t=>t.playerId).map(t=>t.playerId),...admins,...guests([q.id])]);
 else primary=make('primary','lobby','Accueil',state.players.map(p=>p.id));
 primary.squadId=q?.id||null;primary.operationId=brief?op.id:null;
 const channels=[primary];
 const leaders=state.players.filter(p=>leaderAccess(state,p.id)).map(p=>p.id);
 if(leaderAccess(state,userId))channels.push(make('leaders','leaders','Leaders de la team',leaders));
 const commanderIds=state.players.filter(p=>p.commander).map(p=>p.id);
 channels.push(make('broadcast','announcements','Annonce générale',[...state.players.map(p=>p.id),...commanderIds.map(id=>'speaker:'+id)],player.commander));
 return channels;
}
