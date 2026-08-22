let state = PickleStorage.load();
const byId=id=>state.players.find(p=>p.id===id);
const pname=id=>(byId(id)||{name:"Unknown"}).name;
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const gameMinutesEl=document.getElementById("gameMinutes");
const sessionMinutesEl=document.getElementById("sessionMinutes");
gameMinutesEl.value=state.settings.gameMinutes; sessionMinutesEl.value=state.settings.sessionMinutes;

function saveSettings(){
  state.settings.gameMinutes=Number(gameMinutesEl.value);
  state.settings.sessionMinutes=Number(sessionMinutesEl.value);
  PickleStorage.save(state); renderSummary();
}
gameMinutesEl.onchange=saveSettings; sessionMinutesEl.onchange=saveSettings;

function renderSummary(){
  const present=state.players.filter(p=>p.present);
  const sel=state.settings.selectedCourts||[1];
  const courts=Math.min(Math.floor(present.length/4),sel.length);
  const sitting=Math.max(0,present.length-courts*4);
  document.getElementById("presentCount").textContent=present.length;
  document.getElementById("courtsUsed").textContent=courts;
  document.getElementById("sitCount").textContent=sitting;
  document.getElementById("selectedCourtsText").textContent=sel.join(", ");
  const rounds=Math.floor(state.settings.sessionMinutes/state.settings.gameMinutes);
  document.getElementById("scheduleHint").textContent=
    `${state.settings.sessionMinutes}-minute session at ${state.settings.gameMinutes} minutes per game allows up to ${rounds} rounds. Available courts: ${sel.join(", ")}.`;
}

function roundClock(n){
  const a=(n-1)*state.settings.gameMinutes,b=a+state.settings.gameMinutes;
  return `${a}–${b} min`;
}

function renderCurrent(){
  const r=state.currentRound, card=document.getElementById("currentRoundCard");
  const gen=document.getElementById("generateRound"), comp=document.getElementById("completeRound");
  if(!r){card.classList.add("hidden");comp.classList.add("hidden");gen.classList.remove("hidden");return;}
  card.classList.remove("hidden");comp.classList.remove("hidden");gen.classList.add("hidden");
  document.getElementById("roundTitle").textContent=`Round ${r.number}`;
  document.getElementById("roundTime").textContent=roundClock(r.number);
  document.getElementById("courtGrid").innerHTML=r.games.map(g=>`
    <article class="court-card">
      <h3>Court ${g.court}</h3>
      <div class="team">${esc(pname(g.teamA[0]))}<br><span>&amp;</span> ${esc(pname(g.teamA[1]))}</div>
      <div class="vs">VS</div>
      <div class="team">${esc(pname(g.teamB[0]))}<br><span>&amp;</span> ${esc(pname(g.teamB[1]))}</div>
    </article>`).join("");
  const box=document.getElementById("byeBox");
  if(r.byes.length){
    box.classList.remove("hidden");
    document.getElementById("byeList").innerHTML=r.byes.map(id=>`<span class="chip player-name-chip">${esc(pname(id))}</span>`).join("");
  }else box.classList.add("hidden");
}

function renderHistory(){
  const c=document.getElementById("history");
  if(!state.rounds.length){c.innerHTML='<p class="empty">No completed rounds yet.</p>';return;}
  c.innerHTML=[...state.rounds].reverse().map(r=>`
    <details class="history-round"><summary>Round ${r.number} <span>${r.games.length} courts${r.byes.length?` • ${r.byes.length} sitting`:""}</span></summary>
    <div class="history-body">
    ${r.games.map(g=>`<p><strong>Court ${g.court}:</strong> ${esc(pname(g.teamA[0]))} &amp; ${esc(pname(g.teamA[1]))} vs ${esc(pname(g.teamB[0]))} &amp; ${esc(pname(g.teamB[1]))}</p>`).join("")}
    ${r.byes.length?`<p><strong>Sat out:</strong> ${r.byes.map(id=>esc(pname(id))).join(", ")}</p>`:""}
    </div></details>`).join("");
}
function inc(m,id){m[id]=(m[id]||0)+1;}

function record(r){
  for(const g of r.games){
    const ids=[...g.teamA,...g.teamB];
    ids.forEach(id=>{const p=byId(id); if(p)p.games=(p.games||0)+1;});
    const a=byId(g.teamA[0]),b=byId(g.teamA[1]),c=byId(g.teamB[0]),d=byId(g.teamB[1]);
    if(a&&b){inc(a.partnerCounts,b.id);inc(b.partnerCounts,a.id);}
    if(c&&d){inc(c.partnerCounts,d.id);inc(d.partnerCounts,c.id);}
    for(const [x,y] of [[a,c],[a,d],[b,c],[b,d]]) if(x&&y){inc(x.opponentCounts,y.id);inc(y.opponentCounts,x.id);}
  }
  for(const id of r.byes){const p=byId(id);if(p){p.byes=(p.byes||0)+1;p.lastByeRound=r.number;}}
}

document.getElementById("generateRound").onclick=()=>{
  const present=state.players.filter(p=>p.present), sel=state.settings.selectedCourts||[1];
  if(present.length<4){alert("At least 4 present players are required.");return;}
  const maxRounds=Math.floor(state.settings.sessionMinutes/state.settings.gameMinutes);
  if(state.rounds.length>=maxRounds){alert("The session schedule is full.");return;}
  const n=state.rounds.length+1;
  const result=SocialScheduler.generate(present,sel,n,state.settings.gameMinutes);
  state.currentRound={number:n,games:result.games,byes:result.byes,createdAt:new Date().toISOString()};
  PickleStorage.save(state); renderAll();
};

document.getElementById("completeRound").onclick=()=>{
  if(!state.currentRound)return;
  record(state.currentRound); state.rounds.push(state.currentRound); state.currentRound=null;
  PickleStorage.save(state); renderAll();
};

document.getElementById("resetSession").onclick=()=>{
  if(!confirm("Reset rounds, pairing history and sit-outs? Player names, attendance and court selection will remain."))return;
  state=PickleStorage.resetSession(state); renderAll();
};

function renderAll(){renderSummary();renderCurrent();renderHistory();}
renderAll();