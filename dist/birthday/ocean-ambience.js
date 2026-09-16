// Procedural surf, kept in its own audio graph so future music has separate controls.
export class OceanAmbience{
 constructor(){this.enabled=true;this.playing=false;this.context=null;this.graph=null;}
 create(){
  if(this.context)return;
  const context=new AudioContext();this.context=context;
  const length=context.sampleRate*12,buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
  let seed=31873;for(let i=0;i<length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=(seed/2147483648-1)*.78;}
  // Join the start and end of the loop without an audible click.
  const blend=Math.round(context.sampleRate*.16);for(let i=0;i<blend;i++){const a=i/blend,mixed=data[i]*a+data[length-blend+i]*(1-a);data[i]=mixed;data[length-blend+i]=mixed;}
  const edge=data[0];for(let i=0;i<256;i++){const j=length-256+i;data[j]=data[j]*(1-i/256)+edge*(i/256);}data[length-1]=edge;
  const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
  const highpass=context.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=75;
  const lowpass=context.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=800;
  const surf=context.createGain();surf.gain.value=.38;
  const master=context.createGain();master.gain.value=0;
  source.connect(highpass).connect(lowpass).connect(surf).connect(master).connect(context.destination);
  const swell=context.createOscillator();swell.type='sine';swell.frequency.value=.12;
  const amount=context.createGain();amount.gain.value=.17;swell.connect(amount).connect(surf.gain);
  source.start();swell.start();this.graph={source,swell,master};
 }
 async start(){
  if(!this.enabled)return false;
  try{clearTimeout(this.suspendTimer);this.create();await this.context.resume();const now=this.context.currentTime;this.graph.master.gain.cancelScheduledValues(now);this.graph.master.gain.setTargetAtTime(.12,now,.5);this.playing=true;return true;}
  catch(error){console.warn('Ocean ambience unavailable',error);this.playing=false;return false;}
 }
 stop(){if(!this.context)return;const now=this.context.currentTime;this.graph.master.gain.cancelScheduledValues(now);this.graph.master.gain.setTargetAtTime(0,now,.15);this.playing=false;clearTimeout(this.suspendTimer);this.suspendTimer=setTimeout(()=>{if(!this.playing)this.context?.suspend().catch(()=>{});},650);}
 async setEnabled(enabled){this.enabled=enabled;if(enabled)return this.start();this.stop();return false;}
 suspend(){if(this.context&&this.playing)this.context.suspend().catch(()=>{});}
 resume(){if(this.context&&this.playing)this.context.resume().catch(()=>{});}
 dispose(){this.stop();clearTimeout(this.suspendTimer);this.graph?.source.stop();this.graph?.swell.stop();this.context?.close().catch(()=>{});this.context=null;this.graph=null;}
}
