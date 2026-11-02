(function () {
  "use strict";

  // =========================================================================
  // Procedural visual simulation engine for Explore Chaupal
  // Includes:
  // - Radiant Campfire: stone hearth, crossed logs, radial heat aura, 3-tier
  //   dancing flame tongues, swirling glowing embers, rising smoke wisps
  // - Steam Clouds: billowing expanding steam for sauna coals & cauldron
  // - Water Shimmer & Fountain
  // - Acoustic Soundwaves: concentric pulse rings for gong & drums
  // =========================================================================

  var activeSteamClouds = [];
  var activeSoundWaves = [];

  function spawn(kind, def) {
    var w = def.width || 200;
    var h = def.height || 160;
    var x = def.x, y = def.y;
    var obj = { kind: kind, def: def, pass: "entity" };

    if (kind === "campfire") {
      obj.baseY = y;
      obj.boostUntil = 0; // boosted when fed firewood

      // 45 swirling embers
      var embers = [];
      for (var e = 0; e < 45; e++) {
        embers.push({
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 25,
          vy: -40 - Math.random() * 80,
          size: 2 + Math.random() * 3.5,
          life: Math.random(),
          dur: 1.0 + Math.random() * 1.5,
          seed: Math.random() * 10,
        });
      }

      // 12 rising smoke wisps
      var smoke = [];
      for (var s = 0; s < 14; s++) {
        smoke.push({
          x: (Math.random() - 0.5) * 30,
          y: -20 - Math.random() * 30,
          vx: (Math.random() - 0.5) * 15,
          vy: -25 - Math.random() * 35,
          size: 14 + Math.random() * 16,
          life: Math.random(),
          dur: 2.0 + Math.random() * 2.0,
        });
      }

      obj.poke = function () {
        // Kick up extra sparks on click
        for (var k = 0; k < 25; k++) {
          embers.push({
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 90,
            vy: -80 - Math.random() * 120,
            size: 2.5 + Math.random() * 4,
            life: 0,
            dur: 1.2 + Math.random() * 1.6,
            seed: Math.random() * 10,
          });
        }
      };

      obj.feed = function () {
        obj.boostUntil = U.now() + 14000;
        obj.poke();
      };

      obj.hit = function (px, py) {
        return Math.hypot(px - x, py - y) < 85;
      };

      obj.update = function (dt, t) {
        var boosted = U.now() < obj.boostUntil;
        var boostFactor = boosted ? 1.45 : 1.0;

        // Update embers
        for (var i = 0; i < embers.length; i++) {
          var em = embers[i];
          em.life += dt / em.dur;
          if (em.life >= 1.0) {
            em.life = 0;
            em.x = (Math.random() - 0.5) * 44;
            em.y = (Math.random() - 0.5) * 18;
            em.vx = (Math.random() - 0.5) * 30;
            em.vy = (-45 - Math.random() * 85) * boostFactor;
            em.dur = 1.0 + Math.random() * 1.4;
          }
          em.x += (em.vx + Math.sin(t * 4 + em.seed) * 22) * dt;
          em.y += em.vy * dt;
        }

        // Update smoke wisps
        for (var j = 0; j < smoke.length; j++) {
          var sm = smoke[j];
          sm.life += dt / sm.dur;
          if (sm.life >= 1.0) {
            sm.life = 0;
            sm.x = (Math.random() - 0.5) * 26;
            sm.y = -15 - Math.random() * 20;
            sm.vx = (Math.random() - 0.5) * 15;
            sm.vy = -30 - Math.random() * 35;
          }
          sm.x += (sm.vx + Math.sin(t * 2 + j) * 18) * dt;
          sm.y += sm.vy * dt;
        }

        // Limit extra embers
        if (embers.length > 70) embers.splice(0, embers.length - 70);
      };

      obj.render = function (ctx, cam) {
        var cx = x - cam.x;
        var cy = y - cam.y;
        var t = U.now() / 1000;
        var boosted = U.now() < obj.boostUntil;
        var scale = boosted ? 1.4 : 1.0;

        ctx.save();

        // 1. Warm radial heat aura (illuminates ground & stones)
        var auraPulse = 0.85 + 0.15 * Math.sin(t * 8);
        var auraRadius = (120 + 20 * Math.sin(t * 5)) * scale;
        var auraG = ctx.createRadialGradient(cx, cy, 10, cx, cy, auraRadius);
        auraG.addColorStop(0, "rgba(255, 170, 40, " + (0.55 * auraPulse) + ")");
        auraG.addColorStop(0.4, "rgba(230, 90, 20, " + (0.35 * auraPulse) + ")");
        auraG.addColorStop(0.75, "rgba(180, 40, 10, " + (0.15 * auraPulse) + ")");
        auraG.addColorStop(1, "rgba(100, 20, 0, 0)");
        ctx.fillStyle = auraG;
        ctx.beginPath();
        ctx.arc(cx, cy, auraRadius, 0, 6.2832);
        ctx.fill();

        // 2. Burnt ash & charcoal base bed
        ctx.fillStyle = "#1e1713";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 42 * scale, 22 * scale, 0, 0, 6.2832);
        ctx.fill();

        // Inner glowing charcoal bed
        var coalG = ctx.createRadialGradient(cx, cy + 4, 2, cx, cy + 4, 30 * scale);
        coalG.addColorStop(0, "rgba(255, 110, 20, 0.95)");
        coalG.addColorStop(0.5, "rgba(200, 40, 10, 0.7)");
        coalG.addColorStop(1, "rgba(40, 20, 10, 0)");
        ctx.fillStyle = coalG;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 30 * scale, 15 * scale, 0, 0, 6.2832);
        ctx.fill();

        // 3. Ring of hearth river stones
        var numStones = 12;
        ctx.fillStyle = "#635952";
        ctx.strokeStyle = "#433b35";
        ctx.lineWidth = 1.5;
        for (var st = 0; st < numStones; st++) {
          var stAngle = (st / numStones) * 6.2832;
          var stX = cx + Math.cos(stAngle) * 44 * scale;
          var stY = cy + Math.sin(stAngle) * 23 * scale + 5;
          ctx.beginPath();
          ctx.ellipse(stX, stY, 9 * scale, 6.5 * scale, stAngle * 0.4, 0, 6.2832);
          ctx.fill();
          ctx.stroke();
        }

        // 4. Crossed firewood logs in hearth
        var logColors = ["#4a3321", "#3b2615", "#5c3d24"];
        var logs = [
          { x1: -28, y1: -4, x2: 28, y2: 12, w: 9 },
          { x1: 28, y1: -6, x2: -26, y2: 14, w: 8.5 },
          { x1: -22, y1: 10, x2: 24, y2: -2, w: 7.5 },
        ];
        for (var lg = 0; lg < logs.length; lg++) {
          var l = logs[lg];
          ctx.strokeStyle = logColors[lg];
          ctx.lineWidth = l.w * scale;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx + l.x1 * scale, cy + l.y1 * scale);
          ctx.lineTo(cx + l.x2 * scale, cy + l.y2 * scale);
          ctx.stroke();
        }

        // 5. Translucent smoke wisps (billowing above fire)
        for (var sIdx = 0; sIdx < smoke.length; sIdx++) {
          var smk = smoke[sIdx];
          var smkProgress = smk.life;
          var smkAlpha = (1 - smkProgress) * 0.18;
          var smkRadius = (smk.size + smkProgress * 26) * scale;
          ctx.fillStyle = "rgba(220, 215, 210, " + smkAlpha + ")";
          ctx.beginPath();
          ctx.arc(cx + smk.x * scale, cy + smk.y * scale, smkRadius, 0, 6.2832);
          ctx.fill();
        }

        // 6. Multi-tier dynamic dancing flame tongues
        // Tier A: Outer crimson / fiery red tongues
        var numOuterFlames = 8;
        for (var fa = 0; fa < numOuterFlames; fa++) {
          var faPhase = t * 6 + fa * 1.2;
          var faHeight = (55 + 24 * Math.sin(faPhase) + 12 * Math.cos(t * 11 + fa)) * scale;
          var faX = cx + ((fa - (numOuterFlames - 1) / 2) * 8 + Math.sin(faPhase * 1.5) * 5) * scale;
          var faWidth = (14 + 5 * Math.sin(faPhase)) * scale;

          var fGrad = ctx.createLinearGradient(faX, cy, faX, cy - faHeight);
          fGrad.addColorStop(0, "rgba(255, 60, 10, 0.9)");
          fGrad.addColorStop(0.5, "rgba(255, 120, 20, 0.85)");
          fGrad.addColorStop(1, "rgba(255, 180, 40, 0)");

          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.moveTo(faX - faWidth / 2, cy + 4);
          ctx.quadraticCurveTo(faX - faWidth * 0.7, cy - faHeight * 0.5, faX, cy - faHeight);
          ctx.quadraticCurveTo(faX + faWidth * 0.7, cy - faHeight * 0.5, faX + faWidth / 2, cy + 4);
          ctx.closePath();
          ctx.fill();
        }

        // Tier B: Mid vibrant amber / gold flame tongues
        var numMidFlames = 7;
        for (var fb = 0; fb < numMidFlames; fb++) {
          var fbPhase = t * 8 + fb * 1.4;
          var fbHeight = (42 + 20 * Math.sin(fbPhase) + 10 * Math.cos(t * 13 + fb)) * scale;
          var fbX = cx + ((fb - (numMidFlames - 1) / 2) * 6.5 + Math.cos(fbPhase * 1.3) * 4) * scale;
          var fbWidth = (12 + 4 * Math.sin(fbPhase)) * scale;

          var midGrad = ctx.createLinearGradient(fbX, cy, fbX, cy - fbHeight);
          midGrad.addColorStop(0, "rgba(255, 180, 20, 0.95)");
          midGrad.addColorStop(0.6, "rgba(255, 220, 60, 0.9)");
          midGrad.addColorStop(1, "rgba(255, 250, 150, 0)");

          ctx.fillStyle = midGrad;
          ctx.beginPath();
          ctx.moveTo(fbX - fbWidth / 2, cy + 2);
          ctx.quadraticCurveTo(fbX - fbWidth * 0.6, cy - fbHeight * 0.55, fbX, cy - fbHeight);
          ctx.quadraticCurveTo(fbX + fbWidth * 0.6, cy - fbHeight * 0.55, fbX + fbWidth / 2, cy + 2);
          ctx.closePath();
          ctx.fill();
        }

        // Tier C: White-hot radiant inner core
        var numCoreFlames = 5;
        for (var fc = 0; fc < numCoreFlames; fc++) {
          var fcPhase = t * 12 + fc * 1.7;
          var fcHeight = (26 + 14 * Math.sin(fcPhase)) * scale;
          var fcX = cx + ((fc - (numCoreFlames - 1) / 2) * 4.5 + Math.sin(fcPhase) * 2) * scale;
          var fcWidth = (8 + 3 * Math.sin(fcPhase)) * scale;

          var coreGrad = ctx.createLinearGradient(fcX, cy, fcX, cy - fcHeight);
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.7, "#fff59d");
          coreGrad.addColorStop(1, "rgba(255, 245, 157, 0)");

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.moveTo(fcX - fcWidth / 2, cy);
          ctx.quadraticCurveTo(fcX - fcWidth * 0.5, cy - fcHeight * 0.5, fcX, cy - fcHeight);
          ctx.quadraticCurveTo(fcX + fcWidth * 0.5, cy - fcHeight * 0.5, fcX + fcWidth / 2, cy);
          ctx.closePath();
          ctx.fill();
        }

        // 7. Swirling glowing embers (incandescent sparks)
        for (var emIdx = 0; emIdx < embers.length; emIdx++) {
          var emb = embers[emIdx];
          var progress = emb.life;
          var alpha = (1 - progress) * (0.8 + 0.2 * Math.sin(progress * 15 + emb.seed));
          var embSize = emb.size * (1 - progress * 0.5) * scale;

          // Color transition: white/yellow -> amber -> dark cherry red
          var emColor = progress < 0.35 ? "#ffffff" : progress < 0.7 ? "#ffd166" : "#ff4757";
          ctx.fillStyle = emColor;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.beginPath();
          ctx.arc(cx + emb.x * scale, cy + emb.y * scale, Math.max(1, embSize), 0, 6.2832);
          ctx.fill();
        }

        ctx.restore();
      };
    } else if (kind === "fountain") {
      var fparts = [];
      for (var fj = 0; fj < 40; fj++) fparts.push({
        a: Math.random() * 6.2832, r: Math.random() * 40, t: Math.random(), dur: 0.9 + Math.random() * 1.2,
        vy: -60 - Math.random() * 60, size: 2 + Math.random() * 3,
      });
      obj.update = function (dt) {
        for (var i = 0; i < fparts.length; i++) {
          var p = fparts[i], k = p.t / p.dur, f = k * k;
          p.PX = x + Math.cos(p.a + p.t * 2) * p.r * 2.4;
          p.PY = y - 8 - f * 90;
          p.A = (1 - k) * 0.85;
          p.t += dt;
          if (p.t >= p.dur) { p.t = 0; p.a = Math.random() * 6.2832; }
        }
      };
      obj.render = function (ctx, cam) {
        var ox = -cam.x, oy = -cam.y;
        ctx.save();
        ctx.fillStyle = "#9bd4f7";
        for (var i = 0; i < fparts.length; i++) {
          var p = fparts[i];
          ctx.globalAlpha = Math.max(0, p.A);
          ctx.beginPath(); ctx.arc(ox + p.PX, oy + p.PY, p.size, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      };
    } else if (kind === "hottub") {
      var hparts = [];
      for (var hk = 0; hk < 18; hk++) hparts.push({ t: Math.random(), dur: 1.6 + Math.random() * 1.2, x: (Math.random() - 0.5) * 90, size: 2 + Math.random() * 4 });
      obj.update = function (dt) {
        for (var i = 0; i < hparts.length; i++) {
          var p = hparts[i], f = Math.min(1, p.t / p.dur);
          p.PX = x + p.x + Math.sin(p.t * 3 + i) * 8;
          p.PY = y - f * 70;
          p.A = (1 - f) * (0.5 + 0.3 * Math.sin(p.t * 9 + i));
          p.t += dt;
          if (p.t >= p.dur) { p.t = 0; p.x = (Math.random() - 0.5) * 90; }
        }
      };
      obj.render = function (ctx, cam) {
        var ox = -cam.x, oy = -cam.y;
        ctx.save();
        ctx.fillStyle = "#ffffff";
        for (var i = 0; i < hparts.length; i++) {
          var p = hparts[i];
          ctx.globalAlpha = Math.max(0, p.A);
          ctx.beginPath(); ctx.arc(ox + p.PX, oy + p.PY, p.size, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      };
    } else if (kind === "sun") {
      obj.update = function (dt, t) { obj.P = 0.8 + 0.2 * Math.sin(t * 1.6); };
      obj.render = function (ctx, cam) {
        var g = ctx.createRadialGradient(x - cam.x, y - cam.y, 4, x - cam.x, y - cam.y, w / 2);
        g.addColorStop(0, "rgba(255,236,140," + (0.85 * obj.P) + ")");
        g.addColorStop(1, "rgba(255,236,140,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x - cam.x, y - cam.y, w / 2, 0, 6.2832); ctx.fill();
      };
    } else {
      // water shimmer
      var n = Math.max(6, Math.round(w / 26));
      var wparts = [];
      for (var m = 0; m < n; m++) wparts.push({ ox: (m / n) * w - w / 2 + (Math.random() - 0.5) * 20, ph: Math.random() * 6.2832, sp: 2 + Math.random() * 2.5, amp: 4 + Math.random() * 6 });
      obj.update = function (dt, t) {
        for (var i = 0; i < wparts.length; i++) {
          var p = wparts[i];
          p.PX = x + p.ox;
          p.PY = y + Math.sin(t * p.sp + p.ph) * p.amp;
        }
      };
      obj.render = function (ctx, cam) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.5)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        for (var i = 0; i < wparts.length; i++) {
          var p = wparts[i];
          ctx.globalAlpha = 0.25 + 0.3 * Math.abs(Math.sin(p.PY / 14));
          ctx.beginPath();
          ctx.moveTo(p.PX - cam.x - 14, p.PY - cam.y);
          ctx.lineTo(p.PX - cam.x + 14, p.PY - cam.y);
          ctx.stroke();
        }
        ctx.restore();
      };
    }

    obj.z = function () { return 0; };
    return obj;
  }

  // --- Dynamic global FX (Steam clouds & Acoustic soundwaves) ---

  function createSteamCloud(x, y, isSpicy) {
    var puffs = [];
    var count = isSpicy ? 45 : 35;
    for (var i = 0; i < count; i++) {
      puffs.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * (isSpicy ? 90 : 50),
        vy: -50 - Math.random() * (isSpicy ? 120 : 80),
        r: 12 + Math.random() * 16,
        maxR: 45 + Math.random() * 35,
        life: 0,
        dur: 1.5 + Math.random() * 1.5,
        spicy: isSpicy,
      });
    }
    activeSteamClouds.push({ puffs: puffs });
  }

  function createSoundWave(x, y, color) {
    activeSoundWaves.push({
      x: x, y: y,
      r: 10,
      maxR: 180,
      color: color || "#ffd166",
      life: 0,
      dur: 1.2,
    });
  }

  function updateGlobalFX(dt) {
    // Update steam clouds
    for (var c = activeSteamClouds.length - 1; c >= 0; c--) {
      var cloud = activeSteamClouds[c];
      var allDone = true;
      for (var p = 0; p < cloud.puffs.length; p++) {
        var puff = cloud.puffs[p];
        puff.life += dt / puff.dur;
        if (puff.life < 1.0) {
          allDone = false;
          puff.x += puff.vx * dt;
          puff.y += puff.vy * dt;
          puff.vy *= Math.max(0, 1 - 0.4 * dt);
        }
      }
      if (allDone) activeSteamClouds.splice(c, 1);
    }

    // Update sound waves
    for (var w = activeSoundWaves.length - 1; w >= 0; w--) {
      var wave = activeSoundWaves[w];
      wave.life += dt / wave.dur;
      wave.r += (wave.maxR - wave.r) * 5 * dt;
      if (wave.life >= 1.0) activeSoundWaves.splice(w, 1);
    }
  }

  function renderGlobalFX(ctx, cam) {
    // Render steam clouds
    for (var c = 0; c < activeSteamClouds.length; c++) {
      var cloud = activeSteamClouds[c];
      for (var p = 0; p < cloud.puffs.length; p++) {
        var puff = cloud.puffs[p];
        if (puff.life >= 1.0) continue;
        var k = puff.life;
        var curR = puff.r + (puff.maxR - puff.r) * k;
        var alpha = (1 - k) * (puff.spicy ? 0.65 : 0.45);
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = puff.spicy ? (k < 0.4 ? "#ff4757" : "#ff7f50") : "#ffffff";
        ctx.beginPath();
        ctx.arc(puff.x - cam.x, puff.y - cam.y, curR, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
    }

    // Render soundwaves
    for (var w = 0; w < activeSoundWaves.length; w++) {
      var wave = activeSoundWaves[w];
      if (wave.life >= 1.0) continue;
      var alpha2 = (1 - wave.life) * 0.7;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha2);
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 3.5 * (1 - wave.life) + 1;
      ctx.beginPath();
      ctx.arc(wave.x - cam.x, wave.y - cam.y, wave.r, 0, 6.2832);
      ctx.stroke();
      ctx.restore();
    }
  }

  window.PFX = {
    spawn: spawn,
    createSteamCloud: createSteamCloud,
    createSoundWave: createSoundWave,
    updateGlobalFX: updateGlobalFX,
    renderGlobalFX: renderGlobalFX,
  };
})();
