const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function game() {
  const ctx = vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null,setItem:()=>{}}});
  const app=fs.readFileSync(__dirname+'/../dist/app.js','utf8');
  vm.runInContext(app.slice(0,app.indexOf("$('#decideBtn').onclick=")),ctx);
  const board=fs.readFileSync(__dirname+'/../dist/physical-board.js','utf8');
  // Execute the actual rendering and event binding functions with a minimal map surface.
  vm.runInContext(board.slice(board.indexOf(' function interactionMarkup(){'),board.indexOf('  function renderPhysicalMap(){')),ctx);
  const run=code=>vm.runInContext(code,ctx);
  run(`state=fresh();state.gameMode='full';state.era=2;state.round=3;state.turnOwner='player';state.playerHand=['등유'];state.playerRemoved=Object.fromEntries(Array.from({length:7},(_,i)=>['kerosene:'+i,'developed']));state.edges[edgeId('트랜턴 유전','피츠버그','pipe')]={owner:'player',tile:'normal'};state.oilfields['트랜턴 유전']=2;state.history=[];save=()=>{};confirmAction=async()=>true;alert=message=>{throw Error(message)};
    var index={slotsByCity:{},nodesByName:Object.fromEntries(OIL_FIELD_NAMES.map(name=>[name,{}]))};var esc=x=>x;var oilTileRect=()=>({x:10,y:10,w:90,h:90});var oilElement={dataset:{node:'트랜턴 유전'}};var document={querySelectorAll:selector=>selector==='[data-node]'||selector==='.physical-oil-hit'?[oilElement]:[]};`);
  return run;
}

test('eligible oil fields are highlighted, while ineligible fields are not',()=>{
  const run=game();
  run(`mapSelection={kind:'build',normal:buildOptions('등유').normal,vander:[],includeV:false}`);
  const markup=run('interactionMarkup()');
  assert.match(markup, /physical-oil-hit action-candidate[^>]*data-node="트랜턴 유전"/);
  assert.doesNotMatch(markup, /physical-oil-hit action-candidate[^>]*data-node="리마 유전"/);
  run('mapSelection=null');
  assert.doesNotMatch(run('interactionMarkup()'),/physical-oil-hit action-candidate/);
});

for(const mode of ['map','list'])test(`oil city ${mode} selection completes construction and consumes exactly one card`,async()=>{
  const run=game();
  run(`state.targetSelectMode='${mode}';pick=async(label,items)=>items.find(x=>x.g?.id==='k5')||items[0];`);
  if(mode==='map')run(`beginMapSelection=(kind,normal,vander)=>new Promise(resolve=>{mapSelection={kind,normal,vander,includeV:false,resolve};endMapSelection=value=>{let resolve=mapSelection.resolve;mapSelection=null;resolve(value)};bindInteractions();oilElement.onclick()})`);
  await run("playerBuild('등유')");
  assert.equal(run("state.oilCities['트랜턴 유전'].owner"),'player');
  assert.equal(run("state.oilCities['트랜턴 유전'].resource"),5);
  assert.equal(run("state.oilfields['트랜턴 유전']"),0);
  assert.equal(run("state.playerRemoved['kerosene:7']"),'built');
  assert.equal(run('state.playerIncomeLevel'),-4);
  assert.equal(run('state.playerDiscard.length'),1);
  assert.equal(run('state.playerHand.length'),0);
  assert.equal(run('state.pendingPlayerTurn'),true);
  assert.equal(run('state.history.length'),1);
});

test('oil city construction rejects era, pipeline, occupied-field, locked-tile and income violations',()=>{
  for(const change of ["state.era=1","state.edges={}","state.oilCities['트랜턴 유전']={owner:'automa',resource:3}","delete state.playerRemoved['kerosene:6']","state.playerIncome=0;state.playerIncomeLevel=-10"]){
    const run=game();run(change);
    assert.equal(run("buildOptions('등유').normal.filter(x=>x.g.id==='k5').length"),0,change);
  }
});

test('oil city keyboard selection resolves the same field as a map click',()=>{
  const run=game();run(`var selected=null;mapSelection={kind:'build',normal:buildOptions('등유').normal,vander:[],includeV:false};endMapSelection=value=>{selected=value;mapSelection=null};bindInteractions();oilElement.onkeydown({key:'Enter',preventDefault(){}})`);
  assert.equal(run('selected.city'),'트랜턴 유전');
});
