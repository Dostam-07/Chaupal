(function () {
  "use strict";

  // ---------------------------------------------------------------
  // Element classes. Each element from a map JSON becomes an object
  // with update(dt,t), render(ctx,cam), and/or click(px,py,t,game).
  // ---------------------------------------------------------------

  var CLASS = "CC_O";

  function Base(def) { this.def = def; this.removed = false; this.dead = false; }

  // generic sprite-that-sits-on-the-ground
  function StaticObj(def) {
    Base.call(this, def);
    this.img = CCA.img(def.src.replace(/^\//, ""));
  }
  StaticObj.prototype = Object.create(Base.prototype);
  StaticObj.prototype.render = function (ctx, cam) {
    var im = this.img;
    if (!im.complete || !im.naturalWidth) return;
    var w = this.def.width || im.naturalWidth;
    var h = this.def.height || im.naturalHeight;
    var x = this.def.x - (this.def.anchor || 0.5) * w;
    var y = this.def.y - (this.def.anchorY != null ? this.def.anchorY : 0.5) * h;
    if (this.def.layer || this.def.zIndex) return; // drawn later (z-order pass)
    ctx.globalAlpha = (this.def.opacity != null ? this.def.opacity : 1);
    ctx.drawImage(im, this.def.x - cam.x - w / 2, this.def.y - cam.y - h / 2, w, h);
    ctx.globalAlpha = 1;
  };
  StaticObj.prototype.z = function () { return this.def.zIndex || this.def.layer || 0; };
  StaticObj.prototype.zRender = function (ctx, cam) {
    var im = this.img;
    if (!im.complete || !im.naturalWidth) return;
    var w = this.def.width || im.naturalWidth;
    var h = this.def.height || im.naturalHeight;
    ctx.drawImage(im, this.def.x - cam.x - w / 2, this.def.y - cam.y - h / 2, w, h);
  };

  // an image that you click once to collect
  function SpriteItem(def) {
    Base.call(this, def);
    this.img = CCA.img(def.src.replace(/^\//, ""));
    this.size = def.size || 30;
    this.anchorY = def.anchorY || 1;
  }
  SpriteItem.prototype = Object.create(Base.prototype);
  SpriteItem.prototype.render = function (ctx, cam) {
    if (this.removed) return;
    var im = this.img;
    if (!im.complete || !im.naturalWidth) return;
    var s = this.size;
    ctx.drawImage(im, this.def.x - cam.x - s / 2, this.def.y - cam.y - s, s, s);
  };
  SpriteItem.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, Math.max(26, this.size * 0.9)); };

  // invisible rect that spawns an action when clicked
  function ClickArea(def) {
    Base.call(this, def);
    this.w = def.width || 120; this.h = def.height || 120;
  }
  ClickArea.prototype = Object.create(Base.prototype);
  ClickArea.prototype.render = function () {};
  ClickArea.prototype.hit = function (px, py) { return U.inRect(px, py, { x: this.def.x - this.w / 2, y: this.def.y - this.h / 2, w: this.w, h: this.h }); };
  ClickArea.prototype.z = function () { return 1; };

  function Door(def) {
    Base.call(this, def);
    this.w = def.width || 80; this.h = def.height || 80;
    this.entered = false;
    this.debounce = 0;
  }
  Door.prototype = Object.create(Base.prototype);
  Door.prototype.constructor = Door;
  Door.prototype.render = function (ctx, cam) {
    if (this.w > 400 || this.h > 400) return;
    if (this.def.noArt) return;
    var x = this.def.x - cam.x, y = this.def.y - cam.y;
    // Check if player is near to highlight doorway gently
    var p = CC_G.player;
    var near = p && Math.hypot(p.x - (this.def.x + this.w / 2), p.y - (this.def.y + this.h / 2)) < 160;
    ctx.save();
    ctx.globalAlpha = near ? 0.45 : 0.22;
    ctx.fillStyle = near ? "#f39c12" : "#8a5a33";
    // Draw centered on door footprint
    var dw = Math.min(this.w, 180), dh = Math.min(this.h, 180);
    ctx.beginPath();
    ctx.roundRect(x - dw / 2, y - dh / 2, dw, dh, 12);
    ctx.fill();
    if (near) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  };
  Door.prototype.update = function (dt, t, game) {
    if (this.debounce > 0) this.debounce -= dt;
  }; 
  // returns dest map when player steps on it
  Door.prototype.touching = function (px, py) {
    if (this.debounce > 0) return null;
    var w = Math.max(this.w || 80, 70), h = Math.max(this.h || 80, 70);
    var margin = 40; // generous walk-in margin
    // 1. Top-left corner box check
    var hitCorner = (px >= this.def.x - margin && px <= this.def.x + w + margin &&
                     py >= this.def.y - margin && py <= this.def.y + h + margin);
    // 2. Center-origin box check
    var hitCenter = (px >= this.def.x - w / 2 - margin && px <= this.def.x + w / 2 + margin &&
                     py >= this.def.y - h / 2 - margin && py <= this.def.y + h / 2 + margin);
    // 3. Radial distance check
    var cx = this.def.x + (this.w > 120 ? w / 2 : 0);
    var cy = this.def.y + (this.h > 120 ? h / 2 : 0);
    var hitRadial = Math.hypot(px - cx, py - cy) <= Math.max(w, h) / 2 + margin;
    
    if (hitCorner || hitCenter || hitRadial) {
      this.debounce = 2.0;
      return { to: this.def.to, x: this.def.toX, y: this.def.toY, sound: this.def.doorSound };
    }
    return null;
  };
  // Clickable hitbox: ultra generous reach so clicking any doorway/gate/opening
  // immediately transitions, just like the original campground build.
  Door.prototype.hit = function (px, py) {
    var w = Math.max(this.w || 90, 90), h = Math.max(this.h || 90, 90);
    var margin = 70; // ultra generous click reach
    var hitCorner = (px >= this.def.x - margin && px <= this.def.x + w + margin &&
                     py >= this.def.y - margin && py <= this.def.y + h + margin);
    var hitCenter = (px >= this.def.x - w / 2 - margin && px <= this.def.x + w / 2 + margin &&
                     py >= this.def.y - h / 2 - margin && py <= this.def.y + h / 2 + margin);
    var cx = this.def.x + (this.w > 120 ? w / 2 : 0);
    var cy = this.def.y + (this.h > 120 ? h / 2 : 0);
    var hitRadial = Math.hypot(px - cx, py - cy) <= Math.max(w, h) / 2 + margin;
    return hitCorner || hitCenter || hitRadial;
  };
  Door.prototype.z = function () { return 1; };

  function River(def) {
    Base.call(this, def);
    this.points = def.points || [];
    this.width = def.width || 60;
    this.speed = def.speed || 150;
    // polyline length + cumulative
    this.len = 0; this.cum = [0];
    for (var i = 1; i < this.points.length; i++) {
      var dx = this.points[i].x - this.points[i - 1].x;
      var dy = this.points[i].y - this.points[i - 1].y;
      this.len += Math.sqrt(dx * dx + dy * dy);
      this.cum.push(this.len);
    }
    this.phase = Math.random() * 6.28;
  }
  River.prototype = Object.create(Base.prototype);
  // flow vector at world point (returns {x,y} velocity)
  River.prototype.flowAt = function (px, py) {
    var best = -1, bp = 0;
    for (var i = 0; i < this.points.length; i++) {
      var dx = px - this.points[i].x, dy = py - this.points[i].y;
      var d = dx * dx + dy * dy;
      if (best < 0 || d < best) { best = d; bp = i; }
    }
    if (best > this.width * this.width * 0.6) return null;
    // tangent vector through nearest segment
    var a = Math.max(0, bp - 1), b = Math.min(this.points.length - 1, bp + 1);
    if (b === a) b = Math.min(this.points.length - 1, a + 1);
    var tx = this.points[b].x - this.points[a].x, ty = this.points[b].y - this.points[a].y;
    var len = Math.sqrt(tx * tx + ty * ty) || 1;
    var segW = Math.min(this.width, this.points[bp].width || this.width);
    var flow = this.speed * (this.points[bp].speed || 1);
    return { x: (tx / len) * flow, y: (ty / len) * flow, near: Math.sqrt(best) < segW * 0.5, width: segW };
  };
  River.prototype.render = function (ctx, cam) {
    // subtle animation of leading edge
    var self = this;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = this.width;
    ctx.strokeStyle = "rgba(80,140,190,0.28)";
    ctx.beginPath();
    for (var i = 0; i < this.points.length; i++) {
      var p = this.points[i];
      if (i === 0) ctx.moveTo(p.x - cam.x, p.y - cam.y);
      else ctx.lineTo(p.x - cam.x, p.y - cam.y);
    }
    ctx.stroke();
    ctx.restore();
  };
  River.prototype.z = function () { return 0; };

  window[CLASS] = { Base: Base, StaticObj: StaticObj, SpriteItem: SpriteItem, ClickArea: ClickArea, Door: Door, River: River };
})();(function () {
  "use strict";
  var cls = CC_O;

  // ---- world collectibles & interactions ----

  function Seashell(def, idx) {
    cls.Base.call(this, def);
    this.idx = idx;
    this.img = CCA.img("optimized/objects/seashell.webp");
    this.size = 22;
  }
  Seashell.prototype = Object.create(cls.Base.prototype);
  Seashell.prototype.render = function (ctx, cam) {
    if (this.removed) return;
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    var bob = Math.sin(U.now() / 500 + this.idx) * 2;
    ctx.drawImage(im, this.def.x - cam.x - 11, this.def.y - cam.y - 11 + bob, 22, 22);
    var cx = CC_G.lastCursorX, cy = CC_G.lastCursorY;
    if (cx != null && U.dist2(this.def.x, this.def.y, cx, cy) < 90 * 90) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(U.now() / 200);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.def.x - cam.x, this.def.y - cam.y, 16, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
  Seashell.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 30); };

  function Hat(def, idx) {
    cls.Base.call(this, def);
    this.idx = idx;
    this.hid = def.item || def.type;
    this.slot = def.slot || "hat";
    this.path = "optimized/hats/";
    this.size = def.size || 22;
    this.imgLoaded = false;
    this.tryLoad();
  }
  Hat.prototype.tryLoad = function () {
    var self = this;
    this.img = new Image();
    this.img.onload = function () { self.imgLoaded = true; };
    this.img.onerror = function () { self.imgLoaded = false; };
    this.img.src = CCA.p(this.path + (CC.HAT_FILES[this.hid] || this.hid) + ".webp");
  };
  Hat.prototype.render = function (ctx, cam) {
    if (!this.img || !this.imgLoaded) return;
    var s = this.size;
    var bob = Math.sin(U.now() / 700 + this.idx) * 2;
    ctx.drawImage(this.img, this.def.x - cam.x - s / 2, this.def.y - cam.y - s / 2 + bob, s, s);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#3d5a80";
    ctx.beginPath(); ctx.arc(this.def.x - cam.x, this.def.y - cam.y, 6, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
  };
  Hat.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 34); };
  Hat.prototype.collect = function () { return { hat: this.hid, slot: this.slot, label: this.def.label || this.hid }; };

  function Chair(def, idx) {
    cls.Base.call(this, def);
    this.idx = idx;
    this.img = CCA.img("optimized/objects/chair.webp");
    this.size = def.size || Math.max(def.width || 0, def.height || 0, 34);
    this.sitting = false;
    this.rotate = def.rotate || 0;
  }
  Chair.prototype = Object.create(cls.Base.prototype);
  Chair.prototype.render = function (ctx, cam) {
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    ctx.save();
    ctx.translate(this.def.x - cam.x, this.def.y - cam.y);
    ctx.rotate((this.rotate * Math.PI) / 180);
    ctx.drawImage(im, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  };
  Chair.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, this.size * 0.8); };

  function Watercan(def) {
    cls.Base.call(this, def);
    this.held = false;
    this.img = CCA.img("optimized/objects/sauna-bucket.webp");
    this.size = 30;
  }
  Watercan.prototype = Object.create(cls.Base.prototype);
  Watercan.prototype.render = function (ctx, cam) {
    if (this.held) return;
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    ctx.drawImage(im, this.def.x - cam.x - this.size / 2, this.def.y - cam.y - this.size / 2, this.size, this.size);
  };
  Watercan.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 32); };

  function Plant(def, idx) {
    cls.Base.call(this, def);
    this.idx = idx;
    this.watered = false;
    this.stage = 1;
    this.size = def.size || 26;
  }
  Plant.prototype = Object.create(cls.Base.prototype);
  Plant.prototype.setStage = function (n) {
    if (n === this.stage) return;
    this.stage = n;
    this.img = CCA.img("optimized/objects/garden/tomato-" + Math.min(4, Math.max(1, n)) + ".webp");
  };
  Plant.prototype.render = function (ctx, cam) {
    if (!this.img) this.setStage(1);
    var im = this.img; if (!im || !im.complete || !im.naturalWidth) return;
    var s = this.size;
    ctx.drawImage(im, this.def.x - cam.x - s / 2, this.def.y - cam.y - s / 2, s, s);
    if (this.watered) {
      ctx.globalAlpha = 0.75;
      ctx.font = "15px sans-serif";
      ctx.fillText("💧", this.def.x - cam.x + 8, this.def.y - cam.y - 8);
      ctx.globalAlpha = 1;
    }
  };
  Plant.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 30); };

  function MetalDetector(def) {
    cls.Base.call(this, def);
    this.using = false;
    this.useUntil = 0;
    this.img = CCA.img("optimized/objects/metal-detector.webp");
    this.size = def.size || 40;
  }
  MetalDetector.prototype = Object.create(cls.Base.prototype);
  MetalDetector.prototype.render = function (ctx, cam) {
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    ctx.drawImage(im, this.def.x - cam.x - this.size / 2, this.def.y - cam.y - this.size / 2, this.size, this.size);
    if (this.using && U.now() < this.useUntil) {
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(U.now() / 60);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.arc(this.def.x - cam.x, this.def.y - cam.y, 60, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
    }
  };
  MetalDetector.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 44); };
  MetalDetector.prototype.update = function (dt, t, game) {
    if (this.using && U.now() > this.useUntil) this.using = false;
  };

  function Metal(def) {
    cls.Base.call(this, def);
    this.found = false;
    this.img = CCA.img("optimized/objects/" + String(def.img || "").split("/").pop());
    this.size = def.size || 30;
  }
  Metal.prototype = Object.create(cls.Base.prototype);
  Metal.prototype.render = function (ctx, cam) {
    if (!this.found) return;
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    ctx.drawImage(im, this.def.x - cam.x - this.size / 2, this.def.y - cam.y - this.size / 2, this.size, this.size);
  };
  Metal.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 30); };

  function Marshmallow(def) {
    cls.Base.call(this, def);
    this.img = CCA.img("optimized/objects/marshmallow.webp");
    this.size = 28;
    // Positions are already in top-down world space after U.flipMap().
    this.campfireX = def.campfireX != null ? def.campfireX : def.x;
    this.campfireY = def.campfireY != null ? def.campfireY : def.y;
  }
  Marshmallow.prototype = Object.create(cls.Base.prototype);
  Marshmallow.prototype.render = function (ctx, cam) {
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    var s = this.size;
    var x = this.def.x - cam.x, y = this.def.y - cam.y;
    // Draw marshmallow stick pack
    ctx.save();
    ctx.drawImage(im, x - s / 2, y - s / 2, s, s);
    // Draw little wooden stick bundle indicator
    ctx.strokeStyle = "#8a5a33";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 10);
    ctx.lineTo(x + 18, y - 18);
    ctx.stroke();
    // Glowing sparkle indicator
    var p = CC_G.player;
    if (p && Math.hypot(p.x - this.def.x, p.y - this.def.y) < 140) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(U.now() / 200);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 6.2832);
      ctx.stroke();
    }
    ctx.restore();
  };
  Marshmallow.prototype.hit = function (px, py) {
    return U.hitCircle(px, py, this.def.x, this.def.y, 44);
  };

  function Cat(def) {
    cls.Base.call(this, def);
    this.pets = 0; this.lastPet = 0;

    this.size = 30;
    this.phase = Math.random() * 6.28;
  }
  Cat.prototype = Object.create(cls.Base.prototype);
  Cat.prototype.render = function (ctx, cam) {
    var x = this.def.x - cam.x, y = this.def.y - cam.y;
    var sc = 1 + Math.sin(U.now() / 400 + this.phase) * 0.04;
    ctx.save();
    ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.fillStyle = "#4a3728";
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 11, 0, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(-11, -9, 8, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, -15); ctx.lineTo(-14, -25); ctx.lineTo(-8, -17); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, -15); ctx.lineTo(-5, -24); ctx.lineTo(-1, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f7e8c8";
    ctx.beginPath(); ctx.arc(-13, -10, 1.6, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(-8, -10, 1.6, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = "#4a3728"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(14, -2);
    ctx.quadraticCurveTo(26, -10, 20 + Math.sin(U.now() / 300) * 5, -20);
    ctx.stroke();
    ctx.restore();
  };
  Cat.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, 30); };

  cls.Seashell = Seashell;
  cls.Hat = Hat;
  cls.Chair = Chair;
  cls.Watercan = Watercan;
  cls.Plant = Plant;
  cls.MetalDetector = MetalDetector;
  cls.Metal = Metal;
  cls.Marshmallow = Marshmallow;
  cls.Cat = Cat;
})();
(function () {
  "use strict";
  var cls = CC_O;

  // ============ soccer ============
  function SoccerBall(def) {
    cls.Base.call(this, def);
    this.img = CCA.img("optimized/objects/soccer-ball.webp");
    this.r = def.r || 16;
    this.x = def.x; this.y = def.y;
    this.home = { x: def.x, y: def.y };
    this.vx = 0; this.vy = 0;
    this.rotation = 0;
    this.playArea = def.playArea || null;
    this.goals = def.goals || [];
    this.kickStrength = def.kickStrength || 14;
    this._lastKickSound = 0;
    this._confetti = [];
  }
  SoccerBall.prototype = Object.create(cls.Base.prototype);
  SoccerBall.prototype.render = function (ctx, cam) {
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    // Drop shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.r - 2, this.r * 0.9, this.r * 0.35, 0, 0, 6.2832);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Rolling ball rotation
    ctx.translate(sx, sy);
    ctx.rotate(this.rotation);
    ctx.drawImage(im, -this.r, -this.r, this.r * 2, this.r * 2);
    ctx.restore();

    // Confetti particles on goal
    if (this._confetti.length) {
      ctx.save();
      for (var ci = 0; ci < this._confetti.length; ci++) {
        var cf = this._confetti[ci];
        ctx.globalAlpha = Math.max(0, cf.life);
        ctx.fillStyle = cf.color;
        ctx.fillRect(cf.x - cam.x, cf.y - cam.y, cf.size, cf.size);
      }
      ctx.restore();
    }

    if (CC_G.debugBall) {
      if (this.playArea) {
        ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 2;
        ctx.strokeRect(this.playArea.x - cam.x, this.playArea.y - cam.y, this.playArea.w, this.playArea.h);
      }
      var self = this;
      this.goals.forEach(function (g) {
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(g[0].x - cam.x, g[0].y - cam.y);
        for (var i = 1; i < g.length; i++) ctx.lineTo(g[i].x - cam.x, g[i].y - cam.y);
        ctx.closePath(); ctx.stroke();
      });
    }
  };
  SoccerBall.prototype.pointInPoly = function (x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  SoccerBall.prototype.update = function (dt, t, game) {
    // 1. Continuous physical contact with player cursor
    if (game && game.player) {
      var p = game.player;
      var pdx = this.x - p.x, pdy = this.y - p.y;
      var pdist = Math.hypot(pdx, pdy);
      var kickRadius = this.r + 20;
      if (pdist < kickRadius && pdist > 0.1) {
        var nx = pdx / pdist, ny = pdy / pdist;
        var pSpeed = Math.hypot(p.vx || 0, p.vy || 0);
        var impulse = Math.max(pSpeed * 1.5, 300);
        this.vx = nx * impulse + (p.vx || 0) * 0.4;
        this.vy = ny * impulse + (p.vy || 0) * 0.4;
        this.x = p.x + nx * (kickRadius + 2);
        if (!this._lastKickSound || U.now() - this._lastKickSound > 180) {
          game.play("soccer-kick");
          this._lastKickSound = U.now();
        }
      }
    }

    // 2. Continuous physical contact with wandering campers
    if (game && game.campers && game.campers.list) {
      for (var ci = 0; ci < game.campers.list.length; ci++) {
        var cp = game.campers.list[ci];
        var cdx = this.x - cp.x, cdy = this.y - cp.y;
        var cdist = Math.hypot(cdx, cdy);
        if (cdist < this.r + 18 && cdist > 0.1) {
          var cnx = cdx / cdist, cny = cdy / cdist;
          this.vx = cnx * 260 + (cp.vx || 0) * 0.5;
          this.vy = cny * 260 + (cp.vy || 0) * 0.5;
          this.x = cp.x + cnx * (this.r + 20);
          if (!this._lastKickSound || U.now() - this._lastKickSound > 220) {
            game.play("soccer-kick");
            this._lastKickSound = U.now();
          }
          break;
        }
      }
    }

    // 3. Movement & friction physics
    this.x += this.vx * dt; this.y += this.vy * dt;
    var speed = Math.hypot(this.vx, this.vy);
    this.rotation += (this.vx * dt) / this.r;
    var damp = Math.max(0, 1 - 1.2 * dt);
    this.vx *= damp; this.vy *= damp;
    if (speed < 5) { this.vx = 0; this.vy = 0; }

    // 4. Play area boundaries
    if (this.playArea) {
      var a = this.playArea, ax = a.x, ay = a.y, aw = a.w, ah = a.h;
      if (this.x < ax + this.r) { this.x = ax + this.r; this.vx = Math.abs(this.vx) * 0.75; }
      if (this.x > ax + aw - this.r) { this.x = ax + aw - this.r; this.vx = -Math.abs(this.vx) * 0.75; }
      if (this.y < ay + this.r) { this.y = ay + this.r; this.vy = Math.abs(this.vy) * 0.75; }
      if (this.y > ay + ah - this.r) { this.y = ay + ah - this.r; this.vy = -Math.abs(this.vy) * 0.75; }
    }

    // 5. Goal detection & celebration
    var self = this;
    this.goals.forEach(function (g) {
      if (!self._scored && self.pointInPoly(self.x, self.y, g)) {
        self._scored = true;
        game.toast("GOAL! \u26BD\uD83C\uDF89");
        game.play("goal");
        game.giveBadge("goal");
        game.shake = 8;
        // Spawn festive celebration confetti
        self._confetti = [];
        var colors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#9b59b6", "#ffffff"];
        for (var f = 0; f < 50; f++) {
          self._confetti.push({
            x: self.x, y: self.y,
            vx: (Math.random() - 0.5) * 400,
            vy: -150 - Math.random() * 250,
            size: 4 + Math.random() * 4,
            color: colors[f % colors.length],
            life: 1.0,
          });
        }
        self.x = self.home.x; self.y = self.home.y;
        self.vx = 0; self.vy = 0;
        setTimeout(function () { self._scored = false; }, 1800);
      }
    });

    // Update confetti
    for (var cfi = this._confetti.length - 1; cfi >= 0; cfi--) {
      var cf = this._confetti[cfi];
      cf.x += cf.vx * dt; cf.y += cf.vy * dt;
      cf.vy += 400 * dt; // gravity
      cf.life -= dt * 0.8;
      if (cf.life <= 0) this._confetti.splice(cfi, 1);
    }
  };
  // hit() stays a pure hit test: pick()/hover call it on every click, so it must
  // never move the ball. The impulse lives in kick(), called from interact().
  SoccerBall.prototype.hit = function (px, py) {
    return U.hitCircle(px, py, this.x, this.y, 45);
  };
  SoccerBall.prototype.kick = function (px, py) {
    var dx = this.x - px, dy = this.y - py;
    var d = Math.hypot(dx, dy);
    if (d < 8) {
      var pl = window.CC_G && window.CC_G.player;
      if (pl) { dx = this.x - pl.x; dy = this.y - pl.y; d = Math.hypot(dx, dy); }
      if (!d) { dx = 1; dy = -1; d = Math.SQRT2; }
    }
    this.vx = (dx / d) * this.kickStrength * 70;
    this.vy = (dy / d) * this.kickStrength * 70;
    if (window.CC_G) window.CC_G.play("soccer-kick");
  };

  // ============ volleyball ============
  function Volleyball(def) {
    cls.Base.call(this, def);
    this.img = CCA.img("optimized/objects/volleyball.webp");
    this.r = def.r || 14;
    this.x = def.x; this.y = def.y;
    this.z3d = 0;      // 3D vertical arc height
    this.vz3d = 0;     // vertical velocity
    this.vx = 0; this.vy = 0;
    this.bounds = def.bounds || null;
    this.netX = (def.netX != null ? def.netX : def.x);
    this.strength = def.strength || 10;
    this._lastHitSound = 0;
  }
  Volleyball.prototype = Object.create(cls.Base.prototype);
  Volleyball.prototype.z = function () { return 0; };
  Volleyball.prototype.render = function (ctx, cam) {
    var im = this.img; if (!im.complete || !im.naturalWidth) return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    // Ground shadow scales with height
    var shadowScale = Math.max(0.3, 1 - this.z3d / 180);
    ctx.save();
    ctx.globalAlpha = 0.3 * shadowScale;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.r - 2, this.r * shadowScale, this.r * 0.35 * shadowScale, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    // Ball rendered with 3D vertical height offset
    var ballScale = 1 + this.z3d / 350;
    var br = this.r * ballScale;
    ctx.drawImage(im, sx - br, sy - br - this.z3d, br * 2, br * 2);
  };
  Volleyball.prototype.update = function (dt, t, game) {
    // 1. Continuous physical contact with player
    if (game && game.player) {
      var p = game.player;
      var pdx = this.x - p.x, pdy = this.y - p.y;
      var pdist = Math.hypot(pdx, pdy);
      if (pdist < this.r + 24 && this.z3d < 60) {
        var nx = pdx / (pdist || 1), ny = pdy / (pdist || 1);
        this.vx = nx * 240 + (p.vx || 0) * 0.5;
        this.vy = ny * 240 + (p.vy || 0) * 0.5;
        this.vz3d = 280 + Math.random() * 80; // pop into air!
        if (!this._lastHitSound || U.now() - this._lastHitSound > 160) {
          game.play("volleyball-hit");
          this._lastHitSound = U.now();
        }
      }
    }

    // 2. 3D vertical gravity & ground bounce
    if (this.z3d > 0 || this.vz3d !== 0) {
      this.z3d += this.vz3d * dt;
      this.vz3d -= 650 * dt; // gravity
      if (this.z3d <= 0) {
        this.z3d = 0;
        this.vz3d = -this.vz3d * 0.62; // bouncy
        if (Math.abs(this.vz3d) < 40) this.vz3d = 0;
      }
    }

    // 3. Horizontal motion
    this.x += this.vx * dt; this.y += this.vy * dt;
    var damp = Math.max(0, 1 - 0.7 * dt);
    this.vx *= damp; this.vy *= damp;

    // 4. Net bounce
    if (Math.abs(this.x - this.netX) < this.r + 6 && this.z3d < 70) {
      this.x = this.netX + (this.x < this.netX ? -1 : 1) * (this.r + 6);
      this.vx = -this.vx * 0.85;
      if (game && (!this._lastHitSound || U.now() - this._lastHitSound > 200)) {
        game.play("volleyball-hit");
        this._lastHitSound = U.now();
      }
    }

    // 5. Bounds
    if (this.bounds) {
      var b = this.bounds;
      if (this.x < b.x + this.r) { this.x = b.x + this.r; this.vx = Math.abs(this.vx) * 0.8; }
      if (this.x > b.x + b.w - this.r) { this.x = b.x + b.w - this.r; this.vx = -Math.abs(this.vx) * 0.8; }
      if (this.y < b.y + this.r) { this.y = b.y + this.r; this.vy = Math.abs(this.vy) * 0.8; }
      if (this.y > b.y + b.h - this.r) { this.y = b.y + b.h - this.r; this.vy = -Math.abs(this.vy) * 0.8; }
    }
  };
  Volleyball.prototype.hit = function (px, py) {
    return U.hitCircle(px, py, this.x, this.y, 45);
  };
  Volleyball.prototype.kick = function (px, py) {
    var dx = this.x - px, dy = this.y - py;
    var d = Math.hypot(dx, dy);
    if (d < 8) {
      var pl = window.CC_G && window.CC_G.player;
      if (pl) { dx = this.x - pl.x; dy = this.y - pl.y; d = Math.hypot(dx, dy); }
      if (!d) { dx = 1; dy = -1; d = Math.SQRT2; }
    }
    this.vx = (dx / d) * this.strength * 55;
    this.vy = (dy / d) * this.strength * 55;
    this.vz3d = 340; // spike into air!
    if (window.CC_G) window.CC_G.play("volleyball-hit");
  };

  // ============ tetherball ============
  function TetherBall(def) {
    cls.Base.call(this, def);
    this.img = CCA.img("optimized/objects/volleyball.webp");
    this.pole = { x: def.x, y: def.y };
    this.angle = def.angle || 0;
    this.avel = 0;
    this.baseRope = (def.rope != null ? def.rope : 70);
    this.rope = this.baseRope;
    this.turns = 0;
    this.rb = def.r || 14;
    this.x = this.pole.x + Math.cos(this.angle) * this.rope;
    this.y = this.pole.y + Math.sin(this.angle) * this.rope;
    this.bounds = def.bounds || null;
    this.strength = def.strength || 2.4;
  }
  TetherBall.prototype = Object.create(cls.Base.prototype);
  TetherBall.prototype.render = function (ctx, cam) {
    ctx.save();
    // Pole base
    ctx.fillStyle = "#5a3d28";
    ctx.beginPath(); ctx.arc(this.pole.x - cam.x, this.pole.y - cam.y, 8, 0, 6.2832); ctx.fill();
    // Swiveling rope
    ctx.strokeStyle = "#8a5a33"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.pole.x - cam.x, this.pole.y - cam.y);
    ctx.lineTo(this.x - cam.x, this.y - cam.y);
    ctx.stroke();
    // Ball
    var im = this.img;
    if (im.complete && im.naturalWidth)
      ctx.drawImage(im, this.x - cam.x - this.rb, this.y - cam.y - this.rb, this.rb * 2, this.rb * 2);
    ctx.restore();
  };
  TetherBall.prototype.update = function (dt, t, game) {
    // Continuous contact with player cursor
    if (game && game.player) {
      var p = game.player;
      var dist = Math.hypot(this.x - p.x, this.y - p.y);
      if (dist < this.rb + 16) {
        var tx = Math.cos(this.angle + Math.PI / 2), ty = Math.sin(this.angle + Math.PI / 2);
        var dx = this.x - p.x, dy = this.y - p.y;
        var dir = (dx * tx + dy * ty > 0) ? 1 : -1;
        this.avel += dir * 4.5;
        if (Math.abs(this.avel) > 12) this.avel = (this.avel > 0 ? 1 : -1) * 12;
      }
    }
    this.angle += this.avel * dt;
    this.turns += (this.avel * dt) / (Math.PI * 2);
    // Rope coils around pole dynamically!
    var wrap = Math.min(Math.abs(this.turns) * 5, this.baseRope - 18);
    this.rope = this.baseRope - wrap;
    // Spring reversal when fully wrapped
    if (this.rope <= 22 && Math.abs(this.avel) > 0.5) {
      this.avel = -this.avel * 0.8;
    }
    this.avel *= Math.max(0, 1 - 0.45 * dt);
    this.x = this.pole.x + Math.cos(this.angle) * this.rope;
    this.y = this.pole.y + Math.sin(this.angle) * this.rope;
  };
  TetherBall.prototype.hit = function (px, py) {
    return U.hitCircle(px, py, this.x, this.y, 45);
  };
  TetherBall.prototype.whack = function (px, py) {
    var tx = Math.cos(this.angle + Math.PI / 2), ty = Math.sin(this.angle + Math.PI / 2);
    var dx = this.x - px, dy = this.y - py;
    var dir = (dx * tx + dy * ty > 0) ? 1 : -1;
    this.avel += dir * this.strength * 2;
    if (window.CC_G) window.CC_G.play("volleyball-hit");
  };

  // ============ seesaw ============
  function Seesaw(def) {
    cls.Base.call(this, def);
    this.tilt = 0; this.target = 0;
    this.len = def.len || 130;
    this.vel = 0;
  }
  Seesaw.prototype = Object.create(cls.Base.prototype);
  Seesaw.prototype.update = function (dt, t, game) {
    // Continuous tilt based on where player cursor stands
    if (game && game.player) {
      var p = game.player;
      var dist = Math.hypot(p.x - this.def.x, p.y - this.def.y);
      if (dist < this.len / 2 + 15) {
        var side = p.x - this.def.x;
        if (side < -15) this.target = -0.42;
        else if (side > 15) this.target = 0.42;
      } else {
        this.target = 0; // return to level
      }
    }
    // Damped spring motion
    var diff = this.target - this.tilt;
    this.vel += diff * 18 * dt;
    this.vel *= Math.max(0, 1 - 4 * dt);
    this.tilt += this.vel * dt;
  };
  Seesaw.prototype.render = function (ctx, cam) {
    ctx.save();
    ctx.translate(this.def.x - cam.x, this.def.y - cam.y);
    ctx.rotate(this.tilt);
    // Wooden plank
    ctx.fillStyle = "#8a5a33";
    ctx.fillRect(-this.len / 2, -7, this.len, 14);
    // Handles
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(-this.len / 2 + 8, -18, 5, 12);
    ctx.fillRect(this.len / 2 - 13, -18, 5, 12);
    // Base pivot
    ctx.rotate(-this.tilt);
    ctx.fillStyle = "#5a3d26";
    ctx.beginPath();
    ctx.moveTo(-10, 24); ctx.lineTo(0, -2); ctx.lineTo(10, 24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  Seesaw.prototype.hit = function (px, py) {
    return U.hitCircle(px, py, this.def.x, this.def.y, this.len / 2 + 15);
  };
  Seesaw.prototype.push = function () {
    this.target = this.target > 0 ? -0.45 : 0.45;
    if (window.CC_G) window.CC_G.play("wood-door");
  };
  Seesaw.prototype.z = function () { return 0; };

  cls.SoccerBall = SoccerBall;
  cls.Volleyball = Volleyball;
  cls.TetherBall = TetherBall;
  cls.Seisaw = Seesaw;
  cls.Seesaw = Seesaw;
})();
(function () {
  "use strict";
  var cls = CC_O;

  // ============ trigger / gadget / lap tracker ============
  function Trigger(def) {
    cls.Base.call(this, def);
    this.action = def.action;
    this.hint = def.hint || "Go!";
    this.used = false; this.usableAgainAt = 0;
  }
  Trigger.prototype = Object.create(cls.Base.prototype);
  Trigger.prototype.render = function (ctx, cam) {
    var u = U.now();
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(u / 300);
    ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 4;
    ctx.strokeRect(this.def.x - cam.x - 30, this.def.y - cam.y - 30, 60, 60);
    ctx.restore();
  };
  Trigger.prototype.hit = function (px, py) {
    if (U.now() < this.usableAgainAt) return false;
    return U.inRect(px, py, { x: this.def.x - 40, y: this.def.y - 40, w: 80, h: 80 });
  };
  Trigger.prototype.z = function () { return 1; };

  function Gadget(def) {
    cls.Base.call(this, def);
    this.src = (def.src || "").replace(/^\//, "");
    this.toastText = def.toast || def.label;
    this.uses = 0;
    this.img = this.src ? CCA.img(this.src) : null;
  }
  Gadget.prototype = Object.create(cls.Base.prototype);
  Gadget.prototype.render = function (ctx, cam) {
    if (!this.img || !this.img.complete || !this.img.naturalWidth) return;
    var s = this.def.size || 30;
    ctx.drawImage(this.img, this.def.x - cam.x - s / 2, this.def.y - cam.y - s / 2, s, s);
  };
  Gadget.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, (this.def.size || 30) * 0.9); };
  Gadget.prototype.z = function () { return 0; };

  function LapTracker(def) {
    cls.Base.call(this, def);
    this.cp = def.checkpoints || CC.GAME_CONFIG.lapCheckpoints;
    this.next = 0;
    this.laps = 0;
    this.lastBeep = 0;
  }
  LapTracker.prototype = Object.create(cls.Base.prototype);
  LapTracker.prototype.update = function (dt, t, game, px, py) {
    if (this.cp.length === 0 || px == null || py == null) return;
    var c = this.cp[this.next];
    if (U.inRect(px, py, c)) {
      this.next++;
      if (this.next >= this.cp.length) {
        this.next = 0; this.laps++;
        game.toast("Lap " + this.laps + "! \uD83C\uDFC1");
        game.play("bell");
      } else if (U.now() - this.lastBeep > 150) {
        game.play("beep");
        this.lastBeep = U.now();
      }
    }
  };
  LapTracker.prototype.render = function (ctx, cam) {
    ctx.save();
    for (var i = 0; i < this.cp.length; i++) {
      var c = this.cp[i];
      var active = i === this.next;
      ctx.globalAlpha = active ? 0.7 : 0.25;
      ctx.fillStyle = active ? "#4cd137" : "#95a5a6";
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - cam.x, c.y + c.h / 2 - cam.y, active ? 16 : 8, 0, 6.2832);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };
  LapTracker.prototype.z = function () { return -1; };

  cls.Trigger = Trigger;
  cls.Gadget = Gadget;
  cls.LapTracker = LapTracker;
})();
(function () {
  "use strict";
  var cls = CC_O;

  // telescope hotspots with emoji + caption
  function HoverPoint(def) {
    cls.Base.call(this, def);
    this.radius = def.radius || 30;
    this.text = def.text || "";
    this.emoji = def.emoji || "\u2b50";
    this.seen = false;
  }
  HoverPoint.prototype = Object.create(cls.Base.prototype);
  HoverPoint.prototype.render = function (ctx, cam) {
    var x = this.def.x - cam.x, y = this.def.y - cam.y;
    var near = this.near;
    ctx.save();
    ctx.globalAlpha = near ? 1 : 0.55;
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.emoji, x, y + 8);
    if (near && this.text) {
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillStyle = "#fff8e7";
      var w = ctx.measureText(this.text).width + 16;
      ctx.fillStyle = "rgba(74,55,40,.85)";
      ctx.beginPath(); ctx.roundRect(x - w / 2, y + 18, w, 22, 8); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(this.text, x, y + 33);
    }
    ctx.restore();
    ctx.textAlign = "start";
  };
  HoverPoint.prototype.update = function (dt, t, game, px, py) {
    if (px == null) return;
    var near = U.hitCircle(px, py, this.def.x, this.def.y, this.radius + 40);
    if (near && !this.seen) { this.seen = true; }
    this.near = near;
  };
  HoverPoint.prototype.hit = function (px, py) { return U.hitCircle(px, py, this.def.x, this.def.y, this.radius + 20); };
  HoverPoint.prototype.z = function () { return 2; };

  // big radial area that warps you out (telescope)
  function ExitArea(def) {
    cls.Base.call(this, def);
    this.radius = def.radius || 300;
    this.cool = 0;
  }
  ExitArea.prototype = Object.create(cls.Base.prototype);
  ExitArea.prototype.render = function () {};
  ExitArea.prototype.update = function (dt, t, game, px, py) {
    if (this.cool > 0) this.cool -= dt;
    if (this.cool > 0 || px == null || !game.walkThroughDoors) return;
    if (U.hitCircle(px, py, this.def.x, this.def.y, this.radius)) {
      this.cool = 1.5;
      game.enterThrough(this.def.to, this.def.toX, this.def.toY, "whoosh");
    }
  };
  // make the opening clickable too (radius + a little slack)
  ExitArea.prototype.hit = function (px, py) {
    return U.hitCircle(px, py, this.def.x, this.def.y, this.radius + 10);
  };
  ExitArea.prototype.z = function () { return -2; };

  // movie screen
  function VideoScreen(def) {
    cls.Base.call(this, def);
    this.w = def.width; this.h = def.height;
    this.playlist = def.playlist || [];
    this.titleX = def.titleX; this.titleY = def.titleY; this.titleRadius = def.titleRadius || 250;
    this.state = "idle";   // idle | premiere | playing
    this.premiere = null;
    this.idx = 0;
    this.countdownFrom = 0;
    this.countdownNow = 0;
    this.playing = false;
    this.startedAt = 0;
    this.elapsed = 0;
    this.offX = 0;
  }
  VideoScreen.prototype = Object.create(cls.Base.prototype);
  VideoScreen.prototype.render = function (ctx, cam) {
    // def.y is the BOTTOM edge of the screen (map data is anchored at the feet),
    // so the painted rectangle starts one screen-height above it.
    var x = this.def.x - cam.x, y = this.def.y - this.h - cam.y;
    var v = CC_G.movie;
    ctx.save();
    // the board is drawn in perspective in the map art (skewY = slope in %)
    var skew = (this.def.skewY || 0) / 100;
    ctx.fillStyle = "#111";
    ctx.translate(x, y);
    ctx.transform(1, skew, 0, 1, 0, 0);
    ctx.beginPath(); ctx.roundRect(-4, -4, this.w + 8, this.h + 8, 8); ctx.fill();
    if (v && this.playing && v.readyState >= 2) {
      ctx.drawImage(v, 0, 0, this.w, this.h);
    } else {
      // countdown / poster
      ctx.fillStyle = "#2a2a2a"; ctx.fillRect(0, 0, this.w, this.h);
      ctx.textAlign = "center";
      var upNext = this.premiere ? this.premiere.title : (this.playlist[this.idx || 0] || {}).title || "Next premiere on the big screen";
      ctx.fillStyle = "#c9c9c9"; ctx.font = "bold 10px system-ui, sans-serif";
      ctx.fillText(upNext.slice(0, 22), this.w / 2, this.h / 2 - 8);
      ctx.fillStyle = "#8f8f8f"; ctx.font = "9px system-ui, sans-serif";
      ctx.fillText("click for sound", this.w / 2, this.h / 2 + 8);
      ctx.textAlign = "start";
    }
    ctx.restore();
    // signpost
    if (this.titleX != null) {
      var tx = this.titleX - cam.x, ty = this.titleY - cam.y;
      ctx.save();
      ctx.fillStyle = "#fff8e7"; ctx.strokeStyle = "#4a3728"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(tx - 8, ty - 12, 22, 52, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4a3728"; ctx.font = "bold 9px system-ui, sans-serif";
      ctx.translate(tx + 3, ty - 4); ctx.rotate(Math.PI / 2);
      ctx.fillText("CURSOR CINEMA", 0, 0);
      ctx.restore();
    }
  };
  VideoScreen.prototype.hit = function (px, py) {
    return U.inRect(px, py, { x: this.def.x - this.w / 2, y: this.def.y - this.h, w: this.w, h: this.h });
  };
  VideoScreen.prototype.z = function () { return 1; };

  // concert stage area: nearby players dance
  function ConcertArea(def) {
    cls.Base.call(this, def);
  }
  ConcertArea.prototype = Object.create(cls.Base.prototype);
  ConcertArea.prototype.render = function () {};
  ConcertArea.prototype.update = function (dt, t, game, px, py) {
    if (px == null) return;
    this.inside = U.hitCircle(px, py, this.def.x, this.def.y, this.def.radius || 300);
  };
  ConcertArea.prototype.z = function () { return -1; };

  cls.HoverPoint = HoverPoint;
  cls.ExitArea = ExitArea;
  cls.VideoScreen = VideoScreen;
  cls.ConcertArea = ConcertArea;
})();
