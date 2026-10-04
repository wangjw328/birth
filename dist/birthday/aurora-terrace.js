import {AuroraEnvironment as AuroraCurtains} from './aurora-environment.js?v=28';

const PALETTES={
 emerald:{name:'翡翠极光',a:'#66e6c1',b:'#86a8ff',accent:'#f1c879'},
 glacier:{name:'冰川极光',a:'#79dcea',b:'#a9b8ff',accent:'#e5efff'},
 violet:{name:'紫夜极光',a:'#bc8cff',b:'#63dbc4',accent:'#f3d39a'}
};
const STAR_ANGLES=[-2.22,-.35,1.98];
const angleDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

// Scene compositor keeps the moving aurora behind the mountain ridge.

export class AuroraTerraceExperience{
 constructor({getReduced,beforeOpen,onReturn,onStarLit}){
  Object.assign(this,{getReduced,beforeOpen,onReturn,onStarLit});this.active=false;this.busy=false;this.ticket=0;this.palette='emerald';this.angle=-1.2;this.lit=[false,false,false];this.dragging=false;this.completed=false;
  this.root=document.createElement('section');this.root.id='aurora-terrace';this.root.hidden=true;this.root.dataset.state='entry';
  this.root.innerHTML=`<div class="aurora-entry"><img src="./assets/aurora-terrace-astrolabe-v2.png" alt="玻璃门外的雪原极光露台"><div class="aurora-entry-copy"><span>极光木屋 · 隐藏观景</span><h2>推开窗，<br>极光正在等你。</h2><p>雪山与湖面之间，还有一枚等待转动的星盘。</p></div><button class="aurora-enter">走上极光露台 ↗</button></div><div class="aurora-stage" hidden><img src="./assets/aurora-terrace-astrolabe-v2.png" alt="雪山、湖面、极光与黄铜星盘"><div class="aurora-webgl"></div><button class="aurora-dial" type="button" aria-label="转动极光星盘"><span class="aurora-dial-edge"></span><span class="aurora-dial-stars" aria-hidden="true"></span><span class="aurora-dial-light" aria-hidden="true"></span></button><div class="aurora-sparks" aria-hidden="true"></div></div><header class="aurora-top"><span>极光露台</span><nav><button class="aurora-return">返回木屋</button></nav></header><div class="aurora-palette" role="group" aria-label="极光颜色"></div><p class="aurora-guide" role="status"></p>`;
  document.body.append(this.root);this.$=s=>this.root.querySelector(s);this.entry=this.$('.aurora-entry');this.stage=this.$('.aurora-stage');
  this.dial=this.$('.aurora-dial');this.dialLight=this.$('.aurora-dial-light');this.starNodes=STAR_ANGLES.map((angle,index)=>{const star=document.createElement('span');star.className='aurora-dial-star';star.dataset.star=String(index+1);this.placeMarker(star,angle);this.$('.aurora-dial-stars').append(star);return star;});this.placeMarker(this.dialLight,this.angle);
  for(const [key,p] of Object.entries(PALETTES)){const b=document.createElement('button');b.dataset.auroraColor=key;b.title=p.name;b.setAttribute('aria-label',p.name);b.setAttribute('aria-pressed',String(key===this.palette));b.style.setProperty('--swatch',p.a);b.onclick=()=>this.setPalette(key);this.$('.aurora-palette').append(b);}
  this.$('.aurora-enter').onclick=()=>this.enter();this.$('.aurora-return').onclick=()=>this.close();
  this.stage.addEventListener('pointermove',e=>{const r=this.stage.getBoundingClientRect();this.curtains?.setPointer((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);});
  this.dial.addEventListener('pointerdown',e=>{if(this.root.dataset.state==='entry')return;e.preventDefault();if(this.completed)this.resetDial();this.dragging=true;this.root.dataset.state='align';this.dial.setPointerCapture(e.pointerId);this.turnToPointer(e);});
  this.dial.addEventListener('pointermove',e=>{if(this.dragging)this.turnToPointer(e);});
  const finishDrag=()=>{this.dragging=false;if(!this.completed&&this.root.dataset.state==='align')this.root.dataset.state='terrace';};
  this.dial.addEventListener('pointerup',finishDrag);this.dial.addEventListener('pointercancel',finishDrag);
  this.dial.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Enter',' '].includes(e.key))return;e.preventDefault();if(this.completed)this.resetDial();if(e.key==='ArrowLeft'||e.key==='ArrowRight')this.turn(this.angle+(e.key==='ArrowLeft'?-.13:.13));else{const target=STAR_ANGLES.find((_,i)=>!this.lit[i]);if(target!==undefined)this.turn(target);}});
  this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
 }
 placeMarker(el,angle){el.style.left=`${50+Math.cos(angle)*44}%`;el.style.top=`${50+Math.sin(angle)*42}%`;}
 turnToPointer(e){const r=this.dial.getBoundingClientRect();this.turn(Math.atan2((e.clientY-r.top-r.height/2)/(r.height*.42),(e.clientX-r.left-r.width/2)/(r.width*.44)));}
 turn(angle){this.angle=angle;this.placeMarker(this.dialLight,angle);STAR_ANGLES.forEach((target,i)=>{if(!this.lit[i]&&angleDistance(angle,target)<.19)this.lightStar(i);});}
 lightStar(index){this.lit[index]=true;this.starNodes[index].classList.add('is-lit');const count=this.lit.filter(Boolean).length;this.onStarLit?.(count);this.curtains?.setResonance(count===3?1:count*.07);this.dial.setAttribute('aria-label',count===3?'极光已点亮，轻触星盘重新开始':`转动极光星盘，已点亮 ${count} 颗星`);this.$('.aurora-guide').textContent=count===3?'极光已铺满夜空 · 轻触星盘可重看':`星光已回应 · ${count} / 3`;
  if(!this.getReduced()){const r=this.dial.getBoundingClientRect(),a=STAR_ANGLES[index],x=r.left+r.width*(.5+Math.cos(a)*.44),y=r.top+r.height*(.5+Math.sin(a)*.42);for(let i=0;i<8;i++){const mote=document.createElement('i');mote.className='aurora-rising-mote';mote.style.left=`${x}px`;mote.style.top=`${y}px`;mote.style.setProperty('--drift',`${(i-3.5)*17}px`);this.$('.aurora-sparks').append(mote);mote.addEventListener('animationend',()=>mote.remove(),{once:true});}}
  if(count===3){this.completed=true;this.root.dataset.complete='true';this.root.dataset.state='terrace';}
 }
 resetDial(){this.angle=-1.2;this.lit=[false,false,false];this.completed=false;this.root.dataset.complete='false';if(this.root.dataset.state!=='entry')this.root.dataset.state='terrace';this.starNodes.forEach(star=>star.classList.remove('is-lit'));this.placeMarker(this.dialLight,this.angle);this.curtains?.setResonance(0);this.dial.setAttribute('aria-label','转动极光星盘');this.$('.aurora-guide').textContent='沿铜环转动微光，点亮三颗星';}
 async open(){
  if(this.active)return;this.active=true;this.busy=true;const ticket=++this.ticket;this.returnFocus=document.activeElement;this.root.hidden=false;this.entry.hidden=false;this.stage.hidden=true;this.root.dataset.state='entry';this.$('.aurora-guide').textContent='';
  if(!this.curtains)this.curtains=new AuroraCurtains(this.$('.aurora-webgl'),this.getReduced());this.curtains.reduced=this.getReduced();this.curtains.reset();this.curtains.setPalette(this.palette);this.curtains.active=true;this.stage.hidden=false;this.resize();this.resetDial();this.dial.inert=true;this.$('.aurora-palette').inert=true;this.$('.aurora-guide').textContent='';
  document.body.classList.add('aurora-active');this.background=[...document.body.children].filter(el=>el!==this.root&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);this.background.forEach(([el])=>el.inert=true);this.$('.aurora-return').focus();
  try{await Promise.all([this.entry.querySelector('img').decode(),Promise.resolve(this.beforeOpen?.())]);if(ticket!==this.ticket)return;this.background.forEach(([el])=>el.inert=true);await this.entry.animate([{opacity:0,transform:'translateX(-7%) scale(1.04)',filter:'blur(7px)'},{opacity:1,transform:'none',filter:'none'}],{duration:this.getReduced()?120:1150,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;if(ticket===this.ticket){this.busy=false;this.$('.aurora-enter').focus();}}
  catch{if(ticket===this.ticket){this.busy=false;this.$('.aurora-guide').textContent='极光露台暂时无法打开，请返回木屋后重试。';}}
 }
 async enter(){
  if(this.busy||!this.active)return;this.busy=true;const ticket=this.ticket;this.$('.aurora-enter').disabled=true;
  if(!this.curtains)this.curtains=new AuroraCurtains(this.$('.aurora-webgl'),this.getReduced());this.curtains.reduced=this.getReduced();this.curtains.setPalette(this.palette);this.curtains.active=true;this.stage.hidden=false;this.resize();this.$('.aurora-guide').textContent='';
  try{await this.entry.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(1.34)',filter:'blur(8px)'}],{duration:this.getReduced()?120:1250,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;if(ticket!==this.ticket)return;this.entry.hidden=true;this.root.dataset.state='terrace';this.busy=false;this.dial.inert=false;this.$('.aurora-palette').inert=false;this.$('.aurora-guide').textContent='沿铜环转动微光，点亮三颗星';this.dial.focus({preventScroll:true});}
  finally{this.$('.aurora-enter').disabled=false;}
 }
 setPalette(name){if(!PALETTES[name])return;this.palette=name;this.root.style.setProperty('--aurora-accent',PALETTES[name].accent);this.curtains?.setPalette(name);this.$('.aurora-palette').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.auroraColor===name)));}
 resize(){this.curtains?.resize();const w=innerWidth,h=innerHeight,scale=Math.max(w/1672,h/941),left=(w-1672*scale)/2,top=(h-941*scale)/2;Object.assign(this.dial.style,{left:`${left+930*scale}px`,top:`${top+727*scale}px`,width:`${420*scale}px`,height:`${126*scale}px`});}
 update(dt){if(!this.active)return;this.curtains?.update(dt);}
 async close(){if(!this.active)return;++this.ticket;this.active=false;this.busy=false;if(this.curtains)this.curtains.active=false;const a=this.root.animate([{opacity:1},{opacity:0}],{duration:this.getReduced()?100:380});try{await a.finished;}catch{}a.cancel();this.root.hidden=true;this.stage.hidden=true;this.entry.hidden=false;this.background?.forEach(([el,inert])=>el.inert=inert);document.body.classList.remove('aurora-active');if(this.onReturn)await this.onReturn();else this.returnFocus?.focus({preventScroll:true});}
 dispose(){window.removeEventListener('resize',this.onResize);++this.ticket;this.curtains?.dispose();this.root.remove();}
}
