(function () {
  "use strict";

  var ASSETS = { base: "assets/" };
  var LIVE = {
    // Movies are served locally from /movies/ by serve.js (see README).
    moviesBase: "/movies/",
    scheduleApi: "data/schedule.json",
    // Set PREMIERE TEST: e.g. ?premiere=test to force the countdown flow.
    premiereForce: null,
  };

  var MAP_DEFAULTS = {
    default: { width: 6750, height: 3797, start: { x: 3000, y: 1600 }, hasWater: true, hasTop: true, tiles: true },
    sauna: { width: 1718, height: 966, start: { x: 500, y: 600 } },
    tent: { width: 1639, height: 922, start: { x: 500, y: 600 } },
    cave: { width: 3378, height: 950, start: { x: 500, y: 600 } },
    treehouse: { width: 1718, height: 966, start: { x: 500, y: 600 } },
    "house-main": { width: 1718, height: 966, start: { x: 500, y: 600 } },
    "house-cafeteria": { width: 1718, height: 966, start: { x: 500, y: 600 } },
    "house-bedroom": { width: 1718.4, height: 966.4, start: { x: 500, y: 600 } },
    "house-trophey": { width: 1718.4, height: 966.4, start: { x: 500, y: 600 } },
    boat: { width: 1664, height: 934, start: { x: 500, y: 600 } },
    telescope: { width: 1718, height: 966, start: { x: 860, y: 480 } },
    school: { width: 1718, height: 966, start: { x: 860, y: 700 } },
  };

  var GAME_CONFIG = {
    maxDelta: 45,        // max px per tick on land
    maxDeltaWater: 22,
    maxDeltaOcean: 13,
    waterPush: 0.35,     // river flow factor
    _lapCheckpoints: null,
    lapCheckpoints: [
      { x: 3260, y: 995, w: 110, h: 110 },
      { x: 3478, y: 840, w: 100, h: 100 },
      { x: 2899, y: 910, w: 120, h: 120 },
      { x: 2420, y: 602, w: 160, h: 160 },
      { x: 3100, y: 650, w: 130, h: 130 },
    ],
  };

  var SHOP_ITEMS = [
    { id: "ccap", name: "Camp Cap", slot: "hat", value: "ccap", image: "assets/shop/ccap.png", price: 5 },
    { id: "shorts", name: "Shorts", slot: "shorts", value: "shorts", image: "assets/shop/shorts.png", price: 5 },
    { id: "sunglasses", name: "Sunglasses", slot: "glasses", value: "sunglasses", image: "assets/shop/sunglasses.png", price: 5 },
  ];

  var BADGES = {
    cannonball: { name: "Cannonball!", desc: "Do a cannonball into the pool", image: "assets/badges/cannonball.png" },
    metalDetector: { name: "Treasure Hunter", desc: "Find something with the metal detector", image: "assets/badges/metal-detector.png" },
    goal: { name: "Goal!", desc: "Score a soccer goal", image: "assets/badges/soccer.png" },
    marshmallow: { name: "S'more Please", desc: "Roast and eat a marshmallow", image: "assets/badges/campfire.png" },
    cat: { name: "Cat Person", desc: "Pet the cat", image: "assets/badges/cat.png" },
    chairs: { name: "Take a Seat", desc: "Sit in 2 different chairs", image: "assets/badges/chair.png" },
    waterslide: { name: "Slide!", desc: "Go down the waterslide", image: "assets/badges/slide.png" },
    seashells: { name: "Beachcomber", desc: "Collect all the seashells", image: "assets/badges/seashells.png" },
    gardener: { name: "Green Thumb", desc: "Water at least 4 plants", image: "assets/badges/plant.png" },
  };

  var SEASHELL_TOTAL = 17;

  // flip lap checkpoint Y from bottom-up to top-down
  var CC_flipCheckpoints = function () {
    if (GAME_CONFIG._lapCheckpoints) return GAME_CONFIG._lapCheckpoints;
    GAME_CONFIG._lapCheckpoints = GAME_CONFIG.lapCheckpoints.map(function (p) {
      return { x: p.x, y: U.flipYVal(p.y, 3797), w: p.w, h: p.h };
    });
    return GAME_CONFIG._lapCheckpoints;
  };

  window.CC = {
    ASSETS: ASSETS,
    LIVE: LIVE,
    MAP_DEFAULTS: MAP_DEFAULTS,
    GAME_CONFIG: GAME_CONFIG,
    flipCheckpoints: CC_flipCheckpoints,
    SHOP_ITEMS: SHOP_ITEMS,
    BADGES: BADGES,
    SEASHELL_TOTAL: SEASHELL_TOTAL,
    HAT_FILES: { "3d-glasses": "sunglasses" },
  HAT_DEFS: {
      cap: { size: 24, x: 0, y: -3 }, towel: { size: 20, x: 6, y: -1 }, party: { size: 25, x: 10, y: -2 },
      beret: { size: 30, x: -2, y: -20 }, chef: { size: 20, x: -1, y: -8 }, ccap: { size: 19, x: 8, y: -5 },
      shorts: { size: 19, x: 13, y: 22 }, sunglasses: { size: 24, x: 4, y: 8 }, "3d-glasses": { size: 24, x: 3, y: 8 },
      snorkel: { size: 24, x: 5, y: -2 }, normal: { size: 25, x: 0, y: -3 }, newspaper: { size: 28, x: -2, y: -3 },
      sailor: { size: 26, x: 1, y: -3 }, miner: { size: 23, x: 2, y: -1 }, "party-1": { size: 14, x: 6, y: -8 },
      "party-2": { size: 14, x: 6, y: -10 }, "party-3": { size: 14, x: 6, y: -10 }, wavy: { size: 25, x: 0, y: -3 },
      explorer: { size: 25, x: 0, y: -2 },
    },
    HAT_SLOTS: ["normal", "cap", "towel", "chef", "ccap", "newspaper", "sailor", "miner", "wavy", "explorer", "party-1", "party-2", "party-3"],
    GLASS_SLOTS: ["3d-glasses", "snorkel", "sunglasses"],
  };

  var q = new URLSearchParams(location.search);
  if (q.get("premiere")) LIVE.premiereForce = q.get("premiere");
})();