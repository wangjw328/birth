import {finalePhase} from './finale-timing.mjs';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const smooth=t=>t*t*(3-2*t);
const seed=n=>{const value=Math.sin(n*127.17+18.4)*43758.5453;return value-Math.floor(value);};

export class ParticleWish{
 constructor(canvas,onPhase){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onPhase=onPhase;
  this.active=false;this.complete=false;this.reduced=false;this.elapsed=0;this.phase='idle';
  window.addEventListener('resize',()=>{if(this.active)this.layout();});
 }
 start(name){this.name=String(name||'亲爱的你').trim()||'亲爱的你';this.elapsed=0;this.active=true;this.complete=false;this.phase='fireworks';this.canvas.hidden=false;this.canvas.setAttribute('aria-label',`Happy Birthday ${this.name}`);this.layout();this.onPhase('fireworks');}
 stop(){this.active=false;this.complete=false;this.canvas.hidden=true;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 layout(){
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5),compact=h<540;this.w=w;this.h=h;
  this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;const m=mask.getContext('2d');
  m.fillStyle='#fff';m.textAlign='center';m.textBaseline='middle';
  const maxWidth=w*(compact?.72:.68),greetingY=h*(compact?.33:.34);
  let headingSize=Math.min(compact?58:78,w*.095);m.font=`500 ${headingSize}px Georgia, serif`;
  while(headingSize>20&&m.measureText('Happy Birthday').width>maxWidth){headingSize--;m.font=`500 ${headingSize}px Georgia, serif`;}
  m.fillText('Happy Birthday',w*.5,greetingY);
  let nameSize=Math.min(compact?66:88,w*.11);m.font=`600 ${nameSize}px "Microsoft YaHei",sans-serif`;
  while(nameSize>23&&m.measureText(this.name).width>maxWidth){nameSize--;m.font=`600 ${nameSize}px "Microsoft YaHei",sans-serif`;}
  const lines=[],chars=Array.from(this.name);let line='';for(const ch of chars){if(line&&m.measureText(line+ch).width>maxWidth){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
  const nameY=greetingY+headingSize*.68+nameSize*.68;lines.forEach((text,i)=>m.fillText(text,w*.5,nameY+i*nameSize*1.14));
  this.type={headingSize,nameSize,greetingY,nameY,lines};
  const data=m.getImageData(0,0,w,h).data,positions=[],gap=compact?3:3;
  for(let y=Math.floor(h*.19);y<Math.min(h*.78,h);y+=gap)for(let x=0;x<w;x+=gap)if(data[(y*w+x)*4+3]>130)positions.push([x,y]);
  const maxPoints=matchMedia('(pointer: coarse)').matches?2500:4300,stride=Math.max(1,Math.ceil(positions.length/maxPoints));
  this.points=positions.filter((_,i)=>i%stride===0).map(([x,y],i)=>{
   const name=y>greetingY+headingSize*.39,angle=i*2.399963,ring=Math.sqrt(seed(i+17));
   const sx=w*.5+Math.cos(angle)*w*(.34+.17*ring),sy=h*.53+Math.sin(angle)*h*(.15+.12*ring);
   const delay=(name?.14:0)+seed(i+4)*(name?.33:.29)+(x/w)*.055;
   return{x:x+(seed(i+101)-.5)*3.2,y:y+(seed(i+107)-.5)*3.2,sx,sy,delay,name,radius:(name?.48:.42)+seed(i+9)*.62,phase:angle,shade:i%13===0?'#e7f6ff':name?(i%7===0?'#ffffff':'#ffe1a3'):(i%5===0?'#c8e8ee':'#e9d5b5')};
  });
  this.motes=Array.from({length:56},(_,i)=>({a:i*2.399963,r:.24+seed(i+58)*.31,y:.23+seed(i+73)*.44,size:.5+seed(i+86)*1.2}));
 }
 update(dt){
  if(!this.active)return;this.elapsed+=dt;
  const state=finalePhase(this.elapsed,this.reduced);
  if(state.phase!==this.phase){this.phase=state.phase;this.complete=state.phase==='complete';this.onPhase(this.phase);}
  const c=this.ctx;c.clearRect(0,0,this.w,this.h);if(state.phase==='fireworks')return;
  const progress=state.progress,w=this.w,h=this.h;
  c.save();c.globalCompositeOperation='screen';
  // Three broad, curved streams travel through the window and write different parts of the greeting.
  for(const p of this.points){
   const local=clamp((progress-p.delay)/(1-p.delay),0,1),e=smooth(local);
   if(!e&&progress<.03)continue;
   const bend=Math.sin(p.phase*1.7)*h*.18,arc=4*(1-e)*e;
   const x=p.sx+(p.x-p.sx)*e+Math.cos(p.phase)*bend*arc*.6;
   const y=p.sy+(p.y-p.sy)*e+Math.sin(p.phase)*bend*arc*.4;
   const drift=this.reduced?0:(1-e)*Math.sin(this.elapsed*.9+p.phase)*7;
   const shimmer=this.reduced?1:.85+.15*Math.sin(this.elapsed*1.8+p.phase);
   c.globalAlpha=clamp((.24+.37*e)*shimmer,0,1);c.fillStyle=p.shade;
   c.beginPath();c.arc(x+drift,y,p.radius*(.78+.22*e),0,Math.PI*2);c.fill();
  }
  if(progress>.48){
   const alpha=smooth(clamp((progress-.48)/.52,0,1));
   const {headingSize,nameSize,greetingY,nameY,lines}=this.type;
   c.textAlign='center';c.textBaseline='middle';c.shadowColor='#f1d39c';c.shadowBlur=this.reduced?0:13;
   c.fillStyle='#ffeccf';c.globalAlpha=alpha*.61;c.font=`500 ${headingSize}px Georgia, serif`;c.fillText('Happy Birthday',w*.5,greetingY);
   c.globalAlpha=alpha*.72;c.font=`600 ${nameSize}px "Microsoft YaHei",sans-serif`;lines.forEach((text,i)=>c.fillText(text,w*.5,nameY+i*nameSize*1.14));
   c.shadowBlur=0;
  }
  if(progress>.78&&!this.reduced){
   c.globalAlpha=smooth(clamp((progress-.78)/.22,0,1))*.48;c.fillStyle='#fff4d5';
   for(const mote of this.motes){const a=mote.a+this.elapsed*.045,x=w*.5+Math.cos(a)*w*mote.r,y=h*mote.y+Math.sin(a)*h*.022;c.beginPath();c.arc(x,y,mote.size,0,Math.PI*2);c.fill();}
  }
  c.restore();
 }
}
