const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 520, height: 520 } });
  await p.goto("http://127.0.0.1:8901/_qa/b42.html", { waitUntil: "load" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/tile42.png" });
  await b.close();
})();
