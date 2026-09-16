import {MemoryParticles} from '../birthday/particles.js';
import {HandControls} from '../birthday/hands.js';
import {Fireworks} from '../birthday/fireworks.js';
import {loadDraft,saveDraft} from './storage.js';
const $=id=>document.getElementById(id);
const initial={sender:'我',recipient:'你',date:'',scene:'garden',message:'有些话，在心里练习了很多遍。\n\n看到好看的晚霞，会想告诉你；听到一首温柔的歌，会想起你。原来喜欢一个人，就是平凡的日子里，也多了许多想分享的瞬间。\n\n所以今天，我想认真地告诉你：我喜欢你。\n\n你不需要马上回答。谢谢你愿意读到这里，我会尊重你的心意。',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,photos:[],audio:null};
let config=structuredClone(initial),draft,view='welcome',slide=0,playing=false,elapsed=0,last=performance.now(),particles=null,memories=[],photoUrls=[],draftUrls=[],audioUrl='',timer,uploadGeneration=0,loadingPhotos=false;
const defaults=[{src:'../birthday/assets/sunset.png',title:'看到晚霞，就想分享给你',caption:'示例画面 · 心动有时只是，想起了你。'},{src:'../birthday/assets/moon-garden.png',title:'一些温柔的日常',caption:'示例画面 · 因为你，普通的日子也有了颜色。'},{src:'../birthday/assets/aurora.png',title:'如果可以，想和你一起看',caption:'示例画面 · 有些风景，想邀请你一起走近。'}];
let slides=defaults;
const fireworks=new Fireworks($('fireworks'));
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function stopAudio(){$('memory-audio').pause();$('voice').textContent='♫ 播放你的留言';}
function apply(){
 setScene(config.scene||'garden',false);
 photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl='';
 slides=config.photos.length?config.photos.map((p,i)=>{const src=URL.createObjectURL(p.file);photoUrls.push(src);return{src,title:p.caption||`第 ${i+1} 个心动瞬间`,caption:'那些想说给你听的心意。'};}):defaults;
 if(config.audio)audioUrl=URL.createObjectURL(config.audio);
 memories=[...slides.map(p=>({...p,type:'photo'})),{type:'note',title:'那封没说出口的信',caption:config.message}];if(audioUrl)memories.push({type:'audio',title:'有句话，想亲口说',src:audioUrl,caption:'这是专门为你留下的声音。'});
 particles?.setCards(memories);if(particles)particles.reduced=config.reduced;fireworks.reduced=config.reduced;document.body.classList.toggle('reduced',config.reduced);
 $('couple-label').textContent=config.sender+' → '+config.recipient;
 let dayText='有些心动，从来不是偶然';if(config.date){const [y,m,d]=config.date.split('-').map(Number);const now=new Date();const diff=Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(y,m-1,d))/86400000);dayText=diff>=0?`从那一天起，第 ${diff+1} 天`:`距离那一天还有 ${-diff} 天`;}
 $('days-label').textContent=dayText;$('letter-to').textContent=`亲爱的${config.recipient}，`;$('letter-body').textContent=config.message;$('signature').textContent=config.sender;$('letter-date').textContent=config.date?config.date.replaceAll('-',' · '):'写给此刻，想认真告白的我';$('ending-caption').textContent='不必急着回答。谢谢你，愿意听见我的心意。';$('voice').hidden=!audioUrl;slide=Math.min(slide,slides.length-1);renderSlide();
}
function renderSlide(){const p=slides[slide];$('slide-image').src=p.src;$('slide-image').alt=p.title;$('slide-title').textContent=p.title;$('slide-caption').textContent=p.caption;$('slide-count').textContent=String(slide+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');$('slide-tag').textContent=slide===0?'心动':slide===slides.length-1?'邀请':'日常';$('prev').disabled=slide===0;$('next').disabled=slide===slides.length-1;elapsed=0;$('film-progress').style.width='0%';}
function setPlaying(value){playing=value;$('play').textContent=value?'Ⅱ 暂停回顾':'▷ 自动回顾';$('play').setAttribute('aria-pressed',String(value));}
function go(next){
 if(!['welcome','cinema','memories','letter','ending'].includes(next))return;
 if(next!=='memories'){hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';}
 stopAudio();setPlaying(false);if($('memory-dialog').open)$('memory-dialog').close();view=next;document.body.dataset.view=next;document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==next);
 if(particles){particles.active=next==='memories';if(particles.active)particles.resize();}
 if(next==='ending')fireworks.start();else fireworks.stop();document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===next));
}
function spread(value){if(!particles)return;particles.setSpread(value);$('expand').textContent=value>.5?'收拢回忆 ↙':'展开回忆 ↗';}
function openMemory(i){const item=memories[i];if(!item)return;stopAudio();$('memory-title').textContent=item.title;$('memory-image').hidden=item.type!=='photo';$('memory-audio').hidden=item.type!=='audio';$('memory-text').textContent=item.caption||'';if(item.type==='photo'){$('memory-image').src=item.src;$('memory-image').alt=item.title;}if(item.type==='audio')$('memory-audio').src=item.src;$('memory-dialog').showModal();}
const scenePresets={
 garden:{image:'assets/garden.png',title:'花开的时候，\n想起的都是你。',description:'把没说出口的喜欢，藏进今晚的花园。',hotspot:'拾起一束心意',palette:'rose'},
 tide:{image:'assets/tide.png',title:'海风知道，\n我有多想靠近你。',description:'把心意装进信里，让海风慢慢读给你听。',hotspot:'拾起一封来信',palette:'blue'},
 rooftop:{image:'assets/rooftop.png',title:'今夜的灯火，\n想和你一起看。',description:'城市慢慢安静，有句话只想说给你听。',hotspot:'点亮今晚的心意',palette:'gold'}
};
let sceneGeneration=0;
async function setScene(name,persist=true){
 const preset=scenePresets[name]||scenePresets.garden;name=scenePresets[name]?name:'garden';const generation=++sceneGeneration;
 const picker=document.querySelector('.confession-scenes');picker.setAttribute('aria-busy','true');
 try{const image=new Image();image.src=preset.image;await image.decode();if(generation!==sceneGeneration)return;
 $('environment').style.backgroundImage=`url('${preset.image}')`;document.body.dataset.scene=name;
 $('scene-heading').innerText=preset.title;$('scene-description').textContent=preset.description;
 const hotspot=$('scene-hotspot');hotspot.replaceChildren(document.createTextNode(preset.hotspot));const hint=document.createElement('small');hint.textContent='一些关于你的心动瞬间';hotspot.append(hint);
 particles?.setPalette(preset.palette);config.scene=name;document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===name)));
 if(persist)try{await saveDraft(structuredClone(config));}catch{toast('场景已切换，但本机保存失败。');}
 }catch{toast('场景暂时无法加载，请重新选择。');}finally{if(generation===sceneGeneration)picker.setAttribute('aria-busy','false');}
}
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>setScene(b.dataset.scene));
let lastPinch=0,lastGesture='';
const hands=new HandControls($('hand-video'),data=>{
 if(!data){lastGesture='';return;}if(view!=='memories'||$('settings').open)return;
 if(!$('memory-dialog').open){if(data.stable&&data.open)spread(1);if(data.stable&&data.fist)spread(0);if(data.zoom)particles?.setZoom(data.zoom);if(particles)particles.targetRotation=(data.palmX-.5)*2;}
 if(data.stable&&data.pinch&&lastGesture!=='pinch'&&data.timestamp-lastPinch>850){lastPinch=data.timestamp;const selector=$('memory-dialog').open?'#memory-dialog button':'.orbit-card';const x=data.x*innerWidth,y=data.y*innerHeight;let closest=null,best=80;for(const b of document.querySelectorAll(selector)){if(b.getAttribute('aria-hidden')==='true')continue;const r=b.getBoundingClientRect();const d=Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));if(d<best){best=d;closest=b;}}closest?.click();}if(data.stable)lastGesture=data.name;
},message=>{$('hand-status').hidden=false;$('hand-status').textContent=message;if(!hands.active&&!hands.loading){$('hand-preview').hidden=true;$('hand-toggle').textContent='✋ 开启手势';}});
$('hand-toggle').onclick=async()=>{if(hands.active||hands.loading){hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';return;}$('hand-toggle').textContent='取消开启';try{await hands.start();if(hands.active){$('hand-preview').hidden=false;$('hand-toggle').textContent='关闭手势';}}catch{}};
try{const saved=await loadDraft();if(saved&&Array.isArray(saved.photos)&&typeof saved.message==='string')config={...initial,...saved};}catch{toast('浏览器存储暂不可用，可以继续体验并编辑本次内容。');}
try{particles=new MemoryParticles($('particle-canvas'),$('photo-orbit'),openMemory);particles.setPalette('rose');}catch(e){$('expand').textContent='打开回忆列表';$('hand-toggle').hidden=true;toast('当前设备无法渲染粒子，将使用回忆卡片模式。');console.warn(e);}
apply();
if(!particles){$('photo-orbit').classList.add('fallback-cards');memories.forEach((m,i)=>{const b=document.createElement('button');b.textContent=m.title;b.onclick=()=>openMemory(i);$('photo-orbit').append(b);});}
$('start').onclick=$('projector').onclick=()=>go('cinema');$('cinema-home').onclick=()=>go('welcome');$('prev').onclick=()=>{slide=Math.max(0,slide-1);renderSlide();};$('next').onclick=()=>{slide=Math.min(slides.length-1,slide+1);renderSlide();};$('play').onclick=()=>{if(!playing&&slide===slides.length-1){slide=0;renderSlide();}setPlaying(!playing);};
$('to-memories').onclick=()=>{spread(0);go('memories');};$('memory-back').onclick=()=>go('cinema');$('to-letter').onclick=()=>go('letter');$('letter-back').onclick=()=>go('memories');$('celebrate').onclick=()=>go('ending');$('replay').onclick=()=>{slide=0;renderSlide();go('welcome');};$('expand').onclick=()=>particles?spread(particles.targetSpread>.5?0:1):openMemory(0);
document.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>{particles?.setShape(b.dataset.shape);document.querySelectorAll('[data-shape]').forEach(p=>p.setAttribute('aria-pressed',String(p===b)));});document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('close-memory').onclick=()=>$('memory-dialog').close();$('memory-dialog').addEventListener('close',stopAudio);
$('voice').onclick=async()=>{const player=$('memory-audio');if(!player.paused){stopAudio();return;}player.src=audioUrl;try{await player.play();$('voice').textContent='Ⅱ 暂停留言';}catch{toast('录音暂时无法播放，请更换常见音频格式。');}};$('memory-audio').onended=()=>{$('voice').textContent='♫ 播放你的留言';};
function renderDraftPhotos(){draftUrls.forEach(URL.revokeObjectURL);draftUrls=[];$('photo-editor').replaceChildren();draft.photos.forEach((p,i)=>{const row=document.createElement('div');row.className='photo-row';const image=document.createElement('img');image.src=URL.createObjectURL(p.file);draftUrls.push(image.src);image.alt='照片 '+(i+1);const input=document.createElement('input');input.value=p.caption;input.maxLength=70;input.setAttribute('aria-label','第 '+(i+1)+' 张照片的文字');input.oninput=()=>{p.caption=input.value;};const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','移除第 '+(i+1)+' 张照片');remove.onclick=()=>{draft.photos.splice(i,1);renderDraftPhotos();};row.append(image,input,remove);$('photo-editor').append(row);});}
function audioDraftLabel(){$('audio-name').textContent=draft.audio?'已添加：'+(draft.audio.name||'专属录音'):'尚未添加录音';$('remove-audio').hidden=!draft.audio;}
$('edit').onclick=()=>{setPlaying(false);stopAudio();hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';draft=structuredClone(config);$('sender').value=draft.sender;$('recipient').value=draft.recipient;$('date').value=draft.date;$('message').value=draft.message;$('reduced').checked=draft.reduced;$('photos').value='';$('audio').value='';$('save-status').textContent='';renderDraftPhotos();audioDraftLabel();$('settings').showModal();};
$('close-settings').onclick=()=>$('settings').close();$('settings').addEventListener('close',()=>{uploadGeneration++;draftUrls.forEach(URL.revokeObjectURL);draftUrls=[];});
$('photos').onchange=async e=>{const files=[...e.target.files];if(!files.length)return;const generation=++uploadGeneration;loadingPhotos=true;$('save').disabled=true;$('save-status').textContent='正在检查照片…';const accepted=[];for(const file of files.slice(0,8)){if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>8*1024*1024)continue;const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();accepted.push({file,caption:file.name.replace(/\.[^.]+$/,'')});}catch{}finally{URL.revokeObjectURL(url);}}
 if(generation!==uploadGeneration){loadingPhotos=false;$('save').disabled=false;return;}loadingPhotos=false;$('save').disabled=false;if(accepted.length){draft.photos=accepted;renderDraftPhotos();}$('save-status').textContent=accepted.length===files.length?'照片已准备好，保存后生效。':`已接受 ${accepted.length} 张照片；请使用 8 MB 内的 JPG / PNG / WebP，最多 8 张。`;};
$('audio').onchange=e=>{const file=e.target.files[0];if(!file)return;if(!file.type.startsWith('audio/')||file.size>30*1024*1024){$('save-status').textContent='请选择 30 MB 以内的音频文件。';return;}draft.audio=file;audioDraftLabel();};$('remove-audio').onclick=()=>{draft.audio=null;$('audio').value='';audioDraftLabel();};
$('settings-form').onsubmit=async e=>{e.preventDefault();if(loadingPhotos)return;const sender=$('sender').value.trim(),recipient=$('recipient').value.trim();if(!sender||!recipient){$('save-status').textContent='请填写两个人的名字。';return;}Object.assign(draft,{sender,recipient,date:$('date').value,message:$('message').value.trim()||initial.message,reduced:$('reduced').checked});$('save').disabled=true;try{await saveDraft(draft);config=structuredClone(draft);apply();$('settings').close();go('welcome');toast('已保存到当前浏览器。现在打开你的心意。');}catch{$('save-status').textContent='本机存储失败，可能空间不足或浏览器限制。请减少素材后重试；已有内容未覆盖。';}finally{$('save').disabled=false;}};
let audioContext,gain,sound=false;
$('audio-toggle').onclick=async()=>{try{if(!audioContext){audioContext=new AudioContext();gain=audioContext.createGain();gain.gain.value=0;gain.connect(audioContext.destination);[130.81,196,261.63].forEach((frequency,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=frequency;g.gain.value=.025/(i+1);o.connect(g);g.connect(gain);o.start();});}sound=!sound;if(sound)await audioContext.resume();gain.gain.setTargetAtTime(sound?.5:0,audioContext.currentTime,.5);$('audio-toggle').textContent=sound?'♫ 环境音开':'♫ 环境音关';$('audio-toggle').setAttribute('aria-pressed',String(sound));}catch{toast('环境音暂时无法播放。');}};
function frame(now){const dt=Math.min((now-last)/1000,.06);last=now;if(!document.hidden){particles?.update(dt,now/1000);fireworks.update(dt,now/1000);if(playing&&view==='cinema'){elapsed+=dt;$('film-progress').style.width=Math.min(elapsed/6*100,100)+'%';if(elapsed>=6){if(slide<slides.length-1){slide++;renderSlide();}else setPlaying(false);}}}requestAnimationFrame(frame);}requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden){hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';setPlaying(false);stopAudio();audioContext?.suspend();}else if(sound)audioContext?.resume();});window.addEventListener('pagehide',()=>{hands.dispose();stopAudio();audioContext?.close();photoUrls.forEach(URL.revokeObjectURL);draftUrls.forEach(URL.revokeObjectURL);if(audioUrl)URL.revokeObjectURL(audioUrl);});
