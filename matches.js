let state=PickleStorage.load();const byId=id=>state.players.find(p=>p.id===id),pname=id=>(byId(id)||{name:"Unknown"}).name,esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));const gm=gameMinutes,sm=sessionMinutes,tm=tournamentMode;gm.value=state.settings.gameMinutes;sm.value=state.settings.sessionMinutes;tm.checked=!!state.settings.tournamentMode;function saveSettings(){state.settings.gameMinutes=Number(gm.value);state.settings.sessionMinutes=Number(sm.value);PickleStorage.save(state);renderSummary()}gm.onchange=saveSettings;sm.onchange=saveSettings;tm.onchange=()=>{
  const turningOff=state.settings.tournamentMode&&!tm.checked;
  const turningOn=!state.settings.tournamentMode&&tm.checked;

  if(turningOn&&state.settings.tournamentSessionLocked){
    alert("Tournament Mode has been disabled for this session. Reset the session before Tournament Mode can be enabled again.");
    tm.checked=false;
    return;
  }

  if(turningOff&&state.currentRound){
    const proceed=confirm(
      "WARNING: Turning Tournament Mode OFF while a round is in progress will erase all tournament score and standings data collected so far for this session. Social partner, opponent, game and sit-out history will be preserved. Tournament Mode cannot be re-enabled until the session is reset.\n\nPress Cancel to keep Tournament Mode ON, or OK to Proceed."
    );

    if(!proceed){
      tm.checked=true;
      return;
    }

    // Remove tournament-only data from all completed rounds and the active round.
    for(const r of state.rounds){
      for(const g of r.games){
        g.scoreA=null;
        g.scoreB=null;
      }
    }
    for(const g of state.currentRound.games){
      g.scoreA=null;
      g.scoreB=null;
    }

    // Clear tournament standings while preserving all social statistics.
    for(const p of state.players){
      p.victoryPoints=0;
      p.pointsScored=0;
      p.tournamentWins=0;
      p.tournamentTies=0;
      p.tournamentLosses=0;
    }

    state.settings.tournamentMode=false;
    state.settings.tournamentSessionLocked=true;
    PickleStorage.save(state);
    renderAll();
    return;
  }

  state.settings.tournamentMode=tm.checked;
  PickleStorage.save(state);
  renderAll();
};function renderSummary(){const p=state.players.filter(x=>x.present),sel=state.settings.selectedCourts,c=Math.min(Math.floor(p.length/4),sel.length),sit=Math.max(0,p.length-c*4);presentCount.textContent=p.length;courtsUsed.textContent=c;sitCount.textContent=sit;selectedCourtsText.textContent=sel.join(", ");scheduleHint.textContent=`${state.settings.sessionMinutes}-minute session at ${state.settings.gameMinutes} minutes per game. Available courts: ${sel.join(", ")}.`}function scoreFields(g,i){if(!state.settings.tournamentMode)return"";return `<div class="score-entry"><label>Team A Score<input type="number" min="0" step="1" inputmode="numeric" data-a="${i}" value="${g.scoreA??''}"></label><label>Team B Score<input type="number" min="0" step="1" inputmode="numeric" data-b="${i}" value="${g.scoreB??''}"></label></div>`}function allScores(){return !state.settings.tournamentMode||!state.currentRound||state.currentRound.games.every(g=>Number.isInteger(g.scoreA)&&g.scoreA>=0&&Number.isInteger(g.scoreB)&&g.scoreB>=0)}function buttons(){if(!state.currentRound){completeRound.classList.add("hidden");generateRound.classList.remove("hidden");generateRound.disabled=false;return}if(state.settings.tournamentMode){completeRound.classList.add("hidden");generateRound.classList.remove("hidden");generateRound.disabled=!allScores()}else{generateRound.classList.add("hidden");completeRound.classList.remove("hidden")}}function renderCurrent(){const r=state.currentRound;if(!r){currentRoundCard.classList.add("hidden");buttons();return}currentRoundCard.classList.remove("hidden");roundTitle.textContent=`Round ${r.number}`;roundTime.textContent=`${(r.number-1)*state.settings.gameMinutes}–${r.number*state.settings.gameMinutes} min`;courtGrid.innerHTML=r.games.map((g,i)=>`<article class="court-card"><h3>Court ${g.court}</h3><div class="team">${esc(pname(g.teamA[0]))}<br><span>&amp;</span> ${esc(pname(g.teamA[1]))}</div><div class="vs">VS</div><div class="team">${esc(pname(g.teamB[0]))}<br><span>&amp;</span> ${esc(pname(g.teamB[1]))}</div>${scoreFields(g,i)}</article>`).join("");if(r.byes.length){byeBox.classList.remove("hidden");byeList.innerHTML=r.byes.map(id=>`<span class="chip player-name-chip">${esc(pname(id))}</span>`).join("")}else byeBox.classList.add("hidden");buttons()}function renderHistory(){if(!state.rounds.length){history.innerHTML='<p class="empty">No completed rounds yet.</p>';return}history.innerHTML=[...state.rounds].reverse().map(r=>`<details class="history-round"><summary>Round ${r.number}</summary><div class="history-body">${r.games.map(g=>`<p><strong>Court ${g.court}:</strong> ${esc(pname(g.teamA[0]))} &amp; ${esc(pname(g.teamA[1]))} vs ${esc(pname(g.teamB[0]))} &amp; ${esc(pname(g.teamB[1]))}${Number.isInteger(g.scoreA)?` — ${g.scoreA}-${g.scoreB}`:""}</p>`).join("")}${r.byes.length?`<p><strong>Sat out:</strong> ${r.byes.map(id=>esc(pname(id))).join(", ")}</p>`:""}</div></details>`).join("")}function inc(m,id){m[id]=(m[id]||0)+1}function record(r){for(const g of r.games){[...g.teamA,...g.teamB].forEach(id=>{const p=byId(id);if(p)p.games=(p.games||0)+1});const a=byId(g.teamA[0]),b=byId(g.teamA[1]),c=byId(g.teamB[0]),d=byId(g.teamB[1]);if(a&&b){inc(a.partnerCounts,b.id);inc(b.partnerCounts,a.id)}if(c&&d){inc(c.partnerCounts,d.id);inc(d.partnerCounts,c.id)}for(const[x,y]of[[a,c],[a,d],[b,c],[b,d]])if(x&&y){inc(x.opponentCounts,y.id);inc(y.opponentCounts,x.id)}if(state.settings.tournamentMode){const sa=g.scoreA,sb=g.scoreB,ta=[a,b].filter(Boolean),tb=[c,d].filter(Boolean);ta.forEach(p=>p.pointsScored+=sa);tb.forEach(p=>p.pointsScored+=sb);if(sa>sb){ta.forEach(p=>{p.victoryPoints+=2;p.tournamentWins++});tb.forEach(p=>p.tournamentLosses++)}else if(sb>sa){tb.forEach(p=>{p.victoryPoints+=2;p.tournamentWins++});ta.forEach(p=>p.tournamentLosses++)}else{[...ta,...tb].forEach(p=>{p.victoryPoints++;p.tournamentTies++})}}}for(const id of r.byes){const p=byId(id);if(p){p.byes++;p.lastByeRound=r.number}}}function finish(){if(!state.currentRound||!allScores())return false;record(state.currentRound);state.rounds.push(state.currentRound);state.currentRound=null;PickleStorage.save(state);return true}function create(){const p=state.players.filter(x=>x.present);if(p.length<4){alert("At least 4 present players are required.");return false}const max=Math.floor(state.settings.sessionMinutes/state.settings.gameMinutes);if(state.rounds.length>=max){alert("The session schedule is full.");return false}const n=state.rounds.length+1,r=SocialScheduler.generate(p,state.settings.selectedCourts,n,state.settings.gameMinutes);state.currentRound={number:n,games:r.games.map(g=>({...g,scoreA:null,scoreB:null})),byes:r.byes};PickleStorage.save(state);return true}courtGrid.oninput=e=>{if(!state.currentRound||!state.settings.tournamentMode)return;const i=e.target.dataset.a??e.target.dataset.b;if(i===undefined)return;const key=e.target.dataset.a!==undefined?"scoreA":"scoreB",v=e.target.value;state.currentRound.games[Number(i)][key]=v===""?null:Math.max(0,Math.trunc(Number(v)));PickleStorage.save(state);buttons()};generateRound.onclick=()=>{if(state.currentRound){if(!state.settings.tournamentMode||!allScores())return;finish()}if(create())renderAll()};completeRound.onclick=()=>{if(finish())renderAll()};resetSession.onclick=()=>{if(confirm("Reset rounds, pairing history, tournament standings and sit-outs?")){state=PickleStorage.resetSession(state);renderAll()}};function renderAll(){
  tm.checked=!!state.settings.tournamentMode;
  tm.disabled=!!state.settings.tournamentSessionLocked;
  tm.title=state.settings.tournamentSessionLocked?"Tournament Mode disabled until session reset":"";
  renderSummary();
  renderCurrent();
  renderHistory()
}renderAll();