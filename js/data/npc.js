window.G = window.G || {};

G.NPCS = {
  npc_geologist: {
    id: 'npc_geologist',
    name: 'Dr. Amara Osei',
    role: 'Lunar Geologist',
    icon: G.Icon('person'),
    location: 'selene_junction',
    greeting: "Welcome to Selene Junction, explorer! I study Moon rocks for a living. It is like being a detective, except the clues are billions of years old.",
    dialogue: [
      {
        id: 'crater_q',
        prompt: "You found a crater with a raised rim. What do you think made it?",
        options: [
          { text: 'Wind blowing for a long time', correct: false, response: "Wind does shape deserts on Earth, but the Moon has no air at all — so no wind. Think about what can hit a world with no atmosphere to stop it." },
          { text: 'An impact from a space rock', correct: true, response: "Exactly! A meteoroid slammed into the surface at enormous speed, throwing up that raised rim. You are thinking like a planetary scientist." },
          { text: 'A tree falling over', correct: false, response: "A tree? On the Moon? There is no air, no water and no life there — so no trees. Think bigger. Much bigger. And rockier." },
          { text: 'Heavy rain', correct: false, response: "Rain needs an atmosphere and clouds. The Moon has neither. What hits a world that has nothing to protect it?" }
        ]
      },
      {
        id: 'gravity_q',
        prompt: "Quick one: why do astronauts bounce so much on the Moon?",
        options: [
          { text: 'The Moon has weaker gravity', correct: true, response: "Correct! The Moon is smaller than Earth, so its gravity is about one sixth as strong. Same astronaut, much bigger bounce." },
          { text: 'The Moon has stronger gravity', correct: false, response: "Actually the opposite is true — the Moon is smaller, so it pulls more weakly. That is why astronauts could leap around like kangaroos." },
          { text: 'Their suits are springy', correct: false, response: "The suits are bulky, not springy. The real reason is a property of the Moon itself — how strongly it pulls." },
          { text: 'There is no gravity on the Moon', correct: false, response: "There IS gravity on the Moon — just much less than on Earth. If there were none at all, the astronauts would have floated away!" }
        ]
      }
    ]
  },
  npc_comms: {
    id: 'npc_comms',
    name: 'Ravi Chandran',
    role: 'Communications Specialist',
    icon: G.Icon('person'),
    location: 'ares_relay',
    greeting: "Explorer! Perfect timing. I was just aligning the big dish antenna. Do you know how we talk to spacecraft across all that distance? It is all about radio signals and patience.",
    dialogue: [
      {
        id: 'signal_q',
        prompt: "How do we send messages to a rover on Mars?",
        options: [
          { text: 'By shouting very loudly', correct: false, response: "Sound needs air to travel, and space is a vacuum. We use something that does not need air at all — a kind of invisible light." },
          { text: 'With radio waves through antennas', correct: true, response: "Exactly! Radio waves are a kind of light that can cross space. Giant dish antennas on Earth listen and talk to the spacecraft." },
          { text: 'By sending letters on rockets', correct: false, response: "A letter to Mars would take months and cost more than your entire school. We use something much faster — it travels at the speed of light." },
          { text: 'With satellites that carry messages like postmen', correct: false, response: "Satellites help on Earth, but for Mars we beam signals directly across space using radio waves and giant dish antennas." }
        ]
      },
      {
        id: 'delay_q',
        prompt: "Why does a message to Mars take minutes to arrive?",
        options: [
          { text: 'The computers are slow', correct: false, response: "Our computers are blazing fast. The delay is because of something much bigger — the sheer distance the signal must cross." },
          { text: 'Space is so vast that even light time is minutes', correct: true, response: "Right! Light is the fastest thing there is, and Mars is so far away that its light — carrying our radio signal — takes over 20 minutes to arrive." },
          { text: 'The signal gets lost and has to be resent', correct: false, response: "The signal does not get lost — it simply has an enormous distance to cross, even at the speed of light." },
          { text: 'Aliens hold it up sometimes', correct: false, response: "I appreciate the creativity, but the delay is simply physics: vast distance divided by the speed of light." }
        ]
      }
    ]
  }
};
