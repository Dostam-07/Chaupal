const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  p.on("request", r => {
    const u = r.url();
    if (/tiles\/default\/top_10_7/.test(u)) console.log("REQ top_10_7 STACK", JSON.stringify(r.headers()["referer"] || "-"));
  });
  p.on("console", m => { if (/top_10_7/.test(m.text())) console.log("CONSOLE", m.text().slice(0, 200)); });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.click("#enter");
  await p.waitForTimeout(4000);
  // drive toward bottom of map to reach row 7
  await p.keyboard.down("s");
  await p.waitForTimeout(5000);
  await p.keyboard.up("s");
  await p.keyboard.down("a");
  await p.waitForTimeout(2000);
  await p.keyboard.up("a");
  await p.waitForTimeout(2000);
  await b.close();
})();