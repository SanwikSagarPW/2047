window.G = window.G || {};

// Fun Pass mini-games: Space Race (3D gates in real space) and Star Catcher (arcade overlay).
G.Games = (function () {
  const U = G.utils;
  let race = null, t = 0;
  function K() { return G.Crew.state(); }
  function touch() { return !!(G.Touch && G.Touch.enabled()); }

  function banner(html, cls, ms) {
    let b = U.el('game-banner');
    if (!b) { b = document.createElement('div'); b.id = 'game-banner'; U.el('ui-root').appendChild(b); }
    b.className = cls || '';
    b.innerHTML = html;
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout(b._t);
    if (ms) b._t = setTimeout(function () { b.classList.remove('show'); }, ms);
  }

  // ---------- Space Race ----------
  function additive(color, opacity, side) {
    return new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: side || THREE.FrontSide });
  }

  function gateMesh(last) {
    const g = new THREE.Group(), col = last ? 0xffd23c : 0x38e1ff;
    const ringM = additive(col, 0.9), outerM = additive(col, 0.4), discM = additive(col, 0.07, THREE.DoubleSide), nubM = additive(col, 0.9);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(8, 0.55, 10, 56), ringM));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(9.3, 0.16, 6, 56), outerM));
    g.add(new THREE.Mesh(new THREE.CircleGeometry(7.6, 40), discM));
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4;
      const n = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.5), nubM);
      n.position.set(Math.cos(a) * 9.3, Math.sin(a) * 9.3, 0);
      n.rotation.z = a;
      g.add(n);
    }
    g.userData = { mats: [ringM, outerM, discM, nubM], base: [0.9, 0.4, 0.07, 0.9], pop: 0, passed: false, last: last };
    return g;
  }

  function tint(g, hex, k) {
    g.userData.mats.forEach(function (m, i) { m.color.setHex(hex); m.opacity = g.userData.base[i] * k; });
  }

  function startRace() {
    if (G.Game.isLanded()) return;
    if (G.Ship.isJump && G.Ship.isJump()) G.Ship.setJump(false);
    const cam = G.World.camera;
    const p = G.Ship.position().clone();
    const f = new THREE.Vector3(); cam.getWorldDirection(f);
    const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
    const u = new THREE.Vector3().crossVectors(r, f).normalize();
    const group = new THREE.Group(), gates = [], pts = [];
    for (let i = 0; i < 10; i++) {
      pts.push(p.clone().addScaledVector(f, 70 + i * 58).addScaledVector(r, Math.sin(i * 0.8) * 32).addScaledVector(u, Math.sin(i * 0.55) * 16));
    }
    pts.forEach(function (pt, i) {
      const g = gateMesh(i === pts.length - 1);
      g.position.copy(pt);
      g.lookAt(pts[i + 1] || pt.clone().addScaledVector(f, 10));
      group.add(g);
      gates.push(g);
    });
    G.World.scene.add(group);
    race = { gates: gates, next: 0, t: 0, limit: 90, group: group, state: 'count', cd: 3.6, lastCd: 9, splits: [] };
    const hud = U.el('race-hud');
    let segs = '';
    for (let i = 0; i < gates.length; i++) segs += '<i></i>';
    hud.innerHTML = '<b>' + G.Icon('flag') + ' SPACE RACE</b><div class="rh-segs">' + segs + '</div><span id="race-time">0.00</span><span id="race-delta"></span><button id="race-quit">QUIT</button>';
    U.show('race-hud');
    U.el('race-quit').onclick = function () { endRace(false, 'Race cancelled'); };
    G.UI.koraSay('Space Race! Fly through the glowing gates in order. The amber gate is next and each gate gives you a speed boost. Get ready!');
  }

  function passGate(g) {
    const ud = g.userData;
    ud.passed = true; ud.pop = 1;
    race.splits.push(race.t);
    const nx = race.gates[race.next + 1];
    if (nx && G.World.ship && G.World.ship.velocity) {
      const dir = nx.position.clone().sub(G.Ship.position()).normalize();
      G.World.ship.velocity.addScaledVector(dir, 22);
    }
    const seg = document.querySelectorAll('#race-hud .rh-segs i')[race.next];
    if (seg) seg.classList.add('on');
    const bs = K().raceSplits;
    const dl = U.el('race-delta');
    if (bs && bs[race.next] != null && dl) {
      const d = race.t - bs[race.next];
      dl.textContent = (d < 0 ? '\u2212' : '+') + Math.abs(d).toFixed(1);
      dl.className = d < 0 ? 'good' : 'bad';
    }
    race.next++;
    G.Audio.play('ping');
    if (G.FX) G.FX.burst(window.innerWidth / 2, window.innerHeight * 0.45, '76,240,160', 26);
    const hud = U.el('race-hud');
    hud.classList.remove('flash'); void hud.offsetWidth; hud.classList.add('flash');
    if (race.next >= race.gates.length) { endRace(true); return; }
    if (race.next === race.gates.length - 1) banner('<div class="gb-tag">FINAL GATE!</div>', 'tag', 1300);
  }

  function updateRace(dt, landed) {
    if (!race) return;
    if (landed) { endRace(false, 'Race cancelled'); return; }
    t += dt;
    race.gates.forEach(function (g, i) {
      const ud = g.userData;
      if (ud.passed) {
        if (ud.pop > 0) { ud.pop = Math.max(0, ud.pop - dt * 1.8); g.scale.setScalar(1 + (1 - ud.pop) * 0.8); tint(g, 0x4cf0a0, ud.pop); }
        return;
      }
      const isNext = i === race.next;
      tint(g, ud.last ? 0xffd23c : (isNext ? 0xffb43c : 0x38e1ff), isNext ? 0.75 + Math.sin(t * 8) * 0.25 : 0.45);
      g.children[0].rotation.z += dt * (isNext ? 1.6 : 0.3);
      g.children[1].rotation.z -= dt * 0.8;
    });
    if (race.state === 'count') {
      race.cd -= dt;
      const n = Math.ceil(race.cd - 0.6);
      if (n !== race.lastCd) {
        race.lastCd = n;
        if (n >= 1) { banner('<div class="gb-num">' + n + '</div>', 'count', 750); G.Audio.play('blip'); }
        else { banner('<div class="gb-num go">GO!</div>', 'count', 800); G.Audio.play('boost'); race.state = 'run'; }
      }
      return;
    }
    race.t += dt;
    const sp = G.Ship.position(), g = race.gates[race.next];
    if (g && sp.distanceTo(g.position) < 10.5) { passGate(g); if (!race) return; }
    const gn = race.gates[race.next];
    if (gn && sp.distanceTo(gn.position) > 650) { endRace(false, 'Off course! The race was cancelled.'); return; }
    if (race.t > race.limit) { endRace(false, "Time's up! Try again with another pass."); return; }
    U.el('race-time').textContent = race.t.toFixed(2);
  }

  function endRace(won, msg) {
    if (!race) return;
    const r = race, k = K();
    race = null;
    U.hide('race-hud');
    setTimeout(function () { G.World.scene.remove(r.group); }, won ? 2000 : 0);
    if (!won) { G.UI.notify(msg || 'Race over', 'info'); return; }
    const medal = r.t < 18 ? 'gold' : r.t < 28 ? 'silver' : 'bronze';
    const best = !k.raceBest || r.t < k.raceBest;
    if (best) { k.raceBest = r.t; k.raceSplits = r.splits; }
    const xp = { gold: 80, silver: 60, bronze: 45 }[medal] + (best ? 20 : 0);
    G.Save.addXp(xp);
    G.Save.save();
    const icon = { gold: G.Icon('medal', { color: '#ffd23c' }), silver: G.Icon('medal', { color: '#dfe8f2' }), bronze: G.Icon('medal', { color: '#e09a5a' }) }[medal];
    banner('<div class="gb-medal">' + icon + '</div><div class="gb-title">' + medal.toUpperCase() + ' FINISH</div>' +
      '<div class="gb-sub">' + r.t.toFixed(2) + 's' + (best ? ' \u00b7 NEW RECORD' : ' \u00b7 best ' + k.raceBest.toFixed(2) + 's') + ' \u00b7 +' + xp + ' XP</div>' +
      '<div class="gb-hint">' + (medal === 'gold' ? 'Ace pilot!' : 'Gold is under 18 seconds. Use BOOST!') + '</div>', 'finish m-' + medal, 4600);
    G.Audio.play('badge');
    if (G.FX) G.FX.burst(window.innerWidth / 2, window.innerHeight * 0.4, '255,210,80', 60);
    G.Crew.award('space_racer');
    G.UI.koraSay(medal.charAt(0).toUpperCase() + medal.slice(1) + ' medal! ' + r.t.toFixed(1) + ' seconds. ' + (best ? 'That is your best time ever!' : 'Great flying, Explorer!'));
  }

  function marker() {
    if (!race || !race.gates[race.next]) return null;
    return { id: 'race_gate', cls: 'objective', pos: race.gates[race.next].position, name: 'GATE ' + (race.next + 1) + '/' + race.gates.length, r: 8, always: true };
  }

  // ---------- Star Catcher ----------
  const ITEM = {
    star: { pts: 1, good: true }, orb: { pts: 3, good: true }, green: { pts: 10, good: true },
    rock: { pts: -3 }, shield: { power: true }, magnet: { power: true }, slow: { power: true }
  };
  const WAVES = [
    { gap: 0.62, speed: 1, rock: 0.16, label: '' },
    { gap: 0.48, speed: 1.25, rock: 0.22, label: 'WAVE 2 \u2014 FASTER!' },
    { gap: 0.38, speed: 1.5, rock: 0.3, label: 'WAVE 3 \u2014 METEOR STORM!' }
  ];

  function startCatch() {
    const el = document.createElement('div');
    el.id = 'fun-overlay';
    el.innerHTML = '<canvas id="fo-canvas"></canvas>' +
      '<div class="fo-hud"><div class="fo-title">' + G.Icon('star') + ' STAR CATCHER</div>' +
        '<div class="fo-stat"><i>SCORE</i><b id="fo-score">0</b></div>' +
        '<div class="fo-stat fo-combo"><i>COMBO</i><b id="fo-combo">x1</b><span class="fo-cbar"><span id="fo-cfill"></span></span></div>' +
        '<div class="fo-stat"><i>TIME</i><b id="fo-time">45</b></div>' +
        '<div class="fo-pw" id="fo-pw"></div><button class="fo-x" aria-label="Quit">&times;</button></div>' +
      '<div class="fo-flash"></div><div class="fo-center" id="fo-center"></div>';
    U.el('ui-root').appendChild(el);
    const cv = el.querySelector('canvas'), x = cv.getContext('2d');
    const center = el.querySelector('#fo-center'), flash = el.querySelector('.fo-flash');
    const elScore = el.querySelector('#fo-score'), elCombo = el.querySelector('#fo-combo'), elCfill = el.querySelector('#fo-cfill');
    const elTime = el.querySelector('#fo-time'), elPw = el.querySelector('#fo-pw');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, neb = null;
    function nebula(w, h) {
      const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h);
      const n = c.getContext('2d');
      const g = n.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#03081a'); g.addColorStop(1, '#0c1636');
      n.fillStyle = g; n.fillRect(0, 0, w, h);
      [['rgba(143,123,255,0.24)', 0.2, 0.3, 0.55], ['rgba(56,225,255,0.16)', 0.82, 0.22, 0.45], ['rgba(255,120,80,0.13)', 0.6, 0.85, 0.5]].forEach(function (b) {
        const r = n.createRadialGradient(b[1] * w, b[2] * h, 0, b[1] * w, b[2] * h, b[3] * Math.max(w, h));
        r.addColorStop(0, b[0]); r.addColorStop(1, 'rgba(0,0,0,0)');
        n.fillStyle = r; n.fillRect(0, 0, w, h);
      });
      return c;
    }
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; neb = nebula(W, H); }
    size();
    const layers = [0.012, 0.035, 0.08].map(function (v, li) {
      const a = [];
      for (let i = 0; i < 45; i++) a.push({ x: Math.random(), y: Math.random(), s: 0.6 + li * 0.8, v: v });
      return a;
    });
    const s = { px: 0.5, tx: 0.5, tilt: 0, score: 0, time: 45, spawn: 0.8, shake: 0, chain: 0, chainT: 0, mult: 1, wave: 0,
      state: 'intro', cd: 0, lastCd: 9, lastSec: 99, shield: 0, magnet: 0, slow: 0, green: false, caught: 0, hits: 0 };
    const items = [], parts = [], pops = [], streaks = [], keys = {};
    let over = false, last = performance.now();
    const py = 0.84;

    function setX(e) { const r = cv.getBoundingClientRect(); s.tx = U.clamp((e.clientX - r.left) / r.width, 0.05, 0.95); }
    cv.addEventListener('pointerdown', setX);
    cv.addEventListener('pointermove', setX);
    function kd(e) { keys[e.code] = e.type === 'keydown'; }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', kd);
    window.addEventListener('resize', size);
    function cleanup() { over = true; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', kd); window.removeEventListener('resize', size); }
    el.querySelector('.fo-x').onclick = function () { G.Audio.play('close'); cleanup(); el.remove(); };

    function burst(px, py2, color, n, sp) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (0.2 + Math.random()) * (sp || 260);
        parts.push({ x: px, y: py2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 1, c: color, r: 1.5 + Math.random() * 2.5 });
      }
    }
    function pop(text, px, py2, color, big) { pops.push({ text: text, x: px, y: py2, c: color, t: 1, big: !!big }); }
    function showCenter(html, cls, ms) {
      center.className = 'fo-center ' + (cls || '');
      center.innerHTML = html;
      void center.offsetWidth;
      center.classList.add('show');
      clearTimeout(center._t);
      if (ms) center._t = setTimeout(function () { center.classList.remove('show'); }, ms);
    }

    showCenter('<div class="fo-intro"><div class="fo-logo">STAR<b>CATCHER</b></div>' +
      '<div class="fo-legend"><span><i class="lg star"></i>Star +1</span><span><i class="lg orb"></i>Planet +3</span><span><i class="lg rock"></i>Meteor \u22123</span>' +
      '<span><i class="lg shield"></i>Shield</span><span><i class="lg magnet"></i>Magnet</span><span><i class="lg slow"></i>Slow-mo</span></div>' +
      '<p>' + (touch() ? 'Drag anywhere to fly your ship.' : 'Move the mouse or use \u2190 \u2192 to fly.') + ' Catch in a row to build a COMBO!</p>' +
      '<button class="kx-btn primary" id="fo-go">START</button></div>', 'intro');
    el.querySelector('#fo-go').onclick = function () { G.Audio.play('menuSelect'); s.state = 'count'; s.cd = 3.6; center.classList.remove('show'); };

    function spawn() {
      const w = WAVES[s.wave], roll = Math.random(), elapsed = 45 - s.time;
      let kind = 'star';
      if (!s.green && elapsed > 8 && Math.random() < 0.012) { kind = 'green'; s.green = true; }
      else if (roll < w.rock) kind = 'rock';
      else if (roll < w.rock + 0.12) kind = 'orb';
      else if (roll < w.rock + 0.16) kind = ['shield', 'magnet', 'slow'][Math.floor(Math.random() * 3)];
      items.push({ x: 0.06 + Math.random() * 0.88, y: -0.06, vy: (0.2 + Math.random() * 0.1) * w.speed * (kind === 'rock' ? 1.15 : 1), kind: kind, rot: Math.random() * 6, hue: Math.floor(Math.random() * 4), t: 0 });
    }

    function catchItem(it) {
      const sx = it.x * W, sy = it.y * H, def = ITEM[it.kind];
      if (it.kind === 'rock') {
        if (s.shield > 0) { s.shield = 0; pop('BLOCKED!', sx, sy, '#8fd8ff'); burst(sx, sy, '143,216,255', 22); G.Audio.play('ping'); return; }
        s.score = Math.max(0, s.score - 3); s.chain = 0; s.chainT = 0; s.hits++;
        s.shake = 0.45; flash.classList.remove('hit'); void flash.offsetWidth; flash.classList.add('hit');
        pop('\u22123', sx, sy, '#ff6b6b', true); burst(sx, sy, '255,110,60', 28, 320);
        G.Audio.play('error');
        return;
      }
      if (def.power) {
        s[it.kind] = it.kind === 'slow' ? 5 : 7;
        pop({ shield: 'SHIELD!', magnet: 'MAGNET!', slow: 'SLOW-MO!' }[it.kind], sx, sy, '#8fd8ff', true);
        burst(sx, sy, '143,216,255', 24); G.Audio.play('success');
        return;
      }
      s.chain++; s.chainT = 2.4; s.caught++;
      const mult = Math.min(5, 1 + Math.floor(s.chain / 4));
      if (mult > s.mult) { pop('COMBO x' + mult + '!', W / 2, H * 0.42, '#ffd23c', true); G.Audio.play('success'); elCombo.parentNode.classList.remove('bump'); void elCombo.offsetWidth; elCombo.parentNode.classList.add('bump'); }
      s.mult = mult;
      const gain = def.pts * mult;
      s.score += gain;
      if (it.kind === 'green') {
        pop('GREENMAN BONUS! +' + gain, W / 2, H * 0.36, '#3cff6e', true);
        burst(sx, sy, '60,255,110', 50, 380);
        G.Audio.play('badge');
        G.Crew.award('egg_catch');
      } else {
        pop('+' + gain, sx, sy, it.kind === 'orb' ? '#8fd8ff' : '#ffd86a', it.kind === 'orb');
        burst(sx, sy, it.kind === 'orb' ? '120,220,255' : '255,214,100', it.kind === 'orb' ? 20 : 12);
        G.Audio.play(it.kind === 'orb' ? 'success' : 'blip');
      }
    }

    function star(cx, cy, r) {
      x.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      x.closePath();
    }
    function drawItem(it) {
      const cx = it.x * W, cy = it.y * H;
      x.save(); x.translate(cx, cy);
      if (it.kind === 'rock') {
        x.save(); x.rotate(Math.PI / 2);
        const tr = x.createLinearGradient(0, 0, -60, 0); tr.addColorStop(0, 'rgba(255,120,40,0.7)'); tr.addColorStop(1, 'rgba(255,60,20,0)');
        x.fillStyle = tr; x.beginPath(); x.moveTo(0, -12); x.lineTo(-60, 0); x.lineTo(0, 12); x.fill(); x.restore();
      }
      x.rotate(it.rot);
      if (it.kind === 'star') {
        x.shadowColor = '#ffd23c'; x.shadowBlur = 16; x.fillStyle = '#ffe08a'; star(0, 0, 16); x.fill();
        x.shadowBlur = 0; x.fillStyle = '#fff6d0'; star(0, 0, 7); x.fill();
      } else if (it.kind === 'orb') {
        const cols = ['#38e1ff', '#4cf0a0', '#ff8a3d', '#c08bff'];
        const g = x.createRadialGradient(-5, -5, 2, 0, 0, 15); g.addColorStop(0, '#fff'); g.addColorStop(0.35, cols[it.hue]); g.addColorStop(1, '#0a1a30');
        x.shadowColor = cols[it.hue]; x.shadowBlur = 18; x.fillStyle = g;
        x.beginPath(); x.arc(0, 0, 15, 0, Math.PI * 2); x.fill();
        x.shadowBlur = 0; x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 2.2;
        x.beginPath(); x.ellipse(0, 0, 26, 6, 0.35, 0, Math.PI * 2); x.stroke();
      } else if (it.kind === 'rock') {
        x.shadowColor = '#ff4f3c'; x.shadowBlur = 20; x.fillStyle = '#6e4430';
        x.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, rr = 16 + Math.sin(k * 2.7) * 4; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill();
        x.shadowBlur = 0; x.fillStyle = '#4a2c20'; x.beginPath(); x.arc(-4, -3, 4, 0, 7); x.arc(5, 5, 3, 0, 7); x.fill();
      } else if (it.kind === 'green') {
        x.rotate(-it.rot);
        x.shadowColor = '#3cff6e'; x.shadowBlur = 24;
        x.fillStyle = '#e6eaf0'; x.beginPath(); x.arc(0, 0, 18, 0, 7); x.fill();
        x.shadowBlur = 0; x.fillStyle = '#3cff6e'; x.beginPath(); x.ellipse(0, 1, 13, 11, 0, 0, 7); x.fill();
        x.fillStyle = '#0b2a14'; x.font = 'bold 15px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('G', 0, 2);
      } else {
        x.rotate(-it.rot);
        const col = { shield: '#5ab8ff', magnet: '#ff5fa2', slow: '#b98bff' }[it.kind];
        x.shadowColor = col; x.shadowBlur = 20; x.strokeStyle = col; x.lineWidth = 3; x.fillStyle = 'rgba(10,20,40,0.85)';
        x.beginPath(); x.arc(0, 0, 16, 0, 7); x.fill(); x.stroke();
        x.shadowBlur = 0; x.fillStyle = '#fff'; x.font = 'bold 16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText({ shield: '\u25C9', magnet: 'U', slow: '\u29D6' }[it.kind], 0, 1);
      }
      x.restore();
    }

    function updatePowerUi() {
      let h = '';
      ['shield', 'magnet', 'slow'].forEach(function (k) {
        if (s[k] > 0) h += '<span class="pw-' + k + '">' + k.toUpperCase() + '<i style="width:' + Math.round(s[k] / (k === 'slow' ? 5 : 7) * 100) + '%"></i></span>';
      });
      if (elPw.innerHTML !== h) elPw.innerHTML = h;
    }

    function frame(now) {
      if (over) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const play = s.state === 'play';
      if (s.state === 'count') {
        s.cd -= dt;
        const n = Math.ceil(s.cd - 0.6);
        if (n !== s.lastCd) {
          s.lastCd = n;
          if (n >= 1) { showCenter('<div class="fo-num">' + n + '</div>', 'count', 800); G.Audio.play('blip'); }
          else { showCenter('<div class="fo-num go">GO!</div>', 'count', 700); G.Audio.play('boost'); s.state = 'play'; }
        }
      }
      if (keys.ArrowLeft || keys.KeyA) s.tx = Math.max(0.05, s.tx - dt * 1.2);
      if (keys.ArrowRight || keys.KeyD) s.tx = Math.min(0.95, s.tx + dt * 1.2);
      const prev = s.px;
      s.px += (s.tx - s.px) * Math.min(1, dt * 14);
      s.tilt = U.lerp(s.tilt, U.clamp((s.px - prev) / Math.max(dt, 0.001) * 0.6, -0.5, 0.5), Math.min(1, dt * 10));
      const idt = dt * (s.slow > 0 ? 0.5 : 1);
      if (play) {
        s.time -= dt;
        const wave = s.time > 30 ? 0 : s.time > 15 ? 1 : 2;
        if (wave !== s.wave) { s.wave = wave; showCenter('<div class="fo-wave">' + WAVES[wave].label + '</div>', 'wave', 1600); G.Audio.play('notify'); }
        const sec = Math.ceil(s.time);
        if (sec !== s.lastSec) { s.lastSec = sec; if (sec <= 5 && sec > 0) { G.Audio.play('blip'); elTime.parentNode.classList.add('warn'); } }
        s.spawn -= idt;
        if (s.spawn <= 0) { s.spawn = WAVES[s.wave].gap * (0.75 + Math.random() * 0.5); spawn(); }
        ['shield', 'magnet', 'slow'].forEach(function (k) { s[k] = Math.max(0, s[k] - dt); });
        if (s.chainT > 0) { s.chainT -= dt; if (s.chainT <= 0) { s.chain = 0; s.mult = 1; } }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * idt; it.rot += idt * 2;
          if (s.magnet > 0 && ITEM[it.kind].good && it.y > 0.2) it.x += (s.px - it.x) * Math.min(1, idt * 3);
          if (Math.abs(it.y - py) < 0.05 && Math.abs(it.x - s.px) * W < 46) { catchItem(it); items.splice(i, 1); }
          else if (it.y > 1.1) items.splice(i, 1);
        }
        if (s.time <= 0) { finish(); return; }
      }
      if (Math.random() < dt * 0.4) streaks.push({ x: Math.random() * W, y: Math.random() * H * 0.5, life: 1 });
      parts.push({ x: s.px * W + (Math.random() - 0.5) * 8, y: py * H + 18, vx: (Math.random() - 0.5) * 30, vy: 140 + Math.random() * 80, life: 0.5, c: s.slow > 0 ? '185,139,255' : '255,170,60', r: 2 + Math.random() * 2 });
      s.shake = Math.max(0, s.shake - dt);
      elScore.textContent = s.score;
      elCombo.textContent = 'x' + s.mult;
      elCfill.style.width = Math.round(Math.max(0, s.chainT) / 2.4 * 100) + '%';
      elTime.textContent = Math.max(0, Math.ceil(s.time));
      updatePowerUi();

      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (s.shake) x.translate((Math.random() - 0.5) * 16 * s.shake, (Math.random() - 0.5) * 16 * s.shake);
      x.drawImage(neb, -10, -10, W + 20, H + 20);
      layers.forEach(function (layer) {
        layer.forEach(function (b) {
          b.y = (b.y + b.v * idt * (play ? 1 + s.wave * 0.4 : 1)) % 1;
          x.fillStyle = 'rgba(210,230,255,' + (0.25 + b.s * 0.2) + ')';
          x.fillRect(b.x * W, b.y * H, b.s, b.s * (play ? 1 + s.wave : 1));
        });
      });
      for (let i = streaks.length - 1; i >= 0; i--) {
        const st = streaks[i]; st.life -= dt * 1.5; st.x += dt * 500; st.y += dt * 240;
        if (st.life <= 0) { streaks.splice(i, 1); continue; }
        const g = x.createLinearGradient(st.x, st.y, st.x - 90, st.y - 43);
        g.addColorStop(0, 'rgba(255,255,255,' + st.life + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.strokeStyle = g; x.lineWidth = 1.5; x.beginPath(); x.moveTo(st.x, st.y); x.lineTo(st.x - 90, st.y - 43); x.stroke();
      }
      items.forEach(drawItem);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt * 1.6; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        x.fillStyle = 'rgba(' + p.c + ',' + p.life.toFixed(2) + ')';
        x.beginPath(); x.arc(p.x, p.y, p.r * p.life + 0.5, 0, 7); x.fill();
      }
      const sx = s.px * W, sy = py * H;
      x.save(); x.translate(sx, sy); x.rotate(s.tilt);
      if (s.magnet > 0) { x.strokeStyle = 'rgba(255,95,162,' + (0.35 + Math.sin(now / 90) * 0.15) + ')'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 70 + Math.sin(now / 120) * 6, 0, 7); x.stroke(); }
      x.shadowColor = '#38e1ff'; x.shadowBlur = 20;
      const hull = x.createLinearGradient(0, -26, 0, 16); hull.addColorStop(0, '#ffffff'); hull.addColorStop(1, '#8fd8ff');
      x.fillStyle = hull;
      x.beginPath(); x.moveTo(0, -26); x.lineTo(12, 2); x.lineTo(32, 14); x.lineTo(10, 10); x.lineTo(0, 17); x.lineTo(-10, 10); x.lineTo(-32, 14); x.lineTo(-12, 2); x.closePath(); x.fill();
      x.shadowBlur = 0; x.fillStyle = '#ffb43c'; x.beginPath(); x.ellipse(0, -8, 4, 7, 0, 0, 7); x.fill();
      if (s.shield > 0) { x.strokeStyle = 'rgba(90,184,255,0.9)'; x.fillStyle = 'rgba(90,184,255,0.12)'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, -2, 38, 0, 7); x.fill(); x.stroke(); }
      x.restore();
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i]; p.t -= dt * (p.big ? 0.9 : 1.6); p.y -= dt * 50;
        if (p.t <= 0) { pops.splice(i, 1); continue; }
        x.globalAlpha = Math.min(1, p.t * 1.5); x.fillStyle = p.c;
        x.font = (p.big ? 'bold 26px' : 'bold 20px') + ' Orbitron, sans-serif'; x.textAlign = 'center';
        x.shadowColor = p.c; x.shadowBlur = 12;
        x.fillText(p.text, p.x, p.y - 24);
        x.shadowBlur = 0; x.globalAlpha = 1;
      }
    }

    function finish() {
      cleanup();
      const k = K(), score = s.score, best = score > (k.catchBest || 0);
      if (best) k.catchBest = score;
      const stars = score >= 80 ? 3 : score >= 45 ? 2 : score >= 15 ? 1 : 0;
      const xp = Math.min(90, Math.round(score));
      G.Save.addXp(xp);
      G.Save.save();
      if (score >= 40) G.Crew.award('star_catcher');
      G.Audio.play('badge');
      let st = '';
      for (let i = 0; i < 3; i++) st += '<i class="' + (i < stars ? 'on' : '') + '" style="animation-delay:' + (0.5 + i * 0.35) + 's">\u2605</i>';
      const res = document.createElement('div');
      res.className = 'fo-result';
      res.innerHTML = '<div class="fo-r-title">' + (best ? 'NEW BEST!' : 'MISSION COMPLETE') + '</div><div class="fo-r-stars">' + st + '</div>' +
        '<div class="fo-r-score" id="fo-r-score">0</div>' +
        '<div class="fo-r-row"><span>CAUGHT <b>' + s.caught + '</b></span><span>HITS <b>' + s.hits + '</b></span><span>BEST <b>' + k.catchBest + '</b></span><span>XP <b>+' + xp + '</b></span></div>' +
        (score < 40 ? '<div class="fo-r-sub">Score 40 to earn the Star Catcher badge</div>' : '') +
        '<div class="fo-r-btns"><button class="kx-btn" id="fo-again"' + (k.passes ? '' : ' disabled') + '>' + (k.passes ? 'Play again \u00b7 1 pass' : 'No Fun Passes left') + '</button><button class="kx-btn primary" id="fo-done">Back to flight</button></div>';
      el.appendChild(res);
      const sc = res.querySelector('#fo-r-score'), t0 = performance.now();
      (function count(n) { const p = Math.min(1, (n - t0) / 1100); sc.textContent = Math.round(score * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(count); })(t0);
      res.querySelector('#fo-done').onclick = function () { G.Audio.play('click'); el.remove(); };
      res.querySelector('#fo-again').onclick = function () {
        if (k.passes < 1) return;
        k.passes--; G.Save.save(); G.Audio.play('menuSelect'); el.remove(); startCatch();
      };
    }
    requestAnimationFrame(function (n) { last = n; frame(n); });
  }

  function start(kind) { if (kind === 'race') startRace(); else startCatch(); }

  return { start: start, update: updateRace, marker: marker, racing: function () { return !!race; } };
})();
