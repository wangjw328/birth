import {canExploreObservation} from './starsea-config.mjs?v=26';
import {ParticleWish} from './particle-wish.js?v=3';
import {SCENES} from './scene-presets.mjs?v=31';
import {BirthdayJourney} from './journey.mjs';
const journey=new BirthdayJourney();
import {BirthdayRoom} from './photographic-room.js?v=16';
import {FlowMemoryParticles as MemoryParticles} from './flow-particles.js?v=21';
import {HandControls} from './hands.js?v=4';
import {WindowFireworks} from './window-fireworks.js?v=20';
import {BirthdayMotion} from './birthday-motion.js?v=3';
import {setupMediaEditor} from './media-editor.js?v=7';
import {FirstVisitGuide} from './first-visit-guide.js?v=8';
import {SCENE_STORY,RELATIONSHIP_COPY,recipientMemories} from './story-content.mjs?v=2';
import {InteractionSounds} from './interaction-sounds.js?v=1';
import {saveDraft,loadDraft} from './draft-store.mjs?v=2';
import {buildGiftPackage} from './gift-package.mjs?v=2';
const $=id=>document.getElementById(id);
document.querySelector('.header-tools').insertAdjacentHTML('beforeend','<button class="icon-label" id="edit-preview" type="button" hidden>返回布置</button><button class="icon-label" id="export-gift" type="button" hidden>导出礼物</button>');
document.querySelector('#entry>p').id='entry-lead';
document.querySelector('#settings-form').insertAdjacentHTML('afterbegin',`<label>想用怎样的语气？<small>选择建议文案后仍可自行修改</small><select id="relationship-input"><option value="gentle">温柔通用</option><option value="friend">送给朋友</option><option value="love">送给爱人</option><option value="family">送给家人</option><option value="self">送给自己</option></select></label><fieldset class="memory-choice"><legend>这次想留下什么？</legend><p>只选需要的内容，回忆会按选中的顺序呈现。</p><div class="memory-choice-grid"><label><input id="include-photo" type="checkbox" data-memory-toggle="photo"> 照片</label><label><input id="include-audio" type="checkbox" data-memory-toggle="audio"> 录音</label><label><input id="include-note" type="checkbox" data-memory-toggle="note" checked> 书信</label><label><input id="include-object" type="checkbox" data-memory-toggle="object" checked> 记忆小物件</label><label><input id="include-secret" type="checkbox" data-memory-toggle="secret" checked> 你们的暗号</label></div><small id="memory-choice-help">照片和录音需要先加入自己的素材；未替换的示例不会送出。</small></fieldset><label>一件有故事的小物件<small>可以是一张票、一只杯子或一本书</small><input id="object-name-input" maxlength="30" value="一张留在口袋里的票"></label><label>它承载的一句话<input id="object-story-input" maxlength="100" value="愿下一段旅程，仍有让你期待的风景。"></label><label>只有你们懂的暗号<input id="secret-word-input" maxlength="30" value="今晚的暗号"></label><label>轻触暗号后出现的话<input id="secret-answer-input" maxlength="100" value="答案是：你值得被认真爱着。"></label>`);
document.querySelector('#settings-form>.settings-options').insertAdjacentHTML('beforebegin','<p class="story-preview-note">保存后进入收礼预览。未替换的示例照片和示例朗读不会出现在收礼视角；素材仅留在当前页面。</p>');
document.querySelector('.settings-header').insertAdjacentHTML('beforeend','<button type="button" id="restore-draft" class="secondary" hidden>恢复本机草稿</button>');
document.querySelector('#settings-form>[type=submit]').innerHTML='保存草稿 · 预览收礼版 <b>↗</b>';
document.querySelector('#media-caption').insertAdjacentHTML('beforebegin',`<div id="media-object" class="story-reveal" hidden><button id="turn-object" class="story-object" type="button" aria-label="翻开记忆小物件"><span class="story-object-front"><i>✧</i><strong id="object-face"></strong><small>轻触翻开</small></span><span class="story-object-back" aria-hidden="true"><small>留在这里的一句话</small><strong id="object-back"></strong></span></button></div><div id="media-secret" class="story-reveal" hidden><button id="reveal-secret" class="story-secret" type="button"><span id="secret-face"></span><small>轻触，让暗号慢慢显现</small><strong id="secret-back" aria-hidden="true"></strong></button></div>`);
document.querySelector('#hot-memory small').textContent='故事 · 心意';
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="./birthday-story.css?v=9">');
let room,particles,view='entry',last=performance.now(),toastTimer,selected=0;
const publishedGift=window.__BIRTHDAY_GIFT__||null;
let recipientPreview=false,editorMemories=null;
let memoryPaletteTouched=false;
const sceneMemoryPalette={aurora:'blue',sunset:'gold',garden:'rose',rings:'gold',starlake:'blue'};
function applyMemoryPalette(){if(!particles||memoryPaletteTouched)return;const name=sceneMemoryPalette[room?.sceneName]||'gold';particles.setPalette(name);document.querySelectorAll('[data-palette]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.palette===name)));}
let lastPinch=0,lastGesture='',gestureX=.5,gestureY=.5;
let holding=false,holdSource='pointer',holdStart=0,holdFrame=0,wishDone=false,completionTimer=0;
let soundOn=false;const sfx=new InteractionSounds();
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const guide=new FirstVisitGuide({version:5,reduced:()=>reduced});
const config={entryTitle:SCENE_STORY.aurora.title,entryTitleEdited:false,footerText:'一间房，一场只属于你的生日。',recipient:'亲爱的你',message:RELATIONSHIP_COPY.gentle.message,note:'这一年，你已经做得很好了。接下来的日子，也请记得把温柔留给自己。',objectName:'一张留在口袋里的票',objectStory:'愿下一段旅程，仍有让你期待的风景。',secretWord:'今晚的暗号',secretAnswer:'答案是：你值得被认真爱着。',includedMemories:{photo:false,audio:false,note:true,object:true,secret:true}};
if(publishedGift)Object.assign(config,publishedGift.config);
let memories=[
 {type:'object',title:config.objectName,caption:config.objectStory},
 {type:'photo',title:'一起等过的极光',src:'./assets/aurora.png',caption:'今晚的光，替我们记住这一刻。',sample:true},
 {type:'secret',title:config.secretWord,caption:config.secretAnswer},
 {type:'audio',title:'有句话，想亲口说',src:'',caption:'生日快乐。愿你在新的一岁，拥有慢慢来、也能走很远的勇气。',sample:true},
 {type:'note',title:'写给这一年的你',caption:config.note}
];
editorMemories=memories;
if(publishedGift){memories=publishedGift.memories;editorMemories=memories;}
$('entry-title').textContent=config.entryTitle;$('entry-title-input').value=config.entryTitle;$('entry-lead').textContent=SCENE_STORY.aurora.lead;$('message-input').value=config.message;
let fireworks,finale,starsea,auroraTerrace,moonlitPier,moonGarden,lakeMirror;const motion=new BirthdayMotion(()=>reduced);let mediaTicket=0;
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3800);}
function setRecipientPreview(enabled){
 if(enabled===recipientPreview)return;
 recipientPreview=enabled;document.body.dataset.recipientPreview=String(enabled);
 memories=enabled?recipientMemories(editorMemories,config.includedMemories):editorMemories;
 journey.completed=false;journey.seen.clear();selected=0;wishDone=false;room?.setLit(false);
 particles?.setCards(memories);room?.setMemories(memories);syncJourney();
 scheduleQuietUI();
}
let quietUITimer;
function scheduleQuietUI(){clearTimeout(quietUITimer);document.body.classList.remove('ui-idle');if(recipientPreview&&!reduced)quietUITimer=setTimeout(()=>document.body.classList.add('ui-idle'),6500);}
for(const event of ['pointermove','pointerdown','touchstart','keydown'])window.addEventListener(event,scheduleQuietUI,{passive:true});
const fullscreenButton=$('fullscreen');
function syncFullscreenButton(){
 const active=Boolean(document.fullscreenElement);
 fullscreenButton.setAttribute('aria-label',active?'退出全屏':'进入全屏');
 fullscreenButton.title=active?'退出全屏':'进入全屏';
 fullscreenButton.querySelector('span').textContent=active?'退出全屏':'全屏';
}
fullscreenButton.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});
  else{toast('当前浏览器不支持网页全屏。请用浏览器打开，或将网页添加到主屏幕。');return;}
  syncFullscreenButton();
 }catch{toast('当前浏览器限制了网页全屏。请用浏览器打开，或将网页添加到主屏幕。');}
});
document.addEventListener('fullscreenchange',syncFullscreenButton);
function stopVoice(){window.speechSynthesis?.cancel();$('voice-player').pause();$('media-audio').classList.remove('playing');$('play-voice').textContent='播放这段留言 ▷';}
function syncJourney(){
 const guided=!journey.completed||(view==='ending'&&!finale?.complete);
 document.body.dataset.guided=String(guided);
 const starAllowed=canExploreObservation({completed:journey.completed,scene:room?.sceneName,view,finaleComplete:finale?.complete});
 $('explore-starsea').hidden=!(starAllowed&&view==='ending');$('room-starsea').hidden=!(starAllowed&&view==='room');
 const observationLabels={aurora:['窗外还有一片极光 ↗','推开窗，去极光露台 ↗'],sunset:['海上有一条月光栈桥 ↗','去海上月光栈桥 ↗'],garden:['花房外有一座流萤庭 ↗','推开花房，去流萤庭 ↗'],starlake:['湖心还有一座星镜台 ↗','沿着湖光，去星镜台 ↗'],rings:['身后还有一片星海 ↗','转身，去探索星海 ↗']};const labels=observationLabels[room?.sceneName]||observationLabels.rings;$('explore-starsea').textContent=labels[0];$('room-starsea').textContent=labels[1];
 $('home').disabled=guided;$('replay').hidden=view==='ending'&&!finale?.complete;
 $('customize').hidden=recipientPreview||(guided&&view!=='entry');
 $('edit-preview').hidden=Boolean(publishedGift)||!recipientPreview||view!=='entry';
 $('export-gift').hidden=Boolean(publishedGift)||!recipientPreview||view!=='entry';
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
function guideForView(){
 if(!guide.enabled||$('settings').open||$('media-dialog').open||motion.busy)return;
 if(view==='entry'){guide.show({id:'entry',target:$('enter'),label:'轻触入口，走进生日房间'});return;}
 if(view==='room'&&!journey.completed){guide.show({id:'room-memory',target:$('hot-memory'),label:'跟随微光，轻触回忆墙'});return;}
 if(view==='memory'&&!journey.completed){
  if(!guide.has('memory-expand'))guide.show({id:'memory-expand',target:$('expand'),label:'轻触展开回忆，也可以拖动星光'});
  else guide.show({id:'memory-open',target:$('read-memory'),label:'轻触按钮，打开第一段回忆'});
  return;
 }
 if(view==='cake'&&!journey.completed){
  if(!room?.lit)guide.show({id:'candle',target:$('light-candle'),label:'轻触按钮，点亮蜡烛'});
  else guide.show({id:'wish',target:$('wish-button'),label:'按住三秒许愿，或轻点下方按钮'});
  return;
 }
 if(journey.completed&&['room','ending'].includes(view)){
  const target=$(view==='room'?'room-starsea':'explore-starsea');
  guide.show({id:`observation-entry-${room?.sceneName}`,target,label:'跟随微光，去看看房间外的风景'});
 }
}
const guideLandscape=matchMedia('(orientation:landscape)');
function startGuide(){if(!guideLandscape.matches){guide.hide();return;}setTimeout(guideForView,reduced?20:180);}
guideLandscape.addEventListener?.('change',startGuide);
function go(next,{force=false}={}){
 if(motion.busy||!room||!['entry','room','memory','cake','window','ending'].includes(next))return;
 if(view==='ending'&&!finale?.complete&&!force)return;
 if(!force&&!journey.canGo(view,next,{count:memories.length,wishDone}))return;
 guide.hide();mediaTicket++;stopHold();clearTimeout(completionTimer);stopVoice();if($('media-dialog').open)$('media-dialog').close();
 room.setView(next);const transition=motion.chapter(()=>{
 view=next;document.body.dataset.view=next;
 for(const [id,v] of Object.entries({entry:'entry','room-ui':'room','memory-ui':'memory','cake-ui':'cake','ending-ui':'ending'}))$(id).hidden=next!==v;
 $('memory-stage').hidden=next!=='memory';$('room-reset').hidden=next==='entry';room.setView(next);particles.active=next==='memory';
 if(next==='memory'){particles.resetFlow();particles.setShape('saturn');document.querySelectorAll('[data-shape]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shape==='saturn')));setSpread(0);particles.spread=0;particles.zoom=particles.targetZoom=1;particles.rotation=particles.targetRotation=0;particles.positions.set(particles.targets);particles.resize();particles.update(0,performance.now()/1000);$('memory-stage').animate([{opacity:0},{opacity:1}],{duration:reduced?150:1100,delay:reduced?0:350,fill:'backwards'});}if(next==='ending'){fireworks.cosmic=room.isShip;fireworks.start();finale.start(config.recipient);}else{fireworks.stop();finale.stop();delete document.body.dataset.finale;}
 if(next==='entry'){room.setLit(false);wishDone=false;}if(next==='cake')updateCakeUI();
 const progress=next==='memory'?1:['cake','ending'].includes(next)?2:0;
 document.querySelectorAll('.view-dots i').forEach((el,i)=>el.classList.toggle('active',i===progress));
 $('footer-message').textContent=({entry:config.footerText,room:'点选发光物件，发现藏起来的心意。',window:SCENES[room.sceneName].description,memory:'每一颗微光，都藏着一个瞬间。',cake:'愿这一束光，照亮新的一岁。',ending:'烟花之后，还有一句话想送给你。'})[next];lastGesture='';syncJourney();
 });return transition?.then(()=>setTimeout(guideForView,reduced?20:240));
}
function updateCakeUI(){
 const lit=room.lit;$('light-candle').disabled=false;$('light-candle').hidden=lit;$('wish-button').hidden=!lit;$('wish-simple').hidden=!lit;
 $('wish-button').disabled=false;$('wish-simple').disabled=false;document.querySelector('.wish-progress').hidden=!lit;
 $('cake-heading').innerText=lit?'愿望，\n就在你的掌心。':'坐下来，\n点亮这一岁。';
 $('cake-description').textContent=lit?'握拳停留 3 秒，或按住下方按钮。':`窗外是${SCENES[room.sceneName].view}。轻点按钮，点亮蜡烛。`;
 $('wish-progress-bar').style.width='0%';wishDone=false;
}
function setSpread(v){if(!particles)return;particles.setSpread(v);$('spread').value=String(Math.round(v*100));$('spread-value').textContent=Math.round(v*100)+'%';$('expand').textContent=v>.5?'收拢回忆 ↙':'展开回忆 ↗';}
async function lightCandle(){if(view!=='cake'||room.lit||room.igniting)return;guide.complete('candle');$('light-candle').disabled=true;$('light-candle').textContent='烛光正在亮起…';try{const done=await room.ignite();if(done&&view==='cake'){updateCakeUI();sfx.play('candle');toast('灯光暗下来，烛光为你而亮。');setTimeout(guideForView,reduced?20:250);}}finally{$('light-candle').disabled=false;$('light-candle').textContent='点亮蜡烛 ✧';}}
function startHold(source='pointer'){
 if(view!=='cake'||room.igniting||!room.lit||holding||wishDone||$('settings').open)return;
 holding=true;holdSource=source;holdStart=performance.now();
 const tick=now=>{if(!holding)return;const amount=Math.min((now-holdStart)/3000,1);$('wish-progress-bar').style.width=amount*100+'%';$('wish-button').textContent=amount>.65?'快了，愿望正在发光…':'把愿望握在掌心…';if(amount===1)completeWish();else holdFrame=requestAnimationFrame(tick);};
 holdFrame=requestAnimationFrame(tick);
}
function stopHold(){holding=false;cancelAnimationFrame(holdFrame);if(!wishDone){$('wish-progress-bar').style.width='0%';$('wish-button').textContent='按住 3 秒，许下愿望';}}
function completeWish(){
 if(view!=='cake'||room.igniting||!room.lit||wishDone)return;wishDone=true;stopHold();$('wish-progress-bar').style.width='100%';$('wish-button').textContent='愿望已送达';$('wish-button').disabled=true;$('wish-simple').disabled=true;sfx.play('wish');
 guide.complete('wish');
 completionTimer=setTimeout(()=>{room.setLit(false);go('ending');},reduced?200:1000);
}
async function openMemory(index){
 if(!memories.length||view!=='memory'||motion.closing||motion.busy)return;if(!journey.completed&&(index<0||index>=memories.length))return;const target=(index+memories.length)%memories.length,direction=index>=selected?1:-1;selected=target;const item=memories[target],ticket=++mediaTicket;stopVoice();
 if(item.type==='photo'){const image=new Image();image.src=item.src;try{await image.decode();}catch{toast('这张照片暂时无法读取。');return;}}
 if(ticket!==mediaTicket||view!=='memory')return;guide.complete('memory-open');const dialog=$('media-dialog'),source=document.activeElement;sfx.play(dialog.open?'page':'memory');
 const commit=()=>{journey.visit(target);syncJourney();dialog.dataset.memoryType=item.type;$('media-heading').textContent=item.type==='object'?'留在口袋里的小事':item.type==='secret'?'你还记得这句暗号吗？':item.title;$('media-caption').textContent=['object','secret'].includes(item.type)?'':item.caption||'';$('media-photo').hidden=item.type!=='photo';$('media-audio').hidden=item.type!=='audio';
 $('media-object').hidden=item.type!=='object';$('media-secret').hidden=item.type!=='secret';
 $('turn-object').classList.remove('revealed');$('reveal-secret').classList.remove('revealed');document.querySelector('.story-object-back').setAttribute('aria-hidden','true');$('secret-back').setAttribute('aria-hidden','true');
 if(item.type==='object'){$('object-face').textContent=item.title;$('object-back').textContent=item.caption;}
 if(item.type==='secret'){$('secret-face').textContent=item.title;$('secret-back').textContent=item.caption;}
 $('media-kicker').textContent=({photo:'这一刻',audio:'想亲口说',note:'写给你的话',object:'一件珍藏的小事',secret:'只属于我们的暗号'})[item.type];
 if(item.type==='photo'){$('media-photo').src=item.src;$('media-photo').alt=item.title;}
 if(item.type==='audio'){$('voice-player').hidden=!item.src;$('play-voice').hidden=!!item.src;if(item.src)$('voice-player').src=item.src;else{$('voice-player').removeAttribute('src');$('voice-player').load();}}
 $('media-index').textContent=String(target+1).padStart(2,'0')+' / '+String(memories.length).padStart(2,'0');$('next-media').disabled=item.type==='object'||item.type==='secret';};
 if(dialog.open)motion.flip($('media-content'),commit,direction);else{commit();motion.open(dialog,source,item.type);if(guide.enabled&&!guide.has('memory-page'))setTimeout(()=>{if(dialog.open&&view==='memory')guide.show({id:'memory-page',target:$('next-media'),label:'读完后，轻触下一段'});},reduced?180:620);}
}
function applyReduced(){reduced=$('low-motion').checked;document.body.classList.toggle('reduced',reduced);if(room){room.reduced=reduced;room.cinema.last=-Infinity;}if(particles)particles.reduced=reduced;if(fireworks)fireworks.reduced=reduced;if(finale)finale.reduced=reduced;scheduleQuietUI();}
try{
 room=new BirthdayRoom($('room-stage'),publishedGift?.scene||'aurora');await room.ready;room.resize();fireworks=new WindowFireworks(room.scene);finale=new ParticleWish($('particle-wish'),phase=>{document.body.dataset.finale=phase;if(phase!=='fireworks')fireworks.stop();if(phase==='complete'){journey.completed=true;guide.complete('ending-fireworks');}syncJourney();$('journey-status').textContent=phase==='fireworks'?'窗前花火正在盛放':phase==='gathering'?'星光正在写下祝福':'旅程完成，可自由回看';$('footer-message').textContent=phase==='complete'?'Happy Birthday '+config.recipient:phase==='gathering'?'每一颗微光，都在拼出你的名字。':'烟花之后，还有一句话想送给你。';if(phase==='complete')setTimeout(guideForView,reduced?20:500);});room.setMemories(memories);
 particles=new MemoryParticles($('particle-canvas'),$('photo-orbit'),openMemory);particles.setCards(memories);applyMemoryPalette();particles.resize();
 if(publishedGift){
  document.body.dataset.scene=room.sceneName;$('scene-toggle').firstChild.textContent='风景：'+document.querySelector(`[data-scene="${room.sceneName}"]`).textContent.trim()+' ';
  document.querySelectorAll('.scene-picker [data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===room.sceneName)));
  $('scene-description').textContent=SCENES[room.sceneName].description;
  $('entry-lead').textContent=SCENE_STORY[room.sceneName].lead;
  document.querySelector('.brand small').textContent=SCENES[room.sceneName].subtitle;
  $('footer-message').textContent=config.footerText;$('name-display').textContent=config.recipient;$('ending-text').textContent=config.message;
  setRecipientPreview(true);
 }
 $('low-motion').checked=reduced;applyReduced();$('enter').disabled=false;$('enter-label').textContent='走进今晚的房间';startGuide();
 function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){if(starsea?.active||auroraTerrace?.active||moonlitPier?.active||moonGarden?.active||lakeMirror?.active){if(starsea?.root.dataset.state==='loading'||auroraTerrace?.root.dataset.state==='entry'||moonlitPier?.root.dataset.state==='entry'||moonGarden?.root.dataset.state==='entry'||lakeMirror?.root.dataset.state==='entry')room.update(dt,now/1000);starsea?.update(dt);auroraTerrace?.update(dt);moonlitPier?.update(dt);moonGarden?.update(dt);lakeMirror?.update(dt);requestAnimationFrame(frame);return;}fireworks.update(dt);finale.update(dt);room.setFireworkLight(fireworks.roomFlash||0,fireworks.roomFlashColor);room.update(dt,now/1000);particles.reading=$('media-dialog').open;particles.update(dt,now/1000);if(view==='room')for(const name of ['memory','cake','window']){const p=room.project(name),el=$('hot-'+name),wall=name==='memory';const visible=wall||p.visible;if(!el.matches(':hover,:focus-visible')){el.style.left=Math.round(wall?Math.max(room.isShip?24:120,Math.min(innerWidth-(room.isShip?130:20),p.x)):p.x)+'px';el.style.top=Math.round(wall?Math.max(102,Math.min(innerHeight-96,p.y)):p.y)+'px';}el.style.opacity=visible?'1':'0';el.style.pointerEvents=visible?'auto':'none';el.tabIndex=visible?0:-1;}}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}catch(e){console.error(e);$('fatal').hidden=false;$('enter-label').textContent='房间暂时无法打开';}
const beforeObservation=async()=>{stopVoice();stopHold();if(view!=='room')await go('room');room.setView('room');};
const afterObservation=()=>{guide.hide();syncJourney();$('room-starsea').focus();setTimeout(guideForView,180);};
const observationLoads=new Map();
async function getObservationExperience(scene){
 const existing={aurora:auroraTerrace,sunset:moonlitPier,garden:moonGarden,starlake:lakeMirror,rings:starsea}[scene];
 if(existing)return existing;
 if(!observationLoads.has(scene))observationLoads.set(scene,(async()=>{
  switch(scene){
   case 'rings':{const {StarseaExperience}=await import('./starsea.js?v=34');return starsea=new StarseaExperience({getReduced:()=>reduced,beforeOpen:beforeObservation,onReturn:afterObservation,onFocus:()=>sfx.play('memory')});}
   case 'aurora':{const {AuroraTerraceExperience}=await import('./aurora-terrace.js?v=28');return auroraTerrace=new AuroraTerraceExperience({getReduced:()=>reduced,getName:()=>config.recipient,beforeOpen:beforeObservation,onReturn:afterObservation,onStarLit:count=>sfx.play(count===3?'wish':'detail')});}
   case 'sunset':{const {MoonlitPierExperience}=await import('./moonlit-pier.js?v=29');return moonlitPier=new MoonlitPierExperience({getReduced:()=>reduced,beforeOpen:beforeObservation,onReturn:afterObservation});}
   case 'garden':{const {MoonGardenExperience}=await import('./moon-garden.js?v=7');return moonGarden=new MoonGardenExperience({getReduced:()=>reduced,beforeOpen:beforeObservation,onReturn:afterObservation,toggleHand:()=>toggleHands(),isHandActive:()=>hands.active,onStageReady:()=>{guide.show({id:'garden-bloom',target:moonGarden.root.querySelector('.garden-bloom-hint'),label:'轻触花影，唤起流萤'});},onBloom:()=>{guide.complete('garden-bloom');sfx.play('detail');}});}
   case 'starlake':{const {LakeMirrorExperience}=await import('./lake-mirror.js?v=12');return lakeMirror=new LakeMirrorExperience({getReduced:()=>reduced,beforeOpen:beforeObservation,onReturn:afterObservation,onStageReady:()=>{guide.show({id:'lake-scope',target:lakeMirror.root.querySelector('.lake-telescope'),label:'轻触黄铜星盘，望向更远的夜空'});},onScopeOpen:()=>{guide.complete('lake-scope');sfx.play('memory');}});}
   default:return null;
  }
 })().catch(error=>{observationLoads.delete(scene);throw error;}));
 return observationLoads.get(scene);
}
const observationGuides={aurora:['.aurora-enter','走上极光露台','轻转地面的星盘，让三颗星依次回应。'],sunset:['.pier-enter','沿月光走出去','海浪声会陪你走过栈桥。'],garden:['.garden-enter','走进流萤庭','轻触花丛，萤火虫会飞出来。'],starlake:['.lake-enter','走向湖心星盘','轻触黄铜星盘，望进更远的夜空。'],rings:['.starsea-enter','走进观星空间','拖动星海，靠近不同的星体。']};
let observationOpening=false;
const openObservation=async()=>{
 if(observationOpening||motion.busy||!canExploreObservation({completed:journey.completed,scene:room?.sceneName,view,finaleComplete:finale?.complete}))return;
 observationOpening=true;const scene=room.sceneName;
 try{
  guide.complete(`observation-entry-${scene}`);const experience=await getObservationExperience(scene);if(!experience)return;
  sfx.play('entry');await experience.open();const [, ,message]=observationGuides[scene];const target=experience.root.querySelector(observationGuides[scene][0]);
  if(guide.show({id:`space-entry-${scene}`,target,label:message}))target.addEventListener('click',()=>guide.complete(`space-entry-${scene}`),{once:true});
 }catch(error){console.error('观景空间加载失败',error);toast('这片风景暂时无法打开，请再试一次。');}
 finally{observationOpening=false;}
};
$('explore-starsea').onclick=openObservation;$('room-starsea').onclick=openObservation;
$('enter').onclick=()=>{guide.complete('entry');sfx.play('entry');go('room');};$('home').onclick=()=>go('entry');$('room-reset').onclick=()=>go('room');
$('hot-window').onclick=()=>go('window');$('hot-cake').onclick=()=>go('cake');$('hot-memory').onclick=()=>{guide.complete('room-memory');setSpread(0);go('memory');};
document.querySelectorAll('.room-shortcuts [data-object]').forEach(button=>button.onclick=()=>{const target=button.dataset.object;if(target==='memory'){guide.complete('room-memory');setSpread(0);}go(target);});
$('cake-back').onclick=()=>go('room');$('back-room').onclick=()=>go('room');$('memory-next').onclick=()=>go('cake');$('replay').onclick=()=>{room.setLit(false);go('room');};
$('light-candle').onclick=lightCandle;$('wish-simple').onclick=completeWish;
const wishButton=$('wish-button');
wishButton.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();wishButton.setPointerCapture(e.pointerId);startHold();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])wishButton.addEventListener(event,stopHold);
wishButton.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)startHold();}});
wishButton.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();stopHold();}});wishButton.addEventListener('blur',stopHold);window.addEventListener('blur',stopHold);
document.querySelectorAll('[data-shape]').forEach(button=>button.onclick=()=>{particles.setShape(button.dataset.shape);document.querySelectorAll('[data-shape]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
document.querySelectorAll('[data-palette]').forEach(button=>button.onclick=()=>{memoryPaletteTouched=true;particles.setPalette(button.dataset.palette);document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
$('expand').onclick=()=>{setSpread(particles.targetSpread>.5?0:1);guide.complete('memory-expand');setTimeout(guideForView,reduced?20:420);};$('spread').oninput=e=>{setSpread(Number(e.target.value)/100);if(Number(e.target.value)>.35){guide.complete('memory-expand');setTimeout(guideForView,reduced?20:420);}};
const restoreGuideRoot=()=>guide.hide();
$('close-media').onclick=()=>{mediaTicket++;restoreGuideRoot();motion.close($('media-dialog'));};$('media-dialog').addEventListener('cancel',e=>{e.preventDefault();mediaTicket++;restoreGuideRoot();motion.close($('media-dialog'));});$('media-dialog').addEventListener('close',()=>{stopVoice();restoreGuideRoot();setTimeout(guideForView,100);});$('prev-media').onclick=()=>openMemory(selected-1);$('next-media').onclick=async()=>{guide.complete('memory-page');restoreGuideRoot();if(!journey.completed&&selected===memories.length-1){mediaTicket++;await motion.close($('media-dialog'));if(journey.nextUnread(memories.length)<0)go('cake');else openMemory(journey.nextUnread(memories.length));}else openMemory(selected+1);};
$('read-memory').onclick=()=>openMemory(Math.max(0,journey.nextUnread(memories.length)));
$('turn-object').onclick=()=>{$('turn-object').classList.add('revealed');document.querySelector('.story-object-back').setAttribute('aria-hidden','false');$('next-media').disabled=false;sfx.play('detail');};
$('reveal-secret').onclick=()=>{$('reveal-secret').classList.add('revealed');$('secret-back').setAttribute('aria-hidden','false');$('next-media').disabled=false;sfx.play('detail');};
$('voice-player').addEventListener('play',()=>$('media-audio').classList.add('playing'));$('voice-player').addEventListener('pause',()=>$('media-audio').classList.remove('playing'));$('voice-player').addEventListener('ended',()=>$('media-audio').classList.remove('playing'));
$('play-voice').onclick=()=>{
 if(!('speechSynthesis'in window)){toast('当前浏览器不支持示例朗读，请在布置房间中上传自己的录音。');return;}
 if(speechSynthesis.speaking){stopVoice();return;}
 const utterance=new SpeechSynthesisUtterance(memories[selected].caption);utterance.lang='zh-CN';utterance.rate=.83;utterance.pitch=.95;
 const voices=speechSynthesis.getVoices(),voice=voices.find(v=>v.lang==='zh-CN')||voices.find(v=>v.lang.startsWith('zh'));if(voice)utterance.voice=voice;
 utterance.onend=utterance.onerror=()=>{$('media-audio').classList.remove('playing');$('play-voice').textContent='再听一次 ▷';};
 speechSynthesis.speak(utterance);$('media-audio').classList.add('playing');$('play-voice').textContent='停止留言 Ⅱ';
};
const mediaEditor=setupMediaEditor({getMemories:()=>editorMemories,setMemories:value=>{stopVoice();editorMemories=value;memories=recipientPreview?recipientMemories(value,config.includedMemories):value;journey.seen.clear();particles.setCards(memories);room.setMemories(memories);},config,toast,saveDraft,onSave:()=>{$('entry-title').textContent=config.entryTitle;$('entry-lead').textContent=SCENE_STORY[room.sceneName].lead;$('footer-message').textContent=config.footerText;$('name-display').textContent=config.recipient;$('ending-text').textContent=config.message;applyReduced();setRecipientPreview(true);syncJourney();if(view!=='entry')go('entry',{force:true});toast('收礼预览已准备好，轻触入口从头体验。');},beforeOpen:()=>{guide.hide();stopHold();stopVoice();room?.cancelIgnition();if(view==='cake'&&!wishDone)updateCakeUI();}});
if(!publishedGift){loadDraft().then(draft=>{$('restore-draft').hidden=!draft;}).catch(()=>{});}
$('restore-draft').onclick=async()=>{
 try{
  const draft=await loadDraft();if(!draft){toast('这台设备还没有保存的草稿。');return;}
  if(draft.scene!==room.sceneName&&SCENES[draft.scene])await room.setScene(draft.scene);
  Object.assign(config,draft.config);mediaEditor.restore(draft);
  document.body.dataset.scene=room.sceneName;
  document.querySelectorAll('.scene-picker [data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===room.sceneName)));
  $('scene-toggle').firstChild.textContent='风景：'+document.querySelector(`[data-scene="${room.sceneName}"]`).textContent.trim()+' ';
  $('scene-description').textContent=SCENES[room.sceneName].description;
  $('entry-title').textContent=config.entryTitle;$('entry-lead').textContent=SCENE_STORY[room.sceneName].lead;
  $('footer-message').textContent=config.footerText;$('name-display').textContent=config.recipient;$('ending-text').textContent=config.message;
  applyMemoryPalette();toast('本机草稿已恢复，可以继续布置。');
 }catch(error){console.warn('恢复草稿失败',error);toast('草稿未能恢复，请检查浏览器存储空间。');}
};
const exportDialog=document.createElement('dialog');exportDialog.id='gift-export-dialog';exportDialog.innerHTML='<div class="gift-export-content"><button type="button" class="close" id="close-gift-export" aria-label="关闭">×</button><span class="eyebrow">专属礼物包已生成</span><h2>把这一晚，送到对方手中。</h2><p>请下载并解压礼物包，将其中整个文件夹放入项目的 <code>dist/birthday/gifts/</code>。等待 Cloudflare 部署完成，再分享地址。</p><a class="gift-download" id="gift-download" href="#" download>下载礼物包 ↓</a><label id="gift-share-label">发布后的专属地址<input id="gift-share-url" readonly></label><button type="button" class="secondary" id="copy-gift-url">复制地址</button><p class="gift-privacy">礼物包可能包含私人照片或录音；上传到公开仓库后，知道链接的人可以访问这些素材。</p></div>';
document.body.append(exportDialog);
$('close-gift-export').onclick=()=>exportDialog.close();
let exportObjectUrl;
addEventListener('pagehide',()=>{if(exportObjectUrl)URL.revokeObjectURL(exportObjectUrl);});
$('copy-gift-url').onclick=async()=>{try{await navigator.clipboard.writeText($('gift-share-url').value);toast('地址已复制。发布文件后即可访问。');}catch{toast('复制失败，请手动选择地址。');}};
$('export-gift').onclick=async()=>{
 const button=$('export-gift');button.disabled=true;button.textContent='正在整理礼物…';
 try{
  const id=`birth-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8)}`;
  const zip=await buildGiftPackage({scene:room.sceneName,config,memories:editorMemories,id});
  if(exportObjectUrl)URL.revokeObjectURL(exportObjectUrl);
  exportObjectUrl=URL.createObjectURL(zip);const download=$('gift-download');download.href=exportObjectUrl;download.download=`${id}.zip`;
  const local=['localhost','127.0.0.1'].includes(location.hostname);
  $('gift-share-label').firstChild.textContent=local?'部署后的路径（拼接 Cloudflare 域名）':'发布后的专属地址';
  const address=new URL(`./gifts/${id}/`,location.href);
  $('gift-share-url').value=local?address.pathname:address.href;
  exportDialog.showModal();download.click();
 }catch(error){console.error('导出礼物失败',error);toast(error.message||'礼物包生成失败，请重试。');}
 finally{button.disabled=false;button.textContent='导出礼物';}
};
$('edit-preview').onclick=async()=>{setRecipientPreview(false);if(view!=='entry')await go('entry',{force:true});$('settings').showModal();};
$('replay-guide').onclick=async()=>{$('settings').close();if(view!=='entry')await go('entry',{force:true});journey.completed=false;journey.seen.clear();room.setLit(false);wishDone=false;selected=0;syncJourney();guide.restart();toast('操作引导已重新开启。');startGuide();};
$('settings').addEventListener('close',()=>{if(guide.enabled)setTimeout(guideForView,120);});
for(const dialog of [$('settings'),$('media-dialog')])dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){if(dialog.id==='media-dialog'){mediaTicket++;motion.close(dialog);}else dialog.close();}});
async function toggleSound(){
 if(soundOn){soundOn=false;sfx.disable();}else try{await sfx.enable();soundOn=true;sfx.play('page');}catch{soundOn=false;sfx.disable();toast('音效暂时无法播放。');}
 $('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'关闭交互音效':'开启交互音效');$('sound').querySelector('span').textContent=soundOn?'音效开':'音效关';
}
$('sound').onclick=toggleSound;
let sceneRequest=0;
const scenePicker=document.querySelector('.scene-picker');
const sceneToggle=$('scene-toggle');
sceneToggle.onclick=()=>{
 const expanded=!scenePicker.classList.contains('expanded');
 scenePicker.classList.toggle('expanded',expanded);sceneToggle.setAttribute('aria-expanded',String(expanded));
};
document.querySelectorAll('.scene-picker [data-scene]').forEach(button=>button.onclick=async()=>{
 if(starsea?.active||auroraTerrace?.active||moonlitPier?.active||moonGarden?.active||lakeMirror?.active||!room||motion.busy||room.igniting||(!journey.completed&&view!=='entry'&&view!=='room'))return;const request=++sceneRequest;
 document.querySelector('.scene-picker').classList.add('loading');
 try{const changed=await room.setScene(button.dataset.scene);if(request!==sceneRequest||!changed)return;sfx.play('page');
 document.querySelectorAll('.scene-picker [data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 sceneToggle.firstChild.textContent='风景：'+button.textContent.trim()+' ';
 scenePicker.classList.remove('expanded');sceneToggle.setAttribute('aria-expanded','false');
 document.body.dataset.scene=button.dataset.scene;$('scene-description').textContent=SCENES[button.dataset.scene].description;fireworks.cosmic=room.isShip;syncJourney();setTimeout(guideForView,180);
 if(!config.entryTitleEdited){config.entryTitle=SCENE_STORY[button.dataset.scene].title;$('entry-title').textContent=config.entryTitle;$('entry-title-input').value=config.entryTitle;}
 $('entry-lead').textContent=SCENE_STORY[button.dataset.scene].lead;
 applyMemoryPalette();
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
 if(!data){$('hand-cursor').hidden=true;lastGesture='';if(holding&&holdSource==='gesture')stopHold();if(!hands.active&&!hands.loading){document.body.classList.remove('hand-active');$('gesture-label').firstChild.textContent='开启手势';moonGarden?.setHandActive(false);}return;}
 gestureX+=(data.x-gestureX)*.5;gestureY+=(data.y-gestureY)*.5;const x=Math.max(0,Math.min(innerWidth-1,gestureX*innerWidth)),y=Math.max(0,Math.min(innerHeight-1,gestureY*innerHeight));
 $('hand-cursor').hidden=false;$('hand-cursor').style.left=x+'px';$('hand-cursor').style.top=y+'px';$('hand-cursor').classList.toggle('pinched',data.pinch);if($('settings').open)return;
 if(moonGarden?.active)moonGarden.setHand({x:gestureX,y:gestureY,open:data.open,pinch:data.pinch});
 if(lakeMirror?.active)lakeMirror.setHand({x:gestureX,y:gestureY,zoom:data.zoom});
 if(view==='memory'&&!$('media-dialog').open){if(data.stable&&data.open)setSpread(1);if(data.stable&&data.fist)setSpread(0);if(data.zoom)particles.setZoom(data.zoom);else particles.targetRotation=(data.palmX-.5)*2.2;}
 if(view==='cake'&&!$('media-dialog').open&&room.lit){if(data.stable&&data.fist)startHold('gesture');else if(holding&&holdSource==='gesture'&&!data.fist)stopHold();}
 if(data.stable&&data.pinch&&lastGesture!=='pinch'&&data.timestamp-lastPinch>850){lastPinch=data.timestamp;let target=document.elementFromPoint(x,y)?.closest('button');if(!target){let nearest=65;for(const button of document.querySelectorAll('button')){const r=button.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(button).visibility==='hidden'||button.closest('[hidden]')||button.getAttribute('aria-hidden')==='true')continue;const distance=Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));if(distance<nearest){nearest=distance;target=button;}}}if(target&&target!==$('gesture-toggle')&&!target.disabled){target.click();}else if(moonGarden?.active&&moonGarden.root.dataset.state==='view'){moonGarden.gestureBloom(gestureX,gestureY);}else if(view==='cake'&&!room.lit){const p=room.project('cake');if(Math.hypot(p.x-x,p.y-y)<130)lightCandle();}}
 if(data.stable)lastGesture=data.name;
},status);
// The camera model is large; load it only after the visitor requests hand control.
async function toggleHands(){
 if(hands.active||hands.loading){hands.stop();document.body.classList.remove('hand-active');$('gesture-label').firstChild.textContent='开启手势';$('gesture-status').hidden=true;$('camera-help').hidden=true;moonGarden?.setHandActive(false);return;}
 $('gesture-label').firstChild.textContent='准备手势…';try{await hands.start();if(hands.active){document.body.classList.add('hand-active');$('gesture-label').firstChild.textContent='关闭手势';}}catch{$('gesture-label').firstChild.textContent='开启手势';}
 moonGarden?.setHandActive(hands.active);
}
$('gesture-toggle').onclick=toggleHands;
window.addEventListener('pointermove',e=>{if(room&&!$('settings').open)room.mouse={x:(e.clientX/innerWidth-.5)*2,y:-(e.clientY/innerHeight-.5)*2};});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHold();stopVoice();room?.cancelIgnition();if(view==='cake'&&!wishDone)updateCakeUI();sfx.suspend();mediaEditor.stopRecording();if(hands.active){hands.stop();status('页面离开后摄像头已关闭，需要时可重新开启。');}}else if(soundOn)sfx.resume()?.catch(()=>{});});
window.addEventListener('pagehide',()=>{guideLandscape.removeEventListener?.('change',startGuide);starsea?.dispose();auroraTerrace?.dispose();moonlitPier?.dispose();moonGarden?.dispose();lakeMirror?.dispose();guide.dispose();hands.dispose();mediaEditor.dispose();stopVoice();sfx.dispose();});

syncJourney();
