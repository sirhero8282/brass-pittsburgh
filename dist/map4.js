// 브라스 피츠버그 DATA_20260913.xlsx · 3~4인 지도 DATA. This board is read-only;
// the existing two-player turn engine is intentionally not applied to it.
(() => {
  const cities = [
    ['이즈브리지',7,68,'','강철·코크스',5,3,'상인'],
    ['시카고',18,24,'제조 상자/등유|마천루/등유|마천루|제철소'],
    ['새기노',18,8,'제조 상자/자동차|석탄|석탄'],
    ['디트로이트',34,20,'제조 상자/등유|제철소/등유|자동차'],
    ['캐나다',49,7,'','강철·코크스',6,3,'상인'],
    ['털리도',31,34,'제조 상자/등유|제철소/등유|자동차','철·석탄',4],
    ['인디애나폴리스',23,77,'자동차|제조 상자'],
    ['신시내티',30,88,'','',0,3],
    ['남부',44,93,'','',0,2,'상인'],
    ['클락스버그',53,77,'석탄|석탄|제철소/석탄','철·석탄',3],
    ['피츠버그',57,58,'석탄|제조 상자/등유|제철소/제조 상자|제철소/석탄|제조 상자/등유'],
    ['콜럼버스',45,52,'제조 상자/석탄|석탄'],
    ['클리브랜드',48,37,'마천루/등유|제조 상자/자동차|제철소/등유'],
    ['이리',64,30,'자동차|제철소/제조 상자'],
    ['버팔로',72,18,'제조 상자/등유|제철소|제조 상자/등유'],
    ['로체스터',84,10,'제조 상자|제철소/제조 상자'],
    ['윌크스-배리',79,34,'석탄|석탄|석탄','철·석탄',2],
    ['베들레헴',75,51,'제철소/석탄|제철소/제조 상자'],
    ['해리스버그',69,65,'석탄|제철소/석탄'],
    ['볼티모어',70,82,'제조 상자/등유|제철소/등유|제조 상자/등유'],
    ['필라델피아',86,77,'등유/자동차|제철소/제조 상자|마천루','강철·코크스',4],
    ['뉴욕',90,61,'제조 상자/등유|마천루|등유|제철소'],
    ['올버니',96,21,'','',0,3],
    ['보스턴',97,43,'제조 상자/자동차|마천루','',0,0,'상인'],
    ['트랜턴 유전',22,55,'','','',0,'유전'],
    ['리마 유전',41,27,'','','',0,'유전'],
    ['맥스버그 유전',56,70,'','','',0,'유전'],
    ['베낭고 유전',60,44,'','','',0,'유전'],
    ['브래드포드 유전',77,26,'','','',0,'유전']
  ];
  // Each rail is listed once. The sheet spells the same city both 콜롬버스 and 콜럼버스;
  // its city row uses 콜럼버스, which is the normalized name here.
  const rails = [
    ['이즈브리지','시카고'],['이즈브리지','인디애나폴리스','개발 1회'],
    ['시카고','새기노','수입 +2칸'],['시카고','털리도'],['시카고','인디애나폴리스'],
    ['새기노','디트로이트'],['디트로이트','캐나다','위스키'],['디트로이트','털리도'],
    ['캐나다','버팔로'],['털리도','클리브랜드'],
    ['인디애나폴리스','콜럼버스'],['인디애나폴리스','신시내티','위스키'],
    ['신시내티','콜럼버스'],['신시내티','클락스버그'],['신시내티','남부'],
    ['남부','볼티모어'],['클락스버그','피츠버그'],['클락스버그','볼티모어'],
    ['피츠버그','콜럼버스','위스키'],['피츠버그','클리브랜드'],
    ['피츠버그','해리스버그'],['콜럼버스','클리브랜드'],
    ['클리브랜드','이리'],['이리','버팔로'],['버팔로','윌크스-배리'],
    ['버팔로','로체스터','개발 1회'],['로체스터','올버니','수입 +3칸'],
    ['윌크스-배리','뉴욕'],['윌크스-배리','베들레헴'],
    ['베들레헴','해리스버그','수입 +3칸'],['베들레헴','뉴욕'],
    ['해리스버그','필라델피아','개발 1회'],
    ['볼티모어','필라델피아'],['필라델피아','뉴욕'],
    ['뉴욕','올버니'],['뉴욕','보스턴'],['올버니','보스턴','위스키']
  ];
  const pipes = [
    ['트랜턴 유전','시카고',0],['트랜턴 유전','인디애나폴리스',2],
    ['리마 유전','털리도',1],['리마 유전','클리브랜드',1],
    ['맥스버그 유전','피츠버그',1],['맥스버그 유전','클락스버그',1],
    ['베낭고 유전','이리',2],['베낭고 유전','피츠버그',1],['베낭고 유전','클리브랜드',0],
    ['브래드포드 유전','버팔로',1],['브래드포드 유전','윌크스-배리',1]
  ];
  const $ = s => document.querySelector(s), svg = $('#map4Svg');
  if (!svg) return;
  const slugs = {'등유':'kerosene','석탄':'coal','제조 상자':'manufacturing-crate','제철소':'steelworks','마천루':'skyscraper','자동차':'automobile'};
  const W=1800,H=1000;
  const coords=[[105,650],[250,280],[300,90],[525,165],[790,65],[530,380],[370,720],[600,865],[745,915],[920,760],[995,550],[700,600],[800,345],[1050,255],[1230,135],[1440,80],[1400,335],[1350,535],[1200,705],[1160,895],[1480,855],[1610,620],[1660,200],[1680,400],[235,500],[650,245],[1060,735],[990,400],[1250,315]];
  const pos=Object.fromEntries(cities.map((c,i)=>[c[0],{x:coords[i][0],y:coords[i][1]}]));
  const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  function layout(raw){
    const count=raw?raw.split('|').length:0,cell=count===1?62:44,half=24.5;
    const points=count===1?[[0,0]]:count===2?[[-half,0],[half,0]]:count===3?[[0,-26],[-half,25],[half,25]]:count===4?[[-half,-half],[half,-half],[-half,half],[half,half]]:count===5?[[0,-49],[-half,0],[half,0],[-half,49],[half,49]]:[];
    return {count,cell,points,w:count===1?76:107,h:count===1?76:count===2?58:count===3?109:count===5?156:107};
  }
  function bounds(c){const s=layout(c[3]),p=pos[c[0]],w=Math.max(s.count?s.w:128,c[0].length*14+20);return {x:p.x-w/2-5,y:p.y-(s.count?s.h/2:34)-5,w:w+10,h:s.count?s.h+58:112};}
  const occupied=cities.map(bounds);
  const intersects=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  // Search curved routes around other city boards; bonuses use points ON the curve.
  function curve(a,b,pipe,index,reward){
    const p=pos[a],q=pos[b],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1;let best;
    for(const bend of [pipe?24:32,-32,65,-65,105,-105,160,-160,220,-220,300,-300,380,-380]){
      const cx=(p.x+q.x)/2-dy/len*bend,cy=(p.y+q.y)/2+dx/len*bend;
      const point=t=>{const u=1-t;return {x:u*u*p.x+2*u*t*cx+t*t*q.x,y:u*u*p.y+2*u*t*cy+t*t*q.y};};
      let score=Math.abs(bend)*.05;
      for(let k=1;k<40;k++){const pt=point(k/40);occupied.forEach((box,i)=>{if(cities[i][0]!==a&&cities[i][0]!==b)score+=intersects({x:pt.x-8,y:pt.y-8,w:16,h:16},box);});if(pt.x<20||pt.x>W-20||pt.y<20||pt.y>H-20)score+=10000;}
      if(reward){let clearance=Infinity;for(let k=10;k<=90;k+=2){const pt=point(k/100),box={x:pt.x-25,y:pt.y-25,w:50,h:50};let clash=occupied.reduce((sum,b)=>sum+intersects(box,b),0);if(pt.x<25||pt.x>W-25||pt.y<25||pt.y>H-25)clash+=10000;clearance=Math.min(clearance,clash);}score+=clearance*10000;}if(!best||score<best.score)best={score,point,d:`M ${p.x} ${p.y} Q ${cx} ${cy} ${q.x} ${q.y}`};
    }return {...best,id:`map4-${pipe?'pipe':'rail'}-${index}`,a,b,pipe};
  }
  const routes=rails.map(([a,b,reward],i)=>({...curve(a,b,false,i,reward),reward})).concat(pipes.map(([a,b,oil],i)=>({...curve(a,b,true,i,oil),reward:oil?'오일 '+oil:''})));
  const edges=routes.map(r=>`<g class="map4-route ${r.pipe?'pipe':'rail'}"><path class="map4-track-bed" d="${r.d}"/><path id="${r.id}" class="map4-line ${r.pipe?'pipe':''}" d="${r.d}"/>${r.pipe?'':`<path class="map4-sleepers" d="${r.d}"/>`}</g>`).join('');
  const icon=(slug,x,y,size)=>`<image href="./assets/icons/schematic/${slug}.png" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
  const boxes=cities.map(c=>{
    const [name,,,raw,market,price,link,kind]=c,p=pos[name],s=layout(raw),slots=raw?raw.split('|'):[],oil=kind==='유전';
    const tiles=slots.map((slot,i)=>{const choices=slot.split('/'),[cx,cy]=s.points[i],x=cx-s.cell/2,y=cy-s.cell/2,size=s.count===1?38:24,dual=s.count===1?27:19;return `<g class="map4-slot"><rect x="${x}" y="${y}" width="${s.cell}" height="${s.cell}" rx="8"/>${choices.length===1?icon(slugs[choices[0]],cx-size/2,cy-size/2,size):`<path class="map4-diagonal" d="M ${x+3} ${y+3} L ${x+s.cell-3} ${y+s.cell-3}"/>`+choices.map((v,k)=>icon(slugs[v],k?x+s.cell-dual-4:x+4,k?y+s.cell-dual-4:y+4,dual)).join('')}</g>`;}).join('');
    const w=s.count?s.w:128,h=s.count?s.h:68,labelY=h/2+8,labelW=Math.max(w,name.length*14+20),meta=market?market+' · $'+price:oil?'공유 오일':kind==='상인'?'상인 시장':'연결 지역';
    const info=`${name}\n${slots.length?slots.map((v,i)=>`${i+1}. ${v}`).join('\n'):oil?'공유 유전':'연결 지역'}\n${meta}${link?'\n기본 링크 '+link+'점':''}`;
    const shape=s.count===3?'<path class="map4-city-board" d="M -23 -55 H 23 Q 29 -55 29 -49 V -4 H 47 Q 54 -4 54 3 V 47 Q 54 54 47 54 H -47 Q -54 54 -54 47 V 3 Q -54 -4 -47 -4 H -29 V -49 Q -29 -55 -23 -55 Z"/>':`<rect class="map4-city-board" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="12"/>`;
    return `<g class="map4-node ${oil?'oil':''} slots-${s.count}" data-city="${esc(name)}" data-info="${esc(info)}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${esc(name)} 상세 정보" aria-pressed="false">${shape}${tiles}${s.count?'':oil?icon('oil-city',-24,-25,48):`<text class="map4-place-symbol" y="10">${kind==='상인'?'⚓':'◆'}</text>`}<rect class="map4-city-label" x="${-labelW/2}" y="${labelY}" width="${labelW}" height="26" rx="7"/><text y="${labelY+19}" class="map4-name">${esc(name)}</text>${market?`<text y="${labelY+43}" class="map4-meta">${esc(meta)}</text>`:''}${link?`<g class="map4-base-link" transform="translate(${w/2} ${-h/2})"><circle r="16"/><text y="5">+${link}</text></g>`:''}</g>`;
  }).join('');
  const rewardBoxes=[...occupied];
  const rewards=routes.filter(r=>r.reward).map(r=>{
    let best;for(const t of Array.from({length:41},(_,i)=>.1+i*.02)){const p=r.point(t),box={x:p.x-23,y:p.y-23,w:46,h:46},score=rewardBoxes.reduce((sum,b)=>sum+intersects(box,b),0)*1000+Math.abs(t-.5);if(!best||score<best.score)best={p,box,score,t};}rewardBoxes.push(best.box);
    const file=r.pipe?(r.reward.endsWith('2')?'oil-2':'oil-1'):r.reward.startsWith('수입')?'income-up':r.reward==='위스키'?'whiskey':'development',number=r.reward.startsWith('수입')?r.reward.match(/\d+/)[0]:'';
    return `<g class="map4-reward ${r.pipe?'oil':''}" data-route="${r.id}" data-t="${best.t}" transform="translate(${best.p.x} ${best.p.y})"><title>${esc(r.a+' ↔ '+r.b+' · '+r.reward)}</title><circle r="22"/><image href="./assets/icons/game/${file}.png" x="-18" y="-18" width="36" height="36"/>${number?`<text x="13" y="18">${number}</text>`:''}</g>`;
  }).join('');
  const backdrop=`<defs><pattern id="map4-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 H 0 V 100" fill="none" stroke="#6c755e" stroke-opacity=".07"/></pattern><pattern id="map4-paper" width="9" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".65" fill="#685735" opacity=".13"/></pattern></defs><g class="map4-landscape" aria-hidden="true"><rect width="1800" height="1000" fill="#e8e1c8"/><rect width="1800" height="1000" fill="url(#map4-paper)"/><rect width="1800" height="1000" fill="url(#map4-grid)"/><path class="map4-water" d="M 20 22 L 190 22 C 178 95 202 148 177 205 C 164 234 116 267 90 290 L 24 257 Z M 600 22 C 626 94 723 121 805 130 C 888 124 948 160 1030 118 C 1090 87 1150 94 1200 22 Z M 850 222 C 935 208 1018 146 1134 192 C 1094 230 1005 219 966 251 C 921 270 874 271 850 222 Z"/><path class="map4-river" d="M 1140 445 C 1130 530 1145 587 1050 635 S 785 708 747 773 S 577 940 430 960"/><path class="map4-contour" d="M 1280 460 C 1250 570 1330 640 1280 770 M 1295 450 C 1265 570 1345 640 1295 775 M 1310 450 C 1280 570 1360 640 1310 780"/><rect x="12" y="12" width="1776" height="976" rx="8" class="map4-border"/><text x="60" y="940" class="map4-cartouche">BRASS · PITTSBURGH</text><text x="60" y="965" class="map4-edition">3–4 PLAYERS · RAIL &amp; OIL NETWORK</text></g>`;
  svg.innerHTML=backdrop+edges+boxes+rewards;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('role','group');
  let zoom=1,pan={x:0,y:0},drag=null,suppressClick=false;
  function updateView(){const w=W/zoom,h=H/zoom;pan.x=Math.max(0,Math.min(W-w,pan.x));pan.y=Math.max(0,Math.min(H-h,pan.y));svg.setAttribute('viewBox',`${pan.x} ${pan.y} ${w} ${h}`);svg.classList.toggle('zoomed',zoom>1);$('#map4Fit').textContent=zoom===1?'전체':'×'+zoom.toFixed(1);$('#map4Out').disabled=zoom===1;$('#map4In').disabled=zoom===4;}
  function zoomTo(z){const cx=pan.x+W/zoom/2,cy=pan.y+H/zoom/2;zoom=Math.max(1,Math.min(4,z));pan={x:cx-W/zoom/2,y:cy-H/zoom/2};updateView();}
  function select(node){if(suppressClick)return;svg.querySelectorAll('.map4-node').forEach(n=>n.setAttribute('aria-pressed',String(n===node)));const box=$('#map4Info');box.textContent=node.dataset.info;box.hidden=false;}
  svg.querySelectorAll('[data-info]').forEach(node=>{node.addEventListener('click',()=>select(node));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(node);}});});
  $('#map4In').onclick=()=>zoomTo(zoom+.5);$('#map4Out').onclick=()=>zoomTo(zoom-.5);$('#map4Fit').onclick=()=>zoomTo(1);
  svg.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;suppressClick=false;if(zoom===1)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:{...pan}};});
  svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<6&&!suppressClick)return;suppressClick=true;svg.setPointerCapture(e.pointerId);const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/(W/zoom),rect.height/(H/zoom));pan={x:drag.pan.x-dx/scale,y:drag.pan.y-dy/scale};updateView();});
  const endDrag=()=>{drag=null;setTimeout(()=>suppressClick=false,0);};svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);svg.addEventListener('lostpointercapture',endDrag);
  updateView();window.BRASS_MAP4={cities,rails,pipes};
})();
