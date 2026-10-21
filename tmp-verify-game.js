// Temporary harness: verifies "explore everything first, quizzes at the end of each world".
'use strict';
const fs = require('fs');

function mkEl(tag) {
  const e = {
    tagName: tag, _text: '', _html: '', children: [], childElementCount: 0, offsetWidth: 0,
    dataset: {}, style: {}, className: '',
    classList: {
      _s: {},
      add(c) { this._s[c] = 1; },
      remove(c) { delete this._s[c]; },
      toggle(c, on) { if (on === undefined) on = !this._s[c]; if (on) this._s[c] = 1; else delete this._s[c]; return on; },
      contains(c) { return !!this._s[c]; }
    },
    appendChild(c) { this.children.push(c); e.childElementCount = e.children.length; return c; },
    addEventListener() {}, remove() {},
    querySelector() { return mkEl('div'); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, bottom: 0, left: 0 }; }
  };
  Object.defineProperty(e, 'textContent', { get() { return e._text; }, set(v) { e._text = v; if (v === '') { e.children.length = 0; e.childElementCount = 0; } } });
  Object.defineProperty(e, 'innerHTML', { get() { return e._html; }, set(v) { e._html = v; } });
  return e;
}

const els = {};
global.window = {};
global.document = {
  createElement: mkEl,
  getElementById(id) { return els[id] || (els[id] = mkEl('div')); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  body: { appendChild() {} },
  addEventListener() {}
};
let stored = {};
global.localStorage = { getItem(k) { return Object.prototype.hasOwnProperty.call(stored, k) ? stored[k] : null; }, setItem(k, v) { stored[k] = v; } };

const S = global.window.Sky = {};
S.core = {
  $: (id) => document.getElementById(id),
  el: (tag, cls, html) => { const e = mkEl(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; },
  index: -1,
  layout() {}, say() {}, current() { return null; },
  go(i) { S.core.index = i; }
};
S.Kora = { mood() {}, talk() {}, poke() {} };

function load(f) { (0, eval)(fs.readFileSync(f, 'utf8')); }
load('js/sky/content.js');

const LESSONS = S.content.LESSONS;
let fails = 0;
function T(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (ok ? '' : '   got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)));
}
function idxOf(prefix) { return LESSONS.findIndex(L => L.title.indexOf(prefix) === 0); }
function typeAt(i) { const d = S.game.peek(LESSONS[i]); return d ? d.t : null; }

function boot(doneObj) {
  stored = { 'skyj.game': JSON.stringify({ score: 0, done: doneObj || {} }) };
  load('js/sky/game.js');
  S.core.index = -1;
}
function keys(filter) {
  const out = {};
  LESSONS.forEach((L, i) => { const d = S.game.peek(L); if (d && filter(L, d, i)) out[L.tab + '|' + L.title] = 1; });
  return out;
}
const goal = () => document.getElementById('m-goal').textContent;
const goBtn = () => document.getElementById('m-go').textContent;

console.log('--- A: fresh game (nothing explored) ---');
boot({});
const q1 = idxOf('Stars are'), dip = idxOf('The Big Dipper'), leave = idxOf('Let\u2019s leave');
T('suggest() starts at lesson 0 (exploration)', S.game.suggest(), 0);
T('firstUndone() starts at lesson 0', S.game.firstUndone(), 0);
T('quiz lesson is deferred (next button locked)', /Quiz at the end/.test(S.game.next(LESSONS[q1]).label), true);
S.game.begin(LESSONS[q1], q1);
T('deferred banner: goal text', goal(), 'Explore first — quiz unlocked after checklist');
T('deferred banner: m-go says Keep exploring', goBtn(), 'Keep exploring \u25b6');
T('deferred suggest() points at exploration, not a quiz', typeAt(S.game.suggest()), 'tapN');
T('nav to Moon world lands on its exploration mission', LESSONS[S.game.firstUndoneIn('moon')].tab, 'moon');
T('Moon nav target is the phases mission, not the quiz', typeAt(S.game.firstUndoneIn('moon')), 'collect');
T('mission picker suggestion is not a quiz', typeAt(S.game.suggest()), 'tapN');

console.log('--- B: all Ladakh exploration done, quizzes pending ---');
boot(keys((L, d) => L.tab === 'sky' && d.t !== 'quiz'));
S.core.index = leave;
T('sky exploration complete -> suggest() asks the world quiz', S.game.suggest(), q1);
T('quiz no longer deferred', /Quiz ready/.test(S.game.next(LESSONS[q1]).label), true);
S.game.begin(LESSONS[q1], q1);
T('banner offers the quiz', goal(), 'Quick quiz!');
T('banner button is Answer', goBtn(), 'Answer Knowledge Check');
T('firstUndoneIn(sky) is the quiz now', S.game.firstUndoneIn('sky'), q1);
T('firstUndoneIn(earth) still picks exploration, not the first quiz', typeAt(S.game.firstUndoneIn('earth')), 'tapAll');
T('firstUndoneIn(earth) is a lesson of earth', LESSONS[S.game.firstUndoneIn('earth')].tab, 'earth');

console.log('--- C: Ladakh world complete -> on to Earth exploring ---');
boot(keys(L => L.tab === 'sky'));
S.core.index = 6;
T('suggest() leaves sky for the next world\u2019s exploration', S.game.firstUndoneIn('earth'), idxOf('My address'));
T('earth first mission is exploration (tapAll)', typeAt(S.game.firstUndoneIn('earth')), 'tapAll');
T('suggest() from mid-sky goes forward to earth exploration', S.game.suggest(), idxOf('My address'));

console.log('--- D: earth exploring done, its quizzes come next ---');
boot(keys(L => L.tab === 'sky' || (L.tab === 'earth' && S.game.peek(L).t !== 'quiz')));
S.core.index = idxOf('Earth spins: rotation');
T('after earth exploration, suggest() is an earth quiz', LESSONS[S.game.suggest()].tab, 'earth');
T('and it really is a quiz', typeAt(S.game.suggest()), 'quiz');

console.log('--- E: whole journey explored, all quizzes answered ---');
boot(keys(L => !!S.game.peek(L)));
S.core.index = LESSONS.length - 1;
T('nothing left -> suggest() goes to the finale', S.game.suggest(), LESSONS.length - 1);
T('resume goes back to the start', S.game.firstUndone(), 0);

console.log(fails ? fails + ' FAILING' : 'ALL PASS');
process.exitCode = fails ? 1 : 0;
