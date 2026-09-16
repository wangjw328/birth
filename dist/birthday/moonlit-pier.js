import {MoonlitPierEnvironment} from './moonlit-pier-environment.js?v=28';
import {OceanAmbience} from './ocean-ambience.js?v=28';

export class MoonlitPierExperience{
 constructor({getReduced,beforeOpen,onReturn}){
  Object.assign(this,{getReduced,beforeOpen,onReturn});this.active=false;this.busy=false;this.ticket=0;this.ambience=new OceanAmbience();
  this.root=document.createElement('section');this.root.id='moonlit-pier';this.root.hidden=true;this.root.dataset.state='entry';
  this.root.innerHTML=`<div class="pier-view"><div class="pier-render"></div><span class="pier-meteor pier-meteor-one" aria-hidden="true"></span><span class="pier-meteor pier-meteor-two" aria-hidden="true"></span></div><div class="pier-entry"><div class="pier-entry-copy"><span>落日海滨屋 · 隐藏观景</span><h2>沿着月光，<br>走到海边。</h2><p>让海浪和微光，慢慢陪你度过这一晚。</p></div><button class="pier-enter">走上月光栈桥 ↗</button></div><header class="pier-top"><span>海上月光栈桥</span><nav><button class="pier-sound" type="button" aria-pressed="false" aria-label="开启海浪声">海浪声 · 入场后开启</button><button class="pier-return">返回海滨屋</button></nav></header>`;
  document.body.append(this.root);this.$=selector=>this.root.querySelector(selector);
  this.$('.pier-enter').onclick=()=>this.enter();this.$('.pier-return').onclick=()=>this.close();this.$('.pier-sound').onclick=()=>this.toggleSound();
  this.onResize=()=>this.environment?.resize();window.addEventListener('resize',this.onResize);
  this.onVisibility=()=>document.hidden?this.ambience.suspend():this.ambience.resume();document.addEventListener('visibilitychange',this.onVisibility);
 }
 async open(){
  if(this.active)return;this.active=true;this.busy=true;const ticket=++this.ticket;
  this.returnFocus=document.activeElement;this.root.hidden=false;this.root.dataset.state='entry';this.root.dataset.reduced=String(this.getReduced());this.$('.pier-entry').hidden=false;this.updateSoundButton();
  try{
   if(!this.environment)this.environment=new MoonlitPierEnvironment(this.$('.pier-render'),this.getReduced());
   this.environment.reduced=this.getReduced();this.environment.active=true;this.environment.resize();
   this.background=[...document.body.children].filter(el=>el!==this.root&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);
   this.background.forEach(([el])=>el.inert=true);document.body.classList.add('pier-active');this.$('.pier-return').focus();
   await Promise.resolve(this.beforeOpen?.());if(ticket!==this.ticket)return;
   this.background.forEach(([el])=>el.inert=true);
   await this.$('.pier-entry').animate([{opacity:0,transform:'translateX(-4%)'},{opacity:1,transform:'none'}],{duration:this.getReduced()?100:750,easing:'ease-out'}).finished;
   if(ticket===this.ticket){this.busy=false;this.$('.pier-enter').focus();}
  }catch(error){console.error('Moonlit pier failed to open',error);this.busy=false;this.$('.pier-entry-copy p').textContent='海景暂时无法打开，请返回海滨屋重试。';}
 }
 async enter(){
  if(this.busy||!this.active)return;this.busy=true;const ticket=this.ticket;const entry=this.$('.pier-entry');this.$('.pier-enter').disabled=true;
  this.ambience.start().then(()=>this.updateSoundButton());
  try{await entry.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(18px) scale(1.04)'}],{duration:this.getReduced()?100:1000,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;if(ticket!==this.ticket)return;entry.hidden=true;this.root.dataset.state='view';this.$('.pier-return').focus();}
  finally{this.busy=false;this.$('.pier-enter').disabled=false;}
 }
 async toggleSound(){
  await this.ambience.setEnabled(!this.ambience.enabled);this.updateSoundButton();
 }
 updateSoundButton(){const button=this.$('.pier-sound');const on=this.ambience.enabled&&this.ambience.playing;button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'关闭海浪声':'开启海浪声');button.textContent=on?'海浪声 · 开':!this.ambience.enabled?'海浪声 · 关':this.root.dataset.state==='view'?'海浪声 · 点击开启':'海浪声 · 入场后开启';}
 update(dt){if(this.active)this.environment?.update(dt);}
 async close(){
  if(!this.active)return;++this.ticket;this.active=false;this.busy=false;if(this.environment)this.environment.active=false;this.ambience.stop();this.updateSoundButton();
  const transition=this.root.animate([{opacity:1},{opacity:0}],{duration:this.getReduced()?100:350});try{await transition.finished;}catch{}transition.cancel();
  this.root.hidden=true;this.root.dataset.state='entry';this.$('.pier-entry').hidden=false;this.updateSoundButton();
  this.background?.forEach(([el,inert])=>el.inert=inert);document.body.classList.remove('pier-active');
  if(this.onReturn)await this.onReturn();else this.returnFocus?.focus({preventScroll:true});
 }
 dispose(){window.removeEventListener('resize',this.onResize);document.removeEventListener('visibilitychange',this.onVisibility);++this.ticket;this.ambience.dispose();this.environment?.dispose();this.root.remove();}
}
