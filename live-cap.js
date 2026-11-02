const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:8901/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(6000);
  // find the canvas and teleport the local player into tent via console (engine globals)
  const inited = await page.evaluate(() => {
    const w = window;
    const keys = Object.keys(w).filter(k => /game|engine|cursor/i.test(k)).slice(0, 12);
    return { keys };
  });
  console.log("globals:", JSON.stringify(inited));
  // try to move via keyboard into the tent door using wasd through canvas click focus
  try {
    await page.keyboard.press("Tab");
  } catch (e) {}
  await page.screenshot({ path: "re/live-default.png" });
  await browser.close();
})();