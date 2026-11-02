const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 600, height: 400 } });
  await p.goto("http://127.0.0.1:8901/_qa/f-06.png", { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.locator("img").screenshot({ path: "re/signcheck.png" });
  await b.close();
  console.log("saved");
})();
