import {voiceChannels} from './routing.mjs';
const base=c=>c.operationId?'brief-'+c.operationId:c.squadId?'squad-'+c.squadId:'lobby';
// Adding an authorized guest keeps the destination connected. Revoke every
// private room actually granted to that guest before allowing its reuse.
export class VoiceVisits {
 constructor(){this.destinations=new Map();this.epochs=new Map();this.grants=new Map();}
 plan(state,id,options={}){return voiceChannels(state,id,{...options,forcedDestinations:this.destinations,primaryEpochs:this.epochs});}
 record(state,id,channel,options={}){if(channel.kind!=='primary'||!channel.squadId||!this.destinations.has(id)||state.players.find(p=>p.id===id)?.admin)return;const natural=voiceChannels(state,id,{...options,primaryEpochs:this.epochs})[0];if(natural.room===channel.room)return;if(!this.grants.has(id))this.grants.set(id,new Set());this.grants.get(id).add(base(channel));}
 clear(id){const had=this.destinations.delete(id);for(const key of this.grants.get(id)||[])this.epochs.set(key,(this.epochs.get(key)||0)+1);this.grants.delete(id);return had;}
 set(id,target){if(this.destinations.get(id)===target)return;this.clear(id);this.destinations.set(id,target);}
}
