// The existing human rules execute on the server, including every explicit choice.
import '../dist/four-player/core.js';
import '../dist/four-player/engine.js';
import '../dist/four-player/human.js';
import data from '../dist/four-player/data.json' with { type: 'json' };

const F=globalThis.FourPlayer,H=globalThis.FourHuman,clone=structuredClone;
export const ACTIONS=['건설','네트워크','판매','개발','대출','패스'];
function secureShuffle(items){const result=[...items];for(let i=result.length-1;i>0;i--){const limit=4294967296-4294967296%(i+1);let n;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=limit);const j=n%(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
function deal(game,opening){const deck=secureShuffle(Object.entries(data.cardCounts).flatMap(([card,count])=>Array(count).fill(card)));game.players.forEach((p,i)=>{p.hand=deck.slice(i*16,i*16+8);p.deck=deck.slice(i*16+8,i*16+16);p.discard=opening?[p.deck.pop()]:[];});}
export function createGame(seed,names){const g=F.createGame(data,undefined,seed);g.players.forEach((p,i)=>{p.name=names[i];});deal(g,true);g.order=secureShuffle(g.order);const oil=secureShuffle(Object.values(g.setup.oil).map(x=>x.value));Object.values(g.setup.oil).forEach((tile,i)=>{tile.value=oil[i];});return g;}
export const active=game=>F.active(game);

// Swap the acting seat with zero for the retained human driver, then swap back.
// Board ownership, turn order, rewards and scores always retain real seat IDs.
export function swapSeat(game,seat){
 const g=clone(game);if(seat===0)return g;const map=i=>i===0?seat:i===seat?0:i;
 [g.players[0],g.players[seat]]=[g.players[seat],g.players[0]];g.order=g.order.map(map);
 for(const piece of [...Object.values(g.cities).flat(),...Object.values(g.edges),...Object.values(g.oilCities)])if(Number.isInteger(piece.owner))piece.owner=map(piece.owner);
 for(const [key,owner]of Object.entries(g.oilRewardsClaimed))if(Number.isInteger(owner))g.oilRewardsClaimed[key]=map(owner);
 for(const log of g.logs)if(Number.isInteger(log.actor))log.actor=map(log.actor);
 for(const rows of Object.values(g.eraScores))for(const row of rows)if(Number.isInteger(row.player))row.player=map(row.player);
 if(g.gameOver){g.gameOver.rank=g.gameOver.rank.map(map);g.gameOver.winners=g.gameOver.winners.map(map);}return g;
}
class Choice extends Error{constructor(value){super('CHOICE_REQUIRED');this.value=value;}}
function text(value){return String(value??'').replace(/<[^>]*>/g,'');}
function mapLabel(x){return [x.city,x.i!=null?(x.i+1)+'번 칸':'',x.g?.name,x.n?.name,x.a&&x.a+'—'+x.b,x.e?.a&&x.e.a+'—'+x.e.b].filter(Boolean).join(' · ')||x.id;}

export async function prepare(game,seat,input,allowReveal=false){
 if(active(game)!==seat||game.gameOver)throw Error('현재 내 차례가 아닙니다.');
 if(!ACTIONS.includes(input.type)||!Number.isInteger(input.cardIndex)||input.cardIndex<0||input.cardIndex>=game.players[seat].hand.length)throw Error('사용할 카드와 행동을 확인하세요.');
 const choices=input.choices??[];if(!Array.isArray(choices)||choices.length>96||choices.some(i=>!Number.isInteger(i)||i<0||i>4096))throw Error('선택 기록이 잘못되었습니다.');
 let cursor=0,preview=null;const take=(label,items,show,hint,kind='pick',normalCount=items.length)=>{
  if(!allowReveal&&preview&&Object.keys(game.setup.oil).some(field=>!game.setup.oil[field].revealed&&preview.setup.oil[field].revealed))throw new Choice({lockRequired:true,prefix:choices.slice(0,cursor)});
  if(cursor===choices.length)throw new Choice({label,hint,kind,options:items.map((item,index)=>({index,label:text(show(item)),...(kind==='map'?{city:item.city,slot:item.i,route:item.id||item.e?.id,vanderbilt:index>=normalCount}:{})}))});
  const index=choices[cursor++];if(index>=items.length)throw Error('선택지가 변경되었습니다. 다시 선택하세요.');
  return kind==='map'?{...items[index],_includeV:index>=normalCount}:items[index];
 };
 try{
  const result=await H.run(swapSeat(game,seat),data,input.type,input.cardIndex,{
   targetSelectMode:'map',preview:value=>{preview=value;},
   pick:async(label,items,show,hint,vander=[])=>take(label,[...items,...vander],show,hint),
   map:async(kind,normal,vander=[],hint)=>take(kind==='build'?'건설 위치':'네트워크 경로',[...normal,...vander],mapLabel,hint,'map',normal.length)
  });
  if(cursor!==choices.length)throw Error('불필요한 선택 기록이 있습니다.');if(!result)throw Error('행동을 완료하지 못했습니다.');
  const after=swapSeat(result.game,seat);
  // Even the absence of a follow-up choice can depend on a secret cash reward.
  // Require the same lock for every newly opened field, not only choice prompts.
  if(!allowReveal&&Object.keys(game.setup.oil).some(field=>!game.setup.oil[field].revealed&&after.setup.oil[field].revealed))return {complete:false,lockRequired:true,prefix:choices.slice(0,cursor)};
  if(after.era!==game.era)deal(after,false);
  return {complete:true,game:after,action:result.action};
 }catch(error){if(error instanceof Choice)return error.value.lockRequired?{complete:false,lockRequired:true,prefix:error.value.prefix}:{complete:false,choice:error.value,preview:preview?swapSeat(preview,seat):null};throw error;}
}

// A cancellable preview must never reveal a drawn hand, an unopened reward,
// or the public effects from that reward. Secret-dependent choices require a lock.
export function previewFor(after,before,seat,allowReveal=false){
 const view=project(after,seat);view.players[seat].hand=clone(before.players[seat].hand);view.players[seat].handCount=before.players[seat].hand.length;view.players[seat].deckCount=before.players[seat].deck.length;
 view.logs=project(before,seat).logs;
 if(!allowReveal&&Object.keys(before.setup.oil).some(field=>!before.setup.oil[field].revealed&&after.setup.oil[field].revealed))return project(before,seat);
 return view;
}

export function project(game,viewer){
 const keys=['era','round','turn','order','cursor','actionCount','cities','edges','oilfields','oilCities','markets','merchantUsed','routeRewardsClaimed','oilRewardsClaimed','eraTwoOilFilled','eraScores','gameOver'];
 const view=Object.fromEntries(keys.map(k=>[k,clone(game[k])]));
 view.setup={merchant:clone(game.setup.merchant),quality:clone(game.setup.quality),oil:Object.fromEntries(Object.entries(game.setup.oil).map(([name,oil])=>[name,oil.revealed?clone(oil):{revealed:false}]))};
 const publicKeys=['name','color','money','vp','income','spent','removed','networkBuilt','whiskey','lightTrains','freeDevelop','qualityClaimed','upgradeIndustryScores','upgradeSewingScores','discard'];
 view.players=game.players.map((p,i)=>({...Object.fromEntries(publicKeys.map(k=>[k,clone(p[k])])),handCount:p.hand.length,deckCount:p.deck.length,...(i===viewer?{hand:clone(p.hand)}:{})}));
 view.logs=game.logs.map(l=>({actor:l.actor,name:l.name,title:l.title,detail:l.detail}));return view;
}
