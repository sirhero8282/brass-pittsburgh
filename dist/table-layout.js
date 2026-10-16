/* Layout only: move the existing controls without replacing their handlers or state. */
(() => {
  const one = s => document.querySelector(s);
  document.body.classList.add('table-layout');
  // app.js already handles wheel zoom on the map, including preventDefault.
  one('#mapEdges').setAttribute('aria-label', '피츠버그 지도 · 마우스 휠로 확대·축소, 확대한 뒤 끌어서 이동');
  one('#mapEdges').setAttribute('title', '마우스 휠로 확대·축소 · 끌어서 이동');
  one('#zoomFit').setAttribute('title', '지도 전체 보기로 돌아가기');
  const header = one('header'), nav = one('body > nav');
  if (nav) {
    nav.setAttribute('aria-label', '주 메뉴');
    const desktop = window.matchMedia('(min-width:1101px)');
    const placeNav = () => desktop.matches ? header.insertBefore(nav, one('.header-meta')) : document.body.append(nav);
    placeNav(); desktop.addEventListener('change', placeNav);
  }
  const workspace = one('.game-workspace'), panel = one('#playerPanel');
  workspace.append(panel);
  const side = one('#playerSidePanel'), action = one('.next-action-zone');
  action.prepend(side.querySelector('.player-flow'));
  const title = document.createElement('h2');
  title.className = 'table-action-title'; title.textContent = '내 행동';
  action.prepend(title);
  action.append(one('#nextStartNotice'));
  const targetSetting = one('.mobile-target-setting');
  if (targetSetting) action.append(targetSetting);
  const detailZone = document.createElement('section');
  detailZone.className = 'table-detail-zone';
  detailZone.setAttribute('aria-label', '추가 선택');
  detailZone.innerHTML = '<h2 class="table-action-title">추가 선택</h2>';
  ['#nextActionHint', '#nextDetails', '#nextStartNotice', '#fieldBrief', '#nextEndTurn'].forEach(s => detailZone.append(one(s)));
  one('.next-control-row').append(detailZone);
  one('.map-stage').prepend(one('#mapSelectionBar'));
  const market = one('.market-column');
  market.prepend(one('.next-market-panel'));
  side.querySelector('h2').textContent = '내 자원';
  const legend = document.createElement('section');
  legend.className = 'table-legend';
  legend.innerHTML = '<h2>범례</h2><p><i class="rail"></i>철도</p><p><i class="pipe"></i>송유관</p><small>선 위 아이콘은 노선 보너스입니다.</small>';
  market.append(legend);
  const command = one('.command-column');
  const recent = one('#latest').closest('section');
  command.append(recent);
  // Native disclosure and original card indices remain intact when filtering.
  const filters = document.createElement('div');
  filters.className = 'table-card-filters'; filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', '카드 종류');
  filters.innerHTML = ['전체','도시','산업'].map((label,i) => `<button type="button" data-card-filter="${['all','city','industry'][i]}" aria-pressed="${i===0}">${label}</button>`).join('');
  one('#nextHandHint').before(filters);
  filters.addEventListener('click', e => {
    const button = e.target.closest('[data-card-filter]'); if (!button) return;
    const type = button.dataset.cardFilter;
    one('#nextHand').dataset.filter = type;
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
  });
  one('#nextHand').setAttribute('aria-label', '사용할 카드 선택');
  one('#nextHand').setAttribute('tabindex', '0');
})();
