const state = PickleStorage.load();

function uniqueCount(map) {
  if (!map) return 0;
  return Object.keys(map).filter(id => (map[id] || 0) > 0).length;
}

function esc(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

const players = [...state.players].sort((a,b) => a.name.localeCompare(b.name));
const body = document.getElementById("statsBody");

let totalPartners = 0;
let totalOpponents = 0;

if (!players.length) {
  body.innerHTML = `<tr><td colspan="5" class="empty">No players saved yet.</td></tr>`;
} else {
  body.innerHTML = players.map(p => {
    const up = uniqueCount(p.partnerCounts);
    const uo = uniqueCount(p.opponentCounts);
    totalPartners += up;
    totalOpponents += uo;

    return `
      <tr>
        <td data-label="Player"><strong>${esc(p.name)}</strong></td>
        <td data-label="Games">${p.games || 0}</td>
        <td data-label="Unique Partners">${up}</td>
        <td data-label="Unique Opponents">${uo}</td>
        <td data-label="Byes">${p.byes || 0}</td>
      </tr>
    `;
  }).join("");
}

document.getElementById("playerCount").textContent = players.length;
document.getElementById("avgPartners").textContent =
  players.length ? (totalPartners / players.length).toFixed(1) : "0";
document.getElementById("avgOpponents").textContent =
  players.length ? (totalOpponents / players.length).toFixed(1) : "0";
