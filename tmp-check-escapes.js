// Scans source files for malformed \u escapes (fewer than 4 hex digits).
'use strict';
const fs = require('fs');
const files = fs.readdirSync('js/sky').map(f => 'js/sky/' + f).concat(['index.html']);
let bad = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const re = /\\u[0-9a-fA-F]{0,3}(?![0-9a-fA-F])/g;
  let m;
  while ((m = re.exec(s))) {
    // Ignore escaped backslashes (\\u...) which are literal text.
    let bs = 0; for (let i = m.index - 1; i >= 0 && s[i] === '\\'; i--) bs++;
    if (bs % 2 === 1) continue;
    const line = s.slice(0, m.index).split('\n').length;
    console.log(f + ':' + line + '  ' + JSON.stringify(s.substr(Math.max(0, m.index - 14), 30)));
    bad++;
  }
}
console.log(bad ? bad + ' malformed escape(s) found' : 'clean: no malformed unicode escapes');
process.exitCode = bad ? 1 : 0;
