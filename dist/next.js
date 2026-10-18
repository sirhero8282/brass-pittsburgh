/* Card-first interaction layer. Game rules remain in app.js. */
let nextCard=null, nextCardIndex=-1, nextAction=null, nextStamp='';
let nextActionTask=null,nextActionRequest=0;
let automaTimer=null, automaRunKey='', automaToastTimer=null, automaPausedByUndo=false,automaDecisionRunning=false;
const nextNames={build:'건설',network:'네트워크',sell:'판매',develop:'개발',loan:'대출',pass:'패스'};
function nextCards(){return tracksPlayerHand()?(state.playerHand||[]).map(card=>({card,left:1})):physicalAvailableCards()}
function nextIsPhysical(){return state.gameMode==='automa'}
function nextAutomaTitle(){return nextIsPhysical()?'오토마 행동 확인':'오토마 자동 실행'}
function nextAutomaMessage(){return nextIsPhysical()?'계산된 행동과 비용을 확인한 뒤 실행하세요.':'스탠드얼론에서는 오토마가 행동을 자동으로 실행합니다.'}
function automaActionPlace(a){return a?.city||a?.edge?(a.city||[a.edge.a,a.edge.b].join('—')):a?.sales?.[0]?.city||''}
function automaActionIcon(type){return {건설:'steelworks',네트워크:'locomotive-works',판매:'manufacturing-crate',개발:'development',대출:'income-up',패스:'whiskey'}[type]||'locomotive-works'}
function showAutomaToast(log,a){let mobile=window.matchMedia('(max-width:900px)').matches,toast=$(mobile?'#mobileAutomaActionToast':'#automaActionToast');if(!toast)return;let type=a?.type||log?.title?.split(' · ')[0]||'행동',place=automaActionPlace(a),icon=automaActionIcon(type);toast.innerHTML=`<small>오토마 실행 · 터치하여 닫기</small><div class="automa-action-summary"><img src="./assets/icons/detail/${icon}.png" alt=""><strong>${escapeAuditHtml(type)}</strong>${place?`<span>${escapeAuditHtml(place)}</span>`:''}</div>`;toast.hidden=false;toast.onclick=()=>{toast.hidden=true};clearTimeout(automaToastTimer);automaToastTimer=setTimeout(()=>{toast.hidden=true},2000)}
function runAutomaAction(){let before=state.logs?.[0],action=state.current?structuredClone(state.current):null;execute();let after=state.logs?.[0];if(after&&after!==before)showAutomaToast(after,action)}
function setAutomaThinking(active){if(typeof document==='undefined')return;document.body?.classList.toggle('automa-thinking',active);document.querySelectorAll('.automa-activity').forEach(el=>el.setAttribute('aria-busy',String(active)));let panel=document.querySelector('.draft-automa-panel');if(panel)panel.setAttribute('aria-busy',String(active))}
function yieldAutomaFrame(){return new Promise(resolve=>{let finish=()=>setTimeout(resolve,0);if(typeof requestAnimationFrame==='function')requestAnimationFrame(finish);else finish()})}
async function collectAutomaCandidatesCooperatively(excluded=[]){let steps=automaCandidateSteps(excluded),result;do{result=steps.next();if(!result.done)await yieldAutomaFrame()}while(!result.done);return result.value}
async function addAutomaLookaheadCooperatively(opts){let steps=automaLookaheadSteps(opts),result;do{result=steps.next();if(!result.done)await yieldAutomaFrame()}while(!result.done);return result.value}
async function decideAutoma(){normalizeRoundActions();if(automaDecisionRunning||state.turnOwner!=='automa'||state.roundActions.automa>=actionsThisTurn())return false;if(!state.hand.length){state.current=null;save();return false}automaDecisionRunning=true;setAutomaThinking(true);await yieldAutomaFrame();try{let steps=automaDecisionSteps(),result;do{result=steps.next();if(!result.done)await yieldAutomaFrame()}while(!result.done);state.current=result.value;save();return !!state.current}catch(err){console.error(err);state.current=null;renderProposal();alert('행동 후보 계산 중 오류가 발생했습니다. 다시 계산해 주세요.');return false}finally{automaDecisionRunning=false;setAutomaThinking(false)}}
function scheduleAutoma(){
 if(automaPausedByUndo||!state.setupLocked||nextIsPhysical()||state.gameOver||state.turnOwner!=='automa'){setAutomaThinking(false);return}
if(roundTransition){setAutomaThinking(false);if(!automaTimer)automaTimer=setTimeout(()=>{automaTimer=null;scheduleAutoma()},4100);return}
 let key=[state.era,state.round,state.actionNo,state.turn,state.hand.length].join(':');
 if(automaRunKey===key||automaTimer)return;
 automaRunKey=key;setAutomaThinking(true);automaTimer=setTimeout(async()=>{automaTimer=null;if(automaPausedByUndo||!state.setupLocked||state.gameMode!=='full'||state.turnOwner!=='automa'||state.gameOver){setAutomaThinking(false);return}try{await decideAutoma();if(state.current)runAutomaAction()}finally{setAutomaThinking(false)}},650);
}
function nextConnectedMarkets(){
 const reachable=new Set;
 for(const origin of playerNetworkOriginCities())for(const city of connectedFrom(origin))reachable.add(city);
 return Object.keys(MARKET_DEF).filter(city=>reachable.has(city));
}
function nextMarketStock(resource){return nextConnectedMarkets().reduce((sum,city)=>sum+(state.markets[city]?.[resource]||0),0)}
function allMarketStock(resource){return Object.keys(MARKET_DEF).reduce((sum,city)=>sum+(state.markets[city]?.[resource]||0),0)}
function fieldActionText(){let a=state.current;if(!a)return '오토마 행동을 계산하세요.';let place=automaActionPlace(a),piece=a.tile?.[0]||a.network?.name||a.title||a.type;return `${piece}${place?' · '+place:''}${a.cost?` · 비용 $${a.cost}`:''}`}
function renderFieldBrief(){let box=$('#fieldBrief');if(!box)return;box.hidden=!nextIsPhysical();if(!nextIsPhysical())return;box.innerHTML=`<div class="field-brief-head"><strong>실물 판 옮기기</strong><span>${state.turnOwner==='automa'?'오토마 차례':'내 차례'}</span></div><p class="field-piece">${escapeAuditHtml(fieldActionText())}</p><div class="field-metrics"><span>내 $${state.playerMoney} · ${state.playerVP}VP</span><span>오토마 $${state.money} · ${state.vp}VP</span></div><div class="field-markets">${['석탄','철','강철','코크스'].map(r=>`<span>${r} ${allMarketStock(r)}/12</span>`).join('')}</div>`}
let nextAvailabilityKey='',nextAvailabilityRevision=0,nextHandRenderKey='';
const nextAvailabilityCache=new Map();
function nextAvailability(card){
 // History and display logs do not affect legal actions; all live state does.
 const {history,logs,...live}=state,key=JSON.stringify(live);
 if(key!==nextAvailabilityKey){nextAvailabilityKey=key;nextAvailabilityRevision++;nextAvailabilityCache.clear()}
 if(nextAvailabilityCache.has(card))return nextAvailabilityCache.get(card);
 const original=state;
 try{state=structuredClone(original);const result=Object.freeze(calculateNextAvailability(card));nextAvailabilityCache.set(card,result);return result}
 finally{state=original}
}
function calculateNextAvailability(card){
 const locked=!state.setupLocked?'초기 배치를 확정하세요':state.gameOver?'게임이 종료됐습니다':state.turnOwner!=='player'?'오토마 차례입니다':state.pendingPlayerTurn?'임시 실행을 턴 종료로 확정하세요':!card?'먼저 카드를 선택하세요':'';
 if(locked)return Object.fromEntries(Object.keys(nextNames).map(k=>[k,locked]));
 const b=buildOptions(card),j=state.playerWhiskey?buildOptions(card,true):{normal:[],vander:[]};
 const n=playerNetworkRouteOptions(state.playerMoney);
 const goods=Object.entries(state.cities).some(([city,slots])=>slots.some(s=>s?.owner==='player'&&!s.flipped&&['등유','제조 상자','자동차'].includes(s.industry)&&[...connectedFrom(city),city].some(m=>['서부','캐나다','보스턴'].includes(m)&&state.setup.merchant[m]?.startsWith(s.groupId==='m6'?'자동차':s.industry))&&playerSaleOilAvailable(city,s.groupId)));
 return {build:b.normal.length+b.vander.length+j.normal.length+j.vander.length?'':'카드·자원·현금 조건에 맞는 건설 대상 없음',network:n.normal.length+n.vander.length?'':'연결 가능한 경로 또는 자원 없음',sell:goods?'':'상인과 연결된 판매 산업 없음',develop:playerDevelopCandidates().length?'':'개발할 산업 타일 없음',loan:canLoseIncome('player',3)?'':'수입이 부족해 대출 불가',pass:''};
}
function nextCardIcon(card){return {'제철소':'steelworks','등유':'kerosene','제조 상자':'manufacturing-crate','석탄':'coal'}[card]}
function nextCardHasAction(card){let a=nextAvailability(card);return ['build','network','sell','develop','loan'].some(k=>!a[k])}
function nextCardsForAction(action){return nextCards().filter(({card})=>!nextAvailability(card)[action])}
function clearNextActionDetails(){let details=$('#nextDetails');if(details){details.hidden=true;details.innerHTML=''}}
async function cancelNextPlayerAction(){
 const task=nextActionTask;
 if(!playerActionPending&&!task)return;
 actionEpoch++;pendingChoiceAbort?.();if(mapSelection)endMapSelection(null,true);
 setPlayerActionBusy(false);clearNextActionDetails();
 // Finish the old action's rollback before another action can take a snapshot.
 if(task)await task;
}
async function runNextAction(action){
 if(state.pendingPlayerTurn)return;
 const request=++nextActionRequest;
 if(playerActionPending||nextActionTask)await cancelNextPlayerAction();
 if(request!==nextActionRequest)return;
 if(!nextCard||nextAvailability(nextCard)[action]){nextCard=null;nextCardIndex=-1;nextAction=action;setPlayerStep('card');renderNext();return}
 nextAction=action;
 const epoch=actionEpoch;
 const task=playerAction(action,nextCard);nextActionTask=task;
 try{await task}finally{if(nextActionTask===task)nextActionTask=null;if(epoch===actionEpoch&&nextAction===action){nextAction=null;if(!state.pendingPlayerTurn){clearNextActionDetails();$('#nextEndTurn').hidden=true}renderNext()}}
}
function renderNext(){
 const physicalBox=$('#physicalAutomaCards');
 if(physicalBox){let title=physicalBox.querySelector('b'),copy=physicalBox.querySelector('p.muted'),list=$('#physicalAutomaCardList');if(title)title.textContent='실물 카드 기록';if(copy)copy.textContent='손패를 공개하거나 미리 배정하지 않습니다. 실제로 버린 카드만 기록합니다.';if(list)list.hidden=true}
 if(!$('#nextHand'))return;
 const stamp=[state.seed,state.gameMode,state.era,state.round,state.turnOwner,state.turn,state.playerDiscard.length].join(':');
 if(stamp!==nextStamp){nextCard=null;nextStamp=stamp}
 if(nextCard&&!nextCards().some(c=>c.card===nextCard))nextCard=null;
 document.body.classList.toggle('next-player-turn',state.turnOwner==='player'&&!state.gameOver);
 $('#nextAutomaPlayerActivity').hidden=state.turnOwner!=='automa'||!!state.gameOver;
 $('#playerSidePanel').hidden=state.turnOwner!=='player'||state.gameOver;
 $('#nextEra').textContent='시대 '+state.era+' · 라운드 '+state.round;
 $('#nextTurn').textContent=state.gameOver?'게임 종료':!state.setupLocked?'초기 배치를 확인하세요':state.turnOwner==='player'?'내 차례':'오토마 차례';
 $('#nextRemain').textContent=state.gameOver?'':Math.max(0,(state.era===1&&state.round===1?1:2)-state.actionNo+1)+' 행동 남음';
 $('#nextFinance').innerHTML=`<span>나 <b>$${state.playerMoney}</b> · 지출 <b>$${state.playerSpent}</b></span><span>오토마 <b>$${state.money}</b> · 지출 <b>$${state.spent}</b></span>`;
 $('#nextSetup').hidden=state.setupLocked;
 $('#nextStartNotice').hidden=state.setupLocked;
 $('#nextStartSummary').textContent='첫 차례: '+(state.turnOwner==='player'?'플레이어':'오토마')+' · 현재 배치를 확정해야 행동할 수 있습니다.';
 $('#nextHandTitle').textContent=tracksPlayerHand()?'내 손패':'실물 카드 선택';
 $('#nextHandHint').hidden=true;
 const availability=nextAvailability(nextCard);
 const handKey=nextAvailabilityRevision+':'+(nextAction||'')+':'+playerActionPending+':'+JSON.stringify(nextCards());
 if(handKey!==nextHandRenderKey){
 nextHandRenderKey=handKey;
 $('#nextHand').innerHTML=nextCards().map(({card,left},i)=>{let icon=nextCardIcon(card),selected=nextCard!==null&&nextCardIndex===i,available=playerActionPending?nextCardHasAction(card):nextAction?!nextAvailability(card)[nextAction]:nextCardHasAction(card),title=selected?'다시 누르면 카드 선택이 취소됩니다.':playerActionPending?'현재 선택을 취소하고 이 카드로 다시 선택합니다.':nextAction?(available?nextNames[nextAction]+'을(를) 실행할 수 있습니다.':nextNames[nextAction]+'을(를) 실행할 수 없습니다.'):available?'선택 가능한 행동이 있습니다.':'현재 가능한 건설·네트워크·판매·개발·대출 행동이 없습니다.';return `<button type="button" class="next-card ${icon?'industry':'city'} ${available?'':'next-card-unavailable'}" data-next-card="${i}" aria-pressed="${selected}" ${state.pendingPlayerTurn||!available?'disabled':''} title="${title}"><small>${icon?'산업':'도시'}</small><img class="${icon?'':'next-city-icon'}" src="./assets/icons/${icon?'detail/'+icon:'city-america-1890'}.png" alt=""><strong>${escapeAuditHtml(card)}</strong>${!tracksPlayerHand()?`<small>${left}장 남음</small>`:''}</button>`}).join('')||'<p>남은 카드가 없습니다.</p>';
 $$('[data-next-card]').forEach(b=>b.onclick=async()=>{let index=Number(b.dataset.nextCard),action=playerActionPending||nextActionTask?null:nextAction;const request=++nextActionRequest;if(!playerActionPending&&!nextActionTask&&nextCard!==null&&nextCardIndex===index){nextCardIndex=null;nextCard=null;setPlayerStep('card');renderNext();$('[data-next-card="'+index+'"]')?.focus({preventScroll:true});return}if(playerActionPending||nextActionTask)await cancelNextPlayerAction();if(request!==nextActionRequest)return;nextCardIndex=index;nextCard=nextCards()[nextCardIndex]?.card||null;if(action)return runNextAction(action);setPlayerStep(nextCardHasAction(nextCard)?'action':'card');renderNext();$('[data-next-card="'+nextCardIndex+'"]')?.focus({preventScroll:true})});
 }
 $$('[data-next-card]').forEach(b=>b.setAttribute('aria-pressed',String(nextCard!==null&&Number(b.dataset.nextCard)===nextCardIndex)));
 $$('[data-player]').forEach(b=>{const action=b.dataset.player,reason=nextCard?availability[action]:'',available=playerActionPending?nextCardsForAction(action).length>0:nextCard?!reason:nextCardsForAction(action).length>0;b.disabled=state.pendingPlayerTurn||!available;b.title=available?(nextCard?nextNames[action]:nextNames[action]+' 가능한 카드를 선택하세요.'):(reason||nextNames[action]+' 가능한 카드가 없습니다.');b.classList.toggle('next-action-active',nextAction===action);b.setAttribute('aria-describedby','nextActionHint')});
 $('#nextSelection').hidden=true;

 $('#nextActionHint').textContent=state.pendingPlayerTurn?'실행 결과를 확인한 뒤 아래 버튼으로 확정하세요. 되돌리기도 가능합니다.':playerActionPending?nextNames[nextAction]+' · 아래 선택을 이어가세요':!state.setupLocked?'배치를 확정하면 행동을 시작할 수 있습니다.':nextAction&&!nextCard?nextNames[nextAction]+'을(를) 실행할 카드를 선택하세요.':!nextCard?'카드 또는 행동을 먼저 선택하세요.':Object.entries(availability).filter(([,v])=>v).map(([k,v])=>nextNames[k]+': '+v).join(' / ')||'행동을 선택하면 세부 선택지가 표시됩니다.';
 $('#nextAutomaMode span').textContent=nextAutomaMessage();
 $('#decideBtn').textContent=nextIsPhysical()?'오토마 행동 계산':'오토마 자동 실행 중';
 $('#executeBtn').textContent=nextIsPhysical()?'확인하고 실행':'자동 실행';
 $('#impossibleBtn').textContent=nextIsPhysical()?'수행 불가':'후보 제외';
 $('#decideBtn').hidden=!nextIsPhysical()||state.turnOwner!=='automa'||!!state.current;
 $('#executeBtn').hidden=!nextIsPhysical()||!state.current;
 $('#impossibleBtn').hidden=!nextIsPhysical()||!state.current;
 $('#nextUndo').disabled=playerActionPending||!state.history.length;
 $('#nextResumeAutoma').hidden=!(automaPausedByUndo&&state.setupLocked&&!nextIsPhysical()&&!state.gameOver&&state.turnOwner==='automa');
 $('#nextEndTurn').hidden=state.gameMode!=='full'||!state.pendingPlayerTurn;
 $('#nextEndTurn').disabled=playerActionPending;
 $('#nextEndTurn').textContent=(state.roundActions?.player||0)+1>=actionsThisTurn()?'턴 종료 · 실행 확정 및 손패 보충':'행동 확정 · 다음 행동';
 $$('[data-next-card]').forEach(b=>b.disabled=!!state.pendingPlayerTurn);
 renderFieldBrief();
 const markets=nextConnectedMarkets();
 $('#nextMarketScope').textContent=markets.length?'연결 시장 '+markets.length+'곳':'아직 연결된 시장이 없습니다';
 $('#nextMarket').innerHTML=['석탄','철','강철','코크스'].map(r=>`<button type="button" data-next-resource="${r}" aria-label="내 연결 시장 ${r} 재고 ${nextMarketStock(r)}개"><img src="${resourceIconPath(r)}" alt=""><span>${r}</span><b>${nextMarketStock(r)}</b></button>`).join('');
 $$('[data-next-resource]').forEach(b=>b.onclick=()=>{const r=b.dataset.nextResource,connected=nextConnectedMarkets().filter(n=>MARKET_DEF[n].res.includes(r));showMapInfo(r+' · 내 연결 시장',connected.map(n=>`<p><b>${n}</b><br>재고 ${state.markets[n][r]}/2 · 개당 $${MARKET_DEF[n].price}</p>`).join('')||'<p>현재 내 산업·노선에서 연결된 '+r+' 시장이 없습니다.</p>');$('#mapInfoBody').insertAdjacentHTML('beforeend','<p class="next-market-note">내 산업·노선에서 철도로 닿는 시장의 합계입니다. 실제 행동에서는 선택한 지역에서 닿는 시장만 이용합니다. 오일은 고정 시장에서 판매하지 않습니다.</p>')});
}
function initNext(){
 document.body.classList.add('next-ui');
 const setupView=$('#setupView'),setupHeader=setupView?.querySelector('.section-head.sticky'),setupActions=setupView?.querySelector('.actions');
 if(setupHeader&&setupActions)setupHeader.insertAdjacentElement('afterend',setupActions);
 let physicalMode=$('[data-mode="automa"]'),fullMode=$('[data-mode="full"]');
 if(physicalMode){let title=physicalMode.querySelector('b'),copy=physicalMode.querySelector('span');if(title)title.textContent='실물 게임 + 오토마';if(copy)copy.textContent='내 행동은 직접 진행하고, 오토마 행동만 확인·기록합니다.'}
 if(fullMode){let title=fullMode.querySelector('b'),copy=fullMode.querySelector('span');if(title)title.textContent='스탠드얼론';if(copy)copy.textContent='플레이어와 오토마의 행동을 모두 이 앱에서 진행합니다.'}
 $('header h1').textContent='피츠버그 오토마';
 $('header .eyebrow').textContent='CARD-FIRST EDITION';
 $('main').insertAdjacentHTML('beforebegin','<section class="next-top"><div><span id="nextEra"></span><strong id="nextTurn"></strong><b id="nextRemain"></b></div><div id="nextFinance" class="next-finance" aria-label="현재 현금 및 이번 라운드 지출"></div><div id="nextAutomaPlayerActivity" class="automa-activity next-automa-player-activity" aria-live="polite" aria-busy="false" hidden><img src="./assets/board-components/resource/automa-robot.webp" alt=""><span>오토마가 다음 행동을 준비합니다</span></div><button id="nextSetup" type="button">초기 배치</button></section>');
 /* On phones this old map-centred toast could remain as an empty panel; use the bottom toast only. */
 document.body.insertAdjacentHTML('beforeend','<section id="mobileAutomaActionToast" class="automa-action-toast mobile-automa-action-toast" aria-live="polite" hidden></section>');
 const mapColumn=$('.map-column'),marketColumn=$('.market-column');
 if(marketColumn)marketColumn.innerHTML='<section id="playerSidePanel" class="player-side-panel" hidden></section><section class="next-market-panel"><div class="section-head"><div><h2>시장 현황</h2><small id="nextMarketScope"></small></div></div><div id="nextMarket"></div></section>';
 let marketDrawer=$('.market-drawer'),marketPanel=$('.next-market-panel');if(marketDrawer&&marketPanel){marketDrawer.querySelector('summary').innerHTML='전체 시장 현황 <small>터치하여 펼치기</small>';marketPanel.append(marketDrawer)}
 const panel=$('#playerPanel');
 if(mapColumn&&panel)mapColumn.append(panel);
 panel.querySelector('h2').textContent='내 행동';
 panel.querySelector('.eyebrow').textContent='';
 panel.querySelector('.player-flow').innerHTML='<span data-step="card">1 카드 선택</span><span data-step="action">2 행동 선택</span><span data-step="detail">3 추가 선택</span>';
 panel.querySelector('.player-actions').insertAdjacentHTML('beforebegin','<details class="next-hand-panel" open><summary id="nextHandTitle">내 손패</summary><p id="nextHandHint"></p><div id="nextHand"></div></details><div class="next-selection"><strong id="nextSelection"></strong></div>');
 panel.querySelector('.player-actions').insertAdjacentHTML('afterend','<p id="nextActionHint" role="status"></p><section id="nextDetails" class="next-details" hidden></section><section id="fieldBrief" class="field-brief" hidden></section><button id="nextEndTurn" type="button" hidden>턴 종료 · 현재 실행 확정</button><button id="nextUndo" type="button">직전 실행 되돌리기</button><button id="nextResumeAutoma" type="button" hidden>오토마 행동 다시 실행</button>');
 const controlRow=document.createElement('section');controlRow.className='next-control-row';
 const cardZone=document.createElement('div');cardZone.className='next-card-zone';
 const actionZone=document.createElement('div');actionZone.className='next-action-zone';
 ['.next-hand-panel','.next-selection','#nextStartNotice'].forEach(s=>{const el=panel.querySelector(s);if(el)cardZone.append(el)});
 const playerSide=$('#playerSidePanel');
 ['.section-head','.player-stats','.player-bonus','.player-flow'].forEach(s=>{const el=panel.querySelector(s);if(el&&playerSide)playerSide.append(el)});
 ['.player-actions','#nextActionHint','#nextDetails','#fieldBrief','#nextEndTurn','#nextUndo','#nextResumeAutoma'].forEach(s=>{const el=panel.querySelector(s);if(el)actionZone.append(el)});
 controlRow.append(cardZone,actionZone);panel.append(controlRow);
 $('.actions').insertAdjacentHTML('beforebegin','<p id="nextAutomaMode" class="next-automa-mode automa-activity" aria-live="polite" aria-busy="false"><img src="./assets/board-components/resource/automa-robot.webp" alt=""><span></span></p>');
 panel.querySelector('.next-selection').insertAdjacentHTML('afterend','<section id="nextStartNotice" class="next-start-notice"><strong>게임 시작 전입니다</strong><p id="nextStartSummary"></p><button id="nextStartGame" type="button">현재 배치로 게임 시작</button><button id="nextReviewSetup" type="button">배치·선턴 확인</button></section>');
 $('#nextStartGame').onclick=()=>{if(!state.setupLocked)$('#lockSetupBtn').click()};
 $('#nextReviewSetup').onclick=()=>nav('setupView');

 $('#nextSetup').onclick=()=>nav('setupView');
 const originalUndo=$('#undoBtn').onclick;
 const undoWithAutomaPause=()=>{let hadHistory=state.history.length>0;automaPausedByUndo=hadHistory;clearTimeout(automaTimer);automaTimer=null;setAutomaThinking(false);originalUndo();if(!hadHistory||!state.setupLocked||nextIsPhysical()||state.gameOver||state.turnOwner!=='automa')automaPausedByUndo=false;renderNext()};
 $('#undoBtn').onclick=undoWithAutomaPause;
 $('#nextUndo').onclick=()=>{nextCard=null;undoWithAutomaPause()};
 $('#nextResumeAutoma').onclick=()=>{automaPausedByUndo=false;automaRunKey='';scheduleAutoma();renderNext()};
 $('#nextEndTurn').onclick=()=>{if(state.gameMode!=='full'||!state.pendingPlayerTurn||playerActionPending)return;confirmPlayerTurn()};
 $$('[data-player]').forEach(b=>b.onclick=()=>runNextAction(b.dataset.player));
 const originalRender=renderAll;renderAll=function(){originalRender();renderNext();scheduleAutoma()};
 const originalBusy=setPlayerActionBusy;setPlayerActionBusy=function(busy){originalBusy(busy);renderNext()};
 const originalPick=pick;
 pick=function(label,items,show=x=>x,hint='항목을 선택하세요.',vanderbiltItems=[],initialIncludeV=false){
  if(!playerActionPending)return originalPick(label,items,show,hint,vanderbiltItems,initialIncludeV);
  return new Promise((resolve,reject)=>{
   const host=$('#nextDetails');let done=false,includeV=initialIncludeV&&vanderbiltItems.length>0;
   const finish=value=>{if(done)return;done=true;host.hidden=true;host.innerHTML='';if(pendingChoiceAbort===abort)pendingChoiceAbort=null;resolve(value)};
   const abort=()=>{if(done)return;done=true;host.hidden=true;host.innerHTML='';if(pendingChoiceAbort===abort)pendingChoiceAbort=null;reject(new Error('PLAYER_ACTION_CANCELLED'))};
   const isNetworkTileChoice=/네트워크 (선택|타일)$/.test(label);
   const optionMarkup=(x,i)=>{let text=String(show(x)),network=x?.n,src=network?personalNetworkAsset(network.id,'player'):'';if(!isNetworkTileChoice||!network||!src)return `<button class="picker-option" type="button" data-next-pick="${i}">${escapeAuditHtml(text)}</button>`;return `<button class="picker-option picker-network-tile-choice${x.vanderbilt?' vanderbilt-option':''}" type="button" data-next-pick="${i}" aria-label="${escapeAuditHtml(text)}" title="${escapeAuditHtml(text)}"><img src="${src}" alt="">${x.vanderbilt?'<b class="picker-network-vanderbilt" aria-hidden="true">V</b>':''}</button>`};
   const draw=()=>{const choices=includeV?[...items,...vanderbiltItems]:items;host.hidden=false;host.innerHTML=`<div class="section-head"><h3 tabindex="-1">${escapeAuditHtml(label)}</h3><button type="button" data-next-cancel>취소</button></div><p>${escapeAuditHtml(hint)}</p>${vanderbiltItems.length?`<label><input type="checkbox" data-next-v ${includeV?'checked':''}> 밴더빌트 구매 후보 포함</label>`:''}<div class="picker-items">${choices.map(optionMarkup).join('')||'<p>가능한 선택지가 없습니다.</p>'}</div>${isNetworkTileChoice?'<button class="next-network-cancel" type="button" data-next-network-cancel>네트워크 선택 취소</button>':''}`;host.querySelector('[data-next-cancel]').onclick=()=>finish(null);host.querySelector('[data-next-network-cancel]')?.addEventListener('click',()=>finish(null));host.querySelectorAll('[data-next-pick]').forEach(b=>b.onclick=()=>finish(choices[+b.dataset.nextPick]));const v=host.querySelector('[data-next-v]');if(v)v.onchange=()=>{includeV=v.checked;draw()}};
   pendingChoiceAbort=abort;draw();host.querySelector('h3').focus({preventScroll:true});host.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
 };
 const originalLock=$('#lockSetupBtn').onclick;$('#lockSetupBtn').onclick=()=>{originalLock();nav('actionView');renderNext()};
 $('#executeBtn').onclick=runAutomaAction;
 $('#decideBtn').onclick=()=>{if(nextIsPhysical())void decideAutoma()};
 $('#impossibleBtn').onclick=()=>{if(nextIsPhysical()){let a=state.current;if(a){state.rejected.push((a.type||'')+(a.city||'')+(a.track||'')+(a.networkId||'')+(a.type==='판매'?JSON.stringify(a.sales)+':'+a.whiskey:''));log('제안 수행 불가',a.tile?.[0]||a.title||START_NETWORK[a.network]?.[0]);state.current=null;void decideAutoma()}}};
 // Keep the perimeter markers visible at initial mobile fit; manual zoom is unchanged.
 if(window.matchMedia('(max-width:900px)').matches&&mapZoom===1&&!window.PittsburghTrackMarkers)changeZoom(1.18);
 renderNext();
}
initNext();
