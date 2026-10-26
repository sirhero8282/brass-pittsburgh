const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../dist/four-player/core.js');require('../dist/four-player/engine.js');require('../dist/four-player/flow.js');
const data=require('../dist/four-player/data.json'),F=FourPlayer,source=fs.readFileSync(path.join(__dirname,'../dist/four-player/ui-table.js'),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Execute the actual presentation functions without bootstrapping a browser,
// starting an Automa, or accessing either mode's persisted game.
function declaration(name){
 let start=source.indexOf('function '+name+'(');assert.notEqual(start,-1,name);if(source.slice(Math.max(0,start-6),start)==='async ')start-=6;
 const lines=source.slice(start).split(/\r?\n/);if(lines[0].endsWith('}'))return lines[0];
 const end=lines.findIndex((line,i)=>i>0&&line==='}');assert.ok(end>0,name);return lines.slice(0,end+1).join('\n');
}
function element(width=0){const classes=new Set(),properties={},attributes={};return {
 innerHTML:'',textContent:'',hidden:false,disabled:false,dataset:{},clientWidth:width,clientHeight:620,properties,attributes,
 classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,on)=>{if(on??!classes.has(n)){classes.add(n);return true}classes.delete(n);return false}},
 style:{setProperty:(key,value)=>properties[key]=value},
 setAttribute:(key,value)=>attributes[key]=value,removeAttribute:key=>delete attributes[key],
 getBoundingClientRect:()=>({width,height:38}),append(node){node.parent=this},insertBefore(node){node.parent=this}
}}
function harness(names){const nodes=new Map(),lists=new Map(),frames=[];let wide=true;
 const get=selector=>{if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector)};
 const body=element(),game=F.createGame(data,undefined,77);game.order=[0,1,2,3];
 const context=vm.createContext({F,data,esc,core:createFourCore(),board:{colors:{blue:'#1585ff',red:'#f22',yellow:'#fc3',purple:'#a4c'}},
  $:get,$$:selector=>lists.get(selector)||[],document:{body},matchMedia:()=>({matches:wide}),window:{innerWidth:1600},
  getComputedStyle:()=>({columnGap:'8px'}),requestAnimationFrame:fn=>(frames.push(fn),frames.length),layoutFrame:0,
  localStorage:{getItem(){throw Error('Presentation must not read saves')},setItem(){throw Error('Presentation must not write saves')}},
  session:new FourFlow(F,data,game),busy:false,cardFilter:'all',syncCards(){},
  H:{availability:()=>({건설:'',네트워크:'',판매:'',개발:'',대출:'',패스:''}),run:()=>{throw Error('Unexpected human execution')}},
  availabilityRevision:-1,availabilitySession:null,availabilityCache:new Map(),humanTask:null,humanEpoch:0,selectionRequest:0,
  chooser:null,mapChoice:null,provisional:null,proposal:null,targetSelectMode:'map',currentView:'gameView',
  render(){},persist(){context.persistCount++},persistCount:0,focusPanel(){},message(){},console,
  actionIcons:{건설:'build',네트워크:'network',판매:'sale',개발:'develop',대출:'loan',패스:'pass'}
 });
 vm.runInContext([...new Set(['humanCanSelect','humanAvailability',...names])].map(declaration).join('\n'),context);
 return {context,game:context.session.game,get,lists,body,setWide:value=>wide=value,flush:()=>{while(frames.length)frames.shift()()}};
}
function buttons(html){return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m=>({attributes:m[1],body:m[2]}))}

test('four-participant status uses the displayed preview values but the committed turn owner, without mutating either state',()=>{
 const h=harness(['renderStatus']),committed=h.game;committed.order=[2,0,3,1];committed.cursor=1;
 committed.players.forEach((p,i)=>{p.money=30+i;p.vp=7*i;p.spent=i});
 const preview=structuredClone(committed);preview.players[0].money=19;preview.players[0].spent=11;preview.cursor=3;
 const before=JSON.stringify([committed,preview]);h.context.renderStatus(preview,committed,true);
 const rows=[...h.get('#players').innerHTML.matchAll(/<tr class="([^"]*)">([\s\S]*?)<\/tr>/g)];
 assert.equal(rows.length,4);assert.deepEqual(rows.map(row=>row[1]),['','current','','']);
 assert.match(rows[0][2],/1\. 오토마 2/);assert.match(rows[1][2],/2\. 나/);assert.match(rows[2][2],/3\. 오토마 3/);assert.match(rows[3][2],/4\. 오토마 1/);
 assert.match(rows[1][2],/확정 대기/);assert.match(rows[1][2],/<td>\$19<\/td><td>\$11<\/td>/);
 assert.equal((h.get('#iconStatus').innerHTML.match(/<article /g)||[]).length,4);
 assert.equal((h.get('#turnQueue').innerHTML.match(/aria-current="step"/g)||[]).length,1);
 assert.equal(JSON.stringify([committed,preview]),before);
});

test('finished games do not advertise a current participant or enable human cards and actions',()=>{
 const h=harness(['renderStatus','isIndustry','renderHand','renderActions']);h.game.gameOver={winners:[0],rank:[0,1,2,3]};
 h.context.session.cardIndex=0;h.context.session.type='건설';h.context.renderStatus(h.game,h.game,false);h.context.renderHand(h.game);h.context.renderActions();
 assert.ok(!h.get('#players').innerHTML.includes('class="current"'));assert.ok(!h.get('#turnQueue').innerHTML.includes('aria-current'));
 assert.ok(!h.body.classList.contains('next-player-turn'));
 assert.ok(buttons(h.get('#nextHand').innerHTML).every(b=>/\bdisabled\b/.test(b.attributes)));
 const actions=buttons(h.get('#actions').innerHTML);assert.equal(actions.length,6);assert.ok(actions.every(b=>/\bdisabled\b/.test(b.attributes)));
});

test('compact card labels preserve physical indices for duplicate cards and filtered hands',()=>{
 const h=harness(['isIndustry','renderHand']);h.game.players[0].hand=['피츠버그','석탄','뉴욕','피츠버그','제철소'];
 h.context.cardFilter='city';h.context.session.cardIndex=3;
 const filters=['all','city','industry'].map(filter=>Object.assign(element(),{dataset:{filter}}));h.lists.set('[data-filter]',filters);
 const before=JSON.stringify(h.game);h.context.renderHand(h.game);const cards=buttons(h.get('#nextHand').innerHTML);
 assert.deepEqual(cards.map(b=>Number(b.attributes.match(/data-card="(\d+)"/)[1])),[0,1,2,3,4]);
 assert.deepEqual(cards.map((b,i)=>!(/\bhidden\b/.test(b.attributes))?i:null).filter(i=>i!==null),[0,2,3]);
 assert.deepEqual(cards.map((b,i)=>b.attributes.includes('aria-pressed="true"')?i:null).filter(i=>i!==null),[3]);
 assert.match(cards[3].body,/<span class="card-label">피츠버그<\/span>/);assert.match(cards[1].body,/<span class="card-kind">산업<\/span>/);
 assert.equal(h.get('#nextHandTitle').textContent,'내 손패 · 5장');assert.equal(filters[1].attributes['aria-pressed'],'true');
 assert.equal(JSON.stringify(h.game),before);
});

test('action selection and pending execution expose a single current step and the original selected card',()=>{
 const h=harness(['renderActions']),steps=['card','action','detail'].map(step=>Object.assign(element(),{dataset:{step}}));h.lists.set('.player-flow [data-step]',steps);
 h.game.players[0].hand=['석탄','피츠버그','이리'];h.context.session.cardIndex=2;h.context.session.type='건설';h.context.humanTask={};
 h.context.H.availability=()=>({건설:'',네트워크:'불가',판매:'불가',개발:'불가',대출:'불가',패스:''});
 h.context.renderActions();assert.equal(h.get('#nextSelection').textContent,'이리 · 건설');assert.equal(steps[2].attributes['aria-current'],'step');
 assert.equal(steps.filter(s=>s.classList.contains('active')).length,1);
 const actions=buttons(h.get('#actions').innerHTML);assert.equal(actions.filter(b=>!(/\bdisabled\b/.test(b.attributes))).length,2);
 h.context.session.pending={};h.context.renderActions();assert.equal(h.get('#nextSelection').textContent,'실행 결과 확인 중');
 assert.ok(buttons(h.get('#actions').innerHTML).every(b=>/\bdisabled\b/.test(b.attributes)));
});

test('desktop and phone layout move the existing menu and resize presentation without touching saved gameplay',()=>{
 const h=harness(['syncLayoutMeasurements','scheduleLayout','configureLayout']);
 h.get('#gameView').classList.add('active');h.get('.four-workspace').clientWidth=1580;h.get('.four-workspace').clientHeight=900;
 h.get('.available-column').getBoundingClientRect=()=>({width:158});h.get('#playerPanel').getBoundingClientRect=()=>({width:750});
 h.get('.map-note').getBoundingClientRect=()=>({height:18});h.get('#mapSelectionBar').hidden=true;
 const before=JSON.stringify(h.game);h.context.configureLayout();h.flush();
 assert.equal(h.get('nav').parent,h.get('header'));assert.ok(h.body.classList.contains('wide-layout-draft'));
 assert.ok(h.get('#playerPanel').classList.contains('draft-controls-split'));assert.equal(h.body.properties['--draft-map'],'834px');
 h.get('#mapSelectionBar').hidden=false;h.context.configureLayout();h.flush();assert.equal(h.body.properties['--draft-map'],'796px');
 h.setWide(false);h.context.configureLayout();h.flush();assert.equal(h.get('nav').parent,h.body);
 assert.ok(!h.body.classList.contains('wide-layout-draft'));assert.ok(!h.get('#playerPanel').classList.contains('draft-controls-split'));
 assert.equal(JSON.stringify(h.game),before);
});

test('action-first selection filters usable cards while preserving duplicate physical indices',()=>{
 const h=harness(['isIndustry','renderHand','renderActions']);h.game.players[0].hand=['피츠버그','석탄','피츠버그'];h.context.session.type='건설';
 h.context.H.availability=(_g,index)=>({건설:index===1?'이 카드로 건설할 수 없음':'',네트워크:'불가',판매:'불가',개발:'불가',대출:'',패스:''});
 h.context.renderHand(h.game);const cards=buttons(h.get('#nextHand').innerHTML);
 assert.deepEqual(cards.map(b=>Number(b.attributes.match(/data-card="(\d+)"/)[1])),[0,1,2]);
 assert.deepEqual(cards.map(b=>/\bdisabled\b/.test(b.attributes)),[false,true,false]);
 h.context.renderActions();assert.match(h.get('#nextActionHint').textContent,/건설에 사용할 카드/);
 assert.ok(!buttons(h.get('#actions').innerHTML).find(b=>b.attributes.includes('data-action="건설"')).attributes.includes('disabled'));
});

const humanFunctions=['settleChoice','pickHuman','mapHuman','cancelHuman','cancelHumanAction','chooseHumanCard','chooseHumanAction','runHumanAction'];
const tick=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
function resultFor(game,index,type='패스'){
 const action=F.humanList(game,index).find(a=>a.type===type);assert.ok(action,type);return {action,game:F.perform(game,data,action)};
}

test('changing cards during an awaited choice cancels the old operation and rejects its late result',async()=>{
 const h=harness(humanFunctions);h.game.players[0].hand=['피츠버그','석탄','이리'];h.context.session.cardIndex=0;
 const before=JSON.stringify(h.game),result=resultFor(h.game,0);let sawCancelled=false;
 h.context.H.run=async(_game,_data,_type,_index,ui,cancelled)=>{await ui.pick('추가 선택',['대상']);sawCancelled=cancelled();return result};
 const old=h.context.chooseHumanAction('건설');await tick();assert.ok(h.context.chooser);
 await h.context.chooseHumanCard(1);await old;
 assert.equal(sawCancelled,true);assert.equal(h.context.session.cardIndex,1);assert.equal(h.context.session.type,null);
 assert.equal(h.context.session.pending,null);assert.equal(h.context.persistCount,0);assert.equal(h.context.humanTask,null);
 assert.equal(JSON.stringify(h.game),before);
});

test('standalone loan and pass stage their result directly without an extra confirmation chooser',async()=>{
 for(const type of ['대출','패스']){
  const h=harness(humanFunctions);h.game.players[0].hand=['피츠버그','석탄','이리'];h.context.session.cardIndex=1;
  const before=JSON.stringify(h.game),result=resultFor(h.game,1,type);let calls=0;
  h.context.H.run=async(game,_data,action,index)=>{calls++;assert.equal(game,h.game);assert.equal(action,type);assert.equal(index,1);return result};
  await h.context.chooseHumanAction(type);
  assert.equal(calls,1);assert.equal(h.context.chooser,null);assert.equal(h.context.mapChoice,null);
  assert.equal(h.context.persistCount,1);assert.ok(h.context.session.pending?.prepared);
  assert.equal(h.context.session.pending.action.type,type);assert.equal(JSON.stringify(h.game),before);
  assert.equal(F.active(h.context.session.game),0);
 }
});

test('construction selects a map slot before an inline tile choice and matches only that exact slot',async()=>{
 const h=harness([...humanFunctions,'matchesMapItem']);h.game.players[0].hand=['피츠버그','석탄','이리'];h.context.session.cardIndex=0;
 const location=data.locations.find(l=>l.name==='피츠버그'),other=data.locations.find(l=>l.name!=='피츠버그'&&l.slots.length),
  slot=`slot.3-4.${location.id.split('.').at(-1)}.1`,wrongSlot=`slot.3-4.${location.id.split('.').at(-1)}.2`,wrongCity=`slot.3-4.${other.id.split('.').at(-1)}.1`;
 const choices=[{city:'피츠버그',i:0,g:{id:'m1',name:'제조 상자 I'}},{city:'피츠버그',i:0,g:{id:'k2',name:'등유 II'}}];
 let mapTarget,chosenTile;
 h.context.H.run=async(_game,_data,_type,_index,ui)=>{mapTarget=await ui.map('build',choices,[],'건설 가능한 곳을 지도에서 선택하세요.');if(!mapTarget)return null;chosenTile=await ui.pick('건설할 산업 타일',choices,x=>x.g.name);return null};
 const operation=h.context.chooseHumanAction('건설');await tick();
 assert.equal(h.context.chooser,null);assert.equal(h.context.mapChoice.type,'build');assert.equal(h.context.session.group,null);
 assert.equal(h.context.matchesMapItem(choices[0],'slot',slot),true);assert.equal(h.context.matchesMapItem(choices[0],'slot',wrongSlot),false);
 assert.equal(h.context.matchesMapItem(choices[1],'slot',wrongCity),false);assert.equal(h.context.matchesMapItem(choices[0],'route',slot),false);
 h.context.settleChoice(choices[0]);await tick();assert.equal(h.context.mapChoice,null);assert.equal(h.context.chooser.label,'건설할 산업 타일');
 h.context.settleChoice(choices[1]);await operation;assert.equal(mapTarget.i,0);assert.equal(chosenTile.g.id,'k2');
 assert.equal(h.context.session.pending,null);assert.equal(h.context.persistCount,0);
});

test('a card change immediately followed by a new action spends the new physical card after the old choice settles',async()=>{
 const h=harness(humanFunctions);h.game.players[0].hand=['피츠버그','석탄','이리'];h.context.session.cardIndex=1;
 const before=JSON.stringify(h.game),network=resultFor(h.game,1,'네트워크'),loan=resultFor(h.game,2,'대출'),calls=[];
 let releaseOld;const oldGate=new Promise(resolve=>releaseOld=resolve);
 h.context.H.run=async(_game,_data,type,index,ui,cancelled)=>{
  calls.push({type,index});
  if(type==='네트워크'){ui.preview(network.game);await ui.pick('연속 네트워크 건설',['행동 종료']);await oldGate;assert.equal(cancelled(),true);return network}
  assert.equal(type,'대출');assert.equal(index,2);return loan;
 };
 const old=h.context.chooseHumanAction('네트워크');await tick();assert.ok(h.context.chooser);
 const cardChange=h.context.chooseHumanCard(2),newAction=h.context.chooseHumanAction('대출');
 assert.equal(h.context.session.cardIndex,2);assert.equal(h.context.session.pending,null);
 releaseOld();await Promise.all([old,cardChange,newAction]);
 assert.deepEqual(calls,[{type:'네트워크',index:1},{type:'대출',index:2}]);
 assert.equal(h.context.persistCount,1);assert.equal(h.context.humanTask,null);assert.equal(h.context.provisional,null);
 const pending=h.context.session.pending;assert.ok(pending?.prepared);assert.equal(pending.action.type,'대출');
 assert.equal(pending.action.cardUse.index,2);assert.equal(pending.action.cardUse.card,'이리');
 assert.deepEqual(pending.after.players[0].hand,loan.game.players[0].hand);
 assert.equal(pending.after.players[0].discard.at(-1),'이리');assert.equal(pending.after.players[0].money,60);
 assert.equal(pending.after.players[0].spent,0);assert.equal(JSON.stringify(h.game),before);
});

test('explicit cancellation discards provisional network costs and leaves no staged result or selection',async()=>{
 const h=harness(humanFunctions);h.game.players[0].hand=['피츠버그','석탄','이리'];h.context.session.cardIndex=1;
 const before=JSON.stringify(h.game);let cancelledChoice=false;
 h.context.H.run=async(game,_data,_type,_index,ui,cancelled)=>{
  const preview=structuredClone(game);preview.players[0].money-=12;preview.players[0].spent+=12;ui.preview(preview);
  const choice=await ui.pick('연속 네트워크 건설',['행동 종료','$10 지불하고 두 번째 건설']);
  cancelledChoice=choice===null&&cancelled();return null;
 };
 const operation=h.context.chooseHumanAction('네트워크');await tick();
 assert.equal(h.context.provisional.players[0].money,18);assert.equal(h.game.players[0].money,30);
 await h.context.cancelHumanAction();await operation;
 assert.equal(cancelledChoice,true);assert.equal(h.context.session.pending,null);assert.equal(h.context.persistCount,0);
 assert.equal(h.context.session.cardIndex,null);assert.equal(h.context.session.type,null);assert.equal(h.context.provisional,null);
 assert.equal(h.context.chooser,null);assert.equal(h.context.mapChoice,null);assert.equal(h.context.humanTask,null);
 assert.equal(JSON.stringify(h.game),before);
});
