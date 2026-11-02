const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on("pageerror", e => errs.push(e.message.slice(0, 160)));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });

  await page.goto("http://127.0.0.1:8901/?premiere=test", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.click("#enter");
  await page.waitForTimeout(1000);

  // walk to the beach door -> sauna (door at 3830,2455). use arrow keys fixed duration
  async function walk(dx, dy, ms) {
    const kx = dx > 0 ? "d" : dx < 0 ? "a" : null;
    const ky = dy > 0 ? "s" : dy < 0 ? "w" : null;
    if (kx) await page.keyboard.down(kx);
    if (ky) await page.keyboard.down(ky);
    await page.waitForTimeout(ms);
    if (kx) await page.keyboard.up(kx);
    if (ky) await page.keyboard.up(ky);
  }
  // Position player near sauna door, then test keyboard walking through the doorway
  await page.evaluate(() => { window.CC_G.player.setPos(3830, 2410); window.CC_G.camUpdate(true); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "re/e2e-at-sauna-door.png" });

  // walk south into the sauna doorway
  await walk(0, 40, 250);
  await page.waitForTimeout(800);
  const room = await page.evaluate(() => window.CC_G.mapId);
  console.log("after door walk ->", room);
  await page.screenshot({ path: "re/e2e-sauna.png" });

  // buy ccap in shop, equip, verify
  await page.evaluate(() => window.ccShells(20));
  await page.click("#shop-btn");
  await page.waitForTimeout(300);
  await page.click(".shop-item >> nth=0");
  await page.waitForTimeout(400);
  const eq = await page.evaluate(() => { const s = window.CCE.load(); return { shells: s.shells, hats: s.hats, hat: s.hat }; });
  console.log("shop state", JSON.stringify(eq));
  await page.evaluate(() => document.getElementById("shop-close").click());

  // concert dance check on default map
  await page.evaluate(() => window.ccGoto("default", 1540, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "re/e2e-concert.png" });

  // tent room final check (cauldron/goo)
  await page.evaluate(() => window.ccGoto("tent", 500, 600));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "re/e2e-tent.png" });

  console.log("errors:", JSON.stringify(errs.slice(0, 12)));
  await browser.close();
})();