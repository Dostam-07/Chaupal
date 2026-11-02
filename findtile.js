const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  const res = await p.evaluate(async () => {
    const fmt = (f) => f.replace(/_(\d+)_(\d+)\.webp$/, " c$1 r$2").replace(/^base_/, "");
    const tiles = [];
    // fetch tile manifest from the standalone server for the list of base tiles
    const m = await fetch("http://127.0.0.1:8901/assets/maps/tiles/default/manifest.json").then(r => r.json());
    const rows = Object.keys(m.layers.base);
    for (const y of rows) {
      for (const x of Object.keys(m.layers.base[y])) {
        const u = "http://127.0.0.1:8901/assets/maps/tiles/default/base_" + x + "_" + y + ".webp";
        const img = new Image();
        await new Promise(res => { img.onload = res; img.onerror = res; img.src = u; });
        if (!img.naturalWidth) continue;
        const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        let brown = 0, dark = 0, n = img.naturalWidth * img.naturalHeight;
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], bl = d[i + 2];
          if (r > 110 && g > 50 && g < 120 && bl < 90 && r > g) brown++;
          if (r < 75 && g < 75 && bl < 75) dark++;
        }
        tiles.push({ t: "base_" + x + "_" + y, brown: brown / n, dark: dark / n, size: img.naturalWidth });
      }
    }
    tiles.sort((a, b) => (b.brown + b.dark) - (a.brown + a.dark));
    return tiles.slice(0, 14).map(t => `${t.t} brown=${(t.brown * 100).toFixed(1)}% dark=${(t.dark * 100).toFixed(1)}%`);
  });
  console.log(res.join("\n"));
  await b.close();
})();
