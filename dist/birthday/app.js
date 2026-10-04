import {installGateRequired, setupInstallGate} from './install-gate.js?v=3';
import {loadPublishedGift} from './gift-package.mjs?v=2';

const giftId=new URLSearchParams(location.search).get('gift');
if(giftId&&installGateRequired()&&/^[a-z0-9-]{3,48}$/.test(giftId)){
  location.replace(`./gifts/${giftId}/`);
}else if (installGateRequired()) {
  setupInstallGate();
} else {
  try{
    if(giftId)window.__BIRTHDAY_GIFT__=await loadPublishedGift(giftId);
    await import('./main.js?v=91');
  }catch(error){
    console.error('生日房间加载失败',error);
    const fatal=document.getElementById('fatal');
    fatal.hidden=false;fatal.querySelector('h2').textContent=giftId?'这份礼物暂时无法打开。':'房间暂时无法打开。';
    fatal.querySelector('p').textContent=error.message||'请稍后重试。';
  }
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
