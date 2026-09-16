// Window-local animation; follows the same image camera as the room.
export class LivingWindow {
 constructor(layer){
  this.canvas=document.createElement('canvas');this.canvas.className='living-window';this.canvas.setAttribute('aria-hidden','true');layer.append(this.canvas);
  this.canvas.width=1672;this.canvas.height=941;this.ctx=this.canvas.getContext('2d');
  this.dots=Array.from({length:100},()=>({x:Math.random(),y:Math.random(),p:Math.random()*Math.PI*2,r:.4+Math.random()*1.2,s:.3+Math.random()*.7}));this.elapsed=0;
 }
 update(dt,name,reduced){
  const c=this.ctx;if(!c)return;c.clearRect(0,0,1672,941);if(reduced)return;
  this.elapsed+=dt;const t=this.elapsed,ship=name==='rings';c.save();
  const points=ship?[[125,0],[1597,0],[1664,320],[1538,546],[1404,593],[485,593],[334,546],[167,320]]:[[117,0],[1455,0],[1455,701],[117,743]];
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.globalCompositeOperation='screen';
  if(name==='aurora'){
   for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=90;i++){const x=115+i*15,y=190+j*39+Math.sin(i*.052+t*.16+j*.65)*68+Math.sin(i*.15-t*.12)*16;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=['#47ebbb','#45c8d4','#8d88e5'][j];c.globalAlpha=.055;c.lineWidth=28+j*13;c.shadowBlur=35;c.shadowColor=c.strokeStyle;c.stroke();}c.shadowBlur=0;
  }
  if(['aurora','starlake','rings'].includes(name))for(const d of this.dots){
   const x=ship?125+((d.x+t*.0018*d.s)%1)*1400:130+d.x*1300,y=20+d.y*440;
   c.globalAlpha=(.12+.15*(1+Math.sin(t*d.s+d.p)))* (ship?.8:1);c.fillStyle='#e4f2ff';c.beginPath();c.arc(x,y,d.r,0,Math.PI*2);c.fill();
  }
  if(!ship){
   c.strokeStyle=name==='sunset'?'#ffd49e':'#c0dfea';c.lineWidth=1;
   for(let i=0;i<38;i++){const y=540+i*4.1,x=720+Math.sin(i*2.7+t*.34)*230,len=5+Math.sin(i+t*.4)*3+i*.5;c.globalAlpha=.035+.035*(1+Math.sin(t*.8+i));c.beginPath();c.moveTo(x-len,y);c.quadraticCurveTo(x,y+Math.sin(t+i),x+len,y);c.stroke();}
  }
  if(name==='garden')for(const d of this.dots.slice(0,30)){c.globalAlpha=.15+.22*(1+Math.sin(t*.6+d.p));c.fillStyle='#ffe6a1';c.beginPath();c.arc(180+d.x*1200+Math.sin(t*.13+d.p)*15,400+d.y*260+Math.cos(t*.22+d.p)*9,d.r*1.3,0,Math.PI*2);c.fill();}
  if(name==='starlake'){
   const a=t%17;if(a>11&&a<12.4){const progress=(a-11)/1.4,x=780+progress*220,y=100+progress*110;c.globalAlpha=Math.sin(progress*Math.PI)*.65;const gradient=c.createLinearGradient(x-95,y-47,x,y);gradient.addColorStop(0,'#b8dfff00');gradient.addColorStop(1,'#e6f4ff');c.strokeStyle=gradient;c.lineWidth=1.3;c.beginPath();c.moveTo(x-95,y-47);c.lineTo(x,y);c.stroke();}
  }
  c.restore();
 }
}
