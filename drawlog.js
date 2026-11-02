const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_dl=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1600);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  await p.waitForTimeout(500);
  const hits = await p.evaluate(() => {
    const g = window.CC_G;
    const rec = [];
    const orig = g.baseCtx.drawImage.bind(g.baseCtx);
    g.baseCtx.drawImage = function (img, ...rest) {
      if (img && img.tagName === "IMG" && rest.length >= 2) {
        // rest: [dx, dy, ...] or [sx, sy, sw, sh, dx, dy, dw, dh]
        let dx, dy, dw;
        if (rest.length >= 8) { dx = rest[4]; dy = rest[5]; dw = rest[6]; }
        else { dx = rest[0]; dy = rest[1]; dw = rest[2] || undefined; }
        // world coords: screen = world - cam  ->  world = screen + cam
        rec.push({ src: (img.src || "").split("/").pop(), dx: Math.round(dx + g.cam.x), dy: Math.round(dy + g.cam.y), dw: dw ? Math.round(dw) : undefined, sw: rest.length >= 8 ? rest[2] : undefined });
      }
      return orig.apply(this, [img, ...rest]);
    };
    return new Promise(res => setTimeout(() => { res(JSON.stringify(rec.slice(0, 400))); }, 160));
  });
  const arr = JSON.parse(hits);
  // find draws covering world 2758-3302 x 1840-2005
  const over = arr.filter(r => r.dx < 3302 && r.dx + (r.dw || 0) > 2758 && r.dy < 2005 && r.dy + (r.dw || 0) > 1840);
  const byImg = {};
  arr.forEach(r => { byImg[r.src] = (byImg[r.src] || 0) + 1; });
  console.log("draws covering sign region:");
  over.slice(0, 25).forEach(r => console.log(JSON.stringify(r)));
  console.log("all images drawn on base ctx:", JSON.stringify(byImg));
  await b.close();
})();
