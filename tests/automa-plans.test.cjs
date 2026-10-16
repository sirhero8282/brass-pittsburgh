const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
function engine() {
  const code = readFileSync(join(__dirname, '../dist/app.js'), 'utf8');
  class FixedDate extends Date { static now() { return 123456789; } }
  const context = vm.createContext({ Date: FixedDate, structuredClone, localStorage: { getItem: () => null }, console, setTimeout, clearTimeout });
  vm.runInContext(code.slice(0, code.indexOf("$('#decideBtn').onclick=")), context);
  return expression => vm.runInContext(expression, context);
}

test('plan layer selects the five-star route for whichever merchant has the manufacturing market', () => {
  const run = engine();
  run("state.setup.merchant['서부']='등유 · 최초 수입 +2칸';state.setup.merchant['캐나다']='제조 상자 · 최초 +6VP';state.setup.merchant['보스턴']='자동차 · 최초 +9VP';state.setup.quality['5★']='$15 / +8VP';state.qualityClaimed.automa=[]");
  const result = JSON.parse(run("JSON.stringify(selectAutomaPlan())"));
  assert.equal(result.id, 'WEST_CRATE_5STAR');
  assert.equal(result.candidates.length, 9);
  assert.ok(result.candidates.every(x => Number.isFinite(x.score) && x.components));
  assert.deepEqual(result.milestones, ['열린 제조 상인: 캐나다', '판매 가능한 제조 I', '위스키', '5★ 품질 보상 또는 기본 판매']);
  assert.match(result.execution.reason, /캐나다의 열린 제조 상인/);
});

test('five-star manufacturing plan is unavailable when no merchant sells manufacturing crates', () => {
  const run = engine();
  run("state.setup.merchant['서부']='등유 · 최초 수입 +2칸';state.setup.merchant['캐나다']='자동차 · 최초 +9VP';state.setup.merchant['보스턴']='등유 · 최초 수입 +2칸';state.setup.quality['5★']='$15 / +8VP';state.qualityClaimed.automa=[]");
  const plan = JSON.parse(run("JSON.stringify(automaPlanCandidates().find(x=>x.id==='WEST_CRATE_5STAR'))"));
  assert.equal(plan.feasible, false);
  assert.deepEqual(plan.milestones[0], '열린 제조 상인: 없음');
});

test('committed plan is reproducible state and uses hysteresis before switching', () => {
  const run = engine();
  run("state.setup.merchant['서부']='제조 상자 · 최초 +6VP';state.aiPolicy=normalizeAiPolicy({planSwitchThreshold:20});selectAutomaPlan(true)");
  const first = run('state.aiPlanning.automa.currentPlanId');
  run("state.setup.merchant['서부']='등유 · 최초 수입 +2칸'");
  const result = JSON.parse(run('JSON.stringify(selectAutomaPlan(true))'));
  assert.equal(first, 'WEST_CRATE_5STAR');
  assert.ok(result.id);
  assert.ok(run('state.aiPlanHistory.automa.length') >= 1);
  assert.equal(run('state.aiPlanning.automa.lastEvaluatedTurn'), run('state.turn'));
});

test('candidate score exposes an independent plan contribution controlled by policy', () => {
  const run = engine();
  run("state.setup.merchant['서부']='제조 상자 · 최초 +6VP';state.aiPolicy=normalizeAiPolicy({planWeight:.5});globalThis.candidate={type:'건설',track:'manufacturing',index:0,tile:['전구 제조 I',6,{},0,5],score:10,cost:6,left:0,reason:'테스트'}");
  const scored = JSON.parse(run("JSON.stringify(scoreAutomaStrategy(candidate,{id:'HIGH_LEVEL_INDUSTRY',label:'고레벨',score:1},selectAutomaPlan()))"));
  assert.equal(scored.plan, 'WEST_CRATE_5STAR');
  assert.equal(scored.rawPlanBonus, 12);
  assert.equal(scored.planBonus, 6);
  assert.match(scored.reason, /장기 플랜/);
});

test('coke demand reacts to the opponent steel footprint', () => {
  const run = engine();
  const before = run("automaPlanCandidates().find(x=>x.id==='COKE_SALE_ENGINE').score");
  run("Object.assign(slot('피츠버그',0),{owner:'player',industry:'제철소',groupId:'s1',flipped:false});Object.assign(slot('클리브랜드',0),{owner:'player',industry:'제철소',groupId:'s2',flipped:false})");
  const after = run("automaPlanCandidates().find(x=>x.id==='COKE_SALE_ENGINE').score");
  assert.ok(after > before, `expected coke plan to rise with steel demand: ${before} -> ${after}`);
});

test('quality reward claimed by either side is unavailable to the Automa', () => {
  const run = engine();
  run("state.qualityClaimed.player=['5★'];state.qualityClaimed.automa=[]");
  assert.equal(run("qualityClaimedByAnyone('5★')"), true);
  assert.equal(run('automaPlanFeatures().quality5'), false);
  assert.equal(run('automaSaleQuality(5).key'), '');
});

test('manufacturing plan salvages level-one crates after the five-star reward is lost', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify(automaWestQualityPlan({
    own:[{groupId:'m1',flipped:false},{groupId:'m1',flipped:false}],
    quality5:false,quality6:false,whiskey:0,actions:2,manufacturingMarketOpen:true
  },{sales:[{type:'판매',qualityKey:null,sales:[{groupId:'m1'}]}],builds:[],developments:[]}))`));
  assert.equal(result.outcome, 'SALVAGE');
  assert.equal(result.stage, 'CONVERT');
});

test('manufacturing sale unblock recognizes a useful oil pipeline and rejects an unrelated rail', () => {
  const run = engine();
  run("state.setup.merchant['서부']='제조 상자 · 최초 +6VP';Object.assign(slot('피츠버그',0),{owner:'automa',industry:'제조 상자',groupId:'m1',flipped:false})");
  assert.equal(run("candidateAdvancesPlanSale({type:'네트워크',networkId:'pipe3k',edge:{a:'트랜턴 유전',b:'피츠버그',id:'pipe:트랜턴 유전|피츠버그'}},'WEST_CRATE_5STAR')"), true);
  assert.equal(run("candidateAdvancesPlanSale({type:'네트워크',networkId:'light-train',edge:{a:'뉴욕',b:'보스턴',id:'rail:뉴욕|보스턴'}},'WEST_CRATE_5STAR')"), false);
});

test('network purpose distinguishes an existing industry sale route', () => {
  const run = engine();
  run("state.setup.merchant['서부']='제조 상자 · 최초 +6VP';Object.assign(slot('피츠버그',0),{owner:'automa',industry:'제조 상자',groupId:'m1',flipped:false});state.hand=['석탄','제조 상자'];globalThis.route={type:'네트워크',networkId:'light-train',network:NETWORKS.find(n=>n.id==='light-train'),title:'경량열차',edge:{a:'서부',b:'피츠버그',id:'rail:서부|피츠버그'},sourceCity:'피츠버그',cardUse:{index:0,card:'석탄'}}");
  const signals = JSON.parse(run("JSON.stringify(candidateStrategicSignals(route,{id:'WEST_CRATE_5STAR'}))"));
  assert.equal(signals.networkPurpose.primary, 'EXISTING_SALE_ROUTE');
  assert.ok(signals.salePath.improvement > 0 || signals.preparedSales > 0);
});

test('an unrelated rail does not claim credit for an already-ready sale', () => {
  const run = engine();
  run("state.setup.merchant['서부']='제조 상자 · 최초 +6VP';Object.assign(slot('피츠버그',0),{owner:'automa',industry:'제조 상자',groupId:'m1',flipped:false});state.edges[edgeId('서부','피츠버그','rail')]={owner:'automa',tile:'normal',networkId:'light-train'};globalThis.route={type:'네트워크',networkId:'light-train',network:NETWORKS.find(n=>n.id==='light-train'),title:'경량열차',edge:{a:'뉴욕',b:'보스턴',id:'rail:뉴욕|보스턴'},sourceCity:'뉴욕',cardUse:{index:0,card:'뉴욕'}}");
  const signals = JSON.parse(run("JSON.stringify(candidateStrategicSignals(route,{id:'WEST_CRATE_5STAR'}))"));
  assert.equal(signals.readySalesBefore, 1);
  assert.equal(signals.readySalesAfter, 1);
  assert.equal(signals.preparedSales, 0);
  assert.equal(signals.salePath.improvement, 0);
  assert.notEqual(signals.networkPurpose.primary, 'EXISTING_SALE_ROUTE');
});

test('network purpose recognizes a legal next-action coke market sale', () => {
  const run = engine();
  run("state.era=2;state.round=2;state.money=100;state.income=40;state.hand=['등유','석탄'];state.removed['coke:0']='developed';Object.assign(slot('피츠버그',0),{owner:'automa',industry:'석탄',groupId:'c1',flipped:true,resources:{},resource:0});Object.assign(slot('피츠버그',2),{owner:'automa',industry:'석탄',groupId:'c2',flipped:false,resources:{'석탄':4},resource:4});globalThis.route={type:'네트워크',networkId:'light-train',network:NETWORKS.find(n=>n.id==='light-train'),title:'경량열차',edge:{a:'서부',b:'피츠버그',id:'rail:서부|피츠버그'},sourceCity:'피츠버그',cardUse:{index:0,card:'등유'}}");
  const signals = JSON.parse(run("JSON.stringify(candidateStrategicSignals(route,{id:'COKE_SALE_ENGINE'}))"));
  assert.equal(signals.networkPurpose.primary, 'COKE_MARKET_ROUTE', JSON.stringify(signals.cokeMarketRoute));
  assert.ok(signals.cokeMarketRoute.improvementUnits > 0);
  assert.ok(signals.cokeMarketRoute.vp >= 4);
  assert.match(signals.cokeMarketRoute.reason, /코크스/);
});

test('coke is a supporting subplan while unsafe bicycle placement is rejected', () => {
  const run = engine();
  const coke = JSON.parse(run("JSON.stringify(candidateSupportRole({type:'건설',track:'coke',left:2,sellable:1},{id:'TYPEWRITER_QUALITY_ENGINE',execution:{requiredActions:0}}))"));
  const bicycle = JSON.parse(run("JSON.stringify(candidateSupportRole({type:'건설',track:'manufacturing',groupId:'m4',bicycle:{unsafe:true,reason:'상대 링크 이익 과다'}},{id:'LOCOMOTIVE_HEAVY_RAIL_ENGINE'}))"));
  assert.equal(coke.role, 'SUPPORT_REQUIRED');
  assert.ok(coke.adjustment > 0);
  assert.equal(bicycle.role, 'DISTRACTION');
  assert.ok(bicycle.hardAdjustment <= -200);
});

test('v12 keeps multi-sale value nonnegative and treats a sewing bundle as West-plan support', () => {
  const run = engine();
  assert.equal(run('normalizeAiPolicy({multiSaleBias:-9}).multiSaleBias'), 0);
  const support = JSON.parse(run("JSON.stringify(candidateSupportRole({type:'건설',track:'manufacturing',groupId:'m2',saleBundle:{feasible:true,actionSaving:1}},{id:'WEST_CRATE_5STAR',execution:{requiredActions:1}}))"));
  assert.equal(support.role, 'SUPPORT_REQUIRED');
  assert.ok(support.adjustment > 0);
  assert.ok(support.hardAdjustment > 0);
});

test('v12 pays a flipped sewing machine immediately and evaluates future bicycle rails in any city', () => {
  const run = engine();
  run("state.era=2;state.income=32;Object.assign(slot('뉴욕',1),{owner:'automa',industry:'제조 상자',groupId:'m2',flipped:true});state.edges['rail:뉴욕|필라델피아']={owner:'automa',networkId:'train-steel'};state.removed['coal:3']='built';state.removed['coal:4']='built'");
  const preserved = JSON.parse(run("JSON.stringify(replacementIndustryAnalysis('뉴욕',1))"));
  const newYork = JSON.parse(run("JSON.stringify(bicyclePlacementAnalysis({city:'뉴욕',slot:1,replaces:true,replacement:replacementIndustryAnalysis('뉴욕',1)}))"));
  const boston = JSON.parse(run("JSON.stringify(bicyclePlacementAnalysis({city:'보스턴',slot:0,replaces:false}))"));
  assert.equal(preserved.groupId, 'm2');
  assert.equal(preserved.immediateAward, 11);
  assert.equal(preserved.value, 11 + preserved.incomeGrowth);
  assert.equal(preserved.replacementLoss, preserved.incomeGrowth);
  assert.ok(preserved.replacementLoss <= 3);
  assert.equal(newYork.preservation.immediateAward, 11);
  assert.equal(newYork.replacementLoss, preserved.incomeGrowth);
  assert.ok(boston.futureRoutes > 0);
  assert.equal(boston.futureMultiplier, 2);
  assert.equal(boston.preservation.value, 0);
});

test('upgrade requires a flipped lower tile and records its immediate VP once', () => {
  const run = engine();
  run("state.era=2;state.income=32;Object.assign(slot('뉴욕',1),{owner:'automa',industry:'제조 상자',groupId:'m2',level:2,flipped:false,industryScoreAwarded:false})");
  assert.equal(run("buildLocations('automa','manufacturing','제조 상자(자전거) IV','뉴욕').some(x=>x.i===1&&x.replaces)"), false);
  assert.equal(run("upgradeIndustryPoints(slot('뉴욕',1),'automa')"), 0);
  run("slot('뉴욕',1).flipped=true");
  assert.equal(run("buildLocations('automa','manufacturing','제조 상자(자전거) IV','뉴욕').some(x=>x.i===1&&x.replaces)"), true);
  const before = run('state.vp');
  assert.equal(run("awardCoveredIndustry(slot('뉴욕',1),'automa',[])"), 11);
  run("state.cities['뉴욕'][1]=emptySlot();scoreIndustryForEra()");
  assert.equal(run('state.vp') - before, 11);
  assert.equal(run('state.eraScores[2].industry.automa'), 11);
  assert.equal(run('state.eraScores[2].sewing.automa'), 11);
});

test('coke can replace flipped coal I-III but never a polyphase alternator', () => {
  const run = engine();
  run("state.era=2;Object.assign(slot('윌크스-배리',0),{owner:'automa',industry:'탄광',groupId:'c4',level:4,flipped:true});Object.assign(slot('윌크스-배리',1),{owner:'automa',industry:'탄광',groupId:'c3',level:3,flipped:true})");
  const locations = JSON.parse(run("JSON.stringify(buildLocations('automa','coke','코크스 II-A','윌크스-배리'))"));
  assert.equal(locations.some(x => x.i === 0), false, 'polyphase must not be a legal coke replacement');
  assert.equal(locations.some(x => x.i === 1 && x.replaces), true, 'flipped coal III remains replaceable');
});

test('generated development template requires the exact target groups', () => {
  const run = engine();
  assert.equal(run("generatedTokenMatchesDecision('DEVELOP:k2+m1',{type:'개발',targets:[{groupId:'k2'},{groupId:'m1'}]})"), true);
  assert.equal(run("generatedTokenMatchesDecision('DEVELOP:k2+m1',{type:'개발',targets:[{groupId:'m1'}]})"), false);
  assert.equal(run("generatedTokenMatchesDecision('DEVELOP:k2+m1',{type:'개발',targets:[{groupId:'k2'},{groupId:'m2'}]})"), false);
});

test('locomotive unblock only accepts development on its shortest unlock path', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify((()=>{state.era=2;state.round=2;let path=locomotivePlanEstimate().path,exact={type:'개발',targets:[{groupId:path,track:'manufacturing'}]},unrelated={type:'개발',targets:[{groupId:'m1',track:'manufacturing'}]},coal={type:'건설',track:'coal',groupId:'c2'};let rows=planUnblockCandidates('LOCOMOTIVE_HEAVY_RAIL_ENGINE',{developments:[exact,unrelated],builds:[coal],opts:[exact,unrelated,coal],networks:[]});return {path,exact:rows.includes(exact),unrelated:rows.includes(unrelated),coal:rows.includes(coal)}})())`));
  assert.equal(result.exact, true);
  assert.equal(result.unrelated, false);
  assert.equal(result.coal, false);
});

test('a speculative resource pile does not receive strategic-build or required-stage priority', () => {
  const run = engine();
  const guidance = JSON.parse(run("JSON.stringify(candidatePlanGuidance({type:'건설',track:'coal',groupId:'c2',left:3},{id:'WEST_CRATE_5STAR',execution:{stage:'BUILD',requiredActions:2,reason:'제조 I 필요'}}))"));
  assert.equal(guidance.strategicBuild, false);
  assert.equal(guidance.stageMatch, false);
  assert.ok(guidance.hardAdjustment < 0);
});

test('opponent sale burst threat exposes ready count, stars and reward value', () => {
  const run = engine();
  run("state.playerWhiskey=1;state.setup.merchant['서부']='제조 상자 · 최초 +6VP';state.setup.quality['5★']='+9VP';state.edges['rail:서부|피츠버그']={owner:'player',tile:'normal'};state.edges['pipe:트랜턴 유전|피츠버그']={owner:'player',tile:'pipe3k'};state.oilfields['트랜턴 유전']=3;Object.assign(slot('피츠버그',0),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:false});Object.assign(slot('피츠버그',1),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:false})");
  const threat = JSON.parse(run('JSON.stringify(opponentSaleBurstThreat())'));
  assert.equal(threat.readyCount, 2);
  assert.equal(threat.stars, 8);
  assert.ok(threat.firstBonusValue >= 6);
  assert.ok(threat.qualityValue >= 9);
});

test('a flipped level-two-plus industry can score again in era two if it remains', () => {
  const run = engine();
  run("state.era=1;Object.assign(slot('뉴욕',1),{owner:'automa',industry:'제조 상자',groupId:'m4',level:4,flipped:true,industryScoreAwarded:false})");
  const points = run("Number(industryTileForSlot(slot('뉴욕',1))[4])");
  run('endEraOne()');
  assert.equal(run("slot('뉴욕',1).industryScoreAwarded"), false);
  run('state.era=2;scoreIndustryForEra()');
  assert.equal(run('state.vp'), points * 2);
});

test('v32 locomotive progress ignores cash and unrelated rail growth', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify((()=>{const plan=automaPlanCandidates().find(x=>x.id==='LOCOMOTIVE_HEAVY_RAIL_ENGINE'),before=automaPlanProgress(plan);state.money+=30;state.edges['rail:뉴욕|필라델피아']={owner:'automa',networkId:'light-train',tile:'light'};const after=automaPlanProgress(plan);return {before,after}})())`));
  assert.equal(result.after.signature, result.before.signature);
});

test('v32 blocks unrelated network actions while the locomotive factory is locked', () => {
  const run = engine();
  const guidance = JSON.parse(run(`JSON.stringify((()=>{state.era=2;state.round=2;const candidate=automaNetworkCandidates().find(x=>x.networkId==='light-train');const plan={id:'LOCOMOTIVE_HEAVY_RAIL_ENGINE',execution:{stage:'UNLOCK',requiredActions:3,reason:'기관차 해금 시험'}};return candidatePlanGuidance(candidate,plan)})())`));
  assert.equal(guidance.blockedLocomotiveNetwork, true);
  assert.equal(guidance.role, 'DISTRACTION');
  assert.ok(guidance.hardAdjustment <= -220);
});

test('v32 converts late surplus cash instead of spending the action on a light train', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify((()=>{state.era=2;state.round=7;state.actionNo=1;state.money=60;return {network:automaOutcomeAdjustment({type:'네트워크',networkId:'light-train'}),build:automaOutcomeAdjustment({type:'건설',track:'steel',index:1,tile:['제철소 II',0,{},0,8]})}})())`));
  assert.ok(result.network.adjustment < 0);
  assert.ok(result.build.adjustment > 0);
  assert.ok(result.network.reasons.some(x => x.includes('현금 미전환')));
});

test('v198 final action budget preserves sale routes and demotes only unproductive network debt', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify((()=>{state.era=2;state.round=6;state.aiActionStats.automa={networks:9,builds:6,sales:2};const idle={type:'네트워크',networkId:'light-train',strategicSignals:{salePath:{improvement:0},preparedSales:0,cokeMarketRoute:{improvementUnits:0},projectedEndLinkVP:5,opponentLinkBenefit:1,currentLinkVP:3}},route={...idle,strategicSignals:{...idle.strategicSignals,salePath:{improvement:1}}},build={type:'건설',track:'steel',prospectiveSale:{feasible:true},strategicSignals:{}};return {idle:automaActionBudgetAdjustment(idle),route:automaActionBudgetAdjustment(route),build:automaActionBudgetAdjustment(build)}})())`));
  assert.ok(result.idle.adjustment < 0);
  assert.equal(result.route.adjustment, 0);
  assert.equal(result.build.adjustment, 0);
  assert.match(result.idle.reasons.join(' '), /행동 예산/);
});

test('v198 reserves two actions of runway before era-one crate expiry', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify((()=>{state.era=1;return {crate:saleConversionAtRisk({groupId:'m1',deadline:6,actionsToSale:4}),ordinary:saleConversionAtRisk({groupId:'k2',deadline:6,actionsToSale:4}),impossible:saleConversionAtRisk({groupId:'m1',deadline:6,actionsToSale:Infinity})}})())`));
  assert.equal(result.crate, true);
  assert.equal(result.ordinary, false);
  assert.equal(result.impossible, false);
});
