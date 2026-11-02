(function () {
  "use strict";

  function boot() {
    var game = new Game();
    window.CC_G = game;

    function syncAudioUI() {
      var isMuted = CCAU.isMuted();
      var ico = isMuted ? "🔇" : "🔊";
      var aBtn = document.getElementById("audio-icon");
      if (aBtn) aBtn.textContent = ico;
      
      var wIco = document.getElementById("welcome-sound-icon");
      if (wIco) wIco.textContent = ico;
      var wText = document.getElementById("welcome-sound-text");
      if (wText) wText.textContent = isMuted ? "Sound Muted (Click to unmute)" : "Sound On (Press M to mute)";
      
      var pBtn = document.getElementById("pause-sound-btn");
      if (pBtn) pBtn.textContent = isMuted ? "Unmute Sound (M)" : "Mute Sound (M)";
    }

    function toggleAudio() {
      game.muteToggle();
      syncAudioUI();
    }

    // Enter camp from welcome pop-up
    var enterBtn = document.getElementById("enter");
    if (enterBtn) {
      enterBtn.addEventListener("click", function () {
        game.play("pop");
        game.enter();
      });
    }

    // Modal navigation
    var resumeBtn = document.getElementById("resume");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", function () {
        game.pause(false);
        game.requestLock();
      });
    }

    var worldCanvas = document.getElementById("world");
    if (worldCanvas) {
      worldCanvas.addEventListener("click", function () {
        if (game.entered && !game.paused && !game.isModalOpen() && !document.pointerLockElement) {
          game.requestLock();
        }
      });
    }

    var pauseBtn = document.getElementById("pause-btn");
    if (pauseBtn) pauseBtn.addEventListener("click", function () { game.pause(true); });

    var pauseCloseBtn = document.getElementById("pause-close");
    if (pauseCloseBtn) pauseCloseBtn.addEventListener("click", function () { game.pause(false); });

    var shopBtn = document.getElementById("shop-btn");
    if (shopBtn) shopBtn.addEventListener("click", function () { game.openShop(); });

    var badgesBtn = document.getElementById("badges-btn");
    if (badgesBtn) badgesBtn.addEventListener("click", function () { game.openBadges(); });

    var guideBtn = document.getElementById("guide-btn");
    if (guideBtn) guideBtn.addEventListener("click", function () { game.openGuide(); });

    var pauseGuideBtn = document.getElementById("pause-guide-btn");
    if (pauseGuideBtn) pauseGuideBtn.addEventListener("click", function () {
      game.pause(false);
      game.openGuide();
    });

    var pauseResetBtn = document.getElementById("pause-reset-btn");
    if (pauseResetBtn) pauseResetBtn.addEventListener("click", function () {
      if (window.confirm("Are you sure you want to reset all shells, badges, and camp progress?")) {
        window.ccReset();
      }
    });

    // Close buttons
    ["shop-close", "shop-x", "badges-close", "badges-x", "shells-close", "shells-x", "badge-unlock-close", "badge-unlock-x", "guide-close", "guide-close-x"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", function () {
        game.play("pop");
        game.closeModals();
      });
    });

    // Modal backdrop click closes active modal (only when inside camp)
    var backdrop = document.getElementById("modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        if (!game.entered) return; // Keep welcome modal open until Enter is pressed
        if (game.paused) game.pause(false);
        else game.closeModals();
      });
    }

    // Sound buttons
    ["audio-btn", "welcome-sound-btn", "pause-sound-btn"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", toggleAudio);
    });

    // Emote Dock Buttons
    var emoteBtns = document.querySelectorAll(".emote-btn");
    for (var i = 0; i < emoteBtns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var emoteId = +btn.getAttribute("data-emote");
          if (emoteId) game.emote(emoteId);
        });
      })(emoteBtns[i]);
    }

    // Brand link clicks to toast
    var brandBtn = document.getElementById("brand-btn");
    if (brandBtn) {
      brandBtn.addEventListener("click", function (e) {
        e.preventDefault();
        game.toast("Welcome to Explore Chaupal Camp!");
      });
    }

    // Pause on tab blur
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && game.entered) game.pause(true);
    });

    game.start();
    syncAudioUI();

    // Dev helpers
    window.ccGoto = function (m, x, y) { game.goTo(m, x, y); };
    window.ccShells = function (n) { CCE.addShells(n || 5); game.refreshHud(); };
    window.ccBadge = function (k) { game.giveBadge(k); };
    window.ccReset = function () { localStorage.removeItem("cc-standalone-save-v1"); location.reload(); };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
