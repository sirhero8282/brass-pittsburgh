const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function engine(source = '../dist/app.js') {
  const code = readFileSync(join(__dirname, source), 'utf8');
  class FixedDate extends Date { static now() { return 123456789; } }
  const context = vm.createContext({ Date: FixedDate, structuredClone, localStorage: { getItem: () => null }, console, setTimeout, clearTimeout });
  vm.runInContext(code.slice(0, code.indexOf("$('#decideBtn').onclick=")), context);
  return expression => vm.runInContext(expression, context);
}

for (const source of ['../dist/app.js', '../engine-source.js']) {
  test(`${source}: existing connected coal lowers the marginal value of another mine`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.hand=['석탄','등유'];state.money=30;state.edges[edgeId('피츠버그','클락스버그','rail')]={owner:'automa',tile:'light',networkId:'light-train'};let tile=INDUSTRIES.coal.tiles[1],before=automaCoalInvestment(4,'클락스버그',tile,'c2',0);Object.assign(slot('피츠버그',0),{owner:'automa',industry:'석탄',groupId:'c1',flipped:false,resources:{석탄:3},resource:3});let after=automaCoalInvestment(4,'클락스버그',tile,'c2',0);return {before,after}})()`);
    assert.ok(result.before.ownUse > 0);
    assert.equal(result.after.ownUse, 0);
    assert.equal(result.after.sharedSupply, 3);
    assert.ok(result.after.adjustment < result.before.adjustment);
    assert.equal(result.after.allConsumedProbability, 0);
  });

  test(`${source}: last-action stock has no recovery value and does not suppress the Polyphase finisher`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.era=2;state.round=8;state.actionNo=2;state.hand=['석탄'];let stock=automaCoalInvestment(5,'윌크스-배리',INDUSTRIES.coal.tiles[3],'c3',0);return {stock,poly:candidatePlanGuidance({type:'건설',track:'coal',groupId:'c4',left:0},{id:'COAL_TO_POLYPHASE',execution:{stage:'BUILD',requiredActions:1,reason:'발전기'}})}})()`);
    assert.equal(result.stock.ownDemand, 0);
    assert.equal(result.stock.expectedFlipValue, 0);
    assert.equal(result.stock.actionsToFlip, null);
    assert.ok(result.stock.strandedPenalty > 0);
    assert.equal(result.poly.role, 'REQUIRED');
  });

  test(`${source}: stock size alone cannot earn strategic-build plan credit`, () => {
    const run = engine(source);
    const result = run(`candidatePlanGuidance({type:'건설',track:'coal',groupId:'c2',left:4,coalInvestment:{ownUse:0,allConsumedProbability:0}},{id:'WEST_CRATE_5STAR',execution:{stage:'BUILD',requiredActions:2,reason:'제조 I'}})`);
    assert.equal(result.strategicBuild, false);
    assert.equal(result.stageMatch, false);
    assert.equal(result.role, 'DISTRACTION');
    assert.ok(result.hardAdjustment < 0);
  });

  test(`${source}: market changes and premature heavy trains are not plan milestones`, () => {
    const run = engine(source);
    const result = run(`(()=>{let coke={id:'COKE_SALE_ENGINE',execution:{stage:'UNBLOCK'},components:{progress:5}},loco=()=>({id:'LOCOMOTIVE_HEAVY_RAIL_ENGINE',execution:{stage:'UNBLOCK'},components:{progress:5+heavyTrainsBuilt('automa')*1.5}}),c1=automaPlanProgress(coke),l1=automaPlanProgress(loco());state.markets['캐나다']['코크스']=0;state.edges[edgeId('서부','피츠버그','rail')]={owner:'automa',tile:'heavy',networkId:'train-double'};return {c1,c2:automaPlanProgress(coke),l1,l2:automaPlanProgress(loco())}})()`);
    assert.equal(result.c1.signature, result.c2.signature);
    assert.equal(result.l1.signature, result.l2.signature);
  });

  test(`${source}: instant-sale economic support is not a required coke unlock step`, () => {
    const run = engine(source);
    assert.equal(run(`planUnblockCandidates('COKE_SALE_ENGINE',{builds:[{type:'건설',track:'coal',left:0}],developments:[],networks:[],opts:[]}).length`), 0);
  });

  test(`${source}: spending on an unrelated mine carries the next-build capital opportunity cost`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.hand=['제조 상자','석탄'];state.money=20;let plan={id:'WEST_CRATE_5STAR'},mine=candidatePlanCapital({type:'건설',track:'coal',groupId:'c1',cost:12,left:3},plan),target=candidatePlanCapital({type:'건설',track:'manufacturing',groupId:'m1',cost:12,left:0},plan);return {mine,target}})()`);
    assert.equal(result.mine.requiredCash, 12);
    assert.equal(result.mine.extraGap, 4);
    assert.ok(result.mine.adjustment < 0);
    assert.equal(result.target.adjustment, 0);
  });

  test(`${source}: a verified loan-funded build keeps a cash-blocked plan feasible without mutating state`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.era=1;state.round=2;state.hand=['이리','제조 상자','석탄'];state.money=8;state.setup.merchant['서부']='제조 상자 · 최초 +6VP';state.edges[edgeId('서부','피츠버그','rail')]={owner:'automa',tile:'heavy',networkId:'train-steel'};state.edges[edgeId('트랜턴 유전','피츠버그','pipe')]={owner:'automa',tile:'pipe3k'};state.oilfields['트랜턴 유전']=3;let set=collectAutomaCandidates(),before=JSON.stringify(state),execution=automaPlanExecution('WEST_CRATE_5STAR',automaPlanFeatures(),set);return {execution,unchanged:before===JSON.stringify(state),hasUnaffordableBuild:set.builds.some(x=>candidateGroupId(x)==='m1')}})()`);
    assert.equal(result.hasUnaffordableBuild, false);
    assert.equal(result.execution.feasible, true);
    assert.equal(result.execution.stage, 'UNBLOCK');
    assert.equal(result.execution.fundingBridge.cost, 12);
    assert.equal(result.unchanged, true);
  });

  test(`${source}: current-era plans cannot borrow next-era actions`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.era=1;state.round=8;state.actionNo=2;return {whole:remainingAutomaActions(),era:planDeadlineActions('SEWING_TWO_ERA'),execution:automaPlanExecution('SEWING_TWO_ERA',automaPlanFeatures(),{builds:[],sales:[],developments:[],networks:[],opts:[]})}})()`);
    assert.equal(result.whole, 17);
    assert.equal(result.era, 1);
    assert.equal(result.execution.feasible, false);
    assert.equal(result.execution.actionsRemaining, 1);
  });

  test(`${source}: coke reward uses connected market capacity, not all global empty spaces`, () => {
    const run = engine(source);
    const result = run(`(()=>{let candidate={type:'건설',track:'coke',city:'피츠버그',tile:INDUSTRIES.coke.tiles[1]},before=candidateRewardOpportunity(candidate);state.edges[edgeId('서부','피츠버그','rail')]={owner:'automa',tile:'heavy'};state.markets['서부']['코크스']=0;return {before,after:candidateRewardOpportunity(candidate)}})()`);
    assert.equal(result.before.immediateVP, 0);
    assert.equal(result.after.immediateVP, 8);
    assert.ok(result.after.adjustment > result.before.adjustment);
  });

  test(`${source}: loan feasibility consumes its card before checking the subsequent build`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.hand=['제조 상자'];state.money=8;let set=collectAutomaCandidates(),before=JSON.stringify(state);return {bridge:planLoanBridge('WEST_CRATE_5STAR',set),unchanged:before===JSON.stringify(state)}})()`);
    assert.equal(result.bridge, null);
    assert.equal(result.unchanged, true);
  });

  test(`${source}: four unrelated support actions force a stalled coke plan to reconsider`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.era=2;state.round=2;state.hand=['이리','석탄','제조 상자','제철소'];state.money=80;state.income=30;state.removed['coke:0']='developed';Object.assign(slot('피츠버그',0),{owner:'automa',industry:'석탄',groupId:'c1',flipped:true,resources:{},resource:0});state.edges[edgeId('서부','피츠버그','rail')]={owner:'automa',tile:'heavy'};state.markets['서부']['코크스']=0;let set=collectAutomaCandidates(),plan=automaPlanCandidates(set).find(x=>x.id==='COKE_SALE_ENGINE'),progress=automaPlanProgress(plan);state.aiPlanning.automa={currentPlanId:plan.id,progressValue:progress.materialValue,progressSignature:progress.signature,stagnantTurns:3};state.aiActionStats.automa={planSupportPlanId:plan.id,planSupportDebt:4};return selectAutomaPlan(true,set)})()`);
    assert.equal(result.transitionKind, 'STALLED');
    assert.notEqual(result.id, 'COKE_SALE_ENGINE');
  });

  test(`${source}: immediate resource sale proceeds remain available for the next required build`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.money=20;state.edges[edgeId('뉴욕','윌크스-배리','rail')]={owner:'automa',tile:'light'};state.markets['윌크스-배리']['석탄']=0;return candidateProjectedMoney({type:'건설',track:'coal',city:'윌크스-배리',tile:INDUSTRIES.coal.tiles[0],cost:5,left:1})})()`);
    assert.equal(result, 19);
  });

  test(`${source}: generated coal candidates carry their overbuild penalty into final ranking`, () => {
    const run = engine(source);
    const result = run(`(()=>{state.hand=['이리','석탄','제조 상자','제철소'];state.money=40;Object.assign(slot('피츠버그',0),{owner:'automa',industry:'석탄',groupId:'c1',flipped:false,resource:3,resources:{석탄:3}});state.removed['coal:0']='built';state.edges[edgeId('피츠버그','클락스버그','rail')]={owner:'automa',tile:'light'};let set=collectAutomaCandidates(),plan=selectAutomaPlan(false,set),ranked=evaluateAutomaCandidates(set.opts,selectAutomaGoal(plan),plan),mine=ranked.find(x=>x.track==='coal'&&x.city==='클락스버그');return {mine,positive:ranked.some(x=>x.type!=='건설'||x.track!=='coal')}})()`);
    assert.ok(result.mine);
    assert.equal(result.mine.coalInvestment.ownUse, 0);
    assert.ok(result.mine.coalOverbuildPenalty < 0);
    assert.notEqual(result.mine.planRole, 'STRATEGIC_BUILD');
    assert.ok(result.positive);
    assert.match(result.mine.reason, /석탄 잔존·공급 과잉/);
  });
}
