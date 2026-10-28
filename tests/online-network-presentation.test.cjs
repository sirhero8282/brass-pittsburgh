const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../dist/online/two-core.js');require('../dist/four-player/core.js');require('../dist/four-player/engine.js');require('../dist/four-player/board.js');require('../dist/four-player/physical.js');require('../dist/online/network-presentation.js');
const data=require('../dist/online/two-data.json'),original=require('../dist/assets/data/pittsburgh-2p-layout.json');
const create=seat=>{const core=createTwoCore();return {core,board:createOnlineNetworkBoard(data,core,createFourBoard(data,core),()=>seat)}};
test('all 34 online 2P network rectangles exactly match retained Automa 2P physical dimensions and rotations',()=>{
 const source=fs.readFileSync(require.resolve('../dist/physical-board.js'),'utf8'),fn=source.match(/function networkRect\(curve,route\)\{[^\n]+/)[0];
 const slotWidths=original.catalog.filter(c=>c.kind==='slot').map(c=>original.placements[c.id].w*2000).sort((a,b)=>a-b),index={industryTileWidth:slotWidths[Math.floor(slotWidths.length/2)]},ctx={index,manualNetworkPlacement:route=>{const p=original.networkTiles[route.id];return {...p,x:p.x*2000,y:p.y*2000}},Math};vm.createContext(ctx);vm.runInContext(fn,ctx);
 const {board}=create(0);for(const r of data.routes){const expected=ctx.networkRect(null,r),actual=board.networkRect(r);for(const key of ['x','y','w','h','rotation'])assert.equal(actual[key],expected[key],r.id+' '+key);}
});
test('network inspection is tile sized, keeps owner zero and public bonus facts, and never mutates a snapshot',async()=>{
 const R=await import('../multiplayer/room.mjs'),room=R.newRoom('ABCDEFGH',{map:'two',name:'사람0',key:'key0'},1000);R.join(room,{name:'사람1',key:'key1'},1000);room.members.forEach(m=>m.ready=true);await R.execute(room,0,'start',{revision:room.revision,commandId:'inspect-start'},2000,77);const g=R.snapshot(room,0,3000).game;
 g.map='two';const r=data.routes.find(x=>x.type==='rail');g.edges[r.gameId]={owner:0,networkId:'start-steel',bonusType:'강철',bonusRemaining:1};const {board}=create(0),before=JSON.stringify(g),html=board.markup(g);
 assert.equal(JSON.stringify(g),before);assert.match(html,/physical-network-piece rail player owner-blue/);assert.match(html,/physical-network-bonus/);assert.match(html,/physical-network-tile/);assert.doesNotMatch(html,/class="hit route-hit"/);
 assert.equal((board.networkInfoMarkup(g).match(/data-network-info=/g)||[]).length,1);assert.match(board.networkInfoMarkup(g),/네트워크 정보/);
 const d=board.networkDescriptor(g,r.gameId);assert.match(d.html,/소유자/);assert.match(d.html,/강철 1개/);assert.match(d.html,/효과/);assert.equal(board.networkDescriptor(g,data.routes.find(x=>x!==r).gameId),null);
 g.edges[r.gameId].bonusRemaining=0;assert.match(board.networkDescriptor(g,r.gameId).html,/현재 올라간 자원<\/span><strong>없음/);
});
test('network picker uses exact public network IDs, physical color art, native title and existing hover classes',()=>{
 const {core,board}=create(1),choice={label:'첫 번째 네트워크 선택'},html=onlineNetworkOptionMarkup({index:7,networkId:'light-train',label:'경량 열차 · 석탄 1',vanderbilt:true},choice,core,board,'red',false);
 assert.match(html,/picker-option picker-network-tile-choice/);assert.match(html,/data-choice="7"/);assert.match(html,/title="경량 열차 · 석탄 1 · 밴더빌트"/);assert.match(html,/rail-light-train-red.webp/);assert.match(html,/picker-network-vanderbilt/);
 assert.doesNotMatch(onlineNetworkOptionMarkup({index:2,networkId:'bad',label:'<bad>'},choice,core,board,'red',false),/<img/);assert.match(onlineNetworkOptionMarkup({index:2,label:'<bad>'},{label:'자원 선택'},core,board,'blue',false),/&lt;bad&gt;/);
});
for(const map of ['two','four'])test(map+' server exposes only public network identity and Vanderbilt marker for physical choices',async()=>{
 const E=await import('../multiplayer/engine.mjs'),R=await import('../multiplayer/room.mjs'),r=R.newRoom('ABCDEFGH',{map,name:'사람0',key:'key0'},1000),count=map==='two'?2:4;
 for(let i=1;i<count;i++)R.join(r,{name:'사람'+i,key:'key'+i},1000);r.members.forEach(m=>m.ready=true);await R.execute(r,0,'start',{revision:r.revision,commandId:'network-ui-start'},2000,77);
 for(let seat=0;seat<count;seat++){r.game.order=[seat,...r.game.order.filter(i=>i!==seat)];r.game.cursor=0;const before=JSON.stringify(r.game),result=await E.prepare(r.game,seat,{type:'네트워크',cardIndex:0,choices:[]}),core=map==='two'?createTwoCore():createFourCore();assert.match(result.choice.label,/네트워크 선택$/);for(const o of result.choice.options){const n=core.networks.find(n=>n.id===o.networkId);assert.ok(n);assert.ok(o.label.startsWith(n.name));assert.ok(Object.keys(o).every(k=>['index','label','networkId','vanderbilt'].includes(k)));}assert.equal(JSON.stringify(r.game),before);}
});
