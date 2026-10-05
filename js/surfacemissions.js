window.G = window.G || {};

// Real mission hardware (landers and rovers) placed on planet surfaces, built from their real silhouettes.
G.SurfaceMissions = (function () {
  const U = G.utils;
  let group = null, mats = null;

  function panelTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#10255a'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const g = x.createLinearGradient(i * 16, j * 16, i * 16 + 16, j * 16 + 16);
      g.addColorStop(0, '#2a55b8'); g.addColorStop(1, '#14306e');
      x.fillStyle = g; x.fillRect(i * 16 + 1, j * 16 + 1, 14, 14);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
    return t;
  }
  function foilTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#d9a23a'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 90; i++) {
      x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,230,150' : '120,70,10') + ',' + (0.15 + Math.random() * 0.3).toFixed(2) + ')';
      x.fillRect(Math.random() * 64, Math.random() * 64, 2 + Math.random() * 10, 1 + Math.random() * 3);
    }
    return new THREE.CanvasTexture(c);
  }
  function M() {
    if (mats) return mats;
    mats = {
      white: new THREE.MeshStandardMaterial({ color: 0xe6e9ee, roughness: 0.55, metalness: 0.15 }),
      grey: new THREE.MeshStandardMaterial({ color: 0x7c8592, roughness: 0.5, metalness: 0.45 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.8, metalness: 0.3 }),
      foil: new THREE.MeshStandardMaterial({ map: foilTexture(), color: 0xffffff, roughness: 0.3, metalness: 0.6, emissive: 0x2a1600 }),
      silverFoil: new THREE.MeshStandardMaterial({ color: 0xc9cdd4, roughness: 0.25, metalness: 0.7 }),
      panel: new THREE.MeshStandardMaterial({ map: panelTexture(), roughness: 0.25, metalness: 0.4, emissive: 0x050f28, side: THREE.DoubleSide }),
      wheel: new THREE.MeshStandardMaterial({ color: 0x9aa1aa, roughness: 0.6, metalness: 0.6 }),
      rtg: new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.5 }),
      red: new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.7 }),
      lens: new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.05, metalness: 0.9 })
    };
    return mats;
  }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function cyl(rt, rb, h, m, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), m); }
  function at(o, x, y, z) { o.position.set(x, y, z); return o; }

  function wheels(g, xs, zs, r, y, w) {
    const m = M();
    xs.forEach(function (x) {
      zs.forEach(function (z) {
        const wh = cyl(r, r, w || r * 0.8, m.wheel, 14); wh.rotation.z = Math.PI / 2;
        g.add(at(wh, x, y, z));
        const hub = cyl(r * 0.35, r * 0.35, (w || r * 0.8) + 0.02, m.dark, 8); hub.rotation.z = Math.PI / 2;
        g.add(at(hub, x, y, z));
      });
    });
  }
  function legs(g, n, rad, top, foot) {
    const m = M();
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * Math.PI * 2;
      const dx = Math.cos(a), dz = Math.sin(a);
      const leg = cyl(0.06, 0.06, Math.hypot(rad * 0.6, top), m.silverFoil, 6);
      leg.position.set(dx * rad * 0.7, top / 2, dz * rad * 0.7);
      leg.rotation.set(dz * 0.45, 0, -dx * 0.45);
      g.add(leg);
      g.add(at(cyl(foot, foot, 0.08, m.grey, 12), dx * rad, 0.04, dz * rad));
    }
  }
  function mast(g, x, z, h) {
    const m = M();
    g.add(at(cyl(0.06, 0.06, h, m.white, 8), x, h / 2 + 1.1, z));
    const head = at(box(0.45, 0.28, 0.3, m.white), x, h + 1.25, z); g.add(head);
    g.add(at(cyl(0.07, 0.07, 0.04, m.lens, 10), x - 0.1, h + 1.25, z + 0.17).rotateX(Math.PI / 2));
    g.add(at(cyl(0.07, 0.07, 0.04, m.lens, 10), x + 0.1, h + 1.25, z + 0.17).rotateX(Math.PI / 2));
  }
  function flag(g, x, z) {
    const m = M();
    g.add(at(cyl(0.03, 0.03, 2.6, m.white, 6), x, 1.3, z));
    const c = document.createElement('canvas'); c.width = 64; c.height = 40;
    const k = c.getContext('2d');
    for (let i = 0; i < 7; i++) { k.fillStyle = i % 2 ? '#fff' : '#b22234'; k.fillRect(0, i * 40 / 7, 64, 40 / 7 + 1); }
    k.fillStyle = '#3c3b6e'; k.fillRect(0, 0, 26, 22);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), side: THREE.DoubleSide, roughness: 0.8 }));
    g.add(at(f, x + 0.62, 2.2, z));
  }

  // ---------- real mission silhouettes ----------
  const BUILD = {
    apolloLM: function (g, rover) {
      const m = M();
      g.add(at(cyl(1.5, 1.5, 1.1, m.foil, 8), 0, 1.5, 0));
      legs(g, 4, 2.6, 1.5, 0.35);
      const lad = at(box(0.5, 1.2, 0.05, m.silverFoil), 0, 0.8, 1.55); lad.rotation.x = -0.4; g.add(lad);
      g.add(at(cyl(0.3, 0.55, 0.4, m.dark, 12), 0, 0.85, 0));
      flag(g, 3.4, 1.2);
      if (rover) {
        const lrv = new THREE.Group();
        lrv.add(at(box(1.2, 0.12, 2.2, m.grey), 0, 0.55, 0));
        lrv.add(at(box(0.9, 0.35, 0.5, m.white), 0, 0.85, 0.2));
        wheels(lrv, [-0.75, 0.75], [-0.85, 0.85], 0.32, 0.32, 0.22);
        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 6, 0, Math.PI * 2, 0, 0.8), m.white);
        lrv.add(at(dish, 0, 1.45, 0.9)); lrv.add(at(cyl(0.02, 0.02, 0.5, m.white, 4), 0, 1.2, 0.9));
        lrv.position.set(-3.6, 0, 1.5); lrv.rotation.y = 0.6;
        g.add(lrv);
      }
    },
    lunokhod: function (g) {
      const m = M();
      const tub = at(cyl(0.9, 0.75, 0.8, m.silverFoil, 16), 0, 1.0, 0); tub.scale.set(1.3, 1, 1); g.add(tub);
      const lid = at(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 18), m.panel), 0, 1.55, -0.9);
      lid.rotation.x = -1.05; g.add(lid);
      wheels(g, [-1.2, 1.2], [-1.1, -0.37, 0.37, 1.1], 0.32, 0.32, 0.18);
      g.add(at(cyl(0.12, 0.12, 0.2, m.lens, 10), -0.4, 1.2, 0.95).rotateX(Math.PI / 2));
      g.add(at(cyl(0.12, 0.12, 0.2, m.lens, 10), 0.4, 1.2, 0.95).rotateX(Math.PI / 2));
      g.add(at(cyl(0.02, 0.02, 1.2, m.white, 4), 0.8, 1.9, 0.5));
    },
    lander4: function (g, opts) {
      const m = M();
      g.add(at(box(2.0, 1.1, 2.0, m.foil), 0, 1.45, 0));
      legs(g, 4, 2.0, 1.2, 0.28);
      const p = at(box(0.05, 1.3, 1.8, m.panel), 1.05, 1.55, 0); g.add(p);
      g.add(at(cyl(0.25, 0.4, 0.4, m.dark, 12), 0, 0.75, 0));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 6, 0, Math.PI * 2, 0, 0.9), m.white), -0.5, 2.15, 0.4));
      if (opts && opts.ramp) {
        const r = at(box(0.7, 0.04, 2.2, m.silverFoil), 0, 0.55, 1.9); r.rotation.x = 0.45; g.add(r);
      }
    },
    smallRover: function (g, panels) {
      const m = M();
      g.add(at(box(0.9, 0.35, 1.0, m.foil), 0, 0.6, 0));
      wheels(g, [-0.55, 0.55], [-0.4, 0, 0.4], 0.18, 0.18, 0.12);
      for (let i = 0; i < (panels || 1); i++) {
        const p = at(box(0.95, 0.03, 0.75, m.panel), (i ? -0.7 : 0), 0.95, (i ? 0 : -0.05));
        p.rotation.z = i ? 0.9 : 0; g.add(p);
      }
      g.add(at(cyl(0.03, 0.03, 0.45, m.white, 6), 0.3, 1.0, 0.35));
      g.add(at(box(0.25, 0.12, 0.12, m.white), 0.3, 1.25, 0.35));
    },
    luna9: function (g) {
      const m = M();
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), m.silverFoil), 0, 0.6, 0));
      for (let i = 0; i < 4; i++) {
        const pt = new THREE.Mesh(new THREE.CircleGeometry(0.55, 3, -Math.PI / 6, Math.PI / 3), m.silverFoil);
        pt.rotation.set(-Math.PI / 2 + 0.25, 0, i * Math.PI / 2); pt.position.y = 0.15; g.add(pt);
        const ant = cyl(0.015, 0.015, 1.0, m.white, 4); ant.position.set(Math.cos(i * 1.57) * 0.3, 1.1, Math.sin(i * 1.57) * 0.3); ant.rotation.set(Math.sin(i * 1.57) * 0.4, 0, -Math.cos(i * 1.57) * 0.4); g.add(ant);
      }
    },
    slim: function (g) {
      const m = M();
      const b = at(box(1.4, 1.1, 1.0, m.foil), 0, 1.0, 0); b.rotation.z = Math.PI / 2 - 0.15; g.add(b);
      const p = at(box(1.3, 0.04, 1.0, m.panel), -0.8, 1.2, 0); p.rotation.z = 0.2; g.add(p);
    },
    curiosity: function (g, opts) {
      const m = M();
      g.add(at(box(1.6, 0.6, 2.4, m.white), 0, 1.25, 0));
      g.add(at(box(1.7, 0.08, 2.5, m.silverFoil), 0, 1.58, 0));
      const rtg = at(cyl(0.28, 0.28, 0.9, m.rtg, 12), 0, 1.45, -1.45); rtg.rotation.x = 0.9; g.add(rtg);
      [-1, 1].forEach(function (s) { const fin = at(box(0.5, 0.03, 0.8, m.rtg), s * 0.4, 1.45, -1.45); fin.rotation.x = 0.9; g.add(fin); });
      wheels(g, [-1.05, 1.05], [-1.0, 0, 1.0], 0.33, 0.33, 0.3);
      [-1, 1].forEach(function (s) {
        const rk = at(box(0.08, 0.08, 2.1, m.grey), s * 1.05, 0.8, 0); rk.rotation.x = 0.06; g.add(rk);
        g.add(at(box(0.08, 0.45, 0.08, m.grey), s * 1.05, 0.95, 0));
      });
      mast(g, 0.55, 0.95, 1.2);
      const arm = at(box(0.1, 0.1, 1.4, m.grey), -0.5, 1.15, 1.6); arm.rotation.x = 0.4; g.add(arm);
      g.add(at(box(0.35, 0.35, 0.35, m.grey), -0.5, 0.8, 2.25));
      if (opts && opts.heli) {
        const h = new THREE.Group();
        h.add(at(box(0.25, 0.2, 0.25, m.white), 0, 0.45, 0));
        [-1, 1].forEach(function (s) { const l = at(cyl(0.015, 0.015, 0.5, m.grey, 4), s * 0.18, 0.22, 0); l.rotation.z = s * 0.3; h.add(l); });
        h.add(at(cyl(0.015, 0.015, 0.4, m.grey, 4), 0, 0.75, 0));
        const b1 = at(box(1.2, 0.02, 0.1, m.dark), 0, 0.82, 0); h.add(b1);
        const b2 = at(box(1.2, 0.02, 0.1, m.dark), 0, 0.92, 0); b2.rotation.y = Math.PI / 2; h.add(b2);
        h.add(at(box(0.3, 0.02, 0.3, m.panel), 0, 0.97, 0));
        h.position.set(2.6, 0, 1.2); h.userData.rotors = [b1, b2];
        g.add(h); g.userData.heli = h;
      }
    },
    mer: function (g) {
      const m = M();
      g.add(at(box(1.2, 0.5, 1.4, m.white), 0, 1.0, 0));
      const deck = at(box(2.3, 0.04, 1.7, m.panel), 0, 1.3, -0.1); g.add(deck);
      [-1, 1].forEach(function (s) { const w = at(box(0.7, 0.04, 1.1, m.panel), s * 1.45, 1.3, -0.2); w.rotation.z = s * 0.15; g.add(w); });
      wheels(g, [-0.8, 0.8], [-0.65, 0, 0.65], 0.25, 0.25, 0.2);
      mast(g, 0.3, 0.6, 1.0);
    },
    sojourner: function (g) {
      const m = M();
      BUILD.smallRover(g, 1);
      const base = new THREE.Group();
      base.add(at(box(1.4, 0.4, 1.4, m.foil), 0, 0.2, 0));
      for (let i = 0; i < 3; i++) { const p = at(box(1.4, 0.04, 1.2, m.panel), 0, 0.03, 0); p.geometry.translate(0, 0, 1.3); p.rotation.y = i * Math.PI * 2 / 3; base.add(p); }
      base.add(at(cyl(0.03, 0.03, 1.1, m.white, 4), 0, 0.95, 0)); base.add(at(box(0.35, 0.3, 0.3, m.white), 0, 1.55, 0));
      base.position.set(-2.8, 0, -1); g.add(base);
    },
    viking: function (g) {
      const m = M();
      g.add(at(cyl(1.1, 1.1, 0.45, m.silverFoil, 6), 0, 1.15, 0));
      legs(g, 3, 1.9, 1.0, 0.3);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 6, 0, Math.PI * 2, 0, 0.8), m.white);
      g.add(at(dish, 0.4, 2.2, 0)); g.add(at(cyl(0.03, 0.03, 0.8, m.white, 4), 0.4, 1.7, 0));
      [-1, 1].forEach(function (s) { g.add(at(cyl(0.18, 0.18, 0.6, m.rtg, 10), s * 0.7, 1.6, -0.5)); });
      g.add(at(cyl(0.12, 0.12, 0.5, m.white, 8), -0.6, 1.65, 0.5));
    },
    insight: function (g, opts) {
      const m = M();
      g.add(at(cyl(0.9, 0.9, 0.5, m.white, 16), 0, 1.0, 0));
      legs(g, 3, 1.4, 0.8, 0.22);
      [-1, 1].forEach(function (s) { const p = at(cyl(1.0, 1.0, 0.04, m.panel, 10), s * 1.9, 1.15, 0); g.add(p); });
      const arm = at(box(0.08, 0.08, 1.4, m.grey), 0.3, 1.2, 1.1); arm.rotation.x = 0.5; g.add(arm);
      if (opts && opts.dome) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.silverFoil), 0.4, 0, 1.9));
    },
    zhurong: function (g) {
      const m = M();
      g.add(at(box(1.2, 0.5, 1.6, m.white), 0, 1.0, 0));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
        const p = at(box(0.9, 0.03, 0.7, m.panel), s[0] * 0.95, 1.4, s[1] * 0.45); p.rotation.z = s[0] * 0.5; g.add(p);
      });
      wheels(g, [-0.8, 0.8], [-0.7, 0, 0.7], 0.25, 0.25, 0.2);
      mast(g, 0, 0.75, 0.8);
    },
    venera: function (g) {
      const m = M();
      g.add(at(cyl(1.1, 1.3, 0.35, m.grey, 20), 0, 0.2, 0));
      g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 12), m.silverFoil), 0, 1.0, 0));
      g.add(at(cyl(0.9, 0.9, 0.06, m.grey, 20), 0, 2.0, 0));
      g.add(at(cyl(0.05, 0.05, 0.6, m.grey, 6), 0, 1.75, 0));
      for (let i = 0; i < 3; i++) g.add(at(box(0.25, 0.2, 0.25, m.dark), Math.cos(i * 2.1) * 0.75, 0.9, Math.sin(i * 2.1) * 0.75));
    },
    huygens: function (g) {
      const m = M();
      g.add(at(cyl(1.3, 0.2, 0.5, m.foil, 24), 0, 0.3, 0));
      g.add(at(cyl(0.6, 1.3, 0.3, m.silverFoil, 24), 0, 0.7, 0));
    }
  };

  function modelFor(s) {
    const n = s.name;
    if (/^Apollo/.test(n)) return function (g) { BUILD.apolloLM(g, /15|16|17/.test(n)); };
    if (/Lunokhod/.test(n)) return BUILD.lunokhod;
    if (/Luna 9/.test(n)) return BUILD.luna9;
    if (/Chandrayaan|Chang/.test(n)) return function (g) {
      BUILD.lander4(g, { ramp: true });
      const r = new THREE.Group(); BUILD.smallRover(r, /Chandrayaan/.test(n) ? 1 : 2); r.position.set(0.4, 0, 3.6); r.rotation.y = 0.3; g.add(r);
    };
    if (/SLIM/.test(n)) return BUILD.slim;
    if (/Perseverance/.test(n)) return function (g) { BUILD.curiosity(g, { heli: true }); };
    if (/Curiosity/.test(n)) return BUILD.curiosity;
    if (/Spirit|Opportunity/.test(n)) return BUILD.mer;
    if (/Sojourner/.test(n)) return BUILD.sojourner;
    if (/Viking/.test(n)) return BUILD.viking;
    if (/InSight/.test(n)) return function (g) { BUILD.insight(g, { dome: true }); };
    if (/Phoenix/.test(n)) return BUILD.insight;
    if (/Zhurong/.test(n)) return BUILD.zhurong;
    if (/Venera/.test(n)) return BUILD.venera;
    if (/Huygens/.test(n)) return BUILD.huygens;
    return BUILD.lander4;
  }

  function fx(g, mats) {
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffb43c, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.2, 48), ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.3; g.add(ring);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffb43c, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 46, 8, 1, true), beamMat);
    beam.position.y = 23; g.add(beam);
    mats.push(ringMat, beamMat);
    return ring;
  }

  function clear() {
    if (!group) return;
    const pois = G.World.pois;
    for (let i = pois.length - 1; i >= 0; i--) if (pois[i].hardware) pois.splice(i, 1);
    G.World.scene.remove(group);
    group = null;
  }

  function onTerrain(bodyId) {
    clear();
    const b = G.World.bodies[bodyId];
    if (!b || G.TERRAINS.isGas(b.def)) return;
    const list = [];
    G.LANDING_SITES.forEach(function (s, i) { if (s.body === bodyId) list.push({ s: s, i: i }); });
    if (!list.length) return;
    group = new THREE.Group();
    const rnd = U.mulberry32((b.def.seed || 3) + 77);
    const star = /Perseverance|Curiosity|Zhurong|Lunokhod|Chandrayaan|Chang|Apollo 1[15]|Opportunity|InSight|Venera 13|Huygens/;
    const pick = list.slice().sort(function (a, b) { return (star.test(b.s.name) ? 1 : 0) - (star.test(a.s.name) ? 1 : 0); }).slice(0, 7);
    const taken = G.World.pois.map(function (p) { return p.obj.position; });
    pick.forEach(function (o, k) {
      let x = 0, z = 0;
      for (let tries = 0; tries < 30; tries++) {
        const a = (k / pick.length) * Math.PI * 2 + rnd() * 0.6, r = 55 + rnd() * 110;
        x = Math.cos(a) * r; z = Math.sin(a) * r;
        if (taken.every(function (p) { return Math.hypot(p.x - x, p.z - z) > 26; })) break;
      }
      const id = 'site_' + bodyId + '_' + o.i;
      if (!G.Scanner.infoFor(id)) {
        G.Scanner.register(id, {
          name: o.s.name, type: 'LANDING SITE \u00b7 ' + b.def.name.toUpperCase(), observation: o.s.note + ' Landed ' + o.s.date + ' by ' + o.s.agency + '.',
          tags: [o.s.agency.split(/[ ,/(]/)[0], o.s.date.split(' ').pop()], knowledgeId: null, codex: o.s.title, xp: 25, kora: o.s.name + ' landed on ' + o.s.date + '. ' + o.s.note
        });
      }
      const g = new THREE.Group();
      const model = new THREE.Group();
      modelFor(o.s)(model);
      model.scale.setScalar(1.6);
      g.add(model);
      g.position.set(x, G.World.groundY(x, z), z);
      g.rotation.y = rnd() * Math.PI * 2;
      const mats = [];
      const ring = fx(g, mats);
      group.add(g);
      taken.push(g.position);
      const poi = { id: id, kind: id, name: o.s.name, obj: g, radius: 5, scanned: G.Save.isPoiScanned(bodyId, id), mats: mats, spin: null, ring: ring, styled: false, hardware: true, heli: model.userData.heli };
      G.World.pois.push(poi);
    });
    G.World.scene.add(group);
  }

  function update(dt) {
    if (!group) return;
    const t = G.World.time, rp = G.Rover.position();
    G.World.pois.forEach(function (p) {
      if (!p.hardware) return;
      // Distant hardware is beyond the fog anyway; hide it to save draw calls.
      p.obj.visible = p.obj.position.distanceTo(rp) < 520;
    });
    G.World.pois.forEach(function (p) {
      if (!p.heli) return;
      p.heli.position.y = 1.2 + Math.sin(t * 1.3) * 0.5 + 0.5;
      p.heli.userData.rotors[0].rotation.y += dt * 30;
      p.heli.userData.rotors[1].rotation.y -= dt * 30;
    });
  }

  const ob = G.World.buildTerrain, orm = G.World.removeTerrain;
  G.World.buildTerrain = function (id) { const r = ob.apply(this, arguments); onTerrain(id); return r; };
  G.World.removeTerrain = function () { clear(); return orm.apply(this, arguments); };

  return { update: update };
})();
