const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function interaction(){
 const host={hidden:true,innerHTML:'',scrollIntoView(){},querySelector(selector){return selector==='[data-next-v]'?null:selector==='[data-next-network-cancel]'?null:{focus(){},onclick:null}},querySelectorAll(){return Array.from(this.innerHTML.matchAll(/data-next-pick="(\d+)"/g),m=>({dataset:{nextPick:m[1]},onclick:null}))}};
 // Keep actual button handlers so a test follows the same promise chain as clicking.
 host.querySelectorAll=function(){return this.buttons=Array.from(this.innerHTML.matchAll(/data-next-pick="(\d+)"/g),m=>({dataset:{nextPick:m[1]},onclick:null}))};
 const document={querySelector:selector=>selector==='#nextDetails'?host:{hidden:true,focus(){}},querySelectorAll:()=>[]};
 const ctx=vm.createContext({document,structuredClone,console,setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem(){}}});
 const app=fs.readFileSync(__dirname+'/../dist/app.js','utf8'),ui=fs.readFileSync(__dirname+'/../dist/next.js','utf8');
 vm.runInContext(app.slice(0,app.indexOf("$('#decideBtn').onclick=")),ctx);
 vm.runInContext(ui.slice(0,ui.lastIndexOf('\ninitNext();')),ctx);
 ctx.host=host;
 const run=code=>vm.runInContext(code,ctx);
 run(`state=fresh();state.turnOwner='player';state.setupLocked=true;state.playerMoney=100;state.roundActions={player:0,automa:0};state.roundActionsEra=1;state.roundActionsRound=1;nextCard='피츠버그';nextStamp=[state.seed,state.gameMode,state.era,state.round,state.turnOwner,state.turn,state.playerDiscard.length].join(':');
 renderNext=()=>{};setPlayerStep=()=>{};save=()=>resetPlayerTurnInteraction(false);nextAvailability=()=>({network:'',build:''});
 var modalCalls=[];pick=(label)=>{modalCalls.push(label);return new Promise(()=>{})};
 playerNetworkChoices=()=>[{n:{id:'light-train',name:'경량 열차',cost:'석탄 1'}}];personalNetworkAsset=()=>'';
 choosePlayerNetworkStep=async()=>await pick('경로 선택',[{n:{id:'light-train'},e:{id:'test'}}]);
 applyPlayerNetworkStep=()=>{state.playerMoney-=7;state.edges.test={owner:'player'};return {name:'경량 열차',detail:'test',cost:7}};
 finishPlayer=()=>{state.testFinished=true};`);
 const picker=ui.slice(ui.indexOf(' pick=function('),ui.indexOf('\n const originalLock='));
 run('const originalPick=pick;'+picker);
 return {run,host,ctx,ui};
}
async function flush(){for(let i=0;i<12;i++)await Promise.resolve()}
async function choose(ui,index=0){assert.ok(ui.host.buttons?.[index],'inline selection must be present');ui.host.buttons[index].onclick();await flush()}
test('cancel and immediately repeat a partially applied network waits for rollback and keeps all picks inline',async()=>{
 const ui=interaction(),{run,host}=ui;
 const old=run("runNextAction('network')");await flush();await choose(ui);await choose(ui);
 assert.equal(run('state.playerMoney'),93);assert.match(host.innerHTML,/연속 네트워크 건설/);
 const repeated=run("runNextAction('network')");await flush();await old;
 assert.equal(run('state.playerMoney'),100);assert.equal(run('state.edges.test'),undefined);
 assert.equal(run('playerActionPending'),true);assert.match(host.innerHTML,/첫 번째 네트워크 선택/);
 await choose(ui);await choose(ui);await choose(ui,1);
 assert.match(host.innerHTML,/두 번째 네트워크 선택/);assert.equal(run('modalCalls.length'),0);
 await choose(ui);await choose(ui);await repeated;
 assert.equal(run('state.testFinished'),true);assert.equal(run('state.playerMoney'),86);
 assert.equal(run('state.history.length'),1);assert.equal(run('playerActionPending'),false);
});
test('rapid repeated action requests only start the newest replacement',async()=>{
 const ui=interaction(),{run}=ui;const old=run("runNextAction('network')");await flush();await choose(ui);await choose(ui);
 const first=run("runNextAction('network')"),last=run("runNextAction('network')");await flush();await old;await first;
 assert.equal(run('state.playerMoney'),100);assert.equal(run('state.history.length'),0);assert.equal(run('modalCalls.length'),0);
 await run('cancelNextPlayerAction()');await last;assert.equal(run('playerActionPending'),false);
});
test('changing a card during partial construction completes old rollback before selecting the new card',async()=>{
 const testUI=interaction(),{run,ctx,ui}=testUI;
 const old=run("runNextAction('network')");await flush();await choose(testUI);await choose(testUI);
 const button={dataset:{nextCard:'0'}};
 ctx.document.querySelectorAll=selector=>selector==='[data-next-card]'?[button]:[];
 run("nextCards=()=>[{card:'뉴욕'}];nextCardHasAction=()=>true");
 const start=ui.indexOf(" $$('[data-next-card]').forEach(b=>b.onclick=async()=>"),end=ui.indexOf('\n',start);
 run(ui.slice(start,end));await button.onclick();await old;
 assert.equal(run('nextCard'),'뉴욕');assert.equal(run('state.playerMoney'),100);
 assert.equal(run('state.history.length'),0);assert.equal(run('state.edges.test'),undefined);
 const next=run("runNextAction('network')");await flush();assert.equal(run('playerActionPending'),true);
 assert.equal(run('modalCalls.length'),0);await run('cancelNextPlayerAction()');await next;
});
