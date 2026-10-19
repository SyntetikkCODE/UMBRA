import {audioSettings,validateAudio} from './audio.mjs';
import {squadAppearance,validateAppearance} from './squad-appearance.mjs';
import {profileAppearance,validateProfileAppearance} from './profile-appearance.mjs';
export const uid = () => globalThis.crypto.randomUUID();
export const MOODS = ['Vocal calme', 'Tactique', 'Chill', 'Tryhard'];
export const TYPES = ['Infanterie', 'Reconnaissance', 'Logistique', 'Appui'];
export const OPERATION_TYPES = ['Match', 'Entraînement', 'Compétition', 'Événement', 'Autre'];
export const OPERATION_PHASES = ['Préparation', 'Briefing', 'En jeu', 'Terminée'];
export const operationForSquad = (s,id) => (s.operations||[]).find(o=>o.squadIds.includes(id));
export const canManageOperation = (s,o) => s.players.find(p=>p.id===s.currentUserId)?.admin || o.createdBy===s.currentUserId;
export function upgradeState(state) {
  const s=structuredClone(state);s.operations ||= [];s.settings=audioSettings(s.settings);
  for(const p of s.players){p.squadLeader??=false;p.description ??= '';p.picture ??= '';const a=profileAppearance(p);p.banner??=a.banner;p.profileGradient??=a.gradient;p.primaryRole??=a.primaryRole;p.secondaryRole??=a.secondaryRole;}
  return s;
}
const fail = message => { throw new Error(message); };
const str = (s,max=60) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
export function validateState(s) {
  if (!s || s.version !== 1 || typeof s.demo !== 'boolean' || !Array.isArray(s.players) || !Array.isArray(s.squads) || s.players.length > 300 || s.squads.length > 50) fail('Format de sauvegarde invalide.');
  const ids = new Set();
  for (const p of s.players) { if (!str(p.id,80) || ids.has(p.id) || !str(p.name,32) || typeof p.admin !== 'boolean' || typeof p.commander !== 'boolean'||p.squadLeader!==undefined&&typeof p.squadLeader!=='boolean') fail('Profil invalide.'); ids.add(p.id); }
  if (!ids.has(s.currentUserId)) fail('Profil actif introuvable.');
  for(const p of s.players){
    validateProfileAppearance(p);
    if(p.description!==undefined && (typeof p.description!=='string' || p.description.length>280))fail('Description de profil trop longue (280 caractères).');
    if(p.picture!==undefined && (typeof p.picture!=='string' || p.picture.length>400000 || (p.picture && !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.picture))))fail('Photo de profil invalide.');
  }
  const assigned = new Set(), squadIds = new Set(), slotIds = new Set();
  for (const q of s.squads) {
    if (!str(q.id,80) || squadIds.has(q.id) || !str(q.name,40) || !TYPES.includes(q.type) || !MOODS.includes(q.mood) || !Array.isArray(q.slots) || q.slots.length < 1 || q.slots.length > 16) fail('Escouade invalide (1 à 16 places).');
    squadIds.add(q.id);
    validateAppearance(q);
    for (const slot of q.slots) {
      if (!str(slot.id,80) || slotIds.has(slot.id) || !str(slot.role,32)) fail('Poste invalide.'); slotIds.add(slot.id);
      if (slot.playerId !== null) { if (!ids.has(slot.playerId) || assigned.has(slot.playerId)) fail('Un joueur ne peut occuper qu’une place.'); assigned.add(slot.playerId); }
    }
    if (!ids.has(q.leaderId) || !q.slots.some(t => t.playerId === q.leaderId)) fail('Le chef doit appartenir à l’escouade.');
    if (q.deputyId !== null && (q.deputyId === q.leaderId || !q.slots.some(t => t.playerId === q.deputyId))) fail('Adjoint invalide.');
  }
  const t = s.settings;
  if(s.operations!==undefined){
    if(!Array.isArray(s.operations)||s.operations.length>50)fail('Liste des opérations invalide.');
    const opIds=new Set(),enrolled=new Set();
    for(const o of s.operations){
      if(!str(o.id,80)||opIds.has(o.id)||!str(o.name,60)||typeof o.description!=='string'||o.description.length>1500||!OPERATION_TYPES.includes(o.type)||!OPERATION_PHASES.includes(o.phase)||typeof o.server!=='string'||o.server.length>120||typeof o.startsAt!=='string'||!ids.has(o.createdBy)||!Array.isArray(o.squadIds)||!Array.isArray(o.briefingSquadIds))fail('Opération invalide.');
      opIds.add(o.id);
      if(o.startsAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(o.startsAt)||!Number.isFinite(Date.parse(o.startsAt+'Z'))||new Date(o.startsAt+'Z').toISOString().slice(0,16)!==o.startsAt))fail('Horaire invalide.');
      for(const id of o.squadIds){if(!squadIds.has(id)||enrolled.has(id))fail('Une escouade ne peut rejoindre qu’une opération.');enrolled.add(id);}
      if(new Set(o.briefingSquadIds).size!==o.briefingSquadIds.length||o.briefingSquadIds.some(id=>!o.squadIds.includes(id))||o.phase==='Terminée'&&o.briefingSquadIds.length)fail('Composition du briefing invalide.');
    }
  }
  validateAudio(t);
  return s;
}
export const membership = (s,id=s.currentUserId) => s.squads.find(q=>q.slots.some(p=>p.playerId===id));
export const canManage = (s,q) => s.players.find(p=>p.id===s.currentUserId)?.admin || q.leaderId===s.currentUserId;
export const leaderAccess = (s,id=s.currentUserId) => s.players.find(p=>p.id===id)?.commander || s.squads.some(q=>q.leaderId===id || q.deputyId===id);
export function reduce(state, action) {
  const s = upgradeState(state), me = s.currentUserId;
  const q = s.squads.find(q=>q.id===action.squadId);
  const requireSquad = () => { if (!q) fail('Escouade introuvable.'); };
  const manage = () => { requireSquad(); if (!canManage(s,q)) fail('Action réservée au chef ou à un admin.'); };
  switch(action.type) {
    case 'join': {
      requireSquad(); if (membership(s)) fail('Quitte d’abord ton escouade actuelle.');
      const slot = q.slots.find(t=>t.id===action.slotId); if (!slot || slot.playerId) fail('Cette place n’est plus disponible.'); slot.playerId=me; break;
    }
    case 'moveSlot': {
      requireSquad();if(membership(s)?.id!==q.id)fail('Tu dois appartenir à cette escouade pour changer de poste.');
      const source=q.slots.find(t=>t.playerId===me),target=q.slots.find(t=>t.id===action.slotId);
      if(!target||target.playerId)fail('Cette place n’est plus disponible.');
      source.playerId=null;target.playerId=me;break;
    }
    case 'leave': {
      requireSquad(); if(q.leaderId===me) fail('Transfère le commandement avant de quitter, ou dissous l’escouade.');
      q.slots.forEach(t=>{if(t.playerId===me)t.playerId=null;}); if(q.deputyId===me) q.deputyId=null; break;
    }
    case 'create': {
      if(membership(s)) fail('Quitte d’abord ton escouade actuelle.');
      validateAppearance(action);
      s.squads.push({id:uid(),name:action.name.trim(),type:action.kind,mood:action.mood,...squadAppearance(action),leaderId:me,deputyId:null,slots:[{id:uid(),role:action.role.trim(),playerId:me},...action.roles.map(role=>({id:uid(),role:role.trim(),playerId:null}))]}); break;
    }
    case 'edit': {
      manage(); q.name=action.name.trim(); q.type=action.kind; q.mood=action.mood;
      validateAppearance(action);if(action.icon!==undefined)q.icon=action.icon;if(action.color!==undefined)q.color=action.color;
      if(action.slots) {
        const occupied=q.slots.filter(t=>t.playerId);
        if(occupied.some(t=>!action.slots.some(n=>n.id===t.id && n.playerId===t.playerId))) fail('Impossible de supprimer une place occupée.');
        q.slots=action.slots;
      } break;
    }
    case 'assign': {
      manage(); const slot=q.slots.find(t=>t.id===action.slotId); if(!slot || slot.playerId) fail('Place indisponible.');
      if(!s.players.some(p=>p.id===action.playerId) || membership(s,action.playerId)) fail('Joueur indisponible.'); slot.playerId=action.playerId; break;
    }
    case 'remove': {
      manage(); if(q.leaderId===action.playerId) fail('Transfère d’abord le commandement.');
      q.slots.forEach(t=>{if(t.playerId===action.playerId)t.playerId=null;}); if(q.deputyId===action.playerId)q.deputyId=null; break;
    }
    case 'leader': { manage(); if(!q.slots.some(t=>t.playerId===action.playerId)) fail('Le chef doit être membre.'); q.leaderId=action.playerId; if(q.deputyId===action.playerId)q.deputyId=null; break; }
    case 'deputy': { manage(); q.deputyId=action.playerId || null; break; }
    case 'delete': { manage(); s.squads=s.squads.filter(t=>t.id!==q.id);for(const o of s.operations){o.squadIds=o.squadIds.filter(id=>id!==q.id);o.briefingSquadIds=o.briefingSquadIds.filter(id=>id!==q.id);} break; }
    case 'profile': { const p=s.players.find(p=>p.id===me);p.name=action.name.trim();if(action.description!==undefined)p.description=action.description.trim();if(action.picture!==undefined)p.picture=action.picture;for(const key of ['banner','profileGradient','primaryRole','secondaryRole'])if(action[key]!==undefined)p[key]=structuredClone(action[key]);break; }
    case 'operationCreate': {
      if(!leaderAccess(s)&&!s.players.find(p=>p.id===me).admin)fail('La création d’une opération est réservée aux leaders, au commandement et aux admins.');
      const mine=membership(s),id=uid();
      s.operations.push({id,name:action.name.trim(),description:action.description.trim(),type:action.kind,server:action.server.trim(),startsAt:action.startsAt,phase:'Préparation',createdBy:me,squadIds:mine?.leaderId===me&&!operationForSquad(s,mine.id)?[mine.id]:[],briefingSquadIds:[]});break;
    }
    case 'operationEdit':case 'operationDelete': {
      const o=s.operations.find(o=>o.id===action.operationId);if(!o)fail('Opération introuvable.');
      if(!canManageOperation(s,o))fail('Action réservée à l’organisateur ou à un admin.');
      if(action.type==='operationDelete'){s.operations=s.operations.filter(t=>t.id!==o.id);break;}
      Object.assign(o,{name:action.name.trim(),description:action.description.trim(),type:action.kind,server:action.server.trim(),startsAt:action.startsAt,phase:action.phase});if(o.phase==='Terminée')o.briefingSquadIds=[];break;
    }
    case 'operationJoin':case 'operationLeave':case 'briefingJoin':case 'briefingLeave': {
      const o=s.operations.find(o=>o.id===action.operationId);if(!o)fail('Opération introuvable.');requireSquad();
      if(q.leaderId!==me)fail('Seul le chef peut inscrire ou rassembler sa propre escouade.');
      if(action.type==='operationJoin'){
        if(o.phase==='Terminée')fail('Cette opération est terminée.');
        if(operationForSquad(s,q.id))fail('Quitte d’abord l’opération actuelle de ton escouade.');o.squadIds.push(q.id);
      }else if(action.type==='operationLeave'){
        o.squadIds=o.squadIds.filter(id=>id!==q.id);o.briefingSquadIds=o.briefingSquadIds.filter(id=>id!==q.id);
      }else{
        if(!o.squadIds.includes(q.id))fail('Inscris d’abord ton escouade à cette opération.');
        if(action.type==='briefingJoin'){if(o.phase==='Terminée')fail('Cette opération est terminée.');if(!o.briefingSquadIds.includes(q.id))o.briefingSquadIds.push(q.id);}
        else o.briefingSquadIds=o.briefingSquadIds.filter(id=>id!==q.id);
      }break;
    }
    case 'settings': { s.settings={...s.settings,...action.values}; break; }
    case 'addPlayer': {
      if(!s.players.find(p=>p.id===me).admin) fail('Action réservée aux admins.');
      if(s.players.some(p=>p.name.toLowerCase()===action.name.trim().toLowerCase())) fail('Ce pseudo existe déjà.');
      s.players.push({id:uid(),name:action.name.trim(),admin:false,commander:false}); break;
    }
    case 'rights': {
      if(!s.players.find(p=>p.id===me).admin) fail('Action réservée aux admins.');
      const p=s.players.find(p=>p.id===action.playerId); if(!p)fail('Joueur introuvable.');
      if(p.id===me && !action.admin) fail('Conserve ton accès admin pour gérer cette version locale.');
      p.admin=!!action.admin;p.commander=!!action.commander;if(action.squadLeader!==undefined)p.squadLeader=!!action.squadLeader;break;
    }
    case 'clean': { const p=s.players.find(p=>p.id===me); s.players=[p];s.squads=[];s.operations=[];s.demo=false;break; }
    default: fail('Action inconnue.');
  }
  validateState(s); return s;
}
