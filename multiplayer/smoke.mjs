import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const endpoint=process.argv[2]||'http://127.0.0.1:8792',uiRoom=process.argv[3];
async function request(path,key,input,expected=200){const response=await fetch(endpoint+path,{method:input?'POST':'GET',headers:{...(input?{'Content-Type':'application/json'}:{}),...(key?{Authorization:'Bearer '+key}:{})},...(input?{body:JSON.stringify(input)}:{})});const value=await response.json();assert.equal(response.status,expected,JSON.stringify(value));return value;}
if(uiRoom){const keys=[];for(let i=1;i<4;i++){const key=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');const result=await request('/rooms/'+uiRoom+'/join',null,{name:'검증 참가자 '+i,key,requestId:crypto.randomUUID()},201);await request('/rooms/'+uiRoom+'/ready',key,{revision:result.snapshot.revision,commandId:crypto.randomUUID(),ready:true});keys.push(key);}await writeFile(new URL('../artifacts/ui-seats.json',import.meta.url),JSON.stringify({room:uiRoom,keys}));console.log('Three synthetic participants joined and are ready.');process.exit(0);}
for(const mode of ['realtime','turnbased']){
 const created=await request('/rooms',null,{name:'검증 0',mode,speed:'unlimited'},201),id=created.snapshot.roomId,keys=[created.key];let state=created.snapshot;
 for(let i=1;i<4;i++){const key=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');keys.push(key);const input={name:'검증 '+i,key,requestId:crypto.randomUUID()};state=(await request('/rooms/'+id+'/join',null,input,201)).snapshot;const retry=await request('/rooms/'+id+'/join',null,input);assert.equal(retry.snapshot.seat,i);}
 await request('/rooms/'+id+'/state','forged',null,401);
 for(let i=0;i<4;i++)state=(await request('/rooms/'+id+'/ready',keys[i],{revision:state.revision,commandId:crypto.randomUUID(),ready:true})).snapshot;
 state=(await request('/rooms/'+id+'/start',keys[0],{revision:state.revision,commandId:crypto.randomUUID()})).snapshot;
 const messages=[[],[],[],[]],sockets=keys.map((key,i)=>{const socket=new WebSocket(endpoint.replace(/^http/,'ws')+'/rooms/'+id+'/socket',['brass.'+key]);socket.addEventListener('message',e=>messages[i].push(JSON.parse(e.data).snapshot));return socket;});
 await Promise.all(sockets.map(socket=>new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});})));
 let count=0;while(state.status==='playing'){
  const actor=state.game.order[state.game.cursor],input={revision:state.revision,commandId:crypto.randomUUID(),type:'패스',cardIndex:0,choices:[]};
  if(count===0){const preview=await request('/rooms/'+id+'/prepare',keys[actor],input);assert.equal(preview.complete,true);assert.equal(preview.preview.seed,undefined);}
  const result=await request('/rooms/'+id+'/action',keys[actor],input);state=result.snapshot;
  if(count===0){const repeated=await request('/rooms/'+id+'/action',keys[actor],input);assert.equal(repeated.duplicate,true);assert.equal(repeated.snapshot.game.turn,state.game.turn);}
  count++;assert.ok(count<=124);
 }
 assert.equal(count,124);assert.equal(state.status,'finished');
 // A fresh authenticated read restores each seat, including only its own hand.
 for(let i=0;i<4;i++){const restored=(await request('/rooms/'+id+'/state',keys[i])).snapshot;assert.equal(restored.game.turn,state.game.turn);assert.equal(restored.game.seed,undefined);restored.game.players.forEach((p,j)=>assert.equal('hand'in p,i===j));assert.ok(messages[i].length>1);for(const snapshot of messages[i]){assert.equal(snapshot.seat,i);snapshot.game.players.forEach((p,j)=>assert.equal('hand'in p,i===j));}sockets[i].close();}
 console.log(JSON.stringify({mode,actions:count,websocketMessages:messages.map(x=>x.length),status:state.status,restore:true,hiddenHands:true,idempotency:true}));
}
const denied=await fetch(endpoint+'/rooms',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,403);
console.log('HTTP/WebSocket integration passed for both modes.');
