const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => {
    const g = window.CC_G;
    const t = g.baseCtx.getTransform();
    const c = g.baseCtx.canvas;
    return {
      cam: { x: Math.round(g.cam.x * 100) / 100, y: Math.round(g.cam.y * 100) / 100 },
      transform: { a: t.a, b: t.b, c: t.c, d: t.d, e: Math.round(t.e), f: Math.round(t.f) },
      canvas: { w: c.width, h: c.height, cssW: c.style.width, cssH: c.style.height },
      dpr: g.dpr,
      view: g.view,
    };
  });
  console.log(JSON.stringify(info));
  await b.close();
})();
