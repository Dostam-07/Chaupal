const fs = require("fs");
let s = fs.readFileSync("standalone/_qa/scan.html", "utf8");
s = s.replace('tiles.sort((a, b) => (b.brown + b.dark * 3) - (a.brown + a.dark * 3));', 'tiles.sort((a, b) => (b.brown) - (a.brown));');
s = s.replace('window.__res = tiles.slice(0, 16)', 'window.__res = tiles.filter(t=>t.brown>0.04).map(t=>t.t+"|"+t.brown.toFixed(3)+"|"+t.dark.toFixed(3)).slice(0,40); window.__res = tiles.filter(t=>t.brown>0.04).slice(0,40)');
fs.writeFileSync("standalone/_qa/scan2.html", s);
console.log("wrote scan2.html");
