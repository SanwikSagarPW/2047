window.G = window.G || {};

G.PLANETS = {
  sun: {
    id: 'sun', name: 'The Sun', type: 'star', radius: 60, color: '#ffd23f',
    distance: 0, angle: 0, speed: 0, seed: 100,
    desc: 'The Sun is a star at the centre of our Solar System. It is a giant ball of hot glowing gas that gives Earth light and heat.'
  },
  mercury: {
    id: 'mercury', name: 'Mercury', type: 'rocky', radius: 8, color: '#9c8e82',
    distance: 130, angle: 0.6, speed: 0.008, seed: 201, locked: true,
    gravity: 'low', temp: 'very hot days, cold nights', year: '88 days',
    desc: 'Mercury is the smallest planet and the closest to the Sun. It is a rocky world with a very thin atmosphere and extreme temperature changes.'
  },
  venus: {
    id: 'venus', name: 'Venus', type: 'rocky', radius: 12, color: '#e8c872',
    distance: 180, angle: 2.1, speed: 0.006, seed: 202, locked: true,
    gravity: 'earth-like', temp: 'extremely hot', year: '225 days',
    desc: 'Venus is wrapped in thick clouds of acid. A runaway greenhouse effect makes it the hottest planet, even hotter than Mercury.'
  },
  earth: {
    id: 'earth', name: 'Earth', type: 'rocky', radius: 13, color: '#3b82c4',
    distance: 240, angle: 4.0, speed: 0.004, seed: 203,
    gravity: 'earth-like', temp: 'just right', year: '365 days',
    desc: 'Earth is our home planet. It is the only world we know of with liquid water oceans and life. Its atmosphere protects and sustains us.'
  },
  moon: {
    id: 'moon', name: 'The Moon', type: 'moon', radius: 4, color: '#b8bcc2',
    parent: 'earth', distance: 90, angle: 1.2, speed: 0.012, seed: 204,
    gravity: 'low', temp: 'hot days, cold nights', terrain: 'craters',
    desc: 'The Moon is Earth\'s natural satellite. It has no atmosphere, and its surface is covered in craters, mountains and dark flat plains called maria.'
  },
  mars: {
    id: 'mars', name: 'Mars', type: 'rocky', radius: 10, color: '#d96a3b',
    distance: 310, angle: 5.3, speed: 0.003, seed: 205,
    gravity: 'low', temp: 'cold', year: '687 days', terrain: 'canyon',
    desc: 'Mars is the Red Planet. Its surface is rich in iron minerals that have rusted, giving it a reddish colour. Ancient riverbeds suggest water once flowed there.'
  },
  jupiter: {
    id: 'jupiter', name: 'Jupiter', type: 'gas giant', radius: 30, color: '#d8a86e',
    distance: 420, angle: 0.2, speed: 0.0015, seed: 206, locked: true,
    gravity: 'very high', temp: 'very cold', year: '12 years',
    desc: 'Jupiter is the largest planet in the Solar System. It is a gas giant with no solid surface, famous for its Great Red Spot storm.'
  },
  saturn: {
    id: 'saturn', name: 'Saturn', type: 'gas giant', radius: 26, color: '#e0c890',
    distance: 520, angle: 2.8, speed: 0.001, seed: 207, locked: true, rings: true,
    gravity: 'high', temp: 'very cold', year: '29 years',
    desc: 'Saturn is famous for its spectacular rings made of ice and rock. It is a gas giant, the second-largest planet.'
  },
  uranus: {
    id: 'uranus', name: 'Uranus', type: 'ice giant', radius: 18, color: '#8ad4dc',
    distance: 610, angle: 4.4, speed: 0.0007, seed: 208, locked: true, tilt: 98,
    gravity: 'moderate', temp: 'extremely cold', year: '84 years',
    desc: 'Uranus is an ice giant that spins on its side, likely because of a giant impact long ago. It has faint rings.'
  },
  neptune: {
    id: 'neptune', name: 'Neptune', type: 'ice giant', radius: 17, color: '#3b6fd4',
    distance: 690, angle: 5.9, speed: 0.0005, seed: 209, locked: true,
    gravity: 'moderate', temp: 'extremely cold', year: '165 years',
    desc: 'Neptune is the most distant planet. It is an ice giant with the fastest winds in the Solar System, reaching over 2,000 km/h.'
  },
  pluto: {
    id: 'pluto', name: 'Pluto', type: 'dwarf planet', radius: 5, color: '#b09878',
    distance: 760, angle: 1.9, speed: 0.0004, seed: 210, locked: true,
    gravity: 'very low', temp: 'extremely cold', year: '248 years',
    desc: 'Pluto is a dwarf planet in the Kuiper Belt. It was reclassified in 2006 when scientists refined the definition of a planet.'
  },
  ceres: {
    id: 'ceres', name: 'Ceres', type: 'dwarf planet', radius: 4, color: '#909090',
    distance: 360, angle: 3.6, speed: 0.002, seed: 211, locked: true,
    gravity: 'very low', temp: 'cold',
    desc: 'Ceres is the largest object in the asteroid belt and is classed as a dwarf planet.'
  }
};

G.STATIONS = {
  terra_gate: {
    id: 'terra_gate', name: 'Terra Gate', parent: 'earth', distance: 40, angle: 0.8, speed: 0.015,
    desc: 'A bustling orbital junction where explorers refuel, upgrade and train.'
  },
  selene_junction: {
    id: 'selene_junction', name: 'Selene Junction', parent: 'moon', distance: 34, angle: 2.4, speed: 0.03,
    desc: 'A lunar orbital station supporting Moon missions and Chandrayaan learning programmes.'
  },
  ares_relay: {
    id: 'ares_relay', name: 'Ares Relay', parent: 'mars', distance: 48, angle: 5.0, speed: 0.012,
    desc: 'A Mars-orbit station coordinating rover specialists and communications.'
  },
  galileo_gate: {
    id: 'galileo_gate', name: 'Galileo Gate', parent: 'jupiter', distance: 46, angle: 1.6, speed: 0.02,
    desc: 'A deep-space gateway above the giant worlds, built to study storms that last for centuries.'
  },
  cassini_ring: {
    id: 'cassini_ring', name: 'Cassini Ring', parent: 'saturn', distance: 44, angle: 3.3, speed: 0.018,
    desc: 'A ring-side observatory parked among the ice, studying Saturn and its ocean moons.'
  },
  odyssey_post: {
    id: 'odyssey_post', name: 'Odyssey Post', parent: 'neptune', distance: 30, angle: 2.2, speed: 0.016,
    desc: 'The farthest outpost in the Solar System, the last stop before the cold edge.'
  }
};

G.RANKS = [
  { name: 'Cadet Explorer', xp: 0 },
  { name: 'Junior Navigator', xp: 100 },
  { name: 'Field Explorer', xp: 250 },
  { name: 'Planetary Scout', xp: 450 },
  { name: 'Solar System Researcher', xp: 700 },
  { name: 'Mission Specialist', xp: 1000 },
  { name: 'Master Explorer', xp: 1400 }
];

G.BADGES = [
  { id: 'first_scan', name: 'First Scan', desc: 'Scan your first object', icon: '&#8982;' },
  { id: 'moon_walker', name: 'Moon Walker', desc: 'Complete your first lunar expedition', icon: G.Icon('moon') },
  { id: 'rover_driver', name: 'Rover Driver', desc: 'Complete a rover mission', icon: '&#9673;' },
  { id: 'mission_historian', name: 'Mission Historian', desc: 'Unlock five historical mission entries', icon: G.Icon('book') },
  { id: 'planet_sorter', name: 'Planet Sorter', desc: 'Correctly classify all main planet types', icon: G.Icon('planet') },
  { id: 'question_machine', name: 'Question Machine', desc: 'Ask KORA ten questions', icon: G.Icon('question') },
  { id: 'evidence_finder', name: 'Evidence Finder', desc: 'Complete an observation-based mission', icon: G.Icon('search') },
  { id: 'solar_system_explorer', name: 'Solar System Explorer', desc: 'Visit every core destination', icon: G.Icon('globe') },
  { id: 'giant_worlds', name: 'Giant Worlds', desc: 'Explore the gas giant Jupiter', icon: G.Icon('planet') },
  { id: 'ring_walker', name: 'Ring Walker', desc: 'Study Saturn and its rings', icon: G.Icon('ring') },
  { id: 'ice_explorer', name: 'Ice Explorer', desc: 'Reach the ice giants Uranus and Neptune', icon: G.Icon('snow') },
  { id: 'kuiper_pioneer', name: 'Kuiper Pioneer', desc: 'Journey to Pluto and the Kuiper Belt', icon: G.Icon('comet') },
  { id: 'grand_tour', name: 'Grand Tour', desc: 'Explore every world in the Solar System', icon: G.Icon('star') }
];
