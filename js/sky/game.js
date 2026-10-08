(function (S) {
  'use strict';
  // Game layer: missions, quizzes, score, ranks, badges, sound and celebrations on top of the lessons.
  var C = S.core, $ = C.$, LESSONS = S.content.LESSONS, G = S.game = {};
  var RANKS = [[0, '\ud83d\ude80', 'Cadet'], [20, '\ud83c\udf1f', 'Star Scout'], [55, '\ud83d\udef0\ufe0f', 'Sky Ranger'], [100, '\ud83e\ude90', 'Planet Pilot'], [150, '\ud83d\udc68\u200d\ud83d\ude80', 'Galaxy Captain'], [210, '\ud83c\udfc6', 'Space Legend']];
  var WORLDS = { sky: ['\ud83c\udfd4\ufe0f', 'Ladakh Sky'], earth: ['\ud83c\udf0d', 'Earth'], moon: ['\ud83c\udf19', 'Moon'], solar: ['\u2600\ufe0f', 'Planets'], galaxy: ['\ud83c\udf0c', 'Galaxy'] };
  var PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  var save = { score: 0, done: {} };
  try { var sv = JSON.parse(localStorage.getItem('skyj.game') || 'null'); if (sv) save = sv; } catch (e) { }
  G.score = save.score;
  function persist() { try { localStorage.setItem('skyj.game', JSON.stringify(save)); } catch (e) { } }

  // ---------- quests (matched by lesson title; '=' means exact match) ----------
  function Z(q, o, a, why) { return { t: 'quiz', q: q, o: o, a: a, why: why }; }
  function conn(seq, goal) { return { t: 'connect', seq: seq, goal: goal, hint: 'Tap the glowing number in order: 1, 2, 3\u2026' }; }
  var isPlanet = function (id) { return PLANETS.indexOf(id) >= 0 || id === 'mercury'; };
  var QUESTS = [
    ['Hanle', { t: 'tapN', n: 2, m: function (id) { return ['dome', 'moon'].indexOf(id) < 0 && id.indexOf(':') < 0; }, goal: 'Drag to look around, then tap 2 stars', hint: 'Tap any twinkling dot in the sky.' }],
    ['A telescope', { t: 'tapAll', ids: ['dome'], goal: 'Find and tap the white observatory dome', hint: 'Look low, near the mountains in the south-east.' }],
    ['Stars are', Z('What do stars use to shine?', ['Their own light', 'Reflected sunlight', 'Street lamps'], 0, 'Stars are glowing balls of gas that make their own light!')],
    ['Where do stars', { t: 'seq', steps: ['\ud83c\udf05', '\ud83c\udf19'], ev: 'sunAlt', tests: [function (v) { return v > -4; }, function (v) { return v < -18; }], goal: 'Watch the sunrise, then slide the clock back to night', hint: 'Drag the clock slider back to the left.' }],
    ['Joining', Z('What do we call a pattern of stars?', ['Constellation', 'Galaxy', 'Comet'], 0, 'Constellations are patterns people imagined in the stars.')],
    ['The Big Dipper', conn([['dubhe', null], ['merak', 'dubhe'], ['phecda', 'merak'], ['megrez', 'phecda'], ['alioth', 'megrez'], ['mizar', 'alioth'], ['alkaid', 'mizar']], 'Connect the 7 stars of the Big Dipper!')],
    ['Find the Pole', { t: 'tapAll', ids: ['polaris'], goal: 'Tap the Pole Star at the end of the dashed line', hint: 'Follow the yellow dashes from Merak through Dubhe.' }],
    ['The Little Dipper', conn([['polaris', null], ['yildun', 'polaris'], ['epsumi', 'yildun'], ['zetumi', 'epsumi'], ['etaumi', 'zetumi'], ['pherkad', 'etaumi'], ['kochab', 'pherkad']], 'Connect the Little Dipper \u2014 start at the Pole Star!')],
    ['The sky turns', { t: 'collect', ev: 'hourBtn', n: 3, goal: 'Tap 3 different times and watch the Big Dipper move', hint: 'Use the 9 PM, 11 PM, 1 AM and 3 AM buttons.' }],
    ['Orion', conn([['betelgeuse', null], ['alnitak', 'betelgeuse'], ['alnilam', 'alnitak'], ['mintaka', 'alnilam'], ['bellatrix', 'mintaka'], ['rigel', 'mintaka'], ['saiph', 'alnitak']], 'Draw Orion the Hunter by joining the dots!')],
    ['Sirius', { t: 'tapAll', ids: ['sirius'], goal: 'Find and tap Sirius, the brightest star', hint: 'Follow the three belt stars down and to the left.' }],
    ['Different sky', { t: 'collect', ev: 'month', n: 3, goal: 'Visit 3 different months and watch the sky change', hint: 'Tap the month buttons.' }],
    ['Planets wander', { t: 'tapN', n: 2, m: function (id) { return ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].indexOf(id) >= 0; }, goal: 'Tap 2 planets \u2014 steady dots on the dotted line', hint: 'Planets do not twinkle. Look along the yellow dotted line.' }],

    ['Earth \u2014 Our', Z('From space, can you see borders between countries?', ['No, none are visible', 'Yes, thick black lines', 'Only around India'], 0, 'Earth looks completely one from space!')],
    ['Seeing Earth', Z('Who was the first Indian to see Earth from space?', ['Rakesh Sharma', 'Shubhanshu Shukla', 'Neil Armstrong'], 0, 'Wing Commander Rakesh Sharma flew in 1984.')],
    ['Land and sea', Z('From high up in space, what do we see?', ['Broad shapes of land and sea', 'Our street and house', 'Every village'], 0, 'Smaller details are too tiny to see from far away.')],
    ['My address', { t: 'tapAll', ids: ['pin:Hanle, Ladakh', 'pin:India'], goal: 'Tap Hanle and India on the globe', hint: 'Turn the globe. The labels are tappable.' }],
    ['Nature has', Z('What moves freely across the world?', ['Air, water, clouds and animals', 'Only people', 'Nothing at all'], 0, 'Nature has no boundaries!')],
    ['The Travelling', Z('Rosy starlings fly to India from\u2026', ['Russia and Mongolia', 'Brazil', 'Australia'], 0, 'They travel thousands of kilometres every winter.')],
    ['Yoga', Z('Which day is International Day of Yoga?', ['21 June', '15 August', '2 October'], 0, 'The UN chose 21 June in 2014.')],
    ['Chilli', Z('Chilli first came to India from\u2026', ['South America', 'Africa', 'China'], 0, 'Portuguese travellers brought chillies 400\u2013500 years ago.')],
    ['The Sweet', Z('The story of sugar began in\u2026', ['India', 'Mexico', 'Brazil'], 0, 'Jaggery from sugarcane was first made in India.')],
    ['The Mexican', Z('Marigold flowers originally come from\u2026', ['Mexico', 'Russia', 'Portugal'], 0, 'Marigolds are special flowers in Mexican festivals.')],
    ['The Cows', Z('Which Indian cow breed went to Brazil?', ['Gir', 'Jersey', 'Holstein'], 0, 'Gir, Kankrej and Ongole are the Indian breeds there.')],
    ['We are all', Z('Orange paths on the globe show things that\u2026', ['Came to India', 'Left India', 'Stayed home'], 0, 'Blue paths went out from India.')],
    ['Vasudhaiva', Z('\u2018Vasudhaiva Kutumbakam\u2019 means\u2026', ['The world is one family', 'Eat more mangoes', 'Climb the mountain'], 0, 'We all share one home \u2014 Earth.')],
    ['Earth spins', Z('Earth spinning once a day gives us\u2026', ['Day and night', 'The phases of the Moon', 'A new year'], 0, 'That spinning is called rotation.')],
    ['Things that go', { t: 'tapN', n: 2, m: function (id) { return id.indexOf('sat:') === 0; }, goal: 'Tap 2 satellites to meet them', hint: 'Tap the little pills floating near Earth.' }],

    ['=The Moon', Z('Does the Moon make its own light?', ['No, it reflects sunlight', 'Yes, like the Sun', 'Only at night'], 0, 'The Moon shines by reflecting sunlight.')],
    ['Why does the Moon', { t: 'collect', ev: 'phase', n: 2, key: function (f) { return Math.abs(f - 0.5) < 0.035 ? 'full' : (f < 0.035 || f > 0.965) ? 'new' : null; }, goal: 'Slide to make a Full Moon and a New Moon', hint: 'Full Moon is in the middle of the slider, New Moon is at the ends.' }],

    ['The Sun and', { t: 'tapN', n: 3, m: function (id) { return isPlanet(id); }, goal: 'Tap 3 planets to meet them', hint: 'Tap a planet or use the round buttons.' }],
    ['Mercury to', { t: 'order', seq: PLANETS, goal: 'Tap the 8 planets in order, closest to the Sun first!', hint: 'Mercury is the closest to the Sun.' }],
    ['Planets go', { t: 'hunt', list: [['mars', 'I am the Red Planet. Find me!'], ['saturn', 'I wear beautiful bright rings!'], ['jupiter', 'I am the biggest planet!'], ['venus', 'I am the hottest planet, called the Evening Star!']], goal: 'Planet hunt!', hint: 'Zoom in or tap the round planet buttons.' }],
    ['Asteroids', { t: 'tapAll', ids: ['belt', 'comet'], goal: 'Tap the asteroid belt and the comet', hint: 'Look for the two floating pills.' }],
    ['Pluto', Z('Pluto is a\u2026', ['Dwarf planet', 'Star', 'Comet'], 0, 'Pluto is a dwarf planet \u2014 not one of the eight.')],

    ['=The Sun', Z('The Sun is a\u2026', ['Star', 'Planet', 'Moon'], 0, 'The Sun is our nearest star.')],
    ['=Mercury', Z('Mercury is the ___ planet to the Sun.', ['Closest', 'Farthest', 'Coolest'], 0, 'And it is also the smallest planet.')],
    ['=Venus', Z('Which planet is called the Evening Star?', ['Venus', 'Mars', 'Saturn'], 0, 'It is bright, but it is really a planet!')],
    ['=Earth', Z('Earth is special because\u2026', ['It has life', 'It has rings', 'It is the biggest'], 0, 'Earth is the only planet we know that has life.')],
    ['=Mars', Z('Why does Mars look red?', ['Rusty iron-rich soil', 'It is on fire', 'It is painted'], 0, 'The iron in its soil has rusted.')],
    ['=Jupiter', Z('Jupiter is the\u2026', ['Biggest planet', 'Smallest planet', 'Closest planet'], 0, 'Over 1,300 Earths could fit inside!')],
    ['=Saturn', Z('Saturn is famous for its\u2026', ['Rings', 'Volcanoes', 'Oceans'], 0, 'The rings are made of ice and rock.')],
    ['=Uranus', Z('Uranus spins\u2026', ['On its side', 'Not at all', 'Very fast like a top'], 0, 'It rolls around the Sun tilted over!')],
    ['=Neptune', Z('Neptune is the\u2026', ['Farthest planet', 'Closest planet', 'Biggest planet'], 0, 'Its year lasts about 165 Earth years.')],

    ['The Milky Way', { t: 'tapAll', ids: ['here'], goal: 'Find and tap \u201cYou are here\u201d', hint: 'Look for the pin floating on one of the spiral arms.' }],
    ['Billions', Z('The Milky Way is a\u2026', ['Galaxy', 'Planet', 'Comet'], 0, 'And there are billions of other galaxies!')]
  ];

  G.peek = function (L) {
    for (var i = 0; i < QUESTS.length; i++) {
      var p = QUESTS[i][0], ex = p.charAt(0) === '=', n = ex ? p.slice(1) : p;
      if (ex ? L.title === n : L.title.indexOf(n) === 0) return QUESTS[i][1];
    }
    return null;
  };
  function keyOf(L) { return L.tab + '|' + L.title; }
  function isDone(L) { return !!save.done[keyOf(L)]; }

  // ---------- sound ----------
  var ac = null;
  function tone(f, d, type, at, vol) {
    if (!ac) return;
    var t0 = ac.currentTime + (at || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.05);
  }
  G.sfx = function (k) {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (ac.state === 'suspended') ac.resume();
    if (k === 'tap') tone(620, 0.08, 'triangle', 0, 0.08);
    else if (k === 'ok') { tone(660, 0.12, 'triangle'); tone(880, 0.18, 'triangle', 0.1); }
    else if (k === 'bad') { tone(200, 0.2, 'sawtooth', 0, 0.09); tone(150, 0.22, 'sawtooth', 0.12, 0.09); }
    else if (k === 'win') [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'triangle', i * 0.1); });
    else if (k === 'level') [392, 523, 659, 784, 988, 1175].forEach(function (f, i) { tone(f, 0.2, 'square', i * 0.08, 0.07); });
  };

  // ---------- effects ----------
  var fx = document.createElement('div'); fx.id = 'fx'; document.body.appendChild(fx);
  G.confetti = function (x, y, n) {
    var cols = ['#ffd23f', '#ff6b9d', '#42e6b0', '#4cc9ff', '#9b7bff'];
    x = x == null ? window.innerWidth / 2 : x; y = y == null ? window.innerHeight * 0.4 : y;
    for (var i = 0; i < (n || 26); i++) {
      var p = document.createElement('i'), a = Math.random() * 6.283, d = 70 + Math.random() * 130;
      p.className = 'cf'; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = cols[i % cols.length];
      p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d - 60 + 'px'); p.style.setProperty('--r', Math.random() * 720 + 'deg');
      fx.appendChild(p); setTimeout(function (q) { q.remove(); }.bind(null, p), 1400);
    }
  };
  function toast(html, ms) {
    var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; fx.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, ms || 1900); setTimeout(function () { t.remove(); }, (ms || 1900) + 400);
  }
  $('gl').addEventListener('pointerdown', function (e) {
    var r = document.createElement('i'); r.className = 'ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; fx.appendChild(r);
    setTimeout(function () { r.remove(); }, 600);
  });

  // ---------- score / rank ----------
  function rankIdx(s) { var k = 0; RANKS.forEach(function (r, i) { if (s >= r[0]) k = i; }); return k; }
  G.rank = function () { return RANKS[rankIdx(save.score)]; };
  G.render = function () {
    var i = rankIdx(save.score), lo = RANKS[i][0], hi = RANKS[i + 1] ? RANKS[i + 1][0] : lo + 1;
    $('stars-n').textContent = save.score;
    var tabQ = questIdx(LESSONS[Math.max(0, C.index)].tab), dn = tabQ.filter(function (k) { return isDone(LESSONS[k]); }).length;
    $('mis-n').textContent = dn + '/' + tabQ.length;
    $('rank-ico').textContent = RANKS[i][1];
    $('stars-count').title = RANKS[i][2];
    $('xp-fill').style.width = (RANKS[i + 1] ? Math.min(100, (save.score - lo) / (hi - lo) * 100) : 100) + '%';
    [].forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('badge', worldDone(b.dataset.tab)); });
  };
  G.add = function (n) {
    var before = rankIdx(save.score);
    save.score += n; G.score = save.score; persist(); G.render();
    var after = rankIdx(save.score);
    if (after > before) { G.sfx('level'); G.confetti(null, null, 40); toast('<b>' + RANKS[after][1] + ' New rank!</b><br>' + RANKS[after][2], 2400); S.Kora.mood('happy', 3); }
  };
  function worldDone(tab) {
    var any = false;
    for (var i = 0; i < LESSONS.length; i++) { var L = LESSONS[i]; if (L.tab !== tab || !G.peek(L)) continue; any = true; if (!isDone(L)) return false; }
    return any;
  }

  // ---------- mission banner ----------
  var Q = null, banner = $('mission');
  function setPips(total, n) {
    var p = $('m-pips'); p.textContent = '';
    if (total > 8) { p.textContent = n + '/' + total; return; }
    for (var i = 0; i < total; i++) p.appendChild(C.el('i', i < n ? 'on' : ''));
  }
  function total() { var d = Q.d; return d.t === 'tapN' || d.t === 'collect' ? d.n : d.t === 'tapAll' ? d.ids.length : d.t === 'order' || d.t === 'connect' ? d.seq.length : d.t === 'hunt' ? d.list.length : d.t === 'seq' ? d.steps.length : 1; }
  function progress() { setPips(total(), Q.n); }
  function sub(text) { $('m-sub').textContent = text || ''; }
  function showBanner(on) { banner.classList.toggle('hidden', !on); if (on) $('hint').classList.add('gone'); setTimeout(C.layout, 0); }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  G.reset = function () {
    if (Q && Q.d.t === 'connect') { var sc = C.current(); if (sc && sc.numbers) { sc.numbers([]); sc.links([]); } }
    Q = null; showBanner(false); closeResult(); closeQuiz();
  };

  G.next = function (L) {
    var d = G.peek(L);
    if (!d || isDone(L)) return null;
    if (d.t === 'quiz') return { label: 'Quiz time! \ud83c\udfaf', fn: openQuiz, cls: 'pulse' };
    return { label: '\ud83d\udd12 Finish the mission', cls: 'locked', fn: function () { if (Q) { shake(banner); G.sfx('bad'); S.Kora.mood('alert', 1.5); sub(Q.d.hint); C.say('Finish the mission first! ' + (Q.d.hint || '')); } } };
  };

  G.begin = function (L, idx) {
    if (L.key === 'end') showResult();
    var d = G.peek(L), mg = $('m-go');
    mg.classList.add('hidden'); $('m-hint').classList.remove('hidden'); G.render();
    if (!d || isDone(L)) { Q = null; showBanner(false); return; }
    Q = { d: d, L: L, n: 0, set: {}, wrong: 0, hinted: false, done: false, go: null };
    banner.classList.remove('good'); sub(''); $('m-skip').classList.add('hidden');
    if (d.t === 'quiz') {
      $('m-goal').textContent = 'Quick quiz!'; progress(); showBanner(true);
      Q.go = openQuiz; mg.textContent = 'Answer \u2753'; mg.classList.remove('hidden'); $('m-hint').classList.add('hidden');
      return;
    }
    $('m-goal').textContent = d.goal; progress(); showBanner(true);
    if (d.t === 'hunt') sub(d.list[0][1]);
    if (d.t === 'connect') {
      var sc = C.current();
      sc.showLines(false); sc.numbers(d.seq.map(function (s) { return s[0]; })); sc.setNext(0); sc.links([]);
    }
  };
  $('m-go').addEventListener('click', function () { if (Q && Q.go) Q.go(); });

  // ---------- events from the scenes ----------
  G.blockInfo = function () { return !!(Q && !Q.done && (Q.d.t === 'order' || Q.d.t === 'hunt' || Q.d.t === 'connect')); };

  G.tap = function (raw) {
    if (!Q || Q.done) return;
    var id = String(raw).replace(/^orr:/, ''), d = Q.d;
    G.sfx('tap');
    if (d.t === 'tapN') {
      if (d.m(id) && !Q.set[id]) { Q.set[id] = 1; Q.n++; hit(); }
    } else if (d.t === 'tapAll') {
      if (d.ids.indexOf(id) >= 0 && !Q.set[id]) { Q.set[id] = 1; Q.n++; hit(); } else if (d.ids.indexOf(id) < 0) { sub('Not that one \u2014 keep looking!'); }
    } else if (d.t === 'order') {
      if (PLANETS.indexOf(id) < 0) return;
      if (id === d.seq[Q.n]) { Q.n++; hit(); sub(Q.n < d.seq.length ? 'Great! Next planet\u2026' : ''); } else miss(Q.wrong >= 1 ? 'Next is ' + d.seq[Q.n].toUpperCase() + '!' : 'Not yet! Which planet is next from the Sun?');
    } else if (d.t === 'hunt') {
      if (id === d.list[Q.n][0]) { Q.n++; hit(); if (Q.n < d.list.length) sub(d.list[Q.n][1]); } else if (PLANETS.indexOf(id) >= 0) miss('Not me! ' + d.list[Q.n][1]);
    } else if (d.t === 'connect') {
      var sc = C.current();
      if (id === d.seq[Q.n][0]) {
        Q.n++; var pairs = []; for (var i = 0; i < Q.n; i++) if (d.seq[i][1]) pairs.push([d.seq[i][1], d.seq[i][0]]);
        sc.links(pairs); sc.setNext(Q.n); hit(true);
      } else if (A_STAR(id)) miss('Tap star number ' + (Q.n + 1) + '!');
    }
  };
  function A_STAR(id) { return !!S.astro.STAR[id]; }
  function hit(quiet) {
    progress(); if (!quiet) G.sfx('ok'); else G.sfx('tap'); G.add(1);
    $('m-pips').classList.remove('pop'); void $('m-pips').offsetWidth; $('m-pips').classList.add('pop');
    if (Q.n >= total()) finish();
  }
  function miss(msg) {
    Q.wrong++; G.sfx('bad'); S.Kora.mood('alert', 1.2); shake(banner); sub(msg); C.say(msg);
  }

  G.ev = function (name, val) {
    if (!Q || Q.done) return;
    var d = Q.d;
    if (d.t === 'seq' && d.ev === name) {
      if (d.tests[Q.n](val)) { Q.n++; G.sfx('ok'); progress(); if (Q.n >= total()) finish(); }
    } else if (d.t === 'collect' && d.ev === name) {
      var k = d.key ? d.key(val) : String(val);
      if (k != null && !Q.set[k]) { Q.set[k] = 1; Q.n++; G.sfx('ok'); progress(); if (Q.n >= total()) finish(); }
    }
  };

  $('m-hint').addEventListener('click', function () {
    if (!Q) return;
    Q.hinted = true; sub(Q.d.hint || ''); C.say(Q.d.hint || ''); S.Kora.mood('think', 1.5);
    $('m-skip').classList.remove('hidden');
  });
  $('m-skip').addEventListener('click', function () { if (Q && !Q.done) finish(true); });

  function finish(skipped, rewardOverride, silent) {
    var d = Q.d; Q.done = true;
    var reward = skipped ? 0 : rewardOverride != null ? rewardOverride : d.t === 'connect' ? 8 : d.t === 'hunt' || d.t === 'order' ? 10 : 5;
    if (!skipped && !silent) { G.sfx('win'); G.confetti(); S.Kora.mood('happy', 3); }
    save.done[keyOf(Q.L)] = 1; persist();
    if (reward) G.add(reward);
    banner.classList.add('good'); $('m-goal').textContent = skipped ? 'Skipped' : '\u2714 Done!  +' + reward + ' \u2b50'; sub(''); $('m-skip').classList.add('hidden'); $('m-hint').classList.add('hidden');
    var nx = G.suggest(), mg = $('m-go');
    Q.go = function () { C.go(nx); };
    mg.textContent = LESSONS[nx].key === 'end' ? 'Finish \ud83c\udf89' : 'Next mission \u25b6'; mg.classList.remove('hidden');
    if (d.t === 'connect') { var sc = C.current(); sc.showLines(true); sc.reveal(d.seq.map(function (s) { return s[0]; })); }
    if (!skipped && !silent) C.say(d.t === 'connect' ? 'You drew it! Great job, star detective!' : 'Mission complete! Awesome!');
    checkWorld(); G.render(); setTimeout(C.layout, 0);
  }
  var NEXT_TAB = { sky: 'earth', earth: 'moon', moon: 'solar', solar: 'galaxy' };
  function checkWorld() {
    var tab = Q.L.tab;
    if (worldDone(tab) && !save['badge_' + tab]) {
      save['badge_' + tab] = 1; persist();
      setTimeout(function () {
        G.sfx('level'); G.confetti(null, null, 40); toast('<b>' + WORLDS[tab][0] + ' Badge won!</b><br>' + WORLDS[tab][1] + ' Explorer', 2600); G.add(10); G.render();
        var nb = NEXT_TAB[tab] && document.querySelector('#nav button[data-tab="' + NEXT_TAB[tab] + '"]');
        if (nb) nb.classList.add('pulse');
      }, 900);
    }
  }

  // ---------- suggestions and mission picker ----------
  function questIdx(tab) { var o = []; LESSONS.forEach(function (L, i) { if (L.tab === tab && G.peek(L)) o.push(i); }); return o; }
  G.firstUndoneIn = function (tab) {
    var q = questIdx(tab);
    for (var k = 0; k < q.length; k++) if (!isDone(LESSONS[q[k]])) return q[k];
    return q.length ? q[0] : -1;
  };
  G.suggest = function () {
    var i, L;
    for (i = Math.max(0, C.index) + 1; i < LESSONS.length; i++) { L = LESSONS[i]; if (G.peek(L) && !isDone(L)) return i; }
    for (i = 0; i < LESSONS.length; i++) { L = LESSONS[i]; if (G.peek(L) && !isDone(L)) return i; }
    return LESSONS.length - 1;
  };
  var TICON = { tapN: '\ud83d\udc46', tapAll: '\ud83d\udc46', connect: '\u2728', quiz: '\u2753', seq: '\u23f1\ufe0f', collect: '\u23f1\ufe0f', order: '\ud83e\ude90', hunt: '\ud83d\udd0e' };
  var picker = null;
  function closePicker() { if (picker) { picker.remove(); picker = null; } }
  G.openPicker = function () {
    closePicker();
    var cur = LESSONS[Math.max(0, C.index)], tab = cur.tab, sug = G.suggest();
    picker = C.el('div'); picker.id = 'mpick';
    picker.innerHTML = '<div class="mp-panel"><div class="mp-head"><h3></h3><button type="button" aria-label="Close">\u2715</button></div><div class="mp-grid"></div></div>';
    picker.querySelector('h3').textContent = WORLDS[tab][0] + ' ' + WORLDS[tab][1] + ' missions';
    var grid = picker.querySelector('.mp-grid');
    questIdx(tab).forEach(function (i) {
      var L = LESSONS[i], d = G.peek(L), b = C.el('button', 'mp-tile' + (isDone(L) ? ' done' : '') + (i === C.index ? ' cur' : '') + (i === sug ? ' sug' : ''));
      b.type = 'button'; b.innerHTML = '<i>' + TICON[d.t] + '</i><span></span>'; b.lastChild.textContent = L.title;
      b.onclick = function () { closePicker(); C.go(i); };
      grid.appendChild(b);
    });
    picker.querySelector('button').onclick = closePicker;
    picker.addEventListener('click', function (e) { if (e.target === picker) closePicker(); });
    document.body.appendChild(picker);
  };
  $('btn-missions').addEventListener('click', G.openPicker);

  // ---------- quiz (modal) ----------
  var quizEl = null;
  function closeQuiz() { if (quizEl) { quizEl.remove(); quizEl = null; } }
  function openQuiz() {
    if (!Q || Q.d.t !== 'quiz' || Q.done) return;
    closeQuiz();
    var d = Q.d;
    quizEl = C.el('div'); quizEl.id = 'quiz';
    quizEl.innerHTML = '<div class="q-card"><button class="q-x" type="button" aria-label="Close">\u2715</button><small>Quick quiz \u2b50</small><h3></h3><div class="q-opts"></div><div class="q-msg"></div></div>';
    quizEl.querySelector('h3').textContent = d.q;
    var box = quizEl.querySelector('.q-opts'), msg = quizEl.querySelector('.q-msg');
    d.o.map(function (t, i) { return [t, i]; }).sort(function () { return Math.random() - 0.5; }).forEach(function (p) {
      var b = C.el('button', 'opt'); b.type = 'button'; b.textContent = p[0];
      b.addEventListener('click', function () {
        if (Q.done) return;
        if (p[1] === d.a) {
          b.classList.add('right'); var reward = Q.wrong === 0 ? 5 : Q.wrong === 1 ? 3 : 2;
          G.sfx('win'); G.confetti(); S.Kora.mood('happy', 3);
          msg.textContent = '\u2714 Correct!  +' + reward + ' \u2b50  \u2014 ' + d.why; C.say(d.why);
          [].forEach.call(box.children, function (x) { x.disabled = true; });
          finish(false, reward, true);
          setTimeout(closeQuiz, 2200);
        } else {
          Q.wrong++; b.classList.add('wrong'); b.disabled = true; G.sfx('bad'); S.Kora.mood('alert', 1.2); shake(quizEl.firstChild);
          msg.textContent = Q.wrong >= 2 ? 'Hint: ' + d.why : 'Oops, try again!';
        }
      });
      box.appendChild(b);
    });
    quizEl.querySelector('.q-x').onclick = closeQuiz;
    document.body.appendChild(quizEl);
  }
  function elText(t) { $('c-text').textContent = t; }

  // ---------- results ----------
  var res = null;
  function closeResult() { if (res) { res.remove(); res = null; } }
  function showResult() {
    closeResult();
    var r = G.rank(), done = 0, tot = 0;
    LESSONS.forEach(function (L) { if (G.peek(L)) { tot++; if (isDone(L)) done++; } });
    res = C.el('div', 'result');
    var badges = Object.keys(WORLDS).map(function (t) { return '<span class="rb ' + (worldDone(t) ? 'on' : '') + '">' + WORLDS[t][0] + '<small>' + WORLDS[t][1] + '</small></span>'; }).join('');
    res.innerHTML = '<div class="rcard"><h2>\ud83c\udf89 Mission Complete!</h2><div class="rbig">' + r[1] + '</div><b class="rrank">' + r[2] + '</b>' +
      '<div class="rstars">\u2b50 ' + save.score + '</div><p>' + done + ' of ' + tot + ' missions done</p><div class="rbs">' + badges + '</div>' +
      '<div class="rbtn"><button class="primary" id="r-again">Fly again \ud83d\ude80</button><button class="ghost" id="r-stay">Keep exploring</button></div></div>';
    document.body.appendChild(res);
    G.sfx('level'); G.confetti(null, null, 50);
    res.querySelector('#r-stay').onclick = closeResult;
    res.querySelector('#r-again').onclick = function () { closeResult(); C.go(0); };
  }

  G.firstUndone = function () {
    for (var i = 0; i < LESSONS.length; i++) { var L = LESSONS[i]; if (G.peek(L) && !isDone(L)) return i; }
    return 0;
  };
  G.hasProgress = function () { return Object.keys(save.done).length > 0; };
  G.unlockAudio = function () { G.sfx('tap'); };
  G.render();
})(window.Sky = window.Sky || {});
