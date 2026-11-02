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

  const r = await p.evaluate(async () => {
    const g = window.CC_G;
    const out = {};

    // 1) which solid objects overlap each door rect? (could shadow the door in pick())
    const overlaps = [];
    g.objs.filter(o => o instanceof window.CC_O.Door).forEach(d => {
      const dw = Math.min(d.w, 340), dh = Math.min(d.h, 340);
      const box = { x: d.def.x - dw / 2, y: d.def.y - dh / 2, w: dw, h: dh };
      g.objs.forEach(o => {
        if (o === d) return;
        if (!o.hit) return;
        const dz = o.z ? o.z() : 0;
        if (dz < d.z()) return; // door z=1 must beat it
        const oz = dz;
        // sample the door rect corners+center with the OTHER object's hit
        const pts = [
          [box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h],
          [box.x + box.w, box.y + box.h], [box.x + box.w / 2, box.y + box.h / 2]
        ];
        let hit = null;
        for (const [px, py] of pts) { if (o.hit(px, py)) { hit = [px, py]; break; } }
        if (hit) overlaps.push({ at: "(" + Math.round(d.def.x) + "," + Math.round(d.def.y) + ")", other: (o.constructor && o.constructor.name) + " oz=" + oz + " " + (o.def && o.def.to ? "to=" + o.def.to : "") });
      });
    });
    out.doorShadows = overlaps;

    // 2) direct click on the tent door while player stands far away -> should open
    out.tentBefore = g.mapId;
    await g.load("default", 4700, 2600);
    await new Promise(res => setTimeout(res, 300));
    g.player.x = 4900; g.player.y = 2700; g.cam.x = 4900 - 640; g.cam.y = 2700 - 400;
    const th = g.pick(5270, 2860);
    out.tentPick = th ? (th.constructor.name + " to=" + (th.def && th.def.to)) : null;
    // click via the real path: screen coords of door world pos
    const sx = 5270 - g.cam.x, sy = 2860 - g.cam.y;
    window.__clickDoor = { sx, sy };
    return out;
  });
  const cd = await p.evaluate(() => window.__clickDoor);
  await p.mouse.click(cd.sx, cd.sy);
  await p.waitForTimeout(1200);
  const after = await p.evaluate(() => ({ map: window.CC_G.mapId, toast: document.getElementById("toast").textContent }));
  console.log("DOOR-SHADOWS:", JSON.stringify(r.doorShadows));
  console.log("TENT-PICK:", JSON.stringify(r.tentPick));
  console.log("CLICK-TENT-DOOR:", JSON.stringify(after));

  // 3) chair click while standing near the house-main door must NOT open the door
  const r2 = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("house-main", 700, 600);
    await new Promise(res => setTimeout(res, 300));
    g.player.x = 900; g.player.y = 420; g.cam.x = 900 - 640; g.cam.y = 420 - 400;
    // chair at 905,425 is right by the player; door to default at 771,586
    const before = g.mapId;
    // click the CHAIR (screen coords)
    const sx = 905 - g.cam.x, sy = 425 - g.cam.y;
    window.__clickChair = { sx, sy, before };
    return { pickChair: (g.pick(905, 425) || {}).constructor && g.pick(905, 425).constructor.name };
  });
  const cc = await p.evaluate(() => window.__clickChair);
  await p.mouse.click(cc.sx, cc.sy);
  await p.waitForTimeout(600);
  const after2 = await p.evaluate(() => ({ map: window.CC_G.mapId, sitting: !!(window.CC_G.player && window.CC_G.player.sitting) }));
  console.log("CHAIR-PICK:", JSON.stringify(r2));
  console.log("CLICK-CHAIR:", JSON.stringify(after2));

  // 4) telescope exit area clickable
  const r3 = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("telescope", 700, 500);
    await new Promise(res => setTimeout(res, 300));
    const ea = g.objs.filter(o => o instanceof window.CC_O.ExitArea)[0];
    return { ea: !!ea, pickable: ea ? typeof ea.hit === "function" && g.pick(855, 540) === ea : null };
  });
  console.log("EXIT-AREA:", JSON.stringify(r3));

  // 5) treehouse trapdoor clickable to default
  const r4 = await p.evaluate(async () => {
    const g = window.CC_G;
    await g.load("treehouse", 500, 500);
    await new Promise(res => setTimeout(res, 300));
    const td = g.objs.filter(o => o.action === "trapdoor")[0];
    return { trapdoorAction: !!td, dest: td ? (td.tdest && td.tdest.to) : null,
             pickAt: td ? (g.pick(td.def.x, td.def.y) === td) : false };
  });
  console.log("TRAPDOOR:", JSON.stringify(r4));

  console.log("ERRORS:", JSON.stringify(errors));
  await b.close();
})();
