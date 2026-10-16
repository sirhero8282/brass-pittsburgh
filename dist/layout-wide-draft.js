/* Production desktop layout. ?layout=wide-draft also forces it for the review wrapper. */
(() => {
  const isWideDraftPreview = new URLSearchParams(location.search).get('layout') === 'wide-draft';
  const desktopLayout = window.matchMedia('(min-width: 1100px)');
  if (!isWideDraftPreview && !desktopLayout.matches) return;
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
  rail.innerHTML = '<div class="draft-rail-heading"><div><small>GAME CONTROL</small><strong>명령 · 액션 · 정보</strong></div><span>오른쪽 패널</span></div>';
  workspace.append(rail);
  const status = command.querySelector('.table-status');
  if (status) {
    status.classList.add('draft-status-panel');
    status.querySelector(':scope > h2')?.remove();
    rail.append(status);
  }
  rail.append(player);
  const automaDock = player.querySelector('.table-automa-dock');
  if (automaDock) {
    const automaPanel = document.createElement('section');
    automaPanel.className = 'draft-automa-panel';
    automaPanel.setAttribute('aria-label', '오토마 행동');
    automaPanel.innerHTML = '<div class="draft-automa-heading"><div><small>AUTOMA CONTROL</small><strong>오토마 행동</strong></div><span class="draft-automa-state"><i class="draft-automa-head" aria-hidden="true"><b></b></i><em></em></span></div>';
    automaPanel.append(automaDock);
    rail.append(automaPanel);
  }
  rail.append(command, market);
  const footer = one('.map-footer');
  if (footer) {
    const info = document.createElement('section');
    info.className = 'draft-map-info panel compact-panel';
    info.innerHTML = '<h2>지도 조작 안내</h2>';
    info.append(footer);
    market.append(info);
  }
  const hand = one('#nextHand');
  const physicalCardArt = {
    '이리': './assets/cards/city/city-erie-blue-v02.webp',
    '클리브랜드': './assets/cards/city/city-cleveland-blue-v02.webp',
    '클락스버그': './assets/cards/city/city-clarksburg-blue-v02.webp',
    '해리스버그': './assets/cards/city/city-harrisburg-red-v01.webp',
    '뉴욕': './assets/cards/city/city-new-york-red-v02.webp',
    '볼티모어': './assets/cards/city/city-baltimore-red-v02.webp',
    '필라델피아': './assets/cards/city/city-philadelphia-red-v02.webp',
    '보스턴': './assets/cards/city/city-boston-red-v02.webp',
    '윌크스-배리': './assets/cards/city/city-wilkes-barre-yellow-v02.webp',
    '베들레헴': './assets/cards/city/city-bethlehem-yellow-v02.webp',
    '버팔로': './assets/cards/city/city-buffalo-yellow-v02.webp',
    '로체스터': './assets/cards/city/city-rochester-yellow-v01.webp',
    '피츠버그': './assets/cards/city/city-pittsburgh-blue-v02.webp',
    '디트로이트': './assets/cards/city/city-detroit-purple-v02.webp',
    '제철소': './assets/cards/industry/industry-card-steelworks-v01.webp',
    '등유': './assets/cards/industry/industry-card-kerosene-v01.webp',
    '제조 상자': './assets/cards/industry/industry-card-manufacturing-crate-v01.webp',
    '석탄': './assets/cards/industry/industry-card-coal-v01.webp'
  };
  const desktopCards = desktopLayout;
  const decoratePhysicalCards = () => {
    if (!desktopCards.matches) {
      hand?.querySelector('.draft-physical-card-sample')?.remove();
      hand?.querySelectorAll('.draft-physical-card').forEach(card => {
        card.querySelector('.draft-physical-card-art')?.remove();
        card.querySelector('.draft-card-count')?.remove();
        card.classList.remove('draft-physical-card');
      });
      return;
    }
    hand?.querySelectorAll('.next-card').forEach(card => {
      const name = card.querySelector('strong')?.textContent?.trim();
      const src = physicalCardArt[name];
      if (!src || card.querySelector('.draft-physical-card-art')) return;
      const count = [...card.querySelectorAll('small')].at(-1)?.textContent?.trim();
      const art = document.createElement('img');
      art.className = 'draft-physical-card-art';
      art.src = src;
      art.alt = `${name} 실물 카드`;
      card.prepend(art);
      if (count) {
        const badge = document.createElement('span');
        badge.className = 'draft-card-count';
        badge.textContent = count;
        card.append(badge);
      }
      card.classList.add('draft-physical-card');
    });
    hand?.querySelector('.draft-physical-card-sample')?.remove();
  };
  const clearFanCards = () => {
    hand?.classList.remove('draft-card-fan', 'draft-card-row');
    hand?.style.removeProperty('--fan-height');
    hand?.querySelectorAll('.draft-fan-hidden').forEach(card => card.classList.remove('draft-fan-hidden'));
    hand?.querySelectorAll('.next-card').forEach(card => {
      ['--fan-left', '--fan-rotate', '--fan-y', '--fan-layer', '--fan-origin-x'].forEach(name => card.style.removeProperty(name));
    });
  };
  const syncFanCards = () => {
    if (!desktopCards.matches || !hand) {
      clearFanCards();
      return;
    }
    hand.classList.remove('draft-card-row');
    hand.querySelectorAll('.draft-fan-hidden').forEach(card => card.classList.remove('draft-fan-hidden'));
    hand.querySelectorAll('.next-card').forEach(card => {
      ['--fan-left', '--fan-rotate', '--fan-y', '--fan-layer', '--fan-origin-x'].forEach(name => card.style.removeProperty(name));
    });
    const candidates = [
      ...hand.querySelectorAll('.next-card')
    ].filter(card => getComputedStyle(card).display !== 'none');
    candidates.slice(8).forEach(card => card.classList.add('draft-fan-hidden'));
    const cards = candidates.slice(0, 8);
    if (!cards.length) {
      clearFanCards();
      return;
    }
    hand.classList.add('draft-card-fan');
    const cardWidth = cards[0].getBoundingClientRect().width || 100;
    const cardHeight = cards[0].getBoundingClientRect().height || cardWidth * 25 / 18;
    const minimumGap = 10;
    const straight = hand.clientWidth >= cardWidth * cards.length + minimumGap * (cards.length - 1) + 16;
    if (straight) hand.classList.add('draft-card-row');
    const fitStep = cards.length > 1 ? (hand.clientWidth - cardWidth - 28) / (cards.length - 1) : 0;
    const step = cards.length > 1 ? (straight ? fitStep : Math.max(28, Math.min(cardWidth * .72, fitStep))) : 0;
    const middle = (cards.length - 1) / 2;
    cards.forEach((card, index) => {
      const distance = index - middle;
      card.style.setProperty('--fan-left', `${8 + index * step}px`);
      card.style.setProperty('--fan-rotate', '0deg');
      card.style.setProperty('--fan-y', '0px');
      card.style.setProperty('--fan-layer', String(index + 1));
      const left = 8 + index * step;
      const origin = left < cardWidth * .5 ? '0%' : left + cardWidth > hand.clientWidth - cardWidth * .5 ? '100%' : '50%';
      card.style.setProperty('--fan-origin-x', origin);
    });
    hand.style.setProperty('--fan-height', `${Math.ceil(cardHeight + 30)}px`);
  };
  const refreshCards = () => {
    decoratePhysicalCards();
    syncFanCards();
  };
  let cardRefreshFrame = 0;
  const scheduleCardRefresh = () => {
    if (cardRefreshFrame) return;
    cardRefreshFrame = requestAnimationFrame(() => {
      cardRefreshFrame = 0;
      refreshCards();
    });
  };
  if (hand) {
    const cardObserver = new MutationObserver(mutations => {
      if (mutations.some(mutation => [...mutation.addedNodes].some(node => node.nodeType === 1 && (node.matches?.('.next-card') || node.querySelector?.('.next-card'))))) scheduleCardRefresh();
    });
    cardObserver.observe(hand, { childList: true });
  }
  refreshCards();
  requestAnimationFrame(() => requestAnimationFrame(refreshCards));
  window.addEventListener('load', syncFanCards, { once: true });
  document.addEventListener('click', scheduleCardRefresh);
  desktopCards.addEventListener('change', refreshCards);
  window.addEventListener('resize', () => requestAnimationFrame(syncFanCards));
  const syncControlLayout = () => player.classList.toggle('draft-controls-split', player.getBoundingClientRect().width >= 720);
  if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(syncControlLayout)).observe(player);
  requestAnimationFrame(syncControlLayout);
  window.addEventListener('resize', () => requestAnimationFrame(syncControlLayout));
  const syncMapSize = () => {
    const styles = getComputedStyle(workspace);
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const rightMinimum = Math.min(430, Math.max(360, window.innerWidth * 0.31));
    const availableWidth = workspace.clientWidth - left.getBoundingClientRect().width - rightMinimum - gap * 2;
    const toolbarHeight = one('.map-toolbar')?.getBoundingClientRect().height || 0;
    const availableHeight = workspace.clientHeight - toolbarHeight - 2;
    const size = Math.max(280, Math.floor(Math.min(availableWidth, availableHeight)));
    document.body.style.setProperty('--draft-map', `${size}px`);
    requestAnimationFrame(syncFanCards);
  };
  requestAnimationFrame(() => requestAnimationFrame(syncMapSize));
  window.addEventListener('resize', syncMapSize);
})();
