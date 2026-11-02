const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/_qa/", { waitUntil: "load" });
  await p.waitForTimeout(600);
  await p.screenshot({ path: "re/f-grid.png" });
  await b.close();
})();
