import {JourneyMotion} from './motion.js?v=6';
import {SceneCamera} from './cinematic.js?v=5';
import {MemoryParticles} from '../../birthday/particles.js';
import {HandControls} from '../../birthday/hands.js';
import {SkyLanterns} from './sky-lanterns.js';
import {loadDraft,saveDraft} from './storage.js';
const $=id=>document.getElementById(id);
const initial={sender:'我',recipient:'家人们',date:'',scene:'courtyard',blessings:[{name:'平安',text:'愿家人身体安康，平凡的每一天都踏实温暖。'},{name:'团圆',text:'不管相隔多远，心里总有一张为你留着的椅子。中秋快乐。'},{name:'顺遂',text:'愿你在自己的日子里，忙有所获，闲有所乐，一切慢慢如愿。'}],message:'又是一年月圆时。\n\n想起家里的茶香，想起桌上切好的月饼，也想起每次团聚时，那些说不完的家常。\n\n无论今晚是在同一张桌前，还是在不同的城市，抬头看月亮的时候，就当我们又坐在了一起。\n\n愿家人平安，愿日子温暖。中秋快乐，来日多团圆。',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,photos:[],audio:null};
let config=structuredClone(initial),draft,view='welcome',slide=0,playing=false,elapsed=0,last=performance.now(),particles=null,memories=[],photoUrls=[],draftUrls=[],audioUrl='',timer,uploadGeneration=0,loadingPhotos=false;
const defaults=[{src:'assets/courtyard.png',title:'记忆里，那盏为我留的灯',caption:'示例画面 · 换成家庭照片，让这份回忆属于你们。'},{src:'assets/lake.png',title:'围坐一起，说些家常',caption:'示例画面 · 有家的地方，就有温暖。'},{src:'assets/mountain.png',title:'隔着山海，也共此时',caption:'示例画面 · 今晚的月光，也照向你。'}];
let slides=defaults;
const skyLanterns=new SkyLanterns($('sky-lanterns'));
const litLanterns=new Set();
const motion=new JourneyMotion(()=>config.reduced);
let shownSlide=0;
const sceneCamera=new SceneCamera({reduced:()=>config.reduced,onMemories:()=>go('memories')});
$('moon-hotspot').onclick=()=>!motion.busy&&sceneCamera.open({kind:'moon',title:'同一轮月亮，同一份牵挂',text:config.message,source:$('moon-hotspot')});
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function stopAudio(){$('memory-audio').pause();$('voice').textContent='♫ 播放你的留言';}
function apply(){
 renderLanterns();
 setScene(config.scene||'courtyard',false);
 photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl='';
 slides=config.photos.length?config.photos.map((p,i)=>{const src=URL.createObjectURL(p.file);photoUrls.push(src);return{src,title:p.caption||`第 ${i+1} 个团圆瞬间`,caption:'一家人珍藏的回忆。'};}):defaults;
 if(config.audio)audioUrl=URL.createObjectURL(config.audio);
 memories=[...slides.map(p=>({...p,type:'photo'})),{type:'note',title:'一封中秋家书',caption:config.message}];if(audioUrl)memories.push({type:'audio',title:'有句话，想亲口说',src:audioUrl,caption:'这是专门为你留下的声音。'});
 particles?.setCards(memories);if(particles)particles.reduced=config.reduced;skyLanterns.reduced=config.reduced;document.body.classList.toggle('reduced',config.reduced);
 $('couple-label').textContent=config.sender+' → '+config.recipient;
 let dayText='月圆人安，岁岁相见';if(config.date){const [y,m,d]=config.date.split('-').map(Number);const now=new Date();const diff=Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(y,m-1,d))/86400000);dayText=diff>=0?`距离上次团圆 ${diff} 天`:`距离那一天还有 ${-diff} 天`;}
 $('days-label').textContent=dayText;$('letter-to').textContent=`亲爱的${config.recipient}，`;$('letter-body').textContent=config.message;$('signature').textContent=config.sender;$('letter-date').textContent=config.date?config.date.replaceAll('-',' · '):'写在月光温柔的今晚';$('ending-caption').textContent='愿人长久，愿家安康。中秋快乐，来日多团圆。';$('voice').hidden=!audioUrl;slide=Math.min(slide,slides.length-1);renderSlide();
}
function renderSlide(){const target=slide,p=slides[target],direction=target>=shownSlide?1:-1;elapsed=0;$('film-progress').style.width='0%';
 $('prev').disabled=target===0;$('next').disabled=target===slides.length-1;
 motion.photo($('slide-image'),p.src,p.title,direction,ok=>{if(!ok){toast('照片暂时无法读取，请重试或更换照片。');setPlaying(false);return;}shownSlide=target;$('slide-title').textContent=p.title;$('slide-caption').textContent=p.caption;$('slide-count').textContent=String(target+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');$('slide-tag').textContent=target===0?'归家':target===slides.length-1?'共此时':'团圆';});}
function setPlaying(value){playing=value;$('play').textContent=value?'Ⅱ 暂停回顾':'▷ 自动回顾';$('play').setAttribute('aria-pressed',String(value));}
function go(next){
 if(!['welcome','lanterns','cinema','memories','letter','ending'].includes(next))return;
 if(['cinema','memories','letter','ending'].includes(next)&&litLanterns.size<config.blessings.length){toast('先把三盏祝福灯点亮，再继续团圆旅程。');next='lanterns';}
 if(motion.busy)return;
 sceneCamera.cancel();
 return motion.change($(view),$(next),()=>{
 if(next!=='memories'){hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';}
 stopAudio();setPlaying(false);if($('memory-dialog').open)$('memory-dialog').close();view=next;document.body.dataset.view=next;document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==next);
 if(particles){particles.active=next==='memories';if(particles.active){spread(0);particles.spread=0;particles.zoom=particles.targetZoom=1;particles.rotation=particles.targetRotation=0;particles.positions.set(particles.targets);particles.resize();particles.update(0,performance.now()/1000);}}
 if(next==='ending'){skyLanterns.start([...litLanterns].map(i=>config.blessings[i].name));$('ending-caption').textContent=`${litLanterns.size} 盏灯，载着心意缓缓升空。愿人长久，愿家安康。`;}else skyLanterns.stop();document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===next));
 });
}
function renderLanterns(){
 $('lantern-list').replaceChildren();
 (config.blessings||initial.blessings).forEach((b,i)=>{const button=document.createElement('button');button.className='reunion-lantern'+(litLanterns.has(i)?' lit':'');button.setAttribute('aria-label','点亮'+b.name+'灯，查看祝福');button.setAttribute('aria-pressed',String(litLanterns.has(i)));const icon=document.createElement('span');icon.className='lantern-glyph';icon.setAttribute('aria-hidden','true');const title=document.createElement('strong');title.textContent=b.name;if(b.name.length>4)title.classList.add('long-inscription');const hint=document.createElement('small');hint.textContent=litLanterns.has(i)?'已点亮 · 再读一次':'轻点，打开一份祝福';icon.append(title);button.append(icon,hint);button.style.setProperty('--sway-delay',(-i*1.7)+'s');button.onclick=()=>{if(sceneCamera.busy)return;litLanterns.add(i);button.classList.add('lit');button.setAttribute('aria-pressed','true');hint.textContent='已点亮 · 再读一次';updateLanternProgress();const nextIndex=config.blessings.findIndex((_,j)=>!litLanterns.has(j));stopAudio();sceneCamera.open({kind:'lamp',index:i,title:b.name+' · 中秋祝福',text:b.text,source:button,actionLabel:'点亮下一盏灯 →',action:nextIndex<0?null:()=>document.querySelectorAll('.reunion-lantern')[nextIndex]?.click()});};$('lantern-list').append(button);});
 sceneCamera.layout();
 updateLanternProgress();
}
function updateLanternProgress(){const complete=litLanterns.size===config.blessings.length;$('lantern-progress').textContent=complete?'三盏灯都亮了。回到月下，翻开团圆相册。':`已点亮 ${litLanterns.size} / 3 盏团圆灯`;$('lantern-next').disabled=!complete;$('lantern-next').textContent=complete?'翻开团圆相册 →':`再点亮 ${config.blessings.length-litLanterns.size} 盏灯，开启相册`;document.querySelectorAll('[data-go=memories],[data-go=letter]').forEach(b=>{b.disabled=!complete;b.title=complete?'':'点亮三盏祝福灯后开启';});}
function renderBlessingFields(){const container=$('blessing-fields');container.replaceChildren();(draft.blessings||initial.blessings).forEach((b,i)=>{const label=document.createElement('label');label.textContent='第 '+(i+1)+' 盏灯 · 署名 / 灯笼题字';const name=document.createElement('input');name.id='blessing-name-'+i;name.value=b.name;name.maxLength=16;name.required=true;const message=document.createElement('textarea');message.id='blessing-text-'+i;message.value=b.text;message.rows=3;message.maxLength=300;message.required=true;message.setAttribute('aria-label','第 '+(i+1)+' 盏灯的祝福');label.append(name,message);container.append(label);});}
function spread(value){if(!particles)return;particles.setSpread(value);$('expand').textContent=value>.5?'收拢回忆 ↙':'展开回忆 ↗';}
function openMemory(i){const item=memories[i];if(!item)return;if(item.type==='note'){sceneCamera.open({kind:'moon',title:item.title,text:item.caption,source:document.activeElement});return;}stopAudio();$('memory-title').textContent=item.title;$('memory-image').hidden=item.type!=='photo';$('memory-audio').hidden=item.type!=='audio';$('memory-text').textContent=item.caption||'';if(item.type==='photo'){$('memory-image').src=item.src;$('memory-image').alt=item.title;}if(item.type==='audio')$('memory-audio').src=item.src;motion.openCard($('memory-dialog'),document.activeElement);}
const scenePresets={
 courtyard:{image:'assets/courtyard.png',title:'同一轮月亮，\n照着想念的人。',description:'把一盏灯点亮，把一家人的心意聚在一起。',hotspot:'点亮团圆灯',palette:'gold'},
 lake:{image:'assets/lake.png',title:'一湖灯火，\n都是团圆的模样。',description:'湖面映着月亮，灯里藏着家人的祝福。',hotspot:'打开湖畔灯笼',palette:'blue'},
 mountain:{image:'assets/mountain.png',title:'纵隔千山，\n也共一轮明月。',description:'把思念寄给月光，愿远方的家人平安。',hotspot:'点亮山间一盏灯',palette:'gold'}
};
let sceneGeneration=0;
async function setScene(name,persist=true){
 const preset=scenePresets[name]||scenePresets.courtyard;name=scenePresets[name]?name:'courtyard';const generation=++sceneGeneration;
 const picker=document.querySelector('.festival-scenes');picker.setAttribute('aria-busy','true');
 try{const image=new Image();image.src=preset.image;await image.decode();if(generation!==sceneGeneration)return;
 if(persist)motion.background($('environment'));
 $('environment').style.backgroundImage=`url('${preset.image}')`;document.body.dataset.scene=name;sceneCamera.setScene(name,image.naturalWidth,image.naturalHeight);
 $('scene-heading').innerText=preset.title;$('scene-description').textContent=preset.description;
 const hotspot=$('scene-hotspot');hotspot.replaceChildren(document.createTextNode(preset.hotspot));const hint=document.createElement('small');hint.textContent='每盏灯，都有一份牵挂';hotspot.append(hint);
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
try{particles=new MemoryParticles($('particle-canvas'),$('photo-orbit'),openMemory);particles.setPalette('gold');particles.setShape('sphere');}catch(e){$('expand').textContent='打开回忆列表';$('hand-toggle').hidden=true;toast('当前设备无法渲染粒子，将使用回忆卡片模式。');console.warn(e);}
apply();
if(!particles){$('photo-orbit').classList.add('fallback-cards');memories.forEach((m,i)=>{const b=document.createElement('button');b.textContent=m.title;b.onclick=()=>openMemory(i);$('photo-orbit').append(b);});}
$('start').onclick=$('projector').onclick=()=>go('lanterns');$('lantern-home').onclick=()=>go('welcome');$('lantern-next').onclick=()=>go('cinema');$('cinema-home').onclick=()=>go('welcome');$('prev').onclick=()=>{slide=Math.max(0,slide-1);renderSlide();};$('next').onclick=()=>{slide=Math.min(slides.length-1,slide+1);renderSlide();};$('play').onclick=()=>{if(!playing&&slide===slides.length-1){slide=0;renderSlide();}setPlaying(!playing);};
$('to-memories').onclick=()=>{spread(0);go('memories');};$('memory-back').onclick=()=>go('cinema');$('to-letter').onclick=()=>go('letter');$('letter-back').onclick=()=>go('memories');$('celebrate').onclick=()=>{if(!litLanterns.size){go('lanterns');toast('先点亮一盏祝福灯，再把心意放飞。');return;}go('ending');};$('replay').onclick=()=>{slide=0;renderSlide();go('welcome');};$('expand').onclick=()=>particles?spread(particles.targetSpread>.5?0:1):openMemory(0);
document.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>{particles?.setShape(b.dataset.shape);document.querySelectorAll('[data-shape]').forEach(p=>p.setAttribute('aria-pressed',String(p===b)));});document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('close-memory').onclick=()=>motion.closeCard($('memory-dialog'));$('memory-dialog').addEventListener('cancel',e=>{e.preventDefault();motion.closeCard($('memory-dialog'));});$('memory-dialog').addEventListener('close',stopAudio);
$('voice').onclick=async()=>{const player=$('memory-audio');if(!player.paused){stopAudio();return;}player.src=audioUrl;try{await player.play();$('voice').textContent='Ⅱ 暂停留言';}catch{toast('录音暂时无法播放，请更换常见音频格式。');}};$('memory-audio').onended=()=>{$('voice').textContent='♫ 播放你的留言';};
function renderDraftPhotos(){draftUrls.forEach(URL.revokeObjectURL);draftUrls=[];$('photo-editor').replaceChildren();draft.photos.forEach((p,i)=>{const row=document.createElement('div');row.className='photo-row';const image=document.createElement('img');image.src=URL.createObjectURL(p.file);draftUrls.push(image.src);image.alt='照片 '+(i+1);const input=document.createElement('input');input.value=p.caption;input.maxLength=70;input.setAttribute('aria-label','第 '+(i+1)+' 张照片的文字');input.oninput=()=>{p.caption=input.value;};const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','移除第 '+(i+1)+' 张照片');remove.onclick=()=>{draft.photos.splice(i,1);renderDraftPhotos();};row.append(image,input,remove);$('photo-editor').append(row);});}
function audioDraftLabel(){$('audio-name').textContent=draft.audio?'已添加：'+(draft.audio.name||'专属录音'):'尚未添加录音';$('remove-audio').hidden=!draft.audio;}
$('edit').onclick=()=>{if(motion.busy)return;sceneCamera.cancel();setPlaying(false);stopAudio();hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';draft=structuredClone(config);$('sender').value=draft.sender;$('recipient').value=draft.recipient;$('date').value=draft.date;$('message').value=draft.message;$('reduced').checked=draft.reduced;$('photos').value='';$('audio').value='';$('save-status').textContent='';renderDraftPhotos();audioDraftLabel();renderBlessingFields();$('settings').showModal();};
$('close-settings').onclick=()=>$('settings').close();$('settings').addEventListener('close',()=>{uploadGeneration++;draftUrls.forEach(URL.revokeObjectURL);draftUrls=[];});
$('photos').onchange=async e=>{const files=[...e.target.files];if(!files.length)return;const generation=++uploadGeneration;loadingPhotos=true;$('save').disabled=true;$('save-status').textContent='正在检查照片…';const accepted=[];for(const file of files.slice(0,8)){if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>8*1024*1024)continue;const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();accepted.push({file,caption:file.name.replace(/\.[^.]+$/,'')});}catch{}finally{URL.revokeObjectURL(url);}}
 if(generation!==uploadGeneration){loadingPhotos=false;$('save').disabled=false;return;}loadingPhotos=false;$('save').disabled=false;if(accepted.length){draft.photos=accepted;renderDraftPhotos();}$('save-status').textContent=accepted.length===files.length?'照片已准备好，保存后生效。':`已接受 ${accepted.length} 张照片；请使用 8 MB 内的 JPG / PNG / WebP，最多 8 张。`;};
$('audio').onchange=e=>{const file=e.target.files[0];if(!file)return;if(!file.type.startsWith('audio/')||file.size>30*1024*1024){$('save-status').textContent='请选择 30 MB 以内的音频文件。';return;}draft.audio=file;audioDraftLabel();};$('remove-audio').onclick=()=>{draft.audio=null;$('audio').value='';audioDraftLabel();};
$('settings-form').onsubmit=async e=>{e.preventDefault();if(loadingPhotos)return;const sender=$('sender').value.trim(),recipient=$('recipient').value.trim();if(!sender||!recipient){$('save-status').textContent='请填写祝福发起人和家庭称呼。';return;}Object.assign(draft,{sender,recipient,blessings:[0,1,2].map(i=>({name:$('blessing-name-'+i).value.trim()||initial.blessings[i].name,text:$('blessing-text-'+i).value.trim()||initial.blessings[i].text})),date:$('date').value,message:$('message').value.trim()||initial.message,reduced:$('reduced').checked});$('save').disabled=true;try{await saveDraft(draft);config=structuredClone(draft);apply();$('settings').close();go('welcome');toast('已保存到当前浏览器。现在开启你们的团圆夜。');}catch{$('save-status').textContent='本机存储失败，可能空间不足或浏览器限制。请减少素材后重试；已有内容未覆盖。';}finally{$('save').disabled=false;}};
let audioContext,gain,sound=false;
$('audio-toggle').onclick=async()=>{try{if(!audioContext){audioContext=new AudioContext();gain=audioContext.createGain();gain.gain.value=0;gain.connect(audioContext.destination);[130.81,196,261.63].forEach((frequency,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=frequency;g.gain.value=.025/(i+1);o.connect(g);g.connect(gain);o.start();});}sound=!sound;if(sound)await audioContext.resume();gain.gain.setTargetAtTime(sound?.5:0,audioContext.currentTime,.5);$('audio-toggle').textContent=sound?'♫ 环境音开':'♫ 环境音关';$('audio-toggle').setAttribute('aria-pressed',String(sound));}catch{toast('环境音暂时无法播放。');}};
function frame(now){const dt=Math.min((now-last)/1000,.06);last=now;if(!document.hidden){particles?.update(dt,now/1000);skyLanterns.update(dt);if(playing&&view==='cinema'){elapsed+=dt;$('film-progress').style.width=Math.min(elapsed/6*100,100)+'%';if(elapsed>=6){if(slide<slides.length-1){slide++;renderSlide();}else setPlaying(false);}}}requestAnimationFrame(frame);}requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden){hands.stop();$('hand-preview').hidden=true;$('hand-status').hidden=true;$('hand-toggle').textContent='✋ 开启手势';setPlaying(false);stopAudio();audioContext?.suspend();}else if(sound)audioContext?.resume();});window.addEventListener('pagehide',()=>{sceneCamera.cancel();hands.dispose();stopAudio();audioContext?.close();photoUrls.forEach(URL.revokeObjectURL);draftUrls.forEach(URL.revokeObjectURL);if(audioUrl)URL.revokeObjectURL(audioUrl);});
