const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on("pageerror", e => console.log("ERR", e.message));
  await p.goto("http://127.0.0.1:8901/index.html", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById("enter").click());
  await p.waitForFunction(() => window.CC_G && CC_G.ready, null, { timeout: 20000 });
  await p.evaluate(() => window.ccGoto("default", 6150, 2420));
  await p.waitForFunction(() => CC_G.ready, null, { timeout: 25000 });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: "media/_school2.png", timeout: 90000 });
  await b.close();
})();
