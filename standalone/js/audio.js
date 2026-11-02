(function () {
  "use strict";

  var Howl = window.Howl;
  var one = {};   // name -> Howl
  var ambient = {}; // name -> Howl (loops)
  var spatial = []; // active spatial nodes
  var muted = false;

  function howlFor(name, opts) {
    opts = opts || {};
    var h = one[name];
    if (h) return h;
    h = one[name] = new Howl({
      src: [CCA.p("optimized/sounds/" + (ambientFiles[name] || name) + ".mp3")],
      volume: (opts.volume != null ? opts.volume : 1),
      html5: false, preload: true,
    });
    h.on("loaderror", function () { delete one[name]; });
    return h;
  }

  function play(name, vol) {
    if (muted) return;
    try { howlFor(spatialAlias[name] || name, { volume: vol }).play(); } catch (e) {}
  }

  var ambientFiles = { walking: "ambient/walking", forest: "ambient/forest" };
  var spatialAlias = {
    soup: "steam", fire: "flicker", "boat-rocking": "ocean-waves", cave: "cave-enter",
    eerie: "whoosh", campfire: "campfire", "hot-tub": "steam", river: "water-stream",
    home: "pop", "grandfather-clock": "hourglass", buzzing: "buzz", sauna: "steam",
    treehouse: "forest", kick: "soccer-kick", goal: "soccer-goal", bell: "gong", badge: "gong", pillow: "pop", guitar: "buzz", "fishing-line": "pickup", chandelier: "chandelier", eat: "eat",
  };

  function setAmbient(name, vol) {
    if (name && !ambientFiles[name]) return;
    if (!name) { Object.keys(ambient).forEach(function (k) { try { ambient[k].stop(); } catch (e) {} }); ambient = {}; return; }
    Object.keys(ambient).forEach(function (k) { ambient[k].pause(); });
    if (name && !muted) {
      var h = ambient[name];
      if (!h) {
        h = ambient[name] = new Howl({
          src: [CCA.p("optimized/sounds/ambient/" + name + ".mp3")],
          loop: true, volume: vol || 0.15, preload: true,
        });
        h.on("loaderror", function () { delete ambient[name]; });
      } else h.volume(vol || 0.15);
      if (!h.playing()) h.play();
    }
  }

  // Spatial audio node: setActive each frame from player world pos
  function SpatialNode(def) {
    this.x = def.x; this.y = def.y;
    this.sound = spatialAlias[def.sound] || def.sound; this.radius = def.radius || 200;
    this.falloff = def.falloff || 400; this.maxVolume = def.maxVolume || 1;
    this.howl = null; this.playingNow = false;
  }
  SpatialNode.prototype.update = function (px, py) {
    var d = Math.sqrt(U.dist2(px, py, this.x, this.y));
    var g = 1 - Math.max(0, (d - this.radius)) / Math.max(1, this.falloff);
    g = U.clamp(g, 0, 1) * this.maxVolume;
    var wantOn = g > 0.01 && !muted;
    if (wantOn && !this.howl) {
      this.howl = new Howl({ src: [CCA.p((ambientFiles[this.sound] ? "optimized/sounds/" + ambientFiles[this.sound] : "optimized/sounds/" + this.sound) + ".mp3")], loop: true, preload: true });
      this.howl.on("loaderror", function () { this.howl = null; }.bind(this));
    }
    if (this.howl) {
      if (this.howl.state() === "loaded") {
        if (wantOn && !this.howl.playing()) this.howl.play();
        if (this.howl.playing() && !wantOn) this.howl.pause();
        this.howl.volume(g);
      }
    }
  };
  SpatialNode.prototype.destroy = function () { if (this.howl) { try { this.howl.unload(); } catch (e) {} this.howl = null; } };

  function setSpatial(defs) { spatial.forEach(function (s) { s.destroy(); }); spatial = (defs || []).map(function (d) { return new SpatialNode(d); }); }
  function updateSpatial(px, py) { spatial.forEach(function (s) { s.update(px, py); }); }

  function setMuted(m) {
    muted = m;
    Object.keys(ambient).forEach(function (k) { if (m) ambient[k].pause(); });
  }

  function toggleMuted() { setMuted(!muted); return muted; }
  function isMuted() { return muted; }

  window.CCAU = {
    play: play, setAmbient: setAmbient, setSpatial: setSpatial,
    updateSpatial: updateSpatial, setMuted: setMuted, toggleMuted: toggleMuted,
    isMuted: isMuted,
  };
})();