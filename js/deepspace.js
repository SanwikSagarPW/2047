window.G = window.G || {};

// Interstellar space beyond Neptune: probes, nearby stars, exoplanets, nebulae, a black hole and a galaxy.
G.DeepSpace = (function () {
  const U = G.utils;
  const items = [], anim = [];
  let hintShown = false, crossed = false;

  function glow(hex, s, o) { return G.World.glowSprite(hex, s, o); }
  function basic(color) { return new THREE.MeshBasicMaterial({ color: color }); }
  function sphere(r, color) { return new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), basic(color)); }

  function radialTex(stops, size) {
    const c = U.makeCanvas(size || 128, size || 128), g = c.getContext('2d'), h = c.width / 2;
    const gr = g.createRadialGradient(h, h, 0, h, h, h);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }

  function starGroup(r, color, glowMul) {
    const g = new THREE.Group();
    g.add(sphere(r, color));
    g.add(glow(color, r * (glowMul || 5), 0.4));
    g.add(glow(0xffffff, r * 2.3, 0.3));
    return g;
  }

  function probeModel(size) {
    const g = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 0.3, emissive: 0x3a2808 });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10), gold));
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 8, 0, Math.PI * 2, 0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide, emissive: 0x222222 }));
    dish.rotation.x = Math.PI; dish.position.y = 1.4; g.add(dish);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6, 4), gold);
    boom.rotation.z = Math.PI / 2; g.add(boom);
    const l = glow(0x5ad8ff, 4, 1); l.position.x = 3; g.add(l);
    g.userData.blink = l;
    g.scale.setScalar(size / 3);
    return g;
  }

  function mottledTex(base, light, dark) {
    const c = U.makeCanvas(256, 128), g = c.getContext('2d'), rnd = U.mulberry32(77);
    g.fillStyle = base; g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 140; i++) {
      const x = rnd() * 256, y = rnd() * 128, r = 8 + rnd() * 26;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rnd() < 0.5 ? light : dark); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.5; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return new THREE.CanvasTexture(c);
  }

  function nebulaModel(size) {
    const g = new THREE.Group(), rnd = U.mulberry32(5);
    const tints = [['255,90,150', '120,60,255'], ['90,170,255', '40,80,200'], ['255,170,90', '200,70,60']];
    for (let i = 0; i < 9; i++) {
      const t = tints[i % 3];
      const tex = radialTex([[0, 'rgba(' + t[0] + ',0.55)'], [0.45, 'rgba(' + t[1] + ',0.22)'], [1, 'rgba(' + t[1] + ',0)']], 128);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, rotation: rnd() * 6 }));
      s.scale.setScalar(size * (0.9 + rnd() * 1.1));
      s.position.set((rnd() - 0.5) * size * 0.9, (rnd() - 0.5) * size * 0.5, (rnd() - 0.5) * size * 0.9);
      g.add(s);
    }
    for (let i = 0; i < 7; i++) {
      const st = glow(i % 2 ? 0xbfd8ff : 0xffffff, 22 + rnd() * 30, 0.95);
      st.position.set((rnd() - 0.5) * size * 0.5, (rnd() - 0.5) * size * 0.3, (rnd() - 0.5) * size * 0.5);
      g.add(st);
    }
    return g;
  }

  function galaxyModel(size) {
    const c = U.makeCanvas(512, 512), x = c.getContext('2d'), rnd = U.mulberry32(11);
    for (let i = 0; i < 14000; i++) {
      const arm = i % 2, t = Math.pow(rnd(), 0.65), ang = t * 5.2 + arm * Math.PI + (rnd() - 0.5) * 0.5;
      const r = t * 235, px = 256 + Math.cos(ang) * r + (rnd() - 0.5) * 16, py = 256 + Math.sin(ang) * r + (rnd() - 0.5) * 16;
      x.fillStyle = t < 0.3 ? 'rgba(255,220,160,0.5)' : 'rgba(150,190,255,0.4)';
      x.fillRect(px, py, 1.6, 1.6);
    }
    const core = x.createRadialGradient(256, 256, 0, 256, 256, 90);
    core.addColorStop(0, 'rgba(255,240,200,1)'); core.addColorStop(0.4, 'rgba(255,200,120,0.45)'); core.addColorStop(1, 'rgba(255,160,80,0)');
    x.fillStyle = core; x.fillRect(0, 0, 512, 512);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    }));
    m.rotation.set(-1.05, 0, 0.5);
    const g = new THREE.Group();
    g.add(m);
    g.add(glow(0xffd9a0, size * 0.5, 0.7));
    return g;
  }

  function blackHoleModel(size) {
    const g = new THREE.Group();
    g.add(glow(0xff9a40, size * 9, 0.35));
    g.add(sphere(size, 0x000000));
    const c = U.makeCanvas(256, 256), x = c.getContext('2d'), rnd = U.mulberry32(3);
    const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(0,0,0,0)'], [0.3, 'rgba(255,200,120,0)'], [0.34, 'rgba(255,245,210,1)'], [0.5, 'rgba(255,150,40,0.85)'], [0.8, 'rgba(200,60,20,0.3)'], [1, 'rgba(120,20,10,0)']]
      .forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    x.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      x.strokeStyle = 'rgba(255,230,180,' + (0.1 + rnd() * 0.25).toFixed(2) + ')';
      x.beginPath(); x.arc(128, 128, 50 + rnd() * 70, rnd() * 6, rnd() * 6 + 1.5); x.stroke();
    }
    const tilt = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.RingGeometry(size * 1.2, size * 3.6, 96), new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    }));
    tilt.add(disc);
    tilt.rotation.x = -1.3; tilt.rotation.z = 0.25;
    g.add(tilt);
    anim.push(function () { disc.rotation.z += 0.004; });
    return g;
  }

  function oortModel(size) {
    const n = 700, pos = new Float32Array(n * 3), rnd = U.mulberry32(21);
    for (let i = 0; i < n; i++) {
      const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1), r = size * (0.5 + rnd() * 0.5);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.cos(ph) * 0.55; pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const g = new THREE.Group();
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 3.2, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false })));
    g.add(glow(0x9ad0ff, size * 1.6, 0.14));
    return g;
  }

  function trappistModel() {
    const g = new THREE.Group();
    g.add(starGroup(6, 0xff7a3a, 8));
    const cols = [0xc8a070, 0xd8b488, 0x7ab0d8, 0x6aa0c8, 0x88c088, 0xb0b8c8, 0xe0e0f0];
    for (let i = 0; i < 7; i++) {
      const r = 14 + i * 8.5, pts = [];
      for (let k = 0; k <= 64; k++) pts.push(new THREE.Vector3(Math.cos(k / 64 * 6.283) * r, 0, Math.sin(k / 64 * 6.283) * r));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.25 })));
      const p = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), new THREE.MeshStandardMaterial({ color: cols[i], emissive: cols[i], emissiveIntensity: 0.35, roughness: 0.8 }));
      g.add(p);
      const sp = 0.9 / Math.sqrt(r), a0 = i * 0.9;
      anim.push(function (t) { p.position.set(Math.cos(a0 + t * sp) * r, 0, Math.sin(a0 + t * sp) * r); });
    }
    return g;
  }

  function buildModel(d) {
    switch (d.model) {
      case 'probe': return probeModel(d.size);
      case 'star': return starGroup(d.size, d.color, 9);
      case 'giant': {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.SphereGeometry(d.size, 40, 28), new THREE.MeshBasicMaterial({ map: mottledTex('#c8381a', 'rgba(255,170,60,0.9)', 'rgba(120,20,10,0.9)') }));
        g.add(m); g.add(glow(0xff6a30, d.size * 4.5, 0.55)); g.add(glow(0xffb070, d.size * 2.4, 0.4));
        anim.push(function (t, dt) { m.rotation.y += dt * 0.03; });
        return g;
      }
      case 'acen': {
        const g = new THREE.Group(), A = starGroup(16, 0xfff2c0, 8), B = starGroup(12, 0xffb060, 8);
        g.add(A); g.add(B);
        anim.push(function (t) { A.position.set(Math.cos(t * 0.2) * -14, 0, Math.sin(t * 0.2) * -14); B.position.set(Math.cos(t * 0.2) * 19, 2, Math.sin(t * 0.2) * 19); });
        const P = starGroup(5, 0xff5030, 8); P.position.set(260, 20, -120); g.add(P);
        return g;
      }
      case 'sirius': {
        const g = new THREE.Group(), A = starGroup(d.size * 0.65, 0xcfe4ff, 8), B = starGroup(3, 0xffffff, 9);
        g.add(A); g.add(B);
        anim.push(function (t) { B.position.set(Math.cos(t * 0.3) * 48, 4, Math.sin(t * 0.3) * 48); });
        return g;
      }
      case 'planet': {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.SphereGeometry(d.size, 20, 14), new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.4, roughness: 0.9 })));
        g.add(glow(0xff9a70, d.size * 6, 0.35));
        return g;
      }
      case 'trappist': return trappistModel();
      case 'nebula': return nebulaModel(d.size);
      case 'blackhole': return blackHoleModel(d.size);
      case 'galaxy': return galaxyModel(d.size);
      case 'oort': return oortModel(d.size);
    }
    return new THREE.Group();
  }

  function lightText(d) {
    if (!d.lightYears) return '';
    const ly = d.lightYears;
    if (ly >= 1000000) return ' Light from there takes ' + (ly / 1000000).toFixed(1) + ' million years to reach us.';
    return ' Light from there takes ' + (ly >= 100 ? Math.round(ly).toLocaleString('en') : ly) + ' years to reach us.';
  }

  function init() {
    const byId = {};
    G.DEEP.forEach(function (d) {
      const obj = buildModel(d);
      const rad = d.a * Math.PI / 180;
      if (d.ref) { const o = byId[d.ref].obj.position; obj.position.set(o.x + d.off[0], o.y + d.off[1], o.z + d.off[2]); }
      else obj.position.set(Math.cos(rad) * d.r, d.y || 0, Math.sin(rad) * d.r);
      G.Scanner.register(d.id, {
        name: d.name, type: d.type, observation: d.fact + ' Distance: ' + d.dist + '.' + lightText(d),
        tags: d.tags, knowledgeId: null, codex: d.title, xp: 40,
        kora: d.name + '! ' + d.fact + (d.lightYears ? ' It is ' + d.dist + ' away. In the game, distances are shrunk by millions of times so we can visit.' : '')
      });
      const a = {
        obj: obj, id: d.id, kind: d.id, name: d.name, radius: d.size, surface: d.size, scanRange: d.size * 0.5 + 40, solid: d.solid || 0, deep: true, def: d,
        orbit: true, hud: 9000, scanned: G.Save.isPoiScanned('orbit', d.id), spin: 0, type: d.type
      };
      byId[d.id] = a;
      items.push(a);
      G.Sectors.register(a);
    });
  }

  function regionName(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 1000) return 'Interstellar Space';
    if (r > 850) return 'Edge of the Solar System';
    if (r > 680) return 'Kuiper Belt';
    return null;
  }

  function nearest(pos, maxDist) {
    let best = null, bd = maxDist;
    items.forEach(function (a) {
      const d = pos.distanceTo(a.obj.position) - a.surface;
      if (d < bd) { bd = d; best = a; }
    });
    return best ? { a: best, dist: bd } : null;
  }

  function update(dt, pos) {
    const t = G.World.time;
    for (let i = 0; i < anim.length; i++) anim[i](t, dt);
    items.forEach(function (a, i) {
      const bl = a.obj.userData.blink;
      if (bl) bl.material.opacity = Math.sin(t * 4 + i) > 0.4 ? 1 : 0.15;
    });
    if (!pos) return;
    const st = G.Save.get(), r = Math.hypot(pos.x, pos.z);
    if (!crossed && r > 1000 && !st.crossedHelio) {
      crossed = st.crossedHelio = true;
      G.UI.notify('You left the Solar System! Interstellar space', 'good');
      G.Audio.play('discover');
      G.UI.koraSay('You have crossed the heliopause, where the Sun\'s wind stops. We are in interstellar space, like Voyager 1. Open the map and tap BEYOND to see stars, nebulae and galaxies to visit.');
    }
    if (!hintShown && !st.deepHint) {
      const nep = G.World.bodies.neptune, plu = G.World.bodies.pluto;
      if ((nep && pos.distanceTo(nep.worldPos) < 260) || (plu && pos.distanceTo(plu.worldPos) < 260)) {
        hintShown = st.deepHint = true;
        G.UI.notify('Beyond Neptune: open the Map and tap BEYOND', 'info');
        G.UI.koraSay('Neptune is not the end! Open the map and tap BEYOND. Plot a course to Voyager 1, the farthest probe, then continue to Alpha Centauri and other stars.');
      }
    }
  }

  return { init: init, update: update, nearest: nearest, regionName: regionName, list: function () { return items; } };
})();
