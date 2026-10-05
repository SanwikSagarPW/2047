window.G = window.G || {};

// Live knowledge from Wikipedia (summaries/search) and Wikidata (real moon catalogues), cached locally.
G.Codex = (function () {
  const CACHE_KEY = 'g2047_codex_v2';
  const WIKI = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
  const SEARCH = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=3&srsearch=';
  const SPARQL = 'https://query.wikidata.org/sparql?format=json&query=';
  let cache = {};
  let online = navigator.onLine !== false;
  const pending = {};

  const TITLES = {
    sun: 'Sun', mercury: 'Mercury (planet)', venus: 'Venus', earth: 'Earth', moon: 'Moon', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
    ceres: 'Ceres (dwarf planet)', satellite: 'Satellite'
  };

  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { cache = {}; }
  Object.keys(cache).forEach(function (k) { const c = cache[k]; if (c && c.extract && G.Safety.unsafeContent(c.title, c.extract, c.description)) delete cache[k]; });

  // Wikimedia serves any width on demand; ask for a small one so images stay light on phones.
  const THUMB_W = 360;
  function shrink(u) {
    return typeof u === 'string' ? u.replace(/\/(\d+)px-/, function (m, w) { return +w > THUMB_W ? '/' + THUMB_W + 'px-' : m; }) : u;
  }
  Object.keys(cache).forEach(function (k) { if (cache[k] && cache[k].thumb) cache[k].thumb = shrink(cache[k].thumb); });

  // Retry a failed image once, then hide it so no broken-image icon shows.
  document.addEventListener('error', function (e) {
    const im = e.target;
    if (!im || im.tagName !== 'IMG' || !/^https:/.test(im.src)) return;
    if (!im.dataset.retry) {
      im.dataset.retry = '1';
      const s = im.src;
      setTimeout(function () { im.src = s; }, 1500);
    } else im.style.visibility = 'hidden';
  }, true);
  document.addEventListener('load', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.target.style.visibility = '';
  }, true);

  function persist() {
    const keys = Object.keys(cache);
    if (keys.length > 160) keys.slice(0, keys.length - 160).forEach(function (k) { delete cache[k]; });
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* storage full */ }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function safeUrl(u, host) {
    return typeof u === 'string' && u.indexOf('https://' + host + '/') === 0 ? u : '';
  }

  function shortText(t, n) {
    if (!t) return '';
    const parts = t.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/);
    let out = '';
    for (let i = 0; i < parts.length && i < (n || 3); i++) {
      if (out.length > 340) break;
      out += (out ? ' ' : '') + parts[i];
    }
    return out.trim();
  }

  function timeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]);
  }

  function fetchSummary(lang, title) {
    return timeout(fetch('https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_'))), 8000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (!j || j.type === 'disambiguation' || !j.extract || j.extract.length < 40 || G.Safety.unsafeContent(j.title, j.extract, j.description)) ? null : j; })
      .catch(function () { return null; });
  }

  // Simple English Wikipedia first (written for younger readers), then regular Wikipedia.
  function summary(title) {
    if (!title) return Promise.resolve(null);
    if (cache[title]) return Promise.resolve(cache[title]);
    if (pending[title]) return pending[title];
    let lang = 'simple';
    const p = fetchSummary('simple', title)
      .then(function (j) { if (j) return j; lang = 'en'; return fetchSummary('en', title); })
      .then(function (j) {
        delete pending[title];
        if (!j) { online = navigator.onLine !== false && online; return null; }
        online = true;
        const host = lang + '.wikipedia.org';
        const d = {
          title: j.title,
          description: j.description || '',
          extract: j.extract,
          thumb: shrink(safeUrl(j.thumbnail && j.thumbnail.source, 'upload.wikimedia.org') || safeUrl(j.thumbnail && j.thumbnail.source, 'thumb.wikimedia.org')),
          url: safeUrl(j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page, host),
          source: lang === 'simple' ? 'Simple Wikipedia' : 'Wikipedia'
        };
        cache[title] = d;
        persist();
        return d;
      })
      .catch(function () { delete pending[title]; online = false; return null; });
    pending[title] = p;
    return p;
  }

  function searchIn(lang, q, limit) {
    return timeout(fetch('https://' + lang + '.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=' + (limit || 3) + '&srsearch=' + encodeURIComponent(q)), 8000)
      .then(function (r) { return r.json(); })
      .then(function (j) { online = true; return (j.query && j.query.search) ? j.query.search.filter(function (s) { return !G.Safety.unsafeContent(s.title, s.snippet); }).map(function (s) { return s.title; }) : []; })
      .catch(function () { online = false; return []; });
  }

  function search(q, limit) {
    return searchIn('simple', q, limit).then(function (t) { return t.length ? t : searchIn('en', q, limit); });
  }

  // Topics related to an article, for "explore more" chips.
  function related(title, limit) {
    const key = 'rel:' + title;
    if (cache[key]) return Promise.resolve(cache[key]);
    // morelike needs the exact article title on the same wiki the summary came from.
    return summary(title).then(function (d) {
      const real = d && d.title ? d.title : title;
      const simple = !d || /simple/i.test(d.source || '');
      const first = simple ? searchIn('simple', 'morelike:' + real, (limit || 6) + 1) : Promise.resolve([]);
      return first
        .then(function (t) { return t.length ? t : searchIn('en', 'morelike:' + (d && !simple ? real : title), (limit || 6) + 1); })
        .then(function (t) {
          const list = t.filter(function (x) { return x !== title && x !== real; }).slice(0, limit || 6);
          if (list.length) { cache[key] = list; persist(); }
          return list;
        });
    });
  }

  // Answer a free-form question with a short, live Wikipedia-sourced explanation.
  function ask(question, contextName, subject) {
    if (G.Safety.unsafe(question)) return Promise.resolve(null);
    const q = question.replace(/[?!.]+$/, '').trim();
    const generic = contextName && /\b(it|its|this|that|here|there)\b/i.test(q);
    const query = (generic ? contextName + ' ' : '') + q;
    return search(query, 4).then(function (titles) {
      if (!titles.length) return null;
      let pick = titles[0];
      if (subject && !/^(what|who) (is|are|was) (the |a |an )?\S+$/i.test(q)) {
        const alt = titles.find(function (x) { return x !== subject; });
        if (alt) pick = alt;
      }
      return summary(pick).then(function (d) {
        if (!d) return null;
        return { title: d.title, text: shortText(d.extract, 3), url: d.url, thumb: d.thumb, description: d.description, source: d.source };
      });
    });
  }
  // Real natural satellites of a body from Wikidata, largest first.
  function moonsOf(qid, limit) {
    const key = 'moons:' + qid;
    if (cache[key]) return Promise.resolve(cache[key]);
    const q = 'SELECT ?m ?mLabel (MAX(?r) AS ?rad) (SAMPLE(?a) AS ?art) WHERE { ?m wdt:P397 wd:' + qid +
      '; wdt:P31/wdt:P279* wd:Q2537. OPTIONAL { ?m wdt:P2120 ?r } OPTIONAL { ?a schema:about ?m; schema:isPartOf <https://en.wikipedia.org/> }' +
      ' SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } GROUP BY ?m ?mLabel ORDER BY DESC(?rad) LIMIT ' + (limit || 8);
    return timeout(fetch(SPARQL + encodeURIComponent(q), { headers: { Accept: 'application/sparql-results+json' } }), 12000)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        online = true;
        const list = j.results.bindings.map(function (b) {
          const art = b.art ? decodeURIComponent(b.art.value.split('/wiki/')[1] || '').replace(/_/g, ' ') : b.mLabel.value;
          return { name: b.mLabel.value, radiusKm: b.rad ? parseFloat(b.rad.value) : 0, title: art, qid: b.m.value.split('/').pop() };
        }).filter(function (m) { return !/^Q\d+$/.test(m.name); });
        cache[key] = list;
        persist();
        return list;
      })
      .catch(function () { online = false; return null; });
  }

  // Real stars, exoplanets and galaxies that have English Wikipedia articles (cached for a week).
  function realObjects() {
    const KEY = 'g2047_realobj_v1';
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && c.t > Date.now() - 7 * 864e5 && c.list && c.list.length) return Promise.resolve(c.list);
    } catch (e) { }
    const one = function (cls, kind, limit) {
      const q = 'SELECT ?i ?iLabel (SAMPLE(?a) AS ?art) WHERE { ?i wdt:P31 wd:' + cls + '. ?a schema:about ?i; schema:isPartOf <https://en.wikipedia.org/> .' +
        ' SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } GROUP BY ?i ?iLabel LIMIT ' + limit;
      return timeout(fetch(SPARQL + encodeURIComponent(q), { headers: { Accept: 'application/sparql-results+json' } }), 15000)
        .then(function (r) { return r.json(); })
        .then(function (j) {
          return j.results.bindings.map(function (b) {
            const title = decodeURIComponent((b.art.value.split('/wiki/')[1] || '')).replace(/_/g, ' ');
            return { name: b.iLabel.value, title: title, kind: kind };
          }).filter(function (o) { return o.title && !/^Q\d+$/.test(o.name); });
        })
        .catch(function () { return []; });
    };
    return Promise.all([one('Q44559', 'exo', 300), one('Q523', 'star', 300), one('Q318', 'galaxy', 150)]).then(function (r) {
      const list = r[0].concat(r[1], r[2]);
      if (list.length) {
        online = true;
        try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), list: list })); } catch (e) { }
      }
      return list;
    });
  }

  function record(entry) {
    if (!entry || !entry.title) return false;
    const st = G.Save.get();
    st.codex = st.codex || [];
    if (st.codex.some(function (c) { return c.title === entry.title; })) return false;
    st.codex.push({ title: entry.title, description: entry.description || '', extract: shortText(entry.extract || entry.text, 4), thumb: entry.thumb || '', url: entry.url || '', t: Date.now() });
    G.Save.save();
    return true;
  }

  function titleFor(id) {
    if (TITLES[id]) return TITLES[id];
    const b = G.World && G.World.bodies[id];
    return b && b.def.wiki ? b.def.wiki : null;
  }

  function ping() {
    return summary('Solar System').then(function (d) { return !!d; });
  }

  return {
    summary: summary, ask: ask, search: search, moonsOf: moonsOf, realObjects: realObjects, record: record,
    titleFor: titleFor, shortText: shortText, esc: esc, ping: ping, related: related,
    isOnline: function () { return online; },
    cached: function (t) { return cache[t] || null; }
  };
})();
