const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.click("#enter");
  await p.waitForTimeout(1800);
  const spots = [[2110,1080],[2230,1080],[2350,1080],[2470,1080],[2110,1240],[2230,1240],[2350,1240],[2180,1400],[2300,1400]];
  for (let i = 0; i < spots.length; i++) {
    await p.evaluate(([x, y]) => { const g = window.CC_G; g.cam.x = x; g.cam.y = y; if (g.player) { g.player.x = x; g.player.y = y; } g.camUpdate(true); }, spots[i]);
    await p.waitForTimeout(260);
    await p.screenshot({ path: "re/f-0" + i + ".png" });
  }
  const s = await p.evaluate(() => ({ cam: { x: Math.round(window.CC_G.cam.x), y: Math.round(window.CC_G.cam.y) } }));
  console.log("final cam", JSON.stringify(s));
  await b.close();
})();
