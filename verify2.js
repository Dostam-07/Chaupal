const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message.slice(0, 120)));
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const url = "http://127.0.0.1:8901/index.html?_t=" + Date.now();
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(1400);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  await p.waitForTimeout(500);
  await p.screenshot({ path: "re/sign-new.png" });
  console.log("errs:", errs.length ? JSON.stringify(errs.slice(0, 3)) : "NONE");
  await b.close();
})();
