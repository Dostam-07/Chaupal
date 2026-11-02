const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  
  // 1. Welcome screen
  await p.goto("http://127.0.0.1:8901/");
  await p.waitForTimeout(600);
  await p.screenshot({ path: "standalone/_qa/ui-welcome-new.png" });
  
  // 2. HUD
  await p.click("#enter");
  await p.waitForTimeout(1200);
  await p.screenshot({ path: "standalone/_qa/ui-hud-new.png" });
  
  // 3. Shop
  await p.click("#shop-btn");
  await p.waitForTimeout(600);
  await p.screenshot({ path: "standalone/_qa/ui-shop-new.png" });
  await p.click("#shop-close");
  await p.waitForTimeout(300);
  
  // 4. Badges
  await p.click("#badges-btn");
  await p.waitForTimeout(600);
  await p.screenshot({ path: "standalone/_qa/ui-badges-new.png" });
  await p.click("#badges-close");
  await p.waitForTimeout(300);

  // 5. Guide
  await p.click("#guide-btn");
  await p.waitForTimeout(600);
  await p.screenshot({ path: "standalone/_qa/ui-guide-new.png" });
  await p.click("#guide-close");

  await b.close();
  console.log("All new screenshots captured!");
})();
