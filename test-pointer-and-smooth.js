const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1280,800"]
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on("pageerror", e => errs.push("PAGE ERROR: " + e.message));
  page.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) {
      errs.push("CONSOLE ERROR: " + m.text());
    }
  });

  await page.goto("http://127.0.0.1:8901/?test=1", { waitUntil: "load" });
  await page.waitForTimeout(1000);

  // 1. Verify welcome pop-up is visible
  const welcomeVisible = await page.evaluate(() => {
    const w = document.getElementById("welcome");
    return w && !w.classList.contains("hidden");
  });
  console.log("Welcome modal visible before enter:", welcomeVisible);

  // 2. Click Enter Chaupal
  await page.click("#enter");
  await page.waitForTimeout(600);

  const entered = await page.evaluate(() => window.CC_G.entered);
  const welcomeHidden = await page.evaluate(() => document.getElementById("welcome").classList.contains("hidden"));
  console.log("Game entered:", entered, "Welcome hidden:", welcomeHidden);

  // 3. Get initial player & camera position
  const initialPos = await page.evaluate(() => {
    return {
      x: window.CC_G.player.x,
      y: window.CC_G.player.y,
      camX: window.CC_G.cam.x,
      camY: window.CC_G.cam.y
    };
  });
  console.log("Initial player pos:", initialPos);

  // 4. Simulate moving the mouse downwards (dy = 30) for 15 frames
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => {
      // Simulate physical hardware pointer movement downwards
      window.CC_G.applyPointerDelta(0, 30);
    });
    await page.waitForTimeout(50);
  }

  const downPos = await page.evaluate(() => {
    return {
      x: window.CC_G.player.x,
      y: window.CC_G.player.y,
      camX: window.CC_G.cam.x,
      camY: window.CC_G.cam.y
    };
  });
  console.log("Pos after moving down:", downPos);
  const deltaY = downPos.y - initialPos.y;
  console.log("Downward delta Y:", deltaY);
  if (deltaY < 300) {
    console.error("FAIL: Player did not move down smoothly! Delta was only:", deltaY);
  } else {
    console.log("SUCCESS: Player moved smoothly downwards by", deltaY, "px!");
  }

  // 5. Test Escape key / Pause pop-up mechanics
  console.log("Triggering pause via Escape...");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  const pauseState = await page.evaluate(() => {
    const p = document.getElementById("pause");
    const resume = document.getElementById("resume");
    return {
      paused: window.CC_G.paused,
      pauseModalVisible: p && !p.classList.contains("hidden"),
      resumeVisible: resume && !resume.classList.contains("hidden")
    };
  });
  console.log("Pause state after Escape:", pauseState);

  // Take screenshot of pause modal
  await page.screenshot({ path: "re/test-pause-modal.png" });

  // 6. Test Resume
  console.log("Clicking Resume button...");
  await page.click("#resume");
  await page.waitForTimeout(500);

  const resumedState = await page.evaluate(() => {
    const p = document.getElementById("pause");
    return {
      paused: window.CC_G.paused,
      pauseModalHidden: p && p.classList.contains("hidden")
    };
  });
  console.log("Resumed state:", resumedState);

  // 7. Verify smooth camera tracking
  console.log("Checking camera tracking...");
  await page.evaluate(() => {
    window.CC_G.applyPointerDelta(0, 200);
  });
  await page.waitForTimeout(300);
  const camTracking = await page.evaluate(() => {
    return {
      playerY: window.CC_G.player.y,
      camY: window.CC_G.cam.y,
      camSmooth: window.CC_G.camSmooth
    };
  });
  console.log("Cam tracking:", camTracking);

  console.log("Errors logged during run:", errs);
  await browser.close();
  console.log("TEST FINISHED SUCCESSFULLY!");
})();

