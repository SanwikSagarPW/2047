window.G = window.G || {};

G.utils = (function () {
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeNoise(seed) {
    const rand = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    function hash(x, y) { return perm[(perm[x & 255] + y) & 255] / 255; }
    function noise(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return lerp(lerp(a, b, u), lerp(c, d, u), v);
    }
    function fbm(x, y, oct) {
      let v = 0, amp = 0.5, f = 1, tot = 0;
      for (let i = 0; i < oct; i++) { v += amp * noise(x * f, y * f); tot += amp; amp *= 0.5; f *= 2; }
      return v / tot;
    }
    return { noise: noise, fbm: fbm };
  }

  function normalizeText(str) {
    return str.toLowerCase()
      .replace(/['’]/g, "'")
      .replace(/[^a-z0-9'\s]/g, ' ')
      .replace(/\bwhats\b/g, 'what is')
      .replace(/\bwhat're\b/g, 'what are')
      .replace(/\bwhys\b/g, 'why is')
      .replace(/\bdoesnt\b/g, 'does not')
      .replace(/\bdont\b/g, 'do not')
      .replace(/\bcant\b/g, 'can not')
      .replace(/\bwont\b/g, 'will not')
      .replace(/\bim\b/g, 'i am')
      .replace(/\bdoes mars look red\b/g, 'why is mars red')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const d = new Array(n + 1);
    for (let j = 0; j <= n; j++) d[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = d[j];
        d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return d[n];
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function shade(hex, f) {
    const c = hexToRgb(hex);
    const r = clamp(Math.round(c.r * f), 0, 255);
    const g = clamp(Math.round(c.g * f), 0, 255);
    const b = clamp(Math.round(c.b * f), 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function el(id) { return document.getElementById(id); }

  function show(id) { el(id).classList.remove('hidden'); }
  function hide(id) { el(id).classList.add('hidden'); }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  return {
    clamp: clamp, lerp: lerp, dist: dist,
    mulberry32: mulberry32, makeNoise: makeNoise,
    normalizeText: normalizeText, levenshtein: levenshtein,
    hexToRgb: hexToRgb, shade: shade,
    el: el, show: show, hide: hide, makeCanvas: makeCanvas
  };
})();
