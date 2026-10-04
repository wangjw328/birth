import {recipientMemories} from './story-content.mjs?v=2';
import {snapshotMemories} from './draft-store.mjs?v=2';

const encoder=new TextEncoder();
const SCENES=new Set(['aurora','sunset','garden','rings','starlake']);
const MEDIA_PATH=/^assets\/(?:photo-\d+\.(?:webp|jpg|jpeg|png)|audio\.(?:mp3|m4a|wav|ogg|webm|aac))$/i;

function crc32(bytes){
 let crc=-1;
 for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return(crc^(-1))>>>0;
}

export async function zipFiles(files){
 const chunks=[],central=[];let offset=0;
 for(const {name,blob} of files){
  const path=encoder.encode(name),data=blob instanceof Blob?blob:new Blob([blob]);
  const bytes=new Uint8Array(await data.arrayBuffer());
  const crc=crc32(bytes),size=bytes.length;
  const local=new Uint8Array(30+path.length),view=new DataView(local.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);
  view.setUint32(14,crc,true);view.setUint32(18,size,true);view.setUint32(22,size,true);view.setUint16(26,path.length,true);
  local.set(path,30);chunks.push(local,data);
  const entry=new Uint8Array(46+path.length),directory=new DataView(entry.buffer);
  directory.setUint32(0,0x02014b50,true);directory.setUint16(4,20,true);directory.setUint16(6,20,true);directory.setUint16(8,0x0800,true);
  directory.setUint32(16,crc,true);directory.setUint32(20,size,true);directory.setUint32(24,size,true);directory.setUint16(28,path.length,true);
  directory.setUint32(42,offset,true);entry.set(path,46);central.push(entry);
  offset+=local.length+size;
 }
 const centralSize=central.reduce((sum,entry)=>sum+entry.length,0);
 const end=new Uint8Array(22),footer=new DataView(end.buffer);
 footer.setUint32(0,0x06054b50,true);footer.setUint16(8,central.length,true);footer.setUint16(10,central.length,true);
 footer.setUint32(12,centralSize,true);footer.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/zip'});
}

function safeText(value,max=300){return String(value??'').slice(0,max);}
export function validateGift(raw,id){
 if(!raw||raw.schema!==1||!SCENES.has(raw.scene)||!Array.isArray(raw.memories)||raw.memories.length<1||raw.memories.length>16)throw new Error('礼物数据不完整');
 const config=raw.config||{};
 const fields={entryTitle:50,footerText:50,recipient:20,message:150,note:300,objectName:30,objectStory:100,secretWord:30,secretAnswer:100};
 const cleanConfig={};for(const [key,max]of Object.entries(fields))cleanConfig[key]=safeText(config[key],max);
 cleanConfig.includedMemories=Object.fromEntries(['photo','audio','note','object','secret'].map(type=>[type,Boolean(config.includedMemories?.[type])]));
 const memories=raw.memories.map(item=>{
  if(!['photo','audio','note','object','secret'].includes(item.type))throw new Error('不支持的回忆类型');
  const result={type:item.type,title:safeText(item.title,36),caption:safeText(item.caption,300),sample:false};
  if(['photo','audio'].includes(item.type)){
   if(!MEDIA_PATH.test(item.src||''))throw new Error('礼物素材路径无效');
   result.src=`./gifts/${id}/${item.src}`;
  }
  return result;
 });
 return{scene:raw.scene,config:cleanConfig,memories};
}

export async function loadPublishedGift(id){
 if(!/^[a-z0-9-]{3,48}$/.test(id))throw new Error('礼物编号无效');
 const response=await fetch(`./gifts/${id}/gift.json`,{cache:'no-store'});
 if(!response.ok)throw new Error('未找到这份礼物，请确认文件夹已发布');
 return validateGift(await response.json(),id);
}

function giftLanding(id){
 return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="theme-color" content="#09101c"><link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="../../icon-192.png"><title>星愿房间 · 专属生日礼物</title><style>html,body{margin:0;min-height:100%;background:#09101c;color:#f7eddd;font-family:system-ui,sans-serif}main{max-width:28rem;min-height:100dvh;margin:auto;display:flex;flex-direction:column;justify-content:center;padding:2rem;box-sizing:border-box}small{color:#dfc78e;letter-spacing:.15em}h1{font:400 2.5rem/1.35 Georgia,serif;margin:1.4rem 0}p,li{line-height:1.8;color:#d2d7d7}ol{padding-left:1.5rem}a{color:#eed8a5}</style></head><body><main><small>✧ 星愿房间</small><h1>有一份生日礼物，<br>在等你打开。</h1><p>为了横屏沉浸观看，请先把这一页添加到主屏幕，再从新图标进入。</p><ol id="steps"><li>在 Safari 点“共享”，选择“添加到主屏幕”。</li><li>点“添加”，从主屏幕打开。</li></ol><p>如果正在微信等应用内浏览器，请先选择“在浏览器中打开”。</p></main><script>const ready=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);if(ready||!mobile)location.replace('../../?gift=${id}');else if(/Android/i.test(navigator.userAgent))document.getElementById('steps').innerHTML='<li>在 Chrome 菜单选择“添加到主屏幕”或“安装应用”。</li><li>从主屏幕图标打开。</li>';</script></body></html>`;
}

export async function buildGiftPackage({scene,config,memories,id}){
 if(!SCENES.has(scene)||!/^[a-z0-9-]{3,48}$/.test(id))throw new Error('礼物信息无效');
 const selected=recipientMemories(memories,config.includedMemories);
 if(!selected.length)throw new Error('请至少放入一段回忆');
 const snapshots=await snapshotMemories(selected),files=[];
 let photoNumber=0;
 const items=snapshots.map(item=>{
  const result={type:item.type,title:safeText(item.title,36),caption:safeText(item.caption,300)};
  if(['photo','audio'].includes(item.type)){
   if(!(item.blob instanceof Blob))throw new Error('照片或录音素材已失效，请重新加入');
   const extension=item.type==='photo'?(item.blob.type==='image/png'?'png':item.blob.type==='image/jpeg'?'jpg':'webp'):(/audio\/(mpeg|mp3)/.test(item.blob.type)?'mp3':/mp4|m4a/.test(item.blob.type)?'m4a':/wav/.test(item.blob.type)?'wav':/ogg/.test(item.blob.type)?'ogg':/aac/.test(item.blob.type)?'aac':'webm');
   result.src=item.type==='photo'?`assets/photo-${++photoNumber}.${extension}`:`assets/audio.${extension}`;
   files.push({name:`${id}/${result.src}`,blob:item.blob});
  }
  return result;
 });
 const gift={schema:1,scene,config:{...config},memories:items};
 const manifest={name:`${safeText(config.recipient,20)||'专属'}的星愿房间`,short_name:'星愿房间',id:'./',start_url:'./',scope:'../../',display:'standalone',orientation:'landscape',background_color:'#09101c',theme_color:'#09101c',icons:[{src:'../../icon-192.png',sizes:'192x192',type:'image/png'},{src:'../../icon-512.png',sizes:'512x512',type:'image/png'}]};
 files.unshift({name:`${id}/gift.json`,blob:new Blob([JSON.stringify(gift,null,2)],{type:'application/json'})},{name:`${id}/index.html`,blob:new Blob([giftLanding(id)],{type:'text/html'})},{name:`${id}/manifest.webmanifest`,blob:new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'})});
 files.push({name:`${id}/README.txt`,blob:new Blob([`这份礼物包含私人照片或录音。上传到公开仓库后，知道链接的人可以访问素材。\n\n将整个 ${id} 文件夹放到项目的 dist/birthday/gifts/ 下，等待 Cloudflare 部署完成。\n分享地址：<你的域名>/birthday/gifts/${id}/\n不要直接上传 ZIP 文件；需要先解压并保留文件夹结构。\n`],{type:'text/plain'})});
 return zipFiles(files);
}
