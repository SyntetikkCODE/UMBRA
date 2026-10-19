export class PcmBuffer {
 constructor(size=16384){this.left=new Float32Array(size);this.right=new Float32Array(size);this.size=size;this.read=0;this.count=0;this.started=false;}
 push(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=0;i+3<bytes.length;i+=4){if(this.count===this.size){this.read=(this.read+1)%this.size;this.count--;}const at=(this.read+this.count)%this.size;this.left[at]=view.getInt16(i,true)/32768;this.right[at]=view.getInt16(i+2,true)/32768;this.count++;}if(this.count>5760){this.read=(this.read+this.count-2880)%this.size;this.count=2880;}}
 render(left,right){left.fill(0);right.fill(0);if(!this.started&&this.count<960)return;this.started=true;for(let i=0;i<left.length&&this.count;i++){left[i]=this.left[this.read];right[i]=this.right[this.read];this.read=(this.read+1)%this.size;this.count--;}if(!this.count)this.started=false;}
}
