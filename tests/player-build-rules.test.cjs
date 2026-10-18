const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function game(file='dist/app.js') {
  const context = vm.createContext({
    structuredClone,
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
  });
  const app = fs.readFileSync(__dirname + '/../'+file, 'utf8');
  vm.runInContext(app.slice(0, app.indexOf("$('#decideBtn').onclick=")), context);
  return expression => vm.runInContext(expression, context);
}

test('player chooses between equivalent connected construction resource sources', async () => {
  const run = game();
  run("state=fresh();let a=slot('피츠버그',0),b=slot('피츠버그',2);Object.assign(a,{owner:'player',industry:'석탄',resource:1,resources:{석탄:1}});Object.assign(b,{owner:'automa',industry:'석탄',resource:1,resources:{석탄:1}});pick=async(_label,items)=>items[1]");
  const plan = await run("choosePlayerBuildPlan(['검증',0,{석탄:1}],'피츠버그',false)");
  assert.equal(plan.sources[0].index, 2);
  assert.equal(run("state.cities['피츠버그'][0].resource"), 1, 'preview must not consume the first source');
  assert.equal(run("state.cities['피츠버그'][2].resource"), 1, 'preview must not consume the chosen source');
  run(`chargePlayerSources(['검증',0,{석탄:1}],'피츠버그',false,${JSON.stringify(plan.sources)})`);
  assert.equal(run("state.cities['피츠버그'][0].resource"), 1);
  assert.equal(run("state.cities['피츠버그'][2].resource"), 0);
});

for(const file of ['dist/app.js','engine-source.js']){
  for(const city of ['피츠버그','클락스버그'])test(`${file}: ${city} uses dedicated coal before shared coal/steel for either actor`,()=>{
    const run=game(file),shared=city==='피츠버그'?2:1;
    run("state=fresh();state.playerMoney=100;state.money=100");
    for(const actor of ['player','automa']){
      assert.equal(run(`buildLocations('${actor}','coal','탄광 I','${city}').map(x=>x.i).join(',')`),'0');
      assert.equal(run(`buildLocations('${actor}','steel','제철소 I','${city}').map(x=>x.i).join(',')`),String(shared));
    }
    run(`Object.assign(slot('${city}',0),{owner:'automa',industry:'석탄'})`);
    assert.equal(run(`buildLocations('player','coal','탄광 I','${city}').map(x=>x.i).join(',')`),String(shared));
    run(`state.era=2`);
    assert.equal(run(`buildLocations('automa','coal','탄광 I','${city}').map(x=>x.i).join(',')`),String(shared));
  });
  test(`${file}: Pittsburgh location card offers both slots but never coal in shared slot while dedicated is empty`,()=>{
    const run=game(file);
    run("state=fresh();state.playerMoney=100;var options=buildOptions('피츠버그');var choices=[...options.normal,...options.vander].filter(x=>x.city==='피츠버그')");
    assert.ok(run("choices.some(x=>x.track==='coal'&&x.i===0)"));
    assert.ok(run("choices.some(x=>x.track==='steel'&&x.i===2)"));
    assert.equal(run("choices.some(x=>x.track==='coal'&&x.i===2)"),false);
    run("var before=JSON.stringify(state);legalEmptySlots('클락스버그','coal')");
    assert.equal(run('JSON.stringify(state)'),run('before'),'legality preview is read-only');
  });
  test(`${file}: forged coal placement in shared slot is rejected without spending or tile removal`,async()=>{
    const run=game(file);
    run("state=fresh();state.playerMoney=100;var options=buildOptions('피츠버그'),choice=[...options.normal,...options.vander].find(x=>x.track==='coal'&&x.city==='피츠버그');choice={...choice,i:2};var before=JSON.stringify(state),warning='';alert=x=>{warning=x}");
    await run("executePlayerBuild(choice,'피츠버그')");
    assert.ok(run('warning'));
    assert.equal(run('JSON.stringify(state)'),run('before'));
  });
  test(`${file}: rendering turn interaction reset preserves the action owner`,()=>{
    const run=game(file);run("state=fresh();state.turnOwner='player';playerActionPending=true;resetPlayerTurnInteraction(false)");
    assert.equal(run('playerActionPending'),true);
    run('resetPlayerTurnInteraction()');assert.equal(run('playerActionPending'),false,'real turn handoff still clears stale busy state');
  });
  test(`${file}: map slot information delegates to the exact shared empty-slot rule without writes`,()=>{
    const run=game(file),board=fs.readFileSync(__dirname+'/../dist/physical-board.js','utf8');
    run(board.slice(board.indexOf(' function infoLegalEmptySlots('),board.indexOf(' function infoBuildLocations(')));
    run("state=fresh();var before=JSON.stringify(state)");
    assert.equal(run("infoLegalEmptySlots('피츠버그','coal','탄광 I').join(',')"),'0');
    assert.equal(run("infoLegalEmptySlots('피츠버그','steel','제철소 I').join(',')"),'2');
    assert.equal(run("infoLegalEmptySlots('피츠버그','kerosene','등유 II').join(',')"),'1');
    assert.equal(run("infoLegalEmptySlots('피츠버그','manufacturing','제조 상자 I').join(',')"),'3');
    assert.equal(run("infoLegalEmptySlots('윌크스-배리','coal','탄광 I').join(',')"),'0,1');
    assert.equal(run('JSON.stringify(state)'),run('before'));
  });
  test(`${file}: industry cards work with no player network in every era, round and action`,()=>{
    const run=game(file);
    for(const era of [1,2])for(const round of [1,2,4,8])for(const actionNo of [1,2]){
      run(`state=fresh();state.playerMoney=100;state.era=${era};state.round=${round};state.actionNo=${actionNo};state.cities={};state.edges={};state.playerRemoved={}`);
      assert.ok(run("buildOptions('제조 상자').normal.length")>0,`${era}/${round}/${actionNo}`);
    }
  });
  for(const kind of ['industry','rail','pipe'])test(`${file}: own ${kind} disables empty-network exception, opponent ownership does not`,()=>{
    const run=game(file);
    run("state=fresh();state.playerMoney=100;state.era=2;state.round=4;state.cities={};state.edges={};state.playerRemoved={}");
    const setup=kind==='industry'?"Object.assign(slot('피츠버그',0),{owner:actor,industry:'석탄'})":kind==='rail'?"state.edges[edgeId('피츠버그','해리스버그','rail')]={owner:actor,tile:'normal'}":"state.edges[edgeId('피츠버그','트랜턴 유전','pipe')]={owner:actor,tile:'normal'}";
    run(`var actor='automa';${setup}`);
    assert.ok(run("buildOptions('제조 상자').normal.some(option=>option.city==='클리브랜드')"));
    run(`actor='player';${setup}`);
    assert.equal(run("buildOptions('제조 상자').normal.some(option=>option.city==='클리브랜드')"),false);
    assert.ok(run("buildOptions('제조 상자').normal.some(option=>option.city==='피츠버그')"));
    assert.ok(run("buildOptions('클리브랜드').normal.some(option=>option.city==='클리브랜드')"),'location cards remain independent of the network exception');
  });
}
