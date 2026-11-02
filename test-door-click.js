const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.click("#enter");
  await page.waitForTimeout(1500);

  // Let's teleport the player near the sauna (3830, 2455)
  await page.evaluate(() => {
    window.CC_G.player.setPos(3830, 2350);
    window.CC_G.camUpdate(true);
  });
  await page.waitForTimeout(500);

  // Where is the sauna door on the screen?
  const saunaDoorScreen = await page.evaluate(() => {
    const g = window.CC_G;
    const door = g.objs.find(o => o.def && o.def.to === "sauna");
    const sx = door.def.x - g.cam.x;
    const sy = door.def.y - g.cam.y;
    return {
      doorDef: door.def,
      cam: { x: g.cam.x, y: g.cam.y },
      screen: { x: sx, y: sy },
      hitTestCenter: door.hit(door.def.x, door.def.y),
      hitTestWorld: g.pick(door.def.x, door.def.y) === door
    };
  });
  console.log("Sauna door info:", saunaDoorScreen);

  // Click on the sauna door on screen!
  console.log("Clicking at screen coordinates:", saunaDoorScreen.screen);
  await page.mouse.click(saunaDoorScreen.screen.x, saunaDoorScreen.screen.y);
  await page.waitForTimeout(1000);

  const afterClickMap = await page.evaluate(() => window.CC_G.mapId);
  console.log("Map after clicking sauna door:", afterClickMap);

  await browser.close();
})();

