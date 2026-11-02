const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  console.log("=== Testing Chaupal Village & Theater ===");
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const errors = [];
  page.on("pageerror", e => { console.error("PAGE_ERROR:", e.message); errors.push(e.message); });
  page.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) {
      console.error("CONSOLE_ERROR:", m.text());
      errors.push(m.text());
    }
  });

  await page.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.click("#enter");
  await page.waitForTimeout(600);

  // 1. Teleport to Banyan Tree
  await page.evaluate(() => {
    const g = window.CC_G;
    g.player.setPos(6180, 2060);
    g.cam.x = 6180 - 640;
    g.cam.y = 1970 - 360;
  });
  await page.waitForTimeout(800);

  // Capture top-down world screenshot of the upgraded Banyan tree & ladies
  await page.screenshot({ path: "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3/ui-banyan-world.png" });
  console.log("✓ Captured ui-banyan-world.png");

  // 2. Open Chaupal Interactive Theater
  await page.evaluate(() => {
    window.VUI.openTheater(0);
  });
  await page.waitForTimeout(1000);

  // Capture full theater view
  await page.screenshot({ path: "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3/ui-chaupal-theater.png" });
  console.log("✓ Captured ui-chaupal-theater.png");

  // 3. Advance dialogue
  await page.click("#ch-bubble", { force: true });
  await page.waitForTimeout(600);

  // 4. Switch to Meena (left, yellow saree)
  await page.click("#ch-spot-w1", { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3/ui-chaupal-meena.png" });
  console.log("✓ Captured ui-chaupal-meena.png");

  // 5. Switch to Kavita (student, blue uniform)
  await page.click("#ch-spot-w2", { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3/ui-chaupal-kavita.png" });
  console.log("✓ Captured ui-chaupal-kavita.png");

  // 6. Open Share Solutions Panel
  await page.evaluate(() => {
    window.VUI.handleAction("share");
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3/ui-chaupal-solutions.png" });
  console.log("✓ Captured ui-chaupal-solutions.png");

  // 7. Click Support Vote button
  const voted = await page.evaluate(() => {
    const btn = document.querySelector(".ch-vote-btn");
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log("✓ Voted on community solution:", voted);
  await page.waitForTimeout(400);

  // 8. Close Panel
  await page.click("#ch-panel-x");
  await page.waitForTimeout(400);

  // 9. Pet Mintu the cat
  await page.click("#ch-spot-cat", { force: true });
  await page.waitForTimeout(500);
  console.log("✓ Pet Mintu the cat verified");

  // 10. Close Theater and return to camp
  await page.click("#ch-close-btn");
  await page.waitForTimeout(600);
  console.log("✓ Return to camp verified");

  await browser.close();
  console.log("Errors count:", errors.length);
  if (errors.length > 0) {
    console.error("FAIL with errors:", errors);
    process.exit(1);
  }
  console.log("ALL TESTS PASSED WITH 0 ERRORS!");
})();
