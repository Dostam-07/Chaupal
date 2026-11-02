const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const p = await b.newPage();
  const errs = [];
  p.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); });
  p.on("pageerror", e => errs.push(e.message.slice(0, 140)));
  await p.goto("http://127.0.0.1:8901/_qa/scan.html", { waitUntil: "load" });
  try {
    await p.waitForFunction(() => window.__res, { timeout: 120000 });
    console.log((await p.evaluate(() => window.__res.join("\n"))));
  } catch (e) {
    console.log("TIMEOUT errs:", JSON.stringify(errs.slice(0, 8)));
  }
  await b.close();
})();
