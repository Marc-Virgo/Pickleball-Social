let state = PickleStorage.load();

const list = document.getElementById("playerList");
const presentCount = document.getElementById("presentCount");
const courtForecast = document.getElementById("courtForecast");

function forecast() {
  const n = state.players.filter(p => p.present).length;
  const selectedCourts = state.settings.selectedCourts || [1];
  const courts = Math.min(Math.floor(n / 4), selectedCourts.length);
  const active = courts * 4;
  const sitting = Math.max(0, n - active);
  presentCount.textContent = n;

  if (n < 4) {
    courtForecast.textContent = "Need at least 4 players.";
  } else {
    courtForecast.textContent =
      `${courts} court${courts === 1 ? "" : "s"} used • ${active} playing` +
      (sitting ? ` • ${sitting} sitting` : "");
  }
}

function render() {
  list.innerHTML = "";
  const sorted = [...state.players].sort((a,b) => a.name.localeCompare(b.name));
  if (!sorted.length) {
    list.innerHTML = `<p class="empty">No players yet. Add names above.</p>`;
  }

  for (const p of sorted) {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <label class="player-check">
        <input type="checkbox" ${p.present ? "checked" : ""} data-present="${p.id}">
        <span>${escapeHtml(p.name)}</span>
      </label>
      <button class="icon-button" data-delete="${p.id}" aria-label="Delete ${escapeHtml(p.name)}">×</button>
    `;
    list.appendChild(row);
  }
  forecast();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (!name) return;

  const existing = state.players.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.present = true;
  } else {
    state.players.push({
      id: crypto.randomUUID(),
      name,
      present: true,
      byes: 0,
      games: 0,
      partnerCounts: {},
      opponentCounts: {}
    });
  }
  input.value = "";
  PickleStorage.save(state);
  render();
  input.focus();
});

list.addEventListener("change", e => {
  const id = e.target.dataset.present;
  if (!id) return;
  const p = state.players.find(x => x.id === id);
  if (p) p.present = e.target.checked;
  PickleStorage.save(state);
  render();
});

list.addEventListener("click", e => {
  const id = e.target.dataset.delete;
  if (!id) return;
  const p = state.players.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete ${p.name}?`)) return;
  state.players = state.players.filter(x => x.id !== id);
  PickleStorage.save(state);
  render();
});

document.getElementById("allPresent").addEventListener("click", () => {
  state.players.forEach(p => p.present = true);
  PickleStorage.save(state);
  render();
});

document.getElementById("nonePresent").addEventListener("click", () => {
  state.players.forEach(p => p.present = false);
  PickleStorage.save(state);
  render();
});

render();
