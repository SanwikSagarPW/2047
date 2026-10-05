window.G = window.G || {};

// Batched, seeded world generation around the explorer. Earth's starting point is home sector 00:00.
// Real moons are charted from Wikidata when you approach their planet; asteroids, comets and probes
// are generated per sector, and landmark objects are real bodies with live Wikipedia knowledge.
G.Sectors = (function () {
  const U = G.utils;
  const S = 200;
  const RADIUS = 1, UNLOAD = 2;
  const sectors = {};
  const queue = [];
  let root = null, timer = 0, buildTimer = 0;
  const anomalies = [];
  const moonsDone = {};
  let geoCache = {}, matCache = {};

  const MOON_CATALOG = {
    mars: { qid: 'Q111', moons: [['Phobos', 11, 'Phobos (moon)', '#8a7a6a'], ['Deimos', 6, 'Deimos (moon)', '#9a8a7a']] },
    jupiter: { qid: 'Q319', moons: [['Io', 1822, 'Io (moon)', '#e8d36a'], ['Europa', 1561, 'Europa (moon)', '#d8cbb8'], ['Ganymede', 2634, 'Ganymede (moon)', '#9a8f80'], ['Callisto', 2410, 'Callisto (moon)', '#6a6258']] },
    saturn: { qid: 'Q193', moons: [['Enceladus', 252, 'Enceladus', '#f4f8ff'], ['Dione', 561, 'Dione (moon)', '#d0ccc4'], ['Rhea', 764, 'Rhea (moon)', '#c8c4bc'], ['Titan', 2575, 'Titan (moon)', '#d9a24a'], ['Iapetus', 735, 'Iapetus (moon)', '#8a7a68']] },
    uranus: { qid: 'Q324', moons: [['Miranda', 236, 'Miranda (moon)', '#b0aca8'], ['Ariel', 579, 'Ariel (moon)', '#c8c4c0'], ['Umbriel', 585, 'Umbriel (moon)', '#706a66'], ['Titania', 789, 'Titania (moon)', '#b8b0a8'], ['Oberon', 761, 'Oberon (moon)', '#a09890']] },
    neptune: { qid: 'Q332', moons: [['Proteus', 210, 'Proteus (moon)', '#7a7672'], ['Triton', 1353, 'Triton (moon)', '#d8c8c0'], ['Nereid', 170, 'Nereid (moon)', '#8a8682']] },
    pluto: { qid: 'Q339', moons: [['Charon', 606, 'Charon (moon)', '#a8a098'], ['Nix', 25, 'Nix (moon)', '#c0bcb8'], ['Hydra', 25, 'Hydra (moon)', '#c0bcb8']] }
  };

  // Real minor bodies placed at fixed points in the belts.
  const LANDMARKS = [
    { id: 'lm_vesta', name: 'Vesta', title: '4 Vesta', type: 'ASTEROID', r: 362, a: 1.1, size: 3.2, color: 0x9a8c7c },
    { id: 'lm_pallas', name: 'Pallas', title: '2 Pallas', type: 'ASTEROID', r: 372, a: 2.9, size: 3.0, color: 0x6e6a66 },
    { id: 'lm_hygiea', name: 'Hygiea', title: '10 Hygiea', type: 'ASTEROID', r: 384, a: 4.6, size: 2.6, color: 0x4a4644 },
    { id: 'lm_psyche', name: 'Psyche', title: '16 Psyche', type: 'METAL ASTEROID', r: 352, a: 5.6, size: 2.2, color: 0xb0b4ba, metal: true },
    { id: 'lm_haumea', name: 'Haumea', title: 'Haumea', type: 'DWARF PLANET', r: 778, a: 0.4, size: 3.4, color: 0xe8eef4 },
    { id: 'lm_makemake', name: 'Makemake', title: 'Makemake', type: 'DWARF PLANET', r: 792, a: 3.4, size: 3.4, color: 0xc89070 },
    { id: 'lm_arrokoth', name: 'Arrokoth', title: '486958 Arrokoth', type: 'KUIPER BELT OBJECT', r: 748, a: 5.1, size: 2.0, color: 0xb06a50 },
    { id: 'lm_halley', name: "Halley's Comet", title: "Halley's Comet", type: 'COMET', r: 470, a: 3.9, size: 1.8, color: 0xcfe6ff, comet: true },
    { id: 'lm_voyager', name: 'Voyager Memorial Beacon', title: 'Voyager program', type: 'HISTORIC PROBE', r: 300, a: 4.3, size: 1, probe: true }
  ];

  const KINDS = {
    asteroid_c: { name: 'C-type asteroid', type: 'CARBONACEOUS ASTEROID', title: 'C-type asteroid', color: 0x3c3836,
      obs: 'A dark, carbon-rich rock. Its surface reflects very little sunlight.', tags: ['carbon', 'primitive', 'dark'] },
    asteroid_s: { name: 'S-type asteroid', type: 'STONY ASTEROID', title: 'S-type asteroid', color: 0x8a7a66,
      obs: 'A stony asteroid made of silicate minerals and some nickel-iron.', tags: ['silicate', 'stony', 'bright'] },
    asteroid_m: { name: 'M-type asteroid', type: 'METALLIC ASTEROID', title: 'M-type asteroid', color: 0xa0a6ae, metal: true,
      obs: 'A metal-rich body that glints in sunlight. It may be the core of a shattered protoplanet.', tags: ['iron', 'nickel', 'metal'] },
    ice_body: { name: 'Icy body', type: 'ICE FRAGMENT', title: 'Kuiper belt', color: 0xcfe2f2,
      obs: 'A frozen chunk of water, methane and nitrogen ice from the cold outer Solar System.', tags: ['ice', 'outer system', 'frozen'] },
    comet: { name: 'Comet', type: 'COMET', title: 'Comet', color: 0xcfe6ff, comet: true,
      obs: 'An icy nucleus. Sunlight is boiling ice into a glowing coma and a tail that always points away from the Sun.', tags: ['ice', 'coma', 'tail'] },
    probe: { name: 'Derelict probe', type: 'SPACE DEBRIS', title: 'Space debris', color: 0xd9a441, probe: true,
      obs: 'An old, silent spacecraft drifting in the dark. Its solar panels are pitted by micrometeoroids.', tags: ['spacecraft', 'debris', 'history'] }
  };

  // Real objects for the endless interstellar sectors. Wikidata adds hundreds more when online.
  const REAL_OFFLINE = [
    ['Vega', 'Vega', 'star'], ['Sirius B', 'Sirius B', 'star'], ['Polaris', 'Polaris', 'star'], ['Tau Ceti', 'Tau Ceti', 'star'],
    ['Epsilon Eridani', 'Epsilon Eridani', 'star'], ['Altair', 'Altair', 'star'], ['Deneb', 'Deneb', 'star'], ['Rigel', 'Rigel', 'star'],
    ['Antares', 'Antares', 'star'], ['Aldebaran', 'Aldebaran', 'star'], ['Arcturus', 'Arcturus', 'star'], ['Capella', 'Capella', 'star'],
    ['Wolf 359', 'Wolf 359', 'star'], ['Ross 128', 'Ross 128', 'star'], ['Gliese 581', 'Gliese 581', 'star'], ['Kepler-452b', 'Kepler-452b', 'exo'],
    ['Kepler-186f', 'Kepler-186f', 'exo'], ['51 Pegasi b', '51 Pegasi b', 'exo'], ['HD 209458 b', 'HD 209458 b', 'exo'], ['TOI-700 d', 'TOI-700 d', 'exo'],
    ['K2-18b', 'K2-18b', 'exo'], ['55 Cancri e', '55 Cancri e', 'exo'], ['WASP-12b', 'WASP-12b', 'exo'], ['Kepler-22b', 'Kepler-22b', 'exo'],
    ['Pleiades', 'Pleiades', 'cluster'], ['Crab Nebula', 'Crab Nebula', 'nebula'], ['Ring Nebula', 'Ring Nebula', 'nebula'], ['Eagle Nebula', 'Eagle Nebula', 'nebula'],
    ['Helix Nebula', 'Helix Nebula', 'nebula'], ['Horsehead Nebula', 'Horsehead Nebula', 'nebula'], ['Large Magellanic Cloud', 'Large Magellanic Cloud', 'galaxy'],
    ['Triangulum Galaxy', 'Triangulum Galaxy', 'galaxy'], ['Whirlpool Galaxy', 'Whirlpool Galaxy', 'galaxy'], ['Sombrero Galaxy', 'Sombrero Galaxy', 'galaxy'],
    ['Omega Centauri', 'Omega Centauri', 'cluster'], ['Cygnus X-1', 'Cygnus X-1', 'blackhole'], ['Crab Pulsar', 'Crab Pulsar', 'star']
  ].map(function (r) { return { name: r[0], title: r[1], kind: r[2] }; });
  let realPool = REAL_OFFLINE.slice();
  const REAL_TYPES = {
    star: ['STAR', 'A real star with its own Wikipedia entry. Scan it to hear what astronomers know.'],
    exo: ['EXOPLANET', 'A real planet orbiting another star, discovered by astronomers on Earth.'],
    galaxy: ['GALAXY', 'A real galaxy: billions of stars held together by gravity.'],
    nebula: ['NEBULA', 'A real cloud of glowing gas and dust in space.'],
    cluster: ['STAR CLUSTER', 'A real group of stars that formed together.'],
    blackhole: ['BLACK HOLE SYSTEM', 'A real place where gravity is so strong that not even light escapes.']
  };

  function init() {
    root = new THREE.Group();
    G.World.scene.add(root);
    G.Codex.realObjects().then(function (list) { if (list && list.length) realPool = REAL_OFFLINE.concat(list); });
    for (const k in KINDS) {
      const d = KINDS[k];
      G.Scanner.register(k, {
        name: d.name, type: d.type, observation: d.obs, tags: d.tags, knowledgeId: null, codex: d.title, xp: 10,
        kora: 'Scanning a ' + d.name.toLowerCase() + '. I am pulling the latest science on these from the deep space network.'
      });
    }
    LANDMARKS.forEach(function (l) {
      l.pos = new THREE.Vector3(Math.cos(l.a) * l.r, (l.r % 7) - 3, Math.sin(l.a) * l.r);
      G.Scanner.register(l.id, {
        name: l.name, type: l.type, observation: 'A real Solar System object. Live data is loading from Wikipedia...', tags: ['real object', l.type.toLowerCase()],
        knowledgeId: null, codex: l.title, xp: 30, kora: 'This is ' + l.name + ', a real object. Let me fetch what scientists know about it.'
      });
      G.Codex.summary(l.title).then(function (d) {
        if (!d) return;
        const info = G.Scanner.infoFor(l.id);
        info.observation = G.Codex.shortText(d.extract, 2);
        info.kora = G.Codex.shortText(d.extract, 3);
      });
    });
  }

  function key(sx, sz) { return sx + ':' + sz; }
  function sectorOf(pos) {
    const h = G.World.home;
    return { sx: Math.floor((pos.x - h.x) / S + 0.5), sz: Math.floor((pos.z - h.z) / S + 0.5) };
  }
  function fmt(n) { return (n >= 0 ? '+' : '-') + String(Math.abs(n)).padStart(2, '0'); }
  function label(pos) { const s = sectorOf(pos); return fmt(s.sx) + ':' + fmt(s.sz); }

  function geo(kind, seed) {
    const k = kind + (seed % 3);
    if (!geoCache[k]) geoCache[k] = G.World.rockGeometry(seed % 3 + 11, 2);
    return geoCache[k];
  }
  function mat(color, metal) {
    const k = color + ':' + !!metal;
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial({ color: color, roughness: metal ? 0.35 : 0.95, metalness: metal ? 0.85 : 0.05, flatShading: true });
    return matCache[k];
  }

  function realMesh(kind, size, seed) {
    const g = new THREE.Group(), rnd = U.mulberry32(seed);
    const STAR_COLS = [0x9bb0ff, 0xcad7ff, 0xf8f7ff, 0xfff4ea, 0xffd2a1, 0xffb36b, 0xff8a4a];
    if (kind === 'star' || kind === 'blackhole') {
      const col = kind === 'blackhole' ? 0x000000 : STAR_COLS[Math.floor(rnd() * STAR_COLS.length)];
      g.add(new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), new THREE.MeshBasicMaterial({ color: col })));
      const glowCol = kind === 'blackhole' ? 0xff9a40 : col;
      g.add(G.World.glowSprite(glowCol, size * 7, 0.55));
      g.add(G.World.glowSprite(0xffffff, size * 2.6, kind === 'blackhole' ? 0.15 : 0.45));
    } else if (kind === 'exo') {
      const col = new THREE.Color().setHSL(rnd(), 0.45, 0.45);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.9 })));
      g.add(G.World.glowSprite(col.getHex(), size * 4, 0.3));
      const star = G.World.glowSprite(STAR_COLS[Math.floor(rnd() * STAR_COLS.length)], size * 6, 0.8);
      star.position.set(size * 9, size * 2, -size * 6);
      g.add(star);
    } else {
      const tints = kind === 'galaxy' ? [0xffe0b0, 0x9fc0ff] : kind === 'cluster' ? [0xcfe0ff, 0xffffff] : [[0xff5aa0, 0x7a5aff], [0x5aaaff, 0x3a6aff], [0xffaa5a, 0xff5a3a]][Math.floor(rnd() * 3)];
      const n = kind === 'cluster' ? 14 : 6;
      for (let i = 0; i < n; i++) {
        const s = G.World.glowSprite(tints[i % 2], size * (kind === 'cluster' ? 0.9 + rnd() : 2.5 + rnd() * 3), kind === 'cluster' ? 0.9 : 0.4);
        s.position.set((rnd() - 0.5) * size * 4, (rnd() - 0.5) * size * (kind === 'galaxy' ? 0.6 : 2.5), (rnd() - 0.5) * size * 4);
        g.add(s);
      }
      if (kind === 'galaxy') g.add(G.World.glowSprite(0xfff0c8, size * 2.2, 0.9));
    }
    return g;
  }

  function makeReal(sec, cx, cz, seed, rnd) {
    const o = realPool[seed % realPool.length];
    const id = 'real_' + o.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (anomalies.some(function (a) { return a.id === id; })) return;
    const T = REAL_TYPES[o.kind] || REAL_TYPES.star;
    G.Scanner.register(id, {
      name: o.name, type: T[0], observation: T[1] + ' Live data loading...', tags: ['real object', T[0].toLowerCase()],
      knowledgeId: null, codex: o.title, xp: 30, kora: 'This is ' + o.name + ', a real ' + T[0].toLowerCase() + '. Let me fetch what scientists know about it.'
    });
    const size = o.kind === 'star' ? 4 + rnd() * 6 : o.kind === 'exo' ? 3 + rnd() * 3 : 10 + rnd() * 8;
    const pos = new THREE.Vector3(cx + (rnd() - 0.5) * S * 0.7, (rnd() - 0.5) * 40, cz + (rnd() - 0.5) * S * 0.7);
    const a = addAnomaly(sec, { real: o, type: T[0] }, id, id, o.name, pos, size, seed);
    a.real = o; a.type = T[0]; a.hud = 420; a.surface = size; a.spin = 0.02;
    if (o.kind === 'star' || o.kind === 'exo' || o.kind === 'blackhole') a.solid = size + 2;
    G.Codex.summary(o.title).then(function (d) {
      if (!d) return;
      const info = G.Scanner.infoFor(id);
      info.observation = G.Codex.shortText(d.extract, 2);
      info.kora = G.Codex.shortText(d.extract, 3);
      if (d.description) { a.type = d.description.toUpperCase().slice(0, 40); info.type = a.type; }
    });
  }

  function makeAnomalyMesh(d, size, seed) {
    const g = new THREE.Group();
    if (d.real) return realMesh(d.real.kind, size, seed);
    if (d.probe) {
      const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 0.3 });
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10), gold));
      const dish = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 8, 0, Math.PI * 2, 0, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide }));
      dish.rotation.x = Math.PI;
      dish.position.y = 1.4;
      g.add(dish);
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6, 4), gold);
      boom.rotation.z = Math.PI / 2;
      g.add(boom);
      const light = G.World.glowSprite(0xff4060, 2, 1);
      light.position.x = 3;
      g.add(light);
      g.userData.blink = light;
    } else {
      const rock = new THREE.Mesh(geo(d.comet ? 'comet' : 'rock', seed), mat(d.color, d.metal));
      rock.scale.setScalar(size);
      g.add(rock);
      if (d.comet) {
        g.add(G.World.glowSprite(0xbfeaff, size * 7, 0.3));
        if (!matCache.tail) {
          const c = U.makeCanvas(64, 256), x = c.getContext('2d');
          const lg = x.createLinearGradient(0, 0, 0, 256);
          lg.addColorStop(0, 'rgba(200,240,255,0.9)'); lg.addColorStop(0.3, 'rgba(120,200,255,0.35)'); lg.addColorStop(1, 'rgba(80,160,255,0)');
          x.fillStyle = lg; x.fillRect(0, 0, 64, 256);
          x.globalCompositeOperation = 'destination-in';
          const rg = x.createLinearGradient(0, 0, 64, 0);
          rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.5, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = rg; x.fillRect(0, 0, 64, 256);
          matCache.tail = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        }
        const tail = new THREE.Group();
        for (let k = 0; k < 2; k++) {
          const pl = new THREE.Mesh(new THREE.PlaneGeometry(size * 9, size * 55), matCache.tail);
          pl.geometry.translate(0, -size * 27, 0);
          pl.rotation.y = k * Math.PI / 2;
          tail.add(pl);
        }
        g.add(tail);
        g.userData.tail = tail;
      }
    }
    return g;
  }

  function addAnomaly(sec, d, kind, id, name, pos, size, seed) {
    const obj = makeAnomalyMesh(d, size, seed);
    obj.position.copy(pos);
    obj.rotation.set(seed % 7, seed % 5, 0);
    root.add(obj);
    if (obj.userData.tail) {
      const away = pos.clone().normalize();
      obj.userData.tail.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), away);
      obj.userData.tail.quaternion.premultiply(obj.quaternion.clone().invert());
    }
    const a = {
      obj: obj, id: id, kind: kind, name: name, radius: size * 2, orbit: true,
      scanned: G.Save.isPoiScanned('orbit', id), spin: d.comet ? 0 : 0.05 + (seed % 10) / 60, type: d.type || (KINDS[kind] && KINDS[kind].type)
    };
    sec.anoms.push(a);
    anomalies.push(a);
    return a;
  }

  function build(sx, sz) {
    const k = key(sx, sz);
    if (sectors[k]) return;
    const h = G.World.home;
    const cx = h.x + sx * S, cz = h.z + sz * S;
    const seed = ((sx * 73856093) ^ (sz * 19349663) ^ 2047) >>> 0;
    const rnd = U.mulberry32(seed);
    const sec = { key: k, sx: sx, sz: sz, group: new THREE.Group(), anoms: [] };
    const dSun = Math.hypot(cx, cz);
    const belt = dSun > 300 && dSun < 430;
    const kuiper = dSun > 680 && dSun <= 1000;
    const interstellar = dSun > 1000;

    const nRocks = dSun < 120 ? 0 : (interstellar ? 3 : 10 + (belt ? 70 : 0) + (kuiper ? 50 : 0));
    if (nRocks) {
      const inst = new THREE.InstancedMesh(geo('field', seed), mat(kuiper ? 0xb8c8d6 : 0x6e655c, false), nRocks);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
      for (let i = 0; i < nRocks; i++) {
        p.set(cx + (rnd() - 0.5) * S, (rnd() - 0.5) * 50, cz + (rnd() - 0.5) * S);
        e.set(rnd() * 6, rnd() * 6, rnd() * 6); q.setFromEuler(e);
        const s = 0.15 + Math.pow(rnd(), 3) * 1.6;
        sc.set(s, s * (0.6 + rnd() * 0.5), s);
        m.compose(p, q, sc);
        inst.setMatrixAt(i, m);
      }
      sec.group.add(inst);
    }

    if (dSun > 110) {
      const count = Math.hypot(cx - h.x, cz - h.z) < 150 ? 0 : (interstellar ? (rnd() < 0.18 ? 1 : 0) : (rnd() < 0.55 ? 1 : (rnd() < 0.5 ? 2 : 0)));
      for (let i = 0; i < count; i++) {
        let kind;
        const r = rnd();
        if (kuiper || interstellar) kind = r < 0.6 ? 'ice_body' : (r < 0.85 ? 'comet' : 'probe');
        else if (belt) kind = r < 0.4 ? 'asteroid_c' : (r < 0.75 ? 'asteroid_s' : (r < 0.92 ? 'asteroid_m' : 'comet'));
        else kind = r < 0.3 ? 'asteroid_s' : (r < 0.5 ? 'asteroid_c' : (r < 0.72 ? 'comet' : (r < 0.88 ? 'probe' : 'asteroid_m')));
        const d = KINDS[kind];
        const pos = new THREE.Vector3(cx + (rnd() - 0.5) * S * 0.8, (rnd() - 0.5) * 30, cz + (rnd() - 0.5) * S * 0.8);
        const desig = '2047 ' + String.fromCharCode(65 + (seed % 26)) + String.fromCharCode(65 + ((seed >> 5) % 26)) + '-' + (seed % 97 + i);
        addAnomaly(sec, d, kind, 'sec_' + k + '_' + i, desig + ' (' + d.name + ')', pos, 1.2 + rnd() * 2.2, seed + i);
      }
    }

    if (interstellar && rnd() < 0.65) makeReal(sec, cx, cz, seed, rnd);

    LANDMARKS.forEach(function (l) {
      const s = sectorOf(l.pos);
      if (s.sx === sx && s.sz === sz) {
        const d = { type: l.type, color: l.color, metal: l.metal, comet: l.comet, probe: l.probe };
        const a = addAnomaly(sec, d, l.id, l.id, l.name, l.pos, l.size, 3);
        a.landmark = l;
      }
    });

    root.add(sec.group);
    sectors[k] = sec;
    const st = G.Save.get();
    st.sectors = st.sectors || {};
    if (!st.sectors[k]) {
      st.sectors[k] = 1;
      sec.anoms.forEach(function (a) {
        if (a.landmark) {
          G.UI.notify('Landmark charted: ' + a.name, 'info');
          G.Codex.summary(a.landmark.title).then(function (d) {
            if (d) G.UI.koraSay('Long-range sensors found ' + a.name + '. ' + G.Codex.shortText(d.extract, 1));
          });
        }
      });
    }
  }

  function unload(sec) {
    root.remove(sec.group);
    sec.group.traverse(function (o) { if (o.isInstancedMesh) o.dispose && o.dispose(); });
    sec.anoms.forEach(function (a) {
      root.remove(a.obj);
      const i = anomalies.indexOf(a);
      if (i >= 0) anomalies.splice(i, 1);
    });
    delete sectors[sec.key];
  }

  function spawnMoons(planetId) {
    if (moonsDone[planetId]) return;
    moonsDone[planetId] = true;
    const cat = MOON_CATALOG[planetId];
    const parent = G.World.bodies[planetId];
    if (!cat || !parent) return;
    const list = cat.moons.map(function (m) { return { name: m[0], radiusKm: m[1], title: m[2], color: m[3] }; });
    const finish = function (extra) {
      if (extra) {
        extra.forEach(function (m) {
          if (list.length >= 7) return;
          if (m.radiusKm < 80) return;
          if (list.some(function (x) { return x.name === m.name || x.title === m.title; })) return;
          list.push({ name: m.name, radiusKm: m.radiusKm, title: m.title, color: '#9a948c', live: true });
        });
      }
      const pr = parent.def.radius;
      const start = pr * (planetId === 'saturn' ? 2.6 : 2.0) + 12;
      const rnd = U.mulberry32(parent.def.seed + 50);
      let dist = start;
      const names = [];
      list.forEach(function (m, i) {
        const id = 'moon_' + m.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const radius = U.clamp(Math.sqrt(m.radiusKm) / 7, 0.7, 7.5);
        dist += (i ? radius + 7 + pr * 0.3 : 0);
        const def = {
          id: id, name: m.name, type: 'moon', radius: radius, color: m.color, parent: planetId,
          distance: dist, angle: rnd() * Math.PI * 2, speed: 0.6 / Math.sqrt(dist * 10), seed: 300 + i + parent.def.seed,
          wiki: m.title, generated: true, radiusKm: m.radiusKm, incl: (rnd() - 0.5) * 0.08, cratered: true,
          desc: m.name + ' is a natural satellite of ' + parent.def.name + '.'
        };
        dist += radius;
        G.World.addBody(def);
        names.push(m.name);
        G.Scanner.register(id, {
          name: m.name, type: 'MOON OF ' + parent.def.name.toUpperCase(),
          observation: 'Mean radius about ' + Math.round(m.radiusKm) + ' km. Live data loading...', tags: [parent.def.name, 'moon', Math.round(m.radiusKm) + ' km'],
          knowledgeId: null, codex: m.title, xp: 20, kora: m.name + ' orbits ' + parent.def.name + '. Fetching live data now.'
        });
        G.Codex.summary(m.title).then(function (d) {
          if (!d) return;
          def.desc = G.Codex.shortText(d.extract, 2);
          const info = G.Scanner.infoFor(id);
          info.observation = G.Codex.shortText(d.extract, 2);
          info.kora = G.Codex.shortText(d.extract, 3);
        });
      });
      G.UI.notify('Live data: ' + names.length + ' moons of ' + parent.def.name + ' charted', 'info');
      G.UI.koraSay('I have charted ' + names.length + ' real moons around ' + parent.def.name + ' using live astronomy data: ' + names.join(', ') + '. Fly close and press Q to scan them.');
    };
    G.Codex.moonsOf(cat.qid, 10).then(finish, function () { finish(null); });
  }

  function update(dt, pos) {
    if (!root || !root.visible) return;
    timer -= dt;
    if (timer <= 0) {
      timer = 0.5;
      const s = sectorOf(pos);
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        for (let dz = -RADIUS; dz <= RADIUS; dz++) {
          const k = key(s.sx + dx, s.sz + dz);
          if (!sectors[k] && !queue.some(function (q) { return q.k === k; })) queue.push({ k: k, sx: s.sx + dx, sz: s.sz + dz, d: Math.abs(dx) + Math.abs(dz) });
        }
      }
      queue.sort(function (a, b) { return a.d - b.d; });
      for (const k in sectors) {
        const sec = sectors[k];
        if (Math.max(Math.abs(sec.sx - s.sx), Math.abs(sec.sz - s.sz)) > UNLOAD) unload(sec);
      }
      for (const id in MOON_CATALOG) {
        const b = G.World.bodies[id];
        if (b && !moonsDone[id] && pos.distanceTo(b.worldPos) < b.def.radius * 6 + 170) spawnMoons(id);
      }
    }
    buildTimer -= dt;
    if (queue.length && buildTimer <= 0) {
      const q = queue.shift();
      build(q.sx, q.sz);
      buildTimer = 0.08;
    }
    for (let i = 0; i < anomalies.length; i++) {
      const a = anomalies[i];
      a.obj.rotation.y += dt * a.spin;
      if (a.obj.userData.blink) a.obj.userData.blink.material.opacity = Math.sin(G.World.time * 4 + i) > 0.5 ? 1 : 0.1;
    }
  }

  function nearestAnomaly(pos, maxDist) {
    let best = null, bs = Infinity, bd = 0;
    for (let i = 0; i < anomalies.length; i++) {
      const a = anomalies[i];
      const d = pos.distanceTo(a.obj.position) - (a.surface || 0);
      const lim = a.scanRange ? Math.max(maxDist, a.scanRange) : maxDist;
      if (d >= lim || (a.range && d >= a.range)) continue;
      const score = a.deep ? d - 1e5 : d;
      if (score < bs) { bs = score; bd = d; best = a; }
    }
    return best ? { poi: best, dist: bd } : null;
  }

  function register(a) {
    if (!a.obj.parent) root.add(a.obj);
    anomalies.push(a);
    return a;
  }

  return {
    init: init, update: update, nearestAnomaly: nearestAnomaly, sectorOf: sectorOf, label: label, size: S, register: register,
    anomalies: function () { return anomalies; },
    landmarks: function () { return LANDMARKS; },
    charted: function () { const st = G.Save.get(); return st.sectors ? Object.keys(st.sectors) : []; },
    setVisible: function (v) { if (root) root.visible = v; },
    spawnMoons: spawnMoons,
    homeAU: function (pos) { return pos.distanceTo(G.World.home) / 240; }
  };
})();
