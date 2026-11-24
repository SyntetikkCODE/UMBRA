import {rmsLevel} from './activity.mjs';
const round=(value,digits=3)=>Number.isFinite(value)?Number(value.toFixed(digits)):null;
export const levelDb=value=>value>0?round(20*Math.log10(value),1):null;
export function receptionIssues(row){const issues=[];if(row.outputError)issues.push('output-error');if(row.playError)issues.push('play-error');if(row.paused)issues.push('paused');if(row.muted)issues.push('muted');if(row.context!=='running')issues.push('context');if(!row.sinkMatches)issues.push('sink');if(row.effectiveGain===0)issues.push('volume-zero');if(row.ducked)issues.push('ducking');if(row.packetLossPct>5||row.concealmentPct>10)issues.push('network');return issues;}
function inbound(stats){let result=null;stats?.forEach(s=>{if(s.type==='inbound-rtp'&&(s.kind==='audio'||s.mediaType==='audio'))result=s;});return result;}
async function statistics(track){let timer;try{return inbound(await Promise.race([track.getRTCStatsReport(),new Promise(resolve=>timer=setTimeout(()=>resolve(null),800))]));}catch{return null;}finally{clearTimeout(timer);}}
export function receptionNetwork(first,last){
 const delta=key=>Number.isFinite(first?.[key])&&Number.isFinite(last?.[key])?Math.max(0,last[key]-first[key]):null;
 const lost=delta('packetsLost'),received=delta('packetsReceived'),concealed=delta('concealedSamples'),samples=delta('totalSamplesReceived'),energy=delta('totalAudioEnergy'),duration=delta('totalSamplesDuration');
 return {packetLossPct:lost!==null&&received!==null&&lost+received>0?round(lost/(lost+received)*100,1):null,concealmentPct:concealed!==null&&samples>0?round(concealed/samples*100,1):null,jitterMs:Number.isFinite(last?.jitter)?round(last.jitter*1000,1):null,networkDb:duration>0&&energy!==null?levelDb(Math.sqrt(energy/duration)):null};
}
export async function receptionSnapshot(voice,{duration=1500,name=id=>id}={}){
 const probes=[],settings={...voice.settings},context=voice.audioContext;
 for(const [kind,entry]of voice.rooms)for(const [track,r]of entry.received){if(!r.graph.analyser)continue;let outputSource,outputMeter;
  try{outputSource=context.createMediaStreamSource(r.graph.stream);outputMeter=context.createAnalyser();outputMeter.fftSize=2048;outputSource.connect(outputMeter);}catch{}
  probes.push({kind,entry,track,r,outputSource,outputMeter,outputSamples:new Float32Array(2048),peak:0,post:0,first:null});
 }
 try{
  await Promise.all(probes.map(async p=>p.first=await statistics(p.track)));
  const until=performance.now()+Math.max(100,Math.min(3000,duration));
  while(performance.now()<until){for(const p of probes){if(p.entry.received.get(p.track)!==p.r)continue;try{p.r.graph.analyser.getFloatTimeDomainData(p.r.graph.samples);p.peak=Math.max(p.peak,rmsLevel(p.r.graph.samples));if(p.outputMeter){p.outputMeter.getFloatTimeDomainData(p.outputSamples);p.post=Math.max(p.post,rmsLevel(p.outputSamples)*p.r.element.volume*(p.r.element.muted||p.r.element.paused?0:1));}}catch{}}await new Promise(resolve=>setTimeout(resolve,50));}
  const rows=await Promise.all(probes.map(async p=>{if(p.entry.received.get(p.track)!==p.r)return null;const r=p.r,id=r.element.dataset.voiceParticipant,channelGain=r.element.volume*r.graph.gain.gain.value,record={name:name(id),channel:({primary:'Squad / briefing',leaders:'Leaders',broadcast:'Opération'})[p.kind]||p.kind,receivedDb:levelDb(p.peak),afterSettingsDb:levelDb(p.post),playerVolume:voice.participantVolume(id),effectiveGain:round(channelGain),ear:settings[p.kind+'Ear']||'both',ducked:p.kind==='primary'&&voice.leadersDucking,paused:r.element.paused,muted:r.element.muted,context:context?.state||'closed',sinkMatches:!r.element.setSinkId||r.element.sinkId===(settings.output||''),outputError:r.outputError||null,playError:r.playError||null,...receptionNetwork(p.first,await statistics(p.track))};return {...record,issues:receptionIssues(record),playerId:id};}));return rows.filter(Boolean);
 }finally{for(const p of probes){p.outputSource?.disconnect();p.outputMeter?.disconnect();}}
}
export function diagnosticReport({version,listener,settings,output,rows}){
 // Only named levels, controls and aggregate RTP counters. No audio, tokens,
 // participant IDs, device identifiers, addresses, ICE candidates or SDP.
 const fields=['name','channel','receivedDb','afterSettingsDb','playerVolume','effectiveGain','ear','ducked','paused','muted','context','sinkMatches','outputError','playError','packetLossPct','concealmentPct','jitterMs','networkDb','issues'];
 const report={application:'HEXAGONE',version,time:new Date().toISOString(),listener,measurement:'Niveaux dans l’application, avant le volume Windows et le casque. Parler pendant la mesure.',settings:{outputVolume:settings.outputVolume,squadVolume:settings.squadVolume,leadersVolume:settings.leadersVolume,ducking:settings.ducking,output},players:rows.map(row=>Object.fromEntries(fields.map(key=>[key,row[key]]))),omitted:0};
 while(JSON.stringify(report,null,2).length>60000&&report.players.length){report.players.pop();report.omitted++;}return report;
}
