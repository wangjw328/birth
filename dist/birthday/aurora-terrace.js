import {AuroraEnvironment as AuroraCurtains} from './aurora-environment.js?v=24';

const PALETTES={
 emerald:{name:'翡翠极光',a:'#66e6c1',b:'#86a8ff',accent:'#f1c879'},
 glacier:{name:'冰川极光',a:'#79dcea',b:'#a9b8ff',accent:'#e5efff'},
 violet:{name:'紫夜极光',a:'#bc8cff',b:'#63dbc4',accent:'#f3d39a'}
};

// Scene compositor keeps the moving aurora behind the mountain ridge.

export class AuroraTerraceExperience{
 constructor({getReduced,beforeOpen,onReturn}){
  Object.assign(this,{getReduced,beforeOpen,onReturn});this.active=false;this.busy=false;this.ticket=0;this.palette='emerald';
  this.root=document.createElement('section');this.root.id='aurora-terrace';this.root.hidden=true;this.root.dataset.state='entry';
  this.root.innerHTML=`<div class="aurora-entry"><img src="./assets/aurora-terrace-entry-v1.png" alt="玻璃门外的雪原极光露台"><div class="aurora-entry-copy"><span>极光木屋 · 隐藏观景</span><h2>推开窗，<br>极光正在等你。</h2><p>在雪山与星光之间，静静看一场极光。</p></div><button class="aurora-enter">走上极光露台 ↗</button></div><div class="aurora-stage" hidden><img src="./assets/aurora-terrace-entry-v1.png" alt="雪山、湖面与极光下的露台"><div class="aurora-webgl"></div></div><header class="aurora-top"><span>极光露台</span><nav><button class="aurora-return">返回木屋</button></nav></header><div class="aurora-palette" role="group" aria-label="极光颜色"></div><p class="aurora-guide" role="status"></p>`;
  document.body.append(this.root);this.$=s=>this.root.querySelector(s);this.entry=this.$('.aurora-entry');this.stage=this.$('.aurora-stage');
  for(const [key,p] of Object.entries(PALETTES)){const b=document.createElement('button');b.dataset.auroraColor=key;b.title=p.name;b.setAttribute('aria-label',p.name);b.setAttribute('aria-pressed',String(key===this.palette));b.style.setProperty('--swatch',p.a);b.onclick=()=>this.setPalette(key);this.$('.aurora-palette').append(b);}
  this.$('.aurora-enter').onclick=()=>this.enter();this.$('.aurora-return').onclick=()=>this.close();
  this.stage.addEventListener('pointermove',e=>{const r=this.stage.getBoundingClientRect();this.curtains?.setPointer((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);});
  this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
 }
 async open(){
  if(this.active)return;this.active=true;this.busy=true;const ticket=++this.ticket;this.returnFocus=document.activeElement;this.root.hidden=false;this.entry.hidden=false;this.stage.hidden=true;this.root.dataset.state='entry';this.$('.aurora-guide').textContent='';
  if(!this.curtains)this.curtains=new AuroraCurtains(this.$('.aurora-webgl'),this.getReduced());this.curtains.reduced=this.getReduced();this.curtains.setPalette(this.palette);this.curtains.active=true;this.stage.hidden=false;this.resize();
  document.body.classList.add('aurora-active');this.background=[...document.body.children].filter(el=>el!==this.root&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);this.background.forEach(([el])=>el.inert=true);this.$('.aurora-return').focus();
  try{await Promise.all([this.entry.querySelector('img').decode(),Promise.resolve(this.beforeOpen?.())]);if(ticket!==this.ticket)return;this.background.forEach(([el])=>el.inert=true);await this.entry.animate([{opacity:0,transform:'translateX(-7%) scale(1.04)',filter:'blur(7px)'},{opacity:1,transform:'none',filter:'none'}],{duration:this.getReduced()?120:1150,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;if(ticket===this.ticket){this.busy=false;this.$('.aurora-enter').focus();}}
  catch{if(ticket===this.ticket){this.busy=false;this.$('.aurora-guide').textContent='极光露台暂时无法打开，请返回木屋后重试。';}}
 }
 async enter(){
  if(this.busy||!this.active)return;this.busy=true;const ticket=this.ticket;this.$('.aurora-enter').disabled=true;
  if(!this.curtains)this.curtains=new AuroraCurtains(this.$('.aurora-webgl'),this.getReduced());this.curtains.reduced=this.getReduced();this.curtains.setPalette(this.palette);this.curtains.active=true;this.stage.hidden=false;this.resize();this.$('.aurora-guide').textContent='';
  try{await this.entry.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(1.34)',filter:'blur(8px)'}],{duration:this.getReduced()?120:1250,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;if(ticket!==this.ticket)return;this.entry.hidden=true;this.root.dataset.state='terrace';this.busy=false;}
  finally{this.$('.aurora-enter').disabled=false;}
 }
 setPalette(name){if(!PALETTES[name])return;this.palette=name;this.root.style.setProperty('--aurora-accent',PALETTES[name].accent);this.curtains?.setPalette(name);this.$('.aurora-palette').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.auroraColor===name)));}
 resize(){this.curtains?.resize();}
 update(dt){if(!this.active)return;this.curtains?.update(dt);}
 async close(){if(!this.active)return;++this.ticket;this.active=false;this.busy=false;if(this.curtains)this.curtains.active=false;const a=this.root.animate([{opacity:1},{opacity:0}],{duration:this.getReduced()?100:380});try{await a.finished;}catch{}a.cancel();this.root.hidden=true;this.stage.hidden=true;this.entry.hidden=false;this.background?.forEach(([el,inert])=>el.inert=inert);document.body.classList.remove('aurora-active');if(this.onReturn)await this.onReturn();else this.returnFocus?.focus({preventScroll:true});}
 dispose(){window.removeEventListener('resize',this.onResize);++this.ticket;this.curtains?.dispose();this.root.remove();}
}
