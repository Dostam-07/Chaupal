const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/_qa/bw.html", { waitUntil: "load" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/bw-strip.png", clip: { x: 0, y: 540, width: 1280, height: 240 } });
  await b.close();
})();
