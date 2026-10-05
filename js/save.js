window.G = window.G || {};

G.Save = (function () {
  const KEY = 'orbita2047_save';
  const SETTINGS_KEY = 'orbita2047_settings';

  const DEFAULT_SETTINGS = {
    voice: true,
    rate: 1.0,
    music: 0.5,
    sfx: 0.8,
    reducedMotion: false,
    eyeComfort: true,
    highContrast: false,
    textSize: 'normal'
  };

  function defaultState() {
    return {
      profile: null,
      xp: 0,
      missionIndex: 0,
      missionStep: 0,
      completedMissions: [],
      knowledge: {},
      badges: [],
      visited: [],
      unlocked: ['earth', 'moon', 'mars'],
      scannedPois: {},
      worldPos: null,
      questionsAsked: 0,
      quizStats: {},
      upgrades: { scanner: 0, storage: 0, solar: 0, comms: 0 },
      fuel: 100,
      power: 100,
      settings: Object.assign({}, DEFAULT_SETTINGS)
    };
  }

  let state = defaultState();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(defaultState(), parsed);
        state.settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings || {});
      }
    } catch (e) {
      state = defaultState();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { }
  }

  function wipe() {
    state = defaultState();
    try { localStorage.removeItem(KEY); } catch (e) { }
  }

  function get() { return state; }

  function exportFile() {
    save();
    const payload = { game: 'orbita2047', version: 1, exportedAt: new Date().toISOString(), data: state };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const name = ((state.profile && state.profile.name) || 'explorer').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 24);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '2047-save-' + name + '-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // Only copy known fields with the expected types so a hand-edited file can't inject odd data.
  function sanitize(d) {
    const base = defaultState();
    const out = defaultState();
    for (const k in base) {
      if (!(k in d)) continue;
      const v = d[k], ref = base[k];
      if (ref === null) { if (v === null || typeof v === 'object') out[k] = v; }
      else if (Array.isArray(ref)) { if (Array.isArray(v)) out[k] = v; }
      else if (typeof ref === typeof v) out[k] = v;
    }
    if (Array.isArray(d.codex)) out.codex = d.codex.slice(0, 500);
    if (d.sectors && typeof d.sectors === 'object') out.sectors = d.sectors;
    if (out.profile) {
      out.profile = Object.assign({}, out.profile, { name: String(out.profile.name || 'Explorer').slice(0, 16) });
    }
    out.settings = Object.assign({}, DEFAULT_SETTINGS, typeof d.settings === 'object' ? d.settings : {});
    out.fuel = Math.max(0, Math.min(100, Number(out.fuel) || 0));
    out.power = Math.max(0, Math.min(100, Number(out.power) || 0));
    return out;
  }

  function importFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No file selected.'));
      if (file.size > 2 * 1024 * 1024) return reject(new Error('That file is too large to be a 2047 save.'));
      const r = new FileReader();
      r.onerror = function () { reject(new Error('Could not read the file.')); };
      r.onload = function () {
        let parsed;
        try { parsed = JSON.parse(r.result); } catch (e) { return reject(new Error('This is not a valid save file.')); }
        if (!parsed || parsed.game !== 'orbita2047' || typeof parsed.data !== 'object' || !parsed.data) {
          return reject(new Error('This file is not a 2047 expedition save.'));
        }
        state = sanitize(parsed.data);
        save();
        resolve(state);
      };
      r.readAsText(file);
    });
  }

  function setProfile(p) { state.profile = p; save(); }

  function addXp(amount) {
    state.xp += amount;
    save();
    return rank();
  }

  function rank() {
    const ranks = G.RANKS;
    let r = ranks[0];
    for (let i = 0; i < ranks.length; i++) {
      if (state.xp >= ranks[i].xp) r = ranks[i];
    }
    return r;
  }

  function hasKnowledge(id) {
    return !!state.knowledge[id];
  }

  function unlockKnowledge(id, level) {
    if (!state.knowledge[id]) {
      state.knowledge[id] = { level: level || 'seen', scans: 1 };
      save();
      return true;
    }
    state.knowledge[id].scans++;
    if (level === 'scanned') state.knowledge[id].level = 'scanned';
    save();
    return false;
  }

  function setKnowledgeLevel(id, level) {
    if (state.knowledge[id]) {
      state.knowledge[id].level = level;
      save();
    }
  }

  function hasBadge(id) {
    return state.badges.indexOf(id) >= 0;
  }

  function awardBadge(id) {
    if (!hasBadge(id)) {
      state.badges.push(id);
      save();
      return true;
    }
    return false;
  }

  function visit(id) {
    if (state.visited.indexOf(id) < 0) {
      state.visited.push(id);
      save();
    }
  }

  function isUnlocked(id) {
    return state.unlocked && state.unlocked.indexOf(id) >= 0;
  }

  function unlock(ids) {
    if (!state.unlocked) state.unlocked = ['earth', 'moon', 'mars'];
    let added = false;
    const list = Array.isArray(ids) ? ids : [ids];
    for (let i = 0; i < list.length; i++) {
      if (list[i] && state.unlocked.indexOf(list[i]) < 0) {
        state.unlocked.push(list[i]);
        added = true;
      }
    }
    if (added) save();
    return added;
  }

  function markPoiScanned(bodyId, poiId) {
    if (!state.scannedPois) state.scannedPois = {};
    state.scannedPois[bodyId + ':' + poiId] = true;
    save();
  }

  function isPoiScanned(bodyId, poiId) {
    return !!(state.scannedPois && state.scannedPois[bodyId + ':' + poiId]);
  }

  function setWorldPos(data) {
    state.worldPos = data;
  }

  function getWorldPos() {
    return state.worldPos;
  }

  function completeMission(id) {
    if (state.completedMissions.indexOf(id) < 0) {
      state.completedMissions.push(id);
    }
  }

  function recordQuestion() {
    state.questionsAsked++;
    save();
  }

  function recordQuiz(id, correct) {
    if (!state.quizStats[id]) state.quizStats[id] = { attempts: 0, correct: 0 };
    state.quizStats[id].attempts++;
    if (correct) state.quizStats[id].correct++;
    save();
  }

  function setSettings(s) {
    state.settings = Object.assign({}, state.settings, s);
    save();
  }

  return {
    load: load, save: save, wipe: wipe, get: get,
    exportFile: exportFile, importFile: importFile,
    setProfile: setProfile, addXp: addXp, rank: rank,
    hasKnowledge: hasKnowledge, unlockKnowledge: unlockKnowledge, setKnowledgeLevel: setKnowledgeLevel,
    hasBadge: hasBadge, awardBadge: awardBadge,
    visit: visit, completeMission: completeMission,
    isUnlocked: isUnlocked, unlock: unlock,
    markPoiScanned: markPoiScanned, isPoiScanned: isPoiScanned,
    setWorldPos: setWorldPos, getWorldPos: getWorldPos,
    recordQuestion: recordQuestion, recordQuiz: recordQuiz,
    setSettings: setSettings
  };
})();
