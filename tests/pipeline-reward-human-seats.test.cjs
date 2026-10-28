const test=require('node:test'),assert=require('node:assert/strict');
test('online human sale: every 2P/4P seat and pipe owner is preserved through choice replay and seat swapping',async()=>{
 const E=await import('../multiplayer/engine.mjs');
 for(const map of ['two','four']){const count=map==='two'?2:4,city=map==='two'?'피츠버그':'시카고',field=map==='two'?'베낭고 유전':'트랜턴 유전',merchant=map==='two'?'서부':'이즈브리지';
 for(let user=0;user<count;user++)for(let owner=0;owner<count;owner++)for(const tile of ['pipe3','pipe5','pipe10']){
  const g=E.createGame(230,Array.from({length:count},(_,i)=>'seat '+i),map);g.order=[user,...Array.from({length:count},(_,i)=>i).filter(i=>i!==user)];g.cursor=0;g.round=2;g.actionCount=0;g.players.forEach(p=>{p.money=30;p.vp=0;p.whiskey=0});g.players[user].hand=[city];g.cities[city][0]={owner:user,industry:'제조 상자',groupId:'m1',level:1,resource:0,resources:{},flipped:false,industryScoreAwarded:false};g.edges={['rail:'+ [city,merchant].sort().join('|')]:{owner:user,tile:'light'},['pipe:'+ [city,field].sort().join('|')]:{owner,tile}};g.setup.merchant[merchant]='제조 상자 · 최초 +6VP';g.merchantUsed[merchant]=true;g.setup.quality={};g.oilfields[field]=2;Object.values(g.setup.oil).forEach(o=>o.revealed=true);
  const before=JSON.stringify(g),input={type:'판매',cardIndex:0,choices:[]};let result;
  for(let step=0;step<15;step++){result=await E.prepare(g,user,input);if(result.complete)break;assert.ok(result.choice,result);input.choices.push(result.choice.options[0].index)}
  assert.equal(result.complete,true);assert.equal(JSON.stringify(g),before);assert.equal(result.game.cities[city][0].flipped,true);assert.equal(result.game.oilfields[field],1);
  for(let seat=0;seat<count;seat++){assert.equal(result.game.players[seat].vp,seat===owner?(tile==='pipe3'?3:tile==='pipe5'?5:0):0,`${map}/${user}/${owner}/${tile}/seat${seat}`);assert.equal(result.game.players[seat].money,30+(seat===owner&&tile==='pipe10'?10:0))}
 }
 }
});
