(function(root) {
  'use strict';
  function start({endpoint,storage,crypto,fetch,document,setInterval,clearInterval}) {
    if (!endpoint) return ()=>{};
    let base;
    try { base=new URL(endpoint);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)return ()=>{}; } catch { return ()=>{}; }
    let visitorId;
    try { visitorId=storage.getItem('brass-metrics-browser-v1');if(!/^[a-f0-9-]{36}$/i.test(visitorId||'')){visitorId=crypto.randomUUID();storage.setItem('brass-metrics-browser-v1',visitorId);} } catch { return ()=>{}; }
    let stopped=false,busy=false;
    async function pulse() {
      if(stopped||busy||document.visibilityState!=='visible')return;
      busy=true;
      try { await fetch(new URL('/collect',base).href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId}),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)}); } catch { /* Analytics must never interrupt play. */ }
      finally { busy=false; }
    }
    document.addEventListener('visibilitychange',pulse);
    const timer=setInterval(pulse,60_000);pulse();
    return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',pulse);};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={start};
  else if(root.BRASS_METRICS?.endpoint) {
    try { start({endpoint:root.BRASS_METRICS.endpoint,storage:root.localStorage,crypto:root.crypto,fetch:root.fetch.bind(root),document:root.document,setInterval:root.setInterval.bind(root),clearInterval:root.clearInterval.bind(root)}); }
    catch { /* Unavailable storage or browser APIs must not affect the game. */ }
  }
})(globalThis);
