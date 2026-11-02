const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  p.on("response", (r) => { if (r.status() >= 400) errors.push("HTTP " + r.status() + " " + r.url()); });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(900);
  await p.click("#enter");
  await p.waitForTimeout(1500);

  // A) telescope: exit opening is pickable and clicking it warps out
  const A = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("telescope", 500, 500);
    await new Promise(r => setTimeout(r, 400));
    const ea = g.objs.filter(o => o instanceof window.CC_O.ExitArea)[0];
    const def = ea && { x: ea.def.x, y: ea.def.y, r: ea.radius };
    const picked = ea ? g.pick(def.x, def.y) === ea : false;
    // aim a click at the opening centre on screen
    g.player.x = def.x; g.player.y = def.y; g.cam.x = def.x - 640; g.cam.y = def.y - 400;
    return { def, picked, sx: def.x - g.cam.x, sy: def.y - g.cam.y };
  });
  await p.mouse.click(A.sx, A.sy);
  await p.waitForTimeout(1200);
  const A2 = await p.evaluate(() => window.CC_G.mapId);
  console.log("EXITAREA def:", JSON.stringify(A.def), "pickable:", A.picked, "-> click maps to:", A2);

  // B) treehouse trapdoor: hatch is a Door to default, lever is clickable
  const B = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("treehouse", 500, 300);
    await new Promise(r => setTimeout(r, 400));
    const hatch = g.objs.filter(o => o instanceof window.CC_O.Door && o.def.to === "default" && o.def.noArt)[0];
    const lever = g.objs.filter(o => o.action === "trapdoor")[0];
    return {
      hatchPresent: !!hatch, hatchTo: hatch && hatch.def.to,
      hatchPick: hatch ? g.pick(hatch.def.x, hatch.def.y) === hatch : false,
      leverPresent: !!lever, leverPick: lever ? g.pick(lever.def.x, lever.def.y) === lever : false,
      leverDest: lever && lever.tdest && lever.tdest.to
    };
  });
  console.log("TRAPDOOR:", JSON.stringify(B));
  // click the lever -> should warp to default
  // (teleport the player onto the lever, let the camera follow/settle, then
  //  click at the lever's live screen position so the drag-to-walk camera
  //  doesn't race the forced cam)
  await p.evaluate(() => {
    const g = window.CC_G, lv = g.objs.filter(o => o.action === "trapdoor")[0];
    g.player.x = lv.def.x; g.player.y = lv.def.y; g.cam.x = lv.def.x - 640; g.cam.y = lv.def.y - 400;
  });
  await p.waitForTimeout(250);
  const BL = await p.evaluate(() => {
    const g = window.CC_G, lv = g.objs.filter(o => o.action === "trapdoor")[0];
    return { sx: lv.def.x - g.cam.x, sy: lv.def.y - g.cam.y };
  });
  await p.mouse.click(BL.sx, BL.sy);
  await p.waitForTimeout(1200);
  console.log("CLICK-LEVER maps to:", await p.evaluate(() => window.CC_G.mapId));

  // C) prove a door no longer opens when you click a chair next to it
  await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("house-main", 800, 480);
    await new Promise(r => setTimeout(r, 700));
    const chair = g.objs.filter(o => o instanceof window.CC_O.Chair)[0];
    g.player.x = chair.def.x; g.player.y = chair.def.y + 40;
    g.cam.x = chair.def.x - 640; g.cam.y = chair.def.y + 40 - 400;
  });
  await p.waitForTimeout(250);
  const C = await p.evaluate(() => {
    const g = window.CC_G, chair = g.objs.filter(o => o instanceof window.CC_O.Chair)[0];
    return { sx: chair.def.x - g.cam.x, sy: chair.def.y - g.cam.y, before: g.mapId };
  });
  await p.mouse.click(C.sx, C.sy);
  await p.waitForTimeout(700);
  // use the persistent sit counter (player.sitting is cleared by drag-to-walk right after)
  const C2 = await p.evaluate(() => ({ map: window.CC_G.mapId, sits: window.CCE.load().sits }));
  console.log("CLICK-CHAIR stays on map:", C2.map === C.before, "sits:", C2.sits);

  // D) doors still clickable (tent) from anywhere
  const D = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("default", 4700, 2600);
    await new Promise(r => setTimeout(r, 400));
    const dr = g.objs.filter(o => o instanceof window.CC_O.Door && o.def.to === "tent")[0];
    g.player.x = 4900; g.player.y = 2700; g.cam.x = 4900 - 640; g.cam.y = 2700 - 400;
    return { sx: dr.def.x - g.cam.x, sy: dr.def.y - g.cam.y };
  });
  await p.mouse.click(D.sx, D.sy);
  await p.waitForTimeout(1200);
  console.log("CLICK-DOOR maps to:", await p.evaluate(() => window.CC_G.mapId));

  // E) locked door still says locked
  const E = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("house-main", 1100, 400);
    await new Promise(r => setTimeout(r, 400));
    const lk = g.objs.filter(o => o instanceof window.CC_O.Door && !o.def.to)[0];
    g.player.x = 1150; g.player.y = 420; g.cam.x = 1150 - 640; g.cam.y = 420 - 400;
    return { present: !!lk, sx: lk.def.x - g.cam.x, sy: lk.def.y - g.cam.y };
  });
  await p.mouse.click(E.sx, E.sy);
  await p.waitForTimeout(500);
  console.log("LOCKED-DOOR:", E.present, "toast:", JSON.stringify(await p.evaluate(() => document.getElementById("toast").textContent)));

  console.log("ERRORS:", JSON.stringify(errors));
  await b.close();
})();
