const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_c=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1600);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  await p.waitForTimeout(600);
  await p.screenshot({ path: "re/sign-removed.png" });
  await b.close();
})();
