const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const cam = await p.evaluate(() => { const g = window.CC_G; return { x: Math.round(g.cam.x), y: Math.round(g.cam.y) }; });
  await p.evaluate(() => { const m = document.getElementById("welcome"); if (m) m.style.display = "none"; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: "re/ws-full.png" });
  console.log("cam", JSON.stringify(cam));
  await b.close();
})();
