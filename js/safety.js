window.G = window.G || {};

// Child-safety filter for everything typed or spoken to KORA and everything fetched live from the internet.
G.Safety = (function () {
  // Whole-word matches only, so words like "Uranus", "class" or "cockpit" are never flagged.
  // STRONG words are blocked everywhere, including live Wikipedia text shown to the player.
  const STRONG = [
    'fuck', 'fucks', 'fucked', 'fucker', 'fucking', 'fuckin', 'motherfucker', 'shit', 'shits', 'shitty', 'bullshit', 'bitch', 'bitches',
    'asshole', 'arsehole', 'pussy', 'cunt', 'twat', 'wanker', 'slut', 'whore', 'jerkoff',
    'porn', 'porno', 'pornography', 'pornographic', 'nudes', 'boobs', 'tits', 'titties', 'orgasm', 'masturbate', 'masturbation',
    'horny', 'hentai', 'xxx', 'nsfw', 'onlyfans', 'fetish', 'blowjob', 'handjob', 'rape', 'raped', 'rapist', 'molest', 'molested',
    'pedo', 'pedophile', 'paedophile', 'incest', 'stripper', 'prostitute', 'prostitution', 'hooker', 'kinky', 'bdsm', 'milf', 'dildo',
    'vibrator', 'erotic', 'erotica', 'sex toy', 'sexual intercourse', 'intercourse',
    'nigger', 'nigga', 'faggot', 'tranny', 'chink', 'spic', 'kike'
  ];
  // MILD words are only blocked in what the player types or says (they also appear in real science text, e.g. "carbon dating").
  const MILD = [
    'bastard', 'ass', 'arse', 'dick', 'dickhead', 'cock', 'cocks', 'prick', 'damn', 'goddamn', 'crap', 'piss', 'pissed', 'hoe',
    'douche', 'wtf', 'stfu', 'omfg', 'sex', 'sexy', 'sexual', 'sexually', 'nude', 'penis', 'vagina', 'erection', 'genitals',
    'breasts', 'condom', 'make out', 'hook up', 'fag', 'retard', 'retarded', 'kkk',
    'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'cannabis', 'lsd', 'ecstasy', 'mdma', 'stoned', 'vape', 'vaping', 'drunk',
    'beer', 'vodka', 'whiskey', 'cigarette', 'cigarettes', 'overdose',
    'suicide', 'suicidal', 'kill myself', 'kill yourself', 'kys', 'self harm', 'cut myself', 'murder', 'behead', 'torture',
    'school shooting', 'shoot up', 'make a bomb', 'build a bomb', 'make a gun', 'terrorist', 'terrorism', 'massacre',
    'gambling', 'casino', 'girlfriend', 'boyfriend', 'kiss me', 'marry me'
  ];
  const WORDS = STRONG.concat(MILD);
  // Phrases that suggest the child may be at risk get a caring reply instead of a joke.
  const CARE = /\b(suicid\w*|kill (my|him|her)self|kill myself|self ?harm|cut myself|want to die|hurt myself|being bullied|someone (is )?hurt(ing)? me|abuse[ds]?)\b/i;
  // Strong words that are also caught when spelled out with gaps ("f u c k", "s.h.i.t").
  const SPACED = ['fuck', 'shit', 'bitch', 'cunt', 'porn', 'nigger', 'nigga', 'pussy', 'dick', 'sex', 'nude', 'rape', 'slut', 'whore'];

  const esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  const build = function (list, f) { return new RegExp('\\b(' + list.map(function (w) { return esc(w).replace(/ /g, '\\s+'); }).join('|') + ')\\b', f); };
  const RE = build(WORDS, 'i'), RE_G = build(WORDS, 'gi'), RE_STRONG = build(STRONG, 'i');

  function normalize(t) {
    return String(t || '').toLowerCase()
      .replace(/[0@4]/g, function (c) { return c === '0' ? 'o' : 'a'; })
      .replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[5$]/g, 's').replace(/7/g, 't')
      .replace(/(\w)\1{2,}/g, '$1$1');
  }

  function unsafe(text) {
    if (!text) return false;
    const raw = String(text), n = normalize(raw);
    if (RE.test(raw) || RE.test(n) || RE.test(n.replace(/(\w)\1+/g, '$1')) || CARE.test(raw)) return true;
    // Letters separated by spaces or symbols: check the joined-up version against strong words only.
    if (/\b(\w[\s.\-_*+]){2,}\w\b/.test(n)) {
      const joined = n.replace(/\b(\w)[\s.\-_*+](?=\w\b)/g, '$1');
      if (SPACED.some(function (w) { return new RegExp('\\b' + w + '\\b').test(joined); })) return true;
    }
    return false;
  }

  function needsCare(text) { return CARE.test(String(text || '')); }

  // For live internet text: reject only clearly explicit content so real science articles still work.
  function unsafeContent() {
    for (let i = 0; i < arguments.length; i++) if (arguments[i] && RE_STRONG.test(String(arguments[i]))) return true;
    return false;
  }

  function clean(text) {
    return String(text || '').replace(RE_G, function (m) { return m.charAt(0) + m.slice(1).replace(/\S/g, '*'); });
  }

  const REDIRECT = [
    'Let\u2019s keep our comms space-friendly, Explorer! Ask me about planets, stars, rockets or astronauts.',
    'That is not something I can talk about on the ship\u2019s radio. How about this: did you know a day on Venus is longer than its year?',
    'Mission Control asks us to keep the channel clean. Try asking me about black holes, moons or the Mars rovers instead!',
    'Hmm, my sensors only handle space science. Ask me why Saturn has rings, or how rockets reach orbit!'
  ];
  let ri = 0;
  function redirect() { return REDIRECT[(ri++) % REDIRECT.length]; }
  const CARE_LINE = 'Explorer, that sounds really important. Please talk to a grown-up you trust right now \u2014 a parent, teacher or family member. You are not alone, and asking for help is the bravest thing an explorer can do.';

  return { unsafe: unsafe, unsafeContent: unsafeContent, needsCare: needsCare, clean: clean, redirect: redirect, careLine: CARE_LINE };
})();
