const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errs = [], logs = [], missing = [];
  p.on("pageerror", e => errs.push("PAGEERR " + e.message.slice(0, 160)));
  p.on("console", m => { const t = m.text(); if (m.type() === "error" || m.type() === "warning") logs.push(m.type() + ": " + t.slice(0, 200)); });
  p.on("response", r => { if (r.status() >= 400) missing.push(r.status() + " " + r.url().replace("http://127.0.0.1:8901", "")); });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.click("#enter");
  await p.waitForTimeout(1800);

  const st = await p.evaluate(() => {
    const g = window.CC_G;
    return {
      entered: g.entered, paused: g.paused,
      map: g.mapId, cam: g.cam && { x: Math.round(g.cam.x), y: Math.round(g.cam.y) },
      player: g.player && { x: Math.round(g.player.x), y: Math.round(g.player.y) },
      objs: g.objs && g.objs.length, rivalive: g.rivObs && g.rivObs.length,
      tilesCached: g.tmap && Object.keys(g.tmap.cache || {}).length,
      howl: !!window.Howl, muted: g.isMuted ? g.isMuted() : undefined,
      audioBtn: document.getElementById("audio-icon") && document.getElementById("audio-icon").textContent,
      pointerLock: !!document.pointerLockElement,
      soundOn: window.CCAU && !window.CCAU.isMuted(),
    };
  });
  console.log("STATE1:", JSON.stringify(st));

  // ---- try to kick a soccer ball if near; else walk to stadium area ----
  const kicked = await p.evaluate(() => {
    const g = window.CCG || window.CC_G;
    const sb = (g.objs || []).find(o => o.type === "soccerBall");
    if (!sb) return { ok: false, why: "no soccerBall obj" };
    const before = { x: sb.x, y: sb.y, vx: sb.vx, vy: sb.vy };
    sb.vx = 30; sb.vy = -20;
    return { ok: true, type: sb.type, before, after: { x: Math.round(sb.x), y: Math.round(sb.y), vx: sb.vx, vy: sb.vy } };
  });
  console.log("SOCBALL:", JSON.stringify(kicked));

  // ---- spot an interactable (chair/seashell/bell) and click it ----
  const inter = await p.evaluate(() => {
    const g = window.CC_G;
    const types = {};
    (g.objs || []).forEach(o => { types[o.type] = (types[o.type] || 0) + 1; });
    return types;
  });
  console.log("OBJTYPES:", JSON.stringify(inter));

  // ---- sound: try playing one-shot and ambient; sample howler state ----
  const snd = await p.evaluate(async () => {
    const r = { howl: !!window.Howl, CCAU: !!(window.CCAU && window.CCAU.play) };
    try { window.CCAU.play("pop", 1); r.playCalled = true; } catch (e) { r.playErr = String(e); }
    // after a moment, check howler objects exist
    await new Promise(res => setTimeout(res, 600));
    return r;
  });
  console.log("SND:", JSON.stringify(snd));

  // ---- find a door near the house ----
  const doors = await p.evaluate(() => {
    const g = window.CC_G;
    return (g.objs || []).filter(o => o.type === "door").map(d => ({ to: d.to, x: Math.round(d.x), y: Math.round(d.y), w: d.width, h: d.height })).slice(0, 12);
  });
  console.log("DOORS:", JSON.stringify(doors));

  console.log("ERRS:", JSON.stringify(errs.slice(0, 8)));
  console.log("LOGWARN:", JSON.stringify(logs.slice(0, 8)));
  console.log("MISSING:", JSON.stringify(missing.slice(0, 15)));
  await p.screenshot({ path: "re/drive-1-spawn.png" });
  await b.close();
})();