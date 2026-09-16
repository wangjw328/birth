import * as T from './vendor/three.module.js';
import {MemoryParticles} from './particles.js?v=20';
import {sampleFlow} from './flow-paths.mjs?v=16b';

// Birthday-only extension: other themes keep their existing particle behavior.
export class FlowMemoryParticles extends MemoryParticles {
 constructor(...args){
  super(...args);
  this.flowTime=0;this.reading=false;this.calm=0;this.tilt=0;this.targetTilt=0;
  let drag=null;const contacts=new Set();const canvas=this.renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{contacts.add(e.pointerId);drag=contacts.size===1?{id:e.pointerId,y:e.clientY}:null;});
  canvas.addEventListener('pointermove',e=>{if(drag&&contacts.size===1&&drag.id===e.pointerId){this.targetTilt+=(e.clientY-drag.y)*.005;drag.y=e.clientY;}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{contacts.delete(e.pointerId);drag=null;});
  this.baseCloud=this.cloud.slice();
  this.trailHeads=innerWidth<650?28:48;this.trailSteps=9;
  this.trailPositions=new Float32Array(this.trailHeads*this.trailSteps*3);
  this.trailColors=new Float32Array(this.trailPositions.length);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(this.trailPositions,3));
  geometry.setAttribute('color',new T.BufferAttribute(this.trailColors,3));
  this.trails=new T.Points(geometry,new T.PointsMaterial({size:.035,transparent:true,opacity:.8,vertexColors:true,depthWrite:false,blending:T.AdditiveBlending}));
  this.trails.frustumCulled=false;this.points.add(this.trails);
  this.material.uniforms.flowLight={value:1};
  this.material.fragmentShader='uniform float flowLight;'+this.material.fragmentShader.replace('vec4(vColor*1.25+vec3(core*.6),a)','vec4(vColor*1.25+vec3(core*.6),a*flowLight)');
  this.material.needsUpdate=true;
  this.refreshTrails();
 }
 setCards(items){
  super.setCards(items);
  for(const card of this.cards){
   const hold=()=>{card.heldTransform=card.element.style.transform;};
   const release=()=>{if(!card.element.matches(':hover,:focus-visible'))card.heldTransform=null;};
   card.element.addEventListener('pointerenter',hold);card.element.addEventListener('focus',hold);
   card.element.addEventListener('pointerleave',release);card.element.addEventListener('blur',release);
  }
 }
 setPalette(name){super.setPalette(name);if(this.trails)this.refreshTrails();}
 refreshTrails(){
  for(let i=0;i<this.trailHeads;i++)for(let j=0;j<this.trailSteps;j++){
   const k=(i*this.trailSteps+j)*3,source=(i*37%this.count)*3,fade=(1-j/this.trailSteps)**1.7;
   for(let axis=0;axis<3;axis++)this.trailColors[k+axis]=this.colors[source+axis]*fade;
  }
  this.trails.geometry.attributes.color.needsUpdate=true;
 }
 resetFlow(){
  this.flowTime=0;this.calm=0;this.reading=false;this.spread=this.targetSpread=0;
  for(const card of this.cards)card.heldTransform=null;
  for(let i=0;i<this.count;i++)sampleFlow(this.targets,i*3,this.shape,this.seeds[i],i,0);
  this.positions.set(this.targets);
 }
 update(dt){
  if(!this.active)return;
  this.calm+=((this.reading?1:0)-this.calm)*(1-Math.exp(-dt*4));
  if(!this.reduced)this.flowTime+=dt*(1-this.calm*.85);
  const time=this.reduced?0:this.flowTime;
  const twist=this.reduced?0:Math.sin(this.spread*Math.PI)*.7;
  const angle=time*.065+twist,cos=Math.cos(angle),sin=Math.sin(angle);
  for(let i=0;i<this.count;i++){
   const k=i*3;sampleFlow(this.targets,k,this.shape,this.seeds[i],i,time);
   const x=this.baseCloud[k],z=this.baseCloud[k+2];
   this.cloud[k]=x*cos-z*sin;this.cloud[k+1]=this.baseCloud[k+1];this.cloud[k+2]=x*sin+z*cos;
  }
  this.trails.visible=!this.reduced;
  for(let i=0;i<this.trailHeads;i++)for(let j=0;j<this.trailSteps;j++){
   const k=(i*this.trailSteps+j)*3,index=i*137%this.count;
   sampleFlow(this.trailPositions,k,this.shape,this.seeds[index],index,time-j*.055,true);
   for(let axis=0;axis<3;axis++)this.trailPositions[k+axis]=this.trailPositions[k+axis]*(1-this.spread)+this.cloud[index*3+axis]*this.spread;
  }
  this.trails.geometry.attributes.position.needsUpdate=true;
  this.trails.material.opacity=(.8-this.calm*.6)*(1-this.spread*.8);
  this.material.uniforms.flowLight.value=1-this.calm*.55;
  this.tilt+=(this.targetTilt-this.tilt)*(1-Math.exp(-dt*5));this.points.rotation.x=this.tilt;
  super.update(dt,time);
  for(const card of this.cards)if(card.heldTransform)card.element.style.transform=card.heldTransform;
 }
}
