import {TYPES,MOODS,uid} from './model.mjs';
import {squadAppearance} from './squad-appearance.mjs';
export function templateDefinition(value){
 const name=String(value?.name||'').trim(),leader=value?.slots?.find(t=>t.playerId===value.leaderId),roles=value?.roles||(leader?[leader,...value.slots.filter(t=>t!==leader)]:value?.slots)?.map(t=>t.role);
 if(!name||name.length>40||!TYPES.includes(value?.type)||!MOODS.includes(value?.mood)||!Array.isArray(roles)||roles.length<1||roles.length>16||roles.some(r=>typeof r!=='string'||!r.trim()||r.trim().length>32))throw new Error('Modèle invalide : nom, type et 1 à 16 postes requis.');
 return {name,type:value.type,mood:value.mood,...squadAppearance(value),roles:roles.map(r=>r.trim())};
}
export class SquadTemplates{
 constructor(storage=localStorage){this.storage=storage;this.scope='';this.items=[];}
 load(scope){if(this.scope===scope)return;this.scope=scope;try{const values=JSON.parse(this.storage.getItem('umbra-templates:'+scope)||'[]');this.items=Array.isArray(values)?values.slice(0,30).flatMap(v=>{try{return [{id:String(v.id).slice(0,80),...templateDefinition(v)}];}catch{return [];}}):[];}catch{this.items=[];}}
 save(value,id){if(!id&&this.items.length>=30)throw new Error('30 modèles maximum.');const item={id:id||uid(),...templateDefinition(value)},items=id?this.items.map(t=>t.id===id?item:t):[...this.items,item];this.storage.setItem('umbra-templates:'+this.scope,JSON.stringify(items));this.items=items;return item;}
 remove(id){const items=this.items.filter(t=>t.id!==id);this.storage.setItem('umbra-templates:'+this.scope,JSON.stringify(items));this.items=items;}
}
