window.G = window.G || {};

// Screen-space motion graphics for the UI: drifting holo motes, tap bursts, scan convergence,
// boost speed-lines and warp streaks. One small canvas, capped particle count, pauses when idle.
G.FX = (function () {
  const U = G.utils;
  let cv, g, W = 0, H = 0, dpr = 1, running = false, last = 0;
  const parts = [], rings = [];
  const LOW = document.body.classList.contains('touch') || /[?&]touch=1/.test(location.search) || (navigator.maxTouchPoints > 0);
  const MAX = LOW ? 140 : 260;
  const BTN = 'button, .menu-btn, .tbtn, .marker.tappable, .kx-chip, .map-chip, #radar-corner, #thrust';

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, LOW ? 1.25 : 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function add(p) {
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
    wake();
  }

  function burst(x, y, color, n) {
    color = color || '56,225,255';
    n = n || (LOW ? 10 : 16);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 160;
      add({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45 + Math.random() * 0.35, t: 0, size: 1 + Math.random() * 2, c: color, drag: 3.2, kind: 'spark' });
    }
    rings.push({ x: x, y: y, t: 0, life: 0.45, r: 46, c: color });
    wake();
  }

  function mote() {
    add({ x: Math.random() * W, y: H + 10, vx: (Math.random() - 0.5) * 8, vy: -(10 + Math.random() * 22), life: 6 + Math.random() * 6, t: 0, size: 0.8 + Math.random() * 1.6, c: Math.random() < 0.8 ? '120,230,255' : '255,200,120', drag: 0, kind: 'mote' });
  }

  function streak(cx, cy, speed, color, inward) {
    const a = Math.random() * Math.PI * 2;
    const r0 = inward ? Math.max(W, H) * 0.6 : 20 + Math.random() * 80;
    add({ x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0, vx: Math.cos(a) * speed * (inward ? -1 : 1), vy: Math.sin(a) * speed * (inward ? -1 : 1), life: inward ? 0.55 : 0.5 + Math.random() * 0.4, t: 0, size: 1.2, c: color, drag: 0, kind: 'streak' });
  }

  let flareV = null, flareK = 0;
  const GHOSTS = [[0.35, 18, '255,190,120', 0.18], [0.62, 10, '120,220,255', 0.22], [0.9, 34, '170,120,255', 0.08], [1.25, 14, '255,230,160', 0.16], [1.6, 52, '90,180,255', 0.06]];
  function drawFlare(dt) {
    const W3 = G.World, hud = U.el('hud');
    if (!W3 || !W3.camera || !W3.bodies || !W3.bodies.sun || W3.terrainBody || !hud || hud.classList.contains('hidden')) { flareK = 0; return; }
    if (!flareV) flareV = new THREE.Vector3();
    const cam = W3.camera, sun = W3.bodies.sun.worldPos;
    flareV.copy(sun).project(cam);
    let target = 0;
    const sx = (flareV.x * 0.5 + 0.5) * W, sy = (-flareV.y * 0.5 + 0.5) * H;
    if (flareV.z < 1 && Math.abs(flareV.x) < 1.25 && Math.abs(flareV.y) < 1.25) {
      target = 1;
      const cp = cam.position, dx = sun.x - cp.x, dy = sun.y - cp.y, dz = sun.z - cp.z, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      for (const id in W3.bodies) {
        if (id === 'sun') continue;
        const b = W3.bodies[id], ox = b.worldPos.x - cp.x, oy = b.worldPos.y - cp.y, oz = b.worldPos.z - cp.z;
        const t = (ox * dx + oy * dy + oz * dz) / len;
        if (t <= 0 || t >= len) continue;
        const d2 = ox * ox + oy * oy + oz * oz - t * t, r = b.def.radius;
        if (d2 < r * r) { target = 0; break; }
      }
      target *= Math.min(1, 900 / Math.max(len, 1)) * (1 - Math.min(1, Math.hypot(flareV.x, flareV.y) * 0.55)) * (G.comfort ? 0.5 : 1);
    }
    flareK += (target - flareK) * Math.min(1, dt * 6);
    if (flareK < 0.02) return;
    const cx = W / 2, cy = H / 2, k = flareK;
    const glare = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.35);
    glare.addColorStop(0, 'rgba(255,240,210,' + (0.32 * k).toFixed(3) + ')');
    glare.addColorStop(0.25, 'rgba(255,170,80,' + (0.1 * k).toFixed(3) + ')');
    glare.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = glare; g.fillRect(0, 0, W, H);
    g.save(); g.translate(sx, sy);
    for (let i = 0; i < 6; i++) {
      g.rotate(Math.PI / 6);
      const L = Math.max(W, H) * (i % 2 ? 0.18 : 0.32) * k;
      const sg = g.createLinearGradient(-L, 0, L, 0);
      sg.addColorStop(0, 'rgba(255,220,170,0)'); sg.addColorStop(0.5, 'rgba(255,235,200,' + (0.35 * k).toFixed(3) + ')'); sg.addColorStop(1, 'rgba(255,220,170,0)');
      g.fillStyle = sg; g.fillRect(-L, -0.8, L * 2, 1.6);
    }
    g.restore();
    for (let i = 0; i < GHOSTS.length; i++) {
      const gh = GHOSTS[i], px = sx + (cx - sx) * gh[0] * 2, py = sy + (cy - sy) * gh[0] * 2, rr = gh[1] * (H / 400);
      const gg = g.createRadialGradient(px, py, rr * 0.2, px, py, rr);
      gg.addColorStop(0, 'rgba(' + gh[2] + ',' + (gh[3] * k * 0.4).toFixed(3) + ')');
      gg.addColorStop(0.8, 'rgba(' + gh[2] + ',' + (gh[3] * k).toFixed(3) + ')');
      gg.addColorStop(1, 'rgba(' + gh[2] + ',0)');
      g.fillStyle = gg; g.beginPath(); g.arc(px, py, rr, 0, Math.PI * 2); g.fill();
    }
  }

  let moteT = 0, emitT = 0;
  function frame(now) {
    if (!running) return;
    if (LOW && now - last < 30) { requestAnimationFrame(frame); return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const hud = U.el('hud'), playing = hud && !hud.classList.contains('hidden');
    const warp = U.el('warp-fx') && U.el('warp-fx').classList.contains('active');
    const jumping = hud && hud.classList.contains('jumping');
    const scanning = G.Scanner && G.Scanner.isScanning && G.Scanner.isScanning();
    const boosting = playing && G.Ship && G.Ship.isActive && G.Ship.isActive() && G.Ship.throttle && G.Ship.throttle() > 0.85;

    moteT -= dt;
    if (moteT <= 0) { moteT = 1; }
    // The overlay sits above the menu. With nothing to draw, stop so it does not clear the whole screen every frame.
    if (!playing && !parts.length && !rings.length && !warp) {
      g.clearRect(0, 0, W, H);
      cv.style.visibility = 'hidden';
      running = false;
      return;
    }
    emitT -= dt;
    if (emitT <= 0) {
      emitT = 0.03;
      if (warp || jumping) for (let i = 0; i < (LOW ? 3 : 6); i++) streak(W / 2, H / 2, 900 + Math.random() * 900, warp ? '200,235,255' : '140,200,255', false);
      else if (boosting) streak(W / 2, H / 2, 600 + Math.random() * 500, '150,220,255', false);
      if (scanning) streak(W / 2, H / 2, 380, '93,255,160', true);
    }

    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    drawFlare(dt);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = 1 - p.t / p.life;
      if (p.kind === 'streak') {
        const len = p.len || 0.05;
        g.strokeStyle = 'rgba(' + p.c + ',' + (0.65 * Math.min(1, p.t * 6) * k).toFixed(3) + ')';
        g.lineWidth = p.size;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * len, p.y - p.vy * len); g.stroke();
      } else {
        const a = p.kind === 'mote' ? 0.35 * Math.sin(Math.PI * (p.t / p.life)) : k;
        g.fillStyle = 'rgba(' + p.c + ',' + a.toFixed(3) + ')';
        g.beginPath(); g.arc(p.x, p.y, p.size * (p.kind === 'spark' ? (0.6 + k) : 1), 0, Math.PI * 2); g.fill();
      }
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      const k = r.t / r.life;
      if (k >= 1) { rings.splice(i, 1); continue; }
      g.strokeStyle = 'rgba(' + r.c + ',' + (0.8 * (1 - k)).toFixed(3) + ')';
      g.lineWidth = 2 * (1 - k) + 0.5;
      g.beginPath(); g.arc(r.x, r.y, 6 + r.r * (1 - Math.pow(1 - k, 3)), 0, Math.PI * 2); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  function wake() {
    if (!cv) return;
    cv.style.visibility = 'visible';
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function init() {
    cv = U.el('ui-fx');
    if (!cv) return;
    g = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', function (e) {
      const b = e.target.closest && e.target.closest(BTN);
      if (!b || b.disabled) return;
      const amber = b.classList.contains('primary') || b.id === 'm-act' || b.id === 'm-ship' || b.classList.contains('ready');
      burst(e.clientX, e.clientY, amber ? '255,180,60' : '56,225,255');
    }, true);
    document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else wake(); });
    wake();
  }

  return { init: init, burst: burst, wake: wake };
})();
