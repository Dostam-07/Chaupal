const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("http://127.0.0.1:8901/index.html", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById("enter").click());
  await p.waitForFunction(() => window.CC_G && CC_G.ready, null, { timeout: 20000 });
  await p.evaluate(() => window.ccGoto("default", 5850, 2150));
  await p.waitForFunction(() => CC_G.ready, null, { timeout: 20000 });
  await p.waitForTimeout(2000);
  const f = await p.evaluate(() => {
    const w = CC_G.water, out = {};
    [[5400,2100],[5700,2050],[5900,2200],[6100,2300],[6250,1500],[6500,1900]].forEach(([x,y]) => out[x+","+y] = w ? +w.fraction(x,y).toFixed(2) : null);
    return out;
  });
  console.log("FRAC " + JSON.stringify(f));
  await p.screenshot({ path: "media/_villsurvey.png", timeout: 60000 });
  await b.close();
})();
