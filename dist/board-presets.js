/* Board presentation only. Never write gameplay state or the authored layout. */
(()=>{
 'use strict';
 const KEY='brass-pittsburgh-board-preset-v1';
 const PRESETS={
  new:{label:'신규 맵 · v27 (기본)',asset:'./assets/board/pittsburgh-2p-web-v27.webp',width:2000,height:2000},
  original:{label:'기존 맵 · 원본 좌표',asset:null}
 };
 let active='new';
 try{let saved=localStorage.getItem(KEY);if(Object.hasOwn(PRESETS,saved))active=saved;}catch{}
 function resolve(raw){
  // All normalized placements, IDs, routes and authored overrides are retained.
  // Each preset pairs its artwork with its board canvas; legacy stays untouched.
  return active==='original'?raw:{...raw,board:{...raw.board,asset:PRESETS.new.asset,width:PRESETS.new.width,height:PRESETS.new.height}};
 }
 function update(){
  let select=document.getElementById('boardPreset');if(select)select.value=active;
  document.documentElement.dataset.boardPreset=active;
 }
 function choose(value){
  if(!Object.hasOwn(PRESETS,value))return false;
  active=value;try{localStorage.setItem(KEY,value);}catch{}
  update();window.PhysicalBoardRenderer?.refreshBoardPreset();return true;
 }
 window.PittsburghBoardPresets={resolve,choose,getActive:()=>active};
 let setup=document.getElementById('setupView');
 if(setup){let panel=document.createElement('section');panel.className='panel';
  panel.innerHTML='<h3>보드 버전</h3><label for="boardPreset">지도 이미지·좌표 세트</label><select id="boardPreset" style="display:block;width:100%;max-width:420px;min-height:44px;margin-top:8px"><option value="new">신규 맵 · v27 (기본)</option><option value="original">기존 맵 · 원본 좌표</option></select><p class="muted">신규 맵은 정사각형 웹용 이미지와 기존 정규화 좌표를 사용합니다. 기존 맵은 원본 이미지·좌표를 그대로 사용합니다. 선택은 이 브라우저에 저장되며 게임 진행·규칙에는 영향을 주지 않습니다.</p>';
  setup.insertBefore(panel,setup.querySelector('.panel'));panel.querySelector('select').addEventListener('change',event=>choose(event.target.value));
 }
 update();
})();
