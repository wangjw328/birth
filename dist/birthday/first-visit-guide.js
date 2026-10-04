const STORAGE_KEY='birthday-guide-state';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function readState(version){
 try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(value?.version===version&&Array.isArray(value.seen))return value;}catch{}
 return{version,seen:[],done:false};
}
// Existing controls supply the words; this layer only guides the eye.
export class FirstVisitGuide{
 constructor({version=1,reduced=()=>false}={}){
  this.version=version;this.reduced=reduced;this.state=readState(version);this.enabled=!this.state.done;
  this.current=null;this.raf=0;this.hideTimer=0;this.lastPosition='';
  this.root=document.createElement('div');this.root.className='first-guide';this.root.hidden=true;this.root.setAttribute('popover','manual');
  this.root.innerHTML='<div class="guide-trail" aria-hidden="true"></div><div class="guide-beacon" aria-hidden="true"><i></i><i></i><i></i></div><div class="guide-landing" aria-hidden="true"></div><span class="guide-announcement" role="status"></span><button class="guide-skip" type="button">关闭微光指引</button>';
  document.body.append(this.root);
  this.trail=this.root.querySelector('.guide-trail');this.beacon=this.root.querySelector('.guide-beacon');this.landing=this.root.querySelector('.guide-landing');this.announcement=this.root.querySelector('.guide-announcement');this.skipButton=this.root.querySelector('.guide-skip');
  this.trail.innerHTML=Array.from({length:7},()=>'<i></i>').join('');this.skipButton.onclick=()=>this.skip();
  this.onViewport=()=>{this.lastPosition='';this.position();};addEventListener('resize',this.onViewport,{passive:true});
 }
 save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state));}catch{}}
 has(id){return this.state.seen.includes(id);}
 show({id,target,label='跟随微光，轻触发光的入口'}){
  if(!this.enabled||!id||this.has(id))return false;
  const element=typeof target==='string'?document.querySelector(target):target;
  if(!element||element.hidden||!element.getClientRects().length)return false;
  if(this.current?.id===id&&this.current.element===element)return true;
  this.hide();this.current={id,element};this.lastPosition='';
  this.root.dataset.tone=document.body.dataset.scene||'aurora';this.root.dataset.kind=id==='room-memory'?'wall':'control';
  this.root.classList.toggle('is-reduced',this.reduced());this.root.hidden=false;
  try{this.root.showPopover?.();}catch{}
  this.announcement.textContent=label;document.body.dataset.guide=id;this.position();this.track();return true;
 }
 position(){
  if(this.root.hidden||!this.current)return;
  const {element,id}=this.current,r=element.getBoundingClientRect();
  if(!element.isConnected||!r.width||!r.height||element.closest('[hidden]')){this.hide();return;}
  const vw=innerWidth,vh=innerHeight,wall=id==='room-memory';
  const icon=wall?element.querySelector('i')?.getBoundingClientRect():null;
  const tx=clamp(icon?icon.left+icon.width/2:r.left+r.width/2,16,vw-16),ty=clamp(icon?icon.top+icon.height/2:r.bottom+7,16,vh-16);
  const key=[Math.round(tx),Math.round(ty),Math.round(r.width),vw,vh].join('/');if(key===this.lastPosition)return;this.lastPosition=key;
  Object.assign(this.beacon.style,{left:tx+'px',top:ty+'px'});
  Object.assign(this.landing.style,{left:tx+'px',top:ty+'px',width:(wall?66:Math.min(r.width*.85,190))+'px',height:(wall?66:3)+'px'});
  const modal=element.closest('dialog')?.getBoundingClientRect();
  Object.assign(this.skipButton.style,{left:modal?(modal.left+18)+'px':'50%',top:modal?(modal.top+8)+'px':'max(12px, env(safe-area-inset-top))',transform:modal?'none':'translateX(-50%)'});
  this.launchTrail(tx,ty,wall);
 }
 launchTrail(tx,ty,wall){
  const from=wall?[innerWidth*.49,innerHeight*.72]:[clamp(tx-95,20,innerWidth-20),clamp(ty+48,20,innerHeight-20)];
  [...this.trail.children].forEach((dot,i)=>{
   const offset=Math.sin(i*2.1)*7;
   dot.style.setProperty('--sx',`${from[0]}px`);dot.style.setProperty('--sy',`${from[1]+offset}px`);
   dot.style.setProperty('--cx',`${from[0]+(tx-from[0])*.54}px`);dot.style.setProperty('--cy',`${from[1]+(ty-from[1])*.32-34+offset}px`);
   dot.style.setProperty('--ex',`${tx+offset}px`);dot.style.setProperty('--ey',`${ty+(wall?-26:0)}px`);
   dot.style.setProperty('--delay',`${i*.075}s`);dot.style.setProperty('--size',`${i===0?7:3.5}px`);
  });
 }
 track(){cancelAnimationFrame(this.raf);let previous=0;const tick=time=>{if(this.root.hidden||!this.current)return;if(!document.hidden&&time-previous>50){this.position();previous=time;}this.raf=requestAnimationFrame(tick);};this.raf=requestAnimationFrame(tick);}
 complete(id=this.current?.id){if(!id)return;if(!this.has(id))this.state.seen.push(id);this.save();if(this.current?.id===id)this.hide(true);}
 hide(soft=false){
  cancelAnimationFrame(this.raf);this.raf=0;clearTimeout(this.hideTimer);
  if(soft&&!this.root.hidden&&!this.reduced()){this.root.classList.add('is-leaving');this.skipButton.disabled=true;this.hideTimer=setTimeout(()=>this.hide(),240);return;}
  try{if(this.root.matches(':popover-open'))this.root.hidePopover();}catch{}
  this.root.hidden=true;this.root.classList.remove('is-leaving');this.skipButton.disabled=false;delete document.body.dataset.guide;this.current=null;
 }
 finish(){this.state.done=true;this.enabled=false;this.save();this.hide();}
 skip(){this.finish();}
 restart(){this.state={version:this.version,seen:[],done:false};this.enabled=true;this.save();this.hide();}
 dispose(){this.hide();removeEventListener('resize',this.onViewport);this.root.remove();}
}
