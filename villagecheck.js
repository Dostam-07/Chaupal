/* Live verification of the Village Chaupal banyan tree + dialogue UI. */
const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: false });
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

  const z = await p.evaluate(() => {
    const g = window.CC_G;
    g.player.x = 6140; g.player.y = 2100;
    g.cam.x = 6140 - 640; g.cam.y = 2100 - 400;
    return {
      hasVillage: !!g.village,
      women: (g.village ? g.village.women.map(w => w.name + "@" + Math.round(w.x) + "," + Math.round(w.y)) : []),
      dist: g.village ? Math.round(g.village.dist()) : -1
    };
  });
  console.log("VILLAGE:", JSON.stringify(z));
  await p.waitForTimeout(700);
  await p.screenshot({ path: "re/village-scene.png" });

  // pick a woman at a known position (world coords)
  const pickRes = await p.evaluate(() => {
    const g = window.CC_G;
    const w = g.village.women[1]; // Savitri
    const hit = g.pick(w.x, w.y);
    return { picked: hit ? (hit.name || hit.constructor.name) : null, isWoman: hit instanceof window.CC_V.VillageWoman, w: w.name };
  });
  console.log("PICK:", JSON.stringify(pickRes));

  // open menu + Talk -> chooser -> pick Savitri
  const talkRes = await p.evaluate(() => {
    const g = window.CC_G;
    window.VUI.action("talk"); // chooser
    const chooserVisible = document.getElementById("v-chooser").style.display !== "none";
    const cards = document.querySelectorAll("#v-chooser .v-card").length;
    return { chooserVisible, cards };
  });
  console.log("CHOOSER:", JSON.stringify(talkRes));
  await p.screenshot({ path: "re/village-chooser.png" });

  const chatRes = await p.evaluate(() => {
    window.VUI.talkTo(window.CC_G.village.women[1]);
    const b = document.getElementById("v-bubble");
    return { visible: b.style.display !== "none", name: document.getElementById("v-b-name").textContent, text: document.getElementById("v-b-text").textContent };
  });
  console.log("CHAT-0:", JSON.stringify(chatRes));
  await p.waitForTimeout(900);
  await p.screenshot({ path: "re/village-chat.png" });

  // advance a few lines and read the story
  for (let i = 0; i < 4; i++) {
    await p.evaluate(() => {
      if (window.VUI._) {}
      const b = document.getElementById("v-bubble");
      b.click();
    });
    await p.waitForTimeout(i === 3 ? 1600 : 900);
  }
  const chatFinal = await p.evaluate(() => ({
    text: document.getElementById("v-b-text").textContent.slice(0, 90),
    name: document.getElementById("v-b-name").textContent,
    waveUntilFuture: window.CC_G.village.women[1].waveUntil > performance.now()
  }));
  console.log("CHAT-FINAL:", JSON.stringify(chatFinal));

  // panels via menu buttons
  const acts = ["explore", "share", "impact"];
  for (const act of acts) {
    const r = await p.evaluate((a) => {
      window.VUI.action(a);
      return {
        panel: document.getElementById("v-panel").style.display !== "none",
        title: document.getElementById("v-pt").textContent.slice(0, 60),
        cards: document.querySelectorAll("#v-pb .v-card2").length
      };
    }, act);
    console.log("PANEL-" + act.toUpperCase() + ":", JSON.stringify(r));
    await p.screenshot({ path: "re/village-" + act + ".png" });
    await p.evaluate(() => window.VUI.closePanel());
    await p.waitForTimeout(200);
  }

  // cat pet
  const catRes = await p.evaluate(() => {
    const g = window.CC_G;
    const hit = g.pick(g.village.cat.x, g.village.cat.y);
    let purred = false;
    if (hit && hit instanceof window.CC_V.VCat) { hit.talking(); purred = true; }
    return { purred, mew: hit && hit.mewUntil > performance.now() };
  });
  console.log("CAT:", JSON.stringify(catRes));

  console.log("ERRORS:", JSON.stringify(errors));
  await b.close();
})();