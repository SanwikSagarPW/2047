window.G = window.G || {};

// Holographic stellar cartography: sqrt-compressed system view with zoom/pan, hover tooltips,
// live-data info panel, charted sectors, belts, moons, anomalies, ship trail and plotted course.
G.StarMap = (function () {
  const U = G.utils;
  let open = false, canvas, g, W = 0, H = 0, dpr = 1;
  let zoom = 1, panX = 0, panY = 0;
  let dragging = false, dragMoved = 0, lastX = 0, lastY = 0, mouseX = -1, mouseY = -1;
  let hits = [], hover = null, selected = null, course = null;
  const trail = [];
  let trailTimer = 0;
  const layers = { orbits: true, labels: true, moons: true, stations: true, sectors: true, belts: true };
  let beltDots = null, globe = null, globeDef = null;
  const AU = 240;
  let beyond = false, sizeTick = 0;
  const RMAX = function () { return beyond ? 8400 : 1100; };

  function K() { return (Math.min(W, H) / 2 - 34) / Math.sqrt(RMAX()); }

  function projRaw(wp) {
    const r = Math.hypot(wp.x, wp.z);
    if (r < 1e-6) return { x: 0, y: 0 };
    const rr = Math.sqrt(r) * K();
    return { x: wp.x / r * rr, y: wp.z / r * rr };
  }

  function toScreen(m) { return { x: W / 2 + panX + m.x * zoom, y: H / 2 + panY + m.y * zoom }; }

  function localScale() { return 0.3 * zoom * Math.sqrt(zoom) + 0.25 * zoom; }

  // Objects near a big body are drawn relative to that body so moons/stations/ship stay legible.
  function projNear(wp) {
    const bodies = G.World.bodies;
    let best = null, bd = 220;
    for (const id in bodies) {
      const b = bodies[id];
      if (b.def.parent || b.def.type === 'star') continue;
      const d = Math.hypot(wp.x - b.worldPos.x, wp.z - b.worldPos.z);
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return toScreen(projRaw(wp));
    const c = toScreen(projRaw(best.worldPos));
    const ls = localScale();
    return { x: c.x + (wp.x - best.worldPos.x) * ls, y: c.y + (wp.z - best.worldPos.z) * ls };
  }

  function bodyScreen(b) {
    const d = b.def;
    if (!d.parent) return toScreen(projRaw(b.worldPos));
    const p = G.World.bodies[d.parent];
    const pc = bodyScreen(p), ls = localScale();
    return { x: pc.x + (b.worldPos.x - p.worldPos.x) * ls, y: pc.y + (b.worldPos.z - p.worldPos.z) * ls };
  }

  function stationScreen(st) {
    const p = G.World.bodies[st.def.parent];
    const pc = bodyScreen(p), ls = localScale();
    return { x: pc.x + (st.worldPos.x - p.worldPos.x) * ls, y: pc.y + (st.worldPos.z - p.worldPos.z) * ls };
  }

  function unlockedList() {
    const st = G.Save.get();
    return (st.unlocked && st.unlocked.length) ? st.unlocked : ['earth', 'moon', 'mars'];
  }

  function isUnlocked(def) {
    const ul = unlockedList();
    if (ul.indexOf(def.id) >= 0) return true;
    return !!(def.generated && def.parent && ul.indexOf(def.parent) >= 0);
  }

  function resize() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    beltDots = null;
  }

  function buildBeltDots() {
    const rnd = U.mulberry32(5);
    beltDots = [];
    [[336, 392, 900], [722, 805, 700]].forEach(function (b) {
      for (let i = 0; i < b[2]; i++) {
        const a = rnd() * Math.PI * 2, r = b[0] + (b[1] - b[0]) * rnd();
        beltDots.push(projRaw({ x: Math.cos(a) * r, z: Math.sin(a) * r }));
      }
    });
  }

  function addHit(id, kind, x, y, r, data) { hits.push({ id: id, kind: kind, x: x, y: y, r: Math.max(r, 14), data: data }); }

  function draw() {
    if (!open) return;
    requestAnimationFrame(draw);
    if (!W || (++sizeTick % 20 === 0 && (Math.abs(canvas.clientWidth - W) > 2 || Math.abs(canvas.clientHeight - H) > 2))) resize();
    const t = performance.now() / 1000;
    hits = [];
    g.clearRect(0, 0, W, H);
    const k = K();
    if (!(k > 0)) return;
    const c0 = toScreen({ x: 0, y: 0 });

    // grid
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(79,216,255,0.05)';
    const step = 40 * zoom;
    for (let x = (c0.x % step); x < W; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = (c0.y % step); y < H; y += step) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.font = '10px "Share Tech Mono", monospace';
    g.textAlign = 'left';
    [0.5, 1, 1.5, 2, 3, 3.5].forEach(function (au) {
      if (beyond) return;
      const r = Math.sqrt(au * AU) * k * zoom;
      g.strokeStyle = 'rgba(79,216,255,0.09)';
      g.setLineDash([2, 6]);
      g.beginPath(); g.arc(c0.x, c0.y, r, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.fillStyle = 'rgba(79,216,255,0.4)';
      g.fillText(au + ' AU', c0.x + r * 0.707 + 4, c0.y - r * 0.707);
    });
    const outer = Math.sqrt(RMAX() + 20) * k * zoom;
    g.textAlign = 'center';
    [[1000, 'HELIOPAUSE \u00B7 EDGE OF THE SUN\u2019S BUBBLE', 'rgba(255,200,120,0.5)'], [2300, 'OORT CLOUD', 'rgba(160,210,255,0.4)']].forEach(function (ring) {
      if (ring[0] > RMAX()) return;
      const rr = Math.sqrt(ring[0]) * k * zoom;
      g.strokeStyle = ring[2]; g.fillStyle = ring[2]; g.lineWidth = 1.2;
      g.setLineDash([10, 8]); g.lineDashOffset = -t * 8;
      g.beginPath(); g.arc(c0.x, c0.y, rr, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      g.font = '9px Orbitron, sans-serif';
      g.fillText(ring[1], c0.x, c0.y - rr - 5);
    });
    for (let a = 0; a < 360; a += 30) {
      const rad = a * Math.PI / 180;
      g.strokeStyle = 'rgba(79,216,255,0.06)';
      g.beginPath(); g.moveTo(c0.x, c0.y); g.lineTo(c0.x + Math.sin(rad) * outer, c0.y - Math.cos(rad) * outer); g.stroke();
      g.fillStyle = 'rgba(79,216,255,0.35)';
      g.fillText(a + '\u00B0', c0.x + Math.sin(rad) * (outer + 12), c0.y - Math.cos(rad) * (outer + 12) + 3);
    }

    // radar sweep
    const sweep = t * 0.6;
    for (let i = 0; i < 24; i++) {
      const a = sweep - i * 0.02;
      g.strokeStyle = 'rgba(79,216,255,' + (0.16 * (1 - i / 24)).toFixed(3) + ')';
      g.beginPath(); g.moveTo(c0.x, c0.y); g.lineTo(c0.x + Math.cos(a) * outer, c0.y + Math.sin(a) * outer); g.stroke();
    }

    // charted sectors
    if (layers.sectors && G.Sectors) {
      const S = G.Sectors.size, home = G.World.home;
      g.fillStyle = 'rgba(79,216,255,0.07)';
      g.strokeStyle = 'rgba(79,216,255,0.18)';
      G.Sectors.charted().forEach(function (key) {
        const p = key.split(':');
        const wx = home.x + (+p[0]) * S, wz = home.z + (+p[1]) * S;
        const r = Math.max(Math.hypot(wx, wz), 20);
        const s = Math.min(26, S * k / (2 * Math.sqrt(r)) * zoom * 0.8);
        const sc = toScreen(projRaw({ x: wx, z: wz }));
        g.fillRect(sc.x - s / 2, sc.y - s / 2, s, s);
        g.strokeRect(sc.x - s / 2, sc.y - s / 2, s, s);
      });
      const hs = toScreen(projRaw(home));
      g.fillStyle = 'rgba(93,255,160,0.8)';
      g.font = '9px Orbitron, sans-serif';
      g.fillText('HOME 00:00', hs.x, hs.y - 30);
    }

    // belts
    if (layers.belts) {
      if (!beltDots) buildBeltDots();
      g.fillStyle = 'rgba(180,170,150,0.35)';
      for (let i = 0; i < beltDots.length; i++) {
        const s = toScreen(beltDots[i]);
        if (s.x < 0 || s.y < 0 || s.x > W || s.y > H) continue;
        g.fillRect(s.x, s.y, 1.2, 1.2);
      }
      if (zoom < 3) {
        g.fillStyle = 'rgba(200,190,170,0.5)';
        g.font = '9px Orbitron, sans-serif';
        g.fillText('ASTEROID BELT', c0.x, c0.y - Math.sqrt(364) * k * zoom - 4);
        g.fillText('KUIPER BELT', c0.x, c0.y - Math.sqrt(764) * k * zoom - 4);
      }
    }

    const step0 = G.Missions.currentStep();
    const objId = step0 && step0.target;
    const bodies = G.World.bodies;

    // orbits
    if (layers.orbits) {
      for (const id in bodies) {
        const d = bodies[id].def;
        if (d.parent || !d.distance) continue;
        const r = Math.sqrt(d.distance) * k * zoom;
        const isObj = id === objId;
        g.strokeStyle = isObj ? 'rgba(255,179,71,0.55)' : (isUnlocked(d) ? 'rgba(79,216,255,0.28)' : 'rgba(120,130,150,0.16)');
        g.lineWidth = isObj ? 1.6 : 1;
        if (isObj) { g.setLineDash([8, 6]); g.lineDashOffset = -t * 20; }
        g.beginPath(); g.arc(c0.x, c0.y, r, 0, Math.PI * 2); g.stroke();
        g.setLineDash([]);
      }
    }

    // sun
    const sg = g.createRadialGradient(c0.x, c0.y, 0, c0.x, c0.y, 34 * Math.sqrt(zoom));
    sg.addColorStop(0, '#fff6c0'); sg.addColorStop(0.3, '#ffc040'); sg.addColorStop(1, 'rgba(255,120,20,0)');
    g.fillStyle = sg;
    g.beginPath(); g.arc(c0.x, c0.y, 34 * Math.sqrt(zoom), 0, Math.PI * 2); g.fill();
    addHit('sun', 'body', c0.x, c0.y, 12, bodies.sun);

    // planets
    const ls = localScale();
    for (const id in bodies) {
      const b = bodies[id], d = b.def;
      if (d.type === 'star') continue;
      const moon = !!d.parent;
      if (moon && (!layers.moons || (zoom < 1.5 && d.parent !== 'earth'))) continue;
      let s;
      if (moon) {
        const pc = bodyScreen(bodies[d.parent]);
        if (layers.orbits && (zoom > 1.4 || d.parent === 'earth')) {
          g.strokeStyle = 'rgba(180,200,220,0.12)';
          g.beginPath(); g.arc(pc.x, pc.y, d.distance * ls, 0, Math.PI * 2); g.stroke();
        }
        s = bodyScreen(b);
      } else s = toScreen(projRaw(b.worldPos));
      const ul = isUnlocked(d);
      const pr = moon ? Math.max(1.8, d.radius * 0.5 * Math.sqrt(zoom)) : Math.max(3.5, Math.sqrt(d.radius) * 1.5 * Math.sqrt(zoom));
      if (!moon) {
        const glow = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, pr * 3);
        glow.addColorStop(0, ul ? d.color : 'rgba(110,120,140,0.6)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = 0.35; g.fillStyle = glow;
        g.beginPath(); g.arc(s.x, s.y, pr * 3, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
      }
      if (d.rings) {
        g.strokeStyle = ul ? 'rgba(230,210,160,0.7)' : 'rgba(120,130,140,0.4)';
        g.lineWidth = 1.5;
        g.beginPath(); g.ellipse(s.x, s.y, pr * 2.1, pr * 0.7, -0.35, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 1;
      }
      const pg = g.createRadialGradient(s.x - pr * 0.4, s.y - pr * 0.4, pr * 0.1, s.x, s.y, pr);
      pg.addColorStop(0, ul ? '#ffffff' : '#9aa4b0');
      pg.addColorStop(0.25, ul ? d.color : '#6a7280');
      pg.addColorStop(1, ul ? U.shade(d.color, 0.35) : '#2a3038');
      g.fillStyle = pg;
      g.beginPath(); g.arc(s.x, s.y, pr, 0, Math.PI * 2); g.fill();
      addHit(id, 'body', s.x, s.y, pr + 4, b);
      if (layers.labels && (!moon || zoom >= 2.2)) {
        g.textAlign = 'center';
        g.font = (moon ? '9px' : '11px') + ' Orbitron, sans-serif';
        g.fillStyle = ul ? (moon ? 'rgba(200,215,230,0.8)' : '#d8f2ff') : 'rgba(150,160,175,0.6)';
        g.fillText(d.name.toUpperCase() + (ul ? '' : ' \uD83D\uDD12'), s.x, s.y + pr + 13);
      }
      if (id === objId) drawTargetRing(s.x, s.y, pr + 8, t, '#ffb347', 'MISSION');
    }

    // stations
    if (layers.stations) {
      for (const id in G.World.stations) {
        const st = G.World.stations[id];
        const s = stationScreen(st);
        g.fillStyle = '#8ef0ff';
        g.save(); g.translate(s.x, s.y); g.rotate(Math.PI / 4); g.fillRect(-3.5, -3.5, 7, 7); g.restore();
        addHit(id, 'station', s.x, s.y, 8, st);
        if (layers.labels && zoom >= 1.6) {
          g.font = '9px "Share Tech Mono", monospace'; g.fillStyle = 'rgba(142,240,255,0.8)';
          g.fillText(st.def.name, s.x, s.y - 8);
        }
        if (id === objId) drawTargetRing(s.x, s.y, 12, t, '#ffb347', 'MISSION');
      }
    }

    // anomalies
    if (G.Sectors) {
      G.Sectors.anomalies().forEach(function (a) {
        if (a.site || a.deep) return;
        const s = projNear(a.obj.position);
        g.strokeStyle = a.craft ? '#7fe7ff' : (a.landmark ? '#e0b0ff' : 'rgba(199,155,255,0.75)');
        g.beginPath(); g.moveTo(s.x - 4, s.y); g.lineTo(s.x + 4, s.y); g.moveTo(s.x, s.y - 4); g.lineTo(s.x, s.y + 4); g.stroke();
        addHit(a.id, 'anomaly', s.x, s.y, 7, a);
        if ((a.landmark || a.real || (a.craft && zoom > 3)) && layers.labels) {
          g.font = '9px "Share Tech Mono", monospace'; g.fillStyle = a.craft ? '#7fe7ff' : '#e0b0ff';
          g.fillText(a.name, s.x, s.y - 7);
        }
      });
    }

    // beyond the solar system: real destinations (guide chevrons on the rim in the solar view)
    if (G.DeepSpace) {
      G.DeepSpace.list().forEach(function (a) {
        const d = a.def, p = a.obj.position, rp = Math.hypot(p.x, p.z);
        const f = !beyond && rp > 1085 ? 1085 / rp : 1;
        if (d.model === 'planet' && (!beyond || zoom < 3)) return;
        const s = toScreen(projRaw({ x: p.x * f, z: p.z * f }));
        const ang = Math.atan2(p.z, p.x), pulse = 0.6 + 0.4 * Math.sin(t * 3 + rp);
        g.fillStyle = '#ffd27a'; g.strokeStyle = '#ffd27a';
        if (f < 1) {
          g.save(); g.translate(s.x, s.y); g.rotate(ang);
          g.globalAlpha = pulse;
          g.beginPath(); g.moveTo(9, 0); g.lineTo(-5, -6); g.lineTo(-1, 0); g.lineTo(-5, 6); g.closePath(); g.fill();
          g.restore(); g.globalAlpha = 1;
        } else {
          const gl = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, 14);
          gl.addColorStop(0, 'rgba(255,210,122,0.8)'); gl.addColorStop(1, 'rgba(255,210,122,0)');
          g.fillStyle = gl; g.beginPath(); g.arc(s.x, s.y, 14, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#ffe9b0';
          g.save(); g.translate(s.x, s.y); g.rotate(Math.PI / 4); g.fillRect(-3.5, -3.5, 7, 7); g.restore();
        }
        addHit(a.id, 'anomaly', s.x, s.y, 12, a);
        if (layers.labels) {
          g.font = '9px Orbitron, sans-serif'; g.textAlign = f < 1 ? (Math.cos(ang) > 0.3 ? 'right' : (Math.cos(ang) < -0.3 ? 'left' : 'center')) : 'center';
          g.fillStyle = '#ffd27a';
          const sub = d.short || (d.lightYears ? (d.lightYears >= 1e6 ? (d.lightYears / 1e6) + ' M ly' : d.lightYears.toLocaleString('en') + ' ly') : '');
          const lx = s.x + (f < 1 ? -Math.cos(ang) * 14 : 0), lyy = s.y + (f < 1 ? -Math.sin(ang) * 14 + 3 : 17);
          const txt = d.name.toUpperCase() + (sub && (beyond || zoom > 1.6) ? ' \u00B7 ' + sub : '');
          const tw = g.measureText(txt).width, al = g.textAlign;
          g.fillStyle = 'rgba(2,10,20,0.78)';
          g.fillRect(al === 'right' ? lx - tw - 3 : (al === 'left' ? lx - 3 : lx - tw / 2 - 3), lyy - 10, tw + 6, 14);
          g.fillStyle = '#ffd27a';
          g.fillText(txt, lx, lyy);
          g.textAlign = 'center';
        }
      });
    }

    // ship trail + course + ship
    const sp = G.Ship.position();
    const ssh = projNear(sp);
    if (trail.length > 1) {
      g.strokeStyle = 'rgba(255,179,71,0.35)';
      g.beginPath();
      trail.forEach(function (p, i) { const s = projNear(p); if (i) g.lineTo(s.x, s.y); else g.moveTo(s.x, s.y); });
      g.lineTo(ssh.x, ssh.y);
      g.stroke();
    }
    const tgt = course || (objId ? { pos: G.World.bodyPosition(objId), label: 'Mission target' } : null);
    if (tgt && tgt.pos) {
      const ob = G.World.bodies[objId], os = G.World.stations[objId];
      const ts = course ? projNear(tgt.pos) : (ob ? bodyScreen(ob) : (os ? stationScreen(os) : projNear(tgt.pos)));
      g.strokeStyle = course ? '#5dffa0' : '#ffb347';
      g.setLineDash([6, 5]); g.lineDashOffset = -t * 30;
      g.beginPath(); g.moveTo(ssh.x, ssh.y); g.lineTo(ts.x, ts.y); g.stroke();
      g.setLineDash([]);
      const dist = sp.distanceTo(tgt.pos);
      g.font = '10px "Share Tech Mono", monospace'; g.fillStyle = course ? '#5dffa0' : '#ffb347';
      if (Math.hypot(ts.x - ssh.x, ts.y - ssh.y) > 110) g.fillText(Math.round(dist) + 'm \u2022 ETA ' + Math.ceil(dist / 48) + 's cruise', (ssh.x + ts.x) / 2, (ssh.y + ts.y) / 2 - 6);
    }
    const hd = G.Ship.heading();
    g.save();
    g.translate(ssh.x, ssh.y);
    g.rotate(-hd);
    g.fillStyle = '#ffb347';
    g.shadowColor = '#ffb347'; g.shadowBlur = 12;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill();
    g.restore();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,179,71,' + (0.5 + 0.5 * Math.sin(t * 4)).toFixed(2) + ')';
    g.beginPath(); g.arc(ssh.x, ssh.y, 14 + 4 * Math.sin(t * 4), 0, Math.PI * 2); g.stroke();
    g.font = 'bold 9px Orbitron, sans-serif'; g.fillStyle = '#ffb347';
    g.fillText('EX-01', ssh.x, ssh.y + 26);

    if (selected) {
      const h = hits.find(function (x) { return x.id === selected; });
      if (h) drawTargetRing(h.x, h.y, h.r + 6, t, '#5dffa0', 'SELECTED');
    }
    if (hover) {
      g.strokeStyle = 'rgba(255,255,255,0.6)';
      g.beginPath(); g.arc(hover.x, hover.y, hover.r + 3, 0, Math.PI * 2); g.stroke();
    }

    // HUD text
    g.textAlign = 'right';
    g.font = '10px "Share Tech Mono", monospace';
    g.fillStyle = 'rgba(79,216,255,0.7)';
    g.fillText('ZOOM ' + zoom.toFixed(1) + 'x  \u2022  ' + G.Sectors.charted().length + ' SECTORS CHARTED  \u2022  ' + (G.Codex.isOnline() ? 'DSN LIVE' : 'DSN OFFLINE'), W - 14, H - 14);
    drawGlobe(t);
  }

  function drawTargetRing(x, y, r, t, color, label) {
    g.save();
    g.translate(x, y);
    g.rotate(t * 0.8);
    g.strokeStyle = color;
    g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(0, 0, r, i * Math.PI / 2 + 0.2, i * Math.PI / 2 + 1.2); g.stroke();
    }
    g.restore();
    g.font = 'bold 8px Orbitron, sans-serif';
    g.fillStyle = color;
    g.textAlign = 'center';
    g.fillText(label, x, y - r - 5);
    g.lineWidth = 1;
  }

  function drawGlobe(t) {
    if (!globe || !globeDef) return;
    const gc = globe.getContext('2d');
    const w = globe.width, h = globe.height, r = Math.min(w, h) / 2 - 8, cx = w / 2, cy = h / 2;
    gc.clearRect(0, 0, w, h);
    const tex = globeDef._canvas;
    gc.save();
    gc.beginPath(); gc.arc(cx, cy, r, 0, Math.PI * 2); gc.clip();
    if (tex) {
      const off = (t * 20) % (r * 4);
      for (let k = -1; k <= 1; k++) gc.drawImage(tex, cx - r + off - r * 4 + k * r * 4, cy - r, r * 4, r * 2);
    } else {
      gc.fillStyle = globeDef.color || '#888'; gc.fillRect(0, 0, w, h);
    }
    const sh = gc.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
    sh.addColorStop(0, 'rgba(255,255,255,0.15)'); sh.addColorStop(0.6, 'rgba(0,0,0,0.1)'); sh.addColorStop(1, 'rgba(0,0,0,0.85)');
    gc.fillStyle = sh; gc.fillRect(0, 0, w, h);
    gc.restore();
    gc.strokeStyle = 'rgba(79,216,255,0.6)';
    gc.beginPath(); gc.arc(cx, cy, r + 4, t % (Math.PI * 2), t % (Math.PI * 2) + 4.5); gc.stroke();
  }

  function pick(x, y) {
    let best = null, bd = Infinity;
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i], d = Math.hypot(h.x - x, h.y - y);
      if (d < h.r && d < bd) { bd = d; best = h; }
    }
    return best;
  }

  function describe(h) {
    const sp = G.Ship.position();
    if (h.kind === 'body') {
      const d = h.data.def;
      return { name: d.name, type: d.type, dist: sp.distanceTo(h.data.worldPos), locked: !isUnlocked(d) };
    }
    if (h.kind === 'station') return { name: h.data.def.name, type: 'orbital station', dist: sp.distanceTo(h.data.worldPos), locked: !isUnlocked(G.PLANETS[h.data.def.parent]) };
    return { name: h.data.name, type: (h.data.type || 'anomaly').toLowerCase(), dist: sp.distanceTo(h.data.obj.position), locked: false };
  }

  function showTip(h, x, y) {
    const tip = U.el('map-tooltip');
    if (!h) { tip.classList.add('hidden'); return; }
    const d = describe(h);
    tip.innerHTML = '<b>' + G.Codex.esc(d.name) + '</b><span>' + G.Codex.esc(d.type) + '</span><span>' + Math.round(d.dist) + ' m from ship</span>' +
      (d.locked ? '<span style="color:var(--bad)">LOCKED</span>' : '<span>click for details</span>');
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.classList.remove('hidden');
  }

  function select(h) {
    selected = h ? h.id : null;
    const box = U.el('map-info');
    if (!h) { renderDefaultInfo(); return; }
    G.Audio.play('click');
    const d = describe(h);
    const def = h.kind === 'body' ? h.data.def : null;
    globeDef = def;
    let html = '<div class="mi-kicker">' + G.Codex.esc(d.type).toUpperCase() + '</div><h3>' + G.Codex.esc(d.name) + '</h3>';
    if (def) html += '<canvas class="mi-globe" id="mi-globe" width="260" height="260"></canvas>';
    html += '<div class="mi-text" id="mi-text">' + G.Codex.esc(def ? def.desc : (h.kind === 'station' ? h.data.def.desc : (h.data.deep ? h.data.def.fact : 'Unidentified object. Fly close and scan it with Q.'))) + '</div>';
    html += '<div class="mi-stats"><div><span>Distance</span><b>' + Math.round(d.dist) + ' m</b></div>';
    if (def) {
      const km = def.radiusKm || { sun: 696340, mercury: 2440, venus: 6052, earth: 6371, moon: 1737, mars: 3390, jupiter: 69911, saturn: 58232, uranus: 25362, neptune: 24622, pluto: 1188, ceres: 470 }[def.id];
      if (km) html += '<div><span>Radius</span><b>' + Math.round(km).toLocaleString() + ' km</b></div>';
      if (def.gravity) html += '<div><span>Gravity</span><b>' + G.Codex.esc(def.gravity) + '</b></div>';
      if (def.temp) html += '<div><span>Temperature</span><b>' + G.Codex.esc(def.temp) + '</b></div>';
      if (def.year) html += '<div><span>Year</span><b>' + G.Codex.esc(def.year) + '</b></div>';
      const moons = Object.keys(G.World.bodies).filter(function (id) { return G.World.bodies[id].def.parent === def.id; }).length;
      if (!def.parent && def.type !== 'star') html += '<div><span>Moons charted</span><b>' + moons + '</b></div>';
    }
    if (h.data && h.data.deep) html += '<div style="grid-column:1/-1"><span>Real distance</span><b>' + G.Codex.esc(h.data.def.dist) + '</b></div>';
    html += '</div>';
    if (d.locked) html += '<div class="mi-locked">\uD83D\uDD12 LOCKED \u2014 complete missions to unlock this destination.</div>';
    html += '<div class="mi-actions"><button class="menu-btn" id="mi-course">Plot Course</button>';
    if (h.kind !== 'anomaly' && h.id !== 'sun' || (h.data && h.data.deep)) html += '<button class="menu-btn primary" id="mi-jump"' + (d.locked ? ' disabled' : '') + '>Fold Jump</button>';
    html += '</div>';
    box.innerHTML = html;
    globe = U.el('mi-globe');
    U.el('mi-course').onclick = function () {
      const pos = h.kind === 'anomaly' ? h.data.obj.position : h.data.worldPos;
      course = { pos: pos, label: d.name, radius: def ? def.radius : 4 };
      G.UI.notify('Course plotted: ' + d.name, 'good');
      G.Audio.play('success');
      close();
    };
    const jb = U.el('mi-jump');
    if (jb) jb.onclick = function () {
      close();
      if (h.data && h.data.deep) G.UI.travelToDeep(h.data);
      else if (h.kind === 'station') G.UI.travelToStation(h.id); else G.UI.travelTo(h.id);
    };
    const title = def ? G.Codex.titleFor(def.id) : (h.kind === 'anomaly' && G.Scanner.infoFor(h.data.kind) ? G.Scanner.infoFor(h.data.kind).codex : null);
    if (title) {
      G.Codex.summary(title).then(function (s) {
        const el = U.el('mi-text');
        if (s && el && selected === h.id) el.textContent = G.Codex.shortText(s.extract, 4);
      });
    }
  }

  function renderDefaultInfo() {
    globe = null; globeDef = null;
    const m = G.Missions.current();
    const step = G.Missions.currentStep();
    U.el('map-info').innerHTML = '<div class="mi-kicker">NAVIGATION</div><h3>SOL SYSTEM</h3>' +
      '<div class="mi-text">Select a planet, moon, station or anomaly to view live data. Unlocked destinations can be reached instantly with a <b>Fold Jump</b>, or you can <b>Plot Course</b> and fly there yourself.</div>' +
      (m ? '<div class="mi-stats"><div style="grid-column:1/-1"><span>Mission</span><b>' + G.Codex.esc(m.title) + '</b></div>' +
        (step ? '<div style="grid-column:1/-1"><span>Objective</span><b>' + G.Codex.esc(step.text) + '</b></div>' : '') + '</div>' : '') +
      '<div class="mi-kicker" style="margin-top:12px;color:var(--amber)">BEYOND NEPTUNE</div>' +
      '<div class="mi-text">The Solar System is not the end! Tap <b>BEYOND &#9656;</b> at the top to chart interstellar space. Golden arrows on the map edge point to real probes, stars and galaxies. Tap one to learn about it, then <b>Plot Course</b> or <b>Fold Jump</b>. Past Neptune you can also switch on the <b>Jump Drive</b> (H, or the JUMP button) to cruise through interstellar space fast.</div>' +
      '<div class="map-chips">' + G.DEEP.filter(function (d) { return d.model !== 'planet'; }).map(function (d) {
        return '<button class="map-chip" data-deep="' + d.id + '">' + G.Codex.esc(d.name) + '</button>';
      }).join('') + '</div>';
    U.el('map-info').querySelectorAll('[data-deep]').forEach(function (b) {
      b.onclick = function () {
        const a = G.DeepSpace.list().filter(function (x) { return x.id === b.getAttribute('data-deep'); })[0];
        if (a) select({ id: a.id, kind: 'anomaly', data: a });
      };
    });
    U.el('map-legend').innerHTML = '<span class="legend-target">\u25C6 Orange: mission target</span><br>\u25B2 Your ship &nbsp; \u25C7 Station &nbsp; + Anomaly<br><span style="color:#ffd27a">\u27A4 Gold: beyond the Solar System</span><br>Shaded squares: sectors you have charted.';
  }

  function bind() {
    canvas = U.el('map-canvas');
    g = canvas.getContext('2d');
    const lay = U.el('map-layers');
    const bb = document.createElement('button');
    bb.id = 'map-beyond'; bb.className = 'beyond'; bb.textContent = 'BEYOND \u25B8';
    bb.onclick = function () {
      beyond = !beyond;
      bb.textContent = beyond ? '\u25C2 SOLAR SYSTEM' : 'BEYOND \u25B8';
      beltDots = null; zoom = 1; panX = 0; panY = 0;
      const sub = document.querySelector('.map-header .panel-subtitle');
      if (sub) sub.textContent = beyond ? 'Beyond the Solar System \u2022 distances shrunk millions of times' : 'Sol System \u2022 compressed scale \u2022 scroll to zoom, drag to pan';
      G.Audio.play('ping');
    };
    lay.appendChild(bb);
    const hb = document.createElement('button');
    hb.id = 'map-home'; hb.className = 'home'; hb.textContent = '\u2302 RETURN TO EARTH';
    hb.onclick = function () { G.Game.goHome(); };
    lay.appendChild(hb);
    Object.keys(layers).forEach(function (k) {
      const b = document.createElement('button');
      b.textContent = k;
      b.className = layers[k] ? 'on' : '';
      b.onclick = function () { layers[k] = !layers[k]; b.className = layers[k] ? 'on' : ''; G.Audio.play('click'); };
      lay.appendChild(b);
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left - W / 2, my = e.clientY - r.top - H / 2;
      const nz = U.clamp(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.6, 14);
      panX = mx - (mx - panX) * (nz / zoom);
      panY = my - (my - panY) * (nz / zoom);
      zoom = nz;
    }, { passive: false });
    canvas.addEventListener('mousedown', function (e) { dragging = true; dragMoved = 0; lastX = e.clientX; lastY = e.clientY; canvas.classList.add('dragging'); });
    window.addEventListener('mouseup', function (e) {
      if (!dragging) return;
      dragging = false;
      canvas.classList.remove('dragging');
      if (dragMoved < 5 && open) {
        const r = canvas.getBoundingClientRect();
        select(pick(e.clientX - r.left, e.clientY - r.top));
      }
    });
    window.addEventListener('mousemove', function (e) {
      if (!open) return;
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
      if (dragging) {
        panX += e.clientX - lastX; panY += e.clientY - lastY;
        dragMoved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
        lastX = e.clientX; lastY = e.clientY;
        showTip(null);
        return;
      }
      const inside = mouseX >= 0 && mouseY >= 0 && mouseX <= W && mouseY <= H;
      hover = inside ? pick(mouseX, mouseY) : null;
      canvas.style.cursor = hover ? 'pointer' : '';
      showTip(hover, mouseX, mouseY);
    });
    canvas.addEventListener('dblclick', function (e) {
      const r = canvas.getBoundingClientRect();
      const h = pick(e.clientX - r.left, e.clientY - r.top);
      if (h && (h.kind === 'body' || h.kind === 'station') && !describe(h).locked && h.id !== 'sun') {
        close();
        if (h.kind === 'station') G.UI.travelToStation(h.id); else G.UI.travelTo(h.id);
      }
    });
    U.el('map-zoom-in').onclick = function () { zoom = Math.min(14, zoom * 1.4); panX *= 1.4; panY *= 1.4; };
    U.el('map-zoom-out').onclick = function () { zoom = Math.max(0.6, zoom / 1.4); panX /= 1.4; panY /= 1.4; };
    U.el('map-reset').onclick = function () { zoom = 1; panX = 0; panY = 0; };
    U.el('map-center-ship').onclick = function () { centerOn(G.Ship.position(), 3); };
    U.el('map-center-target').onclick = function () {
      const s = G.Missions.currentStep();
      const p = course ? course.pos : (s && s.target ? G.World.bodyPosition(s.target) : null);
      if (p) centerOn(p, 3);
    };
    window.addEventListener('resize', function () { if (open) resize(); });
  }

  function centerOn(wp, z) {
    zoom = z;
    const m = projRaw(wp);
    panX = -m.x * zoom; panY = -m.y * zoom;
  }

  function openMap() {
    if (!canvas) bind();
    open = true;
    U.show('map-panel');
    G.Audio.play('ping');
    requestAnimationFrame(function () { resize(); renderDefaultInfo(); draw(); });
  }

  function close() {
    open = false;
    U.hide('map-panel');
    U.el('map-tooltip').classList.add('hidden');
  }

  function tick(dt, pos) {
    trailTimer -= dt;
    if (trailTimer <= 0) {
      trailTimer = 1;
      const last = trail[trail.length - 1];
      if (!last || last.distanceTo(pos) > 3) { trail.push(pos.clone()); if (trail.length > 240) trail.shift(); }
    }
    if (course && pos.distanceTo(course.pos) < (course.radius || 4) + 30) {
      G.UI.notify('Arrived: ' + course.label, 'good');
      course = null;
    }
  }

  return {
    open: openMap, close: close, toggle: function () { if (open) close(); else openMap(); },
    isOpen: function () { return open; }, tick: tick,
    course: function () { return course; }, clearCourse: function () { course = null; },
    setCourse: function (c) { course = c; }
  };
})();
