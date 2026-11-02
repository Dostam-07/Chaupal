(function () {
  "use strict";

  var CFG = CC.GAME_CONFIG;

  function Player(x, y) {
    this.id = CCE.load().id;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.sq = 0;          // squash factor (0..1) while moving
    this.facing = 0;      // -1 left, 1 right
    this.emote = 0;
    this.emoteUntil = 0;
    this.flag = null;
    this.hovering = false;
    this.waterDepth = 0;
    this.swim = false;
    this.sitting = null;
    this.stepPhase = 0;
    this.held = null;     // held item key ('watercan', 'marshmallow', 'wood')
    this.roastLevel = 0;  // 0.0 to 1.2+
    this.speedBoostUntil = 0;
    this.shockUntil = 0;
    this.trail = [];
    this.art = CCA.img("optimized/cursor.webp");
    this.artBack = false;
  }

  Player.prototype.setPos = function (x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.trail.length = 0;
    // teleports must move the cursor target too, or the smoothing spring
    // instantly drags the avatar back to where it came from
    this.tx = x; this.ty = y;
  };

  Player.prototype.emoteNow = function (n) { this.emote = n; this.emoteUntil = U.now() + 1600; };

  // apply movement from input vector (normalized -1..1) with water/land limits
  Player.prototype.move = function (ix, iy, dt, waterFrac) {
    if (this.sitting) { this.sitting = null; }
    var depth = waterFrac || 0;
    var walkSpeed = 360; // brisk, responsive walking speed (~360 px/s)
    if (U.now() < this.speedBoostUntil) walkSpeed *= 1.35; // Electrolyte / Coffee speed boost!
    if (depth > 0.5) walkSpeed = 140;
    else if (depth > 0) walkSpeed = 220;
    this.swim = depth > 0.25;
    var speed = walkSpeed * dt;                // px this frame
    var tx = ix * speed, ty = iy * speed;
    var ox = this.x, oy = this.y;
    this.x += tx; this.y += ty;
    if (dt > 0) { this.vx = tx / dt; this.vy = ty / dt; }
    var mag = Math.sqrt(tx * tx + ty * ty);
    this.sq = U.lerp(this.sq, mag > 0.4 ? 1 : 0, Math.min(1, 12 * dt));
    if (Math.abs(tx) > 0.2) this.facing = tx > 0 ? 1 : -1;
    if (mag > 0.4) {
      this.stepPhase += mag * 0.05;
      this.trail.push({ x: this.x, y: this.y, t: U.now() });
      if (this.trail.length > 14) this.trail.shift();
    }
    // trail decay
    var cut = U.now() - 420;
    while (this.trail.length && this.trail[0].t < cut) this.trail.shift();
    return { ox: ox, oy: oy };
  };

  Player.prototype.revert = function (ox, oy) { this.x = ox; this.y = oy; };

  Player.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var art = this.art;
    var now = U.now();
    var isBoosted = now < this.speedBoostUntil;
    var isShocked = now < this.shockUntil;

    // Shock jitter
    if (isShocked) {
      sx += (Math.random() - 0.5) * 6;
      sy += (Math.random() - 0.5) * 6;
    }

    // trail (with golden/cyan sparkles if boosted)
    for (var i = 0; i < this.trail.length; i++) {
      var p = this.trail[i];
      var a = (i / this.trail.length) * (isBoosted ? 0.7 : 0.35);
      ctx.globalAlpha = a;
      ctx.fillStyle = isBoosted ? (i % 2 === 0 ? "#ffd166" : "#00d2d3") : "#ffffff";
      ctx.beginPath(); ctx.arc(p.x - cam.x, p.y - cam.y, isBoosted ? 6 : 5, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.swim) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy + 4, 20, 8, 0, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    var squash = 1 + this.sq * 0.12;
    var stretch = 1 - this.sq * 0.08;
    if (art.complete && art.naturalWidth) {
      var w = 34 * squash, h = 40 * stretch;
      if (this.facing < 0) {
        ctx.save(); ctx.translate(sx, sy); ctx.scale(-1, 1);
        ctx.drawImage(art, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(art, sx - w / 2, sy - h / 2, w, h);
      }
    } else {
      ctx.fillStyle = "#4a3728";
      ctx.beginPath(); ctx.arc(sx, sy, 14, 0, 6.2832); ctx.fill();
    }

    // shadows / hats / glasses / flag / emote
    var save = CCE.load();
    var hat = save.hat || "normal";
    var hd = CC.HAT_DEFS[hat] || CC.HAT_DEFS.normal;
    var hatImg = CCA.img("optimized/hats/" + (CC.HAT_FILES[hat] || hat) + ".webp");
    if (hatImg.complete && hatImg.naturalWidth) {
      var s = hd.size;
      ctx.drawImage(hatImg, sx + hd.x - s / 2, sy + hd.y - s / 2, s, s);
    }
    if (save.glasses) {
      var g = save.glasses;
      var gd = CC.HAT_DEFS[g] || CC.HAT_DEFS.sunglasses;
      var gi = CCA.img("optimized/hats/" + (CC.HAT_FILES[g] || g) + ".webp");
      if (gi.complete && gi.naturalWidth) {
        var gs = gd.size;
        ctx.drawImage(gi, sx + gd.x - gs / 2, sy + gd.y - gs / 2, gs, gs);
      }
    }
    if (save.shorts) {
      var sh = CCA.img("optimized/hats/shorts.webp");
      if (sh.complete && sh.naturalWidth) {
        var sd = CC.HAT_DEFS.shorts;
        ctx.drawImage(sh, sx + sd.x - sd.size / 2, sy + sd.y - sd.size / 2, sd.size, sd.size);
      }
    }
    if (this.flag) {
      var fi = CCA.img("optimized/flags/" + this.flag + ".webp");
      if (fi.complete && fi.naturalWidth) ctx.drawImage(fi, sx + 14, sy - 22, 18, 12);
    }
    if (this.emote && U.now() < this.emoteUntil) {
      var ei = CCA.img("optimized/emotes/" + this.emote + ".webp");
      if (ei.complete && ei.naturalWidth) {
        var bub = 1 + (U.now() % 300) / 900;
        ctx.drawImage(ei, sx - 20, sy - 56 - (bub - 1) * 20, 40, 40);
      } else {
        ctx.font = "26px sans-serif";
        ctx.fillText("\uD83D\uDCAC", sx - 14, sy - 40);
      }
    }

    // --- Held items ---
    if (this.held === "watercan") {
      var wc = CCA.img("optimized/objects/sauna-bucket.webp");
      if (wc.complete && wc.naturalWidth) ctx.drawImage(wc, sx + 12, sy + 6, 20, 20);
    } else if (this.held === "wood") {
      // Rustic firewood log in hands
      ctx.save();
      ctx.strokeStyle = "#5a3d26";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + 14);
      ctx.lineTo(sx + 26, sy - 4);
      ctx.stroke();
      ctx.restore();
    } else if (this.held === "marshmallow") {
      // Marshmallow Roasting Stick!
      ctx.save();
      // Calculate stick angle towards campfire if near, or angled up-right
      var fp = window.CC_G && window.CC_G.firePos;
      var fireX = fp ? fp.x : this.x, fireY = fp ? fp.y : this.y - 60;
      var cAngle = -0.65; // default angle (~38 deg up-right)
      var dFire = Math.hypot(this.x - fireX, this.y - fireY);
      if (dFire < 450) {
        cAngle = Math.atan2(fireY - this.y, fireX - this.x);
      }
      var stickLen = 48;
      var tipX = sx + Math.cos(cAngle) * stickLen;
      var tipY = sy + Math.sin(cAngle) * stickLen;

      // Wooden twig stick
      ctx.strokeStyle = "#8a5a33";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + 6);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Marshmallow on tip
      var rLvl = this.roastLevel || 0;
      // Color transition: white -> golden ivory -> rich caramel -> crispy brown
      var mColor = "#ffffff";
      if (rLvl > 0.9) mColor = "#3e2312";
      else if (rLvl > 0.6) mColor = "#c87d2b";
      else if (rLvl > 0.3) mColor = "#f4cf82";
      else if (rLvl > 0.05) mColor = "#fdf3db";

      ctx.fillStyle = mColor;
      ctx.strokeStyle = "#7f532a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tipX - 7, tipY - 7, 14, 14, 4);
      ctx.fill();
      ctx.stroke();

      // Sizzling sparks / steam when actively roasting
      if (rLvl > 0.1 && dFire < 220) {
        ctx.fillStyle = "#ffd166";
        for (var sp = 0; sp < 4; sp++) {
          var spAngle = Math.random() * 6.28;
          var spDist = 4 + Math.random() * 10;
          ctx.beginPath();
          ctx.arc(tipX + Math.cos(spAngle) * spDist, tipY + Math.sin(spAngle) * spDist - Math.random() * 8, 1.5, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Electric Shock lightning bolts around cursor
    if (isShocked) {
      ctx.save();
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2.5;
      for (var lk = 0; lk < 3; lk++) {
        var lx = sx + (Math.random() - 0.5) * 36;
        var ly = sy + (Math.random() - 0.5) * 36;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (Math.random() - 0.5) * 16, ly + (Math.random() - 0.5) * 16);
        ctx.lineTo(lx + (Math.random() - 0.5) * 24, ly + (Math.random() - 0.5) * 24);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  window.Player = Player;
})();
