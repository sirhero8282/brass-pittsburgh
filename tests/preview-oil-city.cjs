// Isolated local browser fixture; never loads or edits the production saved game.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const ctx=vm.createContext({structuredClone,console,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null}});
vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),ctx);
const fixture=vm.runInContext(`state=fresh();state.gameMode='full';state.setupLocked=true;state.era=2;state.round=3;state.turnOwner='player';state.roundStarter='player';state.roundActions={player:0,automa:2};state.roundActionsEra=2;state.roundActionsRound=3;state.playerHand=['등유'];state.playerDeck=[];state.playerRemoved=Object.fromEntries(Array.from({length:7},(_,i)=>['kerosene:'+i,'developed']));state.edges[edgeId('트랜턴 유전','피츠버그','pipe')]={owner:'player',tile:'normal'};state.oilfields['트랜턴 유전']=2;state.setup.oil['트랜턴 유전'].revealed=true;JSON.stringify(state)`,ctx);
http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/qa'){
    let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    html=html.replace('<head>','<head><base href="/">').replace('<body>','<body><script>localStorage.setItem("brass-p-next-v1",'+JSON.stringify(fixture)+');</script>');
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html);
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.png':'image/png'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(8791,'127.0.0.1',()=>console.log('Oil city QA: http://127.0.0.1:8791/qa'));
