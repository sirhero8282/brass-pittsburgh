const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {start}=require('../dist/runtime/visitor-metrics.js');
const visitor1='11111111-1111-4111-8111-111111111111';
const visitor2='22222222-2222-4222-8222-222222222222';

async function database() {
  const {SiteMetrics}=await import('../analytics/worker.mjs');
  const db=new DatabaseSync(':memory:');
  const storage={sql:{exec(query,...args){
    const statement=db.prepare(query);
    const rows=/^SELECT/i.test(query)?statement.all(...args):(statement.run(...args),[]);
    return {toArray:()=>rows,one:()=>{assert.equal(rows.length,1);return rows[0];}};
  }},transactionSync(callback){db.exec('BEGIN');try{const result=callback();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}};
  const server=new SiteMetrics({storage});
  return {server,db,pulse:id=>server.fetch(new Request('https://stats.example/collect',{method:'POST',body:JSON.stringify({visitorId:id})})),stats:async()=> (await server.fetch(new Request('https://stats.example/stats'))).json()};
}

test('daily count deduplicates tabs and reloads while presence expires without further writes',async t=>{
  let now=Date.UTC(2026,9,17,3);t.mock.method(Date,'now',()=>now);
  const b=await database();t.after(()=>b.db.close());
  await b.pulse(visitor1);await b.pulse(visitor1);await b.pulse(visitor2);
  let stats=await b.stats();assert.equal(stats.today,2);assert.equal(stats.active,2);assert.equal(stats.daily.length,30);
  assert.equal(stats.timezone,'Asia/Seoul');
  now+=149_000;assert.equal((await b.stats()).active,2);
  now+=1000;stats=await b.stats();assert.equal(stats.active,0);assert.equal(stats.today,2);
});
test('Korean midnight starts a new daily count without double-counting active browsers',async t=>{
  let now=Date.UTC(2026,9,16,14,59,59);t.mock.method(Date,'now',()=>now);
  const b=await database();t.after(()=>b.db.close());await b.pulse(visitor1);
  assert.equal((await b.stats()).daily[0].day,'2026-10-16');now+=2000;await b.pulse(visitor1);
  const stats=await b.stats();assert.equal(stats.daily[0].day,'2026-10-17');assert.equal(stats.today,1);assert.equal(stats.active,1);assert.equal(stats.daily[1].visitors,1);
});
test('records use hashes, reject malformed events and expire deduplication history',async t=>{
  let now=Date.UTC(2026,9,17,3);t.mock.method(Date,'now',()=>now);
  const b=await database();t.after(()=>b.db.close());await b.pulse(visitor1);
  const rows=b.db.prepare('SELECT * FROM visitors').all();assert.equal(rows[0].visitor.length,64);assert.ok(!JSON.stringify(rows).includes(visitor1));
  assert.equal((await b.pulse('invalid')).status,400);
  assert.equal((await b.server.fetch(new Request('https://stats.example/collect',{method:'POST',body:'x'.repeat(1025)}))).status,400);
  now+=3*86400000;await b.pulse(visitor2);
  assert.equal(b.db.prepare('SELECT COUNT(*) AS n FROM visitors').get().n,1);
  assert.equal((await b.stats()).daily[3].visitors,1);
});
test('gateway restricts origins and protects all statistics with a server secret',async()=>{
  const {handleRequest}=await import('../analytics/worker.mjs');let calls=0;
  const env={ALLOWED_ORIGIN:'https://sirhero8282.github.io',ADMIN_TOKEN:'test-only',METRICS:{idFromName:()=>1,get:()=>({fetch:async()=>{calls++;return Response.json({active:2});}})}};
  const request=(path,headers={})=>new Request('https://stats.example'+path,{headers:{Origin:env.ALLOWED_ORIGIN,...headers}});
  assert.equal((await handleRequest(request('/stats'),env)).status,401);
  assert.equal((await handleRequest(request('/stats',{Authorization:'Bearer wrong'}),env)).status,401);
  assert.equal((await handleRequest(request('/stats',{Origin:'https://other.example',Authorization:'Bearer test-only'}),env)).status,403);
  assert.equal((await handleRequest(request('/stats',{Authorization:'Bearer test-only'}),{...env,ADMIN_TOKEN:''})).status,401);
  assert.equal(calls,0);
  const response=await handleRequest(request('/stats',{Authorization:'Bearer test-only'}),env);
  assert.equal(response.status,200);assert.equal(calls,1);assert.equal(response.headers.get('Access-Control-Allow-Origin'),env.ALLOWED_ORIGIN);
});
test('tracker is completely disabled with no endpoint or unavailable storage',()=>{
  assert.doesNotThrow(()=>start({endpoint:''}));assert.doesNotThrow(()=>start({endpoint:'http://insecure.example'}));
  let timers=0;start({endpoint:'https://stats.example',storage:{getItem:()=>{throw Error('denied');}},setInterval:()=>timers++});assert.equal(timers,0);
});
test('tracker shares browser identity, pauses hidden tabs and cleans up timers',async()=>{
  const data=new Map(),requests=[],listeners=new Map();let tick,cleared=false;
  const doc={visibilityState:'visible',addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)};
  const options={endpoint:'https://stats.example',storage:{getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)},crypto:{randomUUID:()=>visitor1},fetch:async(url,options)=>requests.push({url,...options}),document:doc,setInterval:(fn,delay)=>{tick=fn;assert.equal(delay,60000);return 1;},clearInterval:id=>{assert.equal(id,1);cleared=true;}};
  const stop=start(options);await Promise.resolve();assert.equal(requests.length,1);assert.equal(requests[0].url,'https://stats.example/collect');
  assert.equal(JSON.parse(requests[0].body).visitorId,visitor1);assert.equal(requests[0].credentials,'omit');assert.equal(requests[0].referrerPolicy,'no-referrer');
  doc.visibilityState='hidden';await tick();assert.equal(requests.length,1);
  doc.visibilityState='visible';await listeners.get('visibilitychange')();assert.equal(requests.length,2);
  stop();await tick();assert.equal(requests.length,2);assert.ok(cleared);assert.equal(listeners.size,0);
  const stop2=start({...options,crypto:{randomUUID:()=>visitor2}});await Promise.resolve();assert.equal(JSON.parse(requests.at(-1).body).visitorId,visitor1);stop2();
});
