import * as T from './vendor/three.module.js';

// Coordinates follow the source plate (1672 × 941), not the viewport.
const RIDGE=[[383,35],[533,0],[1597,0],[1597,275],[1567,264],[1533,282],[1507,273],[1470,273],[1433,263],[1414,252],[1395,254],[1372,273],[1347,284],[1330,304],[1308,312],[1280,342],[1244,364],[1220,378],[1190,361],[1169,360],[1138,381],[1090,399],[1058,391],[1036,377],[1020,364],[1007,367],[984,380],[960,385],[942,374],[925,379],[913,365],[898,353],[877,359],[855,365],[835,358],[814,341],[797,323],[781,320],[756,329],[735,327],[713,324],[693,305],[665,295],[643,284],[623,272],[603,262],[582,265],[563,278],[546,269],[529,256],[505,251],[488,239],[471,229],[459,212],[447,215],[433,232],[421,229],[401,244],[383,260]];
const LAKE=[[830,484],[1115,478],[1450,478],[1472,545],[1420,562],[1390,605],[1305,619],[1260,609],[1190,620],[1130,611],[1080,633],[998,642],[882,638],[750,638],[710,601],[665,579],[697,550],[825,529],[817,518],[720,505]];
const COLORS={emerald:['#69d6ac','#8d88bd'],glacier:['#81cbd8','#9ba9d7'],violet:['#b898d4','#70beac']};
function mask(points){const c=document.createElement('canvas');c.width=1672;c.height=941;const g=c.getContext('2d');g.fillStyle='black';g.fillRect(0,0,c.width,c.height);g.fillStyle='white';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();const t=new T.CanvasTexture(c);t.minFilter=T.LinearFilter;return t;}

export class AuroraEnvironment{
 constructor(container,reduced){
  this.reduced=reduced;this.active=false;this.time=0;this.target=new T.Vector2();this.pointer=new T.Vector2();
  this.renderer=new T.WebGLRenderer({antialias:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));container.append(this.renderer.domElement);
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,2);this.camera.position.z=1;
  this.plate=new T.TextureLoader().load('./assets/aurora-terrace-entry-v1.png');
  this.sky=mask(RIDGE);this.lake=mask(LAKE);
  const lakeCanvas=this.lake.image,soft=document.createElement('canvas');soft.width=1672;soft.height=941;const softCtx=soft.getContext('2d');softCtx.filter='blur(12px)';softCtx.drawImage(lakeCanvas,0,0);this.lake.dispose();this.lake=new T.CanvasTexture(soft);
  this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{plate:{value:this.plate},skyMask:{value:this.sky},lakeMask:{value:this.lake},aspect:{value:1},time:{value:0},pointer:{value:this.pointer},colorA:{value:new T.Color(COLORS.emerald[0])},colorB:{value:new T.Color(COLORS.emerald[1])}},vertexShader:`varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
   precision highp float;
   varying vec2 uvScreen;uniform sampler2D plate,skyMask,lakeMask;uniform float aspect,time;uniform vec2 pointer;uniform vec3 colorA,colorB;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
   vec3 curtain(vec2 p,float t){
    vec3 light=vec3(0.);float x=p.x+pointer.x*.003;
    for(int j=0;j<3;j++){
     float k=float(j),phase=k*2.2;
     float sweep=sin(x*9.8+t*.065+phase)*.065+sin(x*20.-t*.04+phase)*.023;
     float bottom=.24+k*.045+sweep;
     float height=.16+k*.017;float up=bottom-p.y;
     float vertical=smoothstep(-.015,.021,up)*exp(-max(up,0.)/height)*(1.-smoothstep(height*.5,height*1.6,up));
     float warp=x+sin(x*17.+phase+t*.07)*.017+sin(x*37.-t*.03)*.005;
     float fold=noise(vec2(warp*47.+phase,t*.035+k));
     float fibers=.28+.72*noise(vec2(warp*690.+phase,t*.055+k*13.));
     float density=(.12+.88*pow(fold,1.6))*fibers;
     float envelope=smoothstep(.23,.39,x)*(1.-smoothstep(.88,.96,x));
     float baseEdge=exp(-pow(up/.017,2.))*.18;
     float gradient=clamp(up/height,0.,1.);
     vec3 green=mix(vec3(.10,.83,.31),colorA,.35);
     vec3 cyan=vec3(.16,.64,.69);
     vec3 violet=mix(vec3(.57,.21,.53),colorB,.32);
     vec3 tint=mix(green,cyan,smoothstep(.1,.5,gradient));
     tint=mix(tint,violet,smoothstep(.4,.95,gradient));
     float gold=(1.-smoothstep(.0,.045,abs(up)))*(.25+.75*noise(vec2(x*13.+k,t*.03)));
     tint=mix(tint,vec3(.76,.80,.26),gold*.65);
     light+=tint*(vertical*density*1.15+baseEdge*density)*envelope*(1.-k*.19);
    }return light;
   }
   void main(){
    vec2 uv=uvScreen;float imageAspect=1672./941.;
    if(aspect>imageAspect)uv.y=(uv.y-.5)*imageAspect/aspect+.5;else uv.x=(uv.x-.5)*aspect/imageAspect+.5;
    vec2 p=vec2(uv.x,1.-uv.y);vec3 base=texture2D(plate,uv).rgb;
    float sky=texture2D(skyMask,uv).r,water=texture2D(lakeMask,uv).r;
    // Neutralise baked green spill while preserving warm practical lights.
    float cool=smoothstep(.005,.09,base.g-base.r)*(1.-sky);float lum=dot(base,vec3(.2126,.7152,.0722));
    base=mix(base,vec3(lum*.66,lum*.79,lum*.92),cool*.88);
    vec3 night=mix(vec3(.008,.017,.035),vec3(.035,.066,.099),clamp(p.y*2.,0.,1.));
    night+=noise(p*vec2(5.,9.))*.006;
    vec2 starUV=(p+pointer*.001)*vec2(1200.,675.);vec2 cell=floor(starUV/4.);float seed=hash(cell);
    vec2 starPos=vec2(hash(cell+3.1),hash(cell+8.7))*.6+.2;
    float star=exp(-dot(fract(starUV/4.)-starPos,fract(starUV/4.)-starPos)*95.)*step(.965,seed);
    night+=mix(vec3(.50,.72,.88),vec3(.95,.87,.72),hash(cell+2.))*star*(.65+.15*sin(time*.5+seed*100.));
    // A short, tapered comet appears once per 19 seconds, at a new location.
    float cycle=floor(time/19.),age=mod(time,19.)-5.;
    if(age>0.&&age<2.8){
     vec2 start=vec2(.35+hash(vec2(cycle,2.))*.35,.025+hash(vec2(cycle,7.))*.055);
     vec2 direction=normalize(vec2(.8,.32));vec2 head=start+direction*age*.075;
     vec2 delta=(p-head)*vec2(1.,941./1672.);
     vec2 dir=normalize(direction*vec2(1.,941./1672.));
     float along=dot(delta,dir),across=abs(delta.x*dir.y-delta.y*dir.x);
     float tail=exp(-across*across/0.0000009)*smoothstep(-.10,0.,along)*(1.-smoothstep(0.,.003,along));
     float nucleus=exp(-dot(delta,delta)/.000002);
     float fade=smoothstep(0.,.3,age)*(1.-smoothstep(1.8,2.8,age));
     night+=vec3(.62,.77,.93)*(tail*.45+nucleus)*fade;
    }
    float warmLight=smoothstep(.02,.12,base.r-base.b);
    base=mix(base,base*.44,water*(1.-warmLight));
    vec3 aurora=curtain(p,time);vec3 result=mix(base,night+aurora,sky);
    // Same curtain function mirrored about lake horizon, attenuated and rippled.
    vec2 reflection=vec2(p.x,p.y);reflection.y=.35-(p.y-.51)*1.7;
    reflection.x+=sin(p.y*740.+time*.55)*.003+sin(p.y*210.-time*.22)*.002;
    vec3 reflected=curtain(reflection,time-.8)*.25;
    float ripple=.58+.42*sin(p.y*950.+time*.8);
    float rail=1.-smoothstep(.001,.003,abs(p.y-.583));
    result+=reflected*water*ripple*(1.-rail);
    gl_FragColor=vec4(result,1.);
   }`});
  this.mesh=new T.Mesh(new T.PlaneGeometry(2,2),this.material);this.scene.add(this.mesh);this.resize();
 }
 setPalette(name){const c=COLORS[name]||COLORS.emerald;this.material.uniforms.colorA.value.set(c[0]);this.material.uniforms.colorB.value.set(c[1]);}
 setPointer(x,y){this.target.set((x-.5)*2,(y-.5)*2);}
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.material.uniforms.aspect.value=innerWidth/innerHeight;}
 update(dt){if(!this.active)return;this.pointer.lerp(this.reduced?new T.Vector2():this.target,1-Math.exp(-dt*2));if(!this.reduced)this.time+=dt;this.material.uniforms.time.value=this.time;this.renderer.render(this.scene,this.camera);}
 dispose(){this.plate.dispose();this.sky.dispose();this.lake.dispose();this.mesh.geometry.dispose();this.material.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
