/* Size the existing buttons so changing columns preserves card selection and focus. */
(() => {
  const hand = document.getElementById('nextHand');
  if (!hand) return;

  const minimum = 100, maximum = 145, gap = 6;
  let width = 0;

  function arrange() {
    if (width <= 0) return;
    const filter = hand.dataset.filter;
    const visibleCount = [...hand.querySelectorAll(':scope > .next-card:not([hidden])')]
      .filter(card => !filter || filter === 'all' || card.classList.contains(filter)).length;
    const count = Math.max(1, visibleCount);
    const capacity = Math.max(1, Math.floor((width + gap) / (minimum + gap)));
    const rows = Math.ceil(count / capacity);
    const columns = Math.ceil(count / rows);
    const cardWidth = Math.min(maximum, (width - gap * (columns - 1)) / columns);
    hand.style.setProperty('--hand-columns', columns);
    hand.style.setProperty('--hand-width', cardWidth + 'px');
    hand.toggleAttribute('data-compact-cards', cardWidth < 120);
  }

  hand.classList.add('readable-hand');
  new ResizeObserver(([entry]) => {
    if (width !== entry.contentRect.width) {
      width = entry.contentRect.width;
      arrange();
    }
  }).observe(hand);
  new MutationObserver(arrange).observe(hand, {
    childList: true, attributes: true, attributeFilter: ['data-filter', 'hidden'], subtree: true
  });
})();
