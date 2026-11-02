const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errs = [], mp3req = [];
  p.on("pageerror", e => errs.push(e.message.slice(0, 160)));
  p.on("request", r => { if (/\.mp3|\.ogg|\.wav|\.webm/.test(r.url())) mp3req.push(r.url().replace("http://127.0.0.1:8901", "")); });
  p.on("response", r => { if (/\.mp3|\.ogg/.test(r.url()) && r.status() !== 200) mp3req.push("HTTP" + r.status() + " " + r.url().replace("http://127.0.0.1:8901", "")); });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.click("#enter");
  await p.waitForTimeout(1000);

  const probe = await p.evaluate(async () => {
    const r = { Howl: typeof window.Howl, Howler: typeof window.Howler };
    if (window.Howler) {
      r.ctxState = window.Howler.ctx ? window.Howler.ctx.state : "no-ctx";
      r.howlList = (window.Howler._howls || []).map(h => ({ s: h.state(), p: h.playing(), vol: h.volume() }));
    }
    // play several
    ["pop", "pickup", "soccer-kick", "goal", "flicker"].forEach(n => { try { window.CCAU.play(n, 0.5); } catch (e) { r["playErr_" + n] = e.message.slice(0, 80); } });
    await new Promise(res => setTimeout(res, 1800));
    if (window.Howler) r.howlListAfter = (window.Howler._howls || []).map(h => ({ s: h.state(), p: h.playing(), vol: Math.round(h.volume() * 100) / 100, src: (h._src || [""])[0].split("/").pop() }));
    r.ctxStateAfter = window.Howler.ctx ? window.Howler.ctx.state : "no-ctx";
    return r;
  });
  console.log("AUDIOPROBE:", JSON.stringify(probe, null, 0));
  console.log("MP3REQ:", JSON.stringify(mp3req.slice(0, 25)));
  console.log("ERRS:", JSON.stringify(errs.slice(0, 5)));
  await b.close();
})();