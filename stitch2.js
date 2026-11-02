const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage();
  await p.setContent(`<html><body style="margin:0;background:#333"><div id="g">
  <img width="400" src="re/f-00.png"><img width="400" src="re/f-01.png"><img width="400" src="re/f-02.png"><br>
  <img width="400" src="re/f-03.png"><img width="400" src="re/f-04.png"><img width="400" src="re/f-05.png"><br>
  <img width="400" src="re/f-06.png"><img width="400" src="re/f-07.png"><img width="400" src="re/f-08.png"></div></body></html>`,
   { waitUntil: "load" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/f-grid.png" });
  await b.close();
})();
