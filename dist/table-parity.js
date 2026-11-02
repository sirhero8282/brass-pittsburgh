(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function industry({group,slot,left,ready,layout,color,track,markup,manual=false}){
  const status=!left?'빈 자리':ready?'건설 가능':'잠김';
  const label=group.name+' · '+status+' · 남은 '+left+'장 · '+group.effect;
  // Use the same cost and reverse-side reward symbols as the board-side inventory.
  const card=markup(group,left,track)
   .replace(/^<button[^>]*>/,'<span class="tile next available-industry-tile">')
   .replace('</button>','</span>').replace('/industry/blue/','/industry/'+color+'/');
  const x=slot.x*layout.width,y=slot.y*layout.height;
  return `<foreignObject x="${x-92}" y="${y-61}" width="184" height="147" data-personal-industry="${esc(group.id)}"><div xmlns="http://www.w3.org/1999/xhtml" class="available-now personal-slot-card ${left?(ready?'ready':'locked'):'vacant'}" ${manual?'data-group="'+esc(group.id)+'" role="button" tabindex="0"':'role="img"'} aria-label="${esc(label)}" title="${esc(label)}"><div class="mini-board-lane">${card}</div></div></foreignObject>`;
}
function networkSlotClass(remaining){return remaining>0?"in-stock":"vacant"}
function personal({p,view,core,board,groups,boardOnly=false}){const layout=view.personalLayout,networkLayout=view.networkLayout;
 const tiles=groups.map(group=>{
  const slot=layout.slots[group.id];
  if(!slot)return '';
  const left=group.count-view.used(group.id),ready=view.unlocked(group.id);
  return industry({group,slot,left,ready,layout,color:p.color,track:group.ids[0].split(':')[0],markup:view.availableIndustryTileMarkup});
 }).join('');
 const industryLayer=`<svg class="personal-slot-layer" viewBox="0 0 ${layout.width} ${layout.height}" aria-label="산업 타일">${tiles}</svg>`;
 const nets=core.networks,locked=n=>!n.start&&!view.complete(n.req);
 const networkSlots=nets.map(n=>{
  const slot=networkLayout.slots[n.id];
  if(!slot)return '';
  const remaining=view.networkRemaining(n,p.networkBuilt,p.lightTrains);
  const label=n.name+' · '+(remaining?(locked(n)?'미사용 · 잠김':'미사용 · 건설 가능'):'사용함');
  return `<span class="physical-personal-network-tile ${networkSlotClass(remaining)}" style="--network-x:${slot.x*100}%;--network-y:${slot.y*100}%;--network-size:${networkLayout.tileScale*100}%" role="img" aria-label="${esc(label)}" title="${esc(label)}"><span class="physical-personal-network-tile-stack"><img src="${board.netImage(n.id,p.color)}" alt=""></span></span>`;
 }).join('');
 const mat=`<div ${boardOnly?'':'id="personalBoard"'} class="physical-personal-board" role="group" aria-label="${esc(p.name)} 개인판"><img class="physical-personal-board-art" src="${layout.asset}" width="${layout.width}" height="${layout.height}" alt=""><div class="physical-personal-board-overlay">${layout.labels.map(l=>`<span class="physical-personal-track-label" style="--label-x:${l.x*100}%;--label-y:${l.y*100}%">${l.text}</span>`).join('')}${industryLayer}${networkSlots}</div></div>`;
 if(boardOnly)return mat;
 $('#personal').innerHTML=`<p class="personal-board-key">타일 왼쪽은 건설 비용, 오른쪽은 뒤집힌 뒤 보상입니다. 흐린 타일은 빈 자리입니다.</p><div class="personal-board-scroll">${mat}</div><h3>해금된 네트워크 리소스</h3><div class="network-grid physical-network-resource-rack">${nets.filter(n=>!locked(n)).map(n=>`<article class="network-tile personal-network-resource ${view.networkRemaining(n,p.networkBuilt,p.lightTrains)?'':'vacant'}" role="group" aria-label="${esc(n.name)}"><span class="personal-network-resource-art"><img src="${board.netImage(n.id,p.color)}" alt=""></span><span class="personal-network-resource-info"><strong>${esc(n.name)}</strong><span class="board-counts">◇ ${view.networkRemaining(n,p.networkBuilt,p.lightTrains)}장</span><span class="board-facts board-cost">${view.boardFacts(n.cost)}</span><span class="board-facts board-effect">${view.boardFacts(n.effect)}</span></span></article>`).join('')}</div>`;
}
function finalScores(game,seat){
 const {rank,winners}=game.gameOver;
 $('#finalWinner').textContent=winners.map(seat=>game.players[seat].name).join(' · ')+(winners.length>1?' 공동 우승':' 우승');
 const columns=rank.map((seat,index)=>{
  const player=game.players[seat];
  const [first,second]=[1,2].map(era=>game.eraScores?.[era]?.find(row=>row.player===seat));
  const sum=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?a+b:null;
  const network=sum(first?.network,second?.network),industry=sum(first?.industry,second?.industry);
  const remainder=network!==null&&industry!==null?player.vp-network-industry:null;
  return {player,seat,first,second,network,industry,remainder,place:winners.includes(seat)&&winners.length>1?'공동 1위':(index+1)+'위'};
 });
 const number=value=>Number.isFinite(value)?value:'미기록';
 const pair=(first,second)=>number(first)+' / '+number(second);
 const rows=[
  ['네트워크 · 시대 I',s=>s.first?.network],['네트워크 · 시대 II',s=>s.second?.network],['네트워크 합계',s=>s.network,'subtotal'],
  ['산업 · 시대 I',s=>s.first?.industry],['산업 · 시대 II',s=>s.second?.industry],['산업 합계',s=>s.industry,'subtotal'],
  ['재봉틀 · 시대 I/II',s=>pair(s.first?.sewing,s.second?.sewing)],
  ['다상 교류 발전기 · 시대 I/II',s=>pair(s.first?.special?.polyphase,s.second?.special?.polyphase)],
  ['기관차 공장 · 중량열차',s=>{const special=s.second?.special;return special?special.heavyTrains+'개 × 4 = '+special.locomotive:null;}],
  ['기타 승점',s=>s.remainder===null?null:Math.max(0,s.remainder)],['점수 조정',s=>s.remainder===null?null:Math.min(0,s.remainder)],
  ['최종 승점',s=>s.player.vp,'total'],['수입 트랙',s=>s.player.income+'칸'],['최종 순위',s=>s.place]
 ];
 $('#finalColumns').innerHTML='<th scope="col">항목</th>'+columns.map(s=>'<th scope="col">'+esc(s.player.name)+(s.seat===seat?' (나)':'')+'</th>').join('');
 $('#finalRows').innerHTML=rows.map(([label,value,style])=>'<tr class="'+(style||'')+'"><th scope="row">'+label+'</th>'+columns.map(s=>'<td>'+esc(value(s)??'미기록')+'</td>').join('')+'</tr>').join('');
 $('#legacyScoreNote').hidden=!$('#finalRows').textContent.includes('미기록');
 if(!$('#finalResults').open)$('#finalResults').showModal();
}
function hand(el,count,whiskey){const label=count===null?'실물 카드 선택':'내 손패 · '+count+'장',n=Math.max(0,Math.min(3,Number(whiskey)||0));el.innerHTML=label+' <span class="hand-whiskey-rack" role="img" aria-label="위스키 '+n+'개">'+('<img src="assets/icons/game/whiskey.png" alt="">').repeat(n)+'</span>'}
function stamp(row){return row.era&&row.round?'시대 '+(row.era===1?'I':'II')+' · 라운드 '+row.round+(row.turn?' · 턴 '+row.turn:'')+(row.actionNo?' · 행동 '+row.actionNo:''):''}
function describeBuild({group,choice,location,index,game,seat,includeVanderbilt}){
 const city=location.name,allowed=location.slots[index]||[];
 const title=location.oil?city:city+' '+(index+1)+'번 칸';
 const entries=choice.buildGuide||[];
 const localOptions=choice.options.filter(o=>o.city===city&&o.slot===index);
 const vendor=localOptions.find(o=>o.vanderbilt&&(!group||o.groupId===group));
 if(vendor&&!includeVanderbilt){
  const entry=entries.find(e=>e.id===vendor.groupId),info=entry?.cities[city];
  const supply=(info?.purchase||[]).reduce((counts,r)=>{counts[r]=(counts[r]||0)+1;return counts},{});
  const needs=Object.entries(supply).map(([r,n])=>r+' '+n+'개').join(', ');
  return {title,text:(entry?.name||'건설')+'에 '+(needs||'추가 자원')+'가 부족합니다. 밴더빌트 구매를 포함하면 건설할 수 있습니다.'+(info?.total!=null?' 총비용 $'+info.total+'.':''),vendor:true};
 }
 const piece=game.cities[city]?.[index],occupied=(Number.isInteger(piece?.owner)||['player','automa'].includes(piece?.owner));
 const target=entry=>entry.track==='steel'&&entry.name.includes('마천루')?'마천루':entry.id==='m6'?'자동차':entry.industryCard;
 const upgrade=entry=>['c4','m5','m7'].includes(entry.id)||entry.track==='coke';
 const entry=entries.find(e=>e.id===group)||entries.find(e=>e.id==='k5'&&location.oil||!location.oil&&allowed.includes(target(e))&&occupied===upgrade(e));
 if(!entry)return {title,text:entries.length?'이 칸에 맞는 건설 후보가 없습니다. 지도 위에서 산업을 선택하면 해당 산업의 조건을 확인할 수 있습니다.':'개인판에 현재 건설할 수 있는 산업 타일이 없습니다.'};
 const info=entry.cities[city]||{},options=choice.options.filter(o=>o.city===city&&o.groupId===entry.id&&(includeVanderbilt||!o.vanderbilt));
 const reply=text=>({title:entry.name+' · '+title,text});
 if(entry.reason||info.reason)return reply(entry.reason||info.reason);
 if(entry.id==='k5')return reply(location.oil?'빈 유전에 송유관이 연결되어야 오일 시티를 지을 수 있습니다.':'오일 시티는 유전 위에 건설합니다.');
 if(location.oil)return reply('유전 위에는 오일 시티만 건설할 수 있습니다.');
 if(upgrade(entry))return reply((entry.track==='coke'||entry.id==='c4'?'내 뒤집힌 석탄 산업 타일':'내 뒤집힌 제조 상자 타일')+' 위에 건설해야 합니다.');
 if(occupied)return reply('이미 산업 타일이 있는 칸입니다. 이 산업은 빈 칸에 건설합니다.');
 if(!allowed.includes(target(entry)))return reply('이 칸의 허용 산업은 '+allowed.join(' · ')+'입니다. '+target(entry)+' 아이콘이 있는 칸을 선택하세요.');
 if(game.era===1&&game.cities[city]?.some(s=>s.owner===seat))return reply('1시대에는 한 도시에 내 산업을 하나만 건설할 수 있습니다.');
 const preferred=(info.slots||[]).filter(i=>location.slots[i]?.length<allowed.length);
 if(preferred.length){
  const recommended=options.filter(o=>preferred.includes(o.slot)).map(o=>o.slot);
  const label=preferred.map(i=>(i+1)+'번').join('·')+' 칸';
  const other=localOptions.filter(o=>o.groupId!==entry.id&&(includeVanderbilt||!o.vanderbilt)).map(o=>entries.find(e=>e.id===o.groupId)?.name).filter(Boolean);
  const vendorOnly=!recommended.length&&choice.options.some(o=>o.vanderbilt&&o.city===city&&o.groupId===entry.id&&preferred.includes(o.slot));
  const next=recommended.length?' 초록 테두리 칸을 선택하세요.':vendorOnly?' 그 칸에 지으려면 밴더빌트 구매도 필요합니다.':'';
  return {...reply(target(entry)+'은 '+label+'에 먼저 지어야 합니다.'+next+(other.length?' 이 칸에서 가능한 산업: '+[...new Set(other)].join(', ')+'.':'')),recommended,vendor:vendorOnly};
 }
 return reply('현재 조건에 맞는 건설 위치가 아닙니다. 지도에 표시된 건설 후보를 확인하세요.');
}
function guideInfo(c,location,index,game,seat){return {...describeBuild({group:c.group,location,index,game,seat,includeVanderbilt:c.includeV,choice:{buildGuide:c.guide,options:[...(c.normal||c.items),...c.vander].map(o=>({city:o.city,slot:o.i,groupId:o.g.id,vanderbilt:!!o.vanderbilt}))}}),location} }
function guideControl(c,refresh){let bar=$('#mapSelectionBar'),control=bar.querySelector('.ai-build-guide');if(!control&&!c?.guide)return;if(!control){control=document.createElement('span');control.className='ai-build-guide';bar.append(control)}control.replaceChildren();if(!c?.guide)return;const label=document.createElement('label'),select=document.createElement('select'),msg=document.createElement('span');label.textContent='산업 ';select.add(new Option('전체',''));for(const g of c.guide)select.add(new Option(g.name,g.id));select.value=c.group||'';select.onchange=()=>{c.group=select.value;reason({title:'',text:''});refresh()};label.append(select);msg.className='guide-reason';msg.setAttribute('role','status');control.append(label,msg)}
function reason(info){for(const prev of document.querySelectorAll('.guide-recommended'))prev.classList.remove('guide-recommended');
 for(const i of info.recommended||[]){const city=info.location;const selector=city.id?'[data-slot="slot.'+city.id.slice(9)+'.'+(i+1)+'"]':'[data-node="'+CSS.escape(city.name)+'"] [data-slot="'+i+'"]';document.querySelector(selector)?.classList.add('guide-recommended')}
 const el=document.querySelector('.guide-reason');if(el)el.textContent=info.title?info.title+' · '+info.text:''}
let priorRound=null,presenter=null;
function round(g){const card=$('#onlineRoundBanner');if(!card||!g)return;if(!presenter)presenter=roundPresenter(document,window);
const snap={status:g.gameOver?'finished':'playing',config:{map:'two'},seat:0,roomId:g.seed,revision:g.turn,game:{era:g.era,round:g.round,order:g.order,players:g.players}};presenter.receive(priorRound,snap);priorRound=snap}
// Only compare accepted server snapshots. Joining an ongoing game is silent.
function advancedRound(before, after) {
  if (!before?.game || before.roomId !== after.roomId || after.config.map !== 'two' ||
      before.status !== 'playing' || after.status !== 'playing' || after.revision <= before.revision) return false;
  const a = before.game, b = after.game;
  return b.era > a.era || (b.era === a.era && b.round > a.round);
}

function roundPresenter(doc, win) {
  const card = doc.querySelector('#onlineRoundBanner'), toggle = doc.querySelector('#roundSound');
  const pref = 'brass-playroom-round-sound';
  let sound = true, context, timer;
  try { sound = win.localStorage.getItem(pref) !== 'off'; } catch {}
  function label() {
    toggle.textContent = '라운드 알림음 ' + (sound ? '켜짐' : '꺼짐');
    toggle.setAttribute('aria-pressed', String(sound));
  }
  function unlock() {
    if (!sound || toggle.hidden) return;
    try {
      const Audio = win.AudioContext || win.webkitAudioContext;
      if (Audio) context ??= new Audio();
      if (context && context.state !== 'running') context.resume().catch(() => {});
    } catch {}
  }
  function chime() {
    if (!sound || context?.state !== 'running') return;
    try {
      for (const [offset, hz] of [[0, 523.25], [.14, 783.99]]) {
        const start = context.currentTime + offset, osc = context.createOscillator(), gain = context.createGain();
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(.075, start + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .25);
        osc.connect(gain); gain.connect(context.destination);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        osc.start(start); osc.stop(start + .26);
      }
    } catch {} // Visual notice also works when browser audio is unavailable.
  }
  label();
  doc.addEventListener('click', unlock, true);
  doc.addEventListener('keydown', unlock, true);
  toggle.onclick = () => {
    sound = !sound; label(); unlock();
    try { win.localStorage.setItem(pref, sound ? 'on' : 'off'); } catch {}
  };
  function clear() { win.clearTimeout(timer); card.hidden = true; }
  return {clear, receive(before, after) {
    toggle.hidden = after.config.map !== 'two';
    if (after.status !== 'playing') { clear(); return; }
    if (!advancedRound(before, after)) return;
    const g = after.game, starter = g.order[0];
    card.querySelector('small').textContent = before.game.era !== g.era ? '새 시대 시작' : '새 라운드';
    card.querySelector('strong').textContent = '시대 ' + g.era + ' · ' + g.round + '라운드 시작';
    card.querySelector('span').textContent = '선 플레이어 · ' + (g.players[starter]?.name || '') + (starter === after.seat ? ' (나)' : '');
    win.clearTimeout(timer); card.hidden = false; chime();
    timer = win.setTimeout(clear, 3000);
  }};
}

document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('.personal-slot-card[data-group]')){event.preventDefault();event.target.click()}});
globalThis.BrassTable={networkSlotClass,round,industry,personal,finalScores,hand,stamp,guideInfo,guideControl,reason};
})();