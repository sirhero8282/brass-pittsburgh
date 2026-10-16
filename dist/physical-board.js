/* Presentation adapter for the confirmed Pittsburgh 2-player photo board.
 * Rules and game state deliberately remain in app.js. */
(()=>{
 const LAYOUT_URL='./assets/data/pittsburgh-2p-layout.json';
 const INDUSTRY_ART={
  k2:{front:'kerosene-ii-front-blue',back:'kerosene-ii-back-blue'},k3:{front:'kerosene-iii-front-blue',back:'kerosene-iii-back-blue'},k4:{front:'kerosene-iv-front-blue',back:'kerosene-iv-back-blue'},k5:{front:'oil-city-v-front-blue',back:'oil-city-v-back-blue'},
  c1:{front:'coal-mine-i-front-blue',back:'coal-mine-i-back-blue'},c2:{front:'coal-mine-ii-front-blue',back:'coal-mine-ii-back-blue'},c3:{front:'coal-mine-iii-front-blue',back:'coal-mine-iii-back-blue'},c4:{front:'polyphase-alternator-iv'},
  m1:{front:'manufacturing-bulb-i-front-blue',back:'manufacturing-bulb-i-back-blue'},m2:{front:'manufacturing-box-ii-front',back:'manufacturing-box-ii-back'},m3:{front:'manufacturing-whiskey-iii'},m4:{front:'manufacturing-bicycle-iv-front-blue',back:'manufacturing-bicycle-iv-back-blue'},m5:{front:'manufacturing-typewriter-v-front-blue',back:'manufacturing-typewriter-v-back-blue'},m6:{front:'automobile-vi-front-blue',back:'automobile-vi-back-blue'},m7:{front:'locomotive-works-vii'},
  o1:{front:'coke-plant-i-front-blue',back:'coke-plant-i-back-blue'},o2:{front:'coke-plant-ii-front-blue',back:'coke-plant-ii-back-blue'},
  s1:{front:'steelworks-i-front-blue',back:'steelworks-i-back-blue'},s2:{front:'steelworks-ii-front-blue',back:'steelworks-ii-back-blue'},s3:{front:'skyscraper-iii'},s4:{front:'steelworks-iv-front-blue',back:'steelworks-iv-back-blue'},s5:{front:'skyscraper-v'}
 };
 const CONSTRUCTION_GUIDE_ICON={'자동차':'automobile','제조 상자':'manufacturing-crate','석탄':'coal','탄광':'coal','코크스 공장':'coke-plant','제철소':'steelworks','마천루':'skyscraper','등유':'kerosene'};
 const MERCHANT_ART={'제조 상자 · 최초 +6VP':'market-crate-front-v01','등유 · 최초 수입 +2칸':'market-kerosene-front-v01','자동차 · 최초 +9VP':'market-locomotive-front-v01'};
 const RESOURCE_ART={'석탄':'resource-coal','코크스':'resource-coke','철':'resource-iron','강철':'resource-steel','오일':'oil-1'};
 const MARKET_RESOURCE_NAME={steel:'강철',coke:'코크스',coal:'석탄',iron:'철'};
 const RESOURCE_PILE_SPOTS=[[-.23,-.2],[.14,-.23],[-.05,.02],[.27,.08],[-.25,.24],[.12,.27]];
 const OIL_STACK_SPOTS=[[-.22,.19,-6],[.27,.16,5],[-.19,.55,-3],[.3,.52,4],[-.22,.89,-5],[.28,.86,4]];
 const QUALITY_ART={'수입 −4 / +13VP':'quality-furnace-04-vat-flame-04-vp-13-front-v01','$25 / 개발 2회':'quality-furnace-02-chimneys-25-two-icons-front-v01','$15 / +8VP':'quality-furnace-05-steelworks-15-vp-08-front-v01','+9VP':'quality-furnace-06-foundry-vp-09-front-v01','수입 +8 / +7VP':'quality-furnace-01-refinery-income-08-vp-07-front-v01','수입 +10 / +7VP':'quality-furnace-03-tractor-10-vp-07-front-v01'};
 const OIL_ART={'위스키 · 2시대 오일 2':'oil-field-03-tool-two-drums-front-v01','수입 +2 · 오일 2':'oil-field-06-coin-02-front-v01','수입 +3 · 오일 1':'oil-field-05-coin-03-front-v01','$8 · 오일 1':'oil-field-02-coin-08-front-v01'};
 const NETWORK_ART={'light-train':'rail-light-train','start-whiskey':'rail-heavy-train-whiskey','start-steel':'rail-heavy-train-steel','train-whiskey':'rail-heavy-train-whiskey','train-double':'rail-heavy-train-double-vp','train-oil':'rail-heavy-train-oil','train-coke':'rail-heavy-train-coke','train-replace':'rail-heavy-train-swap','start-income':'pipeline-income-2','reserve':'pipeline-broken-oil-star','pipe3k':'pipeline-vp-3','pipe3s':'pipeline-vp-3','pipe5':'pipeline-vp-5','pipe10':'pipeline-cash-10'};
 let layout=null,index=null,authoredLayout=null;
 /*
  * Placement drafts deliberately live outside of `state`: the board author can
  * move a visual tile without changing an edge, a resource, or a saved game.
  * The runtime layout remains the published source; this key contains only a
  * browser-local presentation override until its JSON is exported.
  */
 const NETWORK_PLACEMENT_DRAFT_KEY='brass-pittsburgh-network-placement-draft-v1';
 const DEFAULT_NETWORK_TILE_SIZE={w:.05,h:.02};
 let draftNetworkTiles={},networkPlacementDraftLoaded=false,placementEditorOpen=false,placementEditorRouteId='',networkPlacementDrag=null,placementEditorPreviousPreview=null,placementEditorStatusMessage='',placementEditorStatusState='info',placementEditorStatusRouteId='',boardInfoPopover=null;
 // This review pass starts visible so every automatic anchor can be checked at once.
 // `?network-review=off` is useful when returning to ordinary play.
 const reviewValue=typeof location==='undefined'?'':new URLSearchParams(location.search).get('network-review');
 let placementPreview=reviewValue!=='off';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const num=value=>Number(value)||0;
 const finite=value=>{if(value===null||value===undefined||value==='')return null;let parsed=Number(value);return Number.isFinite(parsed)?parsed:null};
 const rounded=value=>Math.round(value*1000000)/1000000;
 const boardPoint=point=>[num(point?.x)*layout.board.width,num(point?.y)*layout.board.height];
 const rectFor=placement=>{let [x,y]=boardPoint(placement),w=num(placement?.w)*layout.board.width,h=num(placement?.h)*layout.board.height;return{x,y,w,h,left:x-w/2,top:y-h/2,rotation:num(placement?.rotation)}};
 const transformFor=rect=>rect.rotation?` transform="rotate(${rect.rotation} ${rect.x} ${rect.y})"`:'';
 const asset=(folder,file)=>file?`./assets/board-components/${folder}/${file}.webp`:'';
 const asImage=(src,rect,classes='',extra='')=>src?`<image class="${classes}" href="${esc(src)}" x="${rect.left}" y="${rect.top}" width="${rect.w}" height="${rect.h}" preserveAspectRatio="xMidYMid meet"${transformFor(rect)} ${extra}/>`:'';
 const controlPoint=(placement,key)=>{let point=placement?.[key];if(Array.isArray(point))return[num(point[0])*layout.board.width,num(point[1])*layout.board.height];if(point&&typeof point==='object')return[num(point.x)*layout.board.width,num(point.y)*layout.board.height];return[num(placement?.[key+'X'])*layout.board.width,num(placement?.[key+'Y'])*layout.board.height]};
 function buildIndex(raw){
  let catalogById=Object.fromEntries((raw.catalog||[]).map(item=>[item.id,item])),slotsByCity={},routesById={},nodesByName={},merchantsByCity={},qualitiesByName={},resourcesByCity={};
  for(const item of raw.catalog||[]){
   let placement=raw.placements?.[item.id];if(!placement)continue;let parent=catalogById[item.parentId],parentName=parent?.name;
   if(['node','market','oil'].includes(item.kind))nodesByName[item.name]={item,placement};
   if(item.kind==='slot'&&parentName){let order=Number((item.id.match(/_slot_(\d+)$/)||[])[1])-1;(slotsByCity[parentName]??=[])[order]={item,placement};}
   if(item.kind==='merchant'&&parentName)merchantsByCity[parentName]={item,placement};
   if(item.kind==='quality'){let stars=(item.id.match(/p2_quality_(\d+)$/)||[])[1];qualitiesByName[stars?stars+'★':item.name]={item,placement};}
   if(item.kind==='resource'&&parentName){let resource=(item.id.match(/resource_(steel|coke|coal|iron)_/)||[])[1];(resourcesByCity[parentName]??=[]).push({item,placement,resource,order:Number((item.id.match(/_(\d+)$/)||[])[1])||0});}
   if(item.kind==='network'){let from=catalogById[item.fromId],to=catalogById[item.toId],type=item.id.includes('_pipeline_')?'pipe':'rail';if(from&&to)routesById[edgeId(from.name,to.name,type)]={item,placement,from:from.name,to:to.name,type};}
  }
  for(const slots of Object.values(slotsByCity))slots.sort((a,b)=>a.item.id.localeCompare(b.item.id));
  for(const resources of Object.values(resourcesByCity))resources.sort((a,b)=>a.order-b.order);
  let missing=[...RAIL.map(pair=>edgeId(pair[0],pair[1],'rail')),...PIPE.map(pair=>edgeId(pair[0],pair[1],'pipe'))].filter(id=>!routesById[id]);if(missing.length)throw new Error('권위 좌표에 없는 게임 경로: '+missing.join(', '));
  let occluders=(raw.visualOccluders||[]).map(item=>({placement:raw.placements?.[item.sourceId],padding:num(item.padding)||18})).filter(item=>item.placement);
  if(!occluders.length)occluders=(raw.catalog||[]).filter(item=>item.kind==='slot').map(item=>({placement:raw.placements[item.id],padding:18}));
  let slotWidths=Object.values(slotsByCity).flat().map(entry=>num(entry.placement?.w)*raw.board.width).filter(Boolean).sort((a,b)=>a-b),industryTileWidth=slotWidths.length?slotWidths[Math.floor(slotWidths.length/2)]:90;
  return{catalogById,slotsByCity,routesById,nodesByName,merchantsByCity,qualitiesByName,resourcesByCity,occluders,industryTileWidth};
 }
 function networkPlacementRoutes(){return Object.values(index?.routesById||{}).sort((left,right)=>left.item.id.localeCompare(right.item.id));}
 function routeForNetworkTileId(routeId){return networkPlacementRoutes().find(route=>route.item.id===routeId)||null;}
 function normalizedNetworkTile(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  let x=finite(value.x),y=finite(value.y),rotation=finite(value.rotation),w=finite(value.w),h=finite(value.h);
  if(x===null||y===null||rotation===null||x<0||x>1||y<0||y>1)return null;
  return{x,y,rotation,w:w!==null&&w>0?w:undefined,h:h!==null&&h>0?h:undefined,locked:value.locked===true};
 }
 function normalizedOilPresentationAnchor(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  let x=finite(value.x),y=finite(value.y),rotation=finite(value.rotation);
  if(x===null||y===null||rotation===null||x<0||x>1||y<0||y>1)return null;
  return{x,y,rotation,locked:value.locked===true};
 }
 function copyNetworkTile(value){return value?{x:value.x,y:value.y,rotation:value.rotation,w:value.w,h:value.h,locked:!!value.locked}:null;}
 function sourceNetworkTile(routeId){return normalizedNetworkTile(layout?.networkTiles?.[routeId]);}
 function sourceNetworkTileLocked(routeId){return layout?.networkTiles?.[routeId]?.locked===true;}
 /* Root's physical placement resolver reads this before layout.networkTiles. */
 function getDraftNetworkTile(routeId){return copyNetworkTile(draftNetworkTiles[routeId]);}
 function networkTileLocked(routeId){return sourceNetworkTileLocked(routeId);}
 function automaticNetworkTile(route){let curve=curveFor(route);if(!curve||!layout)return null;let anchor=routeAnchor(curve,route);return{x:anchor.x/layout.board.width,y:anchor.y/layout.board.height,rotation:anchor.angle,w:DEFAULT_NETWORK_TILE_SIZE.w,h:DEFAULT_NETWORK_TILE_SIZE.h,locked:false};}
 function editorNetworkTile(route){return getDraftNetworkTile(route?.item?.id)||sourceNetworkTile(route?.item?.id)||automaticNetworkTile(route);}
 function serializableNetworkTile(value){return{x:rounded(value.x),y:rounded(value.y),w:rounded(value.w||DEFAULT_NETWORK_TILE_SIZE.w),h:rounded(value.h||DEFAULT_NETWORK_TILE_SIZE.h),rotation:rounded(value.rotation),locked:!!value.locked};}
 function draftRecordsFromPayload(payload){
  let records=payload?.layout?.networkTiles??payload?.networkTiles??payload;
  if(!records||typeof records!=='object'||Array.isArray(records))throw new Error('layout.networkTiles 객체가 필요합니다.');
  let next={},ignored=0,invalid=0;
  for(const [routeId,value] of Object.entries(records)){
   if(!routeForNetworkTileId(routeId)||sourceNetworkTileLocked(routeId)){ignored++;continue;}
   let normalized=normalizedNetworkTile(value);if(!normalized){invalid++;continue;}next[routeId]={...normalized,locked:false};
  }
  return{next,ignored,invalid};
 }
 function persistNetworkPlacementDraft(){
  if(typeof localStorage==='undefined')return;
  try{if(Object.keys(draftNetworkTiles).length)localStorage.setItem(NETWORK_PLACEMENT_DRAFT_KEY,JSON.stringify({version:1,networkTiles:draftNetworkTiles}));else localStorage.removeItem(NETWORK_PLACEMENT_DRAFT_KEY);}catch(error){console.warn('네트워크 배치 초안을 브라우저에 저장하지 못했습니다.',error);}
 }
 function loadNetworkPlacementDraft(){
  if(networkPlacementDraftLoaded)return;networkPlacementDraftLoaded=true;
  if(typeof localStorage==='undefined')return;
  try{let saved=localStorage.getItem(NETWORK_PLACEMENT_DRAFT_KEY);if(!saved)return;draftNetworkTiles=draftRecordsFromPayload(JSON.parse(saved)).next;}catch(error){console.warn('저장된 네트워크 배치 초안을 읽지 못했습니다.',error);draftNetworkTiles={};}
 }
 function writeDraftNetworkTile(routeId,value,persist=true){
  if(!routeForNetworkTileId(routeId)||networkTileLocked(routeId))return false;
  let normalized=normalizedNetworkTile(value);if(!normalized)return false;
  draftNetworkTiles={...draftNetworkTiles,[routeId]:{...normalized,locked:false}};if(persist)persistNetworkPlacementDraft();return true;
 }
 function resetDraftNetworkTile(routeId){
  if(!Object.prototype.hasOwnProperty.call(draftNetworkTiles,routeId)||networkTileLocked(routeId))return false;
  let next={...draftNetworkTiles};delete next[routeId];draftNetworkTiles=next;persistNetworkPlacementDraft();return true;
 }
 function clearNetworkPlacementDrafts(){draftNetworkTiles={};persistNetworkPlacementDraft();}
 function exportNetworkPlacementJson(){
  let networkTiles={};
  for(const route of networkPlacementRoutes()){
   let tile=getDraftNetworkTile(route.item.id)||sourceNetworkTile(route.item.id);if(tile)networkTiles[route.item.id]=serializableNetworkTile(tile);
  }
  return JSON.stringify({layout:{networkTiles}},null,2);
 }
 function importNetworkPlacementJson(text){
  let parsed=JSON.parse(text),result=draftRecordsFromPayload(parsed);draftNetworkTiles=result.next;persistNetworkPlacementDraft();return result;
 }
 function networkTileRouteLabel(route){return `${route.from} ↔ ${route.to} · ${route.type==='pipe'?'송유관':'철도'}`;}
 function activeNetworkPlacementRoute(){
  let routes=networkPlacementRoutes();if(!routes.length)return null;
  let active=routes.find(route=>route.item.id===placementEditorRouteId);if(!active){active=routes.find(route=>sourceNetworkTile(route.item.id))||routes[0];placementEditorRouteId=active.item.id;}return active;
 }
 function editorNetworkRect(route){
  let tile=editorNetworkTile(route);if(!tile||!layout)return null;
  let width=Math.round((index.industryTileWidth||90)*1.1),height=width/1.75,x=tile.x*layout.board.width,y=tile.y*layout.board.height;
  return{x,y,w:width,h:height,left:x-width/2,top:y-height/2,rotation:tile.rotation};
 }
 function setNetworkPlacementEditorStatus(message,stateName='info'){placementEditorStatusMessage=message;placementEditorStatusState=stateName;placementEditorStatusRouteId=placementEditorRouteId;let status=$('#networkPlacementEditorStatus');if(!status)return;status.textContent=message;status.dataset.state=stateName;}
 function ensureNetworkPlacementEditor(){
  if($('#networkPlacementEditorToggle'))return;let mapWrap=$('.map-wrap');if(!mapWrap||!document.createElement)return;
  let shell=document.createElement('div');shell.className='physical-placement-editor-shell';shell.innerHTML='<button id="networkPlacementEditorToggle" class="physical-placement-editor-toggle" type="button" aria-expanded="false" aria-controls="networkPlacementEditor">노선 배치 편집</button><section id="networkPlacementEditor" class="physical-placement-editor" aria-label="네트워크 타일 배치 편집" hidden><div class="physical-placement-editor-head"><strong>노선 배치 편집</strong><small>표시 전용 · 게임 상태와 분리</small></div><label>노선<select id="networkPlacementRoute" aria-label="편집할 노선"></select></label><div class="physical-placement-editor-coordinates"><label>X <input id="networkPlacementX" type="number" min="0" max="1" step="0.0005" inputmode="decimal" aria-label="보드 기준 X 좌표"></label><label>Y <input id="networkPlacementY" type="number" min="0" max="1" step="0.0005" inputmode="decimal" aria-label="보드 기준 Y 좌표"></label><label>각도 <input id="networkPlacementRotation" type="number" min="-360" max="360" step="0.1" inputmode="decimal" aria-label="회전 각도"></label></div><p id="networkPlacementLockNote" class="physical-placement-editor-lock" hidden>잠긴 노선입니다. 원본 JSON에서만 변경할 수 있습니다.</p><p id="networkPlacementEditorStatus" class="physical-placement-editor-status" aria-live="polite"></p><div class="physical-placement-editor-actions"><button id="networkPlacementReset" type="button">이 노선 초안 취소</button><button id="networkPlacementClear" type="button">전체 초안 취소</button></div><details class="physical-placement-editor-json"><summary>호환 JSON 가져오기/내보내기</summary><p>생성한 JSON은 <code>layout.networkTiles</code>에 그대로 적용할 수 있습니다.</p><textarea id="networkPlacementJson" spellcheck="false" aria-label="네트워크 타일 배치 JSON"></textarea><div class="physical-placement-editor-actions"><button id="networkPlacementExport" type="button">JSON 생성</button><button id="networkPlacementImport" type="button">JSON 초안 적용</button></div></details></section>';
  mapWrap.append(shell);
 }
 function syncNetworkPlacementEditor(){
  let toggle=$('#networkPlacementEditorToggle'),panel=$('#networkPlacementEditor');
  if(toggle){toggle.setAttribute('aria-expanded',String(placementEditorOpen));toggle.textContent=placementEditorOpen?'배치 편집 닫기':'노선 배치 편집';toggle.title=placementEditorOpen?'프레젠테이션 전용 네트워크 배치 편집기를 닫습니다.':'네트워크 타일의 표시 좌표와 각도를 편집합니다.';}
  if(!panel)return;panel.hidden=!placementEditorOpen;if(!placementEditorOpen)return;
  let routes=networkPlacementRoutes(),route=activeNetworkPlacementRoute(),select=$('#networkPlacementRoute');
  if(select){let signature=routes.map(item=>item.item.id).join('|');if(select.dataset.options!==signature){select.innerHTML=routes.map(item=>`<option value="${esc(item.item.id)}">${esc(networkTileRouteLabel(item))}</option>`).join('');select.dataset.options=signature;}if(route)select.value=route.item.id;}
  let tile=route&&editorNetworkTile(route),locked=route&&networkTileLocked(route.item.id),source=route&&(getDraftNetworkTile(route.item.id)?'브라우저 초안':sourceNetworkTile(route.item.id)?'원본 JSON':'자동 앵커');
  for(const [id,value] of [['networkPlacementX',tile?.x],['networkPlacementY',tile?.y],['networkPlacementRotation',tile?.rotation]]){let input=$('#'+id);if(!input)continue;input.value=value===undefined?'':String(rounded(value));input.disabled=!!locked;}
  let reset=$('#networkPlacementReset');if(reset)reset.disabled=!route||!!locked||!Object.prototype.hasOwnProperty.call(draftNetworkTiles,route.item.id);
  let status=$('#networkPlacementEditorStatus'),defaultStatus=!route?'노선을 찾을 수 없습니다.':locked?'이 노선은 원본 JSON에서 잠겨 있어 편집할 수 없습니다.':`${source} · 보드 기준 0–1 좌표 · 타일을 드래그하거나 숫자를 입력하세요.`,defaultState=locked?'locked':'info';if(status){if(!placementEditorStatusMessage||placementEditorStatusRouteId!==route?.item?.id){placementEditorStatusMessage='';placementEditorStatusState=defaultState;placementEditorStatusRouteId=route?.item?.id||'';status.textContent=defaultStatus;status.dataset.state=defaultState;}else{status.textContent=placementEditorStatusMessage;status.dataset.state=placementEditorStatusState;}}
  let lockNote=$('#networkPlacementLockNote');if(lockNote)lockNote.hidden=!locked;
 }
 function setPlacementEditorOpen(next){
  let opening=!!next;if(opening===placementEditorOpen)return;placementEditorOpen=opening;
  if(opening){placementEditorPreviousPreview=placementPreview;placementPreview=true;activeNetworkPlacementRoute();}else if(placementEditorPreviousPreview!==null){placementPreview=placementEditorPreviousPreview;placementEditorPreviousPreview=null;}
  if(layout&&index)renderPhysicalMap();
 }
 function updateNetworkPlacementFromInputs(){
  let route=activeNetworkPlacementRoute();if(!route||networkTileLocked(route.item.id))return;
  let x=finite($('#networkPlacementX')?.value),y=finite($('#networkPlacementY')?.value),rotation=finite($('#networkPlacementRotation')?.value),base=editorNetworkTile(route);
  if(x===null||y===null||rotation===null||x<0||x>1||y<0||y>1){setNetworkPlacementEditorStatus('X와 Y는 0부터 1 사이의 숫자로 입력하세요.','error');return;}
  if(writeDraftNetworkTile(route.item.id,{...base,x,y,rotation,locked:false})){setNetworkPlacementEditorStatus('이 브라우저에만 초안을 저장했습니다. JSON 생성 후 원본 파일에 반영하세요.','saved');renderPhysicalMap();}
 }
 function boardPointFromPointer(event){
  let svg=$('#mapEdges');if(!svg)return null;
  try{if(svg.createSVGPoint&&svg.getScreenCTM){let point=svg.createSVGPoint(),matrix=svg.getScreenCTM();if(matrix){point.x=event.clientX;point.y=event.clientY;let mapped=point.matrixTransform(matrix.inverse());return{x:mapped.x,y:mapped.y};}}}catch(error){}
  let box=svg.getBoundingClientRect?.(),viewBox=svg.viewBox?.baseVal;if(!box||!viewBox||!box.width||!box.height)return null;return{x:viewBox.x+(event.clientX-box.left)*viewBox.width/box.width,y:viewBox.y+(event.clientY-box.top)*viewBox.height/box.height};
 }
 function finishNetworkPlacementDrag(){
  if(!networkPlacementDrag)return;networkPlacementDrag=null;persistNetworkPlacementDraft();window.removeEventListener?.('pointermove',moveNetworkPlacementDrag);window.removeEventListener?.('pointerup',finishNetworkPlacementDrag);window.removeEventListener?.('pointercancel',finishNetworkPlacementDrag);setNetworkPlacementEditorStatus('드래그 초안을 저장했습니다. JSON 생성 후 원본 파일에 반영하세요.','saved');if(layout&&index)renderPhysicalMap();
 }
 function moveNetworkPlacementDrag(event){
  let drag=networkPlacementDrag;if(!drag||event.pointerId!==drag.pointerId)return;let point=boardPointFromPointer(event),route=routeForNetworkTileId(drag.routeId);if(!point||!route)return;event.preventDefault?.();let base=editorNetworkTile(route),x=Math.max(0,Math.min(1,(point.x-drag.offsetX)/layout.board.width)),y=Math.max(0,Math.min(1,(point.y-drag.offsetY)/layout.board.height));if(writeDraftNetworkTile(route.item.id,{...base,x,y,locked:false},false)&&layout&&index)renderPhysicalMap();
 }
 function beginNetworkPlacementDrag(event){
  if(!placementEditorOpen||event.button!==0)return;let routeId=event.currentTarget?.dataset?.networkEditorRoute,route=routeForNetworkTileId(routeId);if(!route)return;placementEditorRouteId=routeId;if(networkTileLocked(routeId)){setNetworkPlacementEditorStatus('잠긴 노선은 원본 JSON을 수정한 뒤 다시 불러오세요.','locked');return;}let point=boardPointFromPointer(event),rect=editorNetworkRect(route);if(!point||!rect)return;event.preventDefault();event.stopPropagation();networkPlacementDrag={routeId,pointerId:event.pointerId,offsetX:point.x-rect.x,offsetY:point.y-rect.y};event.currentTarget.setPointerCapture?.(event.pointerId);window.addEventListener?.('pointermove',moveNetworkPlacementDrag);window.addEventListener?.('pointerup',finishNetworkPlacementDrag);window.addEventListener?.('pointercancel',finishNetworkPlacementDrag);syncNetworkPlacementEditor();
 }
 function placementEditorMarkup(){
  if(!placementEditorOpen)return'';let selected=activeNetworkPlacementRoute()?.item.id;
  return `<g class="physical-placement-editor-layer" aria-label="네트워크 타일 배치 편집">${networkPlacementRoutes().map(route=>{let rect=editorNetworkRect(route);if(!rect)return'';let locked=networkTileLocked(route.item.id),isSelected=route.item.id===selected;return `<g class="physical-placement-editor-handle${isSelected?' selected':''}${locked?' locked':''}" data-network-editor-route="${esc(route.item.id)}" role="button" tabindex="0" aria-label="${esc(networkTileRouteLabel(route)+(locked?' · 잠김':' · 배치 편집'))}"><rect x="${rect.left}" y="${rect.top}" width="${rect.w}" height="${rect.h}" rx="${Math.min(9,rect.h/3)}"${transformFor(rect)}/>${isSelected?`<circle class="physical-placement-editor-center" cx="${rect.x}" cy="${rect.y}" r="5"/>`:''}</g>`;}).join('')}</g>`;
 }
 function bindPlacementEditorHandles(){
  if(!placementEditorOpen)return;$$('[data-network-editor-route]').forEach(element=>{element.onpointerdown=beginNetworkPlacementDrag;element.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();placementEditorRouteId=element.dataset.networkEditorRoute;renderPhysicalMap();}};});
 }
 function bindNetworkPlacementEditor(){
  let toggle=$('#networkPlacementEditorToggle'),panel=$('#networkPlacementEditor');
  if(toggle&&!toggle.dataset.physicalBoardBound){toggle.dataset.physicalBoardBound='true';toggle.onclick=event=>{event.preventDefault();event.stopPropagation();setPlacementEditorOpen(!placementEditorOpen);};}
  if(!panel||panel.dataset.physicalBoardBound)return;panel.dataset.physicalBoardBound='true';
  let select=$('#networkPlacementRoute');if(select)select.onchange=()=>{placementEditorRouteId=select.value;renderPhysicalMap();};
  for(const id of ['networkPlacementX','networkPlacementY','networkPlacementRotation']){let input=$('#'+id);if(input){input.oninput=updateNetworkPlacementFromInputs;input.onchange=updateNetworkPlacementFromInputs;}}
  let reset=$('#networkPlacementReset');if(reset)reset.onclick=()=>{let route=activeNetworkPlacementRoute();if(route&&resetDraftNetworkTile(route.item.id)){setNetworkPlacementEditorStatus('이 노선의 브라우저 초안을 지우고 원본 JSON/자동 앵커로 되돌렸습니다.','saved');renderPhysicalMap();}};
  let clear=$('#networkPlacementClear');if(clear)clear.onclick=()=>{clearNetworkPlacementDrafts();setNetworkPlacementEditorStatus('브라우저 배치 초안을 모두 지웠습니다. 원본 JSON은 바뀌지 않았습니다.','saved');renderPhysicalMap();};
  let exportButton=$('#networkPlacementExport');if(exportButton)exportButton.onclick=()=>{let output=$('#networkPlacementJson');if(output)output.value=exportNetworkPlacementJson();setNetworkPlacementEditorStatus('호환 JSON을 생성했습니다. 내용을 원본 layout.networkTiles에 붙여 넣으세요.','saved');};
  let importButton=$('#networkPlacementImport');if(importButton)importButton.onclick=()=>{let input=$('#networkPlacementJson');try{let result=importNetworkPlacementJson(input?.value||'');setNetworkPlacementEditorStatus(`JSON 초안 ${Object.keys(result.next).length}개를 적용했습니다.${result.ignored?` 잠긴/알 수 없는 ${result.ignored}개는 건너뛰었습니다.`:''}${result.invalid?` 형식 오류 ${result.invalid}개는 건너뛰었습니다.`:''}`,'saved');renderPhysicalMap();}catch(error){setNetworkPlacementEditorStatus('JSON을 적용하지 못했습니다: '+error.message,'error');}};
 }
 function curveFor(route){
  let start=index.nodesByName[route.from]?.placement,end=index.nodesByName[route.to]?.placement;if(!start||!end)return null;let [x1,y1]=boardPoint(start),[x2,y2]=boardPoint(end),[c1x,c1y]=controlPoint(route.placement,'c1'),[c2x,c2y]=controlPoint(route.placement,'c2');
  const point=t=>{let u=1-t;return[x1*u*u*u+3*c1x*u*u*t+3*c2x*u*t*t+x2*t*t*t,y1*u*u*u+3*c1y*u*u*t+3*c2y*u*t*t+y2*t*t*t]};
  const tangent=t=>{let u=1-t;return[3*u*u*(c1x-x1)+6*u*t*(c2x-c1x)+3*t*t*(x2-c2x),3*u*u*(c1y-y1)+6*u*t*(c2y-c1y)+3*t*t*(y2-c2y)]};
  let length=0,previous=point(0);for(let step=1;step<=14;step++){let next=point(step/14);length+=Math.hypot(next[0]-previous[0],next[1]-previous[1]);previous=next;}return{d:`M ${x1} ${y1} C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`,point,tangent,length};
 }
 function industryAsset(piece){let art=INDUSTRY_ART[piece?.groupId],face=piece?.flipped?'back':'front',file=art?.[face]||art?.front;if(!file)return'';return asset(`industry/${piece.owner==='player'?'blue':'red'}`,file);}
 function constructionGuideAsset(industry){return asset('resource',CONSTRUCTION_GUIDE_ICON[industry]);}
 function networkAsset(edge,route){let color=edge.owner==='automa'?'red':'blue',file=NETWORK_ART[edge.networkId||''];if(!file)file=route.type==='pipe'?'pipeline-income-2':'rail-heavy-train';return route.type==='pipe'?asset(`network/pipeline/${color}`,`${file}-${color}`):asset(`network/${color}`,`${file}-${color}`);}
 const resourceAsset=resource=>asset('resource',RESOURCE_ART[resource]);
 const merchantAsset=(value,used=false)=>{let front=MERCHANT_ART[value];return asset('market',used?front?.replace('-front-v01','-back-v01'):front)};
 const qualityAsset=(value,claimed=false)=>asset('quality',claimed?'quality-furnace-shared-back-v01':QUALITY_ART[value]);
 const oilAsset=(value,revealed)=>asset('oil',revealed?OIL_ART[value]:'oil-field-01-rig-shared-back-v01');
 const oilRigAsset=()=>asset('resource','oil-rig');
 const oilStackAsset=count=>count>=1&&count<=4?asset('resource',`oil-stack-${count}`):'';
 /* Oil artwork deliberately has its own anchors.  `placements` remains the oil
  * route endpoint, so pipeline curves stay put when a physical tile is moved. */
 function oilTileRect(entry){let source=normalizedOilPresentationAnchor(layout?.oilTiles?.[entry?.item?.id]),anchor=source?{x:source.x*layout.board.width,y:source.y*layout.board.height,rotation:source.rotation}:rectFor(entry.placement),size=Math.round(index.industryTileWidth||90);return{x:anchor.x,y:anchor.y,w:size,h:size,left:anchor.x-size/2,top:anchor.y-size/2,rotation:anchor.rotation||0,manual:!!source};}
 // Reward art includes transparent margins: enlarge its image box so the
 // visible hex fills the rig interior. Keep rig/hit/resource anchors unchanged.
 function oilRewardRect(entry){let base=oilTileRect(entry),size=Math.round(Math.min(base.w,base.h)*1.12);return{...base,w:size,h:size,left:base.x-size/2,top:base.y-size/2};}
 function oilStackAnchor(entry,tile){let source=normalizedOilPresentationAnchor(layout?.oilStackAnchors?.[entry?.item?.id]);if(source)return{x:source.x*layout.board.width,y:source.y*layout.board.height,rotation:source.rotation,manual:true};let [offsetX,offsetY]=OIL_STACK_SPOTS[0],r=(tile.rotation||0)*Math.PI/180,offsetPX=offsetX*tile.w,offsetPY=offsetY*tile.h;return{x:tile.x+offsetPX*Math.cos(r)-offsetPY*Math.sin(r),y:tile.y+offsetPX*Math.sin(r)+offsetPY*Math.cos(r),rotation:tile.rotation||0,manual:false};}
 function oilFieldStock(field){let city=state.oilCities?.[field];if(city&&Object.prototype.hasOwnProperty.call(city,'resource'))return Math.max(0,Math.floor(num(city.resource)));if(city?.resources&&Object.prototype.hasOwnProperty.call(city.resources,'오일'))return Math.max(0,Math.floor(num(city.resources.오일)));return Math.max(0,Math.floor(num(state.oilfields?.[field])));}
 function oilStackCounts(amount){let parsed=Number(amount),remaining=Number.isFinite(parsed)?Math.max(0,Math.floor(parsed)):0,counts=[];while(remaining){let count=Math.min(4,remaining);counts.push(count);remaining-=count;}return counts;}
 function oilResourceMarkup(){return OIL_FIELD_NAMES.map(name=>{let entry=index.nodesByName[name],setup=state.setup?.oil?.[name];if(!entry||!setup?.revealed)return'';let amount=oilFieldStock(name),counts=oilStackCounts(amount);if(!counts.length)return'';let tile=oilTileRect(entry),anchor=oilStackAnchor(entry,tile),size=Math.min(tile.w,tile.h)*.5,radians=anchor.rotation*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians),[firstX,firstY]=OIL_STACK_SPOTS[0];return `<g class="physical-oil-resource-pile" aria-label="${esc(name+' 오일 '+amount)}">${counts.map((count,ordinal)=>{let [offsetX,offsetY,angle]=OIL_STACK_SPOTS[ordinal%OIL_STACK_SPOTS.length],row=Math.floor(ordinal/OIL_STACK_SPOTS.length),offsetPX=(offsetX-firstX)*tile.w,offsetPY=(offsetY+row*.34-firstY)*tile.h,cx=anchor.x+offsetPX*cos-offsetPY*sin,cy=anchor.y+offsetPX*sin+offsetPY*cos,src=oilStackAsset(count);return src?`<image class="physical-oil-resource" href="${esc(src)}" x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" transform="rotate(${angle+anchor.rotation} ${cx} ${cy})" aria-label="${esc('오일 '+count+'개')}"/>`:'';}).join('')}</g>`;}).join('');}
 function normalizedHighlightPoint(value){let x=finite(value?.x),y=finite(value?.y);return x===null||y===null||x<0||x>1||y<0||y>1?null:{x,y};}
 function highlightShapesFor(route){let entry=layout?.networkHighlights?.[route?.item?.id],shapes=Array.isArray(entry)?entry:Array.isArray(entry?.shapes)?entry.shapes:[];return shapes.filter(shape=>{if(!shape||typeof shape!=='object')return false;if(shape.kind==='rounded-rect'){let point=normalizedHighlightPoint(shape),w=finite(shape.w),h=finite(shape.h),rotation=finite(shape.rotation),radius=finite(shape.radius);return !!point&&w!==null&&h!==null&&rotation!==null&&radius!==null&&w>0&&h>0&&w<=1&&h<=1&&radius>=0&&radius<=Math.min(w,h)/2;}if(shape.kind==='polygon'){let points=Array.isArray(shape.points)?shape.points.map(normalizedHighlightPoint):[];return points.length>=3&&points.length===shape.points.length;}return false;});}
 function highlightShapeMarkup(shape,route,interactive=false){let className=`physical-route-highlight-${interactive?'hit':'zone'} ${route.type}${interactive?' selecting':''}`,edge=interactive?` data-edge="${esc(edgeId(route.from,route.to,route.type))}"`:'';if(shape.kind==='rounded-rect'){let x=num(shape.x)*layout.board.width,y=num(shape.y)*layout.board.height,w=num(shape.w)*layout.board.width,h=num(shape.h)*layout.board.height,radius=num(shape.radius)*Math.min(layout.board.width,layout.board.height),rect={x,y,w,h,left:x-w/2,top:y-h/2,rotation:num(shape.rotation)};return `<rect class="${className}"${edge} x="${rect.left}" y="${rect.top}" width="${w}" height="${h}" rx="${radius}"${transformFor(rect)}/>`;}let points=shape.points.map(point=>`${num(point.x)*layout.board.width},${num(point.y)*layout.board.height}`).join(' ');return `<polygon class="${className}"${edge} points="${points}"/>`;}
 function authoredHighlightMarkup(route,interactive=false){return highlightShapesFor(route).map(shape=>highlightShapeMarkup(shape,route,interactive)).join('');}
 function routeMaskMarkup(){return `<mask id="physical-route-glow-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${layout.board.width}" height="${layout.board.height}"><rect width="${layout.board.width}" height="${layout.board.height}" fill="white"/>${index.occluders.map(({placement,padding})=>{let rect=rectFor(placement),pad=Math.max(18,padding),blocker={...rect,left:rect.left-pad,top:rect.top-pad,w:rect.w+pad*2,h:rect.h+pad*2};return `<rect x="${blocker.left}" y="${blocker.top}" width="${blocker.w}" height="${blocker.h}" rx="${Math.min(16,blocker.w/5,blocker.h/5)}" fill="black"${transformFor(rect)}/>`}).join('')}</mask>`}
 function candidateRouteMarkup(){if(mapSelection?.kind!=='edge')return'';let legal=new Set(currentMapCandidates().map(option=>option.id));return Object.entries(index.routesById).filter(([id])=>legal.has(id)).map(([,route])=>{if(highlightShapesFor(route).length)return'';let curve=curveFor(route);return curve?`<path class="physical-route-glow-halo ${route.type}" fill="none" d="${curve.d}"/><path class="physical-route-glow-core ${route.type}" fill="none" d="${curve.d}"/>`:''}).join('')}
 function authoredCandidateRouteMarkup(){if(mapSelection?.kind!=='edge')return'';let legal=new Set(currentMapCandidates().map(option=>option.id));return Object.entries(index.routesById).filter(([id])=>legal.has(id)).map(([,route])=>authoredHighlightMarkup(route)).join('')}
 function routeHitMarkup(){let selecting=mapSelection?.kind==='edge',legal=new Set(selecting?currentMapCandidates().map(option=>option.id):[]);return Object.entries(index.routesById).map(([id,route])=>{let authored=highlightShapesFor(route);if(authored.length)return selecting&&legal.has(id)?authoredHighlightMarkup(route,true):'';let curve=curveFor(route);return curve?`<path class="physical-route-hit ${selecting?'selecting':''}" data-edge="${esc(id)}" d="${curve.d}"/>`:''}).join('')}
 function resourceMarkup(){return Object.entries(index.resourcesByCity).map(([city,resources])=>resources.map(entry=>{let resource=MARKET_RESOURCE_NAME[entry.resource],rect=rectFor(entry.placement),amount=Math.max(0,num(state.markets?.[city]?.[resource]));return resource&&entry.order<=amount?asImage(resourceAsset(resource),rect,'physical-market-resource',`aria-label="${esc(city+' 시장 '+resource)}"`):''}).join('')).join('')}
 function fixedTileMarkup(){
  let merchants=Object.entries(index.merchantsByCity).map(([city,entry])=>{let used=!!state.merchantUsed?.[city];return asImage(merchantAsset(state.setup?.merchant?.[city],used),rectFor(entry.placement),`physical-fixed-tile merchant-tile${used?' used':''}`,`aria-label="${esc(city)} 상인 보상${used?' · 사용됨':''}"`)}).join('');
  let qualities=Object.entries(index.qualitiesByName).map(([name,entry])=>{let claimed=['player','automa'].some(actor=>state.qualityClaimed?.[actor]?.includes(name));return asImage(qualityAsset(state.setup?.quality?.[name],claimed),rectFor(entry.placement),`physical-fixed-tile quality-tile${claimed?' claimed':''}`,`aria-label="${esc(name)} 품질 보상${claimed?' · 수령됨 · 뒷면':''}"`)}).join('');
  let rigs=OIL_FIELD_NAMES.map(name=>{let entry=index.nodesByName[name],city=state.oilCities?.[name],occupied=city?.owner&&city.owner!=='none';return entry&&!occupied?asImage(oilRigAsset(),oilTileRect(entry),'physical-fixed-tile oil-rig-tile',`aria-label="${esc(name)} 유정 받침 타일"`):''}).join('');
  let oils=OIL_FIELD_NAMES.map(name=>{let entry=index.nodesByName[name],setup=state.setup?.oil?.[name],city=state.oilCities?.[name],occupied=city?.owner&&city.owner!=='none',clearedForEraTwo=num(state.era)>=2&&setup?.revealed;return entry&&setup&&!occupied&&!clearedForEraTwo?asImage(oilAsset(setup.value,setup.revealed),oilRewardRect(entry),'physical-fixed-tile oil-reward-tile',`aria-label="${esc(name)} 유전 보상${setup.revealed?' · 공개됨':' · 뒷면'}"`):''}).join('');
  return resourceMarkup()+merchants+qualities+rigs+oils;
 }
 function constructionGuideTiles(rect,allowed){let tiles=(Array.isArray(allowed)?allowed:[]).map(industry=>({industry,src:constructionGuideAsset(industry)})).filter(tile=>tile.src).slice(0,4);if(!tiles.length)return[];let count=tiles.length,side=Math.min(rect.w,rect.h),size=([0,.76,.598,.42,.35][count]||.35)*side,step=([0,0,.34,.28,.2][count]||.2)*side,rise=([0,0,.14,.1,.08][count]||.08)*side;return tiles.map((tile,index)=>{let offset=index-(count-1)/2,x=rect.x+offset*step,y=rect.y+offset*rise;return {...tile,index,x,y,w:size,h:size,left:x-size/2,top:y-size/2}})}
 function constructionGuideMarkup(){return Object.entries(index.slotsByCity).map(([city,slots])=>slots.map((entry,slotIndex)=>{let piece=state.cities?.[city]?.[slotIndex];if(piece?.owner&&piece.owner!=='none')return'';let allowed=typeof slotRules==='function'?slotRules(city)?.[slotIndex]:[],rect=rectFor(entry.placement),tiles=constructionGuideTiles(rect,allowed);if(!tiles.length)return'';let size=Math.min(rect.w,rect.h)*.94,left=rect.x-size/2,top=rect.y-size/2,inset=Math.max(1.5,size*.035),rim=Math.max(2.7,size*.065),radius=Math.min(12,size*.16);return `<g class="physical-construction-guide ${tiles.length===1?'single':'multi'} count-${tiles.length}" data-construction-guide-city="${esc(city)}" data-construction-guide-slot="${slotIndex}" aria-hidden="true"${transformFor(rect)}><rect class="physical-construction-guide-well" x="${left}" y="${top}" width="${size}" height="${size}" rx="${radius}"/><rect class="physical-construction-guide-inset" x="${left+inset}" y="${top+inset}" width="${size-inset*2}" height="${size-inset*2}" rx="${Math.max(3,radius-inset)}"/><rect class="physical-construction-guide-rim" x="${left+rim}" y="${top+rim}" width="${size-rim*2}" height="${size-rim*2}" rx="${Math.max(2,radius-rim)}"/>${tiles.map(tile=>`<image class="physical-construction-guide-tile" data-guide-industry="${esc(tile.industry)}" data-guide-index="${tile.index}" href="${esc(tile.src)}" x="${tile.left}" y="${tile.top}" width="${tile.w}" height="${tile.h}" preserveAspectRatio="xMidYMid meet"/>`).join('')}</g>`}).join('')).join('')}
 function remainingIndustryResources(piece){if(!piece||piece.flipped||!['탄광','석탄','코크스 공장','제철소'].includes(piece.industry))return[];let hasStored=!!(piece.resources&&Object.keys(piece.resources).length),stored=Object.entries(piece.resources||{}).filter(([resource,amount])=>resourceAsset(resource)&&num(amount)>0);if(hasStored)return stored;let fallback=(piece.industry==='탄광'||piece.industry==='석탄')?'석탄':piece.industry==='코크스 공장'?'코크스':piece.industry==='제철소'?'철':'';return fallback&&num(piece.resource)>0?[[fallback,num(piece.resource)]]:[]}
 function stableNumber(value){let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return hash>>>0}
 function industryResourceMarkup(piece,rect,key){let units=remainingIndustryResources(piece).flatMap(([resource,amount])=>Array.from({length:Math.min(6,Math.floor(num(amount)))},(_,ordinal)=>({resource,ordinal}))).slice(0,6);if(!units.length)return'';let size=Math.min(rect.w,rect.h)*.31;return `<g class="physical-industry-resource-pile" aria-label="${esc((piece.industry||'산업')+' 잔여 자원')}">${units.map(({resource,ordinal},unitIndex)=>{let seed=stableNumber(key+'|'+resource+'|'+ordinal),spot=RESOURCE_PILE_SPOTS[unitIndex],jitterX=(seed%7-3)*.75,jitterY=(Math.floor(seed/7)%7-3)*.75,angle=(Math.floor(seed/49)%7-3)*2.2,cx=rect.x+spot[0]*rect.w+jitterX,cy=rect.y+spot[1]*rect.h+jitterY;return `<image class="physical-industry-resource" href="${esc(resourceAsset(resource))}" x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" transform="rotate(${angle} ${cx} ${cy})" aria-label="${esc(resource)}"/>`}).join('')}</g>`}
 function industryMarkup(){return Object.entries(index.slotsByCity).map(([city,slots])=>`<g class="physical-city-layer" data-node="${esc(city)}">${slots.map((entry,slotIndex)=>{let piece=state.cities?.[city]?.[slotIndex],src=piece?.owner&&piece.owner!=='none'?industryAsset(piece):'',rect=rectFor(entry.placement);return src?`<g class="physical-industry-piece ${esc(piece.owner)}">${asImage(src,rect,'physical-industry-tile',`aria-label="${esc(city)} ${esc(piece.industry||piece.groupId)}"`)}${industryResourceMarkup(piece,rect,city+'#'+slotIndex)}</g>`:''}).join('')}</g>`).join('')+OIL_FIELD_NAMES.map(name=>{let piece=state.oilCities?.[name],entry=index.nodesByName[name],src=piece?.owner&&piece.owner!=='none'?industryAsset(piece):'';return entry&&src?`<g class="physical-oil-city-piece" data-node="${esc(name)}">${asImage(src,oilTileRect(entry),'physical-industry-tile oil-city-tile',`aria-label="${esc(name)} 오일 시티"`)}</g>`:''}).join('')}
 function distanceFromRect(point,rect){let dx=Math.max(rect.left-point[0],0,point[0]-(rect.left+rect.w)),dy=Math.max(rect.top-point[1],0,point[1]-(rect.top+rect.h));return Math.hypot(dx,dy)}
 function routeAnchor(curve,route){let configured=layout.routeRender?.[route.item.id]||{},candidates=[num(configured.t)||.5,.42,.58,.34,.66].filter((value,i,array)=>value>.05&&value<.95&&array.indexOf(value)===i),slots=index.occluders.map(item=>rectFor(item.placement)),best=candidates.map(t=>({t,clearance:Math.min(...slots.map(rect=>distanceFromRect(curve.point(t),rect)))})).sort((a,b)=>b.clearance-a.clearance)[0]||{t:.5},[x,y]=curve.point(best.t),[dx,dy]=curve.tangent(best.t),length=Math.hypot(dx,dy)||1,offset=num(configured.normalOffset);return{x:x-dy/length*offset,y:y+dx/length*offset,angle:Math.atan2(dy,dx)*180/Math.PI}}
 function networkBonusMarkup(edge,rect){let resource=edge?.bonusType;if(!resource||resource==='위스키'||num(edge.bonusRemaining)<=0)return'';let src=resourceAsset(resource);if(!src)return'';let size=Math.min(rect.w*.32,rect.h*.68),cx=rect.x+rect.w*.19,cy=rect.y;return `<image class="physical-network-bonus" href="${esc(src)}" x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" transform="rotate(${rect.rotation} ${rect.x} ${rect.y})" aria-label="${esc(resource+' 중량열차 보너스')}"/>`}
  function manualNetworkPlacement(route){
   let tile=sourceNetworkTile(route.item.id);
  if(!tile||!layout)return null;
  return{x:tile.x*layout.board.width,y:tile.y*layout.board.height,rotation:tile.rotation,locked:tile.locked===true};
 }
 function networkRect(curve,route){let manual=manualNetworkPlacement(route),anchor=manual||routeAnchor(curve,route),width=Math.round((index.industryTileWidth||90)*1.1),height=width/1.75;return{x:anchor.x,y:anchor.y,w:width,h:height,left:anchor.x-width/2,top:anchor.y-height/2,rotation:anchor.rotation??anchor.angle,manual:!!manual,locked:manual?.locked===true}}
 function installedNetworkMarkup(){return Object.entries(index.routesById).map(([id,route])=>{let edge=state.edges?.[id];if(!edge?.owner||edge.owner==='none')return'';let curve=curveFor(route);if(!curve)return'';let rect=networkRect(curve,route);return `<g class="physical-network-piece ${route.type} ${esc(edge.owner)}" data-route-piece="${esc(id)}">${asImage(networkAsset(edge,route),rect,'physical-network-tile',`aria-label="${esc(id)} ${esc(edge.networkId||edge.tile||'네트워크')}"`)}${networkBonusMarkup(edge,rect)}</g>`}).join('')}
 /* Board-map information is read-only presentation.  None of these helpers
  * call slot(), snapshot(), save(), or an action resolver. */
 function boardInfoOwner(owner){return owner==='player'?'플레이어':owner==='automa'?'오토마':'없음'}
 function boardInfoFact(label,value){return `<div class="physical-board-info-fact"><span>${esc(label)}</span><strong>${esc(value??'없음')}</strong></div>`}
 function boardInfoList(label,values,empty='없음'){let items=Array.isArray(values)&&values.length?values:[empty];return `<section class="physical-board-info-list"><h4>${esc(label)}</h4><ul>${items.map(value=>`<li>${esc(value)}</li>`).join('')}</ul></section>`}
 function boardInfoResourceList(label,entries){return boardInfoList(label,(entries||[]).filter(([,amount])=>Number.isFinite(Number(amount))).map(([resource,amount])=>`${resource} ${Math.max(0,Math.floor(num(amount)))}개`))}
 function merchantProduct(value){return String(value||'').split(' · ')[0]||'없음'}
 function merchantFirstReward(value){return String(value||'').split(' · ').find(part=>part.startsWith('최초'))?.replace(/^최초\s*/,'')||'없음'}
 function oilOpenBonus(value){let bonus=String(value||'').replace(/\s*·\s*(?:2시대\s*)?오일\s+\d+\s*$/,'').trim();return bonus||'없음'}
 function futureOilAmount(value){let match=String(value||'').match(/2시대\s*오일\s*(\d+)|오일\s*(\d+)/);return Math.max(0,Number(match?.[1]||match?.[2]||0))}
 function saleProductForPiece(piece){if(piece?.groupId==='m6'||piece?.industry==='자동차')return'자동차';if(piece?.industry==='등유')return'등유';return piece?.industry==='제조 상자'?'제조 상자':''}
 function merchantSaleCandidates(city,product){
  let connected=new Set([city]);try{if(typeof connectedFrom==='function')connected=connectedFrom(city)}catch(error){}
  return Object.entries(state.cities||{}).flatMap(([source,slots])=>(slots||[]).map((piece,slotIndex)=>({source,piece,slotIndex}))).filter(({source,piece})=>connected.has(source)&&piece?.owner&&piece.owner!=='none'&&!piece.flipped&&saleProductForPiece(piece)===product).map(({source,piece,slotIndex})=>`${boardInfoOwner(piece.owner)} · ${source} ${slotIndex+1}번 칸`)
 }
 function infoSlotPiece(city,slotIndex){let piece=state.cities?.[city]?.[slotIndex];return piece&&typeof piece==='object'?piece:{owner:'none',industry:'',level:1,resource:0,resources:{},flipped:false}}
 function infoCitySlots(city){let rules=typeof slotRules==='function'?slotRules(city):[];let count=Math.max(1,Math.min(4,rules.length||1));return Array.from({length:count},(_,slotIndex)=>({slotIndex,piece:infoSlotPiece(city,slotIndex)}))}
 function infoSlotIndustry(piece){return piece?.groupId==='m6'?'자동차':piece?.industry==='탄광'?'석탄':piece?.industry||''}
 function infoTileForGroup(track,entry){if(typeof INDUSTRIES==='undefined')return null;let id=entry?.ids?.find(candidate=>!state.playerRemoved?.[candidate]),tileIndex=Number(String(id||'').split(':')[1]);return Number.isInteger(tileIndex)?INDUSTRIES?.[track]?.tiles?.[tileIndex]||null:null}
 function infoEraAllowsGroup(entry,tile){let era=Number(state.era)||1,name=String(tile?.[0]||'');return !(era===1&&(name.includes('오일 시티')||name.includes('기관차 공장')))&&!(era===2&&entry?.id==='o1')}
 function infoLegalEmptySlots(city,track,tileName){
  if(typeof slotRules!=='function'||typeof tileIndustry!=='function')return[];let industry=tileIndustry(track,tileName),rules=slotRules(city),valid=rules.map((allowed,slotIndex)=>({slotIndex,allowed,piece:infoSlotPiece(city,slotIndex)})).filter(item=>item.piece.owner==='none'&&item.allowed.includes(industry));if(!valid.length)return[];let minimum=Math.min(...valid.map(item=>item.allowed.length));return valid.filter(item=>item.allowed.length===minimum).map(item=>item.slotIndex)
 }
 function infoBuildLocations(track,tileName,city){
  if(typeof tileIndustry!=='function'||typeof industryLevel!=='function')return[];
  if(String(tileName).includes('오일 시티'))return[];
  let existing=infoCitySlots(city),owned=existing.filter(({piece})=>piece.owner==='player'),oneIndustry=(Number(state.era)||1)===1,replacesCoal=track==='coke'||String(tileName).includes('다상 교류'),replacesManufacturing=String(tileName).includes('타자기')||String(tileName).includes('기관차 공장');
  if(replacesCoal||replacesManufacturing)return existing.filter(({piece})=>piece.owner==='player'&&piece.flipped&&(!oneIndustry||owned.length===1)&&(replacesCoal?infoSlotIndustry(piece)==='석탄':infoSlotIndustry(piece)==='제조 상자')).map(({slotIndex})=>({city,i:slotIndex,replaces:true}));
  let empty=oneIndustry&&owned.length?[]:infoLegalEmptySlots(city,track,tileName).map(i=>({city,i,replaces:false})),industry=tileIndustry(track,tileName),tier=industryLevel(tileName),upgrades=existing.filter(({piece})=>piece.owner==='player'&&(!oneIndustry||owned.length===1)&&infoSlotIndustry(piece)===industry&&tier>(industryLevel(typeof group==='function'?group(piece.groupId)?.name:'')||Number(piece.level)||0)).map(({slotIndex})=>({city,i:slotIndex,replaces:true}));return [...empty,...upgrades]
 }
 function buildableGroupsForSlot(city,slotIndex){
  if(typeof playerGroupCandidates!=='function')return[];let candidates=[];try{candidates=playerGroupCandidates()}catch(error){return[]}
  return candidates.filter(({track,g})=>{let tile=infoTileForGroup(track,g);return tile&&infoEraAllowsGroup(g,tile)&&infoBuildLocations(track,tile[0],city).some(place=>place.i===slotIndex)}).map(({g})=>`${g.name} · ${g.cost}`)
 }
 function marketInfoDescriptor(city){
  let definition=typeof MARKET_DEF==='undefined'?null:MARKET_DEF[city],resources=definition?.res||Object.keys(state.markets?.[city]||{}),remaining=resources.map(resource=>[resource,state.markets?.[city]?.[resource]||0]);
  return {type:'자원 시장',title:`${city} 자원 시장`,html:boardInfoFact('자원 가격',definition?`$${definition.price} / 1개`:'가격 정보 없음')+boardInfoResourceList('남은 자원',remaining)}
 }
 function merchantInfoDescriptor(city){
  let value=state.setup?.merchant?.[city]||'',product=merchantProduct(value),used=!!state.merchantUsed?.[city],candidates=value?merchantSaleCandidates(city,product):[];
  return {type:'상인 시장',title:`${city} 상인 시장`,html:boardInfoFact('현재 판매 가능 산업',product)+boardInfoFact('뒤집힌 뒤 판매 가능 산업',product)+boardInfoFact('최초 판매 보상',used?'없음':merchantFirstReward(value))+boardInfoList('철도 연결된 미판매 타일',candidates)}
 }
 function oilInfoDescriptor(field){
  let tile=state.setup?.oil?.[field]||{};
  if(!tile.revealed)return {type:'유전',title:field,html:boardInfoFact('상태','미오픈')+'<p class="physical-board-info-note">유전 타일을 공개한 뒤 오일·보상·다음 시대 충전량을 확인할 수 있습니다.</p>'};
  let claimed=state.oilRewardsClaimed?.[field],future=(Number(state.era)||1)>=2||state.eraTwoOilFilled?null:futureOilAmount(tile.value),oilCity=state.oilCities?.[field],bonus=oilOpenBonus(tile.value);
  let bonusState=claimed?`${boardInfoOwner(claimed)} 수령`:'공개됨';return {type:'유전',title:field,html:boardInfoFact('남은 오일',`${oilFieldStock(field)}개`)+boardInfoFact('타일 오픈 보너스',`${bonus} · ${bonusState}`)+boardInfoFact('다음 시대 추가 오일',future===null?'0개 · 충전 완료':`${future}개`)+(oilCity?boardInfoFact('오일 시티',`${boardInfoOwner(oilCity.owner)} · ${oilCity.flipped?'뒤집힘':'앞면'}`):'')}
 }
 function industryInfoDescriptor(city,slotIndex,piece){
  let entry=typeof group==='function'?group(piece.groupId):null,name=entry?.name||piece.industry||'산업 타일',level=piece.level||(typeof industryLevel==='function'?industryLevel(entry?.name):0)||'—',resourceIndustry=['탄광','석탄','코크스 공장','제철소'].includes(piece.industry),resources=resourceIndustry?remainingIndustryResources(piece):[];
  return {type:'산업 타일',title:`${city} · ${name}`,html:boardInfoFact('소유자',boardInfoOwner(piece.owner))+boardInfoFact('타일 상태',piece.flipped?'뒤집힘':'앞면')+boardInfoFact('등급',`레벨 ${level}`)+(entry?boardInfoFact('건설 비용',entry.cost)+boardInfoFact('효과',entry.effect):'')+(resourceIndustry?boardInfoResourceList('타일 위 남은 자원',resources):'')}
 }
 function industryRegionInfoDescriptor(city,slotIndex){
  let allowed=(typeof slotRules==='function'?slotRules(city)?.[slotIndex]:[])||[],buildable=buildableGroupsForSlot(city,slotIndex);
  return {type:'산업 지역',title:`${city} · ${slotIndex+1}번 산업 지역`,html:boardInfoList('이 칸에 허용된 산업',allowed)+boardInfoList('현재 배치 가능한 내 산업 타일',buildable,'없음 · 카드·자원·현금 비용은 행동 시 다시 확인')+'<p class="physical-board-info-note">해금·남은 타일·시대·지역 칸 조건을 반영한 안내입니다.</p>'}
 }
 function slotInfoDescriptor(city,slotIndex){let piece=infoSlotPiece(city,slotIndex);return piece.owner&&piece.owner!=='none'?industryInfoDescriptor(city,slotIndex,piece):industryRegionInfoDescriptor(city,slotIndex)}
 function networkInfoDescriptor(routeId){
  let route=index.routesById?.[routeId],edge=state.edges?.[routeId],definition=(typeof NETWORKS==='undefined'?[]:NETWORKS).find(network=>network.id===edge?.networkId),heavy=/^(?:start-(?:whiskey|steel)|train-)/.test(edge?.networkId||''),resource=edge?.bonusType&&edge.bonusType!=='위스키'&&num(edge.bonusRemaining)>0?`${edge.bonusType} ${Math.floor(num(edge.bonusRemaining))}개`:'없음';
  if(!route||!edge)return {type:'네트워크',title:'네트워크',html:boardInfoFact('상태','설치되지 않음')};
  return {type:'네트워크',title:`${route.from} — ${route.to}`,html:boardInfoFact('종류',route.type==='pipe'?'송유관':'철도')+boardInfoFact('소유자',boardInfoOwner(edge.owner))+boardInfoFact('네트워크 타일',definition?.name||edge.networkId||edge.tile||'네트워크')+(definition?boardInfoFact('효과',definition.effect):'')+(heavy?boardInfoFact('현재 올라간 자원',resource):'')}
 }
 function qualityInfoDescriptor(name){let reward=state.setup?.quality?.[name]||'미정',owners=['player','automa'].filter(actor=>state.qualityClaimed?.[actor]?.includes(name)).map(boardInfoOwner);return {type:'품질 보너스',title:`${name} 품질 보너스`,html:boardInfoFact('보상',reward)+boardInfoFact('수령자',owners.join(' · ')||'없음')}}
 function boardInfoDescriptor(target){
  if(target?.kind==='market')return marketInfoDescriptor(target.city);if(target?.kind==='merchant')return merchantInfoDescriptor(target.city);if(target?.kind==='oil')return oilInfoDescriptor(target.field);if(target?.kind==='slot')return slotInfoDescriptor(target.city,Number(target.slot));if(target?.kind==='network')return networkInfoDescriptor(target.routeId);if(target?.kind==='quality')return qualityInfoDescriptor(target.name);return {type:'지도 정보',title:'구성 요소 정보',html:boardInfoFact('상태','정보를 찾을 수 없습니다.')}
 }
 function boardInfoHitRect(kind,attributes,rect,label){let data=Object.entries(attributes).map(([key,value])=>` data-board-info-${esc(key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()))}="${esc(value)}"`).join('');return `<rect class="physical-board-info-hit" data-board-info="${esc(kind)}"${data} role="button" tabindex="0" aria-label="${esc(label)}" x="${rect.left}" y="${rect.top}" width="${rect.w}" height="${rect.h}" rx="${Math.min(12,rect.w/4,rect.h/4)}"${transformFor(rect)}/>`}
 function boardInfoHitMarkup(){
  if(mapSelection?.kind)return'';
  let markets=Object.entries(index.resourcesByCity).map(([city,entries])=>entries.map(entry=>boardInfoHitRect('market',{city},rectFor(entry.placement),`${city} 자원 시장 정보`)).join('')).join('');
  let merchants=Object.entries(index.merchantsByCity).map(([city,entry])=>boardInfoHitRect('merchant',{city},rectFor(entry.placement),`${city} 상인 시장 정보`)).join('');
  let oils=OIL_FIELD_NAMES.map(field=>{let entry=index.nodesByName[field];return entry?boardInfoHitRect('oil',{field},oilTileRect(entry),`${field} 정보`):''}).join('');
  let qualities=Object.entries(index.qualitiesByName).map(([name,entry])=>boardInfoHitRect('quality',{name},rectFor(entry.placement),`${name} 품질 보너스 정보`)).join('');
  let networks=Object.entries(index.routesById).map(([routeId,route])=>{let edge=state.edges?.[routeId],curve=curveFor(route);return edge?.owner&&edge.owner!=='none'&&curve?boardInfoHitRect('network',{routeId},networkRect(curve,route),`${route.from} ${route.to} 네트워크 정보`):''}).join('');
  return markets+merchants+oils+qualities+networks
 }
 function ensureBoardInfoPopover(){
  if(boardInfoPopover?.isConnected)return boardInfoPopover;let existing=$('#physicalBoardInfoPopover');if(existing){boardInfoPopover=existing;return existing}let mapWrap=$('.map-wrap');if(!mapWrap||!document.createElement)return null;
  let panel=document.createElement('aside');panel.id='physicalBoardInfoPopover';panel.className='physical-board-info-popover';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','지도 구성 요소 정보');panel.innerHTML='<div class="physical-board-info-head"><div><span id="physicalBoardInfoType"></span><strong id="physicalBoardInfoTitle"></strong></div><button id="physicalBoardInfoClose" type="button" aria-label="정보 닫기">×</button></div><div id="physicalBoardInfoBody" class="physical-board-info-body"></div>';panel.addEventListener('click',event=>event.stopPropagation());mapWrap.append(panel);panel.querySelector('#physicalBoardInfoClose')?.addEventListener('click',closeBoardInfoPopover);boardInfoPopover=panel;return panel
 }
 function closeBoardInfoPopover(){let panel=boardInfoPopover||$('#physicalBoardInfoPopover');if(panel){panel.hidden=true;panel.setAttribute('aria-hidden','true')}}
 function positionBoardInfoPopover(panel,event){
  let mapWrap=$('.map-wrap'),bounds=mapWrap?.getBoundingClientRect?.();if(!mapWrap||!bounds)return;let left=Number.isFinite(event?.clientX)?event.clientX-bounds.left+14:Math.max(8,(mapWrap.clientWidth-panel.offsetWidth)/2),top=Number.isFinite(event?.clientY)?event.clientY-bounds.top+14:Math.max(8,(mapWrap.clientHeight-panel.offsetHeight)/2),maxLeft=Math.max(8,mapWrap.clientWidth-panel.offsetWidth-8),maxTop=Math.max(8,mapWrap.clientHeight-panel.offsetHeight-8);panel.style.left=`${Math.min(Math.max(8,left),maxLeft)}px`;panel.style.top=`${Math.min(Math.max(8,top),maxTop)}px`
 }
 function showBoardInfo(target,event){
  if(mapSelection?.kind)return;let panel=ensureBoardInfoPopover();if(!panel)return;let descriptor=boardInfoDescriptor(target),type=panel.querySelector('#physicalBoardInfoType'),title=panel.querySelector('#physicalBoardInfoTitle'),body=panel.querySelector('#physicalBoardInfoBody');if(type)type.textContent=descriptor.type;if(title)title.textContent=descriptor.title;if(body)body.innerHTML=descriptor.html;panel.hidden=false;panel.setAttribute('aria-hidden','false');positionBoardInfoPopover(panel,event);if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>positionBoardInfoPopover(panel,event))
 }
 function boardInfoTargetFromElement(element){let kind=element.dataset.boardInfo;if(kind==='market'||kind==='merchant')return {kind,city:element.dataset.boardInfoCity};if(kind==='oil')return {kind,field:element.dataset.boardInfoField};if(kind==='network')return {kind,routeId:element.dataset.boardInfoRouteId};if(kind==='quality')return {kind,name:element.dataset.boardInfoName};return null}
 function bindBoardInfoInteractions(){
 $$('[data-board-info]').forEach(element=>{let open=event=>{event?.stopPropagation?.();if(mapDrag?.moved||mapSelection?.kind)return;let target=boardInfoTargetFromElement(element);if(target)showBoardInfo(target,event)};element.onclick=open;element.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(event)}}});
  let svg=$('#mapEdges');if(!svg)return;if(svg.addEventListener&&!svg.__boardInfoViewBound){svg.__boardInfoViewBound=true;svg.addEventListener('pointerdown',()=>{if(!mapSelection)closeBoardInfoPopover()});svg.addEventListener('wheel',()=>{if(!mapSelection)closeBoardInfoPopover()},{passive:true})}svg.onclick=event=>{if(mapDrag?.moved||mapSelection?.kind||event.target?.closest?.('[data-slot],[data-board-info],[data-edge]'))return;closeBoardInfoPopover()}
 }
 function interactionMarkup(){
 let legal=new Set(mapSelection?.kind==='build'?currentMapCandidates().map(option=>option.city+'#'+option.i):[]);
  let citySlots=Object.entries(index.slotsByCity).map(([city,slots])=>`<g class="physical-slot-interactions" data-node="${esc(city)}">${slots.map((entry,slotIndex)=>{let rect=rectFor(entry.placement),candidate=legal.has(city+'#'+slotIndex),piece=state.cities?.[city]?.[slotIndex],label=piece?.owner&&piece.owner!=='none'?`${city} ${piece.industry||piece.groupId} 산업 타일 정보`:`${city} ${slotIndex+1}번 산업 지역 정보`;return `<g class="physical-slot-hit ${candidate?'action-candidate':''}" data-slot="${slotIndex}" role="button" tabindex="0" aria-label="${esc(label)}"><rect class="physical-slot-hit-surface" x="${rect.left}" y="${rect.top}" width="${rect.w}" height="${rect.h}" rx="${Math.min(10,rect.w/4)}"${transformFor(rect)}/>${candidate?`<rect class="physical-slot-candidate" x="${rect.left}" y="${rect.top}" width="${rect.w}" height="${rect.h}" rx="${Math.min(10,rect.w/4)}"${transformFor(rect)}/>`:''}</g>`}).join('')}</g>`).join('');
  let oils=OIL_FIELD_NAMES.map(name=>{let entry=index.nodesByName[name],candidate=mapSelection?.kind==='build'&&currentMapCandidates().some(option=>option.city===name);if(!entry)return'';let rect=oilTileRect(entry),radius=Math.max(rect.w,rect.h)*.7;return `<g class="physical-oil-hit ${candidate?'action-candidate':''}" data-node="${esc(name)}" role="button" tabindex="0" aria-label="${esc(name+(candidate?' 오일 시티 건설':' 유전 정보'))}"><circle class="physical-oil-hit-surface" cx="${rect.x}" cy="${rect.y}" r="${radius/2}" fill="transparent" stroke="transparent"/>${candidate?`<circle class="physical-oil-candidate" cx="${rect.x}" cy="${rect.y}" r="${radius/2}"/>`:''}</g>`}).join('');return citySlots+oils;
 }
 function bindInteractions(){
  $$('[data-edge]').forEach(element=>element.onclick=()=>{if(mapDrag?.moved)return;if(mapSelection?.kind==='edge'){let includeV=mapSelection.includeV,found=currentMapCandidates().find(option=>option.id===element.dataset.edge);if(found)endMapSelection({...found,_includeV:includeV});}});
  $$('[data-slot]').forEach(element=>{let activate=event=>{event?.stopPropagation?.();if(mapDrag?.moved)return;let city=element.closest('[data-node]')?.dataset.node;if(mapSelection?.kind==='build'){let includeV=mapSelection.includeV,found=currentMapCandidates().find(option=>option.city===city&&option.i===+element.dataset.slot);if(found)endMapSelection({...found,_includeV:includeV});return}if(!mapSelection&&city)showBoardInfo({kind:'slot',city,slot:+element.dataset.slot},event)};element.onclick=activate;element.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(event)}}});
  $$('[data-node]').forEach(element=>element.onclick=()=>{if(mapDrag?.moved)return;if(mapSelection?.kind==='build'){let found=currentMapCandidates().find(option=>option.city===element.dataset.node&&isOilField(element.dataset.node));if(found)endMapSelection({...found,_includeV:mapSelection.includeV});}});
  $$('.physical-oil-hit').forEach(element=>element.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();element.onclick?.()}});
 }
  function renderPhysicalMap(){
   if(!layout||!index)return;let svg=$('#mapEdges');if(!svg)return;closeBoardInfoPopover();svg.classList.add('physical-board-svg');svg.setAttribute('viewBox',`0 0 ${layout.board.width} ${layout.board.height}`);svg.setAttribute('aria-label','브라스 피츠버그 2인용 실물 보드 · 확대 후 드래그하여 이동');
   svg.innerHTML=`<defs>${routeMaskMarkup()}</defs><image class="physical-board-art" href="${esc(layout.board.asset)}" x="0" y="0" width="${layout.board.width}" height="${layout.board.height}" preserveAspectRatio="none"/><g class="physical-fixed-layer">${fixedTileMarkup()}</g><g class="physical-route-glow-layer" mask="url(#physical-route-glow-mask)">${candidateRouteMarkup()}</g><g class="physical-route-highlight-layer">${authoredCandidateRouteMarkup()}</g><g class="physical-construction-guide-layer">${constructionGuideMarkup()}</g><g class="physical-industries-layer">${industryMarkup()}</g><g class="physical-oil-resources-layer">${oilResourceMarkup()}</g><g class="physical-networks-layer">${installedNetworkMarkup()}</g><g class="physical-interaction-layer">${interactionMarkup()}</g><g class="physical-route-hit-layer">${routeHitMarkup()}</g><g class="physical-board-info-hit-layer">${boardInfoHitMarkup()}</g>`;
   window.PittsburghTrackMarkers?.render(svg,layout,{playerVP:state.playerVP,vp:state.vp,playerIncome:state.playerIncome,income:state.income,seed:state.seed},window.PittsburghBoardPresets?.getActive()||'original');
   $('.map-wrap')?.classList.add('physical-board-active');setMapView();bindInteractions();bindBoardInfoInteractions();
 }
  function refreshBoardPreset(){if(!authoredLayout)return;let raw=window.PittsburghBoardPresets?.resolve(authoredLayout)||authoredLayout;layout=raw;index=buildIndex(raw);MAP_W=raw.board.width;MAP_H=raw.board.height;mapZoom=1;mapPan={x:0,y:0};closeBoardInfoPopover();document.body.classList.add('physical-board-ready');renderAll();}
  async function loadPhysicalBoard(){try{let raw=window.PITTSBURGH_2P_LAYOUT;if(!raw){let response=await fetch(LAYOUT_URL,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);raw=await response.json();}if(raw.coordinateSystem!=='normalized-image')throw new Error('unsupported coordinate system');authoredLayout=raw;refreshBoardPreset();}catch(error){console.warn('실물 피츠버그 보드 레이아웃을 불러오지 못했습니다.',error);document.body.classList.add('physical-board-fallback');}}
  window.PhysicalBoardRenderer={isReady:()=>!!layout,render:renderPhysicalMap,getLayout:()=>layout,describeMapInfo:boardInfoDescriptor,refreshBoardPreset};
 loadPhysicalBoard();
})();
