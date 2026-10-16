/* Shared status and a stable board viewport across both turns. */
(() => {
  const q=s=>document.querySelector(s), panel=q('#playerPanel');
  const summary=document.createElement('section');
  summary.className='table-status panel';
  q('.command-column').prepend(summary);
  const bonus=q('.player-bonus');q('.market-column').append(bonus);
  const auto=document.createElement('section');auto.className='table-automa-dock';
  panel.append(auto);
  ['#nextAutomaMode','#proposal','.command-column>.actions'].forEach(s=>{const el=q(s);if(el)auto.append(el)});
  const original=renderNext;
  renderNext=function(){original();syncTable()};
  function syncTable(){
    panel.hidden=false;
    const player=state.turnOwner==='player'&&!state.gameOver;
    q('.next-control-row').hidden=!player;auto.hidden=player;
    bonus.hidden=!q('#playerBonusSummary .bonus-chip');
    const first=state.roundStarter==='player'?'player':'automa';
    summary.innerHTML='<h2>차례 · 상태</h2><div class="table-status-scroll"><table><thead><tr><th>순서</th><th>현금</th><th>지출</th><th>승점</th><th>수입</th><th>위스키</th><th>카드</th></tr></thead><tbody>'+[first,first==='player'?'automa':'player'].map((a,i)=>{
      const p=a==='player',active=a===state.turnOwner;
      return `<tr class="${active?'current':''}"><th>${i+1}. ${p?'나':'오토마'}${active?'<small>행동 '+state.actionNo+'/'+actionsThisTurn()+'</small>':''}</th><td>$${p?state.playerMoney:state.money}</td><td>$${p?state.playerSpent:state.spent}</td><td>${p?state.playerVP:state.vp}</td><td>${p?state.playerIncomeLevel:state.incomeLevel}<small>${p?state.playerIncome:state.income}칸</small></td><td>${p?state.playerWhiskey:state.bonus.automa?.위스키||0}</td><td>${p?(tracksPlayerHand()?state.playerHand.length:'실물'):state.hand.length}</td></tr>`;
    }).join('')+'</tbody></table></div>';
  }
  // Capture on the whole surface so overlaid map artwork cannot swallow the wheel.
  q('.map-stage').addEventListener('wheel',e=>{
    if(e.target.closest('button,input,select'))return;
    e.preventDefault();e.stopPropagation();
    if(!e.deltaY)return;
    const svg=q('#mapEdges'),matrix=svg.getScreenCTM();if(!matrix)return;
    const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    const old=mapZoom,next=Math.max(1,Math.min(4,old*Math.exp(-Math.max(-160,Math.min(160,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?300:1)))*.002)));
    const ratio=old/next;
    mapPan={x:(point.x-MAP_W/2)*(1-ratio)+mapPan.x*ratio,y:(point.y-MAP_H/2)*(1-ratio)+mapPan.y*ratio};
    changeZoom(next);
  },{capture:true,passive:false});
  // PC dragging owns the pointer only after it has actually moved. Capturing
  // at pointer-down retargets a plain click to the map wrapper and prevents a
  // selectable route beneath it from receiving its installation click.
  const surface=q('.map-wrap');let drag=null,suppressClick=false,clickTimer;
  surface.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0||mapZoom<=1)return;
    e.stopPropagation();
    const rect=q('#mapEdges').getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    drag={id:e.pointerId,lastX:e.clientX,lastY:e.clientY,width:rect.width,height:rect.height,zoom:mapZoom,moved:false};
  },true);
  surface.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    e.stopPropagation();
    const deltaX=e.clientX-drag.lastX,deltaY=e.clientY-drag.lastY;
    if(!drag.moved&&Math.hypot(deltaX,deltaY)<2)return;
    if(!drag.moved){drag.moved=true;surface.setPointerCapture(e.pointerId);surface.classList.add('is-dragging')}
    e.preventDefault();
    const dx=deltaX*MAP_W/(drag.width*drag.zoom);
    const dy=deltaY*MAP_H/(drag.height*drag.zoom);
    drag.lastX=e.clientX;drag.lastY=e.clientY;
    mapDrag={moved:true};mapPan={x:mapPan.x-dx,y:mapPan.y-dy};setMapView();
  },true);
  const finishDrag=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    e.stopPropagation();const moved=drag.moved;drag=null;
    if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);
    surface.classList.remove('is-dragging');
    if(moved){suppressClick=true;clearTimeout(clickTimer);clickTimer=setTimeout(()=>{suppressClick=false;mapDrag=null},100)}
  };
  surface.addEventListener('pointerup',finishDrag,true);
  surface.addEventListener('pointercancel',finishDrag,true);
  surface.addEventListener('lostpointercapture',finishDrag,true);
  surface.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
  surface.addEventListener('dragstart',e=>e.preventDefault());
  syncTable();
})();
