window.G = window.G || {};

// Explorer Guide (animated tutorial), rover Coach (first-drive hints), Credits and easter eggs.
(function () {
  const U = G.utils;
  function touch() { return !!(G.Touch && G.Touch.enabled()); }
  function esc(s) { return G.Codex.esc(s); }

  // ---------- Explorer Guide ----------
  function slides() {
    const tc = touch();
    const astro = G.Crew ? G.Crew.portrait({ id: 'guide_astro', color: 0x4cf0a0 }) : '';
    const op = G.Crew ? G.Crew.portrait({ id: 'guide_op', color: 0xffb43c }, 'operator') : '';
    return [
      { kicker: 'WELCOME', title: 'Welcome, Explorer!',
        text: 'You are the pilot of the EX-01. Fly through a real Solar System, land on worlds, meet astronauts and learn amazing space science with KORA, your AI co-pilot.',
        chips: ['Explore', 'Scan', 'Learn', 'Collect'],
        art: '<div class="ga ga-welcome"><div class="ga-starfield"></div><div class="ga-sun"></div><div class="ga-orbit o1"><i class="ga-planet p1"></i></div><div class="ga-orbit o2"><i class="ga-planet p2"></i></div><div class="ga-orbit o3"><i class="ga-ship"></i></div></div>' },
      { kicker: 'STEP 1 \u00b7 FLY', title: 'Fly the EX-01',
        text: tc ? 'Drag anywhere on the screen to steer. Slide THRUST up to fly. Hold BOOST to go fast and tap STOP to brake.'
          : 'W and S for thrust, A and D or drag the mouse to steer. Hold Shift to boost and Space to brake.',
        chips: tc ? ['Drag = steer', 'THRUST = go', 'BOOST', 'STOP'] : ['W / S', 'A / D', 'Shift', 'Space'],
        art: tc
          ? '<div class="ga ga-phone"><div class="ga-screen"><div class="ga-sky"></div><i class="ga-bigship"></i><div class="ga-thrust"><i></i></div><div class="ga-finger"></div><span class="ga-pill b1">BOOST</span><span class="ga-pill b2">STOP</span></div></div>'
          : '<div class="ga ga-keys"><div class="ga-sky"></div><i class="ga-bigship"></i><div class="kb"><span class="k kw">W</span><span class="k ka">A</span><span class="k ks">S</span><span class="k kd">D</span><span class="k wide kshift">SHIFT</span></div></div>' },
      { kicker: 'STEP 2 \u00b7 SCAN', title: 'Scan everything',
        text: 'Fly close to planets, moons, satellites or glowing rings and ' + (tc ? 'tap SCAN' : 'press Q') + '. KORA downloads real facts from Wikipedia and you earn XP.',
        chips: [tc ? 'SCAN' : 'Q', '+XP', 'Live facts'],
        art: '<div class="ga ga-scan"><div class="ga-target"><i class="ga-rock"></i><span class="r1"></span><span class="r2"></span></div><div class="ga-beam"></div><div class="ga-bar"><i></i></div><div class="ga-pop">+25 XP</div></div>' },
      { kicker: 'STEP 3 \u00b7 LAND', title: 'Land and drive the rover',
        text: 'Near a world, ' + (tc ? 'tap GO' : 'press E') + ' to land. ' + (tc ? 'Slide THRUST to drive, hold LEFT or RIGHT to turn, and tap SHIP to fly back.' : 'W and S drive, A and D steer, and R takes you back to your ship.'),
        chips: tc ? ['GO = land', 'THRUST', 'LEFT / RIGHT', 'SHIP'] : ['E = land', 'W / S', 'A / D', 'R = ship'],
        art: '<div class="ga ga-land"><div class="ga-moonsky"></div><div class="ga-ground"></div><i class="ga-lander"></i><div class="ga-rover"><b></b><i class="w1"></i><i class="w2"></i><i class="w3"></i></div><div class="ga-dust"></div></div>' },
      { kicker: 'STEP 4 \u00b7 MEET', title: 'Meet astronauts, collect cards',
        text: 'Follow the amber light beams to find astronauts. ' + (tc ? 'Tap TALK' : 'Press E') + ' near them to receive knowledge cards with real facts and famous space quotes.',
        chips: ['Amber beam', tc ? 'TALK' : 'E', 'Cards in LOG'],
        art: '<div class="ga ga-astro"><div class="ga-beamup"></div><div class="ga-face">' + astro + '<span class="ga-wave">' + G.Icon('wave') + '</span></div><div class="ga-card"><div class="f">&#10022;</div><div class="b">2047</div></div></div>' },
      { kicker: 'STEP 5 \u00b7 EXAM', title: 'Dock and pass exams',
        text: 'Dock at a station and talk to the Operator. Answer 3 questions about your cards to earn a station badge and a Fun Pass.',
        chips: [tc ? 'GO = dock' : 'E = dock', '3 questions', 'Badge', 'Fun Pass'],
        art: '<div class="ga ga-exam"><div class="ga-op">' + op + '</div><div class="ga-q q1">?</div><div class="ga-q q2">&#10003;</div><div class="ga-q q3">&#10003;</div><div class="ga-badge">' + G.Icon('ribbon') + '</div></div>' },
      { kicker: 'STEP 6 \u00b7 PLAY', title: 'Spend Fun Passes',
        text: 'Use Fun Passes in a station Fun Zone. Race through 10 gates for a medal, or catch falling stars with combos and power-ups.',
        chips: ['Space Race', 'Star Catcher', 'Medals', 'Combos'],
        art: '<div class="ga ga-fun"><div class="ga-ring r1"></div><div class="ga-ring r2"></div><div class="ga-ring r3"></div><div class="ga-ticket">FUN PASS</div><i class="ga-fstar s1">&#9733;</i><i class="ga-fstar s2">&#9733;</i><i class="ga-fstar s3">&#9733;</i></div>' },
      { kicker: 'STEP 7 \u00b7 TRAVEL', title: 'Map, Home and Jump',
        text: (tc ? 'Tap MAP' : 'Press M') + ' to pick a destination and plot a course. ' + (tc ? 'HOME' : 'B') + ' brings you back to Earth, and ' + (tc ? 'JUMP' : 'H') + ' fires the jump drive beyond Neptune. Ask KORA anything with ' + (tc ? 'COMMS' : 'K') + '!',
        chips: tc ? ['MAP', 'HOME', 'JUMP', 'COMMS'] : ['M', 'B', 'H', 'K'],
        art: '<div class="ga ga-map"><svg viewBox="0 0 200 120"><circle cx="100" cy="60" r="9" class="sun"/><ellipse cx="100" cy="60" rx="45" ry="22" class="orb"/><ellipse cx="100" cy="60" rx="85" ry="44" class="orb"/><path class="route" d="M30,95 C60,30 130,100 175,28"/><circle cx="30" cy="95" r="6" class="home"/><circle cx="175" cy="28" r="7" class="dest"/></svg><i class="ga-mapship"></i></div>' }
    ];
  }

  let gIdx = 0, gList = null;
  function openGuide(at) {
    closeGuide();
    gList = slides();
    gIdx = at || 0;
    const el = document.createElement('div');
    el.id = 'guide';
    el.innerHTML = '<div class="gd-card">' +
      '<div class="gd-top"><span class="gd-kicker">&#9672; EXPLORER GUIDE</span><span class="gd-step"></span><button class="gd-x" aria-label="Close">&times;</button></div>' +
      '<div class="gd-body"><div class="gd-art"></div><div class="gd-text"><div class="gd-k"></div><h2></h2><p></p><div class="gd-chips"></div></div></div>' +
      '<div class="gd-nav"><button class="gd-prev">&lsaquo; Back</button><div class="gd-dots"></div><button class="gd-next">Next &rsaquo;</button></div></div>';
    U.el('ui-root').appendChild(el);
    el.querySelector('.gd-x').onclick = function () { G.Audio.play('close'); closeGuide(); };
    el.querySelector('.gd-prev').onclick = function () { go(gIdx - 1); };
    el.querySelector('.gd-next').onclick = function () { if (gIdx >= gList.length - 1) { G.Audio.play('success'); closeGuide(); } else go(gIdx + 1); };
    let sx = null;
    el.querySelector('.gd-body').addEventListener('pointerdown', function (e) { sx = e.clientX; });
    el.querySelector('.gd-body').addEventListener('pointerup', function (e) {
      if (sx === null) return;
      const d = e.clientX - sx; sx = null;
      if (Math.abs(d) > 50) go(gIdx + (d < 0 ? 1 : -1));
    });
    el._key = function (e) {
      if (e.key === 'ArrowRight') go(gIdx + 1);
      else if (e.key === 'ArrowLeft') go(gIdx - 1);
      else if (e.key === 'Escape') closeGuide();
    };
    window.addEventListener('keydown', el._key);
    render();
  }
  function go(i) {
    if (!gList || i < 0 || i >= gList.length) return;
    G.Audio.play('menuHover');
    gIdx = i;
    render();
  }
  function render() {
    const el = U.el('guide'), s = gList[gIdx];
    if (!el) return;
    el.querySelector('.gd-step').textContent = (gIdx + 1) + ' / ' + gList.length;
    el.querySelector('.gd-k').textContent = s.kicker;
    el.querySelector('h2').textContent = s.title;
    el.querySelector('p').textContent = s.text;
    el.querySelector('.gd-chips').innerHTML = s.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('');
    el.querySelector('.gd-art').innerHTML = s.art;
    const txt = el.querySelector('.gd-text');
    txt.classList.remove('in'); void txt.offsetWidth; txt.classList.add('in');
    el.querySelector('.gd-dots').innerHTML = gList.map(function (_, i) { return '<i class="' + (i === gIdx ? 'on' : '') + '" data-i="' + i + '"></i>'; }).join('');
    el.querySelectorAll('.gd-dots i').forEach(function (d) { d.onclick = function () { go(+d.getAttribute('data-i')); }; });
    el.querySelector('.gd-prev').disabled = gIdx === 0;
    el.querySelector('.gd-next').innerHTML = gIdx === gList.length - 1 ? "Let's explore! " + G.Icon('rocket') : 'Next &rsaquo;';
  }
  function closeGuide() {
    const el = U.el('guide');
    if (!el) return;
    window.removeEventListener('keydown', el._key);
    el.remove();
  }
  G.Guide = { open: openGuide, close: closeGuide };

  // ---------- Rover coach (first drive) ----------
  function coachState() { const st = G.Save.get(); if (!st.coach) st.coach = {}; return st.coach; }
  let cSteps = null, cIdx = 0, cLayer = null, cPoll = null, cRef = null, cMode = 'rover';
  function cpos() { return cMode === 'ship' ? G.Ship.position() : G.Rover.position(); }
  function chead() { return cMode === 'ship' ? G.Ship.heading() : G.Rover.heading(); }
  function shipSteps() {
    const moved = function () { const p = cpos(); return cRef && Math.hypot(p.x - cRef.x, p.y - cRef.y, p.z - cRef.z) > 4; };
    const turned = function () { return cRef && Math.abs(chead() - cRef.h) > 0.3; };
    if (touch()) return [
      { sel: '#thrust', text: 'Slide THRUST up to fly forward.', say: 'Slide the thrust bar up to fly forward.', check: moved },
      { drag: true, text: 'Drag the screen to steer and look around.', say: 'Drag your finger on the screen to steer the ship.', check: turned },
      { sel: '#m-up', text: 'UP and DOWN make the ship rise or sink.', say: 'Use up and down to rise or sink.' },
      { sel: '#m-boost', text: 'Hold BOOST to go faster for long trips.', say: 'Hold boost to fly faster.' },
      { sel: '#m-brake', text: 'Tap STOP to brake and hold still.', say: 'Tap stop to brake.' },
      { sel: '#m-scan', text: 'Close to a planet, satellite or station? Tap SCAN to study it.', say: 'When you are close to something, tap scan.' },
      { sel: '#m-act', text: 'Tap GO near a station to dock, or near a world to land.', say: 'Tap go near a station to dock, or near a world to land.' },
      { sel: '#radar-corner', text: 'Tap the radar to open the MAP and choose a destination.', say: 'Tap the radar to open the map and pick a destination.' },
      { sel: '#m-home', text: 'Lost? HOME flies you back to Earth.', say: 'If you get lost, tap home to return to Earth.' }
    ];
    return [
      { keys: ['W', 'S'], text: 'Press W for thrust, S to slow down.', say: 'Press W to fly forward.', check: moved },
      { keys: ['A', 'D'], text: 'Use A and D, or drag the mouse, to steer.', say: 'Use A and D or drag the mouse to steer.', check: turned },
      { keys: ['R', 'F'], text: 'R rises and F sinks the ship.', say: 'R rises and F sinks.' },
      { keys: ['Shift'], text: 'Hold SHIFT to boost, SPACE to brake.', say: 'Hold shift to boost, and space to brake.' },
      { sel: '#btn-scan', keys: ['Q'], text: 'Press Q near an object to scan it.', say: 'Press Q near an object to scan it.' },
      { keys: ['E'], text: 'Press E near a station to dock or a world to land.', say: 'Press E near a station to dock, or near a world to land.' },
      { sel: '#radar-corner', keys: ['M'], text: 'Press M to open the map and choose a destination.', say: 'Press M to open the map.' },
      { keys: ['B'], text: 'Press B to fly back to Earth any time.', say: 'Press B to return to Earth.' }
    ];
  }
  function roverSteps() {
    const moved = function () { const p = cpos(); return cRef && Math.hypot(p.x - cRef.x, p.z - cRef.z) > 3; };
    const turned = function () { return cRef && Math.abs(chead() - cRef.h) > 0.35; };
    if (touch()) return [
      { sel: '#thrust', text: 'Slide THRUST up to drive forward.', say: 'Slide the thrust bar up to drive forward.', check: moved },
      { sel: '#touch-steer', text: 'Hold LEFT or RIGHT to turn. REVERSE backs up.', say: 'Hold left or right to turn the rover.', check: turned },
      { sel: null, drag: true, text: 'Drag the screen to look around.', say: 'Drag your finger on the screen to look around.', check: turned },
      { sel: '#m-scan', text: 'Near a glowing ring? Tap SCAN to study it.', say: 'Near a glowing ring, tap scan.' },
      { sel: '#m-act', text: 'Near an astronaut? Tap GO \u2014 it turns into TALK \u2014 to get a card.', say: 'Near an astronaut, tap the go button to talk and collect a card.' },
      { sel: '#m-ship', text: 'Tap SHIP any time to fly back to your ship.', say: 'Tap ship to fly back to your ship.' }
    ];
    return [
      { keys: ['W', 'S'], text: 'Press W to drive forward, S to reverse.', say: 'Press W to drive forward.', check: moved },
      { keys: ['A', 'D'], text: 'Use A and D to steer.', say: 'Use A and D to steer.', check: turned },
      { drag: true, text: 'Drag the mouse to look around.', say: 'Drag the mouse to look around.', check: turned },
      { sel: '#btn-scan', keys: ['Q'], text: 'Press Q near a glowing ring to scan it.', say: 'Press Q near a glowing ring to scan it.' },
      { keys: ['E'], text: 'Press E near an astronaut to talk and collect a card.', say: 'Press E near an astronaut to talk.' },
      { sel: '#btn-rover', keys: ['R'], text: 'Press R to return to your ship.', say: 'Press R to fly back to your ship.' }
    ];
  }
  function coachRover() {
    if (coachState().rover || cLayer) return false;
    setTimeout(function () { if (G.Game.isLanded() && !cLayer) { cMode = 'rover'; beginCoach(roverSteps()); } }, 2800);
    return true;
  }
  function coachShip() {
    if (coachState().ship || cLayer) return false;
    setTimeout(function () { if (!G.Game.isLanded() && !cLayer && G.Game.mode === 'play') { cMode = 'ship'; beginCoach(shipSteps()); } }, 3500);
    return true;
  }
  function beginCoach(list) {
    cSteps = list; cIdx = 0;
    cLayer = document.createElement('div');
    cLayer.id = 'coach';
    cLayer.innerHTML = '<div class="ch-ring"></div><div class="ch-drag"><i></i></div><div class="ch-bubble"><div class="ch-head"><span class="ch-kora">&#9672; KORA TRAINING</span><span class="ch-step"></span></div>' +
      '<div class="ch-keys"></div><div class="ch-text"></div><div class="ch-btns"><button class="ch-skip">Skip</button><button class="ch-next">Got it &rsaquo;</button></div></div>';
    U.el('hud').appendChild(cLayer);
    cLayer.querySelector('.ch-skip').onclick = function () { endCoach(true); };
    cLayer.querySelector('.ch-next').onclick = function () { nextCoach(); };
    window.addEventListener('resize', placeCoach);
    showCoach();
  }
  function showCoach() {
    const s = cSteps[cIdx];
    const p = cpos();
    cRef = { x: p.x, y: p.y, z: p.z, h: chead(), t: performance.now() };
    cLayer.querySelector('.ch-step').textContent = (cIdx + 1) + ' / ' + cSteps.length;
    cLayer.querySelector('.ch-text').textContent = s.text;
    cLayer.querySelector('.ch-keys').innerHTML = (s.keys || []).map(function (k) { return '<kbd>' + k + '</kbd>'; }).join('');
    cLayer.querySelector('.ch-next').innerHTML = cIdx === cSteps.length - 1 ? 'Done &#10003;' : 'Got it &rsaquo;';
    const b = cLayer.querySelector('.ch-bubble');
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    G.UI.koraSay(s.say);
    G.Audio.play('blip');
    placeCoach();
    clearInterval(cPoll);
    cPoll = setInterval(function () {
      if (!cLayer) return;
      if (G.Game.isLanded() !== (cMode === 'rover')) { endCoach(false); return; }
      if (s.check && performance.now() - cRef.t > 900 && s.check()) { G.Audio.play('success'); nextCoach(); }
    }, 250);
  }
  function placeCoach() {
    if (!cLayer) return;
    const s = cSteps[cIdx], ring = cLayer.querySelector('.ch-ring'), b = cLayer.querySelector('.ch-bubble'), drag = cLayer.querySelector('.ch-drag');
    const el = s.sel && document.querySelector(s.sel);
    const r = el && el.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;
    drag.style.display = s.drag ? 'block' : 'none';
    b.style.left = b.style.top = b.style.bottom = '';
    if (r && r.width) {
      ring.style.display = 'block';
      ring.style.left = (r.left - 8) + 'px'; ring.style.top = (r.top - 8) + 'px';
      ring.style.width = (r.width + 16) + 'px'; ring.style.height = (r.height + 16) + 'px';
      const bw = Math.min(300, W * 0.42);
      b.style.width = bw + 'px';
      const cx = r.left + r.width / 2;
      let left = cx < W / 2 ? r.right + 18 : r.left - bw - 18;
      left = U.clamp(left, 10, W - bw - 10);
      b.style.left = left + 'px';
      b.style.top = U.clamp(r.top + r.height / 2 - 60, 60, H - 170) + 'px';
    } else {
      ring.style.display = 'none';
      b.style.width = Math.min(340, W * 0.6) + 'px';
      b.style.left = (W / 2 - Math.min(340, W * 0.6) / 2) + 'px';
      b.style.top = (H * 0.2) + 'px';
    }
  }
  function nextCoach() {
    if (!cLayer) return;
    if (cIdx >= cSteps.length - 1) { endCoach(true); return; }
    cIdx++;
    showCoach();
  }
  function endCoach(finished) {
    clearInterval(cPoll);
    window.removeEventListener('resize', placeCoach);
    if (cLayer) cLayer.remove();
    cLayer = null;
    if (finished) {
      coachState()[cMode] = true;
      G.Save.save();
      G.UI.koraSay(cMode === 'ship' ? 'Flight training complete! Open the map with the radar and pick your first destination. Mission Control is waiting.' : 'Training complete! Now follow the amber light beams to meet astronauts and collect knowledge cards.');
    }
  }
  G.Coach = { rover: coachRover, ship: coachShip, stop: function () { endCoach(false); }, active: function () { return !!cLayer; }, reset: function () { coachState().rover = false; coachState().ship = false; } };

  // ---------- Credits ----------
  function openCredits() {
    const old = U.el('credits-pop');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'credits-pop';
    el.innerHTML = '<div class="cp-card"><button class="cp-x" aria-label="Close">&times;</button>' +
      '<div class="cp-logo">2047</div><div class="cp-sub">THE GREAT SPACE EXPEDITION</div>' +
      '<div class="cp-maker"><div class="cp-avatar">' + (G.Crew ? G.Crew.portrait({ id: 'greenman', color: 0x3cff6e, secret: true }) : '') + '</div>' +
        '<div><span>CREATED, DESIGNED &amp; DEVELOPED BY</span><b>Sanwik Sagar</b><i>a.k.a. GreenMan</i></div></div>' +
      '<div class="cp-list">' +
        '<div><span>Co-pilot AI</span><b>KORA</b></div>' +
        '<div><span>Live knowledge</span><b>Wikipedia &amp; Wikidata</b></div>' +
        '<div><span>Space facts</span><b>NASA &amp; ISRO public missions</b></div>' +
        '<div><span>Planet textures</span><b>Solar System Scope (CC BY 4.0)</b></div>' +
        '<div><span>3D engine</span><b>three.js</b></div>' +
        '<div><span>Fonts</span><b>Orbitron, Exo 2, Share Tech Mono</b></div>' +
      '</div>' +
      '<div class="cp-egg">Psst\u2026 GreenMan hid 5 secrets in the galaxy. Can you find them all?</div></div>';
    U.el('ui-root').appendChild(el);
    el.onclick = function (e) { if (e.target === el || e.target.classList.contains('cp-x')) { G.Audio.play('close'); el.remove(); } };
    G.Audio.play('open');
  }

  // ---------- Easter eggs ----------
  function greenPulse(title, sub, voice) {
    document.body.classList.add('greenman');
    clearTimeout(greenPulse._t);
    greenPulse._t = setTimeout(function () { document.body.classList.remove('greenman'); }, 12000);
    const old = U.el('egg-banner');
    if (old) old.remove();
    const b = document.createElement('div');
    b.id = 'egg-banner';
    b.innerHTML = '<div class="eb-face">' + (G.Crew ? G.Crew.portrait({ id: 'greenman', color: 0x3cff6e, secret: true }) : '') + '</div><div><b>' + title + '</b><span>' + sub + '</span><em>Sanwik Sagar \u00b7 a.k.a. GreenMan \u00b7 Game creator &amp; developer</em></div>';
    U.el('ui-root').appendChild(b);
    setTimeout(function () { b.classList.add('out'); }, 4200);
    setTimeout(function () { b.remove(); }, 5000);
    G.Audio.play('badge');
    if (G.FX) G.FX.burst(window.innerWidth / 2, window.innerHeight * 0.4, '60,255,110', 60);
    if (voice && G.UI) G.UI.koraVoice(voice);
  }

  let buf = '';
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-12);
    if (/greenman$|sanwik$/.test(buf)) {
      buf = '';
      greenPulse('GREENMAN MODE', 'Greetings from Sanwik Sagar, creator of 2047!', 'Secret code accepted! Greetings from GreenMan, the creator of this galaxy.');
      if (G.Crew) G.Crew.award('egg_code');
    }
  });

  let taps = 0, tapT = 0;
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.logo-year')) return;
    const now = performance.now();
    taps = now - tapT < 2500 ? taps + 1 : 1;
    tapT = now;
    if (taps < 7) return;
    taps = 0;
    const base = document.querySelector('.holo-base'), year = document.querySelector('.logo-year');
    if (!base) return;
    base.textContent = 'GREEN'; year.setAttribute('data-text', 'GREEN'); year.classList.add('egg');
    setTimeout(function () { base.textContent = '2047'; year.setAttribute('data-text', '2047'); year.classList.remove('egg'); }, 6000);
    greenPulse('HOLOGRAM HACKED', 'You found GreenMan\u2019s hidden hologram!', 'Hologram override! GreenMan was here.');
    if (G.Crew) G.Crew.award('egg_logo');
  });

  if (G.Kora && G.Kora.respond) {
    const orig = G.Kora.respond;
    G.Kora.respond = function (raw) {
      const t = String(raw || '').toLowerCase();
      if (/sanwik|green ?man|who (made|created|built|designed|programmed) (you|this|2047|the game|kora)|your (creator|maker|developer)/.test(t)) {
        if (G.Crew) setTimeout(function () { G.Crew.award('egg_kora'); }, 600);
        document.body.classList.add('greenman');
        setTimeout(function () { document.body.classList.remove('greenman'); }, 8000);
        return { intent: 'CASUAL', text: 'I was created by Sanwik Sagar, known to gamers as GreenMan! He built this whole galaxy so explorers like you could learn about space while having fun. Rumour says he hides somewhere far out in the Martian desert\u2026' };
      }
      return orig.apply(this, arguments);
    };
  }

  document.addEventListener('DOMContentLoaded', bind);
  if (document.readyState !== 'loading') bind();
  function bind() {
    const c = U.el('btn-credits');
    if (c && !c._b) { c._b = true; c.onclick = function (e) { e.stopPropagation(); openCredits(); }; }
    const sg = U.el('set-guide');
    if (sg && !sg._b) { sg._b = true; sg.onclick = function () { G.Audio.play('click'); U.hide('settings-panel'); openGuide(); }; }
  }
  G.Credits = { open: openCredits };
})();
