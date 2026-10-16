const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function game(file){
 const ctx=vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null,setItem:()=>{}}});
 const source=fs.readFileSync(__dirname+'/../'+file,'utf8');
 vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),ctx);
 return code=>vm.runInContext(code,ctx);
}

for(const file of ['dist/app.js','engine-source.js']){
 for(const actor of ['player','automa'])for(const owner of ['player','automa']){
  test(`${file}: ${actor} replaces ${owner} reserve, returns tile, pays iron once, preserves oil`,()=>{
   const run=game(file);
   run(`state=fresh();state.era=2;state.playerMoney=100;state.money=100;state.hand=['등유'];var actor='${actor}',owner='${owner}',e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};state.edges[e.id]={owner,tile:'reserve',networkId:'reserve'};state[owner==='player'?'playerNetworkBuilt':'networkBuilt']=['reserve'];state.oilfields[e.a]=3;Object.assign(slot(e.b,2),{owner:actor,industry:'제철소',groupId:'s1',resource:2,resources:{철:2},flipped:false});var n=NETWORKS.find(x=>x.id==='start-income');`);
   const count=actor==='player'?"playerNetworkRoutes(n,100).normal.filter(x=>x.id===e.id).length":"automaNetworkCandidates().filter(x=>x.networkId===n.id&&x.edge.id===e.id).length";
   assert.equal(run(count),1);
   run(actor==='player'?"var choice=playerNetworkRoutes(n,100).normal.find(x=>x.id===e.id);applyPlayerNetworkStep({n,e:choice,pseudo:['송유관',0,{철:1}]})":"executeAutomaNetwork({network:n,edge:e,sourceCity:e.b},[])");
   assert.equal(run('state.edges[e.id].owner'),actor);
   assert.equal(run('state.edges[e.id].tile'),'normal');
   assert.equal(run('oilFieldStock(e.a)'),3);
   assert.equal(run('state.cities[e.b][2].resources.철'),1);
   assert.equal(run("state[owner==='player'?'playerNetworkBuilt':'networkBuilt'].includes('reserve')"),false);
   assert.equal(run("state[actor==='player'?'playerNetworkBuilt':'networkBuilt'].includes('start-income')"),true);
   assert.ok(run(owner==='player'?"playerNetworkInventory().some(x=>x.id==='reserve')":"!state.networkBuilt.includes('reserve')"));
  });
 }
 test(`${file}: all transport pipeline types can replace reserve and preserve stock`,()=>{
  for(const id of ['start-income','pipe3k','pipe3s','pipe5','pipe10']){
   const run=game(file);
   run(`state=fresh();var e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};state.edges[e.id]={owner:'player',tile:'reserve'};state.playerNetworkBuilt=['reserve'];state.oilfields[e.a]=7;placeNetworkTile('automa',NETWORKS.find(x=>x.id==='${id}'),e)`);
   assert.equal(run('oilFieldStock(e.a)'),7,id);
   assert.equal(run('state.playerNetworkBuilt.includes("reserve")'),false,id);
  }
 });
 test(`${file}: manual map replacement returns reserve to its previous owner without adding oil`,()=>{
  for(const owner of ['player','automa']){
   const run=game(file);
   run(`state=fresh();mapEditMode=true;var e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};state.edges[e.id]={owner:'${owner}',tile:'reserve'};state['${owner}'==='player'?'playerNetworkBuilt':'networkBuilt']=['reserve'];state.oilfields[e.a]=4;prompt=()=> '6';save=()=>{};editEdge(e.id)`);
   assert.equal(run('oilFieldStock(e.a)'),4);
   assert.equal(run('state.edges[e.id].tile'),'pipe5');
   assert.equal(run("state['"+owner+"'==='player'?'playerNetworkBuilt':'networkBuilt'].includes('reserve')"),false);
  }
 });
 test(`${file}: active pipelines and reserve-to-reserve replacement remain blocked without charging resources`,()=>{
  const run=game(file);
  run(`state=fresh();state.playerMoney=100;state.money=100;var e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};var n=NETWORKS.find(x=>x.id==='pipe5');state.edges[e.id]={owner:'player',tile:'pipe3'};var before=JSON.stringify(state)`);
  assert.equal(run("networkRouteAvailable(n,e,'player')"),false);
  assert.throws(()=>run("executeAutomaNetwork({network:n,edge:e,sourceCity:e.b},[])"),/송유관 상태/);
  assert.equal(run('JSON.stringify(state)===before'),true);
  assert.throws(()=>run("applyPlayerNetworkStep({n,e,pseudo:['송유관',0,{철:1}]})"),/송유관 상태/);
  assert.equal(run('JSON.stringify(state)===before'),true);
  run("state.edges[e.id]={owner:'player',tile:'reserve'}");
  assert.equal(run("networkRouteAvailable(NETWORKS.find(x=>x.id==='reserve'),e,'player')"),false);
 });
 test(`${file}: first reserve placement adds oil, replacement preserves oil-city stock and reward`,()=>{
  const run=game(file);
  run(`state=fresh();state.era=2;var e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};var reserve=NETWORKS.find(x=>x.id==='reserve');state.oilCities[e.a]={owner:'player',resource:3,resources:{오일:3},flipped:false};placeNetworkTile('player',reserve,e)`);
  assert.equal(run('oilFieldStock(e.a)'),5,'base oil 1 plus reserve bonus 1 only on new route');
  const money=run('state.playerMoney'),vp=run('state.playerVP');
  run("placeNetworkTile('automa',NETWORKS.find(x=>x.id==='pipe5'),e)");
  assert.equal(run('oilFieldStock(e.a)'),5);
  assert.equal(run('state.oilCities[e.a].flipped'),false);
  assert.equal(run('state.playerMoney'),money);
  assert.equal(run('state.playerVP'),vp);
  assert.equal(run('state.playerNetworkBuilt.includes("reserve")'),false);
 });
 test(`${file}: returned reserve can be built on another route`,()=>{
  const run=game(file);
  run(`state=fresh();var e={a:'트랜턴 유전',b:'피츠버그',id:edgeId('트랜턴 유전','피츠버그','pipe')};var reserve=NETWORKS.find(x=>x.id==='reserve');placeNetworkTile('player',reserve,e);placeNetworkTile('player',NETWORKS.find(x=>x.id==='start-income'),e);var next={a:'베낭고 유전',b:'피츠버그',id:edgeId('베낭고 유전','피츠버그','pipe')};placeNetworkTile('player',reserve,next)`);
  assert.equal(run('state.edges[next.id].tile'),'reserve');
  assert.equal(run('state.playerNetworkBuilt.filter(x=>x==="reserve").length'),1);
  assert.equal(run('oilFieldStock(e.a)'),2);
  assert.equal(run('oilFieldStock(next.a)'),2);
 });
}
