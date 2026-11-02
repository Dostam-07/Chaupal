const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now());
  await p.waitForFunction(() => window.CC_G && window.CC_G.player);
  await p.click("#enter").catch(() => {});
  await p.waitForTimeout(500);
  await p.evaluate(() => { window.CC_G.player.setPos(6480, 2350); window.CC_G.camUpdate(true); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: "re/_plot-view.png" });
  await b.close();
  console.log("shot saved");
})();
