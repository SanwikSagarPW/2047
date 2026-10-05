window.G = window.G || {};

// Surface looks and scannable features for every world you can land on.
// Colours are 0-1 RGB; titles are Simple/English Wikipedia article names used for live knowledge.
G.TERRAINS = (function () {
  const S = {
    moon: { low: [0.36, 0.36, 0.39], high: [0.8, 0.8, 0.83], amp: 12, craters: 40, rock: 0x8a8a8f, light: 1.25, amb: 0.4 },
    mars: { low: [0.5, 0.22, 0.1], high: [0.95, 0.56, 0.3], amp: 18, canyon: true, sky: 0xe0a77c, fog: [160, 780], rock: 0x8a4a2a, light: 1.1, amb: 0.55 },
    mercury: { low: [0.34, 0.31, 0.29], high: [0.74, 0.69, 0.62], amp: 14, craters: 60, rock: 0x7a706a, light: 1.4, amb: 0.4 },
    venus: { low: [0.6, 0.4, 0.14], high: [0.98, 0.8, 0.42], amp: 20, sky: 0xf0c070, fog: [70, 460], rock: 0x9a6a30, light: 0.95, amb: 0.65 },
    earth: { low: [0.22, 0.5, 0.2], high: [0.62, 0.8, 0.36], amp: 16, sky: 0x8fd3ff, fog: [200, 820], water: 0x2d8fd8, rock: 0x7a7a72, light: 1.2, amb: 0.65 },
    jupiter: { low: [0.75, 0.55, 0.38], high: [0.98, 0.88, 0.72], amp: 9, clouds: true, sky: 0xe9c79a, fog: [260, 950], light: 1.1, amb: 0.42 },
    saturn: { low: [0.82, 0.7, 0.45], high: [1.0, 0.94, 0.72], amp: 9, clouds: true, sky: 0xf1dcaa, fog: [260, 950], light: 1.1, amb: 0.42 },
    uranus: { low: [0.45, 0.78, 0.82], high: [0.75, 0.95, 0.96], amp: 9, clouds: true, sky: 0x9fe6ee, fog: [260, 950], light: 1.1, amb: 0.42 },
    neptune: { low: [0.18, 0.35, 0.8], high: [0.5, 0.7, 1.0], amp: 9, clouds: true, sky: 0x5d86e6, fog: [260, 950], light: 1.1, amb: 0.42 },
    pluto: { low: [0.62, 0.55, 0.5], high: [0.98, 0.95, 0.9], amp: 14, craters: 20, rock: 0xc9c2b8, light: 1.1, amb: 0.5 },
    ceres: { low: [0.28, 0.28, 0.3], high: [0.6, 0.6, 0.62], amp: 12, craters: 50, rock: 0x6a6a6e, light: 1.3, amb: 0.45 },
    moon_io: { low: [0.75, 0.62, 0.15], high: [1.0, 0.92, 0.45], amp: 12, craters: 5, rock: 0xb08a30, light: 1.2, amb: 0.5 },
    moon_europa: { low: [0.7, 0.66, 0.6], high: [0.98, 0.97, 0.95], amp: 6, craters: 4, rock: 0xd8d0c4, light: 1.1, amb: 0.5 },
    moon_titan: { low: [0.5, 0.33, 0.14], high: [0.85, 0.6, 0.32], amp: 10, sky: 0xd99a4a, fog: [80, 520], water: 0x3a2a18, rock: 0x7a5a30, light: 0.9, amb: 0.65 },
    icy: { low: [0.6, 0.65, 0.7], high: [0.95, 0.97, 1.0], amp: 10, craters: 30, rock: 0xc8d4e0, light: 1.15, amb: 0.5 },
    rocky: { low: [0.34, 0.32, 0.31], high: [0.72, 0.7, 0.67], amp: 12, craters: 35, rock: 0x8a847e, light: 1.2, amb: 0.45 }
  };

  const F = {
    moon: [['rock', 'Moon rock', 'Moon rock', 'LUNAR SAMPLE'], ['crater', 'Moon dust', 'Regolith', 'SURFACE DUST']],
    mars: [['volcano', 'Mini volcano', 'Olympus Mons', 'SHIELD VOLCANO'], ['dune', 'Red sand dunes', 'Dune', 'SAND DUNE'], ['rock', 'Martian rock', 'Geology of Mars', 'ROCK SAMPLE']],
    mercury: [['crater', 'Caloris Basin', 'Caloris Planitia', 'GIANT CRATER'], ['ice', 'Polar ice', 'Mercury (planet)', 'ICE DEPOSIT'], ['rock', 'Sun-baked rock', 'Rock (geology)', 'ROCK SAMPLE']],
    venus: [['volcano', 'Maat Mons', 'Maat Mons', 'VOLCANO'], ['dune', 'Acid clouds', 'Atmosphere of Venus', 'ATMOSPHERE'], ['rock', 'Hot rock plain', 'Venus', 'ROCK SAMPLE']],
    earth: [['tree', 'Forest', 'Forest', 'LIVING THINGS'], ['volcano', 'Volcano', 'Volcano', 'VOLCANO'], ['rock', 'Granite boulder', 'Granite', 'ROCK SAMPLE'], ['lake', 'Ocean water', 'Ocean', 'WATER']],
    jupiter: [['storm', 'Great Red Spot', 'Great Red Spot', 'GIANT STORM'], ['cloud', 'Ammonia clouds', 'Atmosphere of Jupiter', 'CLOUD LAYER'], ['lightning', 'Jovian lightning', 'Lightning', 'LIGHTNING']],
    saturn: [['storm', 'Hexagon storm', "Saturn's hexagon", 'POLAR STORM'], ['cloud', 'Golden cloud bands', 'Saturn', 'CLOUD LAYER'], ['ice', 'Ring ice chunk', 'Rings of Saturn', 'RING ICE']],
    uranus: [['cloud', 'Methane clouds', 'Methane', 'CLOUD LAYER'], ['ice', 'Icy mantle', 'Ice giant', 'ICE'], ['storm', 'Polar storm', 'Uranus', 'STORM']],
    neptune: [['storm', 'Great Dark Spot', 'Great Dark Spot', 'GIANT STORM'], ['cloud', 'Super-fast winds', 'Wind', 'WIND'], ['ice', 'Diamond rain', 'Diamond', 'DEEP WEATHER']],
    pluto: [['ice', 'Sputnik Planitia', 'Sputnik Planitia', 'NITROGEN ICE PLAIN'], ['volcano', 'Wright Mons', 'Wright Mons', 'ICE VOLCANO'], ['rock', 'Water-ice mountain', 'Pluto', 'ICE MOUNTAIN']],
    ceres: [['crater', 'Occator Crater', 'Occator (crater)', 'BRIGHT CRATER'], ['ice', 'Salt spots', 'Salt', 'SALT DEPOSIT'], ['volcano', 'Ahuna Mons', 'Ahuna Mons', 'ICE VOLCANO']],
    moon_io: [['volcano', 'Loki Patera', 'Loki Patera', 'ACTIVE VOLCANO'], ['rock', 'Sulfur crust', 'Sulfur', 'SULFUR'], ['lake', 'Lava lake', 'Lava', 'LAVA']],
    moon_europa: [['ice', 'Ice cracks', 'Europa (moon)', 'ICE SHELL'], ['geyser', 'Water plume', 'Cryovolcano', 'WATER PLUME'], ['rock', 'Salty ice', 'Ice', 'ICE SAMPLE']],
    moon_titan: [['lake', 'Methane lake', 'Lakes of Titan', 'METHANE LAKE'], ['dune', 'Hydrocarbon dunes', 'Titan (moon)', 'DUNES'], ['rock', 'Water-ice pebbles', 'Ice', 'ICE PEBBLES']],
    moon_enceladus: [['geyser', 'Tiger stripe geyser', 'Cryovolcano', 'ICE GEYSER'], ['ice', 'Fresh snow', 'Enceladus', 'SNOW']],
    moon_triton: [['geyser', 'Nitrogen geyser', 'Cryovolcano', 'GEYSER'], ['ice', 'Cantaloupe terrain', 'Triton (moon)', 'ICE TERRAIN']],
    icy: [['ice', 'Ice field', 'Ice', 'ICE'], ['crater', 'Impact crater', 'Impact crater', 'CRATER'], ['rock', 'Frozen rock', 'Moon', 'ROCK SAMPLE']],
    rocky: [['crater', 'Impact crater', 'Impact crater', 'CRATER'], ['rock', 'Space rock', 'Rock (geology)', 'ROCK SAMPLE']]
  };

  function key(def) {
    if (S[def.id]) return def.id;
    const c = new THREE.Color(def.color || '#999');
    return (c.r + c.g + c.b) / 3 > 0.62 ? 'icy' : 'rocky';
  }

  return {
    style: function (def) { return S[key(def)]; },
    features: function (def) { return F[key(def)] || F.rocky; },
    isGas: function (def) { return !!(S[key(def)] && S[key(def)].clouds); }
  };
})();
