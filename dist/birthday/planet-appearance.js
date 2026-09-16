import * as T from './vendor/three.module.js';

// Continuous 3D surface noise avoids texture seams and external asset dependencies.
export function planetMaterial(index){
 return new T.ShaderMaterial({uniforms:{kind:{value:index%3},seed:{value:index*.731},accent:{value:new T.Color('#d3c09c')}},vertexShader:`varying vec3 surface;varying vec3 normalView;varying vec3 viewPosition;void main(){surface=normalize(position);normalView=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);viewPosition=-p.xyz;gl_Position=projectionMatrix*p;}`,fragmentShader:`
 varying vec3 surface;varying vec3 normalView;varying vec3 viewPosition;uniform int kind;uniform float seed;uniform vec3 accent;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+vec3(3.1,7.3,1.7);a*=.5;}return n;}
 void main(){vec3 p=normalize(surface),q=p+seed;float n=fbm(q*5.);vec3 color;
 if(kind==0){
  float wave=p.y*36.+n*7.+sin(p.x*7.+seed)*.65;
  float bands=.5+.5*sin(wave);float fine=.5+.5*sin(wave*3.4+fbm(q*17.)*2.);
  color=mix(vec3(.12,.062,.037),vec3(.68,.48,.27),smoothstep(.1,.9,bands));color=mix(color,vec3(.82,.73,.56),smoothstep(.64,.88,fine)*.6);
  float storm=exp(-pow(length((p.xy-vec2(.27,-.23))*vec2(2.6,5.))*3.,2.));color=mix(color,vec3(.36,.13,.052),storm*.7);
 }else if(kind==1){
  float terrain=fbm(q*7.),detail=fbm(q*35.);color=mix(vec3(.045,.037,.03),vec3(.43,.32,.22),smoothstep(.25,.76,terrain));
  float ridges=pow(1.-abs(detail*2.-1.),5.);color*=.65+ridges*.55;
  for(int i=0;i<9;i++){float k=float(i)+seed;vec3 center=normalize(vec3(sin(k*13.7),cos(k*8.3),sin(k*5.1+.8)));float d=length(p-center),r=.065+fract(k*.371)*.16;float bowl=1.-smoothstep(r*.5,r,d);float rim=exp(-pow((d-r)*70.,2.));color*=1.-bowl*.48;color+=vec3(.13,.105,.076)*rim;}
 }else{
  float ocean=smoothstep(.35,.61,fbm(q*4.));color=mix(vec3(.014,.065,.12),vec3(.13,.31,.38),ocean);
  float ice=smoothstep(.48,.7,fbm(q*13.)+abs(p.y)*.23);color=mix(color,vec3(.63,.75,.75),ice);
  float cloud=smoothstep(.53,.73,fbm(q*9.+vec3(.2,.6,.1)));color=mix(color,vec3(.78,.84,.82),cloud*.65);
 }
 color=mix(color,color*(accent+.65),.12);vec3 normal=normalize(normalView);vec3 light=normalize(vec3(-.55,.7,1.));float diffuse=max(dot(normal,light),0.);float day=smoothstep(-.15,.24,dot(normal,light));
 color*=.09+.88*diffuse;float spec=pow(max(dot(reflect(-light,normal),normalize(viewPosition)),0.),kind==2?48.:18.);color+=vec3(.8,.87,.94)*spec*(kind==2?.11:.025);
 float rim=pow(1.-max(dot(normal,normalize(viewPosition)),0.),3.5);color+=mix(vec3(.10,.18,.25),accent*.3,.15)*rim*day*.32;
 gl_FragColor=vec4(color,1.);
 #include <colorspace_fragment>
 }`});
}
