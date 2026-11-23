const CORNERS=['top-left','top-right','bottom-left','bottom-right'];
const DEFAULT_OVERLAY=Object.freeze({enabled:false,corner:'top-left',displayId:null});
function overlaySettings(value={}){
 if(typeof value.enabled!=='boolean'||!CORNERS.includes(value.corner)||!(value.displayId===null||Number.isSafeInteger(value.displayId)))throw new Error('Réglages de l’overlay invalides.');
 return {enabled:value.enabled,corner:value.corner,displayId:value.displayId};
}
function overlayBounds(area,corner,rows=0,extra=0){
 const margin=16,width=Math.min(230,area.width-margin*2),height=Math.min(34+Math.max(1,Math.min(rows,50))*28+(extra?18:0),area.height-margin*2);
 return {x:corner.endsWith('right')?area.x+area.width-width-margin:area.x+margin,y:corner.startsWith('bottom')?area.y+area.height-height-margin:area.y+margin,width,height};
}
function overlayPayload(value={}){
 const text=(value,max)=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,'').slice(0,max):'';
 const speakers=[],seen=new Set();
 for(const p of Array.isArray(value.speakers)?value.speakers.slice(0,100):[]){const id=text(p?.id,80),name=text(p?.name,32);if(!id||!name||seen.has(id)||!['primary','leaders','broadcast'].includes(p.channel))continue;seen.add(id);if(speakers.length<50)speakers.push({id,name,channel:p.channel,speaking:p.speaking===true});}
 return {connected:value.connected===true,label:text(value.label,64),muted:value.muted===true,deafened:value.deafened===true,speakers,extra:Math.max(0,seen.size-50)};
}
function overlayProfiles(value){return (Array.isArray(value)?value:[]).slice(0,100).filter(p=>typeof p?.id==='string'&&p.id.length<=80).map(p=>({id:p.id,picture:typeof p.picture==='string'&&p.picture.length<=400000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.picture)?p.picture:''}));}
module.exports={CORNERS,DEFAULT_OVERLAY,overlaySettings,overlayBounds,overlayPayload,overlayProfiles};
