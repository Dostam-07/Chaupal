const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message.slice(0, 140)));
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_sl=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1600);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  await p.waitForTimeout(600);
  // teleport to sign center (world 3030,1922); sign spans 2758-3302 x 1840-2005
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 3030; g.player.y = 1922;
    g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
    window.__teleported = true;
  });
  await p.waitForTimeout(900);
  await p.screenshot({ path: "re/sign-live.png" });
  // also grab a tight crop of just the region on screen
  const info = await p.evaluate(() => ({
    cam: { x: Math.round(window.CC_G.cam.x), y: Math.round(window.CC_G.cam.y) },
    player: { x: Math.round(window.CC_G.player.x), y: Math.round(window.CC_G.player.y) },
    map: window.CC_G.mapId || window.CC_G.map || null,
    drawLog: window.__drawLog || null,
  }));
  console.log(JSON.stringify(info));
  await p.screenshot({ path: "re/sign-live-crop.png", clip: { x: 200, y: 220, width: 880, height: 360 } });
  console.log("errs:", errs.length ? JSON.stringify(errs.slice(0, 3)) : "NONE");
  await b.close();
})();