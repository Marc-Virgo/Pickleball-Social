const PickleStorage = (() => {
  const KEY = "socialPickleballStateV1";
  const defaultState = {
    players: [],
    rounds: [],
    currentRound: null,
    settings: { maxCourts: 8, gameMinutes: 10, sessionMinutes: 120 }
  };

  function normalize(state) {
    state = state || structuredClone(defaultState);
    state.players = state.players || [];
    state.rounds = state.rounds || [];
    state.currentRound = state.currentRound || null;
    state.settings = Object.assign({}, defaultState.settings, state.settings || {});
    for (const p of state.players) {
      p.id = p.id || crypto.randomUUID();
      p.name = p.name || "Unnamed";
      p.present = !!p.present;
      p.byes = Number.isFinite(p.byes) ? p.byes : 0;
      p.partnerCounts = p.partnerCounts || {};
      p.opponentCounts = p.opponentCounts || {};
      p.games = Number.isFinite(p.games) ? p.games : 0;
    }
    return state;
  }

  function load() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY)));
    } catch {
      return normalize(null);
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(normalize(state)));
  }

  function resetSession(state) {
    state.rounds = [];
    state.currentRound = null;
    for (const p of state.players) {
      p.byes = 0;
      p.partnerCounts = {};
      p.opponentCounts = {};
      p.games = 0;
    }
    save(state);
    return state;
  }

  return { load, save, resetSession };
})();
