window.G = window.G || {};

G.UI = (function () {
  const U = G.utils;
  let koraOpen = false;
  let mapOpen = false;
  let currentStation = null;
  let currentNpc = null;

  const NOTICE_ICON = { good: G.Icon('check'), bad: G.Icon('warn'), info: G.Icon('info') };
  let noticeTimer = null, lastNotice = '', lastNoticeAt = 0;
  // One dedicated slot: new alerts replace the current one instead of stacking.
  function notify(text, type) {
    text = deviceText(text);
    type = type || 'info';
    const now = performance.now();
    if (text === lastNotice && now - lastNoticeAt < 1500) return;
    lastNotice = text; lastNoticeAt = now;
    const area = U.el('notification-area');
    let n = U.el('notice');
    if (!n) {
      n = document.createElement('div');
      n.id = 'notice';
      n.innerHTML = '<i></i><span></span><b></b>';
      area.appendChild(n);
    }
    n.className = 'notification ' + type;
    n.querySelector('i').innerHTML = NOTICE_ICON[type] || NOTICE_ICON.info;
    n.querySelector('span').textContent = text;
    void n.offsetWidth;
    n.classList.add('show');
    if (type === 'bad') G.Audio.play('alert'); else if (type !== 'info') G.Audio.play('notify');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { n.classList.remove('show'); }, type === 'bad' ? 3600 : 2800);
  }

  // Rewrites keyboard instructions into touch instructions on phones and tablets.
  function deviceText(text) {
    if (!text || !(G.Touch && G.Touch.enabled())) return text;
    return String(text)
      .replace(/\b(press|tap) (E or Q|Q or E)\b/gi, 'tap SCAN')
      .replace(/\bpress Q\b/gi, 'tap SCAN').replace(/\(Q\)/g, '(SCAN)').replace(/\bwith Q\b/gi, 'with SCAN')
      .replace(/\bpress E\b/gi, 'tap GO').replace(/\bE: land\b/g, 'GO: land').replace(/\bQ: scan\b/g, 'SCAN:')
      .replace(/\bpress R\b/gi, 'tap SHIP').replace(/\(R\)/g, '(SHIP)')
      .replace(/\bwith M\b/g, 'with the MAP button').replace(/\bpress M\b/gi, 'tap MAP').replace(/\(M\)/g, '(MAP)')
      .replace(/\bpress J\b/gi, 'tap LOG').replace(/\bpress K\b/gi, 'tap COMMS')
      .replace(/\bpress H\b/gi, 'tap JUMP').replace(/\bpress B\b/gi, 'tap HOME')
      .replace(/\buse WASD to thrust\b/gi, 'slide THRUST up to fly')
      .replace(/\b(press|use|hold) (W|W and S|WASD)\b/gi, 'slide THRUST')
      .replace(/\b(press|hold) Shift\b/gi, 'hold BOOST').replace(/\b(press|hold|tap) Space(bar)?\b/gi, 'tap STOP')
      .replace(/\b(drag|move) (the )?mouse\b/gi, 'drag the screen')
      .replace(/\bclick\b/gi, 'tap');
  }

  function discoveryToast(title, text) {
    const t = U.el('discovery-toast');
    t.querySelector('.discovery-title').textContent = title || 'New Discovery';
    t.querySelector('.discovery-text').textContent = text;
    t.classList.add('hidden');
    void t.offsetWidth;
    t.classList.remove('hidden');
    t.classList.remove('fadeout');
    clearTimeout(t._a); clearTimeout(t._b);
    t._a = setTimeout(function () { t.classList.add('fadeout'); }, 3200);
    t._b = setTimeout(function () { t.classList.add('hidden'); }, 3800);
    if (G.Holo) G.Holo.mood('happy', 3);
    if (G.FX) G.FX.burst(window.innerWidth / 2, window.innerHeight * 0.3, '255,190,80', 34);
  }

  function koraSay(text, live) {
    text = deviceText(text);
    addKoraMessage(text, 'kora', live);
    const st = G.Save.get();
    if (st.settings.voice) {
      G.Audio.speak(text, st.settings.rate);
    }
    if (G.Holo) G.Holo.speak(text);
  }

  function koraVoice(text) {
    if (!text) return;
    text = deviceText(text);
    const st = G.Save.get();
    if (st.settings.voice) G.Audio.speak(text, st.settings.rate);
    if (G.Holo) G.Holo.speak(text);
  }

  function addKoraMessage(text, who, live) {
    const box = U.el('kora-messages');
    if (!box) return null;
    const div = document.createElement('div');
    div.className = 'kora-msg ' + who + (live ? ' live' : '');
    const tag = document.createElement('span');
    tag.className = 'msg-tag';
    tag.textContent = who === 'kora' ? (live ? 'KORA // LIVE LINK' : 'KORA') : 'You';
    div.appendChild(tag);
    div.appendChild(document.createTextNode(text));
    if (live && live.url) {
      const src = document.createElement('a');
      src.className = 'msg-src';
      src.href = live.url;
      src.target = '_blank';
      src.rel = 'noopener noreferrer';
      src.textContent = 'Source: Wikipedia \u2014 ' + live.title;
      src.style.color = 'inherit';
      div.appendChild(src);
    }
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  function openKora() {
    koraOpen = true;
    U.show('kora-panel');
    U.el('kora-input').focus();
    renderSuggestions();
  }

  function closeKora() {
    koraOpen = false;
    U.hide('kora-panel');
    G.Voice.stop();
    U.hide('kora-listening');
    U.el('kora-mic').classList.remove('listening');
  }

  function toggleKora() {
    if (koraOpen) closeKora(); else openKora();
  }

  function renderSuggestions() {
    const box = U.el('kora-suggestions');
    box.innerHTML = '';
    const sugg = G.KORA_LINES.suggestions.slice(0, 4);
    const nb = G.World.nearestBody(G.Ship.position(), 600);
    if (nb && nb.body) sugg.unshift('Tell me about ' + nb.body.def.name.replace(/^The /, 'the '));
    sugg.push('How do I fly?', 'What is a black hole?', 'How do stars form?');
    for (let i = 0; i < sugg.length; i++) {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.textContent = sugg[i];
      chip.onclick = function () { sendKora(sugg[i]); };
      box.appendChild(chip);
    }
  }

  function controlsGuide(landed) {
    const touch = G.Touch && G.Touch.enabled();
    if (touch) {
      return landed
        ? 'Rover controls: slide THRUST up to drive, hold LEFT or RIGHT to turn, REVERSE to back up and STOP to brake. Drag the screen to look around. Tap SCAN near a glowing ring, tap TALK near an astronaut, and tap SHIP to fly back to your ship.'
        : 'Flight controls: drag anywhere on the screen to steer. Slide THRUST up to fly forward, hold BOOST to go faster, STOP to brake, UP and DOWN to rise or sink. Tap SCAN near an object, GO to land or dock, MAP to choose a destination, and HOME to jump back to Earth.';
    }
    return landed
      ? 'Rover controls: W and S to drive, A and D to steer, drag the mouse to look around. Press Q near a glowing ring to scan it, E to talk to astronauts, and R to return to your ship.'
      : 'Flight controls: W and S for thrust, A and D or drag the mouse to steer, arrow keys to pitch, Shift to boost, Space to brake, R and F to rise or sink. Press Q to scan, E to land or dock, M for the map, B to go home, and H for the jump drive beyond Neptune.';
  }

  // Returns true when the message was blocked and KORA has already replied.
  function blockUnsafe(text) {
    if (!G.Safety.unsafe(text)) return false;
    addKoraMessage(G.Safety.clean(text), 'player');
    G.Audio.play('error');
    if (G.Holo) G.Holo.mood('think', 2);
    setTimeout(function () { koraSay(G.Safety.needsCare(text) ? G.Safety.careLine : G.Safety.redirect()); }, 350);
    return true;
  }

  function sendKora(text) {
    if (!text || !text.trim()) return;
    if (blockUnsafe(text)) return;
    addKoraMessage(text, 'player');
    if (/\b(guide|tutorial|how to play)\b/i.test(text)) {
      koraSay('Opening the Explorer Guide for you!');
      G.Guide.open(1);
      return;
    }
    if (/\b(controls?|how (do|can) i (fly|drive|move|play|steer|scan|land)|how to (fly|play|drive|move))\b/i.test(text)) {
      koraSay(controlsGuide(G.Game.isLanded()));
      return;
    }
    answer(text);
  }

  // Local knowledge first; unknown or weak matches go to the live Wikipedia link.
  function answer(text) {
    G.Save.recordQuestion();
    G.Audio.play('radio');
    const res = G.Kora.respond(text);
    const casual = res.intent === 'CASUAL' || res.intent === 'MISSION_HELP' || res.intent === 'NAVIGATION_HELP' || res.intent === 'QUIZ_HINT';
    if ((res.intent === 'UNKNOWN' || res.weak) && !casual) {
      const typing = addKoraMessage('Querying the Deep Space Network', 'kora', { title: '' });
      if (typing) { typing.classList.add('typing'); typing.querySelector('.msg-src') && typing.querySelector('.msg-src').remove(); }
      if (G.Holo) G.Holo.mood('think', 3);
      const ctx = G.World.terrainBody || (G.World.nearestBody(G.Ship.position(), 400) || {}).body;
      const ctxName = typeof ctx === 'string' ? G.World.bodies[ctx].def.name : (ctx ? ctx.def.name : null);
      G.Codex.ask(text, ctxName).then(function (live) {
        if (typing) typing.remove();
        if (live && live.text) {
          koraSay(live.text, live);
          G.Codex.record({ title: live.title, extract: live.text, thumb: live.thumb, url: live.url, description: live.description });
          G.Journal.refresh();
        } else {
          koraSay(res.text);
        }
        checkQuestionBadge();
      });
      return;
    }
    setTimeout(function () {
      koraSay(res.text);
      if (res.topic && res.topic.id) {
        G.Save.unlockKnowledge(res.topic.id, 'seen');
        G.Journal.refresh();
      }
      checkQuestionBadge();
    }, 450);
  }

  function checkQuestionBadge() {
    if (G.Save.get().questionsAsked >= 10) {
      if (G.Save.awardBadge('question_machine')) {
        discoveryToast('Badge Earned', 'Question Machine');
        G.Audio.play('badge');
      }
    }
  }

  function initKoraPanel() {
    U.el('kora-send').onclick = function () {
      const inp = U.el('kora-input');
      sendKora(inp.value);
      inp.value = '';
    };
    U.el('kora-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        sendKora(this.value);
        this.value = '';
      }
    });
    U.el('kora-mic').onclick = function () {
      if (!G.Voice.available()) {
        koraSay(G.KORA_LINES.voiceUnavailable[0]);
        return;
      }
      const btn = this;
      if (G.Voice.isListening()) {
        G.Voice.stop();
        btn.classList.remove('listening');
        U.hide('kora-listening');
        return;
      }
      btn.classList.add('listening');
      U.show('kora-listening');
      const ok = G.Voice.start(function (transcript) {
        if (blockUnsafe(transcript)) return;
        addKoraMessage(transcript, 'player');
        answer(transcript);
      }, function () {
        btn.classList.remove('listening');
        U.hide('kora-listening');
      });
      if (!ok) {
        btn.classList.remove('listening');
        U.hide('kora-listening');
        koraSay(G.KORA_LINES.voiceUnavailable[0]);
      }
    };
  }

  function updateObjective() {
    const m = G.Missions.current();
    const step = G.Missions.currentStep();
    if (!m) {
      U.el('objective-text').textContent = 'Free Roam';
      U.el('objective-steps').innerHTML = '<div class="step-active">&#9654; Explore anywhere \u2014 scan objects, land on worlds, meet astronauts</div>';
      return;
    }
    U.el('objective-text').textContent = m.title;
    let html = '';
    for (let i = 0; i < m.steps.length; i++) {
      const cls = i < G.Save.get().missionStep ? 'step-done' : i === G.Save.get().missionStep ? 'step-active' : '';
      const mark = i < G.Save.get().missionStep ? '&#10003; ' : i === G.Save.get().missionStep ? '&#9654; ' : '&#9679; ';
      html += '<div class="' + cls + '">' + mark + deviceText(m.steps[i].text) + '</div>';
    }
    U.el('objective-steps').innerHTML = html;
  }

  function updateHUD() {
    const st = G.Save.get();
    U.el('hud-rank-name').textContent = G.Save.rank().name;
    U.el('status-fuel').textContent = Math.round(st.fuel) + '%';
    U.el('status-power').textContent = Math.round(st.power) + '%';
    const near = G.World.nearestBody(G.Ship.position(), 200);
    let dest = 'Deep Space';
    const sp = G.Ship.position();
    const region = G.DeepSpace.regionName(sp);
    if (region) dest = region;
    const dn = G.DeepSpace.nearest(sp, 400);
    if (dn) dest = dn.a.name + ' \u2014 Near';
    if (near) {
      dest = near.body.def.name;
      if (near.dist < near.body.def.radius + 30) dest += ' — Near';
    }
    U.el('hud-dest-name').textContent = dest;
  }

  function setWaypoint(data) {
    const el = U.el('objective-nav');
    if (!el) return;
    if (!data) { el.classList.add('hidden'); return; }
    const d = data.dist;
    const distText = d >= 1000 ? (d / 1000).toFixed(1) + 'k' : Math.round(d) + 'm';
    el.innerHTML = '<span class="nav-arrow">&#10148;</span>' + G.Codex.esc(data.label) +
      ' <span class="nav-dist">' + distText + '</span>';
    el.classList.remove('hidden');
  }

  function setInteract(text) {
    const el = U.el('hud-interact');
    const act = U.el('m-act');
    const isScanText = !!text && /scan/i.test(text) && !/land|dock|talk/i.test(text);
    if (text) {
      if (G.Touch && G.Touch.enabled()) text = deviceText(text.replace(/^Press (E or Q|Q) to scan/, 'Tap SCAN to scan').replace(/^Press [A-Z] to/, 'Tap \u25C6 to'));
      if (el.textContent !== text) el.textContent = text;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
    if (act) {
      const label = !text ? 'GO' : /land/i.test(text) ? 'LAND' : /dock/i.test(text) ? 'DOCK' : /return/i.test(text) ? 'BOARD' : /talk/i.test(text) ? 'TALK' : 'GO';
      act.querySelector('b').textContent = label;
      // GO only lights up for land/dock/talk; scanning has its own SCAN button.
      act.classList.toggle('ready', !!text && !isScanText);
      act.classList.toggle('idle', !text || isScanText);
      const sc = U.el('m-scan');
      if (sc) sc.classList.toggle('ready', isScanText);
    }
  }
  function openMap() { G.StarMap.open(); }
  function closeMap() { G.StarMap.close(); }
  function toggleMap() { G.StarMap.toggle(); }
  function drawMap() { }

  function warp(cb) {
    const fx = U.el('warp-fx');
    fx.classList.add('active');
    G.Audio.play('warp');
    setTimeout(function () {
      G.Game.fadeOut(function () {
        cb();
        fx.classList.remove('active');
        G.Game.fadeIn();
      });
    }, 900);
  }

  function travelTo(bodyId, free) {
    const b = G.World.bodies[bodyId];
    if (!b || !b.worldPos) return;
    const p = b.def;
    const st = G.Save.get();
    if (!free && st.fuel <= 0) {
      notify('Out of fuel! Dock at a station to refuel.', 'bad');
      G.Audio.play('error');
      return;
    }
    if (!free) st.fuel = Math.max(0, st.fuel - 10);
    G.Save.save();
    warp(function () {
      const offset = p.radius * 2.2 + 18;
      const dir = b.worldPos.clone().normalize();
      if (!isFinite(dir.x)) dir.set(1, 0, 0);
      G.Ship.teleport(b.worldPos.x - dir.x * offset, b.worldPos.y + p.radius * 0.4, b.worldPos.z - dir.z * offset, b.worldPos);
      G.Save.visit(bodyId);
      G.Kora.setContext(bodyId);
      G.Missions.onTravel(bodyId);
      G.UI.notify('Arrived at ' + p.name, 'info');
      G.Audio.startMusic(bodyId === 'earth' ? 'earth' : 'deep');
      checkExplorerBadge();
    });
  }
  function travelToStation(stationId) {
    const s = G.World.stations[stationId];
    if (!s || !s.worldPos) return;
    const st = G.Save.get();
    if (st.fuel <= 0) {
      notify('Out of fuel! Dock at a station to refuel.', 'bad');
      G.Audio.play('error');
      return;
    }
    st.fuel = Math.max(0, st.fuel - 10);
    G.Save.save();
    const target = s.worldPos.clone();
    warp(function () {
      const dir = target.clone().normalize();
      G.Ship.teleport(target.x + dir.x * 16, target.y + 3, target.z + dir.z * 16, s.worldPos);
      G.Save.visit(stationId);
      G.Missions.onTravel(stationId);
      G.UI.notify('Arrived at ' + s.def.name, 'info');
      G.Audio.startMusic('deep');
    });
  }

  function travelToDeep(a) {
    const st = G.Save.get();
    if (st.fuel < 15) {
      notify('Deep jumps need at least 15% fuel. Dock at a station to refuel.', 'bad');
      G.Audio.play('error');
      return;
    }
    st.fuel = Math.max(0, st.fuel - 15);
    G.Save.save();
    const target = a.obj.position.clone();
    warp(function () {
      const dir = target.clone().normalize();
      const off = (a.surface || 10) * 1.3 + 60;
      G.Ship.teleport(target.x - dir.x * off, target.y + 6, target.z - dir.z * off, target);
      G.UI.notify('Arrived at ' + a.name, 'info');
      G.UI.koraSay('We are at ' + a.name + '. Press Q to scan it and learn more.');
      G.Audio.startMusic('deep');
    });
  }

  function checkExplorerBadge() {
    const st = G.Save.get();
    if (st.visited.indexOf('earth') >= 0 && st.visited.indexOf('moon') >= 0 && st.visited.indexOf('mars') >= 0) {
      if (G.Save.awardBadge('solar_system_explorer')) {
        discoveryToast('Badge Earned', 'Solar System Explorer');
        G.Audio.play('badge');
      }
    }
  }
  // ---------- knowledge explorer (scan results, tapped objects, related topics) ----------
  let kx = null;
  const kxHistory = [];

  function questionsFor(name, type) {
    const n = name.replace(/^The /, 'the ');
    if (/BLACK HOLE/i.test(type)) return ['What is a black hole?', 'What would happen if you fell into ' + n + '?', 'How was ' + n + ' photographed?'];
    if (/NEBULA|GALAXY|STAR|PLANETARY SYSTEM|EXOPLANET|EXTRASOLAR|HOT JUPITER|SUPER-EARTH|COMET RESERVOIR/i.test(type)) return ['How far away is ' + n + ' in light-years?', 'What is ' + n + ' made of?', 'How long would it take to travel to ' + n + '?', 'What is a light-year?'];
    if (/LIVING|FOREST|TREE|LIFE/i.test(type)) return ['Why are ' + n.toLowerCase() + 's important?', 'What animals live in a ' + n.toLowerCase() + '?', 'How do plants make food?'];
    if (/STORM|CLOUD|WIND|LIGHTNING|ATMOSPHERE|WEATHER/i.test(type)) return ['Why does ' + n + ' happen?', 'How big is ' + n + '?', 'Is there weather on Earth like ' + n + '?'];
    if (/VOLCANO|GEYSER|PLUME|LAVA/i.test(type)) return ['How do volcanoes work?', 'What comes out of ' + n + '?', 'Is ' + n + ' still active?'];
    if (/ICE|SNOW|SALT|WATER|LAKE/i.test(type)) return ['What is ' + n + ' made of?', 'Could there be life near ' + n + '?', 'How cold is ' + n + '?'];
    if (/ROCK|SAMPLE|DUNE|CRATER|DUST/i.test(type)) return ['How did ' + n + ' form?', 'What is ' + n + ' made of?', 'How old is ' + n + '?'];
    if (/LANDING SITE/i.test(type)) return ['How did ' + n + ' land safely?', 'What did ' + n + ' discover?', 'How do spacecraft land on other worlds?'];
    if (/SPACECRAFT|STATION|PROBE|SATELLITE|HISTOR|DEBRIS/i.test(type)) return ['What does ' + n + ' do?', 'Who built ' + n + '?', 'How does ' + n + ' stay in orbit?', 'How do spacecraft get power?'];
    return ['How big is ' + n + '?', 'What is ' + n + ' made of?', 'Who discovered ' + n + '?', 'Could people live on ' + n + '?'];
  }

  function renderKnowledge(t, scanning) {
    kx = t;
    const E = G.Codex.esc;
    U.show('scan-panel');
    U.el('scan-title').textContent = t.name;
    U.el('scan-subtitle').textContent = scanning ? 'Scanning...' : (t.type || 'Discovery').toString().toLowerCase();
    let html = '';
    if (kxHistory.length) html += '<button class="kx-back" id="kx-back">&#8592; Back to ' + E(kxHistory[kxHistory.length - 1].name) + '</button>';
    html += '<div class="kx-hero"><div class="kx-img-wrap"><img id="kx-img" alt=""><span class="kx-img-ph">&#8982;</span></div><div class="kx-head"><div class="kx-type">' + E(t.type || 'DISCOVERY') + '</div><h3>' + E(t.name) + '</h3><div class="kx-desc" id="kx-desc"></div></div></div>';
    const kinfo = t.poi ? (G.Scanner.infoFor(t.poi.kind) || {}) : {};
    const ktags = (t.tags || kinfo.tags || []).slice(0, 4);
    const kxp = t.xp || kinfo.xp;
    if (ktags.length || kxp) html += '<div class="kx-tags">' + ktags.map(function (x) { return '<span>' + E(x) + '</span>'; }).join('') + (kxp ? '<span class="xp">+' + kxp + ' XP</span>' : '') + '</div>';
    if (scanning) html += '<div class="kx-scan" id="kx-scan"><div class="kx-scan-row"><span>SCANNING TARGET</span><b id="scan-pct">0%</b></div><div class="scan-progress-bar"><div class="scan-progress-fill" id="scan-fill"></div></div></div>';
    if (t.observation) html += '<div class="kx-obs">' + E(t.observation) + '</div>';
    html += '<div class="kx-text" id="kx-text"><span class="kx-loading">Asking the space library</span></div>';
    html += '<div class="kx-actions" id="kx-actions"></div><div class="kx-src" id="kx-src"></div>';
    html += '<details class="kx-more"><summary>Ask KORA &amp; related topics</summary><div class="kx-chips" id="kx-ask"></div><div id="kx-answer"></div><div class="kx-chips" id="kx-rel"><span class="kx-loading">finding topics</span></div></details>';
    U.el('scan-body').innerHTML = html;
    U.el('scan-body').scrollTop = 0;
    if (U.el('kx-back')) U.el('kx-back').onclick = function () { const prev = kxHistory.pop(); renderKnowledge(prev, false); };

    const ask = U.el('kx-ask');
    questionsFor(t.name, t.type || '').slice(0, 3).forEach(function (q) {
      const b = document.createElement('button');
      b.className = 'kx-chip ask';
      b.textContent = q;
      b.onclick = function () {
        G.Audio.play('radio');
        const box = U.el('kx-answer');
        box.innerHTML = '<div class="kx-answer"><b>' + E(q) + '</b><span class="kx-loading">KORA is thinking</span></div>';
        if (G.Holo) G.Holo.mood('think', 3);
        G.Save.recordQuestion();
        G.Codex.ask(q, null, t.title).then(function (a) {
          if (!U.el('kx-answer') || kx !== t) return;
          const text = a && a.text ? a.text : 'Hmm, I could not reach the space library. Try again when we have signal!';
          box.innerHTML = '<div class="kx-answer"><b>' + E(q) + '</b><span></span></div>';
          box.querySelector('span').textContent = text;
          koraSay(text, a && a.url ? a : null);
          if (a) G.Codex.record({ title: a.title, extract: a.text, thumb: a.thumb, url: a.url, description: a.description });
          G.Journal.refresh();
          checkQuestionBadge();
        });
      };
      ask.appendChild(b);
    });

    const acts = U.el('kx-actions');
    function action(label, cls, fn) {
      const b = document.createElement('button');
      b.className = 'kx-btn ' + cls;
      b.innerHTML = label;
      b.onclick = fn;
      acts.appendChild(b);
    }
    if (!scanning && t.canScan) {
      const ss = G.Game.scanStatus(t);
      if (ss && !ss.ok) {
        action('Too far \u2014 fly within ' + Math.round(ss.lim) + 'm (now ' + Math.round(ss.dist) + 'm)', '', function () { G.Game.scanTarget(t); });
        acts.lastChild.classList.add('disabled');
      } else action('Scan target', 'primary', function () { G.Game.scanTarget(t); });
    }
    if (t.pos && !G.World.terrainBody) action('Plot course', '', function () {
      G.StarMap.setCourse({ pos: t.pos, label: t.name, radius: t.radius || 4 });
      notify('Course set: ' + t.name, 'good');
      closeScanPanel();
    });

    if (!t.title) {
      U.el('kx-text').textContent = t.observation ? '' : 'No library entry for this one yet. Scan it to learn more!';
      U.el('kx-rel').textContent = '';
      return;
    }
    G.Codex.summary(t.title).then(function (d) {
      if (kx !== t || !U.el('kx-text')) return;
      if (!d) { U.el('kx-text').textContent = 'No signal to the space library right now. Try again soon!'; return; }
      U.el('kx-text').textContent = G.Codex.shortText(d.extract, 4);
      if (!scanning) koraVoice(G.Codex.shortText(d.extract, 2));
      const obs = U.el('scan-body').querySelector('.kx-obs');
      if (obs && d.extract.indexOf(obs.textContent.slice(0, 40)) === 0) obs.remove();
      U.el('kx-desc').textContent = d.description || '';
      if (d.thumb) { U.el('kx-img').src = d.thumb; U.el('kx-img').parentNode.classList.add('has'); }
      if (d.url) {
        const a = document.createElement('a');
        a.href = d.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = 'Read more on ' + (d.source || 'Wikipedia') + ' \u2197';
        U.el('kx-src').appendChild(a);
      }
      if (G.Codex.record(d)) G.Journal.refresh();
    });
    G.Codex.related(t.title, 4).then(function (list) {
      const rel = U.el('kx-rel');
      if (kx !== t || !rel) return;
      rel.innerHTML = '';
      if (!list.length) { rel.textContent = 'No related topics found.'; return; }
      list.forEach(function (title) {
        const b = document.createElement('button');
        b.className = 'kx-chip';
        b.textContent = title;
        b.onclick = function () {
          G.Audio.play('click');
          kxHistory.push(t);
          if (kxHistory.length > 8) kxHistory.shift();
          renderKnowledge({ name: title, title: title, type: 'Related topic' }, false);
        };
        rel.appendChild(b);
      });
    });
  }

  function infoTarget(poi) {
    const info = G.Scanner.infoFor(poi.kind) || {};
    return {
      name: info.name || poi.name, type: info.type, title: info.codex || G.Codex.titleFor(poi.kind),
      observation: info.observation, poi: poi, canScan: !poi.scanned
    };
  }

  function openScanPanel(poi) {
    kxHistory.length = 0;
    renderKnowledge(infoTarget(poi), G.Scanner.isScanning());
  }

  function openInfo(t) {
    kxHistory.length = 0;
    G.Audio.play('open');
    renderKnowledge(t, false);
  }

  function scanFinished(poi, info) {
    const s = U.el('kx-scan');
    if (s) {
      s.classList.add('done');
      s.innerHTML = '<div class="kx-scan-row"><span>&#10003; SCAN COMPLETE</span><b>' + (info && info.xp ? '+' + info.xp + ' XP' : '') + '</b></div>';
    }
    U.el('scan-subtitle').textContent = 'scanned';
    if (kx && kx.poi === poi) kx.canScan = false;
  }

  function updateScanPanel() {
    const fill = U.el('scan-fill');
    if (fill) fill.style.width = Math.round(G.Scanner.progress() * 100) + '%';
    const pct = U.el('scan-pct');
    if (pct) pct.textContent = Math.round(G.Scanner.progress() * 100) + '%';
  }

  function closeScanPanel() { U.hide('scan-panel'); kx = null; }
  function openNpc(npc) {
    currentNpc = npc;
    U.show('npc-panel');
    U.el('npc-name').textContent = npc.name;
    U.el('npc-role').textContent = npc.role;
    U.el('npc-icon').innerHTML = npc.icon;
    renderNpcGreeting();
  }

  function renderNpcGreeting() {
    const npc = currentNpc;
    if (!npc) return;
    const body = U.el('npc-body');
    body.innerHTML = '<div class="npc-dialogue"><span class="npc-name-tag">' + npc.name + ':</span> ' + npc.greeting + '</div>';
    const opts = document.createElement('div');
    opts.className = 'npc-options';
    const b1 = document.createElement('button');
    b1.className = 'npc-option';
    b1.textContent = 'Ask a question';
    b1.onclick = function () { renderNpcQuestion(0); };
    opts.appendChild(b1);
    const b2 = document.createElement('button');
    b2.className = 'npc-option';
    b2.textContent = 'Chat about science';
    b2.onclick = function () {
      body.innerHTML = '<div class="npc-dialogue"><span class="npc-name-tag">' + npc.name + ':</span> ' + npc.greeting + '</div>';
      body.appendChild(opts);
      G.UI.notify('Speaking with ' + npc.name, 'info');
      G.Missions.onNpc(npc.id);
    };
    opts.appendChild(b2);
    body.appendChild(opts);
  }

  function renderNpcQuestion(qi) {
    const npc = currentNpc;
    if (!npc || !npc.dialogue[qi]) return;
    const q = npc.dialogue[qi];
    const body = U.el('npc-body');
    body.innerHTML = '<div class="npc-dialogue"><span class="npc-name-tag">' + npc.name + ':</span> ' + q.prompt + '</div>';
    const opts = document.createElement('div');
    opts.className = 'npc-options';
    for (let i = 0; i < q.options.length; i++) {
      (function (opt, idx) {
        const b = document.createElement('button');
        b.className = 'npc-option';
        b.textContent = opt.text;
        b.onclick = function () {
          G.Audio.play(opt.correct ? 'success' : 'error');
          body.innerHTML = '<div class="npc-dialogue"><span class="npc-name-tag">' + npc.name + ':</span> ' + opt.response + '</div>';
          const next = document.createElement('div');
          next.className = 'npc-options';
          if (qi + 1 < npc.dialogue.length) {
            const nb = document.createElement('button');
            nb.className = 'npc-option';
            nb.textContent = 'Next question';
            nb.onclick = function () { renderNpcQuestion(qi + 1); };
            next.appendChild(nb);
          }
          const done = document.createElement('button');
          done.className = 'npc-option';
          done.textContent = 'Thank you';
          done.onclick = function () {
            G.Missions.onNpc(npc.id);
            closeNpc();
            if (currentStation) renderStation();
          };
          next.appendChild(done);
          body.appendChild(next);
          if (opt.correct) {
            G.Save.addXp(15);
            G.UI.notify('+15 XP', 'good');
          }
        };
        opts.appendChild(b);
      })(q.options[i], i);
    }
    body.appendChild(opts);
  }

  function closeNpc() {
    currentNpc = null;
    U.hide('npc-panel');
  }

  function refreshStation() {
    if (currentStation && !U.el('station-panel').classList.contains('hidden')) renderStation();
  }

  function openStation(station) {
    currentStation = station;
    U.show('station-panel');
    U.el('station-name').textContent = station.def.name;
    renderStation();
  }

  function renderStation() {
    const s = currentStation;
    if (!s) return;
    const st = G.Save.get();
    const body = U.el('station-body');
    let html = '<div class="npc-dialogue">' + s.def.desc + '</div>';
    html += '<div class="station-service"><div><div class="ss-name">Refuel</div><div class="ss-desc">Fill your fuel tanks (current: ' + Math.round(st.fuel) + '%)</div></div>';
    html += '<button id="ss-refuel" ' + (st.fuel > 95 && !(G.Missions.currentStep() && G.Missions.currentStep().type === 'refuel') ? 'disabled' : '') + '>Refuel</button></div>';
    html += '<div class="station-service"><div><div class="ss-name">Recharge</div><div class="ss-desc">Restore ship power (current: ' + Math.round(st.power) + '%)</div></div>';
    html += '<button id="ss-recharge" ' + (st.power > 95 ? 'disabled' : '') + '>Recharge</button></div>';
    html += '<div class="station-service"><div><div class="ss-name">Rest</div><div class="ss-desc">Save your expedition progress</div></div>';
    html += '<button id="ss-save">Save</button></div>';
    const step = G.Missions.currentStep();
    if (step && step.type === 'quiz') {
      html += '<div class="station-service"><div><div class="ss-name">Knowledge Check</div><div class="ss-desc">The crew would like to test what you learned</div></div>';
      html += '<button id="ss-quiz">Start</button></div>';
    }
    if (step && step.type === 'npc') {
      html += '<div class="station-service"><div><div class="ss-name">Crew Member</div><div class="ss-desc">Someone on the station wants to speak with you</div></div>';
      html += '<button id="ss-npc">Talk</button></div>';
    }
    body.innerHTML = html;
    if (step && step.type === 'quiz') {
      U.el('ss-quiz').onclick = function () {
        const m = G.Missions.current();
        if (m) {
          G.Quiz.start(m.questions.length ? m.questions : ['q_veh_1', 'q_veh_2'], function () {
            G.Missions.onQuiz();
            renderStation();
          });
        }
      };
    }
    if (step && step.type === 'npc') {
      U.el('ss-npc').onclick = function () {
        const npc = G.NPCS[step.target];
        if (npc) G.UI.openNpc(npc);
      };
    }
    U.el('ss-refuel').onclick = function () {
      st.fuel = 100;
      G.Save.save();
      G.Audio.play('success');
      G.Missions.onRefuel();
      G.UI.notify('Fuel tanks full', 'good');
      renderStation();
    };
    U.el('ss-recharge').onclick = function () {
      st.power = 100;
      G.Save.save();
      G.Audio.play('success');
      G.UI.notify('Power restored', 'good');
      renderStation();
    };
    U.el('ss-save').onclick = function () {
      G.Save.save();
      G.Audio.play('click');
      G.UI.notify('Progress saved', 'good');
    };
    if (G.Crew) G.Crew.decorateStation(s, body, renderStation);
  }

  function closeStation() {
    currentStation = null;
    U.hide('station-panel');
  }
  function initProfileScreen() {
    const avatars = U.el('avatar-options');
    avatars.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
      const d = document.createElement('div');
      d.className = 'option-item' + (i === 1 ? ' selected' : '');
      d.innerHTML = '<img src="' + (window.G_ASSETS && G_ASSETS['avatar_' + i + '.svg'] ? G_ASSETS['avatar_' + i + '.svg'] : 'assets/img/avatar_' + i + '.svg') + '" alt="avatar ' + i + '">';
      d.onclick = function () {
        avatars.querySelectorAll('.option-item').forEach(function (x) { x.classList.remove('selected'); });
        d.classList.add('selected');
      };
      avatars.appendChild(d);
    }
    const accents = U.el('accent-options');
    accents.innerHTML = '';
    const colors = ['#4fd8ff', '#ffb347', '#5dffa0', '#ff6b81'];
    for (let i = 0; i < colors.length; i++) {
      const d = document.createElement('div');
      d.className = 'option-item' + (i === 0 ? ' selected' : '');
      d.innerHTML = '<div class="swatch" style="background:' + colors[i] + '"></div>';
      d.onclick = function () {
        accents.querySelectorAll('.option-item').forEach(function (x) { x.classList.remove('selected'); });
        d.classList.add('selected');
      };
      accents.appendChild(d);
    }
    const helmets = U.el('helmet-options');
    helmets.innerHTML = '';
    const helmetNames = ['Classic', 'Visor', 'Aero'];
    for (let i = 0; i < helmetNames.length; i++) {
      const d = document.createElement('div');
      d.className = 'option-item' + (i === 0 ? ' selected' : '');
      d.textContent = helmetNames[i];
      d.style.fontSize = '11px';
      d.onclick = function () {
        helmets.querySelectorAll('.option-item').forEach(function (x) { x.classList.remove('selected'); });
        d.classList.add('selected');
      };
      helmets.appendChild(d);
    }
    const badges = U.el('badge-options');
    badges.innerHTML = '';
    const badgeImgs = ['badge_star', 'badge_rocket', 'badge_planet', 'badge_telescope'];
    for (let i = 0; i < badgeImgs.length; i++) {
      const d = document.createElement('div');
      d.className = 'option-item' + (i === 0 ? ' selected' : '');
      d.innerHTML = '<img src="' + (window.G_ASSETS && G_ASSETS[badgeImgs[i] + '.svg'] ? G_ASSETS[badgeImgs[i] + '.svg'] : 'assets/img/' + badgeImgs[i] + '.svg') + '" alt="badge">';
      d.onclick = function () {
        badges.querySelectorAll('.option-item').forEach(function (x) { x.classList.remove('selected'); });
        d.classList.add('selected');
      };
      badges.appendChild(d);
    }
  }

  function getProfileChoices() {
    function sel(container) {
      const s = container.querySelector('.selected');
      return s ? Array.prototype.indexOf.call(container.children, s) : 0;
    }
    return {
      avatar: sel(U.el('avatar-options')) + 1,
      accent: ['#4fd8ff', '#ffb347', '#5dffa0', '#ff6b81'][sel(U.el('accent-options'))],
      helmet: sel(U.el('helmet-options')),
      badge: sel(U.el('badge-options'))
    };
  }

  function initSettings() {
    U.el('set-test').onclick = function () {
      const s = G.Audio.test();
      notify(s === 'unsupported' ? 'This browser has no Web Audio support' : 'Playing test sound — voice: ' + G.Audio.voiceName(), 'info');
    };
    const st = G.Save.get();
    const s = st.settings;
    const voiceBtn = U.el('set-voice');
    voiceBtn.textContent = s.voice ? 'On' : 'Off';
    voiceBtn.className = 'toggle' + (s.voice ? ' on' : '');
    voiceBtn.onclick = function () {
      s.voice = !s.voice;
      G.Save.setSettings({ voice: s.voice });
      voiceBtn.textContent = s.voice ? 'On' : 'Off';
      voiceBtn.className = 'toggle' + (s.voice ? ' on' : '');
      if (!s.voice) G.Audio.stopSpeak();
    };
    U.el('set-rate').value = s.rate;
    const vp = U.el('set-voicepick');
    function fillVoices() {
      const names = G.Audio.voices(), cur = G.Audio.chosenVoice();
      vp.innerHTML = '<option value="">Auto (male, same on every device)</option>' + names.map(function (n) { return '<option value="' + G.Codex.esc(n) + '"' + (n === cur ? ' selected' : '') + '>' + G.Codex.esc(n) + '</option>'; }).join('');
    }
    fillVoices();
    G.Audio.onVoices(fillVoices);
    vp.onchange = function () {
      G.Audio.setVoice(vp.value);
      G.Audio.unlock();
      G.Audio.speak('Hello Explorer. This is my voice on your device.', s.rate);
    };
    U.el('set-rate-val').textContent = s.rate.toFixed(1);
    U.el('set-rate').oninput = function () {
      s.rate = parseFloat(this.value);
      U.el('set-rate-val').textContent = s.rate.toFixed(1);
      G.Save.setSettings({ rate: s.rate });
    };
    U.el('set-music').value = s.music;
    U.el('set-music-val').textContent = Math.round(s.music * 100) + '%';
    U.el('set-music').oninput = function () {
      s.music = parseFloat(this.value);
      U.el('set-music-val').textContent = Math.round(s.music * 100) + '%';
      G.Save.setSettings({ music: s.music });
      G.Audio.setVolumes(s.music, s.sfx);
    };
    U.el('set-sfx').value = s.sfx;
    U.el('set-sfx-val').textContent = Math.round(s.sfx * 100) + '%';
    U.el('set-sfx').oninput = function () {
      s.sfx = parseFloat(this.value);
      U.el('set-sfx-val').textContent = Math.round(s.sfx * 100) + '%';
      G.Save.setSettings({ sfx: s.sfx });
      G.Audio.setVolumes(s.music, s.sfx);
    };
    const comfortBtn = U.el('set-comfort');
    const showComfort = function () { const on = s.eyeComfort !== false; comfortBtn.textContent = on ? 'On' : 'Off'; comfortBtn.className = 'toggle' + (on ? ' on' : ''); };
    showComfort();
    comfortBtn.onclick = function () {
      s.eyeComfort = s.eyeComfort === false;
      G.Save.setSettings({ eyeComfort: s.eyeComfort });
      applySettings();
      showComfort();
    };
    const motionBtn = U.el('set-motion');
    motionBtn.textContent = s.reducedMotion ? 'On' : 'Off';
    motionBtn.className = 'toggle' + (s.reducedMotion ? ' on' : '');
    motionBtn.onclick = function () {
      s.reducedMotion = !s.reducedMotion;
      G.Save.setSettings({ reducedMotion: s.reducedMotion });
      document.body.classList.toggle('reduced-motion', s.reducedMotion);
      motionBtn.textContent = s.reducedMotion ? 'On' : 'Off';
      motionBtn.className = 'toggle' + (s.reducedMotion ? ' on' : '');
    };
    const contrastBtn = U.el('set-contrast');
    contrastBtn.textContent = s.highContrast ? 'On' : 'Off';
    contrastBtn.className = 'toggle' + (s.highContrast ? ' on' : '');
    contrastBtn.onclick = function () {
      s.highContrast = !s.highContrast;
      G.Save.setSettings({ highContrast: s.highContrast });
      document.body.classList.toggle('high-contrast', s.highContrast);
      contrastBtn.textContent = s.highContrast ? 'On' : 'Off';
      contrastBtn.className = 'toggle' + (s.highContrast ? ' on' : '');
    };
    U.el('set-textsize').value = s.textSize;
    U.el('set-textsize').onchange = function () {
      s.textSize = this.value;
      G.Save.setSettings({ textSize: s.textSize });
      document.body.classList.toggle('text-large', s.textSize === 'large');
      document.body.classList.toggle('text-xlarge', s.textSize === 'xlarge');
    };
    U.el('set-wipe').onclick = function () {
      if (confirm('Erase all saved progress? This cannot be undone.')) {
        G.Save.wipe();
        location.reload();
      }
    };
    initSaveBackup();
  }

  function initSaveBackup() {
    const input = U.el('save-file-input');
    function doExport() {
      if (!G.Save.get().profile) { notify('No expedition to save yet', 'info'); return; }
      G.Save.exportFile();
      G.Audio.play('success');
      notify('Save file downloaded', 'good');
    }
    function doImport() {
      if (G.Save.get().profile && !confirm('Loading a save file will replace your current progress. Continue?')) return;
      input.value = '';
      input.click();
    }
    input.onchange = function () {
      const file = input.files && input.files[0];
      if (!file) return;
      G.Save.importFile(file).then(function (st) {
        G.Audio.play('success');
        notify('Welcome back, ' + ((st.profile && st.profile.name) || 'Explorer') + '! Reloading expedition...', 'good');
        setTimeout(function () { location.reload(); }, 900);
      }, function (err) {
        G.Audio.play('error');
        notify(err.message, 'bad');
      });
    };
    ['set-export', 'menu-export'].forEach(function (id) { if (U.el(id)) U.el(id).onclick = doExport; });
    ['set-import', 'menu-import'].forEach(function (id) { if (U.el(id)) U.el(id).onclick = doImport; });
  }

  function applySettings() {
    const s = G.Save.get().settings;
    document.body.classList.toggle('reduced-motion', s.reducedMotion);
    document.body.classList.toggle('high-contrast', s.highContrast);
    G.comfort = s.eyeComfort !== false;
    document.body.classList.toggle('comfort', G.comfort);
    if (G.World && G.World.setComfort) G.World.setComfort(G.comfort);
    document.body.classList.toggle('text-large', s.textSize === 'large');
    document.body.classList.toggle('text-xlarge', s.textSize === 'xlarge');
    G.Audio.setVolumes(s.music, s.sfx);
  }

  function showThreeError() {
    U.el('menu-screen').innerHTML = '<div class="panel large"><h2>3D Engine Failed to Load</h2><p class="panel-sub">The game needs the Three.js library. Check your internet connection and reload the page.</p></div>';
  }

  return {
    notify: notify, discoveryToast: discoveryToast, koraSay: koraSay, koraVoice: koraVoice, deviceText: deviceText, controlsGuide: controlsGuide, refreshStation: refreshStation,
    addKoraMessage: addKoraMessage,
    openKora: openKora, closeKora: closeKora, toggleKora: toggleKora,
    initKoraPanel: initKoraPanel,
    updateObjective: updateObjective, updateHUD: updateHUD, setInteract: setInteract,
    setWaypoint: setWaypoint,
    openMap: openMap, closeMap: closeMap, toggleMap: toggleMap, drawMap: drawMap,
    travelTo: travelTo, travelToStation: travelToStation, travelToDeep: travelToDeep,
    openScanPanel: openScanPanel, updateScanPanel: updateScanPanel, closeScanPanel: closeScanPanel,
    openInfo: openInfo, scanFinished: scanFinished,
    openNpc: openNpc, closeNpc: closeNpc, renderStation: renderStation,
    openStation: openStation, closeStation: closeStation,
    initProfileScreen: initProfileScreen, getProfileChoices: getProfileChoices,
    initSettings: initSettings, applySettings: applySettings,
    showThreeError: showThreeError
  };
})();
