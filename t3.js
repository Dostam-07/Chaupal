const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(900); await p.click("#enter"); await p.waitForTimeout(900);
  await p.evaluate(() => window.ccGoto("tent", 500, 600));
  await p.waitForTimeout(2000);
  const info = await p.evaluate(() => {
    const r = window.CC_G.rivObs;
    return r.map(x => ({ src: x.def.src, x: Math.round(x.x), y: Math.round(x.y), w: x.w, loaded: x.loaded, failed: x.failed, canvas: !!(x.canvas && x.canvas.parentNode), cs: x.canvas && x.canvas.style ? (x.canvas.style.left + "," + x.canvas.style.top + " " + x.canvas.style.width + "x" + x.canvas.style.height) : null, _inited: x._inited }));
  });
  console.log(JSON.stringify(info, null, 1));
  await p.screenshot({ path: "re/tent2.png" });
  console.log("errs", JSON.stringify(errs));
  await b.close();
})();
