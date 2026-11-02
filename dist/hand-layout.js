/* Size the existing buttons so changing columns preserves card selection and focus. */
(() => {
  const hand = document.getElementById('nextHand');
  if (!hand) return;

  hand.classList.add('readable-hand');
  new ResizeObserver(([entry]) => {
    // Four 120px cards with three 6px gaps.
    hand.toggleAttribute('data-compact-cards', entry.contentRect.width < 498);
  }).observe(hand);
})();
