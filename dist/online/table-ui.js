// Shared tabletop appearance; all action legality and commits stay on the server.
globalThis.createOnlineTableUI=({getCore,getBoard,getSeat})=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let core,board,seat,groups;$('#available').className='available-now';$('#available').closest('.panel').classList.add('available-panel');$('.available-column').classList.add('draft-left-rail');$('.command-column').classList.add('draft-right-rail');
function presentation(p){core.set({removed:p.removed});return core.presentation;}
let layoutFrame=0;
function syncLayoutMeasurements(){
 layoutFrame=0;const wide=matchMedia('(min-width:1100px)').matches,workspace=$('.four-workspace'),panel=$('#playerPanel');
 if(wide&&$('#gameView').classList.contains('active')){const gap=parseFloat(getComputedStyle(workspace).columnGap)||8,left=$('.available-column').getBoundingClientRect().width,rightMinimum=Math.min(430,Math.max(360,window.innerWidth*.31)),availableWidth=workspace.clientWidth-left-rightMinimum-gap*2,selection=$('#mapSelectionBar'),availableHeight=workspace.clientHeight-($('.map-toolbar')?.getBoundingClientRect().height||38)-($('.map-note')?.getBoundingClientRect().height||0)-(selection.hidden?0:selection.getBoundingClientRect().height)-10;document.body.style.setProperty('--draft-map',Math.max(280,Math.floor(Math.min(availableWidth,availableHeight)))+'px')}
 panel.classList.toggle('draft-controls-split',wide&&panel.getBoundingClientRect().width>=720);syncCards();
}
function scheduleLayout(){if(!layoutFrame)layoutFrame=requestAnimationFrame(syncLayoutMeasurements)}
function configureLayout(){const wide=matchMedia('(min-width:1100px)').matches;document.body.classList.toggle('wide-layout-draft',wide);const nav=$('nav');if(wide)$('header').insertBefore(nav,$('.header-meta'));else document.body.append(nav);scheduleLayout()}
function syncCards(){const hand=$('#nextHand'),cards=$$('#nextHand .next-card:not([hidden])'),wide=matchMedia('(min-width:1100px)').matches;hand.classList.toggle('draft-card-fan',wide);hand.classList.remove('draft-card-row');if(!wide)return;const width=cards[0]?.getBoundingClientRect().width||140,step=cards.length>1?Math.max(0,(hand.clientWidth-width-16)/(cards.length-1)):0;cards.forEach((card,i)=>{card.style.setProperty('--fan-left',(8+i*step)+'px');card.style.setProperty('--fan-layer',String(i+1));card.style.setProperty('--fan-y','0px');card.style.setProperty('--fan-rotate','0deg');card.style.setProperty('--fan-origin-x',i===0?'0%':i===cards.length-1?'100%':'50%')});hand.style.setProperty('--fan-height',Math.ceil(width*25/18+30)+'px')}
configureLayout();window.addEventListener('resize',configureLayout);
if(typeof ResizeObserver==='function')new ResizeObserver(scheduleLayout).observe($('#playerPanel'));
$('#nextHand').closest('details')?.addEventListener('toggle',scheduleLayout);

function renderPersonal(g){globalThis.BrassSplit?.game(g,seat,board);const p=g.players[Number($('#personalOwner').value)||0];BrassTable.personal({p,view:presentation(p),core,board,groups})}

function renderAvailable(g){const p=g.players[seat],view=presentation(p);
 const lanes=Object.entries(core.groups).flatMap(([track,gs])=>gs.filter(group=>view.unlocked(group.id)&&view.used(group.id)<group.count).map(group=>`<section class="mini-board-lane" data-lane="${track}">${view.availableIndustryTileMarkup(group,group.count-view.used(group.id),track).replace('data-stack="'+track+'"','data-inventory="'+group.id+'"').replace('/industry/blue/','/industry/'+p.color+'/')}<h3>${view.boardLaneTitle(track)}</h3></section>`)).join('');
 const nets=core.networks.filter(n=>(n.start||view.complete(n.req))&&view.networkRemaining(n,p.networkBuilt,p.lightTrains)>0);
 $('#available').innerHTML=`<div class="mini-personal-board" role="group" aria-label="현재 사용 가능한 산업 개인판">${lanes||'<p>모든 산업 타일 사용 완료</p>'}</div><div class="available-net" role="group" aria-label="사용 가능 네트워크">${nets.map(n=>`<span class="available-network-tile" role="img" aria-label="${esc(n.name+' · 남은 '+view.networkRemaining(n,p.networkBuilt,p.lightTrains)+'장')}"><img src="${board.netImage(n.id,p.color)}" alt=""></span>`).join('')}</div>`;
}

return {layout:scheduleLayout,render(g){core=getCore();board=getBoard();seat=getSeat();groups=Object.values(core.groups).flat();renderAvailable(g);renderPersonal(g);scheduleLayout();}};
};
