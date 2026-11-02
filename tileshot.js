const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 880, height: 900 } });
  await p.goto("http://127.0.0.1:8901/_qa/tileview.html", { waitUntil: "load" });
  await p.waitForFunction(() => document.title === "ready", { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(200);
  await p.screenshot({ path: "re/tiles-orig.png" });
  await b.close();
})();