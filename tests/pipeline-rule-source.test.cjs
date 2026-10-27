const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {outputs,sync}=require('../scripts/sync-pipeline-rules.cjs');
const layout=JSON.parse(fs.readFileSync(__dirname+'/../dist/assets/data/pittsburgh-2p-layout.json','utf8'));
const nodes=new Map(layout.catalog.map(item=>[item.id,item.name]));
const rules=layout.catalog.filter(item=>item.id.includes('_pipeline_'));
test('generated engine and browser layout rules cannot drift from the canonical layout JSON',()=>sync(true));
test('canonical rules reject missing values, duplicate routes and conflicting documentation',()=>{
 for(const mutate of [copy=>{delete copy.catalog.find(i=>i.oilOnBuild!==undefined).oilOnBuild},copy=>{copy.catalog.push(copy.catalog.find(i=>i.oilOnBuild!==undefined))},copy=>{copy.catalog.find(i=>i.oilOnBuild!==undefined).oilOnBuild=99}]){
  const copy=structuredClone(layout);mutate(copy);assert.throws(()=>outputs(copy));
 }
});
function game(file){const ctx=vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null,setItem:()=>{}}});const src=fs.readFileSync(__dirname+'/../'+file,'utf8');vm.runInContext(src.slice(0,src.indexOf("$('#decideBtn').onclick=")),ctx);return code=>vm.runInContext(code,ctx);}
for(const file of ['dist/app.js','engine-source.js']){
 test(`${file}: every canonical route pays its exact oil count for either endpoint order, actor and pipeline`,()=>{
  const run=game(file);assert.equal(run('PIPE.length'),rules.length);
  for(const rule of rules)for(const reverse of [false,true])for(const actor of ['player','automa'])for(const id of ['start-income','reserve','pipe3k','pipe3s','pipe5','pipe10']){
   const endpoints=[nodes.get(rule.fromId),nodes.get(rule.toId)];if(reverse)endpoints.reverse();
   run(`state=fresh();var [a,b]=${JSON.stringify(endpoints)},e={a,b,id:edgeId(a,b,'pipe')},field=[a,b].find(isOilField);placeNetworkTile('${actor}',NETWORKS.find(n=>n.id==='${id}'),e)`);
   assert.equal(run('pipelineOilBonus(a,b)'),rule.oilOnBuild,rule.id);
   assert.equal(run('oilFieldStock(field)'),rule.oilOnBuild+(id==='reserve'?1:0),`${rule.id}/${actor}/${id}/${reverse}`);
  }
 });
 test(`${file}: reserve replacement does not pay any route oil twice or repeat opening rewards`,()=>{
  const run=game(file);
  for(const rule of rules)for(const actor of ['player','automa'])for(const id of ['start-income','pipe3k','pipe3s','pipe5','pipe10']){
   run(`state=fresh();var [a,b]=${JSON.stringify([nodes.get(rule.fromId),nodes.get(rule.toId)])},e={a,b,id:edgeId(a,b,'pipe')},field=[a,b].find(isOilField);placeNetworkTile('${actor}',NETWORKS.find(n=>n.id==='reserve'),e);var claimed=JSON.stringify(state.oilRewardsClaimed);placeNetworkTile('${actor}',NETWORKS.find(n=>n.id==='${id}'),e)`);
   assert.equal(run('oilFieldStock(field)'),rule.oilOnBuild+1);
   assert.equal(run('JSON.stringify(state.oilRewardsClaimed)===claimed'),true);
   assert.equal(run(`state.${actor==='player'?'playerNetworkBuilt':'networkBuilt'}.includes('reserve')`),false);
  }
 });
 test(`${file}: manual map placement uses the same canonical oil rules`,()=>{
  const run=game(file);
  for(const rule of rules)for(const reserve of [false,true]){
   run(`state=fresh();mapEditMode=true;save=()=>{};prompt=()=> '${reserve?'10':'2'}';var [a,b]=${JSON.stringify([nodes.get(rule.fromId),nodes.get(rule.toId)])},field=[a,b].find(isOilField);editEdge(edgeId(a,b,'pipe'))`);
   assert.equal(run('oilFieldStock(field)'),rule.oilOnBuild+(reserve?1:0));
  }
 });
 test(`${file}: Pittsburgh–Venango transport supplies oil and unknown routes fail explicitly`,()=>{
  const run=game(file);
  run(`state=fresh();var e={a:'피츠버그',b:'베낭고 유전',id:edgeId('피츠버그','베낭고 유전','pipe')};placeNetworkTile('player',NETWORKS.find(n=>n.id==='start-income'),e);var plan=actorPlan(['판매',0,{오일:1}],'피츠버그','player',false)`);
  assert.equal(run('oilFieldStock(e.b)'),1);assert.equal(run('plan.shortage.length'),0);
  run("sourcePlan('오일',1,'피츠버그','player')");assert.equal(run('oilFieldStock(e.b)'),0);
  assert.throws(()=>run("pipelineOilBonus('피츠버그','보스턴')"),/규칙이 없는/);
 });
}
