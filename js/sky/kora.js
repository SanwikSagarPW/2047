(function (S) {
  'use strict';
  // KORA hologram: a floating squircle drone with a dark visor, LED-bar eyes and an equalizer mouth.
  // Ported from the original game's js/holo.js so Kora looks exactly the same.
  var K = S.Kora = {};
  var off, ctx, dpr = 1, targets = [], acc = 0;
  var speakUntil = 0, moodName = 'idle', moodUntil = 0;
  var gazeX = 0, gazeY = 0, tgx = 0, tgy = 0;
  var nextBlink = 2, blinkT = 0, hopT = 0, tiltT = 0, glitchT = 0, nextIdle = 6, lookT = 0, lookX = 0;
  var bits = [], eq = new Array(9).fill(0);
  var TINT = { idle: [56, 225, 255], speak: [110, 235, 255], happy: [76, 240, 160], think: [143, 123, 255], alert: [255, 180, 60] };
  var tint = TINT.idle.slice();

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  K.init = function () {
    var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);
    off = document.createElement('canvas');
    off.width = off.height = 220 * dpr;
    ctx = off.getContext('2d');
    for (var i = 0; i < 18; i++) bits.push({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.8 });
    window.addEventListener('pointermove', function (e) {
      var t = targets[0];
      if (!t) return;
      var r = t.c.getBoundingClientRect();
      if (!r.width) return;
      tgx = clamp((e.clientX - (r.left + r.width / 2)) / 260, -1, 1);
      tgy = clamp((e.clientY - (r.top + r.height * 0.42)) / 260, -1, 1);
    });
  };

  // Show Kora's head (a 140x140 crop of the hologram) on a canvas.
  K.mirror = function (canvas, full) {
    var c = { c: canvas, x: canvas.getContext('2d'), full: !!full };
    targets.push(c);
  };

  K.mood = function (m, secs) {
    moodName = m;
    moodUntil = performance.now() / 1000 + (secs || 3);
    if (m === 'happy') hopT = 1;
    if (m === 'alert') glitchT = 0.25;
  };
  K.talk = function (ms) { speakUntil = performance.now() + ms; glitchT = 0.12; };
  K.stopTalk = function () { speakUntil = 0; };
  K.poke = function () { tiltT = 1; K.mood('happy', 1.6); };
  K.speaking = function () { return performance.now() < speakUntil; };

  function rgba(a, c) { c = c || tint; return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; }

  function squircle(cx, cy, a, b) {
    ctx.beginPath();
    for (var i = 0; i <= 64; i++) {
      var t = (i / 64) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      var x = cx + a * Math.sign(c) * Math.sqrt(Math.abs(c));
      var y = cy + b * Math.sign(s) * Math.sqrt(Math.abs(s));
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function ledBar(x, y, w, h, alpha) {
    if (h < 1.5) { ctx.fillStyle = rgba(alpha); ctx.fillRect(x - w / 2, y - 1, w, 2); return; }
    for (var yy = -h / 2; yy < h / 2; yy += 3) {
      ctx.fillStyle = rgba(alpha * (0.75 + 0.25 * Math.sin(yy)));
      ctx.fillRect(x - w / 2, y + yy, w, 2);
    }
  }

  K.update = function (t, dt) {
    if (!ctx || !targets.length) return;
    acc += dt;
    if (acc < 1 / 30) return;
    dt = Math.min(0.05, acc); acc = 0;
    draw(t, dt);
    for (var i = 0; i < targets.length; i++) {
      var g = targets[i], w = g.c.width, h = g.c.height;
      if (!g.c.offsetParent) continue;
      g.x.clearRect(0, 0, w, h);
      if (g.full) g.x.drawImage(off, 0, 0, off.width, off.height, 0, 0, w, h);
      else g.x.drawImage(off, 40 * dpr, 28 * dpr, 140 * dpr, 140 * dpr, 0, 0, w, h);
    }
  };

  function draw(t, dt) {
    var talking = K.speaking();
    if (moodName !== 'idle' && performance.now() / 1000 > moodUntil) moodName = 'idle';
    var key = moodName === 'idle' && talking ? 'speak' : moodName;
    var target = TINT[key] || TINT.idle;
    for (var i = 0; i < 3; i++) tint[i] = lerp(tint[i], target[i], Math.min(1, dt * 4));

    nextIdle -= dt;
    if (nextIdle <= 0 && !talking) {
      if (Math.random() < 0.5) { lookT = 1.8; lookX = Math.random() < 0.5 ? -1 : 1; } else tiltT = 1;
      nextIdle = 6 + Math.random() * 6;
    }
    lookT = Math.max(0, lookT - dt);
    var lx = lookT > 0 ? lookX : tgx, ly = moodName === 'think' ? -0.7 : (lookT > 0 ? 0 : tgy);
    gazeX = lerp(gazeX, lx, Math.min(1, dt * 6));
    gazeY = lerp(gazeY, ly, Math.min(1, dt * 6));
    hopT = Math.max(0, hopT - dt * 1.6);
    tiltT = Math.max(0, tiltT - dt * 1.2);
    glitchT = Math.max(0, glitchT - dt);
    if (Math.random() < 0.004) glitchT = 0.12;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 220, 220);
    var flick = glitchT > 0 ? 0.6 + Math.random() * 0.4 : 1;

    // projector
    var baseY = 200;
    var beam = ctx.createLinearGradient(0, baseY, 0, 30);
    beam.addColorStop(0, rgba(0.2 * flick));
    beam.addColorStop(1, rgba(0));
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(84, baseY); ctx.lineTo(136, baseY); ctx.lineTo(186, 30); ctx.lineTo(34, 30); ctx.closePath(); ctx.fill();
    for (i = 0; i < 3; i++) {
      ctx.strokeStyle = rgba(0.75 - i * 0.22);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(110, baseY + i * 3, 30 + i * 11 + Math.sin(t * 3 + i) * 2, 5 + i * 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (i = 0; i < bits.length; i++) {
      var b = bits[i];
      b.y -= dt * 0.22 * b.s;
      if (b.y < 0) { b.y = 1; b.x = Math.random(); }
      var py = 34 + b.y * (baseY - 34), spread = 26 + (1 - b.y) * 50;
      ctx.fillStyle = rgba(0.6 * b.y);
      ctx.fillRect(110 + (b.x - 0.5) * 2 * spread, py, 2, 2);
    }

    // body pose
    var hop = Math.sin(hopT * Math.PI) * 16;
    var talkBob = talking ? Math.sin(t * 9) * 1.2 : 0;
    var cx = 110, cy = 100 + Math.sin(t * 1.7) * 3.5 - hop + talkBob;
    var tilt = Math.sin(tiltT * Math.PI * 3) * 0.12 * tiltT + gazeX * 0.05;
    var jx = glitchT > 0 ? (Math.random() - 0.5) * 6 : 0;
    var A = 64, B = 54;

    ctx.save();
    ctx.translate(cx + jx, cy);
    ctx.rotate(tilt);
    ctx.globalAlpha = flick;

    // side modules (ears) and antenna
    for (var s = -1; s <= 1; s += 2) {
      ctx.fillStyle = rgba(0.18);
      ctx.strokeStyle = rgba(0.85);
      ctx.lineWidth = 1.5;
      squircle(s * (A + 7), 2, 8, 16);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba(Math.sin(t * 3 + s) > 0.2 || talking ? 0.95 : 0.3, s < 0 ? tint : [255, 180, 60]);
      ctx.fillRect(s * (A + 7) - 2, -6, 4, 4);
    }
    ctx.strokeStyle = rgba(0.8);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -B); ctx.lineTo(0, -B - 14); ctx.stroke();
    var ant = talking ? 0.5 + 0.5 * Math.abs(Math.sin(t * 10)) : 0.5 + 0.5 * Math.sin(t * 2);
    ctx.fillStyle = rgba(ant);
    ctx.shadowColor = rgba(1); ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, -B - 17, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    if (moodName === 'think') {
      ctx.strokeStyle = rgba(0.9);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -B - 17, 9, t * 6, t * 6 + 4); ctx.stroke();
    }

    // squircle hull
    var hull = ctx.createLinearGradient(0, -B, 0, B);
    hull.addColorStop(0, rgba(0.32));
    hull.addColorStop(0.5, rgba(0.14));
    hull.addColorStop(1, rgba(0.26));
    ctx.fillStyle = hull;
    squircle(0, 0, A, B);
    ctx.fill();
    ctx.shadowColor = rgba(0.9); ctx.shadowBlur = 14;
    ctx.strokeStyle = rgba(0.95);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(0.3);
    ctx.lineWidth = 1;
    squircle(0, 0, A - 6, B - 6);
    ctx.stroke();
    ctx.strokeStyle = rgba(0.35);
    ctx.beginPath();
    ctx.moveTo(-A + 8, B - 14); ctx.lineTo(-A + 22, B - 14);
    ctx.moveTo(A - 8, B - 14); ctx.lineTo(A - 22, B - 14);
    ctx.moveTo(-14, B - 8); ctx.lineTo(14, B - 8);
    ctx.stroke();

    // visor
    ctx.fillStyle = 'rgba(2, 10, 22, 0.86)';
    squircle(0, -4, A - 13, B - 18);
    ctx.fill();
    ctx.strokeStyle = rgba(0.6);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.save();
    squircle(0, -4, A - 14, B - 19);
    ctx.clip();
    var glare = ctx.createLinearGradient(-A, -B, A, B);
    glare.addColorStop(0, 'rgba(255,255,255,0.08)'); glare.addColorStop(0.35, 'rgba(255,255,255,0)');
    ctx.fillStyle = glare;
    ctx.fillRect(-A, -B, A * 2, B * 2);

    // eyes
    var ex = gazeX * 6, ey = -10 + gazeY * 4;
    nextBlink -= dt;
    if (nextBlink <= 0) { blinkT = 0.13; nextBlink = 2.5 + Math.random() * 3.5; }
    blinkT = Math.max(0, blinkT - dt);
    ctx.shadowColor = rgba(1); ctx.shadowBlur = 8;
    for (s = -1; s <= 1; s += 2) {
      var x = ex + s * 16;
      if (moodName === 'happy' && blinkT <= 0) {
        ctx.strokeStyle = rgba(1);
        ctx.lineWidth = 3.5; ctx.lineCap = 'square';
        ctx.beginPath(); ctx.moveTo(x - 7, ey + 4); ctx.lineTo(x, ey - 4); ctx.lineTo(x + 7, ey + 4); ctx.stroke();
      } else {
        var h = blinkT > 0 ? 1 : 16, w = 12;
        if (moodName === 'think' && s < 0) h = Math.min(h, 5);
        if (moodName === 'alert') { h = blinkT > 0 ? 1 : 19; w = 15; }
        ledBar(x, ey, w, h, 1);
      }
    }
    // mouth: LED equalizer
    var my = 13 + gazeY * 2;
    for (i = 0; i < eq.length; i++) {
      var c = i - (eq.length - 1) / 2, tg = 0.12;
      if (talking) tg = (0.25 + 0.75 * Math.abs(Math.sin(t * (11 + i * 1.7) + i) * Math.sin(t * 5.3 + i * 0.9))) * (1 - Math.abs(c) / 6);
      else if (moodName === 'happy') tg = 0.12 + (1 - (c * c) / 20) * 0.1;
      eq[i] = lerp(eq[i], tg, Math.min(1, dt * 18));
      var hh = Math.max(2, eq[i] * 18);
      var yOff = moodName === 'happy' && !talking ? (c * c) * 0.35 - 2 : 0;
      ctx.fillStyle = rgba(talking ? 0.95 : 0.7);
      ctx.fillRect(ex * 0.6 + c * 5 - 1.5, my - hh / 2 - yOff, 3, hh);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    var o = (t * 20) % 3;
    for (var y = -B + o; y < B; y += 3) ctx.fillRect(-A, y, A * 2, 1);
    ctx.restore();
    ctx.restore();

    ctx.fillStyle = rgba(0.05);
    for (y = 30 + ((t * 30) % 4); y < 200; y += 4) ctx.fillRect(40, y, 140, 1);
    if (glitchT > 0) {
      var sy = 40 + Math.random() * 120;
      ctx.drawImage(off, 0, sy * dpr, 220 * dpr, 6 * dpr, (Math.random() - 0.5) * 12, sy, 220, 6);
    }
  }
})(window.Sky = window.Sky || {});
