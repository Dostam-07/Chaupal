const { chromium } = require("playwright-core");
const crypto = require("crypto");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_c=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById("welcome").style.display = "none"; });
  await p.waitForTimeout(600);
  const hashes = await p.evaluate(async () => {
    const grab = async (u) => {
      const b = await (await fetch(u)).arrayBuffer();
      const buf = new Uint8Array(b);
      let s = "";
      for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
      return btoa(s);
    };
    const h = async (u) => {
      const b = await (await fetch(u)).arrayBuffer();
      const hash = await crypto.subtle.digest("SHA-256", b);
      return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 16);
    };
    return { t53: await h("/assets/maps/tiles/default/base_5_3.webp"), t63: await h("/assets/maps/tiles/default/base_6_3.webp") };
  });
  await p.screenshot({ path: "re/sign-nocache.png" });
  console.log("page hashes:", JSON.stringify(hashes));
  await b.close();
})();
