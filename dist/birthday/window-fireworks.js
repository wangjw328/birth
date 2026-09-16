import * as T from './vendor/three.module.js';
// Bounded world-space trail buffers; the window frame occludes the show naturally.
export class WindowFireworks {
 constructor(scene){this.active=false;this.reduced=false;this.sparks=[];this.clock=0;this.next=0;this.max=36000;
 this.positions=new Float32Array(this.max*3);this.colors=new Float32Array(this.max*3);this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.positions,3));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,3));this.geometry.setDrawRange(0,0);
 this.material=new T.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});this.lines=new T.LineSegments(this.geometry,this.material);this.lines.frustumCulled=false;scene.add(this.lines);
 }
 start(){this.clock=0;this.next=1.4;this.sparks=[];this.active=true;this.lines.visible=true;}
 stop(){this.active=false;this.sparks=[];this.geometry.setDrawRange(0,0);this.lines.visible=false;}
 burst(x=(Math.random()-.5)*13,y=5.5+Math.random()*1.4){const z=-20-Math.random()*3,color=new T.Color(['#ffbd55','#ffd488','#ffbd55','#bba1ff','#ff8fae'][Math.floor(Math.random()*5)]),willow=Math.random()>.3;
 for(let i=0;i<110;i++){const a=i/110*Math.PI*2,speed=1.1+Math.random()*1.7;this.sparks.push({x,y,z,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,vz:(Math.random()-.5)*.8,born:this.clock-.25,max:willow?4.7:3.5,color});}}
 point(s,age){const flight=(1-Math.exp(-age*.45))/.45;return[s.x+s.vx*flight,s.y+s.vy*flight-(this.cosmic?0:.38)*age*age,s.z+s.vz*flight];}
 update(dt){if(!this.active)return;this.clock+=dt;
 if(this.reduced){if(!this.sparks.length){this.burst(-4,6);this.burst(3,6.7);}this.clock=1.65;}
 else if(this.clock>this.next&&this.clock<8){if(this.next===1.4){this.burst(-4,6.2);this.burst(3.4,6.8);}else this.burst();this.next=this.clock+1.1;}
 let n=0;const put=(p,c,a)=>{this.positions.set(p,n*3);this.colors.set([c.r*a,c.g*a,c.b*a],n++*3);};
 for(const s of this.sparks){const age=this.clock-s.born;if(age<0||age>s.max)continue;const alpha=Math.pow(1-age/s.max,.65);
 for(let j=0;j<12&&n<this.max-4;j++){const a=Math.max(0,age-j*.065),b=Math.max(0,age-(j+1)*.065),p=this.point(s,a),q=this.point(s,b),light=alpha*(1-j/14)*1.3;put(p,s.color,light);put(q,s.color,light*.85);
 const reflect=v=>[v[0]+Math.sin(v[1]*13+this.clock)*.035,1.2-(v[1]-1.2)*.55,v[2]+.01];if(!this.cosmic){put(reflect(p),s.color,light*.23);put(reflect(q),s.color,light*.18);}
 }}this.sparks=this.sparks.filter(s=>this.clock-s.born<s.max);this.geometry.setDrawRange(0,n);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;
 }
}
