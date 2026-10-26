const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('../dist/four-player/core.js');require('../dist/four-player/engine.js');require('../dist/four-player/human.js');require('../dist/four-player/flow.js');require('../dist/four-player/board.js');require('../dist/four-player/physical.js');
const F=FourPlayer,H=FourHuman,data=require('../dist/four-player/data.json'),root=path.resolve(__dirname,'../dist');
function fresh(){const g=F.createGame(data,undefined,77);g.order=[0,1,2,3];g.players[0].money=100;g.players[0].hand[0]='시카고';return g}
const board=()=>createFourBoard(data,createFourCore()),countImages=html=>(html.match(/class="physical-market-resource"/g)||[]).length;
function stock(html,city,resource){const part=html.split('<g class="physical-market-stock"').slice(1).find(chunk=>chunk.includes('data-market="'+city+'"')&&chunk.includes('data-resource="'+resource+'"'));assert.ok(part,city+' '+resource);return {part,count:countImages(part),declared:Number(part.match(/data-stock="(\d+)"/)[1])}}
const route='rail:'+['시카고','털리도'].sort().join('|');
function humanUI(buildCity){return {pick:async(label,items)=>label==='연속 네트워크 건설'?'행동 종료':items.find(x=>x.n?.id==='light-train')||items[0],map:async(type,normal,vander)=>({... [...normal,...vander].find(item=>type==='edge'?item.id===route:item.city===buildCity&&item.g?.id==='c1'),_includeV:true})}}

test('the physical board reads all five live market stocks, keeps all four resource assets and never invents a Philadelphia market',()=>{
 const g=fresh(),b=board(),before=JSON.stringify(g),html=b.marketMarkup(g),full=b.markup(g);
 assert.equal(countImages(html),24);assert.equal((html.match(/class="physical-market-stock"/g)||[]).length,10);
 assert.equal(stock(html,'캐나다','강철').count,2);assert.equal(stock(html,'캐나다','코크스').count,1);assert.equal(stock(html,'털리도','철').count,3);assert.equal(stock(html,'털리도','석탄').count,3);
 assert.ok(!html.includes('필라델피아'));assert.ok(!g.markets.필라델피아);assert.match(full,/class="physical-market-resources-layer"/);assert.ok(full.includes(html));
 for(const [,file]of html.matchAll(/href="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,file)),file);
 for(const file of ['resource-iron','resource-coal','resource-steel','resource-coke'])assert.ok(html.includes(file+'.webp'),file);
 assert.ok(!/undefined|NaN/.test(html));assert.equal(JSON.stringify(g),before);
});

test('zero, partial and replenished stocks occupy only their canonical saved column and row positions',()=>{
 const b=board(),g=fresh();
 for(const [city,resources]of Object.entries(g.markets))for(const resource of Object.keys(resources)){
  const loc=data.locations.find(l=>l.name===city),panel='market.4.'+loc.id.split('.').at(-1),raw=['철','석탄'].includes(resource),capacity=raw?3:2,column=['철','강철'].includes(resource)?0:1;
  for(let value=0;value<=capacity;value++){
   g.markets[city][resource]=value;const before=JSON.stringify(g),rendered=stock(b.marketMarkup(g),city,resource);
   assert.equal(rendered.count,value,city+' '+resource+' '+value);assert.equal(rendered.declared,value);assert.ok(rendered.part.includes(city+' 시장 '+resource+' '+value+'개'));
   for(let row=0;row<capacity;row++){
    const p=data.layout.placements[panel+'.cell.'+(row*2+column+1)],x=(p.x-p.w/2)*2000,y=(p.y-p.h/2)*2000,position='x="'+x+'" y="'+y+'" width="'+p.w*2000+'" height="'+p.h*2000+'"';
    assert.equal(rendered.part.includes(position),row<value,city+' '+resource+' row'+row);
   }
   assert.equal(JSON.stringify(g),before);
  }
 }
 for(const resources of Object.values(g.markets))for(const resource of Object.keys(resources))resources[resource]=0;
 assert.equal(countImages(b.marketMarkup(g)),0);assert.equal((b.marketMarkup(g).match(/data-stock="0"/g)||[]).length,10);
});

test('actual human and Automa market consumption both remove the corresponding cube on the next render',async()=>{
 const g=fresh(),before=JSON.stringify(g),b=board(),human=await H.run(g,data,'네트워크',0,humanUI());
 assert.equal(g.markets.털리도.석탄,3);assert.equal(human.game.markets.털리도.석탄,2);assert.equal(stock(b.marketMarkup(g),'털리도','석탄').count,3);assert.equal(stock(b.marketMarkup(human.game),'털리도','석탄').count,2);assert.equal(JSON.stringify(g),before);
 const ai=fresh();ai.cursor=1;const action=F.list(ai).find(a=>a.type==='네트워크'&&a.networkId==='light-train'&&a.edge.id===route&&!a.second);assert.ok(action);
 const next=F.perform(ai,data,action);assert.equal(next.markets.털리도.석탄,2);assert.equal(stock(b.marketMarkup(next),'털리도','석탄').count,2);assert.equal(ai.markets.털리도.석탄,3);
});

test('actual coal production refills empty market cells while its consumed iron cube disappears',async()=>{
 const g=fresh(),b=board();g.players[0].hand[0]='클락스버그';g.markets.클락스버그.석탄=0;const before=JSON.stringify(g),human=await H.run(g,data,'건설',0,humanUI('클락스버그'));
 assert.equal(stock(b.marketMarkup(g),'클락스버그','석탄').count,0);assert.deepEqual(human.game.markets.클락스버그,{철:2,석탄:3});
 assert.equal(stock(b.marketMarkup(human.game),'클락스버그','석탄').count,3);assert.equal(stock(b.marketMarkup(human.game),'클락스버그','철').count,2);assert.equal(JSON.stringify(g),before);
 const ai=fresh();ai.markets.클락스버그.석탄=0;const core=F.project(ai,0);core.rules.sellProduced('클락스버그','석탄',3);F.commit(ai,core,0);assert.equal(stock(b.marketMarkup(ai),'클락스버그','석탄').count,3);
});

test('pending preview, reload, confirmation and both undo paths render the transaction stock rather than stale market artwork',async()=>{
 const g=fresh(),before=JSON.stringify(g),b=board(),flow=new FourFlow(F,data,g),result=await H.run(g,data,'네트워크',0,humanUI());
 assert.equal(flow.stagePrepared(result,flow.revision),true);assert.equal(stock(b.marketMarkup(flow.game),'털리도','석탄').count,3);assert.equal(stock(b.marketMarkup(flow.display()),'털리도','석탄').count,2);
 const restored=new FourFlow(F,data,JSON.parse(JSON.stringify(flow.serializable())));assert.equal(stock(b.marketMarkup(restored.display()),'털리도','석탄').count,2);assert.equal(restored.game.markets.털리도.석탄,3);
 restored.confirm();assert.equal(stock(b.marketMarkup(restored.display()),'털리도','석탄').count,2);restored.undo();assert.equal(stock(b.marketMarkup(restored.display()),'털리도','석탄').count,3);assert.equal(JSON.stringify(restored.game),before);
 flow.undo();assert.equal(stock(b.marketMarkup(flow.display()),'털리도','석탄').count,3);assert.equal(JSON.stringify(flow.game),before);
});
