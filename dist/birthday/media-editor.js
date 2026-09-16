export function setupMediaEditor({getMemories,setMemories,config,toast,onSave,beforeOpen}) {
 const $=id=>document.getElementById(id);
 let photoUrls=[],audioUrl='',recorder=null,recordStream=null,recording=false,recordTimer=0,recordStart=0,recordChunks=[],loadGeneration=0,disposed=false;
 function setAudio(blob){if(disposed)return;if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(blob);const value=getMemories().map(item=>item.type==='audio'?{...item,src:audioUrl,title:'一段只想说给你的话',caption:'这是专门为你留下的声音。'}:item);setMemories(value);}
 function stopRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();recording=false;clearInterval(recordTimer);recordStream?.getTracks().forEach(t=>t.stop());recordStream=null;$('record').textContent='● 录一段生日留言';}
 $('customize').onclick=()=>{beforeOpen();$('settings').showModal();};
 $('close-settings').onclick=()=>$('settings').close();$('settings').addEventListener('close',stopRecording);
 $('photo-input').addEventListener('change',async e=>{
  const generation=++loadGeneration,files=[...e.target.files];if(files.length>8)toast('最多放入 8 张照片，已选择前 8 张。');
  const valid=files.slice(0,8).filter(file=>/^image\/(jpeg|png|webp)$/.test(file.type)&&file.size<=15*1024*1024);
  if(valid.length<Math.min(files.length,8))toast('仅支持 15 MB 以内的 JPG、PNG、WebP 图片。');if(!valid.length)return;
  const accepted=[];
  for(const file of valid){const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();accepted.push({type:'photo',title:file.name.replace(/\.[^.]+$/,''),src:url,caption:'属于你们的一个闪光瞬间。'});}catch{URL.revokeObjectURL(url);}}
  if(generation!==loadGeneration||disposed){accepted.forEach(p=>URL.revokeObjectURL(p.src));return;}
  if(!accepted.length){toast('这些照片无法读取，请换一组图片。');return;}
  photoUrls.forEach(URL.revokeObjectURL);photoUrls=accepted.map(p=>p.src);setMemories([...accepted,...getMemories().filter(m=>m.type!=='photo')]);
  $('upload-previews').replaceChildren(...accepted.map(p=>{const i=document.createElement('img');i.src=p.src;i.alt=p.title;return i;}));toast('照片已放进回忆墙。');
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
 $('settings-form').onsubmit=e=>{e.preventDefault();if(!$('recipient-input').value.trim()){$('recipient-input').focus();return;}config.recipient=$('recipient-input').value.trim();config.message=$('message-input').value.trim()||'愿你永远有热爱，也有被爱的底气。';config.note=$('note-input').value.trim()||'新的一岁，请记得好好爱自己。';setMemories(getMemories().map(m=>m.type==='note'?{...m,caption:config.note}:m));$('settings').close();onSave();toast('你的心意，已经放进房间。');};
 return {stopRecording,dispose(){disposed=true;loadGeneration++;stopRecording();photoUrls.forEach(URL.revokeObjectURL);if(audioUrl)URL.revokeObjectURL(audioUrl);}};
}
