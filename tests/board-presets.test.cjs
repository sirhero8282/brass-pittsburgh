const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync(__dirname+'/../dist/board-presets.js','utf8');
const raw=JSON.parse(fs.readFileSync(__dirname+'/../dist/assets/data/pittsburgh-2p-layout.json','utf8'));
function boot(saved,{blocked=false}={}){
 const writes=[],select={value:'',addEventListener(_,fn){this.change=fn}},setup={querySelector:()=>({}),insertBefore(panel){this.panel=panel}},document={documentElement:{dataset:{}},getElementById:id=>id==='setupView'?setup:id==='boardPreset'?select:null,createElement:()=>({querySelector:()=>select})};
 let refreshes=0;const ctx={document,window:{PhysicalBoardRenderer:{refreshBoardPreset(){refreshes++}}},localStorage:{getItem(){if(blocked)throw Error('denied');return saved;},setItem(k,v){if(blocked)throw Error('denied');writes.push([k,v]);}}};
 vm.runInNewContext(script,ctx);return {api:ctx.window.PittsburghBoardPresets,document,select,writes,setup,refreshes:()=>refreshes};
}
test('new board defaults to the square web variant, retaining all authored coordinates',()=>{
 const b=boot(null),before=JSON.stringify(raw),layout=b.api.resolve(raw);
 assert.equal(b.api.getActive(),'new');assert.equal(b.select.value,'new');
 assert.equal(layout.board.width,2000);assert.equal(layout.board.height,2000);
 assert.match(layout.board.asset,/web-v27.webp$/);
 for(const key of Object.keys(raw).filter(k=>k!=='board'))assert.deepEqual(layout[key],raw[key]);
 assert.equal(JSON.stringify(raw),before);assert.notEqual(layout.board,raw.board);assert.deepEqual(b.writes,[]);
});
test('setup select switches the paired original image and exact original coordinate object without game writes',()=>{
 const b=boot(null);b.select.change({target:{value:'original'}});
 assert.strictEqual(b.api.resolve(raw),raw);assert.equal(b.api.getActive(),'original');assert.equal(b.refreshes(),1);
 assert.deepEqual(b.writes,[['brass-pittsburgh-board-preset-v1','original']]);
 assert.equal(b.document.documentElement.dataset.boardPreset,'original');
 b.api.choose('new');assert.match(b.api.resolve(raw).board.asset,/web-v27/);assert.equal(b.select.value,'new');
 assert.equal(b.api.choose('bad'),false);assert.equal(b.refreshes(),2);
});
test('remembered preset survives reload; corrupt/blocked storage safely defaults to new',()=>{
 assert.equal(boot('original').api.getActive(),'original');assert.equal(boot('corrupt').api.getActive(),'new');
 const b=boot(null,{blocked:true});assert.equal(b.api.getActive(),'new');assert.equal(b.api.choose('original'),true);
});
test('scripts initialize before renderer and retain industry, oil, route and hit layers',()=>{
 const html=fs.readFileSync(__dirname+'/../dist/index.html','utf8');
 assert.ok(html.indexOf('board-presets.js')<html.indexOf('src="./physical-board.js'));
 const board=fs.readFileSync(__dirname+'/../dist/physical-board.js','utf8');
 for(const layer of ['physical-construction-guide-layer','physical-industries-layer','physical-oil-resources-layer','physical-networks-layer','physical-interaction-layer'])assert.ok(board.includes(layer));
 assert.match(board,/authoredLayout=raw;refreshBoardPreset\(\)/);
 const css=fs.readFileSync(__dirname+'/../dist/physical-board.css','utf8');assert.match(css,/data-board-preset="new".*aspect-ratio:1!important/);
 assert.ok(fs.statSync(__dirname+'/../dist/assets/board/pittsburgh-2p-web-v27.webp').size>1000);
});
