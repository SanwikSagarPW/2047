// Build a self-contained game.html by inlining all JS, CSS and SVG images
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Inline CSS
html = html.replace(/<link rel="stylesheet" href="css\/style\.css(\?v=\d+)?">/, () => {
  const css = fs.readFileSync('css/style.css', 'utf8');
  return '<style>\n' + css + '\n</style>';
});

// Inline each local script
html = html.replace(/<script src="(js\/[^"?]+)(?:\?v=\d+)?"><\/script>/g, (m, src) => {
  const code = fs.readFileSync(src, 'utf8');
  return '<script>\n' + code + '\n</script>';
});

// Inline all local img src references as data URIs
html = html.replace(/src="(assets\/img\/[^"]+\.svg)"/g, (m, src) => {
  try {
    const svg = fs.readFileSync(src, 'utf8').replace(/\n/g, ' ');
    return 'src="data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '"';
  } catch (e) {
    console.warn('missing asset: ' + src);
    return m;
  }
});

// Also handle img src set dynamically in JS (ui.js, journal.js)
const inlineSvg = (path) => {
  try {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(fs.readFileSync(path, 'utf8').replace(/\n/g, ' '));
  } catch (e) { return null; }
};

// Patch ui.js/journal.js asset references by injecting a lookup object
const assetMap = {};
for (const f of fs.readdirSync('assets/img')) {
  if (f.endsWith('.svg')) {
    assetMap[f] = inlineSvg('assets/img/' + f);
  }
}
const mapScript = '<script>window.G_ASSETS = ' + JSON.stringify(assetMap) + ';\n' +
  '(function(){\n' +
  '  const origSetAttr = Element.prototype.setAttribute;\n' +
  '  Element.prototype.setAttribute = function(name, val) {\n' +
  '    if (name === "src" && typeof val === "string" && val.indexOf("assets/img/") === 0) {\n' +
  '      const f = val.split("/").pop();\n' +
  '      if (window.G_ASSETS[f]) val = window.G_ASSETS[f];\n' +
  '    }\n' +
  '    return origSetAttr.call(this, name, val);\n' +
  '  };\n' +
  '})();\n</script>';
html = html.replace('</head>', mapScript + '\n</head>');

fs.writeFileSync('game.html', html);
console.log('Wrote game.html (' + html.length + ' bytes), ' + Object.keys(assetMap).length + ' svg assets inlined');
