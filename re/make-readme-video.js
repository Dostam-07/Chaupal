/* Record a short gameplay clip for the README (video is trimmed with ffmpeg). */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "..", "media");
fs.mkdirSync(path.join(OUT, "_raw"), { recursive: true });

(async () => {
  const b = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--force-device-scale-factor=1", "--hide-scrollbars"],
  });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: path.join(OUT, "_raw"), size: { width: 1280, height: 720 } },
  });
  const p = await ctx.newPage();
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + "s";
  p.on("pageerror", (e) => console.log("ERR", e.message));

  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://127.0.0.1:8901/index.html?_t=" + Date.now(), { waitUntil: "load" });
  await p.addStyleTag({ content: "#toast{display:none !important}" });
  console.log(stamp(), "loaded");
  await p.waitForTimeout(1500);
  await p.click("#enter");
  console.log(stamp(), "entered");
  await p.waitForTimeout(2500);

  await p.evaluate(() => window.ccGoto("default", 5820, 2080));
  console.log(stamp(), "at approach");
  await p.waitForTimeout(4000);

  await p.keyboard.down("d");
  await p.waitForTimeout(1000);
  await p.keyboard.up("d");
  console.log(stamp(), "walked", await p.evaluate(() => Math.round(window.CC_G.player.x)));
  await p.waitForTimeout(1400);

  await p.evaluate(() => window.VUI.showChooser());
  console.log(stamp(), "chooser");
  await p.waitForTimeout(1400);

  await p.evaluate(() => window.VUI.talkTo(window.CC_G.village.women[0]));
  console.log(stamp(), "talkTo");
  await p.waitForTimeout(3800);
  await p.evaluate(() => { const el = document.getElementById("v-bubble"); if (el) el.click(); });
  console.log(stamp(), "advance");
  await p.waitForTimeout(3000);

  const v = p.video();
  await ctx.close();
  const file = await v.path();
  await b.close();
  console.log("raw video:", file);
})();
