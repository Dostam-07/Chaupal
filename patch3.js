const fs = require("fs");
// 1) CCA.p: normalise asset paths (leading slash, absolute host)
let a = fs.readFileSync("standalone/js/assets.js", "utf8");
a = a.replace("  function p(rel) { return base + rel; }",
`  function p(rel) {
    if (!rel) return base;
    var s = String(rel);
    s = s.replace(/^https?:\\/\\/[^/]+\\//, "");
    s = s.replace(/^\\//, "");
    s = s.replace(/^\\/+/, "");
    return base + s;
  }`);
fs.writeFileSync("standalone/js/assets.js", a);

// 2) audio aliases for every sound name the maps ask for that we do not ship
let au = fs.readFileSync("standalone/js/audio.js", "utf8");
au = au.replace('  var spatialAlias = { soup: "steam", fire: "flicker" };',
`  var spatialAlias = {
    soup: "steam", fire: "flicker", "boat-rocking": "ocean-waves", cave: "cave-enter",
    eerie: "whoosh", campfire: "flicker", "hot-tub": "steam", river: "water-stream",
    home: "pop", "grandfather-clock": "hourglass", buzzing: "buzz", sauna: "steam",
    treehouse: "forest", kick: "soccer-kick",
  };`);
au = au.replace("      this.howl = new Howl({ src: [CCA.p(\"optimized/sounds/\" + this.sound + \".mp3\")], loop: true, preload: true });",
  "      this.howl = new Howl({ src: [CCA.p((ambientFiles[this.sound] ? \"optimized/sounds/\" + ambientFiles[this.sound] : \"optimized/sounds/\" + this.sound) + \".mp3\")], loop: true, preload: true });");
au = au.replace("  function SpatialNode(d) {\n    this.sound = d.sound;", "  function SpatialNode(d) {\n    this.sound = spatialAlias[d.sound] || d.sound;");
fs.writeFileSync("standalone/js/audio.js", au);

// 3) play(): alias fallback for one-shots too
au = fs.readFileSync("standalone/js/audio.js", "utf8");
au = au.replace("  function play(name, vol) {\n    if (muted) return;\n    try { howlFor(name, { volume: vol }).play(); } catch (e) {}",
  "  function play(name, vol) {\n    if (muted) return;\n    try { howlFor(spatialAlias[name] || name, { volume: vol }).play(); } catch (e) {}");
fs.writeFileSync("standalone/js/audio.js", au);
console.log("patched");
