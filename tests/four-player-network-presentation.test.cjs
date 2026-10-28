const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../dist/four-player/core.js');require('../dist/four-player/engine.js');require('../dist/four-player/board.js');require('../dist/four-player/physical.js');require('../dist/online/network-presentation.js');
const data=require('../dist/four-player/data.json'),ui=fs.readFileSync(require.resolve('../dist/four-player/ui-table.js'),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fixture(seat=0){const core=createFourCore(),board=createOnlineNetworkBoard(data,core,createFourBoard(data,core),()=>seat),g=FourPlayer.createGame(data,undefined,77);return {core,board,g};}
test('all 48 four-player routes and four colors use the 2P tile geometry at retained r399 anchors',()=>{
 const {board,g}=fixture(),beforeLayout=JSON.stringify(data.layout);
 for(let owner=0;owner<4;owner++)for(const r of data.routes){
  g.edges={[r.gameId]:{owner,networkId:r.type==='rail'?'light-train':'start-income'}};
  const before=JSON.stringify(g),p=board.networkRect(r),anchor=data.layout.networkTiles[r.id],html=board.markup(g);
  assert.equal(p.w,99);assert.equal(p.h,99/1.75);assert.equal(p.x,anchor.x*2000);assert.equal(p.y,anchor.y*2000);assert.equal(p.rotation,anchor.rotation);
  assert.match(html,new RegExp('owner-'+g.players[owner].color));assert.match(html,/class="physical-network-tile"/);
  assert.ok(html.includes(`width="99" height="${99/1.75}"`));assert.ok(html.includes(`rotate(${anchor.rotation} ${p.x} ${p.y})`));
  assert.equal((board.networkInfoMarkup(g).match(/data-network-info=/g)||[]).length,1);
  assert.doesNotMatch(html,/class="hit route-hit"/);assert.equal(JSON.stringify(g),before);
 }
 assert.equal(JSON.stringify(data.layout),beforeLayout);
});
test('four-player network facts preserve every real owner, live resources and pipeline effects without reading hands',()=>{
 const {board,g}=fixture(3),r=data.routes.find(r=>r.type==='rail'),pipe=data.routes.find(r=>r.type==='pipeline');
 g.players.forEach(p=>{delete p.hand;delete p.deck;});
 for(let owner=0;owner<4;owner++){
  g.edges={[r.gameId]:{owner,networkId:'start-steel',bonusType:'강철',bonusRemaining:2},[pipe.gameId]:{owner,networkId:'pipe5'}};
  const before=JSON.stringify(g),info=board.networkDescriptor(g,r.gameId);
  assert.ok(info.html.includes(esc(g.players[owner].name)));assert.match(info.html,/강철 2개/);assert.match(board.markup(g),/physical-network-bonus/);
  assert.match(board.networkDescriptor(g,pipe.gameId).html,/효과/);assert.equal(JSON.stringify(g),before);
  g.edges[r.gameId].bonusRemaining=0;assert.match(board.networkDescriptor(g,r.gameId).html,/현재 올라간 자원<\/span><strong>없음/);assert.doesNotMatch(board.markup(g),/class="physical-network-bonus"/);
  g.edges[r.gameId]={owner,networkId:'start-whiskey',bonusType:'위스키',bonusRemaining:1};assert.doesNotMatch(board.markup(g),/class="physical-network-bonus"/);
 }
 assert.equal(board.networkDescriptor(g,'missing'),null);
});
test('network inspection targets disappear throughout map selection and return from the current snapshot',()=>{
 const {board,g}=fixture(),r=data.routes[0],nodes={'#board':{innerHTML:''},'#onlineNetworkInfoHits':{innerHTML:''}};
 g.edges[r.gameId]={owner:0,networkId:'light-train'};const old=globalThis.document;
 globalThis.document={querySelector:s=>nodes[s]};
 try{board.render(g);board.configureNetworkTargets({kind:'map'});assert.equal(nodes['#onlineNetworkInfoHits'].innerHTML,'');board.configureNetworkTargets(null);assert.match(nodes['#onlineNetworkInfoHits'].innerHTML,/data-network-info=/);delete g.edges[r.gameId];board.render(g);board.configureNetworkTargets(null);assert.equal(nodes['#onlineNetworkInfoHits'].innerHTML,'');}finally{globalThis.document=old;}
});
test('actual Automa human picker uses physical art and native descriptions for every player color, keeping choice indices',()=>{
 const {board,g}=fixture(),fn=ui.match(/^function pickerMarkup\([^\n]+/m)[0];
 const ctx=vm.createContext({esc,board,session:{game:g}});vm.runInContext(fn,ctx);
 for(const color of ['blue','red','yellow','purple']){g.players[0].color=color;const html=ctx.pickerMarkup({n:{id:'light-train'},vanderbilt:true},7,()=>'<경량 열차> · 석탄 1','첫 번째 네트워크 선택');assert.ok(html.includes('rail-light-train-'+color+'.webp'));assert.match(html,/data-human-pick="7"/);assert.match(html,/title="&lt;경량 열차&gt; · 석탄 1"/);assert.match(html,/picker-network-vanderbilt/);assert.doesNotMatch(html,/<span>/);}
 assert.match(ctx.pickerMarkup({},3,()=>'<경로>','경로 선택'),/<span>&lt;경로&gt;<\/span>/);
});
test('Automa tile click and keyboard handler opens public facts without committing a pending action and respects map selection',()=>{
 const {board,g}=fixture(),start=ui.indexOf('function targetClick('),end=ui.indexOf('\n\nasync function task',start),calls=[];
 const ctx=vm.createContext({Date,ignoreClickUntil:0,session:{pending:{},display:()=>g},busy:true,provisional:null,mapChoice:null,board,showOnlineNetworkInfo:(...args)=>calls.push(args)});
 vm.runInContext(ui.slice(start,end),ctx);const r=data.routes[0];g.edges[r.gameId]={owner:0,networkId:'light-train'};const before=JSON.stringify(g),event={clientX:100,clientY:200};
 ctx.targetClick({dataset:{networkInfo:r.gameId}},event);assert.equal(calls.length,1);assert.equal(calls[0][1],event);assert.match(calls[0][0].html,/소유자/);
 ctx.mapChoice={items:[],vander:[]};ctx.targetClick({dataset:{networkInfo:r.gameId}});assert.equal(calls.length,1);assert.equal(JSON.stringify(g),before);
});
test('both actual four-player entry points load the same physical network presentation and picker',()=>{
 for(const file of ['four-player.html','online.html']){const html=fs.readFileSync(require.resolve('../dist/'+file),'utf8');assert.match(html,/network-picker\.css\?v=3/);assert.match(html,/network-presentation\.css\?v=1/);assert.match(html,/online\/network-presentation\.js\?v=2/);}
 assert.match(ui,/board=createOnlineNetworkBoard\(data,core,createFourBoard\(data,core\),\(\)=>0\)/);
 assert.match(ui,/board\.configureNetworkTargets\(selecting\?\{kind:'map'\}:null\)/);
});
