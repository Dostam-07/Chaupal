const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("=== Testing Bustling Classrooms: Teachers & Students ===");

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  page.on("pageerror", (err) => {
    console.error("PAGE_ERROR:", err.message);
    errors.push(err.message);
  });

  await page.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.click("#enter");
  await page.waitForTimeout(600);

  const artDir = "C:/Users/dosta/.gemini/antigravity/brain/ba1f2c4b-9687-490c-9789-1452e6cee6b3";

  // 2. Warp to Schoolyard on default map
  await page.evaluate(() => {
    if (window.CC_G) {
      window.CC_G.player.x = 6380;
      window.CC_G.player.y = 1680;
    }
  });
  await page.waitForTimeout(600);

  // Verify outdoor schoolyard population
  const outdoorInfo = await page.evaluate(() => {
    const sc = window.CC_G && window.CC_G.school;
    return {
      hasTeacher: !!(sc && sc.teacher),
      hasMasterji: !!(sc && sc.masterji),
      studentCount: sc && sc.students ? sc.students.length : 0,
      hasBell: !!(sc && sc.bell),
      hasBoard: !!(sc && sc.board)
    };
  });
  console.log("Outdoor Schoolyard Status:", outdoorInfo);
  if (!outdoorInfo.hasTeacher || !outdoorInfo.hasMasterji || outdoorInfo.studentCount < 10) {
    errors.push("Outdoor schoolyard missing teachers or students: " + JSON.stringify(outdoorInfo));
  }

  // Ring outdoor bell
  await page.evaluate(() => {
    if (window.CC_G && window.CC_G.school && window.CC_G.school.bell) {
      window.CC_G.school.bell.ring();
    }
  });
  await page.waitForTimeout(500);

  const outdoorScreen = path.join(artDir, "ui-schoolyard-bustling.png");
  await page.screenshot({ path: outdoorScreen, timeout: 8000 });
  console.log("📸 Captured ui-schoolyard-bustling.png");

  // 3. Warp into Indoor Classroom
  console.log("Entering indoor classroom...");
  await page.evaluate(() => {
    if (window.CC_G) {
      window.CC_G.goTo("school", 860, 650);
      window.CC_G.camUpdate(true);
    }
  });
  await page.waitForTimeout(1200);

  // Position player in center of classroom
  await page.evaluate(() => {
    if (window.CC_G && window.CC_G.player) {
      window.CC_G.player.x = 860;
      window.CC_G.player.y = 550;
      window.CC_G.cam.x = 860 - 640;
      window.CC_G.cam.y = 520 - 360;
      window.CC_G.camUpdate(true);
    }
  });
  await page.waitForTimeout(600);

  // Verify indoor classroom population
  const indoorInfo = await page.evaluate(() => {
    const sc = window.CC_G && window.CC_G.school;
    return {
      mapId: window.CC_G.mapId,
      teacherName: sc && sc.teacher ? sc.teacher.name : null,
      masterjiName: sc && sc.masterji ? sc.masterji.name : null,
      studentCount: sc && sc.students ? sc.students.length : 0,
      students: sc && sc.students ? sc.students.map(s => s.name) : [],
      hasGlobe: !!(sc && sc.globe),
      hasMicroscope: !!(sc && sc.microscope),
      hasBookshelf: !!(sc && sc.bookshelf),
      hasMatka: !!(sc && sc.matka),
      hasBell: !!(sc && sc.bell),
      hasBoard: !!(sc && sc.board)
    };
  });
  console.log("Indoor Classroom Status:", indoorInfo);
  if (indoorInfo.studentCount < 14 || !indoorInfo.teacherName || !indoorInfo.masterjiName) {
    errors.push("Indoor classroom population incomplete: " + JSON.stringify(indoorInfo));
  }

  const indoorScreen = path.join(artDir, "ui-classroom-bustling.png");
  await page.screenshot({ path: indoorScreen, timeout: 8000 });
  console.log("📸 Captured ui-classroom-bustling.png");

  // 4. Test Interaction with Student Priya
  console.log("Interacting with Student Priya...");
  await page.evaluate(() => {
    const sc = window.CC_G.school;
    const priya = sc.students.find(s => s.name === "Priya");
    if (priya) priya.talk();
  });
  await page.waitForTimeout(800);

  const dialogText = await page.evaluate(() => {
    const el = document.getElementById("sc-body");
    const name = document.getElementById("sc-name");
    return { name: name ? name.textContent : "", body: el ? el.textContent : "" };
  });
  console.log("Student Dialog Opened:", dialogText);
  if (!dialogText.name.includes("Priya")) {
    errors.push("Expected Priya dialog but got: " + JSON.stringify(dialogText));
  }

  const studentDialogScreen = path.join(artDir, "ui-student-dialog.png");
  await page.screenshot({ path: studentDialogScreen, timeout: 8000 });
  console.log("📸 Captured ui-student-dialog.png");

  // Click "Give Encouragement"
  const encourageBtn = await page.$(".sc-btn:has-text('Encouragement')");
  if (encourageBtn) {
    await encourageBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  // Close dialog
  await page.evaluate(() => {
    if (window.CC_G.school) window.CC_G.school.closeDialog();
  });
  await page.waitForTimeout(400);

  // 5. Test Interaction with Masterji Ramchandra
  console.log("Interacting with Masterji Ramchandra...");
  await page.evaluate(() => {
    const sc = window.CC_G.school;
    if (sc.masterji) sc.masterji.talk();
  });
  await page.waitForTimeout(800);

  const masterjiText = await page.evaluate(() => {
    const name = document.getElementById("sc-name");
    return name ? name.textContent : "";
  });
  console.log("Masterji Dialog Opened:", masterjiText);
  if (!masterjiText.includes("Masterji")) {
    errors.push("Expected Masterji dialog but got: " + masterjiText);
  }

  // Click "Learn Speed Math"
  const speedMathBtn = await page.$(".sc-btn:has-text('Speed Math')");
  if (speedMathBtn) {
    await speedMathBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  const masterjiScreen = path.join(artDir, "ui-masterji-dialog.png");
  await page.screenshot({ path: masterjiScreen, timeout: 8000 });
  console.log("📸 Captured ui-masterji-dialog.png");

  // Close dialog
  await page.evaluate(() => {
    if (window.CC_G.school) window.CC_G.school.closeDialog();
  });
  await page.waitForTimeout(400);

  // 6. Test Interactive Pop Quiz with Meena Didi
  console.log("Taking Pop Quiz with Meena Didi...");
  await page.evaluate(() => {
    const sc = window.CC_G.school;
    if (sc.teacher) sc.teacher.talk();
  });
  await page.waitForTimeout(600);

  const quizBtn = await page.$(".sc-btn:has-text('Quiz')");
  if (quizBtn) {
    await quizBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  // Click the first quiz answer option
  const optBtn = await page.$(".sc-opt-btn");
  if (optBtn) {
    await optBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  const quizScreen = path.join(artDir, "ui-classroom-quiz.png");
  await page.screenshot({ path: quizScreen, timeout: 8000 });
  console.log("📸 Captured ui-classroom-quiz.png");

  // Close dialog
  await page.evaluate(() => {
    if (window.CC_G.school) window.CC_G.school.closeDialog();
  });
  await page.waitForTimeout(400);

  // 7. Test Interactive Classroom Objects
  console.log("Testing Classroom Objects (Globe, Bell, Microscope, Matka)...");
  await page.evaluate(() => {
    const sc = window.CC_G.school;
    if (sc.globe) sc.globe.interact();
    if (sc.microscope) sc.microscope.interact();
    if (sc.matka) sc.matka.interact();
    if (sc.bell) sc.bell.ring();
  });
  await page.waitForTimeout(1000);

  // Verify all students raised hands on bell ring
  const handsRaisedCount = await page.evaluate(() => {
    const sc = window.CC_G.school;
    return sc.students.filter(s => s.handRaised).length;
  });
  console.log("Students raising hands on bell ring:", handsRaisedCount, "out of", indoorInfo.studentCount);
  if (handsRaisedCount < 10) {
    errors.push("Expected majority of students to raise hands on bell ring, got: " + handsRaisedCount);
  }

  await browser.close();

  console.log("\nErrors count:", errors.length);
  if (errors.length > 0) {
    console.error("FAILURES:", errors);
    process.exit(1);
  } else {
    console.log("ALL CLASSROOM & STUDENT TESTS PASSED WITH 0 ERRORS!");
    process.exit(0);
  }
})();
