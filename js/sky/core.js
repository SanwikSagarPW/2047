(function (S) {
  'use strict';
  var THREE = window.THREE;
  var C = S.core = {};
  var $ = function (id) { return document.getElementById(id); };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  C.clamp = clamp;
  C.$ = $;
  C.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // ---------- renderer / layout ----------
  var canvas = $('gl');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  C.renderer = renderer;
  C.size = { W: 1, H: 1 };
  C.rect = { x: 0, y: 0, w: 1, h: 1, cx: 0, cy: 0 };
  C.pr = renderer.getPixelRatio();

  var scenes = C.scenes = {}, cur = null, LESSONS = S.content.LESSONS;
  C.register = function (sc) { scenes[sc.id] = sc; };
  C.current = function () { return cur; };

  function layout() {
    var W = window.innerWidth, H = window.innerHeight;
    C.size.W = W; C.size.H = H;
    renderer.setSize(W, H, false);
    var top = $('top').getBoundingClientRect().bottom, dock = $('dock').getBoundingClientRect();
    var wide = W / H >= 1.2, r;
    if (wide) {
      var navL = $('nav').getBoundingClientRect().left, tl = $('tools'), tb = tl.childElementCount ? tl.getBoundingClientRect().top : H;
      r = { x: 0, y: top, w: Math.max(100, navL - 4), h: Math.max(100, tb - top - 4) };
    } else r = { x: 0, y: top, w: W, h: Math.max(120, dock.top - top) };
    r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2;
    C.rect = r;
    C.wide = wide;
    if (cur && cur.resize) cur.resize();
  }
  C.layout = layout;
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe($('dock'));

  // Centre the camera's view on the free area above the card.
  C.applyView = function (camera, full) {
    var W = C.size.W, H = C.size.H, r = C.rect;
    camera.aspect = W / H;
    if (full) camera.clearViewOffset(); else camera.setViewOffset(W, H, W / 2 - r.cx, H / 2 - r.cy, W, H);
    camera.updateProjectionMatrix();
  };

  // ---------- floating labels / pills ----------
  var labelHost = $('labels'), items = [], tmp = new THREE.Vector3();
  C.labels = {
    clear: function () { items.length = 0; labelHost.textContent = ''; },
    add: function (o) {
      var el = C.el('div', 'lbl ' + (o.cls || (o.onTap ? 'pill' : 'pin')), o.html || '');
      if (o.text) el.textContent = o.text;
      if (o.onTap) el.addEventListener('click', function (e) { e.stopPropagation(); o.onTap(); });
      labelHost.appendChild(el);
      var it = { el: el, pos: o.pos, alpha: o.alpha };
      items.push(it);
      return it;
    },
    remove: function (it) { var i = items.indexOf(it); if (i >= 0) items.splice(i, 1); if (it.el.parentNode) it.el.parentNode.removeChild(it.el); },
    update: function (camera) {
      var W = C.size.W, H = C.size.H;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.pos(tmp)) { it.el.style.opacity = 0; it.el.style.pointerEvents = 'none'; continue; }
        tmp.project(camera);
        if (tmp.z > 1 || tmp.z < -1) { it.el.style.opacity = 0; it.el.style.pointerEvents = 'none'; continue; }
        var x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
        it.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-135%)';
        it.el.style.opacity = it.alpha ? it.alpha() : 1;
        it.el.style.pointerEvents = it.el.classList.contains('pill') ? 'auto' : 'none';
      }
    }
  };
  C.project = function (v, camera, out) {
    out.copy(v).project(camera);
    out.x = (out.x * 0.5 + 0.5) * C.size.W; out.y = (-out.y * 0.5 + 0.5) * C.size.H;
    return out.z > -1 && out.z < 1;
  };

  // ---------- Kora's speech bubble ----------
  var voice = { on: false };
  try { voice.on = localStorage.getItem('skyj.voice') === '1'; } catch (e) { }
  var typeTimer = 0, elText = $('c-text');

  C.say = function (text) {
    S.Kora.talk(Math.min(14000, 700 + text.length * 55));
    if (!voice.on || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text.replace(/[\u2190-\u2bff\ud83c-\udbff\udc00-\udfff\u2600-\u27bf]/g, ''));
      u.lang = 'en-IN'; u.rate = 0.95; u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) { }
  };

  function typeText(text) {
    clearInterval(typeTimer);
    var i = 0;
    elText.textContent = '';
    typeTimer = setInterval(function () {
      i += 3;
      elText.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(typeTimer);
    }, 16);
    C.say(text);
  }

  var card = C.card = { data: null, base: null };
  card.show = function (d, notype) {
    card.data = d;
    $('c-tag').textContent = d.tag || '';
    $('c-tag').style.display = d.tag ? '' : 'none';
    $('c-title').textContent = d.title || '';
    var shown = d.text, more = $('c-more');
    $('card').classList.remove('full');
    if (d.lesson) { shown = shorten(d.text); } else $('card').classList.add('full');
    more.classList.toggle('hidden', !(d.lesson && shown !== d.text));
    more.onclick = function () {
      var full = $('card').classList.toggle('full');
      clearInterval(typeTimer); elText.textContent = full ? d.text : shown;
      if (full) C.say(d.text);
      setTimeout(layout, 0);
    };
    if (notype) { clearInterval(typeTimer); elText.textContent = shown; } else typeText(shown);
    var chips = $('c-chips');
    chips.textContent = '';
    (d.chips || []).forEach(function (ch) {
      var b = C.el('button', 'chip');
      b.type = 'button';
      b.textContent = ch.l;
      b.addEventListener('click', function () {
        [].forEach.call(chips.children, function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        if (ch.t) typeText(ch.t);
        S.Kora.mood('happy', 1.2);
        var sc = cur;
        if (ch.act && sc && sc.act) sc.act(ch.act);
        if (sc && sc.chip) sc.chip(ch);
      });
      chips.appendChild(b);
    });
    var back = $('c-back'), next = $('c-next');
    back.style.display = d.back ? '' : 'none';
    back.textContent = d.back ? (d.back.label || '\u2039') : '';
    back.onclick = d.back ? d.back.fn : null;
    next.style.display = d.next ? '' : 'none';
    next.textContent = d.next ? d.next.label : '';
    next.onclick = d.next ? d.next.fn : null;
    next.className = 'primary' + (d.next && d.next.cls ? ' ' + d.next.cls : '');
    $('c-actions').style.display = d.back || d.next ? '' : 'none';
    $('card').classList.remove('swap'); void $('card').offsetWidth; $('card').classList.add('swap');
    if (d.mood) S.Kora.mood(d.mood, 3);
  };

  // A temporary card (e.g. when you tap a star). Closing returns to the lesson card.
  C.info = function (d) {
    if (S.game && S.game.blockInfo()) return;
    if (!card.base) card.base = card.data;
    d.back = { label: '\u2715 Close', fn: C.closeInfo };
    card.show(d);
  };
  C.closeInfo = function () {
    if (card.base) { var b = card.base; card.base = null; card.show(b, true); }
  };

  // ---------- discoveries (stars collected) ----------
  var found = {};
  try { found = JSON.parse(localStorage.getItem('skyj.found') || '{}'); } catch (e) { }
  C.discover = function (id) {
    if (S.game) S.game.tap(id);
    if (found[id]) return false;
    found[id] = 1;
    try { localStorage.setItem('skyj.found', JSON.stringify(found)); } catch (e) { }
    if (S.game) S.game.add(1);
    var b = C.el('div', 'burst', '+1 \u2b50');
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 1300);
    S.Kora.mood('happy', 1.6);
    return true;
  };

  $('btn-voice').addEventListener('click', function () {
    voice.on = !voice.on;
    try { localStorage.setItem('skyj.voice', voice.on ? '1' : '0'); } catch (e) { }
    $('btn-voice').textContent = voice.on ? '\ud83d\udd0a' : '\ud83d\udd07';
    if (voice.on && card.data) C.say(card.data.text); else if (window.speechSynthesis) speechSynthesis.cancel();
  });
  $('btn-voice').textContent = voice.on ? '\ud83d\udd0a' : '\ud83d\udd07';

  $('card').classList.add('swap');
  $('kora').addEventListener('click', function () {
    S.Kora.poke();
    var card_ = $('card');
    card_.classList.toggle('mini');
    setTimeout(layout, 50);
  });

  // ---------- tools (per-scene controls above the card) ----------
  C.tools = {
    el: $('tools'),
    clear: function () { this.el.textContent = ''; setTimeout(layout, 0); },
    add: function (node) { this.el.appendChild(node); setTimeout(layout, 0); }
  };

  // ---------- journey ----------
  C.index = -1;
  var fade = $('fade'), switching = false;

  function whereOf(L) {
    if (L.s === 'sky') return ['\ud83c\udfd4\ufe0f', 'Hanle, Ladakh'];
    if (L.s === 'orrery') return ['\u2600\ufe0f', 'Solar System'];
    if (L.s === 'galaxy') return ['\ud83c\udf0c', 'Milky Way'];
    var B = S.content.BODY[L.b], icons = { earth: '\ud83c\udf0d', moon: '\ud83c\udf19', sun: '\u2600\ufe0f' };
    return [icons[L.b] || '\ud83e\ude90', B ? B.name : L.b];
  }

  C.defaultNext = function (i) {
    var L = LESSONS[i], last = i === LESSONS.length - 1;
    return { label: L.next || (last ? 'Start again \u21ba' : 'Next \u203a'), fn: last ? function () { C.go(0); } : C.next };
  };
  function lessonCard(i) {
    var L = LESSONS[i];
    return { tag: L.tag, title: L.title, text: L.text, chips: L.chips, mood: L.mood, lesson: true, back: null, next: null };
  }
  // The first sentence or two, so Kora's bubble stays tiny; the book icon shows the rest.
  function shorten(t) {
    var s = t.match(/[^.!?]+[.!?]+[\u201d\u2019"]?\s*/g) || [t], out = '';
    for (var k = 0; k < s.length; k++) { if (out.length >= 55 || (out && (out + s[k]).length > 130)) break; out += s[k]; }
    out = out.trim();
    if (out.length > 150) out = out.slice(0, 140).replace(/\s+\S*$/, '') + '\u2026';
    return out;
  }

  function setNav(tab) {
    [].forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('on', b.dataset.tab === tab); if (b.dataset.tab === tab) b.classList.remove('pulse'); });
  }

  C.go = function (i) {
    if (switching) return;
    i = clamp(i, 0, LESSONS.length - 1);
    var L = LESSONS[i], sc = scenes[L.s], w = whereOf(L);
    card.base = null;
    function apply() {
      C.index = i;
      setNav(L.tab);
      $('where-ico').textContent = w[0]; $('where-name').textContent = w[1];
      C.tools.clear();
      if (S.game) S.game.reset();
      sc.lesson(L);
      card.show(lessonCard(i));
      if (S.game) S.game.begin(L, i);
    }
    if (cur === sc) { apply(); return; }
    switching = true;
    fade.dataset.msg = L.flash || '';
    fade.classList.add('on');
    S.Kora.mood('think', 1.2);
    setTimeout(function () {
      if (cur && cur.exit) cur.exit();
      cur = sc;
      C.labels.clear();
      layout();
      sc.enter(L);
      apply();
      fade.classList.remove('on');
      switching = false;
    }, L.flash || cur ? 600 : 80);
  };
  C.next = function () { if (C.index < LESSONS.length - 1) C.go(C.index + 1); };
  C.prev = function () { if (C.index > 0) C.go(C.index - 1); };
  C.goKey = function (key) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].key === key) { C.go(i); return; }
  };
  [].forEach.call(document.querySelectorAll('#nav button'), function (b) {
    b.addEventListener('click', function () {
      var tab = b.dataset.tab, pick = S.game ? S.game.firstUndoneIn(tab) : -1;
      if (pick >= 0) { C.go(pick); return; }
      for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].tab === tab) { C.go(i); return; }
    });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') C.next(); else if (e.key === 'ArrowLeft') C.prev();
  });

  // ---------- gestures: drag, pinch (+twist), tap, double-tap, wheel ----------
  var ptrs = {}, count = 0, pinch = null, down = null, lastTap = 0;
  function measure() {
    var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]];
    return { d: Math.hypot(b.x - a.x, b.y - a.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    count = Object.keys(ptrs).length;
    if (count === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    if (count === 2) { pinch = measure(); down = null; }
    $('hint').classList.add('gone');
    if (cur && cur.onDown) cur.onDown();
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = ptrs[e.pointerId];
    if (!p || !cur) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (count === 1) {
      if (down) down.moved += Math.abs(dx) + Math.abs(dy);
      if (cur.onDrag) cur.onDrag(dx, dy);
    } else if (count === 2 && pinch) {
      var m = measure(), da = m.ang - pinch.ang;
      if (da > Math.PI) da -= 2 * Math.PI; else if (da < -Math.PI) da += 2 * Math.PI;
      if (cur.onPinch) cur.onPinch(m.d / pinch.d, da);
      pinch = m;
    }
  });
  function up(e) {
    var p = ptrs[e.pointerId];
    if (!p) return;
    delete ptrs[e.pointerId];
    var was = count;
    count = Object.keys(ptrs).length;
    pinch = null;
    if (was === 1 && e.type === 'pointerup' && down && down.moved < 10 && performance.now() - down.t < 450 && cur) {
      var now = performance.now();
      if (now - lastTap < 320 && cur.onDouble) { cur.onDouble(); lastTap = 0; }
      else { lastTap = now; if (cur.onTap) cur.onTap(e.clientX, e.clientY); }
    }
    if (count === 0 && cur && cur.onRelease) cur.onRelease();
  }
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (cur && cur.onPinch) cur.onPinch(Math.exp(-e.deltaY * 0.0015), 0);
    $('hint').classList.add('gone');
  }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }); });
  C.touching = function () { return count > 0; };

  // ---------- orbit camera helper (solar system, galaxy) ----------
  C.OrbitCam = function (o) {
    this.az = o.az || 0.6; this.el = o.el || 0.6; this.dist = o.dist || 10; this.min = o.min || 2; this.max = o.max || 60;
    this.target = new THREE.Vector3(); this.follow = null; this.goalDist = null; this.vel = 0;
  };
  C.OrbitCam.prototype = {
    drag: function (dx, dy) { this.az -= dx * 0.006; this.el = clamp(this.el + dy * 0.006, -1.45, 1.45); this.vel = -dx * 0.006; },
    zoom: function (r) { this.dist = clamp(this.dist / r, this.min, this.max); this.goalDist = null; },
    apply: function (camera, dt) {
      var k = 1 - Math.pow(0.02, dt);
      if (this.follow) this.target.lerp(this.follow, k);
      if (this.goalDist != null) this.dist += (this.goalDist - this.dist) * k;
      var c = Math.cos(this.el);
      camera.position.set(this.target.x + this.dist * c * Math.sin(this.az), this.target.y + this.dist * Math.sin(this.el), this.target.z + this.dist * c * Math.cos(this.az));
      camera.lookAt(this.target);
    }
  };

  // ---------- main loop ----------
  var last = performance.now(), t = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    S.Kora.update(t, dt);
    if (!cur) return;
    cur.update(dt, t);
    renderer.render(cur.scene, cur.camera);
    C.labels.update(cur.camera);
  }

  C.start = function (resume) {
    $('title-screen').classList.add('gone');
    S.Kora.mood('happy', 2);
    if (S.game) S.game.unlockAudio();
    C.go(resume && S.game ? S.game.firstUndone() : 0);
  };

  C.boot = function () {
    S.Kora.init();
    S.Kora.mirror($('kora'));
    S.Kora.mirror($('kora-big'), true);
    layout();
    requestAnimationFrame(frame);
  };
})(window.Sky = window.Sky || {});
