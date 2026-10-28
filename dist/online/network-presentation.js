// Presentation only: both maps use the retained 2P network dimensions, hit areas and picker.
(() => {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fact=(label,value)=>`<div class="physical-board-info-fact"><span>${esc(label)}</span><strong>${esc(value??'없음')}</strong></div>`;
 globalThis.onlineNetworkOptionMarkup=(option,choice,core,board,color,busy)=>{
  const text=option.label+(option.vanderbilt?' · 밴더빌트':''),network=/네트워크 (선택|타일)$/.test(choice.label)&&core.networks.find(n=>n.id===option.networkId);
  const attrs=`type="button" data-choice="${option.index}" aria-label="${esc(text)}" title="${esc(text)}" ${busy?'disabled':''}`;
  return network?`<button class="picker-option picker-network-tile-choice${option.vanderbilt?' vanderbilt-option':''}" ${attrs}><img src="${board.netImage(network.id,color)}" alt="">${option.vanderbilt?'<b class="picker-network-vanderbilt" aria-hidden="true">V</b>':''}</button>`:`<button class="picker-option" ${attrs}>${esc(text)}</button>`;
 };
 globalThis.createOnlineNetworkBoard=(data,core,base,getSeat)=>{
  const widths=data.catalog.filter(c=>c.kind==='slot').map(c=>data.layout.placements[c.id]?.w*2000).filter(Boolean).sort((a,b)=>a-b),width=Math.round((widths[Math.floor(widths.length/2)]||90)*1.1),height=width/1.75;
  const rect=r=>{const p=data.layout.networkTiles[r.id];return {...p,x:p.x*2000,y:p.y*2000,w:width,h:height};};
  const transform=p=>`transform="rotate(${p.rotation||0} ${p.x} ${p.y})"`;
  const rectAttrs=p=>`x="${p.x-p.w/2}" y="${p.y-p.h/2}" width="${p.w}" height="${p.h}" ${transform(p)}`;
  let current;
  function networkMarkup(g){return data.routes.map(r=>{const e=g.edges[r.gameId];if(!Number.isInteger(e?.owner))return '';const p=rect(r),color=g.players[e.owner].color,resource=e.bonusType;
   let bonus='';if(resource&&resource!=='위스키'&&e.bonusRemaining>0&&base.resources[resource]){const size=Math.min(p.w*.32,p.h*.68),cx=p.x+p.w*.19;bonus=`<image class="physical-network-bonus" href="assets/board-components/resource/${base.resources[resource]}.webp" x="${cx-size/2}" y="${p.y-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" ${transform(p)} aria-label="${esc(resource+' 중량열차 보너스')}"/>`;}
   return `<g class="physical-network-piece ${r.type==='pipeline'?'pipe':'rail'} ${e.owner===getSeat()?'player':'automa'} owner-${color}" data-route-piece="${esc(r.gameId)}"><image class="physical-network-tile" href="${base.netImage(e.networkId,color)}" ${rectAttrs(p)} preserveAspectRatio="xMidYMid meet" aria-label="${esc(r.gameId+' '+e.networkId)}"/>${bonus}</g>`;
  }).join('');}
  function infoMarkup(g){return data.routes.map(r=>{if(!Number.isInteger(g.edges[r.gameId]?.owner))return '';return `<rect class="physical-board-info-hit" data-network-info="${esc(r.gameId)}" role="button" tabindex="0" aria-label="${esc(r.from+' '+r.to+' 네트워크 정보')}" ${rectAttrs(rect(r))} rx="12"/>`;}).join('');}
  function markup(g,action){return base.markup(g,action).replaceAll('class="hit route-hit"','class="route-hit physical-route-hit"').replace(/<g class="physical-networks-layer">[\s\S]*?<\/g><g class="physical-proposal-layer">/,`<g class="physical-networks-layer">${networkMarkup(g)}</g><g class="physical-proposal-layer">`)+`<g id="onlineNetworkInfoHits" class="physical-board-info-hit-layer">${infoMarkup(g)}</g>`;}
  function descriptor(g,id){const r=data.routes.find(r=>r.gameId===id),e=g.edges[id],n=core.networks.find(n=>n.id===e?.networkId);if(!r||!Number.isInteger(e?.owner))return null;const heavy=/^(?:start-(?:whiskey|steel)|train-)/.test(e.networkId||''),resource=e.bonusType&&e.bonusType!=='위스키'&&Number(e.bonusRemaining)>0?e.bonusType+' '+Math.floor(Number(e.bonusRemaining))+'개':'없음';
   return {type:'네트워크',title:r.from+' — '+r.to,html:fact('종류',r.type==='pipeline'?'송유관':'철도')+fact('소유자',g.players[e.owner].name)+fact('네트워크 타일',n?.name||e.networkId)+ (n?fact('효과',n.effect):'')+(heavy?fact('현재 올라간 자원',resource):'')};
  }
  return {...base,networkRect:rect,networkMarkup,networkInfoMarkup:infoMarkup,networkDescriptor:descriptor,markup,
   render(g,action){current=g;document.querySelector('#board').innerHTML=markup(g,action);},
   highlight(legal){base.highlight(legal);for(const node of document.querySelectorAll('#board .route-hit')){const route=data.routes.find(r=>r.id===node.dataset.route),hasZones=!!(route&&base.networkHighlightShapes(route).length);node.classList.toggle('has-authored-shape',hasZones);if(hasZones){node.setAttribute('tabindex','-1');node.removeAttribute('role');node.removeAttribute('aria-label');}}for(const node of document.querySelectorAll('#board .four-route-zone-hit'))node.classList.add('physical-route-highlight-hit','selecting');},
   configureNetworkTargets(choice){const hits=document.querySelector('#onlineNetworkInfoHits');if(hits)hits.innerHTML=choice?.kind==='map'?'':infoMarkup(current);}
  };
 };
 globalThis.closeOnlineNetworkInfo=()=>{const panel=document.querySelector('#physicalBoardInfoPopover');if(panel){panel.hidden=true;panel.setAttribute('aria-hidden','true');}};
 globalThis.showOnlineNetworkInfo=(descriptor,event)=>{
  if(!descriptor)return;const wrap=document.querySelector('#mapWrap');let panel=document.querySelector('#physicalBoardInfoPopover');
  if(!panel){panel=document.createElement('aside');panel.id='physicalBoardInfoPopover';panel.className='physical-board-info-popover';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','지도 구성 요소 정보');panel.innerHTML='<div class="physical-board-info-head"><div><span id="physicalBoardInfoType"></span><strong id="physicalBoardInfoTitle"></strong></div><button id="physicalBoardInfoClose" type="button" aria-label="정보 닫기">×</button></div><div id="physicalBoardInfoBody" class="physical-board-info-body"></div>';panel.addEventListener('click',e=>e.stopPropagation());wrap.append(panel);panel.querySelector('#physicalBoardInfoClose').addEventListener('click',closeOnlineNetworkInfo);}
  panel.querySelector('#physicalBoardInfoType').textContent=descriptor.type;panel.querySelector('#physicalBoardInfoTitle').textContent=descriptor.title;panel.querySelector('#physicalBoardInfoBody').innerHTML=descriptor.html;panel.hidden=false;panel.setAttribute('aria-hidden','false');
  function position(){const bounds=wrap.getBoundingClientRect(),left=Number.isFinite(event?.clientX)?event.clientX-bounds.left+14:Math.max(8,(wrap.clientWidth-panel.offsetWidth)/2),top=Number.isFinite(event?.clientY)?event.clientY-bounds.top+14:Math.max(8,(wrap.clientHeight-panel.offsetHeight)/2);panel.style.left=Math.min(Math.max(8,left),Math.max(8,wrap.clientWidth-panel.offsetWidth-8))+'px';panel.style.top=Math.min(Math.max(8,top),Math.max(8,wrap.clientHeight-panel.offsetHeight-8))+'px';}
  position();requestAnimationFrame(position);
 };
})();
