window.G = window.G || {};

G.Game = (function () {
  const U = G.utils;
  let mode = 'menu';
  let menuHold = 0;
  let clock = null;
  let interactTarget = null;
  let landed = false;
  let docked = null;
  let briefingShown = false;
  let posSaveTimer = 5;

  // Scale HUD widgets & panels with the screen (CSS zoom via --ui). Markers/map stay in raw pixels.
  function applyUiScale() {
    const w = window.innerWidth, h = window.innerHeight;
    const touch = document.body.classList.contains('touch');
    const s = touch ? U.clamp(Math.min(w / 844, h / 390), 0.8, 1.45) : U.clamp(Math.min(w / 1280, h / 760), 0.7, 1.5);
    G.uiScale = Math.round(s * 100) / 100;
    document.documentElement.style.setProperty('--ui', G.uiScale);
  }
  window.addEventListener('resize', applyUiScale);
  window.addEventListener('orientationchange', function () { setTimeout(applyUiScale, 200); });

  function boot() {
    applyUiScale();
    G.Save.load();
    const canvas = U.el('game-canvas');
    G.World.init(canvas);
    G.Sectors.init();
    G.Spacecraft.init();
    G.DeepSpace.init();
    G.Ship.bind(canvas);
    G.Rover.bind(canvas);
    G.Holo.init();
    G.Touch.init();
    applyUiScale();
    G.FX.init();
    G.HUD.fillTicker();
    G.UI.initKoraPanel();
    G.UI.initProfileScreen();
    G.UI.initSettings();
    G.UI.applySettings();
    bindMenus();
    bindActions();
    bindKeys();
    clock = { last: performance.now() };
    requestAnimationFrame(loop);
    G.HUD.boot(function () { G.Audio.play('menuIn'); G.Audio.startMusic('menu'); });
    updateMenuProfile();
  }

  function updateMenuProfile() {
    const st = G.Save.get();
    const btn = U.el('btn-continue');
    const sub = U.el('menu-continue-sub');
    const info = U.el('menu-explorer-info');
    if (U.el('menu-export')) U.el('menu-export').disabled = !(st && st.profile);
    if (st && st.profile) {
      if (btn) btn.disabled = false;
      const m = G.MISSIONS[st.missionIndex];
      const mTitle = m ? m.title : 'All Missions Complete';
      if (sub) sub.textContent = st.profile.name + ' \u2022 ' + mTitle;
      if (info) {
        const avIdx = st.profile.avatar || 1;
        const avSrc = (window.G_ASSETS && G_ASSETS['avatar_' + avIdx + '.svg']) ? G_ASSETS['avatar_' + avIdx + '.svg'] : ('assets/img/avatar_' + avIdx + '.svg');
        const rName = G.Save.rank().name;
        const codexCount = st.codex ? st.codex.length : 0;
        const xpVal = st.xp || 0;
        info.innerHTML = '<div class="explorer-live">' +
          '<div class="exp-avatar"><img src="' + avSrc + '" alt="Avatar"></div>' +
          '<div class="exp-meta">' +
            '<div class="exp-name">' + G.Codex.esc(st.profile.name) + '</div>' +
            '<div class="exp-rank">' + G.Codex.esc(rName) + '</div>' +
            '<div class="exp-stats">' +
              '<span><b>' + xpVal + '</b><i>XP</i></span>' +
              '<span><b>' + (Math.min(st.missionIndex + 1, G.MISSIONS.length)) + '/' + G.MISSIONS.length + '</b><i>MISSION</i></span>' +
              '<span><b>' + codexCount + '</b><i>CODEX</i></span>' +
            '</div>' +
            '<div class="exp-open">VIEW JOURNEY</div>' +
          '</div>' +
        '</div>';
      }
    } else {
      if (btn) btn.disabled = true;
      if (sub) sub.textContent = 'No Active Log';
      if (info) info.innerHTML = '<div class="terminal-placeholder">REGISTER CADET TO BEGIN</div>';
    }
    const card = U.el('menu-explorer-card');
    if (card) {
      const ready = !!(st && st.profile);
      card.classList.toggle('is-ready', ready);
      if (ready) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Open expedition log');
      } else {
        card.removeAttribute('role');
        card.removeAttribute('tabindex');
        card.removeAttribute('aria-label');
      }
    }
  }

  function closeJourney() {
    showScreen('menu-screen');
  }

  function openJourney() {
    const st = G.Save.get();
    if (!st || !st.profile) return;
    const E = G.Codex.esc;
    const rank = G.Save.rank();
    let nextRank = null;
    for (let i = 0; i < G.RANKS.length; i++) {
      if (G.RANKS[i].xp > st.xp) { nextRank = G.RANKS[i]; break; }
    }
    const worlds = ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const visited = st.visited || [];
    const knowledge = st.knowledge || {};
    const knownIds = Object.keys(knowledge);
    const scanned = st.scannedPois || {};
    const crew = st.crew || {};
    const cards = crew.cards || {};
    const cardIds = Object.keys(cards);
    const codex = st.codex || [];
    const sectors = st.sectors ? Object.keys(st.sectors).length : 0;
    const avIdx = st.profile.avatar || 1;
    const avSrc = (window.G_ASSETS && G_ASSETS['avatar_' + avIdx + '.svg']) ? G_ASSETS['avatar_' + avIdx + '.svg'] : ('assets/img/avatar_' + avIdx + '.svg');
    let quizTries = 0, quizRight = 0;
    const quizIds = Object.keys(st.quizStats || {});
    for (let i = 0; i < quizIds.length; i++) {
      quizTries += st.quizStats[quizIds[i]].attempts || 0;
      quizRight += st.quizStats[quizIds[i]].correct || 0;
    }
    const exploredN = worlds.filter(function (id) { return visited.indexOf(id) >= 0; }).length;
    const badgeN = (st.badges || []).length;

    function row(name, status, sub, kind) {
      return '<div class="j-row' + (kind ? ' ' + kind : '') + '"><div><div class="nm">' + E(name) + '</div>' +
        (sub ? '<div class="sub">' + E(sub) + '</div>' : '') +
        '</div><div class="st">' + E(status) + '</div></div>';
    }
    function pretty(id) {
      return String(id || '').replace(/[._]/g, ' ').replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    }

    let html = '';
    html += '<div class="j-hero"><img src="' + avSrc + '" alt=""><div><h3>' + E(st.profile.name) + '</h3><p>' + E(rank.name) + '</p></div></div>';
    html += '<div class="j-grid">';
    html += '<div class="j-stat"><b>' + (st.xp || 0) + '</b><i>XP' + (nextRank ? ' / ' + nextRank.xp : ' MAX') + '</i></div>';
    html += '<div class="j-stat"><b>' + exploredN + '/' + worlds.length + '</b><i>WORLDS</i></div>';
    html += '<div class="j-stat"><b>' + (st.completedMissions || []).length + '/' + G.MISSIONS.length + '</b><i>MISSIONS</i></div>';
    html += '<div class="j-stat"><b>' + knownIds.length + '/' + G.KNOWLEDGE.length + '</b><i>TOPICS</i></div>';
    html += '<div class="j-stat"><b>' + badgeN + '/' + G.BADGES.length + '</b><i>BADGES</i></div>';
    html += '<div class="j-stat"><b>' + codex.length + '</b><i>CODEX</i></div>';
    html += '<div class="j-stat"><b>' + cardIds.length + '</b><i>CARDS</i></div>';
    html += '<div class="j-stat"><b>' + (st.questionsAsked || 0) + '</b><i>QUESTIONS</i></div>';
    html += '<div class="j-stat"><b>' + sectors + '</b><i>SECTORS</i></div>';
    html += '</div>';

    html += '<div class="j-sec">Worlds explored <span>' + exploredN + ' visited</span></div><div class="j-list">';
    for (let i = 0; i < worlds.length; i++) {
      const p = G.PLANETS[worlds[i]];
      if (!p) continue;
      const been = visited.indexOf(p.id) >= 0;
      const open = been || (st.unlocked && st.unlocked.indexOf(p.id) >= 0);
      const topics = G.KNOWLEDGE.filter(function (k) { return k.planet === p.id && knowledge[k.id]; });
      const scans = Object.keys(scanned).filter(function (k) { return k.indexOf(p.id + ':') === 0; }).map(function (k) { return pretty(k.slice(p.id.length + 1)); });
      let sub = p.type;
      if (topics.length) sub += ' · ' + topics.length + ' topic' + (topics.length === 1 ? '' : 's');
      if (scans.length) sub += ' · scanned ' + scans.join(', ');
      html += row(p.name, been ? 'Explored' : open ? 'Unlocked' : 'Not yet', sub, been ? 'done' : open ? '' : 'wait');
    }
    const orbitScans = Object.keys(scanned).filter(function (k) { return k.indexOf('orbit:') === 0; }).map(function (k) { return pretty(k.slice(6)); });
    if (orbitScans.length) html += row('In space', 'Scanned', orbitScans.join(', '), 'done');
    html += '</div>';

    html += '<div class="j-sec">Stations</div><div class="j-list">';
    const stationIds = Object.keys(G.STATIONS);
    for (let i = 0; i < stationIds.length; i++) {
      const s = G.STATIONS[stationIds[i]];
      const been = visited.indexOf(s.id) >= 0;
      const cert = st.badges && st.badges.indexOf('cert_' + s.id) >= 0;
      html += row(s.name, been ? (cert ? 'Certified' : 'Docked') : 'Not yet', s.desc, been ? 'done' : 'wait');
    }
    html += '</div>';

    html += '<div class="j-sec">Missions</div><div class="j-list">';
    for (let i = 0; i < G.MISSIONS.length; i++) {
      const m = G.MISSIONS[i];
      const done = (st.completedMissions || []).indexOf(m.id) >= 0 || i < st.missionIndex;
      const active = !done && i === st.missionIndex;
      let sub = m.concept;
      if (active && m.steps) {
        const bits = [];
        for (let s = 0; s < m.steps.length; s++) {
          const mark = s < st.missionStep ? '\u2713' : s === st.missionStep ? '\u25b6' : '\u00b7';
          bits.push(mark + ' ' + m.steps[s].text);
        }
        sub += ' \u2014 ' + bits.join('  ');
      }
      html += row(m.title, done ? 'Complete' : active ? 'In progress' : 'Ahead', sub, done ? 'done' : active ? '' : 'wait');
    }
    html += '</div>';

    html += '<div class="j-sec">What you learned <span>' + knownIds.length + ' topics</span></div>';
    if (!knownIds.length) html += '<div class="j-empty">No science topics yet. Scan a site or talk to an astronaut.</div>';
    else {
      html += '<div class="j-list">';
      knownIds.sort();
      for (let i = 0; i < knownIds.length; i++) {
        const t = G.KNOWLEDGE.find(function (k) { return k.id === knownIds[i]; });
        const rec = knowledge[knownIds[i]];
        if (!t) {
          html += row(pretty(knownIds[i]), rec.level || 'seen', (rec.scans || 1) + ' scan' + ((rec.scans || 1) === 1 ? '' : 's'), 'done');
          continue;
        }
        const where = t.planet && G.PLANETS[t.planet] ? G.PLANETS[t.planet].name : 'Field notes';
        html += row(t.topic, rec.level || 'seen', where + ' \u00b7 ' + t.summary, 'done');
      }
      html += '</div>';
    }

    html += '<div class="j-sec">Live codex <span>' + codex.length + '</span></div>';
    if (!codex.length) html += '<div class="j-empty">Nothing downloaded yet. Fly close to a world and KORA will pull a real article.</div>';
    else {
      html += '<div class="j-list">';
      const list = codex.slice().reverse();
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        html += row(c.title, 'Saved', c.extract || c.description || '', 'done');
      }
      html += '</div>';
    }

    html += '<div class="j-sec">Badges earned <span>' + badgeN + '/' + G.BADGES.length + '</span></div><div class="j-list">';
    const earned = [];
    const locked = [];
    for (let i = 0; i < G.BADGES.length; i++) {
      const b = G.BADGES[i];
      if (G.Save.hasBadge(b.id)) earned.push(b);
      else locked.push(b);
    }
    for (let i = 0; i < earned.length; i++) html += row(earned[i].name, 'Earned', earned[i].desc, 'done');
    for (let i = 0; i < locked.length; i++) {
      const b = locked[i];
      const hidden = b.secret;
      html += row(hidden ? 'Secret badge' : b.name, 'Locked', hidden ? 'Hidden until you find it.' : b.desc, 'wait');
    }
    html += '</div>';

    html += '<div class="j-sec">Cards and games</div>';
    const metN = crew.met ? Object.keys(crew.met).length : 0;
    let gameSub = metN + ' astronaut' + (metN === 1 ? '' : 's') + ' met';
    if (crew.passes) gameSub += ' · ' + crew.passes + ' fun pass' + (crew.passes === 1 ? '' : 'es');
    if (crew.raceBest) gameSub += ' · race best ' + Number(crew.raceBest).toFixed(1) + 's';
    if (crew.catchBest) gameSub += ' · star catcher ' + crew.catchBest;
    html += '<div class="j-list">' + row('Crew record', metN ? 'In the log' : 'None yet', gameSub, metN ? 'done' : 'wait');
    cardIds.sort(function (a, b) { return (cards[a].n || 0) - (cards[b].n || 0); });
    if (!cardIds.length) html += '<div class="j-empty">No knowledge cards yet. Look for the amber light and talk to an astronaut.</div>';
    for (let i = 0; i < cardIds.length; i++) {
      const c = cards[cardIds[i]];
      html += row(c.title || pretty(cardIds[i]), c.rarity || 'card', (c.from ? 'From ' + c.from + ' · ' : '') + '#' + (c.n || i + 1), 'done');
    }
    const examIds = Object.keys(crew.exams || {});
    for (let i = 0; i < examIds.length; i++) {
      const ex = crew.exams[examIds[i]] || {};
      const stn = G.STATIONS[examIds[i]];
      html += row((stn ? stn.name : pretty(examIds[i])) + ' exam', ex.passed ? 'Passed' : 'Tried', 'Best ' + (ex.best || 0) + '/3', ex.passed ? 'done' : '');
    }
    html += '</div>';

    html += '<div class="j-sec">Quizzes <span>' + quizRight + '/' + quizTries + ' correct</span></div>';
    if (!quizIds.length) html += '<div class="j-empty">No quizzes answered yet.</div>';
    else {
      html += '<div class="j-list">';
      for (let i = 0; i < quizIds.length; i++) {
        const q = G.QUESTIONS.find(function (item) { return item.id === quizIds[i]; });
        const rec = st.quizStats[quizIds[i]];
        html += row(q ? q.text : pretty(quizIds[i]), (rec.correct || 0) + '/' + (rec.attempts || 0), q ? pretty(q.topic) : '', rec.correct ? 'done' : '');
      }
      html += '</div>';
    }

    const subEl = U.el('journey-sub');
    if (subEl) subEl.textContent = nextRank ? (nextRank.xp - st.xp) + ' XP to ' + nextRank.name : 'Highest rank reached';
    U.el('journey-body').innerHTML = html;
    showScreen('journey-screen');
  }

  function bindMenus() {
    U.el('btn-new-game').onclick = function () {
      G.Audio.unlock();
      G.Audio.play('click');
      if (G.Save.get().profile) {
        if (!confirm('Start a new expedition? Your current save will be erased.')) return;
        G.Save.wipe();
      }
      showScreen('profile-screen');
    };
    U.el('btn-continue').onclick = function () {
      G.Audio.unlock();
      G.Audio.play('click');
      startPlay(true);
    };
    U.el('btn-settings').onclick = function () {
      G.Audio.play('click');
      U.show('settings-panel');
    };
    U.el('btn-howto').onclick = function () {
      G.Audio.play('click');
      G.Guide.open();
    };
    const explorerCard = U.el('menu-explorer-card');
    if (explorerCard) {
      explorerCard.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('button')) return;
        if (!G.Save.get().profile) return;
        G.Audio.play('click');
        openJourney();
      });
      explorerCard.addEventListener('keydown', function (e) {
        if (e.code !== 'Enter' && e.code !== 'Space') return;
        if (!G.Save.get().profile) return;
        e.preventDefault();
        G.Audio.play('click');
        openJourney();
      });
    }
    const journeyClose = U.el('btn-journey-close');
    if (journeyClose) journeyClose.onclick = function () { G.Audio.play('click'); closeJourney(); };
    const journeyScreen = U.el('journey-screen');
    if (journeyScreen) journeyScreen.addEventListener('click', function (e) {
      if (e.target === journeyScreen) { G.Audio.play('click'); closeJourney(); }
    });
    U.el('btn-profile-back').onclick = function () {
      G.Audio.play('click');
      showScreen('menu-screen');
      updateMenuProfile();
    };
    U.el('btn-profile-done').onclick = function () {
      G.Audio.play('success');
      let name = U.el('profile-name').value.trim() || 'Explorer';
      if (G.Safety.unsafe(name)) { name = 'Explorer'; G.UI.notify('Please choose a friendly explorer name', 'info'); }
      const choices = G.UI.getProfileChoices();
      G.Save.setProfile({ name: name, avatar: choices.avatar, accent: choices.accent, helmet: choices.helmet, badge: choices.badge });
      showBriefing();
    };
    U.el('btn-briefing-go').onclick = function () {
      G.Audio.play('dock');
      startPlay(false);
    };
    U.el('btn-report-submit').onclick = submitReport;
    U.el('btn-credits-roam').onclick = function () {
      G.Audio.play('click');
      startPlay(true);
    };
    U.el('btn-credits-menu').onclick = function () {
      G.Audio.play('click');
      U.hide('hud');
      showScreen('menu-screen');
      updateMenuProfile();
      mode = 'menu';
    };
    document.querySelectorAll('.panel-close').forEach(function (btn) {
      btn.onclick = function () {
        G.Audio.play('click');
        U.hide(btn.getAttribute('data-close'));
        if (btn.getAttribute('data-close') === 'kora-panel') G.UI.closeKora();
      };
    });
  }

  function bindActions() {
    U.el('btn-scan').onclick = function () { doScan(); };
    U.el('mfd-right').onclick = function () { G.UI.toggleMap(); };
    U.el('btn-rover').onclick = function () { doRoverAction(); };
    U.el('btn-home').onclick = function () { goHome(); };
    U.el('btn-jump').onclick = function () { G.Ship.toggleJump(); };
    U.el('btn-journal').onclick = function () { G.Journal.open(); };
    U.el('btn-kora').onclick = function () { G.UI.toggleKora(); };
    U.el('hud-kora-mini').onclick = function () { G.Holo.poke(); G.UI.toggleKora(); };
    U.el('btn-hud-settings').onclick = function () { U.show('settings-panel'); };
    U.el('btn-hud-menu').onclick = function () { G.Audio.play('click'); exitToMenu(); };

  }

  // Saves progress and returns to the title screen; Resume Mission puts the explorer back exactly where they were.
  function exitToMenu() {
    if (mode !== 'play') return;
    saveWorldPos();
    G.Save.save();
    if (G.Ship.isJump()) G.Ship.setJump(false);
    if (G.Coach && G.Coach.stop) G.Coach.stop();
    G.Audio.stopSpeak();
    G.Audio.engine(null, 0, false, 0);
    U.hide('settings-panel');
    U.hide('hud');
    mode = 'menu';
    G.Ship.deactivate();
    G.Rover.hide();
    showScreen('menu-screen');
    updateMenuProfile();
  }

  function bindKeys() {
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Escape') {
        const journey = U.el('journey-screen');
        if (journey && !journey.classList.contains('hidden')) {
          G.Audio.play('click');
          closeJourney();
          return;
        }
      }
      if (mode !== 'play') return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      switch (e.code) {
        case 'KeyM': G.UI.toggleMap(); break;
        case 'KeyJ': G.Journal.open(); break;
        case 'KeyK': G.UI.toggleKora(); break;
        case 'KeyQ': doScan(); break;
        case 'KeyE': doInteract(); break;
        case 'KeyR': doRoverAction(); break;
        case 'KeyB': goHome(); break;
        case 'KeyH': G.Ship.toggleJump(); break;
        case 'Escape':
          if (!U.el('map-panel').classList.contains('hidden')) G.UI.closeMap();
          else if (!U.el('journal-panel').classList.contains('hidden')) G.Journal.close();
          else if (!U.el('kora-panel').classList.contains('hidden')) G.UI.closeKora();
          else if (!U.el('scan-panel').classList.contains('hidden')) G.UI.closeScanPanel();
          else if (!U.el('npc-panel').classList.contains('hidden')) G.UI.closeNpc();
          else if (!U.el('station-panel').classList.contains('hidden')) G.UI.closeStation();
          else if (!U.el('settings-panel').classList.contains('hidden')) U.hide('settings-panel');
          else U.show('settings-panel');
          break;
      }
      G.Rover.down(e);
    });
    window.addEventListener('keyup', function (e) {
      G.Rover.up(e);
    });
  }

  function bindTouch() {
    const canvas = U.el('game-canvas');
    const keyStates = {
      w: false, up: false, s: false, down: false,
      a: false, left: false, d: false, right: false,
      space: false, r: false, q: false, e: false
    };
    const start = { x: 0, y: 0 };
    let touchId = null;
    let dragX = 0, dragY = 0;

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      start.x = t.clientX; start.y = t.clientY;
      keyStates.w = keyStates.up = keyStates.s = keyStates.down = false;
      keyStates.a = keyStates.left = keyStates.d = keyStates.right = false;
      keyStates.space = keyStates.r = keyStates.q = keyStates.e = false;
      dragX = dragY = 0;
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t.identifier === touchId) {
        touchId = null;
        Object.assign(keyStates, {
          w: false, up: false, s: false, down: false,
          a: false, left: false, d: false, right: false,
          space: false, r: false, q: false, e: false
        });
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t.identifier === touchId) {
        dragX = t.clientX - start.x; dragY = t.clientY - start.y;
        start.x = t.clientX; start.y = t.clientY;
      }
    }, { passive: false });

    // Mobile virtual joystick feeds the same keyStates array the ship/controls read
    setInterval(function () {
      const s = keyStates;
      s.w = dragY < -18;
      s.s = dragY > 18;
      s.a = dragX < -18;
      s.d = dragX > 18;
      G.Ship.setTouchStates(s);
      G.Rover.setTouchStates(s);
    }, 100);
  }

  // Heading-up tactical radar on the right dashboard display.
  let miniT = 0;
  function drawMinimap() {
    // Radar canvases only need ~12 fps.
    const now = performance.now();
    if (now - miniT < 80) return;
    miniT = now;
    drawRadar('#minimap canvas', false);
    drawRadar('#radar-corner canvas', true);
  }

  function drawRadar(sel, small) {
    const canvas = document.querySelector(sel);
    if (!canvas || !canvas.offsetParent) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, R = W / 2 - 8;
    const t = performance.now() / 1000;
    const from = landed ? G.Rover.position() : G.Ship.position();
    const yaw = landed ? G.Rover.heading() : G.Ship.heading();
    const range = landed ? 260 : 520;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, 'rgba(10,40,64,0.9)'); bg.addColorStop(1, 'rgba(2,10,20,0.95)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(79,216,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * i / 3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.fillStyle = 'rgba(79,216,255,0.08)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); ctx.closePath(); ctx.fill();
    const sw = t * 1.8;
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = 'rgba(79,216,255,' + (0.3 * (1 - i / 18)).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw - i * 0.03) * R, cy + Math.sin(sw - i * 0.03) * R); ctx.stroke();
    }
    function plot(p, color, size, shape, label) {
      const dx = p.x - from.x, dz = p.z - from.z;
      const rx = dx * cs - dz * sn, f = -dx * sn - dz * cs;
      const d = Math.hypot(rx, f);
      if (d < 0.001) return;
      const k = Math.min(1, Math.sqrt(d / range)) * R / d;
      const edge = d > range;
      const x = cx + rx * k * (edge ? 0.97 : 1), y = cy - f * k * (edge ? 0.97 : 1);
      ctx.fillStyle = color;
      ctx.globalAlpha = edge ? 0.55 : 1;
      if (shape === 'diamond') { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-size, -size, size * 2, size * 2); ctx.restore(); }
      else if (shape === 'cross') { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke(); ctx.lineWidth = 1; }
      else { ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (label && !edge && !small) {
        ctx.font = '15px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - size - 4);
      }
      return { x: x, y: y };
    }
    if (landed) {
      G.World.pois.forEach(function (p) { plot(p.obj.position, p.scanned ? '#5dffa0' : '#c79bff', 5, 'cross'); });
      plot(G.World.ship.group.position, '#8ef0ff', 6, 'diamond', 'SHIP');
    } else {
      for (const id in G.World.bodies) {
        const b = G.World.bodies[id];
        plot(b.worldPos, b.def.color, U.clamp(Math.sqrt(b.def.radius) * 1.6, 3, 11), 'dot', from.distanceTo(b.worldPos) < range ? b.def.name.replace('The ', '') : null);
      }
      for (const id in G.World.stations) plot(G.World.stations[id].worldPos, '#8ef0ff', 4, 'diamond');
      G.Sectors.anomalies().forEach(function (a) { plot(a.obj.position, '#c79bff', 4, 'cross'); });
    }
    let obj = G.StarMap.course() && !landed ? G.StarMap.course().pos : objectivePosition();
    if (landed && obj && !G.World.pois.some(function (p) { return p.obj.position === obj; })) obj = null;
    if (obj) {
      const o = plot(obj, '#ffb347', 5, 'dot');
      if (o) {
        ctx.strokeStyle = '#ffb347';
        ctx.beginPath(); ctx.arc(o.x, o.y, 9 + 3 * Math.sin(t * 5), 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 6, cy + 7); ctx.lineTo(cx, cy + 3); ctx.lineTo(cx - 6, cy + 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(79,216,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  }
  function showScreen(id) {
    ['menu-screen', 'profile-screen', 'briefing-screen', 'report-screen', 'credits-screen', 'journey-screen'].forEach(function (s) {
      U.hide(s);
    });
    // Close any side panels left open from gameplay
    ['kora-panel', 'journal-panel', 'map-panel', 'quiz-panel', 'scan-panel', 'npc-panel', 'station-panel'].forEach(function (p) {
      U.hide(p);
    });
    koraOpenCleanup();
    document.body.classList.toggle('in-game', !id);
    if (id) U.show(id);
    if (id === 'menu-screen') G.Audio.startMusic('menu');
  }

  function koraOpenCleanup() {
    G.Voice.stop();
    var mic = U.el('kora-mic');
    if (mic) mic.classList.remove('listening');
    U.hide('kora-listening');
  }

  function showBriefing() {
    showScreen('briefing-screen');
    const st = G.Save.get();
    const m = G.MISSIONS[st.missionIndex];
    let text = 'Junior Explorer ' + st.profile.name + ',\n\n';
    text += 'You have been selected for the Solar System Knowledge Expedition. ';
    text += 'Your ship, the EX-01 Explorer, is equipped with a rover, a science scanner, and me — KORA, your Knowledge and Orbital Reconnaissance Assistant.\n\n';
    if (m) {
      text += 'Your first mission: ' + m.title + '\n' + m.concept + '\n\n';
    }
    text += 'Remember: explore first, explain second. Wrong answers never end the game — they teach us something.\n\nGood luck, explorer.';
    U.el('briefing-text').textContent = text;
  }

  function startPlay(isContinue) {
    showScreen(null);
    U.show('hud');
    mode = 'play';
    landed = false;
    docked = null;
    G.World.removeTerrain();
    G.Rover.hide();
    G.Ship.activate();
    G.Audio.unlock();
    G.Audio.startMusic('earth');
    if (G.FX && G.FX.wake) G.FX.wake();
    const st = G.Save.get();
    if (!isContinue || !briefingShown) {
      briefingShown = true;
      G.Missions.start();
    } else {
      G.UI.koraSay(G.Missions.current()
        ? 'Welcome back, ' + st.profile.name + '. Resuming expedition. Current mission: ' + G.Missions.current().title
        : 'All missions complete, ' + st.profile.name + '. The Solar System is yours \u2014 fly anywhere, land anywhere, and keep scanning. Open the map with M to choose a destination.');
    }
    G.UI.updateObjective();
    G.UI.updateHUD();
    G.Save.visit('earth');
    G.Ship.setFirstMoveCb(G.Missions.onMove);
    clearTimeout(startPlay._guide);
    startPlay._guide = setTimeout(function () {
      if (mode !== 'play' || landed) return;
      const co = G.Save.get().coach || (G.Save.get().coach = {});
      if (co.flight) return;
      co.flight = true;
      G.Save.save();
      // The interactive coach replaces the one-line voice tip.
      if (!G.Coach.ship()) G.UI.koraSay(G.UI.controlsGuide(false));
    }, 1500);
    // Restore the explorer's exact position when continuing a saved expedition.
    const wp = isContinue ? G.Save.get().worldPos : null;
    if (wp && wp.landed && wp.body && G.World.bodies[wp.body] && G.World.bodies[wp.body].def.type !== 'star') {
      landed = true;
      G.Ship.deactivate();
      G.Rover.activate();
      G.World.buildTerrain(wp.body);
      G.Rover.place(wp.rx || 0, wp.rz || 0);
      const rp = G.Rover.position();
      G.Ship.teleport(rp.x, rp.y + 22, rp.z);
      G.Kora.setContext(wp.body);
      G.UI.koraSay('Resuming surface operations on ' + G.World.bodies[wp.body].def.name + '.');
    } else if (wp && wp.ship) {
      G.Ship.teleport(wp.ship.x, wp.ship.y, wp.ship.z);
    } else {
      const earth = G.World.bodies['earth'];
      if (earth && earth.worldPos) {
        G.Ship.teleport(earth.worldPos.x + 70, 10, earth.worldPos.z + 45, G.World.satellite().position);
      }
    }
  }

  function saveWorldPos() {
    const st = G.Save.get();
    if (landed) {
      const rp = G.Rover.position();
      st.worldPos = { landed: true, body: G.World.terrainBody, rx: rp.x, rz: rp.z };
    } else {
      const sp = G.Ship.position();
      st.worldPos = { landed: false, ship: { x: sp.x, y: sp.y, z: sp.z } };
    }
    G.Save.save();
  }

  function objectivePosition() {
    const step = G.Missions.currentStep();
    if (!step) return null;
    if (step.type === 'travel_body' || step.type === 'land') return G.World.bodyPosition(step.target);
    if (step.type === 'dock') return G.World.stationPosition(step.target);
    if (step.type === 'npc') {
      const npc = G.NPCS[step.target];
      return npc ? G.World.stationPosition(npc.location) : null;
    }
    if (step.type === 'report') return G.World.bodyPosition('earth');
    if (step.type === 'scan') {
      if (step.target === 'satellite') {
        const sat = G.World.satellite();
        if (sat) return sat.position;
      }
      const bp = G.World.bodyPosition(step.target);
      if (bp) return bp;
      const pois = G.World.pois, from = landed ? G.Rover.position() : G.Ship.position();
      let best = null, bd = Infinity;
      for (let i = 0; i < pois.length; i++) {
        const p = pois[i];
        if (p.kind !== step.target && p.id !== step.target) continue;
        const d = (p.scanned ? 1e6 : 0) + from.distanceTo(p.obj.position);
        if (d < bd) { bd = d; best = p.obj.position; }
      }
      if (best) return best;
      const an = G.Sectors.anomalies();
      for (let i = 0; i < an.length; i++) {
        if (an[i].kind === step.target || an[i].id === step.target) return an[i].obj.position;
      }
      // Surface targets are not built yet from orbit: point at the mission's world instead.
      const m = G.Missions.current();
      if (!landed && m && m.location) return G.World.bodyPosition(m.location);
    }
    return null;
  }

  function updateWaypoint() {
    const course = !landed && G.StarMap.course();
    let pos = course ? course.pos : objectivePosition();
    if (landed && pos && !G.World.pois.some(function (p) { return p.obj.position === pos; })) pos = null;
    G.World.setObjective(pos);
    if (!pos) { G.UI.setWaypoint(null); G.HUD.setObjective(null); return; }
    const step = G.Missions.currentStep();
    const from = landed ? G.Rover.position() : G.Ship.position();
    const d = from.distanceTo(pos);
    let label = '', radius = 4;
    if (course) { label = course.label; radius = course.radius; }
    else if (step) {
      if (step.target === 'satellite') label = 'Training Satellite';
      else if (step.type === 'report') label = 'Mission Control · Earth';
      else if (G.PLANETS[step.target]) { label = G.PLANETS[step.target].name; radius = G.PLANETS[step.target].radius; }
      else if (G.STATIONS[step.target]) label = G.STATIONS[step.target].name;
      else {
        const pois = G.World.pois;
        for (let i = 0; i < pois.length; i++) {
          if (pois[i].kind === step.target || pois[i].id === step.target) { label = pois[i].name; break; }
        }
      }
    }
    G.UI.setWaypoint({ label: label || 'Objective', dist: d });
    G.HUD.setObjective({ pos: pos, label: label || 'Objective', radius: radius });
  }

  function fadeOut(cb) {
    const f = U.el('fade-overlay');
    f.classList.add('active');
    setTimeout(function () {
      cb();
    }, 650);
  }

  function fadeIn() {
    const f = U.el('fade-overlay');
    f.classList.remove('active');
  }

  // Among everything in range, prefer what the crosshair is closest to, so a small object beside a big one can be picked.
  function pickScanTarget() {
    const from = landed ? G.Rover.position() : G.Ship.position();
    const lim0 = landed ? 32 : SCAN_R;
    const cands = [];
    function add(t, pos, rad, dist, lim) {
      if (dist < lim) cands.push({ t: t, pos: pos, rad: rad || 1, dist: Math.max(dist, 0.1) });
    }
    const pois = G.World.pois;
    for (let i = 0; i < pois.length; i++) {
      const p = pois[i];
      add(p, p.obj.position, p.radius, from.distanceTo(p.obj.position), p.scanRange ? Math.max(lim0, p.scanRange) : lim0);
    }
    if (!landed) {
      const sat = G.World.satellite();
      if (sat) add({ obj: sat, id: 'satellite', kind: 'satellite', name: 'Training Satellite', radius: 4, scanned: false }, sat.position, 4, from.distanceTo(sat.position), SCAN_R);
      const an = G.Sectors.anomalies();
      for (let i = 0; i < an.length; i++) {
        const a = an[i];
        const d = from.distanceTo(a.obj.position) - (a.surface || 0);
        if (a.range && d >= a.range) continue;
        add(a, a.obj.position, a.radius, d, a.scanRange ? Math.max(SCAN_R, a.scanRange) : SCAN_R);
      }
      const nb = G.World.nearestBody(from, 1e9);
      if (nb && nb.dist < nb.body.def.radius + SCAN_R) {
        const id = nb.body.def.id, info = G.Scanner.infoFor(id);
        if (info) add({
          obj: nb.body.group, id: id, kind: id, name: info.name, radius: nb.body.def.radius,
          scanned: G.Save.isPoiScanned('orbit', id), orbit: true
        }, nb.body.worldPos, nb.body.def.radius, nb.dist, nb.body.def.radius + SCAN_R);
      }
    }
    if (!cands.length) return null;
    const cam = G.World.camera, fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    const cp = new THREE.Vector3();
    cam.getWorldPosition(cp);
    let best = null, bs = Infinity;
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const to = c.pos.clone().sub(cp), dc = to.length() || 1;
      const ang = Math.acos(Math.max(-1, Math.min(1, to.dot(fwd) / dc)));
      // Targets outside a narrow cone fall back to plain distance ranking.
      // Huge deep-space objects (galaxies, nebulae) surround you, so they must not outrank nearby small objects.
      const deep = c.t.deep ? 1 : 0;
      const cone = Math.max(0.2, deep ? 0 : Math.atan(c.rad / dc));
      const score = ang <= cone ? ang * 100 + c.dist * 0.01 + deep * 30 + (c.t.scanned ? 4 : 0) : 1000 + c.dist + deep * 5000 + (c.t.scanned ? 500 : 0);
      if (score < bs) { bs = score; best = c.t; }
    }
    return best;
  }

  function doScan() {
    if (mode !== 'play' || G.Scanner.isScanning()) return;
    const target = pickScanTarget();
    if (!target) {
      G.UI.notify('No scannable object in range', 'info');
      return;
    }
    if (target.scanned) {
      G.Missions.onScan(target);
      G.UI.notify('Already scanned: ' + (target.name || 'object'), 'info');
      G.UI.openScanPanel(target);
      return;
    }
    if (G.Scanner.startScan(target)) {
      G.UI.openScanPanel(target);
      G.Audio.play('ping');
    }
  }

  const SCAN_R = 45;

  function scanReach(poi) {
    const from = landed ? G.Rover.position() : G.Ship.position();
    const b = G.World.bodies[poi.id];
    let surf = poi.surface || 0, lim = landed ? 32 : SCAN_R;
    if (!landed && b && poi.orbit && !poi.craft && !poi.site) surf = b.def.radius;
    if (poi.scanRange) lim = Math.max(lim, poi.scanRange);
    return { dist: from.distanceTo(poi.obj.position) - surf, lim: lim };
  }

  function resolvePoi(t) {
    let poi = t.poi;
    if (!poi && t.bodyId) {
      const b = G.World.bodies[t.bodyId], info = G.Scanner.infoFor(t.bodyId);
      if (b && info) poi = { obj: b.group, id: t.bodyId, kind: t.bodyId, name: info.name, radius: b.def.radius, scanned: G.Save.isPoiScanned('orbit', t.bodyId), orbit: true };
    }
    return poi;
  }

  function scanStatus(t) {
    const poi = resolvePoi(t);
    if (!poi || !poi.obj) return null;
    const r = scanReach(poi);
    return { ok: r.dist <= r.lim, dist: r.dist, lim: r.lim };
  }

  function scanTarget(t) {
    if (mode !== 'play' || G.Scanner.isScanning()) return;
    const poi = resolvePoi(t);
    if (!poi) { G.UI.notify('There is nothing to scan here', 'info'); return; }
    const r = scanReach(poi);
    if (r.dist > r.lim) {
      G.UI.notify('Too far! Fly within ' + Math.round(r.lim) + 'm of ' + (t.name || poi.name) + ' to scan it (now ' + Math.round(r.dist) + 'm)', 'info');
      G.Audio.play('error');
      return;
    }
    if (G.Scanner.startScan(poi)) { G.UI.openScanPanel(poi); G.Audio.play('ping'); }
  }

  function doInteract() {
    if (mode !== 'play') return;
    if (interactTarget) {
      const fn = interactTarget;
      interactTarget = null;
      fn();
      return;
    }
    if (landed) {
      const near = G.World.nearestPOI(G.Rover.position(), 20);
      if (near && !near.poi.scanned) {
        doScan();
      }
      return;
    }
    const nearStation = G.World.nearestStation(G.Ship.position(), 22);
    const nearBody = G.World.nearestBody(G.Ship.position(), 1e9);
    const canLand = !!(nearBody && nearBody.dist < nearBody.body.def.radius + 14 && nearBody.body.def.type !== 'star');
    if (nearStation && (nearStation.dist < 12 || !canLand)) {
      dock(nearStation.station);
      return;
    }
    if (canLand) {
      land(nearBody.body);
      return;
    }
    G.UI.notify('Nothing to interact with nearby', 'info');
  }

  function dock(station) {
    G.Audio.play('dock');
    G.UI.notify('Docked at ' + station.def.name, 'good');
    G.Save.visit(station.def.id);
    G.Missions.onDock(station.def.id);
    G.UI.openStation(station);
  }

  function land(body) {
    G.Audio.play('land');
    interactTarget = null;
    G.UI.closeStation();
    const nearSite = G.Spacecraft.siteNear(G.Ship.position(), body.def.id);
    const siteNote = nearSite && nearSite.dist < body.def.radius * 1.5 ? ' We touched down close to the ' + nearSite.site.name + '. ' : ' ';
    fadeOut(function () {
      landed = true;
      G.Ship.deactivate();
      G.Rover.activate();
      G.World.buildTerrain(body.def.id);
      G.Rover.place(0, 0);
      const rp = G.Rover.position();
      G.Ship.teleport(rp.x, rp.y + 22, rp.z);
      G.Save.visit(body.def.id);
      G.Kora.setContext(body.def.id);
      G.Missions.onLand(body.def.id);
      saveWorldPos();
      G.UI.notify('Landed on ' + body.def.name + '. Rover deployed.', 'good');
      const gas = G.TERRAINS.isGas(body.def);
      G.UI.koraSay(gas
        ? body.def.name + ' has no solid ground at all! I switched your rover to hover mode so we can glide over the cloud tops. Look for the glowing rings and tap or press Q to scan them!'
        : 'Touchdown on ' + body.def.name + '!' + siteNote + 'Drive around, find the glowing rings, and scan everything you see. I will tell you all about it.');
      fadeIn();
    });
  }

  function doRoverAction() {
    if (mode !== 'play') return;
    if (!landed) {
      G.UI.notify('You must land first — approach a planet surface and press E', 'info');
      return;
    }
    const roverPos = G.Rover.position();
    const shipPos = G.Ship.position();
    const far = U.dist(roverPos.x, roverPos.z, shipPos.x, shipPos.z) >= 30;
    returnToShip(far ? 'Rover recalled to the EX-01.' : null);
  }

  function goHome() {
    if (mode !== 'play') return;
    G.StarMap.close();
    G.Ship.setJump(false);
    if (landed) {
      returnToShip();
      setTimeout(function () { G.UI.travelTo('earth', true); }, 1000);
    } else {
      G.UI.travelTo('earth', true);
    }
  }

  function returnToShip(msg) {
    G.Audio.play('dock');
    fadeOut(function () {
      landed = false;
      G.Rover.deactivate();
      G.Rover.hide();
      G.World.removeTerrain();
      G.Ship.activate();
      G.Missions.onReturnShip();
      saveWorldPos();
      G.UI.notify(msg || 'Rover recovered. Back aboard the EX-01.', 'good');
      fadeIn();
    });
  }
  function updateInteract() {
    if (mode !== 'play') {
      G.UI.setInteract(null);
      return;
    }
    let text = null;
    interactTarget = null;
    const crewNear = G.Crew.interact(landed ? G.Rover.position() : G.Ship.position(), landed);
    if (crewNear) {
      text = crewNear.text;
      interactTarget = crewNear.fn;
    } else if (landed) {
      const near = G.World.nearestPOI(G.Rover.position(), 20);
      if (near && !near.poi.scanned) {
        text = 'Press E or Q to scan: ' + near.poi.name;
        interactTarget = function () { doScan(); };
      } else if (!G.Touch.enabled()) {
        text = 'Press R to return to your ship';
        interactTarget = function () { doRoverAction(); };
      }
    } else {
      const nearStation = G.World.nearestStation(G.Ship.position(), 22);
      const an = G.Sectors.nearestAnomaly(G.Ship.position(), SCAN_R);
      const nearBody = G.World.nearestBody(G.Ship.position(), 1e9);
      const canLand = !!(nearBody && nearBody.dist < nearBody.body.def.radius + 14 && nearBody.body.def.type !== 'star');
      if (nearStation && (nearStation.dist < 12 || !canLand)) {
        text = 'Press E to dock at ' + nearStation.station.def.name;
        interactTarget = function () { dock(nearStation.station); };
      } else if (canLand) {
        text = (an && !an.poi.scanned ? 'Q: scan ' + an.poi.name + ' \u00b7 E: land on ' : 'Press E to land on ') + nearBody.body.def.name;
        interactTarget = function () { land(nearBody.body); };
      } else if (an && !an.poi.scanned) {
        text = 'Press Q to scan: ' + an.poi.name;
        interactTarget = function () { doScan(); };
      }
    }
    G.UI.setInteract(text);
  }

  function loop(now) {
    clock.rafSeen = performance.now();
    requestAnimationFrame(loop);
    step(now);
    if (mode === 'play') drawMinimap();
  }

  // Fallback driver for environments where requestAnimationFrame is throttled
  // or not composited (e.g. embedded webviews). Keeps the game alive.
  setInterval(function () {
    if (!clock) return;
    const sinceRaf = performance.now() - (clock.rafSeen || 0);
    if (sinceRaf > 300) step(performance.now());
    if (mode === 'play') drawMinimap();
  }, 250);

  function step(now) {
    const dt = Math.min(0.05, (now - clock.last) / 1000);
    clock.last = now;
    if (!G.World.isReady()) return;
    if (mode === 'play') {
      G.World.update(dt);
      let info = null;
      if (landed) {
        info = G.Rover.update(dt);
      } else {
        info = G.Ship.update(dt);
        G.Sectors.update(dt, G.Ship.position());
        G.Spacecraft.update(dt);
        G.DeepSpace.update(dt, G.Ship.position());
        G.StarMap.tick(dt, G.Ship.position());
      }
      if (info) {
        G.Audio.engine(landed ? 'rover' : 'ship', info.throttle || 0, !!info.boost, dt);
        const st = G.Save.get();
        if (info.speed > 2) {
          st.fuel = Math.max(0, st.fuel - dt * 0.25);
          st.power = Math.max(0, st.power - dt * 0.1);
        }
        if (st.fuel < 20 && Math.random() < dt * 0.05) {
          G.UI.koraSay('Fuel is getting low, ' + ((st.profile && st.profile.name) || 'Explorer') + '. Consider docking at a station soon.');
        }
      }
      const scanRes = G.Scanner.update(dt);
      if (scanRes) {
        if (scanRes.finished) {
          G.UI.scanFinished(scanRes.poi, scanRes.info);
        } else {
          G.UI.updateScanPanel();
        }
      }
      const sc = G.Scanner.current();
      if (sc && sc.poi && sc.poi.obj) {
        const rr = scanReach(sc.poi);
        if (rr.dist > rr.lim * 1.6 + 10) {
          G.Scanner.cancel();
          G.UI.notify('Scan interrupted: target out of range', 'info');
        }
      }
      const sc2 = G.Scanner.current();
      if (sc2 && sc2.poi && sc2.poi.obj) {
        G.World.setScanState({ position: sc2.poi.obj.position, progress: G.Scanner.progress() });
      } else {
        G.World.setScanState(null);
      }
      updateInteract();
      updateWaypoint();
      G.UI.updateHUD();
      G.Crew.update(dt, landed);
      G.HUD.update(dt, info, landed);
      posSaveTimer -= dt;
      if (posSaveTimer <= 0) { posSaveTimer = 5; saveWorldPos(); }
      if (Math.random() < dt * 4) G.Missions.checkArrival(G.Ship.position(), landed ? G.World.terrainBody : null);
      if (Math.random() < dt * 0.002) G.Save.save();
      G.World.render();
    } else {
      G.Audio.engine(null, 0, false, dt);
      menuHold += dt;
      const budget = document.body.classList.contains('touch') ? 0.08 : 0.05;
      if (menuHold < budget) return;
      const stepDt = Math.min(0.12, menuHold);
      menuHold = 0;
      if (G.World.updateLite) G.World.updateLite(stepDt);
      else G.World.update(stepDt);
      if (G.Spacecraft && G.Spacecraft.update) G.Spacecraft.update(stepDt);
      const cam = G.World.camera;
      const t = now * 0.00003;
      const earth = G.World.bodies['earth'];
      if (earth && earth.worldPos) {
        cam.position.set(
          earth.worldPos.x + Math.cos(t) * 46,
          8 + Math.sin(t * 2.3) * 6,
          earth.worldPos.z + Math.sin(t) * 46
        );
        cam.lookAt(earth.worldPos.x - Math.sin(t) * 22, 0, earth.worldPos.z + Math.cos(t) * 22);
        if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); }
      }
      if (G.World.renderDirect) G.World.renderDirect();
      else G.World.render();
    }
  }

  function openReport() {
    mode = 'report';
    U.hide('hud');
    showScreen('report-screen');
    const st = G.Save.get();
    const body = U.el('report-body');
    const visitedPlanets = st.visited.filter(function (id) { return G.PLANETS[id] && G.PLANETS[id].type !== 'star'; });
    let planets = visitedPlanets.slice();
    ['earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].forEach(function (id) {
      if (planets.length < 4 && planets.indexOf(id) < 0) planets.push(id);
    });
    const historyPool = ['apollo11', 'chandrayaan1', 'chandrayaan2', 'chandrayaan3', 'voyager.missions', 'mars.rovers'];
    let history = historyPool.filter(function (id) { return !!st.knowledge[id]; });
    if (history.length < 2) history = ['apollo11', 'chandrayaan3'];
    const conceptPool = ['gravity.concept', 'mars.water', 'science.method', 'orbit.concept', 'gas.giant.concept', 'light.year', 'communication.concept'];
    let concepts = conceptPool.filter(function (id) { return !!st.knowledge[id]; });
    if (concepts.length < 2) concepts = ['gravity.concept', 'science.method', 'orbit.concept'];
    let html = '';
    html += '<div class="report-group"><h3>Choose a planet or moon you explored</h3><div class="report-options" data-group="planet">';
    for (let i = 0; i < planets.length; i++) {
      const p = G.PLANETS[planets[i]];
      html += '<button class="report-opt" data-group="planet" data-val="' + p.id + '">' + p.name + '</button>';
    }
    html += '</div></div>';
    html += '<div class="report-group"><h3>Choose a historical mission</h3><div class="report-options" data-group="history">';
    for (let i = 0; i < history.length; i++) {
      const t = G.KNOWLEDGE.find(function (k) { return k.id === history[i]; });
      if (t) html += '<button class="report-opt" data-group="history" data-val="' + t.id + '">' + t.topic + '</button>';
    }
    html += '</div></div>';
    html += '<div class="report-group"><h3>Choose a scientific concept</h3><div class="report-options" data-group="concept">';
    for (let i = 0; i < concepts.length; i++) {
      const t = G.KNOWLEDGE.find(function (k) { return k.id === concepts[i]; });
      if (t) html += '<button class="report-opt" data-group="concept" data-val="' + t.id + '">' + t.topic + '</button>';
    }
    html += '</div></div>';
    body.innerHTML = html;
    body.querySelectorAll('.report-opt').forEach(function (btn) {
      btn.onclick = function () {
        const group = this.getAttribute('data-group');
        body.querySelectorAll('.report-opt[data-group="' + group + '"]').forEach(function (b) { b.classList.remove('selected'); });
        this.classList.add('selected');
      };
    });
  }

  function submitReport() {
    const body = U.el('report-body');
    const sel = body.querySelectorAll('.report-opt.selected');
    if (sel.length < 3) {
      G.UI.notify('Please select one option from each group', 'bad');
      G.Audio.play('error');
      return;
    }
    G.Audio.play('success');
    G.Missions.onReport();
    showCredits();
  }

  function showCredits() {
    // Keep the explorer's position so Free Roam and Resume continue from here.
    if (landed || mode === 'play') saveWorldPos();
    mode = 'credits';
    U.hide('hud');
    showScreen('credits-screen');
    const st = G.Save.get();
    const m = G.MISSIONS[st.missionIndex - 1];
    let text = 'Explorer: ' + (st.profile ? st.profile.name : 'Unknown') + '\n';
    text += 'Final Rank: ' + G.Save.rank().name + '\n';
    text += 'Missions Completed: ' + st.completedMissions.length + ' / ' + G.MISSIONS.length + '\n';
    text += 'Knowledge Topics: ' + Object.keys(st.knowledge).length + ' / ' + G.KNOWLEDGE.length + '\n';
    text += 'Badges Earned: ' + st.badges.length + ' / ' + G.BADGES.length + '\n';
    text += 'Questions Asked: ' + st.questionsAsked + '\n\n';
    const seen = st.visited.filter(function (id) { return G.PLANETS[id]; }).map(function (id) { return G.PLANETS[id].name; });
    const seenText = seen.length ? seen.join(', ') : 'nothing yet';
    text += 'What I saw: ' + seenText + '.\n';
    text += 'What I measured: craters, channels, storms, rings and signals.\n';
    text += 'What I learned: that science is asking questions and following evidence.\n';
    text += 'Where I learned it: from the Moon to the cold edge of the Solar System.';
    U.el('credits-text').textContent = text;
    G.Audio.startMusic('discovery');
    G.Audio.speak('Mission complete. You started by asking where the Moon was. You ended by explaining why it has craters. Acceptable progress.', st.settings.rate);
  }

  document.addEventListener('DOMContentLoaded', boot);

  return {
    fadeOut: fadeOut, fadeIn: fadeIn,
    scanTarget: scanTarget, scanStatus: scanStatus, doScan: function () { doScan(); }, doInteract: function () { doInteract(); },
    doRoverAction: function () { doRoverAction(); },
    goHome: goHome,
    isLanded: function () { return landed; },
    showCredits: showCredits, openReport: openReport,
    drawMinimap: drawMinimap,
    get mode() { return mode; }
  };
})();
