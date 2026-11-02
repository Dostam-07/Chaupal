const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://127.0.0.1:8901/_qa/index2.html", { waitUntil: "load" });
  await p.waitForFunction(() => window.__done, { timeout: 30000 });
  window.__res = await p.evaluate(async () => {
    const load = (name) => new Promise(res => { const im = new Image(); im.onload = () => { const cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const cx = cv.getContext("2d"); cx.drawImage(im, 0, 0); res(cx.getImageData(0, 0, cv.width, cv.height).data); }; im.onerror = () => res(null); im.src = name; });
    const stats = (d, W, H, x0, y0, x1, y1) => {
      let brown = 0, yellow = 0, cream = 0, green = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2]; n++;
        if (r > 120 && r < 200 && g > 60 && g < 140 && b < 100 && r > g) brown++;
        else if (r > 170 && g > 120 && b < 150 && r > b) yellow++;
        else if (r > 220 && g > 215 && b > 180) cream++;
        else if (g > 100 && g > r * 1.15 && g > b * 1.1) green++;
      }
      return { brown: (brown / n * 100).toFixed(1), yellow: (yellow / n * 100).toFixed(1), cream: (cream / n * 100).toFixed(1), green: (green / n * 100).toFixed(1) };
    };
    const res = {};
    const sremoved = await load("/_qa/sign-removed.png");
    if (sremoved) res.signRemoved = stats(sremoved, 1280, 800, 398, 640, 942, 805);
    const snew = await load("/_qa/sign-new.png");
    if (snew) res.signNew = stats(snew, 1280, 800, 398, 640, 942, 805);
    const ws = await load("/_qa/ws-full.png");
    if (ws) res.wsFull = stats(ws, 1280, 800, 398, 640, 942, 805);
    return res;
  });
  console.log(JSON.stringify(window.__res));
  await b.close();
})();
