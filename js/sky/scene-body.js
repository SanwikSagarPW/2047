(function (S) {
  'use strict';
  var THREE = window.THREE, C = S.core, Cn = S.content, A = S.astro, D2R = Math.PI / 180, TEX = 'assets/textures/';
  var sc = { id: 'body' };
  var scene = sc.scene = new THREE.Scene(), camera = sc.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  var FT = Math.tan(camera.fov * D2R / 2);
  var amb = new THREE.AmbientLight(0xb8ccff, 0.55), key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(-3, 2.5, 4);
  scene.add(amb, key);
  var starPts = (function () {
    var n = 900, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { var u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u); pos.set([60 * s * Math.cos(a), 60 * u, 60 * s * Math.sin(a)], i * 3); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.8 })); scene.add(p); return p;
  })();
  var stage = new THREE.Group(), pivot = new THREE.Group();
  scene.add(stage); stage.add(pivot);

  var cur = null, curId = null, want = null, applied = null, appear = 0, zoom = 1, zoomT = 1, vel = { x: 0, y: 0 };
  var look = { queue: [], target: null, hold: 0 }, overlay = null, runners = [], tour = [], dist = 6, fit = 1.15;
  var mode = null, satsGroup = null, sats = [], phase = { age: 10, tool: null };
  var tl = new THREE.TextureLoader();

  function loadTex(f, cb) { tl.load(TEX + f, function (t) { t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; cb(t); }); }
  var COL = { moon: 0x9a9a9a, mercury: 0x8c8279, venus: 0xd9b36a, mars: 0xb5532f, jupiter: 0xc9a27a, uranus: 0x8fd6e0, neptune: 0x3f63d6, saturn: 0xd8c08a, earth: 0x2a6fb5 };
  function sphere(id, r) {
    var m = new THREE.MeshStandardMaterial({ color: COL[id] || 0x888888, roughness: 0.92, metalness: 0 });
    loadTex(Cn.BODY[id].tex, function (t) { m.map = t; m.color.set(0xffffff); m.needsUpdate = true; });
    return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), m);
  }
  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,230,160,1)'); gr.addColorStop(0.35, 'rgba(255,170,60,0.45)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function build(id) {
    var group = new THREE.Group(), spin = [], api = { group: group, spin: spin, id: id };
    if (id === 'earth') {
      api.mesh = sphere('earth', 1); group.add(api.mesh);
      var cl = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, roughness: 1 }));
      cl.visible = false; loadTex('2k_earth_clouds.jpg', function (t) { cl.material.alphaMap = t; cl.material.needsUpdate = true; cl.visible = true; });
      group.add(cl);
      group.add(new THREE.Mesh(new THREE.SphereGeometry(1.14, 48, 32), new THREE.ShaderMaterial({
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'varying vec3 vN; void main(){ float i = pow(max(0.0, 0.68 - dot(vN, vec3(0.0,0.0,1.0))), 3.0); gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * i; }',
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
    } else if (id === 'sun') {
      var sun = new THREE.Mesh(new THREE.SphereGeometry(0.85, 64, 48), new THREE.MeshBasicMaterial({ color: 0xffb030 }));
      loadTex('2k_sun.jpg', function (t) { sun.material.map = t; sun.material.color.set(0xffffff); sun.material.needsUpdate = true; });
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 })); gl.scale.set(3.4, 3.4, 1);
      group.add(sun, gl); spin.push([sun, 0.03]);
    } else if (id === 'saturn') {
      var body = sphere('saturn', 0.55);
      var rg = new THREE.RingGeometry(0.7, 1.0, 128, 1), p = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
      for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() - 0.7) / 0.3, 0.5); }
      var ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xcdbb94, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false })); ring.rotation.x = -Math.PI / 2;
      loadTex('2k_saturn_ring_alpha.png', function (t) { ring.material.map = t; ring.material.color.set(0xffffff); ring.material.opacity = 1; ring.material.needsUpdate = true; });
      var tilt = new THREE.Group(); tilt.add(body, ring); tilt.rotation.set(0.4, 0, 0.4); group.add(tilt); spin.push([body, 0.05]);
    } else {
      api.mesh = sphere(id, 1); group.add(api.mesh);
      if (id === 'uranus') group.rotation.z = 1.4;
      spin.push([api.mesh, id === 'moon' ? 0 : 0.05]);
    }
    return api;
  }
  function dispose(root) {
    root.traverse(function (n) {
      if (n.geometry) n.geometry.dispose();
      var m = n.material; if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach(function (mm) { if (mm.map) mm.map.dispose(); if (mm.alphaMap) mm.alphaMap.dispose(); mm.dispose(); });
    });
  }

  function ll2v(lat, lon, r) { var la = lat * D2R, lo = lon * D2R; return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)); }
  function quatFor(ll) {
    var p = ll2v(ll[0], ll[1], 1);
    var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-p.x, p.z));
    var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ll[0] * D2R);
    return qx.multiply(qy);
  }
  function arc(a, b, color) {
    var va = ll2v(a[0], a[1], 1), vb = ll2v(b[0], b[1], 1), w = va.angleTo(vb), pts = [], n = 40, lift = 0.05 + 0.2 * w / Math.PI;
    for (var i = 0; i <= n; i++) { var t = i / n, s = Math.sin(w); pts.push(va.clone().multiplyScalar(Math.sin((1 - t) * w) / s).add(vb.clone().multiplyScalar(Math.sin(t * w) / s)).normalize().multiplyScalar(1.004 + lift * Math.sin(Math.PI * t))); }
    var curve = new THREE.CatmullRomCurve3(pts);
    return { tube: new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.007, 6, false), new THREE.MeshBasicMaterial({ color: color })), curve: curve };
  }

  function clearOverlay() {
    if (overlay) { overlay.parent.remove(overlay); dispose(overlay); overlay = null; }
    runners = []; C.labels.clear();
  }
  function addPin(parent, ll, text, tappable) {
    var v = ll2v(ll[0], ll[1], 1.006);
    var dot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd23f })); dot.position.copy(v); overlay.add(dot);
    C.labels.add({ text: text, cls: tappable ? 'pill' : 'pin', onTap: tappable ? function () { if (S.game) S.game.tap('pin:' + text); } : null, pos: function (out) {
      out.copy(v).applyMatrix4(parent.matrixWorld);
      var c = new THREE.Vector3().setFromMatrixPosition(parent.matrixWorld), n = out.clone().sub(c).normalize(), tc = camera.position.clone().sub(out).normalize();
      return n.dot(tc) > 0.12 && appear > 0.6;
    } });
  }
  function buildOverlay(L, extraPin) {
    clearOverlay();
    var pins = (L.pins || []).map(function (id) { return Cn.PLACES[id]; });
    var q = S.game && S.game.peek(L), tap = !!(q && q.t === 'tapAll');
    if (!L.routes && !pins.length && !extraPin) return;
    overlay = new THREE.Group(); cur.group.add(overlay);
    (L.routes || []).forEach(function (r) {
      var a = arc(Cn.PLACES[r[0]], Cn.PLACES[r[1]], r[2] === 'in' ? 0xffb43c : 0x38e1ff);
      overlay.add(a.tube);
      for (var k = 0; k < 2; k++) { var d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); overlay.add(d); runners.push({ m: d, c: a.curve, o: k * 0.5 }); }
    });
    pins.forEach(function (pl) { addPin(cur.group, pl, pl[2], tap); });
    if (extraPin) addPin(cur.group, extraPin.ll, extraPin.text);
  }

  // ---------- satellites (Earth lesson) ----------
  function satMesh() {
    var g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 }));
    var pm = new THREE.MeshStandardMaterial({ color: 0x2a5cff, metalness: 0.3, roughness: 0.4, emissive: 0x0a1a66 });
    var p1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.01, 0.09), pm), p2 = p1.clone(); p1.position.x = 0.18; p2.position.x = -0.18; g.add(b, p1, p2); g.scale.setScalar(1.3); return g;
  }
  function buildSats() {
    satsGroup = new THREE.Group(); pivot.add(satsGroup); sats = [];
    var defs = [
      { id: 'moon', name: '\ud83c\udf19 Moon (natural)', r: 3.0, sp: 0.18, inc: 0.25, tag: 'Natural satellite', info: 'The Moon formed naturally and goes around Earth. Earth has just one. (Sizes and distances here are not to scale.)' },
      { id: 'sat1', name: '\ud83d\udef0\ufe0f Weather satellite', r: 1.5, sp: 0.5, inc: 1.1, tag: 'Artificial satellite', info: 'Weather satellites watch clouds and cyclones from space so forecasters can warn people in time.' },
      { id: 'sat2', name: '\ud83d\udef0\ufe0f Communication', r: 1.9, sp: 0.35, inc: 0.2, tag: 'Artificial satellite', info: 'Communication satellites carry TV, phone calls and internet signals around the world.' },
      { id: 'sat3', name: '\ud83d\udef0\ufe0f Aryabhata', r: 1.3, sp: 0.62, inc: 0.7, tag: 'India\u2019s first satellite', info: 'Aryabhata, launched in 1975, was India\u2019s very first satellite. Artificial satellites are built by people and sent into space.' }
    ];
    defs.forEach(function (d, i) {
      var m;
      if (d.id === 'moon') { m = sphere('moon', 0.27); } else m = satMesh();
      satsGroup.add(m);
      var pts = []; for (var k = 0; k <= 64; k++) pts.push(new THREE.Vector3(Math.cos(k / 64 * 6.283) * d.r, 0, Math.sin(k / 64 * 6.283) * d.r));
      var ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
      var tilt = new THREE.Group(); tilt.rotation.set(d.inc, i, 0); tilt.add(ring, m); satsGroup.add(tilt);
      var s = { d: d, m: m, a: i * 1.7 }; sats.push(s);
      C.labels.add({ text: d.name, cls: 'pill', onTap: function () {
        var nw = C.discover('sat:' + d.id); C.info({ tag: d.tag + (nw ? ' \u00b7 +1 \u2b50' : ''), title: d.name.replace(/^\S+\s/, ''), text: d.info });
      }, pos: function (out) { m.getWorldPosition(out); return appear > 0.6; } });
    });
  }

  // ---------- Moon phases tool ----------
  var PH = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  function phaseName(f) { return f < 0.03 || f > 0.97 ? PH[0] : f < 0.22 ? PH[1] : f < 0.28 ? PH[2] : f < 0.47 ? PH[3] : f < 0.53 ? PH[4] : f < 0.72 ? PH[5] : f < 0.78 ? PH[6] : PH[7]; }
  function setPhase(age) {
    phase.age = age; var th = age / 29.53 * 6.2832;
    if (S.game) S.game.ev('phase', age / 29.53);
    key.position.set(Math.sin(th) * 5, 0.2, -Math.cos(th) * 5);
    if (phase.name) phase.name.textContent = phaseName(age / 29.53) + ' \u00b7 day ' + Math.round(age);
    var cv = phase.cv; if (!cv) return;
    var g = cv.getContext('2d'), w = cv.width, c = w / 2, R = w * 0.34;
    g.clearRect(0, 0, w, w);
    g.fillStyle = '#ffd23f'; g.fillRect(0, c - 14, 8, 28); g.strokeStyle = 'rgba(255,210,63,.5)'; g.lineWidth = 2;
    [-8, 0, 8].forEach(function (o) { g.beginPath(); g.moveTo(10, c + o); g.lineTo(c - 18, c + o); g.stroke(); });
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(c, c, R, 0, 6.2832); g.stroke();
    g.fillStyle = '#3d8bff'; g.beginPath(); g.arc(c, c, 11, 0, 6.2832); g.fill();
    var mx = c - R * Math.cos(th), my = c - R * Math.sin(th);
    g.fillStyle = '#444'; g.beginPath(); g.arc(mx, my, 8, 0, 6.2832); g.fill();
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(mx, my, 8, Math.PI / 2, Math.PI * 1.5); g.fill();
  }

  // ---------- state ----------
  function setBody(id) {
    if (cur) { pivot.remove(cur.group); dispose(cur.group); }
    if (satsGroup) { pivot.remove(satsGroup); dispose(satsGroup); satsGroup = null; sats = []; }
    clearOverlay(); cur = build(id); curId = id; pivot.add(cur.group); pivot.quaternion.identity(); zoom = zoomT = 1; vel.x = vel.y = 0;
  }
  function setDist() {
    var r = C.rect, diam = Math.max(120, Math.min(r.w, r.h) * 0.8), k = diam / (2 * fit);
    dist = C.size.H / (2 * k * FT); camera.position.set(0, 0, dist); C.applyView(camera);
  }
  function nextLook() { if (!look.queue.length) { look.target = null; return; } look.target = quatFor(look.queue.shift()); look.hold = 0; }
  function startLook(list) { look.queue = (list || []).slice(); nextLook(); }

  function applyLesson(L) {
    applied = L; zoomT = 1; vel.x = vel.y = 0; mode = L.mode || null;
    fit = L.fit || (curId === 'sun' ? 1.3 : 1.15); setDist();
    cur.group.rotation.y = 0 + (curId === 'uranus' ? 0 : 0);
    pivot.quaternion.identity();
    if (satsGroup) { pivot.remove(satsGroup); dispose(satsGroup); satsGroup = null; sats = []; }
    amb.intensity = 0.55; key.intensity = 1.35; key.position.set(-3, 2.5, 4);
    if (curId === 'earth') buildOverlay(L); else clearOverlay();
    if (mode === 'sats') { clearOverlay(); buildSats(); }
    if (mode === 'spin') {
      clearOverlay(); amb.intensity = 0.12; key.intensity = 2.6; key.position.set(4, 1, 2);
      pivot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -23.5 * D2R);
      var pts = [new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(0, 1.6, 0)];
      overlay = new THREE.Group(); cur.group.add(overlay);
      overlay.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffd23f })));
      look.queue = []; look.target = null;
    } else if (mode === 'phases') {
      amb.intensity = 0.07; key.intensity = 2.6;
      pivot.quaternion.copy(quatFor([0, 0])); look.queue = []; look.target = null;
      var row = C.el('div', 'tool'), sl = C.el('input'); sl.type = 'range'; sl.min = 0; sl.max = 29.5; sl.step = 0.1; sl.className = 'moonrange';
      var cv = C.el('canvas'); cv.width = cv.height = 96; cv.className = 'phase-cv';
      var nm = C.el('b', 'phase-name'); phase.cv = cv; phase.name = nm;
      var age0 = A.sky(Date.now()).moonAge * 29.53; sl.value = age0;
      sl.addEventListener('input', function () { setPhase(+sl.value); });
      var col = C.el('div', 'phase-col'); col.append(nm, sl); row.append(cv, col); C.tools.add(row); setPhase(age0);
    } else if (L.look) startLook(L.look);
    else { look.queue = []; look.target = null; }
  }

  sc.enter = function () { C.applyView(camera); };
  sc.exit = function () { clearOverlay(); };
  sc.lesson = function (L) { want = L; if (curId === L.b && applied !== null && cur) { applyLesson(L); } else applied = null; };
  sc.resize = function () { if (cur) setDist(); };
  sc.chip = function (ch) {
    if (!cur) return;
    if (ch.ll) { buildOverlay(want, { ll: ch.ll, text: ch.l.replace(/^\S+\s/, '') }); startLook([ch.ll]); zoomT = 1.5; }
    if (ch.reset) { look.queue = []; look.target = new THREE.Quaternion(); zoomT = 1.2; }
  };

  sc.onDown = function () { look.queue = []; look.target = null; vel.x = vel.y = 0; };
  sc.onDrag = function (dx, dy) {
    var s = 0.0085 / Math.sqrt(zoom), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(dy * s, dx * s, 0, 'XYZ'));
    pivot.quaternion.premultiply(q); vel.x = vel.x * 0.5 + dx * 0.5; vel.y = vel.y * 0.5 + dy * 0.5;
  };
  sc.onPinch = function (r, da) {
    zoomT = Math.min(3.2, Math.max(0.45, zoomT * r)); zoom = zoomT;
    if (da) pivot.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -da));
  };
  sc.onDouble = function () { zoomT = 1; if (want && want.look) startLook(want.look); else { look.target = new THREE.Quaternion(); } };

  function ease(t) { return t * t * (3 - 2 * t); }
  var time = 0;
  sc.update = function (dt) {
    time += dt;
    if (want) {
      if (curId !== want.b) { appear = Math.max(0, appear - dt / 0.25); if (appear <= 0) { setBody(want.b); applied = null; } }
      else { appear = Math.min(1, appear + dt / 0.4); if (applied !== want) applyLesson(want); }
    }
    stage.scale.setScalar(Math.max(0.001, ease(appear)));
    if (!C.touching() && (Math.abs(vel.x) > 0.05 || Math.abs(vel.y) > 0.05)) {
      var s = 0.0085 / Math.sqrt(zoom); pivot.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(vel.y * s, vel.x * s, 0, 'XYZ')));
      var d = Math.pow(0.9, dt * 60); vel.x *= d; vel.y *= d;
    }
    if (look.target) {
      pivot.quaternion.slerp(look.target, 1 - Math.pow(0.04, dt));
      if (pivot.quaternion.angleTo(look.target) < 0.02) { look.hold += dt; if (look.hold > 1.6) nextLook(); }
    }
    zoom += (zoomT - zoom) * Math.min(1, dt * 10); pivot.scale.setScalar(zoom);
    if (cur) {
      if (mode === 'spin') cur.group.rotation.y += dt * 0.6;
      cur.spin.forEach(function (s) { s[0].rotation.y += s[1] * dt; });
    }
    sats.forEach(function (s) { s.a += s.d.sp * dt; s.m.position.set(Math.cos(s.a) * s.d.r, 0, Math.sin(s.a) * s.d.r); });
    runners.forEach(function (r) { r.m.position.copy(r.c.getPoint((time * 0.25 + r.o) % 1)); });
    starPts.rotation.y += dt * 0.004;
  };

  C.register(sc);
})(window.Sky = window.Sky || {});
