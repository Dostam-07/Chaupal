const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/_qa/mp.html", { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: "re/mc-crop.png", clip: { x: 350, y: 600, width: 700, height: 200 } });
  await b.close();
})();
