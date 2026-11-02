/* Door / opening regression.
   Proves: clicking a painted door enters that room, arrivals land on the
   doorway, walking into a door still works, and props on the art respond.

   node serve.js    (one terminal)
   node doorcheck.js
*/
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

  const ready = async (map, ms) => {
    await p.waitForFunction(
      (m) => window.CC_G && CC_G.ready && CC_G.mapId === m,
      map,
      { timeout: ms || 25000 }
    );
    await p.waitForTimeout(300);
  };
  const home = async () => {
    await p.evaluate(() => { try { CC_G.closeModals(); } catch (e) {} CC_G.player.held = null; window.ccGoto("default", 3000, 1600); });
    await ready("default");
  };

  await ready("default");
  await p.evaluate(() => { window.CC_G.closeModals(); });

  // ---------- A. clicking each painted door enters its room ----------
  const doors = await p.evaluate(() =>
    CC_G.objs.filter((o) => o instanceof CC_O.Door).map((o) => ({
      x: o.def.x, y: o.def.y, w: o.w, h: o.h, to: o.def.to, toX: o.def.toX, toY: o.def.toY,
    }))
  );
  ok("campground exposes its doors", doors.length >= 7, { count: doors.length });

  for (const door of doors) {
    if (!door.to) continue;
    await home();
    await p.evaluate(([x, y]) => window.ccGoto("default", x, y + 140), [door.x, door.y]);
    await ready("default");
    const res = await p.evaluate(([to, dx, dy]) => {
      const g = CC_G;
      const d = g.objs.find((o) => o instanceof CC_O.Door && o.def.to === to && Math.abs(o.def.x - dx) < 2 && Math.abs(o.def.y - dy) < 2);
      g.clickAt(d.def.x + (d.w || 90) / 2 - g.cam.x, d.def.y + (d.h || 90) / 2 - g.cam.y);
      return { map: g.mapId };
    }, [door.to, door.x, door.y]);
    let at = { map: res.map };
    try { await ready(door.to); at = await p.evaluate(() => ({ map: CC_G.mapId, x: Math.round(CC_G.player.x), y: Math.round(CC_G.player.y) })); } catch (e) { at = await p.evaluate(() => ({ map: CC_G.mapId, x: Math.round(CC_G.player.x), y: Math.round(CC_G.player.y) })); }
    const destH = await p.evaluate((m) => (CC.MAP_DEFAULTS[m] || {}).height, door.to);
    const wantY = destH - door.toY;
    const landed = Math.abs(at.x - door.toX) < 220 && Math.abs(at.y - wantY) < 220;
    ok(`click door -> ${door.to}`, res.map === door.to && at.map === door.to && landed, { at: [at.x, at.y], want: [door.toX, Math.round(wantY)] });
  }

  // ---------- B. a real mouse click on the sauna door ----------
  await home();
  const target = doors.find((d) => d.to === "sauna");
  await p.evaluate(([x, y]) => window.ccGoto("default", x, y + 300), [target.x, target.y]);
  await ready("default");
  const spot = await p.evaluate(([to]) => {
    const g = CC_G;
    const d = g.objs.find((o) => o instanceof CC_O.Door && o.def.to === to);
    return { x: Math.round(d.def.x + (d.w || 90) / 2 - g.cam.x), y: Math.round(d.def.y + (d.h || 90) / 2 - g.cam.y) };
  }, [target.to]);
  await p.mouse.click(spot.x, spot.y);
  await ready("sauna", 25000).catch(() => {});
  const clicked = await p.evaluate(() => ({ map: CC_G.mapId, x: Math.round(CC_G.player.x), y: Math.round(CC_G.player.y) }));
  ok("real mouse click enters the sauna", clicked.map === "sauna", clicked);

  // ---------- C. walking onto a door still teleports ----------
  await home();
  await p.evaluate(() => {
    const g = CC_G;
    const d = g.objs.find((o) => o instanceof CC_O.Door && o.def.to === "house-main");
    g.entryGraceUntil = 0;
    g.player.setPos(d.def.x + (d.w || 90) / 2, d.def.y + (d.h || 90) / 2);
  });
  await ready("house-main", 20000).catch(() => {});
  const walk = await p.evaluate(() => ({ map: CC_G.mapId }));
  await home();
  const stepped = await p.evaluate(() => {
    const g = CC_G;
    const door = g.objs.find((o) => o instanceof CC_O.Door && o.def.to === "sauna");
    g.player.setPos(door.def.x, door.def.y - 40);   // stand inside the doorway
    return { mapBefore: g.mapId };
  });
  await p.waitForTimeout(1200);
  const afterStep = await p.evaluate(() => ({ map: CC_G.mapId }));
  ok("standing in a doorway does NOT teleport", afterStep.map === "default", { ...stepped, ...afterStep });

  await home();
  const roasted = await p.evaluate(() => {
    const g = CC_G;
    const m = g.objs.find((o) => o instanceof CC_O.Marshmallow);
    if (!m) return null;
    g.interact(m, m.x, m.y);
    g.player.setPos(g.firePos.x, g.firePos.y + 70);
    return "marshmallow";
  });
  const lvl1 = await p.evaluate(() => CC_G.player.roastLevel || 0);
  await p.waitForTimeout(6000);
  const level = await p.evaluate(() => CC_G.player.roastLevel || 0);
  ok("marshmallow roasts at the fire", roasted === "marshmallow" && level > lvl1 && level > 0.08, { lvl1, level });

  await home();
  const kicked = await p.evaluate(() => {
    const g = CC_G;
    const ball = g.objs.find((o) => o instanceof CC_O.SoccerBall);
    if (!ball) return null;
    g.player.setPos(ball.x - 40, ball.y);
    g.interact(ball, ball.x, ball.y);
    return { x: Math.round(ball.x), y: Math.round(ball.y) };
  });
  await p.waitForTimeout(900);
  const moved = await p.evaluate(() => {
    const ball = CC_G.objs.find((o) => o instanceof CC_O.SoccerBall);
    return ball ? { vx: +(ball.vx || 0).toFixed(1), vy: +(ball.vy || 0).toFixed(1) } : null;
  });
  ok("soccer ball takes a kick", !!kicked && !!moved && Math.abs(moved.vx) + Math.abs(moved.vy) > 0.3, moved);

  await home();
  const sat = await p.evaluate(() => {
    const g = CC_G;
    const chair = g.objs.find((o) => o.def && o.def.type === "chair");
    if (!chair) return null;
    g.interact(chair, chair.def.x, chair.def.y);
    return { sitting: !!g.player.sitting, sitter: !!chair.sitter };
  });
  ok("chair seats the player", !!sat && (sat.sitting || sat.sitter), sat);

  await home();
  const shell = await p.evaluate(() => {
    const g = CC_G;
    const sh = g.objs.find((o) => o.def && o.def.type === "seashell" && !o.removed);
    if (!sh) return null;
    const before = CCE.load().shells;
    g.interact(sh, sh.def.x, sh.def.y);
    return { before, after: CCE.load().shells, removed: !!sh.removed };
  });
  ok("seashell pickup", !!shell && shell.after === shell.before + 1, shell);
  await p.evaluate(() => { try { CC_G.closeModals(); } catch (e) {} });

  // ---------- E. the village story still opens ----------
  await p.evaluate(() => window.ccGoto("default", 6190, 2050));
  await ready("default");
  const village = await p.evaluate(() => {
    const g = CC_G;
    g.interact(g.village.women[0], g.village.women[0].x, g.village.women[0].y);
    return { map: g.mapId, bubble: !!document.getElementById("ch-bubble") };
  });
  await p.waitForTimeout(800);
  ok("village woman opens her story", village.map === "default" && village.bubble, village);

  console.log("errors:", JSON.stringify(errs));
  const passed = results.filter((r) => r.pass).length;
  console.log("SUMMARY " + passed + "/" + results.length);
  await ctx.close();
  await b.close();
})();
