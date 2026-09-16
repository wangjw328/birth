const ease='cubic-bezier(.22,.7,.16,1)';
export class BirthdayMotion {
 constructor(reduced){this.reduced=reduced;this.busy=false;this.animations=[];}
 async chapter(commit){if(this.busy)return;this.busy=true;const main=document.querySelector('main');main.inert=true;const short=this.reduced();
  const out=main.animate([{opacity:1},{opacity:0,translate:short?'0':'0 -12px'}],{duration:short?80:260,fill:'forwards',easing:ease});
  try{await out.finished;commit();out.cancel();const enter=main.animate([{opacity:0,translate:short?'0':'0 14px'},{opacity:1,translate:'0'}],{duration:short?140:680,easing:ease});
   if(!short)document.querySelectorAll('main section:not([hidden]) .chapter,main section:not([hidden]) .memory-heading,main section:not([hidden]) .particle-controls,main section:not([hidden]) .memory-actions').forEach((el,i)=>el.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0'}],{duration:560,delay:150+i*70,fill:'backwards',easing:ease}));
   await enter.finished;
  }finally{out.cancel();main.inert=false;this.busy=false;}
 }
 open(dialog,source){this.source=source;const origin=source?.getBoundingClientRect();dialog.showModal();const r=dialog.getBoundingClientRect();const from=origin?`translate(${origin.x+origin.width/2-r.x-r.width/2}px,${origin.y+origin.height/2-r.y-r.height/2}px) scale(${Math.max(.18,origin.width/r.width)})`:'translateY(20px) scale(.9)';
  dialog.animate([{opacity:0,transform:this.reduced()?'none':from},{opacity:1,transform:'none'}],{duration:this.reduced()?160:580,easing:ease});
 }
 flip(content,commit,direction){this.animations.forEach(a=>a.cancel());this.ghost?.remove();const ghost=content.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));ghost.querySelectorAll('audio').forEach(el=>el.remove());ghost.inert=true;ghost.setAttribute('aria-hidden','true');ghost.className='media-page-ghost';content.after(ghost);this.ghost=ghost;commit();
  const short=this.reduced(),duration=short?150:620;
  const entry=content.animate([{opacity:0,transform:short?'none':`perspective(900px) translateX(${direction*40}px) rotateY(${direction*6}deg)`},{opacity:1,transform:'none'}],{duration,easing:ease});
  const exit=ghost.animate([{opacity:1},{opacity:0,transform:short?'none':`translateX(${-direction*40}px) scale(.97)`}],{duration,easing:ease,fill:'forwards'});this.animations=[entry,exit];exit.finished.catch(()=>{}).finally(()=>ghost.remove());
 }
 async close(dialog){if(!dialog.open||this.closing)return;this.closing=true;const a=dialog.animate([{opacity:1},{opacity:0,transform:this.reduced()?'none':'translateY(18px) scale(.94)'}],{duration:this.reduced()?100:280,fill:'forwards',easing:ease});try{await a.finished;dialog.close();this.source?.focus({preventScroll:true});}finally{a.cancel();this.closing=false;}}
}
