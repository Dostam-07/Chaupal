const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message.slice(0, 120)));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(800);
  const title = await p.title();
  const welcome = await p.textContent("#welcome .welcome-desc");
  const alt = await p.getAttribute(".brand img", "alt");
  const wordmark = await p.textContent(".brand .wordmark");
  await p.click("#enter");
  await p.waitForTimeout(2200);
  const s = await p.evaluate(() => ({
    map: window.CC_G.mapId, objs: window.CC_G.objs.length, err: window.CC_G.lastErr || null,
  }));
  // hover + click watercan again in served mode
  await p.mouse.move(170, 377); await p.waitForTimeout(250);
  const cursor = await p.evaluate(() => window.CC_G.copy.src.split("/").pop());
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200);
  const held = await p.evaluate(() => window.CC_G.player.held);
  await p.screenshot({ path: "re/brand-served.png" });
  console.log(JSON.stringify({ title, welcome, alt, wordmark, ...s, cursor, held, errs: errs.length ? errs.slice(0,3) : "NONE" }));
  await b.close();
})();
