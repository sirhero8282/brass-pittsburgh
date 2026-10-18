/* Additive navigation only. Never reads or modifies either game's saved state. */
(() => {
  document.addEventListener('click', event => {
    const entry = event.target.closest?.('button[data-view="map4View"]');
    if (!entry) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign('./four-player.html');
  }, true);
})();
