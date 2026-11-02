const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.evaluate(() => { window.ccShells ? window.ccShells(0) : null; });
  await p.click("#enter");
  await p.waitForTimeout(1800);
  // pan the camera over likely sign area in a vertical strip; screenshot each
  const spots = [[2120,1100],[2240,1100],[2360,1100],[2480,1100],[2120,1250],[2360,1250],[2480,1400]];
  for (let i = 0; i < spots.length; i++) {
    await p.evaluate(([x, y]) => { window.ccGoto(x, y, true); }, spots[i]);
    await p.waitForTimeout(250);
    await p.screenshot({ path: "re/find-" + i + ".png" });
  }
  await b.close();
})();
