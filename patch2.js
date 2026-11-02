const fs = require("fs");
// config.js: HAT_FILES alias
let c = fs.readFileSync("standalone/data/config.js", "utf8");
if (c.indexOf("HAT_FILES") < 0) {
  c = c.replace("  HAT_DEFS", "  HAT_FILES: { \"3d-glasses\": \"sunglasses\" },\n  HAT_DEFS");
  fs.writeFileSync("standalone/data/config.js", c);
}
// player.js alias
let p = fs.readFileSync("standalone/js/player.js", "utf8");
p = p.split('var hatImg = CCA.img("optimized/hats/" + hat + ".webp");')
  .join('var hatImg = CCA.img("optimized/hats/" + (CC.HAT_FILES[hat] || hat) + ".webp");');
p = p.split('var gi = CCA.img("optimized/hats/" + g + ".webp");')
  .join('var gi = CCA.img("optimized/hats/" + (CC.HAT_FILES[g] || g) + ".webp");');
fs.writeFileSync("standalone/js/player.js", p);
// objects.js Hat alias
let o = fs.readFileSync("standalone/js/objects.js", "utf8");
o = o.replace('this.src = CCA.p(this.path + (this.def.file || this.hid) + ".webp");',
  'this.src = CCA.p(this.path + (CC.HAT_FILES[this.hid] || this.hid) + ".webp");');
fs.writeFileSync("standalone/js/objects.js", o);
// audio.js: ambient whitelist + spatial alias
let a = fs.readFileSync("standalone/js/audio.js", "utf8");
a = a.replace('  var ambientNames = ["walking", "forest", "sauna"];',
  '  var ambientFiles = { walking: "ambient/walking", forest: "ambient/forest" };\n  var spatialAlias = { soup: "steam", fire: "flicker" };');
a = a.replace('src: [CCA.p("optimized/sounds/" + name + ".mp3")],',
  'src: [CCA.p("optimized/sounds/" + (ambientFiles[name] || name) + ".mp3")],');
a = a.replace('function setAmbient(name, vol) {',
  'function setAmbient(name, vol) {\n    if (name && !ambientFiles[name]) return;\n    if (!name) { Object.keys(ambient).forEach(function (k) { try { ambient[k].stop(); } catch (e) {} }); ambient = {}; return; }');
a = a.replace('sounds.forEach(function (n2) { var f = n2.sound;',
  'sounds.forEach(function (n2) { var f = spatialAlias[n2.sound] || n2.sound;');
fs.writeFileSync("standalone/js/audio.js", a);
console.log("patched all");