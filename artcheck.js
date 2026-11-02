/* Verify village-art.js migration: new sprites + wayfinding signs render
   and are pickable/interactive, with no page errors. */
const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(900);
  await p.click("#enter");
  await p.waitForTimeout(1600);

  // 1) global wiring checks
  const wiring = await p.evaluate(() => ({
    hasVWaySign: !!(window.CC_V && window.CC_V.VWaySign),
    spriteArt: !!(window.CC_V && window.CC_V.VillageWoman &&
      (new window.CC_V.VillageWoman(null, 0, 0, 0).sprite instanceof HTMLCanvasElement)),
    signsInZone: !!(window.CC_G && window.CC_G.village && window.CC_G.village.signs &&
      window.CC_G.village.signs.map(s => Math.round(s.x) + "," + Math.round(s.y))),
    portraitOnWoman: !!(window.CC_G && window.CC_G.village && window.CC_G.village.women[0].portrait)
  }));
  console.log("WIRING:", JSON.stringify(wiring));

  // 2) walk west approach: view each sign
  const spots = [{ x: 5720, y: 2000 }, { x: 5900, y: 2060 }, { x: 6140, y: 2100 }];
  for (let i = 0; i < spots.length; i++) {
    await p.evaluate((pt) => {
      const g = window.CC_G;
      g.player.x = pt.x; g.player.y = pt.y;
      g.cam.x = pt.x - 640; g.cam.y = pt.y - 400;
    }, spots[i]);
    await p.waitForTimeout(500);
    await p.screenshot({ path: "re/art-sign-" + i + ".png" });
  }

  // 3) pick a sign (must resolve to VWaySign, not a woman/cat)
  const pickSign = await p.evaluate(() => {
    const g = window.CC_G;
    const s = g.village.signs[0];
    const hit = g.pick(s.x, s.y);
    return { isSign: hit instanceof window.CC_V.VWaySign, name: hit && hit.constructor.name };
  });
  console.log("PICK-SIGN:", JSON.stringify(pickSign));

  // 4) interact -> toast + hint timer + play
  const interactRes = await p.evaluate(() => {
    const g = window.CC_G;
    const s = g.village.signs[0];
    g.interact(s, s.x, s.y);
    return {
      hintUntil: s.hintUntil > performance.now(),
      toast: document.getElementById("toast") ? document.getElementById("toast").textContent : null
    };
  });
  console.log("INTERACT-SIGN:", JSON.stringify(interactRes));
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/art-sign-hint.png" });

  // 5) women still talk (portrait from new art, sprite render ok)
  const talkRes = await p.evaluate(() => {
    const g = window.CC_G;
    window.VUI.talkTo(g.village.women[0]);
    const b = document.getElementById("v-bubble");
    return {
      visible: b.style.display !== "none",
      name: document.getElementById("v-b-name").textContent,
      hasAvatar: !!document.querySelector("#v-b-av img, #v-b-av canvas")
    };
  });
  console.log("TALK:", JSON.stringify(talkRes));
  await p.waitForTimeout(400);
  await p.screenshot({ path: "re/art-woman-chat.png" });

  // 6) village scene with new sprites at the mat
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 6190; g.player.y = 2040;
    g.cam.x = 6190 - 640; g.cam.y = 2040 - 400;
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: "re/art-scene.png" });

  console.log("ERRORS:", JSON.stringify(errors));
  await b.close();
})();