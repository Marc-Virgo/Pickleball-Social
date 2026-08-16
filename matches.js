let state = PickleStorage.load();

const presentEl = document.getElementById("presentCount");
const courtsEl = document.getElementById("courtsUsed");
const sitEl = document.getElementById("sitCount");
const maxCourtsEl = document.getElementById("maxCourts");
const gameMinutesEl = document.getElementById("gameMinutes");
const sessionMinutesEl = document.getElementById("sessionMinutes");
const scheduleHint = document.getElementById("scheduleHint");
const currentCard = document.getElementById("currentRoundCard");
const courtGrid = document.getElementById("courtGrid");
const byeBox = document.getElementById("byeBox");
const byeList = document.getElementById("byeList");
const completeBtn = document.getElementById("completeRound");
const generateBtn = document.getElementById("generateRound");

maxCourtsEl.value = state.settings.maxCourts;
gameMinutesEl.value = state.settings.gameMinutes;
sessionMinutesEl.value = state.settings.sessionMinutes;

function byId(id) { return state.players.find(p => p.id === id); }
function name(id) { const p = byId(id); return p ? p.name : "Unknown"; }
function esc(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

function updateSettings() {
  state.settings.maxCourts = Number(maxCourtsEl.value);
  state.settings.gameMinutes = Number(gameMinutesEl.value);
  state.settings.sessionMinutes = Number(sessionMinutesEl.value);
  PickleStorage.save(state);
  renderSummary();
}

[maxCourtsEl, gameMinutesEl, sessionMinutesEl].forEach(el => el.addEventListener("change", updateSettings));

function renderSummary() {
  const present = state.players.filter(p => p.present);
  const courts = Math.min(Math.floor(present.length / 4), state.settings.maxCourts);
  const active = courts * 4;
  const sitting = Math.max(0, present.length - active);
  const maxRounds = Math.floor(state.settings.sessionMinutes / state.settings.gameMinutes);

  presentEl.textContent = present.length;
  courtsEl.textContent = courts;
  sitEl.textContent = sitting;

  scheduleHint.textContent = `${state.settings.sessionMinutes}-minute session at ${state.settings.gameMinutes} minutes per game allows up to ${maxRounds} rounds. Player count determines courts used, capped at ${state.settings.maxCourts}.`;
}

function roundClock(roundNumber) {
  const start = (roundNumber - 1) * state.settings.gameMinutes;
  const end = start + state.settings.gameMinutes;
  return `${start}–${end} min`;
}

function renderCurrent() {
  const r = state.currentRound;
  if (!r) {
    currentCard.classList.add("hidden");
    completeBtn.classList.add("hidden");
    generateBtn.classList.remove("hidden");
    return;
  }

  currentCard.classList.remove("hidden");
  completeBtn.classList.remove("hidden");
  generateBtn.classList.add("hidden");

  document.getElementById("roundTitle").textContent = `Round ${r.number}`;
  document.getElementById("roundTime").textContent = roundClock(r.number);

  courtGrid.innerHTML = r.games.map(g => `
    <article class="court-card">
      <h3>Court ${g.court}</h3>
      <div class="team">${esc(name(g.teamA[0]))}<br><span>&amp;</span> ${esc(name(g.teamA[1]))}</div>
      <div class="vs">VS</div>
      <div class="team">${esc(name(g.teamB[0]))}<br><span>&amp;</span> ${esc(name(g.teamB[1]))}</div>
    </article>
  `).join("");

  if (r.byes.length) {
    byeBox.classList.remove("hidden");
    byeList.innerHTML = r.byes.map(id => `<span class="chip">${esc(name(id))}</span>`).join("");
  } else {
    byeBox.classList.add("hidden");
    byeList.innerHTML = "";
  }
}

function renderHistory() {
  const container = document.getElementById("history");
  if (!state.rounds.length) {
    container.innerHTML = `<p class="empty">No completed rounds yet.</p>`;
    return;
  }

  container.innerHTML = [...state.rounds].reverse().map(r => `
    <details class="history-round">
      <summary>Round ${r.number} <span>${r.games.length} court${r.games.length === 1 ? "" : "s"}${r.byes.length ? ` • ${r.byes.length} sitting` : ""}</span></summary>
      <div class="history-body">
        ${r.games.map(g => `<p><strong>Court ${g.court}:</strong> ${esc(name(g.teamA[0]))} &amp; ${esc(name(g.teamA[1]))} vs ${esc(name(g.teamB[0]))} &amp; ${esc(name(g.teamB[1]))}</p>`).join("")}
        ${r.byes.length ? `<p><strong>Sat out:</strong> ${r.byes.map(id => esc(name(id))).join(", ")}</p>` : ""}
      </div>
    </details>
  `).join("");
}

function increment(map, id) {
  map[id] = (map[id] || 0) + 1;
}

function recordCompletedRound(r) {
  for (const g of r.games) {
    const ids = [...g.teamA, ...g.teamB];
    ids.forEach(id => {
      const p = byId(id);
      if (p) p.games = (p.games || 0) + 1;
    });

    const a = byId(g.teamA[0]), b = byId(g.teamA[1]);
    const c = byId(g.teamB[0]), d = byId(g.teamB[1]);

    if (a && b) { increment(a.partnerCounts,b.id); increment(b.partnerCounts,a.id); }
    if (c && d) { increment(c.partnerCounts,d.id); increment(d.partnerCounts,c.id); }

    const opponents = [[a,c],[a,d],[b,c],[b,d]];
    for (const [x,y] of opponents) {
      if (x && y) { increment(x.opponentCounts,y.id); increment(y.opponentCounts,x.id); }
    }
  }

  for (const id of r.byes) {
    const p = byId(id);
    if (p) p.byes = (p.byes || 0) + 1;
  }
}

generateBtn.addEventListener("click", () => {
  const present = state.players.filter(p => p.present);
  if (present.length < 4) {
    alert("At least 4 present players are required.");
    return;
  }

  const maxRounds = Math.floor(state.settings.sessionMinutes / state.settings.gameMinutes);
  if (state.rounds.length >= maxRounds) {
    alert(`The ${state.settings.sessionMinutes}-minute session is already full at ${state.settings.gameMinutes} minutes per round.`);
    return;
  }

  const result = SocialScheduler.generate(present, state.settings.maxCourts);
  state.currentRound = {
    number: state.rounds.length + 1,
    games: result.games,
    byes: result.byes,
    createdAt: new Date().toISOString()
  };
  PickleStorage.save(state);
  renderAll();
});

completeBtn.addEventListener("click", () => {
  if (!state.currentRound) return;
  recordCompletedRound(state.currentRound);
  state.rounds.push(state.currentRound);
  state.currentRound = null;
  PickleStorage.save(state);
  renderAll();
});

document.getElementById("resetSession").addEventListener("click", () => {
  if (!confirm("Reset all rounds, partner/opponent history, and sit-out counts for this session? Player names and attendance will remain.")) return;
  state = PickleStorage.resetSession(state);
  renderAll();
});

function renderAll() {
  renderSummary();
  renderCurrent();
  renderHistory();
}

renderAll();
