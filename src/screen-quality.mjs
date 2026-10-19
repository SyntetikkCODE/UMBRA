export const SCREEN_QUALITIES=Object.freeze([
 {id:'480p',label:'480p',width:854,height:480,bitrate:1500000},
 {id:'720p',label:'720p',width:1280,height:720,bitrate:4500000},
 {id:'1080p',label:'1080p',width:1920,height:1080,bitrate:8000000},
 {id:'source',label:'Source',width:0,height:0,bitrate:16000000}
]);
export function screenQuality(id){const value=SCREEN_QUALITIES.find(q=>q.id===id);if(!value)throw new Error('Qualité de partage invalide.');return value;}
export function screenShareOptions(id,audio){
 const q=screenQuality(id),video={frameRate:{ideal:30,max:30}};if(q.width){video.width={max:q.width};video.height={max:q.height};}
 return {capture:{video,resolution:{width:0,height:0,frameRate:30},audio:audio?{channelCount:2,sampleRate:48000,echoCancellation:false,noiseSuppression:false,autoGainControl:false}:false,contentHint:'motion'},publish:{simulcast:false,screenShareEncoding:{maxBitrate:q.bitrate,maxFramerate:30},degradationPreference:'maintain-framerate',audioPreset:{maxBitrate:128000},forceStereo:true,dtx:false,red:true}};
}
