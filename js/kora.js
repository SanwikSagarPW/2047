window.G = window.G || {};

G.Kora = (function () {
  const U = G.utils;
  let lastTopicId = null;
  let contextPlanet = null;

  const INTENTS = [
    { name: 'MISSION_HELP', patterns: ['my mission', 'my objective', 'my task', 'current mission', 'what do i do', 'what should i do', 'help me', 'mission', 'objective'] },
    { name: 'NAVIGATION_HELP', patterns: ['navigate', 'travel to', 'go to', 'fly to', 'route', 'get to'] },
    { name: 'QUIZ_HINT', patterns: ['hint', 'clue', 'stuck', 'help with'] },
    { name: 'FACT_CHECK', patterns: ['is it true', 'is that true', 'really', 'is it real', 'fact check', 'is that correct'] },
    { name: 'COMPARE', patterns: ['difference', 'compare', 'different', 'versus', ' vs ', 'bigger than', 'smaller than', 'like earth', 'as earth'] },
    { name: 'WHAT_IS', patterns: ['what is', 'what are', 'whats', 'define', 'meaning of', 'who is', 'who was'] },
    { name: 'WHY', patterns: ['why', 'reason', 'cause'] },
    { name: 'HOW', patterns: ['how do', 'how does', 'how is', 'how are', 'way to', 'how far'] },
    { name: 'WHERE', patterns: ['where'] },
    { name: 'WHEN', patterns: ['when', 'what year', 'what time', 'how long'] },
    { name: 'CASUAL', patterns: ['hello', 'hey', 'joke', 'funny', 'how are you', 'thank', 'thanks', 'good morning', 'good night'], regex: ['\\bhi\\b', '\\bbye\\b'] }
  ];

  const STOPWORDS = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'why', 'how', 'does', 'did', 'are', 'was', 'were', 'can', 'could', 'you', 'your', 'about', 'there', 'have', 'has', 'will', 'would', 'should'];

  function detectIntent(text) {
    for (let i = 0; i < INTENTS.length; i++) {
      const pats = INTENTS[i].patterns;
      for (let j = 0; j < pats.length; j++) {
        if (text.indexOf(pats[j]) >= 0) return INTENTS[i].name;
      }
      if (INTENTS[i].regex) {
        for (let j = 0; j < INTENTS[i].regex.length; j++) {
          if (new RegExp(INTENTS[i].regex[j]).test(text)) return INTENTS[i].name;
        }
      }
    }
    return 'WHAT_IS';
  }

  function scoreTopic(topic, words, text) {
    let score = 0;
    for (let i = 0; i < topic.aliases.length; i++) {
      const a = topic.aliases[i];
      if (text === a) score += 100;
      else if (text.indexOf(a) >= 0) score += 40;
      else if (a.indexOf(text) >= 0 && text.length > 3) score += 20;
    }
    for (let i = 0; i < topic.keywords.length; i++) {
      const k = topic.keywords[i];
      if (k.indexOf(' ') >= 0) {
        if (text.indexOf(k) >= 0) score += 20;
        continue;
      }
      for (let j = 0; j < words.length; j++) {
        const w = words[j];
        if (STOPWORDS.indexOf(w) >= 0) continue;
        if (w === k) score += 15;
        else if (k.length >= 3 && w.length > k.length && w.indexOf(k) === 0) score += 8;
        else if (k.length >= 3 && w.length >= 3 && U.levenshtein(w, k) <= 1) score += 6;
      }
    }
    if (topic.planet && contextPlanet && topic.planet === contextPlanet) score += 12;
    if (score > 0 && topic.id === lastTopicId) score += 25;
    return score;
  }

  function findTopic(text) {
    const norm = U.normalizeText(text);
    const words = norm.split(' ').filter(function (w) { return w.length > 1; });
    let best = null, bestScore = 0;
    const topics = G.KNOWLEDGE;
    for (let i = 0; i < topics.length; i++) {
      const s = scoreTopic(topics[i], words, norm);
      if (s > bestScore) { bestScore = s; best = topics[i]; }
    }
    if (best && bestScore >= 20) return { topic: best, score: bestScore };
    if (best && bestScore >= 10) return { topic: best, score: bestScore, weak: true };
    return null;
  }

  function pick(arr, seed) {
    if (!arr || !arr.length) return '';
    const i = Math.floor((seed || Math.random()) * arr.length) % arr.length;
    return arr[i];
  }

  function fill(template, vars) {
    let out = template;
    for (const k in vars) {
      out = out.split('{' + k + '}').join(vars[k]);
    }
    return out;
  }

  function personalityLine(category, vars) {
    const lines = G.KORA_LINES[category];
    if (!lines) return '';
    return ' ' + fill(pick(lines), vars || {});
  }

  function missionHelp() {
    const st = G.Save.get();
    const mission = G.MISSIONS[st.missionIndex];
    if (!mission) return 'All missions are complete. You are officially unstoppable.';
    const step = mission.steps[st.missionStep];
    return 'Current mission: ' + mission.title + '. ' + (step ? step.text : 'Mission complete.');
  }

  function respond(rawText, opts) {
    opts = opts || {};
    const st = G.Save.get();
    const vars = {
      name: (st.profile && st.profile.name) || 'Explorer',
      rank: G.Save.rank().name
    };
    const text = U.normalizeText(rawText);
    if (!text) return { text: 'I did not catch that. Could you say it again?', intent: 'UNKNOWN' };

    const intent = detectIntent(text);

    if (intent === 'CASUAL') {
      if (text.indexOf('joke') >= 0 || text.indexOf('funny') >= 0) {
        return { text: pick(G.KORA_LINES.jokes), intent: intent };
      }
      if (text.indexOf('thank') >= 0) {
        return { text: 'You are welcome, ' + vars.name + '. Gratitude accepted and filed.', intent: intent };
      }
      if (text.indexOf('how are you') >= 0) {
        return { text: 'I am functioning at 99.7% efficiency, which is 0.7% above my warranty. How are you?', intent: intent };
      }
      return { text: fill(pick(G.KORA_LINES.greetings), vars), intent: intent };
    }

    if (intent === 'MISSION_HELP') {
      return { text: missionHelp(), intent: intent };
    }

    if (intent === 'NAVIGATION_HELP') {
      return { text: 'Open the navigation map with M, select a destination, and fly there. ' + fill(pick(G.KORA_LINES.scale), vars), intent: intent };
    }

    if (intent === 'QUIZ_HINT') {
      return { text: 'Use the scanner on objects near you — every scan teaches you something. Or ask me about the topic and I will explain it.', intent: intent };
    }

    const found = findTopic(text);
    if (!found) {
      const related = lastTopicId ? (G.KNOWLEDGE.find(function (t) { return t.id === lastTopicId; }) || null) : null;
      if (related && related.related && related.related.length) {
        const rel = G.KNOWLEDGE.find(function (t) { return t.id === related.related[0]; });
        if (rel) {
          return { text: 'I am not sure about that, but since you asked about ' + related.topic + ' — ' + rel.child, intent: 'UNKNOWN', topic: rel };
        }
      }
      return { text: fill(pick(G.KORA_LINES.unknown), vars), intent: 'UNKNOWN' };
    }

    const topic = found.topic;
    lastTopicId = topic.id;

    if (found.weak) {
      return { text: 'I think you are asking about ' + topic.topic + '. ' + topic.child + ' ' + fill(pick(G.KORA_LINES.unknown), vars), intent: intent, topic: topic, weak: true };
    }

    let response = topic.child;

    if (intent === 'COMPARE' && topic.related && topic.related.length) {
      const rel = G.KNOWLEDGE.find(function (t) { return t.id === topic.related[0]; });
      if (rel) response += ' Compared to ' + rel.topic.toLowerCase() + ': ' + rel.summary;
    }

    if (topic.misconception && (text.indexOf('really') >= 0 || text.indexOf('true') >= 0)) {
      response += ' ' + fill(pick(G.KORA_LINES.misconception), vars);
    }

    if (opts.discovered) {
      response += ' ' + fill(pick(G.KORA_LINES.discovery), vars);
    }

    return { text: response, intent: intent, topic: topic };
  }

  function setContext(planetId) {
    contextPlanet = planetId;
  }

  function greet() {
    const st = G.Save.get();
    const vars = {
      name: (st.profile && st.profile.name) || 'Explorer',
      rank: G.Save.rank().name
    };
    return fill(pick(G.KORA_LINES.greetings), vars);
  }

  function discoveryLine() {
    return fill(pick(G.KORA_LINES.discovery), { name: (G.Save.get().profile && G.Save.get().profile.name) || 'Explorer' });
  }

  function quizLine(correct, hint) {
    if (correct) return fill(pick(G.KORA_LINES.quizCorrect), {});
    return fill(pick(G.KORA_LINES.quizWrong), { hint: hint || 'look around you' });
  }

  return {
    respond: respond,
    setContext: setContext,
    greet: greet,
    discoveryLine: discoveryLine,
    quizLine: quizLine,
    lastTopic: function () { return lastTopicId; }
  };
})();
