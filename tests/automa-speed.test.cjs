const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function engine() {
  const source = fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
  const ctx=vm.createContext({structuredClone,console,setTimeout,clearTimeout,localStorage:{getItem:()=>null}});
  vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),ctx);
  return code=>vm.runInContext(code,ctx);
}
test('simulation clones preserve historical scoring logs and isolate live state',()=>{
  const run=engine();
  const result=run("(()=>{state.logs=[{title:'시대 종료 산업 점수',detail:'historical scoring'}];state.history=['large undo snapshot'];state.current={audit:'previous proposal'};let copy=cloneAutomaSimulationState(state);copy.logs[0].detail='changed';copy.cities.test=[];return {history:copy.history.length,current:copy.current,log:state.logs[0].detail,live:!state.cities.test}})()");
  assert.equal(result.history,0);assert.equal(result.current,null);
  assert.equal(result.log,'historical scoring');assert.equal(result.live,true);
});
test('safe pass prevents repeated recovery generation but insufficient cash still searches',()=>{
  const run=engine();
  const result=run("(()=>{let oldApply=applyAutomaCandidateForSearch,oldCollect=collectAutomaCandidates,oldSettle=roundIncomeWillSettle,calls=0;try{roundIncomeWillSettle=()=>true;applyAutomaCandidateForSearch=()=>true;collectAutomaCandidates=()=>{calls++;return {opts:[{type:'패스',title:'패스',cost:0}]}};state.era=2;state.round=2;state.actionNo=1;state.income=2;state.money=50;const before=state,safe=automaCandidateBankruptcyRisk({type:'패스'}),safeCalls=calls;state.money=0;const unsafe=automaCandidateBankruptcyRisk({type:'패스'});return {safe:safe.willBankrupt,safePass:safe.safePass,safeCalls,unsafe:unsafe.willBankrupt,calls,restored:state===before}}finally{applyAutomaCandidateForSearch=oldApply;collectAutomaCandidates=oldCollect;roundIncomeWillSettle=oldSettle}})()");
  assert.equal(result.safe,false);assert.equal(result.safePass,true);assert.equal(result.safeCalls,0);
  assert.equal(result.unsafe,true);assert.equal(result.calls,1);assert.equal(result.restored,true);
});
test('UI lookahead fills its budget with distinct choices and reuses generated candidates',async()=>{
  const ui=fs.readFileSync(path.join(__dirname,'../dist/next.js'),'utf8');
  const fn=ui.slice(ui.indexOf('async function addAutomaLookaheadCooperatively('),ui.indexOf('async function decideAutoma('));
  let generated=0, planned=0;
  const context=vm.createContext({
    automaLookaheadSteps:function*(opts){let rows=opts.filter((x,i)=>opts.findIndex(y=>y.key===x.key)===i);for(const row of rows){generated++;planned++;yield null}return rows},
    state:{aiDifficulty:'standard',hand:['card']},structuredClone,
    AUTOMA_SEARCH_CONFIG:{standard:{candidateLimit:2,discount:.58}},
    activeAiPolicy:()=>({lookaheadWeight:1}),
    uniqueAutomaCandidates:rows=>rows.filter((x,i)=>rows.findIndex(y=>y.key===x.key)===i),
    candidateChoiceKey:x=>x.key,cloneAutomaSimulationState:structuredClone,
    applyAutomaCandidateForSearch:()=>true,yieldAutomaFrame:async()=>{},
    collectAutomaCandidatesCooperatively:async()=>{generated++;return {opts:[]}},
    selectAutomaGoal:()=>({}),
    selectAutomaPlan:(commit,set)=>{assert.ok(set);planned++;return {}},
    evaluateAutomaCandidates:()=>[{score:10,type:'패스',title:'패스'}],
  });
  vm.runInContext(fn,context);
  context.opts=[{key:'a',score:20,reason:''},{key:'a',score:19,reason:''},{key:'b',score:18,reason:''}];
  const rows=await vm.runInContext('addAutomaLookaheadCooperatively(opts)',context);
  assert.equal(rows.length,2);assert.equal(generated,2);assert.equal(planned,2);
});
