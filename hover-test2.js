const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8901/", { waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.click("#enter");
  await p.waitForTimeout(1500);

  // watercan world pos (2530,1577) -> screen (170,377)
  await p.mouse.move(170, 377);
  await p.waitForTimeout(400);
  const hover1 = await p.evaluate(() => {
    const g = window.CC_G;
    return { hover: g.hoverTarget ? g.hoverTarget.def.type : null, pointerImg: g.copy.src.split("/").pop() };
  });
  await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({ held: window.CC_G.player.held }));
  console.log("hover:", JSON.stringify(hover1), "after click held:", JSON.stringify(after));
  console.log("errs:", errs.length ? JSON.stringify(errs) : "NONE");
  await b.close();
})();
