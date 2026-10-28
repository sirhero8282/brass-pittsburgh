import {active,createGame,prepare,project} from './engine.mjs';
const clone=structuredClone;
export const SPEEDS={
 realtime:{fast:{initial:180000,increment:60000,max:180000},normal:{initial:300000,increment:120000,max:300000},slow:{initial:600000,increment:180000,max:600000},unlimited:{initial:null}},
 turnbased:{fast:{turn:12*3600000},normal:{turn:24*3600000},slow:{turn:48*3600000},unlimited:{turn:null}}
};
function fail(message,status=400){const error=Error(message);error.status=status;throw error;}
export function config(input){const mode=input.mode??'realtime',speed=input.speed??'normal';if(!SPEEDS[mode]?.[speed])fail('대국 모드 또는 속도를 확인하세요.');return {mode,speed};}
function name(value){if(typeof value!=='string'||!value.trim()||value.trim().length>20)fail('이름은 1~20자로 입력하세요.');return value.trim();}
export function newRoom(id,input,now=Date.now()){
 return {schema:1,id,config:config(input),status:'waiting',revision:0,createdAt:now,members:[{name:name(input.name),key:input.key,ready:false,lastSeen:now}],game:null,clock:null,receipts:[],votes:[],events:[],turnNotice:0};
}
export function remaining(room,now=Date.now()){
 if(!room.clock)return null;const c=room.clock;
 if(room.config.mode==='turnbased')return c.deadline==null?null:c.deadline-now;
 const total=c.banks[c.actor];return total==null?null:total-(now-c.since);
}
function startClock(room,now){const actor=active(room.game),s=SPEEDS[room.config.mode][room.config.speed];room.clock={actor,since:now,...(room.config.mode==='realtime'?{banks:[s.initial,s.initial,s.initial,s.initial]}:{deadline:s.turn==null?null:now+s.turn})};}
export function snapshot(room,seat,now=Date.now()){
 return {protocol:1,roomId:room.id,config:clone(room.config),status:room.status,revision:room.revision,seat,host:seat===0,serverNow:now,turnNotice:room.turnNotice,
 members:room.members.map((p,i)=>({seat:i,name:p.name,ready:p.ready,online:now-p.lastSeen<45000,color:['blue','red','yellow','purple'][i]})),lock:room.lock?.seat===seat?clone(room.lock.input):null,
 clock:clone(room.clock),remaining:remaining(room,now),votes:clone(room.votes),events:clone(room.events.slice(-12)),game:room.game?project(room.game,seat):null};
}
export function authenticate(room,key){const seat=room.members.findIndex(m=>m.key===key);if(seat<0)fail('재접속 키가 올바르지 않습니다.',401);return seat;}
export function join(room,input,now){if(room.status!=='waiting'||room.members.length>=4)fail('입장할 수 없는 방입니다.',409);if(room.members.some(m=>m.key===input.key))return;room.members.push({name:name(input.name),key:input.key,ready:false,lastSeen:now});room.revision++;}
function revision(room,input){if(input.revision!==room.revision)fail('다른 화면에서 진행이 바뀌었습니다. 최신 상태를 불러옵니다.',409);}
export function assertTurn(room,seat,input){revision(room,input);if(room.status!=='playing'||active(room.game)!==seat)fail('현재 내 차례가 아닙니다.',409);if(room.lock){const fixed=room.lock.input;if(room.lock.seat!==seat||input.type!==fixed.type||input.cardIndex!==fixed.cardIndex||fixed.choices.some((v,i)=>input.choices?.[i]!==v))fail('공개한 보상이 있는 행동은 바꾸거나 취소할 수 없습니다.',409);}}
export async function execute(room,seat,operation,input,now=Date.now(),seed=1){
 if(operation==='ping'){room.members[seat].lastSeen=now;return {changed:false};}
 const repeated=room.receipts.find(x=>x.seat===seat&&x.id===input.commandId);if(repeated)return {duplicate:true};
 if(typeof input.commandId!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(input.commandId))fail('행동 식별자가 필요합니다.');
 revision(room,input);let output={};
 if(operation==='ready'){
  if(room.status!=='waiting')fail('이미 게임을 시작했습니다.');room.members[seat].ready=input.ready===true;
 }else if(operation==='start'){
  if(seat!==0||room.status!=='waiting'||room.members.length!==4||room.members.some(m=>!m.ready))fail('네 명 모두 준비하면 방장이 시작할 수 있습니다.');
  room.game=createGame(seed,room.members.map(m=>m.name));room.status='playing';room.turnNotice++;startClock(room,now);
 }else if(operation==='lock'){
  assertTurn(room,seat,input);if(remaining(room,now)!=null&&remaining(room,now)<=0)fail('제한 시간이 지났습니다.',409);
  const result=await prepare(room.game,seat,input);if(!result.lockRequired||result.prefix.length!==input.choices.length)fail('공개할 비공개 보상이 없습니다.');
  room.lock={seat,input:{type:input.type,cardIndex:input.cardIndex,choices:clone(input.choices)}};
 }else if(operation==='action'){
  assertTurn(room,seat,input);if(remaining(room,now)!=null&&remaining(room,now)<=0)fail('제한 시간이 지났습니다. 다른 참가자의 연장 또는 중단 결정을 기다려 주세요.',409);
  const result=await prepare(room.game,seat,input,!!room.lock);if(!result.complete)fail('세부 선택을 모두 완료해 주세요.');
  const oldActor=active(room.game);if(room.config.mode==='realtime'&&room.clock.banks[oldActor]!=null)room.clock.banks[oldActor]=Math.max(0,remaining(room,now));
  room.game=result.game;room.votes=[];room.lock=null;const actor=active(room.game),s=SPEEDS[room.config.mode][room.config.speed];
  // A new turn starts only after the actor changes, including the opening round.
  if(!room.game.gameOver&&actor!==oldActor){room.turnNotice++;room.clock.actor=actor;room.clock.since=now;if(room.config.mode==='realtime'){if(room.clock.banks[actor]!=null)room.clock.banks[actor]=Math.min(s.max,room.clock.banks[actor]+s.increment);}else room.clock.deadline=s.turn==null?null:now+s.turn;}
  else if(room.config.mode==='realtime')room.clock.since=now;
  if(room.game.gameOver)room.status='finished';output.action=result.action;
 }else if(operation==='extend'){
  if(room.status!=='playing'||seat===active(room.game)||remaining(room,now)==null||remaining(room,now)>0)fail('시간이 초과된 다른 참가자의 차례만 연장할 수 있습니다.');
  const s=SPEEDS[room.config.mode][room.config.speed];room.clock.since=now;if(room.config.mode==='realtime')room.clock.banks[room.clock.actor]=s.initial;else room.clock.deadline=now+s.turn;
  room.events.push({at:now,text:room.members[seat].name+' 님이 제한 시간을 연장했습니다.'});
 }else if(operation==='stop-vote'){
  if(room.status!=='playing')fail('진행 중인 대국이 아닙니다.');room.votes=room.votes.filter(i=>i!==seat);if(input.vote===true)room.votes.push(seat);
  if(room.votes.length===4){room.status='stopped';room.events.push({at:now,text:'전원 동의로 대국을 중단했습니다.'});}
 }else fail('지원하지 않는 요청입니다.',404);
 room.revision++;room.receipts.push({seat,id:input.commandId}); // Retain every receipt for this game's lifetime.
 room.members[seat].lastSeen=now;return {...output,changed:true};
}
