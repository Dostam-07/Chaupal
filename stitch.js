const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage();
  await p.setContent(`<html><body style="margin:0;background:#222"><div id="g">
  <img src="re/find-0.png"><img src="re/find-1.png"><img src="re/find-2.png"><img src="re/find-3.png"><br>
  <img src="re/find-4.png"><img src="re/find-5.png"><img src="re/find-6.png"></div></body></html>`,
   { waitUntil: "load" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/find-grid.png" });
  await b.close();
})();
