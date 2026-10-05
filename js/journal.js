window.G = window.G || {};

G.Journal = (function () {
  const U = G.utils;
  let activeTab = 'planets';

  const TABS = [
    { id: 'planets', name: 'Planets' },
    { id: 'cards', name: 'Cards' },
    { id: 'codex', name: 'Live Codex' },
    { id: 'missions', name: 'Missions' },
    { id: 'science', name: 'Science' },
    { id: 'history', name: 'Missions History' },
    { id: 'badges', name: 'Badges' }
  ];

  function knowledgeTopic(id) {
    return G.KNOWLEDGE.find(function (t) { return t.id === id; });
  }

  function render() {
    const st = G.Save.get();
    const tabsEl = U.el('journal-tabs');
    const contentEl = U.el('journal-content');
    tabsEl.innerHTML = '';
    for (let i = 0; i < TABS.length; i++) {
      const b = document.createElement('button');
      b.className = 'journal-tab' + (TABS[i].id === activeTab ? ' active' : '');
      b.textContent = TABS[i].name;
      b.onclick = function () { activeTab = TABS[i].id; render(); };
      tabsEl.appendChild(b);
    }
    let html = '';
    let count = 0;
    const total = G.KNOWLEDGE.length;

    if (activeTab === 'planets') {
      const ids = Object.keys(G.PLANETS);
      for (let i = 0; i < ids.length; i++) {
        const p = G.PLANETS[ids[i]];
        const known = Object.keys(st.knowledge).some(function (k) { return k.indexOf(p.id + '.') === 0; });
        html += '<div class="journal-entry"><h4>' + p.name + '</h4>';
        html += '<div class="je-summary">' + p.desc + '</div>';
        html += '<div class="je-level">' + (known ? 'Scanned' : (st.visited.indexOf(p.id) >= 0 ? 'Visited' : 'Unvisited')) + '</div>';
        html += '</div>';
      }
    } else if (activeTab === 'cards') {
      html = G.Crew.cardsHtml();
    } else if (activeTab === 'codex') {
      const list = (st.codex || []).slice().reverse();
      if (!list.length) html = '<div class="journal-empty">No live entries yet. Fly near planets, moons and asteroids, or scan them, and KORA will download real data from Wikipedia.</div>';
      const E = G.Codex.esc;
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        html += '<div class="journal-entry" style="animation-delay:' + Math.min(i, 12) * 0.04 + 's">';
        if (c.thumb) html += '<img class="je-thumb" src="' + E(c.thumb) + '" alt="">';
        html += '<span class="je-level">live</span><h4>' + E(c.title) + '</h4>';
        if (c.description) html += '<div class="je-sources" style="margin:0 0 6px">' + E(c.description) + '</div>';
        html += '<div class="je-summary">' + E(c.extract) + '</div>';
        if (c.url) html += '<div class="je-sources">Source: <a href="' + E(c.url) + '" target="_blank" rel="noopener noreferrer">Wikipedia</a></div>';
        html += '</div>';
      }
    } else if (activeTab === 'missions') {
      for (let i = 0; i < G.MISSIONS.length; i++) {
        const m = G.MISSIONS[i];
        const done = st.completedMissions.indexOf(m.id) >= 0;
        const active = i === st.missionIndex;
        html += '<div class="journal-entry"><h4>' + (done ? '&#10003; ' : active ? '&#9654; ' : '&#9679; ') + m.title + '</h4>';
        html += '<div class="je-summary"><b>Concept:</b> ' + m.concept + '</div>';
        html += '<div class="je-level">' + (done ? 'Complete' : active ? 'Active' : 'Locked') + '</div>';
        html += '</div>';
      }
    } else if (activeTab === 'science') {
      const ids = Object.keys(st.knowledge);
      if (!ids.length) {
        html = '<div class="journal-empty">No science topics discovered yet. Scan objects with your scanner to learn!</div>';
      }
      for (let i = 0; i < ids.length; i++) {
        const t = knowledgeTopic(ids[i]);
        if (!t) continue;
        count++;
        const k = st.knowledge[ids[i]];
        html += '<div class="journal-entry"><span class="je-level">' + k.level + '</span><h4>' + t.topic + '</h4>';
        html += '<div class="je-summary">' + t.summary + '</div>';
        html += '<div class="je-detail">' + t.child + '</div>';
        html += '<div class="je-sources">Sources: ' + t.sources.join(' | ') + '</div>';
        html += '</div>';
      }
    } else if (activeTab === 'history') {
      const histIds = ['apollo11', 'chandrayaan1', 'chandrayaan2', 'chandrayaan3', 'voyager.missions', 'mars.rovers'];
      for (let i = 0; i < histIds.length; i++) {
        const t = knowledgeTopic(histIds[i]);
        if (!t) continue;
        const known = !!st.knowledge[histIds[i]];
        html += '<div class="journal-entry"><h4>' + (known ? '&#10003; ' : '&#10007; ') + t.topic + '</h4>';
        html += '<div class="je-summary">' + (known ? t.summary : 'Not yet discovered. Keep exploring!') + '</div>';
        if (known) {
          html += '<div class="je-detail">' + t.child + '</div>';
          html += '<div class="je-sources">Sources: ' + t.sources.join(' | ') + '</div>';
        }
        html += '</div>';
      }
    } else if (activeTab === 'badges') {
      for (let i = 0; i < G.BADGES.length; i++) {
        const b = G.BADGES[i];
        const has = G.Save.hasBadge(b.id);
        const hidden = b.secret && !has;
        html += '<div class="badge-item' + (has ? '' : ' locked') + (b.secret ? ' secret' : '') + '">';
        html += '<div class="badge-icon">' + (hidden ? '?' : b.icon) + '</div>';
        html += '<div><div class="badge-name">' + (hidden ? 'Secret Badge' : b.name) + '</div>';
        html += '<div class="badge-desc">' + (hidden ? 'A hidden secret somewhere in the galaxy\u2026' : b.desc) + '</div></div></div>';
      }
    }

    if (activeTab === 'science') {
      U.el('journal-progress').textContent = count + ' / ' + total + ' topics';
    } else if (activeTab === 'cards') {
      U.el('journal-progress').textContent = G.Crew.cardCount() + ' cards collected';
    } else if (activeTab === 'codex') {
      U.el('journal-progress').textContent = (st.codex || []).length + ' live entries';
    } else {
      U.el('journal-progress').textContent = st.completedMissions.length + ' / ' + G.MISSIONS.length + ' missions';
    }
    contentEl.innerHTML = html;
    if (activeTab === 'cards') G.Crew.bindGallery(contentEl);
  }

  function refresh() {
    if (!U.el('journal-panel').classList.contains('hidden')) render();
  }

  function open() {
    U.show('journal-panel');
    render();
  }

  function close() { U.hide('journal-panel'); }

  return { render: render, refresh: refresh, open: open, close: close };
})();
