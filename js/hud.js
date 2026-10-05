window.G = window.G || {};

G.HUD = (function () {
  const U = G.utils;
  const pool = {};
  const v = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const PPD = 2.6;
  let tapeBuilt = false, objMark = null;
  let objective = null;
  let feedId = null, feedTimer = 0;
  const RADIUS_KM = { sun: 696340, mercury: 2440, venus: 6052, earth: 6371, moon: 1737, mars: 3390, jupiter: 69911, saturn: 58232, uranus: 25362, neptune: 24622, pluto: 1188, ceres: 470 };

  function marker(id, cls) {
    let m = pool[id];
    if (!m) {
      m = document.createElement('div');
      m.innerHTML = '<div class="arrow"></div><div class="bracket"></div><div class="m-name"></div><div class="m-dist"></div>';
      U.el('markers').appendChild(m);
      m._name = m.querySelector('.m-name');
      m._dist = m.querySelector('.m-dist');
      m._arrow = m.querySelector('.arrow');
      m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      m.addEventListener('click', function (e) {
        e.stopPropagation();
        const d = m._data;
        if (!d) return;
        const ss = d.canScan ? G.Game.scanStatus(d) : null;
        if (ss && !ss.ok) {
          G.Audio.play('error');
          if (d.pos && !G.World.terrainBody) {
            G.StarMap.setCourse({ pos: d.pos, label: d.name, radius: d.radius || 4 });
            G.UI.notify(d.name + ' is ' + Math.round(ss.dist) + 'm away \u2014 course plotted. Fly within ' + Math.round(ss.lim) + 'm to scan it', 'info');
          } else {
            G.UI.notify(d.name + ' is ' + Math.round(ss.dist) + 'm away \u2014 drive within ' + Math.round(ss.lim) + 'm to scan it', 'info');
          }
          return;
        }
        G.UI.openInfo(d);
      });
      pool[id] = m;
    }
    m.className = 'marker ' + cls;
    m._seen = true;
    return m;
  }

  function fmtDist(d) {
    return d >= 1000 ? (d / 1000).toFixed(1) + 'k' : Math.round(d) + 'm';
  }

  function occluded(pos, selfId) {
    const cam = G.World.camera.position, bodies = G.World.bodies;
    const dir = v.copy(pos).sub(cam), len = dir.length();
    dir.multiplyScalar(1 / len);
    for (const id in bodies) {
      if ('b_' + id === selfId) continue;
      const b = bodies[id], r = b.def.radius * 0.98;
      const ox = b.worldPos.x - cam.x, oy = b.worldPos.y - cam.y, oz = b.worldPos.z - cam.z;
      const t = ox * dir.x + oy * dir.y + oz * dir.z;
      if (t <= 0 || t >= len) continue;
      const d2 = ox * ox + oy * oy + oz * oz - t * t;
      if (d2 < r * r) return true;
    }
    return false;
  }

  function place(id, cls, pos, name, radius, alwaysShow, data) {
    const cam = G.World.camera;
    const W = window.innerWidth, H = window.innerHeight;
    const d = cam.position.distanceTo(pos);
    v.copy(pos).sub(cam.position);
    cam.getWorldDirection(camDir);
    const ahead = v.dot(camDir) > 0;
    v.copy(pos).project(cam);
    let x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
    const on = ahead && x > 30 && x < W - 30 && y > 60 && y < H - 190;
    if (!on && !alwaysShow) return;
    // Occlusion (a loop over every body) only runs for markers that are actually inside the view frustum.
    if (on && !alwaysShow && !G.World.terrainBody && occluded(pos, id)) return;
    const m = marker(id, cls + (on ? '' : ' offscreen'));
    m._data = data || null;
    if (m._tap !== !!data) { m._tap = !!data; m.classList.toggle('tappable', !!data); }
    if (m._nm !== name) { m._nm = name; m._name.textContent = name; }
    const dt = fmtDist(d);
    if (m._ds !== dt) { m._ds = dt; m._dist.textContent = dt; }
    if (on) {
      const s = U.clamp((radius / Math.max(d, 0.1)) * H * 1.15, 24, 160);
      m.style.setProperty('--s', s + 'px');
      m.style.left = x + 'px';
      m.style.top = y + 'px';
      m.style.opacity = d < radius * 1.3 ? 0 : 1;
    } else {
      let dx = x - W / 2, dy = y - H / 2;
      if (!ahead) { dx = -dx; dy = -dy; if (Math.abs(dx) < 1 && Math.abs(dy) < 1) dy = 1; }
      const ang = Math.atan2(dy, dx);
      const rx = W / 2 - 70, ry = (H - 260) / 2;
      const k = Math.min(rx / Math.abs(Math.cos(ang) || 1e-6), ry / Math.abs(Math.sin(ang) || 1e-6));
      m.style.left = (W / 2 + Math.cos(ang) * k) + 'px';
      m.style.top = (H / 2 - 40 + Math.sin(ang) * k) + 'px';
      m._arrow.style.transform = 'rotate(' + (ang + Math.PI / 2) + 'rad)';
      m.style.opacity = 1;
    }
  }

  function updateMarkers(landed) {
    for (const k in pool) pool[k]._seen = false;
    const cam = G.World.camera.position;
    const objPos = objective && objective.pos;
    function placeAnom(a) {
      const info = G.Scanner.infoFor(a.kind) || {};
      place('a_' + a.id, a.craft ? 'station' : 'anomaly', a.obj.position, a.name + (a.scanned ? ' \u2713' : ''), a.radius, false,
        { name: a.name, type: info.type || a.type, title: info.codex, observation: info.observation, poi: a, pos: a.obj.position, radius: a.radius, canScan: !a.scanned });
    }
    if (landed) {
      G.World.pois.forEach(function (p) {
        if (p.obj.position === objPos) return;
        if (cam.distanceTo(p.obj.position) < 500) {
          const info = G.Scanner.infoFor(p.kind) || {};
          place('poi_' + p.id, p.scanned ? 'moon' : 'anomaly', p.obj.position, p.name + (p.scanned ? ' \u2713' : ''), 3, false,
            { name: p.name, type: info.type, title: info.codex, observation: info.observation, poi: p, canScan: !p.scanned });
        }
      });
      const sp = G.World.ship.group.position;
      place('lander', 'station', sp, 'EX-01 Lander', 4, false);
    } else {
      const bodies = G.World.bodies;
      for (const id in bodies) {
        const b = bodies[id];
        if (b.worldPos === objPos) continue;
        const d = cam.distanceTo(b.worldPos);
        const isMoon = b.def.type === 'moon';
        if ((isMoon && d > 280) || (d > 650 && b.def.type !== 'star')) continue;
        place('b_' + id, isMoon ? 'moon' : '', b.worldPos, b.def.name, b.def.radius, false,
          { name: b.def.name, type: (b.def.type || '').toUpperCase(), title: G.Codex.titleFor(id), observation: b.def.desc, bodyId: id, pos: b.worldPos, radius: b.def.radius, canScan: !G.Save.isPoiScanned('orbit', id) });
      }
      const stations = G.World.stations;
      for (const id in stations) {
        const s = stations[id];
        if (s.worldPos === objPos) continue;
        if (cam.distanceTo(s.worldPos) < 450) place('s_' + id, 'station', s.worldPos, s.def.name, 4, false,
          { name: s.def.name, type: 'ORBITAL STATION', title: 'Space station', observation: s.def.desc, pos: s.worldPos, radius: 4 });
      }
      if (G.Sectors) {
        const near = { craft: [], site: [], deep: [] };
        G.Sectors.anomalies().forEach(function (a) {
          const d = cam.distanceTo(a.obj.position);
          if (d >= (a.hud || (a.landmark ? 450 : 150))) return;
          if (a.craft || a.site || a.deep) { near[a.craft ? 'craft' : (a.site ? 'site' : 'deep')].push({ a: a, d: d }); return; }
          placeAnom(a);
        });
        const byD = function (x, y) { return x.d - y.d; };
        near.deep.sort(byD).slice(0, 3).forEach(function (o) { placeAnom(o.a); });
        near.craft.sort(byD).slice(0, 4).forEach(function (o) { placeAnom(o.a); });
        near.site.sort(byD).slice(0, 3).forEach(function (o) { placeAnom(o.a); });
      }
    }
    if (G.Crew) G.Crew.markers(landed).forEach(function (m) { place(m.id, m.cls, m.pos, m.name, m.r, !!m.always, null); });
    if (objPos) place('objective', 'objective', objPos, objective.label || 'Objective', objective.radius || 4, true);
    for (const k in pool) {
      if (!pool[k]._seen) { pool[k].remove(); delete pool[k]; }
    }
  }

  function buildTape() {
    const tape = U.el('compass-tape');
    if (!tape) return;
    let html = '';
    const names = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    for (let d = -360; d <= 720; d += 5) {
      const n = ((d % 360) + 360) % 360;
      const x = d * PPD;
      if (n % 30 === 0) html += '<span class="' + (names[n] !== undefined ? 'major' : '') + '" style="left:' + x + 'px">' + (names[n] !== undefined ? names[n] : n) + '</span>';
      html += '<span class="tick" style="left:' + x + 'px;height:' + (n % 15 === 0 ? 8 : 4) + 'px"></span>';
    }
    html += '<span class="obj" id="compass-obj">\u25C6</span>';
    tape.innerHTML = html;
    objMark = U.el('compass-obj');
    tapeBuilt = true;
  }

  function updateCompass(yaw, from) {
    if (!tapeBuilt) buildTape();
    const tape = U.el('compass-tape');
    if (!tape) return;
    const heading = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
    tape.style.transform = 'translateX(' + (-heading * PPD) + 'px)';
    if (objMark) {
      if (objective && objective.pos) {
        const dx = objective.pos.x - from.x, dz = objective.pos.z - from.z;
        let b = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
        if (b - heading > 180) b -= 360;
        if (heading - b > 180) b += 360;
        objMark.style.left = (b * PPD) + 'px';
        objMark.style.display = '';
      } else objMark.style.display = 'none';
    }
  }

  function setBar(id, val) {
    const el = U.el(id);
    if (!el) return;
    el.style.width = U.clamp(val, 0, 100) + '%';
    el.classList.toggle('low', val < 20);
  }

  function updateGauges(info, from) {
    const st = G.Save.get();
    if (info) {
      U.el('hud-speed').textContent = (info.speed * 0.37).toFixed(info.speed < 27 ? 1 : 0);
      U.el('hud-throttle').style.width = Math.round(Math.abs(info.throttle || 0) * 100) + '%';
    }
    setBar('bar-fuel', st.fuel);
    setBar('bar-power', st.power);
    setBar('bar-hull', 100);
    const sig = U.clamp(100 - G.Sectors.homeAU(from) * 8, 25, 100);
    setBar('bar-signal', sig);
    U.el('status-signal').textContent = Math.round(sig) + '%';
    const ranks = G.RANKS, xp = st.xp || 0;
    let cur = ranks[0], next = null;
    for (let i = 0; i < ranks.length; i++) { if (xp >= ranks[i].xp) { cur = ranks[i]; next = ranks[i + 1] || null; } }
    U.el('hud-xp-fill').style.width = (next ? ((xp - cur.xp) / (next.xp - cur.xp)) * 100 : 100) + '%';
    U.el('hud-sector').textContent = 'SECTOR ' + G.Sectors.label(from);
    U.el('nav-home').textContent = G.Sectors.homeAU(from).toFixed(2) + ' AU';
    U.el('nav-charted').textContent = G.Sectors.charted().length + ' sectors';
  }

  // ---------- live codex feed ----------
  function focusTarget(landed, from) {
    if (landed) return G.World.terrainBody ? { id: G.World.terrainBody, title: G.Codex.titleFor(G.World.terrainBody), def: G.World.bodies[G.World.terrainBody].def } : null;
    const a = G.Sectors.nearestAnomaly(from, 70);
    if (a) {
      const info = G.Scanner.infoFor(a.poi.kind);
      return { id: a.poi.id, title: info && info.codex, name: a.poi.name, type: a.poi.type };
    }
    let best = null, bd = Infinity;
    const bodies = G.World.bodies;
    for (const id in bodies) {
      const b = bodies[id];
      const d = from.distanceTo(b.worldPos) - b.def.radius;
      const range = b.def.type === 'star' ? 260 : b.def.radius * 3 + 70;
      if (d < range && d < bd) { bd = d; best = b; }
    }
    if (best) return { id: best.def.id, title: G.Codex.titleFor(best.def.id), def: best.def };
    return null;
  }

  function updateFeed(dt, landed, from) {
    feedTimer -= dt;
    if (feedTimer > 0) return;
    feedTimer = 0.6;
    const t = focusTarget(landed, from);
    const el = U.el('live-feed');
    if (!t || !t.title) {
      if (feedId) { el.classList.add('hidden'); feedId = null; }
      return;
    }
    if (t.id === feedId) return;
    feedId = t.id;
    el.classList.remove('hidden');
    el.classList.add('loading');
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    U.el('feed-title').textContent = t.name || (t.def && t.def.name) || t.title;
    U.el('feed-desc').textContent = t.type ? t.type.toLowerCase() : (t.def ? t.def.type : '');
    U.el('feed-extract').textContent = 'Downlinking from the Deep Space Network';
    U.el('feed-thumb').removeAttribute('src');
    let stats = '';
    if (t.def) {
      const km = t.def.radiusKm || RADIUS_KM[t.def.id];
      if (km) stats += '<div><span>RADIUS</span> ' + Math.round(km).toLocaleString() + ' km</div>';
      if (t.def.gravity) stats += '<div><span>GRAVITY</span> ' + G.Codex.esc(t.def.gravity) + '</div>';
      if (t.def.temp) stats += '<div><span>TEMP</span> ' + G.Codex.esc(t.def.temp) + '</div>';
      if (t.def.year) stats += '<div><span>YEAR</span> ' + G.Codex.esc(t.def.year) + '</div>';
    }
    U.el('feed-stats').innerHTML = stats;
    const want = t.id;
    G.Codex.summary(t.title).then(function (d) {
      if (feedId !== want) return;
      el.classList.remove('loading');
      if (!d) {
        U.el('feed-extract').textContent = (t.def && t.def.desc) || 'Signal lost. Live data unavailable offline.';
        U.el('feed-source').textContent = '\u00B7 ship library';
        return;
      }
      U.el('feed-source').textContent = '\u00B7 ' + (d.source || 'Wikipedia');
      U.el('feed-desc').textContent = d.description || U.el('feed-desc').textContent;
      U.el('feed-extract').textContent = G.Codex.shortText(d.extract, 3);
      if (d.thumb) U.el('feed-thumb').src = d.thumb;
      if (G.Codex.record(d)) {
        G.UI.notify('Codex updated: ' + d.title, 'info');
        G.Journal.refresh();
      }
    });
  }

  const CARD8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  let roverUi = null;
  function updateRoverDash(info, dt, landed) {
    if (roverUi !== landed) {
      roverUi = landed;
      U.el('mfd-left-title').textContent = landed ? 'ROVER DRIVE' : 'SHIP SYSTEMS';
      U.el('hud-speed-unit').textContent = landed ? 'km/h' : 'km/s';
      document.querySelector('#mfd-left .sys.power span').textContent = landed ? 'BATT' : 'POWER';
    }
    if (!landed) return;
    const st = G.Save.get(), r = G.World.rover;
    if (info) {
      U.el('hud-speed').textContent = Math.round(info.speed * 2.5);
      st.roverOdo = (st.roverOdo || 0) + info.speed * dt * 0.00069;
    }
    const deg = ((-G.Rover.heading() * 180 / Math.PI) % 360 + 360) % 360;
    const pitch = r ? -r.group.rotation.x : 0;
    U.el('rg-hdg').textContent = CARD8[Math.round(deg / 45) % 8] + ' ' + String(Math.round(deg)).padStart(3, '0') + '\u00B0';
    U.el('rg-cards').textContent = G.Crew ? G.Crew.cardCount() : 0;
    const dc = U.el('rover-dial'), dx = dc.getContext('2d'), D = dc.width, R = D / 2 - 4;
    dx.clearRect(0, 0, D, D);
    dx.fillStyle = 'rgba(0,0,0,0.4)'; dx.beginPath(); dx.arc(D / 2, D / 2, R, 0, Math.PI * 2); dx.fill();
    dx.strokeStyle = 'rgba(255,180,60,0.7)'; dx.lineWidth = 2; dx.stroke();
    dx.save(); dx.translate(D / 2, D / 2); dx.rotate(-deg * Math.PI / 180);
    for (let a = 0; a < 360; a += 15) {
      const big = a % 90 === 0, ang = a * Math.PI / 180;
      dx.strokeStyle = big ? '#ffb43c' : 'rgba(255,180,60,0.45)'; dx.lineWidth = big ? 2.5 : 1.2;
      dx.beginPath(); dx.moveTo(Math.sin(ang) * (R - (big ? 11 : 6)), -Math.cos(ang) * (R - (big ? 11 : 6))); dx.lineTo(Math.sin(ang) * (R - 1), -Math.cos(ang) * (R - 1)); dx.stroke();
    }
    dx.fillStyle = '#ff6b4a'; dx.font = 'bold 15px monospace'; dx.textAlign = 'center'; dx.textBaseline = 'middle';
    dx.fillText('N', 0, -R + 22);
    dx.restore();
    dx.fillStyle = '#ffe2b0'; dx.beginPath(); dx.moveTo(D / 2, 6); dx.lineTo(D / 2 - 6, 18); dx.lineTo(D / 2 + 6, 18); dx.closePath(); dx.fill();
    dx.font = 'bold 17px monospace'; dx.textAlign = 'center'; dx.textBaseline = 'middle';
    dx.fillText(String(Math.round(deg)).padStart(3, '0'), D / 2, D / 2 + 4);
    const c = U.el('rover-incl'), x = c.getContext('2d'), W = c.width, H = c.height;
    x.clearRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,180,60,0.25)'; x.lineWidth = 1;
    for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * W / 6, 0); x.lineTo(i * W / 6, H); x.stroke(); }
    x.strokeStyle = 'rgba(255,180,60,0.6)';
    x.beginPath(); x.moveTo(0, H * 0.7); x.lineTo(W, H * 0.7); x.stroke();
    x.save(); x.translate(W / 2, H * 0.7); x.rotate(-pitch * 1.5);
    x.fillStyle = '#ffb43c';
    x.fillRect(-44, -26, 88, 14);
    x.fillRect(-14, -38, 34, 12);
    x.fillStyle = '#16120a'; x.strokeStyle = '#ffb43c'; x.lineWidth = 3;
    [-32, 0, 32].forEach(function (wx) { x.beginPath(); x.arc(wx, -8, 9, 0, Math.PI * 2); x.fill(); x.stroke(); });
    x.restore();
    x.fillStyle = '#ffe2b0'; x.font = 'bold 18px monospace'; x.textAlign = 'left';
    x.fillText('INCL', 6, 18);
  }

  let slowT = 0;
  let mkFrame = 0;
  const MK_LOW = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);
  function update(dt, info, landed) {
    const from = landed ? G.Rover.position() : G.Ship.position();
    // Marker DOM work every other frame on touch devices.
    if (!MK_LOW || (++mkFrame & 1) === 0) updateMarkers(landed);
    updateCompass(landed ? G.Rover.heading() : G.Ship.heading(), from);
    // Text gauges change slowly: refresh ~8x per second instead of every frame.
    slowT -= dt;
    if (slowT <= 0) { slowT = 0.12; updateGauges(info, from); updateRoverDash(info, 0.12, landed); }
    updateFeed(dt, landed, from);
    U.el('hud').classList.toggle('mode-rover', !!landed);
    U.el('btn-rover').querySelector('.action-label').textContent = landed ? 'Ship' : 'Rover';
  }

  function setObjective(o) { objective = o; }

  // ---------- boot sequence ----------
  function boot(done) {
    const log = U.el('boot-log');
    const scr = U.el('boot-screen');
    const lines = [
      ['ORBITA OS v20.47 // EX-01 EXPLORER FLIGHT COMPUTER', ''],
      ['bios checksum ........................... 0x2047FA', 'ok'],
      ['memory check ............................ 2047 TB', 'ok'],
      ['mounting /dev/cockpit ................... done', 'ok'],
      ['reactor core ............................ 100%', 'ok'],
      ['life support ............................ stable', 'ok'],
      ['shield matrix ........................... armed', 'ok'],
      ['loading stellar cartography ............. 12 bodies', 'ok'],
      ['calibrating gyros + thrusters ........... nominal', 'ok'],
      ['warming fold drive coils ................ nominal', 'ok'],
      ['scanner array ........................... online', 'ok'],
      ['rover bay ............................... ready', 'ok'],
      ['initialising KORA cognitive core ........ waking', 'kora'],
      ['KORA neural lattice ..................... rebuilding', 'ok'],
      ['linking to Earth Deep Space Network ..... ', 'link'],
      ['procedural sector generator ............. seeded @ HOME 00:00', 'ok'],
      ['KORA: good to see you, Explorer', 'ok'],
      Math.random() < 0.25 ? ['easter.egg ................................ GreenMan was here', 'ok'] : ['checking comms ............................ clear', 'ok'],
      ['ALL SYSTEMS GO', 'ok']
    ];
    let i = 0, finished = false, started = false;
    function finish() {
      if (finished) return;
      finished = true;
      G.Audio.play('bootDone');
      scr.classList.add('done');
      setTimeout(function () { scr.remove(); }, 800);
      done();
    }
    const prompt = document.createElement('div');
    prompt.className = 'boot-prompt';
    prompt.textContent = (G.Touch && G.Touch.enabled() ? 'TAP' : 'CLICK') + ' TO POWER ON';
    scr.appendChild(prompt);
    scr.onclick = function () {
      if (started) return;
      started = true;
      prompt.remove();
      G.Audio.unlock();
      if (G.Touch && G.Touch.fullscreen) G.Touch.fullscreen();
      G.Audio.play('powerUp');
      setTimeout(run, 650);
      warmUp();
    };
    // Compile shaders and fetch live data while the boot animation plays, so the menu and first flight stay smooth.
    function warmUp() {
      setTimeout(function () {
        try { G.World.renderer.compile(G.World.scene, G.World.camera); } catch (e) { }
      }, 400);
      ['sun', 'earth', 'moon', 'mars', 'jupiter', 'saturn'].forEach(function (id, n) {
        setTimeout(function () {
          const t = G.Codex.titleFor(id);
          if (t) G.Codex.summary(t).then(function (d) { if (d && d.thumb) { const im = new Image(); im.src = d.thumb; } });
        }, 800 + n * 500);
      });
    }
    const linkP = G.Codex.ping();
    const bc = document.querySelector('#boot-kora canvas');
    let buildT0 = 0, koraStarted = false, koraDone = false;
    // Pixelated bottom-to-top build-up of the live KORA hologram canvas.
    function koraBuild(now) {
      if (!bc || finished) return;
      requestAnimationFrame(koraBuild);
      const src = U.el('holo-canvas');
      if (!src) return;
      const p = Math.min(1, (now - buildT0) / 2600);
      const W = bc.width, H = bc.height, x = bc.getContext('2d');
      x.clearRect(0, 0, W, H);
      const px = Math.max(1, Math.round(22 * Math.pow(1 - p, 1.5)));
      const sw = Math.max(8, Math.floor(W / px)), sh = Math.max(8, Math.floor(H / px));
      if (!koraBuild.o) koraBuild.o = document.createElement('canvas');
      const o = koraBuild.o; o.width = sw; o.height = sh;
      o.getContext('2d').drawImage(src, 0, 0, sw, sh);
      x.imageSmoothingEnabled = false;
      const front = H * (1 - p);
      x.save();
      x.beginPath(); x.rect(0, front, W, H - front); x.clip();
      x.drawImage(o, 0, 0, W, H);
      if (p < 1) {
        x.globalCompositeOperation = 'source-atop';
        x.fillStyle = 'rgba(56,225,255,' + (0.5 * (1 - p)).toFixed(2) + ')';
        x.fillRect(0, 0, W, H);
      }
      x.restore();
      if (p < 1) {
        x.fillStyle = 'rgba(190,250,255,0.9)';
        x.fillRect(0, front, W, 2);
        x.fillStyle = 'rgba(56,225,255,0.35)';
        for (let k = 0; k < 14; k++) x.fillRect(Math.random() * W, front - Math.random() * 18, px + 1, px + 1);
      } else {
        const f = 1 - Math.min(1, (now - buildT0 - 2600) / 500);
        if (f > 0) { x.fillStyle = 'rgba(220,252,255,' + (0.5 * f).toFixed(2) + ')'; x.fillRect(0, 0, W, H); }
      }
    }
    function koraWake() {
      if (!bc) return;
      koraStarted = true;
      bc.parentNode.classList.add('on');
      buildT0 = performance.now();
      requestAnimationFrame(koraBuild);
      if (G.Holo) G.Holo.mood('think', 2.6);
      const nm = bc.parentNode.querySelector('.boot-kora-name'), sub = bc.parentNode.querySelector('.boot-kora-sub');
      const hello = 'KORA online. Hello Explorer!';
      setTimeout(function () {
        if (finished) return;
        nm.textContent = 'KORA // ONLINE';
        bc.parentNode.classList.add('awake');
        G.Audio.play('menuIn');
        if (G.Holo) { G.Holo.mood('happy', 4); G.Holo.wave(); G.Holo.speak(hello); }
        sub.textContent = '"' + hello + '"';
        G.Audio.speak(hello, 1, function () { koraDone = true; });
        setTimeout(function () { koraDone = true; }, 7000);
      }, 2700);
    }
    function run() {
      (function next() {
        if (finished) return;
        if (i >= lines.length) { (function w() { if (koraDone || !koraStarted) setTimeout(finish, 500); else setTimeout(w, 150); })(); return; }
        const div = document.createElement('div');
        const l = lines[i++];
        const full = '> ' + l[0];
        div.textContent = '';
        if (l[1] === 'ok') div.className = 'ok';
        log.appendChild(div);
        let c = 0;
        const typer = setInterval(function () {
          if (finished) { clearInterval(typer); return; }
          const step = 2 + (Math.random() < 0.5 ? 1 : 0);
          c = Math.min(full.length, c + step);
          div.textContent = full.slice(0, c);
          G.Audio.play('bootTick');
          if (c >= full.length) { clearInterval(typer); afterLine(); }
        }, 9);
        function afterLine() {
        if (l[1] === 'kora') { div.className = 'ok'; koraWake(); }
        G.Audio.play(l[1] === 'link' ? 'bootTick' : 'bootOk');
        if (l[1] === 'link') {
          linkP.then(function (okk) {
            div.textContent += okk ? 'LIVE' : 'OFFLINE (local archive)';
            div.className = okk ? 'ok' : 'warn';
            G.Audio.play(okk ? 'bootOk' : 'bootWarn');
            U.el('menu-link').textContent = okk ? 'LIVE' : 'OFFLINE';
            if (U.el('menu-link2')) { U.el('menu-link2').textContent = okk ? 'DSN LIVE' : 'OFFLINE'; U.el('menu-link2').className = okk ? 'live' : 'off'; }
            U.el('menu-link').style.color = okk ? '' : 'var(--accent)';
            setTimeout(next, 200);
          });
        } else setTimeout(next, 15 + Math.random() * 25);
        }
      })();
    }
  }

  function fillTicker() {
    const facts = G.KNOWLEDGE.slice(0, 40).map(function (k) { return k.topic.toUpperCase() + ': ' + k.summary; });
    for (let i = facts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = facts[i]; facts[i] = facts[j]; facts[j] = t; }
    U.el('menu-ticker-text').textContent = facts.slice(0, 12).join('     \u25C6     ');
  }

  return { update: update, setObjective: setObjective, boot: boot, fillTicker: fillTicker };
})();
