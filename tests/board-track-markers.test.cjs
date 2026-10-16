const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync(__dirname+'/../dist/assets/data/pittsburgh-track-presentation.json','utf8'));
const source=fs.readFileSync(__dirname+'/../dist/board-track-markers.js','utf8');
class Node{constructor(tag){this.tag=tag;this.attributes={};this.children=[];this.style={};}setAttribute(k,v){this.attributes[k]=v;}append(...nodes){this.children.push(...nodes);}}
function boot(reduced=false){let time=0,id=0,cancelled=0,frames=new Map();const ctx={window:{PITTSBURGH_TRACK_PRESENTATION:data,matchMedia:()=>({matches:reduced})},document:{createElementNS:(_,tag)=>new Node(tag),visibilityState:'visible'},performance:{now:()=>time},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:n=>{cancelled++;frames.delete(n);}};vm.createContext(ctx);vm.runInContext(source,ctx);
 return {api:ctx.window.PittsburghTrackMarkers,svg:new Node('svg'),frames,get cancelled(){return cancelled;},tick(ms){time=ms;let current=[...frames.values()];frames.clear();current.forEach(fn=>fn(time));},now(ms){time=ms;}};
}
const layout={board:{width:2000,height:2000}},state={seed:1,playerVP:0,vp:0,playerIncome:10,income:10};
const markers=b=>b.svg.children.at(-1).children.filter(n=>n.attributes['data-track-marker']);
test('display tracks preserve the exact runtime income-position mapping',()=>{
 const app=fs.readFileSync(__dirname+'/../dist/app.js','utf8'),levels=JSON.parse(app.match(/const INCOME_LEVELS=(\[[^;]+\])/)[1]);
 for(const preset of ['new','original'])assert.deepEqual(data[preset].map(p=>p.income),levels);
});
test('track export contains 100 stable normalized anchors for each board, including the correct income association',()=>{
 for(const key of ['new','original']){assert.equal(data[key].length,100);data[key].forEach((p,i)=>{assert.equal(p.position,i);assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);});assert.equal(data[key][10].income,0);assert.equal(data[key][99].income,30);}
 assert.notDeepEqual(data.new[70],data.original[70]);
});
test('VP wraps, income clamps, perimeter paths follow each cell and turn at corners',()=>{
 const {api}=boot();assert.equal(api.position(102,'vp'),2);assert.equal(api.position(-1,'vp'),99);assert.equal(api.position(150,'income'),99);assert.equal(api.position(-1,'income'),0);
 const path=api.pathBetween(23,26,'vp',data.new);assert.deepEqual(Array.from(path.filter(p=>Number.isInteger(p.value)),p=>p.value),[23,24,25,26]);assert.ok(path.some(p=>p.x===data.new[24].x&&p.y===data.new[25].y));
 const wrap=api.pathBetween(99,101,'vp',data.new);assert.equal(wrap.at(-1).x,data.new[1].x);assert.equal(wrap.at(-1).y,data.new[1].y);
 const reverse=api.pathBetween(12,9,'income',data.new);assert.deepEqual(Array.from(reverse,p=>p.value),[12,11,10,9]);
 assert.ok(api.pathBetween(0,10000,'vp',data.new).length<220);
});
test('four tactile markers initialize without animation, overlap offsets, or gameplay mutation',()=>{
 const b=boot(),before=JSON.stringify(state);b.api.render(b.svg,layout,state,'new');const nodes=markers(b);assert.equal(nodes.length,4);assert.equal(b.frames.size,0);
 const blueIncome=nodes.find(n=>n.attributes['data-track-marker']==='player-income'),redIncome=nodes.find(n=>n.attributes['data-track-marker']==='automa-income');assert.notEqual(blueIncome.attributes.transform,redIncome.attributes.transform);
 assert.ok(blueIncome.children[1].children.some(n=>n.tag==='circle'));assert.ok(nodes[0].children[1].children.some(n=>n.tag==='path'));assert.equal(JSON.stringify(state),before);
 assert.ok(nodes.every(n=>n.style.pointerEvents==='none'));assert.equal(b.svg.children.at(-1).attributes['pointer-events'],'none');
});
test('rerenders do not restart travel; rapid changes rebase; completion leaves no frames',()=>{
 const b=boot();b.api.render(b.svg,layout,state,'new');b.api.render(b.svg,layout,{...state,playerVP:8},'new');assert.equal(b.frames.size,1);
 b.tick(200);const intermediate=markers(b)[0].attributes.transform;b.api.render(b.svg,layout,{...state,playerVP:8},'new');assert.equal(markers(b)[0].attributes.transform,intermediate);assert.equal(b.frames.size,1);
 b.api.render(b.svg,layout,{...state,playerVP:3},'new');assert.equal(markers(b)[0].attributes.transform,intermediate);
 b.tick(5000);assert.equal(b.frames.size,0);assert.equal(markers(b)[0].attributes['data-track-moving'],'false');assert.ok(b.cancelled>0);
});
test('reduced motion, preset changes and new games snap rather than replaying prior travel',()=>{
 for(const reduced of [true,false]){const b=boot(reduced);b.api.render(b.svg,layout,state,'new');b.api.render(b.svg,layout,{...state,playerVP:103},'new');if(reduced)assert.equal(b.frames.size,0);
  assert.ok(markers(b)[0].children.some(n=>n.tag==='text'&&n.textContent==='+100'));
  b.api.render(b.svg,layout,{...state,seed:2,playerVP:90},'original');assert.equal(b.frames.size,0);assert.ok(markers(b)[0].attributes.transform.includes(String(data.original[90].x*2000)));
 }
});
test('physical renderer mounts markers after board-local hit layers and mobile defaults to full fit',()=>{
 const physical=fs.readFileSync(__dirname+'/../dist/physical-board.js','utf8');assert.match(physical,/PittsburghTrackMarkers\?\.render\(svg,layout,\{playerVP:state.playerVP,vp:state.vp,playerIncome:state.playerIncome,income:state.income/);
 const next=fs.readFileSync(__dirname+'/../dist/next.js','utf8');assert.match(next,/mapZoom===1&&!window.PittsburghTrackMarkers/);
});
