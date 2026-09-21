import {SCENES} from './scene-presets.mjs';
import * as T from './vendor/three.module.js';
// Layered photographic environment with a continuously interpolated image camera.
// The former geometry-room.js approach remains archived in room.js.
export class BirthdayRoom {
 constructor(container){this.container=container;this.mode='entry';this.reduced=false;this.lit=false;this.mouse={x:0,y:0};this.sceneName='aurora';this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);this.camera.position.set(.15,2.45,-3.75);this.camera.lookAt(0,4.2,-21);
  this.layer=document.createElement('div');this.layer.className='photographic-room';this.layer.dataset.interior='lodge';this.layer.dataset.scene='aurora';container.append(this.layer);this.picture=document.createElement('img');this.picture.className='room-picture';this.picture.alt=SCENES.aurora.title;this.picture.src='./assets/'+SCENES.aurora.asset;this.layer.append(this.picture);
  this.exterior=document.createElement('div');this.exterior.className='room-exterior';this.layer.append(this.exterior);
  this.glow=document.createElement('div');this.glow.className='room-atmosphere';this.layer.append(this.glow);
  this.flame=document.createElement('span');this.flame.className='photographic-flame';this.flame.hidden=true;this.layer.append(this.flame);
  this.seat=document.createElement('div');this.seat.className='seated-candle-scene';this.layer.append(this.seat);
  this.seatPicture=document.createElement('img');this.seatPicture.className='seated-picture';this.seatPicture.src=this.picture.src;this.seatPicture.alt='坐在沙发上，近处是生日蛋糕，前方落地窗外是极光';this.seat.append(this.seatPicture);
  const windowLight=this.seatPicture.cloneNode();this.windowLight=windowLight;windowLight.className='seated-window-light';windowLight.alt='';windowLight.setAttribute('aria-hidden','true');this.seat.append(windowLight);
  const candleGlow=document.createElement('div');candleGlow.className='seated-candle-glow';this.seat.append(candleGlow);
  this.seatFlame=document.createElement('span');this.seatFlame.className='photographic-flame seated-flame';this.seatFlame.hidden=true;this.seat.append(this.seatFlame);
  this.ignitionTicket=0;
  
  this.photos=document.createElement('div');this.photos.className='wall-photos';this.layer.append(this.photos);
  const coarse=matchMedia('(pointer: coarse)').matches;this.renderer=new T.WebGLRenderer({alpha:true,antialias:!coarse,powerPreference:'high-performance'});this.renderer.setClearColor(0,0);this.renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1:1.5));this.renderer.setSize(innerWidth,innerHeight);this.renderer.domElement.className='window-festival-layer';container.append(this.renderer.domElement);
  this.anchors={memory:[.965,.4],cake:[.496,.78],window:[.49,.33]};this.target={x:0,y:0,z:1};this.current={x:0,y:0,z:1};this.generation=0;this.ready=Promise.all([this.picture.decode(),this.seatPicture.decode()]).then(()=>{this.resize();return this;});window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.w=innerWidth;this.h=innerHeight;const fillScreen=this.w<850||matchMedia('(pointer: coarse)').matches;const cover=(fillScreen?Math.max:Math.min)(this.w/1672,this.h/941);this.iw=1672*cover;this.ih=941*cover;Object.assign(this.layer.style,{width:this.iw+'px',height:this.ih+'px'});this.camera.aspect=this.w/this.h;this.camera.updateProjectionMatrix();this.renderer.setSize(this.w,this.h);this.setView(this.mode);if(!this.initialized){this.current={...this.target};this.initialized=true;}}
 setView(mode){if(mode!=='cake')this.cancelIgnition();this.mode=mode;this.seat.classList.toggle('visible',mode==='cake');this.seat.setAttribute('aria-hidden',String(mode!=='cake'));this.photos.style.opacity=mode==='cake'?'0':'1';this.seat.classList.toggle('lights-dim',mode==='cake'&&this.lit);const mobile=innerWidth<650;const views={entry:[.5,.5,1],room:[.5,.5,1],memory:[this.isShip?.055:.97,.40,mobile?1.35:2],cake:[this.isShip?.499:.496,.68,mobile?1.1:1.23],window:[.5,.34,1.7],ending:[.5,.34,1.7]};const [x,y,z]=views[mode]||views.room;
  const aimX=mode==='memory'?(mobile?.5:.68):mode==='cake'?.60:.5,aimY=mode==='cake'?.52:mode==='memory'?.43:.46;
  const zoom=this.reduced?1:z;const bound=(offset,size,screen)=>size<=screen?(screen-size)/2:Math.min(0,Math.max(screen-size,offset));this.target={z:zoom,x:bound(this.w*aimX-this.iw*x*zoom,this.iw*zoom,this.w),y:bound(this.h*aimY-this.ih*y*zoom,this.ih*zoom,this.h)};
 }
 get isShip(){return this.sceneName==='rings';}
 async setScene(name){
  const preset=SCENES[name];if(!preset)return false;const ticket=++this.generation;
  const base='./assets/'+preset.asset;const image=new Image();image.src=base;await image.decode();
  if(ticket!==this.generation)return false;
  this.cancelIgnition();this.sceneName=name;this.layer.dataset.scene=name;this.layer.dataset.interior=preset.interior;
  // Cover the old scene during replacement so architecture crossfades as a whole.
  this.sceneTransition?.cancel();this.sceneGhost?.remove();
  const ghost=this.picture.cloneNode();ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.className='scene-ghost';this.layer.append(ghost);this.sceneGhost=ghost;
  this.picture.src=base;this.seatPicture.src=base;this.windowLight.src=base;
  this.picture.alt=preset.title;this.seatPicture.alt='坐在沙发上，面对'+preset.view+'点亮蜡烛';
  this.exterior.style.opacity='0';
  this.anchors=this.isShip?{memory:[.065,.39],cake:[.50,.72],window:[.55,.3]}:{memory:[.965,.4],cake:[.496,.78],window:[.49,.33]};
  this.setMemories(this.memoryItems||[]);this.setView(this.mode);
  this.sceneTransition=ghost.animate([{opacity:1},{opacity:0}],{duration:this.reduced?120:900,easing:'ease-out',fill:'forwards'});this.sceneTransition.finished.catch(()=>{}).finally(()=>ghost.remove());return true;
 }
 setLit(value){this.lit=value;this.flame.hidden=!value;this.seatFlame.hidden=!value;this.seat.classList.toggle('lights-dim',value&&this.mode==='cake');this.layer.classList.toggle('candle-lit',value);}
 async ignite(){
  if(this.igniting||this.lit||this.mode!=='cake')return false;
  this.igniting=true;const token=++this.ignitionTicket;this.setLit(true);
  this.ignitionAnimation=this.seatFlame.animate([{opacity:0,scale:'.3 .2'},{opacity:.5,scale:'.7 .65',offset:.35},{opacity:1,scale:'1 1'}],{duration:this.reduced?160:1600,easing:'ease-out'});
  try{await this.ignitionAnimation.finished;return token===this.ignitionTicket&&this.mode==='cake';}
  catch{return false;}finally{if(token===this.ignitionTicket)this.igniting=false;}
 }
 cancelIgnition(){this.ignitionTicket++;this.ignitionAnimation?.cancel();this.igniting=false;this.seat.classList.toggle('lights-dim',this.lit&&this.mode==='cake');}

 setMemories(items){this.memoryItems=items;const photos=items.filter(m=>m.type==='photo');this.photos.replaceChildren();if(!photos.some(m=>m.src.startsWith('blob:')))return;
  for(let i=0;i<6;i++){const item=photos[i%photos.length];if(!item)break;const img=document.createElement('img');img.src=item.src;img.alt=item.title;img.style.left=(this.isShip?(i%2?4.5:1.1):(i%2?92.55:87.7))+'%';img.style.top=(this.isShip?([25,34,44][Math.floor(i/2)]+(i%2?3:0)):([22.5,31.0,39.7][Math.floor(i/2)]-(i%2?2.2:0)))+'%';if(!this.isShip){img.style.left=(i%2?98:94.2)+'%';img.style.top=([21,31,41][Math.floor(i/2)])+'%';}this.photos.append(img);}
 }
 project(name){const [x,y]=name==='cake'&&this.mode==='cake'?(this.isShip?[.499,.675]:[.496,.68]):this.anchors[name];const px=x*this.iw*this.current.z+this.current.x,py=y*this.ih*this.current.z+this.current.y;return{x:px,y:py,visible:px>30&&px<this.w-30&&py>110&&py<this.h-100};}
 update(dt,t){const k=1-Math.exp(-dt*(this.reduced?22:1.7));for(const a of ['x','y','z'])this.current[a]+=(this.target[a]-this.current[a])*k;
  const drift=this.reduced?0:Math.sin(t*.2)*1.6;this.layer.style.transform=`translate(${this.current.x+drift}px,${this.current.y}px) scale(${this.current.z})`;
  this.picture.style.filter=this.mode==='ending'?'brightness(.62)':'none';this.glow.style.opacity=this.mode==='ending'?'.1':'.4';
  const points=(this.isShip?[[.075,0],[.955,0],[.995,.34],[.92,.58],[.84,.63],[.29,.63],[.20,.58],[.10,.34]]:[[.07,0],[.87,0],[.87,.745],[.07,.79]]).map(([x,y])=>`${x*this.iw*this.current.z+this.current.x}px ${y*this.ih*this.current.z+this.current.y}px`).join(',');this.renderer.domElement.style.clipPath=`polygon(${points})`;this.renderer.render(this.scene,this.camera);
 }
}
