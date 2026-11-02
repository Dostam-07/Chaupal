const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
  await p.goto("http://127.0.0.1:8901/assets/welcome-scene.jpg");
  
  const regions = await p.evaluate(() => {
    const cv = document.createElement("canvas");
    cv.width = 1024; cv.height = 576;
    const ctx = cv.getContext("2d");
    const im = document.querySelector("img");
    ctx.drawImage(im, 0, 0);
    const data = ctx.getImageData(0, 0, 1024, 576).data;
    
    function findBox(x1, y1, x2, y2, pred) {
      let minX = 1024, maxX = 0, minY = 576, maxY = 0;
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const i = (y * 1024 + x) * 4;
          if (pred(data[i], data[i+1], data[i+2], data[i+3])) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    }

    // Top-right Online pill
    const onlinePill = findBox(850, 20, 1000, 70, (r, g, b) => g > 110 && r < 120 && b < 100);
    // Tree signpost (Learn / Create / Connect)
    const signpost = findBox(40, 200, 200, 420, (r, g, b) => r > 160 && g > 110 && b < 90);
    // Bottom pills
    const bottomPills = findBox(300, 500, 750, 560, (r, g, b) => r < 60 && g < 60 && b < 60);

    return { onlinePill, signpost, bottomPills };
  });
  console.log("Regions:", JSON.stringify(regions, null, 2));
  await b.close();
})();
