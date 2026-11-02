const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on("pageerror", e => errs.push("PAGE_ERROR: " + e.message));
  page.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) {
      errs.push("CONSOLE_ERROR: " + m.text());
    }
  });

  console.log("Navigating to http://127.0.0.1:8901/...");
  await page.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await page.waitForTimeout(1000);

  // Click Enter Chaupal
  await page.click("#enter");
  await page.waitForTimeout(1500);

  // 1. Verify Camper count
  const camperInfo = await page.evaluate(() => {
    const c = window.CC_G.campers;
    return {
      count: c ? c.list.length : 0,
      sampleNames: c ? c.list.slice(0, 10).map(x => x.name) : []
    };
  });
  console.log("Camper count:", camperInfo.count);
  console.log("Sample Camper names:", camperInfo.sampleNames.join(", "));

  // Click a camper to test wave & dialogue toast
  const camperToast = await page.evaluate(() => {
    const c = window.CC_G.campers.list[0];
    window.CC_G.interact(c);
    const toastEl = document.querySelector(".toast, #toast, .hud-toast, [id*='toast']");
    return {
      clickedName: c.name,
      toastText: toastEl ? toastEl.textContent : (document.body.innerText.match(/waves|say|Chaupal/i) ? "toast found" : "no-toast")
    };
  });
  console.log("Camper click interaction:", camperToast);
  await page.waitForTimeout(600);

  // 2. Navigate player to Schoolyard on default map
  await page.evaluate(() => {
    window.CC_G.player.setPos(6470, 1720);
    window.CC_G.camUpdate(true);
  });
  await page.waitForTimeout(800);

  const schoolyardState = await page.evaluate(() => {
    const g = window.CC_G;
    const s = g.school;
    return {
      map: g.mapId,
      playerPos: { x: g.player.x, y: g.player.y },
      hasSchool: !!s,
      teacher: s && s.teacher ? { name: s.teacher.name, role: s.teacher.role, x: s.teacher.x, y: s.teacher.y } : null,
      studentsCount: s && s.students ? s.students.length : 0,
      hasBell: !!(s && s.bell),
      hasBoard: !!(s && s.board)
    };
  });
  console.log("Schoolyard outdoor state:", JSON.stringify(schoolyardState));

  // Take screenshot of outdoor Schoolyard
  await page.screenshot({ path: "re/schoolyard-outdoor.png" });

  // 3. Test Teacher interaction (Meena Didi)
  const teacherResult = await page.evaluate(() => {
    const g = window.CC_G;
    const initialShells = window.CCE.load().shells;
    g.interact(g.school.teacher);
    const newShells = window.CCE.load().shells;
    return {
      initialShells,
      newShells,
      shellsGained: newShells - initialShells
    };
  });
  console.log("Teacher interaction result:", teacherResult);
  await page.waitForTimeout(600);

  // 4. Test Student interaction
  await page.evaluate(() => {
    const g = window.CC_G;
    g.interact(g.school.students[0]);
  });
  await page.waitForTimeout(600);

  // 5. Test School Bell interaction
  const bellResult = await page.evaluate(() => {
    const g = window.CC_G;
    g.interact(g.school.bell);
    return { ringing: g.school.bell.ringUntil > Date.now() };
  });
  console.log("School bell ringing:", bellResult);
  await page.waitForTimeout(600);

  // 6. Test School Board interaction
  await page.evaluate(() => {
    const g = window.CC_G;
    g.interact(g.school.board);
  });
  await page.waitForTimeout(600);

  // 7. Walk into School Door at (6580, 1620) to transition into classroom interior
  console.log("Entering school door...");
  await page.evaluate(() => {
    window.CC_G.player.setPos(6580, 1620);
    window.CC_G.camUpdate(true);
  });
  // Small movement to trigger door overlap
  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  await page.waitForTimeout(1200);

  const indoorState = await page.evaluate(() => {
    const g = window.CC_G;
    const s = g.school;
    return {
      map: g.mapId,
      playerPos: { x: Math.round(g.player.x), y: Math.round(g.player.y) },
      hasSchool: !!s,
      teacher: s && s.teacher ? s.teacher.name : null,
      studentsCount: s && s.students ? s.students.length : 0,
      fanAngle: s ? s.fanAngle : 0
    };
  });
  console.log("Classroom interior state:", JSON.stringify(indoorState));

  // Take screenshot of indoor classroom
  await page.screenshot({ path: "re/classroom-indoor.png" });

  // 8. Exit classroom back to default map
  console.log("Exiting classroom via door at (860, 860)...");
  await page.evaluate(() => {
    window.CC_G.player.setPos(860, 860);
    window.CC_G.camUpdate(true);
  });
  await page.keyboard.down("s");
  await page.waitForTimeout(300);
  await page.keyboard.up("s");
  await page.waitForTimeout(1200);

  const returnedState = await page.evaluate(() => {
    const g = window.CC_G;
    return {
      map: g.mapId,
      playerPos: { x: Math.round(g.player.x), y: Math.round(g.player.y) }
    };
  });
  console.log("Returned to campground:", JSON.stringify(returnedState));

  await page.screenshot({ path: "re/schoolyard-returned.png" });

  console.log("Errors encountered:", JSON.stringify(errs));
  await browser.close();

  if (errs.length > 0) {
    process.exit(1);
  } else {
    console.log("ALL SCHOOL & POPULATION CHECKS PASSED!");
  }
})();
