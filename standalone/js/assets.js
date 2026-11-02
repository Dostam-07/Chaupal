(function () {
  "use strict";

  var base = CC.ASSETS.base;

  function p(rel) {
    if (!rel) return base;
    var s = String(rel);
    s = s.replace(/^https?:\/\/[^/]+\//, "");
    s = s.replace(/^\//, "");
    s = s.replace(/^\/+/, "");
    return base + s;
  }

  var _cache = {};
  function img(rel) {
    var key = rel;
    if (_cache[key]) return _cache[key];
    var im = new Image();
    im.src = p(rel);
    _cache[key] = im;
    return im;
  }

  function loadJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error("fetch " + url); return r.json(); })
      .catch(function () {
        // file:// (or any blocked fetch): fall back to the inlined copies
        var emb = window.CC_EMBED;
        if (emb) {
          if (url.indexOf("data/maps/") >= 0) {
            var id = url.split("data/maps/").pop().replace(/\.json$/, "");
            // Deep-clone: the map loader flips Y in place, and the embedded
            // fallback is a shared object - reusing it would flip it twice.
            if (emb.maps && emb.maps[id]) return JSON.parse(JSON.stringify(emb.maps[id]));
          }
          if (url.indexOf("manifest.json") >= 0 && emb.tileManifest) return emb.tileManifest;
          if (url.indexOf("schedule.json") >= 0 && emb.schedule) return emb.schedule;
        }
        throw new Error("no embedded fallback for " + url);
      });
  }

  // ---- audio (also asset-ish helpers live in audio.js) ----

  window.CCA = {
    p: p,
    img: img,
    base: base,
    loadJSON: loadJSON,
  };
})();