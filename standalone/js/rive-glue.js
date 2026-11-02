(function () {
  "use strict";

  var _ready = false;
  var _attempted = false;
  var _failed = false;

  function ensureRuntime() {
    if (_ready || _failed) return _ready;
    _attempted = true;
    try {
      if (!window.rive || !rive.Rive) { _failed = true; return false; }
      // Point the runtime at our local advanced wasm (same file the site ships).
      rive.RuntimeLoader.wasmURL = CCA.p("rive/2.47.1/webgl2_advanced.wasm");
      _ready = true;
    } catch (e) { _failed = true; }
    return _ready;
  }

  // A rive object that renders into its own <canvas> at world coords.
  // The game positions/rotates the canvas every frame via setWorld(cam).
  function RiveObject(def) {
    this.def = def;
    this.x = def.x; this.y = def.y;
    this.w = def.width || 100;
    this.mirrorX = !!def.mirrorX;
    this.loaded = false;
    this.failed = false;
    this.rv = null;
    this.initDrawn = false;
  }

  RiveObject.prototype.init = function () {
    if (this.rv || this.failed || !ensureRuntime()) return;
    var self = this;
    // preflight: only mount rive if the .riv actually exists locally
    fetch(CCA.p("animations/" + this.def.src), { method: "HEAD" }).then(function (r) {
      if (!r.ok) { self.failed = true; self.permanent = true; self.hide(); return; }
      self.mount();
    }, function (err) {
      // transient abort (e.g. room hop) may retry next frame; everything else is final
      self.failed = true;
      self.permanent = !(err && err.name === "AbortError");
      self.hide();
    });
  };

  RiveObject.prototype.hide = function () {
    if (this.canvas) { try { this.canvas.parentNode.removeChild(this.canvas); } catch (e) {} this.canvas = null; }
    if (this.rv) { try { this.rv.cleanup(); } catch (e2) {} this.rv = null; }
    // allow a retry next frame only for transient failures (map hops), not real 404s
    if (!this.permanent) { this._inited = false; }
    this.failed = false;
  };

  RiveObject.prototype.mount = function () {
    if (this.rv || this.failed || !ensureRuntime()) return;
    try {
      var self = this;
      var canvas = document.createElement("canvas");
      canvas.width = 4; canvas.height = 4; // resized on load from artboard bounds
      this.canvas = canvas;
      this.rv = new rive.Rive({
        src: CCA.p("animations/" + this.def.src),
        canvas: canvas,
        autoplay: true,
        onLoad: function () {
          try {
            var b = self.rv.artboard.bounds;
            var w = Math.max(2, Math.abs(b.maxX - b.minX));
            var h = Math.max(2, Math.abs(b.maxY - b.minY));
            self.artW = w; self.artH = h;
            self.rv.resizeDrawingSurfaceToCanvas();
            self.loaded = true;
            self.initDrawn = true;
          } catch (e) {
            self.rv.resizeDrawingSurfaceToCanvas();
            self.loaded = true;
            self.initDrawn = true;
          }
        },
        onError: function () { self.failed = true; },
        layout: new rive.Layout({
          fit: rive.Fit.contain,
          alignment: rive.Alignment.center,
        }),
      });
    } catch (e) { this.failed = true; }
  };

  // update + draw; returns true if rendered this frame
  RiveObject.prototype.frame = function (cam, scale) {
    if (!this.loaded || !this.rv) { if (!this.failed && !this.loaded && !this._inited) { this._inited = true; this.init(); } return false; }
    var c = this.canvas, w = this.artW || 4, h = this.artH || 4;
    var targetW = Math.ceil(this.w);
    var targetH = Math.ceil(this.w * (h / w));
    if (this.mirrorX) { /* handled via CSS transform */ }
    var sx = this.x - cam.x, sy = this.y - cam.y;
    c.style.left = (sx - targetW / 2) + "px";
    c.style.top = (sy - targetH) + "px";
    c.style.width = targetW + "px";
    c.style.height = targetH + "px";
    c.style.transform = this.mirrorX ? "scaleX(-1)" : "";
    c.style.zIndex = String(this.def.behind ? 4 : 6);
    c.style.opacity = this.def.opacity != null ? String(this.def.opacity) : "";
    // resize the drawing surface to the CSS size so the art actually renders
    try {
      this.rv.resizeDrawingSurfaceToCanvas();
      this.initDrawn = true;
    } catch (e) {}
    try { this.rv.draw(); } catch (e) {}
    return true;
  };

  RiveObject.prototype.destroy = function () {
    this.permanent = true; // stop retries once discarded
    if (this.rv) { try { this.rv.cleanup(); } catch (e) {} this.rv = null; }
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null; this.loaded = false; this.failed = false; this._inited = false;
  };

  RiveObject.prototype.setBool = function (n, v) { try { this.rv.setBooleanState(n, v); } catch (e) {} };

  window.CCR = {
    ready: function () { return ensureRuntime(); },
    RiveObject: RiveObject,
  };
})();