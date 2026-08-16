const SocialScheduler = (() => {
  function count(map, id) {
    return map && map[id] ? map[id] : 0;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function selectByes(players, byeCount) {
    if (byeCount <= 0) return [];

    // Primary fairness rule:
    // Nobody receives another bye while another present player has fewer byes.
    const minByes = Math.min(...players.map(p => p.byes || 0));
    let pool = players.filter(p => (p.byes || 0) === minByes);

    // If more byes are required than the minimum-bye group contains,
    // move to the next bye level only after exhausting this group.
    const selected = [];
    let level = minByes;
    while (selected.length < byeCount) {
      let levelPool = players.filter(
        p => !selected.includes(p) && (p.byes || 0) === level
      );

      // Within an equally eligible group, prefer players who have played more games,
      // then randomize exact ties.
      levelPool = shuffle(levelPool).sort((a, b) => (b.games || 0) - (a.games || 0));
      for (const p of levelPool) {
        if (selected.length < byeCount) selected.push(p);
      }
      level++;
    }
    return selected;
  }

  function relationshipPenalty(a, b, type) {
    if (type === "partner") {
      const c = count(a.partnerCounts, b.id) + count(b.partnerCounts, a.id);
      return c === 0 ? -20 : c * 35;
    } else {
      const c = count(a.opponentCounts, b.id) + count(b.opponentCounts, a.id);
      return c === 0 ? -7 : c * 12;
    }
  }

  function gameScore(game) {
    const [a,b,c,d] = game;
    // lower is better
    let score = 0;
    score += relationshipPenalty(a,b,"partner");
    score += relationshipPenalty(c,d,"partner");

    score += relationshipPenalty(a,c,"opponent");
    score += relationshipPenalty(a,d,"opponent");
    score += relationshipPenalty(b,c,"opponent");
    score += relationshipPenalty(b,d,"opponent");

    // Tiny random tie breaker keeps repeated sessions from becoming deterministic.
    score += Math.random() * 0.25;
    return score;
  }

  function arrangementScore(groups) {
    return groups.reduce((sum,g) => sum + gameScore(g), 0);
  }

  function randomArrangement(players) {
    const s = shuffle(players);
    const groups = [];
    for (let i=0; i<s.length; i+=4) groups.push(s.slice(i,i+4));
    return groups;
  }

  function optimize(players, iterations = 7000) {
    let best = randomArrangement(players);
    let bestScore = arrangementScore(best);

    // Random-restart search works well for normal social-club sizes and
    // remains fast in a browser on a phone.
    for (let i=0; i<iterations; i++) {
      const candidate = randomArrangement(players);
      const score = arrangementScore(candidate);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    return { groups: best, score: bestScore };
  }

  function generate(presentPlayers, maxCourts) {
    const n = presentPlayers.length;
    const courts = Math.min(Math.floor(n / 4), maxCourts);
    const activeCount = courts * 4;
    const byeCount = n - activeCount;
    if (courts < 1) return { courts: 0, games: [], byes: [] };

    const byes = selectByes(presentPlayers, byeCount);
    const byeIds = new Set(byes.map(p => p.id));
    const active = presentPlayers.filter(p => !byeIds.has(p.id));

    const optimized = optimize(active);
    const games = optimized.groups.map((group, idx) => ({
      court: idx + 1,
      teamA: [group[0].id, group[1].id],
      teamB: [group[2].id, group[3].id]
    }));

    return {
      courts,
      games,
      byes: byes.map(p => p.id),
      optimizationScore: optimized.score
    };
  }

  return { generate };
})();
