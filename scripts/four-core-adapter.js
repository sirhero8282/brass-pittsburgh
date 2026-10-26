// This runs inside a private generated factory, not inside the 2P application.
// In a rules view, active pieces are `automa`; all opponents are `player` with
// their immutable real owner attached. Ownership is restored on transaction commit.
function fourAccept(value,product){return String(value||'').split(' · ')[0].split('/').includes(product)}
const fourOriginalCardFor=automaCardFor;
automaCardFor=function(track,city){
 if(state._selectedCardIndex==null)return fourOriginalCardFor(track,city);
 const index=state._selectedCardIndex,card=state.hand[index];if(!card)return null;
 const industry={kerosene:'등유',coal:'석탄',manufacturing:'제조 상자',coke:'석탄',steel:'제철소'}[track];
 if(card===industry||!isOilField(city)&&card===city)return {index,card,joker:false};
 return whiskeyAvailable('automa',isOilField(city)?null:city)>0?{index,card,joker:true,penalty:0}:null;
};
function fourCandidates(){let opts=collectAutomaCandidates().opts;if(!opts.some(x=>x.type==='대출')&&canLoseIncome('automa',3))opts.push({type:'대출',title:'대출',score:0,cost:0,cardUse:{index:0,card:state.hand[0]},reason:'현금 $30 / 수입 −3단계'});if(state._selectedCardIndex!=null){opts=uniqueAutomaCandidates([...opts,...automaNetworkCandidates()]);opts=opts.map(a=>({...a,cardUse:a.type==='건설'?a.cardUse:{index:state._selectedCardIndex,card:state.hand[state._selectedCardIndex],joker:false}}))}return opts}
function save(){} // The outer four-player controller owns persistence and rendering.
function normalizeRoundActions(){state.turnOwner='automa';state.roundActions={automa:state._actionCount||0,player:0}}
function advanceAction(){state._executed=true;return true}
function slot(name,i){state.cities[name]??=[];while(state.cities[name].length<citySlots(name))state.cities[name].push(emptySlot());return state.cities[name][i]??=emptySlot()}
function citySlots(name){return SLOT_RULES[name]?.length||1} // Pittsburgh has FIVE slots on the 4P board.
function marketCapacity(city){return MARKET_DEF[city]?.res.includes('석탄')?3:2}
function saleCapacity(city,resource){const connected=connectedFrom(city);connected.add(city);return [...connected].filter(n=>MARKET_DEF[n]?.res.includes(resource)).reduce((n,m)=>n+Math.max(0,marketCapacity(m)-state.markets[m][resource]),0)}
function resourceMarketSaleProjection(city,resource,qty){const connected=connectedFrom(city);connected.add(city);let left=qty,units=0,cash=0,markets=[];for(const market of [...connected].filter(n=>MARKET_DEF[n]?.res.includes(resource)).sort((a,b)=>MARKET_DEF[b].price-MARKET_DEF[a].price)){let n=Math.min(left,Math.max(0,marketCapacity(market)-state.markets[market][resource]));if(!n)continue;left-=n;units+=n;cash+=n*MARKET_DEF[market].price;markets.push({market,units:n,cash:n*MARKET_DEF[market].price})}return {left,units,cash,vp:resource==='코크스'?units*4:0,markets}}
function sellProduced(city,resource,qty){let p=resourceMarketSaleProjection(city,resource,qty),sold=[];for(const m of p.markets){state.markets[m.market][resource]+=m.units;state.money+=m.cash;if(resource==='코크스')gainVP('automa',m.units*4);sold.push(m.market+' $'+m.cash)}return {left:p.left,sold}}
function fourRealOwner(piece){return piece?.owner==='automa'?state._active:piece?._fourOwner}
function fourCredit(owner,kind,amount){if(!amount)return;if(owner===state._active){if(kind==='income')return gainIncome('automa',amount);state[kind==='vp'?'vp':'money']+=amount;return}const p=state._players?.[owner];if(!p)throw Error('Missing actual component owner');if(kind==='income'){const before=p.income;p.income=Math.min(99,p.income+amount);return {before,after:p.income,level:incomeLevelAt(p.income)}}p[kind]+=amount}
function flipIndustryAt(node,index,detail=[]){let s=state.cities[node]?.[index];if(!s||s.flipped)return false;const left=s.resources&&Object.keys(s.resources).length?Object.values(s.resources).reduce((a,b)=>a+b,0):s.resource;if(left>0)return false;s.flipped=true;s.industryScoreAwarded=false;fourCredit(fourRealOwner(s),'income',groupIncomeGain(s.groupId));detail.push(node+' 산업 소진 · 실제 소유자 수입 반영');return true}
function applyOilReward(s){if(s.kind!=='oil')return '';const edge=state.edges[s.edge],owner=fourRealOwner(edge);fourCredit(owner,'money',s.tile==='pipe10'?10:0);fourCredit(owner,'vp',s.tile==='pipe5'?5:s.tile==='pipe3'?3:0);const oil=state.oilCities?.[s.field];if(s.oilCityLast&&oil&&!oil.flipped&&oil.resource===0){oil.flipped=true;oil.industryScoreAwarded=false;fourCredit(fourRealOwner(oil),'money',25)}return ' · 실제 송유관/오일 시티 소유자 보상 반영'}
function returnReservePipeline(previous){if(previous?.tile!=='reserve')return '';const owner=fourRealOwner(previous),list=owner===state._active?state.networkBuilt:state._players[owner].networkBuilt;const i=list.indexOf('reserve');if(i>=0)list.splice(i,1);return '비축 송유관 실제 소유자에게 반환'}
const fourOriginalPlace=placeNetworkTile;
placeNetworkTile=function(actor,n,e){const previous=state.edges[e.id],owner=fourRealOwner(previous),result=fourOriginalPlace(actor,n,e);if(n.id==='train-replace'&&previous?.owner==='player'){state.playerVP-=2;fourCredit(owner,'vp',2)}return result};
function applyRouteReward(actor,id){const reward=RAIL_REWARD[id];if(!reward||state.routeRewardsClaimed.includes(id))return null;state.routeRewardsClaimed.push(id);if(String(reward).startsWith('수입')){const spaces=Number(String(reward).match(/\d+/)?.[0]||0);gainIncome(actor,spaces);return {type:'income',text:'수입 +'+spaces+'칸'}}if(String(reward).includes('위스키'))return {type:'whiskey',text:gainWhiskey(actor,'노선 보너스').text};state.freeDevelop[actor]=(state.freeDevelop[actor]||0)+1;return {type:'develop',text:'무료 개발 1회'}}
return {
 fresh, get:()=>state, set:s=>{state=s}, groups:GROUPS, industries:INDUSTRIES, networks:NETWORKS,
 shuffle,incomeLevelAt,emptySlot,candidates:fourCandidates,chooseSteps:()=>automaDecisionSteps(false),
 humanRules:{GROUPS,NETWORKS,INDUSTRIES,NODES,PIPE,RAIL,MARKET_DEF,playerGroupUnlocked,playerGroupUsed,groupIncomeCost,canLoseIncome,buildLocations,isOilField,actorPlan,connectedFrom,resourceType,outputsFor,awardCoveredIndustry,industryLevel,syncIncomeLevel,gainIncome,loseIncome,gainVP,groupIncomeGain,networkRouteAvailable,bestEdgePlan,withNetworkSupply,replacementTrainAnalysis,networkBonusType,pipelineOilBonus,addOilToField,openOilfield,gainWhiskey,applyRouteReward,connectedRailBonuses,sourcePlan,oilFieldStock,sourceText,saleOilCost,qualityClaimedByAnyone,actorNetworkAnchors,actorSaleReadiness,group,captureSupplyMutationState,restoreSupplyMutationState,log,buildOilCity,edgeId,withPlayerBoard,completeGroup,slot},
 // Read-only presentation hooks: the same 2P component markup and unlock rules.
 presentation:{availableIndustryTileMarkup,boardLaneTitle,boardFacts,personalLayout:PERSONAL_BOARD_LAYOUT,networkLayout:PERSONAL_NETWORK_LAYOUT,
  unlocked:groupUnlocked,used:groupUsed,complete:completeGroup,networkRemaining:personalNetworkRemaining},
 choose:()=>{const steps=automaDecisionSteps(false);let r;do{r=steps.next()}while(!r.done);return r.value},
 execute:a=>{state.current=a;state._executed=false;execute();if(!state._executed)throw Error('행동이 실행되지 않았습니다.');return state},
 score:()=>{scoreIndustryForEra();scoreNetworkForEra('시대 종료')}, refill:refillEraTwoOil,
 // Narrow, non-UI rule hooks for ownership regression tests.
 rules:{sourcePlan,applyOilReward,flipIndustryAt,placeNetworkTile,sellProduced,applyRouteReward,executeAutomaSale,networkRouteAvailable,fourAccept}
};
