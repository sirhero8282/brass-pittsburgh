(function(root){
'use strict';
const KEY='brass-pittsburgh-four-player-v1',COLORS=['blue','red','yellow','purple'];
const clone=x=>structuredClone(x), personal=['money','vp','income','spent','removed','networkBuilt','hand','deck','discard','lastAutomaAction'];
const ai=['aiPlanning','aiPlanHistory','aiPlanCooldowns','aiDevelopmentLedger','aiActionStats','aiGeneratedRuleRuntime'];
const shared=['setup','cities','edges','oilfields','oilCities','markets','merchantUsed','routeRewardsClaimed','oilRewardsClaimed','eraTwoOilFilled'];
function validColors(colors){return Array.isArray(colors)&&colors.length===4&&new Set(colors).size===4&&colors.every(c=>COLORS.includes(c))}
// Older 4P saves omitted this entire market. Never replenish an existing stock.
function restoreMissingMarkets(g){if(g.markets&&!Object.hasOwn(g.markets,'필라델피아'))g.markets['필라델피아']={강철:2,코크스:1};return g}
function createGame(data,colors=COLORS,seed=Date.now()>>>0){
 if(!validColors(colors))throw Error('서로 다른 네 색상을 선택해 주세요.');
 const core=root.createFourCore(),base=core.fresh(),deck=core.shuffle(Object.entries(data.cardCounts).flatMap(([c,n])=>Array(n).fill(c)),seed+9);
 const players=colors.map((color,i)=>{const p={name:i?'오토마 '+i:'플레이어',color,whiskey:0,lightTrains:0,freeDevelop:0,qualityClaimed:[],upgradeIndustryScores:{},upgradeSewingScores:{},strategy:['balanced','balanced','industry','network'][i],difficulty:'standard'};for(const k of personal)p[k]=clone(base[k]);for(const k of ai)p[k]=clone(base[k].automa);p.hand=deck.slice(i*16,i*16+8);p.deck=deck.slice(i*16+8,i*16+16);p.discard=[p.deck.pop()];return p});
 const merchant=core.shuffle(['제조 상자 · 최초 +6VP','등유 · 최초 수입 +2칸','자동차 · 최초 +9VP','제조 상자/등유 · 최초 $12 → 빈 시장','제조 상자/등유 · 최초 $15 → 자동차'],seed);
 const oil=core.shuffle(['위스키 · 2시대 오일 2','수입 +2 · 오일 2','수입 +3 · 오일 1','$8 · 오일 1','개발 1회 · 오일 3'],seed+2);
 const setup={quality:Object.fromEntries(core.shuffle(['수입 −4 / +13VP','$25 / 개발 2회','$15 / +8VP','+9VP','수입 +8 / +7VP','수입 +10 / +7VP'],seed+1).slice(0,3).map((v,i)=>[['5★','6★','7★'][i],v])),merchant:Object.fromEntries(['이즈브리지','캐나다','남부','보스턴'].map((c,i)=>[c,merchant[i]])),oil:Object.fromEntries(data.locations.filter(l=>l.oil).map((l,i)=>[l.name,{value:oil[i],revealed:false}]))};
 setup.merchantOriginal=clone(setup.merchant);
 const markets={};for(const l of data.locations.filter(x=>x.price)){const raw=['털리도','클락스버그','윌크스-배리'].includes(l.name);markets[l.name]=raw?{철:3,석탄:3}:{강철:2,코크스:1}}
 return {schema:'pittsburgh-four-player-v1',seed,era:1,round:1,turn:1,order:core.shuffle([0,1,2,3],seed+3),cursor:0,actionCount:0,players,setup,markets,cities:Object.fromEntries(data.locations.filter(l=>l.slots.length).map(l=>[l.name,l.slots.map(()=>core.emptySlot())])),edges:{},oilfields:Object.fromEntries(data.locations.filter(l=>l.oil).map(l=>[l.name,0])),oilCities:{},merchantUsed:{},routeRewardsClaimed:[],oilRewardsClaimed:{},eraTwoOilFilled:false,logs:[],eraScores:{},gameOver:null};
}
function active(g){return g.order[g.cursor]}
function coreFor(g){return g?.map==='two'?root.createTwoCore():root.createFourCore()}
function project(g,index=active(g)){
 const core=coreFor(g),s=core.fresh(),p=g.players[index],others=g.players.filter((_,i)=>i!==index);
 Object.assign(s,{era:g.era,round:g.round,seed:g.seed+index*7919,turn:g.turn,actionNo:g.actionCount+1,turnOwner:'automa',_active:index,_actionCount:g.actionCount,_players:clone(g.players),setupLocked:true,gameMode:'full',aiStrategy:p.strategy,aiDifficulty:p.difficulty,logs:[],history:[],eraScores:{},aiPolicy:null,aiGeneratedRules:[]});
 for(const k of shared)s[k]=clone(g[k]);restoreMissingMarkets(s);for(const k of personal)s[k]=clone(p[k]);for(const k of ai)s[k]={automa:clone(p[k]),player:clone(others[0][k])};
 Object.assign(s,{playerMoney:others.reduce((a,b)=>a+b.money,0)/others.length,playerIncome:Math.max(...others.map(x=>x.income)),playerVP:Math.max(...others.map(x=>x.vp)),playerSpent:others.reduce((a,b)=>a+b.spent,0)/others.length,opponentSpent:others.reduce((a,b)=>a+b.spent,0)/others.length,playerRemoved:clone(others[0].removed),playerNetworkBuilt:clone(others[0].networkBuilt),playerHand:[],playerDeck:[],playerDiscard:[],bonus:{automa:{위스키:p.whiskey},player:{}},lightTrains:{automa:p.lightTrains,player:others.reduce((a,b)=>a+b.lightTrains,0)},freeDevelop:{automa:p.freeDevelop,player:0},qualityClaimed:{automa:clone(p.qualityClaimed),player:others.flatMap(x=>x.qualityClaimed)},upgradeIndustryScores:Object.fromEntries(Object.entries(p.upgradeIndustryScores).map(([e,n])=>[e,{automa:n,player:0}])),upgradeSewingScores:Object.fromEntries(Object.entries(p.upgradeSewingScores).map(([e,n])=>[e,{automa:n,player:0}]))});
 for(const piece of [...Object.values(s.cities).flat(),...Object.values(s.oilCities),...Object.values(s.edges)])if(Number.isInteger(piece.owner)){piece._fourOwner=piece.owner;piece.owner=piece.owner===index?'automa':'player'}
 for(const [field,owner]of Object.entries(s.oilRewardsClaimed))if(Number.isInteger(owner))s.oilRewardsClaimed[field]='p'+owner; // Owner zero is a valid, already claimed reward.
 // Claim IDs are audit metadata only; they must remain real IDs between transactions.
 core.set(s);return core;
}
function commit(g,core,index=active(g)){
 const s=core.get(),p=s._players[index];for(const k of personal)p[k]=clone(s[k]);for(const k of ai)p[k]=clone(s[k].automa);p.whiskey=s.bonus.automa.위스키||0;p.lightTrains=s.lightTrains.automa;p.freeDevelop=s.freeDevelop.automa||0;p.qualityClaimed=clone(s.qualityClaimed.automa);p.upgradeIndustryScores=Object.fromEntries(Object.entries(s.upgradeIndustryScores||{}).map(([e,x])=>[e,x.automa||0]));p.upgradeSewingScores=Object.fromEntries(Object.entries(s.upgradeSewingScores||{}).map(([e,x])=>[e,x.automa||0]));g.players=s._players;
 for(const k of shared)g[k]=clone(s[k]);for(const piece of [...Object.values(g.cities).flat(),...Object.values(g.oilCities),...Object.values(g.edges)]){if(piece.owner==='automa')piece.owner=index;else if(piece.owner==='player')piece.owner=piece._fourOwner;delete piece._fourOwner;}
 for(const [k,v] of Object.entries(g.oilRewardsClaimed)){if(v==='automa')g.oilRewardsClaimed[k]=index;else if(/^p[0-3]$/.test(v))g.oilRewardsClaimed[k]=Number(v[1])}
 g.logs.push(...s.logs.slice().reverse().map(l=>({...l,actor:index,name:g.players[index].name})));g.logs=g.logs.slice(-400);
}
function scoreEra(g){
 if(g.eraScores[g.era])return;const totals=[];
 for(let i=0;i<g.players.length;i++){const core=project(g,i),before=core.get().vp;core.score();const s=core.get();g.players[i].vp=s.vp;totals.push({player:i,industry:s.eraScores[g.era].industry.automa,network:s.eraScores[g.era].network.automa,added:s.vp-before});for(const [city,slots]of Object.entries(s.cities))slots.forEach((p,j)=>{if(p.owner==='automa')g.cities[city][j].industryScoreAwarded=p.industryScoreAwarded});for(const [field,p]of Object.entries(s.oilCities))if(p.owner==='automa')g.oilCities[field].industryScoreAwarded=p.industryScoreAwarded;}
 g.eraScores[g.era]=totals;g.logs.push({title:g.era+'시대 점수 정산',detail:totals.map(x=>g.players[x.player].name+' +'+x.added+'VP').join(' · ')});
}
function settleIncome(g){if(g.era===2&&g.round===8)return;const core=coreFor(g);for(const p of g.players){const level=core.incomeLevelAt(p.income);if(p.money+level>=0)p.money+=level;else{p.money=0;p.whiskey=0;p.vp-=40;p.income=10;p.aiActionStats.loansSinceBankruptcy=0;g.logs.push({title:p.name+' 파산',detail:'현금·위스키 반납, −40VP, 수입 10번 칸으로 복귀'});}}}
function next(g,data){
 const p=g.players[active(g)],limit=g.era===1&&g.round===1?1:2;g.actionCount++;g.turn++;
 if(g.actionCount<limit)return;while(p.hand.length<8&&p.deck.length)p.hand.push(p.deck.shift());g.actionCount=0;g.cursor++;if(g.cursor<g.players.length)return;
 const order=[...g.order].sort((a,b)=>g.players[a].spent-g.players[b].spent);settleIncome(g);
 if(g.round===8){scoreEra(g);if(g.era===2){const rank=g.players.map((_,i)=>i).sort((a,b)=>g.players[b].vp-g.players[a].vp||g.players[b].income-g.players[a].income);g.gameOver={rank,winners:rank.filter(i=>g.players[i].vp===g.players[rank[0]].vp&&g.players[i].income===g.players[rank[0]].income)};g.cursor=g.players.length-1;return}
  for(const [id,e]of Object.entries(g.edges))if(id.startsWith('rail:')&&e.tile==='light'){g.players[e.owner].lightTrains--;delete g.edges[id];g.routeRewardsClaimed=g.routeRewardsClaimed.filter(x=>x!==id)}
  const core=coreFor(g);for(const slots of Object.values(g.cities))for(let i=0;i<slots.length;i++){if(slots[i].owner!=='none'&&slots[i].level===1)slots[i]=core.emptySlot();else if(slots[i].flipped)slots[i].industryScoreAwarded=false}for(const s of Object.values(g.oilCities))if(s.flipped)s.industryScoreAwarded=false;
  g.era=2;g.round=1;const deck=core.shuffle(Object.entries(data.cardCounts).flatMap(([c,n])=>Array(n).fill(c)),g.seed+209);g.players.forEach((p,i)=>{p.hand=deck.slice(i*16,i*16+8);p.deck=deck.slice(i*16+8,i*16+16);p.discard=[]});const view=project(g,order[0]);view.refill();commit(g,view,order[0]);
 }else g.round++;
 g.order=order;g.cursor=0;for(const p of g.players)p.spent=0;
}
function list(g){if(g.gameOver)return [];return project(g).candidates()}
function humanList(g,cardIndex){if(g.gameOver||active(g)!==0||!Number.isInteger(cardIndex)||!g.players[0].hand[cardIndex])return [];const core=project(g);core.get()._selectedCardIndex=cardIndex;return core.candidates().map(a=>({...a,humanCardIndex:cardIndex}))}
async function chooseAsync(g,yieldFrame=()=>Promise.resolve(),cancelled=()=>false){if(g.gameOver)throw Error('게임이 종료되었습니다.');const core=project(g),steps=core.chooseSteps();let r;do{if(cancelled())return null;r=steps.next();if(!r.done)await yieldFrame()}while(!r.done);if(cancelled())return null;const s=core.get();return {...r.value,fourPlanning:Object.fromEntries(ai.map(k=>[k,clone(s[k].automa)]))}}
function choose(g){if(g.gameOver)throw Error('게임이 종료되었습니다.');const core=project(g),result=core.choose()||core.get().current;if(!result)throw Error('선택할 행동이 없습니다.');const s=core.get();return {...result,fourPlanning:Object.fromEntries(ai.map(k=>[k,clone(s[k].automa)]))}}
function perform(g,data,candidate){
 if(g.gameOver)throw Error('게임이 종료되었습니다.');const copy=clone(g),core=project(copy);
 // Restore only the proposed actor's private planning memory; recompute legal payloads.
 if(candidate.fourPlanning)for(const k of ai)core.get()[k].automa=clone(candidate.fourPlanning[k]);
 if(candidate.humanCardIndex!=null){if(active(g)!==0||!Number.isInteger(candidate.humanCardIndex)||!g.players[0].hand[candidate.humanCardIndex])throw Error('사용할 카드를 다시 선택하세요.');core.get()._selectedCardIndex=candidate.humanCardIndex;}
 const key=x=>JSON.stringify([x.type,x.track,x.index,x.city,x.slot,x.networkId,x.edge?.id,x.second?.edge?.id,x.sales,x.targets?.map(t=>t.id),x.whiskey||0,x.sourceCity]);
 const offered=core.candidates().find(x=>key(x)===key(candidate));if(!offered)throw Error('현재 상태에서 허용되지 않는 행동입니다. 다시 선택해 주세요.');
 core.execute({...offered,reason:candidate.reason,audit:candidate.audit,plan:candidate.plan,planRole:candidate.planRole});commit(copy,core);next(copy,data);return copy;
}
function validate(g){
 if(g?.schema!=='pittsburgh-four-player-v1'||g.players?.length!==4||!validColors(g.players.map(p=>p.color))||!Array.isArray(g.order)||new Set(g.order).size!==4||g.order.some(i=>!Number.isInteger(i)||i<0||i>3)||![1,2].includes(g.era)||!Number.isInteger(g.round)||g.round<1||g.round>8||!Number.isInteger(g.cursor)||g.cursor<0||g.cursor>3||![0,1].includes(g.actionCount))throw Error('올바른 4인 저장 파일이 아닙니다.');
 for(const k of shared.filter(k=>k!=='eraTwoOilFilled'))if(!g[k]||typeof g[k]!=='object')throw Error('저장 파일에 공용 보드 데이터가 없습니다.');if(!Array.isArray(g.logs)||!g.eraScores||!g.setup.merchant||!g.setup.quality||!g.setup.oil)throw Error('저장 파일에 진행 데이터가 없습니다.');
 for(const p of g.players){if(!Number.isFinite(p.money)||p.money<0||!Number.isFinite(p.vp)||!Number.isInteger(p.income)||p.income<0||p.income>99||!Array.isArray(p.hand)||!Array.isArray(p.deck)||!Array.isArray(p.discard)||!Array.isArray(p.networkBuilt)||!Array.isArray(p.qualityClaimed)||!p.removed||!p.aiActionStats||!p.upgradeIndustryScores||!p.upgradeSewingScores)throw Error('참가자 데이터가 잘못되었습니다.');}
 const pieces=[...Object.values(g.cities).flat(),...Object.values(g.oilCities),...Object.values(g.edges)];if(pieces.some(p=>!p||p.owner!=='none'&&(!Number.isInteger(p.owner)||p.owner<0||p.owner>3)))throw Error('타일 소유자 정보가 잘못되었습니다.');return g;
}
root.FourPlayer={KEY,COLORS,createGame,restoreMissingMarkets,active,project,commit,scoreEra,settleIncome,next,list,humanList,choose,chooseAsync,perform,validate,validColors};
})(globalThis);
