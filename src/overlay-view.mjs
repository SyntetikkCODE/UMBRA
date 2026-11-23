const channel=document.querySelector('#channel'),status=document.querySelector('#status'),list=document.querySelector('#speakers');let profiles=new Map(),current=null;
function render(value){
 current=value;channel.textContent=value.label||'Vocal';status.textContent=value.preview?'APERÇU':value.deafened?'Son coupé':value.muted?'Micro coupé':'';list.replaceChildren();
 for(const speaker of value.speakers){const row=document.createElement('div');row.className='speaker'+(speaker.speaking?' is-speaking':'');row.dataset.channel=speaker.channel;const avatar=document.createElement('span');avatar.className='speaker-avatar';const picture=profiles.get(speaker.id);if(picture){const img=document.createElement('img');img.src=picture;img.alt='';avatar.append(img);}else avatar.textContent=speaker.name.slice(0,2).toUpperCase();const name=document.createElement('span');name.className='speaker-name';name.textContent=speaker.name;const tag=document.createElement('span');tag.className='speaker-channel';tag.textContent=({primary:'',leaders:'Leaders',broadcast:'Annonce'})[speaker.channel];row.append(avatar,name,tag);list.append(row);}
 if(!value.speakers.length){const idle=document.createElement('p');idle.className='idle';idle.textContent='Aucun joueur connecté';list.append(idle);}
 if(value.extra){const extra=document.createElement('p');extra.className='extra';extra.textContent='+'+value.extra+' autres joueurs';list.append(extra);}
}
window.voiceOverlay.onProfiles(value=>{profiles=new Map(value.map(p=>[p.id,p.picture]));if(current)render(current);});window.voiceOverlay.onUpdate(render);
