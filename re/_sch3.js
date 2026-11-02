const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on("pageerror", e => console.log("ERR", e.message));
  await p.goto("http://127.0.0.1:8901/index.html", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById("enter").click());
  await p.waitForTimeout(4000);
  await p.evaluate(() => { CC_G.player.setPos(6150, 2320); CC_G.player.tx = 6150; CC_G.player.ty = 2320; });
  await p.waitForTimeout(1200);
  console.log("POS " + JSON.stringify(await p.evaluate(() => ({x: Math.round(CC_G.player.x), y: Math.round(CC_G.player.y), cam: CC_G.cam, school: !!CC_G.school}))));
  await p.screenshot({ path: "media/_school3.png", timeout: 90000 });
  await b.close();
})();

