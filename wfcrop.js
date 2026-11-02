const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/_qa/wf.html", { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: "re/signcrop.png", clip: { x: 380, y: 630, width: 600, height: 170 } });
  await b.close();
})();
