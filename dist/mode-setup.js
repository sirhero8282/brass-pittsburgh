/* Shared setup shell. Routing is presentation-only; neither game's save is touched. */
(() => {
 function initialize(){
  const setup=document.querySelector('#setupView');if(!setup||setup.querySelector('#setupModeSelector'))return;
  const four=document.body.classList.contains('four-table'),mode=four?'four':'two';
  setup.classList.add('unified-setup');setup.dataset.setupMode=mode;
  const sync=()=>document.body.classList.toggle('setup-layout-active',setup.classList.contains('active'));
  sync();if(typeof MutationObserver!=='undefined')new MutationObserver(sync).observe(setup,{attributes:true,attributeFilter:['class']});
  const css=document.createElement('link');css.rel='stylesheet';css.href='./mode-setup.css?v=1';document.head.append(css);
  const heading=setup.querySelector(':scope > .section-head');
  if(heading){heading.classList.add('unified-setup-heading');heading.querySelector('h2').textContent=four?'4인 배치':'2인 배치';}
  const selector=document.createElement('section');selector.id='setupModeSelector';selector.className='panel setup-mode-panel';
  selector.innerHTML=`<div class="setup-mode-heading"><h3>배치 모드</h3><span>현재 모드 · ${four?'3~4인':'2인'}</span></div><div class="setup-mode-options" role="group" aria-label="배치 모드 선택"><button type="button" data-setup-mode="two" aria-pressed="${!four}"><strong>2인 배치</strong><span>플레이어 1 + 오토마 1</span></button><button type="button" data-setup-mode="four" aria-pressed="${four}"><strong>4인 배치</strong><span>플레이어 1 + 오토마 3</span></button></div><p class="setup-mode-note">모드를 바꿔도 각 모드의 저장된 게임은 유지됩니다. 새 게임은 배치를 확정할 때 시작합니다.</p>`;
  if(heading)heading.after(selector);else setup.prepend(selector);
  selector.addEventListener('click',event=>{const choice=event.target.closest('[data-setup-mode]');if(!choice||choice.dataset.setupMode===mode)return;location.assign(choice.dataset.setupMode==='four'?'./four-player.html?view=setup':'./?view=setup');});
  // Put existing controls in the same header/selector/action-bar/content order.
  let actions=setup.querySelector('#lockSetupBtn')?.closest('.actions')||setup.querySelector(':scope > .actions');
  const policy=setup.querySelector('#aiPolicyStatus'),policyActions=setup.querySelector('#loadAiPolicyBtn')?.closest('.actions');
  if(policy&&policyActions&&policyActions!==actions)policy.after(policyActions);
  if(four){actions=document.createElement('div');actions.className='actions';const start=setup.querySelector('#start'),back=heading?.querySelector('[data-nav="gameView"]');if(back)actions.append(back);if(start){start.textContent='배치 확정·게임 시작';actions.append(start);}}
  if(actions){actions.classList.add('setup-primary-actions');selector.after(actions);}
  if(!four&&new URLSearchParams(location.search).get('view')==='setup')document.querySelector('nav [data-view="setupView"]')?.click();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
