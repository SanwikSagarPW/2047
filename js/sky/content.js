(function (S) {
  'use strict';
  var Cn = S.content = {};

  // Places used on the Earth globe: [lat, lon, label]
  Cn.PLACES = {
    hanle: [32.78, 78.96, 'Hanle, Ladakh'], india: [22, 79, 'India'], russia: [49, 44, 'Russia'], mongolia: [47, 105, 'Mongolia'],
    samerica: [-12, -58, 'South America'], portugal: [39.5, -8, 'Portugal'], mexico: [23, -102, 'Mexico'], brazil: [-12, -50, 'Brazil'],
    usa: [38, -97], france: [47, 2], japan: [36, 138], australia: [-25,134], africa: [5, 20]
  };
  var ALL_ROUTES = [
    ['russia', 'india', 'in'], ['mongolia', 'india', 'in'], ['india', 'usa', 'out'], ['india', 'france', 'out'], ['india', 'japan', 'out'],
    ['india', 'australia', 'out'], ['samerica', 'portugal', 'in'], ['portugal', 'india', 'in'], ['india', 'africa', 'out'],
    ['mexico', 'india', 'in'], ['india', 'brazil', 'out']
  ];

  Cn.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Planet colours / info for the planet picker and orrery
  Cn.BODY = {
    sun: { name: 'Sun', ico: '\u2600\ufe0f', c1: '#fff1a8', c2: '#ff9a1f', r: 1.15, tex: '2k_sun.jpg' },
    mercury: { name: 'Mercury', c1: '#cfc7bd', c2: '#7d7468', r: 0.2, tex: '2k_mercury.jpg' },
    venus: { name: 'Venus', c1: '#ffe2a8', c2: '#c98a3c', r: 0.3, tex: '2k_venus_atmosphere.jpg' },
    earth: { name: 'Earth', c1: '#8fd0ff', c2: '#1f6fd0', r: 0.32, tex: '2k_earth_daymap.jpg' },
    mars: { name: 'Mars', c1: '#ff9a6a', c2: '#a8401e', r: 0.24, tex: '2k_mars.jpg' },
    jupiter: { name: 'Jupiter', c1: '#f3dcbc', c2: '#b9895c', r: 0.78, tex: '2k_jupiter.jpg' },
    saturn: { name: 'Saturn', c1: '#fff0c4', c2: '#c9a867', r: 0.62, tex: '2k_saturn.jpg' },
    uranus: { name: 'Uranus', c1: '#c4f4f8', c2: '#58b8c8', r: 0.46, tex: '2k_uranus.jpg' },
    neptune: { name: 'Neptune', c1: '#8fb4ff', c2: '#2a46c8', r: 0.44, tex: '2k_neptune.jpg' },
    pluto: { name: 'Pluto', c1: '#e7d9c9', c2: '#9a8672', r: 0.14, tex: 'tex_pluto.jpg' },
    moon: { name: 'Moon', c1: '#e8e8e8', c2: '#8a8a8a', r: 0.1, tex: '2k_moon.jpg' }
  };

  var SKY = function (o) { o.s = 'sky'; o.tab = 'sky'; return o; };
  var BODY = function (b, tab, o) { o.s = 'body'; o.b = b; o.tab = tab; return o; };

  Cn.LESSONS = [
    // ===================== LADAKH NIGHT SKY =====================
    SKY({ key: 'hello', tag: 'Namaste from Ladakh!', title: 'Hanle, Ladakh', when: { h: 21 }, look: { az: 150, alt: 28, fov: 78 }, lines: [],
      text: 'I am Kora! We are standing in Hanle, high in the mountains of Ladakh. The sky here is so dark that thousands of stars shine. Drag to look around!' }),
    SKY({ tag: 'Hanle Observatory', title: 'A telescope in the mountains', when: { h: 21 }, look: { az: 130, alt: 14, fov: 60 }, lines: [],
      text: 'That white dome is the Indian Astronomical Observatory, about 4,500 metres high. The air is thin, dry and clear \u2014 perfect for watching the sky. Tap the dome!',
      chips: [{ l: '\ud83c\udf03 Why dark?', t: 'Bright city lights hide the stars. Far from cities, in the dark, you can see many, many more stars.' }] }),
    SKY({ tag: 'Stars', title: 'Stars are faraway suns', when: { h: 21 }, look: { az: 200, alt: 50, fov: 70 }, lines: [],
      text: 'Look up! Stars are huge, hot balls of glowing gas, like our Sun. They are very far away and make their own light. Tap any star to meet it!',
      chips: [{ l: '\u2728 Why twinkle?', t: 'Starlight wobbles as it passes through the moving air around Earth, so stars seem to twinkle.' }] }),
    SKY({ key: 'dawn', tag: 'Day and night', title: 'Where do stars go in the day?', when: { h: 21 }, look: { az: 100, alt: 30, fov: 80 }, lines: [], auto: 'sunrise', tools: ['time'],
      text: 'Stars do not disappear in the day! Sunlight makes the sky so bright that we cannot see their faint light. Watch the sunrise \u2014 then slide the clock back.',
      chips: [{ l: '\ud83c\udf05 Replay sunrise', act: 'sunrise' }] }),
    SKY({ tag: 'Constellations', title: 'Joining the dots', when: { m: 4, h: 21 }, focus: ['polaris', 'dubhe'], fov: 85, lines: ['bigdipper', 'littledipper', 'cassiopeia', 'leo'], labels: ['bigdipper', 'littledipper', 'cassiopeia', 'leo'],
      text: 'People joined stars into patterns called constellations and named them after animals, objects and characters. Before compasses, travellers used them to find their way!' }),
    SKY({ key: 'dipper', tag: 'Constellation 1', title: 'The Big Dipper \u00b7 Saptarishi', when: { m: 4, h: 21 }, focus: 'bigdipper', fov: 55, lines: ['bigdipper'], labels: ['bigdipper'],
      text: 'Seven stars make a shape like a big spoon \u2014 the Big Dipper. In India it is Saptarishi, the Seven Sages. It is part of Ursa Major, the Great Bear.',
      chips: [{ l: '\ud83d\udc3b Great Bear', t: 'Ursa Major means the Great Bear. The Big Dipper forms its back and tail.' }] }),
    SKY({ key: 'pole', tag: 'The Pole Star', title: 'Find the Pole Star', when: { m: 4, h: 21 }, focus: ['dubhe', 'polaris'], fov: 62, lines: ['bigdipper'], labels: [], starLabels: ['dubhe', 'merak'], pointer: true,
      text: 'Draw a line from Merak through Dubhe and go about five times further. You reach Polaris, the Pole Star (Dhruva Tara). It is not very bright, but it always points north!',
      chips: [{ l: '\ud83e\udded Why north?', t: 'The Pole Star sits almost exactly above Earth\u2019s north pole, so it stays in the same place while other stars move.' }] }),
    SKY({ tag: 'Constellation 2', title: 'The Little Dipper', when: { m: 4, h: 21 }, focus: 'littledipper', fov: 55, lines: ['littledipper', 'bigdipper'], labels: ['littledipper'],
      text: 'Next to the Big Dipper is a smaller one: the Little Dipper, part of Ursa Minor, the Little Bear. The Pole Star shines at the tip of its handle.' }),
    SKY({ key: 'spin', tag: 'Activity', title: 'The sky turns around the Pole Star', when: { m: 4, h: 21 }, focus: ['polaris'], fov: 90, lines: ['bigdipper', 'littledipper'], labels: [], starLabels: ['polaris'], trail: true, tools: ['time', 'hours'], auto: 'spin',
      text: 'Stars seem to move because Earth spins. Watch the Big Dipper circle round the Pole Star! Try 9 PM, 11 PM, 1 AM and 3 AM \u2014 the Pole Star never moves.',
      chips: [{ l: '\u25b6\ufe0f Spin time', act: 'spin' }] }),
    SKY({ key: 'orion', tag: 'Constellation 3', title: 'Orion, the Hunter', when: { m: 0, h: 21 }, focus: 'orion', fov: 55, lines: ['orion'], labels: ['orion'],
      text: 'In winter, look for Orion! Three stars in a row make his belt. Red Betelgeuse is his shoulder and blue-white Rigel is his foot. Let\u2019s jump to a winter night.',
      chips: [{ l: '\ud83c\udfa8 Star colours', t: 'Hot stars look blue-white, cooler stars look orange or red. Betelgeuse is red; Rigel is blue-white.' }] }),
    SKY({ tag: 'Brightest star', title: 'Sirius in Canis Major', when: { m: 0, h: 21 }, focus: ['sirius', 'alnilam'], fov: 62, lines: ['orion', 'canismajor'], labels: ['canismajor'], starLabels: [],
      text: 'Follow Orion\u2019s belt down to the left and you find Sirius, the brightest star in the night sky, in Canis Major (the Great Dog). It is brighter than the Pole Star! But it is a faraway star, not part of our Solar System.' }),
    SKY({ key: 'seasons', tag: 'Seasons', title: 'Different sky, different season', when: { m: 0, h: 21 }, look: { az: 150, alt: 40, fov: 90 }, lines: ['all'], labels: [], tools: ['time', 'months'],
      text: 'Earth goes around the Sun, so the same hour shows different stars in different seasons. Orion rules the winter sky. Pick a month and watch the constellations change!' }),
    SKY({ key: 'planets', tag: 'Stars or planets?', title: 'Planets wander', when: { h: 19.2 }, look: { az: 220, alt: 25, fov: 80 }, lines: [], ecliptic: true, planetsHint: true, tools: ['time'],
      text: 'Some bright dots are planets! Planets do not make their own light \u2014 they shine by reflecting sunlight \u2014 and they do not twinkle. Venus is called the Evening Star, but it is a planet! Tap the glowing dots.',
      chips: [{ l: '\ud83d\udcc9 The yellow line', t: 'The dotted line is the path the Sun and the planets seem to follow across the sky.' }] }),
    SKY({ key: 'leave', tag: 'Ready?', title: 'Let\u2019s leave Earth!', when: { h: 21 }, look: { az: 150, alt: 60, fov: 80 }, lines: ['all'], labels: [], next: 'Blast off! \ud83d\ude80', flash: '\ud83d\ude80 Blast off!',
      text: 'You have explored the night sky from Ladakh. Now let\u2019s fly up and see Earth \u2014 our shared home \u2014 from space!' }),

    // ===================== EARTH: OUR SHARED HOME =====================
    BODY('earth', 'earth', { key: 'earth1', tag: 'The Blue Planet', title: 'Earth \u2014 Our Shared Home', flash: '\ud83d\ude80 Blast off!', look: [[20, 79]],
      text: '\u201cEarth looks completely one, no border is visible from outside\u2026 the Earth is our one home, and all of us are in it.\u201d \u2014 Group Captain Shubhanshu Shukla, first Indian to reach the International Space Station.' }),
    BODY('earth', 'earth', { tag: 'Do you know?', title: 'Seeing Earth from space', look: [[20, 79]],
      text: 'Wing Commander Rakesh Sharma was the first Indian to see Earth from space. Asked how India looked from above, he said, \u201cSaare Jahaan Se Achcha.\u201d' }),
    BODY('earth', 'earth', { tag: 'From high up in space', title: 'Land and sea', look: [[10, 20]],
      text: 'Earth looks tiny. We cannot see our city or village \u2014 only the broad shapes of land and sea on our blue planet.' }),
    BODY('earth', 'earth', { tag: 'Activity 1', title: 'My address', pins: ['hanle', 'india'], look: [[0, -150], [30, 79]],
      text: 'Country: India. Planet: Earth. Can you find India \u2014 and Hanle, where we were just now? Turn the globe. Are all the oceans connected?' }),
    BODY('earth', 'earth', { tag: 'No boundaries', title: 'Nature has no borders', look: [[30, 60]],
      text: 'From far above we see no lines between countries. Air, water, clouds, seeds and animals move freely across the world.' }),
    BODY('earth', 'earth', { tag: 'Story 1', title: 'The Travelling Birds!', pins: ['russia', 'mongolia', 'india'], routes: [['russia', 'india', 'in'], ['mongolia', 'india', 'in']], look: [[38, 75]],
      text: 'Every winter, rosy starlings fly thousands of kilometres from southern Russia and Mongolia to India. They eat locusts and grasshoppers, helping farmers.' }),
    BODY('earth', 'earth', { tag: 'Story 2', title: 'Yoga \u2014 India\u2019s Gift to the World!', pins: ['india'], routes: [['india', 'usa', 'out'], ['india', 'france', 'out'], ['india', 'japan', 'out'], ['india', 'australia', 'out']], look: [[22, 79], [35, -20]],
      text: 'Yoga has been practised in India for over 3,000 years. Travellers and teachers shared it, and today it is practised in almost every country. The UN declared 21 June International Day of Yoga in 2014.' }),
    BODY('earth', 'earth', { tag: 'Story 3', title: 'Chilli \u2014 A Spice that Changed our Lives!', pins: ['samerica', 'portugal', 'india'], routes: [['samerica', 'portugal', 'in'], ['portugal', 'india', 'in']], look: [[20, 10]],
      text: 'Chilli plants were once found only in South America. 400 to 500 years ago, travellers from Portugal brought them to India. Before that, we used black pepper.' }),
    BODY('earth', 'earth', { tag: 'Story 4', title: 'The Sweet Story of Sugar!', pins: ['india'], routes: [['india', 'france', 'out'], ['india', 'africa', 'out'], ['india', 'japan', 'out']], look: [[22, 60]],
      text: 'Jaggery from sugarcane juice was first made in India, and later sugar. This knowledge spread through trade and travel. Rice, mangoes and bananas travelled too.' }),
    BODY('earth', 'earth', { tag: 'Story 5', title: 'The Mexican Marigold Moves into India!', pins: ['mexico', 'india'], routes: [['mexico', 'india', 'in']], look: [[23, -102], [22, 79]],
      text: 'Marigolds come from Mexico, where they are used in festivals. The flower travelled across the world and now fills our temples, homes, weddings and Diwali.' }),
    BODY('earth', 'earth', { tag: 'Story 6', title: 'The Cows that Went to Brazil!', pins: ['india', 'brazil'], routes: [['india', 'brazil', 'out']], look: [[22, 79], [-10, -50]],
      text: 'Portuguese traders took Indian cows to Brazil. Today, more than three-fourths of Brazil\u2019s milk comes from three Indian breeds \u2014 Gir, Kankrej and Ongole.' }),
    BODY('earth', 'earth', { tag: 'Web of Life', title: 'We are all connected', routes: ALL_ROUTES, look: [[20, 20]],
      text: 'Orange paths came to India. Blue paths went out from India. People, animals, plants and ideas travel, mix and grow together.' }),
    BODY('earth', 'earth', { tag: 'One Earth, One Family!', title: 'Vasudhaiva Kutumbakam', look: [[20, 79]],
      text: '\u201cThe world is one family.\u201d Earth is the only planet we know that has life. When we care for Earth, we care for each other \u2014 it is a gift we must protect.' }),
    BODY('earth', 'earth', { key: 'spin', tag: 'Rotation and revolution', title: 'Earth spins and travels', mode: 'spin', look: [[0, 0]],
      text: 'Earth spins on its axis once a day \u2014 that is rotation, and it gives us day and night. Earth also goes around the Sun once a year \u2014 that is revolution.',
      chips: [{ l: '\ud83c\udf1e Day & night', t: 'The half facing the Sun has day. The other half has night. As Earth spins, Ladakh goes from day to night and back.' }, { l: '\ud83d\udcc5 A year', t: 'Earth takes about 365 days to go once around the Sun.' }] }),
    BODY('earth', 'earth', { key: 'sats', tag: 'Satellites', title: 'Things that go round Earth', mode: 'sats', fit: 3.4, look: [[20, 79]],
      text: 'A satellite is something that goes around a planet. The Moon is Earth\u2019s natural satellite. People also make artificial satellites for TV, weather, maps and research. Tap them!' }),

    // ===================== THE MOON =====================
    BODY('moon', 'moon', { key: 'moon1', tag: 'Earth\u2019s neighbour', title: 'The Moon', look: [[0, 0]], flash: '\ud83c\udf19 Next stop: the Moon',
      text: 'The Moon is Earth\u2019s only natural satellite. It has no light of its own \u2014 it shines by reflecting sunlight.',
      parts: true,
      chips: [{ l: '\ud83c\udf11 Dark patches', t: 'The dark patches are great plains of old, cooled lava called maria (say MAH-ree-uh).', ll: [32, -16] },
        { l: '\u2604\ufe0f Craters', t: 'Craters are bowl-shaped holes made by space rocks hitting the Moon long ago. This one is Tycho.', ll: [-43, -11] },
        { l: '\ud83c\uddee\ud83c\uddf3 Chandrayaan-3', t: 'In 2023, India\u2019s Chandrayaan-3 landed near the Moon\u2019s south pole!', ll: [-69.4, 32.3] }] }),
    BODY('moon', 'moon', { key: 'phases', tag: 'Phases of the Moon', title: 'Why does the Moon change shape?', mode: 'phases', look: [[0, 0]], tools: ['phase'],
      text: 'Half of the Moon is always lit by the Sun. As the Moon goes around Earth in about a month, we see more or less of the lit half. Slide to travel through the phases!' }),

    // ===================== THE SOLAR SYSTEM =====================
    { s: 'orrery', tab: 'solar', key: 'solar1', tag: 'Our Solar System', title: 'The Sun and its family', speed: 20, tools: ['strip', 'speed'], dist: 34, flash: '\u2600\ufe0f Into the Solar System',
      text: 'The Sun is at the centre. Eight planets, their moons, asteroids and comets all travel around it. These are today\u2019s real positions! Tap a planet or use the buttons below.' },
    { s: 'orrery', tab: 'solar', tag: 'Order of the planets', title: 'Mercury to Neptune', speed: 20, tools: ['strip', 'speed'], dist: 34, sequence: false,
      text: 'From the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. Your mission: tap the planets in that order, closest to the Sun first!' },
    { s: 'orrery', tab: 'solar', tag: 'Revolution', title: 'Planets go around the Sun', speed: 120, tools: ['strip', 'speed'], dist: 34,
      text: 'Planets travel round the Sun in paths called orbits. Planets close to the Sun go round quickly; far ones take much longer. Earth takes one year!',
      chips: [{ l: '\ud83e\udd95 Neptune', t: 'Neptune is so far away that one trip round the Sun takes about 165 Earth years!' }] },
    { s: 'orrery', tab: 'solar', tag: 'Small bodies', title: 'Asteroids and comets', speed: 20, tools: ['strip', 'speed'], dist: 30, pills: true,
      text: 'Between Mars and Jupiter is a belt of rocky asteroids. Comets are balls of ice and dust that grow glowing tails near the Sun. Tap the pills.' },
    { s: 'orrery', tab: 'solar', tag: 'Not to scale', title: 'Pluto and the real size', speed: 20, tools: ['strip', 'speed'], dist: 40, pills: true,
      text: 'Pluto is a dwarf planet \u2014 not one of the eight planets. And remember: pictures cannot show real sizes and distances together. Really, the planets are tiny and very far apart!' },

    // ===================== EACH WORLD =====================
    BODY('sun', 'solar', { key: 'planet:sun', tag: 'Our star', title: 'The Sun', fit: 1.3, mood: 'alert',
      text: 'The Sun is a star \u2014 a huge ball of hot, glowing gas. Its light and heat make life on Earth possible. Never look straight at the Sun: it can hurt your eyes!',
      chips: [{ l: '\u2b50 A star!', t: 'Stars make their own light. The Sun looks big and bright only because it is so much closer than other stars.' }, { l: '\ud83d\udef0\ufe0f Aditya-L1', t: 'India\u2019s Aditya-L1 spacecraft, launched in 2023, studies the Sun from space.' }] }),
    BODY('mercury', 'solar', { key: 'planet:mercury', tag: 'Planet 1 of 8', title: 'Mercury', fit: 1,
      text: 'The closest planet to the Sun and the smallest. Its surface is covered with craters, and one year there is only 88 Earth days!',
      chips: [{ l: '\u2604\ufe0f Craters', t: 'Mercury has many craters, made by space rocks long ago.', ll: [20, 30] }] }),
    BODY('venus', 'solar', { key: 'planet:venus', tag: 'Planet 2 of 8', title: 'Venus', fit: 1,
      text: 'Thick clouds trap the Sun\u2019s heat, making Venus the hottest planet. We often see it shining at dusk or dawn, so it is called the Evening Star \u2014 but it is a planet!',
      chips: [{ l: '\ud83c\udf06 Evening star', t: 'Venus is very bright because its clouds reflect lots of sunlight. It looks like a steady star low in the sky after sunset.' }] }),
    BODY('earth', 'solar', { key: 'planet:earth', tag: 'Planet 3 of 8', title: 'Earth', fit: 1.2, look: [[32.78, 78.96]], pins: ['hanle'],
      text: 'Our home! Earth is the only planet we know that has life. It has air to breathe, water to drink and just the right temperature.',
      chips: [{ l: '\ud83d\udca7 Water', t: 'About 70 percent of Earth\u2019s surface is covered with water.' }, { l: '\ud83c\udf19 One Moon', t: 'Earth has one natural satellite \u2014 the Moon.' }] }),
    BODY('mars', 'solar', { key: 'planet:mars', tag: 'Planet 4 of 8', title: 'Mars', fit: 1,
      text: 'The Red Planet! Its rusty, iron-rich soil makes it look red. Mars has two tiny moons, Phobos and Deimos.',
      chips: [{ l: '\ud83c\udf0b Olympus Mons', t: 'Olympus Mons is the tallest volcano in the Solar System \u2014 more than twice as tall as Mount Everest!', ll: [18, -134] }, { l: '\ud83d\udef0\ufe0f Mangalyaan', t: 'India\u2019s Mangalyaan reached Mars orbit on its very first try, in 2014.' }] }),
    BODY('jupiter', 'solar', { key: 'planet:jupiter', tag: 'Planet 5 of 8', title: 'Jupiter', fit: 1,
      text: 'The biggest planet! More than 1,300 Earths could fit inside it. It has stripes of colourful clouds and a giant storm called the Great Red Spot.',
      chips: [{ l: '\ud83c\udf00 Giant storm', t: 'The Great Red Spot is a storm bigger than Earth that has been raging for hundreds of years.' }] }),
    BODY('saturn', 'solar', { key: 'planet:saturn', tag: 'Planet 6 of 8', title: 'Saturn', fit: 1.1,
      text: 'Famous for its bright rings made of billions of pieces of ice and rock. Saturn is so light for its size that it would float in a giant bathtub!',
      chips: [{ l: '\ud83d\udc8d Rings', t: 'Saturn\u2019s rings are very wide but very thin \u2014 pieces of ice and rock, all orbiting the planet.', reset: true }] }),
    BODY('uranus', 'solar', { key: 'planet:uranus', tag: 'Planet 7 of 8', title: 'Uranus', fit: 1,
      text: 'A pale blue-green icy planet. Uranus spins tilted on its side, like a rolling ball!' }),
    BODY('neptune', 'solar', { key: 'planet:neptune', tag: 'Planet 8 of 8', title: 'Neptune', fit: 1,
      text: 'The farthest planet from the Sun. It is deep blue, cold and very windy, with fast storms.', next: 'Zoom out \ud83c\udf0c' }),

    // ===================== BEYOND =====================
    { s: 'galaxy', tab: 'galaxy', key: 'galaxy1', tag: 'Beyond the Solar System', title: 'The Milky Way', dist: 2.6, flash: '\ud83c\udf0c Zooming out\u2026',
      text: 'Our Solar System is part of a giant family of billions of stars called the Milky Way galaxy. The pale band you saw across the Ladakh sky is the Milky Way! Tap \u201cYou are here\u201d.' },
    { s: 'galaxy', tab: 'galaxy', tag: 'The Universe', title: 'Billions of galaxies', dist: 40, far: true,
      text: 'The Milky Way is just one galaxy. There are billions of galaxies beyond it. All of space with everything in it is called the Universe. Pinch to zoom out and see them!' },
    { s: 'galaxy', tab: 'galaxy', key: 'end', tag: 'You did it!', title: 'Space explorer!', dist: 8, finale: true, mood: 'happy', next: 'Fly home to Ladakh \ud83c\udfd4\ufe0f',
      text: 'From Ladakh to the edge of the Universe! Now try this: look at the night sky tonight and write a poem or story about it. Thank you for exploring with me!' }
  ];

  // Short info cards for things you can tap
  Cn.INFO = {
    dome: { tag: 'Tap discovery', title: 'Indian Astronomical Observatory', text: 'The Himalayan Chandra Telescope lives in this dome at Hanle, about 4,500 metres high. Hanle is also India\u2019s first Dark Sky Reserve, kept dark on purpose to protect the stars.' },
    moon: { title: 'The Moon', text: 'Earth\u2019s natural satellite. It has no light of its own \u2014 it reflects sunlight.' },
    mercury: { title: 'Mercury', text: 'A planet. It shines steadily because it reflects sunlight \u2014 it does not twinkle like a star.' },
    venus: { title: 'Venus \u2014 the Evening Star', text: 'The brightest planet in our sky. It looks like a steady star at dusk or dawn, but it is a planet!' },
    mars: { title: 'Mars \u2014 the Red Planet', text: 'See its reddish glow? It is a planet, shining by reflected sunlight.' },
    jupiter: { title: 'Jupiter', text: 'The biggest planet, shining steadily without twinkling.' },
    saturn: { title: 'Saturn', text: 'A planet with beautiful rings. To the eye it looks like a steady yellowish star.' }
  };
})(window.Sky = window.Sky || {});
