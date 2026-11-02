const { chromium } = require("playwright-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: false, args: ["--window-size=1280,800"] });
  const p = await b.newPage();
  await p.setContent(`<html><body style="margin:0;background:#222"><div id="g" style="display:flex;flex-wrap:wrap"></div><script>
    const files=["t_3_1","t_4_1","t_5_1","t_6_1","t_3_2","t_4_2","t_5_2","t_6_2","t_3_3","t_4_3","t_5_3","t_6_3"];
    const g=document.getElementById("g");
    files.forEach(f=>{const im=document.createElement("img");im.src="re/tiles/"+f+".webp";im.style.width="180px";im.style.margin="4px";im.style.border="1px solid #555";im.title=f;g.appendChild(im);});
  </script></body></html>`);
  await p.waitForTimeout(600);
  await p.screenshot({ path: "re/tiles/grid.png" });
  await b.close();
})();
