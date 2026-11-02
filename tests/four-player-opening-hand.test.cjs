const {test}=require('node:test'),assert=require('node:assert/strict');
require('../dist/four-player/core.js');require('../dist/four-player/engine.js');
const F=globalThis.FourPlayer,data=require('../dist/four-player/data.json');
const counts=p=>[p.hand.length,p.deck.length,p.discard.length];
test('4P: the opening discard comes from the dealt eight; all 64 return for era II',()=>{
 const seed=21,g=F.createGame(data,undefined,seed),deck=createFourCore().shuffle(Object.entries(data.cardCounts).flatMap(([c,n])=>Array(n).fill(c)),seed+9);
 for(const [i,p] of g.players.entries()){
  assert.deepEqual(counts(p),[7,8,1]);
  assert.deepEqual([...p.hand,...p.discard].sort(),deck.slice(i*16,i*16+8).sort());
 }
 for(let i=0;i<60;i++){
  const actor=F.active(g),p=g.players[actor];assert.ok(p.hand.length);p.discard.push(p.hand.pop());F.next(g,data);
  if(i<4)assert.deepEqual(counts(g.players[actor]),[8,6,2]);
 }
 assert.equal(g.era,2);for(const p of g.players)assert.deepEqual(counts(p),[8,8,0]);
 assert.deepEqual(g.players.flatMap(p=>[...p.hand,...p.deck]).sort(),deck.sort());
});
test('online 4P deals seven playable cards to each seat',async()=>{
 const {createGame}=await import('../multiplayer/engine.mjs');
 for(const p of createGame(21,['A','B','C','D'],'four').players)assert.deepEqual(counts(p),[7,8,1]);
});
