(function () {
  "use strict";

  // ---- Tile map (campground): lazy 512px tiles from manifest ----
  function TileMap(manifest) {
    this.tileSize = manifest.tileSize || 512;
    this.cols = manifest.cols; this.rows = manifest.rows;
    this.width = manifest.width; this.height = manifest.height;
    this.layers = manifest.layers;
    this.cache = {};   // "layer_c_r" -> Image
    this.pending = {}; // "layer_c_r" -> true (in flight)
  }

  TileMap.prototype.hasTile = function (layer, col, row) {
    var l = this.layers[layer];
    return !!(l && l[row] && l[row][col]);
  };

  TileMap.prototype.getTile = function (layer, col, row) {
    var key = layer + "_" + col + "_" + row;
    if (this.cache[key]) return this.cache[key];
    if (this.pending[key]) return null;
    if (!this.hasTile(layer, col, row)) return null;
    this.pending[key] = true;
    var img = new Image();
    var self = this;
    img.onload = function () { self.cache[key] = img; delete self.pending[key]; };
    img.onerror = function () { delete self.pending[key]; };
    img.src = CCA.p("maps/tiles/default/" + key + ".webp");
    return null;
  };

  // prefetch tiles around a world view
  TileMap.prototype.preload = function (vx, vy, vw, vh, margin) {
    margin = margin !== false ? 2 : 0;
    var d = this.tileSize;
    var c0 = Math.max(0, Math.floor(vx / d) - margin);
    var c1 = Math.min(this.cols - 1, Math.floor((vx + vw) / d) + margin);
    var r0 = Math.max(0, Math.floor(vy / d) - margin);
    var r1 = Math.min(this.rows - 1, Math.floor((vy + vh) / d) + margin);
    for (var r = r0; r <= r1; r++)
      for (var c = c0; c <= c1; c++) {
        this.getTile("base", c, r);
        this.getTile("top", c, r);
      }
  };

  // draw layer tiles clipped to view (world-space), honoring dpr snapping
  TileMap.prototype.drawLayer = function (ctx, layer, vx, vy, vw, vh, dpr) {
    var d = this.tileSize;
    var c0 = Math.max(0, Math.floor(vx / d));
    var c1 = Math.min(this.cols - 1, Math.floor((vx + vw) / d));
    var r0 = Math.max(0, Math.floor(vy / d));
    var r1 = Math.min(this.rows - 1, Math.floor((vy + vh) / d));
    for (var r = r0; r <= r1; r++) {
      for (var c = c0; c <= c1; c++) {
        var img = this.getTile(layer, c, r);
        if (!img || !img.complete || !img.naturalWidth) continue;
        var wx = c * d, wy = r * d;
        var w = Math.min(d, this.width - wx);
        var h = Math.min(d, this.height - wy);
        var sx = Math.round((wx - vx) * dpr) / dpr;
        var sy = Math.round((wy - vy) * dpr) / dpr;
        var sw = Math.round((wx + w - vx) * dpr) / dpr - sx;
        var sh = Math.round((wy + h - vy) * dpr) / dpr - sy;
        ctx.drawImage(img, sx, sy, sw, sh);
      }
    }
  };

  // ---- Full-image maps (rooms) ----
  function FullMap(id, def) {
    this.id = id; this.width = def.width; this.height = def.height;
    this.mapImg = null; this.topImg = null; this.waterImg = null;
    this.loaded = 0; this.total = 2;
    if (def.hasTop !== false) this.loadTop = true;
  }
  FullMap.prototype.load = function (cb) {
    var self = this, done = 0, total = 2;
    var tick = function () { done++; if (done >= total) cb(); };
    this.mapImg = new Image();
    this.mapImg.onload = tick; this.mapImg.onerror = tick;
    this.mapImg.src = CCA.p("optimized/maps/" + this.id + ".webp");
    this.topImg = new Image();
    this.topImg.onload = tick; this.topImg.onerror = tick;
    this.topImg.src = CCA.p("optimized/maps/" + this.id + "-top.webp");
  };

  // ---- Water ----
  // maps/<id>-water.png is a *collision* mask: black RGB, alpha encodes the
  // zone (ocean ~204, river ~116, shallow edges in between). It must be tinted
  // into actual water art, not drawn as-is (it used to paint a grey haze).
  function Water(id) {
    this.id = id; this.img = null; this.data = null;
    this.w = 0; this.h = 0;
    this.tint = null;      // tinted 1/4-scale canvas
    this.ripples = null;   // animated shimmer points (world space)
  }
  Water.prototype.load = function () {
    var self = this;
    this.img = new Image();
    this.img.onload = function () {
      var t = Math.ceil(self.img.naturalWidth / 4);
      var h = Math.ceil(self.img.naturalHeight / 4);
      var cv = document.createElement("canvas");
      cv.width = t; cv.height = h; self.w = t; self.h = h;
      var c2 = cv.getContext("2d", { willReadFrequently: true });
      c2.imageSmoothingEnabled = false;
      c2.drawImage(self.img, 0, 0, t, h);
      var data;
      try { data = c2.getImageData(0, 0, t, h); } catch (e) { return; }
      self.data = data.data;

      // ---- build the tinted water layer ----
      var src = data.data, out = c2.createImageData(t, h), o = out.data;
      var def = CC.MAP_DEFAULTS[self.id] || {};
      var mw = def.width || 6750, mh = def.height || 3797;
      // The mask marks whole zones, not a coastline: the tent plain counts as
      // ocean zone, which painted a blue slab across the tent. Carve the dry
      // structures out (world coords -> mask pixels).
      var CUT = [[5150, 700, 460, 430], [2350, 2330, 420, 260]];
      var cut = CUT.map(function (r) {
        return [r[0] / mw * t, r[1] / mh * h, (r[0] + r[2]) / mw * t, (r[1] + r[3]) / mh * h];
      });
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < t; x++) {
          var i = 4 * (y * t + x);
          var a = src[i + 3];
          if (a < 24) continue;
          var cutIt = false;
          for (var ci = 0; ci < cut.length; ci++) {
            if (x >= cut[ci][0] && x <= cut[ci][2] && y >= cut[ci][1] && y <= cut[ci][3]) { cutIt = true; break; }
          }
          if (cutIt) continue;
          var deep = a > 170;                       // ocean
          var river = a > 90 && a <= 170;           // river / pond
          var col = deep ? [58, 132, 176] : river ? [86, 168, 199] : [126, 196, 216];
          // foam: water pixel touching dry land
          var edge = false;
          if (x > 0 && src[i - 1] < 24) edge = true;
          else if (x < t - 1 && src[i + 7] < 24) edge = true;
          else if (y > 0 && src[i - 4 * t + 3] < 24) edge = true;
          else if (y < h - 1 && src[i + 4 * t + 3] < 24) edge = true;
          if (edge) { col = [214, 240, 247]; }
          o[i] = col[0]; o[i + 1] = col[1]; o[i + 2] = col[2];
          o[i + 3] = edge ? 235 : 205;
        }
      }
      c2.putImageData(out, 0, 0);
      self.tint = cv;

      // ---- shimmer points, sampled on a coarse grid ----
      var pts = [];
      var stepX = Math.max(6, Math.floor(t / 120)), stepY = Math.max(6, Math.floor(h / 70));
      for (var yy = 2; yy < h; yy += stepY) {
        for (var xx = 2; xx < t; xx += stepX) {
          var ai = 4 * (yy * t + xx) + 3;
          if (src[ai] > 80) {
            pts.push({
              x: (xx / t) * mw,
              y: (yy / h) * mh,
              p: Math.random() * 6.283,
              s: 0.6 + Math.random() * 0.8,
            });
          }
        }
      }
      self.ripples = pts;
    };
    this.img.src = CCA.p("maps/" + this.id + "-water.png");
  };
  // returns 0..1 water fraction at world coords (world space is top-down here)
  Water.prototype.fraction = function (wx, wy) {
    if (!this.data) return 0;
    var def = CC.MAP_DEFAULTS[this.id] || {};
    var px = Math.floor((wx / (def.width || 6750)) * this.w);
    var py = Math.floor((wy / (def.height || 3797)) * this.h);
    px = U.clamp(px, 0, this.w - 1); py = U.clamp(py, 0, this.h - 1);
    var i = 4 * (py * this.w + px);
    var a = this.data[i + 3];
    if (a < 24) return 0;
    if (a > 170) return 0.6;   // ocean
    if (a > 90) return 0.4;    // river
    return 0.2;                // shallow edge
  };
  Water.prototype.draw = function (ctx, cam, vw, vh, dpr, alpha) {
    if (!this.tint) return;
    var def = CC.MAP_DEFAULTS[this.id] || {};
    var mw = def.width || 6750, mh = def.height || 3797;
    ctx.save();
    ctx.globalAlpha = 1;
    // soft moving swell: two offset copies of the tint, very light
    ctx.drawImage(this.tint, -cam.x, -cam.y, mw, mh);
    var t = (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
    ctx.globalAlpha = 0.12;
    ctx.drawImage(this.tint, -cam.x + Math.sin(t * 0.5) * 6, -cam.y, mw, mh);
    ctx.globalAlpha = 1;

    // animated shimmer: small white arcs inside the visible water
    if (this.ripples && this.ripples.length) {
      var pad = 80;
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#eaf7fb";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      var drawn = 0;
      for (var i = 0; i < this.ripples.length && drawn < 90; i++) {
        var r = this.ripples[i];
        if (r.x < cam.x - pad || r.x > cam.x + vw + pad || r.y < cam.y - pad || r.y > cam.y + vh + pad) continue;
        var ph = (t * r.s + r.p) % 6.283;
        var k = Math.sin(ph);
        if (k < 0.35) continue;
        var sx = r.x - cam.x, sy = r.y - cam.y;
        var w = 10 + k * 16;
        ctx.globalAlpha = 0.12 + k * 0.3;
        ctx.beginPath();
        ctx.ellipse(sx, sy, w, w * 0.28, 0, 0.15, Math.PI - 0.15);
        ctx.stroke();
        drawn++;
      }
    }
    ctx.restore();
  };

  window.TileMap = TileMap;
  window.FullMap = FullMap;
  window.Water = Water;
})();