window.G = window.G || {};

G.KNOWLEDGE = [
  {
    id: 'earth.overview', topic: 'Earth as a planet', planet: 'earth', grade: '4-5', difficulty: 1,
    keywords: ['earth', 'home', 'planet', 'world', 'blue', 'ocean', 'life'],
    aliases: ['earth', 'our planet', 'home planet', 'the earth', 'world'],
    summary: 'Earth is the third planet from the Sun and the only known world with life.',
    child: 'Earth is our home planet. It has liquid water oceans, a breathable atmosphere, and the right temperature for life. From space it looks blue because of its oceans.',
    misconception: 'Earth is the biggest planet.',
    related: ['earth.atmosphere', 'earth.gravity', 'moon.overview'],
    sources: ['NASA Science — Solar System Facts', 'Wikipedia — Earth']
  },
  {
    id: 'earth.atmosphere', topic: "Earth's atmosphere", planet: 'earth', grade: '4-5', difficulty: 1,
    keywords: ['atmosphere', 'air', 'oxygen', 'breath', 'sky', 'gases', 'layer'],
    aliases: ['atmosphere', 'the air', 'earth air', 'sky'],
    summary: 'The atmosphere is the layer of gases surrounding Earth.',
    child: "An atmosphere is the layer of gases around a world. Earth's atmosphere gives us air to breathe, blocks harmful sunlight, and keeps the planet warm enough for life.",
    misconception: 'The sky is empty space.',
    related: ['earth.overview', 'venus.atmosphere', 'mars.atmosphere'],
    sources: ['NASA Science — Atmosphere', 'Wikipedia — Atmosphere of Earth']
  },
  {
    id: 'earth.gravity', topic: 'Gravity on Earth', planet: 'earth', grade: '4-5', difficulty: 1,
    keywords: ['gravity', 'fall', 'down', 'pull', 'weight', 'heavy'],
    aliases: ['gravity', 'why do things fall', 'fall down', 'weight'],
    summary: 'Gravity is the force that pulls objects toward Earth.',
    child: "Gravity is an invisible pull. Earth's gravity pulls everything toward its centre, which is why things fall down when you drop them. Bigger worlds pull harder.",
    misconception: 'There is no gravity in space.',
    related: ['moon.gravity', 'gravity.concept', 'jupiter.gravity'],
    sources: ['NASA Science — Gravity', 'Wikipedia — Gravity']
  },
  {
    id: 'gravity.concept', topic: 'What gravity is', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['gravity', 'force', 'pull', 'mass', 'attract'],
    aliases: ['gravity', 'what is gravity', 'gravitational force'],
    summary: 'Gravity is a pulling force between objects that have mass.',
    child: 'Every object with mass pulls on every other object. Big things like planets pull much harder than small things like people. That is why we are pulled toward Earth and not toward our toys.',
    misconception: 'Gravity only exists on Earth.',
    related: ['earth.gravity', 'moon.gravity', 'orbit.concept'],
    sources: ['NASA Science — Gravity', 'Wikipedia — Gravity']
  },
  {
    id: 'moon.overview', topic: 'The Moon', planet: 'moon', grade: '4-5', difficulty: 1,
    keywords: ['moon', 'lunar', 'night', 'follow', 'satellite', 'natural'],
    aliases: ['moon', 'the moon', 'luna', 'earth moon'],
    summary: "The Moon is Earth's natural satellite, orbiting us about once a month.",
    child: 'The Moon is a rocky world that travels around Earth. It does not make its own light — we see it because sunlight bounces off it. It is about 384,400 km away, but our game uses a compressed scale.',
    misconception: 'The Moon makes its own light.',
    related: ['moon.phases', 'moon.craters', 'moon.gravity', 'apollo11'],
    sources: ['NASA Science — Moon', 'Wikipedia — Moon']
  },
  {
    id: 'moon.phases', topic: 'Moon phases', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['phase', 'phases', 'crescent', 'full moon', 'half moon', 'shape', 'change'],
    aliases: ['moon phases', 'phases of the moon', 'why does the moon change shape', 'full moon', 'crescent'],
    summary: 'The Moon seems to change shape because of how sunlight hits it as it orbits Earth.',
    child: 'The Moon looks different each night because we see different amounts of its sunlit side. When the whole face is lit we see a full Moon. When only a sliver is lit we see a crescent. The Moon itself never really changes shape.',
    misconception: 'The Moon changes shape, or the shadow of Earth causes every phase.',
    related: ['moon.overview', 'moon.maria', 'sun.overview'],
    sources: ['NASA Science — Moon Phases', 'Wikipedia — Lunar phase']
  },
  {
    id: 'moon.craters', topic: 'Moon craters', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['crater', 'craters', 'hole', 'impact', 'meteor', 'hit', 'round'],
    aliases: ['crater', 'craters', 'moon holes', 'why does the moon have holes'],
    summary: 'Craters are round dents made when space rocks crash into the Moon.',
    child: 'A crater forms when a meteoroid — a rock from space — slams into the surface at enormous speed. The crash throws up a rim of material, leaving a round bowl shape. The Moon has no wind or rain, so craters stay for billions of years.',
    misconception: 'Craters are volcanoes or holes dug by aliens.',
    related: ['moon.overview', 'impact.concept', 'apollo11'],
    sources: ['NASA Science — Moon Craters', 'Wikipedia — Impact crater']
  },
  {
    id: 'impact.concept', topic: 'Impacts and meteoroids', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['meteoroid', 'meteor', 'meteorite', 'asteroid', 'impact', 'crash', 'rock space'],
    aliases: ['meteoroid', 'meteor', 'meteorite', 'asteroid', 'shooting star', 'space rock'],
    summary: 'Meteoroids are small rocks in space; when they hit a surface they make craters.',
    child: 'Space is full of rocks of different sizes. A meteoroid is a small rock travelling through space. If it burns up in the air we call it a meteor or shooting star. If it reaches the ground it is a meteorite. Big impacts make craters.',
    misconception: 'Shooting stars are actual stars falling.',
    related: ['moon.craters', 'asteroid.overview', 'comet.overview'],
    sources: ['NASA Science — Meteors', 'Wikipedia — Meteoroid']
  },
  {
    id: 'moon.gravity', topic: 'Gravity on the Moon', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['moon gravity', 'jump', 'float', 'weak', 'low gravity', 'bounce'],
    aliases: ['moon gravity', 'gravity on the moon', 'jump on the moon', 'why can astronauts jump high'],
    summary: "The Moon's gravity is about one sixth of Earth's, so you can jump much higher there.",
    child: 'The Moon is much smaller than Earth, so it pulls on you much more weakly. Astronauts could bounce along in giant leaps. That is also why they had to be careful not to jump so hard they could not come back down.',
    misconception: 'There is no gravity on the Moon.',
    related: ['moon.overview', 'gravity.concept', 'earth.gravity'],
    sources: ['NASA Science — Moon', 'Wikipedia — Gravitation of the Moon']
  },
  {
    id: 'moon.maria', topic: 'Maria — the dark plains', planet: 'moon', grade: '4-5', difficulty: 3,
    keywords: ['maria', 'mare', 'dark spots', 'dark patches', 'man in the moon', 'plains'],
    aliases: ['maria', 'mare', 'dark spots on the moon', 'man in the moon', 'dark patches'],
    summary: 'Maria are ancient lava plains that look like dark patches on the Moon.',
    child: "Long ago, giant impacts cracked the Moon's surface and lava flowed up to fill the basins. The cooled lava formed dark flat plains called maria, which is Latin for seas. Early astronomers thought they were real seas.",
    misconception: 'The dark patches are oceans or seas.',
    related: ['moon.overview', 'moon.craters'],
    sources: ['NASA Science — Moon', 'Wikipedia — Lunar mare']
  },
  {
    id: 'apollo11', topic: 'Apollo 11', planet: 'moon', grade: '4-5', difficulty: 1,
    keywords: ['apollo', 'apollo 11', 'armstrong', 'aldrin', 'collins', '1969', 'first man', 'moon landing', 'eagle'],
    aliases: ['apollo 11', 'apollo', 'moon landing', 'neil armstrong', 'first man on the moon', '1969'],
    summary: 'Apollo 11 was the 1969 mission that first landed humans on the Moon.',
    child: "On 20 July 1969, NASA's Apollo 11 mission landed astronauts Neil Armstrong and Buzz Aldrin on the Moon while Michael Collins orbited above. Armstrong was the first person to walk on the lunar surface. The astronauts collected rocks and soil that scientists still study today.",
    misconception: 'The Moon landing was filmed in a studio.',
    related: ['moon.overview', 'astronaut.role', 'sample.science', 'chandrayaan3'],
    sources: ['NASA — Apollo 11 Mission', 'Wikipedia — Apollo 11']
  },
  {
    id: 'chandrayaan1', topic: 'Chandrayaan-1', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['chandrayaan 1', 'chandrayaan-1', 'india moon', 'indian moon mission', 'isro moon'],
    aliases: ['chandrayaan 1', 'chandrayaan-1', 'chandrayaan one', 'india first moon mission'],
    summary: "Chandrayaan-1 was India's first Moon mission, launched by ISRO in 2008.",
    child: "Chandrayaan-1 was India's first spacecraft to travel to the Moon. Launched by ISRO in 2008, it orbited the Moon and mapped its surface. It found evidence of water molecules on the lunar surface — a very important discovery.",
    misconception: 'Chandrayaan-1 landed on the Moon.',
    related: ['chandrayaan2', 'chandrayaan3', 'isro.overview', 'orbiter.role'],
    sources: ['ISRO — Chandrayaan-1', 'Wikipedia — Chandrayaan-1']
  },
  {
    id: 'chandrayaan2', topic: 'Chandrayaan-2', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['chandrayaan 2', 'chandrayaan-2', 'vikram', 'india orbiter lander'],
    aliases: ['chandrayaan 2', 'chandrayaan-2', 'chandrayaan two', 'vikram lander'],
    summary: 'Chandrayaan-2 (2019) sent an orbiter, a lander and a rover toward the Moon.',
    child: 'Chandrayaan-2 was ISRO\'s second Moon mission, launched in 2019. It carried an orbiter, the Vikram lander and the Pragyan rover. The orbiter still works today and studies the Moon from above. The lander\'s landing did not go as planned, but the mission taught scientists a great deal.',
    misconception: 'Chandrayaan-2 was a complete failure.',
    related: ['chandrayaan1', 'chandrayaan3', 'lander.role', 'rover.role'],
    sources: ['ISRO — Chandrayaan-2', 'Wikipedia — Chandrayaan-2']
  },
  {
    id: 'chandrayaan3', topic: 'Chandrayaan-3', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['chandrayaan 3', 'chandrayaan-3', 'vikram', 'pragyan', 'south pole', 'landing', 'india landing'],
    aliases: ['chandrayaan 3', 'chandrayaan-3', 'chandrayaan three', 'pragyan rover', 'lunar south pole'],
    summary: "Chandrayaan-3 (2023) made India the first country to land near the Moon's south pole.",
    child: "Chandrayaan-3 was ISRO's third Moon mission. In August 2023 its Vikram lander touched down safely near the Moon's south pole, making India the first nation to land there. The Pragyan rover then drove on the surface, studying the soil and temperature.",
    misconception: 'Chandrayaan-3 was India\'s first Moon mission.',
    related: ['chandrayaan1', 'chandrayaan2', 'lander.role', 'rover.role', 'apollo11'],
    sources: ['ISRO — Chandrayaan-3', 'Wikipedia — Chandrayaan-3']
  },
  {
    id: 'isro.overview', topic: "ISRO — India's space agency", planet: null, grade: '4-5', difficulty: 1,
    keywords: ['isro', 'india space', 'indian space', 'space agency india', 'indian space agency'],
    aliases: ['isro', 'indian space research organisation', 'indian space research organization', 'india space agency'],
    summary: "ISRO is the Indian Space Research Organisation, India's space agency.",
    child: "ISRO is India's space agency. It builds rockets and satellites and runs missions to the Moon, Mars and the Sun. Its missions include Chandrayaan, the Mars Orbiter Mission and Aditya-L1.",
    misconception: 'Only America and Russia have space programmes.',
    related: ['chandrayaan1', 'chandrayaan3', 'nasa.overview'],
    sources: ['ISRO — Official', 'Wikipedia — ISRO']
  },
  {
    id: 'nasa.overview', topic: 'NASA', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['nasa', 'space agency', 'american space', 'space programme'],
    aliases: ['nasa', 'space agency', 'space program'],
    summary: 'NASA is the United States space agency, exploring space since 1958.',
    child: 'NASA is the National Aeronautics and Space Administration, the space agency of the United States. It sent astronauts to the Moon with Apollo, built the Space Shuttle, and runs rovers on Mars and telescopes in space.',
    misconception: 'NASA is the only space agency in the world.',
    related: ['apollo11', 'isro.overview', 'mars.rovers'],
    sources: ['NASA — Official', 'Wikipedia — NASA']
  },
  {
    id: 'orbiter.role', topic: 'What an orbiter does', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['orbiter', 'orbit', 'circle', 'around', 'map', 'satellite around'],
    aliases: ['orbiter', 'what is an orbiter', 'orbit around', 'orbits'],
    summary: 'An orbiter is a spacecraft that circles a planet or moon to study it.',
    child: 'An orbiter is a spacecraft that travels around a planet or moon without landing. It takes pictures, maps the surface, and measures the atmosphere from above. Both Chandrayaan missions used orbiters to study the Moon.',
    misconception: 'An orbiter is the same as a rocket.',
    related: ['lander.role', 'rover.role', 'chandrayaan1', 'satellite.overview'],
    sources: ['NASA Science — Orbiters', 'Wikipedia — Orbiter']
  },
  {
    id: 'lander.role', topic: 'What a lander does', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['lander', 'landing', 'touch down', 'soft landing', 'surface'],
    aliases: ['lander', 'what is a lander', 'land on', 'landing on the moon'],
    summary: 'A lander is a spacecraft built to land gently on a surface.',
    child: 'A lander is a spacecraft designed to touch down softly on a planet or moon. Landing is very difficult because there is no road and no brakes — the lander must slow itself down perfectly. The Vikram lander of Chandrayaan-3 landed near the Moon\'s south pole.',
    misconception: 'Landing on the Moon is easy because there is no air.',
    related: ['orbiter.role', 'rover.role', 'chandrayaan3'],
    sources: ['ISRO — Chandrayaan-3', 'Wikipedia — Lander']
  },
  {
    id: 'rover.role', topic: 'What a rover does', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['rover', 'drive', 'wheels', 'pragyan', 'explore surface', 'robot car'],
    aliases: ['rover', 'what is a rover', 'moon car', 'mars rover', 'pragyan'],
    summary: 'A rover is a robot car that drives on the surface of another world.',
    child: 'A rover is a robotic vehicle with wheels that drives across the surface of a planet or moon. It carries cameras and instruments to study rocks and soil up close. NASA rovers Spirit and Opportunity explored Mars, and Pragyan explored the Moon for ISRO.',
    misconception: 'Rovers are driven by remote control like toys.',
    related: ['lander.role', 'orbiter.role', 'mars.rovers', 'sample.science'],
    sources: ['NASA — Mars Exploration Rovers', 'ISRO — Pragyan']
  },
  {
    id: 'satellite.overview', topic: 'Satellites', planet: 'earth', grade: '4-5', difficulty: 1,
    keywords: ['satellite', 'satellites', 'gps', 'weather satellite', 'communication', 'orbit earth'],
    aliases: ['satellite', 'satellites', 'what is a satellite', 'artificial satellite'],
    summary: 'A satellite is an object that orbits a planet — natural or human-made.',
    child: 'A satellite is anything that travels around a planet. The Moon is Earth\'s natural satellite. Human-made satellites orbit Earth to give us phone signals, weather forecasts, GPS navigation and TV. They fall around Earth continuously, which is why they stay up.',
    misconception: 'Satellites stay in space because there is no gravity there.',
    related: ['orbiter.role', 'earth.overview', 'communication.concept'],
    sources: ['NASA Science — Satellites', 'Wikipedia — Satellite']
  },
  {
    id: 'telescope.role', topic: 'Telescopes', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['telescope', 'telescopes', 'look far', 'stars', 'observe', 'lens', 'mirror'],
    aliases: ['telescope', 'telescopes', 'what is a telescope', 'space telescope', 'hubble'],
    summary: 'A telescope collects light to make faraway things look closer and brighter.',
    child: 'A telescope is a tool that gathers light so we can see distant objects more clearly. Optical telescopes use lenses or mirrors for stars and planets. Space telescopes like Hubble orbit above Earth\'s blurry atmosphere to take incredibly sharp pictures of deep space.',
    misconception: 'Telescopes are only for looking at planets.',
    related: ['star.overview', 'exoplanet.concept', 'deep.space'],
    sources: ['NASA Science — Telescopes', 'Wikipedia — Telescope']
  },
  {
    id: 'mars.overview', topic: 'Mars', planet: 'mars', grade: '4-5', difficulty: 1,
    keywords: ['mars', 'red planet', 'red', 'fourth planet'],
    aliases: ['mars', 'red planet', 'the red planet'],
    summary: 'Mars is the fourth planet from the Sun, known for its rusty red colour.',
    child: 'Mars is called the Red Planet because its surface is full of iron minerals that have rusted, like an old bicycle left in the rain. It is cold, dry and dusty today, but scientists have found strong evidence that liquid water flowed there long ago.',
    misconception: 'Mars is red because it is hot and on fire.',
    related: ['mars.water', 'mars.rovers', 'mars.atmosphere', 'mars.color'],
    sources: ['NASA Science — Mars', 'Wikipedia — Mars']
  },
  {
    id: 'mars.color', topic: 'Why Mars looks red', planet: 'mars', grade: '4-5', difficulty: 1,
    keywords: ['mars red', 'red mars', 'rust', 'iron', 'colour', 'color', 'reddish', 'red'],
    aliases: ['why is mars red', 'why does mars look red', 'mars colour', 'mars color', 'red planet why'],
    summary: 'Mars looks red because iron in its rocks and dust has rusted.',
    child: 'Mars looks red because its rocks and dust contain iron. Over billions of years, that iron reacted with tiny amounts of water and oxygen to form rust — the same reddish stuff on an old nail. Wind spreads the rusty dust all over the planet.',
    misconception: 'Mars is covered in red paint or red sand only.',
    related: ['mars.overview', 'mars.water'],
    sources: ['NASA Science — Mars', 'Wikipedia — Mars']
  },
  {
    id: 'mars.water', topic: 'Water evidence on Mars', planet: 'mars', grade: '4-5', difficulty: 2,
    keywords: ['mars water', 'water on mars', 'river', 'rivers', 'ancient water', 'flowed', 'dry river', 'lake'],
    aliases: ['water on mars', 'did mars have water', 'mars rivers', 'ancient water mars', 'mars once had water'],
    summary: 'Mars has strong evidence that liquid water flowed on its surface long ago.',
    child: 'Scientists have found dried-up river valleys, lake beds and minerals that only form in water on Mars. This tells us that billions of years ago Mars was warmer and wetter, with rivers and maybe lakes. Studying these clues helps scientists ask whether Mars could once have supported life.',
    misconception: 'There are rivers flowing on Mars today.',
    related: ['mars.overview', 'mars.rovers', 'sample.science'],
    sources: ['NASA — Mars Exploration Program', 'Wikipedia — Water on Mars']
  },
  {
    id: 'mars.rovers', topic: 'Rovers on Mars', planet: 'mars', grade: '4-5', difficulty: 2,
    keywords: ['spirit', 'opportunity', 'curiosity', 'perseverance', 'rover mars', 'mars exploration rover'],
    aliases: ['spirit and opportunity', 'curiosity rover', 'perseverance', 'mars rovers', 'nasa rovers mars'],
    summary: 'NASA rovers Spirit, Opportunity, Curiosity and Perseverance have explored Mars.',
    child: 'NASA sent four wheeled robots to Mars. Spirit and Opportunity landed in 2004 and found evidence of ancient water. Curiosity and Perseverance study rocks and climate, and Perseverance is collecting samples for a future mission to bring home. They were designed to last months — some worked for years.',
    misconception: 'The rovers found living Martians.',
    related: ['rover.role', 'mars.water', 'sample.science'],
    sources: ['NASA — Mars Exploration Rovers', 'Wikipedia — Mars rover']
  },
  {
    id: 'mars.atmosphere', topic: "Mars's atmosphere", planet: 'mars', grade: '4-5', difficulty: 2,
    keywords: ['mars atmosphere', 'carbon dioxide', 'thin air', 'mars air', 'dust storm'],
    aliases: ['mars atmosphere', 'air on mars', 'mars air', 'can we breathe on mars'],
    summary: 'Mars has a very thin atmosphere made mostly of carbon dioxide.',
    child: 'Mars has an atmosphere, but it is about 100 times thinner than Earth\'s and is mostly carbon dioxide — the gas we breathe out. Humans could not breathe it. The thin air means little heat is trapped, so Mars is cold, and dust storms can sometimes cover the whole planet.',
    misconception: 'Mars has the same air as Earth.',
    related: ['mars.overview', 'earth.atmosphere', 'venus.atmosphere'],
    sources: ['NASA Science — Mars', 'Wikipedia — Atmosphere of Mars']
  },
  {
    id: 'venus.atmosphere', topic: "Venus's atmosphere and the greenhouse effect", planet: 'venus', grade: '4-5', difficulty: 2,
    keywords: ['venus', 'greenhouse', 'hot planet', 'hottest', 'acid clouds', 'venus atmosphere'],
    aliases: ['venus', 'why is venus so hot', 'greenhouse effect', 'hottest planet'],
    summary: 'Venus is the hottest planet because its thick atmosphere traps heat.',
    child: 'Venus is wrapped in a thick blanket of carbon dioxide clouds. Sunlight gets in, but the heat cannot escape — like a greenhouse or a car parked in the sun. This runaway greenhouse effect makes Venus hotter than Mercury, even though Mercury is closer to the Sun.',
    misconception: 'Venus is hot because it is closest to the Sun.',
    related: ['earth.atmosphere', 'mars.atmosphere', 'mercury.overview'],
    sources: ['NASA Science — Venus', 'Wikipedia — Venus']
  },
  {
    id: 'mercury.overview', topic: 'Mercury', planet: 'mercury', grade: '4-5', difficulty: 1,
    keywords: ['mercury', 'closest planet', 'small planet', 'fast planet', 'first planet'],
    aliases: ['mercury', 'closest planet to the sun', 'smallest planet'],
    summary: 'Mercury is the smallest planet and the closest to the Sun.',
    child: 'Mercury is a small rocky world zooming around the Sun faster than any other planet — its year is only 88 days. With almost no atmosphere, its surface bakes in sunlight and freezes in shadow, giving it the biggest temperature swings of any planet.',
    misconception: 'Mercury is the hottest planet.',
    related: ['venus.atmosphere', 'sun.overview', 'orbit.concept'],
    sources: ['NASA Science — Mercury', 'Wikipedia — Mercury']
  },
  {
    id: 'jupiter.overview', topic: 'Jupiter', planet: 'jupiter', grade: '4-5', difficulty: 1,
    keywords: ['jupiter', 'largest planet', 'biggest planet', 'gas giant', 'great red spot', 'largest', 'biggest'],
    aliases: ['jupiter', 'largest planet', 'biggest planet', 'great red spot', 'largest planet in the solar system', 'largest', 'biggest'],
    summary: 'Jupiter is the largest planet — a gas giant with a giant storm.',
    child: 'Jupiter is so big that all the other planets could fit inside it. It is a gas giant, made mostly of hydrogen and helium, with no solid surface to stand on. Its Great Red Spot is a storm larger than Earth that has been raging for hundreds of years.',
    misconception: 'You could land a rover on Jupiter.',
    related: ['jupiter.gravity', 'gas.giant.concept', 'saturn.overview'],
    sources: ['NASA Science — Jupiter', 'Wikipedia — Jupiter']
  },
  {
    id: 'jupiter.gravity', topic: "Jupiter's gravity", planet: 'jupiter', grade: '4-5', difficulty: 2,
    keywords: ['jupiter gravity', 'heavy', 'strong gravity', 'crush', 'weight jupiter'],
    aliases: ['jupiter gravity', 'gravity on jupiter', 'how heavy on jupiter'],
    summary: "Jupiter's gravity is about 2.5 times Earth's — you would feel very heavy there.",
    child: 'Because Jupiter is so massive, its gravity is much stronger than Earth\'s. If you could stand on Jupiter (you cannot — it has no solid surface), you would weigh about two and a half times more. A 30 kg student would feel like 75 kg!',
    misconception: 'Jupiter has no gravity because it is made of gas.',
    related: ['jupiter.overview', 'gravity.concept', 'gas.giant.concept'],
    sources: ['NASA Science — Jupiter', 'Wikipedia — Jupiter']
  },
  {
    id: 'gas.giant.concept', topic: 'Gas giants and ice giants', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['gas giant', 'ice giant', 'hydrogen', 'helium', 'no solid surface', 'rocky planet', 'terrestrial'],
    aliases: ['gas giant', 'ice giant', 'what is a gas giant', 'rocky planets', 'terrestrial planets', 'types of planets'],
    summary: 'Planets come in two main families: rocky worlds and giant worlds.',
    child: 'The Solar System has two main planet families. Rocky planets — Mercury, Venus, Earth and Mars — are small with solid surfaces. Giant planets — Jupiter and Saturn (gas giants) and Uranus and Neptune (ice giants) — are huge balls of gas and liquid with no solid ground to stand on.',
    misconception: 'All planets have a solid surface.',
    related: ['jupiter.overview', 'saturn.overview', 'uranus.overview', 'mars.overview'],
    sources: ['NASA Science — Planets', 'Wikipedia — Planet']
  },
  {
    id: 'saturn.overview', topic: 'Saturn and its rings', planet: 'saturn', grade: '4-5', difficulty: 1,
    keywords: ['saturn', 'rings', 'ringed planet', 'sixth planet'],
    aliases: ['saturn', 'saturn rings', 'planet with rings', 'rings of saturn'],
    summary: 'Saturn is a gas giant famous for its spectacular rings of ice and rock.',
    child: 'Saturn\'s rings are made of countless chunks of ice and rock, from tiny grains to house-sized boulders, all orbiting the planet. The rings are enormous — wide enough to fit dozens of Earths — yet they can be only about ten metres thick in places.',
    misconception: "Saturn's rings are solid discs.",
    related: ['gas.giant.concept', 'jupiter.overview', 'saturn.moons'],
    sources: ['NASA Science — Saturn', 'Wikipedia — Saturn']
  },
  {
    id: 'saturn.moons', topic: "Saturn's moons", planet: 'saturn', grade: '4-5', difficulty: 2,
    keywords: ['titan', 'enceladus', 'saturn moons', 'moons of saturn', 'moon'],
    aliases: ['titan', 'enceladus', 'saturn moons', 'how many moons does saturn have'],
    summary: 'Saturn has many moons, including Titan with its thick atmosphere.',
    child: 'Saturn has dozens of moons. The biggest, Titan, is larger than the planet Mercury and has a thick atmosphere and lakes of liquid methane. Enceladus sprays geysers of water ice from an underground ocean — a place scientists study in the search for life.',
    misconception: 'Only Earth and the Moon exist in the outer Solar System.',
    related: ['saturn.overview', 'moon.overview', 'uranus.overview'],
    sources: ['NASA Science — Saturn Moons', 'Wikipedia — Moons of Saturn']
  },
  {
    id: 'uranus.overview', topic: 'Uranus', planet: 'uranus', grade: '4-5', difficulty: 2,
    keywords: ['uranus', 'tilted', 'sideways', 'ice giant', 'seventh planet'],
    aliases: ['uranus', 'tilted planet', 'planet that spins on its side'],
    summary: 'Uranus is an ice giant that spins on its side.',
    child: 'Uranus rolls around the Sun like a ball instead of spinning like a top. Scientists think a giant collision long ago knocked it over, so its axis is tilted about 98 degrees. It is an ice giant — a cold world of water, ammonia and methane ices around a rocky core.',
    misconception: 'Uranus is a gas giant like Jupiter.',
    related: ['gas.giant.concept', 'neptune.overview', 'saturn.overview'],
    sources: ['NASA Science — Uranus', 'Wikipedia — Uranus']
  },
  {
    id: 'neptune.overview', topic: 'Neptune', planet: 'neptune', grade: '4-5', difficulty: 2,
    keywords: ['neptune', 'winds', 'fastest winds', 'eighth planet', 'voyager', 'farthest planet'],
    aliases: ['neptune', 'farthest planet', 'windiest planet', 'voyager 2'],
    summary: 'Neptune is the most distant planet, with the fastest winds known.',
    child: 'Neptune is an ice giant so far from the Sun that it takes 165 years to orbit once. Despite being so cold and distant, it has supersonic winds faster than 2,000 km/h — the fastest in the Solar System. Only one spacecraft, Voyager 2, has visited it, in 1989.',
    misconception: 'Neptune is a quiet, calm planet.',
    related: ['uranus.overview', 'gas.giant.concept', 'voyager.missions'],
    sources: ['NASA Science — Neptune', 'Wikipedia — Neptune']
  },
  {
    id: 'pluto.dwarf', topic: 'Pluto and dwarf planets', planet: 'pluto', grade: '4-5', difficulty: 2,
    keywords: ['pluto', 'dwarf planet', 'dwarf planets', 'kuiper belt', 'demoted', 'not a planet'],
    aliases: ['pluto', 'dwarf planet', 'why is pluto not a planet', 'kuiper belt', 'ceres', 'haumea', 'makemake', 'eris'],
    summary: 'Pluto is a dwarf planet — one of five officially recognised by scientists.',
    child: 'In 2006 scientists agreed on a clearer definition of a planet. Pluto is small, icy, and shares its orbital neighbourhood with many similar Kuiper Belt objects, so it was reclassified as a dwarf planet. The five officially recognised dwarf planets are Ceres, Pluto, Haumea, Makemake and Eris. Being a dwarf planet is still something to celebrate!',
    misconception: 'Pluto was destroyed or kicked out of the Solar System.',
    related: ['ceres.overview', 'asteroid.overview', 'kuiper.belt'],
    sources: ['NASA Science — Dwarf Planets', 'Wikipedia — Dwarf planet']
  },
  {
    id: 'ceres.overview', topic: 'Ceres', planet: 'ceres', grade: '4-5', difficulty: 2,
    keywords: ['ceres', 'asteroid belt', 'largest asteroid', 'dwarf planet belt'],
    aliases: ['ceres', 'largest asteroid', 'dwarf planet in the asteroid belt'],
    summary: 'Ceres is the largest object in the asteroid belt and a dwarf planet.',
    child: 'Ceres is a round, icy rocky world about a quarter of the width of the Moon, orbiting in the asteroid belt between Mars and Jupiter. It is the only dwarf planet in the inner Solar System and may hold a salty underground ocean.',
    misconception: 'The asteroid belt is a crowded wall of rocks.',
    related: ['pluto.dwarf', 'asteroid.overview', 'mars.overview'],
    sources: ['NASA Science — Ceres', 'Wikipedia — Ceres']
  },
  {
    id: 'asteroid.overview', topic: 'Asteroids and the asteroid belt', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['asteroid', 'asteroids', 'asteroid belt', 'space rocks', 'between mars and jupiter'],
    aliases: ['asteroid', 'asteroids', 'asteroid belt', 'belt of asteroids', 'what is an asteroid'],
    summary: 'Asteroids are rocky leftovers from the formation of the Solar System.',
    child: 'Asteroids are chunks of rock and metal left over from when the planets formed, most orbiting in a belt between Mars and Jupiter. They range from pebbles to dwarf-planet-sized Ceres. Despite what films show, the belt is mostly empty space — spacecraft fly through it easily.',
    misconception: 'The asteroid belt is a dense field of crashing rocks.',
    related: ['ceres.overview', 'impact.concept', 'comet.overview'],
    sources: ['NASA Science — Asteroids', 'Wikipedia — Asteroid']
  },
  {
    id: 'comet.overview', topic: 'Comets', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['comet', 'comets', 'tail', 'icy', 'snowball', 'halley'],
    aliases: ['comet', 'comets', 'what is a comet', 'shooting star comet', 'halley comet'],
    summary: 'Comets are icy bodies that grow glowing tails near the Sun.',
    child: 'Comets are dirty snowballs of ice, dust and rock from the outer Solar System. When one nears the Sun, its ice turns directly into gas and forms a glowing coma and long tails that always point away from the Sun. Halley\'s Comet visits our skies about every 76 years.',
    misconception: 'Comet tails trail behind like a kite string.',
    related: ['asteroid.overview', 'sun.overview', 'kuiper.belt'],
    sources: ['NASA Science — Comets', 'Wikipedia — Comet']
  },
  {
    id: 'sun.overview', topic: 'The Sun', planet: 'sun', grade: '4-5', difficulty: 1,
    keywords: ['sun', 'star', 'solar', 'sunlight', 'sunlight', 'hot', 'yellow'],
    aliases: ['sun', 'the sun', 'our star', 'what is the sun'],
    summary: 'The Sun is a star — a giant ball of hot glowing gas at the centre of the Solar System.',
    child: 'The Sun is our closest star. It is a enormous ball of hot gas, mostly hydrogen, that produces energy by nuclear fusion in its core. That energy gives us light and heat. It holds 99.8% of all the mass in the Solar System, which is why everything orbits it.',
    misconception: 'The Sun is a planet made of fire.',
    related: ['star.overview', 'mercury.overview', 'solar.system'],
    sources: ['NASA Science — Sun', 'Wikipedia — Sun']
  },
  {
    id: 'star.overview', topic: 'Stars', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['star', 'stars', 'night sky', 'twinkle', 'suns', 'constellation'],
    aliases: ['star', 'stars', 'what is a star', 'why do stars twinkle', 'night sky'],
    summary: 'Stars are giant glowing balls of gas, like our Sun, scattered across space.',
    child: 'A star is a huge ball of hot gas that makes its own light through nuclear fusion. Our Sun is an average star. At night we see thousands of others as tiny points of light. They twinkle because their light passes through Earth\'s moving atmosphere.',
    misconception: 'Stars are tiny lights stuck on the sky.',
    related: ['sun.overview', 'solar.system', 'light.year'],
    sources: ['NASA Science — Stars', 'Wikipedia — Star']
  },
  {
    id: 'solar.system', topic: 'The Solar System', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['solar system', 'planets', 'eight planets', 'order', 'sun and planets'],
    aliases: ['solar system', 'the solar system', 'planets in order', 'eight planets', 'order of the planets'],
    summary: 'The Solar System is the Sun plus everything that orbits it.',
    child: 'Our Solar System is the Sun and everything held by its gravity: eight planets, dwarf planets, moons, asteroids and comets. In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. Pluto is a dwarf planet beyond Neptune.',
    misconception: 'There are nine planets.',
    related: ['sun.overview', 'pluto.dwarf', 'orbit.concept'],
    sources: ['NASA Science — Solar System', 'Wikipedia — Solar System']
  },
  {
    id: 'orbit.concept', topic: 'Orbits', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['orbit', 'orbits', 'revolve', 'around the sun', 'why planets orbit', 'falling around'],
    aliases: ['orbit', 'orbits', 'what is an orbit', 'why do planets orbit the sun', 'revolve around'],
    summary: 'An orbit is the curved path an object takes around another due to gravity.',
    child: 'An orbit is like continually falling toward something while moving sideways fast enough to keep missing it. Planets orbit the Sun because the Sun\'s gravity pulls them, while their sideways motion keeps them from falling straight in. Moons orbit planets the same way.',
    misconception: 'Planets stay in orbit because of magic or invisible strings.',
    related: ['gravity.concept', 'solar.system', 'satellite.overview'],
    sources: ['NASA Science — Orbits', 'Wikipedia — Orbit']
  },
  {
    id: 'rocket.overview', topic: 'Rockets and launch', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['rocket', 'rockets', 'launch', 'liftoff', 'blast off', 'spacecraft', 'spaceship'],
    aliases: ['rocket', 'rockets', 'how do rockets work', 'launch', 'spaceship', 'spacecraft', 'spaceship'],
    summary: 'Rockets push against their own exhaust to climb into space.',
    child: 'A rocket works by throwing hot gas out of its bottom very fast, which pushes the rocket up — the same way a balloon flies when you let it go without tying it. Rockets must carry their own oxygen because there is no air in space to burn fuel with.',
    misconception: 'Rockets push against the air to fly.',
    related: ['satellite.overview', 'astronaut.role', 'fuel.concept'],
    sources: ['NASA Science — Rockets', 'Wikipedia — Rocket']
  },
  {
    id: 'astronaut.role', topic: 'Astronauts', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['astronaut', 'astronauts', 'cosmonaut', 'taikonaut', 'people in space', 'crew'],
    aliases: ['astronaut', 'astronauts', 'what do astronauts do', 'people in space'],
    summary: 'Astronauts are trained people who live and work in space.',
    child: 'Astronauts are scientists and pilots trained to live and work in space. They run experiments, fix equipment, and explore places humans have never reached. On the Space Station they float in microgravity, exercise every day, and eat special space food.',
    misconception: 'Astronauts float in space because there is no gravity at all.',
    related: ['apollo11', 'rocket.overview', 'space.station'],
    sources: ['NASA — Astronauts', 'Wikipedia — Astronaut']
  },
  {
    id: 'space.station', topic: 'Space stations', planet: null, grade: '4-5', difficulty: 1,
    keywords: ['space station', 'iss', 'international space station', 'orbiting laboratory', 'live in space'],
    aliases: ['space station', 'iss', 'international space station', 'space stations'],
    summary: 'A space station is an orbiting laboratory where astronauts live for months.',
    child: 'A space station is a large spacecraft that stays in orbit for years. The International Space Station (ISS) is a laboratory where astronauts from many countries live and work, doing science that is impossible on Earth. It orbits Earth about every 90 minutes.',
    misconception: 'Space stations are only for astronauts to relax in.',
    related: ['astronaut.role', 'satellite.overview', 'orbit.concept'],
    sources: ['NASA — International Space Station', 'Wikipedia — Space station']
  },
  {
    id: 'sample.science', topic: 'Why scientists collect samples', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['sample', 'samples', 'rocks', 'soil', 'collect', 'evidence', 'study rocks', 'moon rocks'],
    aliases: ['sample', 'samples', 'moon rocks', 'why did astronauts collect rocks', 'collecting samples', 'evidence'],
    summary: 'Samples let scientists study materials from other worlds directly.',
    child: 'When astronauts or rovers collect rocks and soil, scientists can study them in laboratories with powerful instruments. Apollo Moon rocks taught us how the Moon formed, and Mars rover samples are searching for signs of ancient life. Evidence you can hold beats evidence you can only see.',
    misconception: 'One rock tells scientists everything about a planet.',
    related: ['apollo11', 'rover.role', 'mars.water', 'science.method'],
    sources: ['NASA — Apollo Samples', 'Wikipedia — Moon rock']
  },
  {
    id: 'science.method', topic: 'The scientific method', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['scientific method', 'hypothesis', 'experiment', 'observation', 'evidence', 'conclusion', 'scientist'],
    aliases: ['scientific method', 'how do scientists work', 'hypothesis', 'observation', 'evidence', 'conclusion'],
    summary: 'Scientists ask questions, gather evidence, and test ideas.',
    child: 'Science is a way of asking questions about the world. A scientist observes something, asks a question, forms a hypothesis — a smart guess — then tests it with experiments or more observations. The evidence decides whether the idea survives. You are doing real science every time you scan something in this game!',
    misconception: 'Science is a list of facts to memorise.',
    related: ['sample.science', 'mars.water', 'telescope.role'],
    sources: ['NASA Science — Scientific Method', 'Wikipedia — Scientific method']
  },
  {
    id: 'communication.concept', topic: 'Communication in space', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['communication', 'radio', 'signal', 'antenna', 'talk to earth', 'delay', 'message'],
    aliases: ['communication', 'radio', 'signal', 'antenna', 'how do we talk to spacecraft', 'space communication'],
    summary: 'Spacecraft talk to Earth using radio signals through antennas.',
    child: 'Spacecraft send messages to Earth using radio waves, a kind of invisible light. Giant dish antennas on Earth listen for these signals. Because space is so vast, messages take time — a command to a Mars rover can take over 20 minutes to arrive!',
    misconception: 'Astronauts can phone home instantly from anywhere.',
    related: ['satellite.overview', 'astronaut.role', 'deep.space'],
    sources: ['NASA — Deep Space Network', 'Wikipedia — Radio']
  },
  {
    id: 'fuel.concept', topic: 'Fuel and power in space', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['fuel', 'power', 'energy', 'solar panel', 'battery', 'solar', 'electricity'],
    aliases: ['fuel', 'power', 'energy', 'solar panel', 'solar panels', 'battery', 'how do spacecraft get power'],
    summary: 'Spacecraft need fuel to move and electricity to run their instruments.',
    child: 'A spacecraft needs two kinds of energy. Fuel pushes it through space, like petrol in a car. Electricity runs its computers, lights and instruments, usually from solar panels that catch sunlight or from batteries. When the Sun is far away, solar power gets weak — that is why distant missions need special power sources.',
    misconception: 'Spacecraft plug into sockets in space.',
    related: ['rocket.overview', 'satellite.overview', 'sun.overview'],
    sources: ['NASA Science — Power Systems', 'Wikipedia — Spacecraft propulsion']
  },
  {
    id: 'light.year', topic: 'Light-years and deep space', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['light year', 'light-year', 'lightyears', 'distance', 'far', 'deep space', 'milky way', 'galaxy'],
    aliases: ['light year', 'light-year', 'light years', 'how far is space', 'milky way', 'galaxy', 'deep space'],
    summary: 'A light-year is the distance light travels in one year — about 9.5 trillion km.',
    child: 'Space is so vast that kilometres become useless, so astronomers measure in light-years — the distance light travels in a year, about 9.5 trillion kilometres. The nearest star beyond the Sun is over 4 light-years away. Our Sun is one of hundreds of billions of stars in the Milky Way galaxy.',
    misconception: 'A light-year is a measure of time.',
    related: ['star.overview', 'telescope.role', 'exoplanet.concept'],
    sources: ['NASA Science — Light-year', 'Wikipedia — Light-year']
  },
  {
    id: 'exoplanet.concept', topic: 'Exoplanets', planet: null, grade: '4-5', difficulty: 3,
    keywords: ['exoplanet', 'exoplanets', 'alien planets', 'planets around other stars', 'other worlds'],
    aliases: ['exoplanet', 'exoplanets', 'planets around other stars', 'alien worlds', 'other solar systems'],
    summary: 'Exoplanets are planets orbiting stars other than our Sun.',
    child: 'An exoplanet is a planet circling another star. Thousands have been discovered by telescopes that watch for tiny dips in starlight as a planet passes in front. Some are rocky like Earth, some are gas giants, and a few orbit in the habitable zone where liquid water could exist.',
    misconception: 'We have visited exoplanets with spacecraft.',
    related: ['telescope.role', 'star.overview', 'light.year'],
    sources: ['NASA Science — Exoplanets', 'Wikipedia — Exoplanet']
  },
  {
    id: 'voyager.missions', topic: 'Voyager spacecraft', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['voyager', 'voyager 1', 'voyager 2', 'interstellar', 'golden record', 'farthest spacecraft'],
    aliases: ['voyager', 'voyager 1', 'voyager 2', 'farthest human made object'],
    summary: 'Voyager 1 and 2 are the most distant human-made objects, still talking to us.',
    child: 'NASA launched Voyager 1 and 2 in 1977 to tour the giant planets. They sent back stunning pictures of Jupiter, Saturn, Uranus and Neptune. Both are now in interstellar space — beyond the Sun\'s influence — over 20 billion km away, still whispering data back to Earth.',
    misconception: 'The Voyagers stopped working decades ago.',
    related: ['neptune.overview', 'saturn.overview', 'communication.concept'],
    sources: ['NASA — Voyager Mission', 'Wikipedia — Voyager program']
  },
  {
    id: 'kuiper.belt', topic: 'The Kuiper Belt', planet: null, grade: '4-5', difficulty: 3,
    keywords: ['kuiper belt', 'kuiper', 'beyond neptune', 'icy bodies', 'pluto region'],
    aliases: ['kuiper belt', 'what is the kuiper belt', 'beyond neptune'],
    summary: 'The Kuiper Belt is a ring of icy bodies beyond Neptune.',
    child: 'Beyond Neptune stretches the Kuiper Belt, a vast ring of icy worlds and dwarf planets left over from the Solar System\'s birth. Pluto is its most famous resident. NASA\'s New Horizons spacecraft flew past Pluto in 2015 and revealed mountains of water ice and heart-shaped plains.',
    misconception: 'The Solar System ends at Neptune.',
    related: ['pluto.dwarf', 'comet.overview', 'neptune.overview'],
    sources: ['NASA Science — Kuiper Belt', 'Wikipedia — Kuiper belt']
  },
  {
    id: 'deep.space', topic: 'Exploring without visiting', planet: null, grade: '4-5', difficulty: 2,
    keywords: ['deep space', 'observatory', 'telescope mission', 'without visiting', 'remote', 'spectral'],
    aliases: ['deep space', 'observatory', 'studying without visiting', 'remote sensing', 'spectroscopy'],
    summary: 'Scientists can learn about distant worlds using light and instruments, without visiting.',
    child: 'We cannot yet travel to other stars, but we do not need to visit something to learn about it. Telescopes collect its light, and spectroscopy — splitting light into a rainbow — reveals what an object is made of, how hot it is, and how it moves. Every colour is a clue.',
    misconception: 'If we have not visited a place, we know nothing about it.',
    related: ['telescope.role', 'exoplanet.concept', 'light.year'],
    sources: ['NASA Science — Observatories', 'Wikipedia — Spectroscopy']
  },
  {
    id: 'moon.following', topic: 'Why the Moon seems to follow you', planet: 'moon', grade: '4-5', difficulty: 2,
    keywords: ['following me', 'follow', 'follows me', 'travel with me', 'behind me'],
    aliases: ['why is the moon following me', 'moon follows me', 'moon travelling with me'],
    summary: 'The Moon only seems to follow you because it is very far away.',
    child: 'It is not following your spaceship! The Moon is orbiting Earth, and because it is so far away, it appears to move with you as your position changes — just like distant mountains seem to follow you from a car window. This is called parallax, and it is all about perspective.',
    misconception: 'The Moon chases spacecraft and cars.',
    related: ['moon.overview', 'orbit.concept'],
    sources: ['NASA Science — Moon', 'Wikipedia — Parallax']
  }
];
