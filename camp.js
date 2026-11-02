const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  const s = await p.evaluate(() => {
    const g = window.CC_G;
    return { cam: g ? { x: Math.round(g.cam.x), y: Math.round(g.cam.y) } : null, intro: g ? g.introCam : null };
  });
  console.log(JSON.stringify(s));
  // walk cam down/right slowly to scan the sign region and find when letters appear
  for (const [cx, cy] of [[2360, 1250], [2360, 1350], [2360, 1450], [2440, 1450], [2500, 1500], [2600, 1600]]) {
    await p.evaluate(([x, y]) => { const g = window.CC_G; g.cam.x = x; g.cam.y = y; g.camUpdate(true); }, [cx, cy]);
    await p.waitForTimeout(200);
    await p.screenshot({ path: "re/cam-" + cx + "-" + cy + ".png" });
  }
  await b.close();
})();
