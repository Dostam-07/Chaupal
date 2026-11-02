const { chromium } = require("playwright-core");
const fs = require("fs");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:8901/_qa/paintsign.html", { waitUntil: "load" });
  const out = await p.evaluate(() => window.__paint());
  for (const [name, dataUrl] of Object.entries(out)) {
    const buf = Buffer.from(dataUrl.split(",")[1], "base64");
    fs.writeFileSync("standalone/assets/maps/tiles/default/" + name + ".webp", buf);
    console.log("wrote", name, buf.length, "bytes");
  }
  await b.close();
})();
