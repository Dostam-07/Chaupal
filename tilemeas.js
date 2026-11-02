const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:8901/_qa/null.html", { waitUntil: "load" }).catch(() => {});
  const res = await p.evaluate(async () => {
    const load = (url) => new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        const cx = cv.getContext("2d"); cx.drawImage(im, 0, 0);
        res({ W: cv.width, H: cv.height, d: cx.getImageData(0, 0, cv.width, cv.height).data });
      };
      im.onerror = () => res(null);
      im.src = url;
    });
    const bounds = (d, W, H, pred) => {
      let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (pred(d[i], d[i + 1], d[i + 2], d[i + 3])) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y; n++;
        }
      }
      return n ? { minX, minY, maxX, maxY, n } : null;
    };
    const out = {};
    for (const t of ["base_5_3", "base_6_3", "top_5_3", "top_6_3"]) {
      const im = await load("/assets/maps/tiles/default/" + t + ".webp");
      if (!im) { out[t] = "missing"; continue; }
      const d = im.d;
      // board brown #a9743f: r~169 g~116 b~63
      const brown = bounds(d, im.W, im.H, (r, g, b) => Math.abs(r - 169) < 28 && Math.abs(g - 116) < 30 && Math.abs(b - 63) < 32 && r > g && g > b);
      // yellow text #ffd166: r~255 g~209 b~102
      const yellow = bounds(d, im.W, im.H, (r, g, b) => Math.abs(r - 255) < 30 && Math.abs(g - 209) < 35 && Math.abs(b - 102) < 45 && r > g && g > b);
      // dark outline #4a3728: r~74 g~55 b~40
      const dark = bounds(d, im.W, im.H, (r, g, b) => Math.abs(r - 74) < 30 && Math.abs(g - 55) < 30 && Math.abs(b - 40) < 35 && r < g * 1.6);
      out[t] = { size: im.W + "x" + im.H, brown: brown && { x0: brown.minX, x1: brown.maxX, y0: brown.minY, y1: brown.maxY, n: brown.n }, yellow: yellow && { x0: yellow.minX, x1: yellow.maxX, y0: yellow.minY, y1: yellow.maxY, n: yellow.n }, dark: dark && { x0: dark.minX, x1: dark.maxX, y0: dark.minY, y1: dark.maxY, n: dark.n } };
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();