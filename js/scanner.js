window.G = window.G || {};

G.Scanner = (function () {
  const U = G.utils;
  let scanning = null;
  let scanProgress = 0;
  const SCAN_TIME = 2.2;

  const SCAN_INFO = {
    satellite: {
      name: 'Training Satellite', type: 'ARTIFICIAL SATELLITE',
      observation: 'Box-shaped body with solar panel arrays and a communications dish. It relays signals between Earth and spacecraft.',
      tags: ['communication', 'orbit', 'solar power'],
      knowledgeId: 'satellite.overview',
      kora: 'This satellite is a human-made machine orbiting Earth. It helps with phone signals, weather forecasts and GPS. It stays up by falling around Earth continuously.'
    },
    crater: {
      name: 'Impact Crater', type: 'IMPACT CRATER',
      observation: 'Circular depression with a raised rim of ejected material. The bowl shape and preserved rim suggest a relatively young impact.',
      tags: ['meteoroid impact', 'round shape', 'ejecta rim'],
      knowledgeId: 'moon.craters',
      kora: 'Something hit this place very hard. Happily, our current mission is not responsible. The round shape and raised rim are classic signs of a meteoroid impact.'
    },
    apollo_marker: {
      name: 'Apollo 11 Historical Marker', type: 'HISTORICAL SITE',
      observation: 'A memorial plaque marking where Apollo 11 astronauts collected samples in 1969. Bootprint patterns are preserved in the dust nearby.',
      tags: ['Apollo 11', '1969', 'human exploration', 'samples'],
      knowledgeId: 'apollo11',
      kora: 'On 20 July 1969, Neil Armstrong and Buzz Aldrin walked here. The rocks they collected are still studied in laboratories today.'
    },
    ch1_marker: {
      name: 'Chandrayaan-1 Capsule', type: 'KNOWLEDGE CAPSULE',
      observation: 'A holographic data capsule containing records of India\'s first Moon mission, launched by ISRO in 2008.',
      tags: ['Chandrayaan-1', 'ISRO', 'India', 'orbiter'],
      knowledgeId: 'chandrayaan1',
      kora: 'Chandrayaan-1 orbited the Moon and found evidence of water molecules on its surface. India\'s first Moon mission — a huge achievement.'
    },
    ch2_marker: {
      name: 'Chandrayaan-2 Capsule', type: 'KNOWLEDGE CAPSULE',
      observation: 'A holographic data capsule containing records of the 2019 mission with its orbiter, Vikram lander and Pragyan rover.',
      tags: ['Chandrayaan-2', 'ISRO', 'lander', 'rover'],
      knowledgeId: 'chandrayaan2',
      kora: 'Chandrayaan-2 carried an orbiter, a lander and a rover. The orbiter still works today. Landing is hard — the mission taught scientists a great deal.'
    },
    ch3_marker: {
      name: 'Chandrayaan-3 Capsule', type: 'KNOWLEDGE CAPSULE',
      observation: 'A holographic data capsule containing records of the 2023 mission that landed near the Moon\'s south pole.',
      tags: ['Chandrayaan-3', 'ISRO', 'south pole', 'Pragyan'],
      knowledgeId: 'chandrayaan3',
      kora: 'In August 2023, Chandrayaan-3 made India the first country to land near the Moon\'s south pole. The Pragyan rover studied the soil and temperature.'
    },
    channel: {
      name: 'Dry River Channel', type: 'ANCIENT CHANNEL',
      observation: 'A winding, carved channel with smooth banks and a flat floor — shapes typically cut by flowing liquid over long periods.',
      tags: ['ancient water', 'erosion', 'valley'],
      knowledgeId: 'mars.water',
      kora: 'This channel was almost certainly carved by flowing water. Billions of years ago, Mars was warmer and wetter than it is today.'
    },
    layered_rock: {
      name: 'Layered Rock Formation', type: 'SEDIMENTARY LAYERS',
      observation: 'Stacked rock layers of different colours and thicknesses. Layering like this often forms when material settles in water over time.',
      tags: ['sediment', 'layers', 'water evidence'],
      knowledgeId: 'mars.rovers',
      kora: 'These layers are like pages in a book. They often form when sediment settles in lakes or rivers — more evidence that water once flowed here.'
    },
    console: {
      name: 'Evidence Console', type: 'SCIENCE INSTRUMENT',
      observation: 'A field console ready to receive your observations. Combine the channel and rock evidence to form a conclusion.',
      tags: ['evidence', 'conclusion', 'scientific method'],
      knowledgeId: 'science.method',
      kora: 'Time to think like a scientist. What did you observe? What does the evidence tell you? Form your conclusion.'
    },
    rock: {
      name: 'Surface Rock', type: 'GEOLOGICAL SAMPLE',
      observation: 'A weathered rock showing mineral grains and surface alteration patterns consistent with long exposure.',
      tags: ['geology', 'minerals', 'surface'],
      knowledgeId: null,
      kora: 'A fine specimen. Rocks are history books — every mineral grain tells a story about the world it came from.'
    },

    // ---- Orbital body scans (scanned from the ship) ----
    earth: {
      name: 'Earth', type: 'ROCKY PLANET',
      observation: 'A blue world wrapped in swirling white clouds, with green-brown continents and vast liquid-water oceans.',
      tags: ['oceans', 'atmosphere', 'life', 'our home'],
      knowledgeId: 'earth.overview',
      kora: 'That pale blue dot is home. Liquid water, a breathable atmosphere and the only life we have ever found. Take a good look — everything else is colder and far more dangerous.'
    },
    moon: {
      name: 'The Moon', type: 'NATURAL SATELLITE',
      observation: 'A grey, airless sphere pocked with craters and dark flat maria. No clouds, no water, no wind.',
      tags: ['craters', 'maria', 'no atmosphere'],
      knowledgeId: 'moon.overview',
      kora: 'Earth\'s only natural satellite. It keeps one face toward us, has no air, and preserves every footprint ever left there. A perfect museum of impacts.'
    },
    mars: {
      name: 'Mars', type: 'ROCKY PLANET',
      observation: 'A rust-red world with polar ice caps, enormous volcanoes and a canyon system that dwarfs any on Earth.',
      tags: ['red planet', 'polar caps', 'canyons'],
      knowledgeId: 'mars.overview',
      kora: 'The Red Planet, painted by iron-rich dust. It is small, cold and dusty — and the best place we know of to look for the story of ancient water.'
    },
    mercury: {
      name: 'Mercury', type: 'ROCKY PLANET',
      observation: 'A small, grey, heavily cratered world very close to the Sun, with almost no atmosphere.',
      tags: ['cratered', 'closest to Sun', 'extreme temperatures'],
      knowledgeId: 'mercury.overview',
      kora: 'Mercury is the smallest planet and the closest to the Sun. Days there are scorching and nights are freezing, because there is almost no air to trap heat.'
    },
    venus: {
      name: 'Venus', type: 'ROCKY PLANET',
      observation: 'A bright, featureless globe hidden under thick, reflective clouds of sulphuric acid.',
      tags: ['thick clouds', 'greenhouse effect', 'hottest planet'],
      knowledgeId: 'venus.atmosphere',
      kora: 'Venus is the hottest planet — hotter even than Mercury. Its thick clouds trap heat in a runaway greenhouse effect. A beautiful, deadly world.'
    },
    sun: {
      name: 'The Sun', type: 'STAR',
      observation: 'A blinding sphere of glowing plasma, the source of nearly all the light and heat in the Solar System.',
      tags: ['star', 'plasma', 'light and heat'],
      knowledgeId: 'sun.overview',
      kora: 'The Sun is a star — a huge ball of hot glowing gas held together by gravity. Do not fly closer. I am asking as a friend.'
    },
    jupiter: {
      name: 'Jupiter', type: 'GAS GIANT',
      observation: 'A colossal banded world of swirling clouds, with the Great Red Spot — a storm wider than Earth — churning in its atmosphere.',
      tags: ['largest planet', 'gas giant', 'Great Red Spot', 'no solid surface'],
      knowledgeId: 'jupiter.overview',
      kora: 'Jupiter is the largest planet — big enough to swallow all the others. Its Great Red Spot is a storm that has raged for centuries. There is no surface to land on, so admire from a safe distance.'
    },
    saturn: {
      name: 'Saturn', type: 'GAS GIANT',
      observation: 'A golden gas giant encircled by brilliant rings made of countless drifting chunks of ice and rock.',
      tags: ['rings', 'ice and rock', 'gas giant'],
      knowledgeId: 'saturn.overview',
      kora: 'Those rings are not solid — they are billions of icy pieces, some tiny, some as big as houses. Saturn is showing off, and honestly it has earned the right.'
    },
    uranus: {
      name: 'Uranus', type: 'ICE GIANT',
      observation: 'A smooth blue-green world that rolls on its side, ringed faintly and wrapped in a cold haze of methane.',
      tags: ['tilted axis', 'ice giant', 'methane'],
      knowledgeId: 'uranus.overview',
      kora: 'Uranus spins on its side, likely knocked over by a giant collision long ago. Methane in its atmosphere gives it that pale blue-green colour.'
    },
    neptune: {
      name: 'Neptune', type: 'ICE GIANT',
      observation: 'A deep-blue world of drifting clouds, with dark storm spots and the fastest winds in the Solar System.',
      tags: ['fastest winds', 'ice giant', 'deep blue'],
      knowledgeId: 'neptune.overview',
      kora: 'Neptune is the farthest planet, and its winds scream past two thousand kilometres an hour. Cold, blue and extremely bad-tempered weather.'
    },
    pluto: {
      name: 'Pluto', type: 'DWARF PLANET',
      observation: 'A small icy world with mountains of water ice and a bright heart-shaped plain of frozen nitrogen.',
      tags: ['Kuiper Belt', 'dwarf planet', 'nitrogen ice'],
      knowledgeId: 'pluto.dwarf',
      kora: 'Pluto is a dwarf planet in the Kuiper Belt. New Horizons flew past in 2015 and found mountains of water ice and a heart-shaped plain. Not bad for a downgraded planet.'
    },
    ceres: {
      name: 'Ceres', type: 'DWARF PLANET',
      observation: 'The largest object in the asteroid belt — a dark, cratered dwarf planet with bright spots of salt.',
      tags: ['asteroid belt', 'dwarf planet', 'water ice'],
      knowledgeId: 'ceres.overview',
      kora: 'Ceres is the biggest body in the asteroid belt and holds more fresh water than all of Earth. A small world with a surprisingly thirsty secret.'
    }
  };

  const CODEX = {
    satellite: 'Satellite', crater: 'Impact crater', apollo_marker: 'Apollo 11', ch1_marker: 'Chandrayaan-1',
    ch2_marker: 'Chandrayaan-2', ch3_marker: 'Chandrayaan-3', channel: 'Water on Mars', layered_rock: 'Sedimentary rock',
    console: 'Scientific method', rock: 'Rock (geology)'
  };
  for (const k in CODEX) SCAN_INFO[k].codex = CODEX[k];

  function startScan(poi) {
    if (scanning) return false;
    const info = SCAN_INFO[poi.kind];
    if (!info) return false;
    scanning = { poi: poi, info: info };
    scanProgress = 0;
    G.Audio.play('scan');
    return true;
  }

  function update(dt) {
    if (!scanning) return null;
    scanProgress += dt / SCAN_TIME;
    if (scanProgress >= 1) {
      const done = scanning;
      scanning = null;
      scanProgress = 0;
      completeScan(done);
      return { finished: true, poi: done.poi, info: done.info };
    }
    return { finished: false, progress: scanProgress, info: scanning.info };
  }

  function completeScan(entry) {
    const poi = entry.poi;
    const info = entry.info;
    poi.scanned = true;
    if (poi.orbit) {
      G.Save.markPoiScanned('orbit', poi.id);
    } else if (G.World.terrainBody) {
      G.Save.markPoiScanned(G.World.terrainBody, poi.id);
    }
    G.World.pulseScanRing(poi.obj.position, 0x5dffa0);
    G.Audio.play('discover');
    if (info.knowledgeId) {
      const isNew = G.Save.unlockKnowledge(info.knowledgeId, 'scanned');
      if (isNew) {
        G.UI.discoveryToast('Knowledge Unlocked', info.knowledgeId.split('.').pop().replace(/_/g, ' '));
        G.Journal.refresh();
      }
    }
    G.Missions.onScan(poi);
    G.UI.notify('Scan complete: ' + info.name, 'good');
    if (G.Holo) G.Holo.mood('happy', 2.5);
    if (info.xp) { G.Save.addXp(info.xp); G.UI.notify('+' + info.xp + ' XP', 'good'); }
    const intro = info.kora || info.observation || '';
    const say = function (extra) {
      let t = intro;
      if (extra && intro.indexOf(extra.slice(0, 40)) < 0) t = (t + ' ' + extra).trim();
      if (t.length > 420) { const cut = t.lastIndexOf('. ', 420); t = t.slice(0, cut > 120 ? cut + 1 : 420); }
      if (t) G.UI.koraSay(t);
    };
    if (info.codex) {
      G.Codex.summary(info.codex).then(function (d) {
        if (!d) { say(''); return; }
        if (G.Codex.record(d)) {
          G.UI.discoveryToast('Codex Entry', d.title);
          G.Journal.refresh();
        }
        say(G.Codex.shortText(d.extract, 2));
      }, function () { say(''); });
    } else say('');
  }

  function cancel() {
    scanning = null;
    scanProgress = 0;
  }

  function isScanning() { return !!scanning; }
  function progress() { return scanProgress; }
  function current() { return scanning; }

  return {
    startScan: startScan, update: update, cancel: cancel,
    isScanning: isScanning, progress: progress, current: current,
    infoFor: function (kind) { return SCAN_INFO[kind]; },
    register: function (kind, info) { if (!SCAN_INFO[kind]) SCAN_INFO[kind] = info; return SCAN_INFO[kind]; }
  };
})();
