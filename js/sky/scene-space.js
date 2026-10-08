(function (S) {
  'use strict';
  var THREE = window.THREE, C = S.core, Cn = S.content, A = S.astro, D2R = Math.PI / 180, TEX = 'assets/textures/';
  var tl = new THREE.TextureLoader();
  function loadTex(f, cb) { tl.load(TEX + f, function (t) { t.encoding = THREE.sRGBEncoding; cb(t); }); }
  function glow(c0, c1) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, c0); gr.addColorStop(0.3, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }
  function bgStars(scene, r, n) {
    var pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { var u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u); pos.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.85, sizeAttenuation: false })));
  }
  function lessonText(id) { var L = Cn.LESSONS.filter(function (l) { return l.key === 'planet:' + id; })[0]; return L; }

  // =================== ORRERY ===================
  var orr = { id: 'orrery' }, scene = orr.scene = new THREE.Scene(), camera = orr.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  var cam = new C.OrbitCam({ az: 0.5, el: 0.75, dist: 34, min: 3, max: 70 });
  var built = false, meshes = {}, bodies = {}, simMs = Date.now(), speed = 20, belt, comet, cometTail, sel = null, lessonCur = null, dateLab, strip, tourT = null, tourI = 0;
  var IDS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  function disp(r) { return 1.6 + 2.7 * Math.sqrt(r); }
  function toScene(p, out) { var r = Math.hypot(p.x, p.y, p.z) || 1, d = disp(r) / r; return out.set(p.x * d, p.z * d, -p.y * d); }
  var tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

  function buildOrrery() {
    built = true;
    bgStars(scene, 200, 1200);
    scene.add(new THREE.AmbientLight(0xffffff, 0.32));
    var pl = new THREE.PointLight(0xffffff, 2.4, 0, 0); scene.add(pl);
    var sun = new THREE.Mesh(new THREE.SphereGeometry(Cn.BODY.sun.r, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffb030 }));
    loadTex('2k_sun.jpg', function (t) { sun.material.map = t; sun.material.color.set(0xffffff); sun.material.needsUpdate = true; });
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow('rgba(255,235,170,1)', 'rgba(255,160,50,.4)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); gl.scale.set(7, 7, 1);
    scene.add(sun, gl); meshes.sun = sun; bodies.sun = { m: sun, r: Cn.BODY.sun.r, pos: sun.position };
    var now = Date.now();
    IDS.forEach(function (id) {
      var B = Cn.BODY[id], m = new THREE.Mesh(new THREE.SphereGeometry(B.r, 32, 24), new THREE.MeshStandardMaterial({ color: new THREE.Color(B.c2), roughness: 0.95 }));
      loadTex(B.tex, function (t) { m.material.map = t; m.material.color.set(0xffffff); m.material.needsUpdate = true; });
      scene.add(m); meshes[id] = m; bodies[id] = { m: m, r: B.r, pos: m.position };
      if (id === 'saturn') {
        var rg = new THREE.RingGeometry(B.r * 1.25, B.r * 2.1, 64), p = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
        for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() - B.r * 1.25) / (B.r * 0.85), 0.5); }
        var ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xcdbb94, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false })); ring.rotation.x = -Math.PI / 2 + 0.45; m.add(ring);
        loadTex('2k_saturn_ring_alpha.png', function (t) { ring.material.map = t; ring.material.color.set(0xffffff); ring.material.opacity = 1; ring.material.needsUpdate = true; });
      }
      var pts = A.orbitPath(id, now, 180).map(function (q) { return toScene(q, new THREE.Vector3()); });
      scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(B.c2), transparent: true, opacity: id === 'pluto' ? 0.25 : 0.5 })));
      C.labels.add({ text: B.name, cls: 'pin', pos: function (out) { out.copy(m.position); out.y += B.r * 1.6 + 0.2; return cam.dist < 45; } });
    });
    // asteroid belt
    var n = 1600, pos = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) { var a = 2.2 + Math.random() * 1.1, th = Math.random() * 6.283, d = disp(a) + (Math.random() - 0.5) * 0.15; pos.set([d * Math.cos(th), (Math.random() - 0.5) * 0.25, d * Math.sin(th)], k * 3); }
    var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    belt = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xb8aea0, size: 0.06, transparent: true, opacity: 0.85 })); scene.add(belt);
    // comet
    var cp = A.orbitPath('comet', now, 240).map(function (q) { return toScene(q, new THREE.Vector3()); });
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(cp), new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.25 })));
    comet = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xcff6ff })); scene.add(comet);
    cometTail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]), new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.7 })); scene.add(cometTail);
    bodies.comet = { m: comet, r: 0.12, pos: comet.position };
  }

  function setPills(on) {
    C.labels.clear();
    IDS.forEach(function (id) { var B = Cn.BODY[id]; C.labels.add({ text: B.name, cls: 'pin', pos: function (o) { o.copy(meshes[id].position); o.y += B.r * 1.6 + 0.2; return cam.dist < 45; } }); });
    if (on) {
      C.labels.add({ html: '\ud83e\udea8 Asteroid belt', cls: 'pill', onTap: function () { var nw = C.discover('belt'); C.info({ tag: 'Between Mars and Jupiter' + (nw ? ' \u00b7 +1 \u2b50' : ''), title: 'The asteroid belt', text: 'Millions of rocky pieces left over from when the planets formed travel round the Sun here, between Mars and Jupiter.' }); closeHook(); }, pos: function (o) { o.set(disp(2.75), 0.2, 0); o.applyAxisAngle(new THREE.Vector3(0, 1, 0), belt.rotation.y + 0.9); return true; } });
      C.labels.add({ html: '\u2604\ufe0f Comet', cls: 'pill', onTap: function () { select('comet'); }, pos: function (o) { o.copy(comet.position); return true; } });
    }
  }
  function closeHook() { C.$('c-back').onclick = function () { C.closeInfo(); deselect(); }; }
  function deselect() { sel = null; cam.follow = new THREE.Vector3(); cam.goalDist = lessonCur && lessonCur.dist || 34; }

  function select(id) {
    sel = id; var b = bodies[id]; if (!b) return;
    cam.follow = b.pos; cam.goalDist = Math.max(2.6, b.r * 7);
    var nw = C.discover('orr:' + id);
    if (id === 'comet') { C.info({ tag: 'Small body' + (nw ? ' \u00b7 +1 \u2b50' : ''), title: 'A comet', text: 'Comets are balls of ice and dust. Near the Sun they grow long glowing tails that always point away from the Sun. This one is like Halley\u2019s Comet, which returns about every 76 years.' }); closeHook(); return; }
    if (id === 'pluto') { C.info({ tag: 'Dwarf planet' + (nw ? ' \u00b7 +1 \u2b50' : ''), title: 'Pluto', text: 'Pluto is a dwarf planet \u2014 it is not one of the eight planets. It is small, icy and very far away.' }); closeHook(); return; }
    var L = lessonText(id);
    C.info({ tag: (L ? L.tag : '') + (nw ? ' \u00b7 +1 \u2b50' : ''), title: Cn.BODY[id].name, text: L ? L.text : '', next: { label: 'Explore \ud83d\udd0d', fn: function () { C.goKey('planet:' + id); } } });
    closeHook();
  }

  function buildStrip() {
    strip = C.el('div', 'tool strip');
    ['sun'].concat(IDS).forEach(function (id) {
      var B = Cn.BODY[id], b = C.el('button', 'pbtn'); b.type = 'button';
      b.innerHTML = '<i style="background:radial-gradient(circle at 35% 30%,' + B.c1 + ',' + B.c2 + ')"></i><span>' + B.name + '</span>';
      b.onclick = function () { if (id === 'sun') C.goKey('planet:sun'); else select(id); };
      strip.appendChild(b);
    });
    C.tools.add(strip);
    var row = C.el('div', 'tool chips');
    dateLab = C.el('b', 'datelab', '');
    [['\u23f8', 0], ['\ud83d\udc22', 20], ['\ud83d\udc07', 120], ['\ud83d\ude80', 600]].forEach(function (p) {
      var b = C.el('button', 'chip' + (p[1] === speed ? ' on' : ''), p[0]); b.onclick = function () { speed = p[1]; [].forEach.call(row.querySelectorAll('.chip'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; row.appendChild(b);
    });
    var today = C.el('button', 'chip', 'Today'); today.onclick = function () { simMs = Date.now(); };
    row.append(today, dateLab); C.tools.add(row);
  }

  orr.enter = function () { if (!built) buildOrrery(); };
  orr.exit = function () { clearInterval(tourT); };
  orr.lesson = function (L) {
    lessonCur = L; speed = L.speed || 20; sel = null; clearInterval(tourT);
    setPills(!!L.pills); buildStrip();
    cam.follow = new THREE.Vector3(); cam.goalDist = L.dist || 34;
    if (L.sequence) { tourI = 0; tourT = setInterval(function () { if (tourI >= IDS.length - 1) { clearInterval(tourT); deselect(); return; } var id = IDS[tourI++]; cam.follow = bodies[id].pos; cam.goalDist = Math.max(3, bodies[id].r * 8); }, 2300); }
  };
  orr.resize = function () { C.applyView(camera); };
  orr.onDown = function () { clearInterval(tourT); };
  orr.onDrag = function (dx, dy) { cam.drag(dx, dy); };
  orr.onPinch = function (r) { cam.zoom(r); };
  orr.onTap = function (x, y) {
    var best = null, bd = 40, p = new THREE.Vector3();
    Object.keys(bodies).forEach(function (id) { if (!C.project(tmp.copy(bodies[id].pos), camera, p)) return; var d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = id; } });
    if (best === 'sun') C.goKey('planet:sun'); else if (best) select(best);
  };
  orr.update = function (dt) {
    simMs += speed * 86400e3 * dt;
    IDS.forEach(function (id) { toScene(A.helio(id, simMs), meshes[id].position); meshes[id].rotation.y += dt * 0.5; });
    toScene(A.helio('comet', simMs), comet.position);
    var r = comet.position.length(); tmp.copy(comet.position).normalize().multiplyScalar(Math.max(0.1, 2.2 - r * 0.12));
    cometTail.geometry.setFromPoints([comet.position.clone(), comet.position.clone().add(tmp)]); cometTail.visible = r < 18;
    belt.rotation.y += speed * 0.0004 * dt;
    var H = C.size.H, ft = Math.tan(camera.fov * D2R / 2);
    Object.keys(bodies).forEach(function (id) {
      var b = bodies[id], d = camera.position.distanceTo(b.pos) || 1, px = 2 * b.r * H / (2 * d * ft), f = Math.max(1, 15 / px);
      b.m.scale.setScalar(f);
    });
    if (dateLab) dateLab.textContent = new Date(simMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    cam.apply(camera, dt); C.applyView(camera);
  };
  C.register(orr);

  // =================== GALAXY ===================
  var gal = { id: 'galaxy' }, gscene = gal.scene = new THREE.Scene(), gcam = gal.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 800);
  var gOrb = new C.OrbitCam({ az: 0.4, el: 0.9, dist: 2.6, min: 0.5, max: 90 }), gBuilt = false, spiral, glx = [];
  function buildGalaxy() {
    gBuilt = true;
    bgStars(gscene, 400, 800);
    var n = 18000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
    for (var i = 0; i < n; i++) {
      var arm = i % 4, r = Math.pow(Math.random(), 0.65), ang = arm * Math.PI / 2 + r * 5 + gauss() * (0.35 - r * 0.2), bulge = Math.random() < 0.18;
      var rr = bulge ? Math.random() * 0.22 : r, aa = bulge ? Math.random() * 6.283 : ang;
      pos.set([Math.cos(aa) * rr, gauss() * (bulge ? 0.12 : 0.05 * (1 - r * 0.6)), Math.sin(aa) * rr], i * 3);
      c.setHSL(bulge || r < 0.2 ? 0.11 : 0.6 - r * 0.08, 0.5, 0.65 + Math.random() * 0.2); col.set([c.r, c.g, c.b], i * 3);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    spiral = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.02, vertexColors: true, map: glow('rgba(255,255,255,1)', 'rgba(255,255,255,.4)'), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    gscene.add(spiral);
    var core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow('rgba(255,235,190,1)', 'rgba(255,190,90,.35)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); core.scale.set(0.9, 0.9, 1); gscene.add(core);
    var gt = glow('rgba(190,205,255,.9)', 'rgba(150,170,255,.25)');
    for (i = 0; i < 70; i++) {
      var u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), d = 12 + Math.random() * 60;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.6, 0.7), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8 }));
      sp.position.set(d * s * Math.cos(a), d * u * 0.6, d * s * Math.sin(a)); var sz = 1 + Math.random() * 2.2; sp.scale.set(sz, sz * (0.4 + Math.random() * 0.5), 1); gscene.add(sp);
    }
  }
  function addHere() {
    C.labels.add({ html: '\ud83d\udccd You are here', cls: 'pill', onTap: function () { var nw = C.discover('here'); C.info({ tag: 'Our home' + (nw ? ' \u00b7 +1 \u2b50' : ''), title: 'The Solar System is here', text: 'Our Sun is one of billions of stars in the Milky Way. We live about halfway out from the centre, in one of the spiral arms.' }); C.$('c-back').onclick = C.closeInfo; }, pos: function (o) { o.set(Math.cos(1.0) * 0.52, 0, Math.sin(1.0) * 0.52); o.applyAxisAngle(new THREE.Vector3(0, 1, 0), spiral.rotation.y); return true; } });
  }
  gal.enter = function () { if (!gBuilt) buildGalaxy(); addHere(); };
  gal.lesson = function (L) { gOrb.goalDist = L.dist || 2.6; };
  gal.resize = function () { C.applyView(gcam); };
  gal.onDrag = function (dx, dy) { gOrb.drag(dx, dy); };
  gal.onPinch = function (r) { gOrb.zoom(r); };
  gal.update = function (dt) { spiral.rotation.y += dt * 0.03; gOrb.apply(gcam, dt); C.applyView(gcam); };
  C.register(gal);
})(window.Sky = window.Sky || {});
