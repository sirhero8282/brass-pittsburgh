/* Read-only, board-local presentation. No game-state/storage writes. */
(()=>{
 'use strict';
 const NS='http://www.w3.org/2000/svg',records=new Map();let raf=0,identity='',nodes=new Map(),board=null,track=null;
 const number=value=>Number.isFinite(Number(value))?Math.trunc(Number(value)):0;
 const position=(value,kind)=>kind==='income'?Math.max(0,Math.min(99,number(value))):((number(value)%100)+100)%100;
 const at=(value,kind,points)=>points[position(value,kind)];
 const pixel=p=>({...p,x:p.x*board.width,y:p.y*board.height});
 function pathBetween(from,to,kind,points,startPoint){
  const direction=to>=from?1:-1,delta=Math.abs(to-from);
  // Bound very large imported scores, retaining the final track position.
  if(kind==='vp'&&delta>200)from=to-direction*(100+Math.ceil(delta)%100);
  let previous={...(startPoint||at(from,kind,points)),value:from},path=[previous];
  for(let value=direction>0?Math.floor(from)+1:Math.ceil(from)-1;direction>0?value<=to:value>=to;value+=direction){
   const next={...at(value,kind,points),value};
   if(previous.side!==next.side){const vertical=['left','right'].includes(previous.side);path.push({x:vertical?previous.x:next.x,y:vertical?next.y:previous.y,side:next.side,value:(previous.value+value)/2});}
   path.push(next);previous=next;
  }
  return path;
 }
 function sample(record,now){
  if(!record.duration||now>=record.start+record.duration)return {...record.path.at(-1),done:true};
  const progress=Math.max(0,(now-record.start)/record.duration),distances=record.distances,total=distances.at(-1),distance=progress*total;
  let i=1;while(i<distances.length-1&&distance>distances[i])i++;
  const a=record.path[i-1],b=record.path[i]||a,t=(distance-distances[i-1])/(distances[i]-distances[i-1]||1);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,value:a.value+(b.value-a.value)*t,side:t<.5?a.side:b.side,done:false};
 }
 function makeRecord(value,kind,points,previous,now,animate){
  const start=previous?sample(previous,now):null,path=pathBetween(start?.value??value,value,kind,points,start),distances=[0];
  for(let i=1;i<path.length;i++)distances.push(distances.at(-1)+Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y));
  return {value,kind,path,distances,start:now,duration:animate&&previous&&path.length>1?Math.min(1800,Math.max(240,Math.abs(value-start.value)*90)):0};
 }
 const element=(name,attributes={},text)=>{const e=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attributes))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;};
 function definitions(){
  const defs=element('defs');
  defs.innerHTML='<filter id="ptm-shadow" x="-60%" y="-60%" width="230%" height="240%"><feDropShadow dx="1.2" dy="2.2" stdDeviation="1.4" flood-color="#080e0c" flood-opacity=".65"/></filter><linearGradient id="ptm-blue" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#5f99ad"/><stop offset=".45" stop-color="#326b82"/><stop offset="1" stop-color="#204559"/></linearGradient><linearGradient id="ptm-red" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#b76c57"/><stop offset=".45" stop-color="#934b40"/><stop offset="1" stop-color="#632f2b"/></linearGradient><pattern id="ptm-grain" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M-20 4 Q0 0 20 4 T60 4 M-20 11 Q0 16 20 11 T60 11 M-20 20 Q0 16 20 20 T60 20 M-20 31 Q0 36 20 31 T60 31 M-20 36 Q0 33 20 36 T60 36" stroke="#ead8b2" stroke-opacity=".16" stroke-width=".65" fill="none"/></pattern>';
  return defs;
 }
 function piece(actor,kind,value){
  const group=element('g',{class:`physical-track-marker ${actor} ${kind}`,role:'img','aria-label':`${actor==='player'?'플레이어':'오토마'} ${kind==='vp'?'승점':'수입 위치'} ${value}${kind==='vp'?'VP':'번 칸'}`,'data-track-marker':actor+'-'+kind,'data-track-value':value});
  group.style.pointerEvents='none';group.append(element('title',{},`${actor==='player'?'플레이어':'오토마'} · ${kind==='vp'?value+'VP':value+'번 수입 칸'}`));
  const shape=attrs=>kind==='income'?element('circle',{r:17,...attrs}):element('path',{d:'M0 -19 L16.45 -9.5 L16.45 9.5 L0 19 L-16.45 9.5 L-16.45 -9.5 Z',...attrs});
  const wood=element('g',{filter:'url(#ptm-shadow)'}),color=actor==='player'?'blue':'red';
  wood.append(shape({transform:'translate(0 3)',fill:actor==='player'?'#163749':'#48221f',stroke:'#192420','stroke-width':1.1}));
  wood.append(shape({fill:`url(#ptm-${color})`,stroke:'#c2af82','stroke-width':1}));
  wood.append(shape({fill:'url(#ptm-grain)'}));
  wood.append(shape({fill:'none',stroke:'#f1dca0','stroke-opacity':'.32','stroke-width':'.75',transform:'scale(.86)'}));
  wood.append(element('text',{'text-anchor':'middle','dominant-baseline':'central',y:.8,fill:'#f8eed5','font-family':'Georgia,serif','font-weight':'bold','font-size':kind==='income'?23:13,'paint-order':'stroke','stroke':'#16211e66','stroke-width':.9},kind==='income'?'$':'VP'));
  group.append(wood);
  if(kind==='vp'&&Math.abs(value)>=100){const laps=Math.floor(value/100)*100;group.append(element('rect',{x:-17,y:15,width:34,height:13,rx:4,fill:'#172b2b',stroke:'#c4ac76','stroke-width':.8}));group.append(element('text',{x:0,y:24,'text-anchor':'middle',fill:'#fff0c9','font-size':10,'font-weight':'bold'},(laps>=0?'+':'')+laps));}
  return group;
 }
 function offsetFor(key,value){
  const [actor,kind]=key.split('-'),same=[...records.entries()].filter(([,r])=>position(r.value,r.kind)===position(value,kind));
  const bothActors=same.some(([k,r])=>k!==key&&r.kind===kind),bothKinds=same.some(([,r])=>r.kind!==kind);
  return {tangent:bothActors?(actor==='player'?-10:10):0,normal:bothKinds?(kind==='income'?8:-8):0};
 }
 function paint(now){let moving=false;
  for(const [key,record] of records){const node=nodes.get(key);if(!node)continue;const point=sample(record,now),p=pixel(point),o=offsetFor(key,record.value),vertical=['left','right'].includes(point.side),inward=point.side==='left'||point.side==='top'?1:-1;
   const x=p.x+(vertical?o.normal*inward:o.tangent),y=p.y+(vertical?o.tangent:o.normal*inward);
   node.setAttribute('transform',`translate(${x} ${y})`);node.setAttribute('data-track-moving',String(!point.done));moving ||= !point.done;
  }
  if(moving)raf=requestAnimationFrame(paint);else raf=0;
 }
 function render(svg,layout,snapshot,preset='new'){
  const points=window.PITTSBURGH_TRACK_PRESENTATION?.[preset];if(!points||points.length!==100)return;
  if(raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(raf);raf=0;
  const id=`${preset}|${layout.board.width}|${layout.board.height}|${snapshot.seed}`;
  if(id!==identity){records.clear();identity=id;}board=layout.board;track=points;
  const now=typeof performance!=='undefined'?performance.now():Date.now(),animate=typeof requestAnimationFrame==='function'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&document.visibilityState!=='hidden';
  const values={'player-vp':number(snapshot.playerVP),'automa-vp':number(snapshot.vp),'player-income':position(snapshot.playerIncome,'income'),'automa-income':position(snapshot.income,'income')};
  for(const [key,value] of Object.entries(values)){let r=records.get(key);if(!r||r.value!==value||!animate)records.set(key,makeRecord(value,key.split('-')[1],track,r,now,animate));}
  const layer=element('g',{class:'physical-track-marker-layer','pointer-events':'none','aria-label':'승점 및 수입 마커'});layer.style.pointerEvents='none';layer.append(definitions());nodes=new Map();
  for(const [key,r] of records){const [actor,kind]=key.split('-'),node=piece(actor,kind,r.value);nodes.set(key,node);layer.append(node);}
  svg.append(layer);paint(now);
 }
 window.PittsburghTrackMarkers={render,position,pathBetween,sample};
})();
