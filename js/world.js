window.G = window.G || {};

G.World = (function () {
  const U = G.utils;
  const W = {
    bodies: {}, stations: {}, pois: [],
    ship: null, rover: null,
    scene: null, camera: null, renderer: null,
    spaceGroup: null, terrainBody: null,
    time: 0
  };
  const ZERO = new THREE.Vector3();
  const TERRAIN_SIZE = 1600, TERRAIN_SEG = 256;
  const LOW_POWER = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);
  const SPACE_AMB = 0.5, BLOOM = 0.24;
  let comfortK = 1;

  let ready = false;
  let spaceGroup, terrainGroup = null, terrain = null;
  let sunLight, ambient, terrainLight, stars, sky, composer = null, bloomPass = null;
  let sat = null, objSprite, objRef = null, scanRing, scanState = null;
  let dust = null, belts = [];
  const pulses = [];
  const orderedBodies = [];
  const orderedStations = [];
  const animated = [];

  function smooth(a, b, x) {
    const t = U.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // ---------- shaders ----------
  const NOISE_GLSL = [
    'float hash(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
    '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }'
  ].join('\n');

  // Logarithmic depth needs these chunks in every hand-written shader, or those meshes
  // fight the planets and the silhouette crawls.
  const VERT_HEAD = '#include <logdepthbuf_pars_vertex>\n';
  const VERT_TAIL = '\n#include <logdepthbuf_vertex>\n';
  const FRAG_HEAD = '#include <logdepthbuf_pars_fragment>\n';
  const FRAG_TAIL = '\n#include <logdepthbuf_fragment>\n';

  function sunMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 }, map: { value: null }, useMap: { value: 0 } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV;\n' + VERT_HEAD +
        'void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;' + VERT_TAIL + '}',
      fragmentShader: 'uniform float t; uniform sampler2D map; uniform float useMap; varying vec3 vP; varying vec3 vN; varying vec3 vV;\n' + FRAG_HEAD + NOISE_GLSL + '\n' +
        'void main(){ vec3 n = normalize(vP);' +
        ' float big = fbm(n * 2.2 + vec3(t * 0.004, 0.0, t * 0.0025));' +
        ' float gran = 1.0 - abs(noise(n * 18.0 + vec3(t * 0.012, -t * 0.008, t * 0.01)) * 2.0 - 1.0);' +
        ' gran = pow(gran, 2.5);' +
        ' float fine = fbm(n * 8.0 - vec3(0.0, t * 0.006, t * 0.004));' +
        ' float heat = 0.55 + 0.25 * big + 0.22 * gran + 0.12 * fine;' +
        ' vec3 c = mix(vec3(0.95, 0.32, 0.03), vec3(1.0, 0.86, 0.45), smoothstep(0.45, 0.95, heat));' +
        ' c = mix(c, vec3(1.0, 0.98, 0.85), smoothstep(0.88, 1.05, heat) * 0.6);' +
        ' if (useMap > 0.5) { vec2 uv = vec2(atan(n.z, n.x) / 6.2831853 + 0.5 + t * 0.0015, asin(clamp(n.y, -1.0, 1.0)) / 3.1415926 + 0.5);' +
        ' vec3 m = texture2D(map, uv).rgb; c = mix(c, c * (0.55 + 0.9 * m), 0.6); }' +
        ' float spotN = fbm(n * 5.0 + vec3(3.1, 1.7, t * 0.004));' +
        ' float lat = abs(n.y); float belt = smoothstep(0.05, 0.18, lat) * (1.0 - smoothstep(0.45, 0.6, lat));' +
        ' float spot = smoothstep(0.66, 0.74, spotN) * belt;' +
        ' float pen = smoothstep(0.6, 0.66, spotN) * belt;' +
        ' c = mix(c, c * vec3(0.55, 0.32, 0.12), pen * 0.6); c = mix(c, vec3(0.12, 0.03, 0.0), spot * 0.85);' +
        ' float mu = max(dot(vN, vV), 0.0);' +
        ' float limb = 0.35 + 0.65 * pow(mu, 0.55);' +
        ' c *= limb * 1.35; c = mix(c, c * vec3(1.0, 0.7, 0.45), pow(1.0 - mu, 2.0) * 0.6);' +
        ' float fac = smoothstep(0.7, 0.95, fine) * pow(1.0 - mu, 1.5); c += vec3(1.0, 0.8, 0.5) * fac * 0.35;' +
        ' gl_FragColor = vec4(c, 1.0);' + FRAG_TAIL + '}'
    });
  }

  function coronaMaterial(ratio) {
    return new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 }, ratio: { value: ratio } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV;\n' + VERT_HEAD +
        'void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;' + VERT_TAIL + '}',
      fragmentShader: 'uniform float t; uniform float ratio; varying vec3 vP; varying vec3 vN; varying vec3 vV;\n' + FRAG_HEAD + NOISE_GLSL + '\n' +
        'void main(){ float mu = clamp(abs(dot(vN, vV)), 0.0, 1.0);' +
        ' float b = sqrt(1.0 - mu * mu) * ratio;' +
        ' if (b < 1.0) discard;' +
        ' vec3 n = normalize(vP);' +
        ' float streak = fbm(vec3(n.xy * 4.0 / (abs(n.z) + 0.6), t * 0.012)) ;' +
        ' float s2 = fbm(n * 6.0 + vec3(0.0, t * 0.018, -t * 0.012));' +
        ' float fall = exp(-(b - 1.0) * 2.6);' +
        ' float a = fall * (0.6 + 0.9 * streak + 0.35 * s2);' +
        ' a *= 1.0 - smoothstep(ratio * 0.7, ratio, b);' +
        ' a *= smoothstep(1.0, 1.04, b);' +
        ' vec3 col = mix(vec3(1.0, 0.5, 0.12), vec3(1.0, 0.9, 0.7), clamp(fall * 1.2, 0.0, 1.0));' +
        ' gl_FragColor = vec4(col * a * 0.9, a);' + FRAG_TAIL + '}',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
    });
  }

  function atmosphere(radius, color, power, strength) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) }, power: { value: power }, strength: { value: strength } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW;\n' + VERT_HEAD +
        'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);' +
        ' vW = normalize((modelMatrix * vec4(position, 1.0)).xyz - (modelMatrix * vec4(0.0,0.0,0.0,1.0)).xyz); gl_Position = projectionMatrix * mv;' + VERT_TAIL + '}',
      fragmentShader: 'uniform vec3 color; uniform float power; uniform float strength; varying vec3 vN; varying vec3 vV; varying vec3 vW;\n' + FRAG_HEAD +
        'void main(){ float r = 1.0 - max(dot(vN, vV), 0.0); float i = pow(r, power) * strength; gl_FragColor = vec4(color * i, i);' + FRAG_TAIL + '}',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.07, 48, 32), mat);
  }

  // ---------- canvas textures ----------
  function glowTexture(hex) {
    const c = U.makeCanvas(128, 128), g = c.getContext('2d');
    const col = new THREE.Color(hex).getStyle();
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, col);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function glowSprite(hex, scale, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(hex), transparent: true, opacity: opacity,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    s.scale.set(scale, scale, 1);
    return s;
  }

  function raysTexture() {
    const c = U.makeCanvas(512, 512), g = c.getContext('2d');
    const rnd = U.mulberry32(9);
    g.translate(256, 256);
    for (let i = 0; i < 90; i++) {
      g.rotate((Math.PI * 2) / 90 + rnd() * 0.05);
      const len = 120 + rnd() * 130;
      const grad = g.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, 'rgba(255,220,150,0.35)');
      grad.addColorStop(1, 'rgba(255,160,60,0)');
      g.fillStyle = grad;
      g.fillRect(0, -1 - rnd() * 2, len, 2 + rnd() * 3);
    }
    return new THREE.CanvasTexture(c);
  }

  function skyTexture() {
    const w = 2048, h = 1024;
    const c = U.makeCanvas(w, h), g = c.getContext('2d');
    const rnd = U.mulberry32(2047);
    g.fillStyle = '#010209';
    g.fillRect(0, 0, w, h);
    function band(x) { return h * 0.5 + Math.sin((x / w) * Math.PI * 2) * h * 0.18; }
    function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) / 2; }
    const neb = ['80,60,160', '40,90,170', '170,70,120', '200,120,60', '60,140,170'];
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w, y = band(x) + gauss() * h * 0.12, r = 60 + rnd() * 220;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const col = neb[Math.floor(rnd() * neb.length)];
      grad.addColorStop(0, 'rgba(' + col + ',' + (0.05 + rnd() * 0.1).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 26000; i++) {
      const x = rnd() * w, y = band(x) + gauss() * h * 0.09;
      const a = 0.08 + rnd() * 0.45;
      g.fillStyle = 'rgba(' + (210 + rnd() * 45 | 0) + ',' + (205 + rnd() * 45 | 0) + ',255,' + a.toFixed(2) + ')';
      g.fillRect(x, y, rnd() < 0.9 ? 1 : 1.6, 1);
    }
    for (let i = 0; i < 40; i++) {
      const x = rnd() * w, y = band(x) + gauss() * h * 0.03, r = 30 + rnd() * 80;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(2,2,8,0.45)');
      grad.addColorStop(1, 'rgba(2,2,8,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 5000; i++) {
      g.fillStyle = 'rgba(255,255,255,' + (0.1 + rnd() * 0.6).toFixed(2) + ')';
      g.fillRect(rnd() * w, rnd() * h, 1, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  function grainTexture(seed) {
    const s = 256, c = U.makeCanvas(s, s), g = c.getContext('2d');
    const img = g.createImageData(s, s), d = img.data, nz = U.makeNoise(seed);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n = nz.fbm(x / 10, y / 10, 4) * 0.85 + Math.random() * 0.15;
        const v = 185 + n * 70, i = (y * s + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(48, 48);
    t.anisotropy = 2;
    return t;
  }

  // ---------- planet textures ----------
  function planetTextures(def) {
    const w = def.id === 'earth' ? 1024 : 512, h = w / 2;
    const c = U.makeCanvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data;
    const rc = def.id === 'earth' ? U.makeCanvas(w, h) : null;
    const rimg = rc ? rc.getContext('2d').createImageData(w, h) : null;
    const nz = U.makeNoise(def.seed);
    const base = U.hexToRgb(def.color);
    const rnd = U.mulberry32(def.seed + 3);
    function wrapN(u, v, s, oct) {
      const a = nz.fbm(u * s, v * s, oct), b = nz.fbm((u - 1) * s, v * s, oct);
      return a * (1 - u) + b * u;
    }
    const id = def.id;
    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        let r, gg, b, rough = 255;
        if (id === 'earth') {
          const n = wrapN(u, v, 6, 5);
          r = 12 * (0.8 + 0.5 * n); gg = 52 * (0.8 + 0.5 * n); b = 120 * (0.8 + 0.4 * n);
          rough = 150;
          if (n > 0.52) {
            const t = U.clamp((n - 0.52) * 4, 0, 1);
            const lat = Math.abs(v - 0.5) * 2;
            const desert = U.clamp(1 - Math.abs(lat - 0.35) * 5, 0, 1) * wrapN(u + 0.2, v, 3, 2);
            r = U.lerp(40, 140, t); gg = U.lerp(100, 110, t); b = U.lerp(40, 70, t);
            r = U.lerp(r, 190, desert); gg = U.lerp(gg, 160, desert); b = U.lerp(b, 100, desert);
            rough = 230;
          }
          if (v < 0.07 || v > 0.93) { r = 235; gg = 240; b = 250; rough = 200; }
        } else if (id === 'mars') {
          const n = wrapN(u, v, 5, 5);
          const k = n < 0.4 ? 0.55 : 0.7 + 0.6 * n;
          r = base.r * k; gg = base.g * k; b = base.b * k;
          if (v < 0.05 || v > 0.95) { r = 240; gg = 240; b = 245; }
        } else if (id === 'jupiter' || id === 'saturn') {
          const s = Math.sin(v * Math.PI * (id === 'jupiter' ? 16 : 11) + wrapN(u, v, 4, 3) * 5) * 0.5 + 0.5;
          const k = 0.7 + 0.5 * s;
          r = base.r * k; gg = base.g * k * (0.9 + 0.1 * s); b = base.b * k * (0.8 + 0.3 * (1 - s));
          if (id === 'jupiter') {
            const dx = (u - 0.7) / 0.07, dy = (v - 0.62) / 0.04;
            const sp = Math.max(0, 1 - (dx * dx + dy * dy));
            r = U.lerp(r, 190, sp); gg = U.lerp(gg, 80, sp); b = U.lerp(b, 55, sp);
          }
        } else if (def.type === 'ice giant') {
          const k = 0.9 + 0.2 * wrapN(u, v, 3, 3) + Math.sin(v * Math.PI * 6) * 0.04;
          r = base.r * k; gg = base.g * k; b = base.b * k;
        } else if (id === 'venus') {
          const k = 0.85 + 0.3 * wrapN(u, v + wrapN(u, v, 2, 2) * 0.3, 3, 5);
          r = base.r * k; gg = base.g * k; b = base.b * k * 0.95;
        } else {
          const k = 0.6 + 0.7 * wrapN(u, v, 8, 5);
          r = base.r * k; gg = base.g * k; b = base.b * k;
        }
        const i = (y * w + x) * 4;
        const L = (r + gg + b) / 3, V = id === 'earth' ? 1.05 : 1.3;
        r = L + (r - L) * V; gg = L + (gg - L) * V; b = L + (b - L) * V;
        d[i] = U.clamp(r, 0, 255); d[i + 1] = U.clamp(gg, 0, 255); d[i + 2] = U.clamp(b, 0, 255); d[i + 3] = 255;
        if (rimg) { rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = rough; rimg.data[i + 3] = 255; }
      }
    }
    g.putImageData(img, 0, 0);
    if (def.type === 'moon' || def.type === 'dwarf planet' || id === 'mercury' || def.cratered) {
      for (let i = 0; i < 55; i++) {
        const cx = rnd() * w, cy = rnd() * h, cr = 3 + rnd() * rnd() * 22;
        const grad = g.createRadialGradient(cx, cy, cr * 0.2, cx, cy, cr);
        grad.addColorStop(0, 'rgba(0,0,0,0.35)');
        grad.addColorStop(0.85, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(255,255,255,0.18)');
        g.fillStyle = grad;
        g.beginPath(); g.arc(cx, cy, cr, 0, Math.PI * 2); g.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    let rough = null;
    if (rc) { rc.getContext('2d').putImageData(rimg, 0, 0); rough = new THREE.CanvasTexture(rc); }
    return { map: tex, rough: rough, canvas: c };
  }

  function cloudTexture(seed) {
    const w = 512, h = 256, c = U.makeCanvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data, nz = U.makeNoise(seed);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        const a = nz.fbm(u * 8, v * 8, 5), b = nz.fbm((u - 1) * 8, v * 8, 5);
        const n = a * (1 - u) + b * u;
        const al = U.clamp((n - 0.5) * 3.2, 0, 1);
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = al * 230;
      }
    }
    g.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  function ringMesh(def, inner, outer, color, opacity, bands) {
    const geo = new THREE.RingGeometry(def.radius * inner, def.radius * outer, 128, 1);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - def.radius * inner) / (def.radius * (outer - inner)), 0.5);
    }
    const c = U.makeCanvas(512, 4), g = c.getContext('2d');
    const rnd = U.mulberry32(def.seed + 11);
    for (let x = 0; x < 512; x++) {
      const a = bands ? (0.25 + 0.75 * rnd()) * (x > 200 && x < 224 ? 0.08 : 1) : 0.8;
      g.fillStyle = 'rgba(' + color + ',' + a.toFixed(2) + ')';
      g.fillRect(x, 0, 1, 4);
    }
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, opacity: opacity,
      side: THREE.DoubleSide, depthWrite: false, roughness: 1, metalness: 0
    }));
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  // ---------- space objects ----------
  const ATMOS = {
    earth: [0x5ab4ff, 2.8, 1.0], venus: [0xffd890, 2.4, 0.9], mars: [0xff9060, 3.2, 0.6],
    jupiter: [0xffd9a0, 3.0, 0.5], saturn: [0xffe6b0, 3.0, 0.5], uranus: [0x9ff4ff, 2.5, 0.8],
    neptune: [0x6f9dff, 2.5, 0.9], moon_titan: [0xffb060, 2.4, 0.9]
  };

  // Project-owned maps (assets/textures/tex_*). Jupiter, Saturn, Ceres and Earth clouds still use Solar System Scope (CC BY 4.0).
  const TEX_FILES = {
    mercury: 'tex_mercury.jpg', venus: 'tex_venus.jpg', earth: 'tex_earth_day.jpg', moon: 'tex_moon.jpg',
    mars: 'tex_mars.jpg', jupiter: '2k_jupiter.jpg', saturn: '2k_saturn.jpg', uranus: 'tex_uranus.jpg',
    neptune: 'tex_neptune.jpg', pluto: 'tex_pluto.jpg', ceres: '2k_ceres_fictional.jpg'
  };
  let texLoader = null;
  function loadTex(file, cb) {
    if (!texLoader) texLoader = new THREE.TextureLoader();
    texLoader.load('assets/textures/' + file, function (t) {
      t.anisotropy = Math.min(4, W.renderer ? W.renderer.capabilities.getMaxAnisotropy() : 4);
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      cb(t);
    }, undefined, function () { });
  }

  function oceanRoughness(img) {
    const c = U.makeCanvas(1024, 512), g = c.getContext('2d');
    g.drawImage(img, 0, 0, 1024, 512);
    const im = g.getImageData(0, 0, 1024, 512), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const sea = b > r + 12 && b + 8 >= gg;
      const v = sea ? 95 : 245;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  function applyRealTextures(def, mesh, group) {
    const file = TEX_FILES[def.id];
    if (!file) return;
    const mat = mesh.material;
    loadTex(file, function (t) {
      const prev = mat.map;
      mat.map = t;
      // A colour photo used as a bump map turns JPEG blocks into moving relief.
      mat.bumpMap = null;
      mat.bumpScale = 0;
      mat.color.set(0xffffff);
      if (def.id === 'earth') {
        try { mat.roughnessMap = oceanRoughness(t.image); mat.roughness = 1; mat.metalness = 0.08; } catch (e) { }
      }
      mat.needsUpdate = true;
      if (prev && prev !== t) prev.dispose();
      def._canvas = t.image;
    });
    if (def.id === 'earth') {
      loadTex('tex_earth_night.jpg', function (t) {
        mat.emissiveMap = t;
        mat.emissive.set(0xffd9a0);
        mat.emissiveIntensity = 1.25;
        mat.onBeforeCompile = function (shader) {
          shader.uniforms.sunView = { value: new THREE.Vector3() };
          shader.fragmentShader = 'uniform vec3 sunView;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n  float sunNL = dot(normal, normalize(sunView + vViewPosition));\n  totalEmissiveRadiance *= smoothstep(0.12, -0.25, sunNL);');
          mat.userData.shader = shader;
        };
        mat.needsUpdate = true;
        animated.push(function () {
          const sh = mat.userData.shader;
          if (sh && W.camera) sh.uniforms.sunView.value.set(0, 0, 0).applyMatrix4(W.camera.matrixWorldInverse);
        });
      });
      loadTex('2k_earth_clouds.jpg', function (t) {
        const clouds = group.userData.clouds;
        if (!clouds) return;
        clouds.material.map = null;
        clouds.material.alphaMap = t;
        clouds.material.opacity = 0.85;
        clouds.material.needsUpdate = true;
      });
    }
    if (def.id === 'saturn') {
      loadTex('2k_saturn_ring_alpha.png', function (t) {
        const ring = group.userData.ring;
        if (!ring) return;
        ring.material.map = t; ring.material.opacity = 1; ring.material.needsUpdate = true;
      });
    }
  }

  function buildBody(def) {
    const group = new THREE.Group();
    let mesh;
    if (def.type === 'star') {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 96, 64), sunMaterial());
      group.add(mesh);
      const corona = new THREE.Mesh(new THREE.SphereGeometry(def.radius * 2.2, 64, 48), coronaMaterial(2.2));
      group.add(corona);
      const corona2 = { material: { uniforms: { t: { value: 0 } } } };
      const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTexture(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      rays.scale.set(def.radius * 7, def.radius * 7, 1);
      group.add(rays);
      group.add(glowSprite(0xfff1c8, def.radius * 3.0, 0.55));
      group.add(glowSprite(0xffa040, def.radius * 5.5, 0.22));
      group.add(glowSprite(0xff6a20, def.radius * 11, 0.07));
      animated.push(function (t) {
        mesh.material.uniforms.t.value = t; corona.material.uniforms.t.value = t; corona2.material.uniforms.t.value = t * 0.6 + 50;
        rays.material.rotation = t * 0.006; mesh.rotation.y = t * 0.01;
      });
      loadTex('tex_sun.jpg', function (tx) {
        tx.wrapS = THREE.RepeatWrapping;
        mesh.material.uniforms.map.value = tx;
        mesh.material.uniforms.useMap.value = 1;
      });
    } else {
      const tx = planetTextures(def);
      const mat = new THREE.MeshStandardMaterial({ map: tx.map, roughness: 0.92, metalness: 0 });
      if (tx.rough) { mat.roughnessMap = tx.rough; mat.roughness = 1; mat.metalness = 0.05; }
      mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 64, 48), mat);
      group.add(mesh);
      def._canvas = tx.canvas;
      const at = ATMOS[def.id];
      if (at) group.add(atmosphere(def.radius, at[0], at[1], at[2]));
      if (def.id === 'earth') {
        const clouds = new THREE.Mesh(new THREE.SphereGeometry(def.radius * 1.02, LOW_POWER ? 40 : 64, LOW_POWER ? 28 : 48),
          new THREE.MeshStandardMaterial({ map: cloudTexture(def.seed + 99), transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
        group.add(clouds);
        group.userData.clouds = clouds;
        animated.push(function (t, dt) { clouds.rotation.y += dt * 0.012; });
      }
      if (def.id === 'saturn') {
        group.userData.ring = ringMesh(def, 1.24, 2.3, '230,210,160', 0.9, true);
        group.add(group.userData.ring);
        group.rotation.z = 0.35;
      }
      if (def.id === 'uranus') group.add(ringMesh(def, 1.6, 1.9, '170,210,220', 0.35, false));
      if (def.tilt) group.rotation.z = THREE.MathUtils.degToRad(def.tilt);
      applyRealTextures(def, mesh, group);
    }
    spaceGroup.add(group);
    const body = { def: def, group: group, mesh: mesh, worldPos: group.position, angle: def.angle || 0 };
    W.bodies[def.id] = body;
    if (def.parent) orderedBodies.push(body); else orderedBodies.unshift(body);

    if (!def.parent && def.distance) {
      const pts = [];
      for (let i = 0; i <= 256; i++) {
        const a = i / 256 * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * def.distance, 0, Math.sin(a) * def.distance));
      }
      spaceGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.07 })
      ));
    }
    return body;
  }

  function addBody(def) {
    if (W.bodies[def.id]) return W.bodies[def.id];
    const b = buildBody(def);
    placeBody(b, 0);
    return b;
  }

  function buildStation(def) {
    const group = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xc8d4de, roughness: 0.35, metalness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a222c, roughness: 0.5, metalness: 0.3 });
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1b3f80, roughness: 0.25, metalness: 0.3, emissive: 0x06183a });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffd38a });
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 5.4, 20), metal));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.42, 14, 48), dark);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const lights = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 6, 48), windowMat);
    lights.rotation.x = Math.PI / 2;
    lights.position.y = 0.36;
    group.add(lights);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 0.16), metal);
      spoke.rotation.y = i * Math.PI / 4;
      group.add(spoke);
    }
    for (let s = -1; s <= 1; s += 2) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.1), metal);
      arm.position.set(s * 2.4, 2.4, 0);
      group.add(arm);
      for (let k = 0; k < 2; k++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.6), panelMat);
        panel.position.set(s * (4.2 + k * 2.8), 2.4, 0);
        group.add(panel);
      }
    }
    const dock = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1, 12), dark);
    dock.position.y = -3.2;
    group.add(dock);
    const beacon = glowSprite(0x4fd8ff, 3, 0.6);
    beacon.position.y = 3;
    group.add(beacon);
    const red = glowSprite(0xff4060, 2.4, 0.9);
    red.position.set(0, -3.8, 0);
    group.add(red);
    spaceGroup.add(group);
    const st = { def: def, group: group, worldPos: group.position, angle: def.angle || 0, beacon: beacon, red: red };
    W.stations[def.id] = st;
    orderedStations.push(st);
    return st;
  }

  function buildSatellite() {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 0.3 })));
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1b3f80, roughness: 0.25, metalness: 0.3, emissive: 0x06183a });
    for (let s = -1; s <= 1; s += 2) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 1.8), panelMat);
      p.position.x = s * 3.2;
      group.add(p);
    }
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }));
    dish.position.set(0, 1.2, 0);
    group.add(dish);
    const blink = glowSprite(0xff6b81, 2.5, 0.9);
    blink.position.set(0, 1.6, 1.2);
    group.add(blink);
    spaceGroup.add(group);
    sat = { group: group, position: group.position, angle: 0.5, blink: blink };
  }

  function rockGeometry(seed, detail) {
    const geo = new THREE.IcosahedronGeometry(1, detail);
    const nz = U.makeNoise(seed);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 0.7 + nz.fbm(x * 1.7 + 5, y * 1.7 + z * 1.3 + 5, 3) * 0.6;
      p.setXYZ(i, x * k, y * k * 0.8, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function buildBelt(count, rMin, rMax, ySpread, color, seed, sizeMax) {
    const geo = rockGeometry(seed, 1);
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.95, metalness: 0.1, flatShading: true });
    const inst = new THREE.InstancedMesh(geo, mat, count);
    const rnd = U.mulberry32(seed);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, r = rMin + (rMax - rMin) * (rnd() + rnd()) / 2;
      p.set(Math.cos(a) * r, (rnd() + rnd() - 1) * ySpread, Math.sin(a) * r);
      e.set(rnd() * 6, rnd() * 6, rnd() * 6);
      q.setFromEuler(e);
      const sc = 0.25 + Math.pow(rnd(), 4) * sizeMax;
      s.set(sc * (0.7 + rnd() * 0.6), sc * (0.7 + rnd() * 0.6), sc * (0.7 + rnd() * 0.6));
      m.compose(p, q, s);
      inst.setMatrixAt(i, m);
    }
    const group = new THREE.Group();
    group.add(inst);
    spaceGroup.add(group);
    belts.push({ group: group, speed: 0.0015 * (300 / rMin) });
  }

  function buildDust() {
    const N = 420;
    const pos = new Float32Array(N * 6);
    const pts = new Float32Array(N * 3);
    const rnd = U.mulberry32(77);
    for (let i = 0; i < N * 3; i++) pts[i] = (rnd() - 0.5) * 120;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xa8e8ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    W.scene.add(lines);
    dust = { lines: lines, pts: pts, N: N, anchor: new THREE.Vector3() };
  }

  function updateDust(dt) {
    if (!dust) return;
    const show = W.mode === 'ship' && !W.terrainBody;
    dust.lines.visible = show;
    if (!show) return;
    const cam = W.camera.position, vel = W.ship.velocity;
    const sp = vel.length();
    const L = 60, pos = dust.lines.geometry.attributes.position.array;
    const k = 0.035 + sp * 0.0018;
    for (let i = 0; i < dust.N; i++) {
      let x = dust.pts[i * 3], y = dust.pts[i * 3 + 1], z = dust.pts[i * 3 + 2];
      let rx = x - cam.x, ry = y - cam.y, rz = z - cam.z;
      if (rx > L) x -= 2 * L; else if (rx < -L) x += 2 * L;
      if (ry > L) y -= 2 * L; else if (ry < -L) y += 2 * L;
      if (rz > L) z -= 2 * L; else if (rz < -L) z += 2 * L;
      dust.pts[i * 3] = x; dust.pts[i * 3 + 1] = y; dust.pts[i * 3 + 2] = z;
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x - vel.x * k - 0.05; pos[i * 6 + 4] = y - vel.y * k; pos[i * 6 + 5] = z - vel.z * k;
    }
    dust.lines.geometry.attributes.position.needsUpdate = true;
    dust.lines.material.opacity = U.clamp(0.12 + sp / 50, 0.12, 0.75);
  }

  function placeBody(b, dt) {
    const def = b.def;
    if (!def.distance) return;
    b.angle += def.speed * dt;
    const p = def.parent ? W.bodies[def.parent].worldPos : ZERO;
    const inc = def.incl || 0;
    b.group.position.set(p.x + Math.cos(b.angle) * def.distance, p.y + Math.sin(b.angle) * def.distance * inc, p.z + Math.sin(b.angle) * def.distance);
  }

  function updateOrbits(dt) {
    for (let i = 0; i < orderedBodies.length; i++) {
      const b = orderedBodies[i];
      placeBody(b, dt);
      if (b.def.type !== 'star') b.mesh.rotation.y += dt * (b.def.type === 'gas giant' ? 0.035 : 0.008);
    }
    for (let i = 0; i < orderedStations.length; i++) {
      const s = orderedStations[i], def = s.def;
      s.angle += def.speed * dt;
      const p = W.bodies[def.parent].worldPos;
      s.group.position.set(p.x + Math.cos(s.angle) * def.distance, p.y, p.z + Math.sin(s.angle) * def.distance);
      s.group.rotation.y += dt * 0.2;
      s.beacon.material.opacity = 0.5 + 0.4 * Math.sin(W.time * 3 + i);
      s.red.material.opacity = Math.sin(W.time * 5 + i) > 0.6 ? 1 : 0.1;
    }
    if (sat) {
      const e = W.bodies['earth'].worldPos;
      sat.angle += 0.012 * dt;
      sat.group.position.set(e.x + Math.cos(sat.angle) * 28, e.y + 4 + Math.sin(sat.angle * 3) * 2, e.z + Math.sin(sat.angle) * 28);
      sat.group.rotation.y += dt * 0.3;
      sat.blink.material.opacity = Math.sin(W.time * 4) > 0.3 ? 0.95 : 0.1;
    }
    for (let i = 0; i < belts.length; i++) belts[i].group.rotation.y += dt * belts[i].speed;
  }

  // ---------- ship & rover ----------
  function makeShip() {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.3, metalness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.4, metalness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fd8ff });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(1.0, 5.2, 20), hullMat);
    hull.rotation.x = -Math.PI / 2;
    group.add(hull);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0b2a3a, roughness: 0.05, metalness: 1, emissive: 0x0a3550 }));
    canopy.scale.set(1, 0.8, 1.8);
    canopy.position.set(0, 0.35, -0.2);
    group.add(canopy);
    for (let s = -1; s <= 1; s += 2) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.8), hullMat);
      wing.position.set(s * 1.7, -0.1, 1.2);
      wing.rotation.y = s * 0.25;
      group.add(wing);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.15), glowMat);
      stripe.position.set(s * 1.75, -0.08, 0.45);
      stripe.rotation.y = s * 0.25;
      group.add(stripe);
    }
    const flames = [];
    for (let i = -1; i <= 1; i += 2) {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 1.3, 14), darkMat);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(i * 0.8, 0, 2.4);
      group.add(eng);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 2.2, 12),
        new THREE.MeshBasicMaterial({ color: 0x7fe6ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
      );
      flame.rotation.x = Math.PI / 2;
      flame.position.set(i * 0.8, 0, 3.9);
      group.add(flame);
      flames.push(flame);
    }
    const halo = glowSprite(0x4fd8ff, 6, 0.4);
    halo.position.z = 3.4;
    group.add(halo);
    const nav1 = glowSprite(0xff4060, 1.2, 1); nav1.position.set(-3, -0.1, 1.4); group.add(nav1);
    const nav2 = glowSprite(0x40ff90, 1.2, 1); nav2.position.set(3, -0.1, 1.4); group.add(nav2);
    W.scene.add(group);
    W.ship = { group: group, velocity: new THREE.Vector3(), flames: flames };
  }

  function makeRover() {
    const group = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.45, metalness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x222a33, roughness: 0.7, metalness: 0.4 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.4), body);
    chassis.position.y = 1.15;
    group.add(chassis);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.4), dark);
    cabin.position.set(0, 1.8, 0.4);
    group.add(cabin);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1b3f80, roughness: 0.25, metalness: 0.3, emissive: 0x06183a }));
    panel.position.set(0, 2.2, -0.9);
    group.add(panel);
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const lugGeo = new THREE.BoxGeometry(0.42, 0.12, 1.0);
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let k = -1; k <= 1; k++) {
        const w = new THREE.Mesh(wheelGeo, dark);
        w.name = 'wheel';
        w.position.set(sx * 1.3, 0.55, k * 1.2);
        w.add(new THREE.Mesh(lugGeo, body));
        group.add(w);
      }
    }
    const lamp = new THREE.SpotLight(0xfff2d0, 1.6, 80, 0.55, 0.5, 1);
    lamp.position.set(0, 2.2, 1.6);
    lamp.target.position.set(0, 0, 20);
    group.add(lamp);
    group.add(lamp.target);
    group.visible = false;
    const hoverGlow = glowSprite(0x7fe6ff, 7, 0.6);
    hoverGlow.position.y = 0.2;
    hoverGlow.visible = false;
    group.add(hoverGlow);
    W.scene.add(group);
    W.rover = { group: group, speed: 0, heading: 0, hoverGlow: hoverGlow };
  }

  // ---------- terrain ----------
  function marsChannelX(z) { return 60 + 30 * Math.sin(z * 0.02); }

  const MOON_POIS = [
    { kind: 'crater', x: 40, z: -30 },
    { kind: 'apollo_marker', x: -50, z: 40 },
    { kind: 'ch1_marker', x: 20, z: 75 },
    { kind: 'ch2_marker', x: -75, z: -25 },
    { kind: 'ch3_marker', x: 95, z: 35 }
  ];
  const MARS_POIS = [
    { kind: 'channel', x: marsChannelX(-40), z: -40 },
    { kind: 'layered_rock', x: -60, z: 30 },
    { kind: 'console', x: 10, z: 80 }
  ];
  const animFeatures = [];

  function missionPois(id) { return id === 'moon' ? MOON_POIS : (id === 'mars' ? MARS_POIS : []); }

  function featureSpots(def, count) {
    const rnd = U.mulberry32(def.seed + 404);
    const taken = missionPois(def.id).map(function (p) { return { x: p.x, z: p.z }; });
    taken.push({ x: 0, z: 0 });
    const out = [];
    for (let i = 0; i < count; i++) {
      for (let tries = 0; tries < 40; tries++) {
        const a = rnd() * Math.PI * 2, r = 40 + rnd() * 90;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (taken.every(function (p) { return Math.hypot(p.x - x, p.z - z) > 32; })) { taken.push({ x: x, z: z }); out.push({ x: x, z: z }); break; }
      }
    }
    return out;
  }

  function makeHeightFn(def, st, feats, spots) {
    const nz = U.makeNoise(def.seed);
    const rnd = U.mulberry32(def.seed + 7);
    const keep = missionPois(def.id).concat(spots);
    const craters = [], lakes = [];
    if (def.id === 'moon') craters.push({ x: 40, z: -30, r: 16, d: 4 });
    spots.forEach(function (p, i) {
      if (feats[i][0] === 'crater') craters.push({ x: p.x, z: p.z, r: 15, d: 4 });
      if (feats[i][0] === 'lake') lakes.push({ x: p.x, z: p.z, r: 20 });
    });
    for (let i = 0; i < (st.craters || 0); i++) {
      const x = (rnd() - 0.5) * 1400, z = (rnd() - 0.5) * 1400, r = 6 + rnd() * rnd() * 45;
      if (Math.hypot(x, z) < r + 45) continue;
      if (keep.some(function (p) { return Math.hypot(x - p.x, z - p.z) < r * 1.6 + 10; })) continue;
      craters.push({ x: x, z: z, r: r, d: r * 0.2 });
    }
    const amp = st.amp;
    return function (x, z) {
      const dist = Math.hypot(x, z);
      const flat = smooth(15, 70, dist);
      if (st.clouds) {
        return ((nz.fbm(x * 0.008, z * 0.008, 3) - 0.5) * amp * 2 + Math.sin(x * 0.03 + nz.noise(x * 0.01, z * 0.01) * 3) * amp * 0.25) * flat;
      }
      let h = ((nz.fbm(x * 0.012, z * 0.012, 4) - 0.5) * amp + (nz.fbm(x * 0.06, z * 0.06, 2) - 0.5) * amp * 0.1) * flat;
      h += smooth(350, 700, dist) * nz.fbm(x * 0.004, z * 0.004, 3) * amp * 5;
      if (st.canyon) {
        const dx = Math.abs(x - marsChannelX(z));
        if (dx < 24) { const t = dx / 24; h -= 9 * (1 - t * t); }
      }
      for (let i = 0; i < craters.length; i++) {
        const c = craters[i], t = Math.hypot(x - c.x, z - c.z) / c.r;
        if (t < 2) {
          if (t < 1) h -= c.d * (1 - t * t);
          const q = (t - 1) / 0.18;
          h += c.d * 0.4 * Math.exp(-q * q);
        }
      }
      for (let i = 0; i < lakes.length; i++) {
        const t = Math.hypot(x - lakes[i].x, z - lakes[i].z) / lakes[i].r;
        if (t < 1.3) h = U.lerp(Math.min(h, -2.5), h, smooth(0.7, 1.3, t));
      }
      return h;
    };
  }

  function markerFx(group, mats) {
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38d6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.2, 48), ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.4;
    group.add(ring);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38d6ff, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 50, 8, 1, true), beamMat);
    beam.position.y = 25;
    group.add(beam);
    mats.push(ringMat, beamMat);
    return ring;
  }

  function makePOI(kind, x, z, hf) {
    const info = G.Scanner.infoFor(kind) || { name: kind };
    const group = new THREE.Group();
    group.position.set(x, hf(x, z), z);
    const mats = [];
    const metal = new THREE.MeshStandardMaterial({ color: 0xb0bac4, roughness: 0.35, metalness: 0.3 });
    let spin = null;

    if (kind === 'apollo_marker') {
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.15), new THREE.MeshStandardMaterial({ color: 0xe0b050, roughness: 0.3, metalness: 0.3 }));
      plaque.position.y = 1.6; plaque.rotation.x = -0.35;
      group.add(plaque);
      for (let s = -1; s <= 1; s += 2) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 6), metal);
        leg.position.set(s * 0.9, 0.8, 0);
        group.add(leg);
      }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6), metal);
      pole.position.set(2.2, 1.7, 0);
      group.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.8 }));
      flag.position.set(3, 2.9, 0);
      group.add(flag);
    } else if (/_marker$/.test(kind)) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 12), metal);
      base.position.y = 0.25;
      group.add(base);
      spin = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshStandardMaterial({ color: 0x38d6ff, emissive: 0x0c4a66, roughness: 0.2, metalness: 0.2, flatShading: true }));
      spin.position.y = 2;
      group.add(spin);
    } else if (kind === 'layered_rock') {
      const cols = [0xc06a38, 0xe0a46a, 0x9a4c28, 0xf0c088, 0xb05e30];
      for (let i = 0; i < cols.length; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(5 - i * 0.6, 0.7, 4.4 - i * 0.5),
          new THREE.MeshStandardMaterial({ color: cols[i], roughness: 1 }));
        m.position.y = 0.35 + i * 0.7; m.rotation.y = i * 0.25;
        group.add(m);
      }
    } else if (kind === 'console') {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1.4), metal);
      desk.position.y = 0.55;
      group.add(desk);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 0.12), new THREE.MeshBasicMaterial({ color: 0x38d6ff }));
      screen.position.set(0, 1.9, -0.3); screen.rotation.x = -0.25;
      group.add(screen);
      mats.push(screen.material);
    }
    const ring = markerFx(group, mats);
    return { id: kind, kind: kind, name: info.name, obj: group, radius: 4, scanned: false, mats: mats, spin: spin, ring: ring, styled: false };
  }

  function stdMat(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.85, metalness: 0.05 }, extra || {}));
  }

  function featureMesh(shape, st, name, def) {
    const g = new THREE.Group();
    const anim = {};
    const icy = /ice|pluto|ceres|europa|enceladus|triton/i.test(def.id + name) || def.id === 'pluto';
    if (shape === 'rock' || shape === 'crater') {
      const geo = rockGeometry(def.seed + 9, 1);
      const n = shape === 'rock' ? 4 : 6;
      for (let i = 0; i < n; i++) {
        const r = new THREE.Mesh(geo, stdMat(st.rock || 0x888888, { flatShading: true }));
        const s = shape === 'rock' ? 0.9 + i * 0.35 : 0.5 + (i % 3) * 0.3;
        const a = i / n * Math.PI * 2, d = shape === 'rock' ? 1.6 * (i % 2) + 0.8 : 13;
        r.scale.set(s, s * 0.7, s);
        r.position.set(Math.cos(a) * d, s * 0.25, Math.sin(a) * d);
        g.add(r);
      }
    } else if (shape === 'volcano') {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 9, 7, 28, 4), stdMat(icy ? 0xdfe8f0 : (st.rock || 0x6a4a3a), { flatShading: true }));
      cone.position.y = 3.5;
      g.add(cone);
      const top = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ color: icy ? 0x9fe8ff : 0xff7a30 }));
      top.rotation.x = -Math.PI / 2; top.position.y = 7.02;
      g.add(top);
      const smoke = glowSprite(icy ? 0xcff4ff : 0xffa060, 9, 0.35);
      smoke.material.blending = THREE.NormalBlending;
      smoke.position.y = 10;
      g.add(smoke);
      anim.plume = smoke;
    } else if (shape === 'ice') {
      const mat = stdMat(0xbfeaff, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88, emissive: 0x0a3550, flatShading: true });
      for (let i = 0; i < 7; i++) {
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), mat);
        const h = 1.5 + (i * 37 % 5) * 0.6;
        c.scale.set(0.6, h, 0.6);
        c.position.set(Math.cos(i * 2.4) * (i ? 1.8 : 0), h * 0.6, Math.sin(i * 2.4) * (i ? 1.8 : 0));
        c.rotation.z = (i - 3) * 0.12;
        g.add(c);
      }
    } else if (shape === 'dune') {
      const mat = stdMat(new THREE.Color(st.high[0], st.high[1], st.high[2]).multiplyScalar(0.9).getHex());
      for (let i = 0; i < 3; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        d.scale.set(2.2, 0.55, 1);
        d.position.set((i - 1) * 6, -0.3, (i % 2) * 4);
        d.rotation.y = 0.3 * i;
        g.add(d);
      }
    } else if (shape === 'tree') {
      const trunk = stdMat(0x7a4e2a), leaf1 = stdMat(0x2fa84f), leaf2 = stdMat(0x59c95a);
      for (let i = 0; i < 9; i++) {
        const t = new THREE.Group();
        const s = 0.8 + (i * 13 % 5) * 0.15;
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 6), trunk);
        tr.position.y = 0.8; t.add(tr);
        const lf = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 8), i % 2 ? leaf1 : leaf2);
        lf.position.y = 3; t.add(lf);
        t.scale.setScalar(s);
        t.position.set(Math.cos(i * 2.1) * (2 + i * 0.9), 0, Math.sin(i * 2.1) * (2 + i * 0.9));
        g.add(t);
      }
    } else if (shape === 'lake') {
      const water = new THREE.Mesh(new THREE.CircleGeometry(22, 48), stdMat(st.water || (def.id === 'moon_io' ? 0xff6a20 : 0x2d8fd8), { roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.88 }));
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.2;
      water.userData.worldY = -1.6;
      g.add(water);
      anim.water = water;
    } else if (shape === 'storm') {
      const c = U.makeCanvas(256, 256), x = c.getContext('2d');
      const col = /Red/.test(name) ? '210,90,60' : (/Dark/.test(name) ? '30,40,110' : '255,255,255');
      x.translate(128, 128);
      for (let i = 0; i < 260; i++) {
        const a = i * 0.11, r = i * 0.45;
        x.fillStyle = 'rgba(' + col + ',' + (0.5 * (1 - i / 260)).toFixed(2) + ')';
        x.beginPath(); x.arc(Math.cos(a) * r, Math.sin(a) * r, 10 - i * 0.03, 0, Math.PI * 2); x.fill();
      }
      const disk = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      disk.rotation.x = -Math.PI / 2;
      disk.position.y = 1.5;
      g.add(disk);
      anim.spin = disk;
    } else if (shape === 'cloud' || shape === 'lightning') {
      const mat = stdMat(shape === 'cloud' ? 0xffffff : 0xb8bcc8, { roughness: 1 });
      for (let i = 0; i < 7; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(1.8 + (i % 3) * 0.7, 14, 10), mat);
        p.position.set(Math.cos(i * 1.7) * 3, 4 + (i % 2) * 1.2, Math.sin(i * 1.7) * 2.2);
        g.add(p);
      }
      anim.bob = g;
      if (shape === 'lightning') {
        const flash = glowSprite(0xe8f4ff, 16, 0);
        flash.position.y = 4;
        g.add(flash);
        anim.flash = flash;
      }
    } else if (shape === 'geyser') {
      const vent = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 16), stdMat(0xe8f0f8));
      vent.position.y = 0.8;
      g.add(vent);
      const plume = glowSprite(0xe8f8ff, 6, 0.55);
      plume.material.blending = THREE.NormalBlending;
      plume.position.y = 9;
      plume.scale.set(5, 18, 1);
      g.add(plume);
      anim.geyser = plume;
    }
    return { group: g, anim: anim };
  }

  function makeFeature(def, st, f, i, x, z, hf) {
    const kind = 'f_' + def.id + '_' + i;
    G.Scanner.register(kind, {
      name: f[1], type: f[3], observation: 'Getting live data about ' + f[1] + '...', tags: [def.name, f[3].toLowerCase()],
      knowledgeId: null, codex: f[2], xp: 15, kora: 'Ooh, ' + f[1] + '! Let me look that up for you.'
    });
    G.Codex.summary(f[2]).then(function (d) {
      if (!d) return;
      const info = G.Scanner.infoFor(kind);
      info.observation = G.Codex.shortText(d.extract, 2);
      info.kora = G.Codex.shortText(d.extract, 2);
    });
    const group = new THREE.Group();
    group.position.set(x, hf(x, z), z);
    const fm = featureMesh(f[0], st, f[1], def);
    group.add(fm.group);
    if (fm.anim.water) fm.anim.water.position.y = fm.anim.water.userData.worldY - group.position.y;
    if (Object.keys(fm.anim).length) animFeatures.push(fm.anim);
    const mats = [];
    const ring = markerFx(group, mats);
    return { id: kind, kind: kind, name: f[1], obj: group, radius: 6, scanned: false, mats: mats, spin: null, ring: ring, styled: false, codex: f[2] };
  }

  function clearTerrain() {
    if (terrainGroup) {
      W.scene.remove(terrainGroup);
      terrainGroup.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      terrainGroup = null;
    }
    W.pois.length = 0;
    animFeatures.length = 0;
    terrain = null;
    W.scene.fog = null;
    W.scene.background = null;
    sky.visible = true;
    stars.visible = true;
    spaceGroup.visible = true;
    sunLight.visible = true;
    terrainLight.visible = false;
    ambient.intensity = SPACE_AMB;
    ambient.color.setHex(0xcfe6ff);
    if (bloomPass) bloomPass.strength = BLOOM * comfortK;
    setHover(false);
  }

  function setHover(on) {
    if (!W.rover) return;
    W.rover.hover = on;
    W.rover.group.children.forEach(function (c) { if (c.name === 'wheel') c.visible = !on; });
    if (W.rover.hoverGlow) W.rover.hoverGlow.visible = on;
  }

  function removeTerrain() {
    const prev = W.terrainBody;
    clearTerrain();
    W.terrainBody = null;
    if (G.Sectors) G.Sectors.setVisible(true);
    const b = prev ? W.bodies[prev] : null;
    if (b && W.ship) {
      const out = b.worldPos.clone().normalize().multiplyScalar(-1);
      if (!isFinite(out.x)) out.set(0, 0, 1);
      W.ship.group.position.copy(b.worldPos).addScaledVector(out, b.def.radius + 16);
      W.ship.velocity.set(0, 0, 0);
      if (G.Ship) G.Ship.face(b.worldPos);
    }
  }

  function buildTerrain(bodyId) {
    clearTerrain();
    const body = W.bodies[bodyId];
    if (!body || body.def.type === 'star') return;
    const def = body.def;
    const st = G.TERRAINS.style(def);
    const feats = G.TERRAINS.features(def);
    const spots = featureSpots(def, feats.length);
    const nz = U.makeNoise(def.seed + 5);
    const hf = makeHeightFn(def, st, feats, spots);
    terrain = { hf: hf };
    W.terrainBody = bodyId;
    terrainGroup = new THREE.Group();

    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEG, TERRAIN_SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = hf(x, z);
      pos.setY(i, h);
      const n = nz.fbm(x * 0.05, z * 0.05, 3);
      let t;
      if (st.clouds) t = 0.5 + 0.5 * Math.sin(z * 0.025 + n * 5 + nz.noise(x * 0.01, z * 0.01) * 2);
      else t = U.clamp(n * 0.9 + h * 0.012 + 0.05, 0, 1);
      let r = U.lerp(st.low[0], st.high[0], t), g = U.lerp(st.low[1], st.high[1], t), b = U.lerp(st.low[2], st.high[2], t);
      if (st.canyon && h < -3) { r *= 0.8; g *= 0.8; b *= 0.8; }
      if (st.water && !st.clouds && h < 0.2) { const s = smooth(0.2, -1.2, h); r = U.lerp(r, 0.86, s); g = U.lerp(g, 0.78, s); b = U.lerp(b, 0.55, s); }
      if (st.water && h > st.amp * 1.4) { const s = smooth(st.amp * 1.4, st.amp * 2.6, h); r = U.lerp(r, 0.55, s); g = U.lerp(g, 0.52, s); b = U.lerp(b, 0.5, s); }
      colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const grain = grainTexture(def.seed + 31);
    terrainGroup.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, map: st.clouds ? null : grain, roughness: 1, metalness: 0
    })));

    if (st.water && !st.clouds) {
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE), stdMat(st.water, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85 }));
      sea.rotation.x = -Math.PI / 2;
      sea.position.y = -1.2;
      terrainGroup.add(sea);
    }

    const rnd = U.mulberry32(def.seed + 21);
    const avoid = missionPois(bodyId).concat(spots);
    if (!st.clouds) {
      const rockGeo = rockGeometry(def.seed + 4, 1);
      const rocks = new THREE.InstancedMesh(rockGeo, stdMat(st.rock || 0x888888, { roughness: 1, flatShading: true }), 420);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
      let n = 0;
      for (let i = 0; i < 600 && n < 420; i++) {
        const x = (rnd() - 0.5) * 1100, z = (rnd() - 0.5) * 1100;
        if (Math.hypot(x, z) < 14) continue;
        if (avoid.some(function (a) { return Math.hypot(x - a.x, z - a.z) < 9; })) continue;
        const s = 0.3 + rnd() * rnd() * rnd() * 4.5;
        p.set(x, hf(x, z) + s * 0.1, z);
        e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e);
        sc.set(s * (0.8 + rnd() * 0.6), s * 0.6, s * (0.8 + rnd() * 0.6));
        m.compose(p, q, sc);
        rocks.setMatrixAt(n++, m);
      }
      rocks.count = n;
      rocks.frustumCulled = false;
      terrainGroup.add(rocks);
    }
    if (st.clouds) {
      const puffGeo = new THREE.SphereGeometry(1, 12, 8);
      const puffs = new THREE.InstancedMesh(puffGeo, stdMat(0xffffff, { roughness: 1, emissive: 0x8a8a8a }), 220);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
      for (let i = 0; i < 220; i++) {
        const cx = (rnd() - 0.5) * 1200, cz = (rnd() - 0.5) * 1200;
        const s = 4 + rnd() * 10;
        p.set(cx, 8 + rnd() * 30, cz);
        sc.set(s * (1.4 + rnd()), s * 0.5, s);
        m.compose(p, q, sc);
        puffs.setMatrixAt(i, m);
      }
      terrainGroup.add(puffs);
      puffs.frustumCulled = false;
    }
    if (bodyId === 'earth') {
      const tg = new THREE.ConeGeometry(1.5, 4, 7);
      tg.translate(0, 2.4, 0);
      const trees = new THREE.InstancedMesh(tg, stdMat(0x3aa84c, { flatShading: true }), 260);
      const m = new THREE.Matrix4();
      let n = 0;
      for (let i = 0; i < 900 && n < 260; i++) {
        const x = (rnd() - 0.5) * 900, z = (rnd() - 0.5) * 900, h = hf(x, z);
        if (h < 0.6 || Math.hypot(x, z) < 20 || avoid.some(function (a) { return Math.hypot(x - a.x, z - a.z) < 10; })) continue;
        const s = 0.7 + rnd() * 0.9;
        m.makeScale(s, s, s).setPosition(x, h, z);
        trees.setMatrixAt(n++, m);
      }
      trees.count = n;
      trees.frustumCulled = false;
      terrainGroup.add(trees);
    }

    missionPois(bodyId).forEach(function (pp) {
      const poi = makePOI(pp.kind, pp.x, pp.z, hf);
      poi.scanned = G.Save.isPoiScanned(bodyId, poi.id);
      terrainGroup.add(poi.obj);
      W.pois.push(poi);
    });
    feats.forEach(function (f, i) {
      const poi = makeFeature(def, st, f, i, spots[i].x, spots[i].z, hf);
      poi.scanned = G.Save.isPoiScanned(bodyId, poi.id);
      terrainGroup.add(poi.obj);
      W.pois.push(poi);
    });

    const parent = def.parent ? W.bodies[def.parent] : (bodyId !== 'earth' && !st.sky ? W.bodies.earth : null);
    if (parent && parent.def.id !== bodyId) {
      const size = U.clamp(55 * parent.def.radius / 13, 45, 200) * (def.parent ? 1 : 0.25);
      const sb = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 32), new THREE.MeshStandardMaterial({ map: parent.mesh.material.map, roughness: 0.8, fog: false }));
      sb.position.set(-700, 380 + size * 0.5, -1150);
      terrainGroup.add(sb);
    }
    const sunSky = glowSprite(0xfff3d6, st.sky ? 150 : 90, st.sky ? 0.5 : 0.8);
    sunSky.material.fog = false;
    sunSky.position.set(900, 700, -900);
    terrainGroup.add(sunSky);

    W.scene.add(terrainGroup);
    // Static terrain never moves: skip per-frame matrix recomputation.
    terrainGroup.children.forEach(function (o) { if (o.isMesh) { o.matrixAutoUpdate = false; o.updateMatrix(); } });
    spaceGroup.visible = false;
    if (G.Sectors) G.Sectors.setVisible(false);
    sunLight.visible = false;
    terrainLight.visible = true;
    terrainLight.intensity = st.light || 1.1;
    terrainLight.position.set(300, 280, -200);
    ambient.intensity = st.amb || 0.45;
    ambient.color.setHex(st.sky || 0xcfe6ff);
    if (bloomPass) bloomPass.strength = BLOOM * 0.6 * comfortK;
    setHover(!!st.clouds);
    if (st.sky) {
      sky.visible = false;
      stars.visible = false;
      W.scene.background = new THREE.Color(st.sky);
      W.scene.fog = new THREE.Fog(st.sky, st.fog[0], st.fog[1]);
    } else {
      W.scene.fog = new THREE.Fog(0x000000, 320, 840);
    }
  }

  function updateFeatures(dt) {
    for (let i = 0; i < animFeatures.length; i++) {
      const a = animFeatures[i];
      if (a.spin) a.spin.rotation.z += dt * 0.25;
      if (a.bob) a.bob.position.y = Math.sin(W.time * 0.8 + i) * 0.6;
      if (a.flash) a.flash.material.opacity = Math.random() < 0.02 ? 0.9 : a.flash.material.opacity * 0.85;
      if (a.plume) { const s = 8.5 + Math.sin(W.time * 0.7 + i) * 0.45; a.plume.scale.set(s, s, 1); }
      if (a.geyser) {
        const p = 0.5 + 0.5 * Math.sin(W.time * 1.2 + i);
        a.geyser.scale.set(4.4 + p * 0.5, 15 + p * 1.2, 1);
        a.geyser.material.opacity = 0.4 + p * 0.2;
      }
    }
  }

  function groundY(x, z) {
    return terrain ? terrain.hf(x, z) : 0;
  }

  // ---------- queries ----------
  function nearestBody(pos, maxDist) {
    if (W.terrainBody) return { body: W.bodies[W.terrainBody], dist: 0 };
    let best = null, bestS = Infinity, bestC = 0;
    for (const id in W.bodies) {
      const b = W.bodies[id];
      const c = pos.distanceTo(b.worldPos);
      if (c > maxDist) continue;
      const s = c - b.def.radius;
      if (s < bestS) { bestS = s; best = b; bestC = c; }
    }
    return best ? { body: best, dist: bestC } : null;
  }

  function nearestStation(pos, maxDist) {
    let best = null, bd = maxDist;
    for (const id in W.stations) {
      const s = W.stations[id];
      const d = pos.distanceTo(s.worldPos);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { station: best, dist: bd } : null;
  }

  function nearestPOI(pos, maxDist) {
    let best = null, bd = maxDist;
    for (let i = 0; i < W.pois.length; i++) {
      const p = W.pois[i];
      const d = pos.distanceTo(p.obj.position);
      if (d < bd) { bd = d; best = p; }
    }
    return best ? { poi: best, dist: bd } : null;
  }

  function bodyPosition(id) {
    if (W.bodies[id]) return W.bodies[id].worldPos;
    if (W.stations[id]) return W.stations[id].worldPos;
    return null;
  }

  function stationPosition(id) {
    return W.stations[id] ? W.stations[id].worldPos : null;
  }

  // ---------- effects ----------
  function pulseScanRing(pos, color) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 64),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.copy(pos);
    m.renderOrder = 950;
    W.scene.add(m);
    pulses.push({ mesh: m, t: 0 });
  }

  function update(dt) {
    W.time += dt;
    updateOrbits(dt);
    for (let i = 0; i < animated.length; i++) animated[i](W.time, dt);
    const cam = W.camera;
    _fm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_fm);
    stars.position.copy(cam.position);
    sky.position.copy(cam.position);
    updateDust(dt);
    updateFeatures(dt);

    for (let i = 0; i < W.pois.length; i++) {
      const p = W.pois[i];
      if (p.spin) { p.spin.rotation.y += dt; p.spin.position.y = 2 + Math.sin(W.time * 2) * 0.2; }
      if (p.ring && !p.scanned) { const s = 1 + 0.12 * Math.sin(W.time * 3); p.ring.scale.set(s, s, s); }
      if (p.scanned && !p.styled) {
        p.styled = true;
        for (let k = 0; k < p.mats.length; k++) p.mats[k].color.setHex(0x5dffa0);
        p.mats[p.mats.length - 1].opacity = 0.08;
      }
    }

    if (objRef && W.terrainBody) {
      let show = false;
      for (let i = 0; i < W.pois.length; i++) if (W.pois[i].obj.position === objRef) show = true;
      objSprite.visible = show;
      if (show) {
        objSprite.position.set(objRef.x, objRef.y + 6, objRef.z);
        const d = cam.position.distanceTo(objRef);
        const s = U.clamp(d * 0.04, 3, 300) * (1 + 0.15 * Math.sin(W.time * 4));
        objSprite.scale.set(s, s, 1);
      }
    } else {
      objSprite.visible = false;
    }

    if (scanState && scanState.position) {
      scanRing.visible = true;
      scanRing.position.copy(scanState.position);
      const r = 14 * (1 - scanState.progress) + 3;
      scanRing.scale.set(r, r, r);
    } else {
      scanRing.visible = false;
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += dt;
      const k = p.t / 1.1;
      if (k >= 1) {
        W.scene.remove(p.mesh);
        p.mesh.geometry.dispose(); p.mesh.material.dispose();
        pulses.splice(i, 1);
        continue;
      }
      const s = 2 + k * 24;
      p.mesh.scale.set(s, s, s);
      p.mesh.material.opacity = 0.9 * (1 - k);
    }
  }

  // Menu backdrop only: keep the Earth orbit and the sun alive, skip dust, terrain props and scan FX.
  function updateLite(dt) {
    W.time += dt;
    updateOrbits(dt);
    for (let i = 0; i < animated.length; i++) animated[i](W.time, dt);
    const cam = W.camera;
    if (stars && cam) stars.position.copy(cam.position);
    if (sky && cam) sky.position.copy(cam.position);
    if (dust) dust.lines.visible = false;
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    W.renderer.setSize(w, h, false);
    W.camera.aspect = w / h;
    W.camera.updateProjectionMatrix();
    if (composer) {
      // The composer keeps its own pixel ratio; without this it stays at the low startup value and the image blurs.
      if (composer.setPixelRatio) composer.setPixelRatio(W.renderer.getPixelRatio());
      composer.setSize(w, h);
    }
  }

  function init(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      powerPreference: 'high-performance',
      precision: 'highp'
    });
    renderer.setPixelRatio(prNow);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x010207, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.25, 20000);
    camera.position.set(240, 30, 90);
    W.renderer = renderer; W.scene = scene; W.camera = camera;

    ambient = new THREE.HemisphereLight(0xcfe6ff, 0x3a3048, SPACE_AMB);
    scene.add(ambient);
    sunLight = new THREE.PointLight(0xfff4e6, 1.45, 0);
    scene.add(sunLight);
    terrainLight = new THREE.DirectionalLight(0xffffff, 1.1);
    terrainLight.visible = false;
    scene.add(terrainLight);

    sky = new THREE.Mesh(new THREE.SphereGeometry(5000, LOW_POWER ? 32 : 64, LOW_POWER ? 16 : 32),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, depthWrite: false, fog: false }));
    sky.rotation.z = 0.5;
    sky.renderOrder = -10;
    scene.add(sky);

    const n = LOW_POWER ? 1600 : 3000, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3);
    const rnd = U.mulberry32(42);
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
      sp[i * 3] = 4200 * Math.sin(ph) * Math.cos(th);
      sp[i * 3 + 1] = 4200 * Math.cos(ph);
      sp[i * 3 + 2] = 4200 * Math.sin(ph) * Math.sin(th);
      const b = 0.5 + rnd() * 0.7, tint = rnd();
      sc[i * 3] = b * (tint < 0.15 ? 1 : 0.85); sc[i * 3 + 1] = b * 0.9; sc[i * 3 + 2] = b * (tint > 0.8 ? 1.2 : 0.95);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
    scene.add(stars);

    spaceGroup = new THREE.Group();
    W.spaceGroup = spaceGroup;
    scene.add(spaceGroup);
    Object.keys(G.PLANETS).forEach(function (id) { buildBody(G.PLANETS[id]); });
    Object.keys(G.STATIONS).forEach(function (id) { buildStation(G.STATIONS[id]); });
    buildSatellite();
    buildBelt(1600, 336, 392, 7, 0x7a6e62, 501, 2.6);
    buildBelt(1000, 722, 805, 22, 0x9fb4c4, 777, 3.2);
    makeShip();
    makeRover();
    buildDust();

    objSprite = glowSprite(0xffb347, 5, 1);
    objSprite.material.depthTest = false;
    objSprite.renderOrder = 999;
    objSprite.visible = false;
    scene.add(objSprite);

    scanRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 64),
      new THREE.MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
    );
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.renderOrder = 950;
    scanRing.visible = false;
    scene.add(scanRing);

    if (THREE.EffectComposer && THREE.UnrealBloomPass) {
      try {
        // A multisampled composer target fights bloom and makes edges crawl.
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        const div = LOW_POWER ? 3 : 2;
        bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth / div, window.innerHeight / div), BLOOM, 0.4, 0.88);
        composer.addPass(bloomPass);
      } catch (e) { composer = null; bloomPass = null; }
    }

    updateOrbits(0);
    const ep = W.bodies['earth'].worldPos;
    W.home = ep.clone();
    W.ship.group.position.set(ep.x + 45, 12, ep.z + 20);

    window.addEventListener('resize', resize);
    resize();
    ready = true;
  }

  const _frustum = new THREE.Frustum(), _fm = new THREE.Matrix4(), _fs = new THREE.Sphere();
  // True when a sphere is inside the camera frustum (from the previous frame's matrices); used to skip work for off-screen props.
  W.inView = function (pos, r) { _fs.center.copy(pos); _fs.radius = r || 1; return _frustum.intersectsSphere(_fs); };
  W.init = init;
  W.isReady = function () { return ready; };
  W.update = update;
  W.updateLite = updateLite;
  // Hold a stable pixel ratio. Stepping it every couple of seconds makes every edge crawl.
  const MAX_PR = Math.min(window.devicePixelRatio || 1, LOW_POWER ? 1.5 : 1.75);
  const MIN_PR = 1;
  let prNow = Math.min(window.devicePixelRatio || 1, LOW_POWER ? 1.25 : 1.5);
  let frames = 0, frameT = performance.now(), badWindows = 0, goodWindows = 0;
  function adaptResolution() {
    frames++;
    const now = performance.now(), el = now - frameT;
    if (el < 2500) return;
    const fps = frames * 1000 / el;
    frames = 0; frameT = now;
    W.fps = Math.round(fps);
    if (document.hidden) return;
    if (fps < 38) { badWindows++; goodWindows = 0; }
    else if (fps > 57) { goodWindows++; badWindows = 0; }
    else { badWindows = 0; goodWindows = 0; }
    if (fps < 32 && prNow <= MIN_PR + 0.01 && composer && badWindows >= 2) { composer = null; bloomPass = null; }
    let next = prNow;
    if (badWindows >= 2 && prNow > MIN_PR) next = Math.max(MIN_PR, prNow - 0.25);
    else if (goodWindows >= 3 && prNow < MAX_PR) next = Math.min(MAX_PR, prNow + 0.25);
    if (Math.abs(next - prNow) > 0.01) {
      prNow = next;
      badWindows = 0; goodWindows = 0;
      W.renderer.setPixelRatio(prNow);
      resize();
    }
  }
  // Keep the depth range tight enough that atmosphere shells and rings stop flickering,
  // while the sky (radius 5000) and the outer system stay inside the far plane.
  function fitClip() {
    const cam = W.camera;
    if (!cam) return;
    let near, far;
    if (W.terrainBody) { near = 0.12; far = 2600; }
    else {
      const d = cam.position.length();
      far = Math.max(9000, d + 2500);
      near = Math.max(0.22, Math.min(1.4, far / 7000));
    }
    if (Math.abs(cam.near - near) > 0.03 || Math.abs(cam.far - far) > 50) {
      cam.near = near;
      cam.far = far;
      cam.updateProjectionMatrix();
    }
  }
  // The menu paints a dark panel over the scene, so a full-resolution bloom pass there only steals frames from the buttons.
  let menuPr = false;
  W.renderDirect = function () {
    const cam = W.camera;
    if (stars && cam) stars.position.copy(cam.position);
    if (sky && cam) sky.position.copy(cam.position);
    fitClip();
    if (!menuPr && W.renderer) {
      menuPr = true;
      W.renderer.setPixelRatio(1);
      resize();
    }
    W.renderer.render(W.scene, W.camera);
  };
  W.render = function () {
    if (menuPr && W.renderer) {
      menuPr = false;
      W.renderer.setPixelRatio(prNow);
      resize();
      frames = 0;
      frameT = performance.now();
      badWindows = 0;
      goodWindows = 0;
    }
    fitClip();
    adaptResolution();
    if (composer) composer.render();
    else W.renderer.render(W.scene, W.camera);
  };
  W.buildTerrain = buildTerrain;
  W.removeTerrain = removeTerrain;
  W.groundY = groundY;
  W.nearestBody = nearestBody;
  W.nearestStation = nearestStation;
  W.nearestPOI = nearestPOI;
  W.bodyPosition = bodyPosition;
  W.stationPosition = stationPosition;
  W.satellite = function () { return sat; };
  W.setObjective = function (pos) { objRef = pos || null; };
  W.setScanState = function (s) { scanState = s; };
  W.pulseScanRing = pulseScanRing;
  W.addBody = addBody;
  W.rockGeometry = rockGeometry;
  W.glowSprite = glowSprite;
  W.mode = 'menu';
  W.lowPower = LOW_POWER;
  W.setComfort = function (on) { comfortK = on ? 0.7 : 1; if (bloomPass) bloomPass.strength = BLOOM * comfortK; };
  return W;
})();
