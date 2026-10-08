(function (S) {
  'use strict';
  var THREE = window.THREE, A = S.astro, C = S.core, Cn = S.content, D2R = Math.PI / 180;
  var LAT = A.HANLE.lat, LON = A.HANLE.lon, R = 100;
  var sc = { id: 'sky' };
  var scene = sc.scene = new THREE.Scene(), camera = sc.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
  var cel = new THREE.Group(); cel.matrixAutoUpdate = false; scene.add(cel);
  var tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpP = new THREE.Vector3();
  var view = { az: 150, alt: 28, fov: 78, tAz: null, tAlt: null, tFov: null, vx: 0, vy: 0 };
  var T = { y: 2026, m: 9, d: 8, h: 21, today: null }, hourGoal = null, hourSpeed = 0, uniforms = { uTime: { value: 0 }, uScale: { value: 1 }, uVis: { value: 1 }, uMilky: { value: 1 }, uPl: { value: 1 } };
  var lines = {}, lessonCur = null, labelItems = [], pointerLine, trails, ecliptic, picks = [];
  var dirty = true, built = false, sunAlt = -30, skyData = null, lastMat = null;

  // ---------- helpers ----------
  function timeMs() { return Date.UTC(T.y, T.m, T.d) - 5.5 * 3600e3 + T.h * 3600e3; }
  function fmtHour(h) { var hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60); if (mm === 60) { mm = 0; hh = (hh + 1) % 24; } var ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12 || 12; return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
  function toAzAlt(v) { var l = v.length(); return { az: (Math.atan2(v.x, -v.z) / D2R + 360) % 360, alt: Math.asin(v.y / l) / D2R }; }
  function starVec(id, out, r) { var s = A.STAR[id]; return A.eqVec(s.ra, s.dec, r || R, out); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function col(hex) { return new THREE.Color(hex); }
  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  var VS = 'attribute float aSize; attribute vec3 aColor; attribute float aAlpha; attribute float aTw; uniform float uTime; uniform float uScale; uniform float uVis; varying vec3 vC; varying float vA;' +
    'void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); float tw = 1.0 + aTw * 0.4 * sin(uTime*(2.0+aTw*3.0) + position.x*12.9898 + position.y*78.233);' +
    'gl_PointSize = aSize * uScale * tw; vC = aColor; vA = aAlpha * uVis * (0.8+0.2*tw); gl_Position = projectionMatrix * mv; }';
  var FS = 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-0.5)*2.0; float a = smoothstep(1.0,0.0,d); a*=a; gl_FragColor = vec4(vC, a*vA); }';
  function makePoints(list, visName) {
    var n = list.length, pos = new Float32Array(n * 3), size = new Float32Array(n), colr = new Float32Array(n * 3), al = new Float32Array(n), tw = new Float32Array(n);
    list.forEach(function (p, i) { pos.set([p.x, p.y, p.z], i * 3); size[i] = p.s; var c = col(p.c); colr.set([c.r, c.g, c.b], i * 3); al[i] = p.a == null ? 1 : p.a; tw[i] = p.tw || 0; });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(colr, 3)); g.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1)); g.setAttribute('aTw', new THREE.BufferAttribute(tw, 1));
    var u = { uTime: uniforms.uTime, uScale: uniforms.uScale, uVis: uniforms[visName || 'uVis'] };
    var m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    var pts = new THREE.Points(g, m); pts.frustumCulled = false;
    return pts;
  }

  var skyMat, groundMat, farMat, domeGroup, moon, moonLight, sunSprite, planetPts, planetList = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'], PL = {
    mercury: { c: 0xd8d0c8, s: 14 }, venus: { c: 0xfff4d8, s: 30 }, mars: { c: 0xff8c5a, s: 18 }, jupiter: { c: 0xffeccc, s: 24 }, saturn: { c: 0xf0dca0, s: 16 }
  };

  function build() {
    built = true;
    // sky dome
    skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, -1, 0) }, uGlow: { value: 0 } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform float uGlow; varying vec3 vD; void main(){ float h = clamp(vD.y,0.0,1.0); vec3 c = mix(uHor,uTop,pow(h,0.45)); float g = pow(max(dot(vD,uSun),0.0),5.0)*uGlow; c += vec3(1.0,0.55,0.25)*g; gl_FragColor = vec4(c,1.0); }',
      side: THREE.BackSide, depthWrite: false
    });
    var dome = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat); dome.renderOrder = -2; scene.add(dome);

    // stars: faint random + named
    var list = [], seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 2600; i++) {
      var u = rnd() * 2 - 1, a = rnd() * 6.2832, s = Math.sqrt(1 - u * u), m = rnd();
      list.push({ x: R * s * Math.cos(a), y: R * s * Math.sin(a), z: R * u, s: 3 + m * m * 3.5, c: m > 0.8 ? 0xffe2c0 : m < 0.3 ? 0xc8dcff : 0xffffff, a: 0.35 + m * 0.5, tw: 0.8 });
    }
    cel.add(makePoints(list));
    list = [];
    Object.keys(A.STAR).forEach(function (id) {
      var st = A.STAR[id], v = starVec(id, new THREE.Vector3());
      list.push({ x: v.x, y: v.y, z: v.z, s: Math.max(7, Math.min(26, 8 + (2.6 - st.m) * 4.2)), c: st.c, a: 1, tw: 0.5 });
    });
    cel.add(makePoints(list));

    // Milky Way band
    list = [];
    for (i = 0; i < 5200; i++) {
      var l = rnd() * 360, core = Math.exp(-Math.pow(((l + 180) % 360) - 180, 2) / (2 * 55 * 55)), b = (rnd() + rnd() + rnd() - 1.5) * (14 - 5 * core), e = A.galToEq(l, b);
      var v2 = A.eqVec(e.ra, e.dec, R, new THREE.Vector3());
      list.push({ x: v2.x, y: v2.y, z: v2.z, s: 26 + rnd() * 30, c: rnd() > 0.5 ? 0xd6e0ff : 0xfff0d6, a: (0.035 + 0.05 * core) * (1 - Math.abs(b) / 22) });
    }
    var milky = makePoints(list, 'uMilky'); milky.renderOrder = -1; cel.add(milky);

    // constellation lines
    Object.keys(A.CONST).forEach(function (k) {
      var c = A.CONST[k], pts = [], cen = new THREE.Vector3(), n = 0;
      c.lines.forEach(function (p) { var a = starVec(p[0], new THREE.Vector3(), 99), b2 = starVec(p[1], new THREE.Vector3(), 99); pts.push(a, b2); cen.add(a); cen.add(b2); n += 2; });
      var ls = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0, depthWrite: false }));
      ls.visible = false; cel.add(ls);
      lines[k] = { obj: ls, center: cen.divideScalar(n).normalize().multiplyScalar(98) };
    });

    // helper lines
    pointerLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xffd23f, dashSize: 1.5, gapSize: 1, transparent: true, opacity: 0.95 }));
    pointerLine.visible = false; cel.add(pointerLine);
    trails = new THREE.Group(); trails.visible = false; cel.add(trails);
    ['dubhe', 'alkaid', 'merak'].forEach(function (id) {
      var dec = A.STAR[id].dec, pts = [];
      for (var k = 0; k <= 120; k++) { var ra = k / 120 * 6.2832; pts.push(A.eqVec(ra, dec, 99, new THREE.Vector3())); }
      var ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffd23f, dashSize: 1.2, gapSize: 1.6, transparent: true, opacity: 0.55 }));
      ln.computeLineDistances(); trails.add(ln);
    });
    var ep = [], eps = 23.4393 * D2R;
    for (i = 0; i <= 180; i++) { var lo = i / 180 * 6.2832, x = Math.cos(lo), y = Math.sin(lo) * Math.cos(eps), z = Math.sin(lo) * Math.sin(eps); ep.push(new THREE.Vector3(x, y, z).multiplyScalar(99)); }
    ecliptic = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ep), new THREE.LineDashedMaterial({ color: 0xffe08a, dashSize: 1.2, gapSize: 1.6, transparent: true, opacity: 0.4 }));
    ecliptic.computeLineDistances(); ecliptic.visible = false; cel.add(ecliptic);

    // planets
    planetPts = makePoints(planetList.map(function (n) { return { x: 0, y: 0, z: R, s: PL[n].s, c: PL[n].c, tw: 0 }; }), 'uPl');
    cel.add(planetPts);

    // moon + sun
    var tl = new THREE.TextureLoader();
    moon = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 24), new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 1 }));
    tl.load('assets/textures/2k_moon.jpg', function (t) { t.encoding = THREE.sRGBEncoding; moon.material.map = t; moon.material.color.set(0xffffff); moon.material.needsUpdate = true; });
    cel.add(moon);
    moonLight = new THREE.DirectionalLight(0xffffff, 2.4); cel.add(moonLight);
    scene.add(new THREE.AmbientLight(0x404862, 0.5));
    var g = document.createElement('canvas'); g.width = g.height = 128; var cx = g.getContext('2d'), gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.2, 'rgba(255,220,140,0.7)'); gr.addColorStop(1, 'rgba(255,160,60,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
    sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(g), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    sunSprite.scale.set(34, 34, 1); cel.add(sunSprite);

    // mountains + ground
    function ridge(rad, base, amp, c, phase) {
      var N = 220, pos = [], idx = [];
      for (var k = 0; k <= N; k++) {
        var th = k / N * 6.2832, h = base + amp * (0.5 + 0.5 * Math.sin(3 * th + phase) * 0.6 + 0.5 * Math.sin(7 * th + phase * 2) * 0.3 + 0.5 * Math.sin(17 * th + phase) * 0.1);
        var top = rad * Math.tan(h * D2R);
        pos.push(rad * Math.sin(th), top, -rad * Math.cos(th), rad * Math.sin(th), -40, -rad * Math.cos(th));
        if (k < N) { var q = k * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), side: THREE.DoubleSide })); return m;
    }
    farMat = ridge(130, 1.5, 5, 0x0a1022, 1.3); groundMat = ridge(70, 0.5, 2.5, 0x04060c, 0.2);
    scene.add(farMat, groundMat);
    var floor = new THREE.Mesh(new THREE.CircleGeometry(75, 32), new THREE.MeshBasicMaterial({ color: 0x04060c })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2; scene.add(floor); groundMat.userData.floor = floor;

    // observatory dome
    domeGroup = new THREE.Group();
    var dm = new THREE.MeshBasicMaterial({ color: 0x9aa6bb });
    var cyl = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 3, 20), dm); cyl.position.y = -0.5;
    var cap = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 12, 0, 6.2832, 0, 1.5708), dm); cap.position.y = 1;
    var led = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3030 })); led.position.set(0, 1.8, 3.1);
    domeGroup.add(cyl, cap, led);
    domeGroup.position.set(30 * Math.sin(130 * D2R), -0.5, -30 * Math.cos(130 * D2R)); domeGroup.userData.mat = dm; domeGroup.rotation.y = 0.8;
    scene.add(domeGroup);
  }

  // ---------- sky state ----------
  function recompute() {
    dirty = false;
    var ms = timeMs(), lst = A.lst(ms, LON), sk = skyData = A.sky(ms);
    cel.matrix.copy(A.skyMatrix(THREE, lst, LAT)); cel.matrixWorldNeedsUpdate = true; cel.updateMatrixWorld(true);
    sunAlt = A.altitude(sk.sun.ra, sk.sun.dec, lst, LAT);
    if (S.game) S.game.ev('sunAlt', sunAlt);
    var pa = planetPts.geometry.attributes.position;
    planetList.forEach(function (n, i) { var e = sk.planets[n]; A.eqVec(e.ra, e.dec, R, tmpV); pa.setXYZ(i, tmpV.x, tmpV.y, tmpV.z); });
    pa.needsUpdate = true;
    // moon
    A.eqVec(sk.moon.ra, sk.moon.dec, 96, moon.position);
    var zx = tmpV.copy(moon.position).negate().normalize(), north = tmpV2.set(0, 0, 1), up = north.sub(zx.clone().multiplyScalar(north.dot(zx))).normalize(), side = new THREE.Vector3().crossVectors(zx, up);
    moon.matrix.makeBasis(zx, up, side); moon.quaternion.setFromRotationMatrix(moon.matrix);
    A.eqVec(sk.sun.ra, sk.sun.dec, 100, moonLight.position);
    A.eqVec(sk.sun.ra, sk.sun.dec, 120, sunSprite.position);
    sunSprite.visible = sunAlt > -4;
    // colours from sun altitude
    var night = [col(0x02040c), col(0x0a1330)], dusk = [col(0x2a3a78), col(0xf0845c)], day = [col(0x3b88e0), col(0xa5d3ff)];
    var tA = smooth(-18, -2, sunAlt), tB = smooth(-2, 10, sunAlt);
    ['Top', 'Hor'].forEach(function (k, j) { var c = night[j].clone().lerp(dusk[j], tA).lerp(day[j], tB); skyMat.uniforms['u' + k].value.copy(c); });
    var sw = A.eqVec(sk.sun.ra, sk.sun.dec, 1, new THREE.Vector3()).applyMatrix4(cel.matrix);
    skyMat.uniforms.uSun.value.copy(sw.normalize());
    skyMat.uniforms.uGlow.value = smooth(-14, -2, sunAlt) * (1 - smooth(2, 25, sunAlt) * 0.6);
    uniforms.uVis.value = smooth(-3, -15, sunAlt);
    uniforms.uMilky.value = smooth(-10, -19, sunAlt) * 1.0;
    uniforms.uPl.value = smooth(2, -8, sunAlt);
    var gc = col(0x04060c).lerp(col(0x39334a), tA).lerp(col(0x7a6a58), tB);
    groundMat.material.color.copy(gc).convertSRGBToLinear(); groundMat.userData.floor.material.color.copy(groundMat.material.color);
    farMat.material.color.copy(col(0x0a1022).lerp(col(0x5a4a66), tA).lerp(col(0x9a8470), tB)).convertSRGBToLinear();
    domeGroup.userData.mat.color.copy(col(0x2a3040).lerp(col(0x9aa6bb), tA)).convertSRGBToLinear();
    renderPicks();
    if (lessonCur && lessonCur.planetsHint && !lessonCur._looked) { lessonCur._looked = true; focusPlanet(); }
  }

  function focusPlanet() {
    var best = null;
    ['venus', 'jupiter', 'mars', 'saturn'].forEach(function (n) {
      var v = A.eqVec(skyData.planets[n].ra, skyData.planets[n].dec, 1, new THREE.Vector3()).applyMatrix4(cel.matrix), aa = toAzAlt(v);
      if (aa.alt > 6 && (!best || aa.alt > best.alt)) best = aa;
    });
    if (best) flyTo(best.az, Math.max(20, best.alt), 70);
  }

  function renderPicks() { /* picks are computed on tap */ }

  function flyTo(az, alt, fov) { view.tAz = az; view.tAlt = Math.max(-5, Math.min(85, alt)); view.tFov = fov || view.fov; view.tAzCur = null; }

  function focusOn(f, fov) {
    var cen = new THREE.Vector3(), n = 0;
    (Array.isArray(f) ? f : null || []).forEach(function (id) { cen.add(starVec(id, new THREE.Vector3(), 1)); n++; });
    if (!Array.isArray(f)) { if (lines[f]) { cen.copy(lines[f].center).normalize(); n = 1; } }
    if (!n) return;
    cen.normalize().applyMatrix4(cel.matrix);
    var aa = toAzAlt(cen);
    flyTo(aa.az, aa.alt, fov);
  }

  // ---------- labels for lesson ----------
  function clearLabels() { labelItems.forEach(function (it) { C.labels.remove(it); }); labelItems = []; sc.numbers([]); if (linkObj) linkObj.visible = false; }
  function worldOf(v, out) { return out.copy(v).applyMatrix4(cel.matrix); }
  function addLabel(text, v, cls) {
    labelItems.push(C.labels.add({ text: text, cls: cls || 'pin', pos: function (out) { worldOf(v, out); return out.y > 0.5; } }));
  }

  // ---------- tools ----------
  var toolEls = {};
  function buildTools(L) {
    var tl = L.tools || [];
    if (tl.indexOf('time') >= 0) {
      var row = C.el('div', 'tool'), lab = C.el('b', '', fmtHour(T.h)), sl = C.el('input'); sl.type = 'range'; sl.min = 17; sl.max = 31; sl.step = 0.05; sl.value = T.h; sl.className = 'clock';
      sl.addEventListener('input', function () { T.h = +sl.value; hourGoal = null; lab.textContent = fmtHour(T.h); dirty = true; });
      row.append(C.el('span', '', '\ud83c\udf05'), sl, C.el('span', '', '\ud83c\udf19'), lab); C.tools.add(row); toolEls.sl = sl; toolEls.lab = lab;
    }
    if (tl.indexOf('hours') >= 0) {
      var r2 = C.el('div', 'tool chips');
      [['9 PM', 21], ['11 PM', 23], ['1 AM', 25], ['3 AM', 27]].forEach(function (p) { var b = C.el('button', 'chip', p[0]); b.onclick = function () { setHour(p[1]); if (S.game) S.game.ev('hourBtn', p[1]); }; r2.appendChild(b); });
      C.tools.add(r2);
    }
    if (tl.indexOf('months') >= 0) {
      var r3 = C.el('div', 'tool chips scroll');
      Cn.MONTHS.forEach(function (n, i) { var b = C.el('button', 'chip', n); b.onclick = function () { setMonth(i); if (S.game) S.game.ev('month', i); [].forEach.call(r3.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; if (i === T.m) b.classList.add('on'); r3.appendChild(b); });
      C.tools.add(r3);
    }
  }
  function setHour(h) { T.h = h; hourGoal = null; syncClock(); dirty = true; }
  function setMonth(m) { T.m = m; T.d = 15; dirty = true; }
  function syncClock() { if (toolEls.sl) { toolEls.sl.value = T.h; toolEls.lab.textContent = fmtHour(T.h); } }

  // ---------- game helpers: numbered dots, drawn links, reveal ----------
  var numItems = [], linkObj = null;
  sc.numbers = function (ids) {
    numItems.forEach(function (it) { C.labels.remove(it); }); numItems = [];
    ids.forEach(function (id, i) {
      var v = starVec(id, new THREE.Vector3());
      numItems.push(C.labels.add({ text: String(i + 1), cls: 'pin num', pos: function (out) { worldOf(v, out); return out.y > 0.5; } }));
    });
  };
  sc.setNext = function (k) { numItems.forEach(function (it, i) { it.el.classList.toggle('next', i === k); it.el.classList.toggle('got', i < k); }); };
  sc.links = function (pairs) {
    if (!linkObj) { linkObj = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true, depthWrite: false })); cel.add(linkObj); }
    var pts = [];
    pairs.forEach(function (p) { pts.push(starVec(p[0], new THREE.Vector3(), 99), starVec(p[1], new THREE.Vector3(), 99)); });
    linkObj.geometry.dispose(); linkObj.geometry = new THREE.BufferGeometry().setFromPoints(pts); linkObj.visible = pts.length > 0;
  };
  sc.showLines = function (on) {
    ((lessonCur && lessonCur.lines) || []).forEach(function (k) { if (lines[k]) lines[k].obj.visible = on; });
    if (on && linkObj) linkObj.visible = false;
  };
  sc.reveal = function (ids) {
    sc.numbers([]);
    ids.forEach(function (id) { addLabel(A.STAR[id].n, starVec(id, new THREE.Vector3()), 'pin'); });
    ((lessonCur && lessonCur.labels) || []).forEach(function (k) { if (lines[k]) addLabel(A.CONST[k].name, lines[k].center, 'pin const'); });
  };

  // ---------- scene interface ----------
  sc.enter = function () {
    if (!built) build();
    var n = new Date(); T.today = { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
    scene.background = null;
  };
  sc.exit = function () { clearLabels(); };

  sc.lesson = function (L) {
    lessonCur = L; clearLabels(); toolEls = {};
    if (L.when) {
      if (L.when.m != null) { T.m = L.when.m; T.d = 15; T.y = T.today.y; } else { T.y = T.today.y; T.m = T.today.m; T.d = T.today.d; }
      T.h = L.when.h;
    }
    hourGoal = null; hourSpeed = 0;
    buildTools(L);
    var all = (L.lines || []).indexOf('all') >= 0;
    Object.keys(lines).forEach(function (k) {
      var on = all || (L.lines || []).indexOf(k) >= 0, o = lines[k].obj;
      o.visible = on; o.material.opacity = all ? 0.45 : 0.95;
    });
    pointerLine.visible = !!L.pointer; trails.visible = !!L.trail; ecliptic.visible = !!L.ecliptic;
    if (L.pointer) {
      var a = starVec('merak', new THREE.Vector3(), 99).normalize(), b = starVec('polaris', new THREE.Vector3(), 99).normalize(), w = a.angleTo(b), pts = [];
      for (var k = 0; k <= 40; k++) { var t = k / 40; pts.push(a.clone().multiplyScalar(Math.sin((1 - t) * w)).add(b.clone().multiplyScalar(Math.sin(t * w))).divideScalar(Math.sin(w)).normalize().multiplyScalar(99)); }
      pointerLine.geometry.setFromPoints(pts); pointerLine.computeLineDistances();
    }
    dirty = true; recompute();
    (L.labels || []).forEach(function (k) { if (lines[k]) addLabel(A.CONST[k].name, lines[k].center, 'pin const'); });
    (L.starLabels || []).forEach(function (id) { addLabel(A.STAR[id].n, starVec(id, new THREE.Vector3()), 'pin'); });
    if (L.focus) focusOn(L.focus, L.fov || 60);
    else if (L.look) flyTo(L.look.az, L.look.alt, L.look.fov);
    if (L.planetsHint) { lessonCur._looked = false; focusPlanet(); lessonCur._looked = true; }
    if (L.auto === 'sunrise') sc.act('sunrise'); else if (L.auto === 'spin') sc.act('spin');
  };

  sc.act = function (a) {
    if (a === 'sunrise') { setHour(21); hourGoal = 30.6; hourSpeed = 2.2; }
    if (a === 'spin') { setHour(21); hourGoal = 27.5; hourSpeed = 1.3; }
  };

  sc.resize = function () { C.applyView(camera); };

  sc.onDrag = function (dx, dy) {
    var k = view.fov / C.size.H;
    view.az = (view.az - dx * k + 360) % 360; view.alt = Math.max(-8, Math.min(89, view.alt + dy * k));
    view.tAz = null; view.tFov = null; view.vx = -dx * k; view.vy = dy * k;
  };
  sc.onPinch = function (r) { view.fov = Math.max(22, Math.min(90, view.fov / r)); view.tFov = null; };
  sc.onDown = function () { view.vx = view.vy = 0; hourGoal = null; };
  sc.onRelease = function () { };

  sc.onTap = function (x, y) {
    var best = null, bd = 44;
    function consider(id, v, name, info, cls) {
      var w = tmpP.copy(v).applyMatrix4(cel.matrix);
      if (cls === 'fixed') w.copy(v);
      if (w.y < -1) return;
      var p = new THREE.Vector3();
      if (!C.project(w, camera, p)) return;
      var d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = { id: id, name: name, info: info }; }
    }
    Object.keys(A.STAR).forEach(function (id) { var s = A.STAR[id]; consider(id, starVec(id, new THREE.Vector3()), s.n, s.info); });
    planetList.forEach(function (n, i) { var e = skyData.planets[n]; var inf = Cn.INFO[n]; consider(n, A.eqVec(e.ra, e.dec, R, new THREE.Vector3()), inf.title, inf.text); });
    consider('moon', moon.position, 'The Moon', Cn.INFO.moon.text);
    consider('dome', domeGroup.position.clone().setY(1.5), Cn.INFO.dome.title, Cn.INFO.dome.text, 'fixed');
    if (!best) return;
    var isPlanet = planetList.indexOf(best.id) >= 0, tag = isPlanet ? 'Planet' : best.id === 'dome' ? 'Tap discovery' : best.id === 'moon' ? 'Natural satellite' : 'Star';
    var nw = C.discover(best.id);
    var txt = best.info || 'A star in our night sky. Every star is a faraway sun that makes its own light.';
    C.info({ tag: tag + (nw ? ' \u00b7 +1 \u2b50' : ''), title: best.name, text: txt, chips: [] });
  };

  sc.update = function (dt, t) {
    uniforms.uTime.value = t;
    if (hourGoal != null) {
      T.h = Math.min(hourGoal, T.h + hourSpeed * dt); syncClock(); dirty = true;
      if (T.h >= hourGoal) hourGoal = null;
    }
    if (dirty) recompute();
    if (view.tAz != null) {
      var k = 1 - Math.pow(0.02, dt), d = ((view.tAz - view.az + 540) % 360) - 180;
      view.az = (view.az + d * k + 360) % 360; view.alt += (view.tAlt - view.alt) * k;
      if (view.tFov) view.fov += (view.tFov - view.fov) * k;
      if (Math.abs(d) < 0.2 && Math.abs(view.tAlt - view.alt) < 0.2) view.tAz = null;
    }
    if (!C.touching() && (Math.abs(view.vx) > 0.01 || Math.abs(view.vy) > 0.01)) {
      view.az = (view.az + view.vx + 360) % 360; view.alt = Math.max(-8, Math.min(89, view.alt + view.vy)); var dm = Math.pow(0.9, dt * 60); view.vx *= dm; view.vy *= dm;
    }
    camera.fov = view.fov; camera.rotation.order = 'YXZ'; camera.rotation.set(view.alt * D2R, -view.az * D2R, 0);
    C.applyView(camera);
    uniforms.uScale.value = C.pr * Math.pow(Math.tan(35 * D2R) / Math.tan(view.fov * D2R / 2), 0.6);
  };

  C.register(sc);
})(window.Sky = window.Sky || {});
