(function (S) {
  'use strict';
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var A = S.astro = {};

  // Hanle, Ladakh (Indian Astronomical Observatory)
  A.HANLE = { lat: 32.779, lon: 78.964 };

  function mod360(x) { return ((x % 360) + 360) % 360; }
  A.mod360 = mod360;

  // Days since 1999-12-31 00:00 UT (the epoch of the low-precision orbital elements used below).
  A.dayNum = function (ms) { return ms / 86400000 + 2440587.5 - 2451543.5; };

  A.lst = function (ms, lonDeg) {
    return mod360(280.46061837 + 360.98564736629 * (ms / 86400000 + 2440587.5 - 2451545.0) + lonDeg);
  };

  // ---------- low-precision planetary elements (accurate to about a degree) ----------
  var EL = {
    sun: function (d) { return { N: 0, i: 0, w: 282.9404 + 4.70935e-5 * d, a: 1, e: 0.016709 - 1.151e-9 * d, M: 356.0470 + 0.9856002585 * d }; },
    moon: function (d) { return { N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.0549, M: 115.3654 + 13.0649929509 * d }; },
    mercury: function (d) { return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.00e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d }; },
    venus: function (d) { return { N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.8910 + 1.38374e-5 * d, a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d }; },
    mars: function (d) { return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d }; },
    jupiter: function (d) { return { N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.8950 + 0.0830853001 * d }; },
    saturn: function (d) { return { N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.9670 + 0.0334442282 * d }; },
    uranus: function (d) { return { N: 74.0005 + 1.3978e-5 * d, i: 0.7733 + 1.9e-8 * d, w: 96.6612 + 3.0565e-5 * d, a: 19.18171 - 1.55e-8 * d, e: 0.047318 + 7.45e-9 * d, M: 142.5905 + 0.011725806 * d }; },
    neptune: function (d) { return { N: 131.7806 + 3.0173e-5 * d, i: 1.7700 - 2.55e-7 * d, w: 272.8461 - 6.027e-6 * d, a: 30.05826 + 3.313e-8 * d, e: 0.008606 + 2.15e-9 * d, M: 260.2471 + 0.005995147 * d }; },
    pluto: function (d) { return { N: 110.299, i: 17.14, w: 113.834, a: 39.482, e: 0.2488, M: 14.53 + 0.003975 * (d - 1.5) }; },
    comet: function (d) { return { N: 58.42, i: 162.26, w: 111.33, a: 17.834, e: 0.96714, M: 0.013089 * (d + 5072.55) }; }
  };
  A.PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  function kepler(Mdeg, e) {
    var M = mod360(Mdeg) * D2R, E = e > 0.8 ? Math.PI : M + e * Math.sin(M) * (1 + e * Math.cos(M));
    for (var k = 0; k < 14; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return E;
  }

  function pos(el) {
    var E = kepler(el.M, el.e);
    var xv = el.a * (Math.cos(E) - el.e), yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    var v = Math.atan2(yv, xv), r = Math.hypot(xv, yv), N = el.N * D2R, i = el.i * D2R, vw = v + el.w * D2R;
    return {
      x: r * (Math.cos(N) * Math.cos(vw) - Math.sin(N) * Math.sin(vw) * Math.cos(i)),
      y: r * (Math.sin(N) * Math.cos(vw) + Math.cos(N) * Math.sin(vw) * Math.cos(i)),
      z: r * Math.sin(vw) * Math.sin(i), r: r
    };
  }

  function toEq(p, eps) {
    var x = p.x, y = p.y * Math.cos(eps) - p.z * Math.sin(eps), z = p.y * Math.sin(eps) + p.z * Math.cos(eps);
    return { ra: mod360(Math.atan2(y, x) * R2D) * D2R, dec: Math.atan2(z, Math.hypot(x, y)) };
  }

  // Heliocentric ecliptic position (AU) of a planet / dwarf planet / comet at time ms.
  A.helio = function (name, ms) {
    var d = A.dayNum(ms);
    if (name === 'earth') { var s = pos(EL.sun(d)); return { x: -s.x, y: -s.y, z: 0, r: s.r }; }
    return pos(EL[name](d));
  };

  // Sample one full orbit (AU) for drawing.
  A.orbitPath = function (name, ms, n) {
    var d = A.dayNum(ms), out = [], el = name === 'earth' ? EL.sun(d) : EL[name](d);
    for (var k = 0; k < n; k++) {
      var e2 = { N: el.N, i: el.i, w: el.w, a: el.a, e: el.e, M: k / n * 360 };
      var p = pos(e2);
      if (name === 'earth') { p = { x: -p.x, y: -p.y, z: 0, r: p.r }; }
      out.push(p);
    }
    return out;
  };

  // Where things appear in the sky (RA/Dec in radians) at time ms.
  A.sky = function (ms) {
    var d = A.dayNum(ms), eps = (23.4393 - 3.563e-7 * d) * D2R, sp = pos(EL.sun(d)), out = { eps: eps };
    out.sun = toEq({ x: sp.x, y: sp.y, z: 0 }, eps);
    var m = pos(EL.moon(d));
    out.moon = toEq(m, eps);
    var lm = Math.atan2(m.y, m.x), ls = Math.atan2(sp.y, sp.x);
    out.moonAge = mod360((lm - ls) * R2D) / 360;
    out.planets = {};
    ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(function (n) {
      var h = pos(EL[n](d));
      out.planets[n] = toEq({ x: h.x + sp.x, y: h.y + sp.y, z: h.z }, eps);
    });
    return out;
  };

  A.altitude = function (ra, dec, lstDeg, latDeg) {
    var H = lstDeg * D2R - ra, la = latDeg * D2R;
    return Math.asin(Math.sin(dec) * Math.sin(la) + Math.cos(dec) * Math.cos(la) * Math.cos(H)) * R2D;
  };

  A.eqVec = function (ra, dec, r, out) {
    var c = Math.cos(dec);
    return out.set(r * c * Math.cos(ra), r * c * Math.sin(ra), r * Math.sin(dec));
  };

  // Equatorial (x to vernal equinox, z to north celestial pole) -> local sky (x East, y Up, z South).
  A.skyMatrix = function (THREE, lstDeg, latDeg) {
    var L = lstDeg * D2R, p = latDeg * D2R, sL = Math.sin(L), cL = Math.cos(L), sp = Math.sin(p), cp = Math.cos(p);
    return new THREE.Matrix4().set(
      -sL, cL, 0, 0,
      cp * cL, cp * sL, sp, 0,
      sp * cL, sp * sL, -cp, 0,
      0, 0, 0, 1);
  };

  // Galactic (l, b in degrees) -> equatorial (radians).
  A.galToEq = function (l, b) {
    var aG = 192.85948 * D2R, dG = 27.12825 * D2R, lN = 122.93192 * D2R, L = l * D2R, B = b * D2R;
    var sd = Math.sin(dG) * Math.sin(B) + Math.cos(dG) * Math.cos(B) * Math.cos(lN - L);
    var y = Math.cos(B) * Math.sin(lN - L), x = Math.cos(dG) * Math.sin(B) - Math.sin(dG) * Math.cos(B) * Math.cos(lN - L);
    return { ra: mod360((aG + Math.atan2(y, x)) * R2D) * D2R, dec: Math.asin(sd) };
  };

  // ---------- bright stars (J2000: RA hours, Dec degrees, magnitude) ----------
  var W = 0xffffff, BL = 0xcfe0ff, OR = 0xffc08a, RD = 0xff9a6a, YL = 0xfff0c8;
  function st(n, ra, dec, m, c, info) { return { n: n, ra: ra * 15 * D2R, dec: dec * D2R, m: m, c: c || W, info: info || '' }; }
  A.STAR = {
    betelgeuse: st('Betelgeuse', 5.9195, 7.407, 0.5, RD, 'A giant red star on Orion\u2019s shoulder. It is so big that if it took the Sun\u2019s place, it would swallow Mercury, Venus, Earth and Mars!'),
    rigel: st('Rigel', 5.2423, -8.202, 0.13, BL, 'A very hot, bright blue-white star marking Orion\u2019s foot.'),
    bellatrix: st('Bellatrix', 5.4188, 6.35, 1.64, BL), meissa: st('Meissa', 5.5855, 9.934, 3.39, BL),
    mintaka: st('Mintaka', 5.5334, -0.299, 2.2, BL, 'The right-hand star of Orion\u2019s Belt.'),
    alnilam: st('Alnilam', 5.6036, -1.202, 1.69, BL, 'The middle star of Orion\u2019s Belt.'),
    alnitak: st('Alnitak', 5.6794, -1.943, 1.77, BL, 'The left-hand star of Orion\u2019s Belt.'),
    saiph: st('Saiph', 5.7959, -9.67, 2.07, BL),
    sirius: st('Sirius', 6.7525, -16.716, -1.46, BL, 'The brightest star in the whole night sky! It is the brightest star of Canis Major, the Great Dog. Sirius is a star far away \u2014 it is not part of our Solar System.'),
    mirzam: st('Mirzam', 6.3783, -17.956, 1.98, BL), adhara: st('Adhara', 6.9772, -28.972, 1.5, BL),
    wezen: st('Wezen', 7.1397, -26.393, 1.83, YL), aludra: st('Aludra', 7.4017, -29.303, 2.45, BL),
    dubhe: st('Dubhe', 11.0621, 61.751, 1.79, OR, 'One of the two \u201cpointer\u201d stars of the Big Dipper. Together with Merak it points to the Pole Star.'),
    merak: st('Merak', 11.0306, 56.382, 2.37, W, 'The other \u201cpointer\u201d star. Draw a line from Merak through Dubhe and keep going \u2014 you reach the Pole Star!'),
    phecda: st('Phecda', 11.8972, 53.695, 2.44), megrez: st('Megrez', 12.2571, 57.033, 3.31),
    alioth: st('Alioth', 12.9005, 55.96, 1.77), mizar: st('Mizar', 13.3988, 54.925, 2.04, W, 'Look closely: Mizar has a tiny partner star next to it. Sharp-eyed people can see both!'),
    alkaid: st('Alkaid', 13.7923, 49.313, 1.86, BL, 'The tip of the Big Dipper\u2019s handle.'),
    polaris: st('Polaris \u2014 the Pole Star', 2.5303, 89.264, 1.98, YL, 'The Pole Star (Dhruva Tara) is not very bright, but it hardly moves. It always points north!'),
    yildun: st('Yildun', 17.5369, 86.586, 4.35), epsumi: st('Epsilon UMi', 16.7661, 82.037, 4.2),
    zetumi: st('Zeta UMi', 15.7344, 77.795, 4.3), etaumi: st('Eta UMi', 16.2919, 75.755, 4.95),
    pherkad: st('Pherkad', 15.3455, 71.834, 3.05), kochab: st('Kochab', 14.8451, 74.156, 2.08, OR),
    schedar: st('Schedar', 0.6753, 56.537, 2.24, OR), caph: st('Caph', 0.153, 59.15, 2.27, YL), gamcas: st('Gamma Cas', 0.9452, 60.717, 2.47, BL),
    ruchbah: st('Ruchbah', 1.4303, 60.235, 2.68), segin: st('Segin', 1.9067, 63.67, 3.37, BL),
    antares: st('Antares', 16.49, -26.432, 1.06, RD, 'The red heart of Scorpius, the Scorpion. Its name means \u201crival of Mars\u201d because it looks red like Mars.'),
    acrab: st('Acrab', 16.0906, -19.805, 2.62), dschubba: st('Dschubba', 16.0056, -22.622, 2.32, BL), pisco: st('Pi Sco', 15.9808, -26.114, 2.89, BL),
    alniyat: st('Sigma Sco', 16.3531, -25.593, 2.9), tausco: st('Tau Sco', 16.5981, -28.216, 2.82, BL), epssco: st('Larawag', 16.8361, -34.293, 2.29, OR),
    musco: st('Mu Sco', 16.8644, -38.047, 3.04), zetsco: st('Zeta Sco', 16.9097, -42.362, 3.62), etasco: st('Eta Sco', 17.2025, -43.239, 3.33, YL),
    thesco: st('Sargas', 17.6219, -42.998, 1.87, YL), iotsco: st('Iota Sco', 17.7931, -40.127, 3.03, YL), kapsco: st('Girtab', 17.7081, -39.03, 2.41, BL),
    shaula: st('Shaula', 17.56, -37.104, 1.62, BL), lesath: st('Lesath', 17.5128, -37.296, 2.7, BL),
    regulus: st('Regulus', 10.1395, 11.967, 1.35, BL, 'The heart of Leo, the Lion.'), algieba: st('Algieba', 10.3329, 19.842, 2.08, OR),
    zosma: st('Zosma', 11.2351, 20.524, 2.56), denebola: st('Denebola', 11.8177, 14.572, 2.14), chertan: st('Chertan', 11.2372, 15.43, 3.34, BL),
    etaleo: st('Eta Leo', 10.1222, 16.763, 3.5), adhafera: st('Adhafera', 10.2781, 23.417, 3.44, YL), rasalas: st('Rasalas', 9.8792, 26.007, 3.88, OR), epsleo: st('Ras Elased', 9.7642, 23.774, 2.98, YL),
    deneb: st('Deneb', 20.6905, 45.28, 1.25, BL, 'The tail of Cygnus, the Swan. It is one corner of the Summer Triangle.'),
    sadr: st('Sadr', 20.3705, 40.257, 2.23, YL), albireo: st('Albireo', 19.512, 27.96, 3.18, OR), gienah: st('Gienah', 20.7702, 33.97, 2.48, OR), delcyg: st('Delta Cyg', 19.7497, 45.131, 2.87, BL),
    vega: st('Vega', 18.6156, 38.784, 0.03, BL, 'One corner of the Summer Triangle. It was once the Pole Star and will be again in about 12,000 years!'),
    altair: st('Altair', 19.8464, 8.868, 0.76, W, 'One corner of the Summer Triangle.'),
    aldebaran: st('Aldebaran', 4.5987, 16.509, 0.85, RD, 'The red eye of Taurus, the Bull.'), alcyone: st('The Pleiades', 3.7914, 24.105, 2.87, BL, 'A tiny cluster of young blue stars \u2014 also called the Seven Sisters.'),
    capella: st('Capella', 5.2782, 45.998, 0.08, YL), procyon: st('Procyon', 7.655, 5.225, 0.34, YL), castor: st('Castor', 7.5767, 31.888, 1.58), pollux: st('Pollux', 7.7553, 28.026, 1.14, OR),
    arcturus: st('Arcturus', 14.2611, 19.182, -0.05, OR, 'A bright orange star. Follow the curve of the Big Dipper\u2019s handle to find it!'), spica: st('Spica', 13.4199, -11.161, 0.97, BL),
    fomalhaut: st('Fomalhaut', 22.9608, -29.622, 1.16, W)
  };

  // Constellations: stick-figure lines between star ids.
  A.CONST = {
    bigdipper: { name: 'Big Dipper \u00b7 Saptarishi', sub: 'Part of Ursa Major, the Great Bear', lines: [['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'], ['megrez', 'dubhe'], ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid']], color: 0xffd23f },
    littledipper: { name: 'Little Dipper', sub: 'Part of Ursa Minor, the Little Bear', lines: [['polaris', 'yildun'], ['yildun', 'epsumi'], ['epsumi', 'zetumi'], ['zetumi', 'etaumi'], ['etaumi', 'pherkad'], ['pherkad', 'kochab'], ['kochab', 'zetumi']], color: 0x6ee7ff },
    orion: { name: 'Orion', sub: 'The Hunter', lines: [['betelgeuse', 'meissa'], ['meissa', 'bellatrix'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'], ['mintaka', 'alnilam'], ['alnilam', 'alnitak'], ['alnitak', 'saiph'], ['mintaka', 'rigel']], color: 0xff9bd0 },
    canismajor: { name: 'Canis Major', sub: 'The Great Dog', lines: [['mirzam', 'sirius'], ['sirius', 'wezen'], ['wezen', 'adhara'], ['wezen', 'aludra']], color: 0x7dffb0 },
    cassiopeia: { name: 'Cassiopeia', sub: 'The Queen \u2014 shaped like a W', lines: [['caph', 'schedar'], ['schedar', 'gamcas'], ['gamcas', 'ruchbah'], ['ruchbah', 'segin']], color: 0xc8a0ff },
    scorpius: { name: 'Scorpius', sub: 'The Scorpion', lines: [['pisco', 'dschubba'], ['dschubba', 'acrab'], ['dschubba', 'alniyat'], ['alniyat', 'antares'], ['antares', 'tausco'], ['tausco', 'epssco'], ['epssco', 'musco'], ['musco', 'zetsco'], ['zetsco', 'etasco'], ['etasco', 'thesco'], ['thesco', 'iotsco'], ['iotsco', 'kapsco'], ['kapsco', 'shaula'], ['shaula', 'lesath']], color: 0xff8a6a },
    leo: { name: 'Leo', sub: 'The Lion', lines: [['epsleo', 'rasalas'], ['rasalas', 'adhafera'], ['adhafera', 'algieba'], ['algieba', 'etaleo'], ['etaleo', 'regulus'], ['algieba', 'zosma'], ['zosma', 'denebola'], ['zosma', 'chertan'], ['chertan', 'regulus']], color: 0xffc46b },
    cygnus: { name: 'Cygnus', sub: 'The Swan', lines: [['deneb', 'sadr'], ['sadr', 'albireo'], ['delcyg', 'sadr'], ['sadr', 'gienah']], color: 0x9fd0ff },
    summer: { name: 'Summer Triangle', sub: 'Vega \u00b7 Altair \u00b7 Deneb', lines: [['vega', 'altair'], ['altair', 'deneb'], ['deneb', 'vega']], color: 0xfff09a }
  };
})(window.Sky = window.Sky || {});
