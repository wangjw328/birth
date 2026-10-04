export function installGateRequired({ua = navigator.userAgent, mobileHint = navigator.userAgentData?.mobile, standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true, touchPoints = navigator.maxTouchPoints, query = location.search} = {}) {
  const mobile = mobileHint === true || /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua) || (/Macintosh/i.test(ua) && touchPoints > 1);
  return !standalone && (mobile || new URLSearchParams(query).has('install-preview'));
}

export function setupInstallGate() {
  document.documentElement.classList.add('needs-install');
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) || new URLSearchParams(location.search).has('install-preview');
  const inApp = /MicroMessenger|WeChat|QQ\/|Weibo|Instagram|FBAN|FBAV|Douyin/i.test(ua);
  const title = document.getElementById('install-device-title');
  const steps = document.getElementById('install-steps');
  const note = document.getElementById('install-note');
  if (inApp) {
    title.textContent = '先用系统浏览器打开';
    steps.innerHTML = '<li>轻点右上角菜单，选择“在浏览器中打开”。</li><li>在 Safari 或 Chrome 中，把页面添加到主屏幕。</li><li>从主屏幕的“星愿房间”图标进入。</li>';
    note.textContent = '微信等应用内浏览器通常没有添加到主屏幕的入口。';
  } else if (ios) {
    title.textContent = '把星愿房间放到主屏幕';
    steps.innerHTML = '<li>轻点 Safari 的“共享”图标；若只看到“页面菜单”，先点它再选“共享”。</li><li>下滑找到“添加到主屏幕”；没有时点底部“编辑操作”。</li><li>如有“作为网页 App 打开”，请开启；点“添加”，从主屏幕进入。</li>';
    note.textContent = '请在 Safari 中操作；不同 iOS 版本的按钮位置可能略有区别。';
  } else {
    title.textContent = '把星愿房间放到主屏幕';
    steps.innerHTML = '<li>在 Chrome 右上角轻点 ⋮ 菜单。</li><li>选择“添加到主屏幕”或“安装应用”。</li><li>回到主屏幕，轻点“星愿房间”图标开始。</li>';
    note.textContent = '请在 Chrome 中操作；不同手机的菜单名称可能略有区别。';
  }

  let deferredPrompt;
  const button = document.getElementById('install-action');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
    if (result.outcome === 'accepted') note.textContent = '已添加，请从主屏幕图标打开星愿房间。';
  });
}
