(function () {
  "use strict";

  var CFG = CC.GAME_CONFIG;

  // .riv files mirrored locally under assets/animations
  Game.HAS_RIV = ["bat","bell","bread","cake","candle","cauldron","drum","fan","gong","hourglass","lever","light","merry-go-round","piano","radio","rocks","seesaw","squirrel","thermometer","trapdoor","watering","merry-go-round"].concat([]);
  Game.HAS_RIV = Game.HAS_RIV.map(function (n) { return n + ".riv"; });

  function Game() {
    this.base = document.getElementById("world");       // reassigned below
    this.mkCanvases();

    this.copy = CCA.img("optimized/pointer.webp");
    this.mapId = "default";
    this.mapData = null;
    this.player = null;
    this.objs = [];
    this.rivObs = [];
    this.water = null;
    this.tmap = null;
    this.fmap = null;
    this.cam = { x: 0, y: 0 };
    this.camSmooth = 0.12;
    this.view = { w: 0, h: 0 };
    this.keys = {};
    this.pointer = { x: 0, y: 0, down: false, worldX: 0, worldY: 0, moved: false, lastMoveTime: 0 };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.pointerLocked = false;
    this.lastCursorX = null; this.lastCursorY = null;
    this.debugBall = false;
    this.running = false;
    this.paused = false;
    this.entered = false;
    this.t = 0;
    this.lastFrame = 0;
    this.toastTimer = 0;
    this.hoverTarget = null;
    this.hoverPoint = null;
    this.shake = 0;
    this.dancing = 0;
    this.rideAngle = 0;
    this.held = null;
    this.movie = null;
    this.premieres = [];
  }

  // ---- canvases ----
  Game.prototype.mkCanvases = function () {
    var world = document.getElementById("world");
    var mk = function (z, id) {
      var c = id ? world : document.createElement("canvas");
      if (!id) {
        world.parentNode.insertBefore(c, world.nextSibling);
        c.id = id;
      }
      c.style.position = "fixed";
      c.style.inset = "0";
      c.style.width = "100%";
      c.style.height = "100%";
      c.style.zIndex = String(z);
      return c;
    };
    // world canvas keeps z1 as the base(map) layer; layers are created around it
    world.style.zIndex = "3";
    world.id = world.id || "world";
    this.baseCv = mk(1);
    this.topCv = document.createElement("canvas");
    world.parentNode.insertBefore(this.topCv, null);
    this.topCv.id = "top";
    this.topCv.style.position = "fixed";
    this.topCv.style.inset = "0";
    this.topCv.style.width = "100%";
    this.topCv.style.height = "100%";
    this.topCv.style.zIndex = "5";
    this.topCv.style.pointerEvents = "none";

    this.entCv = world;
    this.entCv.style.zIndex = "3";
    this.overlay = document.getElementById("overlay");
    this.overlay.style.zIndex = "6";

    this.rivFront = document.getElementById("rive-layer");
    this.rivFront.style.zIndex = "4";
    this.rivBack = document.createElement("div");
    this.rivBack.className = "rive-layer";
    this.rivBack.style.zIndex = "2";
    world.parentNode.insertBefore(this.rivBack, world.nextSibling);
  };

  Game.prototype.resize = function () {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.view.w = window.innerWidth;
    this.view.h = window.innerHeight;
    [this.baseCv, this.entCv, this.topCv].forEach(function (c) {
      c.width = Math.round(window.innerWidth * dpr);
      c.height = Math.round(window.innerHeight * dpr);
    });
    this.baseCtx = this.baseCv.getContext("2d");
    this.entCtx = this.entCv.getContext("2d");
    this.topCtx = this.topCv.getContext("2d");
    this.ovCtx = this.overlay.getContext("2d");
    var ov = this.overlay;
    ov.width = Math.round(window.innerWidth * dpr);
    ov.height = Math.round(window.innerHeight * dpr);
    if (this.mapData) this.camUpdate(true);
  };

  // ---- map loading ----
  // Types that are backed by a rive animation: {riv, sound, toast}
  var RIV_GADGETS = {
    bell: { riv: "bell.riv", sound: "gong", toast: "Ding!" },
    bat: { riv: "bat.riv", sound: "buzz" },
    fan: { riv: "fan.riv", sound: "fan" },
    cake: { riv: "cake.riv", sound: "pop", toast: "Cake!" },
    candle: { riv: "candle.riv", sound: "flicker" },
    cauldron: { riv: "cauldron.riv", sound: "steam", toast: "Bubbling..." },
    drum: { riv: "drum.riv", sound: "pop", toast: "Ba-dum" },
    gong: { riv: "gong.riv", sound: "gong" },
    hourglass: { riv: "hourglass.riv", sound: "hourglass" },
    lever: { riv: "lever.riv", sound: "lever" },
    light: { riv: "light.riv", sound: "light" },
    piano: { riv: "piano.riv", sound: "pop" },
    radio: { riv: "radio.riv", sound: "buzz" },
    rocks: { riv: "rocks.riv", sound: "rocks" },
    squirrel: { riv: "squirrel.riv", sound: "pickup" },
    thermometer: { riv: "thermometer.riv", sound: "steam" },
    trapdoor: { riv: "trapdoor.riv", sound: "wood-door" },
    baguette: { riv: "bread.riv", sound: "eat", toast: "Bon app\u00e9tit" },
  };

  // Types without art: plain click feedback
  var PLAIN_GADGETS = {
    coal: { sound: "coal", toast: "Hot coals" },
    water: { sound: "bucket", toast: "Splash" },
    wood: { sound: "stick", toast: "Extra firewood" },
    chilli: { sound: "eat", img: "optimized/objects/chilli.webp", toast: "Spicy!" },
    orange: { sound: "orange", img: "optimized/objects/orange.webp", toast: "Fresh orange" },
    gatorade: { sound: "slurp", toast: "Electrolytes" },
    floatie: { sound: "floatie", img: "optimized/objects/floatie.webp" },
    pinkFloatie: { sound: "floatie", img: "optimized/objects/pink-floatie.webp" },
    coffee: { sound: "slurp", toast: "Coffee" },
    chandelier: { sound: "chandelier", img: "optimized/objects/chandelier.webp" },
    book: { sound: "book", toast: "Read a page" },
    shock: { sound: "shock", toast: "Zap!", shake: 16 },
    sunbathe: { sound: "pop", toast: "Sun's out" },
    stick: { sound: "stick", img: "optimized/objects/stick.webp" },
    bottlecap: { sound: "pickup", img: "optimized/objects/bottle-cap.webp" },
    flashlight: { sound: "pickup", img: "optimized/objects/flashlight.webp" },
  };

  Game.prototype.load = function (mapId, spawnX, spawnY, transitionSound) {
    var self = this;
    this.mapId = mapId;
    // Every load gets a token: a slow JSON fetch must never overwrite the map
    // the player has already walked into (this used to teleport arrivals back
    // to the campground spawn).
    var seq = this._loadSeq = (this._loadSeq || 0) + 1;
    this.ready = false;
    if (window.CC_DEBUG_LOAD) console.log("DBG load#" + seq, mapId, spawnX, spawnY);
    var def = CC.MAP_DEFAULTS[mapId] || {};
    var done = function (data) {
      if (window.CC_DEBUG_LOAD) console.log("DBG done#" + seq, "cur", self._loadSeq, data && data.elements ? data.elements.length : -1);
      if (!data || seq !== self._loadSeq) return;
      U.flipMap(data, def.height || data.height || 2000);
      self.mapData = data;
      self.build();
      var sx = (spawnX != null ? spawnX : (def.start ? def.start.x : data.width / 2));
      var sy = (spawnY != null ? spawnY : (def.start ? def.start.y : (data.height ? data.height / 2 : 1000)));
      self.entryGraceUntil = U.now() + 650;
      // Silence every door around the arrival point: you should never be
      // teleported again just for spawning next to the door you came through.
      for (var d = 0; d < self.objs.length; d++) {
        var obj = self.objs[d];
        if (obj instanceof CC_O.Door) {
          var dcx = obj.def.x + (obj.w || 90) / 2;
          var dcy = obj.def.y + (obj.h || 90) / 2;
          var near = Math.hypot(sx - dcx, sy - dcy) < Math.max(obj.w || 90, obj.h || 90) / 2 + 240;
          if (near || U.inRect(sx, sy, { x: obj.def.x - obj.w, y: obj.def.y - obj.h, w: obj.w * 2, h: obj.h * 2 })) {
            obj.debounce = 1.6;
          }
        }
      }
      if (!self.player) { self.player = new Player(sx, sy); if (self.pendingEnter) { self.pendingEnter = false; self.player.emoteNow(1); self.toast("WASD / arrows to walk • click things"); } }
      else self.player.setPos(sx, sy);
      CCE.load().lastMap = mapId;
      CCE.load().lastX = sx; CCE.load().lastY = sy;
      var mapNames = {
        default: "Camp Grounds",
        sauna: "Lakeside Sauna",
        tent: "Cozy Tent",
        cave: "Crystal Cave",
        treehouse: "Treehouse Lookout",
        "house-main": "Clubhouse Main",
        "house-cafeteria": "Camp Cafeteria",
        "house-bedroom": "Bunkhouse",
        "house-trophey": "Trophy Room",
        boat: "Discovery Sailboat",
        telescope: "Stargazing Tower"
      };
      var mapLabel = mapNames[mapId] || mapId.replace("house-", "house ");
      var mn = document.getElementById("map-name");
      if (mn) mn.textContent = mapLabel;
      self.camUpdate(true);
      if (transitionSound) self.play(transitionSound);
      self.campers = new CC_Campers(self);
      self.campers.populate();
      if (mapId === "default" && window.VillageZone) {
        if (!self.village) self.village = new VillageZone(self);
        else self.village.reset();
      } else if (self.village) {
        self.village.hide();
      }
      if ((mapId === "default" || mapId === "school") && window.VillageSchool) {
        // never let a village/school hiccup abort a map transition
        try {
          if (!self.school) self.school = new VillageSchool(self);
          else self.school.initEntities();
        } catch (err) {
          console.warn("village init failed", err);
        }
      } else if (self.school) {
        self.school = null;
      }
      self.ready = true;
    };
    return CCA.loadJSON("data/maps/" + mapId + ".json").then(done, function () {
      // fall back to a bare map
      done({ id: mapId, elements: [] });
    });
  };

  Game.prototype.build = function () {
    var self = this;
    var def = CC.MAP_DEFAULTS[this.mapId] || {};
    // build token: async manifest fetches from a previous map must not write
    // into a newer map's (possibly null) tmap after a quick room hop
    var token = (this._buildToken = (this._buildToken || 0) + 1);
    this.objs.forEach(function (o) { if (o.destroy) o.destroy(); });
    this.rivObs.forEach(function (r) { r.destroy(); });
    this.objs = []; this.rivObs = [];
    CCAU.setSpatial([]);
    CCAU.setAmbient(null);
    this.movieEl = document.getElementById("movie");
    this.movie = this.movieEl;

    // layers
    this.tmap = null; this.fmap = null; this.water = null;
    if (def.tiles) {
      this.tmap = new TileMap({
        tileSize: 512, cols: 14, rows: 8, width: def.width, height: def.height,
        layers: {}, // filled by manifest below
      });
      CCA.loadJSON("assets/maps/tiles/default/manifest.json").then(function (m) {
        if (self._buildToken !== token || !self.tmap) return; // stale build (map changed meanwhile)
        self.tmap.layers = m.layers; self.tmap.tileSize = m.tileSize;
      }, function () { /* manifest failed; map stays blank-layered */ });    } else {
      this.fmap = (this.mapId !== "school") ? { base: CCA.img("optimized/maps/" + this.mapId + ".webp"), top: null } : { base: null, top: null };
    }
    if (def.hasWater) { this.water = new Water(this.mapId); this.water.load(); }

    var els = (this.mapData && this.mapData.elements) || [];
    var audioNodes = [], ambient = null;

    els.forEach(function (e, i) {
      var list = e.array || null;
      if (list) {
        list.forEach(function (pos, j) { self.spawn(e, i * 100 + j, pos); });
      } else if (e.type === "plant" && e.array) {
        // handled above
      } else {
        self.spawn(e, i);
      }
      if (e.type === "spatialAudio") audioNodes = e.sounds || [];
      if (e.type === "ambientAudio" && e.sounds) {
        ambient = e.sounds;
      }
    });
    if (audioNodes.length) CCAU.setSpatial(audioNodes);
    this.findCampfire();
    if (ambient && ambient.length) setTimeout(function () { self.ambientLoop(ambient); }, 300);
  };

  Game.prototype.ambientLoop = function (sounds) {
    var i = 0, self = this;
    var next = function () {
      var s = sounds[i % sounds.length];
      i++;
      CCAU.setAmbient(s.sound, s.volume);
      setTimeout(next, 22000 + Math.random() * 12000);
    };
    next();
  };

  // The campfire is authored as a riveObject plus a marshmallow stick; keep its
  // world position around so roasting (and the stick art) can aim at it.
  Game.prototype.findCampfire = function () {
    var fire = null, stick = null;
    for (var i = 0; i < this.objs.length; i++) {
      var o = this.objs[i];
      var d = o.def || {};
      if (d.type === "riveObject" && /campfire/i.test(d.src || "")) fire = { x: d.x, y: d.y + 40 };
      if (d.type === "marshmallow") stick = { x: (o.campfireX != null ? o.campfireX : d.x), y: (o.campfireY != null ? o.campfireY : d.y) };
    }
    this.firePos = stick || fire || null;
    if (this.firePos && !this.roastActive) this.roastActive = 0;
  };

  // ---- element factory ----
  Game.prototype.spawn = function (e, idx, posOverride) {
    var d = {};
    for (var k in e) d[k] = e[k];
    if (posOverride) { d.x = posOverride.x; d.y = posOverride.y; }
    if (d.x == null) { d.x = d.centerX != null ? d.centerX : 0; d.y = d.centerY != null ? d.centerY : 0; }
    var o = null;
    var type = e.type;

    if (type === "staticImage") {
      o = new CC_O.StaticObj(d);
      if (d.width == null) { /* size from natural */ }
      o.pass = (d.layer != null && d.layer < 0.5) || d.behind ? "behind" : "entity";
    } else if (type === "door" || type === "lockedDoor") {
      o = new CC_O.Door(d);
    } else if (type === "seashell") {
      var key = this.mapId + ":" + Math.round(d.x) + ":" + Math.round(d.y);
      d.key = key;
      if (CCE.hasShell(key)) return;
      o = new CC_O.Seashell(d, idx);
    } else if (type === "hat") {
      var hid = d.hatType || d.item || "normal";
      if (hid === "3d-glasses") d.file = "sunglasses";
      if (hid === "snorkel") d.file = "snorkel";
      if (CCE.ownHat(hid)) return;
      d.item = hid; d.slot = d.slot || "hat";
      o = new CC_O.Hat(d, idx);
    } else if (type === "chair") {
      o = new CC_O.Chair(d, idx); d.sid = this.mapId + ":chair:" + idx;
    } else if (type === "watercan") {
      o = new CC_O.Watercan(d);
    } else if (type === "plant") {
      o = new CC_O.Plant(d, idx);
    } else if (type === "metalDetector") {
      o = new CC_O.MetalDetector(d);
    } else if (type === "metal") {
      o = new CC_O.Metal(d);
    } else if (type === "marshmallow") {
      o = new CC_O.Marshmallow(d);
    } else if (type === "cat") {
      o = new CC_O.Cat(d);
    } else if (type === "river") {
      o = new CC_O.River(d);
    } else if (type === "soccerBall") {
      o = new CC_O.SoccerBall({
        x: d.centerX, y: d.centerY, playArea: polyBounds(d.playArea),
        goals: [d.goal1, d.goal2].filter(Boolean),
      });
    } else if (type === "volleyball") {
      o = new CC_O.Volleyball({
        x: d.x, y: d.y, bounds: polyBounds(d.corners), netX: d.x, strength: 11,
      });
    } else if (type === "tetherball" || type === "tetherBall") {
      o = new CC_O.TetherBall({ x: d.x, y: d.y, r: 14, rope: 80 });
    } else if (type === "seesaw") {
      o = new CC_O.Seesaw({ x: (d.x1 + d.x2) / 2, y: (d.y1 + d.y2) / 2, len: d.width ? 130 : 130 });
    } else if (type === "trigger") {
      o = new CC_O.Trigger(d);
      o.kind = d.animation;
    } else if (type === "lapTracker") {
      o = new CC_O.LapTracker(d);
    } else if (type === "hoverPoint") {
      o = new CC_O.HoverPoint(d);
    } else if (type === "exitArea") {
      o = new CC_O.ExitArea(d);
    } else if (type === "video") {
      o = new CC_O.VideoScreen(d);
      // Prefer the local library (capture2/movies, served at /movies/); keep the
      // original URL as a per-title fallback if a file is missing.
      o.playlist = (o.playlist || []).map(function (it, i) {
        return { src: "/movies/" + (i + 1) + ".mp4", remote: it.src, duration: it.duration, title: it.title };
      });
      o.muted = true;
      this.videoScreen = o;
    } else if (type === "concert") {
      o = new CC_O.ConcertArea(d);
      this.concert = o;
    } else if (type === "clickArea") {
      o = new CC_O.ClickArea(d);
      o.action = d.action;
    } else if (type === "merryGoRound") {
      var rv = { src: (d.sprite && d.sprite.src ? "merry-go-round.riv" : "merry-go-round.riv"), x: d.x, y: d.y, width: d.sprite ? d.sprite.width : 300 };
      o = new CC_O.ClickArea({ x: d.x, y: d.y, width: 190, height: 110 });
      o.action = "merry";
      o.spinRiv = new CCR.RiveObject(rv);
      this.rivObs.push(o.spinRiv);
    } else if (type === "trapdoor") {
      // A hatch, not a sound gadget: it carries a destination and a lever.
      o = new CC_O.Door({
        x: d.x, y: d.y,
        width: d.width || 130, height: d.height || 110,
        to: d.to, toX: d.toX, toY: d.toY, doorSound: "wood-door", noArt: true,
      });
      var tdRiv = new CCR.RiveObject({
        src: "trapdoor.riv",
        x: d.rivX != null ? d.rivX : d.x,
        y: d.rivY != null ? d.rivY : d.y,
        width: d.rivWidth || d.width || 140,
      });
      this.rivObs.push(tdRiv);
      // the lever also opens it
      if (d.leverX != null) {
        var lv = new CC_O.ClickArea({ x: d.leverX, y: d.leverY, width: 70, height: 70 });
        lv.action = "trapdoor";
        lv.tdest = { to: d.to, x: d.toX, y: d.toY, sound: "wood-door" };
        this.objs.push(lv);
      }
    } else if (RIV_GADGETS[type]) {
      var g = RIV_GADGETS[type];
      o = new CC_O.ClickArea({
        x: d.rivX != null ? d.rivX : d.x,
        y: d.rivY != null ? d.rivY : d.y,
        width: d.rivWidth || d.width || 140,
        height: d.rivHeight || d.height || 160,
      });
      o.action = "gadget";
      o.gdef = { sound: g.sound, toast: g.toast || null };
      var ro = new CCR.RiveObject({
        src: g.riv,
        x: d.rivX != null ? d.rivX : d.x,
        y: d.rivY != null ? d.rivY : d.y,
        width: d.rivWidth || d.width || 140,
      });
      this.rivObs.push(ro);
      o.rivRef = ro;
      if (d.hitX != null) { o.def.x = d.hitX; o.def.y = d.hitY; o.w = d.hitSize || 70; o.h = d.hitSize || 70; }
    } else if (type === "riveObject") {
      // files mirrored locally; anything else falls back to procedural FX
      if (Game.HAS_RIV.indexOf(d.src) >= 0) {
        var r2 = new CCR.RiveObject({ src: d.src, x: d.x, y: d.y, width: d.width });
        this.rivObs.push(r2);
      } else {
        var fx = PFX.spawn((d.src || "").replace(/.riv$/, ""), d);
        if (fx) this.objs.push(fx);
      }
      return;
    } else if (PLAIN_GADGETS[type]) {
      var pg = PLAIN_GADGETS[type];
      o = new CC_O.Gadget({ x: d.x, y: d.y, src: pg.img || null, size: d.size || 35, toast: pg.toast, type: type });
      o.gdef = { sound: pg.sound, shake: pg.shake, type: type };
      o.gadgetType = type;
      o.action = "gadget";
    } else if (type === "spatialAudio" || type === "ambientAudio") {
      return;
    } else {
      // unknown: try as an image if one is supplied
      if (d.src) o = new CC_O.Gadget({ x: d.x, y: d.y, src: d.src, size: d.size || 32 });
      else print(type);
    }
    if (o) { o.idx = idx; o.pass = o.pass || "entity"; this.objs.push(o); }
  };

  function polyBounds(pts) {
    if (!pts || !pts.length) return null;
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    pts.forEach(function (p) {
      x1 = Math.min(x1, p.x); y1 = Math.min(y1, p.y);
      x2 = Math.max(x2, p.x); y2 = Math.max(y2, p.y);
    });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  function print(v) { if (window.console) console.log("unmapped element", v); }

  // ---- camera ----
  Game.prototype.camUpdate = function (force, dt) {
    if (!this.player) return;
    var def = CC.MAP_DEFAULTS[this.mapId] || {};
    var mw = def.width || 3000, mh = def.height || 2000;
    var vw = this.view.w, vh = this.view.h;
    var cx = this.player.x - vw / 2;
    var cy = this.player.y - vh / 2;
    var nx = mw < vw ? (vw - mw) / 2 : U.clamp(cx, 0, mw - vw);
    var ny = mh < vh ? (vh - mh) / 2 : U.clamp(cy, 0, mh - vh);

    if (force || !this.camSmooth) {
      this.cam.x = nx;
      this.cam.y = ny;
    } else {
      var smoothRate = 1 - Math.exp(-8 * (dt || 0.016));
      this.cam.x = U.lerp(this.cam.x, nx, smoothRate);
      this.cam.y = U.lerp(this.cam.y, ny, smoothRate);
    }
    if (this.shake > 0.2) {
      this.cam.x += (Math.random() - 0.5) * this.shake;
      this.cam.y += (Math.random() - 0.5) * this.shake;
      this.shake *= 0.88;
    }
  };

  // ---- pointer lock & mouse controls ----
  Game.prototype.requestLock = function () {
    // In headless WebDriver automation (e.g. Playwright synthetic clicks), skip native lock unless requested
    if (navigator.webdriver && !window.__FORCE_LOCK__ && location.search.indexOf("lock=1") < 0) return;
    var c = document.body;
    if (!c || !c.requestPointerLock) return;
    try {
      var p = c.requestPointerLock();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  };

  Game.prototype.exitLock = function () {
    try {
      if (document.pointerLockElement && document.exitPointerLock) {
        document.exitPointerLock();
      }
    } catch (e) {}
  };

  // The cursor sets a TARGET; the avatar eases toward it every frame. Mouse
  // events arrive in bursts (and Chrome coalesces them), so moving the sprite
  // straight from them is what made the walk look steppy.
  Game.prototype.applyPointerDelta = function (dx, dy) {
    var p = this.player;
    if (!p || this.paused) return;
    var def = CC.MAP_DEFAULTS[this.mapId] || {};
    var mw = def.width || 3000, mh = def.height || 2000;
    var frac = this.water ? this.water.fraction(p.x, p.y) : 0;

    var mx = dx, my = dy;
    if (frac > 0.5) { mx *= 0.35; my *= 0.35; }
    else if (frac > 0) { mx *= 0.65; my *= 0.65; }

    p.tx = U.clamp((p.tx == null ? p.x : p.tx) + mx, 12, mw - 12);
    p.ty = U.clamp((p.ty == null ? p.y : p.ty) + my, 8, mh - 8);
    if (Math.abs(mx) > 0.2) p.facing = mx > 0 ? 1 : -1;
    if (p.sitting) p.sitting = null;
  };

  // Called from the update loop: spring the avatar onto its target and derive
  // step/trail from the real displacement so the walk stays continuous.
  Game.prototype.smoothMove = function (dt) {
    var p = this.player;
    if (!p) return;
    if (p.tx == null) { p.tx = p.x; p.ty = p.y; }
    var k = 1 - Math.exp(-24 * dt);
    var dx = (p.tx - p.x) * k, dy = (p.ty - p.y) * k;
    var mag = Math.sqrt(dx * dx + dy * dy);
    if (mag < 0.02) { p.x = p.tx; p.y = p.ty; mag = 0; }
    else { p.x += dx; p.y += dy; }
    if (mag > 0.15) {
      p.stepPhase += mag * 0.9;
      p.sq = U.lerp(p.sq, 1, Math.min(1, 10 * dt));
      if (!p.trail.length || U.now() - p.trail[p.trail.length - 1].t > 40) {
        p.trail.push({ x: p.x, y: p.y, t: U.now() });
        if (p.trail.length > 12) p.trail.shift();
      }
    } else {
      p.sq = U.lerp(p.sq, 0, Math.min(1, 10 * dt));
    }
  };
  // ---- input ----
  Game.prototype.attachInput = function () {
    var self = this;

    document.addEventListener("pointerlockchange", function () {
      var isLocked = !!(document.pointerLockElement);
      self.pointerLocked = isLocked;
      self.mouseDeltaX = 0;
      self.mouseDeltaY = 0;
      if (!isLocked && self.entered && !self.isModalOpen()) {
        self.pause(true);
      } else if (isLocked && self.paused) {
        self.pause(false);
      }
    });

    window.addEventListener("keydown", function (ev) {
      self.keys[ev.key.toLowerCase()] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(ev.key.toLowerCase()) >= 0) ev.preventDefault();
      if (ev.key.toLowerCase() === "m") self.muteToggle();
      if (ev.key.toLowerCase() === "h" || ev.key === "?") self.openGuide();
      if (ev.key.toLowerCase() === "f") {
        if (document.pointerLockElement) self.exitLock();
        else self.requestLock();
      }
      if (ev.key.toLowerCase() === "d") self.debugBall = !self.debugBall;
      if (["1", "2", "3", "4", "5", "6", "7", "8"].indexOf(ev.key) >= 0) self.emote(+ev.key);
      if (ev.key === "Escape") {
        if (self.isModalOpen()) {
          self.closeModals();
        } else if (document.pointerLockElement) {
          self.exitLock();
        } else if (self.entered) {
          self.pause(!self.paused);
        }
      }
    });
    window.addEventListener("keyup", function (ev) { self.keys[ev.key.toLowerCase()] = false; });
    window.addEventListener("blur", function () { self.keys = {}; });

    window.addEventListener("mousemove", function (ev) {
      self.pointer.x = ev.clientX; self.pointer.y = ev.clientY;
      self.pointer.moved = true;
      self.pointer.lastMoveTime = U.now();

      var dx = ev.movementX || 0;
      var dy = ev.movementY || 0;

      if (self.pointerLocked && self.player && !self.paused) {
        if (Math.abs(dx) < 600 && Math.abs(dy) < 600) {
          self.applyPointerDelta(dx, dy);
        }
      } else {
        if (Math.abs(dx) < 300 && Math.abs(dy) < 300) {
          self.mouseDeltaX += dx;
          self.mouseDeltaY += dy;
        }
      }
    });

    window.addEventListener("mousedown", function (ev) {
      if (ev.target.closest && ev.target.closest(".modal-window, .chip, #emote-dock")) return;
      self.pointer.down = true;

      // Right click: quick emote.
      if (ev.button === 2) {
        ev.preventDefault();
        self.emote(Math.floor(Math.random() * 8) + 1);
        return;
      }

      self.clickAt(ev.clientX, ev.clientY);
    });
    window.addEventListener("mouseup", function (ev) {
      if (ev.button === 2) return;
      self.pointer.down = false;
    });
    window.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });

    // touch
    var js = document.getElementById("joystick");
    var jthumb = js.querySelector(".joystick-thumb");
    var jid = null, jox = 0, joy = 0;
    window.addEventListener("touchstart", function (ev) {
      var touches = ev.changedTouches;
      for (var i = 0; i < touches.length; i++) {
        var t = touches[i];
        var r = js.getBoundingClientRect();
        if (t.clientX < r.right + 40 && t.clientY > r.top - 60) {
          jid = t.identifier; jox = r.left + r.width / 2; joy = r.top + r.height / 2;
          self.touchActive = true;
        } else {
          self.clickAt(t.clientX, t.clientY);
        }
      }
      if (self.touchActive) js.classList.remove("hidden");
    }, { passive: true });
    window.addEventListener("touchmove", function (ev) {
      for (var i = 0; i < ev.changedTouches.length; i++) {
        var t = ev.changedTouches[i];
        if (t.identifier === jid) {
          var dx = t.clientX - jox, dy = t.clientY - joy;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          var max = 44;
          var k = Math.min(1, d / max);
          self.joy = { x: (dx / d) * k, y: (dy / d) * k };
          jthumb.style.transform = "translate(" + (dx / d) * 34 + "px," + (dy / d) * 34 + "px) translate(-50%,-50%)";
        }
      }
    }, { passive: true });
    window.addEventListener("touchend", function (ev) {
      for (var i = 0; i < ev.changedTouches.length; i++) {
        if (ev.changedTouches[i].identifier === jid) {
          jid = null; self.joy = null; jthumb.style.transform = "translate(-50%,-50%)";
        }
      }
    });
  };

  Game.prototype.muteToggle = function () {
    var m = CCAU.toggleMuted();
    this.toast(m ? "Muted" : "Sound on");
  };

  // ---- world helpers ----
  Game.prototype.worldOf = function (sx, sy) { return { x: sx + this.cam.x, y: sy + this.cam.y }; };

  Game.prototype.clickAt = function (sx, sy) {
    if (!this.entered || this.paused) return;
    // Pointer lock freezes clientX/clientY at the lock position, so a locked
    // click must be resolved against the avatar itself (the cursor IS you).
    if (document.pointerLockElement && this.player) {
      sx = this.player.x - this.cam.x;
      sy = this.player.y - this.cam.y;
    }
    var w = this.worldOf(sx, sy);

    // 1. First priority: Check if click hit ANY Door or Opening visible on screen!
    for (var d = 0; d < this.objs.length; d++) {
      var dobj = this.objs[d];
      if (dobj instanceof CC_O.Door && !dobj.removed) {
        var mh = this.mapHeight || (CC.MAP_DEFAULTS[this.mapId] ? CC.MAP_DEFAULTS[this.mapId].height : 3797);
        var altY = mh - dobj.def.y - (dobj.h || 80);
        var altY2 = mh - dobj.def.y;
        if (dobj.hit(w.x, w.y) || (Math.abs(w.x - dobj.def.x) <= 90 && (Math.abs(w.y - altY) <= 130 || Math.abs(w.y - altY2) <= 130))) {
          this.interact(dobj, w.x, w.y);
          return;
        }
      }
    }
    // Proximity to door center / doorway opening (within 85px)
    for (var d2 = 0; d2 < this.objs.length; d2++) {
      var dobj2 = this.objs[d2];
      if (dobj2 instanceof CC_O.Door && !dobj2.removed) {
        var dw = dobj2.w || 80, dh = dobj2.h || 80;
        var dcx = dobj2.def.x + dw / 2, dcy = dobj2.def.y + dh / 2;
        if (Math.hypot(w.x - dcx, w.y - dcy) <= Math.max(dw, dh) / 2 + 55 ||
            Math.hypot(w.x - dobj2.def.x, w.y - dobj2.def.y) <= Math.max(dw, dh) / 2 + 55) {
          this.interact(dobj2, w.x, w.y);
          return;
        }
      }
    }

    // 2. Second priority: Standard pick at world position
    var hit = this.pick(w.x, w.y);

    // 3. Proximity / Reach check: if clicked near interactive object
    if (!hit && this.player) {
      for (var i = 0; i < this.objs.length; i++) {
        var ob = this.objs[i];
        if (!ob.hit || ob.removed) continue;
        var ox = ob.def ? ob.def.x : ob.x;
        var oy = ob.def ? ob.def.y : ob.y;
        if (ox != null && oy != null) {
          if (Math.hypot(ox - w.x, oy - w.y) <= 90 || Math.hypot(ox - w.x, (this.mapHeight || 3797) - oy - w.y) <= 90) {
            hit = ob;
            break;
          }
        }
      }

      // If pointer is locked and click missed, also check player reach (within 150px)
      if (!hit && this.pointerLocked) {
        hit = this.pick(this.player.x, this.player.y);
        if (!hit) {
          for (var j = 0; j < this.objs.length; j++) {
            var ob2 = this.objs[j];
            if (!ob2.hit || ob2.removed) continue;
            var ox2 = ob2.def ? ob2.def.x : ob2.x;
            var oy2 = ob2.def ? ob2.def.y : ob2.y;
            if (ox2 != null && oy2 != null) {
              if (Math.hypot(ox2 - this.player.x, oy2 - this.player.y) <= 150) {
                hit = ob2;
                break;
              }
            }
          }
        }
      }
    }

    if (!hit) {
      // If holding roasted marshmallow, clicking empty space eats it!
      if (this.player && this.player.held === "marshmallow" && this.player.roastLevel >= 0.25) {
        this.eatMarshmallow();
        return;
      }
      return;
    }

    this.interact(hit, w.x, w.y);
  };

  // topmost interactive object under a world point
  Game.prototype.pick = function (wx, wy) {
    var best = null, bestZ = -1e9;
    for (var i = 0; i < this.objs.length; i++) {
      var o = this.objs[i];
      if (!o.hit || o.removed) continue;
      var z = typeof o.z === "function" ? o.z() : (typeof o.z === "number" ? o.z : 0);
      var mh = this.mapHeight || 3797;
      if (!o.hit(wx, wy) && !o.hit(wx, mh - wy)) continue;
      // prefer higher z then nearer y
      if (z >= bestZ) { best = o; bestZ = z; }
    }
    if (this.campers) {
      for (var ci = 0; ci < this.campers.list.length; ci++) {
        var cp = this.campers.list[ci];
        var cpZ = typeof cp.z === "function" ? cp.z() : (typeof cp.z === "number" ? cp.z : 0);
        if (cp.hit(wx, wy) && cpZ >= bestZ) { best = cp; bestZ = cpZ; }
      }
    }
    if (this.village && this.mapId === "default") {
      var vh = this.village.pick(wx, wy);
      var vhZ = vh ? (typeof vh.z === "function" ? vh.z() : (typeof vh.z === "number" ? vh.z : 0)) : 0;
      if (vh && vhZ >= bestZ) { best = vh; bestZ = vhZ; }
    }
    if (this.school) {
      var sh = this.school.pick(wx, wy);
      var shZ = sh ? (typeof sh.z === "function" ? sh.z() : (typeof sh.z === "number" ? sh.z : 0)) : 0;
      if (sh && shZ >= bestZ) { best = sh; bestZ = shZ; }
    }
    return best;
  };

  Game.prototype.interact = function (o, wx, wy) {
    var self = this;
    if (o instanceof CC_Camper) {
      o.wave();
      var msg = (o.getGreeting ? o.getGreeting() : (o.name + " waves at you!"));
      this.toast(msg);
      this.play("pop");
      return;
    }
    if (this.school) {
      if (typeof o.interact === "function") {
        o.interact();
        return;
      }
      if (o.kind === "teacher" || (window.Teacher && o instanceof Teacher)) {
        o.talk();
        return;
      }
      if (o.kind === "student" || (window.Student && o instanceof Student)) {
        o.talk();
        return;
      }
      if (o.kind === "school-bell" || (window.SchoolBell && o instanceof SchoolBell)) {
        o.ring();
        return;
      }
      if (o.kind === "school-board" || (window.SchoolBoard && o instanceof SchoolBoard)) {
        o.readLesson();
        return;
      }
      if (typeof o.talk === "function") {
        o.talk();
        return;
      }
    }
    if (o instanceof CC_V.VillageWoman) {
      o.wave();
      this.village.activeWoman = o;
      window.VUI.talkTo(o);
      this.toast(o.name + " has a story to tell 🌳");
      this.play("pop");
      return;
    }
    if (o instanceof CC_V.VCat) {
      window.VUI.petCat();
      return;
    }
    if (o instanceof CC_V.VWaySign) {
      o.talk();
      this.toast("The banyan tree is east \u2728");
      this.play("pop");
      return;
    }
    if (o instanceof CC_O.Door) {
      var dd = o.def;
      if (!dd.to) {
        this.toast("This door is locked");
        this.play("pop");
        return;
      }
      this.enterThrough(dd.to, dd.toX, dd.toY, dd.doorSound || "wood-door");
      return;
    }
    if (o instanceof CC_O.ExitArea) {
      this.enterThrough(o.def.to, o.def.toX, o.def.toY, "whoosh");
      return;
    }
    if (o.action === "trapdoor") {
      this.enterThrough(o.tdest.to, o.tdest.x, o.tdest.y, o.tdest.sound || "wood-door");
      return;
    }
    if (o instanceof CC_O.Seashell) {
      if (CCE.collectShell(o.def.key)) {
        o.removed = true;
        CCE.addShells(1);
        this.play("pickup");
        this.refreshHud();
        var msg = document.getElementById("shells-msg");
        msg.textContent = "You found a seashell. " + CCE.load().collectedShells.length + " / " + CC.SEASHELL_TOTAL;
        var bd = document.getElementById("modal-backdrop");
        if (bd) bd.classList.remove("hidden");
        document.getElementById("shells").classList.remove("hidden");
        if (CCE.load().collectedShells.length >= CC.SEASHELL_TOTAL) this.giveBadge("seashells");
      }
      return;
    }
    if (o instanceof CC_O.Hat) {
      var own = o.collect();
      CCE.addItem(own.hat);
      CCE.equipHat(own.hat);
      o.removed = true;
      this.play("pickup");
      this.toast("Found: " + own.label);
      return;
    }
    if (o instanceof CC_O.Chair) {
      this.player.setPos(o.def.x, o.def.y + 4);
      this.player.sitting = o;
      o.sitting = true;
      this.play("pop");
      var s = CCE.load();
      if (s.chairIds.indexOf(o.def.sid) < 0) s.chairIds.push(o.def.sid);
      s.sits++;
      CCE.commit();
      if (s.chairIds.length >= 2) this.giveBadge("chairs");
      return;
    }
    if (o instanceof CC_O.Watercan) {
      this.player.held = "watercan";
      o.removed = true;
      this.play("pickup");
      this.toast("Watering can \u2014 click plants to blossom them! 🌸");
      return;
    }
    if (o instanceof CC_O.Plant) {
      if (this.player.held === "watercan" && !o.watered) {
        o.watered = true;
        o.setStage(4);
        this.play("water-stream");
        var s2 = CCE.load();
        s2.watered++; CCE.commit();
        this.toast("Blossomed beautiful flowers! 🌺");
        if (s2.watered >= 4) this.giveBadge("gardener");
      } else if (!o.watered) {
        this.toast("Needs water! Find the watering can 💧");
      }
      return;
    }
    if (o instanceof CC_O.MetalDetector) {
      o.using = true; o.useUntil = U.now() + 1800;
      this.play("beep");
      return;
    }
    if (o instanceof CC_O.Metal) {
      o.found = true; o.removed = true;
      var s3 = CCE.load();
      s3.metalFound = true; CCE.commit();
      this.play("metal-pick");
      this.toast("Found: " + (o.def.item || "something metal"));
      this.giveBadge("metalDetector");
      return;
    }
    if (o instanceof CC_O.Marshmallow) {
      this.player.held = "marshmallow";
      this.player.roastLevel = 0;
      this._roastNoticeShown = false;
      this.play("stick");
      this.toast("Marshmallow on a stick! Hold it near the campfire to roast 🔥");
      return;
    }
    if (o.kind === "campfire") {
      if (this.player.held === "marshmallow") {
        if (this.player.roastLevel >= 0.25) {
          this.eatMarshmallow();
        } else {
          this.toast("Roasting... wait until it's golden brown! 🔥");
        }
        return;
      }
      if (this.player.held === "wood") {
        this.player.held = null;
        if (o.feed) o.feed();
        this.play("flicker");
        this.toast("Fed firewood to the campfire! The flames roar! 🔥🪵");
        return;
      }
      if (o.poke) o.poke();
      this.play("flicker");
      this.toast("The fire crackles warmly 🔥");
      return;
    }
    if (o instanceof CC_O.Cat) {
      o.pets++;
      this.play("pop");
      var s5 = CCE.load();
      s5.pets++; CCE.commit();
      this.toast("Purr");
      this.giveBadge("cat");
      return;
    }
    if (o instanceof CC_O.Trigger) {
      o.usableAgainAt = U.now() + 2500;
      if (o.kind === "waterslide") {
        var s6 = CCE.load(); s6.slides++; CCE.commit();
        this.play("slide");
        this.toast("Wheee!");
        this.giveBadge("waterslide");
        this.slidePlayer();
      } else if (o.kind === "cannonball") {
        var s7 = CCE.load(); s7.cannonballs++; CCE.commit();
        this.play("diving-board");
        this.toast("CANNONBALL!");
        this.giveBadge("cannonball");
        this.shake = 10;
      }
      return;
    }
    if (o instanceof CC_O.ConcertArea) { this.play("wheel"); this.dancing = U.now() + 4000; return; }
    if (o instanceof CC_O.HoverPoint) {
      this.play("beep");
      this.toast((o.emoji || "") + " " + (o.text || ""));
      return;
    }

    // Specific interactive camp gadgets
    var gType = o.gadgetType || (o.def && o.def.type);
    if (gType === "gatorade") {
      this.play("slurp");
      this.player.speedBoostUntil = U.now() + 15000;
      this.player.emoteNow(6);
      this.toast("Electrolyte Rush! Speed Boosted! ⚡ (+35% speed)");
      return;
    }
    if (gType === "coffee") {
      this.play("slurp");
      this.player.speedBoostUntil = U.now() + 15000;
      this.player.emoteNow(6);
      this.toast("Fresh Brewed Coffee! Speed Boosted! ☕⚡ (+35% speed)");
      return;
    }
    if (gType === "water" || gType === "coal") {
      // Sauna water bucket or coals
      PFX.createSteamCloud(o.def.x, o.def.y, false);
      this.play("steam");
      this.shake = 4;
      this.player.emoteNow(5);
      this.toast("Sauna heating up! ♨️ (105°C)");
      return;
    }
    if (gType === "chilli") {
      // Drop chilli in tent cauldron
      PFX.createSteamCloud(o.def.x, o.def.y, true);
      PFX.createSoundWave(o.def.x, o.def.y, "#ff4757");
      this.play("steam");
      this.play("pop");
      this.shake = 8;
      this.player.emoteNow(8);
      this.toast("Super Spicy Chili Brew! 🌶️🔥");
      return;
    }
    if (gType === "wood") {
      this.player.held = "wood";
      this.play("stick");
      this.toast("Picked up firewood log! Carry it to the campfire 🪵");
      return;
    }
    if (gType === "gong") {
      this.play("gong");
      var gx = o.def ? o.def.x : 452, gy = o.def ? o.def.y : 500;
      PFX.createSoundWave(gx, gy, "#ffd166");
      this.toast("GONNNGG! 🔔");
      return;
    }
    if (gType === "drum") {
      this.play("pop");
      var dx = o.def ? o.def.x : 1100, dy = o.def ? o.def.y : 180;
      PFX.createSoundWave(dx, dy, "#e056fd");
      this.toast("Ba-dum! 🥁");
      return;
    }
    if (gType === "shock") {
      this.shockScout();
      return;
    }

    if (o.action === "gadget") {
      if (o.gdef) {
        this.play(o.gdef.sound);
        if (o.gdef.toast) this.toast(o.gdef.toast);
        if (o.gdef.shake) this.shake = o.gdef.shake;
      }
      if (o.rivRef) this.pokeRive(o.rivRef);
      return;
    }
    if (o.action === "shop") return this.openShop();
    if (o.action === "badges") return this.openBadges();
    if (o.action === "merry") { this.play("wheel"); this.rideUntil = U.now() + 3000; this.rideCenter = { x: o.def.x, y: o.def.y }; return; }
    if (o.action && o.action.indexOf("sound:") === 0) { this.play(o.action.slice(6)); return; }
    if (o instanceof CC_O.VideoScreen) {
      var vs = o, el = this.movieEl;
      if (vs.playing && el) {
        vs.muted = !vs.muted;
        el.muted = vs.muted;
        this.toast(vs.muted ? "Cinema muted \u2014 click the screen for sound" : "Sound on \ud83c\udfac");
      } else {
        this.startMovie(vs.idx || 0, vs, null);
      }
      return;
    }
    if (o instanceof CC_O.SoccerBall) { o.kick(wx, wy); return; }
    if (o instanceof CC_O.Volleyball) { o.kick(wx, wy); return; }
    if (o instanceof CC_O.TetherBall) { o.whack(wx, wy); return; }
    if (o instanceof CC_O.Seesaw) { o.push(); return; }
  };

  Game.prototype.pokeRive = function (rv) {
    try {
      if (rv.rv) rv.rv.play("");
    } catch (e) {}
  };

  // waterslide: glide the player to the pool at the bottom of the slide
  Game.prototype.slidePlayer = function () {
    var p = this.player, self = this;
    var sx = p.x, sy = p.y;
    var tx = 4460, ty = 700, t0 = U.now();
    var dur = 1400;
    var step = function () {
      var k = Math.min(1, (U.now() - t0) / dur);
      var e = k * k;
      p.setPos(U.lerp(sx, tx, e), U.lerp(sy, ty, e));
      if (k < 1) requestAnimationFrame(step);
      else self.play("whoosh");
    };
    step();
  };

  // ---- per-frame update ----
  Game.prototype.update = function (dt, t) {
    var p = this.player;
    if (!p || this.paused) return;
    var def = CC.MAP_DEFAULTS[this.mapId] || {};
    var mw = def.width || 3000, mh = def.height || 2000;

    // 1. Keyboard / Joystick input vector
    var kx = 0, ky = 0;
    if (this.keys["a"] || this.keys["arrowleft"]) kx -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) kx += 1;
    if (this.keys["w"] || this.keys["arrowup"]) ky -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) ky += 1;
    if (this.joy) { kx += this.joy.x; ky += this.joy.y; }
    var kmag = Math.sqrt(kx * kx + ky * ky);
    if (kmag > 1) { kx /= kmag; ky /= kmag; }
    var hasKey = (kmag > 0.05);

    var frac = this.water ? this.water.fraction(p.x, p.y) : 0;

    // 2. Mouse Cursor fallback movement (when not pointer locked, e.g. drag or touch)
    var mx = this.mouseDeltaX || 0;
    var my = this.mouseDeltaY || 0;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    var hasMouseDelta = (Math.abs(mx) > 0.05 || Math.abs(my) > 0.05);

    if (hasMouseDelta && !this.pointerLocked) {
      this.applyPointerDelta(mx, my);
    } else if (this.pointer.down && !hasKey && !this.pointerLocked) {
      // If mouse is held down without pointer lock (drag to walk)
      var targetX = this.pointer.x + this.cam.x;
      var targetY = this.pointer.y + this.cam.y;
      var tdx = targetX - p.x;
      var tdy = targetY - p.y;
      var tdist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tdist > 12) {
        var dirX = tdx / tdist;
        var dirY = tdy / tdist;
        var speedFactor = Math.min(1, tdist / 40);
        var six = dirX * speedFactor;
        var siy = dirY * speedFactor;
        if (frac > 0) { six *= 0.72; siy *= 0.72; }
        p.move(six, siy, dt, frac);
      }
    }

    // 3. Apply Keyboard Movement (WASD / Arrows)
    if (hasKey) {
      var kix = kx, kiy = ky;
      if (frac > 0) { kix *= 0.72; kiy *= 0.72; }
      p.move(kix, kiy, dt, frac);
      p.tx = p.x; p.ty = p.y;   // keyboard owns the position
    }
    this.smoothMove(dt);

    // obstacle-free clamp to map bounds
    p.x = U.clamp(p.x, 12, mw - 12);
    p.y = U.clamp(p.y, 8, mh - 8);

    // riding the merry-go-round
    if (this.rideUntil && U.now() < this.rideUntil) {
      var rc = this.rideCenter || { x: 3914, y: 1657 };
      p.x = rc.x + Math.cos(U.now() / 700) * 40;
      p.y = rc.y + Math.sin(U.now() / 700) * 18;
    }

    // rivers push
    for (var i = 0; i < this.objs.length; i++) {
      var o = this.objs[i];
      if (o instanceof CC_O.River) {
        var f = o.flowAt(p.x, p.y);
        if (f) { p.x += f.x * dt * CC.GAME_CONFIG.waterPush; p.y += f.y * dt * CC.GAME_CONFIG.waterPush; }
      }
    }

    // doors (skipped briefly on arrival so a door under the spawn point
    // cannot instantly bounce you back where you came from)
    // Doors are click-only: brushing past a doorway (or standing on it) must
    // never teleport you. Walk-through stays available behind this flag for
    // debugging, but is off for players.
    if (this.walkThroughDoors && U.now() >= (this.entryGraceUntil || 0)) {
      for (var j = 0; j < this.objs.length; j++) {
        var dd = this.objs[j];
        if (dd instanceof CC_O.Door) {
          var dest = dd.touching(p.x, p.y);
          if (dest) { this.enterThrough(dest.to, dest.x, dest.y, dest.sound || "wood-door"); return; }
        }
      }
    }

    // objects
    for (var k = 0; k < this.objs.length; k++) {
      var ob = this.objs[k];
      if (ob.update) ob.update(dt, t, this, p.x, p.y);
    }
    if (this.campers) this.campers.update(dt);
    if (this.village && this.mapId === "default") this.village.update();
    if (this.school) this.school.update(dt);
    for (var r = 0; r < this.rivObs.length; r++) if (!this.rivObs[r]._inited) { this.rivObs[r]._inited = true; this.rivObs[r].init(); }

    // dancing on the concert stage
    if (this.concert && this.concert.inside) this.dancing = U.now() + 60;
    if (this.dancing && U.now() > this.dancing) this.dancing = 0;

    this.lastCursorX = p.x; this.lastCursorY = p.y;
    CCE.load().lastX = p.x; CCE.load().lastY = p.y;
    CCAU.updateSpatial(p.x, p.y);
    this.camUpdate(false, dt);
    if (this.pointerLocked) {
      this.pointer.x = p.x - this.cam.x;
      this.pointer.y = p.y - this.cam.y;
      this.pointer.worldX = p.x;
      this.pointer.worldY = p.y;
    } else {
      this.pointer.worldX = this.pointer.x + this.cam.x;
      this.pointer.worldY = this.pointer.y + this.cam.y;
    }

    // movie + premiere bookkeeping
    if (this.videoScreen) this.tickVideo(t);

    // Global procedural FX (steam clouds, soundwaves)
    if (window.PFX && window.PFX.updateGlobalFX) window.PFX.updateGlobalFX(dt);

    // Real-time Marshmallow roasting near the campfire (position from map data)
    if (this.player && this.player.held === "marshmallow" && this.firePos) {
      var dFire = Math.hypot(p.x - this.firePos.x, p.y - this.firePos.y);
      if (dFire < 240) {
        p.roastLevel = Math.min(1.5, (p.roastLevel || 0) + dt * 0.22);
        if (p.roastLevel >= 0.6 && !this._roastNoticeShown) {
          this.toast("Marshmallow is golden brown! Click anywhere to eat! 🍢");
          this._roastNoticeShown = true;
        }
      }
    }

    // Electric shock pads/wires come from the map data (type: "shock")
    if (this.player) {
      for (var si = 0; si < this.objs.length; si++) {
        var so = this.objs[si];
        if (!so.def || so.def.type !== "shock") continue;
        if (Math.hypot(p.x - so.def.x, p.y - so.def.y) < (so.def.radius || 80) * 0.9) {
          if (!this._lastShockTime || U.now() - this._lastShockTime > 3500) {
            this.shockScout();
            this._lastShockTime = U.now();
          }
          break;
        }
      }
    }
  };

  Game.prototype.eatMarshmallow = function () {
    if (!this.player || this.player.held !== "marshmallow") return;
    this.play("eat");
    this.giveBadge("marshmallow");
    CCE.addShells(2);
    this.refreshHud();
    this.player.held = null;
    this.player.roastLevel = 0;
    this._roastNoticeShown = false;
    this.player.emoteNow(4); // party celebrate
    this.toast("Yum! Delicious roasted s'more! +2 Shells 🐚🍢");
  };

  Game.prototype.shockScout = function () {
    if (!this.player) return;
    this.play("shock");
    this.shake = 16;
    this.player.shockUntil = U.now() + 1600;
    this.player.emoteNow(6); // zap emote
    this.toast("OUCH! Electric Shock! ⚡");
  };

  Game.prototype.goTo = function (mapId, x, y, sound) {
    if (!CC.MAP_DEFAULTS[mapId]) return;
    this.entryGraceUntil = U.now() + 200;
    this.play(sound || "wood-door");
    return this.load(mapId, x, y);
  };

  // Door / trapdoor / exit-area destinations are authored in the same
  // bottom-up space as the source maps, so they must be flipped against the
  // DESTINATION map's height. (goTo itself stays raw so dev helpers like
  // ccGoto() can keep using screen-space, top-down coordinates.)
  Game.prototype.enterThrough = function (mapId, x, y, sound) {
    var dh = (CC.MAP_DEFAULTS[mapId] || {}).height;
    var ty = (typeof y === "number" && dh) ? dh - y : y;
    return this.goTo(mapId, x, ty, sound);
  };

  // ---- toasts, badges, hud ----
  var toastT = null;
  Game.prototype.toast = function (msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.add("hidden"); }, 2200);
  };

  Game.prototype.play = function (name) { CCAU.play(name); };

  Game.prototype.giveBadge = function (key) {
    if (!CC.BADGES[key]) return;
    if (!CCE.unlockBadge(key)) return;
    this.refreshHud();
    CCE.toastOnUnlock(this, key);
  };

  Game.prototype.refreshHud = function () {
    var s = CCE.load();
    var countEl = document.getElementById("shells-count");
    if (countEl) countEl.textContent = s.shells;
    var bCountEl = document.getElementById("badges-count");
    if (bCountEl) bCountEl.textContent = CCE.badgeCount() + "/9";
    var bp = document.getElementById("badge-progress-fill");
    var bpc = document.getElementById("badge-prog-count");
    if (bp) bp.style.width = Math.round((CCE.badgeCount() / 9) * 100) + "%";
    if (bpc) bpc.textContent = CCE.badgeCount() + " / 9";
  };

  // ---- rendering ----
  Game.prototype.render = function () {
    var dpr = this.dpr, cam = this.cam, vw = this.view.w, vh = this.view.h;
    var def = CC.MAP_DEFAULTS[this.mapId] || {};
    var mw = def.width || 3000, mh = def.height || 2000;
    var b = this.baseCtx, e = this.entCtx, tp = this.topCtx, ov = this.ovCtx;

    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    e.setTransform(dpr, 0, 0, dpr, 0, 0);
    tp.setTransform(dpr, 0, 0, dpr, 0, 0);
    ov.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.clearRect(0, 0, vw, vh); e.clearRect(0, 0, vw, vh); tp.clearRect(0, 0, vw, vh); ov.clearRect(0, 0, vw, vh);

    // backdrop
    b.fillStyle = "#dceefb"; b.fillRect(0, 0, vw, vh);

    // map base
    if (this.tmap) {
      if (this.tmap.layers) {
        this.tmap.preload(cam.x - 512, cam.y - 512, vw + 1024, vh + 1024, false);
        this.tmap.drawLayer(b, "base", cam.x, cam.y, vw, vh, dpr);
      }
    } else if (this.fmap && this.fmap.base && this.fmap.base.complete && this.fmap.base.naturalWidth > 0) {
      b.drawImage(this.fmap.base, -cam.x, -cam.y, mw, mh);
    }

    // water tint
    if (this.water) this.water.draw(b, cam, vw, vh, dpr, 0.22);

    // behind objects
    var self = this;
    this.objs.forEach(function (o) { if (o.pass === "behind" && o.render) o.render(b, cam); });
    this.rivObs.forEach(function (r) {
      var target = (self.player && r.y > self.player.y + 4) ? self.rivBack : self.rivFront;
      if (r.canvas && r.canvas.parentNode !== target) target.appendChild(r.canvas);
      r.frame(cam, dpr);
    });

    // entities sorted by y
    var ents = this.objs.filter(function (o) { return o.pass !== "behind" && !o.removed; });
    ents.sort(function (a, c) {
      var az = a.z ? a.z() : 0, cz = c.z ? c.z() : 0;
      if (az !== cz) return az - cz;
      return (a.def ? a.def.y : 0) - (c.def ? c.def.y : 0);
    });
    ents.forEach(function (o) { if (o.render) o.render(e, cam); });

    // ambient campers + village (banyan tree) entities, depth-sorted
    if (this.village && this.mapId === "default") this.village.renderGround(e, cam);
    if (this.school) this.school.renderGround(e, cam);
    var ents2 = [];
    if (this.campers && this.campers.list.length) ents2 = ents2.concat(this.campers.list);
    if (this.village && this.mapId === "default") ents2 = ents2.concat(this.village.entities());
    if (this.school) ents2 = ents2.concat(this.school.entities());
    if (ents2.length) {
      ents2.sort(function (a, b) { return a.y - b.y; });
      ents2.forEach(function (c) { if (c.render) c.render(e, cam); });
    }

    // player
    if (this.player) {
      if (this.dancing) {
        e.save();
        e.translate(this.player.x - cam.x, this.player.y - cam.y);
        e.rotate(Math.sin(U.now() / 90) * 0.25);
        e.translate(-(this.player.x - cam.x), -(this.player.y - cam.y));
        this.player.render(e, cam);
        e.restore();
      } else {
        this.player.render(e, cam);
      }
    }

    // banyan tree canopy & school roof/canopy (above player, below map top-layer)
    if (this.village && this.mapId === "default") this.village.renderCanopy(tp, cam);
    if (this.school) this.school.renderCanopy(tp, cam);

    // canopy / top layer
    if (this.tmap && this.tmap.layers) this.tmap.drawLayer(tp, "top", cam.x, cam.y, vw, vh, dpr);
    else if (this.fmap && this.fmap.top && this.fmap.top.complete && this.fmap.top.naturalWidth > 0) tp.drawImage(this.fmap.top, -cam.x, -cam.y, mw, mh);

    // The cinema board sits in the map's foreground layer, so the picture has
    // to be painted on top of that layer to be visible at all.
    if (this.videoScreen && this.mapId === "default") this.videoScreen.render(tp, cam);

    // Global procedural FX (steam clouds, soundwaves)
    if (window.PFX && window.PFX.renderGlobalFX) window.PFX.renderGlobalFX(tp, cam);

    this.renderCursor(ov);
    this.renderVignette(ov);
  };

  Game.prototype.renderCursor = function (ov) {
    var p = this.pointer;
    var wx = this.pointerLocked && this.player ? this.player.x : (p.x + this.cam.x);
    var wy = this.pointerLocked && this.player ? this.player.y : (p.y + this.cam.y);
    var o = this.pick(wx, wy);
    var hover = !!o;

    // Update player avatar art so cursor switches to pointer hand when hovering
    if (this.player) {
      this.player.art = hover ? this.copy : CCA.img("optimized/cursor.webp");
    }

    var img = hover ? this.copy : CCA.img("optimized/cursor.webp");
    if (img.complete && img.naturalWidth) {
      var s = hover ? 40 : 34;
      var hx = this.pointerLocked && this.player ? (this.player.x - this.cam.x) : p.x;
      var hy = this.pointerLocked && this.player ? (this.player.y - this.cam.y) : p.y;
      if (hover) {
        ov.save();
        ov.globalAlpha = 0.35 + 0.15 * Math.sin(U.now() / 160);
        ov.fillStyle = "#fff";
        ov.beginPath(); ov.arc(hx, hy, 22, 0, 6.2832); ov.fill();
        ov.restore();
      }
      // Only draw standalone overlay cursor if pointer is not locked (otherwise player is cursor)
      if (!this.pointerLocked) {
        ov.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    // caption for hover points
    if (o instanceof CC_O.HoverPoint && o.text) {
      var txt = o.emoji + "  " + o.text;
      var px = this.pointerLocked && this.player ? (this.player.x - this.cam.x) : p.x;
      var py = this.pointerLocked && this.player ? (this.player.y - this.cam.y) : p.y;
      ov.font = "bold 15px system-ui, sans-serif";
      var w = ov.measureText(txt).width + 22;
      ov.fillStyle = "rgba(74,55,40,.9)";
      ov.beginPath(); ov.roundRect(px + 18, py + 6, w, 28, 10); ov.fill();
      ov.fillStyle = "#fff"; ov.fillText(txt, px + 29, py + 25);
    }
  };

  Game.prototype.renderVignette = function (ov) {
    var vw = this.view.w, vh = this.view.h;
    if (this.mapId === "cave") {
      var g = ov.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.25, vw / 2, vh / 2, Math.max(vw, vh) * 0.72);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,.72)");
      ov.fillStyle = g; ov.fillRect(0, 0, vw, vh);
    }
    var def = CC.MAP_DEFAULTS[this.mapId] || {};
    if (def.horizonY != null) {
      var hy = def.horizonY - this.cam.y;
      var fade = def.horizonFadeDistance || 300;
      var grad = ov.createLinearGradient(0, hy, 0, hy + fade);
      grad.addColorStop(0, "rgba(215,235,248,.9)");
      grad.addColorStop(1, "rgba(215,235,248,0)");
      ov.fillStyle = grad; ov.fillRect(0, Math.max(0, hy - 40), vw, Math.max(0, vh - hy));
    }
  };

  // ---- movie theatre ----
  Game.prototype.loadSchedule = function () {
    var self = this;
    return CCA.loadJSON(CC.LIVE.scheduleApi).then(function (j) {
      self.premieres = (j.premieres || []).slice();
      if (CC.LIVE.premiereForce) {
        self.premieres.unshift({
          id: "test-" + Date.now(), title: "Premiere test", startMs: Date.now() + 8000,
          durationSeconds: 30, idx: 0,
        });
      }
    }, function () { self.premieres = []; });
  };

  Game.prototype.nextPremiere = function () {
    var now = Date.now();
    for (var i = 0; i < this.premieres.length; i++) if (this.premieres[i].startMs > now) return this.premieres[i];
    return null;
  };

  Game.prototype.tickVideo = function () {
    var vs = this.videoScreen, el = this.movieEl;
    if (!vs || !el) return;
    // The campground cinema runs a continuous programme: get near the screen
    // and something is already playing (like the original).
    var near = this.player && U.hitCircle(this.player.x, this.player.y, vs.def.x, vs.def.y, 900);
    if (near) {
      if (vs.state === "idle") vs.state = "playing";
      if (!vs.playing && !vs.loadingSrc) this.startMovie(vs.idx || 0, vs, null);
      if (vs.playing) {
        var d = Math.hypot(this.player.x - vs.def.x, this.player.y - vs.def.y);
        var vol = U.clamp(1 - (d - 150) / 700, 0, 1);
        el.muted = !!vs.muted;
        if (!vs.muted) el.volume = Math.max(0.03, vol);
      }
    } else if (vs.playing || vs.loadingSrc) {
      vs.playing = false;
      vs.loadingSrc = null;
      try { el.pause(); } catch (e3) {}
    }
  };

  Game.prototype.startMovie = function (idx, vs, premiere) {
    var el = this.movieEl;
    var item = vs.playlist[idx % vs.playlist.length];
    if (!item) return;
    if (vs.loadingSrc === item.src) return;   // already loading this title
    vs.loadingSrc = item.src;
    vs.idx = idx % vs.playlist.length;
    el.src = item.src;
    el.loop = false;
    // muted start keeps browser autoplay policies happy; the player can click
    // the screen to hear the film
    el.muted = vs.muted !== false;
    var self = this;
    el.onplaying = function () { vs.playing = true; };
    el.onpause = function () { vs.playing = false; };
    el.onerror = function () {
      vs.loadingSrc = null;
      vs.playing = false;
      if (item.remote && el.getAttribute("src") !== item.remote) {
        el.setAttribute("src", item.remote);
        el.play().catch(function () {});
      } else {
        self.startMovie(idx + 1, vs, null);
      }
    };
    el.onended = function () { vs.loadingSrc = null; vs.playing = false; self.startMovie(idx + 1, vs, null); };
    var startAt = premiere ? Math.max(0, (Date.now() - premiere.startMs) / 1000) : 0;
    var go = function () {
      if (startAt) { try { el.currentTime = startAt; } catch (e) {} }
      el.play().then(function () { vs.playing = true; }, function () { vs.loadingSrc = null; });
    };
    if (el.readyState >= 1) go(); else el.onloadedmetadata = go;
  };

  // ---- emote ----
  Game.prototype.emote = function (n) {
    if (!this.player) return;
    this.player.emoteNow(n);
    this.play("pop");
  };

  // ---- modal helpers ----
  Game.prototype.isModalOpen = function () {
    var ids = ["shop", "badges", "shells", "badge-unlock", "guide-modal"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && !el.classList.contains("hidden")) return true;
    }
    return false;
  };

  Game.prototype.closeModals = function () {
    ["shop", "badges", "shells", "badge-unlock", "guide-modal"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    var bd = document.getElementById("modal-backdrop");
    if (bd && !this.paused) bd.classList.add("hidden");
    if (this.entered && !this.paused) {
      this.requestLock();
    }
  };

  Game.prototype.openShop = function () {
    this.exitLock();
    var self = this;
    var s = CCE.load();
    document.getElementById("shop-shells").textContent = s.shells;
    var box = document.getElementById("shop-items");
    box.innerHTML = "";
    CC.SHOP_ITEMS.forEach(function (it) {
      var owned = CCE.ownItem(it.id);
      var eq = CCE.equipped(it.id);
      var el = document.createElement("div");
      el.className = "shop-item";
      el.dataset.owned = String(owned);
      el.dataset.equipped = String(eq);
      el.innerHTML = '<img src="' + it.image + '" alt=""><div class="si-name">' + it.name +
        '</div><div class="si-price">' + (owned ? (eq ? "✓ Wearing" : "Equip") : it.price + " 🐚") + "</div>";
      el.addEventListener("click", function () {
        if (CCE.ownItem(it.id)) {
          if (it.slot === "hat") CCE.equipHat(it.value);
          else if (it.slot === "glasses") CCE.equipGlasses(it.value);
          self.play("pop");
        } else if (CCE.spendShells(it.price)) {
          CCE.addItem(it.id);
          self.play("pickup");
          self.toast("Bought " + it.name);
        } else {
          self.toast("Need " + it.price + " shells to buy");
        }
        self.refreshHud();
        self.openShop();
      });
      box.appendChild(el);
    });
    var bd = document.getElementById("modal-backdrop");
    if (bd) bd.classList.remove("hidden");
    document.getElementById("shop").classList.remove("hidden");
    this.play("pop");
  };

  Game.prototype.openBadges = function () {
    this.exitLock();
    var box = document.getElementById("badges-grid");
    box.innerHTML = "";
    var self = this;
    var total = 0, unlockedCount = 0;
    Object.keys(CC.BADGES).forEach(function (k) {
      total++;
      var bd = CC.BADGES[k];
      var unlocked = CCE.badgeUnlocked(k);
      if (unlocked) unlockedCount++;
      var cell = document.createElement("div");
      cell.className = "badge-cell" + (unlocked ? "" : " locked");
      cell.innerHTML = '<img src="' + (unlocked ? bd.image : "assets/badges/locked.png") + '" alt="">' +
        '<div class="b-name">' + bd.name + '</div><div class="b-desc">' + bd.desc + "</div>";
      box.appendChild(cell);
    });
    var bp = document.getElementById("badge-progress-fill");
    var bpc = document.getElementById("badge-prog-count");
    if (bp) bp.style.width = Math.round((unlockedCount / total) * 100) + "%";
    if (bpc) bpc.textContent = unlockedCount + " / " + total;
    var bdEl = document.getElementById("modal-backdrop");
    if (bdEl) bdEl.classList.remove("hidden");
    document.getElementById("badges").classList.remove("hidden");
    this.play("pop");
  };

  Game.prototype.openGuide = function () {
    this.exitLock();
    var bd = document.getElementById("modal-backdrop");
    if (bd) bd.classList.remove("hidden");
    var g = document.getElementById("guide-modal");
    if (g) g.classList.remove("hidden");
    this.play("pop");
  };

  // ---- lifecycle ----
  Game.prototype.start = function () {
    var self = this;
    this.running = true;
    this.resize();
    this.attachInput();
    window.addEventListener("resize", function () { self.resize(); });

    var save = CCE.load();
    var startMap = CC.MAP_DEFAULTS[save.lastMap] ? save.lastMap : "default";
    var sx = startMap === save.lastMap ? save.lastX : null;
    var sy = startMap === save.lastMap ? save.lastY : null;

    CCR.ready();
    // Load the world immediately; the premiere schedule is independent and must
    // not delay (or race) the first map.
    this.load(startMap, sx, sy);
    this.loadSchedule();

    var loop = function (ts) {
      if (!self.running) return;
      var dt = Math.min(0.05, (ts - (self.lastFrame || ts)) / 1000);
      self.lastFrame = ts;
      if (self.entered && !self.paused) { self.t += dt; self.update(dt, self.t); }
      self.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.refreshHud();
  };

  Game.prototype.pause = function (on) {
    this.paused = !!on;
    CCAU.setMuted(!!on || CCAU.isMuted());
    var pEl = document.getElementById("pause");
    if (pEl) pEl.classList.toggle("hidden", !on);
    var bd = document.getElementById("modal-backdrop");
    if (bd) bd.classList.toggle("hidden", !on);
    if (on) {
      this.exitLock();
      this.play("pop");
      try { this.movieEl.pause(); } catch (e) {}
    } else {
      if (this.entered && !this.isModalOpen()) {
        this.requestLock();
      }
    }
  };

  Game.prototype.enter = function () {
    this.entered = true;
    CCE.load().seenIntro = true; CCE.commit();
    document.getElementById("welcome").classList.add("hidden");
    var bd = document.getElementById("modal-backdrop");
    if (bd) bd.classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    if ("ontouchstart" in window) document.getElementById("joystick").classList.remove("hidden");
    this.player.emoteNow(1);
    this.play("pop");
    this.toast("Move cursor or WASD to explore \u2022 click things");
    this.requestLock();
  };

  window.Game = Game;
})();
