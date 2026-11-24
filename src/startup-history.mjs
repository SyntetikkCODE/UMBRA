const numericVersion=value=>typeof value==='string'&&/^\d+\.\d+\.\d+$/.test(value);
export function compareVersions(a,b){const left=a.split('.').map(Number),right=b.split('.').map(Number);for(let i=0;i<3;i++)if(left[i]!==right[i])return left[i]>right[i]?1:-1;return 0;}
export class StartupHistory{
 constructor(scope,storage=globalThis.localStorage){this.key='hexagone-startup-history:'+scope;this.storage=storage;this.fallback={version:null,overlaySeen:false};}
 read(){try{const raw=this.storage.getItem(this.key);if(!raw)return {...this.fallback};const value=JSON.parse(raw);return {version:numericVersion(value?.version)?value.version:null,overlaySeen:value?.overlaySeen===true};}catch{return {...this.fallback};}}
 write(values){const record={...this.read(),...values};this.fallback=record;try{this.storage.setItem(this.key,JSON.stringify(record));}catch{}return record;}
 plan(version,releases,{existing=true}={}){
  const record=this.read(),available=numericVersion(version)?releases.filter(r=>numericVersion(r.version)&&compareVersions(r.version,version)<=0).sort((a,b)=>compareVersions(b.version,a.version)):[];
  // Old clients did not record the last launched version. Introduce the current
  // patch once, rather than treating the entire archive as unseen.
  const updates=record.version?available.filter(r=>compareVersions(r.version,record.version)>0):existing?available.slice(0,1):[];
  return {releases:updates,overlay:!record.overlaySeen};
 }
 seenVersion(version){if(!numericVersion(version))return;const old=this.read().version;if(!old||compareVersions(version,old)>0)this.write({version});}
 seenOverlay(){this.write({overlaySeen:true});}
}
