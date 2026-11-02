/* Mechanics sweep: every door in every room, the toys, and the small gadgets.
   node serve.js  then  node mechaniccheck.js  */
const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const results = [];
const ok = (name, pass, extra) => {
  results.push({ name, pass });
  console.log((pass ? "PASS " : "FAIL ") + name + (extra !== undefined ? "  " + JSON.stringify(extra) : ""));
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });

  await p.goto("http://127.0.0.1:8901/index.html", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById("enter").click());

  const ready = async (map) => {
    await p.waitForFunction((m) => window.CC_G && CC_G.ready && CC_G.mapId === m, map, { timeout: 25000 });
    await p.waitForTimeout(250);
  };
  const go = async (map, x, y) => {
    await p.evaluate(([m, x, y]) => window.ccGoto(m, x, y), [map, x, y]);
    await ready(map);
  };

  await ready("default");

  // ---------- every door in every room ----------
  const maps = await p.evaluate(() => Object.keys(CC.MAP_DEFAULTS));
  let doorTotal = 0, doorPass = 0;
  for (const map of maps) {
    if (map === "default") continue; // covered by doorcheck.js
    await go(map);
    const doors = await p.evaluate(() => CC_G.objs.filter((o) => o instanceof CC_O.Door).map((o, i) => ({ i, to: o.def.to, x: o.def.x, y: o.def.y })));
    for (const d of doors) {
      if (!d.to) continue;
      doorTotal++;
      await go(map);
      const dest = await p.evaluate(([x, y]) => {
        const g = CC_G;
        const door = g.objs.find((o) => o instanceof CC_O.Door && Math.abs(o.def.x - x) < 2 && Math.abs(o.def.y - y) < 2);
        if (!door) return null;
        g.interact(door, door.def.x, door.def.y);
        return door.def.to;
      }, [d.x, d.y]);
      await ready(dest || map).catch(() => {});
      const now = await p.evaluate(() => CC_G.mapId);
      const pass = now === d.to;
      if (pass) doorPass++;
      ok(`${map} door -> ${d.to}`, pass, pass ? undefined : { map: now });
    }
  }
  ok("all interior doors work", doorPass === doorTotal, { doorPass, doorTotal });

  // ---------- toys ----------
  await go("default");
  const toys = await p.evaluate(() => {
    const g = CC_G;
    const out = {};
    const vb = g.objs.find((o) => o instanceof CC_O.Volleyball);
    if (vb) { g.player.setPos(vb.x - 60, vb.y); g.interact(vb, vb.x - 12, vb.y); out.volley = { vx: Math.round(vb.vx), vz: Math.round(vb.vz3d) }; }
    const tb = g.objs.find((o) => o instanceof CC_O.TetherBall);
    if (tb) { const before = tb.avel; g.interact(tb, tb.x - 10, tb.y); out.tether = { avel: +(tb.avel - before).toFixed(2) }; }
    const sw = g.objs.find((o) => o instanceof CC_O.Seesaw);
    if (sw) { const before = sw.target; g.interact(sw, sw.def.x, sw.def.y); out.seesaw = { before, after: sw.target }; }
    return out;
  });
  ok("volleyball spikes", !!toys.volley && Math.abs(toys.volley.vx) + toys.volley.vz > 100, toys.volley);
  ok("tetherball spins", !!toys.tether && Math.abs(toys.tether.avel) > 0.5, toys.tether);
  ok("seesaw tips", !!toys.seesaw && toys.seesaw.before !== toys.seesaw.after, toys.seesaw);

  // ---------- campfire / plants / metal detector / piano ----------
  await go("default");
  const gadgets = await p.evaluate(() => {
    const g = CC_G;
    const out = {};
    const plant = g.objs.find((o) => o.def && o.def.type === "plant");
    if (plant) { g.player.held = "watercan"; g.interact(plant, plant.def.x, plant.def.y); out.plant = { watered: !!plant.watered, count: plant.count }; }
    const md = g.objs.find((o) => o.def && o.def.type === "metalDetector");
    if (md) { g.interact(md, md.def.x, md.def.y); out.metal = { active: !!md.active }; }
    return out;
  });
  ok("watering a plant", !!gadgets.plant && (gadgets.plant.watered || gadgets.plant.count > 0), gadgets.plant);
  ok("metal detector present", !!gadgets.metal, gadgets.metal);

  await go("house-cafeteria");
  const gadget = await p.evaluate(() => {
    const g = CC_G;
    const ob = g.objs.find((o) => o.action === "gadget");
    if (!ob) return null;
    g.interact(ob, ob.def.x, ob.def.y);
    return { action: ob.action, toast: ob.gdef && ob.gdef.toast };
  });
  ok("room gadget answers a click", !!gadget, gadget);

  console.log("errors:", JSON.stringify(errs));
  const passed = results.filter((r) => r.pass).length;
  console.log("SUMMARY " + passed + "/" + results.length);
  await ctx.close();
  await b.close();
})();
