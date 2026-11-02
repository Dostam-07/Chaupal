const { chromium } = require("playwright-core");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://127.0.0.1:8901/";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [], logs = [], missing = [];

  page.on("console", (m) => {
    const t = m.text();
    logs.push(m.type() + ": " + t);
    if (m.type() === "error") errors.push(t);
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("response", (r) => { if (r.status() >= 400) missing.push(r.status() + " " + r.url()); });

  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "re/shot-01-welcome.png" });

  // enter
  await page.click("#enter");
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "re/shot-02-spawn.png" });

  // walk right and down
  for (const k of ["d", "d", "s"]) {
    await page.keyboard.down(k);
    await page.waitForTimeout(700);
    await page.keyboard.up(k);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: "re/shot-03-walked.png" });

  // probe internal state
  const state = await page.evaluate(() => {
    const g = window.CC_G;
    return {
      mapId: g && g.mapId,
      playerPos: g && g.player && { x: Math.round(g.player.x), y: Math.round(g.player.y) },
      objs: g && g.objs && g.objs.length,
      rivObs: g && g.rivObs && g.rivObs.length,
      tiles: g && g.tmap && Object.keys(g.tmap.cache || {}).length,
      water: !!(g && g.water && g.water.data),
      cam: g && g.cam,
    };
  });

  // shop + badge modals
  await page.evaluate(() => window.ccShells(10));
  await page.click("#shop-btn");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "re/shot-04-shop.png" });
  await page.click("#shop-close");
  await page.waitForTimeout(200);

  // teleport around to smoke-test all rooms
  const rooms = ["sauna", "tent", "cave", "treehouse", "house-main", "house-cafeteria", "house-bedroom", "house-trophey", "boat", "telescope", "default"];
  const roomReport = [];
  for (const r of rooms) {
    await page.evaluate((m) => window.ccGoto(m, null, null), r);
    await page.waitForTimeout(900);
    const info = await page.evaluate(() => ({ map: window.CC_G.mapId, objs: window.CC_G.objs.length }));
    roomReport.push(info);
    await page.screenshot({ path: `re/shot-room-${r}.png` });
  }

  const uniq={};missing.slice(0,120).forEach(u=>uniq[u.split(" ")[1]]=1);
console.log(JSON.stringify({ state, roomReport, errors: errors.slice(0,40), uniqueMissing: Object.keys(uniq) }, null, 2));
  await browser.close();
})();