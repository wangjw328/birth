import {finalePhase} from './finale-timing.mjs';
export class ParticleWish {
 constructor(canvas,onPhase){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onPhase=onPhase;this.active=false;this.complete=false;this.reduced=false;this.elapsed=0;this.phase='idle';window.addEventListener('resize',()=>{if(this.active)this.layout();});}
 start(name){this.name=String(name||'亲爱的你').trim()||'亲爱的你';this.elapsed=0;this.active=true;this.complete=false;this.phase='fireworks';this.canvas.hidden=false;this.canvas.setAttribute('aria-label',`Happy Birthday ${this.name}`);this.layout();this.onPhase('fireworks');}
 stop(){this.active=false;this.complete=false;this.canvas.hidden=true;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 layout(){
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5);this.w=w;this.h=h;
  this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;const c=mask.getContext('2d');c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';
  const maxWidth=w*.72;let size=Math.min(82,w*.095);c.font=`600 ${size}px Georgia, serif`;
  while(c.measureText('Happy Birthday').width>maxWidth){size--;c.font=`600 ${size}px Georgia, serif`;}
  const greetingY=h*.31;c.fillText('Happy Birthday',w*.5,greetingY);
  let nameSize=Math.min(92,w*.115),name=this.name;c.font=`650 ${nameSize}px "Microsoft YaHei", sans-serif`;
  while(nameSize>24&&c.measureText(name).width>maxWidth){nameSize--;c.font=`600 ${nameSize}px "Microsoft YaHei", sans-serif`;}
  const chars=Array.from(name),lines=[];let line='';for(const char of chars){if(line&&c.measureText(line+char).width>maxWidth){lines.push(line);line=char;}else line+=char;}if(line)lines.push(line);
  const nameStart=greetingY+size*.85+nameSize*.7;lines.forEach((text,i)=>c.fillText(text,w*.5,nameStart+i*nameSize*1.2));
  const data=c.getImageData(0,0,w,h).data,points=[],gap=w<650?2:3;
  for(let y=Math.floor(h*.2);y<Math.min(h*.72,h);y+=gap)for(let x=0;x<w;x+=gap)if(data[(y*w+x)*4+3]>100)points.push([x,y]);
  const stride=Math.max(1,Math.ceil(points.length/6200));this.points=points.filter((_,i)=>i%stride===0).map(([x,y],i)=>{const a=i*2.399963,r=Math.sqrt((i*.618034)%1),isName=y>nameStart-nameSize*.62;return {x,y,sx:w*.5+Math.cos(a)*w*.48*r,sy:h*.35+Math.sin(a)*h*.32*r,p:a,r:(isName?.82:.5)+(i%7)*.08,isName,tone:(i%11)/10};});
 }
 update(dt){if(!this.active)return;this.elapsed+=dt;const state=finalePhase(this.elapsed,this.reduced);if(state.phase!==this.phase){this.phase=state.phase;this.complete=state.phase==='complete';this.onPhase(this.phase);}
  const c=this.ctx;c.clearRect(0,0,this.w,this.h);if(state.phase==='fireworks')return;
  const t=state.progress,e=1-Math.pow(1-t,3);c.shadowColor='#f3b85e';c.shadowBlur=this.reduced?0:2;
  for(const p of this.points){const swirl=this.reduced?0:Math.sin(p.p+this.elapsed*1.2)*(1-e)*30;const x=p.sx+(p.x-p.sx)*e+swirl,y=p.sy+(p.y-p.sy)*e;
   const twinkle=this.reduced?1:.82+.18*Math.sin(p.p+this.elapsed*(.55+p.tone*.45));c.globalAlpha=(p.isName?.72:.48)+(p.isName?.28:.34)*e;c.globalAlpha*=twinkle;c.fillStyle=p.isName?(p.tone>.72?'#fff2c9':'#f4c67d'):(p.tone>.78?'#ead9b8':'#bfa67f');c.beginPath();c.arc(x,y,p.r*(1+(1-e)*.18),0,Math.PI*2);c.fill();}
  c.globalAlpha=1;c.shadowBlur=0;
 }
}
