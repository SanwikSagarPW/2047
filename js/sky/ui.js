(function (S) {
  'use strict';
  var C = S.core, Cn = S.content, G = S.game, $ = C.$;
  var UI = S.ui = {};

  // ---------- Celestial Catalog Database for Field Journal & Planet Inspection ----------
  UI.PLANET_DATA = {
    sun: {
      id: 'sun',
      name: 'The Sun',
      category: 'Yellow Dwarf Star (G-type)',
      symbol: '[SUN]',
      diameter: '1,392,700 km (109× Earth)',
      distance: '0 km (Center of Solar System)',
      distAu: '0 AU',
      orbitPeriod: '230 Million Years (Galactic Orbit)',
      dayLength: '25–35 Earth Days (Differential Rotation)',
      moons: '8 Planets, 5 Dwarf Planets, Billions of Small Bodies',
      temperature: '5,500°C (Surface) · 15,000,000°C (Core)',
      atmosphere: '73% Hydrogen, 25% Helium, traces of heavier elements',
      description: 'The Sun contains 99.86% of all mass in our Solar System. Its tremendous gravitational pull keeps all planets, dwarf planets, asteroids, and comets in orbit. Its core fuses 600 million tons of hydrogen into helium every second, generating the radiant light and warmth that sustains life on Earth.',
      facts: [
        'Over 1.3 million Earths could fit inside the volume of the Sun.',
        'Light from the Sun takes approximately 8 minutes and 20 seconds to reach Earth.',
        'India’s Aditya-L1 satellite was launched in 2023 to observe solar storms and coronal mass ejections.'
      ]
    },
    mercury: {
      id: 'mercury',
      name: 'Mercury',
      category: 'Terrestrial Planet (1st from Sun)',
      symbol: '[MERCURY]',
      diameter: '4,879 km (0.38× Earth)',
      distance: '57.9 Million km',
      distAu: '0.39 AU',
      orbitPeriod: '88 Earth Days',
      dayLength: '58.6 Earth Days',
      moons: '0',
      temperature: '-180°C (Night) to +430°C (Day)',
      atmosphere: 'Virtually None (Trace exosphere of oxygen, sodium, hydrogen)',
      description: 'Mercury is the smallest planet in the Solar System and the closest to the Sun. Because it has almost no atmosphere to trap heat or smooth weather, its surface experiences the most extreme temperature swings in the planetary system.',
      facts: [
        'A year on Mercury is only 88 Earth days, faster than any other planet.',
        'Its cratered grey surface closely resembles Earth’s Moon.',
        'Despite being closest to the Sun, Venus is hotter due to greenhouse gases.'
      ]
    },
    venus: {
      id: 'venus',
      name: 'Venus',
      category: 'Terrestrial Planet (2nd from Sun)',
      symbol: '[VENUS]',
      diameter: '12,104 km (0.95× Earth)',
      distance: '108.2 Million km',
      distAu: '0.72 AU',
      orbitPeriod: '224.7 Earth Days',
      dayLength: '243 Earth Days (Retrograde)',
      moons: '0',
      temperature: '+465°C (Average surface temperature)',
      atmosphere: '96.5% Carbon Dioxide, 3.5% Nitrogen with sulfuric acid clouds',
      description: 'Often called Earth’s twin in size and mass, Venus is an inferno. Its super-dense carbon dioxide atmosphere traps solar heat in a runaway greenhouse effect, hot enough to melt lead. It shines as the brightest natural object in our night sky after the Moon, known as the Evening or Morning Star.',
      facts: [
        'Venus rotates backwards compared to most planets; the Sun rises in the west and sets in the east.',
        'A single day-night rotation on Venus lasts longer than its entire orbital year.',
        'Its thick, pale clouds reflect over 70% of sunlight, making it dazzle brightly.'
      ]
    },
    earth: {
      id: 'earth',
      name: 'Earth',
      category: 'Terrestrial Planet (3rd from Sun)',
      symbol: '[EARTH]',
      diameter: '12,742 km',
      distance: '149.6 Million km',
      distAu: '1.00 AU',
      orbitPeriod: '365.25 Days (1 Year)',
      dayLength: '23h 56m 04s (24h Solar Day)',
      moons: '1 (The Moon)',
      temperature: '+14°C (Global Average)',
      atmosphere: '78% Nitrogen, 21% Oxygen, 1% Argon & Water Vapor',
      description: 'Earth is our oasis in space: the only celestial body known to harbor life. It sits in the Sun’s habitable "Goldilocks Zone" where liquid water can stably exist on the surface. Dynamic plate tectonics, a protective magnetic field, and a balanced atmosphere shelter millions of living species.',
      facts: [
        'Liquid water covers approximately 71% of Earth’s surface.',
        'Earth’s axis is tilted by 23.5°, creating our spring, summer, autumn, and winter seasons.',
        'Its magnetic field shields the biosphere from hazardous solar wind particles.'
      ]
    },
    moon: {
      id: 'moon',
      name: 'The Moon',
      category: 'Natural Satellite of Earth',
      symbol: '[MOON]',
      diameter: '3,474 km (0.27× Earth)',
      distance: '384,400 km from Earth',
      distAu: '0.00257 AU',
      orbitPeriod: '27.3 Days (Tidal Lock)',
      dayLength: '29.5 Earth Days (Lunar Synodic Month)',
      moons: '0 (Orbits Earth)',
      temperature: '-130°C (Night) to +120°C (Day)',
      atmosphere: 'None (Hard vacuum)',
      description: 'The Moon is Earth’s constant cosmic companion. It is tidally locked to Earth, meaning it takes the exact same amount of time to spin once on its axis as it does to orbit Earth. As a result, observers on Earth always see the exact same lunar hemisphere.',
      facts: [
        'The dark patches on the Moon are ancient basaltic lava plains called maria.',
        'In August 2023, India’s Chandrayaan-3 successfully touched down near the Moon’s south pole.',
        'Moonlight is actually sunlight reflecting off the powdery lunar regolith.'
      ]
    },
    mars: {
      id: 'mars',
      name: 'Mars',
      category: 'Terrestrial Planet (4th from Sun)',
      symbol: '[MARS]',
      diameter: '6,779 km (0.53× Earth)',
      distance: '227.9 Million km',
      distAu: '1.52 AU',
      orbitPeriod: '687 Earth Days (1.88 Years)',
      dayLength: '24h 37m (1 Sol)',
      moons: '2 (Phobos & Deimos)',
      temperature: '-63°C (Average surface temperature)',
      atmosphere: '95% Carbon Dioxide, 2.6% Nitrogen, 1.9% Argon',
      description: 'Known as the Red Planet due to the abundance of oxidized iron (rust) across its dusty surface, Mars is a cold desert world with thin air, ancient dried river valleys, giant canyons, and extinct shield volcanoes.',
      facts: [
        'Mars is home to Olympus Mons, the tallest volcano in the Solar System (over 21 km high).',
        'India’s Mars Orbiter Mission (Mangalyaan) successfully entered Martian orbit on its maiden attempt in 2014.',
        'A Martian day is called a "sol" and is only 37 minutes longer than an Earth day.'
      ]
    },
    jupiter: {
      id: 'jupiter',
      name: 'Jupiter',
      category: 'Gas Giant (5th from Sun)',
      symbol: '[JUPITER]',
      diameter: '139,820 km (11× Earth)',
      distance: '778.5 Million km',
      distAu: '5.20 AU',
      orbitPeriod: '11.86 Earth Years',
      dayLength: '9h 56m (Fastest planetary spin)',
      moons: '95 Known Moons (4 Galilean: Io, Europa, Ganymede, Callisto)',
      temperature: '-110°C (Cloud Tops)',
      atmosphere: '90% Hydrogen, 10% Helium with traces of ammonia and methane',
      description: 'Jupiter is the colossus of our Solar System, with more than twice the mass of all other planets combined. It has no solid surface; beneath its banded clouds of swirling ammonia storms lies a deep mantle of liquid metallic hydrogen.',
      facts: [
        'The Great Red Spot is a giant anticyclonic storm larger than planet Earth that has raged for centuries.',
        'Jupiter’s moon Ganymede is the largest moon in the Solar System, even bigger than the planet Mercury.',
        'Its rapid 10-hour rotation creates powerful jet streams that stretch its clouds into colorful horizontal belts.'
      ]
    },
    saturn: {
      id: 'saturn',
      name: 'Saturn',
      category: 'Gas Giant (6th from Sun)',
      symbol: '[SATURN]',
      diameter: '116,460 km (9.1× Earth)',
      distance: '1.43 Billion km',
      distAu: '9.58 AU',
      orbitPeriod: '29.45 Earth Years',
      dayLength: '10h 33m',
      moons: '146 Known Moons (Titan, Enceladus, Mimas, etc.)',
      temperature: '-140°C (Cloud Tops)',
      atmosphere: '96% Hydrogen, 3% Helium, 0.4% Methane',
      description: 'Distinguished by its majestic planetary ring system, Saturn is a breathtaking gas giant. Though massive, it has the lowest density of any planet in the Solar System—if you could find an ocean large enough, Saturn would float on water.',
      facts: [
        'Saturn’s rings span over 280,000 km across, yet are only about 10 to 30 meters thick on average.',
        'The rings consist of countless billions of individual particles of water ice and rock, ranging from tiny dust specks to house-sized boulders.',
        'Its largest moon, Titan, is the only moon in our Solar System with a dense nitrogen atmosphere and liquid methane seas.'
      ]
    },
    uranus: {
      id: 'uranus',
      name: 'Uranus',
      category: 'Ice Giant (7th from Sun)',
      symbol: '[URANUS]',
      diameter: '50,724 km (4.0× Earth)',
      distance: '2.87 Billion km',
      distAu: '19.2 AU',
      orbitPeriod: '84 Earth Years',
      dayLength: '17h 14m (Retrograde)',
      moons: '28 Known Moons (Titania, Oberon, Miranda, Ariel, Umbriel)',
      temperature: '-195°C (Coldest planetary atmosphere: dips to -224°C)',
      atmosphere: '83% Hydrogen, 15% Helium, 2% Methane',
      description: 'Uranus is an ice giant composed of water, ammonia, and methane ices over a small rocky core. Methane gas in its upper atmosphere absorbs red light, giving the planet its serene pale cyan-aquamarine hue.',
      facts: [
        'Uranus is uniquely tipped on its side with an axial tilt of 97.8°, meaning it rolls along its orbit like a bowling ball.',
        'Because of this extreme tilt, each pole gets 42 continuous years of sunlight followed by 42 years of complete darkness.',
        'Uranus has 13 faint, dark inner and outer rings discovered in 1977.'
      ]
    },
    neptune: {
      id: 'neptune',
      name: 'Neptune',
      category: 'Ice Giant (8th from Sun)',
      symbol: '[NEPTUNE]',
      diameter: '49,244 km (3.9× Earth)',
      distance: '4.50 Billion km',
      distAu: '30.1 AU',
      orbitPeriod: '164.8 Earth Years',
      dayLength: '16h 06m',
      moons: '16 Known Moons (Triton, Proteus, Nereid)',
      temperature: '-200°C (Average cloud top temperature)',
      atmosphere: '80% Hydrogen, 19% Helium, 1.5% Methane',
      description: 'The outermost major planet in our Solar System, Neptune is a dynamic world of vivid azure blue. Despite being 30 times further from the Sun than Earth, it exhibits violent weather with the most ferocious winds measured anywhere in the Solar System.',
      facts: [
        'Winds in Neptune’s upper atmosphere can exceed 2,100 km/h—faster than the speed of sound on Earth.',
        'Neptune was the first planet discovered through mathematical prediction rather than direct telescopic observation (in 1846).',
        'Its largest moon, Triton, orbits backward (retrograde) and features nitrogen ice geysers that erupt into space.'
      ]
    },
    pluto: {
      id: 'pluto',
      name: 'Pluto',
      category: 'Dwarf Planet (Kuiper Belt)',
      symbol: '[PLUTO]',
      diameter: '2,377 km (0.18× Earth)',
      distance: '5.90 Billion km',
      distAu: '39.5 AU (Average)',
      orbitPeriod: '248 Earth Years',
      dayLength: '6.4 Earth Days (153 Hours)',
      moons: '5 Known Moons (Charon, Styx, Nix, Kerberos, Hydra)',
      temperature: '-230°C',
      atmosphere: 'Tenous Nitrogen, Methane, and Carbon Monoxide (sublimates when closer to Sun)',
      description: 'Classified as a dwarf planet by the IAU in 2006, Pluto is the sovereign of the Kuiper Belt—a vast icy realm beyond Neptune. NASA’s New Horizons spacecraft revealed a geologically active world of towering water-ice mountains and a vast heart-shaped nitrogen glacier.',
      facts: [
        'Pluto’s heart-shaped glacier, Tombaugh Regio, is a million-square-kilometer plain of churning frozen nitrogen.',
        'Pluto and its largest moon, Charon, form a double-dwarf planet system that orbit a mutual barycenter located in open space between them.',
        'Pluto has an elliptical orbit tilted by 17°; for 20 years of its 248-year orbit, it is actually closer to the Sun than Neptune.'
      ]
    },
    belt: {
      id: 'belt',
      name: 'The Asteroid Belt',
      category: 'Circumstellar Debris Ring',
      symbol: '[COMET]',
      diameter: 'Spans 329 to 478 Million km from Sun (2.2 to 3.2 AU)',
      distance: 'Between Mars and Jupiter',
      distAu: '2.7 AU (Average)',
      orbitPeriod: '3 to 6 Earth Years',
      dayLength: 'Varies by body',
      moons: 'Contains dwarf planet Ceres and millions of asteroids',
      temperature: '-73°C to -108°C',
      atmosphere: 'None',
      description: 'The main asteroid belt contains millions of rocky and metallic bodies left over from the formation of the Solar System 4.6 billion years ago. Jupiter’s massive gravitational resonance prevented these planetesimals from accreting into a single planet.',
      facts: [
        'Despite movies showing dense swarms, the asteroid belt is mostly empty space; spacecraft pass through safely without collisions.',
        'The dwarf planet Ceres contains roughly one-third of the total mass of the entire asteroid belt.',
        'Asteroids are classified into C-type (carbonaceous), S-type (silicate/stony), and M-type (metallic).'
      ]
    },
    comet: {
      id: 'comet',
      name: 'Periodic Comet (Halley Class)',
      category: 'Small Solar System Body (Icy Planetoid)',
      symbol: '[COMET]',
      diameter: 'Nucleus: 11 × 8 km · Tail: Millions of km',
      distance: 'Highly Elliptical Orbit',
      distAu: '0.6 AU at perihelion to 35 AU at aphelion',
      orbitPeriod: '~76 Earth Years',
      dayLength: '~52 Hours',
      moons: '0',
      temperature: '-200°C in deep space · Heats near Sun',
      atmosphere: 'Transient Coma of water vapor, carbon dioxide, dust',
      description: 'Comets are "dirty snowballs" composed of frozen gases, water ice, dust, and organic compounds dating back to the primordial solar nebula. When their eccentric orbits bring them close to solar heat, volatile ices sublimate, generating an immense glowing head (coma) and two majestic tails.',
      facts: [
        'A comet always has two tails: an ion (gas) tail that points directly away from the Sun due to solar wind, and a curved dust tail.',
        'Halley’s Comet is visible from Earth with the naked eye every 75–76 years (next return: mid-2061).',
        'Meteor showers on Earth (like the Perseids and Orionids) occur when our planet crosses the dusty debris trail left behind by comets.'
      ]
    }
  };

  // Additional Discoveries Catalog for Field Journal
  UI.DISCOVERY_ITEMS = [
    // Stars
    { id: 'polaris', name: 'Polaris (Dhruva Tara)', cat: 'stars', icon: '[STAR]', desc: 'The North Star. Sits directly above Earth’s north geographic pole, acting as a cosmic compass.', hint: 'Find the Big Dipper and follow the pointer stars Merak and Dubhe northward.' },
    { id: 'sirius', name: 'Sirius (The Dog Star)', cat: 'stars', icon: '[SPARKLE]', desc: 'The brightest star in the night sky. Located in Canis Major, roughly 8.6 light-years away.', hint: 'Follow Orion’s three belt stars downward and to the left.' },
    { id: 'betelgeuse', name: 'Betelgeuse', cat: 'stars', icon: '🔴', desc: 'A colossal red supergiant star marking Orion’s right shoulder. If placed at our Sun, it would engulf Jupiter.', hint: 'Look at the reddish-orange star in the upper left of Orion.' },
    { id: 'rigel', name: 'Rigel', cat: 'stars', icon: '🔷', desc: 'A dazzling blue-white supergiant star marking Orion’s left foot, shining thousands of times brighter than our Sun.', hint: 'Look at the brilliant blue star opposite Betelgeuse in Orion.' },
    { id: 'dubhe', name: 'Dubhe', cat: 'stars', icon: '[STAR]', desc: 'One of the two outer pointer stars of Ursa Major (Saptarishi).', hint: 'The front rim star of the Big Dipper bowl.' },
    { id: 'merak', name: 'Merak', cat: 'stars', icon: '[STAR]', desc: 'The lower pointer star of the Big Dipper bowl, forming a vector straight to Polaris.', hint: 'The bottom front star of the Big Dipper bowl.' },
    // Constellations
    { id: 'const:bigdipper', name: 'Ursa Major (The Big Dipper / Saptarishi)', cat: 'constellations', icon: '🥣', desc: 'An iconic asterism of seven brilliant stars symbolizing the Seven Sages in Indian astronomy.', hint: 'Look toward the northern sky at night.' },
    { id: 'const:littledipper', name: 'Ursa Minor (The Little Dipper)', cat: 'constellations', icon: '🥄', desc: 'The Little Bear constellation, anchored at its handle tip by the Pole Star, Polaris.', hint: 'Connected northward from the pointer stars of the Big Dipper.' },
    { id: 'const:orion', name: 'Orion the Hunter', cat: 'constellations', icon: '🏹', desc: 'One of the most recognizable constellations on Earth, featuring the distinctive three-star belt.', hint: 'Prominent winter constellation in the southern night sky.' },
    // Planets & Solar
    { id: 'orr:sun', name: 'The Sun', cat: 'planets', icon: '[SUN]', desc: 'The powerhouse star at the center of our Solar System.', hint: 'Center of the orbital Orrery.' },
    { id: 'orr:mercury', name: 'Mercury', cat: 'planets', icon: '[MERCURY]', desc: 'Smallest planet, closest to the Sun.', hint: 'Innermost orbit in the Solar System view.' },
    { id: 'orr:venus', name: 'Venus', cat: 'planets', icon: '[VENUS]', desc: 'The hottest planet and brightest Evening Star.', hint: 'Second planet from the Sun.' },
    { id: 'orr:earth', name: 'Earth', cat: 'planets', icon: '🌍', desc: 'Our home planet, cradle of water and life.', hint: 'Third planet from the Sun.' },
    { id: 'orr:mars', name: 'Mars', cat: 'planets', icon: '[MARS]', desc: 'The rusty Red Planet with the tallest volcano, Olympus Mons.', hint: 'Fourth planet from the Sun.' },
    { id: 'orr:jupiter', name: 'Jupiter', cat: 'planets', icon: '[JUPITER]', desc: 'The king of planets with the Great Red Spot storm.', hint: 'Fifth planet, beyond the asteroid belt.' },
    { id: 'orr:saturn', name: 'Saturn', cat: 'planets', icon: '[SATURN]', desc: 'The ringed wonder of the Solar System.', hint: 'Sixth planet with wide bright rings.' },
    { id: 'orr:uranus', name: 'Uranus', cat: 'planets', icon: '[URANUS]', desc: 'The cyan ice giant tipped on its side.', hint: 'Seventh planet from the Sun.' },
    { id: 'orr:neptune', name: 'Neptune', cat: 'planets', icon: '[NEPTUNE]', desc: 'The deep blue ice giant with supersonic winds.', hint: 'Outermost planet in the Solar System view.' },
    { id: 'orr:pluto', name: 'Pluto', cat: 'planets', icon: '[PLUTO]', desc: 'Dwarf planet in the Kuiper Belt with a heart-shaped nitrogen glacier.', hint: 'Small icy body in an eccentric orbit beyond Neptune.' },
    { id: 'belt', name: 'The Asteroid Belt', cat: 'planets', icon: '[COMET]', desc: 'Millions of rocky fragments orbiting between Mars and Jupiter.', hint: 'The dusty ring floating between Mars and Jupiter.' },
    { id: 'orr:comet', name: 'Halley-Class Comet', cat: 'planets', icon: '[COMET]', desc: 'An icy visitor that develops a glowing tail near the Sun.', hint: 'Look for the icy object with the bright tail.' },
    // Observations & Space tech
    { id: 'dome', name: 'Hanle Astronomical Observatory', cat: 'observations', icon: '🔭', desc: 'The Himalayan Chandra Telescope at 4,500m elevation in Hanle, Ladakh—India’s first Dark Sky Reserve.', hint: 'Look low toward the mountains in the south-east in Hanle.' },
    { id: 'here', name: 'Cosmic Address: "You Are Here"', cat: 'observations', icon: '📍', desc: 'Our Solar System located in the Orion Arm of the Milky Way galaxy, 26,000 light-years from the core.', hint: 'Zoom into the spiral arms of the Milky Way.' }
  ];

  // Destinations for the Expedition Map
  UI.DESTINATIONS = [
    {
      tab: 'sky',
      name: 'Hanle, Ladakh',
      region: 'Earth / Night-Sky Observatory',
      icon: '🏔️',
      focus: 'Stargazing, Constellations & Planetary Motion',
      desc: 'Stand 4,500m high in the Himalayas at India’s premier Dark Sky Reserve. Learn how to locate the Pole Star, recognize ancient constellations, and observe the celestial rotation of the heavens.',
      targetKey: 'hello'
    },
    {
      tab: 'earth',
      name: 'Planet Earth',
      region: 'Global Biosphere & Space Operations',
      icon: '🌍',
      focus: 'Earth’s Axis, Tilt, Day/Night & Satellites',
      desc: 'View our home from orbit. Understand Earth’s 23.5° axial tilt that creates seasons, watch Earth spin from west to east, and track scientific satellites orbiting the globe.',
      targetKey: 'earth'
    },
    {
      tab: 'moon',
      name: 'The Moon',
      region: 'Lunar Surface & Orbital Phases',
      icon: '[MOON]',
      focus: 'Lunar Phases, Craters & Chandrayaan-3',
      desc: 'Investigate Earth’s natural satellite. Travel across ancient lava maria and impact craters, explore the Chandrayaan-3 landing site, and understand why the Moon changes shape throughout the month.',
      targetKey: 'moon'
    },
    {
      tab: 'solar',
      name: 'Our Solar System',
      region: 'Heliosphere & Planetary Orbits',
      icon: '[SUN]',
      focus: 'Sun, 8 Planets, Asteroids & Dwarf Planets',
      desc: 'Explore the gravitational family of our Sun. Navigate 3D planetary orbits, inspect terrestrial and giant worlds up close, and discover the true scale of interplanetary space.',
      targetKey: 'solar1'
    },
    {
      tab: 'galaxy',
      name: 'The Milky Way',
      region: 'Galactic Structure & Deep Cosmos',
      icon: '🌌',
      focus: 'Spiral Arms, Galactic Core & Universe Scale',
      desc: 'Journey beyond the Solar System into the Milky Way galaxy. Locate Earth’s cosmic address among billions of stars and understand the mind-bending scale of the observable universe.',
      targetKey: 'galaxy1'
    }
  ];

  // Scientific Knowledge Base for Field Journal Tab 3
  UI.SCIENCE_NOTES = [
    {
      title: 'Why Do Stars Twinkle While Planets Shine Steadily?',
      cat: 'Astronomy Basics',
      icon: '[SPARKLE]',
      summary: 'Stars are point sources of light located many light-years away. As their narrow beam of light travels through Earth’s turbulent atmosphere, moving pockets of warm and cold air refract and bend the rays, causing rapid variations in brightness (scintillation or twinkling). Planets, however, are much closer to Earth and appear as extended discs of light; the atmospheric wobbles average out across the disk, creating a steady, calm glow.'
    },
    {
      title: 'Earth’s 23.5° Axial Tilt & Seasons',
      cat: 'Earth Science',
      icon: '📐',
      summary: 'Earth’s axis of rotation is tilted by approximately 23.5° relative to the plane of its orbit around the Sun. As Earth orbits during the year, different hemispheres lean toward or away from the Sun. When the Northern Hemisphere is tilted toward the Sun, days are longer and solar rays strike more directly, producing Summer. Six months later, the hemisphere tilts away, receiving indirect light that produces Winter.'
    },
    {
      title: 'The Pole Star (Polaris): Earth’s Celestial Compass',
      cat: 'Navigation',
      icon: '🧭',
      summary: 'Polaris sits almost precisely above Earth’s North Geographic Pole. Because Earth spins around this axis once every 24 hours, all the other stars appear to rotate in concentric circles around Polaris throughout the night, while Polaris itself remains practically stationary in the northern sky. For millennia, sailors and desert caravans relied on Polaris for true north navigation.'
    },
    {
      title: 'Lunar Phases: Why the Moon Changes Shape',
      cat: 'Orbital Mechanics',
      icon: '🌓',
      summary: 'The Moon does not emit its own light; it reflects sunlight. Exactly half of the Moon is always lit by the Sun (except during a lunar eclipse). As the Moon completes its 29.5-day synodic orbit around Earth, the fraction of that illuminated hemisphere visible from Earth continuously changes—from New Moon (unlit side facing Earth), to Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, and back.'
    },
    {
      title: 'Scale of the Solar System & The Speed of Light',
      cat: 'Cosmic Scale',
      icon: '🚀',
      summary: 'Pictures often show the planets clustered closely together, but in reality, space is extraordinarily empty. Light travels at the ultimate cosmic speed limit: 300,000 km per second. At this speed, light travels from the Moon to Earth in just 1.3 seconds, from the Sun to Earth in 8 minutes and 20 seconds, and from the Sun to Neptune in over 4 hours!'
    },
    {
      title: 'Vasudhaiva Kutumbakam: Earth as One Shared Home',
      cat: 'Humanity & Planet',
      icon: '🌏',
      summary: 'From outer space, no political borders or country lines exist on Earth. Winds, ocean currents, migrating birds, and atmosphere move freely across continents without regard for borders. Science, culture, and ideas travel across humanity as one united family sharing a single fragile blue planet in the cosmos.'
    }
  ];

  // ---------- Settings State & Persistence ----------
  var settings = {
    sfxVolume: 0.8,
    sfxEnabled: true,
    voiceEnabled: false,
    textScale: 'standard', // 'standard' or 'large'
    highContrast: false,
    reduceMotion: false
  };

  function loadSettings() {
    try {
      var s = JSON.parse(localStorage.getItem('star_explorer_settings') || '{}');
      if (s) {
        if (s.sfxVolume != null) settings.sfxVolume = s.sfxVolume;
        if (s.sfxEnabled != null) settings.sfxEnabled = s.sfxEnabled;
        if (s.textScale != null) settings.textScale = s.textScale;
        if (s.highContrast != null) settings.highContrast = s.highContrast;
        if (s.reduceMotion != null) settings.reduceMotion = s.reduceMotion;
      }
      settings.voiceEnabled = localStorage.getItem('skyj.voice') === '1';
    } catch (e) { }
    applySettingsToDOM();
  }

  function saveSettings() {
    try {
      localStorage.setItem('star_explorer_settings', JSON.stringify(settings));
      localStorage.setItem('skyj.voice', settings.voiceEnabled ? '1' : '0');
    } catch (e) { }
    applySettingsToDOM();
  }

  function applySettingsToDOM() {
    document.body.classList.toggle('large-text', settings.textScale === 'large');
    document.body.classList.toggle('high-contrast', !!settings.highContrast);
    document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);

    var voiceBtn = $('btn-voice');
    if (voiceBtn) {
      voiceBtn.classList.toggle('active', settings.voiceEnabled);
      voiceBtn.title = settings.voiceEnabled ? 'Kora Voice: Active (Click to mute)' : 'Kora Voice: Muted (Click to enable)';
    }
  }

  UI.getSettings = function () { return settings; };

  // ---------- Modal Management ----------
  var currentModal = null;

  UI.openModal = function (modalId) {
    UI.closeModal();
    var el = $(modalId);
    if (!el) return;
    el.classList.add('active');
    currentModal = el;
    document.body.classList.add('modal-open');
    if (G && G.sfx) G.sfx('tap');
  };

  UI.closeModal = function () {
    if (currentModal) {
      currentModal.classList.remove('active');
      currentModal = null;
    }
    document.body.classList.remove('modal-open');
  };

  // Close modal when pressing Escape or clicking backdrop
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (currentModal) {
        UI.closeModal();
      } else if (!$('title-screen').classList.contains('gone')) {
        // Already on title screen
      } else {
        UI.openPause();
      }
    }
  });

  // ---------- Expedition Map Modal ----------
  UI.openMap = function () {
    var modal = $('modal-map');
    if (!modal) return;
    var grid = $('map-destinations-grid');
    if (grid) {
      grid.innerHTML = '';
      UI.DESTINATIONS.forEach(function (dest) {
        var card = document.createElement('div');
        card.className = 'dest-card';
        if (C.current() && C.current().id === dest.tab) card.classList.add('current');

        // Check completion stats
        var qIdx = [];
        Cn.LESSONS.forEach(function (L, i) { if (L.tab === dest.tab && G.peek(L)) qIdx.push(i); });
        var doneCount = 0;
        try {
          var save = JSON.parse(localStorage.getItem('skyj.game') || '{}');
          if (save && save.done) {
            qIdx.forEach(function (i) {
              var L = Cn.LESSONS[i];
              if (save.done[L.tab + '|' + L.title]) doneCount++;
            });
          }
        } catch (e) { }

        var percent = qIdx.length ? Math.round((doneCount / qIdx.length) * 100) : 100;
        var isAllDone = qIdx.length > 0 && doneCount === qIdx.length;

        card.innerHTML =
          '<div class="dest-badge">' + dest.icon + '</div>' +
          '<div class="dest-info">' +
            '<div class="dest-tag">' + dest.region + '</div>' +
            '<h3 class="dest-title">' + dest.name + '</h3>' +
            '<div class="dest-focus">' + dest.focus + '</div>' +
            '<p class="dest-desc">' + dest.desc + '</p>' +
            '<div class="dest-progress-row">' +
              '<div class="dest-progress-bar"><div class="dest-progress-fill" style="width:' + percent + '%"></div></div>' +
              '<span class="dest-progress-text">' + doneCount + '/' + qIdx.length + ' Missions (' + percent + '%)</span>' +
            '</div>' +
          '</div>' +
          '<button class="dest-enter-btn ' + (isAllDone ? 'completed' : 'primary') + '">' +
            (isAllDone ? 'Revisit Destination' : 'Launch Expedition') +
          '</button>';

        card.querySelector('.dest-enter-btn').addEventListener('click', function () {
          UI.closeModal();
          // Find first undone mission or beginning of this world
          var targetIdx = G.firstUndoneIn(dest.tab);
          if (targetIdx < 0) {
            for (var i = 0; i < Cn.LESSONS.length; i++) {
              if (Cn.LESSONS[i].tab === dest.tab) { targetIdx = i; break; }
            }
          }
          if (targetIdx >= 0) C.go(targetIdx);
        });

        grid.appendChild(card);
      });
    }
    UI.openModal('modal-map');
  };

  // ---------- Field Journal Modal ----------
  var journalActiveTab = 'discoveries';

  UI.openJournal = function (tabName) {
    journalActiveTab = tabName || 'discoveries';
    var modal = $('modal-journal');
    if (!modal) return;

    // Set tab buttons
    var tabs = modal.querySelectorAll('.journal-tab-btn');
    tabs.forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === journalActiveTab);
    });

    renderJournalContent();
    UI.openModal('modal-journal');
  };

  function renderJournalContent() {
    var contentEl = $('journal-tab-content');
    if (!contentEl) return;
    contentEl.innerHTML = '';

    // Load saved discoveries
    var found = {};
    try { found = JSON.parse(localStorage.getItem('skyj.found') || '{}'); } catch (e) { }
    var save = { score: 0, done: {} };
    try { save = JSON.parse(localStorage.getItem('skyj.game') || '{}'); } catch (e) { }

    if (journalActiveTab === 'discoveries') {
      var header = document.createElement('div');
      header.className = 'journal-section-header';
      var foundCount = Object.keys(found).length;
      header.innerHTML = '<h4>Celestial Discoveries Archive</h4><span class="badge-count">' + foundCount + ' Recorded</span>';
      contentEl.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'journal-grid';

      UI.DISCOVERY_ITEMS.forEach(function (item) {
        var isUnlocked = !!found[item.id];
        var tile = document.createElement('div');
        tile.className = 'journal-card ' + (isUnlocked ? 'unlocked' : 'locked');

        tile.innerHTML =
          '<div class="j-card-top">' +
            '<span class="j-icon">' + (isUnlocked ? item.icon : '[LOCK]') + '</span>' +
            '<span class="j-status-pill ' + (isUnlocked ? 'found' : 'missing') + '">' +
              (isUnlocked ? 'RECORDED' : 'UNDISCOVERED') +
            '</span>' +
          '</div>' +
          '<h4 class="j-title">' + item.name + '</h4>' +
          '<p class="j-desc">' + (isUnlocked ? item.desc : '<em>Clue: ' + item.hint + '</em>') + '</p>';

        grid.appendChild(tile);
      });
      contentEl.appendChild(grid);

    } else if (journalActiveTab === 'expeditions') {
      var expHeader = document.createElement('div');
      expHeader.className = 'journal-section-header';
      expHeader.innerHTML = '<h4>Expedition Mission Logs</h4><span class="badge-count">Comprehensive Flight Record</span>';
      contentEl.appendChild(expHeader);

      var list = document.createElement('div');
      list.className = 'expedition-log-list';

      UI.DESTINATIONS.forEach(function (dest) {
        var group = document.createElement('div');
        group.className = 'exp-group';

        var titleBar = document.createElement('div');
        titleBar.className = 'exp-group-title';
        titleBar.innerHTML = '<span>' + dest.icon + ' ' + dest.name + '</span><small>' + dest.region + '</small>';
        group.appendChild(titleBar);

        var table = document.createElement('div');
        table.className = 'exp-mission-table';

        Cn.LESSONS.forEach(function (L, i) {
          if (L.tab !== dest.tab || !G.peek(L)) return;
          var isDone = !!(save && save.done && save.done[L.tab + '|' + L.title]);
          var row = document.createElement('div');
          row.className = 'exp-mission-row ' + (isDone ? 'done' : 'pending');

          row.innerHTML =
            '<div class="m-row-status">' + (isDone ? '✔' : '○') + '</div>' +
            '<div class="m-row-info">' +
              '<b class="m-row-title">' + L.title + '</b>' +
              '<span class="m-row-tag">' + (L.tag || 'Observation') + '</span>' +
            '</div>' +
            '<button class="m-row-jump-btn" type="button">Review ▶</button>';

          row.querySelector('.m-row-jump-btn').addEventListener('click', function () {
            UI.closeModal();
            C.go(i);
          });

          table.appendChild(row);
        });

        group.appendChild(table);
        list.appendChild(group);
      });

      contentEl.appendChild(list);

    } else if (journalActiveTab === 'notes') {
      var notesHeader = document.createElement('div');
      notesHeader.className = 'journal-section-header';
      notesHeader.innerHTML = '<h4>Science Field Notes & Principles</h4><span class="badge-count">Aviation & Astronomy Handbook</span>';
      contentEl.appendChild(notesHeader);

      var notesList = document.createElement('div');
      notesList.className = 'notes-card-list';

      UI.SCIENCE_NOTES.forEach(function (note) {
        var card = document.createElement('div');
        card.className = 'science-note-card';

        card.innerHTML =
          '<div class="sn-header">' +
            '<span class="sn-icon">' + note.icon + '</span>' +
            '<div>' +
              '<div class="sn-tag">' + note.cat + '</div>' +
              '<h4 class="sn-title">' + note.title + '</h4>' +
            '</div>' +
          '</div>' +
          '<p class="sn-body">' + note.summary + '</p>';

        notesList.appendChild(card);
      });

      contentEl.appendChild(notesList);
    }
  }

  // ---------- Planet Inspection Drawer ----------
  var currentInspectedPlanet = null;

  UI.showPlanetDrawer = function (planetId) {
    var drawer = $('planet-drawer');
    if (!drawer) return;
    var data = UI.PLANET_DATA[planetId];
    if (!data) return;

    currentInspectedPlanet = planetId;

    $('pd-symbol').textContent = data.symbol || '[PLANET]';
    $('pd-title').textContent = data.name;
    $('pd-category').textContent = data.category;
    $('pd-desc').textContent = data.description;

    // Parameters
    $('pd-stat-diameter').textContent = data.diameter;
    $('pd-stat-distance').textContent = data.distance;
    $('pd-stat-orbit').textContent = data.orbitPeriod;
    $('pd-stat-day').textContent = data.dayLength;
    $('pd-stat-moons').textContent = data.moons;
    $('pd-stat-temp').textContent = data.temperature;
    $('pd-stat-atmo').textContent = data.atmosphere;

    // Facts list
    var factsList = $('pd-facts-list');
    if (factsList) {
      factsList.innerHTML = '';
      (data.facts || []).forEach(function (fact) {
        var li = document.createElement('li');
        li.textContent = fact;
        factsList.appendChild(li);
      });
    }

    // Inspect in 3D Button
    var inspectBtn = $('pd-inspect-3d-btn');
    if (inspectBtn) {
      if (planetId === 'belt') {
        inspectBtn.style.display = 'none';
      } else {
        inspectBtn.style.display = 'flex';
        inspectBtn.onclick = function () {
          UI.closePlanetDrawer();
          if (planetId === 'sun') C.goKey('planet:sun');
          else C.goKey('planet:' + planetId);
        };
      }
    }

    drawer.classList.add('open');
  };

  UI.closePlanetDrawer = function () {
    var drawer = $('planet-drawer');
    if (drawer) drawer.classList.remove('open');
    currentInspectedPlanet = null;
  };

  // ---------- Pause Menu ----------
  UI.openPause = function () {
    var modal = $('modal-pause');
    if (!modal) return;

    // Set pause summary info
    var loc = $('pause-current-location');
    var obj = $('pause-current-objective');
    var w = $('where-name');
    var g = $('m-goal');
    if (loc) loc.textContent = w ? w.textContent : 'Deep Space';
    if (obj) obj.textContent = g && g.textContent ? g.textContent : 'Free Exploration';

    UI.openModal('modal-pause');
  };

  // ---------- Settings Modal ----------
  UI.openSettings = function () {
    var modal = $('modal-settings');
    if (!modal) return;

    // Sync input states
    var sfxToggle = $('setting-sfx-toggle');
    if (sfxToggle) sfxToggle.checked = settings.sfxEnabled;

    var sfxSlider = $('setting-sfx-slider');
    if (sfxSlider) sfxSlider.value = Math.round(settings.sfxVolume * 100);

    var voiceToggle = $('setting-voice-toggle');
    if (voiceToggle) voiceToggle.checked = settings.voiceEnabled;

    var textScaleSelect = $('setting-text-scale');
    if (textScaleSelect) textScaleSelect.value = settings.textScale;

    var contrastToggle = $('setting-contrast-toggle');
    if (contrastToggle) contrastToggle.checked = settings.highContrast;

    var motionToggle = $('setting-motion-toggle');
    if (motionToggle) motionToggle.checked = settings.reduceMotion;

    UI.openModal('modal-settings');
  };

  // ---------- Mission Complete Celebration Feedback ----------
  UI.showMissionComplete = function (title, reward, nextFn) {
    var modal = $('modal-mission-complete');
    if (!modal) return;

    $('mc-title').textContent = title || 'Objective Completed!';
    $('mc-reward').textContent = '+' + (reward || 5) + ' ⭐ DISCOVERIES';

    var nextBtn = $('mc-next-btn');
    if (nextBtn) {
      nextBtn.onclick = function () {
        UI.closeModal();
        if (nextFn) nextFn();
      };
    }

    var journalBtn = $('mc-journal-btn');
    if (journalBtn) {
      journalBtn.onclick = function () {
        UI.closeModal();
        UI.openJournal('expeditions');
      };
    }

    UI.openModal('modal-mission-complete');
    if (G && G.confetti) G.confetti(null, null, 35);
  };

  // ---------- Initialization & Event Bindings ----------
  UI.init = function () {
    loadSettings();

    // Top Bar buttons
    var btnMissions = $('btn-missions');
    if (btnMissions) {
      btnMissions.onclick = function () { UI.openJournal('expeditions'); };
    }

    var btnWhere = $('where');
    if (btnWhere) {
      btnWhere.onclick = function () { UI.openMap(); };
    }

    var btnPause = $('btn-pause');
    if (btnPause) {
      btnPause.onclick = function () { UI.openPause(); };
    }

    // Title Screen buttons
    var tsBtnMap = $('ts-btn-map');
    if (tsBtnMap) {
      tsBtnMap.onclick = function () { UI.openMap(); };
    }

    var tsBtnJournal = $('ts-btn-journal');
    if (tsBtnJournal) {
      tsBtnJournal.onclick = function () { UI.openJournal('discoveries'); };
    }

    var tsBtnSettings = $('ts-btn-settings');
    if (tsBtnSettings) {
      tsBtnSettings.onclick = function () { UI.openSettings(); };
    }

    // Modal close buttons (all elements with .modal-close-btn)
    document.querySelectorAll('.modal-close-btn').forEach(function (btn) {
      btn.onclick = function () { UI.closeModal(); };
    });

    // Journal Tabs
    document.querySelectorAll('.journal-tab-btn').forEach(function (btn) {
      btn.onclick = function () {
        document.querySelectorAll('.journal-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        journalActiveTab = btn.dataset.tab;
        renderJournalContent();
      };
    });

    // Planet Drawer close button
    var pdClose = $('pd-close-btn');
    if (pdClose) pdClose.onclick = UI.closePlanetDrawer;

    // Pause Menu items
    var pauseResume = $('pause-resume-btn');
    if (pauseResume) pauseResume.onclick = UI.closeModal;

    var pauseMap = $('pause-map-btn');
    if (pauseMap) pauseMap.onclick = function () { UI.closeModal(); UI.openMap(); };

    var pauseJournal = $('pause-journal-btn');
    if (pauseJournal) pauseJournal.onclick = function () { UI.closeModal(); UI.openJournal('discoveries'); };

    var pauseSettings = $('pause-settings-btn');
    if (pauseSettings) pauseSettings.onclick = function () { UI.closeModal(); UI.openSettings(); };

    var pauseMenu = $('pause-mainmenu-btn');
    if (pauseMenu) pauseMenu.onclick = function () {
      UI.closeModal();
      $('title-screen').classList.remove('gone');
      if (G && G.hasProgress()) {
        var rb = $('btn-resume');
        if (rb) rb.classList.remove('hidden');
      }
      if (G && G.render) G.render();
    };

    // Settings inputs
    var sfxToggle = $('setting-sfx-toggle');
    if (sfxToggle) {
      sfxToggle.onchange = function () {
        settings.sfxEnabled = sfxToggle.checked;
        saveSettings();
      };
    }

    var sfxSlider = $('setting-sfx-slider');
    if (sfxSlider) {
      sfxSlider.oninput = function () {
        settings.sfxVolume = parseInt(sfxSlider.value, 10) / 100;
        saveSettings();
      };
    }

    var voiceToggle = $('setting-voice-toggle');
    if (voiceToggle) {
      voiceToggle.onchange = function () {
        settings.voiceEnabled = voiceToggle.checked;
        saveSettings();
        if (settings.voiceEnabled && C.card && C.card.data) C.say(C.card.data.text);
      };
    }

    var textScaleSelect = $('setting-text-scale');
    if (textScaleSelect) {
      textScaleSelect.onchange = function () {
        settings.textScale = textScaleSelect.value;
        saveSettings();
        setTimeout(C.layout, 50);
      };
    }

    var contrastToggle = $('setting-contrast-toggle');
    if (contrastToggle) {
      contrastToggle.onchange = function () {
        settings.highContrast = contrastToggle.checked;
        saveSettings();
      };
    }

    var motionToggle = $('setting-motion-toggle');
    if (motionToggle) {
      motionToggle.onchange = function () {
        settings.reduceMotion = motionToggle.checked;
        saveSettings();
      };
    }

    var resetBtn = $('setting-reset-progress-btn');
    if (resetBtn) {
      resetBtn.onclick = function () {
        if (confirm('Are you sure you want to reset all expedition discoveries and progress?')) {
          localStorage.removeItem('skyj.game');
          localStorage.removeItem('skyj.found');
          localStorage.removeItem('star_explorer_settings');
          alert('Expedition progress reset. Reloading application...');
          window.location.reload();
        }
      };
    }
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UI.init);
  } else {
    UI.init();
  }

})(window.Sky = window.Sky || {});
