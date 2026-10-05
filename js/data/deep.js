window.G = window.G || {};

// Destinations beyond Neptune. Positions are in the game's compressed scale (a = bearing in degrees,
// r = world units from the Sun); `dist` is the real distance. Titles are Wikipedia article names.
G.DEEP = [
  { id: 'dp_newhorizons', short: '60 AU', name: 'New Horizons', title: 'New Horizons', type: 'DEEP SPACE PROBE', model: 'probe', a: 170, r: 930, y: 8, size: 4, dist: 'about 60 AU from the Sun',
    fact: 'Flew past Pluto in 2015 and the icy rock Arrokoth in 2019. It is still travelling outward and will leave the Solar System one day.', tags: ['NASA', '2006', 'Pluto flyby'] },
  { id: 'dp_voyager2', short: '140 AU', name: 'Voyager 2', title: 'Voyager 2', type: 'INTERSTELLAR PROBE', model: 'probe', a: 250, r: 1010, y: -14, size: 4, dist: 'about 140 AU from the Sun',
    fact: 'The only spacecraft that has visited Uranus and Neptune. It crossed into interstellar space in 2018.', tags: ['NASA', '1977', 'interstellar'] },
  { id: 'dp_voyager1', short: '160 AU', name: 'Voyager 1', title: 'Voyager 1', type: 'INTERSTELLAR PROBE', model: 'probe', a: 40, r: 1060, y: 12, size: 4, dist: 'over 160 AU from the Sun (about 24 billion km)',
    fact: 'The farthest human-made object. It crossed the heliopause into interstellar space in 2012 and carries a Golden Record with sounds and pictures of Earth.', tags: ['NASA', '1977', 'Golden Record'] },
  { id: 'dp_oort', short: '2,000+ AU', name: 'Oort Cloud', title: 'Oort cloud', type: 'COMET RESERVOIR', model: 'oort', a: 330, r: 2300, y: 20, size: 260, dist: 'about 2,000 to 100,000 AU from the Sun',
    fact: 'A giant shell of icy objects around the whole Solar System. Long-period comets fall in from here. Voyager 1 will need about 300 years just to reach its inner edge.', tags: ['comets', 'icy', 'edge of the Sun\'s pull'] },
  { id: 'dp_acen', name: 'Alpha Centauri', title: 'Alpha Centauri', type: 'STAR SYSTEM \u00b7 3 STARS', model: 'acen', a: 200, r: 3100, y: 0, size: 40, solid: 42, dist: '4.37 light-years', lightYears: 4.37,
    fact: 'The closest star system to the Sun. Two Sun-like stars circle each other, and a small red dwarf, Proxima Centauri, orbits far away.', tags: ['nearest stars', '3 stars', '4.37 ly'] },
  { id: 'dp_proxima_b', name: 'Proxima Centauri b', title: 'Proxima Centauri b', type: 'EXOPLANET', model: 'planet', ref: 'dp_acen', off: [276, 22, -106], size: 3, color: 0xc07a50, dist: '4.24 light-years', lightYears: 4.24,
    fact: 'A planet a little heavier than Earth, circling in the habitable zone of Proxima Centauri. Its star sends out strong flares, so scientists are not sure life could survive there.', tags: ['exoplanet', 'habitable zone', 'found 2016'] },
  { id: 'dp_barnard', name: "Barnard's Star", title: "Barnard's Star", type: 'RED DWARF STAR', model: 'star', color: 0xff6a3a, a: 100, r: 3500, y: -30, size: 7, solid: 8, dist: '5.96 light-years', lightYears: 5.96,
    fact: 'A small, dim red dwarf that moves across our sky faster than any other star. Planets have been found around it.', tags: ['red dwarf', 'fastest mover', '5.96 ly'] },
  { id: 'dp_sirius', name: 'Sirius', title: 'Sirius', type: 'BRIGHTEST STAR IN OUR SKY', model: 'sirius', a: 295, r: 3900, y: 25, size: 24, solid: 20, dist: '8.6 light-years', lightYears: 8.6,
    fact: 'The brightest star in Earth\'s night sky, about twice as massive as the Sun. A tiny, super-dense white dwarf called Sirius B circles it.', tags: ['brightest star', 'white dwarf', '8.6 ly'] },
  { id: 'dp_trappist', name: 'TRAPPIST-1', title: 'TRAPPIST-1', type: 'PLANETARY SYSTEM \u00b7 7 PLANETS', model: 'trappist', a: 65, r: 4500, y: 0, size: 70, solid: 8, dist: 'about 40 light-years', lightYears: 40,
    fact: 'A small red star with seven Earth-sized planets, all huddled closer to it than Mercury is to our Sun. Three lie in the habitable zone, where liquid water could exist.', tags: ['7 planets', 'Earth-sized', '40 ly'] },
  { id: 'dp_betelgeuse', name: 'Betelgeuse', title: 'Betelgeuse', type: 'RED SUPERGIANT STAR', model: 'giant', color: 0xff5a28, a: 140, r: 5300, y: 40, size: 95, solid: 100, dist: 'about 550 light-years', lightYears: 550,
    fact: 'A red supergiant so huge that if it sat where the Sun is, it would swallow the planets out past Mars. One day it will explode as a supernova.', tags: ['supergiant', 'will explode', '550 ly'] },
  { id: 'dp_orion', name: 'Orion Nebula', title: 'Orion Nebula', type: 'STAR NURSERY NEBULA', model: 'nebula', a: 230, r: 5900, y: -20, size: 380, dist: 'about 1,340 light-years', lightYears: 1340,
    fact: 'A giant cloud of gas and dust where new stars are being born. You can see it without a telescope as the fuzzy middle "star" in the sword of Orion.', tags: ['nebula', 'star birth', '1,340 ly'] },
  { id: 'dp_sgra', name: 'Sagittarius A*', title: 'Sagittarius A*', type: 'SUPERMASSIVE BLACK HOLE', model: 'blackhole', a: 270, r: 7000, y: 0, size: 48, solid: 52, dist: 'about 26,000 light-years', lightYears: 26000,
    fact: 'The black hole at the centre of our Milky Way, about 4 million times as massive as the Sun. The first picture of it was released in 2022.', tags: ['black hole', 'Milky Way centre', '26,000 ly'] },
  { id: 'dp_andromeda', name: 'Andromeda Galaxy', title: 'Andromeda Galaxy', type: 'NEIGHBOUR GALAXY', model: 'galaxy', a: 15, r: 7900, y: 0, size: 900, dist: 'about 2.5 million light-years', lightYears: 2500000,
    fact: 'The nearest big galaxy, home to about a trillion stars. It is moving towards the Milky Way, and the two will merge in about 4 to 5 billion years.', tags: ['galaxy', 'a trillion stars', '2.5 million ly'] }
];
