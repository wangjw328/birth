// One flying lantern per blessing lit in this visit; no unrelated background lamps.
export class SkyLanterns {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.active=false;this.elapsed=0;this.reduced=false;}
 start(names){this.names=names;this.elapsed=0;this.active=true;this.update(0);}
 stop(){this.active=false;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 update(dt){
  if(!this.active)return;this.elapsed+=dt;
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,1.5),c=this.ctx;
  if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  this.names.forEach((name,i)=>{
   const age=Math.max(0,this.elapsed-1.2-i*1.15),p=this.reduced?.55:Math.min(age/32,1);
   if(!this.reduced&&age===0)return;
   const lane=(i+1)/(this.names.length+1),x=w*(.2+lane*.6)+Math.sin(age*.27+i)*w*.018,y=h*(.59-p*.49);
   const size=Math.min(w*.12,80)*(1-p*.88),alpha=this.reduced?1:Math.min(1,age/1.2)*(1-Math.max(0,(p-.85)/.15));
   c.save();c.translate(x,y);c.rotate(this.reduced?0:Math.sin(age*.5+i)*.045);c.scale(size/80,size/80);c.globalAlpha=alpha;
   const glow=c.createRadialGradient(0,0,5,0,0,105);glow.addColorStop(0,'#ffc56980');glow.addColorStop(1,'#ffb84c00');c.fillStyle=glow;c.fillRect(-110,-110,220,220);
   const paper=c.createLinearGradient(-40,0,40,0);paper.addColorStop(0,'#a74323');paper.addColorStop(.25,'#ee9246');paper.addColorStop(.52,'#ffdb8e');paper.addColorStop(1,'#ba5328');c.fillStyle=paper;
   c.beginPath();c.moveTo(-36,-52);c.quadraticCurveTo(0,-65,36,-52);c.bezierCurveTo(47,-20,35,20,25,38);c.quadraticCurveTo(0,46,-25,38);c.bezierCurveTo(-35,20,-47,-20,-36,-52);c.fill();
   c.strokeStyle='#ffe2a080';c.lineWidth=1;for(const a of [-.55,0,.55]){c.beginPath();c.moveTo(a*36,-54);c.quadraticCurveTo(a*47,0,a*25,39);c.stroke();}
   c.fillStyle='#663222';c.beginPath();c.ellipse(0,39,24,6,0,0,Math.PI*2);c.fill();
   c.fillStyle='#fff1b7';c.shadowColor='#ffb43c';c.shadowBlur=18;c.beginPath();c.moveTo(-5,38);c.quadraticCurveTo(-8,27,0,17);c.quadraticCurveTo(9,32,5,38);c.fill();c.shadowBlur=0;
   c.fillStyle='#693820';c.font='16px SimSun, serif';c.textAlign='center';c.fillText(name.length>4?name.slice(0,4)+'…':name,0,-7);c.restore();
  });
 }
}
