(() => {
  'use strict';
  // Centers of the printed card backs as fractions of each board image.
  const centers = {
    'pittsburgh-2p-web-v27.webp': [.099, .145],
    'pittsburgh-2p-web-v26.webp': [.099, .145],
    'pittsburgh-2p-reference.webp': [.101, .145],
    'board-r399-v4.webp': [.124, .164],
    'board.webp': [.124, .164]
  };
  let count = null;
  let depth = 0;
  let caption = '뽑을 카드';

  function paint(badge) {
    if (!badge) return;
    badge.setAttribute('visibility', count === null ? 'hidden' : 'visible');
    if (count === null) return;
    const value = count + '장';
    badge.querySelector('text').textContent = value;
    badge.setAttribute('aria-label', caption + ' ' + value);
    badge.querySelector('title').textContent = caption + ' ' + value;
    badge.querySelector('.pile-edge').setAttribute('height', 68 + depth * 2);
  }

  function render(counts, label = '뽑을 카드') {
    const known = counts.length && counts.every(n => Number.isInteger(n) && n >= 0);
    count = known ? counts.reduce((sum, n) => sum + n, 0) : null;
    depth = known ? Math.min(4, Math.ceil(count / (counts.length * 2))) : 0;
    caption = label;
    paint(document.getElementById('boardDrawPile'));
  }

  function mount(svg) {
    const art = svg.querySelector('image.physical-board-art');
    if (!art) return;
    const filename = art.getAttribute('href').split(/[?#]/)[0].split('/').pop();
    const center = centers[filename];
    if (!center) return;
    const x = art.x.baseVal.value + center[0] * art.width.baseVal.value;
    const y = art.y.baseVal.value + center[1] * art.height.baseVal.value;
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badge.id = 'boardDrawPile';
    badge.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    badge.setAttribute('role', 'img');
    badge.setAttribute('pointer-events', 'none');
    badge.innerHTML = '<title></title><rect class="pile-edge" x="-77" y="-34" width="154" rx="14"/><rect class="pile-face" x="-77" y="-34" width="154" height="68" rx="14"/><text y="18" text-anchor="middle"></text>';
    paint(badge);
    art.after(badge);
  }

  globalThis.BoardDrawPile = {render, mount};
})();
