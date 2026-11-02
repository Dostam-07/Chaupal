const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.click("#enter");
  await p.waitForTimeout(1200);

  // camera at start; find a clickable object near the spawn point in world coords
  const info = await p.evaluate(() => {
    const g = window.CC_G;
    const cam = g.cam;
    const objs = g.objs.filter(o => o.hit && !o.removed).map(o => ({
      t: o.def.type, x: Math.round(o.def.x), y: Math.round(o.def.y),
      z: o.z ? o.z() : 0,
    })).sort((a, b) => a.z - b.z);
    return { cam: { x: Math.round(cam.x), y: Math.round(cam.y) }, objs: objs.slice(0, 30) };
  });
  console.log(JSON.stringify(info, null, 1));
  await b.close();
})();
