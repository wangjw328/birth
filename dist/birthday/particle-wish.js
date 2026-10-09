import {finalePhase} from './finale-timing.mjs?v=3';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const seed=n=>{const v=Math.sin(n*127.17+18.4)*43758.5453;return v-Math.floor(v);};
const mix=(a,b,t)=>a+(b-a)*t;
function orbitPosition(orbit,angle,radius=1,time=0){
 const widths=[325,270,360,245],heights=[.29,.46,.37,.55],lean=[-.16,.72,-.64,1.12];
 const x=Math.cos(angle)*widths[orbit]*radius,y=Math.sin(angle)*widths[orbit]*heights[orbit]*radius,z=Math.sin(angle)*[145,185,-175,125][orbit]*radius;
 const precession=lean[orbit]+Math.sin(time*.16+orbit*1.7)*.075,c=Math.cos(precession),s=Math.sin(precession);
 return [x*c-y*s,x*s+y*c,z];
}

export class ParticleWish{
 constructor(canvas,onPhase){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onPhase=onPhase;
  this.active=false;this.complete=false;this.reduced=false;this.elapsed=0;this.phase='idle';this.voyage=false;
  this.roomStage=document.getElementById('room-stage');
  this.voyageLayer=document.createElement('div');this.voyageLayer.className='finale-voyage';this.voyageLayer.hidden=true;
  this.voyageLayer.setAttribute('aria-hidden','true');canvas.before(this.voyageLayer);
  this.voyageStars=document.createElement('canvas');this.voyageLayer.append(this.voyageStars);this.voyageCtx=this.voyageStars.getContext('2d');
  this.pointer={x:0,y:0};this.turn=0;this.targetTurn=0;this.back=true;this.morph=0;
  this.control=document.createElement('button');this.control.type='button';this.control.className='wish-flip-control';this.control.textContent='再看一次祝福 ↻';this.control.hidden=true;
  this.control.setAttribute('aria-label','旋转星核，回看生日祝福');
  Object.assign(this.control.style,{position:'fixed',right:'18px',top:'76px',zIndex:25,padding:'9px 16px',borderRadius:'24px',border:'1px solid #c3d5e64d',background:'#102033aa',color:'#e0eaf4',font:'12px system-ui',backdropFilter:'blur(10px)'});
  canvas.after(this.control);
  this.control.addEventListener('click',()=>{this.back=!this.back;this.control.dataset.side=this.back?'starsea':'greeting';this.control.textContent=this.back?'再看一次祝福 ↻':'转向星核 ↻';this.control.setAttribute('aria-label',this.control.textContent);});
  window.addEventListener('pointermove',e=>{this.pointer.x=(e.clientX/innerWidth-.5)*2;this.pointer.y=(e.clientY/innerHeight-.5)*2;},{passive:true});
  window.addEventListener('resize',()=>{if(this.active)this.layout();});
 }
 start(name,scene){this.name=String(name||'亲爱的你').trim()||'亲爱的你';this.voyage=scene==='rings';this.elapsed=0;this.active=true;this.complete=false;this.back=true;this.control.dataset.side='starsea';this.morph=0;this.turn=0;this.targetTurn=0;this.phase='fireworks';this.canvas.hidden=false;this.control.hidden=true;this.voyageLayer.hidden=!this.voyage;this.voyageLayer.style.opacity='0';this.voyageLayer.style.transform='scale(1.16)';this.canvas.setAttribute('aria-label',`立体粒子祝福 Happy Birthday ${this.name}，旋转后展开星海`);this.layout();this.onPhase('fireworks');}
 stop(){this.active=false;this.complete=false;this.canvas.hidden=true;this.control.hidden=true;this.voyageLayer.hidden=true;this.voyageLayer.style.opacity='0';if(this.roomStage){this.roomStage.style.transform='';this.roomStage.style.opacity='';this.roomStage.style.transition='';}this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 layout(){
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5),mobile=matchMedia('(pointer:coarse)').matches||h<500;
  this.w=w;this.h=h;this.scale=Math.min(w/1100,h/650);this.cx=w*.5;this.cy=h*.40;
  this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
  this.voyageStars.width=Math.round(w*dpr);this.voyageStars.height=Math.round(h*dpr);this.voyageCtx.setTransform(dpr,0,0,dpr,0,0);
  const mask=document.createElement('canvas');mask.width=1000;mask.height=300;const c=mask.getContext('2d',{willReadFrequently:true});
  c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';
  c.font='600 92px Georgia,serif';c.fillText('Happy Birthday',500,91);
  let size=88;c.font=`600 ${size}px "Microsoft YaHei",sans-serif`;
  while(c.measureText(this.name).width>820&&size>20){size--;c.font=`600 ${size}px "Microsoft YaHei",sans-serif`;}
  c.fillText(this.name,500,214);
  const data=c.getImageData(0,0,1000,300).data,sites=[];
  for(let y=16;y<282;y+=2)for(let x=40;x<960;x+=2)if(data[(y*1000+x)*4+3]>125)sites.push([x-500,y-145]);
  const count=mobile?3800:7000;
  this.points=Array.from({length:count},(_,i)=>{
   const site=sites[Math.floor(seed(i+1)*sites.length)]||[0,0],angle=seed(i+6)*Math.PI*2;
   const core=i%3===0,orbit=i%4,orbitAngle=seed(i+8)*Math.PI*2,orbitRadius=.88+seed(i+15)*.23;
   const shellRadius=9+Math.pow(seed(i+16),.7)*66,vertical=seed(i+17)*2-1;
   const destination=core?[Math.cos(angle)*Math.sqrt(1-vertical*vertical)*shellRadius,vertical*shellRadius,Math.sin(angle)*Math.sqrt(1-vertical*vertical)*shellRadius]:orbitPosition(orbit,orbitAngle,orbitRadius);
   return {tx:site[0]+(seed(i+2)-.5)*1.6,ty:site[1]+(seed(i+3)-.5)*1.6,tz:i%3===0?28:(seed(i+4)-.5)*56,
    gx:destination[0],gy:destination[1],gz:destination[2],core,orbit,orbitAngle,orbitRadius,
    a:angle,sx:Math.cos(angle)*(480+seed(i+5)*180),sy:Math.sin(angle)*240,sz:(seed(i+11)-.5)*430,
    delay:seed(i+12)*.29,radius:core?.55+Math.pow(seed(i+13),3)*1.5:.34+Math.pow(seed(i+13),4)*1.1,phase:seed(i+14)*6.28,bright:i%37===0,color:core?i%5===0?'#fff2d0':'#ffd58c':i%9===0?'#fff2d1':i%7===0?'#9bbbe7':'#e5c996'};
  });
 }
 drawVoyage(progress){
  if(!this.voyage)return;
  const p=smooth(progress),moving=progress>0&&progress<1;
  this.voyageLayer.style.opacity=String(p);
  this.voyageLayer.style.transform=`scale(${mix(1.16,1,p).toFixed(3)})`;
  if(this.roomStage){this.roomStage.style.transition='none';this.roomStage.style.transform=`scale(${mix(1,.72,p).toFixed(3)})`;this.roomStage.style.opacity=String(1-p);}
  const c=this.voyageCtx;c.clearRect(0,0,this.w,this.h);
  const travel=moving?Math.sin(Math.PI*p):0;
  for(let i=0;i<240;i++){
   const a=seed(i+2100)*Math.PI*2,r=Math.sqrt(seed(i+2200))*Math.max(this.w,this.h)*.75;
   const radial=r*(.65+.35*p)+travel*seed(i+2300)*80;
   const x=this.w*.5+Math.cos(a)*radial,y=this.h*.48+Math.sin(a)*radial*.68;
   if(x<0||x>this.w||y<0||y>this.h)continue;
   const alpha=(.12+seed(i+2400)*.52)*p;
   c.fillStyle=i%9===0?`rgba(246,217,171,${alpha})`:`rgba(202,224,248,${alpha})`;
   c.beginPath();c.arc(x,y,.35+seed(i+2500)*1.1,0,Math.PI*2);c.fill();
   if(moving&&i%4===0){c.strokeStyle=`rgba(185,215,246,${alpha*travel*.45})`;c.lineWidth=.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(a)*travel*20,y-Math.sin(a)*travel*14);c.stroke();}
  }
 }
 update(dt){
  if(!this.active)return;this.elapsed+=dt;
  const state=finalePhase(this.elapsed,this.reduced,this.voyage);
  if(state.phase!==this.phase){this.phase=state.phase;this.complete=state.phase==='complete';this.onPhase(this.phase);}
  this.drawVoyage(state.voyageProgress);
  const c=this.ctx;c.clearRect(0,0,this.w,this.h);if(state.phase==='fireworks'||state.phase==='transition')return;
  this.control.hidden=!this.complete;
  const t=this.elapsed-(this.reduced?1.1:this.voyage?12:9);
  const gather=this.reduced?state.progress:smooth(t/4);
  // Hold the extruded greeting, then turn through its edge before revealing the star field.
  const autoTurn=smooth((t-7)/6),autoMorph=smooth((t-8.7)/4.3);
  const desired=this.complete?(this.back?1:0):autoMorph;
  this.morph=this.reduced?(!this.back?1:0):this.complete?mix(this.morph,desired,1-Math.exp(-dt*1.2)):autoMorph;
  this.control.textContent=this.reduced?(this.back?'查看星核 ↻':'回看祝福 ↻'):(this.back?'再看一次祝福 ↻':'转向星核 ↻');
  this.control.setAttribute('aria-label',this.control.textContent);
  const angleTarget=this.reduced?0:this.complete?(this.back?Math.PI:Math.PI*2):autoTurn*Math.PI;
  this.turn=this.complete?mix(this.turn,angleTarget,1-Math.exp(-dt*1.3)):angleTarget;
  const pointer=this.reduced?0:this.pointer.x*.10;
  const spin=this.reduced?0:Math.max(0,t-13)*.025*this.morph;
  const yaw=this.turn+pointer+spin-(1-this.morph)*.23,cy=Math.cos(yaw),sy=Math.sin(yaw);
  const tilt=mix(-.055,.15,this.morph)+(this.reduced?0:this.pointer.y*.04),ct=Math.cos(tilt),st=Math.sin(tilt);
  const project=(x,y,z)=>{const rx=x*cy+z*sy,rz=z*cy-x*sy,ry=y*ct-rz*st,depth=rz*ct+y*st,perspective=1000/(1000-depth),size=this.scale*mix(1,.82,this.morph);return {x:this.cx+rx*perspective*size,y:mix(this.cy,this.h*.52,this.morph)+ry*perspective*size,depth,perspective};};
  const rendered=[];
  for(const p of this.points){
   const formation=this.reduced?gather:smooth((gather-p.delay)/(1-p.delay));
   if(formation===0)continue;
   const drift=this.reduced?0:Math.sin(this.elapsed*.45+p.phase)*2.2*this.morph;
   const orbital=p.core?[p.gx,p.gy,p.gz]:orbitPosition(p.orbit,p.orbitAngle+(this.reduced?0:this.elapsed*.11*(p.orbit%2?1:-1)),p.orbitRadius,this.elapsed);
   let x=mix(p.tx,orbital[0],this.morph),y=mix(p.ty,orbital[1]+drift,this.morph),z=mix(p.tz,orbital[2],this.morph);
   x=mix(p.sx,x,formation);y=mix(p.sy,y,formation);z=mix(p.sz,z,formation);
   const {x:screenX,y:screenY,depth,perspective}=project(x,y,z);
   const edgeLight=.24+.64*(p.tz+28)/56;
   const shimmer=this.reduced?1:.88+.12*Math.sin(this.elapsed*1.15+p.phase);
   const volumeLight=p.core?clamp(.39+(depth+75)/300):.53+perspective*.13;
   rendered.push({x:screenX,y:screenY,z:depth,r:Math.max(.35,p.radius*perspective*Math.max(.7,this.scale)),alpha:clamp(mix(edgeLight,volumeLight,this.morph)*shimmer*formation),p});
  }
  rendered.sort((a,b)=>a.z-b.z);
  c.save();c.globalCompositeOperation='screen';
  const orbitFade=smooth((this.morph-.55)/.45);
  if(orbitFade){
   const glow=c.createRadialGradient(this.cx,this.h*.52,3,this.cx,this.h*.52,95*this.scale);
   glow.addColorStop(0,`rgba(255,232,177,${orbitFade*.68})`);glow.addColorStop(.28,`rgba(241,176,83,${orbitFade*.3})`);glow.addColorStop(1,'rgba(227,156,73,0)');
   c.fillStyle=glow;c.globalAlpha=1;c.fillRect(this.cx-100*this.scale,this.h*.52-100*this.scale,200*this.scale,200*this.scale);
   for(let ring=0;ring<4;ring++){
    c.beginPath();for(let step=0;step<=160;step++){const q=orbitPosition(ring,step/160*Math.PI*2,1,this.elapsed),at=project(...q);if(step===0)c.moveTo(at.x,at.y);else c.lineTo(at.x,at.y);}
    c.strokeStyle=ring===2?'#e8d7ab':ring===3?'#a7bad2':'#e5b879';c.lineWidth=ring===2?1.15:.8;c.globalAlpha=orbitFade*(ring===2?.29:.20);c.shadowColor=ring===3?'#b0d5fa':'#f7d29c';c.shadowBlur=9;c.stroke();c.shadowBlur=0;
    const head=this.elapsed*.24*(ring%2?1:-1)+ring*1.3;
    c.beginPath();for(let step=0;step<=28;step++){const q=orbitPosition(ring,head+step/28*.46,1,this.elapsed),at=project(...q);if(step===0)c.moveTo(at.x,at.y);else c.lineTo(at.x,at.y);}
    c.lineWidth=1.55;c.globalAlpha=orbitFade*.58;c.shadowBlur=12;c.stroke();c.shadowBlur=0;
   }
  }
  // Three quiet, offset streams make the arrival feel like a celestial current,
  // rather than a flat cloud suddenly resolving into text.
  if(!this.reduced&&t<5){
   const stream=smooth(t/1.2)*(1-smooth((t-3.3)/1.7));
   for(let arm=0;arm<3;arm++){
    const offset=arm*Math.PI*2/3+t*.16;
    c.strokeStyle=arm===1?`rgba(246,210,154,${stream*.2})`:`rgba(157,198,239,${stream*.17})`;
    c.lineWidth=arm===1?1.2:.8;c.beginPath();
    for(let k=0;k<=60;k++){
     const u=k/60,r=48+u*360,angle=offset+u*4.5;
     const x=this.cx+Math.cos(angle)*r*this.scale,y=this.cy+Math.sin(angle)*r*.3*this.scale;
     if(k===0)c.moveTo(x,y);else c.lineTo(x,y);
    }c.stroke();
   }
  }
  for(const dot of rendered){
   const {x,y,r,p,alpha}=dot;c.fillStyle=p.color;c.globalAlpha=alpha;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
   if(p.bright){c.globalAlpha=alpha*.055;c.beginPath();c.arc(x,y,r*4.8,0,Math.PI*2);c.fill();c.globalAlpha=alpha*.25;c.fillRect(x-r*2.7,y-.35,r*5.4,.7);c.fillRect(x-.35,y-r*2.7,.7,r*5.4);}
  }
  c.restore();
 }
}
