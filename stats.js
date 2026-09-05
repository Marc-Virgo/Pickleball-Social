const s=PickleStorage.load();
const players=[...s.players];
const body=statsBody;
const head=statsHead;
const labels=document.querySelectorAll(".stat small");

const esc=x=>x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const u=m=>m?Object.keys(m).filter(k=>(m[k]||0)>0).length:0;

if(s.settings.tournamentMode){
  statsTitle.textContent="Tournament Standings";

  const scheduledRounds=Math.floor(s.settings.sessionMinutes/s.settings.gameMinutes);
  const sessionComplete=!s.currentRound && s.rounds.length>=scheduledRounds;
  const maxGames=Math.max(0,...players.map(p=>p.games||0));

  function fairVP(p){
    const games=p.games||0;
    if(!games||!maxGames)return 0;
    return (p.victoryPoints||0)*maxGames/games;
  }

  function fairPointsScored(p){
    const games=p.games||0;
    if(!games||!maxGames)return 0;
    return (p.pointsScored||0)*maxGames/games;
  }

  if(sessionComplete){
    statsIntro.textContent=
      "Final standings are fairness-adjusted for unequal games played. " +
      "Adjusted Victory Points scale each player's Victory Points to the number of games played by the most-active player.";

    head.innerHTML=
      '<tr><th>Rank</th><th>Player</th><th>Victory Points</th><th>Games</th><th>Adjusted VP</th><th>Points Scored</th><th>W</th><th>T</th><th>L</th></tr>';

    players.sort((a,b)=>
      fairVP(b)-fairVP(a) ||
      fairPointsScored(b)-fairPointsScored(a) ||
      (b.victoryPoints||0)-(a.victoryPoints||0) ||
      (b.tournamentWins||0)-(a.tournamentWins||0) ||
      a.name.localeCompare(b.name)
    );

    body.innerHTML=players.map((p,i)=>`
      <tr>
        <td data-label="Rank">${i+1}</td>
        <td data-label="Player"><strong>${esc(p.name)}</strong></td>
        <td data-label="Victory Points">${p.victoryPoints||0}</td>
        <td data-label="Games">${p.games||0}</td>
        <td data-label="Adjusted VP">${fairVP(p).toFixed(2)}</td>
        <td data-label="Points Scored">${p.pointsScored||0}</td>
        <td data-label="Wins">${p.tournamentWins||0}</td>
        <td data-label="Ties">${p.tournamentTies||0}</td>
        <td data-label="Losses">${p.tournamentLosses||0}</td>
      </tr>`).join("");

    playerCount.textContent=players.length;
    avgPartners.textContent=players.length
      ? (players.reduce((a,p)=>a+fairVP(p),0)/players.length).toFixed(2)
      : 0;
    avgOpponents.textContent=players.length
      ? (players.reduce((a,p)=>a+fairPointsScored(p),0)/players.length).toFixed(1)
      : 0;

    labels[1].textContent="avg adjusted VP";
    labels[2].textContent="avg adjusted points scored";
  }else{
    statsIntro.textContent=
      "Live standings are ranked by Victory Points. The final standings will be fairness-adjusted if players finish with unequal numbers of games.";

    head.innerHTML=
      '<tr><th>Rank</th><th>Player</th><th>Victory Points</th><th>Points Scored</th><th>W</th><th>T</th><th>L</th><th>Games</th></tr>';

    players.sort((a,b)=>
      (b.victoryPoints||0)-(a.victoryPoints||0) ||
      (b.pointsScored||0)-(a.pointsScored||0) ||
      (b.tournamentWins||0)-(a.tournamentWins||0) ||
      a.name.localeCompare(b.name)
    );

    body.innerHTML=players.map((p,i)=>`
      <tr>
        <td data-label="Rank">${i+1}</td>
        <td data-label="Player"><strong>${esc(p.name)}</strong></td>
        <td data-label="Victory Points">${p.victoryPoints||0}</td>
        <td data-label="Points Scored">${p.pointsScored||0}</td>
        <td data-label="Wins">${p.tournamentWins||0}</td>
        <td data-label="Ties">${p.tournamentTies||0}</td>
        <td data-label="Losses">${p.tournamentLosses||0}</td>
        <td data-label="Games">${p.games||0}</td>
      </tr>`).join("");

    playerCount.textContent=players.length;
    avgPartners.textContent=players.length
      ? (players.reduce((a,p)=>a+(p.victoryPoints||0),0)/players.length).toFixed(1)
      : 0;
    avgOpponents.textContent=players.length
      ? (players.reduce((a,p)=>a+(p.pointsScored||0),0)/players.length).toFixed(1)
      : 0;

    labels[1].textContent="avg victory points";
    labels[2].textContent="avg points scored";
  }

}else{
  statsTitle.textContent="Player Social Stats";
  statsIntro.textContent="Unique partners and opponents are calculated from completed rounds stored on this device.";

  head.innerHTML=
    '<tr><th>Player</th><th>Games</th><th>Unique Partners</th><th>Unique Opponents</th><th>Byes</th></tr>';

  players.sort((a,b)=>a.name.localeCompare(b.name));

  let tp=0,to=0;
  body.innerHTML=players.map(p=>{
    const up=u(p.partnerCounts);
    const uo=u(p.opponentCounts);
    tp+=up;
    to+=uo;
    return `
      <tr>
        <td data-label="Player"><strong>${esc(p.name)}</strong></td>
        <td data-label="Games">${p.games||0}</td>
        <td data-label="Unique Partners">${up}</td>
        <td data-label="Unique Opponents">${uo}</td>
        <td data-label="Byes">${p.byes||0}</td>
      </tr>`;
  }).join("");

  playerCount.textContent=players.length;
  avgPartners.textContent=players.length?(tp/players.length).toFixed(1):0;
  avgOpponents.textContent=players.length?(to/players.length).toFixed(1):0;
}
