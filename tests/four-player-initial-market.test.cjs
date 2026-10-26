const {test}=require('node:test'),assert=require('node:assert/strict');
require('../dist/four-player/core.js');require('../dist/four-player/engine.js');require('../dist/four-player/human.js');require('../dist/four-player/flow.js');
const F=FourPlayer,H=FourHuman,data=require('../dist/four-player/data.json');
const processed=['이즈브리지','캐나다','필라델피아'],raw=['털리도','클락스버그','윌크스-배리'];
function fresh(){const g=F.createGame(data,undefined,77);g.order=[0,1,2,3];g.players[0].hand[0]='시카고';g.players[0].money=100;return g}
const phiRoute=data.routes.find(r=>r.type==='rail'&&[r.from,r.to].includes('필라델피아')&&[r.from,r.to].includes('뉴욕')).gameId;
function humanUI(){return {pick:async(label,items)=>label==='연속 네트워크 건설'?'행동 종료':items.find(x=>x.n?.id==='start-steel')||items[0],map:async(_type,normal,vander)=>({... [...normal,...vander].find(x=>x.id===phiRoute),_includeV:true})}}
function nonPhi(markets){return Object.fromEntries(Object.entries(markets).filter(([city])=>city!=='필라델피아'))}

test('all six markets start full except one coke per manufactured market, before any actor moves',()=>{
 for(const seed of [1,77,2026]){
  const g=F.createGame(data,undefined,seed);assert.equal(g.turn,1);assert.equal(g.actionCount,0);assert.equal(g.logs.length,0);assert.equal(Object.keys(g.markets).length,6);
  for(const city of processed)assert.deepEqual(g.markets[city],{강철:2,코크스:1},city);
  for(const city of raw)assert.deepEqual(g.markets[city],{철:3,석탄:3},city);
  const totals={강철:0,코크스:0,철:0,석탄:0};for(const stock of Object.values(g.markets))for(const [resource,n]of Object.entries(stock))totals[resource]+=n;
  assert.deepEqual(totals,{강철:6,코크스:3,철:9,석탄:9});assert.equal(Object.values(totals).reduce((a,b)=>a+b,0),27);
 }
});

test('Philadelphia market has printed price four and both human and Automa heavy trains consume its two steel for eight',async()=>{
 assert.equal(data.locations.find(l=>l.name==='필라델피아').price,4);
 const g=fresh(),before=JSON.stringify(g),result=await H.run(g,data,'네트워크',0,humanUI());
 assert.ok(result);assert.equal(result.game.markets.필라델피아.강철,0);assert.equal(result.game.markets.필라델피아.코크스,1);assert.equal(result.action.totalCost,8);assert.equal(result.game.players[0].money,92);assert.deepEqual(nonPhi(result.game.markets),nonPhi(g.markets));assert.equal(JSON.stringify(g),before);
 const ai=fresh();ai.cursor=1;ai.players[1].money=8;
 const offered=F.list(ai).find(a=>a.type==='네트워크'&&a.networkId==='start-steel'&&a.edge.id===phiRoute&&!a.second);assert.ok(offered,'Philadelphia heavy train must be generated using its own affordable steel');
 const aiBefore=JSON.stringify(ai),next=F.perform(ai,data,offered);assert.equal(next.markets.필라델피아.강철,0);assert.equal(next.markets.필라델피아.코크스,1);assert.equal(next.players[1].money,0);assert.equal(next.players[1].spent,8);assert.deepEqual(nonPhi(next.markets),nonPhi(ai.markets));assert.equal(JSON.stringify(ai),aiBefore);
});

test('missing-market repair adds only entirely absent Philadelphia and never refills a present zero or partial market',()=>{
 const g=fresh();for(const stock of Object.values(g.markets))for(const resource of Object.keys(stock))stock[resource]=0;delete g.markets.필라델피아;
 const otherBefore=JSON.stringify(nonPhi(g.markets)),logs=JSON.stringify(g.logs);assert.equal(F.restoreMissingMarkets(g),g);assert.deepEqual(g.markets.필라델피아,{강철:2,코크스:1});assert.equal(JSON.stringify(nonPhi(g.markets)),otherBefore);assert.equal(JSON.stringify(g.logs),logs);
 for(const stock of [{강철:0,코크스:0},{강철:1,코크스:0},{강철:0}]){g.markets.필라델피아=structuredClone(stock);const before=JSON.stringify(g);F.restoreMissingMarkets(g);assert.equal(JSON.stringify(g),before);}
});

test('old saves repair current, history and prepared-preview clones without changing input or topping up spent resources',async()=>{
 const g=fresh();g.markets.캐나다={강철:0,코크스:0};g.markets.털리도={철:0,석탄:1};
 const result=await H.run(g,data,'패스',0,{pick:async()=>{throw Error('Pass must not ask for extra choices')}}),old=structuredClone(g),history=structuredClone(g),after=structuredClone(result.game);
 delete old.markets.필라델피아;delete history.markets.필라델피아;delete after.markets.필라델피아;old.uiHistory=[history];old.uiPending={action:result.action,after};const before=JSON.stringify(old);
 const flow=new FourFlow(F,data,old);for(const snapshot of [flow.game,flow.history[0],flow.display()]){assert.deepEqual(snapshot.markets.필라델피아,{강철:2,코크스:1});assert.deepEqual(snapshot.markets.캐나다,{강철:0,코크스:0});assert.deepEqual(snapshot.markets.털리도,{철:0,석탄:1});}
 assert.equal(JSON.stringify(old),before);assert.ok(flow.pending?.prepared);flow.confirm();flow.undo();assert.deepEqual(flow.game.markets.필라델피아,{강철:2,코크스:1});assert.deepEqual(flow.game.markets.캐나다,{강철:0,코크스:0});assert.deepEqual(flow.game.markets.털리도,{철:0,석탄:1});
});

test('prepared save reload and undo preserve an existing depleted Philadelphia market at zero',async()=>{
 const g=fresh();g.markets.필라델피아={강철:0,코크스:0};const result=await H.run(g,data,'패스',0,{pick:async()=>null}),flow=new FourFlow(F,data,g);
 assert.equal(flow.stagePrepared(result,flow.revision),true);const restored=new FourFlow(F,data,JSON.parse(JSON.stringify(flow.serializable())));
 assert.deepEqual(restored.game.markets.필라델피아,{강철:0,코크스:0});assert.deepEqual(restored.display().markets.필라델피아,{강철:0,코크스:0});restored.confirm();restored.undo();assert.deepEqual(restored.game.markets.필라델피아,{강철:0,코크스:0});
});

test('direct rule views of a legacy five-market game repair only their clone and can offer the missing market',()=>{
 const old=fresh();delete old.markets.필라델피아;old.markets.캐나다={강철:0,코크스:0};const before=JSON.stringify(old),core=F.project(old,0);
 assert.deepEqual(core.get().markets.필라델피아,{강철:2,코크스:1});assert.deepEqual(core.get().markets.캐나다,{강철:0,코크스:0});assert.equal(JSON.stringify(old),before);
 assert.equal(H.availability(old,0).네트워크,'');assert.ok(F.list(old).some(a=>a.type==='네트워크'&&a.edge?.id===phiRoute));assert.equal(JSON.stringify(old),before);
});
