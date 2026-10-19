import assert from 'node:assert/strict';
export async function testChannelEars({a,b,c,d,until,hold,release,hears}){
 const start=(client,kind)=>client.page.evaluate(async kind=>{const {voice}=await import('./src/app.mjs');voice.setPointer(kind,true);await voice.txQueue;},kind);
 const stop=client=>client.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');voice.releasePointers();await voice.txQueue;});
 async function ear(client,kind,value){await client.page.locator('[data-nav=settings]').click();await client.page.locator('[data-action=settingsTab][data-tab=voice]').click();await client.page.locator('[data-channel-ear='+kind+'Ear]').selectOption(value);await until(()=>client.page.evaluate(async({key,value})=>(await window.desktop.load()).state.settings[key]===value,{key:kind+'Ear',value}),'Ear preference persisted');await client.page.locator('[data-nav=command]').click();}
 async function stereo(client,kind,speakerId=a.id){return client.page.evaluate(async({kind,speakerId})=>{
  window.__stereoProbe||=new Map();const el=document.querySelector('audio[data-voice-kind="'+kind+'"][data-voice-participant="'+speakerId+'"]');if(!el?.srcObject)return [0,0];let probe=window.__stereoProbe.get(el);
  if(!probe){const context=new AudioContext();await context.resume();const splitter=context.createChannelSplitter(2),source=context.createMediaStreamSource(el.srcObject),analysers=[context.createAnalyser(),context.createAnalyser()];source.connect(splitter);analysers.forEach((analyser,index)=>{analyser.fftSize=2048;splitter.connect(analyser,index);});probe={context,analysers};window.__stereoProbe.set(el,probe);}
  return probe.analysers.map(analyser=>{const samples=new Float32Array(2048);analyser.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);});
 },{kind,speakerId});}
 async function oneEar(client,kind,side,speakerId){await until(async()=>{const levels=await stereo(client,kind,speakerId);return levels[side]>.01&&levels[1-side]<.0003;},kind+' audible only in '+(side?'right':'left')+' ear');}
 await ear(b,'primary','right');await start(a,'primary');await oneEar(b,'primary',1);await stop(a);
 await ear(b,'primary','both');await start(a,'primary');await until(async()=>{const [left,right]=await stereo(b,'primary');return left>.01&&right>.01&&Math.abs(left-right)<.002;},'Both ears at matching volume');await stop(a);
 await ear(c,'leaders','left');await start(a,'leaders');await oneEar(c,'leaders',0);await stop(a);
 await ear(c,'broadcast','right');await ear(d,'broadcast','left');await start(b,'broadcast');try{await oneEar(c,'broadcast',1,b.id);await oneEar(d,'broadcast',0,b.id);await hears(a,'broadcast');}catch(error){console.log('Stereo diagnostics',await stereo(c,'broadcast',b.id),await stereo(d,'broadcast',b.id),await b.page.evaluate(async()=>{const {voice}=await import('./src/app.mjs');return {enabled:voice.enabled,chosen:voice.chosenChannel(),transmitting:voice.transmitting,muted:voice.effectiveMuted,network:voice.networkDown,error:voice.error};}));throw error;}await stop(b);
 const plan=await b.page.evaluate(()=>window.desktop.voicePlan());assert.equal(plan.channels.find(c=>c.kind==='broadcast').canPublish,true);assert.ok(!plan.channels.some(c=>c.kind==='leaders'));
 for(const [client,kind]of [[c,'leaders'],[c,'broadcast'],[d,'broadcast']])await ear(client,kind,'both');
 console.log('PASS stereo routing: actual squad right / leaders left / broadcast independent per listener; both ears neutral, local settings persisted; ordinary member broadcasts to all and leaders remain restricted.');
}
