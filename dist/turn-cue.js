/* A short local chime announces a new player turn after round presentation. */
(() => {
  let audio = null;
  let previous = turnKey();
  function turnKey() {
    return state.setupLocked && !state.gameOver && state.turnOwner === 'player'
      ? [state.seed, state.era, state.round, 'player'].join(':') : null;
  }
  function unlockAudio() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio ||= new Context();
      if (audio.state === 'suspended') void audio.resume().catch(() => {});
    } catch {}
  }
  function chime() {
    if (!audio || audio.state !== 'running') return;
    try {
      const start = audio.currentTime;
      [660, 880].forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const at = start + index * 0.13;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.10, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.20);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at);
        oscillator.stop(at + 0.22);
      });
    } catch {}
  }
  function observeTurn() {
    if (roundTransition) return;
    const current = turnKey();
    if (current && current !== previous) chime();
    previous = current;
  }
  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('keydown', unlockAudio);
  const originalRender = renderAll;
  renderAll = function (...args) {
    const result = originalRender.apply(this, args);
    observeTurn();
    return result;
  };
  const originalTransition = renderRoundTransition;
  renderRoundTransition = function (...args) {
    const result = originalTransition.apply(this, args);
    observeTurn();
    return result;
  };
})();
