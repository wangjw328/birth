import {MoonlitPierEnvironment} from './moonlit-pier-environment.js?v=31';
import {OceanAmbience} from './ocean-ambience.js?v=28';

export class MoonlitPierExperience{
 constructor({getReduced,beforeOpen,onReturn}){
  Object.assign(this,{getReduced,beforeOpen,onReturn});this.active=false;this.busy=false;this.ticket=0;this.ambience=new OceanAmbience();this.aim=0;this.sensorEnabled=false;this.sensorBase=null;
  this.root=document.createElement('section');this.root.id='moonlit-pier';this.root.hidden=true;this.root.dataset.state='entry';this.root.dataset.phase='seek';
  this.root.innerHTML=`<div class="pier-view"><div class="pier-render"></div><span class="pier-meteor pier-meteor-one" aria-hidden="true"></span><span class="pier-meteor pier-meteor-two" aria-hidden="true"></span></div><div class="pier-entry"><div class="pier-entry-copy"><span>落日海滨屋 · 隐藏观景</span><h2>沿着月光，<br>走到海边。</h2><p>让海浪和微光，慢慢陪你度过这一晚。</p></div><button class="pier-enter">走上月光栈桥 ↗</button></div><div class="pier-play"><div class="pier-playfield" tabindex="0" aria-label="横向拖动海面，对准月光"></div><button class="pier-bottle" type="button" aria-label="点亮栈桥上的玻璃瓶"><span aria-hidden="true">✧</span></button><span class="pier-aim-marker" aria-hidden="true"></span><p class="pier-hint" role="status">轻点发光的玻璃瓶</p><div class="pier-actions"><button class="pier-gyro" type="button" aria-pressed="false">轻转手机</button><button class="pier-release" type="button" disabled>放流月光 ↗</button><button class="pier-replay" type="button">再放一次</button></div></div><header class="pier-top"><span>海上月光栈桥</span><nav><button class="pier-sound" type="button" aria-pressed="false" aria-label="开启海浪声">海浪声 · 入场后开启</button><button class="pier-return">返回海滨屋</button></nav></header>`;
  document.body.append(this.root);this.$=selector=>this.root.querySelector(selector);
  this.$('.pier-enter').onclick=()=>this.enter();this.$('.pier-return').onclick=()=>this.close();this.$('.pier-sound').onclick=()=>this.toggleSound();
  this.$('.pier-bottle').onclick=()=>this.pickBottle();this.$('.pier-release').onclick=()=>this.release();this.$('.pier-replay').onclick=()=>this.replay();this.$('.pier-gyro').onclick=()=>this.toggleSensor();
  this.$('.pier-playfield').addEventListener('pointerdown',e=>this.dragStart(e));this.$('.pier-playfield').addEventListener('pointermove',e=>this.dragMove(e));this.$('.pier-playfield').addEventListener('pointerup',e=>this.dragEnd(e));this.$('.pier-playfield').addEventListener('pointercancel',e=>this.dragEnd(e));
  this.$('.pier-playfield').addEventListener('keydown',e=>{if(this.root.dataset.phase!=='aiming')return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.setAim(this.aim+(e.key==='ArrowRight'?.08:-.08));}});
  this.onOrientation=e=>this.readOrientation(e);this.onResize=()=>{this.environment?.resize();this.positionBottle();this.sensorBase=null;};window.addEventListener('resize',this.onResize);
  this.onVisibility=()=>document.hidden?this.ambience.suspend():this.ambience.resume();document.addEventListener('visibilitychange',this.onVisibility);
 }
 async open(){
  if(this.active)return;this.active=true;this.busy=true;const ticket=++this.ticket;
  this.returnFocus=document.activeElement;this.root.hidden=false;this.root.dataset.state='entry';this.root.dataset.phase='seek';this.root.dataset.reduced=String(this.getReduced());this.$('.pier-entry').hidden=false;this.$('.pier-enter').disabled=true;this.updateSoundButton();
  try{
   if(!this.environment)this.environment=new MoonlitPierEnvironment(this.$('.pier-render'),this.getReduced());
   this.environment.reduced=this.getReduced();this.environment.active=true;this.environment.resetGame();this.environment.onFlowComplete=()=>this.completeFlow();this.environment.resize();this.positionBottle();
   this.background=[...document.body.children].filter(el=>el!==this.root&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);
   this.background.forEach(([el])=>el.inert=true);document.body.classList.add('pier-active');this.$('.pier-return').focus();
   await Promise.resolve(this.beforeOpen?.());if(ticket!==this.ticket)return;
   this.background.forEach(([el])=>el.inert=true);
   await this.$('.pier-entry').animate([{opacity:0,transform:'translateX(-4%)'},{opacity:1,transform:'none'}],{duration:this.getReduced()?100:750,easing:'ease-out'}).finished;
   if(ticket===this.ticket){this.busy=false;this.$('.pier-enter').disabled=false;this.$('.pier-enter').focus();}
  }catch(error){console.error('Moonlit pier failed to open',error);this.busy=false;this.$('.pier-enter').disabled=false;this.$('.pier-entry-copy p').textContent='海景暂时无法打开，请返回海滨屋重试。';}
 }
 async enter(){
  if(this.busy||!this.active)return;this.busy=true;const ticket=this.ticket;const entry=this.$('.pier-entry');this.$('.pier-enter').disabled=true;
  this.ambience.start().then(()=>this.updateSoundButton());
  try{await entry.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(18px) scale(1.04)'}],{duration:this.getReduced()?100:1000,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;if(ticket!==this.ticket)return;entry.hidden=true;this.root.dataset.state='view';this.$('.pier-bottle').focus();}
  finally{this.busy=false;this.$('.pier-enter').disabled=false;}
 }
 async toggleSound(){
  await this.ambience.setEnabled(!this.ambience.enabled);this.updateSoundButton();
 }
 updateSoundButton(){const button=this.$('.pier-sound');const on=this.ambience.enabled&&this.ambience.playing;button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'关闭海浪声':'开启海浪声');button.textContent=on?'海浪声 · 开':!this.ambience.enabled?'海浪声 · 关':this.root.dataset.state==='view'?'海浪声 · 点击开启':'海浪声 · 入场后开启';}
 positionBottle(){const scale=Math.max(innerWidth/1672,innerHeight/941),x=1030*scale+(innerWidth-1672*scale)/2,y=630*scale+(innerHeight-941*scale)/2;const shownX=innerWidth*.65+(x-innerWidth*.65)*1.045,shownY=innerHeight*.4+(y-innerHeight*.4)*1.045;this.$('.pier-bottle').style.left=`${shownX}px`;this.$('.pier-bottle').style.top=`${shownY}px`;}
 pickBottle(){if(this.root.dataset.state!=='view'||this.root.dataset.phase!=='seek')return;this.root.dataset.phase='aiming';this.setAim(0);this.environment?.setHolding(true);this.$('.pier-hint').textContent='横向拖动海面，让微光朝月亮流去';this.$('.pier-playfield').focus({preventScroll:true});}
 setAim(value){this.aim=Math.max(-1,Math.min(1,value));this.environment?.setAim(this.aim);this.$('.pier-aim-marker').style.left=`${73+this.aim*4}%`;const aligned=Math.abs(this.aim-.34)<.16;this.root.dataset.aligned=String(aligned);this.$('.pier-release').disabled=!aligned;if(this.root.dataset.phase==='aiming')this.$('.pier-hint').textContent=aligned?'月光已经对准海面，轻点放流':'横向拖动海面，或轻转手机对准月亮';}
 dragStart(e){if(this.root.dataset.phase!=='aiming')return;e.preventDefault();if(this.sensorEnabled)this.disableSensor();this.drag={id:e.pointerId,x:e.clientX,aim:this.aim};e.currentTarget.setPointerCapture?.(e.pointerId);}
 dragMove(e){if(!this.drag||this.drag.id!==e.pointerId||this.root.dataset.phase!=='aiming')return;e.preventDefault();this.setAim(this.drag.aim+(e.clientX-this.drag.x)/(innerWidth*.38));}
 dragEnd(e){if(this.drag?.id===e.pointerId)this.drag=null;}
 async toggleSensor(){
  if(this.sensorEnabled){this.disableSensor();return;}
  if(!('DeviceOrientationEvent'in window)){this.$('.pier-hint').textContent='此设备无法使用体感，请拖动海面';return;}
  const ticket=this.ticket;
  try{if(typeof DeviceOrientationEvent.requestPermission==='function'&&(await DeviceOrientationEvent.requestPermission())!=='granted')throw Error('denied');if(!this.active||ticket!==this.ticket||this.root.dataset.phase!=='aiming')return;this.sensorEnabled=true;this.sensorBase=null;window.addEventListener('deviceorientation',this.onOrientation);this.$('.pier-gyro').textContent='体感已开启';this.$('.pier-gyro').setAttribute('aria-pressed','true');this.$('.pier-hint').textContent='轻轻转动手机，让微光靠近月亮';}
  catch{this.$('.pier-hint').textContent='未取得体感权限，仍可拖动海面';}
 }
 disableSensor(){this.sensorEnabled=false;this.sensorBase=null;window.removeEventListener('deviceorientation',this.onOrientation);this.$('.pier-gyro').textContent='轻转手机';this.$('.pier-gyro').setAttribute('aria-pressed','false');}
 readOrientation(e){
  if(!this.active||this.root.dataset.phase!=='aiming'||!this.sensorEnabled||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
  const angle=screen.orientation?.angle??window.orientation??0;if(!this.sensorBase||this.sensorBase.angle!==angle){this.sensorBase={beta:e.beta,gamma:e.gamma,angle};return;}
  const delta=(a,b)=>((a-b+540)%360)-180,r=angle*Math.PI/180;
  const beta=delta(e.beta,this.sensorBase.beta),gamma=delta(e.gamma,this.sensorBase.gamma);
  this.setAim((gamma*Math.cos(r)-beta*Math.sin(r))*.035);
 }
 release(){if(this.root.dataset.phase!=='aiming'||this.$('.pier-release').disabled)return;this.disableSensor();this.root.dataset.phase='flowing';this.$('.pier-hint').textContent='看，月光正在越过海面';this.environment?.release();}
 completeFlow(){if(!this.active||this.root.dataset.phase!=='flowing')return;this.root.dataset.phase='complete';this.$('.pier-hint').textContent='月光已经抵达远方';this.$('.pier-replay').focus({preventScroll:true});}
 replay(){if(this.root.dataset.phase!=='complete')return;this.environment?.resetGame();this.root.dataset.phase='seek';this.root.dataset.aligned='false';this.$('.pier-hint').textContent='轻点发光的玻璃瓶';this.$('.pier-bottle').focus({preventScroll:true});}
 update(dt){if(this.active)this.environment?.update(dt);}
 async close(){
  if(!this.active)return;++this.ticket;this.active=false;this.busy=false;this.disableSensor();if(this.environment)this.environment.active=false;this.ambience.stop();this.updateSoundButton();
  const transition=this.root.animate([{opacity:1},{opacity:0}],{duration:this.getReduced()?100:350});try{await transition.finished;}catch{}transition.cancel();
  this.root.hidden=true;this.root.dataset.state='entry';this.$('.pier-entry').hidden=false;this.updateSoundButton();
  this.background?.forEach(([el,inert])=>el.inert=inert);document.body.classList.remove('pier-active');
  if(this.onReturn)await this.onReturn();else this.returnFocus?.focus({preventScroll:true});
 }
 dispose(){this.disableSensor();window.removeEventListener('resize',this.onResize);document.removeEventListener('visibilitychange',this.onVisibility);++this.ticket;this.ambience.dispose();this.environment?.dispose();this.root.remove();}
}
