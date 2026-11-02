const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(1000); await p.click("#enter"); await p.waitForTimeout(1200);
  for (const [id, x, y] of [["tent", null, null], ["house-main", null, null], ["default", null, null], ["sauna", null, null]]) {
    await p.evaluate(([m]) => window.ccGoto(m), [id]);
    await p.waitForTimeout(1400);
    await p.screenshot({ path: "re/vq-" + id + ".png" });
  }
  console.log("errs", JSON.stringify(errs));
  await b.close();
})();
