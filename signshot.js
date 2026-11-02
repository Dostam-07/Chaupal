const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:8901/_qa/sign.html", { waitUntil: "load" });
  await p.waitForFunction(() => window.__done, { timeout: 30000 }).catch(() => {});
  await p.setContent(`
  <body style="margin:0"><canvas id="c"></canvas>
  <script>
    (async () => {
      const slices = [
        ["base_4_2", 2048, 1024, 2048, 1340, 2560, 1536],
        ["base_5_2", 2560, 1024, 2560, 1340, 2720, 1536],
        ["base_4_3", 2048, 1536, 2048, 1536, 2560, 1580],
        ["base_5_3", 2560, 1536, 2560, 1536, 2720, 1580],
      ];
      const X0 = 2000, Y0 = 1300, W = 740, H = 300;
      const cv = document.getElementById("c"); cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d");
      let done = 0;
      for (const [tile, tx, ty, wx, wy, wx2, wy2] of slices) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, tx % 512, ty % 512, wx2 - wx, wy2 - wy, wx - X0, wy - Y0, wx2 - wx, wy2 - wy);
          if (++done === slices.length) document.title = "ready";
        };
        img.src = "/assets/maps/tiles/default/" + tile + ".webp";
      }
    })();
  </script>`);
  await p.waitForFunction(() => document.title === "ready", { timeout: 30000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: "re/sign-region.png" });
  await b.close();
})();
