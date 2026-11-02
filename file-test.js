const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message.slice(0, 160)));
  const url = "file:///C:/Users/dosta/Downloads/REA/Chaupal/standalone/index.html";
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click("#enter");
  await p.waitForTimeout(2500);

  const state = await p.evaluate(() => {
    const g = window.CC_G;
    if (!g) return { booted: false };
    return {
      map: g.mapId, objs: g.objs.length, hasPlayer: !!g.player, cam: { x: Math.round(g.cam.x), y: Math.round(g.cam.y) },
      mapLoaded: !!g.mapData && !!g.mapData.elements,
      water: !!g.water,
      tmapLayers: g.tmap ? !!g.tmap.layers : "-",
    };
  });
  console.log(JSON.stringify(state));
  // hover a plant near spawn and click: plant at (2110,1532); screen (2110-2360, 1532-1200)=( -250, 332) -> pick nearest positive: watercan (2530,1577)->(170,377)
  await p.mouse.move(170, 377);
  await p.waitForTimeout(300);
  const hoverImg = await p.evaluate(() => window.CC_G.copy.src.split("/").pop());
  await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(300);
  const held = await p.evaluate(() => window.CC_G.player.held);
  await p.screenshot({ path: "re/file-mode.png" });
  console.log("hoverImg:", hoverImg, "held:", held);
  console.log("errs:", errs.length ? JSON.stringify(errs.slice(0, 5)) : "NONE");
  await b.close();
})();
