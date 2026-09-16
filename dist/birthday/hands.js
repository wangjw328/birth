import {classifyHand,twoHandSpread,stableGesture} from './gesture-math.mjs';
const messages={NotAllowedError:'摄像头权限未获允许。请允许当前页面使用摄像头后重试。',NotFoundError:'未检测到摄像头，请连接摄像头后重试。',NotReadableError:'摄像头被占用或无法读取。请关闭其他使用摄像头的应用后重试。',CAMERA_TIMEOUT:'浏览器尚未返回摄像头权限。请检查权限提示；若 Codex 内仍无响应，可在 Chrome / Edge 打开下方本地链接。',CAMERA_UNAVAILABLE:'当前预览不提供摄像头接口。请在 Chrome / Edge 打开下方本地链接。'};
export class HandControls{
 constructor(video,onFrame,onStatus){Object.assign(this,{video,onFrame,onStatus,active:false,loading:false,stream:null,detector:null,generation:0,lastTime:-1,lastRun:0,raf:0,stable:{name:'none',since:0}});}
 async prepare(){
  if(this.detector)return;
  if(!this.preparing)this.preparing=(async()=>{
   const {FilesetResolver,HandLandmarker}=await import('./vendor/vision_bundle.mjs');
   const vision=await FilesetResolver.forVisionTasks(new URL('./vendor/wasm',import.meta.url).href);
   this.detector=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:new URL('./vendor/hand_landmarker.task',import.meta.url).href,delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});
  })().catch(e=>{this.preparing=null;throw e;});
  return this.preparing;
 }
 async start(){
  if(this.active||this.loading)return;this.loading=true;const generation=++this.generation;let stage='model';
  try{
   this.onStatus('1 / 3 · 正在加载本地手势模型，首次需要片刻…');
   await this.prepare();if(generation!==this.generation)return;
   stage='camera';this.onStatus('2 / 3 · 模型已就绪。请允许摄像头访问；画面仅在本机处理。');
   if(!navigator.mediaDevices?.getUserMedia)throw Error('CAMERA_UNAVAILABLE');
   const pending=navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
   pending.then(stream=>{if(generation!==this.generation)stream.getTracks().forEach(t=>t.stop());},()=>{});
   let timer;try{this.stream=await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CAMERA_TIMEOUT')),18000);})]);}finally{clearTimeout(timer);}
   if(generation!==this.generation){this.stream?.getTracks().forEach(t=>t.stop());return;}
   this.video.srcObject=this.stream;await this.video.play();if(generation!==this.generation)return;
   this.active=true;this.loading=false;this.stable={name:'none',since:0};
   this.onStatus('3 / 3 · 摄像头已开启。请将手掌放进小窗，距离约半臂。');this.loop();
  }catch(e){if(generation!==this.generation)return;this.stop();this.onStatus(messages[e.name]||messages[e.message]||(stage==='model'?'本地手势模型加载失败，请刷新页面后重试。':'摄像头启动失败，请尝试在 Chrome / Edge 打开本地预览。'));console.warn('Hand startup:',stage,e.name,e.message);throw e;}
 }
 loop(){
  if(!this.active)return;this.raf=requestAnimationFrame(()=>this.loop());const now=performance.now();
  if(document.hidden||now-this.lastRun<65||this.video.readyState<2||this.video.currentTime===this.lastTime)return;
  this.lastRun=now;this.lastTime=this.video.currentTime;
  try{
   const result=this.detector.detectForVideo(this.video,now);this.drawLandmarks(result.landmarks);
   const hands=result.landmarks.map(classifyHand).filter(Boolean);
   if(!hands.length){this.stable={name:'none',since:now};this.onFrame(null);this.feedback('正在寻找手掌 · 手掌完整放进小窗');return;}
   const hand=hands[0],name=hand.pinch?'pinch':hand.fist?'fist':hand.open?'open':'move';
   this.stable=stableGesture(this.stable,name,now);
   this.feedback(({pinch:'捏合 · 选取光标处的物件',fist:'握拳 · 收拢回忆 / 停留许愿',open:'张掌 · 展开回忆',move:'移动 · 指尖控制光标'})[name]+(hands.length===2?' · 双手缩放':''));
   this.onFrame({...hand,name,stable:this.stable.ready,zoom:hands.length===2?twoHandSpread(hands[0],hands[1]):null,timestamp:now});
  }catch(e){this.stop();this.onStatus('识别中断，请重新开启手势。'+e.message);console.warn('Hand inference:',e);}
 }
 feedback(text){const el=document.getElementById('hand-feedback');if(el&&el.textContent!==text)el.textContent=text;}
 drawLandmarks(hands){const c=document.getElementById('hand-landmarks');if(!c)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);const links=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];ctx.strokeStyle='#9ffff0';ctx.lineWidth=2;for(const hand of hands){for(const chain of links){ctx.beginPath();chain.forEach((i,j)=>{const p=hand[i];ctx[j?'lineTo':'moveTo']((1-p.x)*c.width,p.y*c.height);});ctx.stroke();}ctx.fillStyle='#ffe3ac';for(const p of hand){ctx.beginPath();ctx.arc((1-p.x)*c.width,p.y*c.height,3,0,Math.PI*2);ctx.fill();}}}
 stop(){this.generation++;this.active=false;this.loading=false;cancelAnimationFrame(this.raf);this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.pause();this.video.srcObject=null;this.lastTime=-1;this.onFrame(null);}
 dispose(){this.stop();this.detector?.close();this.detector=null;}
}
