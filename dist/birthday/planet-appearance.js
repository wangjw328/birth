import * as T from './vendor/three.module.js';

// Object-space coordinates keep the surface fixed while the worlds rotate.
const vertex = `
varying vec3 vSurface;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vSurface = normalize(position);
  vNormal = normalize(normalMatrix * normal);
  vec4 eye = modelViewMatrix * vec4(position, 1.0);
  vView = -eye.xyz;
  gl_Position = projectionMatrix * eye;
}`;

const texture = `
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
  float value=0.0, amplitude=0.5;
  for(int i=0;i<4;i++) { value+=noise(p)*amplitude; p=p*2.07+vec3(4.3,1.7,3.1); amplitude*=0.5; }
  return value;
}
float ridge(float n) { return 1.0-abs(n*2.0-1.0); }
float cloudBand(vec3 p,float speed,float frequency,float warp) {
  float disturbance=fbm(vec3(p.x*2.8+speed,p.y*5.4,p.z*2.8));
  return 0.5+0.5*sin(p.y*frequency+disturbance*warp+sin(atan(p.z,p.x)*3.0)*0.7);
}
`;

// Each kind has a different visual structure, rather than recoloring one noise ball.
export function planetMaterial(index, kind=index%12) {
  return new T.ShaderMaterial({
    uniforms:{
      kind:{value:kind},seed:{value:index*1.371+2.3},time:{value:0},
      accent:{value:new T.Color('#d3c09c')},focusDim:{value:1}
    },
    vertexShader:vertex,
    fragmentShader:`
varying vec3 vSurface;
varying vec3 vNormal;
varying vec3 vView;
uniform int kind;
uniform float seed;
uniform float time;
uniform float focusDim;
uniform vec3 accent;
${texture}
void main() {
  vec3 p=normalize(vSurface), q=p+vec3(seed,seed*.37,seed*.11);
  float macro=fbm(q*4.5), micro=fbm(q*24.0);
  vec3 color=vec3(0.1), atmosphere=vec3(0.0);
  float atmospherePower=0.0, gloss=0.05, surfaceShade=1.0;

  if(kind==0) { // Cobalt storm world: asymmetric indigo currents and one pale vortex.
    float bands=cloudBand(p,time*.014,25.0,10.0);
    float thin=cloudBand(p,time*.010,57.0,4.0);
    color=mix(vec3(.012,.032,.088),vec3(.045,.19,.34),bands);
    color=mix(color,vec3(.23,.47,.62),smoothstep(.72,.90,thin)*.24);
    float vortex=length((p.xy-vec2(.30,-.18))*vec2(2.9,4.5));
    color=mix(color,vec3(.72,.80,.78),exp(-vortex*vortex*17.0)*.74);
    atmosphere=vec3(.16,.47,.80);atmospherePower=.22;gloss=.12;
  } else if(kind==1) { // Warm gas giant, broad painted cloud banks.
    float banks=cloudBand(p,time*.007,20.0,7.5);
    float silk=cloudBand(p,time*.004,48.0,3.0);
    color=mix(vec3(.18,.13,.085),vec3(.53,.41,.28),banks);
    color=mix(color,vec3(.73,.64,.49),smoothstep(.69,.89,silk)*.22);
    atmosphere=vec3(.90,.65,.34);atmospherePower=.12;
  } else if(kind==2) { // Oxidised bedrock and craters.
    float rock=fbm(q*8.0), fracture=pow(ridge(fbm(q*19.0)),7.0);
    color=mix(vec3(.095,.038,.027),vec3(.46,.18,.095),smoothstep(.25,.72,rock));
    color*=.80+micro*.32-fracture*.13;
    for(int i=0;i<13;i++) {
      float k=float(i)+seed;
      vec3 c=normalize(vec3(sin(k*13.7),cos(k*8.3),sin(k*5.1+.8)));
      float d=distance(p,c), r=.042+fract(k*.371)*.105;
      float bowl=1.0-smoothstep(r*.43,r*.93,d);
      float lip=exp(-pow((d-r)*95.0,2.0));
      color*=1.0-bowl*.51;
      color+=vec3(.25,.10,.055)*lip*.42;
    }
    surfaceShade=.82+rock*.28;gloss=.012;
  } else if(kind==3) { // Ice shell with dark tectonic seams and luminous snow.
    float terrain=fbm(q*5.0);
    float crack=pow(ridge(fbm(q*22.0+vec3(p.y*5.0,0.0,0.0))),14.0);
    color=mix(vec3(.08,.22,.30),vec3(.74,.88,.88),smoothstep(.27,.73,terrain));
    color=mix(color,vec3(.025,.20,.37),crack*.87);
    color=mix(color,vec3(.95,.98,.94),smoothstep(.47,.75,terrain+abs(p.y)*.25)*.48);
    atmosphere=vec3(.28,.66,.83);atmospherePower=.16;gloss=.18;
  } else if(kind==4) { // Nearly black ore with sparse metallic seams.
    float stone=fbm(q*7.0);
    float vein=pow(ridge(fbm(q*26.0)),20.0);
    color=mix(vec3(.018,.021,.028),vec3(.095,.10,.11),stone);
    color=mix(color,vec3(.75,.46,.17),vein*smoothstep(.38,.72,stone)*.8);
    gloss=.10;
  } else if(kind==5) { // Ocean planet: coastline, open water and separate white cloud fronts.
    float landField=fbm(q*3.8+fbm(q*10.0)*.36);
    float land=smoothstep(.48,.60,landField);
    color=mix(vec3(.012,.10,.19),vec3(.08,.29,.22),land);
    float shelf=exp(-pow((landField-.535)*35.0,2.0));
    color+=vec3(.03,.27,.31)*shelf*.30;
    float fronts=fbm(vec3(q.x*7.0+time*.009,q.y*9.0,q.z*7.0));
    float cloud=smoothstep(.58,.72,fronts);
    color=mix(color,vec3(.83,.87,.85),cloud*.73);
    atmosphere=vec3(.22,.55,.75);atmospherePower=.22;gloss=mix(.38,.08,max(land,cloud));
  } else if(kind==6) { // Black glass with a few cool fault lines.
    float glass=fbm(q*6.5), fissure=pow(ridge(fbm(q*27.0)),22.0);
    color=mix(vec3(.009,.013,.020),vec3(.055,.072,.083),glass);
    color+=vec3(.035,.28,.36)*fissure*.72;
    atmosphere=vec3(.07,.34,.48);atmospherePower=.08;gloss=.28;
  } else if(kind==7) { // Golden cloud world with broken white upper decks.
    float banks=cloudBand(p,time*.008,17.0,8.0);
    float upper=fbm(vec3(q.x*7.0+time*.005,q.y*8.0,q.z*7.0));
    color=mix(vec3(.20,.14,.085),vec3(.58,.42,.25),banks);
    color=mix(color,vec3(.77,.69,.52),smoothstep(.61,.80,upper)*.30);
    atmosphere=vec3(.91,.66,.32);atmospherePower=.16;
  } else if(kind==8) { // Deep sapphire hot Jupiter; broad blue weather cells.
    float banks=cloudBand(p,time*.013,27.0,11.0);
    float glint=fbm(q*14.0);
    color=mix(vec3(.008,.018,.064),vec3(.030,.12,.33),banks);
    color=mix(color,vec3(.18,.37,.65),smoothstep(.64,.82,glint)*.19);
    atmosphere=vec3(.12,.38,.95);atmospherePower=.32;gloss=.08;
  } else if(kind==9) { // Lava world; glowing rifts beneath a dark crust.
    float crust=fbm(q*7.0), cracks=pow(ridge(fbm(q*21.0)),16.0);
    float pools=smoothstep(.70,.82,crust);
    color=mix(vec3(.018,.012,.014),vec3(.15,.035,.023),crust);
    color=mix(color,vec3(1.0,.19,.025),max(cracks*.82,pools*.66));
    color+=vec3(.85,.28,.035)*pow(cracks,3.0)*.38;
    atmosphere=vec3(.86,.13,.025);atmospherePower=.12;gloss=.02;
  } else if(kind==10) { // Circumbinary giant: grey, chalk and bronze cloud layers.
    float banks=cloudBand(p,time*.005,22.0,5.0);
    float thin=cloudBand(p,time*.004,48.0,2.5);
    color=mix(vec3(.095,.095,.105),vec3(.36,.33,.29),banks);
    color=mix(color,vec3(.59,.56,.51),smoothstep(.70,.91,thin)*.19);
    atmosphere=vec3(.60,.54,.47);atmospherePower=.10;
  } else { // Young methane giant, violet haze and pearly high clouds.
    float banks=cloudBand(p,time*.007,18.0,9.0);
    float high=fbm(vec3(q.x*6.0+time*.007,q.y*10.0,q.z*6.0));
    color=mix(vec3(.035,.038,.087),vec3(.20,.17,.29),banks);
    color=mix(color,vec3(.51,.51,.62),smoothstep(.66,.86,high)*.25);
    atmosphere=vec3(.46,.37,.73);atmospherePower=.21;gloss=.07;
  }

  // A broad terminator makes the worlds read as spheres without a plastic gloss.
  if(kind==0||kind==1||kind==7||kind==8||kind==10||kind==11) {
    float filaments=fbm(vec3(q.x*18.0+time*.004,q.y*25.0,q.z*18.0));
    color*=.84+.31*filaments;
  }
  vec3 n=normalize(vNormal),v=normalize(vView),l=normalize(vec3(-.54,.72,1.0));
  float ndl=dot(n,l), daylight=smoothstep(-.25,.31,ndl);
  float diffuse=max(ndl,0.0);
  vec3 lit=color*surfaceShade*(.055+.93*diffuse);
  float spec=pow(max(dot(reflect(-l,n),v),0.0),mix(18.0,90.0,gloss));
  lit+=vec3(.75,.84,.91)*spec*gloss*.31*daylight;
  float edge=pow(1.0-max(dot(n,v),0.0),5.0);
  lit+=atmosphere*edge*atmospherePower*(.22+.78*daylight);
  if(kind==9) lit+=vec3(.20,.038,.003)*pow(ridge(fbm(q*21.0)),17.0)*(.35+.65*daylight);
  lit*=.78+.22*pow(max(dot(n,v),0.0),.55);
  lit=mix(lit,lit*(accent*.45+vec3(.82)),.055);
  gl_FragColor=vec4(lit*focusDim,1.0);
  #include <colorspace_fragment>
}`
  });
}

export function stellarMaterial(type=0) {
  const colors=type===0?['#fff0b0','#f28f35']:type===1?['#dff5ff','#63a7ff']:['#ff9a6f','#8d1810'];
  return new T.ShaderMaterial({
    uniforms:{time:{value:0},seed:{value:type*3.7+2.1},inner:{value:new T.Color(colors[0])},outer:{value:new T.Color(colors[1])}},
    vertexShader:vertex,
    fragmentShader:`varying vec3 vSurface;varying vec3 vNormal;varying vec3 vView;uniform float time;uniform float seed;uniform vec3 inner;uniform vec3 outer;${texture}
void main(){vec3 p=normalize(vSurface);float gran=fbm(p*18.0+vec3(seed,time*.018,0.0));float cells=.5+.5*sin(gran*17.0+fbm(p*42.0)*8.0);vec3 color=mix(outer,inner,smoothstep(.18,.9,cells));float viewDot=max(dot(normalize(vNormal),normalize(vView)),0.0);color*=.72+pow(viewDot,.45)*.42;gl_FragColor=vec4(color,1.0);
#include <colorspace_fragment>
}`
  });
}

export function stellarGlowMaterial(color) {
  return new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.BackSide,blending:T.AdditiveBlending,
    uniforms:{color:{value:new T.Color(color)}},
    vertexShader:`varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
    fragmentShader:`varying vec3 n;varying vec3 v;uniform vec3 color;void main(){float rim=pow(1.0-max(dot(n,v),0.0),2.4);gl_FragColor=vec4(color,rim*.38);}`
  });
}
