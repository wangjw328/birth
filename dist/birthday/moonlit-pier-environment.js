import * as T from './vendor/three.module.js';

const SIZE={width:1672,height:941};
const WATER_A=[[0,478],[265,478],[500,455],[678,428],[758,405],[779,415],[642,523],[398,743],[50,941],[0,941]];
const WATER_B=[[878,404],[1000,376],[1672,374],[1672,941],[1455,941],[1230,734],[1050,568],[963,476]];

function waterMask(){
 const canvas=document.createElement('canvas');canvas.width=SIZE.width;canvas.height=SIZE.height;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#fff';for(const poly of [WATER_A,WATER_B]){ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
 const soft=document.createElement('canvas');soft.width=canvas.width;soft.height=canvas.height;
 const effect=soft.getContext('2d');effect.filter='blur(7px)';effect.drawImage(canvas,0,0);
 const texture=new T.CanvasTexture(soft);texture.minFilter=T.LinearFilter;return texture;
}

export class MoonlitPierEnvironment{
 constructor(container,reduced){
  this.reduced=reduced;this.active=false;this.time=0;
  this.renderer=new T.WebGLRenderer({antialias:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));container.append(this.renderer.domElement);
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,2);this.camera.position.z=1;
  this.plate=new T.TextureLoader().load('./assets/moonlit-pier-v1.png');this.water=waterMask();
  this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{plate:{value:this.plate},waterMask:{value:this.water},aspect:{value:1},time:{value:0},reduced:{value:reduced?1:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
   precision highp float;varying vec2 vUv;uniform sampler2D plate,waterMask;uniform float aspect,time,reduced;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float wave(vec2 p,float t){return sin(p.y*430.+p.x*44.+t*1.6)*.5+sin(p.y*860.-p.x*83.-t*2.2)*.28+sin(p.y*196.+p.x*25.+t*.65)*.22;}
   float meteor(vec2 p,float age,vec2 start,vec2 travel){
    if(age<0.||age>3.4)return 0.;
    vec2 head=start+travel*age,segment=p-head;
    vec2 direction=normalize(travel);float along=dot(segment,direction),side=abs(segment.x*direction.y-segment.y*direction.x);
    float tail=exp(-side*side/.0000024)*smoothstep(-.16,-.008,along)*(1.-smoothstep(-.008,.001,along));
    float tip=exp(-dot(segment,segment)/.000008);
    return (tail*.65+tip*1.12)*smoothstep(0.,.25,age)*(1.-smoothstep(2.8,3.4,age));
   }
   void main(){
    vec2 uv=vUv;float sourceAspect=1672./941.;if(aspect>sourceAspect)uv.y=(uv.y-.5)*sourceAspect/aspect+.5;else uv.x=(uv.x-.5)*aspect/sourceAspect+.5;
    vec2 p=vec2(uv.x,1.-uv.y);float water=texture2D(waterMask,uv).r;
    float swell=wave(p,time);
    vec2 warped=uv+vec2(swell*.0016,cos(p.y*290.+time*.8)*.00065)*water;
    vec3 color=texture2D(plate,warped).rgb;
    float fromHorizon=smoothstep(.39,.88,p.y);
    float moonCenter=.824-.024*fromHorizon;
    float corridor=exp(-pow((p.x-moonCenter)/(.025+.12*fromHorizon),2.));
    float broken=pow(max(0.,.5+.5*sin(p.y*720.+sin(p.x*48.+time)*2.-time*1.6)),5.);
    broken*=.46+.54*pow(max(0.,.5+.5*sin(p.y*1280.+p.x*60.+time*2.5)),3.);
    vec3 moonSilver=vec3(.82,.87,.91)*corridor*broken*(.08+.19*fromHorizon)*water;
    float smallRipple=pow(max(0.,.5+.5*swell),5.)*.027*water;
    color+=moonSilver+vec3(.34,.48,.65)*smallRipple;
    vec2 moon=(p-vec2(.894,.163))*vec2(1.,1.78);
    float shimmer=.5+.5*sin(time*.8);
    float halo=exp(-dot(moon,moon)*135.)*(.055+.05*shimmer);
    float nearMoon=exp(-dot(moon,moon)*1100.)*(.018+.03*shimmer);
    float crescentLight=exp(-dot(moon,moon)*580.)*smoothstep(.52,.88,max(color.r,max(color.g,color.b)))*(.03+.045*shimmer);
    color+=vec3(.94,.88,.69)*(halo+nearMoon+crescentLight);
    float first=meteor(p,mod(time,17.)-5.,vec2(.42,.075),vec2(.075,.04));
    float second=meteor(p,mod(time,23.)-12.,vec2(.57,.075),vec2(.065,.03));
    color+=vec3(.78,.87,1.)*(first+second*.75)*(1.-reduced);
    vec2 lamps[10];
    lamps[0]=vec2(.17,.918);lamps[1]=vec2(.31,.750);lamps[2]=vec2(.355,.689);lamps[3]=vec2(.400,.545);lamps[4]=vec2(.430,.505);
    lamps[5]=vec2(.455,.465);lamps[6]=vec2(.555,.515);lamps[7]=vec2(.609,.605);lamps[8]=vec2(.734,.810);lamps[9]=vec2(.547,.498);
    for(int i=0;i<10;i++){
     vec2 d=(p-lamps[i])*vec2(1.,1.78);float glow=exp(-dot(d,d)*1800.);
     float shimmer=.90+.10*sin(time*(1.10+float(i)*.17)+float(i)*2.3);
     color+=vec3(.98,.65,.29)*glow*shimmer*.16;
    }
    gl_FragColor=vec4(color,1.);
   }`});
  this.mesh=new T.Mesh(new T.PlaneGeometry(2,2),this.material);this.scene.add(this.mesh);this.resize();
 }
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.material.uniforms.aspect.value=innerWidth/innerHeight;}
 update(dt){if(!this.active)return;if(!this.reduced)this.time+=dt;this.material.uniforms.time.value=this.time;this.material.uniforms.reduced.value=this.reduced?1:0;this.renderer.render(this.scene,this.camera);}
 dispose(){this.plate.dispose();this.water.dispose();this.mesh.geometry.dispose();this.material.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
