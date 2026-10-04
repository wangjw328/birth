// Subtle, scene-specific light drawn only inside the photographed window.
// The photograph supplies the landscape; this layer adds independent motion to its sky and water.
const fract=n=>n-Math.floor(n);
const random=n=>fract(Math.sin(n*127.17+18.4)*43758.5453);
const TAU=Math.PI*2;

export class RoomCinema{
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.scene='aurora';this.reduced=false;
  this.last=-Infinity;this.coarse=matchMedia('(pointer: coarse)').matches;this.width=this.coarse?720:960;this.height=this.coarse?405:540;this.canvas.width=this.width;this.canvas.height=this.height;
  this.stars=Array.from({length:190},(_,i)=>({x:.09+random(i+3)*.78,y:.07+random(i+91)*.40,r:.3+random(i+211)*.9,phase:random(i+321)*TAU}));
 }
 setScene(name){this.scene=name;this.last=-Infinity;}
 update(seconds){
  const interval=this.reduced?Infinity:(this.coarse?1/20:1/30);
  if(seconds-this.last<interval)return;this.last=seconds;
  const c=this.ctx,w=this.width,h=this.height,t=this.reduced?0:seconds;
  c.clearRect(0,0,w,h);c.save();c.beginPath();
  if(this.scene==='rings'){
   [[.075,.02],[.94,.02],[.97,.31],[.90,.55],[.82,.59],[.30,.59],[.22,.55],[.10,.32]].forEach(([x,y],i)=>i?c.lineTo(x*w,y*h):c.moveTo(x*w,y*h));
  }else{
   [[.085,.05],[.86,.05],[.86,.73],[.085,.76]].forEach(([x,y],i)=>i?c.lineTo(x*w,y*h):c.moveTo(x*w,y*h));
  }
  c.closePath();c.clip();c.globalCompositeOperation='screen';
  if(this.scene==='aurora')this.aurora(c,w,h,t);
  else if(this.scene==='sunset')this.sunset(c,w,h,t);
  else if(this.scene==='garden')this.garden(c,w,h,t);
  else if(this.scene==='starlake')this.starlake(c,w,h,t);
  else this.rings(c,w,h,t);
  c.restore();
 }
 starscape(c,w,h,t,count=70,color='220,235,245'){
  for(let i=0;i<count;i++){
   const s=this.stars[i],twinkle=.35+.28*Math.sin(t*(.35+random(i+451)*.6)+s.phase);
   c.fillStyle=`rgba(${color},${Math.max(.07,twinkle)})`;
   c.beginPath();c.arc(s.x*w,s.y*h,s.r,0,TAU);c.fill();
  }
 }
 aurora(c,w,h,t){
  this.starscape(c,w,h,t,105,'205,232,244');
  // Fine curtain strands change curvature; no full-image fog or uniform wash.
  const colors=['97,222,189','138,190,230','190,140,219','177,230,170'];
  const strands=this.coarse?72:110;
  for(let i=0;i<strands;i++){
   const q=i/(strands-1),x=(.10+q*.73)*w,phase=q*7.8+t*.16;
   const top=(.10+.055*Math.sin(q*8.2+t*.15)+.022*Math.sin(q*18-t*.1))*h;
   const length=(.10+.09*random(i+13))*(.45+.55*Math.sin(q*Math.PI))*h;
   const x2=x+Math.sin(phase)*w*.014;
   const g=c.createLinearGradient(x,top,x2,top+length);
   const rgb=colors[Math.floor(q*colors.length)%colors.length];
   g.addColorStop(0,`rgba(${rgb},0)`);g.addColorStop(.25,`rgba(${rgb},${.075+.06*random(i+27)})`);g.addColorStop(1,`rgba(${rgb},0)`);
   c.strokeStyle=g;c.lineWidth=1+random(i+71)*3;c.beginPath();c.moveTo(x,top);c.bezierCurveTo(x-w*.015,top+length*.28,x2+w*.01,top+length*.68,x2,top+length);c.stroke();
  }
  // The lake responds later and at a fraction of the sky's brightness.
  for(let i=0;i<64;i++){
   const x=(.12+random(i+601)*.68)*w,y=(.54+random(i+701)*.17)*h;
   const sway=Math.sin(t*.45-i*.31),alpha=(.025+.045*random(i+711))*(.7+.3*sway);
   c.strokeStyle=`rgba(${i%4===0?'188,143,215':'101,207,181'},${alpha})`;c.lineWidth=.7+random(i+721)*1.2;c.beginPath();c.moveTo(x-5-sway*2,y);c.lineTo(x+4+random(i+731)*14+sway*2,y);c.stroke();
  }
 }
 sunset(c,w,h,t){
  for(let i=0;i<90;i++){
   const x=(.10+random(i+33)*.74)*w,y=(.47+random(i+73)*.23)*h;
   const span=5+random(i+211)*31,alpha=(.025+random(i+251)*.07)*(.7+.3*Math.sin(t*.8+i));
   c.strokeStyle=`rgba(250,192,133,${alpha})`;c.lineWidth=.7+random(i+271)*1.2;c.beginPath();c.moveTo(x-span*.5,y);c.lineTo(x+span*.5,y);c.stroke();
  }
 }
 garden(c,w,h,t){
  this.starscape(c,w,h,t,36,'213,226,236');
  for(let i=0;i<36;i++){
   const x=(.12+random(i+101)*.67)*w+Math.sin(t*.3+i*1.9)*8;
   const y=(.35+random(i+181)*.34)*h+Math.sin(t*.42+i*2.7)*5;
   const a=.12+.22*(.5+.5*Math.sin(t*.9+i*2.2));
   c.fillStyle=`rgba(246,222,157,${a})`;c.beginPath();c.arc(x,y,1+random(i+221)*1.5,0,TAU);c.fill();
  }
 }
 starlake(c,w,h,t){
  this.starscape(c,w,h,t,160,'216,230,248');
  for(let i=0;i<70;i++){
   const s=this.stars[i],x=s.x*w+Math.sin(t*.21+i)*3,y=(.53+random(i+301)*.2)*h;
   c.strokeStyle=`rgba(180,205,243,${.025+.055*(.5+.5*Math.sin(t*.56+i))})`;c.lineWidth=.5+s.r*.5;
   c.beginPath();c.moveTo(x-3,y);c.lineTo(x+4+random(i+331)*13,y);c.stroke();
  }
 }
 rings(c,w,h,t){
  this.starscape(c,w,h,t,155,'240,226,195');
  for(let i=0;i<58;i++){
   const s=this.stars[i],x=(.24+random(i+471)*.6)*w+Math.sin(t*.08+i)*2,y=(.16+random(i+521)*.34)*h;
   c.fillStyle=`rgba(243,207,143,${.035+.075*(.5+.5*Math.sin(t*.45+i))})`;
   c.beginPath();c.arc(x,y,s.r*.7,0,TAU);c.fill();
  }
 }
}
