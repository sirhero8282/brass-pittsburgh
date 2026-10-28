const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../dist/online/table-ui.js'),'utf8');
function harness(map,seat){
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',classList:{add(){},toggle(){},remove(){}},closest(){return node('panel')},addEventListener(){},insertBefore(){},append(){}});return nodes.get(id);};
 const context={document:{querySelector:node,querySelectorAll:()=>[],body:node('body')},matchMedia:()=>({matches:false}),window:{addEventListener(){}},requestAnimationFrame:()=>1};vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve(map==='two'?'../dist/online/two-core.js':'../dist/four-player/core.js'),'utf8'),context);vm.runInContext(source,context);
 const core=map==='two'?context.createTwoCore():context.createFourCore(),board={image:(id,c)=>`tile/${c}/${id}`,netImage:(id,c)=>`network/${c}/${id}`};
 const ui=context.createOnlineTableUI({getCore:()=>core,getBoard:()=>board,getSeat:()=>seat});return {ui,core,node};
}
for(const map of ['two','four'])test(map+' physical table renders every seat from sanitized public inventory only',async()=>{
 const R=await import('../multiplayer/room.mjs'),r=R.newRoom('ABCDEFGH',{map,name:'사람 0',key:'key0'},1000),count=map==='two'?2:4;
 for(let i=1;i<count;i++)R.join(r,{name:'사람 '+i,key:'key'+i},1000);r.members.forEach(m=>m.ready=true);await R.execute(r,0,'start',{revision:r.revision,commandId:'ui-start'},2000,88);
 for(let seat=0;seat<count;seat++){
  const snapshot=R.snapshot(r,seat,3000),g=snapshot.game,{ui,core,node}=harness(map,seat),before=JSON.stringify(g);node('#personalOwner').value=String(seat);ui.render(g);
  assert.equal(JSON.stringify(g),before,'rendering must not mutate server snapshot');assert.equal(core.get().hand,undefined);assert.equal(core.get().deck,undefined);
  assert.match(node('#available').innerHTML,/available-industry-tile/);assert.match(node('#available').innerHTML,new RegExp('network/'+g.players[seat].color+'/'));
  assert.match(node('#personal').innerHTML,/physical-personal-board/);assert.match(node('#personal').innerHTML,new RegExp('사람 '+seat+' 개인판'));
  const c1=core.groups.coal.find(x=>x.id==='c1');g.players[seat].removed[c1.ids[0]]=true;ui.render(g);assert.doesNotMatch(node('#available').innerHTML,/data-inventory="c1"/);assert.match(node('#available').innerHTML,/data-inventory="c2"/);
  const other=(seat+1)%count;assert.equal(g.players[other].hand,undefined);node('#personalOwner').value=String(other);ui.render(g);assert.match(node('#personal').innerHTML,new RegExp('사람 '+other+' 개인판'));
 }
});
