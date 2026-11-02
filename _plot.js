const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on("pageerror", e => console.log("ERR", e.message));
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now());
  await p.waitForFunction(() => window.CC_G && window.CC_G.player);
  await p.click("#enter").catch(() => {});
  await p.waitForTimeout(600);

  const grid = await p.evaluate(() => {
    const g = window.CC_G, out = [];
    for (let x = 5400; x <= 6700; x += 100) {
      const row = [];
      for (let y = 1750; y <= 2700; y += 100) {
        const wf = g.water ? (g.water.fraction ? g.water.fraction(x, y, 60) : (g.water.at ? (g.water.at(x, y) ? 1 : 0) : -1)) : -1;
        row.push(wf);
      }
      out.push({ x, row });
    }
    // also: which objects are near this whole band?
    const near = g.objs.filter(o => o.x >= 5300 && o.x <= 6800 && o.y >= 1700 && o.y <= 2800)
      .map(o => o.constructor.name + "@" + Math.round(o.x) + "," + Math.round(o.y) + " r" + Math.round(o.w || 0) + "x" + Math.round(o.h || 0));
    return { ys: Array.from({ length: 10 }, (_, i) => 1750 + i * 100), out, near, mapW: CC.MAP_DEFAULTS.default.width };
  });
  console.log("ys:", grid.ys.join(" "));
  for (const r of grid.out) console.log(r.x, r.row.join(" "));
  console.log("NEAR OBJECTS:", JSON.stringify(grid.near, null, 1));
  await b.close();
})();
