// Additive exporter. The deployed two-player engine and its assets are never edited.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'), workspace=path.resolve(root,'../..'), out=path.join(root,'dist/four-player');fs.mkdirSync(out,{recursive:true});
const py='C:/Users/sirhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const workbook='C:/Users/sirhe/Documents/Codex/Pittsburgh_DATA_corrected.xlsx';
const result=cp.spawnSync(py,['-X','utf8','-c',`import openpyxl,json
w=openpyxl.load_workbook(${JSON.stringify(workbook)},read_only=True,data_only=True)
print(json.dumps({s:list(w[s].values) for s in w.sheetnames},ensure_ascii=False))`],{encoding:'utf8'});if(result.status)throw Error(result.stderr);
const sheets=JSON.parse(result.stdout),projectBytes=fs.readFileSync(path.join(workspace,'outputs/4p-editor-v1/Pittsburgh_4P_Current_Project.json')),project=JSON.parse(projectBytes);
const inventory=JSON.parse(fs.readFileSync(path.join(workspace,'outputs/4p-inventory-v1/catalog.json')));
const canonical=x=>String(x||'').replaceAll('콜롬버스','콜럼버스').replaceAll('윌크스배리','윌크스-배리').replaceAll('아이랜턴유전','트랜턴 유전');
const rows=sheets['3~4인 지도 DATA'].slice(1).filter(r=>Number.isInteger(r[0]));
const locations=rows.map(r=>({id:`location.3-4.${r[0]}`,name:canonical(r[1]),oil:r[2]==='유전',slots:r.slice(3,8).filter(x=>x&&x!==0).map(x=>x.split('/')),baseLink:Number(r[24])||0,price:Number(r[25])||0}));
const byName=Object.fromEntries(locations.map(x=>[x.name,x]));
// The workbook omits this price; the printed 4P board and retained 2P market both show $4.
byName['필라델피아'].price=4;
const routes=inventory.networks.map(n=>{const cat=project.catalog.find(x=>x.id===n.id);const from=locations.find(x=>x.id===cat.fromId)?.name,to=locations.find(x=>x.id===cat.toId)?.name; if(!from||!to)throw Error(n.id);let a=rows.find(r=>canonical(r[1])===from),b=rows.find(r=>canonical(r[1])===to),values=[];for(const [row,other] of [[a,to],[b,from]])for(let i=n.type==='rail'?8:18;i<(n.type==='rail'?18:24);i+=2)if(canonical(row[i])===other)values.push(row[i+1]??0);const clean=v=>String(v||'').replaceAll(' ','');if(!values.length||new Set(values.map(clean)).size>1)throw Error('Contradictory route '+n.id+JSON.stringify(values));return {...n,from,to,oil:n.type==='pipeline'?Number(values[0]):undefined,bonus:n.type==='rail'?values[0]:undefined,gameId:(n.type==='rail'?'rail:':'pipe:')+[from,to].sort().join('|')};});
const cardCounts={};for(const row of sheets['카드 목록'].slice(1))if(row[4]){const card=canonical(row[1]);cardCounts[card]=(cardCounts[card]||0)+1;}
if(Object.values(cardCounts).reduce((a,b)=>a+b,0)!==64)throw Error('4P deck must contain 64 cards');
// Keep the exact reviewed geometry and all stable IDs; omit only embedded photograph/editor payload.
const data={schema:1,source:{workbook:path.basename(workbook),coordinatesSHA256:crypto.createHash('sha256').update(projectBytes).digest('hex'),revision:307},locations,routes,cardCounts,catalog:project.catalog,layout:project.layout};
fs.writeFileSync(path.join(out,'data.json'),JSON.stringify(data));
let source=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');source=source.slice(0,source.indexOf("$('#decideBtn').onclick="));
function constant(name,value){const start=source.indexOf('const '+name+'='),end=source.indexOf(';',start);if(start<0||end<0)throw Error(name);source=source.slice(0,start)+'const '+name+'='+JSON.stringify(value)+source.slice(end);}
constant('OIL_FIELD_NAMES',locations.filter(x=>x.oil).map(x=>x.name));
constant('NODES',Object.fromEntries(locations.map(l=>{const p=project.layout.placements[l.id];return [l.name,[p.x*100,p.y*100,[...new Set(l.slots.flat())]]]})));
constant('RAIL',routes.filter(x=>x.type==='rail').map(x=>[x.from,x.to]));constant('PIPE',routes.filter(x=>x.type==='pipeline').map(x=>[x.from,x.to]));constant('PIPELINE_OIL',Object.fromEntries(routes.filter(x=>x.type==='pipeline').map(x=>[x.gameId,x.oil])));
constant('RAIL_REWARD',Object.fromEntries(routes.filter(x=>x.type==='rail'&&x.bonus).map(x=>[x.gameId,String(x.bonus)])));constant('BASE_LINK',Object.fromEntries(locations.filter(x=>x.baseLink).map(x=>[x.name,x.baseLink])));
constant('SLOT_RULES',Object.fromEntries(locations.filter(x=>x.slots.length).map(x=>[x.name,x.slots])));
constant('MARKET_DEF',Object.fromEntries(locations.filter(x=>x.price).map(x=>[x.name,{price:x.price,res:x.name==='털리도'||x.name==='클락스버그'||x.name==='윌크스-배리'?['철','석탄']:['강철','코크스']}])));
constant('CARDS',Object.entries(cardCounts).flatMap(([card,n])=>Array(n).fill(card)));
// A factory has no DOM bootstrap and never reads/writes the two-player save key.
source=source.replace('let state=load()', 'let state=fresh()');
source=source.replaceAll("'서부'","'이즈브리지'");
source=source.replaceAll("['이즈브리지','캐나다','보스턴']","['이즈브리지','캐나다','남부','보스턴']");
source=source.replaceAll('reward?.startsWith(sale.product)','fourAccept(reward,sale.product)').replaceAll('reward?.startsWith(product)','fourAccept(reward,product)');
source=source.replaceAll('state.setup.merchant[m]?.startsWith(product)','fourAccept(state.setup.merchant[m],product)').replaceAll('state.setup.merchant[sale.merchant]?.startsWith(sale.product)','fourAccept(state.setup.merchant[sale.merchant],sale.product)');
source=source.replace('state.merchantUsed[sale.merchant]=true',`let cash=Number(bonus.match(/\\$(\\d+)/)?.[1]||0);state.money+=cash;if(bonus.includes('→'))state.setup.merchant[sale.merchant]=bonus.split('→')[1].trim()+' · 보너스 소진';state.merchantUsed[sale.merchant]=true`);
const overrides=fs.readFileSync(path.join(root,'scripts/four-core-adapter.js'),'utf8');
fs.writeFileSync(path.join(out,'core.js'),`/* Generated from the unchanged deployed 2P engine. See scripts/build-four-player.cjs. */\n(function(root){root.createFourCore=function(){\n${source}\n${overrides}\n};})(typeof globalThis==='undefined'?window:globalThis);\n`);
const cardsDir=path.join(out,'cards');fs.mkdirSync(cardsDir,{recursive:true});
const cardSource='C:/Users/sirhe/Documents/Codex/brass_city_cards_4p_complete/final';
const names=['이리','클리브랜드','클락스버그','해리스버그','뉴욕','볼티모어','필라델피아','보스턴','윌크스-배리','베들레헴','버팔로','로체스터','피츠버그','디트로이트','인디애나폴리스','콜럼버스','털리도','새기노','시카고'];
const files=fs.readdirSync(cardSource).filter(x=>/^\d\d_.*\.png$/.test(x)).sort();if(files.length!==19)throw Error('19 city card images required');
// Sharp is a bundled build-only dependency, outside the source archive.
const sharp=require(path.join(workspace,'work/node_modules/sharp'));
(async()=>{for(let i=0;i<files.length;i++){await sharp(path.join(cardSource,files[i])).resize({width:360}).webp({quality:87}).toFile(path.join(cardsDir,`${i+1}.webp`));}data.cardImages=Object.fromEntries(names.map((n,i)=>[n,`four-player/cards/${i+1}.webp`]));const ind={제철소:'steelworks',등유:'kerosene','제조 상자':'manufacturing-crate',석탄:'coal'};for(const [name,slug]of Object.entries(ind)){await sharp(`C:/Users/sirhe/Documents/Codex/hobby-boardgame-brass/assets/physical/master/cards/industry/industry-card-${slug}-v01.png`).resize({width:360}).webp({quality:87}).toFile(path.join(cardsDir,slug+'.webp'));data.cardImages[name]=`four-player/cards/${slug}.webp`;}await sharp(path.join(workspace,'outputs/4p-retouch-v3/Pittsburgh_4P_WEB_v3_4000.png')).resize(2400,2400).webp({quality:91}).toFile(path.join(out,'board.webp'));fs.writeFileSync(path.join(out,'data.json'),JSON.stringify(data));require('./apply-four-presentation.cjs')();console.log('Exported four-player data, 23 card faces, board and isolated rule factory.');})().catch(e=>{console.error(e);process.exitCode=1});
