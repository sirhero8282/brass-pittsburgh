/* UI transaction state. Selection and preview never advance the saved game. */
(function(root){
class FourFlow{
 constructor(F,data,game){this.F=F;this.data=data;this.game=structuredClone(game);this.history=Array.isArray(game.uiHistory)?game.uiHistory.slice(-12).map(g=>structuredClone(F.validate(g))):[];delete this.game.uiHistory;this.pending=null;this.revision=0;this.cardIndex=null;this.type=null;this.group=null;this.target=null;this.cache=null;if(game?.uiPending){const action=game.uiPending.action;delete this.game.uiPending;this.stage(action);}}
 display(){return this.pending?.after||this.game}
 serializable(){const saved=structuredClone(this.game);saved.uiHistory=structuredClone(this.history);if(this.pending)saved.uiPending={action:structuredClone(this.pending.action)};return saved}
 clear(){this.cardIndex=null;this.type=null;this.group=null;this.target=null;this.cache=null}
 selectCard(index){if(this.pending)throw Error('먼저 실행을 확정하거나 되돌려 주세요.');if(this.F.active(this.game)!==0||!this.game.players[0].hand[index])throw Error('현재 선택할 수 없는 카드입니다.');this.cardIndex=this.cardIndex===index?null:index;this.group=null;this.target=null;this.cache=null}
 selectType(type){if(this.pending)throw Error('먼저 실행을 확정하거나 되돌려 주세요.');this.type=type;this.group=null;this.target=null}
 all(){if(this.cardIndex==null)return [];if(!this.cache)this.cache=this.F.humanList(this.game,this.cardIndex);return this.cache}
 choices(){return this.all().filter(a=>(!this.type||a.type===this.type)&&(!this.group||(a.type==='건설'?a.track+':'+a.index:a.networkId)===this.group)&&(!this.target||this.matches(a,this.target)))}
 matches(a,target){if(target.kind==='slot'){const item=this.data.catalog.find(c=>c.id===target.id),city=this.data.locations.find(l=>l.id===item?.parentId)?.name,index=Number(target.id.split('.').pop())-1;return a.type==='건설'?a.city===city&&a.slot===index:a.type==='판매'&&a.sales.some(s=>s.city===city&&s.slot===index)}if(target.kind==='route'){const route=this.data.routes.find(r=>r.id===target.id);return a.edge?.id===route?.gameId}if(target.kind==='oil'){const city=this.data.locations.find(l=>l.id===target.id)?.name;return a.type==='건설'&&a.city===city}return false}
 stage(action){if(this.pending||this.F.active(this.game)!==0)throw Error('현재 실행할 수 없습니다.');const after=this.F.perform(this.game,this.data,action);this.pending={action:structuredClone(action),before:structuredClone(this.game),after};this.revision++;this.cache=null;return after}
 confirm(){if(!this.pending)throw Error('확정할 실행이 없습니다.');this.history.push(this.pending.before);this.history=this.history.slice(-12);this.game=this.pending.after;delete this.game.uiPending;this.pending=null;this.revision++;this.clear();return this.game}
 undo(){if(this.pending){this.game=this.pending.before;this.pending=null;}else if(this.history.length)this.game=this.history.pop();else return false;delete this.game.uiPending;this.revision++;this.clear();return true}
 applyAI(action,revision){if(this.pending||this.F.active(this.game)===0||this.game.gameOver||revision!==this.revision)return false;const next=this.F.perform(this.game,this.data,action);this.history.push(structuredClone(this.game));this.history=this.history.slice(-12);this.game=next;this.revision++;this.clear();return true}
}
root.FourFlow=FourFlow;
})(globalThis);
