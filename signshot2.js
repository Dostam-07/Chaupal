const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:8901/_qa/sign.html", { waitUntil: "load" });
  await p.waitForFunction(() => document.title === "ready", { timeout: 30000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: "re/sign-region.png" });
  await b.close();
})();
