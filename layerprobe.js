const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  // 1: no tiles at all
  const info = await p.evaluate(() => {
    const g = window.CC_G;
    const loaded = Object.keys(g.tmap.cache || {});
    g._savedLayers = g.tmap.layers;
    g.tmap.layers = { base: {}, top: {} };
    return { loaded: loaded.length, sample: loaded.slice(0, 12), hasTop: loaded.filter(k => k.indexOf("top_") === 0).slice(0, 6) };
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/lay-notiles.png" });
  // 2: base only
  await p.evaluate(() => { const g = window.CC_G; g.tmap.layers = { base: g._savedLayers.base, top: {} }; });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/lay-baseonly.png" });
  console.log(JSON.stringify(info));
  await b.close();
})();
