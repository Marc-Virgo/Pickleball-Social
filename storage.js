const PickleStorage = (() => {
  const KEY = "socialPickleballStateV1";
  const defaultState = {
    players: [],
    rounds: [],
    currentRound: null,
    settings: { selectedCourts:[1,2,3,4,5,6,7,8,9,10], gameMinutes:10, sessionMinutes:120 }
  };

  function normalize(state) {
    state = state || structuredClone(defaultState);
    state.players = state.players || [];
    state.rounds = state.rounds || [];
    state.currentRound = state.currentRound || null;
    state.settings = Object.assign({}, defaultState.settings, state.settings || {});

    if (!Array.isArray(state.settings.selectedCourts) || !state.settings.selectedCourts.length) {
      const oldMax = Math.max(1, Math.min(10, Number(state.settings.maxCourts) || 10));
      state.settings.selectedCourts = Array.from({length:oldMax}, (_,i)=>i+1);
    }
    state.settings.selectedCourts = [...new Set(state.settings.selectedCourts.map(Number)
      .filter(n => Number.isInteger(n) && n >= 1 && n <= 10))].sort((a,b)=>a-b);
    if (!state.settings.selectedCourts.length) state.settings.selectedCourts = [1];

    for (const p of state.players) {
      p.id = p.id || crypto.randomUUID();
      p.name = p.name || "Unnamed";
      p.present = !!p.present;
      p.byes = Number.isFinite(p.byes) ? p.byes : 0;
      p.games = Number.isFinite(p.games) ? p.games : 0;
      p.partnerCounts = p.partnerCounts || {};
      p.opponentCounts = p.opponentCounts || {};
      p.lastByeRound = Number.isFinite(p.lastByeRound) ? p.lastByeRound : null;
    }
    return state;
  }

  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
    catch { return normalize(null); }
  }

  function save(state) { localStorage.setItem(KEY, JSON.stringify(normalize(state))); }

  function resetSession(state) {
    state.rounds = [];
    state.currentRound = null;
    for (const p of state.players) {
      p.byes = 0;
      p.games = 0;
      p.lastByeRound = null;
      p.partnerCounts = {};
      p.opponentCounts = {};
    }
    save(state);
    return state;
  }

  return { load, save, resetSession };
})();