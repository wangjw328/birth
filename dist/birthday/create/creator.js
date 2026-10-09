import {SCENES} from '../scene-presets.mjs?v=31';
import {SCENE_STORY,RELATIONSHIP_COPY,MEMORY_TYPES} from '../story-content.mjs?v=2';
import {saveDraft,loadDraft} from '../draft-store.mjs?v=2';
import {buildGiftPackage} from '../gift-package.mjs?v=2';

const $=id=>document.getElementById(id);
const sceneLabels={aurora:'极光木屋',sunset:'落日海滨屋',garden:'月色花房',rings:'金色星环 · 飞船',starlake:'湖畔银河 · 小屋'};
const sceneOrder=['aurora','sunset','garden','rings','starlake'];
const requestedScene=new URLSearchParams(location.search).get('scene');
let scene=SCENES[requestedScene]?requestedScene:'aurora';
let step=0,photos=[],audio=null,recording=null,recordStream=null,recordTimer=null,exportUrl=null,saveTimer=null,saving=null,dirty=false;
const ownedUrls=new Set();
function makeUrl(blob){const url=URL.createObjectURL(blob);ownedUrls.add(url);return url;}
function notice(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.classList.remove('show'),3400);}
function setScene(next,{keepTitle=false}={}){
 if(!SCENES[next])return;
 const oldDefault=SCENE_STORY[scene].title;
 const current=$('entry-title').value.trim();
 scene=next;
 $('scene-image').style.backgroundImage=`url(../assets/${SCENES[scene].asset})`;
 $('scene-name').textContent=sceneLabels[scene];$('scene-description').textContent=SCENES[scene].description;
 $('review-image').style.backgroundImage=`url(../assets/${SCENES[scene].asset})`;
 if(!keepTitle&&(!current||current===oldDefault))$('entry-title').value=SCENE_STORY[scene].title;
 document.querySelectorAll('.scene-card').forEach(card=>card.setAttribute('aria-pressed',String(card.dataset.scene===scene)));
 updateReview();
}
function buildScenes(){
 for(const key of sceneOrder){
  const button=document.createElement('button');button.type='button';button.className='scene-card';button.dataset.scene=key;
  const image=document.createElement('img');image.src=`../assets/${SCENES[key].asset}`;image.alt='';image.loading='lazy';
  const label=document.createElement('span'),title=document.createElement('strong'),small=document.createElement('small');
  title.textContent=sceneLabels[key];small.textContent=SCENES[key].view;label.append(title,small);button.append(image,label);
  button.onclick=()=>{setScene(key);markDirty();};$('scene-grid').append(button);
 }
}
function setStep(next,{scroll=true}={}){
 step=Math.min(3,Math.max(0,next));
 document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=Number(panel.dataset.panel)!==step);
 document.querySelectorAll('[data-step]').forEach(button=>button.setAttribute('aria-current',Number(button.dataset.step)===step?'step':'false'));
 $('previous').hidden=step===0;$('next').hidden=step===3;
 updateReview();if(scroll)document.querySelector('.editor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
}
function syncChoices(){for(const type of Object.keys(MEMORY_TYPES))document.querySelector(`[data-for="${type}"]`).hidden=!$('include-'+type).checked;updateReview();}
function included(){return Object.fromEntries(Object.keys(MEMORY_TYPES).map(type=>[type,$('include-'+type).checked]));}
function config(){return{
 entryTitle:$('entry-title').value.trim()||SCENE_STORY[scene].title,
 entryTitleEdited:$('entry-title').value.trim()!==SCENE_STORY[scene].title,
 footerText:$('footer-text').value.trim()||'一间房，一场只属于你的生日。',
 recipient:$('recipient').value.trim(),message:$('message').value.trim()||RELATIONSHIP_COPY.gentle.message,
 note:$('note').value.trim(),objectName:$('object-name').value.trim(),objectStory:$('object-story').value.trim(),
 secretWord:$('secret-word').value.trim(),secretAnswer:$('secret-answer').value.trim(),includedMemories:included()
};}
function memories(){
 const c=config(),items=[];
 if(c.includedMemories.object)items.push({type:'object',title:c.objectName,caption:c.objectStory,sample:false});
 if(c.includedMemories.photo)items.push(...photos.map(photo=>({...photo,type:'photo',sample:false})));
 if(c.includedMemories.secret)items.push({type:'secret',title:c.secretWord,caption:c.secretAnswer,sample:false});
 if(c.includedMemories.audio&&audio)items.push({type:'audio',title:audio.title||'一段只想说给你的话',caption:audio.caption||'这是专门为你留下的声音。',src:audio.src,sample:false});
 if(c.includedMemories.note)items.push({type:'note',title:'写给你的话',caption:c.note,sample:false});
 return items;
}
function validate(){
 const c=config();
 if(!c.recipient){setStep(1);$('recipient').focus();notice('请写下生日主角的名字。');return false;}
 if(!Object.values(c.includedMemories).some(Boolean)){setStep(2);notice('请至少选择一种回忆。');return false;}
 if(c.includedMemories.photo&&!photos.length){setStep(2);$('photos').focus();notice('请先加入照片，或关闭照片选项。');return false;}
 if(c.includedMemories.audio&&!audio){setStep(2);$('audio').focus();notice('请先加入录音，或关闭录音选项。');return false;}
 if(c.includedMemories.note&&!c.note){setStep(2);$('note').focus();notice('请写下书信，或关闭书信选项。');return false;}
 if(c.includedMemories.object&&(!c.objectName||!c.objectStory)){setStep(2);$('object-name').focus();notice('请写完整小物件的名称和故事。');return false;}
 if(c.includedMemories.secret&&(!c.secretWord||!c.secretAnswer)){setStep(2);$('secret-word').focus();notice('请写完整暗号和揭开后的话。');return false;}
 return true;
}
function updateReview(){
 $('review-title').textContent=`${sceneLabels[scene]} · ${$('recipient').value.trim()||'亲爱的你'}`;
 const selected=Object.entries(included()).filter(([,yes])=>yes).map(([type])=>MEMORY_TYPES[type]);
 $('review-detail').textContent=selected.length?`包含 ${selected.join('、')}。体验从回忆墙开始，最后去窗前看花火。`:'请至少选择一种回忆。';
}
function renderPhotos(){
 $('photo-list').replaceChildren(...photos.map((photo,index)=>{
  const row=document.createElement('div');row.className='photo-item';
  const image=document.createElement('img');image.src=photo.src;image.alt='';
  const fields=document.createElement('div');fields.className='fields';
  const title=document.createElement('input');title.value=photo.title;title.maxLength=36;title.setAttribute('aria-label',`第 ${index+1} 张照片标题`);
  const caption=document.createElement('input');caption.value=photo.caption;caption.maxLength=100;caption.placeholder='照片的一句话';caption.setAttribute('aria-label',`第 ${index+1} 张照片说明`);
  title.oninput=()=>{photo.title=title.value;markDirty();};caption.oninput=()=>{photo.caption=caption.value;markDirty();};
  fields.append(title,caption);row.append(image,fields);return row;
 }));
}
async function optimizedPhoto(file){
 if(file.size<350*1024)return file;
 const url=URL.createObjectURL(file),image=new Image();image.src=url;
 try{await image.decode();const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84));return blob&&blob.size<file.size?blob:file;}catch{return file;}finally{URL.revokeObjectURL(url);}
}
async function persist({quiet=false}={}){
 clearTimeout(saveTimer);
 if(saving)await saving;
 const data={scene,config:config(),memories:memories()};
 $('save-state').textContent='正在保存…';
 saving=saveDraft(data);
 try{await saving;dirty=false;$('save-state').textContent='草稿已保存到这台设备';if(!quiet)notice('草稿已保存。');return true;}
 catch(error){console.error('草稿保存失败',error);$('save-state').textContent='保存失败，请检查浏览器存储空间';if(!quiet)notice('保存失败，请检查浏览器存储空间。');return false;}
 finally{saving=null;}
}
function markDirty(){dirty=true;$('save-state').textContent='有尚未保存的修改';clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist({quiet:true}),1200);updateReview();}
async function restore(){
 try{const draft=await loadDraft();if(!draft||draft.schema!==1)return;
  for(const [id,key] of [['entry-title','entryTitle'],['footer-text','footerText'],['recipient','recipient'],['message','message'],['note','note'],['object-name','objectName'],['object-story','objectStory'],['secret-word','secretWord'],['secret-answer','secretAnswer']])if(draft.config?.[key]!=null)$(id).value=draft.config[key];
  for(const type of Object.keys(MEMORY_TYPES))$('include-'+type).checked=Boolean(draft.config?.includedMemories?.[type]);
  photos=[];audio=null;
  for(const item of draft.memories||[]){
   if(item.type!=='photo'&&item.type!=='audio')continue;
   if(!(item.blob instanceof Blob))continue;
   const media={type:item.type,title:item.title,caption:item.caption,src:makeUrl(item.blob),sample:false};
   if(item.type==='photo')photos.push(media);else audio=media;
  }
  setScene(SCENES[draft.scene]?draft.scene:scene,{keepTitle:true});
  if(SCENES[requestedScene]&&requestedScene!==scene)setScene(requestedScene);
  renderPhotos();syncChoices();
  $('audio-status').textContent=audio?'录音已从草稿恢复':'尚未加入录音';$('save-state').textContent='已恢复本机草稿';
 }catch(error){console.warn('无法恢复草稿',error);notice('草稿未能读取，可以重新制作。');}
}
function stopRecording(){
 if(recording?.state==='recording')recording.stop();
 recordStream?.getTracks().forEach(track=>track.stop());recordStream=null;
 clearTimeout(recordTimer);$('record').textContent='● 现场录音';
}

buildScenes();$('entry-title').value=SCENE_STORY[scene].title;$('message').value=RELATIONSHIP_COPY.gentle.message;setScene(scene);syncChoices();await restore();setStep(0,{scroll:false});
document.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>setStep(Number(button.dataset.step)));
document.querySelectorAll('[id^=include-]').forEach(input=>input.onchange=()=>{syncChoices();markDirty();});
document.querySelectorAll('#creator-form input:not([type=file]),#creator-form textarea,#creator-form select').forEach(input=>input.addEventListener('input',markDirty));
$('relationship').onchange=()=>{$('message').value=RELATIONSHIP_COPY[$('relationship').value].message;markDirty();};
$('photos').onchange=async event=>{
 const files=[...event.target.files].slice(0,8);
 if(event.target.files.length>8)notice('最多选择 8 张照片。');
 const next=[];
 for(const file of files){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>15*1024*1024){notice('照片请使用 15 MB 以内的 JPG、PNG 或 WebP。');continue;}
  const blob=await optimizedPhoto(file),src=makeUrl(blob);next.push({type:'photo',title:file.name.replace(/\.[^.]+$/,''),caption:'',src,sample:false});
 }
 if(!next.length)return;
 photos=next;$('include-photo').checked=true;syncChoices();renderPhotos();markDirty();
};
$('audio').onchange=event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(file.size>30*1024*1024||(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name))){notice('请选择 30 MB 以内的音频文件。');return;}
 audio={type:'audio',title:'一段只想说给你的话',caption:'这是专门为你留下的声音。',src:makeUrl(file),sample:false};
 $('audio-status').textContent=`已加入：${file.name}`;$('include-audio').checked=true;syncChoices();markDirty();
};
$('record').onclick=async()=>{
 if(recording?.state==='recording'){stopRecording();return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){notice('当前浏览器不支持现场录音，请上传音频。');return;}
 try{
  recordStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  const chunks=[];recording=new MediaRecorder(recordStream);
  recording.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  recording.onstop=()=>{if(!chunks.length)return;audio={type:'audio',title:'一段只想说给你的话',caption:'这是专门为你留下的声音。',src:makeUrl(new Blob(chunks,{type:recording.mimeType||'audio/webm'})),sample:false};$('audio-status').textContent='现场录音已加入';$('include-audio').checked=true;syncChoices();markDirty();};
  recording.start();$('record').textContent='■ 完成录音';$('audio-status').textContent='录音中，最多 60 秒';recordTimer=setTimeout(stopRecording,60000);
 }catch{stopRecording();notice('麦克风未开启，可以上传音频文件。');}
};
$('previous').onclick=()=>setStep(step-1);
$('next').onclick=()=>{if(step===2&&!validate())return;setStep(step+1);};
$('save').onclick=()=>persist();
$('preview').onclick=async()=>{if(!validate())return;if(await persist({quiet:true}))location.href='../preview/';};
$('generate').onclick=async()=>{
 if(!validate())return;
 if(!(await persist({quiet:true})))return;
 const button=$('generate');button.disabled=true;button.textContent='正在整理礼物…';
 try{
  const id=`birth-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8)}`;
  const zip=await buildGiftPackage({scene,config:config(),memories:memories(),id});
  if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=makeUrl(zip);
  $('download').href=exportUrl;$('download').download=`${id}.zip`;
  const address=new URL(`../gifts/${id}/`,location.href);
  $('share-path').value=['localhost','127.0.0.1'].includes(location.hostname)?address.pathname:address.href;
  $('export-result').hidden=false;$('download').click();notice('专属礼物包已生成。');
 }catch(error){console.error('生成失败',error);notice(error.message||'礼物包生成失败，请重试。');}
 finally{button.disabled=false;button.textContent='生成专属版 ↓';}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty)persist({quiet:true});});
addEventListener('pagehide',()=>{stopRecording();for(const url of ownedUrls)URL.revokeObjectURL(url);});
