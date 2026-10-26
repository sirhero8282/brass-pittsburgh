const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../dist/four-player/core.js');require('../dist/four-player/engine.js');
const data=require('../dist/four-player/data.json'),F=FourPlayer,source=fs.readFileSync(path.join(__dirname,'../dist/four-player/ui-table.js'),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Execute the actual presentation functions without bootstrapping a browser,
// starting an Automa, or accessing either mode's persisted game.
function declaration(name){
 const start=source.indexOf('function '+name+'(');assert.notEqual(start,-1,name);
 const lines=source.slice(start).split(/\r?\n/);if(lines[0].endsWith('}'))return lines[0];
 const end=lines.findIndex((line,i)=>i>0&&line==='}');assert.ok(end>0,name);return lines.slice(0,end+1).join('\n');
}
function element(width=0){const classes=new Set(),properties={},attributes={};return {
 innerHTML:'',textContent:'',hidden:false,disabled:false,dataset:{},clientWidth:width,clientHeight:620,properties,attributes,
 classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,on)=>{if(on??!classes.has(n)){classes.add(n);return true}classes.delete(n);return false}},
 style:{setProperty:(key,value)=>properties[key]=value},
 setAttribute:(key,value)=>attributes[key]=value,removeAttribute:key=>delete attributes[key],
 getBoundingClientRect:()=>({width,height:38}),append(node){node.parent=this},insertBefore(node){node.parent=this}
}}
function harness(names){const nodes=new Map(),lists=new Map(),frames=[];let wide=true;
 const get=selector=>{if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector)};
 const body=element(),game=F.createGame(data,undefined,77);game.order=[0,1,2,3];
 const context=vm.createContext({F,data,esc,core:createFourCore(),board:{colors:{blue:'#1585ff',red:'#f22',yellow:'#fc3',purple:'#a4c'}},
  $:get,$$:selector=>lists.get(selector)||[],document:{body},matchMedia:()=>({matches:wide}),window:{innerWidth:1600},
  getComputedStyle:()=>({columnGap:'8px'}),requestAnimationFrame:fn=>(frames.push(fn),frames.length),layoutFrame:0,
  localStorage:{getItem(){throw Error('Presentation must not read saves')},setItem(){throw Error('Presentation must not write saves')}},
  session:{game,pending:null,cardIndex:null,type:null,all:()=>[]},busy:false,cardFilter:'all',syncCards(){},
  actionIcons:{건설:'build',네트워크:'network',판매:'sale',개발:'develop',대출:'loan',패스:'pass'}
 });
 vm.runInContext(names.map(declaration).join('\n'),context);
 return {context,game,get,lists,body,setWide:value=>wide=value,flush:()=>{while(frames.length)frames.shift()()}};
}
function buttons(html){return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m=>({attributes:m[1],body:m[2]}))}

test('four-participant status uses the displayed preview values but the committed turn owner, without mutating either state',()=>{
 const h=harness(['renderStatus']),committed=h.game;committed.order=[2,0,3,1];committed.cursor=1;
 committed.players.forEach((p,i)=>{p.money=30+i;p.vp=7*i;p.spent=i});
 const preview=structuredClone(committed);preview.players[0].money=19;preview.players[0].spent=11;preview.cursor=3;
 const before=JSON.stringify([committed,preview]);h.context.renderStatus(preview,committed,true);
 const rows=[...h.get('#players').innerHTML.matchAll(/<tr class="([^"]*)">([\s\S]*?)<\/tr>/g)];
 assert.equal(rows.length,4);assert.deepEqual(rows.map(row=>row[1]),['','current','','']);
 assert.match(rows[0][2],/1\. 오토마 2/);assert.match(rows[1][2],/2\. 나/);assert.match(rows[2][2],/3\. 오토마 3/);assert.match(rows[3][2],/4\. 오토마 1/);
 assert.match(rows[1][2],/확정 대기/);assert.match(rows[1][2],/<td>\$19<\/td><td>\$11<\/td>/);
 assert.equal((h.get('#iconStatus').innerHTML.match(/<article /g)||[]).length,4);
 assert.equal((h.get('#turnQueue').innerHTML.match(/aria-current="step"/g)||[]).length,1);
 assert.equal(JSON.stringify([committed,preview]),before);
});

test('finished games do not advertise a current participant or enable human cards and actions',()=>{
 const h=harness(['renderStatus','isIndustry','renderHand','renderActions']);h.game.gameOver={winners:[0],rank:[0,1,2,3]};
 h.context.session.cardIndex=0;h.context.session.type='건설';h.context.renderStatus(h.game,h.game,false);h.context.renderHand(h.game);h.context.renderActions();
 assert.ok(!h.get('#players').innerHTML.includes('class="current"'));assert.ok(!h.get('#turnQueue').innerHTML.includes('aria-current'));
 assert.ok(!h.body.classList.contains('next-player-turn'));
 assert.ok(buttons(h.get('#nextHand').innerHTML).every(b=>/\bdisabled\b/.test(b.attributes)));
 const actions=buttons(h.get('#actions').innerHTML);assert.equal(actions.length,6);assert.ok(actions.every(b=>/\bdisabled\b/.test(b.attributes)));
});

test('compact card labels preserve physical indices for duplicate cards and filtered hands',()=>{
 const h=harness(['isIndustry','renderHand']);h.game.players[0].hand=['피츠버그','석탄','뉴욕','피츠버그','제철소'];
 h.context.cardFilter='city';h.context.session.cardIndex=3;
 const filters=['all','city','industry'].map(filter=>Object.assign(element(),{dataset:{filter}}));h.lists.set('[data-filter]',filters);
 const before=JSON.stringify(h.game);h.context.renderHand(h.game);const cards=buttons(h.get('#nextHand').innerHTML);
 assert.deepEqual(cards.map(b=>Number(b.attributes.match(/data-card="(\d+)"/)[1])),[0,1,2,3,4]);
 assert.deepEqual(cards.map((b,i)=>!(/\bhidden\b/.test(b.attributes))?i:null).filter(i=>i!==null),[0,2,3]);
 assert.deepEqual(cards.map((b,i)=>b.attributes.includes('aria-pressed="true"')?i:null).filter(i=>i!==null),[3]);
 assert.match(cards[3].body,/<span class="card-label">피츠버그<\/span>/);assert.match(cards[1].body,/<span class="card-kind">산업<\/span>/);
 assert.equal(h.get('#nextHandTitle').textContent,'내 손패 · 5장');assert.equal(filters[1].attributes['aria-pressed'],'true');
 assert.equal(JSON.stringify(h.game),before);
});

test('action selection and pending execution expose a single current step and the original selected card',()=>{
 const h=harness(['renderActions']),steps=['card','action','detail'].map(step=>Object.assign(element(),{dataset:{step}}));h.lists.set('.player-flow [data-step]',steps);
 h.game.players[0].hand=['석탄','피츠버그','이리'];h.context.session.cardIndex=2;h.context.session.type='건설';h.context.session.all=()=>[{type:'건설'},{type:'패스'}];
 h.context.renderActions();assert.equal(h.get('#nextSelection').textContent,'이리 · 건설');assert.equal(steps[2].attributes['aria-current'],'step');
 assert.equal(steps.filter(s=>s.classList.contains('active')).length,1);
 const actions=buttons(h.get('#actions').innerHTML);assert.equal(actions.filter(b=>!(/\bdisabled\b/.test(b.attributes))).length,2);
 h.context.session.pending={};h.context.renderActions();assert.equal(h.get('#nextSelection').textContent,'실행 결과 확인 중');
 assert.ok(buttons(h.get('#actions').innerHTML).every(b=>/\bdisabled\b/.test(b.attributes)));
});

test('desktop and phone layout move the existing menu and resize presentation without touching saved gameplay',()=>{
 const h=harness(['syncLayoutMeasurements','scheduleLayout','configureLayout']);
 h.get('#gameView').classList.add('active');h.get('.four-workspace').clientWidth=1580;h.get('.four-workspace').clientHeight=900;
 h.get('.available-column').getBoundingClientRect=()=>({width:158});h.get('#playerPanel').getBoundingClientRect=()=>({width:750});
 h.get('.map-note').getBoundingClientRect=()=>({height:18});h.get('#mapSelectionBar').hidden=true;
 const before=JSON.stringify(h.game);h.context.configureLayout();h.flush();
 assert.equal(h.get('nav').parent,h.get('header'));assert.ok(h.body.classList.contains('wide-layout-draft'));
 assert.ok(h.get('#playerPanel').classList.contains('draft-controls-split'));assert.equal(h.body.properties['--draft-map'],'834px');
 h.get('#mapSelectionBar').hidden=false;h.context.configureLayout();h.flush();assert.equal(h.body.properties['--draft-map'],'796px');
 h.setWide(false);h.context.configureLayout();h.flush();assert.equal(h.get('nav').parent,h.body);
 assert.ok(!h.body.classList.contains('wide-layout-draft'));assert.ok(!h.get('#playerPanel').classList.contains('draft-controls-split'));
 assert.equal(JSON.stringify(h.game),before);
});
