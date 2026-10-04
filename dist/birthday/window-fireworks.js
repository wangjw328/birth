import * as T from './vendor/three.module.js';

const COLORS={
 lotus:[['#ffd98b','#ffd0ad','#fff4d1'],['#a9dafa','#d2c6ff','#fff3df'],['#f3a5c2','#ffd19b','#fff4d4']],
 peony:['#fff0d5','#f6b46d','#fa849d','#b9d8f7'],
 willow:['#ffe6a2','#ffc56e','#fff6d7'],
 crown:['#d9f4f2','#8edfd4','#d7c4ff','#fff2c8']
};
const SCHEDULE=[
 [.35,-3.7,6.2,'lotus'],[1.35,3.2,6.7,'peony'],[2.5,-.5,7.05,'crown'],
 [3.65,4.35,5.8,'willow'],[4.8,-4.25,6.6,'peony'],[5.9,1.7,7.15,'lotus'],
 [7.25,-2.3,5.7,'willow'],[8.25,3.8,6.35,'crown'],
 [9.15,-1.15,7.2,'lotus'],[9.5,2.5,6.7,'peony'],[10.15,0,6.25,'willow']
];
const easeOut=t=>1-Math.exp(-t*.55);
export class WindowFireworks{
 constructor(scene){
  this.active=false;this.reduced=false;this.cosmic=false;this.clock=0;this.sparks=[];this.rockets=[];this.flashes=[];this.eventIndex=0;this.lotusIndex=0;
  this.maxLines=18000;this.maxPoints=3200;
  this.linePositions=new Float32Array(this.maxLines*3);this.lineColors=new Float32Array(this.maxLines*3);
  this.lineGeometry=new T.BufferGeometry();this.lineGeometry.setAttribute('position',new T.BufferAttribute(this.linePositions,3));this.lineGeometry.setAttribute('color',new T.BufferAttribute(this.lineColors,3));this.lineGeometry.setDrawRange(0,0);
  this.lineMaterial=new T.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  this.lines=new T.LineSegments(this.lineGeometry,this.lineMaterial);this.lines.frustumCulled=false;scene.add(this.lines);
  this.pointPositions=new Float32Array(this.maxPoints*3);this.pointColors=new Float32Array(this.maxPoints*3);
  this.pointGeometry=new T.BufferGeometry();this.pointGeometry.setAttribute('position',new T.BufferAttribute(this.pointPositions,3));this.pointGeometry.setAttribute('color',new T.BufferAttribute(this.pointColors,3));this.pointGeometry.setDrawRange(0,0);
  const glow=document.createElement('canvas');glow.width=glow.height=32;const ctx=glow.getContext('2d'),gradient=ctx.createRadialGradient(16,16,1,16,16,16);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.28,'rgba(255,255,255,.94)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);this.glowMap=new T.CanvasTexture(glow);
  this.pointMaterial=new T.PointsMaterial({size:.18,map:this.glowMap,sizeAttenuation:true,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  this.points=new T.Points(this.pointGeometry,this.pointMaterial);this.points.frustumCulled=false;scene.add(this.points);
  this.haloMaterial=new T.PointsMaterial({size:.48,map:this.glowMap,opacity:.32,sizeAttenuation:true,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  this.halos=new T.Points(this.pointGeometry,this.haloMaterial);this.halos.frustumCulled=false;scene.add(this.halos);
  this.flashPositions=new Float32Array(32*3);this.flashColors=new Float32Array(32*3);this.flashGeometry=new T.BufferGeometry();this.flashGeometry.setAttribute('position',new T.BufferAttribute(this.flashPositions,3));this.flashGeometry.setAttribute('color',new T.BufferAttribute(this.flashColors,3));this.flashGeometry.setDrawRange(0,0);
  this.flashMaterial=new T.PointsMaterial({size:1.15,map:this.glowMap,sizeAttenuation:true,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});this.flashPoints=new T.Points(this.flashGeometry,this.flashMaterial);this.flashPoints.frustumCulled=false;scene.add(this.flashPoints);
 }
 start(){this.clock=0;this.eventIndex=0;this.lotusIndex=0;this.sparks=[];this.rockets=[];this.flashes=[];this.roomFlash=0;this.roomFlashColor='#ffe2b6';this.active=true;this.lines.visible=this.points.visible=this.halos.visible=this.flashPoints.visible=true;this.lineGeometry.setDrawRange(0,0);this.pointGeometry.setDrawRange(0,0);this.flashGeometry.setDrawRange(0,0);}
 stop(){this.active=false;this.sparks=[];this.rockets=[];this.flashes=[];this.roomFlash=0;this.lineGeometry.setDrawRange(0,0);this.pointGeometry.setDrawRange(0,0);this.flashGeometry.setDrawRange(0,0);this.lines.visible=this.points.visible=this.halos.visible=this.flashPoints.visible=false;}
 launch(x,y,style){this.rockets.push({x,y,style,born:this.clock,z:-20.6-Math.random()*1.6,flight:.58+Math.random()*.2});}
 burst(x,y,z,style){
  const palette=style==='lotus'?COLORS.lotus[(this.lotusIndex++)%COLORS.lotus.length]:COLORS[style],shells=style==='lotus'?[224,56]:[style==='willow'?96:130],bloomPhase=Math.random()*Math.PI*2;
  this.flashes.push({x,y,z,born:this.clock,color:new T.Color(palette[0])});
  for(let layer=0;layer<shells.length;layer++)for(let i=0;i<shells[layer];i++){
   const count=shells[layer],a=i/count*Math.PI*2,unit=(i+.5)/count,slow=layer? .52:1;
   let vx,vy,vz,gravity,life;
   if(style==='lotus'){
    const theta=Math.random()*Math.PI*2,scallop=.91+.09*Math.cos(theta*6+bloomPhase);
    const speed=(layer?.55+Math.random()*1.05:1.5+Math.random()*1.65)*scallop;
    vx=Math.cos(theta)*speed;vy=Math.sin(theta)*speed+.14;vz=(Math.random()-.5)*1.25;gravity=this.cosmic?.035:.16+Math.random()*.055;life=2.15+Math.random()*.9;
   }else{
    const elevation=2*unit-1,azimuth=i*2.399963,vRadius=Math.sqrt(Math.max(0,1-elevation*elevation));
    const speed=style==='willow'?1.5:style==='crown'?2.35:2.7;
    vx=Math.cos(azimuth)*vRadius*speed*(.82+Math.random()*.36);vy=elevation*speed+(style==='willow'?.8:0);vz=Math.sin(azimuth)*vRadius*speed*.8;
    gravity=this.cosmic?.035:style==='willow'?.34:.21;life=style==='willow'?3.55:2.65;
   }
   const color=new T.Color(palette[style==='lotus'?(i%11===0?2:layer?2:i%4===0?1:0):(i+layer*2)%palette.length]);
   this.sparks.push({x,y,z,vx,vy,vz,gravity,life,born:this.clock+Math.random()*.075,phase:i*1.71,color,style,twinkle:(style==='crown'||style==='lotus')&&i%7===0});
  }
 }
 point(s,age){const flight=easeOut(age)/.55;return[s.x+s.vx*flight,s.y+s.vy*flight-s.gravity*age*age,s.z+s.vz*flight];}
 update(dt){
  if(!this.active)return;
  this.clock+=dt;
  if(this.reduced){if(!this.sparks.length){this.burst(-2.8,6.1,-21,'lotus');this.burst(2.7,6.5,-21,'crown');}this.clock=.72;}
  else while(this.eventIndex<SCHEDULE.length&&this.clock>=SCHEDULE[this.eventIndex][0]){const [,x,y,style]=SCHEDULE[this.eventIndex++];this.launch(x,y,style);}
  const line=(p,q,c,a,b)=>{if(this.lineCount+2>this.maxLines)return;for(const [v,light]of [[p,a],[q,b]]){this.linePositions.set(v,this.lineCount*3);this.lineColors.set([c.r*light,c.g*light,c.b*light],this.lineCount*3);this.lineCount++;}};
  const dot=(p,c,a)=>{if(this.pointCount>=this.maxPoints)return;this.pointPositions.set(p,this.pointCount*3);this.pointColors.set([c.r*a,c.g*a,c.b*a],this.pointCount*3);this.pointCount++;};
  this.lineCount=0;this.pointCount=0;
  const rocketColor=new T.Color('#ffe7b8');
  this.rockets=this.rockets.filter(r=>{
   const t=(this.clock-r.born)/r.flight;if(t>=1){this.burst(r.x,r.y,r.z,r.style);return false;}
   const y=2.65+(r.y-2.65)*(t*t*(3-2*t)),p=[r.x,y,r.z],q=[r.x-.08,y-.37,r.z+.03];
   line(p,q,rocketColor,1.25,.1);dot(p,rocketColor,1.6);return true;
  });
  this.sparks=this.sparks.filter(s=>{
   const age=this.clock-s.born;if(age<0)return true;if(age>s.life)return false;
   const fade=Math.pow(Math.max(0,1-age/s.life),.78),flicker=s.twinkle?.72+.28*Math.sin(this.clock*12+s.phase):1;
   const head=this.point(s,age),brightness=fade*flicker*(age<.16?.5+age*3:1);
   dot(head,s.color,brightness*1.9);
   const segments=s.style==='lotus'?2:s.life>3?5:4;
   for(let j=0;j<segments;j++){
    const a=Math.max(0,age-j*.075),b=Math.max(0,age-(j+1)*.075);
    if(a<=0)break;
    line(this.point(s,a),this.point(s,b),s.color,brightness*(1-j/segments)*1.15,brightness*(1-(j+1)/segments)*.72);
   }
   return true;
  });
  let flashCount=0;this.roomFlash=0;this.flashes=this.flashes.filter(f=>{
   const age=this.clock-f.born;if(age>.55)return false;
   this.flashPositions.set([f.x,f.y,f.z],flashCount*3);
   const strength=Math.max(0,1-age/.55)*3.1;this.flashColors.set([f.color.r*strength,f.color.g*strength,f.color.b*strength],flashCount*3);flashCount++;return true;
  });
  for(const flash of this.flashes){const light=Math.max(0,1-(this.clock-flash.born)/.55);if(light>this.roomFlash){this.roomFlash=light;this.roomFlashColor='#'+flash.color.getHexString();}}
  this.lineGeometry.setDrawRange(0,this.lineCount);this.pointGeometry.setDrawRange(0,this.pointCount);this.flashGeometry.setDrawRange(0,flashCount);
  for(const attr of [this.lineGeometry.attributes.position,this.lineGeometry.attributes.color,this.pointGeometry.attributes.position,this.pointGeometry.attributes.color,this.flashGeometry.attributes.position,this.flashGeometry.attributes.color])attr.needsUpdate=true;
 }
}
