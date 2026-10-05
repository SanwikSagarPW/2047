window.G = window.G || {};

G.MISSIONS = [
  {
    id: 'launch_prep',
    title: 'Launch Prep',
    location: 'earth_orbit',
    concept: 'Learning your ship and what satellites do',
    koraIntro: "Welcome aboard the EX-01 Explorer, {name}. Before we visit other worlds, Mission Control requires a short training flight. Do not worry. I have already disabled the ship's tendency to explode.",
    steps: [
      { id: 'move', text: 'Fly your ship — use WASD to thrust', type: 'travel', target: 60 },
      { id: 'scan_sat', text: 'Scan the training satellite (approach and press Q)', type: 'scan', target: 'satellite' },
      { id: 'dock_terra', text: 'Dock at Terra Gate station (approach and press E)', type: 'dock', target: 'terra_gate' }
    ],
    koraComplete: "Training complete. Your piloting is... adequate. I have notified Mission Control that you are only slightly dangerous.",
    reward: { xp: 60, knowledge: ['satellite.overview', 'earth.overview'], badge: 'first_scan' },
    questions: ['q_sat_1', 'q_earth_1']
  },
  {
    id: 'first_footprints',
    title: 'First Footprints',
    location: 'moon',
    concept: 'Craters, lunar gravity and the Apollo 11 mission',
    koraIntro: "Our next destination is the Moon, {name}. Space is much larger in reality. We are using a compressed travel scale so you can actually reach places before graduating. Please try not to hit anything on the way.",
    steps: [
      { id: 'travel_moon', text: 'Travel to the Moon (open Map with M and select it)', type: 'travel_body', target: 'moon' },
      { id: 'land', text: 'Land the rover on the Moon (approach the surface and press E)', type: 'land', target: 'moon' },
      { id: 'scan_crater', text: 'Drive to the crater and scan it (press Q near it)', type: 'scan', target: 'crater' },
      { id: 'scan_apollo', text: 'Find and scan the Apollo 11 historical marker', type: 'scan', target: 'apollo_marker' },
      { id: 'return_ship', text: 'Return to your ship (press R near the lander)', type: 'return_ship' }
    ],
    koraComplete: "You have walked where Apollo 11 walked. Well — driven, technically. The rocks you scanned are older than almost anything on Earth. Excellent work, {name}.",
    reward: { xp: 120, knowledge: ['moon.craters', 'apollo11', 'moon.gravity'], badge: 'moon_walker' },
    questions: ['q_moon_2', 'q_apollo_1', 'q_apollo_2']
  },
  {
    id: 'chandrayaan_zone',
    title: 'India Looks at the Moon',
    location: 'moon',
    concept: "Chandrayaan-1, 2 and 3 — India's lunar exploration",
    koraIntro: "India's space agency ISRO has explored the Moon with three Chandrayaan missions. Three knowledge capsules are waiting at the landing site. Scan them all to complete the learning zone.",
    steps: [
      { id: 'land2', text: 'Land on the Moon again', type: 'land', target: 'moon' },
      { id: 'scan_ch1', text: 'Scan the Chandrayaan-1 capsule', type: 'scan', target: 'ch1_marker' },
      { id: 'scan_ch2', text: 'Scan the Chandrayaan-2 capsule', type: 'scan', target: 'ch2_marker' },
      { id: 'scan_ch3', text: 'Scan the Chandrayaan-3 capsule', type: 'scan', target: 'ch3_marker' },
      { id: 'return_ship2', text: 'Return to your ship', type: 'return_ship' }
    ],
    koraComplete: "Chandrayaan-3 made India the first nation to land near the Moon's south pole. You now know the difference between an orbiter, a lander and a rover. I am documenting this historic level of competence.",
    reward: { xp: 100, knowledge: ['chandrayaan1', 'chandrayaan2', 'chandrayaan3', 'isro.overview'], badge: null },
    questions: ['q_ch1_1', 'q_ch3_1', 'q_ch3_2']
  },
  {
    id: 'selene_quiz',
    title: 'Selene Junction Check',
    location: 'selene_junction',
    concept: 'Station life and a knowledge check',
    koraIntro: "Selene Junction orbits the Moon. The crew there would like to meet you — and, naturally, test you. Scientists love tests. It is their way of showing affection.",
    steps: [
      { id: 'travel_selene', text: 'Travel to Selene Junction (Map with M)', type: 'travel_body', target: 'selene_junction' },
      { id: 'dock_selene', text: 'Dock at the station', type: 'dock', target: 'selene_junction' },
      { id: 'talk_npc', text: 'Speak with the station geologist', type: 'npc', target: 'npc_geologist' },
      { id: 'station_quiz', text: 'Complete the station knowledge check', type: 'quiz' }
    ],
    koraComplete: "The station crew is impressed. I have added a note to your file: 'Asker of questions. Promising.'",
    reward: { xp: 80, knowledge: ['lander.role', 'rover.role'], badge: null },
    questions: []
  },
  {
    id: 'dry_river',
    title: 'The Dry River Puzzle',
    location: 'mars',
    concept: 'Evidence of ancient water on Mars',
    koraIntro: "Mars is waiting, {name}. Our mission: investigate an ancient valley and determine whether water once flowed there. Observe first, then conclude. That is how real science works.",
    steps: [
      { id: 'travel_mars', text: 'Travel to Mars (Map with M)', type: 'travel_body', target: 'mars' },
      { id: 'land_mars', text: 'Land the rover on Mars', type: 'land', target: 'mars' },
      { id: 'scan_channel', text: 'Scan the dry river channel', type: 'scan', target: 'channel' },
      { id: 'scan_rock', text: 'Scan the layered rock formation', type: 'scan', target: 'layered_rock' },
      { id: 'conclude', text: 'Record your conclusion at the evidence console', type: 'scan', target: 'console' },
      { id: 'return_ship3', text: 'Return to your ship', type: 'return_ship' }
    ],
    koraComplete: "You observed channels and layered rocks, then concluded that water once flowed here. That is not driving in circles. That is actual science, {name}.",
    reward: { xp: 140, knowledge: ['mars.water', 'mars.rovers', 'science.method'], badge: 'evidence_finder' },
    questions: ['q_mars_2', 'q_mars_3', 'q_scimethod_1']
  },
  {
    id: 'ares_relay',
    title: 'Ares Relay',
    location: 'ares_relay',
    concept: 'Communication, refuelling and the journey home',
    koraIntro: "Ares Relay orbits Mars. We need to refuel, report our findings to the crew, and prepare for the journey home. Even explorers must occasionally do paperwork.",
    steps: [
      { id: 'travel_ares', text: 'Travel to Ares Relay (Map with M)', type: 'travel_body', target: 'ares_relay' },
      { id: 'dock_ares', text: 'Dock at the station', type: 'dock', target: 'ares_relay' },
      { id: 'refuel', text: 'Refuel at the station', type: 'refuel' },
      { id: 'talk_comms', text: 'Speak with the communications specialist', type: 'npc', target: 'npc_comms' }
    ],
    koraComplete: "Tanks full, reports filed. The crew sends their regards and one slightly stale space biscuit. The inner worlds are complete, {name} — and Galileo Gate has just cleared you for the outer system.",
    reward: { xp: 80, knowledge: ['communication.concept', 'fuel.concept'], badge: null, unlock: ['jupiter'] },
    questions: ['q_mars_4']
  },
  {
    id: 'jupiter_expedition',
    title: 'The Giant Worlds',
    location: 'jupiter',
    concept: 'Jupiter, gas giants and the Great Red Spot',
    koraIntro: "Beyond the asteroid belt lies Jupiter, the largest planet — and a world you cannot land on. Scan it from orbit, dock at Galileo Gate, and try not to fall in. Falling in would be very final.",
    steps: [
      { id: 'travel_jupiter', text: 'Travel to Jupiter (Map with M)', type: 'travel_body', target: 'jupiter' },
      { id: 'scan_jupiter', text: 'Scan Jupiter from orbit (press Q)', type: 'scan', target: 'jupiter' },
      { id: 'dock_galileo', text: 'Dock at Galileo Gate (approach and press E)', type: 'dock', target: 'galileo_gate' },
      { id: 'jupiter_quiz', text: 'Complete the gas giant knowledge check', type: 'quiz' }
    ],
    koraComplete: "Jupiter has no surface to stand on — only deepening layers of gas and a storm bigger than Earth. You scanned it without falling in. I am genuinely impressed, and I almost never say that.",
    reward: { xp: 160, knowledge: ['jupiter.overview', 'gas.giant.concept'], badge: 'giant_worlds', unlock: ['saturn'] },
    questions: ['q_jup_1', 'q_jup_2']
  },
  {
    id: 'saturn_rings',
    title: 'The Ringed World',
    location: 'saturn',
    concept: 'Saturn, its rings and its ocean moons',
    koraIntro: "Saturn is waiting, {name}. Its rings are not solid — they are billions of drifting chunks of ice. Cassini Ring station is parked among them. Try not to collect any of the scenery.",
    steps: [
      { id: 'travel_saturn', text: 'Travel to Saturn (Map with M)', type: 'travel_body', target: 'saturn' },
      { id: 'scan_saturn', text: 'Scan Saturn and its rings from orbit (press Q)', type: 'scan', target: 'saturn' },
      { id: 'dock_cassini', text: 'Dock at Cassini Ring station', type: 'dock', target: 'cassini_ring' },
      { id: 'saturn_quiz', text: 'Complete the ring world knowledge check', type: 'quiz' }
    ],
    koraComplete: "Rings of ice, a moon with lakes of methane, and geysers from an underground ocean. Saturn is doing a great deal of showing off. Well observed, {name}.",
    reward: { xp: 160, knowledge: ['saturn.overview', 'saturn.moons'], badge: 'ring_walker', unlock: ['uranus', 'neptune'] },
    questions: ['q_sat_3']
  },
  {
    id: 'ice_giants',
    title: 'The Cold Edge',
    location: 'neptune',
    concept: 'Uranus, Neptune and the ice giants',
    koraIntro: "The ice giants are next: Uranus, which rolls on its side, and Neptune, where the fastest winds in the Solar System scream past two thousand kilometres an hour. Dress warm. Metaphorically. You are in a spaceship.",
    steps: [
      { id: 'travel_uranus', text: 'Travel to Uranus (Map with M)', type: 'travel_body', target: 'uranus' },
      { id: 'scan_uranus', text: 'Scan Uranus from orbit (press Q)', type: 'scan', target: 'uranus' },
      { id: 'travel_neptune', text: 'Travel to Neptune (Map with M)', type: 'travel_body', target: 'neptune' },
      { id: 'scan_neptune', text: 'Scan Neptune from orbit (press Q)', type: 'scan', target: 'neptune' },
      { id: 'dock_odyssey', text: 'Dock at Odyssey Post, the farthest outpost', type: 'dock', target: 'odyssey_post' },
      { id: 'ice_quiz', text: 'Complete the ice giant knowledge check', type: 'quiz' }
    ],
    koraComplete: "You have now visited the coldest worlds we know. Uranus tips over; Neptune howls. Both are made of ices, not gas. You are officially an outer-system explorer.",
    reward: { xp: 180, knowledge: ['uranus.overview', 'neptune.overview'], badge: 'ice_explorer', unlock: ['pluto', 'ceres'] },
    questions: ['q_uran_1', 'q_nep_1']
  },
  {
    id: 'beyond_map',
    title: 'Beyond the Map',
    location: 'pluto',
    concept: 'Pluto, Ceres and the Kuiper Belt',
    koraIntro: "One last journey, {name}. Pluto waits in the Kuiper Belt, and on the way back we will visit Ceres in the asteroid belt. These are dwarf planets — small worlds that never finished growing up. Much like some explorers I know.",
    steps: [
      { id: 'travel_pluto', text: 'Travel to Pluto in the Kuiper Belt (Map with M)', type: 'travel_body', target: 'pluto' },
      { id: 'scan_pluto', text: 'Scan Pluto from orbit (press Q)', type: 'scan', target: 'pluto' },
      { id: 'travel_ceres', text: 'Travel to Ceres in the asteroid belt (Map with M)', type: 'travel_body', target: 'ceres' },
      { id: 'scan_ceres', text: 'Scan Ceres from orbit (press Q)', type: 'scan', target: 'ceres' }
    ],
    koraComplete: "Pluto has mountains of water ice and a heart-shaped plain. Ceres holds more fresh water than Earth. The small worlds are full of surprises — as are you.",
    reward: { xp: 200, knowledge: ['pluto.dwarf', 'kuiper.belt', 'ceres.overview', 'asteroid.overview', 'voyager.missions'], badge: 'kuiper_pioneer' },
    questions: ['q_pluto_1', 'q_asteroid_1', 'q_comet_1']
  },
  {
    id: 'explorers_report',
    title: "The Explorer's Report",
    location: 'earth',
    concept: 'Presenting everything you learned',
    koraIntro: "Home again, {name}. You have crossed the entire Solar System. Mission Control has one final task: assemble your Explorer's Field Report from the evidence you gathered. Choose wisely — this is the story of your expedition.",
    steps: [
      { id: 'travel_earth', text: 'Return to Earth orbit (Map with M)', type: 'travel_body', target: 'earth' },
      { id: 'report', text: 'Assemble your Field Report at Mission Control', type: 'report' }
    ],
    koraComplete: "Mission complete. You started by asking where the Moon was. You ended by explaining the storms of Jupiter and the ice of Neptune. Acceptable progress — for a human.",
    reward: { xp: 250, knowledge: ['deep.space', 'light.year'], badge: 'grand_tour' },
    questions: []
  }
];
