/* Village Chaupal UI — Full Interactive Theater & Campground HUD.
   Matches the user's authentic pixel-art vision (media_1793566247827_7f14f8d0.jpg):
   - 16:9 full-fidelity scenic theater with background 'assets/banyan-chaupal.jpg'
   - Interactive dialogue bubble aligned 1:1 with speaker portraits, typewriter text, and advance controls
   - Interactive 4-card action menu (Talk, Explore, Share, Impact) aligned over the cards
   - Interactive sleeping ginger cat hotspot with purr & heart emotes
   - Interactive woman hotspots to switch speakers
   - Modals for Education reality, Community Solutions (with support voting), and Impact stories
   - Elegant return controls to resume camp walking */
(function () {
  if (window.VUI) return;
  var VUI = {};
  var zone = null;
  var state = {
    theaterOpen: false,
    womanIdx: 0,
    line: 0,
    typing: false,
    tyTimer: null,
    votes: { 0: 42, 1: 58, 2: 36, 3: 49, 4: 63 }
  };
  var el = {};

  function q(id) { return document.getElementById(id); }

  var CSS = [
    "/* Village Chaupal UI Styles */",
    "#vui{position:fixed;inset:0;pointer-events:none;z-index:70;font-family:'Segoe UI',system-ui,sans-serif}",
    "#vui *{box-sizing:border-box}",

    "/* Campground In-HUD Menu (when walking near tree) */",
    "#v-menu{position:absolute;right:18px;top:50%;transform:translateY(-50%);display:none;flex-direction:column;gap:10px;pointer-events:auto;width:225px;z-index:75}",
    "#v-menu .v-btn{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:15px;border:2px solid #8c5a2b;background:linear-gradient(180deg,#fff9ee 0%,#f5e6cc 100%);color:#3a2717;cursor:pointer;box-shadow:0 3px 0 rgba(70,45,20,.35),0 4px 10px rgba(0,0,0,.15);text-align:left;transition:transform .1s,box-shadow .1s,background .15s;font:inherit}",
    "#v-menu .v-btn:hover{transform:translateY(-2px);background:#fffdf6;box-shadow:0 5px 0 rgba(70,45,20,.4),0 6px 14px rgba(0,0,0,.2)}",
    "#v-menu .v-btn:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(70,45,20,.4)}",
    "#v-menu .v-btn.on,#v-menu .v-btn-talk{background:linear-gradient(180deg,#f5b335 0%,#e6981f 100%);border-color:#ffeaa7;color:#2b1d0c;box-shadow:0 0 16px rgba(245,179,53,.8),0 3px 0 rgba(90,50,10,.5)}",
    "#v-menu .v-btn .v-ico{font-size:20px;flex:0 0 24px;text-align:center}",
    "#v-menu .v-btn .v-info{display:flex;flex-direction:column;gap:1px;min-width:0}",
    "#v-menu .v-btn .v-t{font-weight:800;font-size:12.5px;color:inherit;white-space:nowrap}",
    "#v-menu .v-btn .v-s{font-size:10px;opacity:.82;white-space:nowrap;color:inherit}",

    "/* Full-Fidelity Chaupal Interactive Theater */",
    "#chaupal-theater{position:fixed;inset:0;background:rgba(10,6,3,.92);display:none;align-items:center;justify-content:center;z-index:95;pointer-events:auto;animation:chFadeIn .22s ease-out}",
    "@keyframes chFadeIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}",
    "#ch-stage{position:relative;width:min(100vw,calc(100vh * 16 / 9));height:min(100vh,calc(100vw * 9 / 16));max-width:1280px;max-height:720px;aspect-ratio:16/9;background:#1a1008 url('assets/banyan-chaupal.jpg') center/cover no-repeat;box-shadow:0 16px 50px rgba(0,0,0,.85);border-radius:12px;overflow:hidden;user-select:none}",

    "/* Stage Top-Right Return Button & Settings */",
    ".ch-close-btn{position:absolute;right:18px;top:16px;z-index:15;display:flex;align-items:center;gap:6px;padding:8px 16px;background:linear-gradient(180deg,#d4422e 0%,#a82916 100%);border:2px solid #ff9c88;border-radius:14px;color:#fff;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.5);transition:transform .1s}",
    ".ch-close-btn:hover{transform:translateY(-1px);background:linear-gradient(180deg,#e84d38 0%,#b8301c 100%)}",
    ".ch-close-btn:active{transform:translateY(1px)}",
    ".ch-gear-spot{position:absolute;right:8.8%;top:3.5%;width:4.2%;height:7.2%;border-radius:50%;cursor:pointer;background:transparent;border:0;z-index:12}",
    ".ch-gear-spot:hover{filter:drop-shadow(0 0 6px rgba(255,220,100,.8))}",

    "/* Interactive Stage Hotspots (Cat, Ladies) */",
    ".ch-spot{position:absolute;z-index:8;background:transparent;border:0;cursor:pointer;padding:0;outline:none}",
    ".ch-spot:hover{filter:drop-shadow(0 0 10px rgba(255,225,120,.85))}",
    ".ch-spot-cat{left:12%;top:61%;width:9%;height:14%;border-radius:50%}",
    ".ch-spot-w0{left:34%;top:50%;width:14%;height:34%;border-radius:24px}",
    ".ch-spot-w1{left:21%;top:53%;width:13%;height:33%;border-radius:24px}",
    ".ch-spot-w2{left:48%;top:54%;width:13%;height:35%;border-radius:24px}",
    ".ch-spot-w3{left:60%;top:53%;width:13%;height:33%;border-radius:24px}",

    "/* Dialogue Speech Bubble (fits exactly over the reference bubble) */",
    "#ch-bubble{position:absolute;left:34.6%;top:30.8%;width:29.8%;min-height:102px;background:#fffdf6;border:2.5px solid #4a2c11;border-radius:18px;box-shadow:0 8px 24px rgba(35,18,8,.45);z-index:12;padding:10px 14px;display:flex;gap:12px;cursor:pointer;transition:border-color .15s}",
    "#ch-bubble:hover{border-color:#b06c28}",
    ".ch-bubble-tail{position:absolute;left:70px;bottom:-13px;border:12px solid transparent;border-top-color:#fffdf6;border-bottom:0;filter:drop-shadow(0 2.5px 0 #4a2c11)}",
    ".ch-av-wrap{width:52px;height:52px;flex:0 0 52px;border-radius:50%;border:2.5px solid #d49a24;background:#fff5e3;box-shadow:0 3px 8px rgba(0,0,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center}",
    ".ch-av{width:52px;height:52px;border-radius:50%}",
    ".ch-bubble-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}",
    ".ch-bubble-head{display:flex;align-items:center;justify-content:space-between;gap:6px}",
    ".ch-bubble-name{font-weight:900;font-size:13.5px;color:#4a2c11}",
    ".ch-bubble-role{font-size:9px;font-weight:800;color:#fff;background:#a85324;padding:2px 7px;border-radius:8px;white-space:nowrap}",
    ".ch-bubble-text{font-size:12px;line-height:1.45;color:#2c1b0c;min-height:48px;word-break:break-word}",
    ".ch-cursor{display:inline-block;width:6px;height:12px;background:#c98a1b;vertical-align:middle;animation:chBlink .7s infinite}",
    "@keyframes chBlink{50%{opacity:0}}",
    ".ch-bubble-foot{display:flex;align-items:center;justify-content:space-between;margin-top:2px}",
    ".ch-bubble-hint{font-size:9.5px;font-weight:800;color:#8c5a2b}",
    ".ch-bubble-counter{font-size:9.5px;font-weight:800;color:#a87442}",

    "/* Right-Hand Action Menu (aligned 1:1 over image cards) */",
    "#ch-menu{position:absolute;left:75.4%;top:40.8%;width:22.2%;height:41.6%;z-index:12;display:flex;flex-direction:column;justify-content:space-between}",
    ".ch-btn{position:relative;height:22%;display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:15px;border:2px solid #8c5a2b;background:linear-gradient(180deg,#fdf6ea 0%,#f5e3c7 100%);color:#3a2717;cursor:pointer;box-shadow:0 3px 0 rgba(70,45,20,.35),0 4px 8px rgba(0,0,0,.2);text-align:left;transition:transform .1s,box-shadow .1s,background .15s;font:inherit}",
    ".ch-btn:hover{transform:translateY(-2px);background:#fffaf0;box-shadow:0 5px 0 rgba(70,45,20,.4),0 6px 12px rgba(0,0,0,.25)}",
    ".ch-btn:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(70,45,20,.4)}",
    ".ch-btn.active,.ch-btn-talk{background:linear-gradient(180deg,#f5b335 0%,#e6981f 100%);border:2.5px solid #ffeaa7;color:#2b1d0c;box-shadow:0 0 16px rgba(245,179,53,.85),0 4px 10px rgba(0,0,0,.35);animation:chGlowPulse 2.4s infinite alternate}",
    "@keyframes chGlowPulse{from{box-shadow:0 0 12px rgba(245,179,53,.7),0 3px 0 rgba(90,50,10,.4)}to{box-shadow:0 0 22px rgba(245,179,53,1),0 3px 0 rgba(90,50,10,.5)}}",
    ".ch-btn-ico{width:22px;height:22px;flex:0 0 22px;display:flex;align-items:center;justify-content:center}",
    ".ch-btn-info{display:flex;flex-direction:column;gap:1px;min-width:0}",
    ".ch-btn-title{font-weight:900;font-size:12.5px;color:inherit;white-space:nowrap}",
    ".ch-btn-sub{font-size:10px;opacity:.84;white-space:nowrap;color:inherit}",
    ".ch-hand-pointer{position:absolute;right:-12px;top:50%;transform:translateY(-50%) rotate(-12deg);font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));pointer-events:none;animation:chPointWiggle 1.8s ease-in-out infinite alternate}",
    "@keyframes chPointWiggle{from{transform:translateY(-50%) rotate(-12deg) translateX(0)}to{transform:translateY(-50%) rotate(-12deg) translateX(-4px)}}",

    "/* Modal Overlays (Education, Solutions, Impact) */",
    ".ch-modal-dim{position:absolute;inset:0;background:rgba(20,12,6,.65);display:none;z-index:20;backdrop-filter:blur(3px)}",
    ".ch-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(580px,90%);max-height:80%;background:#fffdf6;border:3px solid #4a2c11;border-radius:18px;box-shadow:0 16px 45px rgba(0,0,0,.7);display:none;z-index:22;flex-direction:column;overflow:hidden}",
    ".ch-panel-head{background:linear-gradient(180deg,#9c6d3d 0%,#754f28 100%);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #4a2c11}",
    ".ch-panel-title{font-weight:900;font-size:15px;color:#fffaf0;text-shadow:0 1px 3px rgba(0,0,0,.5)}",
    ".ch-panel-x{width:28px;height:28px;border-radius:8px;border:1.5px solid #4a2c11;background:#fffaf0;color:#4a2c11;font-weight:900;font-size:14px;cursor:pointer}",
    ".ch-panel-body{padding:16px 18px;overflow-y:auto;display:flex;flex-direction:column;gap:12px}",
    ".ch-card2{background:#faf2df;border:1.5px solid #d4ba8a;border-radius:12px;padding:12px 14px}",
    ".ch-card2-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}",
    ".ch-card2-t{font-weight:800;font-size:13.5px;color:#3d2410}",
    ".ch-card2-b{font-size:12px;line-height:1.45;color:#4a321e;margin-top:6px}",
    ".ch-chip{font-size:9.5px;font-weight:800;color:#fff;background:#a85324;padding:2px 8px;border-radius:8px;white-space:nowrap}",
    ".ch-vote-btn{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:5px 12px;background:linear-gradient(180deg,#ff6b6b 0%,#ee5253 100%);color:#fff;border:1.5px solid #ff9f9f;border-radius:10px;font-weight:800;font-size:11px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.2)}",
    ".ch-vote-btn:hover{transform:translateY(-1px);background:linear-gradient(180deg,#ff7979 0%,#ff5252 100%)}",

    "/* Floating Heart Animation for Cat */",
    ".ch-heart-fly{position:absolute;font-size:24px;color:#e64a4a;pointer-events:none;z-index:25;animation:chFlyUp 1.6s ease-out forwards}",
    "@keyframes chFlyUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(1.4)}}"
  ].join("\n");

  function build() {
    var style = document.createElement("style");
    style.id = "vui-css";
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "vui";
    root.innerHTML = [
      // 1. In-game HUD Menu (when wandering near tree)
      '<div id="v-menu">',
      '  <button class="v-btn v-btn-talk on" data-act="talk"><span class="v-ico">💬</span><div class="v-info"><span class="v-t">Talk to the Women</span><span class="v-s">Know their daily struggles</span></div></button>',
      '  <button class="v-btn" data-act="explore"><span class="v-ico">📖</span><div class="v-info"><span class="v-t">Explore Education</span><span class="v-s">Learn about local issues</span></div></button>',
      '  <button class="v-btn" data-act="share"><span class="v-ico">💡</span><div class="v-info"><span class="v-t">Share Solutions</span><span class="v-s">Help them with ideas</span></div></button>',
      '  <button class="v-btn" data-act="impact"><span class="v-ico">📈</span><div class="v-info"><span class="v-t">View Impact</span><span class="v-s">See the difference</span></div></button>',
      '</div>',

      // 2. Full-Fidelity Interactive Chaupal Theater
      '<div id="chaupal-theater">',
      '  <div id="ch-stage">',
      '    <!-- Top-Right Return & Settings -->',
      '    <button class="ch-close-btn" id="ch-close-btn" title="Return to Camp (Esc)">✕ Return to Camp</button>',
      '    <button class="ch-gear-spot" id="ch-gear-spot" title="Camp Guide & Settings"></button>',

      '    <!-- Hotspots -->',
      '    <button class="ch-spot ch-spot-cat" id="ch-spot-cat" title="Pet Mintu the cat 🐱"></button>',
      '    <button class="ch-spot ch-spot-w0" id="ch-spot-w0" title="Talk with Radha Devi (Center)"></button>',
      '    <button class="ch-spot ch-spot-w1" id="ch-spot-w1" title="Talk with Meena (Left)"></button>',
      '    <button class="ch-spot ch-spot-w2" id="ch-spot-w2" title="Talk with Kavita (Student)"></button>',
      '    <button class="ch-spot ch-spot-w3" id="ch-spot-w3" title="Talk with Savitri (Right)"></button>',

      '    <!-- Dialogue Speech Bubble -->',
      '    <div id="ch-bubble" title="Click to continue dialogue">',
      '      <div class="ch-av-wrap"><canvas class="ch-av" id="ch-av" width="52" height="52"></canvas></div>',
      '      <div class="ch-bubble-body">',
      '        <div class="ch-bubble-head">',
      '          <span class="ch-bubble-name" id="ch-b-name">Namaste! 😊</span>',
      '          <span class="ch-bubble-role" id="ch-b-role">Radha Devi</span>',
      '        </div>',
      '        <div class="ch-bubble-text" id="ch-b-text"></div>',
      '        <div class="ch-bubble-foot">',
      '          <span class="ch-bubble-hint" id="ch-hint">Click speech or button to continue ▸</span>',
      '          <span class="ch-bubble-counter" id="ch-counter">1/5</span>',
      '        </div>',
      '      </div>',
      '      <div class="ch-bubble-tail"></div>',
      '    </div>',

      '    <!-- Right Action Menu -->',
      '    <div id="ch-menu">',
      '      <button class="ch-btn active" data-act="talk"><span class="ch-btn-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="#38200d"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></span><div class="ch-btn-info"><span class="ch-btn-title">Talk to the Women</span><span class="ch-btn-sub">Know their daily struggles</span></div><span class="ch-hand-pointer">👆</span></button>',
      '      <button class="ch-btn" data-act="explore"><span class="ch-btn-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="#4a2c11"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></span><div class="ch-btn-info"><span class="ch-btn-title">Explore Education</span><span class="ch-btn-sub">Learn about local issues</span></div></button>',
      '      <button class="ch-btn" data-act="share"><span class="ch-btn-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="#4a2c11"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg></span><div class="ch-btn-info"><span class="ch-btn-title">Share Solutions</span><span class="ch-btn-sub">Help them with ideas</span></div></button>',
      '      <button class="ch-btn" data-act="impact"><span class="ch-btn-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="#4a2c11"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg></span><div class="ch-btn-info"><span class="ch-btn-title">View Impact</span><span class="ch-btn-sub">See the difference</span></div></button>',
      '    </div>',

      '    <!-- Panel Modal -->',
      '    <div class="ch-modal-dim" id="ch-modal-dim"></div>',
      '    <div class="ch-panel" id="ch-panel">',
      '      <div class="ch-panel-head">',
      '        <span class="ch-panel-title" id="ch-panel-title"></span>',
      '        <button class="ch-panel-x" id="ch-panel-x">✕</button>',
      '      </div>',
      '      <div class="ch-panel-body" id="ch-panel-body"></div>',
      '    </div>',

      '  </div>',
      '</div>'
    ].join("");
    document.body.appendChild(root);

    // Bind Elements
    el.vmenu = q("v-menu");
    el.theater = q("chaupal-theater");
    el.stage = q("ch-stage");
    el.bubble = q("ch-bubble");
    el.av = q("ch-av");
    el.bn = q("ch-b-name");
    el.br = q("ch-b-role");
    el.bt = q("ch-b-text");
    el.hint = q("ch-hint");
    el.counter = q("ch-counter");
    el.menu = q("ch-menu");
    el.dim = q("ch-modal-dim");
    el.panel = q("ch-panel");
    el.pt = q("ch-panel-title");
    el.pb = q("ch-panel-body");
    el.px = q("ch-panel-x");
    el.closeBtn = q("ch-close-btn");
    el.gearSpot = q("ch-gear-spot");

    // Hotspots
    el.spotCat = q("ch-spot-cat");
    el.spotW0 = q("ch-spot-w0");
    el.spotW1 = q("ch-spot-w1");
    el.spotW2 = q("ch-spot-w2");
    el.spotW3 = q("ch-spot-w3");

    // Action Menu Event Handlers
    el.menu.querySelectorAll(".ch-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var act = btn.getAttribute("data-act");
        VUI.handleAction(act);
      });
    });

    el.vmenu.querySelectorAll(".v-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var act = btn.getAttribute("data-act");
        if (act === "talk") VUI.openTheater(0);
        else {
          VUI.openTheater(0);
          VUI.handleAction(act);
        }
      });
    });

    // Bubble advance on click
    el.bubble.addEventListener("click", function (ev) {
      ev.stopPropagation();
      VUI.advanceDialogue();
    });

    // Hotspot clicks
    el.spotCat.addEventListener("click", function (ev) {
      ev.stopPropagation();
      VUI.petCat();
    });
    el.spotW0.addEventListener("click", function (ev) { ev.stopPropagation(); VUI.switchWoman(0); });
    el.spotW1.addEventListener("click", function (ev) { ev.stopPropagation(); VUI.switchWoman(1); });
    el.spotW2.addEventListener("click", function (ev) { ev.stopPropagation(); VUI.switchWoman(2); });
    el.spotW3.addEventListener("click", function (ev) { ev.stopPropagation(); VUI.switchWoman(3); });

    // Close handlers
    el.closeBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      VUI.closeTheater();
    });

    el.px.addEventListener("click", function (ev) {
      ev.stopPropagation();
      VUI.closePanel();
    });
    el.dim.addEventListener("click", function (ev) {
      ev.stopPropagation();
      VUI.closePanel();
    });

    el.gearSpot.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var gb = document.getElementById("guide-btn");
      if (gb) gb.click();
    });

    // Keyboard handlers
    document.addEventListener("keydown", function (ev) {
      if (!state.theaterOpen) return;
      if (ev.key === "Escape") {
        if (el.panel.style.display === "flex") {
          ev.stopPropagation();
          VUI.closePanel();
        } else {
          ev.stopPropagation();
          VUI.closeTheater();
        }
      } else if (ev.key === " " || ev.key === "Enter") {
        if (el.panel.style.display !== "flex") {
          ev.stopPropagation();
          VUI.advanceDialogue();
        }
      }
    }, true);
  }

  /* ---- Typewriter Effect ---- */
  function typeText(text, callback) {
    state.typing = true;
    state.fullText = text;
    var chars = Array.from(text);
    var i = 0;
    el.bt.innerHTML = '<span class="ch-cursor"></span>';
    clearInterval(state.tyTimer);
    state.tyTimer = setInterval(function () {
      i++;
      el.bt.textContent = chars.slice(0, i).join("");
      el.bt.insertAdjacentHTML("beforeend", '<span class="ch-cursor"></span>');
      if (i >= chars.length) {
        clearInterval(state.tyTimer);
        state.typing = false;
        if (callback) callback();
      }
    }, 18);
  }

  function finishTyping() {
    clearInterval(state.tyTimer);
    state.typing = false;
    el.bt.textContent = state.fullText || "";
  }

  /* ---- Dialogue Logic ---- */
  VUI.updateSpeakerView = function () {
    var defs = (window.V_DIALOGUE && window.V_DIALOGUE.women) || [];
    var woman = defs[state.womanIdx];
    if (!woman) return;

    // Draw Portrait in Golden Avatar Circle
    if (window.CC_V && CC_V.paintPortrait) {
      CC_V.paintPortrait(el.av, woman);
    }

    var lines = woman.chat || [];
    state.line = Math.max(0, Math.min(state.line, lines.length - 1));
    var cur = lines[state.line];

    el.bn.textContent = cur ? (cur.sp || woman.name) : "Namaste! 😊";
    el.br.textContent = woman.role || "";
    el.counter.textContent = (state.line + 1) + "/" + lines.length;

    typeText(cur ? cur.t : "", function () {
      if (zone && zone.game) zone.game.play("pop");
    });
  };

  VUI.advanceDialogue = function () {
    if (state.typing) {
      finishTyping();
      return;
    }
    var defs = (window.V_DIALOGUE && window.V_DIALOGUE.women) || [];
    var woman = defs[state.womanIdx];
    if (!woman) return;

    var lines = woman.chat || [];
    state.line++;
    if (state.line >= lines.length) {
      // Loop to next woman
      state.womanIdx = (state.womanIdx + 1) % defs.length;
      state.line = 0;
      if (zone && zone.game) zone.game.toast("Now speaking with " + defs[state.womanIdx].name + " 🌸");
    }
    VUI.updateSpeakerView();
  };

  VUI.switchWoman = function (idx) {
    state.womanIdx = idx;
    state.line = 0;
    VUI.updateSpeakerView();
    VUI.highlightMenu("talk");
    if (zone && zone.game) {
      var name = (window.V_DIALOGUE.women[idx] && window.V_DIALOGUE.women[idx].name) || "";
      zone.game.toast("You sat down with " + name + " 🌳");
      zone.game.play("pop");
    }
  };

  /* ---- Menu Navigation ---- */
  VUI.highlightMenu = function (act) {
    var hand = el.menu.querySelector(".ch-hand-pointer");
    if (!hand) {
      hand = document.createElement("span");
      hand.className = "ch-hand-pointer";
      hand.textContent = "👆";
    }
    el.menu.querySelectorAll(".ch-btn").forEach(function (b) {
      var isAct = b.getAttribute("data-act") === act;
      b.classList.toggle("active", isAct);
      if (isAct && !b.contains(hand)) b.appendChild(hand);
    });
    el.vmenu.querySelectorAll(".v-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-act") === act);
    });
  };

  VUI.handleAction = function (act) {
    VUI.highlightMenu(act);
    if (act === "talk") {
      VUI.advanceDialogue();
    } else if (act === "explore" || act === "share" || act === "impact") {
      VUI.openPanel(act);
    }
  };

  /* ---- Panels (Education, Solutions, Impact) ---- */
  VUI.openPanel = function (kind) {
    var titles = {
      explore: "📖 Explore Education — Gaon Mein Padhai Ki Asli Haqeeqat",
      share: "💡 Share Solutions — Hum Milkar Kya Badal Sakte Hain",
      impact: "📈 View Impact — Jab Hum Saath Khade Hue"
    };
    var list = kind === "explore" ? window.V_DIALOGUE.facts : kind === "share" ? window.V_DIALOGUE.solutions : window.V_DIALOGUE.impact;

    el.pt.textContent = titles[kind] || "Village Chaupal";
    el.pb.innerHTML = "";

    list.forEach(function (item, idx) {
      var card = document.createElement("div");
      card.className = "ch-card2";

      var h = document.createElement("div");
      h.className = "ch-card2-h";
      var title = document.createElement("span");
      title.className = "ch-card2-t";
      title.textContent = item.title;
      h.appendChild(title);

      if (item.tag) {
        var chip = document.createElement("span");
        chip.className = "ch-chip";
        chip.textContent = item.tag;
        h.appendChild(chip);
      } else if (item.when) {
        var chip2 = document.createElement("span");
        chip2.className = "ch-chip";
        chip2.textContent = item.when;
        h.appendChild(chip2);
      }
      card.appendChild(h);

      var body = document.createElement("div");
      body.className = "ch-card2-b";
      body.textContent = item.text;
      card.appendChild(body);

      // Interactive Support / Vote button for Solutions
      if (kind === "share") {
        var voteBtn = document.createElement("button");
        voteBtn.className = "ch-vote-btn";
        var count = state.votes[idx] || 40;
        voteBtn.innerHTML = "❤️ Support this Idea (" + count + ")";
        voteBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          state.votes[idx] = (state.votes[idx] || 40) + 1;
          voteBtn.innerHTML = "❤️ Supported! (" + state.votes[idx] + ")";
          voteBtn.style.background = "linear-gradient(180deg,#2ed573 0%,#26af5f 100%)";
          if (zone && zone.game) {
            zone.game.toast("Thank you for supporting girls' education in Chaupal! ✨");
            zone.game.play("pop");
          }
        });
        card.appendChild(voteBtn);
      }

      el.pb.appendChild(card);
    });

    el.dim.style.display = "block";
    el.panel.style.display = "flex";
    if (zone && zone.game) zone.game.play("pop");
  };

  VUI.closePanel = function () {
    el.dim.style.display = "none";
    el.panel.style.display = "none";
    VUI.highlightMenu("talk");
  };

  /* ---- Pet Mintu the Cat ---- */
  VUI.petCat = function () {
    var heart = document.createElement("div");
    heart.className = "ch-heart-fly";
    heart.textContent = "❤️";
    heart.style.left = "16%";
    heart.style.top = "60%";
    el.stage.appendChild(heart);
    setTimeout(function () { heart.remove(); }, 1600);

    if (zone && zone.game) {
      zone.game.toast("🐾 Mintu purrs contentedly in the shade of the sacred banyan tree.");
      zone.game.play("pop");
    }
  };

  /* ---- Open & Close Theater ---- */
  VUI.openTheater = function (womanIdx) {
    if (!el.theater) build();
    state.theaterOpen = true;
    state.womanIdx = typeof womanIdx === "number" ? womanIdx : 0;
    state.line = 0;

    // Release Pointer Lock so mouse is free
    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (err) {}
    }

    el.theater.style.display = "flex";
    VUI.updateSpeakerView();
    VUI.highlightMenu("talk");

    if (zone && zone.game) {
      zone.game.play("pop");
    }
  };

  VUI.closeTheater = function () {
    clearInterval(state.tyTimer);
    state.theaterOpen = false;
    el.theater.style.display = "none";
    VUI.closePanel();

    if (zone && zone.game) {
      zone.game.toast("Back to exploring Chaupal camp 🏕️");
      zone.game.play("pop");
    }
  };

  /* ---- Public API ---- */
  VUI.init = function (z) {
    if (!el.theater) build();
    zone = z;
  };

  VUI.frame = function () {
    if (!el.vmenu) return;
    var g = zone.game;
    var near = g.mapId === "default" && g.player && zone.dist() < 640;
    if (near && !state.theaterOpen) {
      el.vmenu.style.display = "flex";
    } else {
      el.vmenu.style.display = "none";
    }
  };

  VUI.hideAll = function () {
    VUI.closeTheater();
    if (el.vmenu) el.vmenu.style.display = "none";
  };

  VUI.talkTo = function (woman) {
    VUI.openTheater(woman ? woman.idx : 0);
  };

  VUI.action = function (act) {
    VUI.openTheater(0);
    VUI.handleAction(act);
  };

  window.VUI = VUI;
})();
