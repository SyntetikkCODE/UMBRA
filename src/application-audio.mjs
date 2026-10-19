export async function applicationAudio(bridge,sourceId,onEnded=()=>{}){
 const context=new AudioContext({sampleRate:48000}),sessionId=crypto.randomUUID();let node,stream,unsubscribe,closed=false,failure;
 const close=async()=>{if(closed)return;closed=true;unsubscribe?.();node?.disconnect();stream?.getTracks().forEach(t=>t.stop());await bridge.stopApplicationAudio(sessionId).catch(()=>{});await context.close().catch(()=>{});};
 try{
  await context.audioWorklet.addModule(new URL('./application-audio-worklet.mjs',import.meta.url));
  node=new AudioWorkletNode(context,'umbra-application-audio',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});const destination=context.createMediaStreamDestination();node.connect(destination);stream=destination.stream;
  unsubscribe=bridge.onApplicationAudio(event=>{if(closed||event.sessionId!==sessionId)return;if(event.type==='pcm')node.port.postMessage(event.data);else if(event.type==='ended'){failure=new Error(event.error);onEnded(failure);}});
  await context.resume();await bridge.startApplicationAudio(sourceId,sessionId);if(failure)throw failure;
  return {stream,close,sessionId};
 }catch(error){await close();throw error;}
}
