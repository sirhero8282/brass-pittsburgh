/* Isolated visual draft. It runs only for ?layout=wide-draft. */
(() => {
  document.body.classList.add('square-map-draft');
  const one = selector => document.querySelector(selector);
  const workspace = one('.game-workspace');
  const map = one('.map-column');
  const market = one('.market-column');
  const command = one('.command-column');
  const player = one('#playerPanel');
  if (!workspace || !map || !market || !command || !player) return;
  document.body.classList.add('wide-layout-draft');
  const header = one('header');
  const nav = one('body > nav');
  const headerMeta = one('.header-meta');
  if (header && nav) header.insertBefore(nav, headerMeta || null);
  const available = one('.available-panel');
  const left = document.createElement('aside');
  left.className = 'draft-left-rail';
  left.setAttribute('aria-label', '현재 사용 가능');
  workspace.prepend(left);
  if (available) left.append(available);
  const rail = document.createElement('aside');
  rail.className = 'draft-right-rail';
  rail.setAttribute('aria-label', '명령, 액션, 게임 정보');
  rail.innerHTML = '<div class="draft-rail-heading"><div><small>GAME CONTROL</small><strong>손패 · 행동</strong></div><span>플레이 영역</span></div>';
  workspace.append(rail);
  rail.append(player, command, market);
  const footer = one('.map-footer');
  if (footer) {
    const info = document.createElement('section');
    info.className = 'draft-map-info panel compact-panel';
    info.innerHTML = '<h2>지도 조작 안내</h2>';
    info.append(footer);
    market.append(info);
  }
})();


requestAnimationFrame(() => document.getElementById('zoomFit')?.click());
