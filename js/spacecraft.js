window.G = window.G || {};

// Real human-made spacecraft in orbit + real landing sites pinned at their true latitude/longitude.
// Altitudes are log-scaled so low and high orbits are both reachable; positions are live each frame.
G.Spacecraft = (function () {
  const U = G.utils;
  const crafts = [], sites = [];
  let mats = null, siteTimer = 0;

  function M() {
    if (mats) return mats;
    mats = {
      white: new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.45, metalness: 0.2 }),
      grey: new THREE.MeshStandardMaterial({ color: 0x8c96a3, roughness: 0.5, metalness: 0.3 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xe0a93c, roughness: 0.3, metalness: 0.3, emissive: 0x2a1a00 }),
      panel: new THREE.MeshStandardMaterial({ color: 0x24479a, roughness: 0.25, metalness: 0.3, emissive: 0x081d48, side: THREE.DoubleSide }),
      mirror: new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.15, metalness: 0.3, emissive: 0x4a3000 }),
      shield: new THREE.MeshStandardMaterial({ color: 0xd9c8e8, roughness: 0.3, metalness: 0.2, emissive: 0x241a30, side: THREE.DoubleSide }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.1, metalness: 0.3 })
    };
    return mats;
  }

  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function cyl(r, l, m, seg) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg || 14), m); return c; }
  function wing(len, wid, x) { const p = box(len, 0.04, wid, M().panel); p.position.x = x; return p; }

  function buildModel(type) {
    const m = M(), g = new THREE.Group();
    if (type === 'station') {
      const truss = box(8, 0.25, 0.25, m.grey); g.add(truss);
      for (let s = -1; s <= 1; s += 2) {
        for (let k = 0; k < 2; k++) {
          const w1 = box(0.7, 0.04, 3.4, m.panel); w1.position.set(s * (3 + k * 0.9), 0, 1.9); g.add(w1);
          const w2 = w1.clone(); w2.position.z = -1.9; g.add(w2);
        }
      }
      const core = cyl(0.42, 3.6, m.white); core.rotation.x = Math.PI / 2; g.add(core);
      const node = cyl(0.5, 1.2, m.white); node.rotation.z = Math.PI / 2; node.position.z = 1.2; g.add(node);
      const rad = box(0.08, 0.02, 1.6, m.white); rad.position.set(1.2, 0, -0.8); g.add(rad);
    } else if (type === 'telescope') {
      const tube = cyl(0.6, 3.2, m.chrome, 18); tube.rotation.z = Math.PI / 2; g.add(tube);
      const door = new THREE.Mesh(new THREE.CircleGeometry(0.62, 18), m.grey); door.position.x = 1.62; door.rotation.y = Math.PI / 2; door.rotation.x = 0.6; g.add(door);
      const aft = cyl(0.66, 0.8, m.gold, 18); aft.rotation.z = Math.PI / 2; aft.position.x = -1.8; g.add(aft);
      const p1 = box(2.4, 0.03, 0.9, m.panel); p1.position.set(-0.2, 0, 1.3); g.add(p1);
      const p2 = p1.clone(); p2.position.z = -1.3; g.add(p2);
    } else if (type === 'jwst') {
      for (let i = 0; i < 4; i++) {
        const sh = new THREE.Mesh(new THREE.PlaneGeometry(6 - i * 0.3, 3.4 - i * 0.2), m.shield);
        sh.rotation.x = -Math.PI / 2; sh.rotation.z = Math.PI / 4; sh.position.y = -0.6 + i * 0.12; g.add(sh);
      }
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 6), m.mirror);
      mirror.rotation.x = Math.PI / 2 - 0.25; mirror.position.set(0, 1.0, 0); g.add(mirror);
      const sec = cyl(0.03, 1.6, m.grey, 4); sec.rotation.x = Math.PI / 2; sec.position.set(0, 1.2, 0.8); g.add(sec);
    } else if (type === 'sputnik') {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), m.chrome));
      for (let i = 0; i < 4; i++) {
        const a = cyl(0.025, 3.2, m.grey, 4);
        a.geometry.translate(0, -1.6, 0);
        a.rotation.set(Math.PI / 2 + 0.35 * (i < 2 ? 1 : -1), 0, (i % 2 ? 0.35 : -0.35));
        g.add(a);
      }
    } else if (type === 'flat') {
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Group();
        s.add(box(1.0, 0.1, 0.6, m.grey));
        const pnl = box(0.04, 2.2, 0.6, m.panel); pnl.position.set(0.55, 1.1, 0); s.add(pnl);
        s.position.set(i * 2.2 - 4.4, 0, 0);
        g.add(s);
      }
    } else if (type === 'juno') {
      g.add(cyl(0.8, 0.9, m.gold, 6));
      for (let i = 0; i < 3; i++) {
        const p = box(4.2, 0.04, 0.9, m.panel); p.geometry.translate(2.9, 0, 0); p.rotation.y = i * Math.PI * 2 / 3; g.add(p);
      }
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 6, 0, Math.PI * 2, 0, 0.7), m.white); dish.position.y = 0.4; g.add(dish);
    } else {
      // generic satellite / probe: gold bus, two wings, dish
      g.add(box(1.0, 1.0, 1.0, type === 'navsat' || type === 'comsat' ? m.gold : m.gold));
      const len = type === 'comsat' ? 3.6 : 2.6;
      g.add(wing(len, 0.9, len / 2 + 0.55)); g.add(wing(len, 0.9, -len / 2 - 0.55));
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 6, 0, Math.PI * 2, 0, 0.75), m.white);
      dish.material = m.white; dish.position.set(0, 0, 0.8); dish.rotation.x = -Math.PI / 2; g.add(dish);
      if (type === 'earthobs') { const cam = cyl(0.25, 0.6, m.grey); cam.position.y = -0.75; g.add(cam); }
      if (type === 'navsat') { const ant = cyl(0.3, 0.4, m.white); ant.position.y = -0.7; g.add(ant); }
    }
    const blink = G.World.glowSprite(type === 'sputnik' ? 0xffd27a : 0x5ad8ff, 1.6, 0.9);
    blink.position.y = 0.9;
    g.add(blink);
    g.userData.blink = blink;
    g.scale.setScalar(type === 'station' ? 0.75 : 0.6);
    return g;
  }

  function orbitRadius(def, R) {
    if (def.parent === 'sun') return R * 1.6;
    return R + 3 + 5 * Math.log10(1 + def.alt / 300);
  }

  function fmtCoord(lat, lon) {
    return Math.abs(lat).toFixed(2) + '\u00b0' + (lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(lon).toFixed(2) + '\u00b0' + (lon >= 0 ? 'E' : 'W');
  }

  function altText(def) {
    if (def.alt === 'L2') return '1.5 million km from Earth, at the L2 point behind Earth';
    if (def.alt === 'L1') return '1.5 million km from Earth, at the L1 point towards the Sun';
    if (def.parent === 'sun') return 'Loops around the Sun, diving to about 6 million km from its surface';
    return 'Orbit height about ' + def.alt.toLocaleString('en') + ' km above ' + (G.PLANETS[def.parent] ? G.PLANETS[def.parent].name : def.parent);
  }

  function initCraft() {
    const rnd = U.mulberry32(2047);
    G.SPACECRAFT.forEach(function (def) {
      const obj = buildModel(def.model);
      G.Scanner.register(def.id, {
        name: def.name, type: 'SPACECRAFT \u00b7 ' + def.agency.toUpperCase(),
        observation: def.fact + ' Launched ' + def.year + ' by ' + def.agency + '. ' + altText(def) + '. Status: ' + def.status + '.',
        tags: [def.agency.split(/[ ,/(]/)[0], 'since ' + def.year, def.status.split(/[ ,]/)[0]],
        knowledgeId: null, codex: def.title, xp: 25,
        kora: 'This is the real ' + def.name + '! ' + def.fact
      });
      const c = {
        def: def, obj: obj, angle: rnd() * Math.PI * 2, node: rnd() * Math.PI * 2,
        inc: THREE.MathUtils.degToRad(def.inc || 0)
      };
      crafts.push(c);
      c.a = {
        obj: obj, id: def.id, kind: def.id, name: def.name, radius: 3, orbit: true, craft: true, hud: 170,
        scanned: G.Save.isPoiScanned('orbit', def.id), spin: 0, type: 'SPACECRAFT'
      };
      G.Sectors.register(c.a);
    });
  }

  function latLonLocal(lat, lon, r) {
    const phi = (lon + 180) / 360 * Math.PI * 2, th = (90 - lat) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th));
  }

  function attachSites() {
    G.LANDING_SITES.forEach(function (s, i) {
      if (s._attached) return;
      const body = G.World.bodies[s.body];
      if (!body) return;
      s._attached = true;
      const R = body.def.radius;
      const pin = new THREE.Group();
      pin.position.copy(latLonLocal(s.lat, s.lon, R * 1.02));
      const glow = G.World.glowSprite(0xffb43c, Math.max(0.5, R * 0.09), 0.95);
      pin.add(glow);
      body.mesh.add(pin);
      const id = 'site_' + s.body + '_' + i;
      const where = fmtCoord(s.lat, s.lon);
      G.Scanner.register(id, {
        name: s.name, type: 'LANDING SITE \u00b7 ' + body.def.name.toUpperCase(),
        observation: s.note + ' Landed ' + s.date + ' by ' + s.agency + ' at ' + where + ' (' + s.place + ').',
        tags: [s.agency.split(/[ ,/(]/)[0], s.date.split(' ').pop(), where],
        knowledgeId: null, codex: s.title, xp: 25,
        kora: s.name + ' landed here on ' + s.date + ', at ' + where + ', in ' + s.place + '. ' + s.note
      });
      const proxy = new THREE.Object3D();
      const a = {
        obj: proxy, id: id, kind: id, name: s.name + ' site', radius: 0.6, orbit: true, site: true, range: Math.max(18, R * 1.6),
        hud: R * 6 + 60, scanned: G.Save.isPoiScanned('orbit', id), spin: 0, type: 'LANDING SITE', pin: pin, glow: glow, body: s.body
      };
      pin.getWorldPosition(proxy.position);
      sites.push(a);
      G.Sectors.register(a);
    });
  }

  const tmp = new THREE.Vector3();
  function update(dt) {
    const bodies = G.World.bodies, t = G.World.time;
    for (let i = 0; i < crafts.length; i++) {
      const c = crafts[i], def = c.def, parent = bodies[def.parent];
      if (!parent) continue;
      const p = parent.worldPos, o = c.obj.position;
      if (def.alt === 'L1' || def.alt === 'L2') {
        tmp.copy(p).normalize();
        const k = def.alt === 'L2' ? 70 : -70;
        o.set(p.x + tmp.x * k + Math.cos(t * 0.05 + i) * 4, p.y + 5 + Math.sin(t * 0.05 + i) * 3, p.z + tmp.z * k + Math.sin(t * 0.05 + i) * 4);
        c.obj.lookAt(0, 0, 0);
      } else {
        const R = parent.def.radius, d = orbitRadius(def, R);
        c.angle += dt * 0.6 / (d - R + 1);
        const x = Math.cos(c.angle) * d, yy = Math.sin(c.angle) * d * Math.sin(c.inc), zz = Math.sin(c.angle) * d * Math.cos(c.inc);
        const cn = Math.cos(c.node), sn = Math.sin(c.node);
        o.set(p.x + x * cn - zz * sn, p.y + yy, p.z + x * sn + zz * cn);
        c.obj.lookAt(p);
      }
      const bl = c.obj.userData.blink;
      if (bl) bl.material.opacity = Math.sin(t * 3 + i * 1.7) > 0.4 ? 0.95 : 0.15;
    }
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      s.pin.getWorldPosition(s.obj.position);
      s.glow.material.opacity = s.scanned ? 0.55 : 0.6 + 0.4 * Math.sin(t * 3 + i);
    }
    siteTimer -= dt;
    if (siteTimer <= 0) { siteTimer = 2; attachSites(); }
  }

  function siteNear(pos, bodyId) {
    let best = null, bd = Infinity;
    sites.forEach(function (s) {
      if (s.body !== bodyId) return;
      const d = pos.distanceTo(s.obj.position);
      if (d < bd) { bd = d; best = s; }
    });
    return best ? { site: best, dist: bd } : null;
  }

  function init() {
    initCraft();
    attachSites();
  }

  return { init: init, update: update, siteNear: siteNear, crafts: function () { return crafts; }, sites: function () { return sites; } };
})();
