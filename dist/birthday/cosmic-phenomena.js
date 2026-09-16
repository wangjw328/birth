import * as T from './vendor/three.module.js';

export class CosmicPhenomena{
 constructor(scene){
  this.group=new T.Group();scene.add(this.group);
  this.wormhole=new T.Mesh(new T.PlaneGeometry(12,12),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},accent:{value:new T.Color('#b5b8c8')}},vertexShader:`varying vec2 pos;void main(){pos=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 pos;uniform float time;uniform vec3 accent;void main(){vec2 p=pos;float r=length(p),a=atan(p.y,p.x);if(r>.96)discard;float spiral=.5+.5*sin(a*3.-r*34.+time*.23);float thin=exp(-pow((r-.44)*52.,2.));float disk=exp(-pow((r-.57)*13.,2.))*(.2+spiral*.65);float halo=exp(-pow((r-.48)*7.,2.))*.12;float core=1.-smoothstep(.35,.405,r);vec3 tint=mix(vec3(.26,.31,.40),accent,.4);vec3 color=mix(tint*(thin*.9+disk*.5+halo),vec3(.003,.005,.009),core);float alpha=max(core*.92,clamp(thin*.85+disk+halo,0.,.9))*(1.-smoothstep(.86,.96,r));gl_FragColor=vec4(color,alpha);
#include <colorspace_fragment>
}` }));this.wormhole.position.set(-19,10,-32);this.wormhole.rotation.set(.28,-.12,.4);this.group.add(this.wormhole);
  this.comet=this.makeTrail(90);this.meteor=this.makeTrail(36);this.group.add(this.comet,this.meteor);
 }
 makeTrail(count){
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));geometry.setAttribute('fade',new T.BufferAttribute(Float32Array.from({length:count},(_,i)=>Math.pow(1-i/(count-1),1.6)),1));
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{accent:{value:new T.Color('#c7d5eb')},opacity:{value:1},size:{value:5}},vertexShader:`attribute float fade;varying float f;uniform float size;void main(){f=fade;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*(.35+fade)*55./max(1.,-p.z),1.,8.);}`,fragmentShader:`varying float f;uniform vec3 accent;uniform float opacity;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(mix(accent,vec3(1.),f*.7),pow(1.-d*2.,1.5)*f*opacity);}`});
  const points=new T.Points(geometry,material);points.frustumCulled=false;return points;
 }
 update(time,reduced,focused){
  this.wormhole.material.uniforms.time.value=reduced?0:time;this.comet.visible=!reduced;this.meteor.visible=!reduced;if(reduced)return;
  const t=(time%48)/48,cp=this.comet.geometry.attributes.position;const x=25-t*54,y=15-t*10;
  for(let i=0;i<cp.count;i++){const d=i/(cp.count-1);cp.setXYZ(i,x+d*8,y+d*2.3+Math.sin(d*4)*.18,-26+d*1.8);}
  cp.needsUpdate=true;this.comet.material.uniforms.opacity.value=Math.min(1,t*12,(1-t)*12)*(focused?.3:.72);
  const cycle=Math.floor(time/11),phase=time%11,active=phase>3&&phase<4.6;this.meteor.visible=active;
  if(active){const p=(phase-3)/1.6,mp=this.meteor.geometry.attributes.position;const startX=-18+Math.sin(cycle*2.4)*12,startY=13+Math.cos(cycle)*3;
   for(let i=0;i<mp.count;i++){const d=i/(mp.count-1);mp.setXYZ(i,startX+p*17-d*4,startY-p*7+d*1.65,-17);}
   mp.needsUpdate=true;this.meteor.material.uniforms.opacity.value=Math.sin(p*Math.PI)*(focused?.2:.85);
  }
 }
 setPalette(accent){for(const object of [this.wormhole,this.comet,this.meteor])object.material.uniforms.accent.value.set(accent);}
 dispose(){this.group.removeFromParent();this.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
}
