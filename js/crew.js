window.G = window.G || {};

// Crew: astronauts who hand out knowledge cards, station operators who run exams,
// and Fun Pass activities (Space Race, Star Catcher).
G.Crew = (function () {
  const U = G.utils;
  const esc = function (s) { return G.Codex.esc(s == null ? '' : String(s)); };

  const QUOTES = [
    { q: "That's one small step for man, one giant leap for mankind.", by: 'Neil Armstrong', wiki: 'Neil Armstrong' },
    { q: 'We are made of star-stuff.', by: 'Carl Sagan', wiki: 'Carl Sagan' },
    { q: "Poyekhali! (Let's go!)", by: 'Yuri Gagarin', wiki: 'Yuri Gagarin' },
    { q: 'The path from dreams to success does exist.', by: 'Kalpana Chawla', wiki: 'Kalpana Chawla' },
    { q: 'Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.', by: 'A. P. J. Abdul Kalam', wiki: 'A. P. J. Abdul Kalam' },
    { q: "The stars don't look bigger, but they do look brighter.", by: 'Sally Ride', wiki: 'Sally Ride' },
    { q: "Don't let anyone rob you of your imagination, your creativity, or your curiosity.", by: 'Mae Jemison', wiki: 'Mae Jemison' },
    { q: 'Remember to look up at the stars and not down at your feet.', by: 'Stephen Hawking', wiki: 'Stephen Hawking' },
    { q: "Hey sky, take off your hat, I'm on my way!", by: 'Valentina Tereshkova', wiki: 'Valentina Tereshkova' },
    { q: 'Magnificent desolation.', by: 'Buzz Aldrin, on the Moon', wiki: 'Buzz Aldrin' },
    { q: 'Saare Jahan Se Achha \u2014 better than the whole world.', by: 'Rakesh Sharma, describing India from space', wiki: 'Rakesh Sharma' },
    { q: 'Equipped with his five senses, man explores the universe around him and calls the adventure Science.', by: 'Edwin Hubble', wiki: 'Edwin Hubble' },
    { q: 'We choose to go to the Moon... not because they are easy, but because they are hard.', by: 'John F. Kennedy', wiki: 'John F. Kennedy' },
    { q: "Houston, we've had a problem.", by: 'Jim Lovell, Apollo 13', wiki: 'Jim Lovell' },
    { q: 'Earth is the cradle of humanity, but one cannot live in the cradle forever.', by: 'Konstantin Tsiolkovsky', wiki: 'Konstantin Tsiolkovsky' }
  ];
  const LIVE_TOPICS = ['Black hole', 'Neutron star', 'Milky Way', 'Andromeda Galaxy', 'Nebula', 'Supernova', 'Exoplanet',
    'International Space Station', 'Hubble Space Telescope', 'James Webb Space Telescope', 'Aurora', "Halley's Comet",
    'Big Bang', 'Light-year', 'Solar eclipse', 'Mars Orbiter Mission', 'Aditya-L1', 'Gaganyaan', 'Kalpana Chawla',
    'Rakesh Sharma', 'Space Shuttle', 'Pulsar', 'Galaxy', 'Constellation', 'Meteor shower', 'Spacesuit', 'Rocket'];
  const NAMES = ['Cmdr. Aisha Rao', 'Lt. Mateo Silva', 'Dr. Lin Wei', 'Spc. Noah Okafor', 'Dr. Sara Haddad', 'Capt. Arjun Mehta',
    'Eng. Yuki Tanaka', 'Dr. Elena Petrova', 'Pilot Kofi Mensah', 'Dr. Maya Cohen', 'Spc. Leo Fischer', 'Cmdr. Zara Ahmed',
    'Dr. Ravi Iyer', 'Lt. Chloe Martin', 'Eng. Omar Farouk', 'Dr. Ana Souza'];
  const SUITS = [0xff8a3d, 0x38e1ff, 0x4cf0a0, 0xff4fb8, 0xffd23c, 0x8f7bff];
  const HELLO = [
    "Hey there, Explorer! I've been studying {p} all day. Want one of my knowledge cards?",
    'Whoa, a visitor! Welcome to {p}. I have a card with a real space fact for you!',
    'Hello from {p}! Explorers share what they learn. Here, this card is for you!',
    "Greetings, Cadet! Every card holds a fact from Earth's science libraries. Take this one!",
    'Great flying! Scientists share discoveries so everyone can learn. Here is my card.'
  ];
  const OPERATORS = {
    terra_gate: { name: 'Cmdr. Priya Nair' }, selene_junction: { name: 'Dr. Hiro Sato' },
    ares_relay: { name: 'Lt. Fatima Zahra' }, galileo_gate: { name: 'Capt. Lucas Moreau' },
    cassini_ring: { name: 'Dr. Amina Diallo' }, odyssey_post: { name: 'Cmdr. Erik Lindqvist' }
  };
  const SPACE_BODIES = ['earth', 'moon', 'mars', 'venus', 'mercury', 'jupiter', 'saturn', 'ceres'];
  const RARITY = ['common', 'rare', 'epic'];

  G.BADGES.push(
    { id: 'card_collector', name: 'Card Collector', desc: 'Collect 5 knowledge cards from astronauts', icon: G.Icon('card') },
    { id: 'card_master', name: 'Card Master', desc: 'Collect 20 knowledge cards', icon: G.Icon('trophy') },
    { id: 'space_racer', name: 'Space Racer', desc: 'Finish a Space Race through every gate', icon: G.Icon('flag') },
    { id: 'star_catcher', name: 'Star Catcher', desc: 'Score 40 or more in Star Catcher', icon: '&#11088;' },
    { id: 'egg_greenman', name: 'GreenMan Found', desc: 'Found the secret explorer hiding on Mars', icon: G.Icon('alien'), secret: true },
    { id: 'egg_code', name: 'Secret Code', desc: "Typed the creator's secret code", icon: G.Icon('key'), secret: true },
    { id: 'egg_logo', name: 'Hologram Hacker', desc: 'Found the hidden hologram message', icon: G.Icon('crystal'), secret: true },
    { id: 'egg_kora', name: "KORA's Secret", desc: 'Asked KORA about her creator', icon: G.Icon('robot'), secret: true },
    { id: 'egg_catch', name: 'Green Bonus', desc: 'Caught GreenMan in Star Catcher', icon: G.Icon('clover'), secret: true }
  );
  Object.keys(G.STATIONS).forEach(function (sid) {
    G.BADGES.push({ id: 'cert_' + sid, name: G.STATIONS[sid].name + ' Certified', desc: 'Pass the operator exam at ' + G.STATIONS[sid].name, icon: G.Icon('ribbon') });
  });

  let crew = [], surfGroup = null, spaceGroup = null, t = 0, introSpace = false;

  function S() {
    const st = G.Save.get();
    if (!st.crew) st.crew = { met: {}, cards: {}, passes: 1, raceBest: 0, catchBest: 0, exams: {}, intro: {} };
    return st.crew;
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function award(id) {
    if (!G.Save.awardBadge(id)) return;
    const b = G.BADGES.find(function (x) { return x.id === id; });
    if (b) { G.UI.discoveryToast('Badge Earned', b.name); G.Audio.play('badge'); }
    G.Journal.refresh();
  }

  // ---------- 3D astronaut ----------
  let cardTex = null, glowTex = null;
  function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function cardTexture() {
    if (cardTex) return cardTex;
    const c = document.createElement('canvas'); c.width = 128; c.height = 180;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#ffd27a'); g.addColorStop(1, '#ff962a');
    x.fillStyle = g; rrect(x, 4, 4, 120, 172, 14); x.fill();
    x.lineWidth = 5; x.strokeStyle = '#fff6dc'; rrect(x, 12, 12, 104, 156, 10); x.stroke();
    x.fillStyle = '#3a1e00'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 72px sans-serif'; x.fillText('\u2726', 64, 80);
    x.font = 'bold 20px sans-serif'; x.fillText('2047', 64, 146);
    cardTex = new THREE.CanvasTexture(c);
    return cardTex;
  }
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glowTex = new THREE.CanvasTexture(c);
    return glowTex;
  }

  function visorTexture(tintHex) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#0d1626'); g.addColorStop(0.5, tintHex || '#d98a1a'); g.addColorStop(0.52, '#3a2a14'); g.addColorStop(1, '#7a5a2a');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const s = x.createRadialGradient(40, 36, 0, 40, 36, 34);
    s.addColorStop(0, 'rgba(255,255,255,0.95)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = s; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 3; x.beginPath(); x.arc(64, 70, 54, Math.PI * 1.1, Math.PI * 1.55); x.stroke();
    return new THREE.CanvasTexture(c);
  }
  function patchTexture(kind, text, color) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 48;
    const x = c.getContext('2d');
    if (kind === 'name') {
      x.fillStyle = '#f4f6fa'; rrect(x, 2, 2, 124, 44, 6); x.fill();
      x.fillStyle = '#10223c'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, 64, 26, 116);
    } else {
      x.fillStyle = '#10223c'; rrect(x, 2, 2, 124, 44, 8); x.fill();
      x.strokeStyle = color; x.lineWidth = 3; rrect(x, 5, 5, 118, 38, 6); x.stroke();
      x.fillStyle = color; x.beginPath(); x.arc(30, 24, 11, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('2047', 52, 25);
    }
    return new THREE.CanvasTexture(c);
  }

  function makeAstronaut(color, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const variant = opts.variant || 'eva';
    const suitHex = opts.suit || (variant === 'orange' ? 0xff7a1a : variant === 'blue' ? 0x6fa8e8 : 0xe9edf3);
    const suit = new THREE.MeshStandardMaterial({ color: suitHex, roughness: 0.78, metalness: 0.02 });
    const suit2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(suitHex).multiplyScalar(0.86), roughness: 0.85 });
    const joint = new THREE.MeshStandardMaterial({ color: 0x4d5663, roughness: 0.45, metalness: 0.55 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x1f242b, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.4, roughness: 0.4 });
    const visor = new THREE.MeshStandardMaterial({ map: visorTexture(opts.visor ? '#27d868' : '#d98a1a'), color: 0xffffff, metalness: 0.9, roughness: 0.08, emissive: 0x222222 });
    const lamp = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
    function add(parent, geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; }
    const body = new THREE.Group(); g.add(body);
    // torso: tapered hard-upper-torso with shoulder bearings and a belted waist
    add(body, new THREE.CylinderGeometry(0.46, 0.38, 0.95, 22), suit, 0, 1.58, 0).scale.z = 0.76;
    add(body, new THREE.CylinderGeometry(0.4, 0.4, 0.22, 20), suit2, 0, 1.0, 0).scale.z = 0.8;
    add(body, new THREE.TorusGeometry(0.39, 0.05, 8, 24), joint, 0, 1.12, 0).rotation.x = Math.PI / 2;
    add(body, new THREE.CylinderGeometry(0.4, 0.4, 0.07, 20), accent, 0, 1.17, 0).scale.z = 0.8;
    add(body, new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), suit, 0, 2.02, 0).scale.set(1, 0.34, 0.76);
    // chest control unit with status lights and a small screen
    const cu = add(body, new THREE.BoxGeometry(0.4, 0.28, 0.1), joint, 0, 1.55, 0.31);
    cu.rotation.x = -0.08;
    add(body, new THREE.BoxGeometry(0.26, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0x38e1ff }), 0, 1.6, 0.37);
    [0xff4f6d, 0x4cf0a0, 0xffb43c, 0x38e1ff].forEach(function (c, i) { add(body, new THREE.BoxGeometry(0.05, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: c }), -0.13 + i * 0.087, 1.48, 0.37); });
    // patches: flag-style mission patch on the left shoulder, name tag on the chest
    add(body, new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshBasicMaterial({ map: patchTexture('name', (opts.name || 'EXPLORER').split(' ').pop().toUpperCase()) }), 0.18, 1.82, 0.355).rotation.x = -0.12;
    add(body, new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshBasicMaterial({ map: patchTexture('mission', '', css(color)) }), -0.4, 1.9, 0.2).rotation.y = -0.9;
    // stripes on the torso like EVA suit identification bands
    add(body, new THREE.CylinderGeometry(0.455, 0.44, 0.06, 22), accent, 0, 1.3, 0).scale.z = 0.765;
    // life-support backpack (PLSS) with tanks, hoses and a blinking beacon
    add(body, new THREE.BoxGeometry(0.8, 1.02, 0.44), suit2, 0, 1.64, -0.5);
    add(body, new THREE.BoxGeometry(0.84, 0.12, 0.48), suit, 0, 2.14, -0.5);
    add(body, new THREE.BoxGeometry(0.5, 0.3, 0.05), joint, 0, 1.52, -0.74);
    add(body, new THREE.BoxGeometry(0.34, 0.06, 0.03), accent, 0, 1.8, -0.745);
    [-0.22, 0.22].forEach(function (x) { add(body, new THREE.CylinderGeometry(0.1, 0.1, 0.62, 12), joint, x, 1.45, -0.78); add(body, new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), joint, x, 1.76, -0.78); });
    add(body, new THREE.CylinderGeometry(0.014, 0.014, 0.62, 4), joint, 0.3, 2.46, -0.58);
    const antTip = add(body, new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4f6d }), 0.3, 2.78, -0.58);
    const hoseL = add(body, new THREE.TorusGeometry(0.3, 0.03, 6, 16, Math.PI * 0.9), rubber, -0.2, 1.98, 0.02);
    hoseL.rotation.set(0.1, Math.PI / 2, 0.2);
    // helmet: outer shell, gold-tinted reflective visor, rim ring, lamps and camera
    const head = new THREE.Group(); head.position.set(0, 2.42, 0.02); body.add(head);
    add(head, new THREE.SphereGeometry(0.47, 28, 20), suit, 0, 0, 0);
    const vs = add(head, new THREE.SphereGeometry(0.4, 28, 20, 0, Math.PI * 2, 0, Math.PI), visor, 0, 0.01, 0.15);
    vs.scale.set(1.05, 0.84, 0.86); vs.rotation.y = 0;
    add(head, new THREE.TorusGeometry(0.4, 0.04, 8, 32), joint, 0, 0.0, 0.2).scale.set(1.05, 0.88, 1);
    add(head, new THREE.TorusGeometry(0.34, 0.07, 8, 24), joint, 0, -0.41, 0).rotation.x = Math.PI / 2;
    add(head, new THREE.BoxGeometry(0.34, 0.05, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), 0, 0.42, 0.18);
    [-1, 1].forEach(function (s) {
      add(head, new THREE.SphereGeometry(0.05, 8, 6), lamp, 0.43 * s, 0.18, 0.12);
      add(head, new THREE.CylinderGeometry(0.1, 0.1, 0.07, 14), joint, 0.46 * s, -0.02, -0.02).rotation.z = Math.PI / 2;
    });
    add(head, new THREE.BoxGeometry(0.12, 0.1, 0.16), joint, 0.34, 0.3, 0.1);
    add(head, new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), new THREE.MeshBasicMaterial({ color: 0x0b0b0b }), 0.34, 0.3, 0.19).rotation.x = Math.PI / 2;
    // legs: hip -> thigh -> knee -> shin -> boot so they can really walk
    const legsArr = [], knees = [];
    [-0.2, 0.2].forEach(function (x) {
      const hip = new THREE.Group(); hip.position.set(x, 1.0, 0); body.add(hip);
      add(hip, new THREE.SphereGeometry(0.17, 12, 8), suit2, 0, 0, 0);
      add(hip, new THREE.CylinderGeometry(0.175, 0.16, 0.5, 14), suit, 0, -0.27, 0);
      add(hip, new THREE.CylinderGeometry(0.178, 0.178, 0.06, 14), accent, 0, -0.14, 0);
      const knee = new THREE.Group(); knee.position.y = -0.52; hip.add(knee);
      add(knee, new THREE.SphereGeometry(0.16, 12, 8), joint, 0, 0, 0);
      add(knee, new THREE.CylinderGeometry(0.16, 0.15, 0.45, 14), suit, 0, -0.26, 0);
      add(knee, new THREE.TorusGeometry(0.15, 0.04, 6, 14), joint, 0, -0.5, 0).rotation.x = Math.PI / 2;
      add(knee, new THREE.BoxGeometry(0.31, 0.22, 0.52), rubber, 0, -0.62, 0.08);
      add(knee, new THREE.BoxGeometry(0.33, 0.06, 0.55), joint, 0, -0.74, 0.08);
      legsArr.push(hip); knees.push(knee);
    });
    // arms: shoulder -> upper arm -> elbow -> forearm -> glove with fingers
    const elbows = [];
    const arms = [-1, 1].map(function (s) {
      const p = new THREE.Group(); p.position.set(0.56 * s, 1.97, 0); body.add(p);
      add(p, new THREE.SphereGeometry(0.17, 12, 8), suit2, 0, 0, 0);
      add(p, new THREE.CylinderGeometry(0.125, 0.115, 0.42, 12), suit, 0, -0.22, 0);
      const el = new THREE.Group(); el.position.y = -0.45; p.add(el);
      add(el, new THREE.SphereGeometry(0.12, 10, 8), joint, 0, 0, 0);
      add(el, new THREE.CylinderGeometry(0.115, 0.1, 0.36, 12), suit, 0, -0.21, 0);
      add(el, new THREE.TorusGeometry(0.105, 0.035, 6, 12), joint, 0, -0.4, 0).rotation.x = Math.PI / 2;
      add(el, new THREE.SphereGeometry(0.135, 12, 8), accent, 0, -0.52, 0.01);
      add(el, new THREE.BoxGeometry(0.2, 0.1, 0.12), rubber, 0, -0.6, 0.06);
      elbows.push(el);
      return p;
    });
    // floating card marker and highlight ring
    const card = new THREE.Group(); card.position.y = 3.7; g.add(card);
    add(card, new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshBasicMaterial({ map: cardTexture(), transparent: true, side: THREE.DoubleSide }), 0, 0, 0);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: opts.glow || 0xffb43c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(2.2, 2.2, 1); card.add(glow);
    const shadow = add(g, new THREE.CircleGeometry(0.8, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.03, 0);
    shadow.rotation.x = -Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.5, 36), new THREE.MeshBasicMaterial({ color: opts.glow || 0xffb43c, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 40, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc865, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.position.y = 22; g.add(beam);
    g.userData = { armL: arms[0], armR: arms[1], card: card, glow: glow, ring: ring, beam: beam, head: head, body: body, antTip: antTip, shadow: shadow, legs: legsArr, knees: knees, elbows: elbows };
    return g;
  }

  function person(id, extra) {
    const h = hash(id);
    return Object.assign({ id: id, name: NAMES[h % NAMES.length], phase: (h % 100) / 16, color: SUITS[h % SUITS.length] }, extra);
  }

  function clearSurface() {
    crew = crew.filter(function (c) { return !c.surface; });
    if (surfGroup) { G.World.scene.remove(surfGroup); surfGroup = null; }
  }

  function onTerrain(bodyId) {
    clearSurface();
    const b = G.World.bodies[bodyId];
    if (!b) return;
    const def = b.def, gas = G.TERRAINS.isGas(def);
    const rnd = U.mulberry32((def.seed || 7) * 13 + 991);
    surfGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      // First explorer waits just ahead of the landing spot.
      const ang = i === 0 ? (rnd() - 0.5) * 0.8 : rnd() * Math.PI * 2;
      const r = i === 0 ? 30 + rnd() * 10 : 70 + rnd() * 160 + i * 30;
      const x = Math.sin(ang) * r, z = Math.cos(ang) * r;
      const c = person('s_' + bodyId + '_' + i, { surface: true, body: bodyId, place: def.name, role: 'Surface Explorer \u00b7 ' + def.name, hover: gas });
      c.obj = makeAstronaut(c.color, { name: c.name, variant: ['eva', 'eva', 'orange', 'blue'][hash(c.id) % 4] });
      c.obj.scale.setScalar(1.25);
      c.obj.position.set(x, G.World.groundY(x, z) + (gas ? 2.5 : 0), z);
      c.home = { x: x, z: z };
      c.walkA = rnd() * Math.PI * 2;
      c.baseY = c.obj.position.y;
      surfGroup.add(c.obj);
      crew.push(c);
    }
    G.World.scene.add(surfGroup);
    if (bodyId === 'mars') {
      // Easter egg: the creator hides far out in the Martian desert, no light beam.
      const gm = { id: 'greenman', name: 'Commander GreenMan', role: 'Secret Explorer \u00b7 ???', phase: 1.3, color: 0x3cff6e, surface: true, body: bodyId, place: def.name, secret: true };
      gm.obj = makeAstronaut(0x3cff6e, { name: 'GreenMan', suit: 0x4fd67a, visor: 0x2aff6a, glow: 0x3cff6e });
      gm.obj.scale.setScalar(1.25);
      gm.obj.position.set(-330, G.World.groundY(-330, 380), 380);
      gm.baseY = gm.obj.position.y;
      surfGroup.add(gm.obj);
      crew.push(gm);
    }
    const k = S();
    const coached = G.Coach && G.Coach.rover();
    if (!k.intro.surface && !coached) {
      k.intro.surface = true;
      setTimeout(function () {
        G.UI.koraSay('See that amber light beam? That is a fellow astronaut! Drive close and press E to say hello. They share knowledge cards for your collection.');
      }, 7000);
    }
  }

  function buildSpaceCrew() {
    spaceGroup = new THREE.Group();
    Object.keys(G.STATIONS).forEach(function (sid, i) {
      const st = G.World.stations[sid];
      if (!st) return;
      const c = person('eva_' + sid, { place: st.def.name, near: st.def.parent, role: 'Spacewalk Engineer \u00b7 ' + st.def.name });
      c.off = new THREE.Vector3(Math.cos(i * 1.7) * 30, 6, Math.sin(i * 1.7) * 30);
      c.follow = function () { return st.worldPos; };
      crew.push(c);
    });
    SPACE_BODIES.forEach(function (bid, i) {
      const b = G.World.bodies[bid];
      if (!b) return;
      const rnd = U.mulberry32(hash(bid) + 5);
      const a = rnd() * Math.PI * 2, d = b.def.radius * 0.6 + 8;
      const c = person('drift_' + bid, { place: b.def.name, near: bid, role: 'Orbital Scientist \u00b7 ' + b.def.name });
      // Above the orbital plane so drifters never crowd a station's docking zone.
      c.off = new THREE.Vector3(Math.cos(a) * d, (rnd() < 0.5 ? -1 : 1) * (b.def.radius + 26), Math.sin(a) * d);
      c.follow = function () { return b.worldPos; };
      crew.push(c);
    });
    crew.forEach(function (c) {
      if (c.surface) return;
      c.obj = makeAstronaut(c.color, { name: c.name, variant: ['eva', 'eva', 'orange', 'blue'][hash(c.id) % 4] });
      c.obj.scale.setScalar(2.2);
      c.obj.userData.ring.visible = false;
      c.obj.userData.beam.scale.y = 0.6;
      spaceGroup.add(c.obj);
    });
    G.World.scene.add(spaceGroup);
  }

  function playerPos(landed) { return landed ? G.Rover.position() : G.Ship.position(); }

  function update(dt, landed) {
    if (!G.World.isReady()) return;
    if (!spaceGroup) buildSpaceCrew();
    t += dt;
    spaceGroup.visible = !landed;
    const p = playerPos(landed), met = S().met;
    for (let i = 0; i < crew.length; i++) {
      const c = crew[i], o = c.obj, ud = o.userData;
      if (!!c.surface !== !!landed) continue;
      if (c.follow) {
        o.position.copy(c.follow()).add(c.off);
        o.position.y += Math.sin(t * 0.7 + c.phase) * 0.8;
        o.rotation.z = Math.sin(t * 0.4 + c.phase) * 0.25;
      } else if (c.hover) o.position.y = c.baseY + Math.sin(t * 1.4 + c.phase) * 0.4;
      const d = p.distanceTo(o.position);
      // Skip animating and drawing explorers that are far away.
      o.visible = d < (landed ? 520 : 700);
      if (!o.visible) continue;
      // Astronauts outside the camera frustum need no animation; THREE also skips drawing them.
      if (!G.World.inView(o.position, 8)) continue;
      const done = !!met[c.id];
      ud.card.visible = !done;
      ud.beam.visible = !done && !c.secret;
      ud.ring.material.opacity = done ? 0.15 : 0.45 + Math.sin(t * 3 + c.phase) * 0.2;
      ud.card.rotation.y += dt * 2;
      ud.card.position.y = 3.5 + Math.sin(t * 2 + c.phase) * 0.14;
      ud.glow.material.opacity = 0.55 + Math.sin(t * 4 + c.phase) * 0.25;
      ud.antTip.visible = Math.sin(t * 5 + c.phase) > 0;
      ud.body.scale.y = 1 + Math.sin(t * 2 + c.phase) * 0.012;
      const near = d < (landed ? 45 : 70);
      ud.body.position.y = near && !c.follow ? Math.abs(Math.sin(t * 3.2 + c.phase)) * 0.12 : 0;
      ud.head.rotation.y = Math.sin(t * 0.7 + c.phase) * (near ? 0.15 : 0.4);
      ud.head.rotation.x = near ? -0.08 : Math.sin(t * 0.5 + c.phase) * 0.08;
      if (near) {
        const want = Math.atan2(p.x - o.position.x, p.z - o.position.z);
        let diff = want - o.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        o.rotation.y += diff * Math.min(1, dt * 3);
        ud.legs[0].rotation.x = ud.legs[1].rotation.x = 0;
        ud.knees[0].rotation.x = ud.knees[1].rotation.x = 0;
      } else if (c.home && !c.secret) {
        // Patrol a small loop around their spot so the surface feels alive.
        c.walkA += dt * 0.22;
        const wx = c.home.x + Math.cos(c.walkA) * 5, wz = c.home.z + Math.sin(c.walkA) * 5;
        o.position.set(wx, G.World.groundY(wx, wz) + (c.hover ? 2.5 : 0), wz);
        o.rotation.y = Math.atan2(-Math.sin(c.walkA), Math.cos(c.walkA));
        const sw = Math.sin(t * 4.5 + c.phase) * 0.45;
        ud.legs[0].rotation.x = sw; ud.legs[1].rotation.x = -sw;
        ud.knees[0].rotation.x = Math.max(0, -sw) * 1.3; ud.knees[1].rotation.x = Math.max(0, sw) * 1.3;
        ud.armL.rotation.x = -sw * 0.7; ud.armR.rotation.x = sw * 0.7;
        ud.elbows[0].rotation.x = -0.3 - Math.max(0, sw) * 0.5; ud.elbows[1].rotation.x = -0.3 - Math.max(0, -sw) * 0.5;
        ud.body.rotation.y = sw * 0.18;
        ud.body.position.y = Math.abs(Math.sin(t * 4.5 + c.phase)) * 0.06;
      } else if (!c.follow) o.rotation.y += dt * 0.15;
      ud.armR.rotation.z = near ? 2.5 + Math.sin(t * 7 + c.phase) * 0.45 : 0.12 + Math.sin(t + c.phase) * 0.05;
      ud.elbows[1].rotation.x = near ? -0.35 + Math.sin(t * 7 + c.phase) * 0.5 : ud.elbows[1].rotation.x;
      if (near) { ud.armR.rotation.x = 0; ud.body.rotation.y = 0; }
      ud.armL.rotation.z = c.follow ? -0.6 - Math.sin(t * 0.9 + c.phase) * 0.3 : -0.12;
    }
    if (!landed && !introSpace) {
      const ci = interact(p, false, 60);
      if (ci && !S().intro.space) {
        S().intro.space = introSpace = true;
        G.UI.koraSay('An astronaut on a spacewalk! Fly close and press E to say hello. They might have a knowledge card for you.');
      }
    }
    if (G.SurfaceMissions && landed) G.SurfaceMissions.update(dt);
    if (G.Games) G.Games.update(dt, landed);
  }

  function interact(pos, landed, range) {
    if (G.Games && G.Games.racing()) return null;
    const met = S().met;
    let best = null, bd = Infinity;
    for (let i = 0; i < crew.length; i++) {
      const c = crew[i];
      if (!c.obj || !!c.surface !== !!landed) continue;
      // Already-met explorers only respond up close so they never block docking or scanning.
      const d = pos.distanceTo(c.obj.position) * (met[c.id] ? 2 : 1);
      if (d < bd) { bd = d; best = c; }
    }
    if (!best || bd > (range || (landed ? 10 : 14))) return null;
    return { text: 'Press E to talk to ' + best.name, fn: function () { talk(best); } };
  }

  function markers(landed) {
    const out = [];
    if (!G.World.camera) return out;
    const cam = G.World.camera.position, met = S().met;
    crew.forEach(function (c) {
      if (!c.obj || !!c.surface !== !!landed) return;
      const d = cam.distanceTo(c.obj.position);
      if (d > (c.secret ? 60 : landed ? 280 : 340)) return;
      const done = !!met[c.id];
      out.push({ id: 'crew_' + c.id, cls: c.secret ? 'crew secret' : done ? 'crew met' : 'crew', pos: c.obj.position, name: c.secret && !done ? '??? Signal' : (done ? '\u2713 ' : '\u2726 ') + c.name, r: 2 });
    });
    const gm = G.Games && G.Games.marker();
    if (gm) out.push(gm);
    return out;
  }

  // ---------- portraits ----------
  const SKIN = ['#f1c7a5', '#d9a07a', '#b07a52', '#8a5a3a', '#f5d6c0', '#6b4630'];
  function css(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function portrait(c, kind) {
    const h = hash(c.id || c.name || 'x'), col = css(c.color || 0x38e1ff), uid = 'p' + h.toString(36);
    const skin = c.secret ? '#8dffb0' : SKIN[h % SKIN.length];
    const face = '<circle cx="28.5" cy="30" r="1.5" fill="#1a1a1a"/><circle cx="35.5" cy="30" r="1.5" fill="#1a1a1a"/>' +
      '<path d="M28.5,35 Q32,38.5 35.5,35" fill="none" stroke="#5a2a1a" stroke-width="1.5" stroke-linecap="round"/>';
    const bg = '<defs><radialGradient id="' + uid + 'b" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="' + (c.secret ? '#123a22' : '#1a3150') + '"/><stop offset="1" stop-color="#040a14"/></radialGradient>' +
      '<linearGradient id="' + uid + 'v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (c.secret ? '#7dffa8' : '#ffd27a') + '" stop-opacity=".5"/><stop offset="1" stop-color="' + (c.secret ? '#1fd860' : '#ff8a1a') + '" stop-opacity=".3"/></linearGradient></defs>' +
      '<rect width="64" height="64" fill="url(#' + uid + 'b)"/>';
    if (kind === 'operator') {
      const hair = ['#1b120c', '#3a2416', '#6b4a2a', '#c9a36a', '#2a2a2a'][h % 5];
      return '<svg viewBox="0 0 64 64" class="portrait">' + bg +
        '<path d="M8,64 C10,49 21,45 32,45 C43,45 54,49 56,64 Z" fill="#1d3550"/>' +
        '<path d="M24,46 L32,55 L40,46" fill="none" stroke="' + col + '" stroke-width="3"/><circle cx="44" cy="55" r="2.5" fill="' + col + '"/>' +
        '<rect x="27" y="38" width="10" height="8" fill="' + skin + '"/>' +
        '<ellipse cx="32" cy="29" rx="11.5" ry="13.5" fill="' + skin + '"/>' +
        '<path d="M20,28 C19,13 45,13 44,28 C42,21 36,18 32,18 C27,18 22,21 20,28 Z" fill="' + hair + '"/>' + face +
        '<path d="M18.5,29 C18,12 46,12 45.5,29" fill="none" stroke="#2a3a4c" stroke-width="2.6"/>' +
        '<rect x="15.5" y="25" width="5" height="10" rx="2" fill="' + col + '"/><rect x="43.5" y="25" width="5" height="10" rx="2" fill="' + col + '"/>' +
        '<path d="M18,34 Q20,41 27,39" fill="none" stroke="#2a3a4c" stroke-width="1.6"/><circle cx="27.5" cy="39" r="1.7" fill="' + col + '"/></svg>';
    }
    const suitC = c.secret ? '#4fd67a' : '#e6eaf0';
    return '<svg viewBox="0 0 64 64" class="portrait">' + bg +
      '<path d="M8,64 C10,50 20,46 32,46 C44,46 54,50 56,64 Z" fill="' + suitC + '"/>' +
      '<rect x="22" y="51" width="20" height="5" rx="2" fill="' + col + '"/>' +
      '<circle cx="32" cy="29" r="20" fill="' + suitC + '"/>' +
      '<ellipse cx="32" cy="30" rx="14.5" ry="13" fill="#0b1626"/>' +
      '<ellipse cx="32" cy="31" rx="9" ry="10" fill="' + skin + '"/>' + face +
      '<ellipse cx="32" cy="30" rx="14.5" ry="13" fill="url(#' + uid + 'v)"/>' +
      '<path d="M21,24 Q25,19 31,18" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="13" cy="27" r="2.2" fill="#fff2c0"/><circle cx="51" cy="27" r="2.2" fill="#fff2c0"/>' +
      '<circle cx="32" cy="10.5" r="2.2" fill="' + col + '"/></svg>';
  }

  // ---------- dialogue + cards ----------
  function talk(c) {
    G.Audio.play('radio');
    U.show('crew-panel');
    U.el('crew-name').textContent = c.name;
    U.el('crew-role').textContent = c.role;
    document.querySelector('#crew-panel .panel-header-icon').innerHTML = portrait(c);
    const body = U.el('crew-body');
    const k = S();
    const name = (G.Save.get().profile && G.Save.get().profile.name) || 'Explorer';
    if (c.secret) {
      body.innerHTML = '<div class="crew-hero secret">' + portrait(c) + '</div><div class="npc-dialogue"><span class="npc-name-tag">' + esc(c.name) + ':</span> ' +
        (k.met[c.id] ? 'Keep exploring, ' + esc(name) + '! There are more secrets hidden across 2047. Have you tried typing my name, or asking KORA who made her?'
          : 'Psst! You found my secret hideout on Mars! I am GreenMan \u2014 in real life I am Sanwik Sagar, the creator of this whole galaxy. Here is my rarest card, just for you!') + '</div>' +
        '<div class="kx-actions">' + (k.met[c.id] ? '' : '<button class="kx-btn primary" id="crew-card">' + G.Icon('alien') + ' Receive secret card</button>') + '<button class="kx-btn" id="crew-bye">See you, GreenMan!</button></div>';
      if (!k.met[c.id]) U.el('crew-card').onclick = function () { U.hide('crew-panel'); giveSecret(c); };
      U.el('crew-bye').onclick = function () { G.Audio.play('click'); U.hide('crew-panel'); };
      return;
    }
    if (k.met[c.id]) {
      const q = QUOTES[hash(c.id + Date.now()) % QUOTES.length];
      body.innerHTML = '<div class="npc-dialogue"><span class="npc-name-tag">' + esc(c.name) + ':</span> Good to see you again, ' + esc(name) +
        '! I already shared my card. Follow the amber light beams to meet more explorers. Here is a favourite quote of mine:</div>' +
        '<div class="crew-hero">' + portrait(c) + '</div><div class="crew-quote">\u201C' + esc(q.q) + '\u201D<span>\u2014 ' + esc(q.by) + '</span></div>' +
        '<div class="kx-actions"><button class="kx-btn" id="crew-bye">See you around!</button></div>';
    } else {
      const line = HELLO[hash(c.id) % HELLO.length].replace('{p}', c.place);
      body.innerHTML = '<div class="crew-hero">' + portrait(c) + '<span class="crew-wave">' + G.Icon('wave') + '</span></div><div class="npc-dialogue"><span class="npc-name-tag">' + esc(c.name) + ':</span> ' + esc(line) + '</div>' +
        '<div class="kx-actions"><button class="kx-btn primary" id="crew-card">' + G.Icon('card') + ' Receive knowledge card</button><button class="kx-btn" id="crew-bye">Maybe later</button></div>';
      U.el('crew-card').onclick = function () { U.hide('crew-panel'); giveCard(c); };
    }
    U.el('crew-bye').onclick = function () { G.Audio.play('click'); U.hide('crew-panel'); };
  }

  function wikiTitle(k) {
    const s = (k.sources || []).find(function (x) { return /^Wikipedia\s+\u2014\s+/.test(x); });
    return s ? s.replace(/^Wikipedia\s+\u2014\s+/, '') : k.topic;
  }

  function pickCard(bodyId) {
    const have = S().cards;
    let pool = G.KNOWLEDGE.filter(function (k) { return !have[k.id] && k.planet === bodyId; });
    if (!pool.length) pool = G.KNOWLEDGE.filter(function (k) { return !have[k.id]; });
    const qi = Math.floor(Math.random() * QUOTES.length);
    if (pool.length) {
      const k = pool[Math.floor(Math.random() * pool.length)];
      const d = U.clamp((k.difficulty || 1) - 1, 0, 2);
      return { id: k.id, kid: k.id, title: k.topic, text: k.child, wiki: wikiTitle(k), rarity: RARITY[d], qi: qi, xp: 10 + 5 * d };
    }
    const left = LIVE_TOPICS.filter(function (x) { return !have['w:' + x]; });
    const title = left.length ? left[Math.floor(Math.random() * left.length)] : LIVE_TOPICS[Math.floor(Math.random() * LIVE_TOPICS.length)];
    return { id: 'w:' + title, title: title, text: '', wiki: title, rarity: 'legendary', qi: qi, xp: 25 };
  }

  // The GreenMan easter-egg card is a secret keepsake: it never counts toward collection totals or card badges.
  function regularCount() {
    const c = S().cards;
    return Object.keys(c).filter(function (id) { return !c[id].secret; }).length;
  }

  function giveCard(c) {
    const k = S();
    const card = pickCard(c.body || c.near);
    k.met[c.id] = true;
    card.n = Object.keys(k.cards).length + 1;
    card.from = c.name;
    k.cards[card.id] = { title: card.title, text: card.text, wiki: card.wiki, rarity: card.rarity, qi: card.qi, from: c.name, n: card.n, at: Date.now() };
    if (card.kid) G.Save.unlockKnowledge(card.kid, 'seen');
    G.Save.addXp(card.xp);
    G.Save.save();
    showCard(card, true);
    const n = regularCount();
    setTimeout(function () {
      if (n >= 5) award('card_collector');
      if (n >= 20) award('card_master');
    }, 1800);
    G.Journal.refresh();
  }

  function giveSecret(c) {
    const k = S();
    k.met[c.id] = true;
    const card = {
      id: 'egg:greenman', title: 'GreenMan \u2014 Creator of 2047', secret: true, rarity: 'legendary', xp: 100, from: c.name,
      text: 'Sanwik Sagar, known in games as GreenMan, created 2047: The Great Space Expedition so young explorers could learn real space science while having fun. You found his secret hideout on Mars!',
      quote: { q: 'Explore everything. Question everything. Never stop being curious.', by: 'Sanwik Sagar \u00b7 GreenMan' }
    };
    card.n = Object.keys(k.cards).length + 1;
    k.cards[card.id] = { title: card.title, text: card.text, rarity: card.rarity, secret: true, quote: card.quote, from: c.name, n: card.n, at: Date.now() };
    G.Save.addXp(card.xp);
    G.Save.save();
    showCard(card, true);
    setTimeout(function () { award('egg_greenman'); }, 1800);
    G.Journal.refresh();
  }

  function showCard(card, isNew) {
    const old = U.el('card-reveal');
    if (old) old.remove();
    const q = card.quote || QUOTES[(card.qi || 0) % QUOTES.length];
    const el = document.createElement('div');
    el.id = 'card-reveal';
    el.innerHTML =
      '<div class="cr-rays"></div>' +
      (isNew ? '<div class="cr-head">NEW KNOWLEDGE CARD</div>' : '') +
      '<div class="kcard r-' + card.rarity + (card.secret ? ' r-secret' : '') + (isNew ? '' : ' flipped') + '"><div class="kcard-inner">' +
        '<div class="kcard-back"><div class="kb-ring"></div><div class="kb-logo">2047</div><div class="kb-sub">KNOWLEDGE CARD</div></div>' +
        '<div class="kcard-front"><div class="kc-foil"></div><i class="kc-corner tl"></i><i class="kc-corner tr"></i><i class="kc-corner bl"></i><i class="kc-corner br"></i>' +
          '<div class="kc-top"><span class="kc-rarity"><em class="gem"></em>' + esc(card.rarity) + '</span><span class="kc-no">No. ' + (card.n || '') + '</span></div>' +
          '<div class="kc-img"><img alt=""><span class="kc-ph">&#10022;</span></div>' +
          '<div class="kc-title">' + esc(card.title) + '</div>' +
          '<div class="kc-text">' + esc(card.text || '') + '</div>' +
          '<div class="kc-live"><b>LIVE DATA</b> <span>Downlinking from Wikipedia\u2026</span></div>' +
          '<div class="kc-quote"><img class="kc-qimg" alt=""><div>\u201C' + esc(q.q) + '\u201D<span>\u2014 ' + esc(q.by) + '</span></div></div>' +
          '<div class="kc-from">Shared by ' + esc(card.from || 'an explorer') + '</div>' +
        '</div>' +
      '</div></div>' +
      '<button class="kx-btn primary cr-btn">' + (isNew ? 'Add to collection' : 'Close') + '</button>';
    U.el('ui-root').appendChild(el);
    const kc = el.querySelector('.kcard');
    el.addEventListener('pointermove', function (e) {
      const r = kc.getBoundingClientRect();
      const px = U.clamp((e.clientX - r.left) / r.width, -0.3, 1.3), py = U.clamp((e.clientY - r.top) / r.height, -0.3, 1.3);
      kc.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(1) + 'deg');
      kc.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(1) + 'deg');
      kc.style.setProperty('--mx', (px * 100).toFixed(0) + '%');
      kc.style.setProperty('--my', (py * 100).toFixed(0) + '%');
    });
    if (isNew) {
      G.Audio.play('discover');
      setTimeout(function () { el.querySelector('.kcard').classList.add('flipped'); G.Audio.play('badge'); if (G.FX) G.FX.burst(window.innerWidth / 2, window.innerHeight * 0.45, '255,190,80', 40); }, 700);
    }
    el.querySelector('.cr-btn').onclick = function () {
      G.Audio.play('click');
      el.remove();
      if (isNew) {
        const total = regularCount();
        G.UI.notify('Card added to your Log \u00b7 ' + total + ' collected \u00b7 +' + (card.xp || 10) + ' XP', 'good');
        G.UI.koraSay('Brilliant! ' + card.title + ' is now in your card collection. Station operators may ask about it, so read it carefully!');
      }
    };
    const saved = S().cards[card.id];
    const img = el.querySelector('.kc-img img');
    if (card.secret) {
      el.querySelector('.kc-img').innerHTML = portrait({ id: 'greenman', color: 0x3cff6e, secret: true });
      el.querySelector('.kc-live').innerHTML = '<b>SECRET TRANSMISSION</b> <span>Creator archive unlocked. Easter egg found!</span>';
      return;
    }
    function fill(d) {
      const live = el.querySelector('.kc-live span');
      if (!d) { live.textContent = card.text ? 'Offline \u2014 from the ship library.' : 'Signal lost. Try again near a station.'; return; }
      live.textContent = G.Codex.shortText(d.extract, 2);
      if (!card.text) el.querySelector('.kc-text').textContent = d.description || '';
      if (d.thumb) { img.src = d.thumb; img.parentNode.classList.add('has'); }
      if (saved) { saved.thumb = d.thumb || saved.thumb; saved.extract = d.extract; G.Save.save(); }
    }
    if (saved && saved.extract) fill({ extract: saved.extract, thumb: saved.thumb, description: '' });
    G.Codex.summary(card.wiki || card.title).then(fill).catch(function () { fill(null); });
    G.Codex.summary(q.wiki).then(function (d) {
      if (d && d.thumb) { const qi = el.querySelector('.kc-qimg'); qi.src = d.thumb; qi.classList.add('has'); }
    }).catch(function () {});
  }

  function cardsHtml() {
    const k = S(), ids = Object.keys(k.cards);
    const total = G.KNOWLEDGE.length;
    let h = '<div class="cards-wrap"><div class="cards-head">' +
      '<span><b>' + ids.filter(function (i) { return !k.cards[i].secret; }).length + '</b> / ' + total + '+ cards</span>' +
      '<span><b>' + k.passes + '</b> Fun Passes</span>' +
      '<span>Race best <b>' + (k.raceBest ? k.raceBest.toFixed(1) + 's' : '\u2014') + '</b></span>' +
      '<span>Star Catcher best <b>' + (k.catchBest || 0) + '</b></span></div>';
    if (!ids.length) h += '<div class="journal-empty">No cards yet. Look for astronauts under amber light beams on planets and near stations, then press E to talk!</div>';
    h += '<div class="cards-grid">';
    ids.sort(function (a, b) { return k.cards[a].n - k.cards[b].n; }).forEach(function (id, i) {
      const c = k.cards[id];
      h += '<button class="kc-mini r-' + esc(c.rarity) + '" data-card="' + esc(id) + '" style="animation-delay:' + Math.min(i, 16) * 0.03 + 's">' +
        (c.thumb ? '<img src="' + esc(c.thumb) + '" alt="">' : '<span class="kc-ph">&#10022;</span>') +
        '<b>' + esc(c.title) + '</b><i>' + esc(c.rarity) + ' \u00b7 #' + c.n + '</i></button>';
    });
    return h + '</div></div>';
  }

  function bindGallery(root) {
    root.querySelectorAll('[data-card]').forEach(function (b) {
      b.onclick = function () {
        const id = b.getAttribute('data-card'), c = S().cards[id];
        if (!c) return;
        G.Audio.play('open');
        showCard({ id: id, title: c.title, text: c.text, wiki: c.wiki, rarity: c.rarity, qi: c.qi, n: c.n, from: c.from, quote: c.quote, secret: c.secret }, false);
      };
    });
  }

  // ---------- station operators ----------
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function genQuestion(k) {
    if (k.misconception && Math.random() < 0.4) {
      return { id: 'gen_tf_' + k.id, topic: k.id, text: 'True or false: \u201C' + k.misconception + '\u201D', options: ['True', 'False'], correct: 1, explanation: k.child, hint: k.summary };
    }
    let clue = k.summary;
    (k.aliases || []).concat([k.topic]).sort(function (a, b) { return b.length - a.length; }).forEach(function (a) {
      if (a.length > 2) clue = clue.replace(new RegExp('\\b' + escRe(a) + '\\b', 'gi'), '____');
    });
    const others = shuffle(G.KNOWLEDGE.filter(function (o) { return o.id !== k.id && o.topic !== k.topic; })).slice(0, 3).map(function (o) { return o.topic; });
    const opts = shuffle([k.topic].concat(others));
    return { id: 'gen_' + k.id, topic: k.id, text: 'Which topic matches this clue? \u201C' + clue + '\u201D', options: opts, correct: opts.indexOf(k.topic), explanation: k.summary + ' ' + k.child, hint: 'Think about your knowledge cards and scans.' };
  }

  function buildExam() {
    const kn = G.Save.get().knowledge;
    const known = G.KNOWLEDGE.filter(function (k) { return kn[k.id]; });
    const qs = shuffle(G.QUESTIONS.filter(function (q) { return kn[q.topic]; })).slice(0, 2);
    const gen = shuffle(known).map(genQuestion);
    while (qs.length < 3 && gen.length) qs.push(gen.shift());
    return shuffle(qs).slice(0, 3);
  }

  function decorateStation(s, body, rerender) {
    const sid = s.def.id, k = S();
    const op = OPERATORS[sid] || { name: 'Station Operator' };
    const ex = k.exams[sid] || {};
    const known = Object.keys(G.Save.get().knowledge).length;
    const wrap = document.createElement('div');
    wrap.className = 'crew-station';
    const line = known < 3 ? 'Hi Explorer! Collect at least 3 knowledge cards or scans, then come back for your exam.'
      : ex.passed ? 'Welcome back, certified explorer! Ready for another round? Every pass wins a Fun Pass.'
        : 'I am ' + op.name + '. Answer 3 questions about what you have learned and I will certify you!';
    wrap.innerHTML =
      '<div class="op-card' + (ex.passed ? ' certified' : '') + '">' +
        '<div class="op-portrait">' + portrait({ id: sid, color: 0xffb43c }, 'operator') + '<span class="op-live">LIVE</span></div>' +
        '<div class="op-info"><div class="op-name">' + esc(op.name) + '</div><div class="op-role">Exam Operator \u00b7 ' + esc(s.def.name) + '</div>' +
          '<div class="op-bubble">' + esc(line) + '</div>' +
          '<div class="op-stats"><span>' + (ex.passed ? '&#10003; CERTIFIED' : 'NOT CERTIFIED') + '</span><span>BEST ' + (ex.best || 0) + '/3</span><span>' + known + ' TOPICS</span></div>' +
          '<button id="ss-exam" class="op-btn"' + (known < 3 ? ' disabled' : '') + '>' + (known < 3 ? 'Need 3 topics' : ex.passed ? 'Retake exam' : 'Start exam') + '</button>' +
        '</div></div>' +
      '<div class="fun-head">' + G.Icon('dice') + ' FUN ZONE <span><b>' + k.passes + '</b> Fun Pass' + (k.passes === 1 ? '' : 'es') + '</span></div>' +
      '<div class="fun-grid">' +
        '<button data-fun="race" class="fun-race"' + (k.passes ? '' : ' disabled') + '><span class="fun-art"><i></i><i></i><i></i></span><b>Space Race</b><span>10 gates \u00b7 win a medal' + (k.raceBest ? ' \u00b7 best ' + k.raceBest.toFixed(1) + 's' : '') + '</span></button>' +
        '<button data-fun="catch" class="fun-catch"' + (k.passes ? '' : ' disabled') + '><span class="fun-art"><i>&#9733;</i><i>&#9733;</i><i>&#9733;</i></span><b>Star Catcher</b><span>Combos \u00b7 power-ups' + (k.catchBest ? ' \u00b7 best ' + k.catchBest : '') + '</span></button>' +
      '</div>' + (k.passes ? '' : '<div class="fun-hint">Pass an operator exam to earn Fun Passes.</div>');
    body.appendChild(wrap);
    U.el('ss-exam').onclick = function () {
      const qs = buildExam();
      if (qs.length < 3) { G.UI.notify('Collect more knowledge cards first!', 'info'); return; }
      G.Audio.play('radio');
      G.UI.koraSay(op.name + ' is ready for your exam. Take your time and think it through!');
      G.Quiz.start(qs, function (correct, total) {
        const passed = correct >= 2;
        ex.best = Math.max(ex.best || 0, correct);
        if (passed) {
          ex.passed = true;
          k.passes++;
          G.Save.addXp(15 * correct);
          award('cert_' + sid);
          G.UI.notify('Exam passed ' + correct + '/' + total + '! +1 Fun Pass \u00b7 +' + 15 * correct + ' XP', 'good');
          G.UI.koraSay('You passed! ' + op.name + ' gave you a Fun Pass. Spend it in the Fun Zone for a Space Race or Star Catcher!');
        } else {
          G.Save.addXp(5);
          G.UI.notify('Exam: ' + correct + '/' + total + '. You need 2 correct. Collect more cards and try again!', 'info');
          G.UI.koraSay('Nearly there! Read your cards in the Log, then try the exam again. Every try teaches us something.');
        }
        k.exams[sid] = ex;
        G.Save.save();
        rerender();
      }, op.name + ' \u00b7 Exam', portrait({ id: sid, color: 0xffb43c }, 'operator'));
    };
    wrap.querySelectorAll('[data-fun]').forEach(function (b) {
      b.onclick = function () {
        if (k.passes < 1) return;
        k.passes--;
        G.Save.save();
        G.Audio.play('menuSelect');
        G.UI.closeStation();
        G.Games.start(b.getAttribute('data-fun'));
      };
    });
    if (!k.intro.station) {
      k.intro.station = true;
      setTimeout(function () { G.UI.koraSay('This station has an Operator. Pass their exam to earn a badge and Fun Passes for games like the Space Race!'); }, 1200);
    }
  }

  // Hook terrain lifecycle so surface crew appear and vanish with the ground.
  const origBuild = G.World.buildTerrain, origRemove = G.World.removeTerrain;
  G.World.buildTerrain = function (id) { const r = origBuild.apply(this, arguments); onTerrain(id); return r; };
  G.World.removeTerrain = function () { clearSurface(); return origRemove.apply(this, arguments); };

  return {
    update: update, interact: interact, markers: markers,
    decorateStation: decorateStation, cardsHtml: cardsHtml, bindGallery: bindGallery,
    cardCount: regularCount,
    state: S, award: award, portrait: portrait
  };
})();
