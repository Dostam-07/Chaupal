const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ARTIFACT_DIR = "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.click("#enter");
  await page.waitForTimeout(600);

  // 1. Marshmallow roasting stick screenshot
  await page.evaluate(() => {
    window.CC_G.player.setPos(4510, 2740);
    window.CC_G.player.held = "marshmallow";
    window.CC_G.player.roastLevel = 0.65;
    window.CC_G.camUpdate(true);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${ARTIFACT_DIR}/ui-marshmallow-roasting.png` });
  console.log("✓ Captured ui-marshmallow-roasting.png");

  // 2. Soccer match action screenshot
  await page.evaluate(() => {
    window.CC_G.player.setPos(5340, 1288);
    const b = window.CC_G.objs.find(o => o instanceof window.CC_O.SoccerBall);
    if (b) { b.x = 5440; b.y = 1288; b.vx = 480; }
    window.CC_G.camUpdate(true);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${ARTIFACT_DIR}/ui-soccer-physics.png` });
  console.log("✓ Captured ui-soccer-physics.png");

  // 3. Sauna with steam explosion
  await page.evaluate(() => {
    window.CC_G.goTo("sauna", 450, 400);
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.PFX.createSteamCloud(280, 480, false);
    window.CC_G.player.emoteNow(5);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${ARTIFACT_DIR}/ui-sauna-steam.png` });
  console.log("✓ Captured ui-sauna-steam.png");

  // 4. Tent with spicy chili cauldron
  await page.evaluate(() => {
    window.CC_G.goTo("tent", 522, 250);
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.PFX.createSteamCloud(812, 200, true);
    window.CC_G.player.emoteNow(8);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${ARTIFACT_DIR}/ui-tent-cauldron.png` });
  console.log("✓ Captured ui-tent-cauldron.png");

  await browser.close();
})();

