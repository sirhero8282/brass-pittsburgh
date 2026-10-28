(async()=>{
'use strict';
const H=FourHuman,F=FourPlayer,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const response=await fetch('four-player/data.json?v=r399-v4-market-start2');if(!response.ok)throw Error('4인 데이터를 불러오지 못했습니다.');
const data=await response.json(),core=createFourCore(),board=createOnlineNetworkBoard(data,core,createFourBoard(data,core),()=>0),groups=Object.values(core.groups).flat(),UIKEY=F.KEY+'-interface-v2';
// Reuse the existing physical-component CSS/markup without bootstrapping the 2P app.
$('#available').className='available-now';$('#available').closest('.panel').classList.add('available-panel');
$('.available-column').classList.add('draft-left-rail');$('.command-column').classList.add('draft-right-rail');
$('#twoPlayerEntry').onclick=()=>location.assign('./');
let layoutFrame=0;
function syncLayoutMeasurements(){
 layoutFrame=0;const wide=matchMedia('(min-width:1100px)').matches,workspace=$('.four-workspace'),panel=$('#playerPanel');
 if(wide&&$('#gameView').classList.contains('active')){const gap=parseFloat(getComputedStyle(workspace).columnGap)||8,left=$('.available-column').getBoundingClientRect().width,rightMinimum=Math.min(430,Math.max(360,window.innerWidth*.31)),availableWidth=workspace.clientWidth-left-rightMinimum-gap*2,selection=$('#mapSelectionBar'),availableHeight=workspace.clientHeight-($('.map-toolbar')?.getBoundingClientRect().height||38)-($('.map-note')?.getBoundingClientRect().height||0)-(selection.hidden?0:selection.getBoundingClientRect().height)-10;document.body.style.setProperty('--draft-map',Math.max(280,Math.floor(Math.min(availableWidth,availableHeight)))+'px')}
 panel.classList.toggle('draft-controls-split',wide&&panel.getBoundingClientRect().width>=720);syncCards();
}
function scheduleLayout(){if(!layoutFrame)layoutFrame=requestAnimationFrame(syncLayoutMeasurements)}
function configureLayout(){const wide=matchMedia('(min-width:1100px)').matches;document.body.classList.toggle('wide-layout-draft',wide);const nav=$('nav');if(wide)$('header').insertBefore(nav,$('.header-meta'));else document.body.append(nav);scheduleLayout()}
function syncCards(){const hand=$('#nextHand'),cards=$$('#nextHand .next-card:not([hidden])'),wide=matchMedia('(min-width:1100px)').matches;hand.classList.toggle('draft-card-fan',wide);hand.classList.remove('draft-card-row');if(!wide)return;const width=cards[0]?.getBoundingClientRect().width||140,step=cards.length>1?Math.max(0,(hand.clientWidth-width-16)/(cards.length-1)):0;cards.forEach((card,i)=>{card.style.setProperty('--fan-left',(8+i*step)+'px');card.style.setProperty('--fan-layer',String(i+1));card.style.setProperty('--fan-y','0px');card.style.setProperty('--fan-rotate','0deg');card.style.setProperty('--fan-origin-x',i===0?'0%':i===cards.length-1?'100%':'50%')});hand.style.setProperty('--fan-height',Math.ceil(width*25/18+30)+'px')}
configureLayout();window.addEventListener('resize',configureLayout);
if(typeof ResizeObserver==='function')new ResizeObserver(scheduleLayout).observe($('#playerPanel'));
$('#nextHand').closest('details')?.addEventListener('toggle',scheduleLayout);
const actionIcons={'건설':'action-construction-hammer','네트워크':'action-network-rail','판매':'action-sale-dollar','개발':'action-development-bulb','대출':'action-loan','패스':'action-pass-whiskey'};
let humanTask=null,humanEpoch=0,selectionRequest=0,chooser=null,mapChoice=null,provisional=null,targetSelectMode='map';
const availabilityCache=new Map();let availabilityRevision=-1,availabilitySession=null;
let session=null,currentView='setupView',auto=true,paused=false,busy=false,epoch=0,timer=null,toastTimer=null,proposal=null,cardFilter='all',detailChoices=[],storageError='';
try{const settings=JSON.parse(localStorage.getItem(UIKEY)||'{}');auto=settings.auto!==false;targetSelectMode=settings.targetSelectMode==='list'?'list':'map';const saved=localStorage.getItem(F.KEY);if(saved){session=new FourFlow(F,data,F.validate(JSON.parse(saved)));currentView='gameView';paused=F.active(session.game)!==0;}}catch(e){$('#message').textContent='저장 복원 실패: '+e.message+' 원본 저장 파일은 변경하지 않았습니다.';}
if(new URLSearchParams(location.search).get('view')==='setup')currentView='setupView';
function message(value){$('#message').textContent=[storageError,value].filter(Boolean).join('\n')}
function persist(){try{localStorage.setItem(F.KEY,JSON.stringify(session.serializable()));storageError='';$('#saveStatus').textContent=session.pending?'실행 대기 상태 저장됨':'저장됨';}catch(e){storageError='자동 저장 실패 — 배치 탭에서 JSON으로 내보내세요.';$('#saveStatus').textContent='저장 실패';message(e.message)}}
function saveSettings(){try{localStorage.setItem(UIKEY,JSON.stringify({auto,targetSelectMode}));}catch(e){message('진행 방식 설정을 저장하지 못했습니다.')}}
function stopAI(){epoch++;clearTimeout(timer);timer=null;document.body.classList.remove('thinking')}
function title(a){let detail=a.tile?.[0]||a.title;if(detail===a.type)detail='';else if(detail?.startsWith(a.type+' '))detail=detail.slice(a.type.length+1);return [a.type,detail,a.city&&(a.city+(a.slot>=0?' '+(a.slot+1)+'번 칸':'')),a.edge&&a.edge.a+'—'+a.edge.b,a.sales&&a.sales.map(s=>s.city+'→'+s.merchant).join(', '),a.targets&&a.targets.map(t=>t.tile?.[0]||t.id).join(', '),a.second&&'추가 '+a.second.edge.a+'—'+a.second.edge.b].filter(Boolean).join(' · ')}
function cost(a){return a.totalCost??a.cost??0}
function groupKey(a){return a.type==='건설'?a.track+':'+a.index:a.networkId}
function groupId(a){return groups.find(g=>g.ids.includes(a.track+':'+a.index))?.id}
function isIndustry(card){return ['등유','석탄','제철소','제조 상자'].includes(card)}
function focusPanel(selector){if(window.matchMedia('(max-width:1099px)').matches)$(selector)?.scrollIntoView({block:'center',behavior:'auto'})}
function view(id){if(id!=='gameView'){selectionRequest++;void cancelHuman();}if(!session&&id!=='setupView'){message('먼저 배치를 확정하고 게임을 시작하세요.');return}currentView=id;if(id!=='gameView')stopAI();render();window.scrollTo(0,0);if(id==='gameView')scheduleAI()}
function render(){
 const g=provisional||session?.display(),committed=session?.game,active=committed&&F.active(committed),pending=!!session?.pending;
 $$('.view').forEach(el=>el.classList.toggle('active',el.id===currentView));$$('nav [data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===currentView));
 $$('[data-auto]').forEach(b=>b.classList.toggle('active',(b.dataset.auto==='true')===auto));
 $('#saveStatus').textContent=storageError?'저장 실패':pending?'실행 대기 상태 저장됨':g?'저장됨':'새 게임';
 if(!g){$('#round').textContent='4인 모드';$('#turn').textContent='초기 배치를 확인하세요';$('#shared').textContent='게임 시작 후 상인과 품질 보상이 표시됩니다.';return}
 $('#round').textContent='시대 '+(g.era===1?'I':'II')+' · 라운드 '+g.round;
 $('#turn').textContent=pending?'실행 결과를 확인하세요':g.gameOver?'게임 종료':active===0?'내 차례':g.players[active].name+' 차례';
 $('#remain').textContent=pending?'확정 대기':g.gameOver?'':((g.era===1&&g.round===1?1:2)-g.actionCount)+' 행동 남음';
 $('#nextFinance').textContent='나 $'+g.players[0].money+' · 지출 $'+g.players[0].spent+(active!==0&&!g.gameOver?' / '+g.players[active].name+' $'+g.players[active].money:'');
 $('#turnNotice').textContent=pending?'아직 확정되지 않은 실행입니다.':humanTask?'행동을 선택하고 있습니다.':busy?'오토마 계산 중…':'';
 $('#targetSelectMode').value=targetSelectMode;
 renderStatus(g,committed,pending);
 $('#playerPanel').hidden=active!==0&&!pending||!!g.gameOver;$('#automaPanel').hidden=active===0||pending||!!g.gameOver;
 renderHand(g);renderActions();renderDetails();renderPending();renderAI();renderMarkets(g);renderPersonal(g);renderAvailable(g);renderLogs(g);renderBoard(g);
 $('#undo').disabled=$('#undoRecent').disabled=busy||!pending&&!session.history.length;
 scheduleLayout();
}
function renderStatus(g,committed,pending){
 const active=F.active(committed),current=id=>!g.gameOver&&active===id,label=id=>id?g.players[id].name:'나';
 $('#players').innerHTML=g.order.map((id,n)=>{const p=g.players[id];return `<tr class="${current(id)?'current':''}"><td><span class="owner-dot" style="--owner:${board.colors[p.color]}"></span>${n+1}. ${esc(label(id))}${current(id)?`<small>${pending?'확정 대기':'행동 '+(committed.actionCount+1)+'/'+(committed.era===1&&committed.round===1?1:2)}</small>`:''}</td><td>$${p.money}</td><td>$${p.spent}</td><td>${p.vp}</td><td>${core.incomeLevelAt(p.income)}<small>${p.income}칸</small></td><td>${p.whiskey}</td><td>${p.hand.length}</td></tr>`}).join('');
 $('#iconStatus').innerHTML=g.order.map(id=>{const p=g.players[id];return `<article class="icon-status-card ${current(id)?'current':''}" style="--owner:${board.colors[p.color]}"><h3><span class="owner-dot"></span>${esc(label(id))}${current(id)?`<small>${pending?'확정 대기':'현재 차례'}</small>`:''}</h3><div class="icon-metrics"><span><b>$${p.money}</b><small>현금</small></span><span><b>${p.vp}</b><small>승점</small></span><span><b>${core.incomeLevelAt(p.income)}</b><small>수입</small></span><span><b>${p.whiskey}</b><small>위스키</small></span></div></article>`}).join('');
 $('#turnQueue').innerHTML=g.order.map((id,n)=>`<span class="turn-chip ${current(id)?'current':''}" ${current(id)?'aria-current="step"':''}><i class="owner-dot" style="--owner:${board.colors[g.players[id].color]}"></i>${n+1}. ${esc(label(id))}</span>`).join('');
}
function humanAvailability(index){if(availabilitySession!==session||availabilityRevision!==session.revision){availabilitySession=session;availabilityRevision=session.revision;availabilityCache.clear()}if(!availabilityCache.has(index))availabilityCache.set(index,H.availability(session.game,index));return availabilityCache.get(index)}
function humanCanSelect(){return !!session&&!session.pending&&!session.game.gameOver&&F.active(session.game)===0&&!busy}
function renderHand(g){
 const hand=session.game.players[0].hand,human=humanCanSelect();document.body.classList.toggle('next-player-turn',human);
 $('#nextHand').innerHTML=hand.map((card,i)=>{const industry=isIndustry(card),hidden=cardFilter!=='all'&&(cardFilter==='industry')!==industry,available=human&&(!session.type||humanTask||!humanAvailability(i)[session.type]);return '<button type="button" class="next-card draft-physical-card '+(industry?'industry':'city')+' '+(available?'':'next-card-unavailable')+'" data-card="'+i+'" aria-label="'+esc(card)+' 카드 '+(i+1)+'" aria-pressed="'+(!session.pending&&session.cardIndex===i)+'" '+(available?'':'disabled')+' '+(hidden?'hidden':'')+'><img class="draft-physical-card-art" src="'+data.cardImages[card]+'" alt="'+esc(card)+' 실물 카드"><span class="card-kind">'+(industry?'산업':'도시')+'</span><span class="card-label">'+esc(card)+'</span></button>'}).join('');
 $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===cardFilter)));$('#nextHandTitle').textContent='내 손패 · '+hand.length+'장';$('#nextHandHint').textContent=session.pending?'실행 결과를 확인한 뒤 행동을 확정하세요.':humanTask?'카드나 행동을 바꾸면 현재 선택을 취소합니다.':human?'사용할 카드와 행동을 선택하세요.':'다른 참가자의 차례입니다.';syncCards();
}
function renderActions(){
 const human=humanCanSelect(),selected=session.cardIndex!=null?humanAvailability(session.cardIndex):null;
 $('#actions').innerHTML=Object.keys(actionIcons).map(type=>{const available=human&&(humanTask?session.game.players[0].hand.some((_,i)=>!humanAvailability(i)[type]):selected?!selected[type]:session.game.players[0].hand.some((_,i)=>!humanAvailability(i)[type])),icon='assets/board-components/resource/'+actionIcons[type]+'.webp';return '<button type="button" data-action="'+type+'" '+(available?'':'disabled')+' class="'+(session.type===type?'next-action-active':'')+'" title="'+esc(available?'':selected?.[type]||'현재 실행할 수 있는 카드가 없습니다.')+'"><img src="'+icon+'" alt="">'+type+'</button>'}).join('');
 $('#nextActionHint').textContent=session.pending?'실행 결과를 확인한 뒤 아래 버튼으로 확정하세요. 되돌리기도 가능합니다.':humanTask?session.type+' · 아래 선택을 이어가세요.':session.type&&session.cardIndex==null?session.type+'에 사용할 카드를 선택하세요.':session.cardIndex==null?'카드 또는 행동을 먼저 선택하세요.':'행동을 선택하면 세부 선택지가 표시됩니다.';
 const step=session.pending||humanTask?'detail':session.cardIndex!=null?'action':'card';$$('.player-flow [data-step]').forEach(el=>{const active=el.dataset.step===step;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
 $('#nextSelection').textContent=session.pending?'실행 결과 확인 중':[session.cardIndex!=null?session.game.players[0].hand[session.cardIndex]:'카드 미선택',session.type||'행동 미선택'].join(' · ');
}
function pickerMarkup(item,index,show,label){const text=String(show(item)),network=/네트워크 (선택|타일)$/.test(label)&&item?.n;return '<button type="button" class="picker-option'+(network?' picker-network-tile-choice':'')+'" data-human-pick="'+index+'" aria-label="'+esc(text)+'" title="'+esc(text)+'">'+(network?'<img src="'+board.netImage(network.id,session.game.players[0].color)+'" alt="">'+(item.vanderbilt?'<b class="picker-network-vanderbilt" aria-hidden="true">V</b>':''):'<span>'+esc(text)+'</span>')+'</button>'}
function renderDetails(){
 const el=$('#nextDetails');el.hidden=!chooser&&!mapChoice;if(el.hidden){el.innerHTML='';return}
 const c=chooser||mapChoice;
 if(chooser){c.shown=c.includeV?[...c.items,...c.vander]:c.items;el.innerHTML='<div class="section-head"><h3 tabindex="-1">'+esc(c.label)+'</h3><button type="button" data-human-cancel>취소</button></div><p>'+esc(c.hint)+'</p>'+(c.vander.length?'<label class="vanderbilt-toggle"><input type="checkbox" data-human-v '+(c.includeV?'checked':'')+'> 밴더빌트 구매 후보 포함</label>':'')+'<div class="picker-items">'+(c.shown.map((item,i)=>pickerMarkup(item,i,c.show,c.label)).join('')||'<p>가능한 선택지가 없습니다.</p>')+'</div>';}
 else{c.shown=c.includeV?[...c.items,...c.vander]:c.items;el.innerHTML='<div class="section-head"><h3 tabindex="-1">'+esc(c.hint)+'</h3><button type="button" data-human-cancel>취소</button></div><p>지도에서 밝게 표시된 '+(c.type==='build'?'칸 또는 유전':'경로')+'을 선택하세요.</p><details><summary>목록에서 선택</summary><div class="picker-items">'+c.shown.map((item,i)=>pickerMarkup(item,i,x=>mapItemLabel(x,c.type),c.hint)).join('')+'</div></details>';}
}
function mapItemLabel(item,type){return type==='build'?item.city+(item.i>=0?' '+(item.i+1)+'번 칸':' 유전 위')+' · '+(item.g?.name||'산업'):item.e.a+' — '+item.e.b+' · '+item.n.name}
function settleChoice(item){const c=chooser||mapChoice;if(!c)return;chooser=null;mapChoice=null;render();c.resolve(item)}
function pickHuman(label,items,show=x=>x,hint='항목을 선택하세요.',vander=[],includeV=false){return new Promise(resolve=>{chooser={label,items,show,hint,vander,includeV:includeV&&vander.length>0,resolve};render();focusPanel('#nextDetails')})}
function mapHuman(type,items,vander,hint){return new Promise(resolve=>{mapChoice={type,items,vander,hint,includeV:false,resolve};render();focusPanel('#mapWrap')})}
async function cancelHuman(){humanEpoch++;const old=humanTask;settleChoice(null);if(old)await old.catch(()=>{});provisional=null;chooser=null;mapChoice=null;}
async function cancelHumanAction(){const request=++selectionRequest,owner=session;await cancelHuman();if(request===selectionRequest&&owner===session){owner?.clear();render()}}
async function chooseHumanCard(index){
 if(!humanCanSelect())return;const request=++selectionRequest,wasChoosing=!!humanTask,action=wasChoosing?null:session.type;if(wasChoosing){session.clear();session.cardIndex=index;render();await cancelHuman()}if(request!==selectionRequest)return;
 if(!wasChoosing)session.selectCard(index);session.type=action;proposal=null;
 if(action&&session.cardIndex!=null)return runHumanAction(action);render();
}
async function chooseHumanAction(type){
 if(!humanCanSelect())return;const request=++selectionRequest;if(humanTask)await cancelHuman();if(request!==selectionRequest)return;session.selectType(type);
 if(session.cardIndex==null||humanAvailability(session.cardIndex)[type]){session.cardIndex=null;render();return}return runHumanAction(type);
}
async function runHumanAction(type){
 if(!humanCanSelect()||humanTask||session.cardIndex==null)return;const owner=session,revision=owner.revision,index=owner.cardIndex,token=++humanEpoch;
 const cancelled=()=>token!==humanEpoch||session!==owner||owner.revision!==revision||currentView!=='gameView';
 const ui={targetSelectMode,pick:pickHuman,map:mapHuman,preview:g=>{if(!cancelled()){provisional=g;render()}},alert:value=>message(value)};
 const work=Promise.resolve().then(()=>H.run(owner.game,data,type,index,ui,cancelled));humanTask=work;render();let staged=false;
 try{const result=await work;if(result&&!cancelled())staged=owner.stagePrepared(result,revision);if(staged)persist();}
 catch(error){if(!cancelled()){message('행동을 실행하지 못했습니다: '+error.message);console.error(error)}}
 finally{if(humanTask===work){humanTask=null;chooser=null;mapChoice=null;provisional=null;if(!staged&&token===humanEpoch)owner.clear();render();if(staged)focusPanel('#pendingResult')}}
}
function renderPending(){const box=$('#pendingResult'),end=$('#nextEndTurn');box.hidden=end.hidden=!session.pending;if(!session.pending){box.innerHTML='';return}const {before,after,action}=session.pending,p=before.players[0],n=after.players[0];box.innerHTML=`<b>실행 결과 · 아직 확정 전</b><p>${esc(title(action))}</p><div>현금 $${p.money} → $${n.money} · VP ${p.vp} → ${n.vp}<br>수입 ${p.income} → ${n.income}칸 · 폐기 ${esc(action.cardUse.card)}</div>`;end.textContent=before.actionCount+1>=(before.era===1&&before.round===1?1:2)?'턴 종료 · 실행 확정 및 손패 보충':'행동 확정 · 다음 행동';end.disabled=busy;}
function renderAI(){if(!session)return;const g=session.game,index=F.active(g),p=g.players[index];$('#automaPanel').setAttribute('aria-busy',String(busy));$('.draft-automa-heading strong').textContent=index?p.name+' 행동':'오토마 행동';$('#aiStatus').textContent=busy?p.name+'가 다음 행동을 계산합니다':paused?'오토마 진행 일시정지':auto?'오토마 자동 실행':p.name+' 행동 확인';$('#aiDescription').textContent=paused?'되돌린 결과와 보드를 확인한 뒤 다시 실행할 수 있습니다.':auto?'내 행동을 확정하면 오토마가 턴 순서대로 진행합니다.':'계산된 행동과 비용을 확인한 뒤 실행하세요.';$('#decide').textContent=paused?'오토마 행동 다시 실행':auto?'지금 실행':'다음 행동 계산';$('#decide').disabled=busy||index===0||!!g.gameOver||!!session.pending;$('#pauseAI').textContent=paused?'자동 진행 재개':'자동 진행 일시정지';$('#pauseAI').disabled=!auto||index===0;$('#proposal').innerHTML=proposal?`<h3>${esc(title(proposal))}</h3><p>비용 $${cost(proposal)} · 카드 ${esc(proposal.cardUse?.card)}</p><details><summary>선택 이유</summary><p>${esc(proposal.reason)}</p></details><button id="executeAI" class="primary">확인하고 실행</button>`:'';}
function renderMarkets(g){const resources=board.resources;$('#markets').innerHTML=Object.entries(g.markets).map(([city,stock])=>`<p><b>${esc(city)} · $${data.locations.find(l=>l.name===city).price}</b><br>${Object.entries(stock).map(([r,n])=>r+' '+n).join(' · ')}</p>`).join('');$('#marketBrief').innerHTML=Object.keys(resources).filter(r=>r!=='오일').map(r=>`<span><img src="assets/board-components/resource/${resources[r]}.webp" alt="${r}"> ${Object.values(g.markets).reduce((n,s)=>n+(s[r]||0),0)}</span>`).join('');$('#shared').innerHTML='<h4>상인 시장</h4>'+Object.entries(g.setup.merchant).map(([c,v])=>`<p>${esc(c)} · ${esc(v)}${g.merchantUsed[c]?' (최초 보너스 소진)':''}</p>`).join('')+'<h4>품질 보상</h4>'+Object.entries(g.setup.quality).map(([k,v])=>`<p>${k} · ${esc(v)}${g.players.some(p=>p.qualityClaimed.includes(k))?' (수령 완료)':''}</p>`).join('');}
function renderPersonal(g){const owner=Number($('#personalOwner').value)||0,p=g.players[owner],view=F.project(g,owner).presentation,layout=view.personalLayout,networkLayout=view.networkLayout;
 const tiles=groups.map(group=>{const left=group.count-view.used(group.id),slot=layout.slots[group.id];if(!left||!slot)return '';return `<span class="physical-personal-tile ${view.unlocked(group.id)?'ready':'locked'}" role="img" aria-label="${esc(group.name+' · 남은 '+left+'장'+(view.unlocked(group.id)?'':' · 잠김'))}" style="--slot-x:${slot.x*100}%;--slot-y:${slot.y*100}%;--tile-size:${layout.tileScale*100}%"><span class="physical-personal-tile-stack"><img src="${board.image(group.id,p.color)}" alt=""></span>${left>1?`<b class="physical-personal-tile-count">×${left}</b>`:''}</span>`}).join('');
 const nets=core.networks.filter(n=>view.networkRemaining(n,p.networkBuilt,p.lightTrains)>0),locked=n=>!n.start&&!view.complete(n.req);
 const lockedTiles=nets.filter(locked).map(n=>{const slot=networkLayout.slots[n.id];return slot?`<span class="physical-personal-network-tile locked" style="--network-x:${slot.x*100}%;--network-y:${slot.y*100}%;--network-size:${networkLayout.tileScale*100}%" role="img" aria-label="${esc(n.name+' · 잠김')}"><span class="physical-personal-network-tile-stack"><img src="${board.netImage(n.id,p.color)}" alt=""></span></span>`:''}).join('');
 $('#personal').innerHTML=`<div id="personalBoard" class="physical-personal-board" role="group" aria-label="${esc(p.name)} 개인판"><img class="physical-personal-board-art" src="${layout.asset}" width="${layout.width}" height="${layout.height}" alt=""><div class="physical-personal-board-overlay">${layout.labels.map(l=>`<span class="physical-personal-track-label" style="--label-x:${l.x*100}%;--label-y:${l.y*100}%">${l.text}</span>`).join('')}${tiles}${lockedTiles}</div></div><h3>해금된 네트워크 리소스</h3><div class="network-grid physical-network-resource-rack">${nets.filter(n=>!locked(n)).map(n=>`<article class="network-tile personal-network-resource" role="group" aria-label="${esc(n.name)}"><span class="personal-network-resource-art"><img src="${board.netImage(n.id,p.color)}" alt=""></span><span class="personal-network-resource-info"><strong>${esc(n.name)}</strong><span class="board-counts">◇ ${view.networkRemaining(n,p.networkBuilt,p.lightTrains)}장</span><span class="board-facts board-cost">${view.boardFacts(n.cost)}</span><span class="board-facts board-effect">${view.boardFacts(n.effect)}</span></span></article>`).join('')}</div>`;
}
function renderAvailable(g){const p=g.players[0],view=F.project(g,0).presentation;
 const lanes=Object.entries(core.groups).flatMap(([track,gs])=>gs.filter(group=>view.unlocked(group.id)&&view.used(group.id)<group.count).map(group=>`<section class="mini-board-lane" data-lane="${track}">${view.availableIndustryTileMarkup(group,group.count-view.used(group.id),track).replace('data-stack="'+track+'"','data-inventory="'+group.id+'"').replace('/industry/blue/','/industry/'+p.color+'/')}<h3>${view.boardLaneTitle(track)}</h3></section>`)).join('');
 const nets=core.networks.filter(n=>(n.start||view.complete(n.req))&&view.networkRemaining(n,p.networkBuilt,p.lightTrains)>0);
 $('#available').innerHTML=`<div class="mini-personal-board" role="group" aria-label="현재 사용 가능한 산업 개인판">${lanes||'<p>모든 산업 타일 사용 완료</p>'}</div><div class="available-net" role="group" aria-label="사용 가능 네트워크">${nets.map(n=>`<span class="available-network-tile" role="img" aria-label="${esc(n.name+' · 남은 '+view.networkRemaining(n,p.networkBuilt,p.lightTrains)+'장')}"><img src="${board.netImage(n.id,p.color)}" alt=""></span>`).join('')}</div>`;
}
function renderLogs(g){const html=g.logs.slice().reverse().map(l=>`<article class="log-row"><b>${esc(l.name||'공통')} · ${esc(l.title)}</b><p>${esc(l.detail)}</p></article>`);$('#logs').innerHTML=html.join('')||'<p>아직 처리한 행동이 없습니다.</p>';$('#latest').innerHTML=html.slice(0,2).join('')||'<p>아직 실행한 행동이 없습니다.</p>';if(g.gameOver){const winners=g.gameOver.winners.map(i=>g.players[i].name).join(' · ');$('#latest').innerHTML='<h3>'+esc(winners)+' 승리</h3>'+g.gameOver.rank.map((i,n)=>`<p>${n+1}위 ${esc(g.players[i].name)} · ${g.players[i].vp}VP · 수입 ${g.players[i].income}칸</p>`).join('')+$('#latest').innerHTML;}}
function matchesMapItem(item,kind,id){
 if(mapChoice.type==='edge'){const route=data.routes.find(r=>r.id===id);return kind==='route'&&route?.gameId===(item.id||item.e?.id)}
 if(kind==='oil'){const l=data.locations.find(l=>l.id===id);return item.city===l?.name&&item.g?.id==='k5'}
 if(kind!=='slot')return false;const c=data.catalog.find(c=>c.id===id),l=data.locations.find(l=>l.id===c?.parentId),index=Number(id.split('.').pop())-1;return item.city===l?.name&&item.i===index;
}
function renderBoard(g){
 closeOnlineNetworkInfo();
 board.render(g,session.pending?.action||proposal);const selecting=!!mapChoice&&!session.pending,choices=selecting?(mapChoice.includeV?[...mapChoice.items,...mapChoice.vander]:mapChoice.items):[];
 document.body.classList.toggle('map-selecting',selecting);
 for(const node of $$('#board [data-slot],#board [data-route],#board [data-oil]')){const kind=node.dataset.slot?'slot':node.dataset.route?'route':'oil',id=node.dataset[kind],legal=selecting&&choices.some(a=>matchesMapItem(a,kind,id));node.classList.toggle('legal',legal);node.style.pointerEvents=selecting&&!legal?'none':'';node.setAttribute('role','button');node.setAttribute('tabindex',selecting&&!legal?'-1':'0');let label;if(kind==='slot'){const c=data.catalog.find(x=>x.id===id);label=c.name+' '+(selecting?legal?'선택 가능':'선택 불가':'정보')}else if(kind==='route'){const r=data.routes.find(x=>x.id===id);label=r.from+'—'+r.to+' '+(selecting?legal?'선택 가능':'선택 불가':'네트워크 정보')}else label='유전 '+(selecting?legal?'선택 가능':'선택 불가':'정보');node.setAttribute('aria-label',label);}
 board.highlight(new Set($$('#board [data-route].legal').map(n=>n.dataset.route)));board.configureNetworkTargets(selecting?{kind:'map'}:null);for(const node of $$('#board .route-hit:not(.legal)')){node.removeAttribute('role');node.removeAttribute('aria-label');node.setAttribute('tabindex','-1');}$('#mapInfo').hidden=true;
 $('#mapSelectionBar').hidden=!selecting;$('#mapSelectionTitle').textContent=selecting?mapChoice.hint:'';$('#mapVanderbiltToggle').hidden=!selecting||!mapChoice.vander.length;$('#mapVanderbiltInput').checked=selecting&&mapChoice.includeV;applyCamera();
}
function showInfo(text){$('#mapInfo').hidden=false;$('#mapInfo').innerHTML='<button id="closeMapInfo" aria-label="정보 닫기">×</button>'+esc(text)}
function targetClick(node,event){if(Date.now()<ignoreClickUntil||!session)return;if(node.dataset.networkInfo){if(!mapChoice)showOnlineNetworkInfo(board.networkDescriptor(provisional||session.display(),node.dataset.networkInfo),event);return;}if(busy||session.pending)return;const kind=node.dataset.slot?'slot':node.dataset.route?'route':'oil',id=node.dataset[kind];if(mapChoice){const pool=mapChoice.includeV?[...mapChoice.items,...mapChoice.vander]:mapChoice.items,item=pool.find(x=>matchesMapItem(x,kind,id));if(!item){message('밝게 표시된 대상을 선택하세요.');return}settleChoice({...item,_includeV:mapChoice.includeV});return}
 const g=session.display();if(kind==='slot'){const c=data.catalog.find(x=>x.id===id),l=data.locations.find(x=>x.id===c.parentId),i=Number(id.split('.').pop())-1,p=g.cities[l.name][i];showInfo(l.name+' '+(i+1)+'번 칸\n'+(Number.isInteger(p.owner)?g.players[p.owner].name+' · '+p.industry+' · '+(p.flipped?'뒤집힘':'앞면')+'\n남은 자원: '+Object.entries(p.resources||{}).map(([r,n])=>r+' '+n).join(', '):'건설 가능: '+l.slots[i].join(' / ')))}else if(kind==='route'){const r=data.routes.find(x=>x.id===id),p=g.edges[r.gameId];showInfo(r.from+'—'+r.to+'\n'+(p?g.players[p.owner].name+' · '+core.networks.find(n=>n.id===p.networkId)?.name:'미설치')+'\n'+(r.type==='pipeline'?'기본 오일 '+r.oil:r.bonus||'노선 보너스 없음'))}else{const l=data.locations.find(x=>x.id===id),p=g.setup.oil[l.name];showInfo((p.revealed?p.value:'미공개 유전')+'\n남은 오일 '+(g.oilCities[l.name]?.resource??g.oilfields[l.name]))}}

async function task(fn){if(busy)return;message('');try{await fn()}catch(e){message(e.message);console.error(e)}}
function scheduleAI(){clearTimeout(timer);timer=null;if(!session||!auto||paused||busy||humanTask||storageError||session.pending||session.game.gameOver||F.active(session.game)===0||currentView!=='gameView')return;const token=epoch;timer=setTimeout(()=>{timer=null;if(token===epoch)runAI(true)},650)}
async function runAI(execute){if(!session||busy||session.pending||session.game.gameOver||F.active(session.game)===0)return;const token=++epoch,revision=session.revision,actor=F.active(session.game);busy=true;document.body.classList.add('thinking');render();try{const action=await F.chooseAsync(session.game,()=>new Promise(r=>setTimeout(r,0)),()=>token!==epoch);if(!action||token!==epoch)return;if(execute){if(session.applyAI(action,revision)){proposal=null;persist();showToast(session.game.players[actor].name+' · '+title(action))}}else proposal=action;}catch(e){paused=true;message('오토마 실행을 중단했습니다: '+e.message);console.error(e)}finally{busy=false;document.body.classList.remove('thinking');render();scheduleAI()}}
function showToast(text){$('#automaToast').textContent=text;$('#automaToast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#automaToast').hidden=true,2600)}
$('#colors').innerHTML=F.COLORS.map((c,i)=>`<label>${i?'오토마 '+i:'플레이어'}<select data-color="${i}" aria-label="${i?'오토마 '+i:'플레이어'} 색상">${F.COLORS.map(v=>`<option value="${v}" ${c===v?'selected':''}>${board.colorNames[v]}</option>`).join('')}</select>${i?`<select data-strategy="${i}" aria-label="오토마 ${i} 전략"><option value="balanced">균형형</option><option value="industry" ${i===2?'selected':''}>산업·판매형</option><option value="network" ${i===3?'selected':''}>네트워크형</option></select>`:''}</label>`).join('');
$('#personalOwner').innerHTML=['나','오토마 1','오토마 2','오토마 3'].map((n,i)=>`<option value="${i}">${n}</option>`).join('');
if(session){$$('[data-color]').forEach(e=>e.value=session.game.players[Number(e.dataset.color)].color);$$('[data-strategy]').forEach(e=>e.value=session.game.players[Number(e.dataset.strategy)].strategy)}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-nav]'),card=e.target.closest('[data-card]'),action=e.target.closest('[data-action]'),filter=e.target.closest('[data-filter]'),mode=e.target.closest('[data-auto]'),inventory=e.target.closest('[data-inventory]'),pick=e.target.closest('[data-human-pick]');
 if(nav)view(nav.dataset.nav);
 if(filter){cardFilter=filter.dataset.filter;if(session)renderHand(session.display())}
 if(mode){auto=mode.dataset.auto==='true';paused=false;proposal=null;stopAI();saveSettings();render();scheduleAI()}
 if(card)void chooseHumanCard(Number(card.dataset.card));if(action)void chooseHumanAction(action.dataset.action);
 if(pick){const c=chooser||mapChoice,item=c?.shown[Number(pick.dataset.humanPick)];if(c&&item!==undefined)settleChoice(mapChoice?{...item,_includeV:mapChoice.includeV}:item)}
 if(e.target.closest('[data-human-cancel]'))void cancelHumanAction();
 if(inventory){$('#personalOwner').value='0';view('boardView')}
 if(e.target.id==='closeMapInfo')$('#mapInfo').hidden=true;
 if(e.target.id==='executeAI')task(()=>{if(!proposal||busy)return;const actor=F.active(session.game);if(session.applyAI(proposal,session.revision)){showToast(session.game.players[actor].name+' · '+title(proposal));proposal=null;persist();render();scheduleAI()}});
});
document.addEventListener('change',e=>{if(e.target.matches('[data-human-v]')&&chooser){chooser.includeV=e.target.checked;render()}if(e.target.id==='mapVanderbiltInput'&&mapChoice){mapChoice.includeV=e.target.checked;render()}if(e.target.id==='targetSelectMode'){selectionRequest++;void cancelHuman().then(()=>{session?.clear();targetSelectMode=e.target.value;saveSettings();render()})}});
$('#start').onclick=()=>task(async()=>{const selection=$$('[data-color]').map(e=>e.value);if(!F.validColors(selection))throw Error('네 참가자는 서로 다른 색상을 선택해야 합니다.');if(session&&!confirm('진행 중인 4인 게임을 새 게임으로 바꿀까요? 2인 게임은 유지됩니다.'))return;await cancelHuman();stopAI();const g=F.createGame(data,selection);$$('[data-strategy]').forEach(e=>g.players[Number(e.dataset.strategy)].strategy=e.value);session=new FourFlow(F,data,g);paused=false;proposal=null;currentView='gameView';resetCamera();persist();saveSettings();render();scheduleAI()});
$('#cancelSelection').onclick=()=>void cancelHumanAction();
$('#nextEndTurn').onclick=()=>task(()=>{session.confirm();proposal=null;persist();render();scheduleAI()});
$('#undo').onclick=$('#undoRecent').onclick=()=>task(async()=>{selectionRequest++;await cancelHuman();stopAI();paused=true;proposal=null;if(session.undo()){persist();render();message('직전 실행을 되돌렸습니다. 오토마 자동 진행은 일시정지되었습니다.')}});
$('#decide').onclick=()=>{paused=false;if(auto)runAI(true);else runAI(false)};
$('#pauseAI').onclick=()=>{paused=!paused;stopAI();proposal=null;render();scheduleAI()};$('#automaToast').onclick=()=>$('#automaToast').hidden=true;
$('#personalOwner').onchange=()=>renderPersonal(session.display());
$('#export').onclick=()=>task(()=>{if(!session)throw Error('저장할 게임이 없습니다.');const url=URL.createObjectURL(new Blob([JSON.stringify(session.serializable(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='pittsburgh-four-player-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('#import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const imported=F.validate(JSON.parse(await file.text())),next=new FourFlow(F,data,imported);if(session&&!confirm('현재 4인 진행을 이 저장 파일로 바꿀까요?'))return;selectionRequest++;await cancelHuman();stopAI();session=next;paused=true;proposal=null;currentView='gameView';resetCamera();persist();render()}catch(err){message(err.message)}finally{e.target.value=''}};
$('#copyLog').onclick=()=>task(async()=>{if(!session)throw Error('게임을 시작하세요.');await navigator.clipboard.writeText(session.display().logs.map(l=>(l.name||'공통')+' · '+l.title+'\n'+l.detail).join('\n\n'));message('기록을 복사했습니다.')});
// Board-local camera only. Wheel, dragging and pinch never change game data.
const camera={x:0,y:0,w:2000},svg=$('#board'),wrap=$('#mapWrap'),pointers=new Map();let last=null,pinch=null,ignoreClickUntil=0;
svg.setAttribute('role','group'); // Keep the labeled SVG slot/route buttons in the accessibility tree.
function clampCamera(){camera.w=Math.max(450,Math.min(2000,camera.w));camera.x=Math.max(0,Math.min(2000-camera.w,camera.x));camera.y=Math.max(0,Math.min(2000-camera.w,camera.y))}
function applyCamera(){clampCamera();svg.setAttribute('viewBox',`${camera.x} ${camera.y} ${camera.w} ${camera.w}`)}
function resetCamera(){closeOnlineNetworkInfo();Object.assign(camera,{x:0,y:0,w:2000});applyCamera()}
function point(x,y){const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(svg.getScreenCTM().inverse())}
function zoomAt(factor,x,y){closeOnlineNetworkInfo();const p=point(x,y),old=camera.w;camera.w=Math.max(450,Math.min(2000,old/factor));camera.x=p.x-(p.x-camera.x)*camera.w/old;camera.y=p.y-(p.y-camera.y)*camera.w/old;applyCamera()}
function buttonZoom(factor){const r=svg.getBoundingClientRect();zoomAt(factor,r.x+r.width/2,r.y+r.height/2)}
$('#zoomIn').onclick=()=>buttonZoom(1.3);$('#zoomOut').onclick=()=>buttonZoom(1/1.3);$('#fit').onclick=resetCamera;
wrap.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
wrap.addEventListener('pointerdown',e=>{if(e.target.closest('#mapInfo,#physicalBoardInfoPopover'))return;closeOnlineNetworkInfo();if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});last={x:e.clientX,y:e.clientY};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2};ignoreClickUntil=Date.now()+350}});
wrap.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y),x=(a.x+b.x)/2,y=(a.y+b.y)/2;if(distance>0&&pinch.distance>0)zoomAt(distance/pinch.distance,x,y);pinch={distance,x,y};ignoreClickUntil=Date.now()+350;}else if(pointers.size===1&&last){const dx=e.clientX-last.x,dy=e.clientY-last.y;if(Math.abs(dx)+Math.abs(dy)>3)ignoreClickUntil=Date.now()+250;const r=svg.getBoundingClientRect(),scale=camera.w/Math.min(r.width,r.height);camera.x-=dx*scale;camera.y-=dy*scale;applyCamera()}last={x:e.clientX,y:e.clientY};});
for(const event of ['pointerup','pointercancel','lostpointercapture'])wrap.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=null;last=null});
svg.addEventListener('click',e=>{const node=e.target.closest('[data-slot],[data-route],[data-oil],[data-network-info]');if(node)targetClick(node,e)});svg.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[role=button]')){e.preventDefault();targetClick(e.target)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOnlineNetworkInfo();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAI();else scheduleAI()});
render();if(session&&paused)message('저장된 4인 게임을 복원했습니다. 오토마 차례이면 ‘다시 실행’을 눌러 이어가세요.');
})().catch(e=>{document.querySelector('#message').textContent='4인 UI 초기화 오류: '+e.message;console.error(e)});
