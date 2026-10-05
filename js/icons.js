window.G = window.G || {};

// Inline SVG icon set. Replaces emoji so every device draws the same crisp, themeable icons.
(function () {
  const P = {
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    gear: (function () {
      // 8-tooth cog outline generated once.
      let d = '';
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? 7.2 : 9.6, a0 = (i / 16) * Math.PI * 2 - 0.13, a1 = ((i + 1) / 16) * Math.PI * 2 - 0.13 - 0.0;
        const p = function (a) { return (12 + Math.cos(a) * r).toFixed(2) + ' ' + (12 + Math.sin(a) * r).toFixed(2); };
        d += (i ? 'L' : 'M') + p(a0 + 0.06) + 'L' + p(a1 - 0.06);
      }
      return '<path d="' + d + 'Z"/><circle cx="12" cy="12" r="3"/>';
    })(),
    menu: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
    astronaut: '<path d="M12 3a6 6 0 0 0-6 6v2a6 6 0 0 0 12 0V9a6 6 0 0 0-6-6z"/><path d="M8.5 9.5h7v3a3.5 3.5 0 0 1-7 0z"/><path d="M5 21c0-3 3-5 7-5s7 2 7 5"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    station: '<path d="M12 7v10"/><rect x="3" y="9.5" width="6" height="5" rx="1"/><rect x="15" y="9.5" width="6" height="5" rx="1"/><path d="M9 12h6"/><circle cx="12" cy="12" r="1.6"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.8"/><path d="M12 17v.1"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a3 3 0 0 0 4 3M16 6h4v2a3 3 0 0 1-4 3"/><path d="M12 13v4M8 20h8M10 17h4"/>',
    card: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>',
    alien: '<path d="M12 3c-5 0-8 4-8 8 0 5 4 9 8 10 4-1 8-5 8-10 0-4-3-8-8-8z"/><path d="M7.5 11.5l3 1.5M16.5 11.5l-3 1.5"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
    crystal: '<circle cx="12" cy="11" r="8"/><path d="M7 21h10M9 19v2M15 19v2M8.5 9a4 4 0 0 1 3-2.5"/>',
    robot: '<rect x="6" y="8" width="12" height="10" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5M4 12v3M20 12v3"/>',
    clover: '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M12 12l5 9"/>',
    ribbon: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
    wave: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 13"/>',
    medal: '<circle cx="12" cy="9" r="6" class="fillc"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/><path d="M12 6.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2L8.8 8.5 11 8.2z" class="strokew"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    planet: '<circle cx="12" cy="12" r="5"/><path d="M3.2 15.5c-1.2-2.3 3.8-6.3 11.3-8.6M20.8 8.5c1.2 2.3-3.8 6.3-11.3 8.6"/>',
    ring: '<circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-18 12 12)"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
    comet: '<circle cx="17" cy="7" r="3"/><path d="M14.8 9.2L4 20M12 6L5 9M18 12l-3 7"/>',
    star: '<path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.3l-5.6 3 1.2-6.3L3 9.6l6.3-.8z"/>',
    rocket: '<path d="M12 3c3 2 5 6 5 10l-2 3H9l-2-3c0-4 2-8 5-10z"/><path d="M9 16l-3 4 4-1M15 16l3 4-4-1"/><circle cx="12" cy="9.5" r="1.6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>'
  };

  G.Icon = function (name, opts) {
    const body = P[name] || P.star;
    const o = opts || {};
    const col = o.color ? ' style="color:' + o.color + '"' : '';
    return '<svg class="ic ic-' + name + '" viewBox="0 0 24 24" aria-hidden="true"' + col + '>' + body + '</svg>';
  };

  // Fill <i data-ic="name"> placeholders in static markup.
  G.Icons = {
    apply: function (root) {
      (root || document).querySelectorAll('[data-ic]').forEach(function (el) {
        if (el._ic) return;
        el._ic = true;
        el.innerHTML = G.Icon(el.getAttribute('data-ic'));
      });
    }
  };
  document.addEventListener('DOMContentLoaded', function () { G.Icons.apply(); });
  if (document.readyState !== 'loading') G.Icons.apply();
})();
