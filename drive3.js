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

  // ---- doors: drive onto each default door, confirm map change, come back
  const doorReport = await p.evaluate(async () => {
    const g = window.CC_G;
    const doors = (g.objs || []).filter(o => o.def && (o.def.type === "door" || o.def.type === "lockedDoor"));
    const out = [];
    for (const d of doors) {
      const target = d.def.to;
      g.goTo("default", d.def.x, d.def.y);
      await new Promise(r => setTimeout(r, 700));
      g.player.setPos(d.def.x, d.def.y);
      g.cam.x = g.player.x - 640; g.cam.y = g.player.y - 400;
      await new Promise(r => setTimeout(r, 900));
      out.push({ doorTo: target, reached: g.mapId });
    }
    return out;
  });
  console.log("ALLDOORS:", JSON.stringify(doorReport));

  // ---- physics: soccer ball teleport + kick, sample motion
  const physics = await p.evaluate(async () => {
    const g = window.CC_G;
    g.goTo("default", 5316, 1008);
    await new Promise(r => setTimeout(r, 800));
    const sb = (g.objs || []).find(o => o.def && (o.def.type === "soccerBall" || o instanceof window.CC_O.SoccerBall));
    if (!sb) return { ok: false, why: "no ball after goto", objs: g.objs.length };
    const s0 = Math.round(sb.x) + "," + Math.round(sb.y);
    g.kick && g.kick(sb);
    g.player.setPos(sb.x, sb.y);
    const sample = [];
    for (let i = 0; i < 5; i++) { await new Promise(r => setTimeout(r, 350)); sample.push([Math.round(sb.x), Math.round(sb.y)]); }
    const vball = (g.objs || []).find(o => o instanceof window.CC_O.Volleyball);
    return { ok: true, ball: { s0, samples: sample, vx: Math.round(sb.vx), vy: Math.round(sb.vy) }, hasVolleyball: !!vball };
  });
  console.log("PHYS:", JSON.stringify(physics));

  // ---- sound: create Howls, inspect _howls + state after delay
  const audio = await p.evaluate(async () => {
    const r = {};
    ["pop", "pickup", "soccer-kick", "discovery", "flicker"].forEach(n => { try { window.CCAU.play(n, 0.5); } catch (e) { r[n] = "ERR " + e.message.slice(0, 60); } });
    await new Promise(res => setTimeout(res, 1500));
    const howls = (window.Howl && window.Howl._howls) ? window.Howl._howls.map(h => ({ src: (h._src || [""])[0].split("/").pop().replace(".mp3", ""), state: h.state(), playing: h.playing() })) : null;
    r.howls = howls;
    r.muted = window.CCAU.isMuted();
    return r;
  });
  console.log("AUDIO2:", JSON.stringify(audio));

  // ---- shells: correct field read
  const eco = await p.evaluate(() => {
    const s = window.CCE.load();
    return { shells: s.shells, collected: s.collectedShells.length, sits: s.sits };
  });
  console.log("ECO:", JSON.stringify(eco));

  // ---- screenshot spawn + soccer field + house-main door
  await p.evaluate(() => { const g = window.CC_G; g.goTo("default", 3000, 1600); return new Promise(r => setTimeout(r, 900)); });
  await p.screenshot({ path: "re/d3-spawn.png" });
  await p.evaluate(() => { const g = window.CC_G; g.goTo("default", 5316, 1008); return new Promise(r => setTimeout(r, 900)); });
  await p.screenshot({ path: "re/d3-soccer.png" });
  await p.evaluate(() => { const g = window.CC_G; g.goTo("default", 2560, 2260); return new Promise(r => setTimeout(r, 900)); });
  await p.screenshot({ path: "re/d3-house-door.png" });

  console.log("ERRS:", JSON.stringify(errs.slice(0, 8)));
  console.log("MISSING:", JSON.stringify([...new Set(missing)].slice(0, 12)));
  await b.close();
})();