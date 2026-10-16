const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function game(file){
 const ctx=vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null,setItem:()=>{}}});
 const source=fs.readFileSync(__dirname+'/../'+file,'utf8');
 vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),ctx);
 const run=code=>vm.runInContext(code,ctx);
 run(`state=fresh();state.gameMode='full';state.era=2;state.round=8;state.actionNo=2;state.turnOwner='player';state.roundActions={player:1,automa:2};state.roundActionsEra=2;state.roundActionsRound=8;state.playerMoney=100;save=()=>{};alert=message=>{throw Error(message)};confirmAction=async()=>true;`);
 return run;
}
for(const file of ['dist/app.js','engine-source.js']){
 test(`${file}: recorded light railway remains $7 until Cleveland is actually connected`,()=>{
  const run=game(file);
  run(`state.round=6;state.markets['클리브랜드'].석탄=2;state.markets['클락스버그'].석탄=0;state.markets['윌크스-배리'].석탄=0;for(const [a,b] of [['캐나다','버팔로'],['피츠버그','클락스버그'],['서부','피츠버그'],['클락스버그','볼티모어'],['볼티모어','필라델피아'],['디트로이트','캐나다'],['필라델피아','뉴욕'],['뉴욕','보스턴'],['서부','털리도'],['털리도','디트로이트']])state.edges[edgeId(a,b,'rail')]={owner:'player',tile:'normal'};var e={a:'윌크스-배리',b:'버팔로',id:edgeId('윌크스-배리','버팔로','rail')},tile=['경량 열차',0,{석탄:1}],before=JSON.stringify(state),plan=bestEdgePlan(tile,e,'player',true);`);
  assert.equal(run('plan.total'),7);
  assert.equal(run('plan.sources[0].kind'),'vanderbilt');
  assert.equal(run("bestEdgePlan(tile,e,'player',false)"),null);
  assert.equal(run('JSON.stringify(state)===before'),true);
  run("state.edges[edgeId('클리브랜드','피츠버그','rail')]={owner:'player',tile:'normal'}");
  assert.equal(run("bestEdgePlan(tile,e,'player',false).total"),4);
 });
 test(`${file}: locomotive grants and completes three free developments before final action settlement`,async()=>{
  const run=game(file);
  run(`state.playerHand=['피츠버그'];state.playerRemoved['manufacturing:6']='developed';state.playerRemoved['manufacturing:7']='developed';Object.assign(slot('피츠버그',3),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:true});Object.assign(slot('피츠버그',0),{owner:'automa',industry:'코크스 공장',groupId:'o1',resource:1,resources:{코크스:1}});var choices=0;pick=async(label,items)=>{if(state.gameOver||state.pendingPlayerTurn)throw Error('행동 종료 후 보상 실행');choices++;return items[0]};var choice=buildOptions('피츠버그').normal.find(x=>x.g.id==='m7');`);
  assert.ok(run('choice'));
  await run("executePlayerBuild(choice,'피츠버그')");
  assert.equal(run('choices'),3);
  assert.equal(run('state.freeDevelop.player'),0);
  assert.equal(run("Object.values(state.playerRemoved).filter(x=>x==='developed').length"),5);
  assert.equal(run('state.playerDiscard.length'),1);
  assert.equal(run('state.pendingPlayerTurn'),true);
  assert.equal(run('!!state.gameOver'),false);
  run('confirmPlayerTurn()');
  assert.equal(run('!!state.gameOver'),true);
 });
 test(`${file}: canceled free developments remain usable without another card or action`,async()=>{
  const run=game(file);
  run(`state.playerHand=['피츠버그'];state.playerRemoved['manufacturing:6']='developed';state.playerRemoved['manufacturing:7']='developed';Object.assign(slot('피츠버그',3),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:true});Object.assign(slot('피츠버그',0),{owner:'automa',industry:'코크스 공장',groupId:'o1',resource:1,resources:{코크스:1}});pick=async()=>null;var choice=buildOptions('피츠버그').normal.find(x=>x.g.id==='m7');`);
  await run("executePlayerBuild(choice,'피츠버그')");
  assert.equal(run('state.freeDevelop.player'),3);
  run("state.pendingPlayerTurn=false;state.round=7;state.roundActions.player=0;setPlayerActionBusy=busy=>{playerActionPending=busy};pick=async(label,items)=>items[0]");
  await run('usePlayerFreeDevelop()');
  assert.equal(run('state.freeDevelop.player'),0);
  assert.equal(run('state.playerDiscard.length'),1);
  assert.equal(run('state.roundActions.player'),0);
 });
 for(const gid of ['s3','s5'])test(`${file}: ${gid} builds then sells connected goods using oil before the final round settles`,async()=>{
  const run=game(file);
  run(`state.playerHand=['클리브랜드'];for(let i=0;i<${gid==='s3'?3:5};i++)state.playerRemoved['steel:'+i]='developed';Object.assign(slot('피츠버그',2),{owner:'automa',industry:'제철소',groupId:'s2',resource:2,resources:{강철:2}});Object.assign(slot('피츠버그',3),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:false});for(const [a,b] of [['피츠버그','클리브랜드'],['클리브랜드','이리'],['이리','버팔로'],['버팔로','캐나다']])state.edges[edgeId(a,b,'rail')]={owner:'player',tile:'normal'};state.edges[edgeId('피츠버그','트랜턴 유전','pipe')]={owner:'automa',tile:'normal'};state.oilfields['트랜턴 유전']=1;state.setup.merchant.캐나다='제조 상자 · 최초 +6VP';state.setup.quality={};var salePrompts=0;pick=async(label,items)=>{if(state.gameOver||state.pendingPlayerTurn)throw Error('정산 후 판매');salePrompts++;return items[0]};var choice=buildOptions('클리브랜드').normal.find(x=>x.g.id==='${gid}');`);
  assert.ok(run('choice'));
  await run("executePlayerBuild(choice,'클리브랜드')");
  assert.equal(run("state.cities['피츠버그'][3].flipped"),true);
  assert.equal(run("state.oilfields['트랜턴 유전']"),0);
  assert.equal(run('state.playerDiscard.length'),1);
  assert.equal(run('!!state.gameOver'),false);
  assert.ok(run('salePrompts')>=3);
  run('confirmPlayerTurn()');
  assert.equal(run('!!state.gameOver'),true);
 });
 test(`${file}: unavailable skyscraper sale gives a reason and completes only the build`,async()=>{
  const run=game(file);
  run(`var promptTitle='',reason='';pick=async(label,items,show,hint)=>{promptTitle=label;reason=hint;return items[0]};`);
  const detail=await run("playerSell(null,{free:true})");
  assert.match(detail,/판매 전 산업/);
  assert.match(run('promptTitle'),/판매 대상 없음/);
  assert.match(run('reason'),/판매 전 산업/);
  assert.equal(run('state.playerDiscard.length'),0);
 });
 for(const actor of ['player','automa'])test(`${file}: ${actor} rail combines steel at both endpoints without Vanderbilt`,()=>{
  const run=game(file);
  run(`var actor='${actor}',e={a:'피츠버그',b:'해리스버그',id:edgeId('피츠버그','해리스버그','rail')};Object.assign(slot(e.a,2),{owner:'player',industry:'제철소',groupId:'s2',resource:1,resources:{강철:1}});Object.assign(slot(e.b,0),{owner:'automa',industry:'제철소',groupId:'s2',resource:1,resources:{강철:1}});var n=NETWORKS.find(x=>x.id==='start-whiskey'),pseudo=[n.name,0,{강철:2}],before=JSON.stringify(state),plan=bestEdgePlan(pseudo,e,actor,false);`);
  assert.ok(run('plan'));
  assert.equal(run('plan.total'),0);
  assert.equal(run('plan.sources.length'),2);
  assert.equal(run('JSON.stringify(state)===before'),true,'preview must restore resources and the temporary edge');
  const beforeMoney=run(actor==='player'?'state.playerMoney':'state.money');
  run(actor==='player'?"applyPlayerNetworkStep({n,e:{...e,sourceCity:plan.sourceCity},pseudo})":"executeAutomaNetwork({network:n,edge:e,sourceCity:plan.sourceCity},[])");
  assert.equal(run(actor==='player'?'state.playerMoney':'state.money'),beforeMoney);
  assert.equal(run('state.edges[e.id].owner'),actor);
  assert.equal(run('state.cities[e.a][2].resources.강철'),0);
  assert.equal(run('state.cities[e.b][0].resources.강철'),0);
 });
 test(`${file}: network supply does not connect a pipeline as if it were a railway and restores on failure`,()=>{
  const run=game(file);
  run(`var e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};Object.assign(slot(e.b,2),{owner:'player',industry:'제철소',resource:1,resources:{철:1}})`);
  assert.equal(run("withNetworkSupply(e,'player',()=>connectedFrom(e.a).has(e.b))"),false);
  run("e={a:'피츠버그',b:'해리스버그',id:edgeId('피츠버그','해리스버그','rail')}");
  assert.throws(()=>run("withNetworkSupply(e,'player',()=>{throw Error('test')})"),/test/);
  assert.equal(run('Object.hasOwn(state.edges,e.id)'),false);
 });
 test(`${file}: VP is primary, tied VP uses track position even within the same income level`,()=>{
  const run=game(file);
  run('state.playerVP=138;state.vp=138;state.playerIncome=28;state.income=36;finishGame()');
  assert.equal(run('state.gameOver.winner'),'automa');
  assert.match(run('state.logs[0].detail'),/동점 수입 트랙 비교/);
  run("state.playerVP=10;state.vp=10;state.playerIncome=16;state.income=17;refreshGameResult()");
  assert.equal(run('state.gameOver.winner'),'automa');
  run("state.playerIncome=18;refreshGameResult()");
  assert.equal(run('state.gameOver.winner'),'player');
  run("state.playerVP=11;state.playerIncome=0;refreshGameResult()");
  assert.equal(run('state.gameOver.winner'),'player');
  run("state.playerVP=10;state.playerIncome=17;refreshGameResult()");
  assert.equal(run('state.gameOver.winner'),'tie');
 });
 test(`${file}: refreshing a legacy tied result preserves scores and does not score twice`,()=>{
  const run=game(file);
  run(`state.playerVP=138;state.vp=138;state.playerIncome=28;state.income=36;state.gameOver={winner:'tie',playerVP:138,automaVP:138,scores:{saved:true}};state.logs=[{title:'게임 종료',detail:'공동 승리'}];refreshGameResult();refreshGameResult()`);
  assert.equal(run('state.gameOver.winner'),'automa');
  assert.equal(run('state.gameOver.scores.saved'),true);
  assert.equal(run('state.vp'),138);
  assert.equal(run('state.playerVP'),138);
  assert.match(run('state.logs[0].detail'),/오토마 승리/);
 });
}
