import {planetMaterial} from './planet-appearance.js?v=17';
import {CosmicPhenomena} from './cosmic-phenomena.js?v=18';
import * as T from './vendor/three.module.js';
import {STARSEA_CONFIG as defaults,STARSEA_PALETTES} from './starsea-config.mjs?v=17';

export class StarseaScene{
 constructor(container,{onFocus,onBusy,onError,reduced=false,config={}}={}){
  Object.assign(this,{container,onFocus,onBusy,onError,reduced});this.config={...defaults,...config};this.active=false;this.time=0;this.selected=-1;this.nodes=[];this.satellites=[];this.orbits=[];this.flight=null;
  this.events=new AbortController();this.scene=new T.Scene();this.scene.fog=new T.FogExp2('#111c28',.0015);this.scene.add(new T.HemisphereLight('#d7e8ff','#69543a',2.2));const sunlight=new T.DirectionalLight('#fff0d4',3);sunlight.position.set(-8,10,12);this.scene.add(sunlight);
  this.camera=new T.PerspectiveCamera(46,1,.05,180);this.baseCamera=new T.Vector3(0,2.8,43);this.aim=new T.Vector3();this.camera.position.copy(this.baseCamera);
  this.pointer=new T.Vector2();this.drift=new T.Vector2();this.ray=new T.Raycaster();this.ray.params.Mesh={};
  this.renderer=new T.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));container.append(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','三维宇宙：点击星球放大；键盘左右键切换星球，Escape恢复总览');
  this.galaxy=new T.Group();this.scene.add(this.galaxy);this.buildBackdrop();this.buildDust();this.phenomena=new CosmicPhenomena(this.scene);
  const signal=this.events.signal;
  this.renderer.domElement.tabIndex=0;
  this.renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.overview();}else if(['ArrowRight','ArrowLeft','Enter'].includes(e.key)){e.preventDefault();if(!this.nodes.length)return;const direction=e.key==='ArrowLeft'?-1:1;this.focus((this.selected+direction+this.nodes.length)%this.nodes.length);}},{signal});
  window.addEventListener('resize',()=>this.resize(),{signal});
  container.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')this.pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);},{signal});
  container.addEventListener('pointerleave',()=>this.pointer.set(0,0),{signal});
  container.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};},{signal});
  container.addEventListener('pointerup',e=>{
   if(!this.down||Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>10||this.flight)return;
   this.down=null;this.ray.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),this.camera);
   const hit=this.ray.intersectObjects([...this.nodes,...this.satellites],false)[0];if(hit){this.focus(hit.object.userData.index,false,hit.object);return;}
   // Small stars retain a 22 px touch target without inflating their visible geometry.
   let nearest=null,distance=22;for(const node of this.nodes){const p=node.position.clone().project(this.camera);if(p.z>1||p.z< -1)continue;const d=Math.hypot((p.x+1)*innerWidth/2-e.clientX,(1-p.y)*innerHeight/2-e.clientY);if(d<distance){distance=d;nearest=node;}}if(nearest)this.focus(nearest.userData.index);
  },{signal});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.active=false;this.onError?.('星海画面暂时中断，请返回飞船后重试。');},{signal});
  this.setPalette('silver');this.resize();
 }
 buildBackdrop(){
  this.backTexture=new T.TextureLoader().load('./assets/observatory-milkyway-v1.png');this.backTexture.colorSpace=T.SRGBColorSpace;
  this.backMaterial=new T.MeshBasicMaterial({map:this.backTexture,depthTest:false,depthWrite:false,fog:false,toneMapped:false});
  this.backdrop=new T.Mesh(new T.PlaneGeometry(2,2),this.backMaterial);this.backdrop.position.set(0,0,-100);this.backdrop.frustumCulled=false;this.backdrop.renderOrder=-100;this.camera.add(this.backdrop);this.scene.add(this.camera);
 }
 buildDust(){
  const count=Math.min(innerWidth,innerHeight)<650?this.config.mobileParticles:this.config.desktopParticles;this.dustCount=count;
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
  let seed=7123;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){
   const ambient=i>count*.56;const r=Math.pow(random(),1.25),a=random()*Math.PI*2;
   if(ambient){
    if(i%3===0){positions[i*3]=(random()*2-1)*34;positions[i*3+1]=(random()*2-1)*22;positions[i*3+2]=4+random()*30;}
    else{const az=random()*Math.PI*2,vertical=random()*2-1,rad=40+random()*70;const side=Math.sqrt(1-vertical*vertical);positions[i*3]=Math.cos(az)*side*rad;positions[i*3+1]=vertical*rad;positions[i*3+2]=Math.sin(az)*side*rad;}
   }else{
    const x=Math.cos(a)*r*this.config.width/2;
    positions[i*3]=x;positions[i*3+1]=x*.32+(random()+random()+random()-1.5)*(i%3===0?.38:1.2+r*2.8);positions[i*3+2]=Math.sin(a)*r*this.config.depth/2;
   }
   sizes[i]=ambient?1.1+random()*3.:.7+random()*1.2;
  }
  this.dustGeometry=new T.BufferGeometry();this.dustGeometry.setAttribute('position',new T.BufferAttribute(positions,3));this.dustGeometry.setAttribute('color',new T.BufferAttribute(colors,3));this.dustGeometry.setAttribute('size',new T.BufferAttribute(sizes,1));
  this.dustMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:T.AdditiveBlending,uniforms:{time:{value:0},ratio:{value:Math.min(devicePixelRatio,1.5)}},vertexShader:`attribute float size;uniform float time;uniform float ratio;varying vec3 tint;varying float opacity;void main(){tint=color;vec3 p=position;float a=time*.008/(1.+length(p.xz)*.04);p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;p.y+=sin(p.x*.3+time*.25+p.z)*.025;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*ratio*52./max(1.,-mv.z),.75,4.5);opacity=smoothstep(.3,2.,-mv.z);}`,fragmentShader:`varying vec3 tint;varying float opacity;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(tint,pow(1.-d*2.,1.4)*opacity);}`});
  this.dust=new T.Points(this.dustGeometry,this.dustMaterial);this.galaxy.add(this.dust);
 }
 clearNodes(){for(const object of [...this.nodes,...this.satellites,...this.orbits]){this.scene.remove(object);object.traverse(part=>{part.geometry?.dispose();part.material?.dispose();});}this.nodes=[];this.satellites=[];this.orbits=[];}
 setPlanets(){
  const items=Array.from({length:8},(_,index)=>({index}));
  this.clearNodes();this.items=items;
  const locations=[[-7,1.1,3],[4,1.8,-3],[10,-1.1,9],[-12,-2.1,13],[.5,3.5,-8]];
  items.forEach((item,i)=>{
   const p=locations[i]||[Math.sin(i*2.4)*14,Math.cos(i*1.7)*3,Math.cos(i*2.4)*14];
   const node=new T.Mesh(new T.SphereGeometry(this.config.nodeRadius*(.8+(i%3)*.12),48,32),planetMaterial(i));node.position.set(...p);node.userData.index=i;if(i%3===1)this.addPlanetRing(node);this.nodes.push(node);this.scene.add(node);
   const points=[];for(let j=0;j<161;j++){const a=j/160*Math.PI*2;points.push(new T.Vector3(Math.cos(a)*7.5,Math.sin(a)*.14,Math.sin(a)*6));}
   const orbit=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#c2cedb',transparent:true,opacity:.05}));orbit.position.copy(node.position);orbit.rotation.z=(i-2)*.08;this.orbits.push(orbit);this.scene.add(orbit);
  });
  // All visible planets are independent observation targets; no memory content is attached.
  for(let i=0;i<26;i++){
   const a=i*2.39996,r=5+(i%7)*2.7;
   const node=new T.Mesh(new T.SphereGeometry(.07+(i%5)*.045,32,24),planetMaterial(i+8));
   node.position.set(Math.cos(a)*r,Math.sin(i*1.87)*(i%3===0?8:2.1),Math.sin(a)*r+((i%4===0)?15:0));node.userData.index=items.length?i%items.length:-1;if(i%11===3)this.addPlanetRing(node);this.satellites.push(node);this.scene.add(node);
  }
  this.setPalette(this.palette||'silver');this.overview(true);
 }
 addPlanetRing(node){
  const radius=node.geometry.parameters.radius;
  const material=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{tint:{value:new T.Color('#d4bd91')},inner:{value:radius*1.45},outer:{value:radius*2.3}},vertexShader:`varying vec3 local;void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform vec3 tint;uniform float inner;uniform float outer;varying vec3 local;void main(){float r=(length(local.xy)-inner)/(outer-inner);float stripes=.52+.25*sin(r*180.)+.12*sin(r*413.);float gap=1.-.82*exp(-pow((r-.65)*38.,2.));float edge=smoothstep(0.,.04,r)*(1.-smoothstep(.94,1.,r));gl_FragColor=vec4(tint,clamp(stripes*gap*edge,0.,.72));
#include <colorspace_fragment>
}`});
  const ring=new T.Mesh(new T.RingGeometry(radius*1.45,radius*2.3,96),material);ring.rotation.set(1.13,.15,-.38);ring.userData.planetRing=true;node.add(ring);
 }
 setPalette(name){
  const palette=STARSEA_PALETTES[name];if(!palette)return;this.palette=name;
  this.phenomena.setPalette(palette.accent);this.scene.fog.color.set(palette.background);
  const base=new T.Color(palette.dust),accent=new T.Color(palette.accent),colors=this.dustGeometry.attributes.color;
  for(let i=0;i<this.dustCount;i++){const c=i%6===0?accent:base,brightness=.55+(i%19)/22;colors.setXYZ(i,c.r*brightness,c.g*brightness,c.b*brightness);}colors.needsUpdate=true;
  [...this.nodes,...this.satellites].forEach(node=>{node.material.uniforms.accent.value.set(palette.accent);for(const child of node.children)if(child.userData.planetRing)child.material.uniforms.tint.value.set(palette.accent);});this.orbits.forEach(orbit=>orbit.material.color.set(palette.accent));
 }
 resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);const height=2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*100;this.backdrop.scale.set(height*this.camera.aspect*1.08,height*1.08,1);if(!this.flight){if(this.selected<0)this.overview(true);else this.focus(this.selected,true,this.focusAnchor);}}
 destination(index){
  if(index<0)return {camera:new T.Vector3(0,2.8,innerWidth<innerHeight?58:43),aim:new T.Vector3(0,0,0)};
  const node=this.focusAnchor||this.nodes[index],p=node.position.clone(),distance=this.config.focusDistance*(node.geometry.parameters.radius/this.config.nodeRadius);
  return {camera:p.clone().add(new T.Vector3(.04,.10,distance)),aim:p.clone()};
 }
 focus(index,instant=false,anchor=null){if(!Number.isInteger(index)||index<0||index>=this.nodes.length||(!instant&&this.flight))return;this.focusAnchor=anchor;this.selected=index;this.fly(index,instant);}
 overview(instant=false){if(this.flight&&!instant)return;this.focusAnchor=null;this.selected=-1;this.fly(-1,instant);}
 fly(index,instant){
  const end=this.destination(index);this.onBusy?.(true);
  this.orbits.forEach((orbit,i)=>{orbit.material.opacity=i===index?.22:.025;orbit.position.copy(i===index&&this.focusAnchor?this.focusAnchor.position:this.nodes[i].position);});
  if(instant){this.flight=null;this.baseCamera.copy(end.camera);this.aim.copy(end.aim);this.camera.position.copy(this.baseCamera);this.camera.lookAt(this.aim);this.onBusy?.(false);this.onFocus?.(index);return;}
  this.flight={elapsed:0,duration:this.reduced?.18:this.config.flightSeconds,startCamera:this.baseCamera.clone(),startAim:this.aim.clone(),...end,index};
 }
 update(dt){
  if(!this.active)return;
  if(!this.reduced){for(const node of [...this.nodes,...this.satellites])node.rotation.y+=dt*.035;this.time+=dt;this.dustMaterial.uniforms.time.value=this.time;this.galaxy.rotation.y=Math.sin(this.time*this.config.speed)*.05;}
  if(this.flight){const f=this.flight;f.elapsed+=dt;const t=Math.min(1,f.elapsed/f.duration),e=t*t*t*(t*(t*6.-15.)+10.);this.baseCamera.lerpVectors(f.startCamera,f.camera,e);this.aim.lerpVectors(f.startAim,f.aim,e);if(t===1){this.flight=null;this.onBusy?.(false);this.onFocus?.(f.index);}}
  if(this.reduced)this.drift.set(0,0);else this.drift.lerp(this.pointer,1-Math.exp(-dt*2.8));
  const amount=this.selected<0?5.2:.12;this.camera.position.copy(this.baseCamera);this.camera.position.x+=this.drift.x*amount;this.camera.position.y-=this.drift.y*amount*.65;this.camera.lookAt(this.aim);
  this.phenomena.update(this.time,this.reduced,this.selected>=0);this.backdrop.position.x=this.drift.x*3.4;this.backdrop.position.y=-this.drift.y*2.2;this.renderer.render(this.scene,this.camera);
 }
 dispose(){this.active=false;this.events.abort();this.clearNodes();this.phenomena.dispose();for(const object of [this.dust,this.backdrop]){object.geometry.dispose();object.material.dispose();}this.backTexture?.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}




