// Local microphone level detection, never a simulated remote speaking status.
export function rmsLevel(samples) {
  const normalized=samples instanceof Float32Array||samples instanceof Float64Array;
  let energy=0;for(const v of samples)energy+=(normalized?v:(v-128)/128)**2;
  return Math.sqrt(energy/samples.length);
}
export const DEFAULT_VAD_DB=-48;
export const thresholdAmplitude=db=>10**(db/20);
export const levelDb=level=>Math.max(-72,20*Math.log10(Math.max(level,1e-6)));
export const meterPercent=db=>Math.max(0,Math.min(100,(db+72)/72*100));
export function createVoiceGate({threshold=thresholdAmplitude(DEFAULT_VAD_DB),holdMs=220}={}) {
  let lastVoice=-Infinity;
  return (level,now,currentThreshold=threshold)=>{if(level>=currentThreshold)lastVoice=now;return now-lastVoice<holdMs;};
}
export function updateMicMeter(level,settings,previewDb){
 const threshold=previewDb??settings.vadThresholdDb??DEFAULT_VAD_DB;
 const db=levelDb(level),meter=document.querySelector('#mic-level');
 if(meter){const value=Math.round(meterPercent(db));meter.style.width=value+'%';meter.parentElement.setAttribute('aria-valuenow',value);meter.parentElement.dataset.levelDb=db.toFixed(1);}
 const marker=document.querySelector('#mic-threshold');if(marker)marker.style.left=meterPercent(threshold)+'%';
 const status=document.querySelector('[data-vad-level]');if(status)status.textContent=Math.round(db)+' dB · '+(db>=threshold?'Voix détectée':'Sous le seuil');
}
