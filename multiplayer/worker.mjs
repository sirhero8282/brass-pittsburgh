import {DurableObject} from 'cloudflare:workers';
import {prepare,previewFor} from './engine.mjs';
import {authenticate,assertTurn,execute,join,newRoom,remaining,snapshot} from './room.mjs';
import {sendPush,validateSubscription} from './push.mjs';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
function randomKey(){return crypto.randomUUID()+crypto.randomUUID().replaceAll('-','');}
async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(request){const raw=await request.text();if(raw.length>16384)throw Object.assign(Error('요청이 너무 큽니다.'),{status:413});return JSON.parse(raw||'{}');}
export class GameRoom extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.queue=Promise.resolve();}
 fetch(request){const task=this.queue.then(()=>this.handle(request));this.queue=task.catch(()=>{});return task;}
 async handle(request){
  try{
   const url=new URL(request.url),op=url.pathname.split('/').at(-1),now=Date.now();let room=await this.ctx.storage.get('room');
   if(op==='create'){
    if(room)return json({error:'이미 생성된 방입니다.'},409);const input=await body(request),secret=randomKey();
    room=newRoom(input.id,{...input,key:await hash(secret)},now);await this.ctx.storage.put('room',room);return json({key:secret,snapshot:snapshot(room,0,now)},201);
   }
   if(!room)return json({error:'방을 찾을 수 없습니다.'},404);
   if(op==='join'){
    const input=await body(request);if(typeof input.requestId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(input.requestId))return json({error:'입장 식별자가 필요합니다.'},400);
    // A client-generated resume secret makes a lost join response safely retryable.
    if(typeof input.key!=='string'||!/^[a-zA-Z0-9_-]{32,100}$/.test(input.key))return json({error:'재접속 키가 필요합니다.'},400);
    const key=await hash(input.key),old=room.members.findIndex(m=>m.key===key);if(old>=0)return json({snapshot:snapshot(room,old,now)});
    join(room,{name:input.name,key},now);await this.ctx.storage.put('room',room);this.broadcast(room);return json({snapshot:snapshot(room,room.members.length-1,now)},201);
   }
   const header=request.headers.get('Authorization')||'',key=header.startsWith('Bearer ')?header.slice(7):'';
   // WebSocket credentials are sent in a protocol, never in a shareable URL.
   const protocol=request.headers.get('Sec-WebSocket-Protocol')?.split(',').map(s=>s.trim()).find(s=>s.startsWith('brass.'));
   const seat=authenticate(room,await hash(key||(protocol?protocol.slice(6):'')));
   if(op==='socket'&&request.headers.get('Upgrade')==='websocket'){
    const pair=new WebSocketPair(),[client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);server.serializeAttachment({seat});
    room.members[seat].lastSeen=now;await this.ctx.storage.put('room',room);server.send(JSON.stringify({snapshot:snapshot(room,seat,now)}));this.broadcast(room);
    return new Response(null,{status:101,webSocket:client,headers:protocol?{'Sec-WebSocket-Protocol':protocol}:{}});
   }
   if(op==='state'&&request.method==='GET')return json({snapshot:snapshot(room,seat,now)});
   if(request.method!=='POST')return json({error:'지원하지 않는 요청입니다.'},405);
   const input=await body(request);
   if(op==='subscribe'){
    if(!this.env.VAPID_PUBLIC_KEY||!this.env.VAPID_PRIVATE_KEY)return json({error:'서버 알림 설정을 준비 중입니다.'},503);
    const sub=validateSubscription(input,(this.env.ALLOWED_ORIGINS||'').split(',')),member=room.members[seat];member.subscriptions=(member.subscriptions||[]).filter(x=>x.endpoint!==sub.endpoint);if(member.subscriptions.length>=5)return json({error:'알림은 한 자리당 최대 다섯 기기에 등록할 수 있습니다.'},400);member.subscriptions.push(sub);await this.ctx.storage.put('room',room);return json({subscribed:true});
   }
   if(op==='unsubscribe'){room.members[seat].subscriptions=(room.members[seat].subscriptions||[]).filter(x=>x.endpoint!==input.endpoint);await this.ctx.storage.put('room',room);return json({subscribed:false});}
   if(op==='prepare'){
    assertTurn(room,seat,input);if(remaining(room,now)!=null&&remaining(room,now)<=0)return json({error:'제한 시간이 지났습니다.'},409);
    const result=await prepare(room.game,seat,input,!!room.lock);return json(result.lockRequired?{lockRequired:true,prefix:result.prefix}:result.complete?{complete:true,action:result.action,preview:previewFor(result.game,room.game,seat,!!room.lock)}:{complete:false,choice:result.choice,preview:result.preview?previewFor(result.preview,room.game,seat,!!room.lock):null});
   }
   const notice=room.turnNotice,result=await execute(room,seat,op,input,now,crypto.getRandomValues(new Uint32Array(1))[0]);
   await this.ctx.storage.put('room',room);if(result.changed){this.broadcast(room);await this.scheduleAlarm(room);if(room.turnNotice!==notice&&room.status==='playing')this.ctx.waitUntil(this.notify(room,'turn'));}return json({...result,snapshot:snapshot(room,seat,Date.now())});
  }catch(error){return json({error:error.message||'요청을 처리하지 못했습니다.'},error.status||400);}
 }
 broadcast(room){for(const ws of this.ctx.getWebSockets()){try{const {seat}=ws.deserializeAttachment();ws.send(JSON.stringify({snapshot:snapshot(room,seat)}));}catch{ws.close(1011,'reconnect');}}}
 webSocketMessage(ws,message){const task=this.queue.then(async()=>{if(message!=='ping')return;const {seat}=ws.deserializeAttachment();const room=await this.ctx.storage.get('room');if(!room)return;room.members[seat].lastSeen=Date.now();await this.ctx.storage.put('room',room);ws.send(JSON.stringify({snapshot:snapshot(room,seat)}));});this.queue=task.catch(()=>{});return task;}
 webSocketClose(ws,code){ws.close(code,'closed');}
 async scheduleAlarm(room){const deadline=room.clock?.deadline,now=Date.now();if(room.status==='playing'&&room.config.mode==='turnbased'&&deadline>now){await this.ctx.storage.setAlarm(deadline-now>3600000?deadline-3600000:deadline);}else await this.ctx.storage.deleteAlarm();}
 async notify(room,kind){if(!this.env.VAPID_PRIVATE_KEY||room.status!=='playing')return;const seat=room.game.order[room.game.cursor],member=room.members[seat],title=kind==='turn'?'피츠버그 · 내 차례입니다':kind==='reminder'?'피츠버그 · 마감이 다가옵니다':'피츠버그 · 제한 시간이 지났습니다';await Promise.allSettled((member.subscriptions||[]).map(sub=>sendPush(sub,this.env,{roomId:room.id,title,body:kind==='turn'?'대국을 열어 내 턴을 진행하세요.':kind==='reminder'?'내 턴의 남은 시간을 확인해 주세요.':'다른 참가자에게 시간 연장을 요청할 수 있습니다.'})));}
 alarm(){const task=this.queue.then(async()=>{const room=await this.ctx.storage.get('room');if(!room||room.status!=='playing')return;await this.notify(room,remaining(room)>0?'reminder':'timeout');await this.scheduleAlarm(room);});this.queue=task.catch(()=>{});return task;}
}
export default{
 async fetch(request,env){
  try{
  const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim());
  if(origin&&!allowed.includes(origin))return json({error:'허용되지 않은 사이트입니다.'},403);
  const headers={'Access-Control-Allow-Origin':origin||allowed[0]||'', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  const url=new URL(request.url);if(url.pathname==='/health'||url.pathname==='/push-key'){const response=json(url.pathname==='/health'?{ok:true,version:1}:{publicKey:env.VAPID_PUBLIC_KEY||null});Object.entries(headers).forEach(([k,v])=>response.headers.set(k,v));return response;}
  const match=url.pathname.match(/^\/rooms(?:\/([A-Z2-9]{8})\/([a-z-]+))?$/);if(!match)return json({error:'주소를 확인하세요.'},404);
  let id=match[1],op=match[2];
  if(!id){if(request.method!=='POST')return json({error:'방 생성 요청을 확인하세요.'},405);const input=await body(request);const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';id=[...crypto.getRandomValues(new Uint8Array(8))].map(x=>alphabet[x%alphabet.length]).join('');op='create';request=new Request('https://room/create',{method:'POST',body:JSON.stringify({...input,id})});}
  else request=new Request('https://room/'+op,request);
  const response=await env.ROOMS.get(env.ROOMS.idFromName(id)).fetch(request);
  if(response.status===101)return response;const result=new Response(response.body,response);Object.entries(headers).forEach(([k,v])=>result.headers.set(k,v));return result;
  }catch(error){const response=json({error:'요청 형식을 확인하세요.'},error.status||400);const origin=request.headers.get('Origin');if((env.ALLOWED_ORIGINS||'').split(',').includes(origin))response.headers.set('Access-Control-Allow-Origin',origin);return response;}
 }
};
