const SocialScheduler = (() => {
  const count=(m,id)=>(m&&m[id])||0;
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  function selectByes(players, byeCount, nextRound, gameMinutes) {
    if (byeCount <= 0) return [];
    const picked = [];
    const hourRounds = Math.max(1, Math.round(60 / Math.max(1,gameMinutes)));

    while (picked.length < byeCount) {
      const remaining = players.filter(p => !picked.includes(p));
      const minByes = Math.min(...remaining.map(p => p.byes || 0));
      let pool = remaining.filter(p => (p.byes || 0) === minByes);

      const hourSafe = pool.filter(p => p.lastByeRound == null || (nextRound - p.lastByeRound) >= hourRounds);
      if (hourSafe.length) pool = hourSafe;

      pool = shuffle(pool).sort((a,b) => {
        const ag = a.lastByeRound == null ? 9999 : nextRound-a.lastByeRound;
        const bg = b.lastByeRound == null ? 9999 : nextRound-b.lastByeRound;
        if (bg !== ag) return bg-ag;
        return (b.games||0)-(a.games||0);
      });
      picked.push(pool[0]);
    }
    return picked;
  }

  function rel(a,b,type){
    if(type==="partner"){
      const c=count(a.partnerCounts,b.id)+count(b.partnerCounts,a.id);
      return c===0?-20:c*35;
    }
    const c=count(a.opponentCounts,b.id)+count(b.opponentCounts,a.id);
    return c===0?-7:c*12;
  }

  function score(g){
    const [a,b,c,d]=g;
    return rel(a,b,"partner")+rel(c,d,"partner")
      +rel(a,c,"opponent")+rel(a,d,"opponent")+rel(b,c,"opponent")+rel(b,d,"opponent")
      +Math.random()*.25;
  }

  function arrangement(players){
    const s=shuffle(players), groups=[];
    for(let i=0;i<s.length;i+=4) groups.push(s.slice(i,i+4));
    return groups;
  }

  function optimize(players){
    let best=arrangement(players), bestScore=best.reduce((x,g)=>x+score(g),0);
    for(let i=0;i<9000;i++){
      const c=arrangement(players), cs=c.reduce((x,g)=>x+score(g),0);
      if(cs<bestScore){best=c;bestScore=cs;}
    }
    return best;
  }

  function generate(players, selectedCourts, nextRound, gameMinutes){
    const courts=[...selectedCourts].sort((a,b)=>a-b);
    const courtCount=Math.min(Math.floor(players.length/4),courts.length);
    const byeCount=players.length-courtCount*4;
    if(courtCount<1) return {games:[],byes:[]};

    const byes=selectByes(players,byeCount,nextRound,gameMinutes);
    const byeIds=new Set(byes.map(p=>p.id));
    const active=players.filter(p=>!byeIds.has(p.id));
    const groups=optimize(active);

    return {
      games: groups.map((g,i)=>({court:courts[i],teamA:[g[0].id,g[1].id],teamB:[g[2].id,g[3].id]})),
      byes: byes.map(p=>p.id)
    };
  }
  return {generate};
})();