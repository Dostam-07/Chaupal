const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.click("#enter");
  await page.waitForTimeout(1500);
  // house-main closeup
  await page.evaluate(() => window.ccGoto("house-main", 500, 600));
  await page.waitForTimeout(1400);
  const els = await page.evaluate(() => window.CC_G.objs.map(o => ({
    type: o.def && o.def.type, x: Math.round(o.def && o.def.x), y: Math.round(o.def && o.def.y),
    w: o.def && o.def.width, h: o.def && o.def.height, img: o.img && (o.img.src.split("/").pop()),
  })).filter(o => o.x));
  console.log(JSON.stringify(els, null, 1));
  await page.screenshot({ path: "re/zoom-house.png" });
  await browser.close();
})();