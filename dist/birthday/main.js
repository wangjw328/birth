import {StarseaExperience} from './starsea.js?v=22';
import {canExploreObservation} from './starsea-config.mjs?v=21';
import {AuroraTerraceExperience} from './aurora-terrace.js?v=24';
import {ParticleWish} from './particle-wish.js';
import {SCENES} from './scene-presets.mjs';
import {BirthdayJourney} from './journey.mjs';
const journey=new BirthdayJourney();
import {BirthdayRoom} from './photographic-room.js?v=11';
import {FlowMemoryParticles as MemoryParticles} from './flow-particles.js?v=20';
import {HandControls} from './hands.js?v=3';
import {WindowFireworks} from './window-fireworks.js?v=11';
import {BirthdayMotion} from './birthday-motion.js';
import {setupMediaEditor} from './media-editor.js';
const $=id=>document.getElementById(id);
let room,particles,view='entry',last=performance.now(),toastTimer,selected=0;
let lastPinch=0,lastGesture='',gestureX=.5,gestureY=.5;
let holding=false,holdSource='pointer',holdStart=0,holdFrame=0,wishDone=false,completionTimer=0;
let soundOn=false,audioContext=null,masterGain=null;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const config={recipient:'亲爱的你',message:'愿你永远有热爱，也有被爱的底气。',note:'这一年，你已经做得很好了。接下来的日子，也请记得把温柔留给自己。'};
let memories=[
 {type:'photo',title:'一起等过的极光',src:'./assets/aurora.png',caption:'示例风景 · 换成你们自己的照片，这里就有了特别的意义。'},
 {type:'photo',title:'某个安静的夜晚',src:'../assets/garden.webp',caption:'示例风景 · 那些看似平凡的日子，其实一直在发光。'},
 {type:'photo',title:'把星光留在身边',src:'./assets/cake-texture.png',caption:'示例画面 · 一些小小的光，拼成了这一年的你。'},
 {type:'audio',title:'有句话，想亲口说',src:'',caption:'生日快乐。愿你在新的一岁，拥有慢慢来、也能走很远的勇气。也愿你知道，总有人，认真地把你放在心上。'},
 {type:'note',title:'写给这一年的你',caption:config.note}
];
let fireworks,finale,starsea,auroraTerrace;const motion=new BirthdayMotion(()=>reduced);let mediaTicket=0;
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3800);}
function stopVoice(){window.speechSynthesis?.cancel();$('voice-player').pause();$('media-audio').classList.remove('playing');$('play-voice').textContent='播放这段留言 ▷';}
function syncJourney(){
 const guided=!journey.completed||(view==='ending'&&!finale?.complete);
 document.body.dataset.guided=String(guided);
 const starAllowed=canExploreObservation({completed:journey.completed,scene:room?.sceneName,view,finaleComplete:finale?.complete});
 $('explore-starsea').hidden=!(starAllowed&&view==='ending');$('room-starsea').hidden=!(starAllowed&&view==='room');
 const auroraView=room?.sceneName==='aurora';$('explore-starsea').textContent=auroraView?'窗外还有一片极光 ↗':'身后还有一片星海 ↗';$('room-starsea').textContent=auroraView?'推开窗，去极光露台 ↗':'转身，去探索星海 ↗';
 $('home').disabled=guided;$('replay').hidden=view==='ending'&&!finale?.complete;
 $('customize').hidden=guided&&view!=='entry';
 for(const id of ['room-reset','cake-back','back-room'])$(id).hidden=guided||view==='entry';
 document.querySelectorAll('[data-object="cake"],[data-object="window"]').forEach(el=>el.hidden=guided);
 const unread=journey.nextUnread(memories.length);
 $('read-memory').hidden=!guided||unread<0;
 $('read-memory').textContent=journey.seen.size?'继续下一段回忆 →':'打开第一段回忆 →';
 $('memory-next').disabled=guided&&unread>=0;
 $('memory-progress').textContent=guided?`${journey.seen.size} / ${memories.length} 段回忆`:'可自由回看';
 $('journey-status').textContent=!guided?'旅程完成，可自由回看':({entry:'从回忆开始',room:'先走近回忆墙',memory:'读完回忆，再去点烛',cake:'点亮烛光，许下愿望',ending:'看完花火，等待星光汇聚'})[view];
 $('prev-media').disabled=!journey.completed&&selected===0;
 $('next-media').textContent=!journey.completed&&selected===memories.length-1?(unread<0?'读完了，去点烛 →':'继续未读回忆 →'):'下一段 →';
}
function go(next){
 if(motion.busy||!room||!['entry','room','memory','cake','window','ending'].includes(next))return;
 if(view==='ending'&&!finale?.complete)return;
 if(!journey.canGo(view,next,{count:memories.length,wishDone}))return;
 mediaTicket++;stopHold();clearTimeout(completionTimer);stopVoice();if($('media-dialog').open)$('media-dialog').close();
 room.setView(next);return motion.chapter(()=>{
 view=next;document.body.dataset.view=next;
 for(const [id,v] of Object.entries({entry:'entry','room-ui':'room','memory-ui':'memory','cake-ui':'cake','ending-ui':'ending'}))$(id).hidden=next!==v;
 $('memory-stage').hidden=next!=='memory';$('room-reset').hidden=next==='entry';room.setView(next);particles.active=next==='memory';
 if(next==='memory'){particles.resetFlow();setSpread(0);particles.spread=0;particles.zoom=particles.targetZoom=1;particles.rotation=particles.targetRotation=0;particles.positions.set(particles.targets);particles.resize();particles.update(0,performance.now()/1000);$('memory-stage').animate([{opacity:0},{opacity:1}],{duration:reduced?150:1100,delay:reduced?0:350,fill:'backwards'});}if(next==='ending'){fireworks.start();finale.start(config.recipient);}else{fireworks.stop();finale.stop();delete document.body.dataset.finale;}
 if(next==='entry'){room.setLit(false);wishDone=false;}if(next==='cake')updateCakeUI();
 const progress=next==='memory'?1:['cake','ending'].includes(next)?2:0;
 document.querySelectorAll('.view-dots i').forEach((el,i)=>el.classList.toggle('active',i===progress));
 $('footer-message').textContent=({entry:'一间房，一场只属于你的生日。',room:'点选发光物件，发现藏起来的心意。',window:SCENES[room.sceneName].description,memory:'每一颗微光，都藏着一个瞬间。',cake:'愿这一束光，照亮新的一岁。',ending:'烟花之后，还有一句话想送给你。'})[next];lastGesture='';syncJourney();
 });
}
function updateCakeUI(){
 const lit=room.lit;$('light-candle').disabled=false;$('light-candle').hidden=lit;$('wish-button').hidden=!lit;$('wish-simple').hidden=!lit;
 $('wish-button').disabled=false;$('wish-simple').disabled=false;document.querySelector('.wish-progress').hidden=!lit;
 $('cake-heading').innerText=lit?'愿望，\n就在你的掌心。':'坐下来，\n点亮这一岁。';
 $('cake-description').textContent=lit?'握拳停留 3 秒，或按住下方按钮。':`窗外是${SCENES[room.sceneName].view}。轻点按钮，点亮蜡烛。`;
 $('wish-progress-bar').style.width='0%';wishDone=false;
}
function setSpread(v){if(!particles)return;particles.setSpread(v);$('spread').value=String(Math.round(v*100));$('spread-value').textContent=Math.round(v*100)+'%';$('expand').textContent=v>.5?'收拢回忆 ↙':'展开回忆 ↗';}
async function lightCandle(){if(view!=='cake'||room.lit||room.igniting)return;$('light-candle').disabled=true;$('light-candle').textContent='烛光正在亮起…';try{const done=await room.ignite();if(done&&view==='cake'){updateCakeUI();chime();toast('灯光暗下来，烛光为你而亮。');}}finally{$('light-candle').disabled=false;$('light-candle').textContent='点亮蜡烛 ✧';}}
function startHold(source='pointer'){
 if(view!=='cake'||room.igniting||!room.lit||holding||wishDone||$('settings').open)return;
 holding=true;holdSource=source;holdStart=performance.now();
 const tick=now=>{if(!holding)return;const amount=Math.min((now-holdStart)/3000,1);$('wish-progress-bar').style.width=amount*100+'%';$('wish-button').textContent=amount>.65?'快了，愿望正在发光…':'把愿望握在掌心…';if(amount===1)completeWish();else holdFrame=requestAnimationFrame(tick);};
 holdFrame=requestAnimationFrame(tick);
}
function stopHold(){holding=false;cancelAnimationFrame(holdFrame);if(!wishDone){$('wish-progress-bar').style.width='0%';$('wish-button').textContent='按住 3 秒，许下愿望';}}
function completeWish(){
 if(view!=='cake'||room.igniting||!room.lit||wishDone)return;wishDone=true;stopHold();$('wish-progress-bar').style.width='100%';$('wish-button').textContent='愿望已送达';$('wish-button').disabled=true;$('wish-simple').disabled=true;chime();
 completionTimer=setTimeout(()=>{room.setLit(false);go('ending');},reduced?200:1000);
}
async function openMemory(index){
 if(!memories.length||view!=='memory'||motion.closing||motion.busy)return;if(!journey.completed&&(index<0||index>=memories.length))return;const target=(index+memories.length)%memories.length,direction=index>=selected?1:-1;selected=target;const item=memories[target],ticket=++mediaTicket;stopVoice();
 if(item.type==='photo'){const image=new Image();image.src=item.src;try{await image.decode();}catch{toast('这张照片暂时无法读取。');return;}}
 if(ticket!==mediaTicket||view!=='memory')return;const dialog=$('media-dialog'),source=document.activeElement;
 const commit=()=>{journey.visit(target);syncJourney();$('media-heading').textContent=item.title;$('media-caption').textContent=item.caption||'';$('media-photo').hidden=item.type!=='photo';$('media-audio').hidden=item.type!=='audio';
 $('media-kicker').textContent=({photo:'这一刻',audio:'想亲口说',note:'写给你的话'})[item.type];
 if(item.type==='photo'){$('media-photo').src=item.src;$('media-photo').alt=item.title;}
 if(item.type==='audio'){$('voice-player').hidden=!item.src;$('play-voice').hidden=!!item.src;if(item.src)$('voice-player').src=item.src;else{$('voice-player').removeAttribute('src');$('voice-player').load();}}
 $('media-index').textContent=String(target+1).padStart(2,'0')+' / '+String(memories.length).padStart(2,'0');};
 if(dialog.open)motion.flip($('media-content'),commit,direction);else{commit();motion.open(dialog,source);}
}
function applyReduced(){reduced=$('low-motion').checked;document.body.classList.toggle('reduced',reduced);if(room)room.reduced=reduced;if(particles)particles.reduced=reduced;if(fireworks)fireworks.reduced=reduced;if(finale)finale.reduced=reduced;}
try{
 room=new BirthdayRoom($('room-stage'));await room.ready;room.resize();fireworks=new WindowFireworks(room.scene);finale=new ParticleWish($('particle-wish'),phase=>{document.body.dataset.finale=phase;if(phase!=='fireworks')fireworks.stop();if(phase==='complete')journey.completed=true;syncJourney();$('journey-status').textContent=phase==='fireworks'?'窗前花火正在盛放':phase==='gathering'?'星光正在写下祝福':'旅程完成，可自由回看';$('footer-message').textContent=phase==='complete'?'Happy Birthday '+config.recipient:phase==='gathering'?'每一颗微光，都在拼出你的名字。':'烟花之后，还有一句话想送给你。';});room.setMemories(memories);
 particles=new MemoryParticles($('particle-canvas'),$('photo-orbit'),openMemory);particles.setCards(memories);particles.resize();
 $('low-motion').checked=reduced;applyReduced();$('enter').disabled=false;$('enter-label').textContent='走进今晚的房间';
 function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){if(starsea?.active||auroraTerrace?.active){if(starsea?.root.dataset.state==='loading'||auroraTerrace?.root.dataset.state==='entry')room.update(dt,now/1000);starsea?.update(dt);auroraTerrace?.update(dt);requestAnimationFrame(frame);return;}fireworks.update(dt);finale.update(dt);room.update(dt,now/1000);particles.reading=$('media-dialog').open;particles.update(dt,now/1000);if(view==='room')for(const name of ['memory','cake','window']){const p=room.project(name),el=$('hot-'+name);if(!el.matches(':hover,:focus-visible')){el.style.left=Math.round(p.x)+'px';el.style.top=Math.round(p.y)+'px';}el.style.opacity=p.visible?'1':'0';el.style.pointerEvents=p.visible?'auto':'none';el.tabIndex=p.visible?0:-1;}}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}catch(e){console.error(e);$('fatal').hidden=false;$('enter-label').textContent='房间暂时无法打开';}
const beforeObservation=async()=>{stopVoice();stopHold();hands.stop();document.body.classList.remove('hand-active');$('gesture-label').firstChild.textContent='开启手势';if(view!=='room')await go('room');room.setView('room');};
const afterObservation=()=>{syncJourney();$('room-starsea').focus();};
starsea=new StarseaExperience({getReduced:()=>reduced,beforeOpen:beforeObservation,onReturn:afterObservation});
auroraTerrace=new AuroraTerraceExperience({getReduced:()=>reduced,getName:()=>config.recipient,beforeOpen:beforeObservation,onReturn:afterObservation});
const openObservation=()=>{if(motion.busy||!canExploreObservation({completed:journey.completed,scene:room?.sceneName,view,finaleComplete:finale?.complete}))return;(room.sceneName==='aurora'?auroraTerrace:starsea).open();};
$('explore-starsea').onclick=openObservation;$('room-starsea').onclick=openObservation;
$('enter').onclick=()=>go('room');$('home').onclick=()=>go('entry');$('room-reset').onclick=()=>go('room');
$('hot-window').onclick=()=>go('window');$('hot-cake').onclick=()=>go('cake');$('hot-memory').onclick=()=>{setSpread(0);go('memory');};
document.querySelectorAll('.room-shortcuts [data-object]').forEach(button=>button.onclick=()=>{const target=button.dataset.object;if(target==='memory')setSpread(0);go(target);});
$('cake-back').onclick=()=>go('room');$('back-room').onclick=()=>go('room');$('memory-next').onclick=()=>go('cake');$('replay').onclick=()=>{room.setLit(false);go('room');};
$('light-candle').onclick=lightCandle;$('wish-simple').onclick=completeWish;
const wishButton=$('wish-button');
wishButton.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();wishButton.setPointerCapture(e.pointerId);startHold();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])wishButton.addEventListener(event,stopHold);
wishButton.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)startHold();}});
wishButton.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();stopHold();}});wishButton.addEventListener('blur',stopHold);window.addEventListener('blur',stopHold);
document.querySelectorAll('[data-shape]').forEach(button=>button.onclick=()=>{particles.setShape(button.dataset.shape);document.querySelectorAll('[data-shape]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
document.querySelectorAll('[data-palette]').forEach(button=>button.onclick=()=>{particles.setPalette(button.dataset.palette);document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
$('expand').onclick=()=>setSpread(particles.targetSpread>.5?0:1);$('spread').oninput=e=>setSpread(Number(e.target.value)/100);
$('close-media').onclick=()=>{mediaTicket++;motion.close($('media-dialog'));};$('media-dialog').addEventListener('cancel',e=>{e.preventDefault();mediaTicket++;motion.close($('media-dialog'));});$('media-dialog').addEventListener('close',stopVoice);$('prev-media').onclick=()=>openMemory(selected-1);$('next-media').onclick=async()=>{if(!journey.completed&&selected===memories.length-1){mediaTicket++;await motion.close($('media-dialog'));if(journey.nextUnread(memories.length)<0)go('cake');else openMemory(journey.nextUnread(memories.length));}else openMemory(selected+1);};
$('read-memory').onclick=()=>openMemory(Math.max(0,journey.nextUnread(memories.length)));
$('voice-player').addEventListener('play',()=>$('media-audio').classList.add('playing'));$('voice-player').addEventListener('pause',()=>$('media-audio').classList.remove('playing'));$('voice-player').addEventListener('ended',()=>$('media-audio').classList.remove('playing'));
$('play-voice').onclick=()=>{
 if(!('speechSynthesis'in window)){toast('当前浏览器不支持示例朗读，请在布置房间中上传自己的录音。');return;}
 if(speechSynthesis.speaking){stopVoice();return;}
 const utterance=new SpeechSynthesisUtterance(memories[selected].caption);utterance.lang='zh-CN';utterance.rate=.83;utterance.pitch=.95;
 const voices=speechSynthesis.getVoices(),voice=voices.find(v=>v.lang==='zh-CN')||voices.find(v=>v.lang.startsWith('zh'));if(voice)utterance.voice=voice;
 utterance.onend=utterance.onerror=()=>{$('media-audio').classList.remove('playing');$('play-voice').textContent='再听一次 ▷';};
 speechSynthesis.speak(utterance);$('media-audio').classList.add('playing');$('play-voice').textContent='停止留言 Ⅱ';
};
const mediaEditor=setupMediaEditor({setMemories:value=>{stopVoice();memories=value;journey.seen.clear();particles.setCards(memories);room.setMemories(memories);},config,toast,onSave:()=>{$('name-display').textContent=config.recipient;$('ending-text').textContent=config.message;applyReduced();syncJourney();if(view!=='entry')go('room');},beforeOpen:()=>{stopHold();stopVoice();room?.cancelIgnition();if(view==='cake'&&!wishDone)updateCakeUI();}});
for(const dialog of [$('settings'),$('media-dialog')])dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){if(dialog.id==='media-dialog'){mediaTicket++;motion.close(dialog);}else dialog.close();}});
async function toggleSound(){
 try{if(!audioContext){audioContext=new AudioContext();masterGain=audioContext.createGain();masterGain.gain.value=0;masterGain.connect(audioContext.destination);for(const [i,f]of [130.81,196,261.63,329.63].entries()){const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=f;g.gain.value=.045/(i+1);o.connect(g);g.connect(masterGain);o.start();}}
 soundOn=!soundOn;if(soundOn)await audioContext.resume();masterGain.gain.setTargetAtTime(soundOn?.4:0,audioContext.currentTime,.5);$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').querySelector('span').textContent=soundOn?'声音开':'声音关';
 }catch{soundOn=false;toast('声音暂时无法播放。');}
}
function chime(){if(!audioContext||!soundOn)return;[523.25,659.25,783.99].forEach((f,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.18;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+2);o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+2.1);});}
$('sound').onclick=toggleSound;
let sceneRequest=0;
const scenePicker=document.querySelector('.scene-picker');
const sceneToggle=$('scene-toggle');
sceneToggle.onclick=()=>{
 const expanded=!scenePicker.classList.contains('expanded');
 scenePicker.classList.toggle('expanded',expanded);sceneToggle.setAttribute('aria-expanded',String(expanded));
};
document.querySelectorAll('.scene-picker [data-scene]').forEach(button=>button.onclick=async()=>{
 if(starsea?.active||auroraTerrace?.active||!room||motion.busy||room.igniting||(!journey.completed&&view!=='entry'&&view!=='room'))return;const request=++sceneRequest;
 document.querySelector('.scene-picker').classList.add('loading');
 try{const changed=await room.setScene(button.dataset.scene);if(request!==sceneRequest||!changed)return;
 document.querySelectorAll('.scene-picker [data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 sceneToggle.firstChild.textContent='风景：'+button.textContent.trim()+' ';
 scenePicker.classList.remove('expanded');sceneToggle.setAttribute('aria-expanded','false');
 document.body.dataset.scene=button.dataset.scene;$('scene-description').textContent=SCENES[button.dataset.scene].description;fireworks.cosmic=room.isShip;syncJourney();
 document.querySelector('.brand small').textContent=SCENES[room.sceneName].subtitle;
 document.querySelector('#ending-ui>p').textContent=room.isShip?'停在舷窗前，让星光为你的愿望绽放。':'走到窗前，今晚的花火为你盛放。';
 if(view==='cake')updateCakeUI();
 $('footer-message').textContent=button.textContent+' · 今晚的风景，为你停留。';
 }catch{toast('这片风景暂时未加载成功，请再试一次。');}
 finally{if(request===sceneRequest)document.querySelector('.scene-picker').classList.remove('loading');}
});
document.addEventListener('pointerdown',event=>{if(!scenePicker.contains(event.target)){scenePicker.classList.remove('expanded');sceneToggle.setAttribute('aria-expanded','false');}});
function status(s){$('gesture-status').hidden=false;$('gesture-status').textContent=s;$('camera-help').hidden=!/Chrome|权限|摄像头被占用|未检测|无法|失败/.test(s);}
const hands=new HandControls($('hand-video'),data=>{
 if(!data){$('hand-cursor').hidden=true;lastGesture='';if(holding&&holdSource==='gesture')stopHold();if(!hands.active&&!hands.loading){document.body.classList.remove('hand-active');$('gesture-label').firstChild.textContent='开启手势';}return;}
 gestureX+=(data.x-gestureX)*.5;gestureY+=(data.y-gestureY)*.5;const x=Math.max(0,Math.min(innerWidth-1,gestureX*innerWidth)),y=Math.max(0,Math.min(innerHeight-1,gestureY*innerHeight));
 $('hand-cursor').hidden=false;$('hand-cursor').style.left=x+'px';$('hand-cursor').style.top=y+'px';$('hand-cursor').classList.toggle('pinched',data.pinch);if($('settings').open)return;
 if(view==='memory'&&!$('media-dialog').open){if(data.stable&&data.open)setSpread(1);if(data.stable&&data.fist)setSpread(0);if(data.zoom)particles.setZoom(data.zoom);else particles.targetRotation=(data.palmX-.5)*2.2;}
 if(view==='cake'&&!$('media-dialog').open&&room.lit){if(data.stable&&data.fist)startHold('gesture');else if(holding&&holdSource==='gesture'&&!data.fist)stopHold();}
 if(data.stable&&data.pinch&&lastGesture!=='pinch'&&data.timestamp-lastPinch>850){lastPinch=data.timestamp;let target=document.elementFromPoint(x,y)?.closest('button');if(!target){let nearest=65;for(const button of document.querySelectorAll('button')){const r=button.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(button).visibility==='hidden'||button.closest('[hidden]')||button.getAttribute('aria-hidden')==='true')continue;const distance=Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));if(distance<nearest){nearest=distance;target=button;}}}if(target&&target!==$('gesture-toggle')&&!target.disabled){target.click();}else if(view==='cake'&&!room.lit){const p=room.project('cake');if(Math.hypot(p.x-x,p.y-y)<130)lightCandle();}}
 if(data.stable)lastGesture=data.name;
},status);
$('gesture-toggle').onclick=async()=>{
 if(hands.active||hands.loading){hands.stop();document.body.classList.remove('hand-active');$('gesture-label').firstChild.textContent='开启手势';$('gesture-status').hidden=true;$('camera-help').hidden=true;return;}
 $('gesture-label').firstChild.textContent='准备手势…';try{await hands.start();if(hands.active){document.body.classList.add('hand-active');$('gesture-label').firstChild.textContent='关闭手势';}}catch{$('gesture-label').firstChild.textContent='开启手势';}
};
window.addEventListener('pointermove',e=>{if(room&&!$('settings').open)room.mouse={x:(e.clientX/innerWidth-.5)*2,y:-(e.clientY/innerHeight-.5)*2};});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHold();stopVoice();room?.cancelIgnition();if(view==='cake'&&!wishDone)updateCakeUI();audioContext?.suspend();mediaEditor.stopRecording();if(hands.active){hands.stop();status('页面离开后摄像头已关闭，需要时可重新开启。');}}else if(soundOn)audioContext?.resume().catch(()=>{});});
window.addEventListener('pagehide',()=>{starsea?.dispose();auroraTerrace?.dispose();hands.dispose();mediaEditor.dispose();stopVoice();audioContext?.close();});

syncJourney();





