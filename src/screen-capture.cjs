function createCaptureSelection(now=Date.now){
 let available=new Set(),until=0,choice=null;
 return {
  list(sources){available=new Set(sources.map(s=>s.id));until=now()+90000;choice=null;},
  select(id,audio=false){if(typeof id!=='string'||!available.has(id)||now()>until)throw new Error('Sélection expirée. Rouvre le sélecteur de partage.');choice={id,audio:audio===true};},
  pending(){return !!choice&&now()<=until;},
  consume(){const value=now()<=until?choice:null;choice=null;available.clear();return value;},
  clear(){choice=null;available.clear();until=0;}
 };
}
module.exports={createCaptureSelection};
