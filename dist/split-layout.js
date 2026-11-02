/* Local display preferences: never write the game or change its selected action. */
(()=>{
'use strict';
const key='brass-pittsburgh-split-layout-v1', wide=matchMedia('(min-width:1100px)');
const defaults={mode:'classic',pane:true,hidden:{},widths:[44,34,22]};
let prefs;
try{prefs=JSON.parse(localStorage.getItem(key))}catch{}
prefs={...defaults,...prefs};
if(!Array.isArray(prefs.widths)||prefs.widths.length!==3||!prefs.widths.every(n=>Number.isFinite(n)&&n>0&&n<100)||Math.abs(prefs.widths.reduce((a,b)=>a+b,0)-100)>.01)prefs.widths=[...defaults.widths];
if(!prefs.hidden||typeof prefs.hidden!=='object')prefs.hidden={};
const save=()=>{try{localStorage.setItem(key,JSON.stringify(prefs))}catch{}};
let workspace,pane,settings,list,dividers=[],game,seat=0,netBoard,matCore,coreType,frame=0,drag=null;
const cards=new Map(),$=s=>document.querySelector(s);
let matWindow, windowPane, emptyNotice, reopenButton, windowStatus;
let opponentsExpanded=false, opponentsButton, fullBoard, fullOpponents;
function closeMatWindow() {
 const previous=matWindow;
 matWindow=null;
 windowPane=null;
 if(previous && !previous.closed) previous.close();
}
function mergeBoards() {
 prefs.mode=prefs.returnLayout==='split'?'split':'classic';
 closeMatWindow();
 save();
 update();
}
function openMatWindow() {
 if(matWindow && !matWindow.closed){matWindow.focus();return}
 const popup=window.open('','_blank','popup=yes,width=900,height=820,resizable=yes,scrollbars=yes');
 if(!popup){
  windowStatus.textContent='개인판 창을 열 수 없습니다. 이 사이트의 팝업을 허용한 뒤 다시 열어 주세요.';
  return;
 }
 const doc=popup.document;
 doc.documentElement.lang='ko';
 doc.title='피츠버그 · 참가자 개인판';
 const base=doc.createElement('base');
 base.href=new URL('./',document.baseURI).href;
 doc.head.append(base);
 const viewport=doc.createElement('meta');
 viewport.name='viewport';viewport.content='width=device-width, initial-scale=1';doc.head.append(viewport);
 for(const sheet of document.querySelectorAll('link[rel=stylesheet]')){
  const link=doc.createElement('link');
  link.rel='stylesheet';link.href=sheet.href;doc.head.append(link);
 }
 doc.body.className='next-ui table-layout available-board-draft detached-board-window';
 const bar=doc.createElement('div'),title=doc.createElement('strong'),merge=doc.createElement('button');
 bar.className='detached-board-bar';title.textContent='참가자 개인판';merge.type='button';merge.textContent='본창에 합치기';
 merge.onclick=()=>{window.focus();mergeBoards()};
 bar.append(title,merge);
 emptyNotice=doc.createElement('p');
 windowPane=doc.createElement('main');windowPane.className='split-mats';
 doc.body.append(bar,emptyNotice,windowPane);
 matWindow=popup;
 popup.addEventListener('pagehide',()=>{
  if(matWindow!==popup)return;
  matWindow=null;windowPane=null;mergeBoards();
 },{once:true});
 windowStatus.textContent='';
 update();
}
function solo(){if(typeof state==='undefined')return [];
 return ['player','automa'].map((actor,i)=>({name:i?'오토마':'나',color:i?'red':'blue',removed:i?state.removed:state.playerRemoved,networkBuilt:i?state.networkBuilt:state.playerNetworkBuilt,lightTrains:state.lightTrains[actor]||0}));
}
function players(){return game?game.players.map((_,i)=>game.players[(i+seat)%game.players.length]):solo()}
function mat(p,i){
 const multi=!!game;
 if(multi){const type=game.map==='two'?'two':'four';if(coreType!==type){matCore=type==='two'?createTwoCore():createFourCore();coreType=type}
  matCore.set({removed:p.removed});return BrassTable.personal({p,view:matCore.presentation,core:matCore,board:netBoard,groups:Object.values(matCore.groups).flat(),boardOnly:true,showAvailable:i===0})}
 const view={personalLayout:PERSONAL_BOARD_LAYOUT,networkLayout:PERSONAL_NETWORK_LAYOUT,used:groupUsed,unlocked:groupUnlocked,complete:completeGroup,networkRemaining:personalNetworkRemaining,availableIndustryTileMarkup};
 const draw=()=>BrassTable.personal({p,view,core:{networks:NETWORKS},board:{netImage:id=>personalNetworkAsset(id,i?'automa':'player')},groups:Object.values(GROUPS).flat(),boardOnly:true,showAvailable:i===0});
 return i?draw():withPlayerBoard(draw);
}
function update(){
 if(!workspace)return;
 const ps=players(),active=prefs.mode==='split'&&wide.matches&&!!workspace.querySelector(':scope > .draft-right-rail');
 const visible=ps.map((_,i)=>(i===0||opponentsExpanded)&&!prefs.hidden[ps.length+':'+i]);
 const hasContent=visible.some(Boolean)||ps.length>1,show=prefs.pane&&hasContent;
 const detached=prefs.mode==='detached', separate=detached && !!windowPane;
 const ownsFullBoard=game?Number($('#personalOwner')?.value)===seat:$('#boardPlayer')?.getAttribute('aria-selected')==='true';
 const full=fullBoard.classList.contains('active')&&ownsFullBoard&&!separate;
 fullBoard.classList.toggle('show-own-stock',!!ownsFullBoard);
 const target=separate?windowPane:full?fullOpponents:pane;
 const showBoards=separate||full?hasContent:active&&show;
 workspace.classList.toggle('split-active',active || (separate && wide.matches && !!workspace.querySelector(':scope > .draft-right-rail')));workspace.classList.toggle('split-no-mats',separate||!show);
 reopenButton.hidden=!detached;
 reopenButton.textContent=separate?'개인판 창 보기 ↗':'개인판 창 열기 ↗';
 settings.querySelector('.window-actions').hidden=!detached;
 settings.querySelector('.split-reset').hidden=detached;
 settings.querySelector('[name=show-mats]').parentElement.hidden=detached;
 if(separate){
  emptyNotice.hidden=showBoards;
  emptyNotice.textContent=ps.length?'화면 설정에서 표시할 개인판을 선택하세요.':'게임을 시작하면 개인판이 표시됩니다.';
 }
 for(const r of settings.querySelectorAll('[name=table-layout]'))r.checked=r.value===prefs.mode;
 settings.querySelector('[name=show-mats]').checked=prefs.pane;
 const names=ps.map((p,i)=>(i===0&&p.name!=='나'?'나 · ':'')+p.name);
 if(list.dataset.names!==JSON.stringify(names)){
  list.replaceChildren();list.dataset.names=JSON.stringify(names);names.forEach((name,i)=>{const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.dataset.owner=i;l.append(c,document.createTextNode(name));list.append(l)});
 }
 list.querySelectorAll('input').forEach((c,i)=>{c.checked=visible[i];c.disabled=!detached&&!prefs.pane});
 settings.querySelector('.mat-options').hidden=prefs.mode==='classic';
 if(showBoards){
  ps.forEach((p,i)=>{if(!visible[i]||(full&&i===0))return;const signature=JSON.stringify([game?.map||'solo',names[i],p.color,p.removed,p.networkBuilt,p.lightTrains]);
   let card=cards.get(i);if(!card){card=document.createElement('section');card.className='split-owner';card.dataset.owner=i;card.append(document.createElement('h3'),document.createElement('div'));cards.set(i,card)}
   if(card.signature!==signature){card.firstChild.textContent=names[i]+' 개인판';card.lastChild.innerHTML=mat(p,i);card.signature=signature}
   if(card.parentNode!==target)target.insertBefore(card,[...target.children].find(e=>Number(e.dataset.owner)>i)||null);
  });
 }
 for(const [i,c] of cards)if(!showBoards||!visible[i]||(full&&i===0)){c.remove();cards.delete(i)}
 if(showBoards&&ps.length>1){
  opponentsButton.textContent=opponentsExpanded?'상대 개인판 접기':'상대 개인판 펼치기';
  opponentsButton.setAttribute('aria-expanded',String(opponentsExpanded));
  const firstOpponent=[...target.children].find(el=>Number(el.dataset.owner)>0)||null;
  if(opponentsButton.parentNode!==target||opponentsButton.nextElementSibling!==firstOpponent)target.insertBefore(opponentsButton,firstOpponent);
 }else opponentsButton.remove();
 scales();
}
function scales(){if(!workspace)return;const w=prefs.widths;
 w.forEach((n,i)=>workspace.style.setProperty('--split-'+i,n+'fr'));
 dividers.forEach((d,i)=>{const pos=i?w[0]+w[1]:w[0];d.setAttribute('aria-valuenow',Math.round(pos));d.setAttribute('aria-valuetext','왼쪽에서 '+Math.round(pos)+'%')});
}
function queued(){if(frame)return;frame=1;const run=()=>{frame=0;update()};if(windowPane)queueMicrotask(run);else requestAnimationFrame(run)}
function adjust(i,delta,base){const pair=base[i]+base[i+1],min=[16,14,19],next=Math.max(min[i],Math.min(pair-min[i+1],base[i]+delta));prefs.widths=base.slice();prefs.widths[i]=next;prefs.widths[i+1]=pair-next;scales()}
function divider(i){const d=document.createElement('div');d.className='split-bar split-bar-'+i;d.tabIndex=0;d.setAttribute('role','separator');d.setAttribute('aria-orientation','vertical');d.setAttribute('aria-label',i?'개인판과 행동 영역 너비':'게임판과 개인판 너비');
 let raf=0,x;const flush=()=>{raf=0;if(drag?.d===d)adjust(i,100*(x-drag.x)/drag.width,drag.base)};
 d.onpointerdown=e=>{if(e.button!==0||drag)return;drag={d,x:e.clientX,width:workspace.clientWidth-20,base:prefs.widths.slice()};x=e.clientX;d.setPointerCapture(e.pointerId);e.preventDefault()};
 d.onpointermove=e=>{if(drag?.d===d){x=e.clientX;if(!raf)raf=requestAnimationFrame(flush)}};
 d.onlostpointercapture=()=>{if(drag?.d===d){cancelAnimationFrame(raf);flush();drag=null;save()}};
 d.onpointerup=e=>{x=e.clientX;if(d.hasPointerCapture(e.pointerId))d.releasePointerCapture(e.pointerId)};
 d.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();adjust(i,(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?5:1),prefs.widths);save()};return d;
}
globalThis.BrassSplit={game(g,s,b){game=g;seat=Number.isInteger(s)?s:0;netBoard=b;queued()}};
function mount(){workspace=$('.game-workspace,.four-workspace');const dialog=$('#screenToneDialog');if(!workspace||!dialog)return;
 fullBoard=$('#boardView');
 fullOpponents=document.createElement('div');fullOpponents.className='split-mats full-opponents';fullBoard.append(fullOpponents);
 new MutationObserver(queued).observe(fullBoard,{attributes:true,attributeFilter:['class']});
 $('#personalOwner')?.addEventListener('change',queued);
 opponentsButton=document.createElement('button');opponentsButton.type='button';opponentsButton.className='mat-opponents';
 opponentsButton.onclick=()=>{
  opponentsExpanded=!opponentsExpanded;
  const ps=players();
  if(opponentsExpanded && ps.slice(1).every((_,i)=>prefs.hidden[ps.length+':'+(i+1)])){
   ps.forEach((_,i)=>{if(i)delete prefs.hidden[ps.length+':'+i]});save();
  }
  update();
 };
 pane=document.createElement('aside');pane.className='split-mats';pane.setAttribute('aria-label','참가자 개인판');dividers=[divider(0),divider(1)];workspace.append(dividers[0],pane,dividers[1]);
 settings=document.createElement('fieldset');settings.className='split-settings';settings.innerHTML='<legend>테이블 배치</legend><label><input type="radio" name="table-layout" value="classic">기본 보기</label><label><input type="radio" name="table-layout" value="split">3열 보기</label><small>넓은 화면에서 두 구분선을 끌어 너비를 조절하세요. 좁은 화면에서는 기본 보기를 사용합니다.</small><div class="mat-options"><label><input type="checkbox" name="show-mats">개인판 열 표시</label><div class="mat-list"></div><button type="button" class="split-reset">기본 너비로</button></div>';
 dialog.querySelector('.screen-tone-footnote').before(settings);list=settings.querySelector('.mat-list');
 settings.querySelector('small').insertAdjacentHTML('beforebegin','<label><input type="radio" name="table-layout" value="detached">개인판 별도 창</label><div class="window-actions" hidden><button type="button">개인판 창 열기 ↗</button><span role="status"></span></div>');
 windowStatus=settings.querySelector('.window-actions [role=status]');
 settings.querySelector('.window-actions button').onclick=openMatWindow;
 reopenButton=document.createElement('button');reopenButton.type='button';reopenButton.className='mat-window-open';reopenButton.hidden=true;
 $('.screen-tone-open').after(reopenButton);
 reopenButton.onclick=()=>{openMatWindow();if(!windowPane&&!dialog.open)dialog.showModal()};
 settings.onchange=e=>{
  const c=e.target;
  if(c.name==='table-layout'){
   if(c.value==='detached'){prefs.returnLayout=prefs.mode;prefs.mode='detached';openMatWindow()}
   else{prefs.mode=c.value;closeMatWindow()}
  }else if(c.name==='show-mats')prefs.pane=c.checked;
  else if(c.hasAttribute('data-owner')){
   const ps=players(),owner=Number(c.dataset.owner);
   if(owner>0&&c.checked&&!opponentsExpanded){
    ps.forEach((_,i)=>{if(i)prefs.hidden[ps.length+':'+i]=true});
    opponentsExpanded=true;
   }
   prefs.hidden[ps.length+':'+owner]=!c.checked;
   if(owner>0&&ps.slice(1).every((_,i)=>prefs.hidden[ps.length+':'+(i+1)]))opponentsExpanded=false;
  }
  save();update();
 };
 window.addEventListener('pagehide',closeMatWindow);
 settings.querySelector('.split-reset').onclick=()=>{prefs.widths=[44,34,22];scales();save()};
 const soloBoard=$('#personalBoard');if(workspace.matches('.game-workspace')&&soloBoard)new MutationObserver(queued).observe(soloBoard,{childList:true});
 wide.addEventListener('change',queued);update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
