const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.goto("http://127.0.0.1:8901/_qa/base_4_2.webp", { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.locator("img").screenshot({ path: "re/tile42.png" });
  await b.close();
})();
