/* Reproduce: (1) auto-interaction/glitch, (2) door not clickable. */
const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(900);
  await p.click("#enter");
  await p.waitForTimeout(1500);

  // put player near the village, stand still, and watch for ANY auto-trigger
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 5900; g.player.y = 2000;
    g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
  });
  await p.waitForTimeout(2500);
  const idle = await p.evaluate(() => ({
    toast: document.getElementById("toast") ? document.getElementById("toast").textContent : null,
    menuShown: document.getElementById("v-menu") ? document.getElementById("v-menu").style.display : null,
    bubbleShown: document.getElementById("v-bubble") ? document.getElementById("v-bubble").style.display : null,
    player: window.CC_G.player ? Math.round(window.CC_G.player.x) + "," + Math.round(window.CC_G.player.y) : null
  }));
  console.log("IDLE-NEAR-VILLAGE:", JSON.stringify(idle));

  // click on empty grass far from any object under cursor, then check what got triggered
  const click1 = await p.evaluate(() => {
    const g = window.CC_G;
    // a point with no object: pick it to confirm
    const w = { x: 5000, y: 1800 };
    const hit = g.pick(w.x, w.y);
    return { hitAt: hit ? (hit.name || hit.constructor.name) : null };
  });
  console.log("HIT-EMPTY:", JSON.stringify(click1));

  // now: stand next to a woman but CLICK on empty grass -> does the woman trigger?
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 6150; g.player.y = 2050;
    g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
  });
  await p.waitForTimeout(400);
  const before = await p.evaluate(() => ({
    toast: document.getElementById("toast").textContent,
    bubble: document.getElementById("v-bubble").style.display
  }));
  // click grass at screen (300, 500) -> world (940, 900) empty area
  await p.mouse.click(300, 500);
  await p.waitForTimeout(600);
  const after = await p.evaluate(() => ({
    toast: document.getElementById("toast").textContent,
    bubble: document.getElementById("v-bubble").style.display,
    player: Math.round(window.CC_G.player.x) + "," + Math.round(window.CC_G.player.y)
  }));
  console.log("CLICK-GRASS-NEAR-WOMAN:", JSON.stringify({ before, after }));

  // ---- door test: teleport near tent door and CLICK it ----
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 5100; g.player.y = 2820;
    g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
  });
  await p.waitForTimeout(500);
  const doorWorld = { x: 5270, y: 2860 }; // tent door
  // click at screen position of door
  await p.evaluate(([wx, wy]) => {
    window.__click = { sx: wx - window.CC_G.cam.x, sy: wy - window.CC_G.cam.y };
  }, [doorWorld.x, doorWorld.y]);
  const pos = await p.evaluate(() => window.__click);
  await p.mouse.click(pos.sx, pos.sy);
  await p.waitForTimeout(1200);
  const doorRes = await p.evaluate(() => ({
    map: window.CC_G.mapId,
    toast: document.getElementById("toast").textContent
  }));
  console.log("CLICK-DOOR:", JSON.stringify({ world: doorWorld, ...doorRes }));

  // what does pick() return AT the door?
  const doorPick = await p.evaluate(([wx, wy]) => {
    const g = window.CC_G;
    const hit = g.pick(wx, wy);
    return { hit: hit ? (hit.constructor.name + " " + JSON.stringify(hit.def && hit.def.to)) : null };
  }, [doorWorld.x, doorWorld.y]);
  console.log("PICK-AT-DOOR:", JSON.stringify(doorPick));

  // ---- door test 2: walking onto it (the original behavior) ----
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 5120; g.player.y = 2830;
    g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 5270; g.player.y = 2860; // step onto the door
  });
  await p.waitForTimeout(1200);
  const walkRes = await p.evaluate(() => ({ map: window.CC_G.mapId }));
  console.log("WALK-ONTO-DOOR:", JSON.stringify(walkRes));

  console.log("ERRORS:", JSON.stringify(errors));
  await b.close();
})();