const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage({ viewport: { width: 1100, height: 620 } });
  await p.goto("http://127.0.0.1:8901/index.html", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById("enter").click());
  await p.waitForFunction(() => window.CC_G && CC_G.ready, null, { timeout: 20000 });
  await p.evaluate(() => window.ccGoto("default", 6400, 1700));
  await p.waitForFunction(() => CC_G.ready, null, { timeout: 20000 });
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => ({ school: !!(CC_G.school), students: CC_G.school && CC_G.school.students && CC_G.school.students.length, map: CC_G.mapId }));
  console.log("INFO " + JSON.stringify(info));
  await p.screenshot({ path: "media/_schoolcheck.png", timeout: 60000 });
  await b.close();
})();
