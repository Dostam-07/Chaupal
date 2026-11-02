const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message.slice(0, 130)));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(900);
  await p.screenshot({ path: "re/brand-welcome.png" });
  const dt = await p.evaluate(() => ({ w: document.querySelector("#welcome .welcome-logo").naturalWidth, h: document.querySelector("#welcome .welcome-logo").naturalHeight, title: document.title }));
  await p.click("#enter");
  await p.waitForTimeout(2000);
  await p.screenshot({ path: "re/brand-served2.png" });
  console.log(JSON.stringify({ ...dt, errs: errs.length ? errs.slice(0, 3) : "NONE" }));
  await b.close();
})();
