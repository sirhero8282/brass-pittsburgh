// Local-only browser fixtures, independent from the production origin and save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist'),source=fs.readFileSync(path.join(root,'app.js'),'utf8');
function fixture(scenario){
 const ctx=vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null}});
 vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),ctx);
 vm.runInContext(`state=fresh();state.gameMode='full';state.setupLocked=true;state.era=2;state.round=8;state.actionNo=2;state.turnOwner='player';state.roundStarter='player';state.roundActions={player:1,automa:2};state.roundActionsEra=2;state.roundActionsRound=8;state.playerMoney=100;state.targetSelectMode='list';state.playerDeck=[];`,ctx);
 if(scenario==='pipeline')vm.runInContext(`state.round=4;state.roundActions={player:0,automa:0};state.roundActionsRound=4;state.actionNo=1;state.playerHand=['피츠버그'];Object.assign(slot('피츠버그',0),{owner:'player',industry:'석탄',groupId:'c2',flipped:true});Object.assign(slot('피츠버그',2),{owner:'automa',industry:'제철소',groupId:'s1',resource:2,resources:{철:2}});`,ctx);
 else if(scenario==='locomotive')vm.runInContext(`state.playerHand=['피츠버그'];state.playerRemoved['manufacturing:6']='developed';state.playerRemoved['manufacturing:7']='developed';Object.assign(slot('피츠버그',3),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:true});Object.assign(slot('피츠버그',0),{owner:'automa',industry:'코크스 공장',groupId:'o1',resource:1,resources:{코크스:1}});`,ctx);
 else if(scenario==='tie')vm.runInContext(`state.gameOver={winner:'tie',playerVP:138,automaVP:138};state.playerVP=138;state.vp=138;state.playerIncome=28;state.income=36;state.logs=[{title:'게임 종료',detail:'공동 승리'}];`,ctx);
 else vm.runInContext(`state.playerHand=['클리브랜드'];for(let i=0;i<3;i++)state.playerRemoved['steel:'+i]='developed';Object.assign(slot('피츠버그',2),{owner:'automa',industry:'제철소',groupId:'s2',resource:2,resources:{강철:2}});Object.assign(slot('피츠버그',3),{owner:'player',industry:'제조 상자',groupId:'m1',flipped:false});for(const [a,b] of [['피츠버그','클리브랜드'],['클리브랜드','이리'],['이리','버팔로'],['버팔로','캐나다']])state.edges[edgeId(a,b,'rail')]={owner:'player',tile:'normal'};state.edges[edgeId('피츠버그','트랜턴 유전','pipe')]={owner:'automa',tile:'normal'};state.oilfields['트랜턴 유전']=1;state.setup.oil['트랜턴 유전'].revealed=true;state.setup.merchant.캐나다='제조 상자 · 최초 +6VP';state.setup.quality={};`,ctx);
 return vm.runInContext('JSON.stringify(state)',ctx);
}
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/qa'){
  const data=fixture(url.searchParams.get('scenario'));
  let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">').replace('<body>','<body><script>localStorage.setItem("brass-p-next-v1",'+JSON.stringify(data)+');</script>');
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html);
 }
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.png':'image/png'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(8792,'127.0.0.1',()=>console.log('Browser QA: http://127.0.0.1:8792/qa?scenario=locomotive'));
