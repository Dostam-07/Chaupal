(function () {
  "use strict";

  // ---- math helpers ----
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

  function now() { return (window.performance && performance.now()) || Date.now(); }

  function fmtTime(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60); s %= 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function countryCode() {
    try {
      var l = (navigator.language || "en").toLowerCase().split("-")[1] || "";
      return l || "us";
    } catch (e) { return "us"; }
  }

  // Simple stable identity for local persistence
  function playerId() {
    var k = "cc-id";
    var v = localStorage.getItem(k);
    if (!v) { v = "p" + Math.random().toString(36).slice(2, 10); localStorage.setItem(k, v); }
    return v;
  }

  function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

  function hitCircle(px, py, cx, cy, r) { return dist2(px, py, cx, cy) <= r * r; }

  // Cheap font check util for canvas text
  function drawTextCentered(ctx, txt, x, y, font, color, outline) {
    ctx.font = font;
    if (outline) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 4; ctx.strokeText(txt, x, y); }
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }

  window.U = {
    clamp: clamp, lerp: lerp, dist2: dist2, now: now, fmtTime: fmtTime,
    countryCode: countryCode, playerId: playerId, inRect: inRect,
    hitCircle: hitCircle, drawTextCentered: drawTextCentered,
  };
})();
  // ---- map coordinate flip ----
  // The original game stores world Y measured from the BOTTOM of the map
  // (map.height - screenY). Internally we use top-down Y, so every entity
  // coordinate loaded from the original config/maps must be flipped.
  var NOT_YCOORD = { height: 1, width: 1, size: 1, radius: 1, falloff: 1, maxVolume: 1, w: 1, h: 1 };
  // Keys that contain a Y but are NOT world-space Y:
  //   toY           -> cross-map destination (flipped against the DESTINATION map)
  //   skewY         -> CSS/canvas skew amount
  //   clickOffsetY  -> pixel offset inside a rive object's own artwork
  var NOT_WORLD_Y = { toY: 1, skewY: 1, clickOffsetY: 1, clickToPlay: 1 };
  // Array-valued keys whose entries carry {x,y} in map space.
  var Y_ARRAYS = {
    array: 1, checkpoints: 1, goals: 1, goal1: 1, goal2: 1, sounds: 1,
    playArea: 1, corners: 1, candlePoints: 1
  };
  function flipYVal(v, mapH) {
    return (typeof v === "number") ? mapH - v : v;
  }
  function flipYObject(o, mapH) {
    if (!o || typeof o !== "object") return o;
    var k;
    for (k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
      var v = o[k];
      if (typeof v === "number") {
        var isWorldY = (k === "y") || (/Y$/.test(k) && !NOT_WORLD_Y[k] && !NOT_YCOORD[k]);
        if (isWorldY) o[k] = mapH - v;
      } else if (Array.isArray(v)) {
        if (Y_ARRAYS[k] || /Points$/i.test(k)) {
          for (var i = 0; i < v.length; i++) {
            if (v[i] && typeof v[i] === "object") flipYObject(v[i], mapH);
          }
        }
      }
    }
    return o;
  }
  function flipMap(data, h) {
    if (!data) return data;
    if (h == null) h = data.height || 2000;
    if (data.elements) for (var i = 0; i < data.elements.length; i++) flipYObject(data.elements[i], h);
    return data;
  }
  window.U.flipYVal = flipYVal;
  window.U.flipMap = flipMap;
  window.U.flipYObject = flipYObject;

  // ---- canvas feature shims -------------------------------------------------
  // ctx.roundRect() landed in Chrome 99 / Firefox 112 / Safari 16. Without it
  // every rounded panel, sign and toast throws inside the draw loop, which
  // leaves the whole world blank on older browsers. Polyfill it once here.
  if (typeof CanvasRenderingContext2D !== "undefined" &&
      !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      var rr = Math.min(Math.abs(typeof r === "number" ? r : (r && r[0]) || 0), Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + rr, y);
      this.lineTo(x + w - rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.lineTo(x + w, y + h - rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.lineTo(x + rr, y + h);
      this.arcTo(x, y + h, x, y, rr);
      this.lineTo(x, y + rr);
      this.arcTo(x, y, x + w, y, rr);
      return this;
    };
  }

  // ---- WebP support detection ----------------------------------------------
  // Every tile, object sprite and room background is .webp. Browsers without
  // the codec (old Safari, some embedded webviews) silently paint nothing.
  // U.noWebp lets the game fall back to a generated placeholder + a notice.
  function detectWebp(cb) {
    var img = new Image();
    img.onload = img.onerror = function () {
      cb(!!(img.width > 0 && img.height > 0));
    };
    img.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
  }
  window.U.detectWebp = detectWebp;
  window.U.noWebp = false;
