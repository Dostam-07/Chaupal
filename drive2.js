const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errs = [], missing = [];
  p.on("pageerror", e => errs.push("PAGEERR " + e.message.slice(0, 180)));
  p.on("response", r => { if (r.status() >= 400) missing.push(r.status() + " " + r.url().replace("http://127.0.0.1:8901", "")); });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1200);
  await p.click("#enter");
  await p.waitForTimeout(1500);

  // 1. enumerate objects near spawn with def.type, and what's clickable near player
  const near = await p.evaluate(() => {
    const g = window.CC_G, px = g.player.x, py = g.player.y;
    const list = (g.objs || []).filter(o => o.def && o.def.x != null && o.hit && Math.abs(o.def.x - px) < 600 && Math.abs(o.def.y - py) < 500)
      .map(o => ({ t: o.def.type, x: Math.round(o.def.x), y: Math.round(o.def.y) }));
    return { px: Math.round(px), py: Math.round(py), near: list, total: g.objs.length };
  });
  console.log("NEAR:", JSON.stringify(near));

  // 2. click a seashell if any in default map
  const shellClick = await p.evaluate(async () => {
    const g = window.CC_G;
    const sh = (g.objs || []).find(o => o instanceof window.CC_O.Seashell && !o.removed);
    if (!sh) return { ok: false, why: "no seashell" };
    const before = window.CCE.load().shellCount || 0;
    g.clickAt(sh.def.x - g.cam.x, sh.def.y - g.cam.y);
    await new Promise(res => setTimeout(res, 400));
    const after = window.CCE.load().shellCount || 0;
    return { ok: true, shellAt: { x: Math.round(sh.def.x), y: Math.round(sh.def.y) }, before, after, removed: sh.removed };
  });
  console.log("SHELL:", JSON.stringify(shellClick));

  // 3. kick soccer ball through game.interact
  const soccer = await p.evaluate(() => {
    const g = window.CC_G;
    const sb = (g.objs || []).find(o => o.def && (o.def.type === "soccerBall" || o.def.type === "volleyball" || o.def.type === "tetherball"));
    if (!sb) return { ok: false, why: "no ball" };
    const hasInteract = typeof g.interact === "function";
    g.interact(sb, sb.def.x, sb.def.y);
    return { ok: hasInteract, t: sb.def.type, before: { x: Math.round(sb.x || 0), y: Math.round(sb.y || 0), vx: sb.vx, vy: sb.vy } };
  });
  console.log("SOCCER:", JSON.stringify(soccer));

  // 4. sit in a chair
  const chair = await p.evaluate(async () => {
    const g = window.CC_G;
    const c = (g.objs || []).find(o => o instanceof window.CC_O.Chair);
    if (!c) return { ok: false, why: "no chair" };
    g.clickAt(c.def.x - g.cam.x, c.def.y - g.cam.y);
    await new Promise(res => setTimeout(res, 400));
    return { ok: true, sitting: !!g.player.sitting, playerAt: { x: Math.round(g.player.x), y: Math.round(g.player.y) } };
  });
  console.log("CHAIR:", JSON.stringify(chair));

  // 5. doors to houses: teleport onto a door that goes to a house, wait, check map
  const doorWalk = await p.evaluate(async () => {
    const g = window.CC_G;
    const doors = (g.objs || []).filter(o => o.def && (o.def.type === "door" || o.def.type === "lockedDoor"));
    const target = doors.find(d => /house/.test(d.def.to || "")) || doors[0];
    if (!target) return { ok: false, why: "no doors", n: doors.length };
    // walk onto the door
    g.player.setPos(target.def.x, target.def.y);
    g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
    const from = g.mapId;
    await new Promise(res => setTimeout(res, 1500));
    return { ok: true, doorTo: target.def.to, from, to: g.mapId };
  });
  console.log("DOOR:", JSON.stringify(doorWalk));

  // 6. audio state: howler instances actually loaded/playing
  const audio = await p.evaluate(async () => {
    const tryPlay = (name) => { try { window.CCAU.play(name, 0.5); return "called"; } catch (e) { return "ERR " + e.message.slice(0, 80); } };
    const r = { pop: tryPlay("pop"), pickup: tryPlay("pickup"), kick: tryPlay("soccer-kick") };
    await new Promise(res => setTimeout(res, 900));
    // howler keeps global _howls
    const howls = (window.Howl && window.Howl._howls) ? window.Howl._howls.map(h => ({ src: (h._src || [""])[0].split("/").pop(), state: h.state(), playing: h.playing() })) : [];
    r.howls = howls.slice(0, 12);
    r.mutedNow = window.CCAU.isMuted();
    return r;
  });
  console.log("AUDIO:", JSON.stringify(audio));

  // 7. rive framework alive?
  const rive = await p.evaluate(() => {
    return { hasRiveClass: !!window.rive, rivObs: window.CC_G.rivObs && window.CC_G.rivObs.length, riveLayer: !!document.getElementById("rive-layer"), canvases: document.querySelectorAll("canvas").length };
  });
  console.log("RIVE:", JSON.stringify(rive));

  console.log("ERRS:", JSON.stringify(errs.slice(0, 6)));
  console.log("MISSING:", JSON.stringify(missing.slice(0, 15)));
  await p.screenshot({ path: "re/drive2-state.png" });
  await b.close();
})();