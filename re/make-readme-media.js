/* Capture README stills from the standalone build (server on :8901). */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve(__dirname, "..", "media");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 810 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });

  const shot = async (name) => {
    await p.screenshot({ path: path.join(OUT, name + ".png"), timeout: 90000, animations: "allow" });
    console.log("shot", name);
  };
  const place = async (x, y, ms = 1200) => {
    await p.evaluate(([x, y]) => {
      const g = window.CC_G;
      if (g.player.setPos) g.player.setPos(x, y); else { g.player.x = x; g.player.y = y; }
      g.cam.x = x - 720; g.cam.y = y - 405;
      if (g.village) g.village.update && g.village.update();
    }, [x, y]);
    await p.waitForTimeout(ms);
  };

  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(2000);
  await shot("01-welcome");

  await p.click("#enter");
  await p.waitForTimeout(3000);
  await shot("02-camp");

  await place(6190, 2150, 1600);
  await shot("03-village");

  await p.evaluate(() => window.VUI.showChooser());
  await p.waitForTimeout(900);
  await shot("04-chooser");

  await p.evaluate(() => {
    const g = window.CC_G;
    window.VUI.talkTo(g.village.women[1]);
  });
  await p.waitForTimeout(3000);
  await shot("05-story");

  await p.evaluate(() => { window.VUI.closeBubble(); window.VUI.openPanel("explore"); });
  await p.waitForTimeout(900);
  await shot("06-explore");
  await p.evaluate(() => window.VUI.openPanel("impact"));
  await p.waitForTimeout(900);
  await shot("07-impact");
  await p.evaluate(() => window.VUI.closePanel());

  await place(6480, 1800, 1600);
  await p.evaluate(() => { try { window.VUI.hideAll(); } catch (e) {} });
  await p.waitForTimeout(700);
  await shot("08-schoolyard");

  await p.evaluate(() => window.ccGoto("school"));
  await p.waitForTimeout(2500);
  await shot("09-classroom");

  await p.evaluate(() => window.ccGoto("treehouse"));
  await p.waitForTimeout(2500);
  await shot("10-treehouse");

  await p.evaluate(() => window.ccGoto("sauna"));
  await p.waitForTimeout(2200);
  await shot("11-sauna");

  await p.evaluate(() => window.ccGoto("default"));
  await p.waitForTimeout(2200);
  await p.evaluate(() => { window.ccShells(20); window.ccBadge("cat"); window.ccBadge("goal"); window.CC_G.refreshHud(); });
  await p.evaluate(() => window.CC_G.openShop());
  await p.waitForTimeout(900);
  await shot("12-shop");
  await p.evaluate(() => { window.CC_G.closeModals(); window.CC_G.openBadges(); });
  await p.waitForTimeout(900);
  await shot("13-badges");

  console.log("errors:", JSON.stringify(errs));
  await ctx.close();
  await b.close();
})();
