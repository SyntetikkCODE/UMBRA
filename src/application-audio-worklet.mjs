import {PcmBuffer} from './pcm-buffer.mjs';
class ApplicationAudioProcessor extends AudioWorkletProcessor {
 constructor(){super();this.samples=new PcmBuffer();this.port.onmessage=event=>this.samples.push(event.data);}
 process(inputs,outputs){const channels=outputs[0];if(channels.length>=2)this.samples.render(channels[0],channels[1]);return true;}
}
registerProcessor('umbra-application-audio',ApplicationAudioProcessor);
