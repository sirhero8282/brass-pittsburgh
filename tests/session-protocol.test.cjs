const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLocalSession, SAVE_KEY } = require('../dist/runtime/local-session.js');
test('actual app loads and saves through the session boundary without changing its game state', () => {
  const fs=require('node:fs'), vm=require('node:vm');
  const data=new Map();const saveText={};
  const context=vm.createContext({structuredClone,console,setTimeout,clearTimeout,BrassSession:require('../dist/runtime/local-session.js'),localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},document:{querySelector:()=>saveText}});
  const source=fs.readFileSync(require('node:path').join(__dirname,'../dist/app.js'),'utf8');
  vm.runInContext(source.slice(0,source.indexOf("$('#decideBtn').onclick=")),context);
  vm.runInContext('state.playerMoney=47;save(false)',context);
  assert.equal(JSON.parse(data.get(SAVE_KEY)).playerMoney,47);
  assert.equal(vm.runInContext('gameSession.revision',context),1);
  assert.equal(vm.runInContext('load().playerMoney',context),47);
  assert.equal(saveText.textContent,'저장됨');
});
test('local session retains legacy saves and emits isolated snapshots only after persistence', () => {
  const data = new Map([[SAVE_KEY, '{"seed":1}']]);
  const session = createLocalSession({ storage: { getItem:key=>data.get(key), setItem:(key,value)=>data.set(key,value) } });
  assert.equal(JSON.parse(session.read()).seed, 1);
  let calls=0;
  const unsubscribe=session.subscribe(event=>{ calls++; assert.equal(JSON.parse(session.read()).seed,2); event.state.seed=99; });
  const state={seed:2};
  assert.equal(session.commit(state), 1);
  assert.equal(state.seed,2);
  assert.equal(JSON.parse(session.read()).seed,2);
  unsubscribe(); session.commit(state);
  assert.equal(calls,1);
});
test('failed persistence does not advance revision or notify; observer failure cannot break a saved game', () => {
  let calls=0;
  const failed=createLocalSession({storage:{setItem:()=>{throw Error('quota');}}});
  failed.subscribe(()=>calls++);
  assert.throws(()=>failed.commit({}),/quota/); assert.equal(failed.revision,0); assert.equal(calls,0);
  const errors=[];
  const session=createLocalSession({storage:{setItem:()=>{}},onError:error=>errors.push(error)});
  session.subscribe(()=>{throw Error('observer');});session.subscribe(()=>calls++);
  assert.equal(session.commit({}),1);assert.equal(calls,1);assert.equal(errors.length,1);
});
test('room commands carry identity, expected revision and a deduplication ID', async () => {
  const {validateCommand}=await import('../shared/room-protocol.mjs');
  const command={protocol:1,roomId:'room1',playerId:'seat3',commandId:'cmd1',expectedRevision:8,type:'build',payload:{city:'피츠버그'}};
  const copy=validateCommand(command); copy.payload.city='changed'; assert.equal(command.payload.city,'피츠버그');
  for(const override of [{protocol:2},{expectedRevision:-1},{expectedRevision:1.1},{playerId:''},{type:'set-state'},{payload:[]}]) assert.throws(()=>validateCommand({...command,...override}));
});
test('four seats receive only their own private view and cannot mutate authoritative state', async () => {
  const {createPlayerSnapshot}=await import('../shared/room-protocol.mjs');
  const room={roomId:'r1',revision:9,players:['p1','p2','p3','p4'],publicState:{turnOwner:'p3'},privateByPlayer:{p1:{hand:['a']},p2:{hand:['b']},p3:{hand:['c']},p4:{hand:['d']}},serverDeck:['secret']};
  const view=createPlayerSnapshot(room,'p3');
  assert.deepEqual(view.privateState,{hand:['c']}); assert.equal(view.privateByPlayer,undefined);assert.equal(view.serverDeck,undefined);
  view.privateState.hand[0]='changed';assert.equal(room.privateByPlayer.p3.hand[0],'c');
  assert.throws(()=>createPlayerSnapshot(room,'outsider'));assert.throws(()=>createPlayerSnapshot({...room,players:['p1','p1']},'p1'));
});
