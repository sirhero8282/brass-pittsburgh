/* Device-local appearance only. Deliberately independent of game persistence. */
(() => {
  'use strict';
  const KEY='brass-pittsburgh-screen-tone-v1', DEFAULT='muted';
  const labels={original:'원본',muted:'차분한 종이 톤',focus:'깊은 집중 톤'};
  const valid=value=>Object.hasOwn(labels,value), root=document.documentElement;
  let current=DEFAULT, saved=true;
  try { const value=localStorage.getItem(KEY);if(valid(value))current=value; } catch { saved=false; }
  root.setAttribute('data-screen-tone',current);
  let dialog,status;
  function refresh(){
    if(!dialog)return;
    for(const input of dialog.querySelectorAll('input[name="screen-tone"]'))input.checked=input.value===current;
    status.textContent=saved?'선택한 화면 톤은 이 브라우저에 저장됩니다.':'선택을 저장할 수 없어 현재 화면에만 적용됩니다.';
  }
  function choose(value){
    if(!valid(value))return;
    current=value;root.setAttribute('data-screen-tone',current);
    try { localStorage.setItem(KEY,current);saved=true; } catch { saved=false; }
    refresh();
  }
  function mount(){
    const button=document.querySelector('.screen-tone-open');
    if(!button)return;
    dialog=document.createElement('dialog');dialog.id='screenToneDialog';dialog.className='screen-tone-dialog';
    dialog.setAttribute('aria-labelledby','screenToneTitle');
    dialog.innerHTML=`<div class="screen-tone-head"><div><small>화면 설정</small><h2 id="screenToneTitle">눈에 편한 화면 톤</h2></div><button type="button" class="screen-tone-close" aria-label="화면 설정 닫기">×</button></div><p class="screen-tone-intro">지도 배경과 주변 바탕의 색감을 선택하세요. 타일·자원·노선·선택 표시는 선명하게 유지합니다.</p><fieldset><legend>화면 톤 선택</legend><label class="screen-tone-choice"><input type="radio" name="screen-tone" value="original"><span class="screen-tone-swatch swatch-original" aria-hidden="true"></span><span><strong>원본</strong><small>보드의 원래 색과 기존 화면 바탕</small></span></label><label class="screen-tone-choice"><input type="radio" name="screen-tone" value="muted"><span class="screen-tone-swatch swatch-muted" aria-hidden="true"></span><span><strong>차분한 종이 톤 <em>기본</em></strong><small>배경의 강한 색과 명암을 부드럽게 완화</small></span></label><label class="screen-tone-choice"><input type="radio" name="screen-tone" value="focus"><span class="screen-tone-swatch swatch-focus" aria-hidden="true"></span><span><strong>깊은 집중 톤</strong><small>배경을 더 어둡게 낮춰 말과 타일에 집중</small></span></label></fieldset><p class="screen-tone-footnote">배경에 인쇄된 지명·글씨도 함께 조정됩니다. 작게 보이면 원본이나 차분한 종이 톤을 선택하세요.</p><p id="screenToneStatus" role="status"></p><button type="button" class="screen-tone-done">닫기</button>`;
    document.body.append(dialog);status=dialog.querySelector('#screenToneStatus');
    dialog.addEventListener('change',event=>{if(event.target.matches('input[name="screen-tone"]'))choose(event.target.value)});
    button.addEventListener('click',()=>{refresh();if(!dialog.open)dialog.showModal()});
    for(const close of dialog.querySelectorAll('.screen-tone-close,.screen-tone-done'))close.addEventListener('click',()=>dialog.close());
    refresh();
  }
  window.addEventListener('storage',event=>{
    if(event.key!==KEY&&event.key!==null)return;
    current=valid(event.newValue)?event.newValue:DEFAULT;saved=true;
    root.setAttribute('data-screen-tone',current);refresh();
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
