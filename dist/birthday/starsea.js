import {STARSEA_PALETTES} from './starsea-config.mjs?v=17';

const WORLD_NOTES=[
 {kicker:'气态巨行星',title:'深蓝风暴',text:'层叠云带缓慢流动，巨型风暴在暗面边缘若隐若现。'},
 {kicker:'环状气态巨行星',title:'香槟环世界',text:'冰尘与岩屑组成多层星环，把恒星微光切成细线。'},
 {kicker:'岩质行星',title:'赤岩荒原',text:'陨石坑与断裂峡谷，记录着漫长而安静的撞击史。'},
 {kicker:'冰质行星',title:'蓝裂冰原',text:'深蓝裂隙穿过冻结地表，微光在冰层内部折返。'},
 {kicker:'矿物行星',title:'金脉暗星',text:'石墨色岩层之间，细窄金色矿脉像沉睡的闪电。'},
 {kicker:'海洋行星',title:'潮汐之眼',text:'云旋追随辽阔海面，青色海岸在夜侧轻轻发亮。'},
 {kicker:'黑曜行星',title:'静默星环',text:'近乎无光的表面，只留下冷色裂纹与纤细环带。'},
 {kicker:'云海超级地球',title:'远风之境',text:'厚重云层覆盖大地，暖金色气流绕行整个世界。'},
 {kicker:'深蓝热木星',title:'HD 189733 b',text:'钴蓝色来自炽热大气与可能含硅酸盐的云雾。'},
 {kicker:'熔岩超级地球',title:'55 Cancri e',text:'灼热岩壳之间，熔岩海在昼夜交界缓慢发光。'},
 {kicker:'环双星气态巨行星',title:'Kepler-16 b',text:'一颗寒冷巨行星，沿轨道同时环绕两颗恒星。'},
 {kicker:'年轻甲烷气态巨行星',title:'51 Eridani b',text:'幽紫甲烷云层间，白色冰云映出微弱星光。'}
];

export class StarseaExperience{
 constructor({getReduced,beforeOpen,onReturn,onFocus}){
  Object.assign(this,{getReduced,beforeOpen,onReturn,onFocus});this.active=false;this.busy=false;this.ticket=0;this.palette='silver';this.selected=-1;
  this.root=document.createElement('section');this.root.id='starsea-experience';this.root.hidden=true;
  this.root.innerHTML=`<div class="starsea-rear"><img alt="飞船身后的观星门廊"><div class="rear-copy"><h2>身后，还有一片星海。</h2><p></p></div><button class="starsea-enter">走进观星空间 ↗</button></div><div class="starsea-canvas" hidden></div><div class="starsea-top"><span>星愿房间</span><nav><button class="starsea-overview" hidden>查看整片星海</button><button class="starsea-return">返回飞船</button></nav></div><div class="starsea-ui" hidden><div class="starsea-palette" role="group" aria-label="星海颜色"></div><p class="starsea-gesture-hint">单指环视 · 双指靠近</p><div class="starsea-motion"><div class="starsea-zoom" role="group" aria-label="星海远近"><button class="starsea-zoom-out" type="button" aria-label="拉远星海">−</button><button class="starsea-zoom-in" type="button" aria-label="拉近星海">＋</button></div><button class="starsea-tilt" type="button" aria-pressed="false">开启体感</button><button class="starsea-calibrate" type="button" hidden>校准视角</button></div><article class="starsea-focus" hidden><span></span><h2></h2><p></p></article></div><p class="starsea-status" role="status"></p>`;
  this.orientation=document.createElement("aside");this.orientation.className="birthday-landscape-hint";this.orientation.setAttribute("role","status");this.orientation.innerHTML="<span aria-hidden=\"true\">↻</span><h2>请横屏，走进观景世界</h2><p>将手机横过来，获得完整的房间与特殊观景视野。</p>";document.body.append(this.orientation);document.body.append(this.root);this.$=selector=>this.root.querySelector(selector);
  this.rear=this.$('.starsea-rear');this.stage=this.$('.starsea-canvas');this.ui=this.$('.starsea-ui');
  for(const [key,value]of Object.entries(STARSEA_PALETTES)){const button=document.createElement('button');button.type='button';button.dataset.color=key;button.style.setProperty('--swatch',value.accent);button.setAttribute('aria-label',value.name);button.setAttribute('aria-pressed',String(key===this.palette));button.title=value.name;button.onclick=()=>this.setPalette(key);this.$('.starsea-palette').append(button);}
  this.$('.starsea-enter').onclick=()=>this.enter();this.$('.starsea-return').onclick=()=>this.close();this.$('.starsea-overview').onclick=()=>this.scene?.overview();
  this.$('.starsea-zoom-in').onclick=()=>this.scene?.zoomBy(.8);this.$('.starsea-zoom-out').onclick=()=>this.scene?.zoomBy(1.25);
  this.$('.starsea-tilt').onclick=async()=>{const button=this.$('.starsea-tilt');if(!this.scene)return;if(this.scene.tiltEnabled){this.scene.disableTilt();button.textContent='开启体感';button.setAttribute('aria-pressed','false');this.$('.starsea-calibrate').hidden=true;return;}button.disabled=true;const allowed=await this.scene.enableTilt();button.disabled=false;if(allowed){button.textContent='体感已开启';button.setAttribute('aria-pressed','true');this.$('.starsea-calibrate').hidden=false;}else{this.$('.starsea-status').textContent='未能开启体感，仍可拖动星海和双指缩放。';clearTimeout(this.motionMessage);this.motionMessage=setTimeout(()=>{if(this.root.dataset.state==='galaxy')this.$('.starsea-status').textContent='';},3500);}};
  this.$('.starsea-calibrate').onclick=()=>{this.scene?.calibrateTilt();this.$('.starsea-status').textContent='已按当前握持角度校准';clearTimeout(this.motionMessage);this.motionMessage=setTimeout(()=>{if(this.root.dataset.state==='galaxy')this.$('.starsea-status').textContent='';},1800);};
 }
 async open({direct=false}={}){
  if(this.active)return;this.active=true;this.busy=true;const ticket=++this.ticket;this.returnFocus=document.activeElement;
  this.root.hidden=false;this.root.dataset.state='loading';this.$('.starsea-enter').disabled=true;this.$('.starsea-status').textContent='正在准备观星空间…';
  document.body.classList.add('starsea-active');this.background=[...document.body.children].filter(el=>el!==this.root&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);this.background.forEach(([el])=>el.inert=true);
  this.$('.starsea-return').focus();
  try{
   const image=this.rear.querySelector('img');image.src='./assets/ship-rear-entry-v1.png';
   await Promise.all([image.decode(),Promise.resolve(this.beforeOpen?.())]);if(ticket!==this.ticket)return;
   this.background.forEach(([el])=>el.inert=true);
   this.stage.hidden=true;this.ui.hidden=true;this.rear.hidden=false;this.$('.starsea-overview').hidden=true;
   this.root.dataset.state='rear';this.$('.starsea-status').textContent='';
   await this.rear.animate([{opacity:0,transform:'translateX(12%) scale(1.06)',filter:'blur(8px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:this.getReduced()?150:1400,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;
   if(ticket!==this.ticket)return;this.busy=false;this.$('.starsea-enter').disabled=false;this.$('.starsea-enter').focus();if(direct)await this.enter();
  }catch{if(ticket===this.ticket){this.busy=false;this.$('.starsea-enter').disabled=false;this.root.dataset.state='error';this.$('.starsea-status').textContent='观星入口未能加载，请返回飞船后重试。';}}
 }
 async enter(){
  if(this.busy||!this.active)return;this.busy=true;const ticket=this.ticket;this.$('.starsea-enter').disabled=true;this.$('.starsea-status').textContent='正在展开星海…';
  try{
   if(!this.scene){const {StarseaScene}=await import('./starsea-scene.js?v=33');if(ticket!==this.ticket)return;this.scene=new StarseaScene(this.stage,{reduced:this.getReduced(),onFocus:index=>this.showFocus(index),onSpecial:info=>this.showSpecial(info),onBusy:value=>this.setBusy(value),onInteract:()=>{this.$('.starsea-gesture-hint').hidden=true;},onError:message=>{this.scene?.dispose();this.scene=null;this.$('.starsea-status').textContent=message;}});}
   this.scene.reduced=this.getReduced();this.scene.setPlanets();this.scene.setPalette(this.palette);this.scene.active=true;this.$('.starsea-gesture-hint').hidden=false;this.stage.hidden=false;this.scene.resize();this.setBusy(true);this.root.dataset.state='entering';
   await this.rear.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(1.8)',filter:'blur(9px)'}],{duration:this.getReduced()?150:1500,easing:'cubic-bezier(.22,.7,.16,1)'}).finished;
   if(ticket!==this.ticket)return;this.rear.hidden=true;this.ui.hidden=false;this.$('.starsea-overview').hidden=false;this.root.dataset.state='galaxy';this.$('.starsea-status').textContent='';this.setBusy(false);this.$('.starsea-overview').focus();
  }catch{if(ticket===this.ticket){this.scene?.dispose();this.scene=null;this.stage.hidden=true;this.rear.hidden=false;this.$('.starsea-status').textContent='星海暂时无法打开，可以重试或返回飞船。';this.setBusy(false);}}
  finally{this.$('.starsea-enter').disabled=false;}
 }
 setBusy(value){this.busy=value;this.root.dataset.moving=String(value);this.$('.starsea-overview').disabled=value;}
 showFocus(index){this.selected=index;if(index<0){this.$('.starsea-focus').hidden=true;return;}this.$('.starsea-gesture-hint').hidden=true;this.onFocus?.(index);this.showSpecial(WORLD_NOTES[index]);}
 showSpecial(info){if(!info)return;const panel=this.$('.starsea-focus');panel.querySelector('span').textContent=info.kicker;panel.querySelector('h2').textContent=info.title;panel.querySelector('p').textContent=info.text;panel.hidden=false;panel.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'none'}],{duration:this.getReduced()?80:420,easing:'cubic-bezier(.22,.7,.16,1)'});}
 setPalette(name){if(!STARSEA_PALETTES[name])return;this.palette=name;this.scene?.setPalette(name);this.root.dataset.palette=name;this.root.style.setProperty('--star-accent',STARSEA_PALETTES[name].accent);this.$('.starsea-palette').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===name)));}
 async close(){
  if(!this.active)return;++this.ticket;this.active=false;this.busy=false;if(this.scene){this.scene.active=false;this.scene.disableTilt();}this.$('.starsea-tilt').textContent='开启体感';this.$('.starsea-tilt').setAttribute('aria-pressed','false');this.$('.starsea-calibrate').hidden=true;clearTimeout(this.motionMessage);
  this.root.getAnimations({subtree:true}).forEach(a=>a.cancel());
  const exit=this.root.animate([{opacity:1},{opacity:0}],{duration:this.getReduced()?100:400});try{await exit.finished;}catch{}exit.cancel();
  this.root.hidden=true;this.stage.hidden=true;this.rear.hidden=false;this.background?.forEach(([el,inert])=>el.inert=inert);document.body.classList.remove('starsea-active');if(this.onReturn)await this.onReturn();else this.returnFocus?.focus({preventScroll:true});
 }
 update(dt){if(this.active)this.scene?.update(dt);}
 dispose(){++this.ticket;this.scene?.dispose();this.root.remove();this.orientation.remove();}
}




