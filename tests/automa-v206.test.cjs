const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function engine(file='../dist/app.js',ui=false){
 const source=fs.readFileSync(path.join(__dirname,file),'utf8');
 class FixedDate extends Date{static now(){return 123456789}}
 const context=vm.createContext({Date:FixedDate,structuredClone,console,setTimeout,clearTimeout,localStorage:{getItem:()=>null}});
 vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),context);
 if(ui){const next=fs.readFileSync(path.join(__dirname,'../dist/next.js'),'utf8');vm.runInContext('let automaDecisionRunning=false;'+next.slice(next.indexOf('function setAutomaThinking('),next.indexOf('function scheduleAutoma(')),context);vm.runInContext('setAutomaThinking=()=>{};yieldAutomaFrame=async()=>{};save=()=>{};renderProposal=()=>{};alert=message=>{throw Error(message)}',context)}
 return code=>vm.runInContext(code,context);
}
for(const file of ['../dist/app.js','../engine-source.js']){
 test(`${file}: an execution-feasible but cooling plan cannot be held`,()=>{
  const run=engine(file);const r=run(`(()=>{let old=automaPlanCandidates;state.aiPlanning.automa={currentPlanId:'COKE_SALE_ENGINE',stagnantTurns:0,progressValue:100};automaPlanCandidates=()=>[{id:'COKE_SALE_ENGINE',label:'코크스',score:-177,feasible:false,cooling:true,components:{progress:0},execution:{stage:'UNBLOCK',feasible:true,requiredActions:1}},{id:'TYPEWRITER_QUALITY_ENGINE',label:'타자기',score:25,feasible:true,components:{progress:0},execution:{stage:'BUILD',feasible:true,requiredActions:2}}];try{return selectAutomaPlan(false,{builds:[],networks:[],sales:[],developments:[],opts:[]})}finally{automaPlanCandidates=old}})()`);
  assert.equal(r.id,'TYPEWRITER_QUALITY_ENGINE');
 });
 test(`${file}: a skyscraper never receives steel-supply support`,()=>{
  const run=engine(file);const r=run(`(()=>{let c={type:'건설',track:'steel',groupId:'s3',left:0,tile:INDUSTRIES.steel.tiles[3]},p={id:'ERA1_AUTOMOBILE_RUSH',execution:{stage:'UNBLOCK',requiredActions:2,reason:'자동차'}};return {resource:candidateResourceSupport(c),support:candidateSupportRole(c,p),unblock:planUnblockCandidates(p.id,{builds:[c],developments:[],networks:[],opts:[]}).length}})()`);
  assert.equal(r.resource,false);assert.equal(r.support,null);assert.equal(r.unblock,0);
 });
 test(`${file}: hypothetical coal consumption is discounted and never certain`,()=>{
  const run=engine(file);const r=run(`(()=>{state.hand=['석탄','등유','제조 상자'];state.money=50;state.edges[edgeId('피츠버그','클락스버그','rail')]={owner:'automa',tile:'light'};Object.assign(slot('클락스버그',0),{owner:'player',industry:'제철소',groupId:'s1'});return automaCoalInvestment(4,'피츠버그',INDUSTRIES.coal.tiles[3],'c3',1)})()`);
  assert.equal(r.confirmedDemand,0);assert.ok(r.possibleDemand>0);assert.ok(r.allConsumedProbability<1);assert.ok(r.strandedPenalty>0);
 });
 test(`${file}: steel sale does not drain stranded iron or count twice`,()=>{
  const run=engine(file);const r=run(`(()=>{state.hand=['제철소','등유'];state.money=60;state.edges[edgeId('필라델피아','뉴욕','rail')]={owner:'automa',tile:'heavy'};state.markets['필라델피아']['강철']=0;Object.assign(slot('뉴욕',0),{owner:'automa',industry:'제철소',groupId:'s2',resource:8,resources:{철:8},flipped:false});let a=automaSteelInvestment(4,'뉴욕',INDUSTRIES.steel.tiles[1],'s2',2),b=automaSteelInvestment(4,'뉴욕',INDUSTRIES.steel.tiles[1],'s2',99);return {a,b}})()`);
  assert.equal(r.a.byResource.철.left,3);assert.equal(r.a.byResource.강철.left,1);assert.equal(r.a.byResource.강철.immediateSold,2);
  assert.equal(r.a.byResource.철.ownUse,0);assert.equal(r.a.allConsumedProbability,0);assert.equal(r.a.expectedFlipValue,0);assert.equal(r.a.allConsumedProbability,r.b.allConsumedProbability);
 });
 test(`${file}: immediately sold steelworks do not receive another expected flip award`,()=>{
  const run=engine(file);const r=run(`(()=>{state.edges[edgeId('뉴욕','필라델피아','rail')]={owner:'automa',tile:'heavy'};state.edges[edgeId('뉴욕','윌크스-배리','rail')]={owner:'automa',tile:'light'};state.markets['윌크스-배리']['철']=0;state.edges[edgeId('윌크스-배리','버팔로','rail')]={owner:'player',tile:'light'};state.edges[edgeId('버팔로','캐나다','rail')]={owner:'automa',tile:'heavy'};state.edges[edgeId('피츠버그','해리스버그','rail')]={owner:'automa',tile:'light'};state.edges[edgeId('해리스버그','필라델피아','rail')]={owner:'automa',tile:'light'};state.edges[edgeId('피츠버그','클락스버그','rail')]={owner:'automa',tile:'light'};state.markets['클락스버그']['철']=0;state.markets['필라델피아']['강철']=0;state.markets['캐나다']['강철']=0;return automaSteelInvestment(0,'뉴욕',INDUSTRIES.steel.tiles[1],'s2',6)})()`);
  assert.equal(r.remaining,0);assert.equal(r.allConsumedProbability,1);assert.equal(r.expectedFlipValue,0);
 });
 test(`${file}: an unflipped bicycle raises replacement current link value immediately`,()=>{
  const run=engine(file);const r=run(`(()=>{state.era=2;state.round=5;let edge={a:'필라델피아',b:'뉴욕',id:edgeId('필라델피아','뉴욕','rail')};state.edges[edge.id]={owner:'player',tile:'light'};let before=replacementTrainAnalysis({edge,cost:0});Object.assign(slot('뉴욕',1),{owner:'player',industry:'제조 상자',groupId:'m4',flipped:false});let after=replacementTrainAnalysis({edge,cost:0});return {before,after}})()`);
  assert.equal(r.after.currentLinkVP-r.before.currentLinkVP,3);assert.ok(r.after.netValue>r.before.netValue);assert.equal(r.after.payout,2);
 });
 test(`${file}: invalid replacement is rejected before charging resources or moving ownership`,()=>{
  const run=engine(file);run(`state.money=50;globalThis.edge={a:'필라델피아',b:'뉴욕',id:edgeId('필라델피아','뉴욕','rail')};state.edges[edge.id]={owner:'player',tile:'normal',networkId:'train-oil'};globalThis.before=JSON.stringify(state)`);
  assert.throws(()=>run(`executeAutomaNetwork({network:NETWORKS.find(n=>n.id==='train-replace'),edge,sourceCity:'뉴욕'},[])`),/상대 경량열차/);
  assert.equal(run('JSON.stringify(state)===before'),true);
  assert.throws(()=>run(`placeNetworkTile('automa',NETWORKS.find(n=>n.id==='train-replace'),edge)`),/상대 경량열차/);
 });
 test(`${file}: successful replacement logs its target and opponent payout`,()=>{
  const run=engine(file);const r=run(`(()=>{state.money=60;let edge={a:'필라델피아',b:'뉴욕',id:edgeId('필라델피아','뉴욕','rail')};state.edges[edge.id]={owner:'player',tile:'light'};Object.assign(slot('뉴욕',1),{owner:'player',industry:'제조 상자',groupId:'m4',flipped:false});let vp=state.playerVP,detail=[];executeAutomaNetwork({network:NETWORKS.find(n=>n.id==='train-replace'),edge,sourceCity:'뉴욕'},detail);return {detail,owner:state.edges[edge.id].owner,payout:state.playerVP-vp}})()`);
  assert.equal(r.owner,'automa');assert.equal(r.payout,2);assert.match(r.detail.join(' '),/상대 경량열차 제거/);assert.match(r.detail.join(' '),/상대 즉시 \+2VP/);
 });
 test(`${file}: low-value replacement does not automatically qualify as a productive plan route`,()=>{
  const run=engine(file);const r=run(`(()=>{state.era=2;state.round=8;state.actionNo=2;state.routeRewardsClaimed=Object.keys(RAIL_REWARD);let edge={a:'피츠버그',b:'클락스버그',id:edgeId('피츠버그','클락스버그','rail')};state.edges[edge.id]={owner:'player',tile:'light'};let c={type:'네트워크',networkId:'train-replace',network:NETWORKS.find(n=>n.id==='train-replace'),edge,cost:20},signals=candidateStrategicSignals(c,{id:'COKE_SALE_ENGINE'});state.aiActionStats.automa={networks:9,builds:5};return {signals,budget:automaActionBudgetAdjustment({...c,strategicSignals:signals})}})()`);
  assert.ok(!r.signals.networkPurpose.purposes.includes('PLAN_ROUTE'));assert.ok(r.signals.networkPurpose.evidence.some(x=>x.includes('순가치')));assert.equal(r.budget.highLinkValue,false);assert.ok(r.budget.adjustment<0);
 });
}
test('UI and synchronous candidate generation include the same proactive loan above $15',async()=>{
 const run=engine('../dist/app.js',true);run(`state.era=2;state.round=3;state.money=20;state.income=30;state.hand=['이리','석탄','제철소'];state.aiPlanning.automa={currentPlanId:'COKE_SALE_ENGINE'};state.removed['coke:0']='developed';Object.assign(slot('피츠버그',0),{owner:'automa',industry:'석탄',groupId:'c1',flipped:true,resource:0,resources:{}});state.edges[edgeId('서부','피츠버그','rail')]={owner:'automa',tile:'heavy'}`);
 const sync=run('collectAutomaCandidates()'),before=run('JSON.stringify(state)'),ui=await run('collectAutomaCandidatesCooperatively()');
 assert.ok(sync.opts.some(x=>x.type==='대출'));assert.deepEqual(JSON.parse(JSON.stringify(ui)),JSON.parse(JSON.stringify(sync)));assert.equal(run('JSON.stringify(state)'),before);
});
test('actual UI lookahead matches the engine and restores the live state at every yield',async()=>{
 const run=engine('../dist/app.js',true);run(`state.era=2;state.round=8;state.actionNo=1;state.money=60;state.income=30;state.hand=['이리','석탄','제철소','제조 상자'];state.edges[edgeId('피츠버그','클락스버그','rail')]={owner:'automa',tile:'light'};globalThis.set=collectAutomaCandidates();globalThis.plan=selectAutomaPlan(false,set);globalThis.ranked=evaluateAutomaCandidates(set.opts,selectAutomaGoal(plan,set),plan);globalThis.live=state;globalThis.yields=0;yieldAutomaFrame=async()=>{if(state!==live)throw Error('simulation leaked into a UI frame');yields++}`);
 const before=run('JSON.stringify(state)'),sync=run('JSON.stringify(addAutomaLookahead(ranked).map(x=>({key:candidateChoiceKey(x),score:x.score,status:x.searchStatus,pair:x.closingPairDelta})))'),ui=await run(`addAutomaLookaheadCooperatively(ranked).then(rows=>JSON.stringify(rows.map(x=>({key:candidateChoiceKey(x),score:x.score,status:x.searchStatus,pair:x.closingPairDelta}))))`);
 assert.equal(ui,sync);assert.equal(run('JSON.stringify(state)'),before);assert.ok(run('yields')>0);
});
test('actual UI decision uses the committed plan and the same ranked action as the engine',async()=>{
 const run=engine('../dist/app.js',true);run(`state.era=2;state.round=5;state.actionNo=1;state.turnOwner='automa';state.roundStarter='automa';state.hand=['이리','석탄','제철소','제조 상자'];state.money=60;state.income=30;normalizeRoundActions();globalThis.initial=structuredClone(state);decide();globalThis.expected=candidateChoiceKey(state.current);state=structuredClone(initial)`);
 assert.equal(await run('decideAutoma()'),true);assert.equal(run('candidateChoiceKey(state.current)'),run('expected'));assert.ok(run('state.current.audit.includes(AUTOMA_EXECUTOR_VERSION)'));
});
