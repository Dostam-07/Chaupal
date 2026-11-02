const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:8901/_qa/yellow.html", { waitUntil: "load" });
  try { await p.waitForFunction(() => window.__res, { timeout: 180000 }); console.log((await p.evaluate(() => window.__res.join("\n")))); }
  catch (e) { console.log("TIMEOUT"); }
  await b.close();
})();
