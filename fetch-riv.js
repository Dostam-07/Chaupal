const { chromium } = require("playwright-core");
const fs = require("fs");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const files = ["campfire","fountain","stage","hottub","flags","lagoon","ocean","river","windsock","woodburner","fishing-rod","puddle","flies","cat","clock","sun"];
const dest = "standalone/assets/animations/";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" });
  const page = await ctx.newPage();
  const failed = [];
  try { await page.goto("http://127.0.0.1:8901/", { waitUntil: "domcontentloaded", timeout: 30000 }); } catch (e) { console.log("nav:", e.message.slice(0,120)); }
  await page.waitForTimeout(3000);
  for (const f of files) {
    try {
      const b64 = await page.evaluate(async (url) => {
        const r = await fetch(url, { headers: { Referer: "http://127.0.0.1:8901/" } });
        if (!r.ok) return "ERR:" + r.status;
        const buf = await r.arrayBuffer();
        let bin = ""; const u8 = new Uint8Array(buf);
        for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
        return btoa(bin);
      }, "http://127.0.0.1:8901/animations/" + f + ".riv");
      if (b64.startsWith("ERR:")) { failed.push(f + " " + b64); console.log("FAIL", f, b64); continue; }
      fs.writeFileSync(dest + f + ".riv", Buffer.from(b64, "base64"));
      console.log("ok", f, Math.round(Buffer.from(b64, "base64").length / 1024) + "KB");
    } catch (e) { failed.push(f); console.log("ERR", f, e.message.slice(0, 80)); }
  }
  console.log(JSON.stringify({ failed }));
  await browser.close();
})();