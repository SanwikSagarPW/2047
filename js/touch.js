window.G = window.G || {};

// Phone/tablet controls: thrust slider, up/down (ship) or steer/reverse (rover) buttons, screen drag to look, action buttons.
G.Touch = (function () {
  const U = G.utils;
  let enabled = false;
  let setThrust = function () { };

  function isTouch() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);
  }

  function bindThrust() {
    const box = U.el('thrust'), track = U.el('th-track'), fill = U.el('th-fill'), knob = U.el('th-knob'), val = U.el('th-val');
    let pid = null;
    setThrust = function (v) {
      v = U.clamp(v, 0, 1);
      fill.style.height = (v * 100) + '%';
      knob.style.bottom = (v * 100) + '%';
      val.textContent = Math.round(v * 100) + '%';
      G.Ship.setCruise(v);
      G.Rover.setCruise(v);
    };
    function move(e) {
      const r = track.getBoundingClientRect();
      setThrust((r.bottom - e.clientY) / r.height);
    }
    box.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      pid = e.pointerId;
      box.setPointerCapture(pid);
      box.classList.add('on');
      move(e);
    });
    box.addEventListener('pointermove', function (e) { if (e.pointerId === pid) move(e); });
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      box.classList.remove('on');
    }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    setThrust(0);
    new MutationObserver(function () { setThrust(0); }).observe(U.el('hud'), { attributes: true, attributeFilter: ['class'] });
  }

  function hold(id, key) {
    const b = U.el(id);
    function set(on) {
      const s = {}; s[key] = on;
      G.Ship.setTouchStates(s);
      G.Rover.setTouchStates(s);
      b.classList.toggle('on', on);
    }
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.setPointerCapture(e.pointerId); set(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { set(false); }); });
  }

  function tap(id, fn) {
    const b = U.el(id);
    b.addEventListener('click', function (e) { e.preventDefault(); G.Audio.unlock(); fn(); });
  }

  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsSupported() {
    const el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  }
  function lockLandscape() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
  }
  function enterFullscreen(quiet) {
    if (fsEl()) return;
    const el = document.documentElement;
    if (!fsSupported()) {
      if (!quiet) G.UI.notify('Fullscreen is not available here. On iPhone use Share > Add to Home Screen.', 'info');
      return;
    }
    try {
      const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
      if (p && p.then) p.then(lockLandscape).catch(function () { if (!quiet) G.UI.notify('Fullscreen was blocked. Tap the button again.', 'info'); });
      else lockLandscape();
    } catch (e) { }
  }
  function toggleFullscreen() {
    if (fsEl()) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { }
    } else enterFullscreen(false);
  }
  function syncFsIcon() {}
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, syncFsIcon); });
  const goFullscreen = function () { enterFullscreen(true); };

  function init() {
    enabled = isTouch();
    document.body.classList.toggle('touch', enabled);
    bindThrust();
    hold('m-boost', 'boost');
    hold('m-brake', 'space');
    U.el('m-brake').addEventListener('pointerdown', function () { setThrust(0); });
    hold('m-up', 'r');
    hold('m-down', 'f');
    hold('m-left', 'a');
    hold('m-right', 'd');
    hold('m-rev', 's');
    tap('m-scan', function () { G.Game.doScan(); });
    tap('m-act', function () { G.Game.doInteract(); });
    tap('m-ship', function () { G.Game.doRoverAction(); });
    tap('m-home', function () { G.Game.goHome(); });
    tap('m-jump', function () { G.Ship.toggleJump(); });
    tap('m-journal', function () { G.Journal.open(); });
    tap('m-talk', function () { G.UI.toggleKora(); });
    tap('m-settings', function () { U.show('settings-panel'); });
    U.el('radar-corner').addEventListener('click', function () { G.UI.toggleMap(); });
    ['hud-objective', 'live-feed'].forEach(function (id) {
      U.el(id).addEventListener('click', function () { if (enabled) U.el(id).classList.toggle('expanded'); });
    });
    if (enabled) {
      ['btn-new-game', 'btn-continue', 'btn-briefing-go'].forEach(function (id) {
        U.el(id).addEventListener('click', goFullscreen);
      });
    }
  }

  return { init: init, enabled: function () { return enabled; }, fullscreen: function () { if (enabled) enterFullscreen(true); } };
})();
