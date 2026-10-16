const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../dist/physical-board.js','utf8');
const sizing=source.slice(source.indexOf(' function oilRewardRect('),source.indexOf(' function oilStackAnchor('));
test('oil reward art fills the rig while its center, rotation and authored anchor stay fixed',()=>{
 for(const side of [80,90,100]){
  const base={x:563,y:731,w:side,h:side,left:563-side/2,top:731-side/2,rotation:19,manual:true};
  const before=JSON.stringify(base),ctx={oilTileRect:()=>base};vm.createContext(ctx);vm.runInContext(sizing,ctx);
  const reward=ctx.oilRewardRect({});
  assert.equal(reward.w,Math.round(side*1.12));assert.equal(reward.h,reward.w);
  assert.equal(reward.x,base.x);assert.equal(reward.y,base.y);assert.equal(reward.rotation,base.rotation);assert.equal(reward.manual,true);
  assert.equal(reward.left+reward.w/2,base.x);assert.equal(reward.top+reward.h/2,base.y);
  assert.equal(JSON.stringify(base),before);
 }
});
test('both hidden and revealed reward faces use enlarged sizing, not oil-city/rig/resource sizing',()=>{
 const fixed=source.slice(source.indexOf(' function fixedTileMarkup(){'),source.indexOf(' function constructionGuideTiles('));
 assert.match(fixed,/oilAsset\(setup.value,setup.revealed\),oilRewardRect\(entry\)/);
 assert.match(fixed,/oilRigAsset\(\),oilTileRect\(entry\)/);
 assert.match(source,/industryAsset\(piece\).*oilTileRect\(entry\)/);
 assert.match(source,/boardInfoHitRect\('oil',\{field\},oilTileRect\(entry\)/);
});
