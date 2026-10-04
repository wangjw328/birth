import {SCENE_STORY,RELATIONSHIP_COPY,recipientMemories,MEMORY_TYPES} from './story-content.mjs?v=2';
export function setupMediaEditor({getMemories,setMemories,config,toast,onSave,beforeOpen,saveDraft}) {
 const $=id=>document.getElementById(id);
 let photoUrls=[],audioUrl='',recorder=null,recordStream=null,recording=false,recordTimer=0,recordStart=0,recordChunks=[],loadGeneration=0,disposed=false;
 const fieldIds={object:['object-name-input','object-story-input'],secret:['secret-word-input','secret-answer-input'],photo:['photo-input'],audio:['audio-input'],note:['note-input']};
 const dependentIds={photo:['upload-previews'],audio:['record','record-status']};
 for(const [type,ids] of Object.entries(fieldIds))for(const id of ids)$(id).closest('label').dataset.memoryField=type;
 for(const [type,ids] of Object.entries(dependentIds))for(const id of ids)$(id).dataset.memoryField=type;
 function syncMemoryChoices(){
  for(const type of Object.keys(MEMORY_TYPES)){
   const checked=$('include-'+type).checked;
   document.querySelectorAll(`[data-memory-field="${type}"]`).forEach(field=>{field.hidden=!checked;});
  }
 }
 document.querySelectorAll('[data-memory-toggle]').forEach(toggle=>toggle.addEventListener('change',syncMemoryChoices));
 syncMemoryChoices();
 function setAudio(blob){if(disposed)return;if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(blob);const value=getMemories().map(item=>item.type==='audio'?{...item,src:audioUrl,title:'一段只想说给你的话',caption:'这是专门为你留下的声音。',sample:false}:item);setMemories(value);$('include-audio').checked=true;syncMemoryChoices();}
 function photoCard(photo,index){
  const card=document.createElement('div');card.className='photo-draft';card.dataset.src=photo.src;
  const image=document.createElement('img');image.src=photo.src;image.alt=photo.title;
  const fields=document.createElement('div');
  const title=document.createElement('input');title.className='photo-title';title.type='text';title.maxLength=36;title.value=photo.title;title.setAttribute('aria-label',`第 ${index+1} 张照片的标题`);
  const caption=document.createElement('input');caption.className='photo-caption';caption.type='text';caption.maxLength=100;caption.value=photo.caption||'';caption.placeholder='写一句只有你们懂的话';caption.setAttribute('aria-label',`第 ${index+1} 张照片的说明`);
  fields.append(title,caption);card.append(image,fields);return card;
 }
 async function optimizedPhoto(file){
  if(file.size<350*1024)return file;
  const url=URL.createObjectURL(file),image=new Image();image.src=url;
  try{
   await image.decode();const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
   const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84));
   return blob&&blob.type==='image/webp'&&blob.size<file.size?blob:file;
  }catch{return file;}finally{URL.revokeObjectURL(url);}
 }
 function restore(draft){
  if(!draft||draft.schema!==1)return;
  photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl='';
  const restored=(draft.memories||[]).map(item=>{
   if(!(item.blob instanceof Blob))return {...item};
   const src=URL.createObjectURL(item.blob);
   if(item.type==='photo')photoUrls.push(src);if(item.type==='audio')audioUrl=src;
   const {blob,...plain}=item;return {...plain,src};
  });
  if(restored.length)setMemories(restored);
  const values={
   'entry-title-input':draft.config.entryTitle,'footer-text-input':draft.config.footerText,'recipient-input':draft.config.recipient,
   'message-input':draft.config.message,'note-input':draft.config.note,'object-name-input':draft.config.objectName,
   'object-story-input':draft.config.objectStory,'secret-word-input':draft.config.secretWord,'secret-answer-input':draft.config.secretAnswer
  };
  for(const [id,value]of Object.entries(values))if(value!==undefined)$(id).value=value;
  for(const type of ['photo','audio','note','object','secret'])$('include-'+type).checked=Boolean(draft.config.includedMemories?.[type]);
  syncMemoryChoices();
  $('upload-previews').replaceChildren(...restored.filter(item=>item.type==='photo'&&!item.sample).map(photoCard));
  $('record-status').textContent=audioUrl?'录音已从草稿恢复。':'';
 }
 function stopRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();recording=false;clearInterval(recordTimer);recordStream?.getTracks().forEach(t=>t.stop());recordStream=null;$('record').textContent='● 录一段生日留言';}
 $('customize').onclick=()=>{beforeOpen();$('settings').showModal();};
 $('relationship-input').onchange=()=>{$('message-input').value=RELATIONSHIP_COPY[$('relationship-input').value]?.message||RELATIONSHIP_COPY.gentle.message;};
 $('close-settings').onclick=()=>$('settings').close();$('settings').addEventListener('close',stopRecording);
 $('photo-input').addEventListener('change',async e=>{
  const generation=++loadGeneration,files=[...e.target.files];if(files.length>8)toast('最多放入 8 张照片，已选择前 8 张。');
  const valid=files.slice(0,8).filter(file=>/^image\/(jpeg|png|webp)$/.test(file.type)&&file.size<=15*1024*1024);
  if(valid.length<Math.min(files.length,8))toast('仅支持 15 MB 以内的 JPG、PNG、WebP 图片。');if(!valid.length)return;
  const accepted=[];
  for(const file of valid){const blob=await optimizedPhoto(file),url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();accepted.push({type:'photo',title:file.name.replace(/\.[^.]+$/,''),src:url,caption:'',sample:false});}catch{URL.revokeObjectURL(url);}}
  if(generation!==loadGeneration||disposed){accepted.forEach(p=>URL.revokeObjectURL(p.src));return;}
  if(!accepted.length){toast('这些照片无法读取，请换一组图片。');return;}
  photoUrls.forEach(URL.revokeObjectURL);photoUrls=accepted.map(p=>p.src);$('include-photo').checked=true;syncMemoryChoices();
  const others=getMemories().filter(m=>m.type!=='photo');
  setMemories([...others.filter(m=>m.type==='object'),...accepted,...others.filter(m=>m.type!=='object')]);
  $('upload-previews').replaceChildren(...accepted.map(photoCard));toast('照片已放进回忆墙，还可以为每张照片写一句话。');
 });
 $('audio-input').onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>30*1024*1024||(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name))){toast('请选择 30 MB 以内的音频文件。');return;}setAudio(file);$('record-status').textContent='已放入录音：'+file.name;toast('录音已放进回忆墙。');};
 $('record').onclick=async()=>{
  if(recording){stopRecording();return;}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('当前浏览器无法现场录音，可以直接上传音频文件。');return;}
  $('record').disabled=true;
  try{recordStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(!$('settings').open||disposed){recordStream.getTracks().forEach(t=>t.stop());return;}recordChunks=[];recorder=new MediaRecorder(recordStream);
   recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data);};
   recorder.onstop=()=>{if(recordChunks.length&&!disposed){setAudio(new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'}));$('record-status').textContent='录音已保存到本次预览，可以进入回忆墙试听。';}};
   recorder.start();recording=true;recordStart=Date.now();$('record').textContent='■ 完成录音';
   recordTimer=setInterval(()=>{const seconds=Math.floor((Date.now()-recordStart)/1000);$('record-status').textContent=`正在录音 ${seconds} 秒 / 60 秒`;if(seconds>=60)stopRecording();},250);
  }catch{stopRecording();toast('麦克风未开启，可以上传已经录好的音频。');}finally{$('record').disabled=false;}
 };
 $('settings-form').onsubmit=async e=>{
  e.preventDefault();if(!$('recipient-input').value.trim()){$('recipient-input').focus();return;}
  const included=Object.fromEntries(Object.keys(MEMORY_TYPES).map(type=>[type,$('include-'+type).checked]));
  const missingMedia=['photo','audio'].find(type=>included[type]&&!getMemories().some(item=>item.type===type&&!item.sample));
  if(missingMedia){const message=missingMedia==='photo'?'请先加入照片，或取消勾选照片。':'请先上传或录制音频，或取消勾选录音。';$('memory-choice-help').textContent=message;$('memory-choice-help').classList.add('memory-choice-error');$(''+(missingMedia==='photo'?'photo-input':'audio-input')).focus();toast(message);return;}
  const available=recipientMemories(getMemories(),included);
  if(!available.length){$('memory-choice-help').textContent='请至少选择一项回忆。';$('memory-choice-help').classList.add('memory-choice-error');$('include-note').focus();toast('至少保留一段回忆。');return;}
  $('memory-choice-help').textContent='照片和录音需要先加入自己的素材；未替换的示例不会送出。';$('memory-choice-help').classList.remove('memory-choice-error');
  config.includedMemories=included;
  const scene=document.body.dataset.scene||'aurora';
  config.entryTitle=$('entry-title-input').value.trim()||SCENE_STORY[scene].title;
  config.entryTitleEdited=config.entryTitle!==SCENE_STORY[scene].title;
  config.footerText=$('footer-text-input').value.trim()||'一间房，一场只属于你的生日。';
  config.recipient=$('recipient-input').value.trim();
  config.message=$('message-input').value.trim()||RELATIONSHIP_COPY.gentle.message;
  config.note=$('note-input').value.trim()||'新的一岁，请记得好好爱自己。';
  config.objectName=$('object-name-input').value.trim()||'一件值得珍藏的小事';
  config.objectStory=$('object-story-input').value.trim()||'愿这一刻被好好记住。';
  config.secretWord=$('secret-word-input').value.trim()||'今晚的暗号';
  config.secretAnswer=$('secret-answer-input').value.trim()||'你值得被认真爱着。';
  const photoDrafts=new Map([...document.querySelectorAll('.photo-draft')].map(card=>[card.dataset.src,{title:card.querySelector('.photo-title').value.trim(),caption:card.querySelector('.photo-caption').value.trim()}]));
  setMemories(getMemories().map(item=>{
   if(item.type==='photo'&&photoDrafts.has(item.src)){const draft=photoDrafts.get(item.src);return {...item,title:draft.title||item.title,caption:draft.caption};}
   if(item.type==='note')return {...item,caption:config.note};
   if(item.type==='object')return {...item,title:config.objectName,caption:config.objectStory};
   if(item.type==='secret')return {...item,title:config.secretWord,caption:config.secretAnswer};
   return item;
  }));
  try{await saveDraft?.({scene,config,memories:getMemories()});toast('草稿已保存到这台设备。');}catch(error){console.warn('草稿保存失败',error);toast('本机草稿未保存成功，请先导出礼物包备份。');}
  $('settings').close();onSave();
 };
 return {stopRecording,restore,dispose(){disposed=true;loadGeneration++;stopRecording();photoUrls.forEach(URL.revokeObjectURL);if(audioUrl)URL.revokeObjectURL(audioUrl);}};
}
