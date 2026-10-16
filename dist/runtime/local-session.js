/* Local-only session boundary. No DOM, network, or rule calculations. */
(function (root) {
  'use strict';
  const SAVE_KEY = 'brass-p-next-v1';
  function createLocalSession({ storage, onError = () => {} }) {
    let revision = 0;
    const listeners = new Set();
    return Object.freeze({
      mode: 'local',
      read() { return storage.getItem(SAVE_KEY); },
      commit(state) {
        const json = JSON.stringify(state);
        storage.setItem(SAVE_KEY, json);
        revision++;
        for (const listener of listeners) {
          try { listener({ revision, state: JSON.parse(json) }); }
          catch (error) { onError(error); }
        }
        return revision;
      },
      subscribe(listener) {
        if (typeof listener !== 'function') throw new TypeError('Listener must be a function');
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      get revision() { return revision; }
    });
  }
  const api = Object.freeze({ SAVE_KEY, createLocalSession });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BrassSession = api;
})(globalThis);
