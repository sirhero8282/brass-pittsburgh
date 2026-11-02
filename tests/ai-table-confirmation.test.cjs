const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('2P pending pipeline does not reveal or fund the reward until confirmation, and undo restores supply',()=>{
 const ctx=vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}}});
 const src=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');vm.runInContext(src.slice(0,src.indexOf("$('#decideBtn').onclick=")),ctx);
 const run=s=>vm.runInContext(s,ctx);run("state=fresh();state.gameMode='full';state.setupLocked=true;state.turnOwner='player';state.roundStarter='player';state.playerMoney=60;save=()=>{};var f='트랜턴 유전',c='피츠버그',e={a:f,b:c,id:edgeId(f,c,'pipe')},n=NETWORKS.find(x=>x.id==='start-income');state.setup.oil[f]={value:'$15',revealed:false};");
 const stage=()=>run("snapshot();placeNetworkTile('player',n,e,true);state.pendingPlayerTurn=true");
 stage();assert.equal(run('state.playerMoney'),60);assert.equal(run('state.setup.oil[f].revealed'),false);
 run('rollbackPlayerNetworkAction()');assert.equal(run('state.edges[e.id]?.owner||"none"'),'none');assert.equal(run('state.pendingOilFields?.length||0'),0);
 stage();assert.ok(run('confirmPlayerTurn()'));assert.equal(run('state.playerMoney'),75);assert.equal(run('state.setup.oil[f].revealed'),true);assert.equal(run('state.pendingOilFields'),undefined);
});
test('multi-seat AI preview, cancel and confirm agree about a hidden field and show its reward only once',async()=>{
 require('../dist/four-player/core.js');require('../dist/four-player/engine.js');require('../dist/four-player/human.js');require('../dist/four-player/flow.js');
 const data=require('../dist/four-player/data.json'),g=FourPlayer.createGame(data,undefined,77);g.order=[0,1,2,3];g.players[0].money=80;const previews=[];
 for(const field of Object.values(g.setup.oil)){field.value='$15';field.revealed=false}
 const ui={deferOil:true,preview:s=>previews.push(s),pick:async(label,normal,show,hint,v)=>label==='첫 번째 네트워크 선택'?[...normal,...v].find(x=>x.n.id==='start-income'):label==='연속 네트워크 건설'?'행동 종료':[...normal,...v][0],map:async(t,n,v)=>({...([...n,...v][0]),_includeV:!n.length})};
 const r=await FourHuman.run(g,data,'네트워크',0,ui);assert.ok(r?.action.deferredOil);assert(previews.every(s=>Object.values(s.setup.oil).every(x=>!x.revealed)));
 const flow=new FourFlow(FourPlayer,data,g);assert(flow.stagePrepared(r,flow.revision));assert(Object.values(flow.display().setup.oil).every(x=>!x.revealed));flow.undo();assert.equal(flow.game.players[0].money,80);assert(flow.stagePrepared(r,flow.revision));flow.confirm();assert.equal(Object.values(flow.game.setup.oil).filter(x=>x.revealed).length,1);assert.equal(flow.game.players[0].money,95-r.action.totalCost);
});
