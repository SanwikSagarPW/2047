window.G = window.G || {};

G.QUESTIONS = [
  {
    id: 'q_sat_1', topic: 'satellite.overview', difficulty: 1,
    text: 'What is a satellite?',
    options: ['A spacecraft that only takes photos', 'An object that orbits a planet', 'A kind of rocket', 'A star that moves fast'],
    correct: 1,
    explanation: 'A satellite is anything that travels around a planet. The Moon is a natural satellite, and human-made satellites orbit Earth for signals and weather data.',
    hint: 'Think about the Moon — it travels around Earth.'
  },
  {
    id: 'q_sat_2', topic: 'satellite.overview', difficulty: 2,
    text: 'Why do satellites stay in orbit around Earth instead of falling down?',
    options: ['There is no gravity in space', 'They are pushed by the wind', 'They fall around Earth continuously, moving sideways fast enough to miss it', 'They are glued to the sky'],
    correct: 2,
    explanation: 'Satellites are actually falling toward Earth all the time — but they are moving sideways so fast that they keep missing it. That is what an orbit is!',
    hint: 'An orbit is like falling and missing at the same time.'
  },
  {
    id: 'q_earth_1', topic: 'earth.atmosphere', difficulty: 1,
    text: 'What is the atmosphere?',
    options: ['The layer of gases around a world', 'The solid ground under our feet', 'The water in the oceans', 'The light from the Sun'],
    correct: 0,
    explanation: 'An atmosphere is the layer of gases surrounding a world. Earth\'s atmosphere gives us air to breathe and protects us from harmful sunlight.',
    hint: 'You breathe it every second.'
  },
  {
    id: 'q_earth_2', topic: 'earth.gravity', difficulty: 1,
    text: 'Why does a dropped ball fall to the ground?',
    options: ['Because the wind pushes it', 'Because Earth\'s gravity pulls it toward the centre', 'Because it is scared of heights', 'Because the ground is sticky'],
    correct: 1,
    explanation: 'Earth\'s gravity pulls everything toward its centre. That invisible pull is why things fall down when you drop them.',
    hint: 'It is an invisible pulling force.'
  },
  {
    id: 'q_moon_1', topic: 'moon.phases', difficulty: 2,
    text: 'Why does the Moon seem to change shape each night?',
    options: ['The Moon really shrinks and grows', 'Clouds cover parts of it', 'We see different amounts of its sunlit side as it orbits Earth', 'The Moon turns off its light'],
    correct: 2,
    explanation: 'The Moon never changes shape. As it travels around Earth, we see different amounts of the side lit by the Sun — from thin crescents to a full Moon.',
    hint: 'The Sun always lights half the Moon. What changes is how much of that half we see.'
  },
  {
    id: 'q_moon_2', topic: 'moon.craters', difficulty: 1,
    text: 'What made the round holes on the Moon\'s surface?',
    options: ['Volcanoes erupting holes', 'Meteoroids crashing into the surface', 'Ancient lunar rain', 'Bubbles in the Moon'],
    correct: 1,
    explanation: 'Craters form when meteoroids — rocks from space — slam into the surface at enormous speed, throwing up a round rim of material.',
    hint: 'Something hit the Moon very hard.'
  },
  {
    id: 'q_moon_3', topic: 'moon.gravity', difficulty: 2,
    text: 'Why could astronauts jump higher on the Moon than on Earth?',
    options: ['The Moon has weaker gravity because it is smaller', 'The Moon has stronger gravity', 'Their suits had springs', 'The Moon pulls them upward'],
    correct: 0,
    explanation: 'The Moon is much smaller than Earth, so its gravity is much weaker — about one sixth. That is why astronauts bounced along in giant leaps.',
    hint: 'Smaller world, weaker pull.'
  },
  {
    id: 'q_apollo_1', topic: 'apollo11', difficulty: 1,
    text: 'In which year did Apollo 11 land the first humans on the Moon?',
    options: ['1959', '1969', '1979', '1989'],
    correct: 1,
    explanation: 'Apollo 11 landed on 20 July 1969. Neil Armstrong and Buzz Aldrin walked on the Moon while Michael Collins orbited above.',
    hint: 'It happened in the 1960s.'
  },
  {
    id: 'q_apollo_2', topic: 'apollo11', difficulty: 2,
    text: 'Why did the Apollo 11 astronauts collect Moon rocks and soil?',
    options: ['To build a Moon house', 'So scientists could study lunar material directly in laboratories', 'To weigh the Moon', 'To leave them as souvenirs'],
    correct: 1,
    explanation: 'Returned samples let scientists analyse lunar material with powerful instruments. Those rocks transformed our understanding of the Moon.',
    hint: 'Scientists learn by studying real evidence up close.'
  },
  {
    id: 'q_ch1_1', topic: 'chandrayaan1', difficulty: 1,
    text: 'Chandrayaan-1 was which country\'s first Moon mission?',
    options: ['USA', 'Russia', 'India', 'Japan'],
    correct: 2,
    explanation: 'Chandrayaan-1 was India\'s first Moon mission, launched by ISRO in 2008. It found evidence of water molecules on the lunar surface.',
    hint: 'It was launched by ISRO.'
  },
  {
    id: 'q_ch3_1', topic: 'chandrayaan3', difficulty: 2,
    text: 'What was special about Chandrayaan-3\'s landing in 2023?',
    options: ['It landed on the Moon\'s far side', 'India became the first country to land near the Moon\'s south pole', 'It carried astronauts', 'It landed on Mars by mistake'],
    correct: 1,
    explanation: 'Chandrayaan-3\'s Vikram lander touched down near the Moon\'s south pole in August 2023 — a first for any nation. The Pragyan rover then studied the surface.',
    hint: 'It aimed for a very hard-to-reach region of the Moon.'
  },
  {
    id: 'q_ch3_2', topic: 'chandrayaan3', difficulty: 2,
    text: 'What was the name of Chandrayaan-3\'s rover?',
    options: ['Vikram', 'Pragyan', 'Aditya', 'Kalpana'],
    correct: 1,
    explanation: 'Pragyan was the rover, and Vikram was the lander. An orbiter circles a planet, a lander touches down, and a rover drives around.',
    hint: 'Vikram was the lander — the rover has a different name.'
  },
  {
    id: 'q_veh_1', topic: 'rover.role', difficulty: 1,
    text: 'What is a rover?',
    options: ['A robot car that drives on another world\'s surface', 'A kind of rocket', 'A space station', 'A type of satellite dish'],
    correct: 0,
    explanation: 'A rover is a robotic vehicle with wheels that drives across the surface of a planet or moon, carrying cameras and science instruments.',
    hint: 'It has wheels and explores on the ground.'
  },
  {
    id: 'q_veh_2', topic: 'lander.role', difficulty: 2,
    text: 'Why is landing on the Moon so difficult?',
    options: ['The Moon is made of quicksand', 'There is no road and no air brakes — the lander must slow itself down perfectly', 'The Moon moves too fast', 'Landers cannot see in the dark'],
    correct: 1,
    explanation: 'Landing is hard because there is no runway and no air to help slow down. The lander must fire its engines at exactly the right time to touch down softly.',
    hint: 'Think about stopping a car with no brakes and no road.'
  },
  {
    id: 'q_mars_1', topic: 'mars.color', difficulty: 1,
    text: 'Why does Mars look red?',
    options: ['It is covered in red paint', 'Iron in its rocks and dust has rusted', 'It is on fire', 'Red light from the Sun hits it'],
    correct: 1,
    explanation: 'Mars is red because iron in its surface rocks and dust has rusted over billions of years — the same way an old nail turns reddish-brown.',
    hint: 'Think of an old bicycle left out in the rain.'
  },
  {
    id: 'q_mars_2', topic: 'mars.water', difficulty: 2,
    text: 'What do dried river valleys and lake beds on Mars tell scientists?',
    options: ['Mars once had liquid water on its surface', 'Mars was always completely dry', 'The valleys were carved by wind only', 'Mars had oceans of lava'],
    correct: 0,
    explanation: 'Ancient channels and lake beds are strong evidence that liquid water flowed on Mars billions of years ago — meaning Mars was once warmer and wetter.',
    hint: 'Rivers need something to flow.'
  },
  {
    id: 'q_mars_3', topic: 'mars.rovers', difficulty: 2,
    text: 'Which NASA rovers explored Mars and searched for signs of ancient water?',
    options: ['Spirit and Opportunity', 'Vikram and Pragyan', 'Voyager 1 and 2', 'Hubble and Chandra'],
    correct: 0,
    explanation: 'Spirit and Opportunity landed on Mars in 2004 and found evidence of ancient water. Curiosity and Perseverance continued the search.',
    hint: 'They were robot geologists with wheels.'
  },
  {
    id: 'q_mars_4', topic: 'mars.atmosphere', difficulty: 2,
    text: 'Could a human breathe on Mars without a spacesuit?',
    options: ['Yes, the air is like Earth\'s', 'No — the atmosphere is very thin and mostly carbon dioxide', 'Yes, but only at night', 'No — Mars has no atmosphere at all'],
    correct: 1,
    explanation: 'Mars has an atmosphere, but it is about 100 times thinner than Earth\'s and mostly carbon dioxide. Humans would need spacesuits and oxygen.',
    hint: 'The air is there, but it is thin and made of the gas we breathe out.'
  },
  {
    id: 'q_jup_1', topic: 'jupiter.overview', difficulty: 1,
    text: 'Which is the largest planet in the Solar System?',
    options: ['Saturn', 'Jupiter', 'Earth', 'Neptune'],
    correct: 1,
    explanation: 'Jupiter is the largest planet — so big that all the other planets could fit inside it. It is a gas giant with no solid surface.',
    hint: 'It is named after the king of the Roman gods.'
  },
  {
    id: 'q_jup_2', topic: 'jupiter.gravity', difficulty: 2,
    text: 'Why can\'t we park a rover on Jupiter?',
    options: ['Jupiter is too cold', 'Jupiter has no solid surface — it is a gas giant', 'Jupiter is too far away', 'The rover would float away'],
    correct: 1,
    explanation: 'Jupiter is made mostly of hydrogen and helium gas. There is no solid ground to land on — a rover would sink into deeper and deeper layers of gas.',
    hint: 'What is a gas giant made of?'
  },
  {
    id: 'q_sat_3', topic: 'saturn.overview', difficulty: 1,
    text: 'What are Saturn\'s rings made of?',
    options: ['Solid metal discs', 'Countless chunks of ice and rock', 'Frozen air', 'Liquid water'],
    correct: 1,
    explanation: 'Saturn\'s rings are made of countless pieces of ice and rock, from tiny grains to house-sized boulders, all orbiting the planet.',
    hint: 'They are many small pieces, not one solid ring.'
  },
  {
    id: 'q_uran_1', topic: 'uranus.overview', difficulty: 2,
    text: 'What is unusual about how Uranus spins?',
    options: ['It does not spin at all', 'It spins on its side, likely knocked over by a giant impact', 'It spins backwards very fast', 'It spins around another planet'],
    correct: 1,
    explanation: 'Uranus rolls around the Sun like a ball — its axis is tilted about 98 degrees. Scientists think a giant collision long ago knocked it over.',
    hint: 'It rolls instead of spinning like a top.'
  },
  {
    id: 'q_nep_1', topic: 'neptune.overview', difficulty: 2,
    text: 'What is special about the winds on Neptune?',
    options: ['It has no winds at all', 'They are the fastest in the Solar System, over 2,000 km/h', 'They blow only at the poles', 'They are slower than Earth\'s'],
    correct: 1,
    explanation: 'Neptune has supersonic winds faster than 2,000 km/h — the fastest known in the Solar System, despite being the most distant and coldest planet.',
    hint: 'They are faster than a jet plane.'
  },
  {
    id: 'q_pluto_1', topic: 'pluto.dwarf', difficulty: 2,
    text: 'Why is Pluto called a dwarf planet instead of a planet?',
    options: ['It was destroyed', 'It is small, icy, and shares its orbital neighbourhood with similar Kuiper Belt objects', 'It left the Solar System', 'It is made of gas'],
    correct: 1,
    explanation: 'In 2006 scientists refined the definition of a planet. Pluto is small and shares its neighbourhood with many similar icy bodies, so it became a dwarf planet — one of five officially recognised.',
    hint: 'It is not alone out there — it has many icy neighbours.'
  },
  {
    id: 'q_asteroid_1', topic: 'asteroid.overview', difficulty: 2,
    text: 'Is the asteroid belt a crowded wall of crashing rocks like in films?',
    options: ['Yes, always', 'No — it is mostly empty space and spacecraft pass through easily', 'Only on weekends', 'Only near Mars'],
    correct: 1,
    explanation: 'Despite what movies show, the asteroid belt is mostly empty space. The rocks are millions of kilometres apart on average, and spacecraft fly through without danger.',
    hint: 'Space is big, and the rocks are far apart.'
  },
  {
    id: 'q_comet_1', topic: 'comet.overview', difficulty: 2,
    text: 'Which way does a comet\'s tail point?',
    options: ['Behind the comet, like a kite string', 'Always away from the Sun', 'Toward the Sun', 'It changes randomly'],
    correct: 1,
    explanation: 'A comet\'s tails always point away from the Sun, pushed by solar wind and radiation — even when the comet is travelling away from the Sun, its tail leads!',
    hint: 'The Sun pushes the tail outward.'
  },
  {
    id: 'q_sun_1', topic: 'sun.overview', difficulty: 1,
    text: 'What is the Sun?',
    options: ['A planet', 'A star — a giant ball of hot glowing gas', 'A moon', 'A comet'],
    correct: 1,
    explanation: 'The Sun is our closest star — a giant ball of hot gas that makes energy by nuclear fusion in its core, giving us light and heat.',
    hint: 'It makes its own light, unlike planets and moons.'
  },
  {
    id: 'q_orbit_1', topic: 'orbit.concept', difficulty: 2,
    text: 'Why do the planets orbit the Sun instead of falling straight into it?',
    options: ['The Sun pushes them away', 'Their sideways motion keeps missing the Sun while gravity pulls them in', 'They are too light to fall', 'Space is slippery'],
    correct: 1,
    explanation: 'An orbit is falling toward something while moving sideways fast enough to keep missing it. Gravity pulls the planets in; their motion carries them around.',
    hint: 'Falling and missing at the same time.'
  },
  {
    id: 'q_rocket_1', topic: 'rocket.overview', difficulty: 2,
    text: 'How does a rocket push itself in space where there is no air?',
    options: ['It pushes against the stars', 'It throws hot gas out the bottom, which pushes it forward', 'It uses giant fans', 'It cannot move in space'],
    correct: 1,
    explanation: 'A rocket throws hot gas downward at high speed, and the reaction pushes it upward — like a balloon flying when you let it go. It carries its own oxygen to burn fuel.',
    hint: 'Think of an untied balloon zooming around a room.'
  },
  {
    id: 'q_scimethod_1', topic: 'science.method', difficulty: 2,
    text: 'What is a hypothesis?',
    options: ['A final scientific fact', 'A smart guess that can be tested', 'A kind of telescope', 'A space rock'],
    correct: 1,
    explanation: 'A hypothesis is a smart, testable guess. Scientists then gather evidence through observations and experiments to see if the idea survives.',
    hint: 'It comes before the experiment.'
  },
  {
    id: 'q_lightyear_1', topic: 'light.year', difficulty: 2,
    text: 'What is a light-year?',
    options: ['A measure of time', 'The distance light travels in one year', 'How old a star is', 'A year on another planet'],
    correct: 1,
    explanation: 'A light-year measures distance, not time — about 9.5 trillion kilometres. Astronomers use it because space is too vast for kilometres.',
    hint: 'It sounds like time, but it measures distance.'
  },
  {
    id: 'q_moonfollow_1', topic: 'moon.following', difficulty: 2,
    text: 'Why does the Moon seem to follow your spaceship?',
    options: ['It is chasing you', 'It is very far away, so it appears to move with you — an effect called parallax', 'It copies your steering', 'It is afraid of the dark'],
    correct: 1,
    explanation: 'The Moon only seems to follow you because it is so far away. Distant objects appear to move with you, just like mountains seem to follow you from a car. This is called parallax.',
    hint: 'Distant mountains do the same thing from a car window.'
  }
];
