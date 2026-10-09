import {installGateRequired, setupInstallGate} from './install-gate.js?v=3';
import {loadPublishedGift} from './gift-package.mjs?v=2';
import {loadDraft} from './draft-store.mjs?v=2';

const giftId=new URLSearchParams(location.search).get('gift');
const preview=location.pathname.replace(/\/?$/,'/').endsWith('/birthday/preview/');
document.body.dataset.mode=giftId?'gift':preview?'preview':'template';
if(giftId&&installGateRequired()&&/^[a-z0-9-]{3,48}$/.test(giftId)){
  location.replace(`./gifts/${giftId}/`);
}else if (giftId&&installGateRequired()) {
  setupInstallGate();
} else {
  try{
    if(giftId)window.__BIRTHDAY_GIFT__=await loadPublishedGift(giftId);
    if(preview){
      const draft=await loadDraft();
      if(!draft)throw new Error('这台设备还没有保存的草稿，请先到制作台布置房间。');
      window.__BIRTHDAY_GIFT__={scene:draft.scene,config:draft.config,memories:draft.memories.map(item=>{
        if(!(item.blob instanceof Blob))return {...item};
        const {blob,...plain}=item;return {...plain,src:URL.createObjectURL(blob)};
      })};
    }
    await import('./main.js?v=101');
  }catch(error){
    console.error('生日房间加载失败',error);
    const fatal=document.getElementById('fatal');
    fatal.hidden=false;fatal.querySelector('h2').textContent=giftId?'这份礼物暂时无法打开。':preview?'还没有可预览的房间。':'房间暂时无法打开。';
    fatal.querySelector('p').textContent=error.message||'请稍后重试。';
    if(preview){const link=document.createElement('a');link.href='../create/';link.textContent='返回制作台 ↗';fatal.append(link);}
  }
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
