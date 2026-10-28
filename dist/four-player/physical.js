/* 4P geometry adapter for the established 2P physical-board CSS contract.
   Read-only rendering; the reviewed normalized coordinates and rules are untouched. */
(() => {
 // Localized capsule regions reviewed against the retained r399 board.
 // These presentation shapes never replace route curves or installed-tile anchors.
 const fourNetworkZones={
  "rail.3-4.1":{"shapes":[{"kind":"rounded-rect","x":0.097902,"y":0.466012,"w":0.098,"h":0.014,"rotation":100.006339,"radius":0.007}]},
  "rail.3-4.2":{"shapes":[{"kind":"rounded-rect","x":0.147219,"y":0.601484,"w":0.05,"h":0.014,"rotation":-3.453677,"radius":0.007}]},
  "rail.3-4.3":{"shapes":[{"kind":"rounded-rect","x":0.219657,"y":0.27981,"w":0.1,"h":0.014,"rotation":-70.469446,"radius":0.007}]},
  "rail.3-4.4":{"shapes":[{"kind":"rounded-rect","x":0.218503,"y":0.387585,"w":0.05,"h":0.014,"rotation":-5.531957,"radius":0.007}]},
  "rail.3-4.5":{"shapes":[{"kind":"rounded-rect","x":0.148205,"y":0.496703,"w":0.1,"h":0.014,"rotation":76.915656,"radius":0.007}]},
  "rail.3-4.6":{"shapes":[{"kind":"rounded-rect","x":0.280434,"y":0.221634,"w":0.078,"h":0.014,"rotation":40.214082,"radius":0.007}]},
  "rail.3-4.7":{"shapes":[{"kind":"rounded-rect","x":0.424548,"y":0.223498,"w":0.03,"h":0.014,"rotation":-50.485956,"radius":0.007}]},
  "rail.3-4.8":{"shapes":[{"kind":"rounded-rect","x":0.296428,"y":0.283489,"w":0.088,"h":0.014,"rotation":104.582047,"radius":0.007}]},
  "rail.3-4.9":{"shapes":[{"kind":"rounded-rect","x":0.523469,"y":0.208193,"w":0.072,"h":0.014,"rotation":10.263559,"radius":0.007}]},
  "rail.3-4.10":{"shapes":[{"kind":"rounded-rect","x":0.364283,"y":0.397328,"w":0.05,"h":0.014,"rotation":0.368101,"radius":0.007}]},
  "rail.3-4.11":{"shapes":[{"kind":"rounded-rect","x":0.25309,"y":0.585928,"w":0.06,"h":0.014,"rotation":-22.879624,"radius":0.007}]},
  "rail.3-4.12":{"shapes":[{"kind":"rounded-rect","x":0.221728,"y":0.694301,"w":0.1,"h":0.014,"rotation":56.777491,"radius":0.007}]},
  "rail.3-4.13":{"shapes":[{"kind":"rounded-rect","x":0.289352,"y":0.641812,"w":0.1,"h":0.014,"rotation":-65.099212,"radius":0.007}]},
  "rail.3-4.14":{"shapes":[{"kind":"rounded-rect","x":0.370565,"y":0.747835,"w":0.1,"h":0.014,"rotation":-1.216636,"radius":0.007}]},
  "rail.3-4.15":{"shapes":[{"kind":"rounded-rect","x":0.350748,"y":0.788071,"w":0.1,"h":0.014,"rotation":16.514175,"radius":0.007}]},
  "rail.3-4.16":{"shapes":[{"kind":"rounded-rect","x":0.525075,"y":0.777109,"w":0.1,"h":0.014,"rotation":-57.295031,"radius":0.007}]},
  "rail.3-4.17":{"shapes":[{"kind":"rounded-rect","x":0.507445,"y":0.613297,"w":0.068,"h":0.014,"rotation":-85.056605,"radius":0.007}]},
  "rail.3-4.18":{"shapes":[{"kind":"rounded-rect","x":0.551278,"y":0.666991,"w":0.058,"h":0.014,"rotation":0.518655,"radius":0.007}]},
  "rail.3-4.19":{"shapes":[{"kind":"rounded-rect","x":0.40288,"y":0.558428,"w":0.046,"h":0.014,"rotation":-17.751908,"radius":0.007}]},
  "rail.3-4.20":{"shapes":[{"kind":"rounded-rect","x":0.470134,"y":0.456053,"w":0.052,"h":0.014,"rotation":68.657776,"radius":0.007}]},
  "rail.3-4.21":{"shapes":[{"kind":"rounded-rect","x":0.570856,"y":0.515248,"w":0.04,"h":0.014,"rotation":-22.186023,"radius":0.007}]},
  "rail.3-4.23":{"shapes":[{"kind":"rounded-rect","x":0.382723,"y":0.469927,"w":0.09,"h":0.014,"rotation":-55.868179,"radius":0.007}]},
  "rail.3-4.24":{"shapes":[{"kind":"rounded-rect","x":0.487965,"y":0.354722,"w":0.054,"h":0.014,"rotation":140.025803,"radius":0.007}]},
  "rail.3-4.26":{"shapes":[{"kind":"rounded-rect","x":0.60324,"y":0.256015,"w":0.056,"h":0.014,"rotation":-50.015201,"radius":0.007}]},
  "rail.3-4.27":{"shapes":[{"kind":"rounded-rect","x":0.684509,"y":0.260711,"w":0.084,"h":0.014,"rotation":45.243537,"radius":0.007}]},
  "rail.3-4.28":{"shapes":[{"kind":"rounded-rect","x":0.691169,"y":0.185705,"w":0.07,"h":0.014,"rotation":176.949418,"radius":0.007}]},
  "rail.3-4.29":{"shapes":[{"kind":"rounded-rect","x":0.82104,"y":0.192777,"w":0.1,"h":0.014,"rotation":42.445611,"radius":0.007}]},
  "rail.3-4.30":{"shapes":[{"kind":"rounded-rect","x":0.805678,"y":0.41499,"w":0.1,"h":0.014,"rotation":68.856662,"radius":0.007}]},
  "rail.3-4.31":{"shapes":[{"kind":"rounded-rect","x":0.739097,"y":0.421073,"w":0.052,"h":0.014,"rotation":-86.340935,"radius":0.007}]},
  "rail.3-4.32":{"shapes":[{"kind":"rounded-rect","x":0.667062,"y":0.50194,"w":0.044,"h":0.014,"rotation":-15.818744,"radius":0.007}]},
  "rail.3-4.33":{"shapes":[{"kind":"rounded-rect","x":0.768738,"y":0.501805,"w":0.054,"h":0.014,"rotation":19.188548,"radius":0.007}]},
  "rail.3-4.34":{"shapes":[{"kind":"rounded-rect","x":0.656029,"y":0.649502,"w":0.048,"h":0.014,"rotation":-26.018839,"radius":0.007}]},
  "rail.3-4.35":{"shapes":[{"kind":"rounded-rect","x":0.654841,"y":0.591154,"w":0.096,"h":0.014,"rotation":-141.448341,"radius":0.007}]},
  "rail.3-4.36":{"shapes":[{"kind":"rounded-rect","x":0.776049,"y":0.586296,"w":0.058,"h":0.014,"rotation":-55.056576,"radius":0.007}]},
  "rail.3-4.37":{"shapes":[{"kind":"rounded-rect","x":0.847756,"y":0.340652,"w":0.1,"h":0.014,"rotation":-91.144737,"radius":0.007}]},
  "rail.3-4.38":{"shapes":[{"kind":"rounded-rect","x":0.895063,"y":0.446044,"w":0.036,"h":0.014,"rotation":-74.91782,"radius":0.007}]},
  "rail.3-4.39":{"shapes":[{"kind":"rounded-rect","x":0.864454,"y":0.238976,"w":0.1,"h":0.014,"rotation":-146.626236,"radius":0.007}]},
  "pipeline.3-4.1":{"shapes":[{"kind":"rounded-rect","x":0.199058,"y":0.439439,"w":0.044,"h":0.014,"rotation":44.240232,"radius":0.007}]},
  "pipeline.3-4.2":{"shapes":[{"kind":"rounded-rect","x":0.30807,"y":0.443551,"w":0.036,"h":0.014,"rotation":-106.72201,"radius":0.007}]},
  "pipeline.3-4.3":{"shapes":[{"kind":"rounded-rect","x":0.233303,"y":0.527787,"w":0.052,"h":0.014,"rotation":-56.737769,"radius":0.007}]},
  "pipeline.3-4.4":{"shapes":[{"kind":"rounded-rect","x":0.41021,"y":0.676493,"w":0.048,"h":0.014,"rotation":25.58519,"radius":0.007}]},
  "pipeline.3-4.5":{"shapes":[{"kind":"rounded-rect","x":0.416562,"y":0.606092,"w":0.07,"h":0.014,"rotation":-35.944552,"radius":0.007}]},
  "pipeline.3-4.6":{"shapes":[{"kind":"rounded-rect","x":0.539946,"y":0.467142,"w":0.022,"h":0.01,"rotation":116.606866,"radius":0.005}]},
  "pipeline.3-4.7":{"shapes":[{"kind":"rounded-rect","x":0.373345,"y":0.450681,"w":0.048,"h":0.014,"rotation":-42.055691,"radius":0.007}]},
  "pipeline.3-4.8":{"shapes":[{"kind":"rounded-rect","x":0.506743,"y":0.413317,"w":0.038,"h":0.014,"rotation":-166.354178,"radius":0.007}]},
  "pipeline.3-4.9":{"shapes":[{"kind":"rounded-rect","x":0.54975,"y":0.364117,"w":0.062,"h":0.014,"rotation":-96.884945,"radius":0.007}]},
  "pipeline.3-4.10":{"shapes":[{"kind":"rounded-rect","x":0.615394,"y":0.295974,"w":0.076,"h":0.014,"rotation":-96.300196,"radius":0.007}]},
  "pipeline.3-4.11":{"shapes":[{"kind":"rounded-rect","x":0.662124,"y":0.361547,"w":0.038,"h":0.014,"rotation":-1.584079,"radius":0.007}]}
 };
 const original=createFourBoard;
 globalThis.createFourBoard=function(data,core){
  const art=original(data,core),P=data.layout.placements,byId=Object.fromEntries(data.catalog.map(c=>[c.id,c])),slots=data.catalog.filter(c=>c.kind==='slot');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={'자동차':'automobile','제조 상자':'manufacturing-crate','석탄':'coal','코크스 공장':'coke-plant','제철소':'steelworks','마천루':'skyscraper','등유':'kerosene'};
  const oilArt={'위스키':'oil-field-03-tool-two-drums-front-v01','수입 +2':'oil-field-06-coin-02-front-v01','수입 +3':'oil-field-05-coin-03-front-v01','$8':'oil-field-02-coin-08-front-v01','개발':'oil-field-04-bulb-three-drums-front-v01'};
  const qualityArt={'수입 −4 / +13VP':'quality-furnace-04-vat-flame-04-vp-13-front-v01','$25 / 개발 2회':'quality-furnace-02-chimneys-25-two-icons-front-v01','$15 / +8VP':'quality-furnace-05-steelworks-15-vp-08-front-v01','+9VP':'quality-furnace-06-foundry-vp-09-front-v01','수입 +8 / +7VP':'quality-furnace-01-refinery-income-08-vp-07-front-v01','수입 +10 / +7VP':'quality-furnace-03-tractor-10-vp-07-front-v01'};
  const marketArt={'제조 상자':'market-crate','등유':'market-kerosene','자동차':'market-locomotive'};
  const median=slots.map(c=>P[c.id]?.w).filter(Boolean).sort((a,b)=>a-b),side=median[Math.floor(median.length/2)]||.045;
  const transform=p=>` transform="rotate(${p.rotation||0} ${p.x*2000} ${p.y*2000})"`;
  const rect=(p,attrs)=>`<rect x="${(p.x-p.w/2)*2000}" y="${(p.y-p.h/2)*2000}" width="${p.w*2000}" height="${p.h*2000}"${transform(p)} ${attrs}/>`;
  function image(src,p,cls,title=''){return `<g${transform(p)}><title>${esc(title)}</title><image class="${cls}" href="${esc(src)}" x="${(p.x-p.w/2)*2000}" y="${(p.y-p.h/2)*2000}" width="${p.w*2000}" height="${p.h*2000}"/></g>`}
  const resource=(name,p,cls)=>image(`assets/board-components/resource/${art.resources[name]}.webp`,p,cls,name);
  function marketMarkup(g){
   let html='';
   for(const panel of data.catalog.filter(c=>c.kind==='market'&&c.id.startsWith('market.4.'))){
    const loc=data.locations.find(l=>l.id==='location.3-4.'+panel.id.split('.').pop()),stock=loc&&g.markets?.[loc.name];if(!stock)continue;
    const cells=data.catalog.filter(c=>c.kind==='resource'&&c.parentId===panel.id).sort((a,b)=>Number(a.id.split('.').pop())-Number(b.id.split('.').pop()));
    const types=loc.marketResources||(cells.length===6?['철','석탄']:['강철','코크스']);
    types.forEach((name,column)=>{const count=Math.max(0,Math.trunc(Number(stock[name])||0));let cubes='';
     for(const cell of cells){const n=Number(cell.id.split('.').pop()),p=P[cell.id];if(p&&(n-1)%2===column&&Math.ceil(n/2)<=count)cubes+=resource(name,p,'physical-market-resource')}
     html+=`<g class="physical-market-stock" data-market="${esc(loc.name)}" data-resource="${esc(name)}" data-stock="${count}" role="group" aria-label="${esc(loc.name+' 시장 '+name+' '+count+'개')}">${cubes}</g>`;
    });
   }
   return html;
  }
  function guide(p,allowed){const n=allowed.length,size=Math.min(p.w,p.h),s=size*([0,.76,.598,.42,.35][n]||.35),step=size*([0,0,.34,.28,.2][n]||.2),rise=size*([0,0,.14,.1,.08][n]||.08),well={...p,w:size*.94,h:size*.94},inset=Math.max(1.5,size*2000*.035)/2000,rim=Math.max(2.7,size*2000*.065)/2000;
   return `<g class="physical-construction-guide ${n>1?'multi':'single'} count-${n}" aria-hidden="true">${rect(well,'class="physical-construction-guide-well" rx="'+Math.min(12,size*2000*.16)+'"')}${rect({...well,w:well.w-2*inset,h:well.h-2*inset},'class="physical-construction-guide-inset" rx="7"')}${rect({...well,w:well.w-2*rim,h:well.h-2*rim},'class="physical-construction-guide-rim" rx="6"')}${allowed.map((type,i)=>{const offset=i-(n-1)/2,angle=(p.rotation||0)*Math.PI/180,dx=offset*step,dy=offset*rise;return image(`assets/board-components/resource/${icons[type]}.webp`,{x:p.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:p.y+dx*Math.sin(angle)+dy*Math.cos(angle),w:s,h:s,rotation:p.rotation},'physical-construction-guide-tile')}).join('')}</g>`;
  }
  function curve(r){const c=byId[r.id],a=P[c.fromId],b=P[c.toId],p=P[r.id];return p?.c1&&p?.c2?`M ${a.x*2000} ${a.y*2000} C ${p.c1.x*2000} ${p.c1.y*2000} ${p.c2.x*2000} ${p.c2.y*2000} ${b.x*2000} ${b.y*2000}`:''}
  function shapes(r){const v=data.layout.networkHighlights?.[r.id]??(data.source.revision===399?fourNetworkZones[r.id]:null);return Array.isArray(v)?v:v?.shapes||[]}
  function shapeMarkup(s,attrs){if(s.kind==='polygon')return `<polygon points="${s.points.map(p=>p.x*2000+','+p.y*2000).join(' ')}" ${attrs}/>`;return rect(s,`rx="${(s.radius||0)*2000}" ${attrs}`)}
  function highlightMarkup(legal){const paths=[],zones=[];for(const r of data.routes){if(!legal.has(r.id))continue;const type=r.type==='pipeline'?'pipe':'rail',zone=shapes(r);if(zone.length){for(const s of zone)zones.push(shapeMarkup(s,`class="physical-route-highlight-zone ${type}"`));}else paths.push(`<path class="physical-route-glow-halo ${type}" d="${curve(r)}"/><path class="physical-route-glow-core ${type}" d="${curve(r)}"/>`)}return `<g class="physical-route-glow-layer" mask="url(#four-route-glow-mask)">${paths.join('')}</g><g class="physical-route-highlight-layer">${zones.join('')}</g>`}
  function markup(g,proposal){let fixed='',guides='',pieces='',oil='',networks='',hits='';
   const mask=slots.map(c=>{const p=P[c.id];return p?rect({...p,w:p.w+.018,h:p.h+.018},'fill="black" rx="16"'):''}).join('');
   for(const c of slots){const loc=data.locations.find(l=>l.id===c.parentId),i=Number(c.id.split('.').pop())-1,p=P[c.id],piece=g.cities[loc.name]?.[i];if(!p)continue;
    if(Number.isInteger(piece?.owner)){pieces+=image(art.image(piece.groupId,g.players[piece.owner].color,piece.flipped),p,'physical-industry-piece',g.players[piece.owner].name+' '+loc.name+' '+piece.industry);
     if(!piece.flipped){let index=0;for(const [res,n]of Object.entries(piece.resources||{}))for(let j=0;j<n&&index<6;j++){const k=index++,positions=[[-.19,-.13],[.11,-.18],[-.03,.13],[.25,.12],[-.27,.23],[.26,-.14]],s=Math.min(p.w,p.h);pieces+=resource(res,{x:p.x+positions[k][0]*s,y:p.y+positions[k][1]*s,w:s*.31,h:s*.31},'physical-industry-resource')}}
    }else guides+=guide(p,loc.slots[i]||[]);
    hits+=rect(p,`class="hit slot-hit" data-slot="${c.id}" rx="8"`);
   }
   for(const r of data.routes){const e=g.edges[r.gameId],p=data.layout.networkTiles[r.id];if(Number.isInteger(e?.owner)&&p){const tile={...p,w:.0495,h:r.type==='rail'?.022:.019};networks+=image(art.netImage(e.networkId,g.players[e.owner].color),tile,'physical-network-piece owner-'+g.players[e.owner].color,g.players[e.owner].name+' '+r.from+'—'+r.to);if(e.bonusRemaining>0&&art.resources[e.bonusType]&&e.bonusType!=='위스키'){const angle=(p.rotation||0)*Math.PI/180,s=Math.min(tile.w*.32,tile.h*.68);networks+=resource(e.bonusType,{x:p.x+tile.w*.19*Math.cos(angle),y:p.y+tile.w*.19*Math.sin(angle),w:s,h:s},'physical-network-bonus')}}hits+=`<path class="hit route-hit" data-route="${r.id}" d="${curve(r)}"/>`}
   for(const c of data.catalog.filter(c=>c.kind==='merchant')){const loc=data.locations.find(l=>l.id===c.parentId),v=g.setup.merchant[loc.name],value=g.setup.merchantOriginal?.[loc.name]||v,base=value.includes('/')?(value.includes('$12')?'market-blank-or-combo':'market-car-or-combo'):marketArt[value.split(' · ')[0]];if(base&&P[c.id])fixed+=image(`assets/board-components/market/${base}-${g.merchantUsed[loc.name]?'back':'front'}-v01.webp`,P[c.id],'physical-fixed-tile merchant-tile',loc.name+' '+v)}
   for(const l of data.locations.filter(l=>l.oil)){const a=data.layout.oilTiles[l.id]||P[l.id],p={...a,w:side,h:side},q=g.setup.oil[l.name],city=g.oilCities[l.name];fixed+=image('assets/board-components/resource/oil-rig.webp',p,'physical-fixed-tile oil-rig-tile','유전');const face=q.revealed?Object.entries(oilArt).find(([key])=>q.value.startsWith(key))?.[1]:'oil-field-01-rig-shared-back-v01';if(city)pieces+=image(art.image('k5',g.players[city.owner].color,city.flipped),p,'physical-industry-piece','오일 시티');else if(face&&!(g.era===2&&q.revealed))fixed+=image(`assets/board-components/oil/${face}.webp`,{...p,w:side*1.12,h:side*1.12},'physical-fixed-tile oil-reward-tile',q.revealed?q.value:'미공개 유전');
    if(q.revealed){let count=city?city.resource:g.oilfields[l.name],index=0,anchor=data.layout.oilStackAnchors[l.id]||{x:p.x+side*.32,y:p.y+side*.3};while(count>0){const n=Math.min(4,count),s=side*.5;oil+=image(`assets/board-components/resource/oil-stack-${n}.webp`,{x:anchor.x+(index%2)*s*.68,y:anchor.y+Math.floor(index/2)*s*.48,w:s,h:s},'physical-oil-resource','오일 '+n);count-=n;index++}}
    hits+=rect(p,`class="hit slot-hit oil-hit" data-oil="${l.id}" rx="20"`);
   }
   data.catalog.filter(c=>c.kind==='quality').forEach((c,i)=>{const key=['5★','6★','7★'][i],claimed=g.players.some(p=>p.qualityClaimed.includes(key)),file=claimed?'quality-furnace-shared-back-v01':qualityArt[g.setup.quality[key]];if(file&&P[c.id])fixed+=image(`assets/board-components/quality/${file}.webp`,P[c.id],'physical-fixed-tile quality-tile',key+' '+(claimed?'수령 완료':g.setup.quality[key]))});
   let preview='';for(const a of [proposal,proposal?.second].filter(Boolean)){if(a.edge){const r=data.routes.find(r=>r.gameId===a.edge.id);if(r)preview+=highlightMarkup(new Set([r.id]))}if(a.type==='건설'){const l=data.locations.find(l=>l.name===a.city),p=l?.oil?(data.layout.oilTiles[l.id]||P[l.id]):P[`slot.3-4.${l?.id.split('.').pop()}.${a.slot+1}`];if(p)preview+=rect(p,`class="${l.oil?'physical-oil-candidate':'physical-slot-candidate'}" rx="8"`)}}
   return `<defs><mask id="four-route-glow-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="2000"><rect width="2000" height="2000" fill="white"/>${mask}</mask></defs><image class="physical-board-art" preserveAspectRatio="none" href="${data.source.boardImage||'four-player/board.webp'}" width="2000" height="2000"/><g class="physical-fixed-layer">${fixed}</g><g id="fourRouteHighlights"></g><g class="physical-construction-guide-layer">${guides}</g><g class="physical-market-resources-layer">${marketMarkup(g)}</g><g class="physical-industries-layer">${pieces}</g><g class="physical-oil-resources-layer">${oil}</g><g class="physical-networks-layer">${networks}</g><g class="physical-proposal-layer">${preview}</g><g class="physical-interaction-layer">${hits}</g>`;
  }
  return {...art,markup,marketMarkup,highlightMarkup,networkHighlightShapes:shapes,render:(g,action)=>{document.querySelector('#board').innerHTML=markup(g,action)},highlight:legal=>{
   document.querySelector('#fourRouteHighlights').innerHTML=highlightMarkup(legal);
   for(const node of document.querySelectorAll('#board .slot-hit.legal')){const overlay=node.cloneNode();overlay.removeAttribute('data-slot');overlay.removeAttribute('data-oil');overlay.removeAttribute('role');overlay.removeAttribute('tabindex');overlay.setAttribute('class',node.hasAttribute('data-oil')?'physical-oil-candidate':'physical-slot-candidate');node.after(overlay)}
   for(const node of document.querySelectorAll('#board .route-hit.legal')){node.classList.add('physical-route-hit','selecting');const r=data.routes.find(r=>r.id===node.dataset.route),zone=shapes(r);if(zone.length){node.style.pointerEvents='none';for(const s of zone)node.insertAdjacentHTML('afterend',shapeMarkup(s,`class="four-route-zone-hit" data-route="${r.id}" role="button" tabindex="0" aria-label="${esc(r.from+'—'+r.to+' 선택 가능')}"`))}}
  }};
 };
})();
