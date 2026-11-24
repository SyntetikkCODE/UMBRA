import {VoiceOrder} from './voice-order.mjs';
// Personal ordering, scoped to the connected server and account. Pinning keeps
// its priority; moving a channel never changes its permissions or membership.
export class ChannelOrder extends VoiceOrder{
 constructor(key,storage=globalThis.localStorage){super(()=> 'text:'+key(),storage);}
 ordered(channels,pins=[]){const ranked=super.ordered(channels),pinned=new Set(pins);return [...ranked.filter(c=>pinned.has(c.id)),...ranked.filter(c=>!pinned.has(c.id))];}
}
