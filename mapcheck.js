const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_mc=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  await p.waitForTimeout(400);
  // draw red rect at world 2758,1840 - 3302,2005 on base canvas AFTER a frame
  await p.evaluate(() => {
    const g = window.CC_G;
    const b = g.baseCtx;
    // force one render pass by hooking after next frame: simplest - just draw now on top (next frame clears)
    window.__mc = true;
    b.save();
    b.fillStyle = "rgba(255,0,0,0.6)";
    b.fillRect(2758 - g.cam.x, 1840 - g.cam.y, 3302 - 2758, 2005 - 1840);
    b.restore();
  });
  await p.waitForTimeout(50);
  await p.screenshot({ path: "re/mapcheck.png" });
  const info = await p.evaluate(() => ({ cam: { x: Math.round(window.CC_G.cam.x), y: Math.round(window.CC_G.cam.y) }, player: { x: Math.round(window.CC_G.player.x), y: Math.round(window.CC_G.player.y) } }));
  console.log(JSON.stringify(info));
  await b.close();
})();
