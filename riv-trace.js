const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const riv = [], other = [];
  page.on("response", async (r) => {
    const u = r.url();
    if (u.includes(".riv")) riv.push(r.status() + " " + u);
  });
  page.on("console", m => { const t = m.text(); if (t.includes("rive") || t.includes("rive") || t.includes("Rive")) return; });
  await page.goto("http://127.0.0.1:8901/", { waitUntil: "domcontentloaded", timeout: 40000 });
  await page.waitForTimeout(2500);
  try { await page.click("text=Start", { timeout: 6000 }); } catch (e) {}
  await page.waitForTimeout(6000);
  const map = await page.evaluate(() => { try { return window.game ? window.game.curMap || "?" : "nogame"; } catch (e) { return "?"; } });
  console.log("MAP:", map);
  console.log(JSON.stringify(riv, null, 1));
  await browser.close();
})();