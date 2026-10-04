// Short recordings from Kenney's CC0 Interface Sounds pack. See assets/sfx/SOURCE.md.
const files={entry:'entry.mp3',memory:'memory.mp3',page:'page.mp3',candle:'candle.mp3',wish:'wish.mp3',detail:'detail.mp3'};
const levels={entry:.24,memory:.2,page:.12,candle:.24,wish:.25,detail:.17};

export class InteractionSounds{
 constructor(){this.enabled=false;this.context=null;this.buffers=new Map();this.loading=null;this.lastPlayed=new Map();}
 async enable(){
  if(!this.context){
   const AudioContextClass=window.AudioContext||window.webkitAudioContext;
   if(!AudioContextClass)throw new Error('AudioContext unavailable');
   this.context=new AudioContextClass();
  }
  await this.context.resume();
  this.enabled=true;
  if(!this.loading)this.loading=Promise.all(Object.entries(files).map(async([name,file])=>{
   try{
    const response=await fetch(new URL(`./assets/sfx/${file}`,import.meta.url));
    if(!response.ok)throw new Error(`${response.status} ${file}`);
    this.buffers.set(name,await this.context.decodeAudioData(await response.arrayBuffer()));
   }catch(error){console.warn('交互音效加载失败',name,error);}
  }));
  await this.loading;
  if(!this.buffers.size)throw new Error('No interaction sounds loaded');
 }
 disable(){this.enabled=false;}
 play(name){
  if(!this.enabled||document.hidden)return;
  const buffer=this.buffers.get(name),ctx=this.context;
  if(!buffer||!ctx||ctx.state!=='running')return;
  const now=ctx.currentTime;
  if(now-(this.lastPlayed.get(name)??-Infinity)<.16)return;
  this.lastPlayed.set(name,now);
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffer;gain.gain.value=levels[name]??.18;
  source.connect(gain);gain.connect(ctx.destination);source.start();
  source.onended=()=>{source.disconnect();gain.disconnect();};
 }
 suspend(){return this.context?.suspend();}
 resume(){return this.enabled?this.context?.resume():undefined;}
 dispose(){this.enabled=false;this.buffers.clear();return this.context?.close();}
}
