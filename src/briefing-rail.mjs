import {membership} from './model.mjs';
export function briefingSquads(state,operation){return !operation||operation.phase==='Terminée'?[]:state.squads.filter(q=>operation.squadIds.includes(q.id)&&operation.briefingSquadIds.includes(q.id));}
export function briefingAccess(state,operation,userId=state.currentUserId){const squads=briefingSquads(state,operation),own=membership(state,userId),admin=state.players.some(p=>p.id===userId&&p.admin),home=squads.some(q=>q.id===own?.id);return {visible:squads.length>0,allowed:squads.length>0&&(home||admin),visitSquadId:home?null:admin?squads[0]?.id||null:null,targetSquadId:squads[0]?.id||null};}
export function primaryVoicePeople(users,{squadId,operationId,lobby=false}={}){
 const seen=new Set();return users.filter(user=>{if(seen.has(user.id))return false;const match=user.channels.some(c=>c.kind==='primary'&&(operationId?c.operationId===operationId:!c.operationId&&(lobby?!c.squadId:c.squadId===squadId)));if(match)seen.add(user.id);return match;});
}
