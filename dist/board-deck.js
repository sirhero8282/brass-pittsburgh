(() => {
  'use strict';
  function render(counts, label = '뽑을 카드') {
    const badge = document.getElementById('boardDrawPile');
    if (!badge) return;
    if (!counts.length || !counts.every(n => Number.isInteger(n) && n >= 0)) {
      badge.hidden = true;
      return;
    }
    const total = counts.reduce((sum, n) => sum + n, 0);
    badge.hidden = false;
    badge.querySelector('small').textContent = label;
    badge.querySelector('strong').textContent = total + '장';
    badge.dataset.depth = Math.min(4, Math.ceil(total / (counts.length * 2)));
  }
  globalThis.BoardDrawPile = {render};
})();
