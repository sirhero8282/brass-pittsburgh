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
