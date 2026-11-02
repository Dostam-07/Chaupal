(function () {
  "use strict";

  // Ambient campers — friendly wandering visitors that restore the "camp is
  // full of people" feel of the original game's multiplayer lobby, in single
  // player. They are pure flavor: they wander landmark spots, occasionally
  // emote, and wave back when you click them. They never block doors or props.

  var HATS = ["cap", "towel", "chef", "newspaper", "sailor", "miner", "wavy", "explorer", "party-1", "party-2", "party-3", "beret"];
  var NAMES = [
    "Aarav", "Ada", "Advait", "Aman", "Ananya", "Arjun", "Ben", "Cara", "Chinki", "Dev",
    "Dex", "Diya", "Eli", "Fatima", "Fia", "Gauri", "Gus", "Ione", "Ishaan", "Juno",
    "Kabir", "Kai", "Kiran", "Lena", "Maya", "Meera", "Miro", "Neil", "Nia", "Otis",
    "Pia", "Pooja", "Priya", "Quinn", "Reyansh", "Riya", "Rohan", "Romy", "Sage", "Sahil",
    "Sneha", "Tanvi", "Tara", "Tavi", "Ula", "Vera", "Vikram", "Wren", "Yara", "Zed", "Zoya"
  ];
  var EMOTES = ["1", "2", "3", "4", "5", "6", "7", "8"];
  var GREETINGS = [
    "Exploring the campgrounds is so peaceful! 🏕️",
    "Have you visited the Village School to the east? Meena Didi is amazing! 🏫",
    "Did you sit by the Chaupal Banyan Tree yet? The stories are magical! 🌳",
    "I'm collecting seashells today! Look at how shiny they are! ✨",
    "The fresh mountain breeze here is unmatched! 🍃",
    "Don't forget to try the sauna by the lake! ♨️",
    "Namaste fellow explorer! Enjoy your stay at Chaupal! 🙏",
    "I love watching the camp cats nap under the sun! 🐾",
    "Soccer match at the field later? I'm definitely in! ⚽",
    "Learning and playing together is the best part of Chaupal! 🌟",
    "The night campfire is going to be so cozy! 🔥"
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function Camper(game, x, y) {
    this.game = game;
    this.home = { x: x, y: y };
    this.x = x; this.y = y;
    this.target = null;
    this.state = "idle";           // idle | walk
    this.stateUntil = U.now() + 700 + Math.random() * 1400;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.sq = 0;
    this.hat = pick(HATS);
    this.name = pick(NAMES);
    this.quote = pick(GREETINGS);
    this.emote = 0; this.emoteUntil = 0;
    this.waveUntil = 0;
    this.art = CCA.img("optimized/cursor.webp");
    this.radius = 320 + Math.random() * 260;
    this.speed = 70 + Math.random() * 65;
  }

  Camper.prototype.getGreeting = function () {
    return this.name + ": \"" + (this.quote || pick(GREETINGS)) + "\"";
  };

  Camper.prototype.pickTarget = function () {
    var g = this.game;
    for (var tries = 0; tries < 14; tries++) {
      var a = Math.random() * Math.PI * 2;
      var d = Math.random() * this.radius;
      var tx = U.clamp(this.home.x + Math.cos(a) * d, 30, 6700);
      var ty = U.clamp(this.home.y + Math.sin(a) * d * 0.7, 30, 3750);
      var wf = g.water ? g.water.fraction(tx, ty + 16) : 0;
      if (wf > 0.3) continue;                       // no wading, no standing in the ocean
      if (doorAt(g, tx, ty)) continue;              // keep doorways clear
      this.target = { x: tx, y: ty }; return;
    }
    this.target = { x: this.home.x, y: this.home.y };
  };

  Camper.prototype.update = function (dt) {
    var g = this.game;
    if (U.now() >= this.stateUntil) {
      this.state = "walk";
      this.stateUntil = U.now() + 900 + Math.random() * 2600;
      this.pickTarget();
    }
    if (this.state === "walk" && this.target) {
      var dx = this.target.x - this.x, dy = this.target.y - this.y;
      var dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < 8) {
        this.state = "idle";
        this.x = this.target.x; this.y = this.target.y;
        this.sq = U.lerp(this.sq, 0, Math.min(1, 8 * dt));
        this.stateUntil = U.now() + 900 + Math.random() * 2600;
        if (Math.random() < 0.35) { this.emote = pick(EMOTES); this.emoteUntil = U.now() + 1500; }
      } else {
        var sp = this.speed * dt;
        var nx = dx / dd, ny = dy / dd;
        var wf = g.water ? g.water.fraction(this.x + nx * sp, this.y + ny * sp + 10) : 0;
        if (wf > 0.3) { this.pickTarget(); return; }
        this.x += nx * sp; this.y += ny * sp;
        if (Math.abs(nx) > 0.3) this.facing = nx > 0 ? 1 : -1;
        this.sq = U.lerp(this.sq, 1, Math.min(1, 8 * dt));
      }
    } else {
      this.sq = U.lerp(this.sq, 0, Math.min(1, 8 * dt));
    }
  };

  Camper.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.x, this.y, 30); };
  Camper.prototype.z = function () { return 3; };

  Camper.prototype.wave = function () { this.waveUntil = U.now() + 1100; };

  Camper.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    if (sx < -90 || sx > 1440 || sy < -90 || sy > 920) return;
    var squash = 1 + this.sq * 0.1, stretch = 1 - this.sq * 0.07;
    var w = 32 * squash, h = 38 * stretch;
    var art = this.art;
    if (art.complete && art.naturalWidth) {
      if (this.facing < 0) {
        ctx.save(); ctx.translate(sx, sy); ctx.scale(-1, 1);
        ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore();
      } else {
        ctx.drawImage(art, sx - w / 2, sy - h / 2, w, h);
      }
    } else {
      ctx.fillStyle = "#4a3728"; ctx.beginPath(); ctx.arc(sx, sy, 13, 0, 6.2832); ctx.fill();
    }

    // hat
    var hd = CC.HAT_DEFS[this.hat] || CC.HAT_DEFS.normal;
    var hi = CCA.img("optimized/hats/" + this.hat + ".webp");
    if (hi.complete && hi.naturalWidth) ctx.drawImage(hi, sx + hd.x - hd.size / 2, sy + hd.y - hd.size / 2, hd.size, hd.size);

    // name tag (like the multiplayer name labels)
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    var tw = ctx.measureText(this.name).width + 10;
    ctx.fillStyle = "rgba(74,55,40,0.88)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - tw / 2, sy - 42, tw, 17, 6);
    else ctx.fillRect(sx - tw / 2, sy - 42, tw, 17);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.name, sx, sy - 30);
    ctx.textAlign = "start";

    // wave rings
    if (U.now() < this.waveUntil) {
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      for (var i2 = 0; i2 < 3; i2++) {
        ctx.globalAlpha = 0.7 - i2 * 0.2;
        ctx.beginPath(); ctx.arc(sx, sy, 15 + i2 * 7, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // emote bubble
    if (this.emote && U.now() < this.emoteUntil) {
      var ei = CCA.img("optimized/emotes/" + this.emote + ".webp");
      if (ei.complete && ei.naturalWidth) ctx.drawImage(ei, sx - 20, sy - 64, 40, 40);
      else { ctx.font = "22px sans-serif"; ctx.fillText("\uD83D\uDCAC", sx - 14, sy - 52); }
    }
  };

  // ---- system ----
  function Campers(game) { this.game = game; this.list = []; }

  // Place campers near landmarks of the current map. Only the outdoor
  // campground makes sense (rooms are interiors; a camper there would be odd).
  Campers.prototype.populate = function () {
    this.list = [];
    var g = this.game;
    if (!g.tmap || !g.tmap.layers) return;         // tile map only (campground)
    var anchors = [], used = {};
    function add(x, y) {
      if (x == null || y == null) return;
      var k = Math.round(x / 90) + "," + Math.round(y / 90);
      if (used[k]) return;
      used[k] = 1;
      var wf = g.water ? g.water.fraction(x, y + 10) : 0;
      if (wf > 0.3) return;
      if (doorAt(g, x, y)) return;
      anchors.push({ x: x, y: y });
    }
    // 1) landmark spots (chairs / games / props the visitors come to use)
    var pool = (g.objs || []).filter(function (o) {
      var t = o.def && o.def.type;
      return t === "chair" || t === "trigger" || t === "watercan" || t === "merryGoRound" || t === "seesaw" || t === "staticImage";
    });
    var i;
    for (i = 0; i < pool.length && anchors.length < 24; i++) {
      var o = pool[i];
      add(o.def.x, (o.def.y || 0) + 12);
    }
    // 2) scatter the rest of the map so the campground feels full everywhere
    var w = g.tmap.worldWidth || g.tmap.w || 6750;
    var h = g.tmap.worldHeight || g.tmap.h || 3797;
    for (var cy = 1; cy < 7; cy++) {
      for (var cx = 1; cx < 12; cx++) {
        add(w * cx / 12, h * cy / 7);
      }
    }
    if (anchors.length === 0) return;
    anchors.sort(function () { return Math.random() - 0.5; });
    var count = Math.min(50, Math.max(45, Math.floor(anchors.length * 0.85)));
    var namesUsed = {};
    for (var j = 0; j < count; j++) {
      var a = anchors[j % anchors.length];
      var name = pick(NAMES), guard = 0;
      while (namesUsed[name] && guard++ < 10) name = pick(NAMES);
      namesUsed[name] = 1;
      var c = new Camper(g, a.x + (Math.random() - 0.5) * 50, a.y + Math.random() * 40);
      c.name = name;
      this.list.push(c);
    }
  };

  function doorAt(g, x, y) {
    var os = g.objs || [];
    for (var i = 0; i < os.length; i++) {
      var o = os[i];
      if (!o.def || o.def.type !== "door" || !o.w || !o.h) continue;
      var x0 = o.def.x - o.w / 2, y0 = o.def.y - o.h / 2;
      if (x >= x0 && x <= x0 + o.w && y >= y0 && y <= y0 + o.h) return true;
    }
    return false;
  }

  Campers.prototype.update = function (dt) {
    for (var i = 0; i < this.list.length; i++) this.list[i].update(dt);
  };

  window.CC_Camper = Camper;
  window.CC_Campers = Campers;
})();