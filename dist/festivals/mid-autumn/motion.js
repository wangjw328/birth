const ease='cubic-bezier(.22,.7,.16,1)';
export class JourneyMotion {
 constructor(reduced){this.reduced=reduced;this.busy=false;this.photoTicket=0;this.photoAnimations=[];}
 async change(outgoing,incoming,commit){
  if(this.busy)return;this.busy=true;const short=this.reduced();
  outgoing.inert=true;
  const exit=outgoing.animate([{opacity:1},{opacity:0,filter:short?'none':'blur(3px)',translate:short?'0':'0 -15px'}],{duration:short?90:300,easing:ease,fill:'forwards'});
  try{await exit.finished;commit();exit.cancel();outgoing.inert=false;incoming.inert=true;
   const enter=incoming.animate([{opacity:0,filter:short?'none':'blur(3px)',translate:short?'0':'0 20px'},{opacity:1,filter:'none',translate:'0'}],{duration:short?130:800,easing:ease});
   if(!short){const env=document.getElementById('environment');env.animate([{scale:'1.035'},{scale:'1'}],{duration:1400,easing:ease});
    incoming.querySelectorAll('.screen-frame,.letter-paper,.section-heading,.particle-tools,.actions').forEach((el,i)=>el.animate([{opacity:0,translate:'0 22px'},{opacity:1,translate:'0'}],{duration:850,delay:i*65,easing:ease,fill:'backwards'}));
    if(incoming.id==='letter')incoming.querySelectorAll('.letter-paper>*').forEach((el,i)=>el.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0'}],{duration:700,delay:150+i*90,easing:ease,fill:'backwards'}));
   }await enter.finished;
  }finally{exit.cancel();outgoing.inert=false;incoming.inert=false;this.busy=false;}
 }
 async photo(image,src,alt,direction,commit){
  const ticket=++this.photoTicket,preload=new Image();preload.src=src;
  try{await preload.decode();}catch{if(ticket===this.photoTicket)commit(false);return;}
  if(ticket!==this.photoTicket)return;
  this.photoAnimations.forEach(a=>a.cancel());this.photoGhost?.remove();
  const visible=!!image.getAttribute('src')&&!document.getElementById('cinema').hidden;
  const ghost=visible?image.cloneNode():null;
  if(ghost){ghost.removeAttribute('id');ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.className='photo-transition-layer';image.after(ghost);this.photoGhost=ghost;}
  image.src=src;image.alt=alt;commit(true);
  if(!visible)return;const short=this.reduced(),duration=short?150:850;
  const entry=image.animate([{opacity:0,transform:short?'none':`perspective(1000px) translateX(${direction*45}px) rotateY(${direction*7}deg) scale(.96)`},{opacity:1,transform:'none'}],{duration,easing:ease});
  const leave=ghost.animate([{opacity:1,transform:'none'},{opacity:0,transform:short?'none':`translateX(${-direction*60}px) scale(1.025)`}],{duration,easing:ease,fill:'forwards'});
  this.photoAnimations=[entry,leave];
  document.querySelector('.screen-caption').animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0'}],{duration:short?150:650,delay:short?0:150,fill:'backwards',easing:ease});
  try{await leave.finished;}catch{}finally{ghost.remove();}
 }
 background(environment){
  this.backgroundAnimation?.cancel();this.backgroundGhost?.remove();
  const ghost=environment.cloneNode();ghost.removeAttribute('id');ghost.className='scene-transition-layer';const style=getComputedStyle(environment);
  Object.assign(ghost.style,{backgroundImage:style.backgroundImage,backgroundPosition:style.backgroundPosition,filter:style.filter,transform:style.transform});environment.after(ghost);this.backgroundGhost=ghost;
  this.backgroundAnimation=ghost.animate([{opacity:1},{opacity:0}],{duration:this.reduced()?160:1100,easing:ease,fill:'forwards'});
  this.backgroundAnimation.finished.catch(()=>{}).finally(()=>ghost.remove());
 }
 openCard(dialog,source){
  this.cardSource=source;const rect=source?.getBoundingClientRect();dialog.showModal();const dest=dialog.getBoundingClientRect();
  const transform=rect?`translate(${rect.x+rect.width/2-dest.x-dest.width/2}px,${rect.y+rect.height/2-dest.y-dest.height/2}px) scale(${Math.max(.2,rect.width/dest.width)})`:'translateY(25px) scale(.9)';
  dialog.animate([{opacity:0,transform:this.reduced()?'none':transform},{opacity:1,transform:'none'}],{duration:this.reduced()?150:700,easing:ease});
 }
 async closeCard(dialog){
  if(!dialog.open||this.closing)return;this.closing=true;
  const a=dialog.animate([{opacity:1,transform:'none'},{opacity:0,transform:this.reduced()?'none':'translateY(25px) scale(.92)'}],{duration:this.reduced()?100:300,easing:ease,fill:'forwards'});
  try{await a.finished;dialog.close();this.cardSource?.focus({preventScroll:true});}finally{a.cancel();this.closing=false;}
 }
}
