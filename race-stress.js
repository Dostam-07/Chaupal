const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on("pageerror", e => errs.push(e.message.slice(0, 140)));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.click("#enter");
  await p.waitForTimeout(1000);
  const rooms = ["default", "boat", "tent", "cave", "default", "treehouse", "boat", "house-main", "default", "sauna", "cave", "tent"];
  // hop as fast as possible, no waits: the manifest fetch is ~async so this forces the race
  for (const id of rooms) await p.evaluate(m => window.ccGoto(m), id);
  await p.waitForTimeout(4000);
  const info = await p.evaluate(() => ({ map: window.CC_G.mapId, tmap: !!window.CC_G.tmap, tLayers: window.CC_G.tmap ? !!window.CC_G.tmap.layers : null }));
  console.log("end:", JSON.stringify(info));
  console.log("errs:", errs.length ? JSON.stringify(errs.slice(0, 6)) : "NONE");
  await b.close();
})();
