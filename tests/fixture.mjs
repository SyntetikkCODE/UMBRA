import { uid } from '../src/model.mjs';
export function fixture() {
  const players = [['swade','Swade'],['regret','Regret37'],['gekido','Gekido'],['noe','MisteurNoe'],['miko','MIKO'],['gpas','Gpas2Mains'],['bast','B4st4rd'],['fraisou','Fraisou'],['joods','JooDs'],['idrahok','Idrahok'],['zay','iZaydem'],['sev','Sevatar'],['v2','V2'],['fran','PTM_FranFran57']].map(([id,name]) => ({ id, name, admin: id === 'fran', commander: false }));
  players.push({ id: 'me', name: 'Vous', admin: true, commander: false });
  const squad = (id,name,type,mood,leaderId,slots) => ({ id,name,type,mood,leaderId,deputyId:null,slots:slots.map(([role,playerId])=>({id:uid(),role,playerId:playerId||null})) });
  return { version: 1, demo: true, currentUserId: 'me', players, settings: { mic: '', squadVolume: 85, leadersVolume: 100, ducking: true }, squads: [
    squad('hotzone','HOTZONE','Infanterie','Vocal calme','swade', [['Medic','swade'],['Medic','regret'],['Anti-véhicule','gekido'],['Sniper mobile','noe'],['Infanterie','miko'],['Infanterie','gpas']]),
    squad('clodo','MOD CLODO','Infanterie','Chill','bast', [['Infanterie','bast'],['Recon',null],['Medic','fraisou'],['Medic',null],['Breacher',null],['Infanterie','joods'],['Pilot','idrahok']]),
    squad('reco','GHOST RECON','Reconnaissance','Tactique','zay', [['Recon','zay'],['Sniper','sev'],['Observateur',null],['Medic',null]]),
    squad('fob','FOB & BUILDERS','Logistique','Tryhard','v2', [['Builder','v2'],['Builder',null],['Logisticien',null],['Pilot',null],['Protection',null]])
  ] };
}
