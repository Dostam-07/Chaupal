(function () {
  "use strict";

  var KEY = "cc-standalone-save-v1";
  var save = null;
  var dirtyTimer = null;

  function emptySave() {
    return {
      id: U.playerId(),
      shells: 0,
      collectedShells: [],   // shell map keys
      hats: [],              // owned hat ids
      glasses: [],           // owned glasses ids
      hat: null,             // equipped hat id
      glasses: null,         // equipped glasses id
      shorts: false,
      badges: {},            // badge key -> true
      sits: 0,               // seats used (chairs)
      chairIds: [],          // chair ids sat in (for badge)
      watered: 0,
      pampered: 0,
      marshmallows: 0,
      metalFound: false,
      goals: 0,
      slides: 0,
      cannonballs: 0,
      pets: 0,
      seenIntro: false,
      lastMap: "default", lastX: 3000, lastY: 1600,
    };
  }

  function load() {
    if (save) return save;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        save = JSON.parse(raw);
        if (typeof save.id !== "string") save.id = U.playerId();
        // migrate missing keys
        var base = emptySave();
        for (var k in base) if (save[k] === undefined) save[k] = base[k];
      }
    } catch (e) {}
    if (!save) save = emptySave();
    return save;
  }

  function commit() {
    if (dirtyTimer) return;
    dirtyTimer = setTimeout(function () {
      dirtyTimer = null;
      try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {}
    }, 80);
  }

  function addShells(n) { save.shells += n; commit(); }
  function spendShells(n) {
    if (save.shells < n) return false;
    save.shells -= n; commit(); return true;
  }

  function hasShell(mapKey) { return save.collectedShells.indexOf(mapKey) >= 0; }
  function collectShell(mapKey) {
    if (hasShell(mapKey)) return false;
    save.collectedShells.push(mapKey); commit(); return true;
  }

  function ownHat(h) { return save.hats.indexOf(h) >= 0; }
  function addHat(h) { if (!ownHat(h)) { save.hats.push(h); commit(); } }
  function equipHat(h) { save.hat = h; commit(); }
  function ownGlasses(g) { return save.glasses && save.glasses.indexOf(g) >= 0; }
  function addGlasses(g) { if (!ownGlasses(g)) { save.glasses.push(g); commit(); } }
  function equipGlasses(g) { save.glasses = g; commit(); }

  function ownItem(id) {
    if (id === "shorts") return save.shorts;
    if (id === "ccap") return ownHat("ccap");
    if (id === "sunglasses") return ownGlasses("sunglasses");
    return false;
  }
  function addItem(id) {
    if (id === "shorts") save.shorts = true;
    else if (id === "ccap") addHat("ccap");
    else if (id === "sunglasses") addGlasses("sunglasses");
    commit();
  }
  function equipped(id) {
    if (id === "shorts") return save.shorts === true;
    if (id === "ccap") return save.hat === "ccap";
    if (id === "sunglasses") return save.glasses === "sunglasses";
    return false;
  }

  function badgeUnlocked(key) { return !!save.badges[key]; }
  function unlockBadge(key) {
    if (badgeUnlocked(key)) return false;
    save.badges[key] = true; commit(); return true;
  }
  function badgeCount() { return Object.keys(save.badges).length; }

  // ---- display helpers ----
  function toastOnUnlock(game, key) {
    var b = CC.BADGES[key];
    if (!b) return;
    var el = document.getElementById("badge-unlock");
    document.getElementById("badge-unlock-name").textContent = b.name;
    document.getElementById("badge-unlock-desc").textContent = b.desc;
    var bd = document.getElementById("modal-backdrop");
    if (bd) bd.classList.remove("hidden");
    el.classList.remove("hidden");
    game.play("badge");
    if (window.CC_G && CC_G.closeModals) {
      clearTimeout(el._autoHide);
      el._autoHide = setTimeout(function () {
        el.classList.add("hidden");
        if (bd && (!window.CC_G || !CC_G.paused)) bd.classList.add("hidden");
      }, 4000);
    }
  }

  window.CCE = {
    load: load, commit: commit,
    addShells: addShells, spendShells: spendShells,
    hasShell: hasShell, collectShell: collectShell,
    ownHat: ownHat, addHat: addHat, equipHat: equipHat,
    ownGlasses: ownGlasses, addGlasses: addGlasses, equipGlasses: equipGlasses,
    ownItem: ownItem, addItem: addItem, equipped: equipped,
    badgeUnlocked: badgeUnlocked, unlockBadge: unlockBadge, badgeCount: badgeCount,
    toastOnUnlock: toastOnUnlock,
  };

  // init now so U.playerId works
  load();
})();