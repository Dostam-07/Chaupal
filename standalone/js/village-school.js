/* Village Chaupal — Part 3: The Village Pathshala (School & Classrooms)
   Features:
   - Full Bustling Classroom: 2 Teachers (Head Teacher Meena Didi & Senior Guru Masterji Ramchandra)
     and 14 unique interactive students seated at wooden dual-desks.
   - Interactive School Dialog Modal: Rich dialogue cards, speaker portraits, questions, and encouragement.
   - Interactive Classroom Quiz: Multiple-choice science/math/nature trivia with instant rewards & badges.
   - Interactive Classroom Objects:
     * Spinning Terrestrial Globe (click to spin & learn geography facts)
     * Science Microscope Station (click to inspect plant cells & chloroplasts)
     * Library Bookshelf (click to read stories & historical chronicles)
     * Earthen Water Matka (click to drink cool refreshing pot water)
     * School Bell (rings dynamically, students cheer & raise hands)
     * Classroom Blackboard (cycle chalk lessons or launch quiz)
   - Dynamic Student Animations: Hand-raising, floating reaction emotes (💡, ⭐, 📚, 🎨, ☀️),
     and joyful cheers during bell ring / correct quiz answers.
   - Outdoor Schoolyard (Meadow Pathshala) on default map with 10 students, teachers, dhurries,
     outdoor blackboard, bell, hopscotch court, and direct door transition into indoor classroom!
*/
(function () {
  "use strict";

  var U = window.U || {};
  var V = window.CC_V || {};
  var TAU = 6.2831853;
  function now() { return U.now ? U.now() : performance.now(); }

  function shade(col, amt) {
    if (V.shade) return V.shade(col, amt);
    var num = parseInt((col.charAt(0) === "#" ? col.slice(1) : col), 16);
    if (isNaN(num)) return col;
    var r = Math.min(255, Math.max(0, (num >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    var b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function lgrad(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  }
  function rgrad(ctx, x, y, r0, r1, stops) {
    var g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); ctx.fill(); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }
  function rrS(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* =========================================================================
     SPRITE GENERATORS
     ========================================================================= */

  // 1. Standing Female Teacher Sprite (Meena Didi: Yellow saree, green dupatta, gajra)
  function buildTeacherSprite(t) {
    var S = 3, c = document.createElement("canvas");
    c.width = 140; c.height = 340;
    var g = c.getContext("2d");
    g.scale(S, S); g.translate(23, 112);
    var skin = t.skin || "#b5724a", dark = "#241a12", ln = "#3a2c22";
    var sar = t.sari || "#e59b20", blu = t.blouse || "#2d733e", dup = t.dupatta || "#388e3c";

    // Sari skirt
    g.fillStyle = lgrad(g, -19, -56, 6, -4, [0, sar, 0.55, sar, 1, shade(sar, -28)]);
    g.beginPath();
    g.moveTo(-12, -54); g.quadraticCurveTo(-19, -34, -17, -12);
    g.quadraticCurveTo(-16, -4, 0, -4); g.quadraticCurveTo(16, -4, 17, -12);
    g.quadraticCurveTo(19, -34, 12, -54); g.quadraticCurveTo(0, -58, -12, -54);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();
    // Hem border
    g.fillStyle = lgrad(g, -16, -6, 16, -2, [0, dup, 1, shade(dup, -22)]);
    rr(g, -16.5, -5.5, 33, 4.5, 2);
    // Feet
    g.fillStyle = skin;
    g.beginPath(); g.ellipse(-5, -2, 3.2, 1.8, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(5, -2, 3.2, 1.8, 0, 0, TAU); g.fill();

    // Sari pleats
    g.strokeStyle = "rgba(0,0,0,0.16)"; g.lineWidth = 1.1;
    for (var f = 0; f < 3; f++) {
      var fx = -8 + f * 8;
      g.beginPath(); g.moveTo(fx, -50); g.quadraticCurveTo(fx + 3, -28, fx + 2, -8); g.stroke();
    }

    // Blouse torso
    g.fillStyle = lgrad(g, -13, -86, 4, -56, [0, shade(blu, 14), 0.5, blu, 1, shade(blu, -20)]);
    g.beginPath();
    g.moveTo(-9, -86); g.quadraticCurveTo(-14, -70, -12, -57);
    g.lineTo(12, -57); g.quadraticCurveTo(14, -70, 9, -86);
    g.quadraticCurveTo(0, -90, -9, -86); g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Dupatta pallu across shoulder
    g.fillStyle = lgrad(g, -15, -86, 8, -56, [0, shade(dup, 12), 1, shade(dup, -18)]);
    g.beginPath();
    g.moveTo(-12, -85); g.quadraticCurveTo(-16, -72, -11, -62);
    g.lineTo(0, -58); g.quadraticCurveTo(11, -55, 9, -52);
    g.lineTo(-7, -55); g.quadraticCurveTo(-16, -62, -13, -70);
    g.quadraticCurveTo(-12, -78, -8, -85); g.closePath(); g.fill();

    // Left arm down
    g.strokeStyle = skin; g.lineWidth = 4.4; g.lineCap = "round";
    g.beginPath(); g.moveTo(-9, -80); g.quadraticCurveTo(-14, -66, -10, -54); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(-9, -53, 3, 0, TAU); g.fill();

    // Right arm holding open textbook
    g.strokeStyle = skin; g.lineWidth = 4.4;
    g.beginPath(); g.moveTo(9, -78); g.quadraticCurveTo(14, -62, 12, -50); g.stroke();
    var bx = 4, by = -46;
    g.fillStyle = "#8d5325"; rr(g, bx - 9, by - 5, 18, 11, 2);
    g.fillStyle = "#fff8e7"; g.fillRect(bx - 6, by - 3.5, 5.5, 8); g.fillRect(bx + 0.5, by - 3.5, 5.5, 8);
    g.strokeStyle = "#5a3416"; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(bx, by - 5); g.lineTo(bx, by + 6); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(bx + 6, by + 4, 2.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(bx - 6, by + 4, 2.8, 0, TAU); g.fill();

    // Neck + Head
    g.fillStyle = skin; g.fillRect(-2.6, -93, 5.2, 7);
    g.fillStyle = rgrad(g, -3, -112, 2, 13, [0, shade(skin, 12), 0.35, skin, 0.75, shade(skin, -10), 1, shade(skin, -28)]);
    g.beginPath(); g.arc(0, -105, 10.6, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.5; g.stroke();

    // Earrings
    g.fillStyle = "#f1c40f";
    g.beginPath(); g.arc(-9.7, -98, 1.4, 0, TAU); g.fill();
    g.beginPath(); g.arc(9.7, -98, 1.4, 0, TAU); g.fill();

    // Hair + Gajra (white jasmine garland)
    g.fillStyle = dark;
    g.beginPath(); g.arc(0, -108, 10, Math.PI * 1.04, Math.PI * 1.96); g.fill();
    g.beginPath(); g.arc(-8.4, -111, 5, -Math.PI * 0.9, Math.PI * 0.4); g.fill();
    g.beginPath(); g.arc(7.4, -114, 5.2, 0, TAU); g.fill(); // Bun
    // White jasmine flowers
    g.fillStyle = "#ffffff";
    for (var j = 0; j < 5; j++) {
      var jx = 5 + Math.cos(j * 1.2) * 4.5, jy = -114 + Math.sin(j * 1.2) * 4.5;
      g.beginPath(); g.arc(jx, jy, 1.3, 0, TAU); g.fill();
    }

    // Eyes & Smile
    g.fillStyle = "#ffffff";
    g.beginPath(); g.ellipse(-3.2, -106.2, 1.7, 2.1, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(3.2, -106.2, 1.7, 2.1, 0, 0, TAU); g.fill();
    g.fillStyle = dark;
    g.beginPath(); g.arc(-3.4, -106.4, 1.1, 0, TAU); g.fill();
    g.beginPath(); g.arc(3, -106.4, 1.1, 0, TAU); g.fill();
    g.strokeStyle = dark; g.lineWidth = 1;
    g.beginPath(); g.arc(0, -103.8, 2.6, 0.15, Math.PI - 0.4); g.stroke();
    // Bindi
    g.fillStyle = "#c0392b"; g.beginPath(); g.arc(0, -107.6, 1.3, 0, TAU); g.fill();
    return c;
  }

  // 2. Standing Senior Guru Sprite (Masterji Ramchandra: Kurta, maroon waistcoat, spectacles, pointer)
  function buildMasterjiSprite(t) {
    var S = 3, c = document.createElement("canvas");
    c.width = 140; c.height = 340;
    var g = c.getContext("2d");
    g.scale(S, S); g.translate(23, 112);
    var skin = t.skin || "#aa683e", dark = "#3a342e", ln = "#3a2c22";
    var kurta = "#f5efe6", vest = "#78281f";

    // Kurta pyjama legs
    g.fillStyle = kurta;
    g.beginPath();
    g.moveTo(-11, -54); g.lineTo(-14, -8); g.lineTo(-6, -8); g.lineTo(-3, -54); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(3, -54); g.lineTo(6, -8); g.lineTo(14, -8); g.lineTo(11, -54); g.closePath(); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 1.2;
    g.stroke();

    // Traditional leather sandals (kolhapuri chappals)
    g.fillStyle = "#5c331a";
    g.beginPath(); g.ellipse(-10, -5, 4.5, 2.5, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(10, -5, 4.5, 2.5, 0, 0, TAU); g.fill();

    // Long white kurta tunic
    g.fillStyle = lgrad(g, -12, -75, 4, -42, [0, kurta, 1, shade(kurta, -12)]);
    g.beginPath();
    g.moveTo(-11, -75); g.lineTo(-13, -38); g.lineTo(13, -38); g.lineTo(11, -75);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.4; g.stroke();

    // Maroon Nehru waistcoat / jacket
    g.fillStyle = lgrad(g, -11, -85, 4, -48, [0, vest, 0.7, vest, 1, shade(vest, -18)]);
    g.beginPath();
    g.moveTo(-10, -85); g.quadraticCurveTo(-14, -68, -12, -48);
    g.lineTo(12, -48); g.quadraticCurveTo(14, -68, 10, -85);
    g.quadraticCurveTo(0, -88, -10, -85); g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Mandarin collar
    g.fillStyle = shade(vest, 14);
    rr(g, -6, -88, 12, 4, 1.5);
    // Brass buttons
    g.fillStyle = "#f1c40f";
    for (var b = 0; b < 4; b++) {
      g.beginPath(); g.arc(0, -80 + b * 9, 1.2, 0, TAU); g.fill();
    }

    // Left arm down
    g.strokeStyle = skin; g.lineWidth = 4.2; g.lineCap = "round";
    g.beginPath(); g.moveTo(-10, -80); g.lineTo(-14, -54); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(-14, -53, 2.8, 0, TAU); g.fill();

    // Right arm holding wooden teaching pointer
    g.strokeStyle = skin; g.lineWidth = 4.2;
    g.beginPath(); g.moveTo(10, -80); g.lineTo(14, -58); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(14, -58, 2.8, 0, TAU); g.fill();
    // Wooden Pointer Stick (angled upwards toward the blackboard)
    g.strokeStyle = "#8d5325"; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(14, -58); g.lineTo(28, -98); g.stroke();
    g.fillStyle = "#d4af37"; g.beginPath(); g.arc(28, -98, 1.8, 0, TAU); g.fill();

    // Neck + Head
    g.fillStyle = skin; g.fillRect(-2.6, -92, 5.2, 6);
    g.fillStyle = rgrad(g, -2, -110, 2, 12, [0, shade(skin, 12), 0.4, skin, 0.8, shade(skin, -12), 1, shade(skin, -26)]);
    g.beginPath(); g.arc(0, -104, 10.2, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.5; g.stroke();

    // Grey-silver parted hair
    g.fillStyle = "#8a8580";
    g.beginPath(); g.arc(0, -107, 9.8, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    g.beginPath(); g.arc(-7.5, -108, 4.2, -Math.PI * 0.9, Math.PI * 0.3); g.fill();
    g.beginPath(); g.arc(7.5, -108, 4.2, -Math.PI * 0.3, Math.PI * 0.9); g.fill();

    // Round Spectacles (Glasses)
    g.strokeStyle = "#4a2d12"; g.lineWidth = 1.2;
    g.beginPath(); g.arc(-3.5, -105, 2.8, 0, TAU); g.stroke();
    g.beginPath(); g.arc(3.5, -105, 2.8, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(-0.7, -105); g.lineTo(0.7, -105); g.stroke(); // Bridge
    g.beginPath(); g.moveTo(-6.3, -105); g.lineTo(-9, -106); g.stroke(); // Left ear piece
    g.beginPath(); g.moveTo(6.3, -105); g.lineTo(9, -106); g.stroke(); // Right ear piece

    // Eyes behind spectacles
    g.fillStyle = dark;
    g.beginPath(); g.arc(-3.5, -105, 1.1, 0, TAU); g.fill();
    g.beginPath(); g.arc(3.5, -105, 1.1, 0, TAU); g.fill();

    // Distinguished grey mustache
    g.fillStyle = "#78726c";
    g.beginPath();
    g.moveTo(-5, -100); g.quadraticCurveTo(0, -102, 5, -100);
    g.quadraticCurveTo(0, -98, -5, -100); g.closePath(); g.fill();
    return c;
  }

  // 3. Seated Student Sprite with Dynamic Hand-Raising & Diverse Looks
  function buildStudentSprite(s) {
    var S = 3, c = document.createElement("canvas");
    c.width = 160; c.height = 240;
    var g = c.getContext("2d");
    g.scale(S, S); g.translate(26, 76);
    var skin = s.skin || "#b5724a", dark = s.hair || "#241a12", ln = "#3a2c22";
    var shirt = s.shirt || "#ffffff", bottom = s.bottom || "#2b4c7e";
    var isGirl = s.girl;
    var handRaised = !!s.handRaised;

    // Soft base shadow
    g.fillStyle = "rgba(60,40,20,0.22)";
    g.beginPath(); g.ellipse(0, -2, 17, 4.5, 0, 0, TAU); g.fill();

    // Crossed legs
    g.fillStyle = skin;
    g.beginPath(); g.ellipse(-6, -6, 6, 4.4, -0.35, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(7, -5, 6, 4.4, 0.35, 0, TAU); g.fill();

    // Uniform bottom (skirt or shorts)
    g.fillStyle = lgrad(g, -13, -26, 6, -2, [0, bottom, 1, shade(bottom, -24)]);
    g.beginPath();
    g.moveTo(-10, -28); g.quadraticCurveTo(-15, -18, -13, -4);
    g.quadraticCurveTo(-6, 0, 0, 0); g.quadraticCurveTo(7, 0, 13, -4);
    g.quadraticCurveTo(15, -18, 10, -28); g.quadraticCurveTo(0, -31, -10, -28);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.5; g.stroke();

    // Shirt torso
    g.fillStyle = lgrad(g, -10, -50, 4, -28, [0, shade(shirt, 8), 0.6, shirt, 1, shade(shirt, -14)]);
    g.beginPath();
    g.moveTo(-8, -52); g.quadraticCurveTo(-12, -40, -10, -29);
    g.lineTo(10, -29); g.quadraticCurveTo(12, -40, 8, -52);
    g.quadraticCurveTo(0, -55, -8, -52); g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.5; g.stroke();

    // School tie / neck collar
    g.fillStyle = s.tieColor || "#c0392b";
    g.beginPath(); g.moveTo(-2, -52); g.lineTo(2, -52); g.lineTo(1.2, -41); g.lineTo(-1.2, -41); g.closePath(); g.fill();

    // Slate or Book in lap
    if (s.holding === "book") {
      g.fillStyle = "#2980b9"; rr(g, -11, -17, 22, 14, 2);
      g.fillStyle = "#fff8e7"; g.fillRect(-9, -15, 8.5, 10); g.fillRect(0.5, -15, 8.5, 10);
      g.strokeStyle = "#1b4f72"; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(0, -15); g.lineTo(0, -5); g.stroke();
    } else {
      // Classic slate with wooden frame
      g.fillStyle = "#6b4a2b"; g.strokeStyle = ln; g.lineWidth = 1.2;
      rrS(g, -11, -17, 22, 15, 2); g.stroke();
      g.fillStyle = "#1e3a24"; g.fillRect(-9, -14.5, 18, 10);
      // Chalk scribbles
      g.strokeStyle = "#e8f8f5"; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(-7, -11); g.lineTo(5, -11); g.stroke();
      g.beginPath(); g.moveTo(-7, -8); g.lineTo(1, -8); g.stroke();
    }

    // Left arm down on slate
    g.strokeStyle = skin; g.lineWidth = 3.6; g.lineCap = "round";
    g.beginPath(); g.moveTo(-8, -46); g.quadraticCurveTo(-12, -34, -9, -18); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(-9, -17, 2.5, 0, TAU); g.fill();

    // Right arm: Eagerly Raised in air (if handRaised), or resting on desk
    if (handRaised) {
      g.strokeStyle = skin; g.lineWidth = 3.8;
      g.beginPath(); g.moveTo(8, -46); g.quadraticCurveTo(14, -60, 12, -74); g.stroke();
      // Raised open hand
      g.fillStyle = skin;
      g.beginPath(); g.ellipse(12, -76, 3.2, 4.2, 0.1, 0, TAU); g.fill();
      // Emote sparkle
      g.fillStyle = "#f1c40f"; g.font = "bold 9px sans-serif";
      g.fillText("✋", 15, -78);
    } else {
      g.strokeStyle = skin; g.lineWidth = 3.6;
      g.beginPath(); g.moveTo(8, -46); g.quadraticCurveTo(12, -34, 9, -18); g.stroke();
      g.fillStyle = skin; g.beginPath(); g.arc(9, -17, 2.5, 0, TAU); g.fill();
    }

    // Neck + Head
    g.fillStyle = skin; g.fillRect(-2.4, -59, 4.8, 6);
    g.fillStyle = rgrad(g, -2, -68, 2, 11, [0, shade(skin, 12), 0.4, skin, 0.8, shade(skin, -12), 1, shade(skin, -26)]);
    g.beginPath(); g.arc(0, -64, 9.4, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.5; g.stroke();

    // Ears
    g.fillStyle = skin;
    g.beginPath(); g.arc(-8.2, -62, 2, 0, TAU); g.fill();
    g.beginPath(); g.arc(8.2, -62, 2, 0, TAU); g.fill();

    // Hair Styling
    g.fillStyle = dark;
    g.beginPath(); g.arc(0, -67, 9, Math.PI * 1.02, Math.PI * 1.98); g.fill();
    g.beginPath(); g.arc(-7.4, -69, 4.4, -Math.PI * 0.85, Math.PI * 0.35); g.fill();

    if (isGirl) {
      if (s.hairStyle === "braids") {
        // Twin braided pigtails with red ribbon bows
        g.strokeStyle = dark; g.lineWidth = 2.8;
        g.beginPath(); g.moveTo(-7, -65); g.quadraticCurveTo(-11, -55, -9, -44); g.stroke();
        g.beginPath(); g.moveTo(7, -65); g.quadraticCurveTo(11, -55, 9, -44); g.stroke();
        g.fillStyle = "#e74c3c";
        g.fillRect(-11, -46, 4, 3); g.fillRect(7, -46, 4, 3);
      } else {
        // High ponytail with ribbon
        g.beginPath(); g.arc(7, -74, 4.5, 0, TAU); g.fill();
        g.fillStyle = "#e74c3c"; g.beginPath(); g.arc(5, -72, 2.2, 0, TAU); g.fill();
      }
    } else {
      if (s.hasGlasses) {
        // Round student spectacles
        g.strokeStyle = "#4a2d12"; g.lineWidth = 1;
        g.beginPath(); g.arc(-2.8, -65.5, 2.2, 0, TAU); g.stroke();
        g.beginPath(); g.arc(2.8, -65.5, 2.2, 0, TAU); g.stroke();
        g.beginPath(); g.moveTo(-0.6, -65.5); g.lineTo(0.6, -65.5); g.stroke();
      }
    }

    // Eyes & Smile
    g.fillStyle = "#ffffff";
    g.beginPath(); g.ellipse(-2.7, -66, 1.5, 1.8, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(2.7, -66, 1.5, 1.8, 0, 0, TAU); g.fill();
    g.fillStyle = dark;
    g.beginPath(); g.arc(-2.9, -66.2, 0.9, 0, TAU); g.fill();
    g.beginPath(); g.arc(2.5, -66.2, 0.9, 0, TAU); g.fill();
    // Smile
    g.strokeStyle = dark; g.lineWidth = 0.9;
    g.beginPath(); g.arc(0, -64.4, 2.2, 0.2, Math.PI - 0.4); g.stroke();
    // Cheeks
    g.fillStyle = "rgba(214,93,93,0.32)";
    g.beginPath(); g.ellipse(-4, -64.6, 1.5, 1, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(4, -64.6, 1.5, 1, 0, 0, TAU); g.fill();

    return c;
  }

  // 4. Portrait Generator (128x128 for Dialogue Box)
  function buildPortrait(def, type) {
    var c = document.createElement("canvas");
    c.width = 120; c.height = 120;
    var g = c.getContext("2d");
    var skin = def.skin || "#b5724a", dark = def.hair || "#241a12";

    // Circular background
    g.fillStyle = "#fff4e0"; g.beginPath(); g.arc(60, 60, 58, 0, TAU); g.fill();
    g.strokeStyle = "#8d5325"; g.lineWidth = 4; g.stroke();

    if (type === "masterji") {
      // Kurta & Waistcoat
      g.fillStyle = "#78281f";
      g.beginPath(); g.arc(60, 115, 38, Math.PI, TAU); g.fill();
      g.fillStyle = "#f5efe6"; g.fillRect(52, 75, 16, 25);
      // Head
      g.fillStyle = skin; g.beginPath(); g.arc(60, 56, 24, 0, TAU); g.fill();
      // Grey hair
      g.fillStyle = "#8a8580";
      g.beginPath(); g.arc(60, 48, 24, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      // Spectacles
      g.strokeStyle = "#3e2723"; g.lineWidth = 2.2;
      g.beginPath(); g.arc(50, 56, 7, 0, TAU); g.stroke();
      g.beginPath(); g.arc(70, 56, 7, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(57, 56); g.lineTo(63, 56); g.stroke();
      // Eyes
      g.fillStyle = dark;
      g.beginPath(); g.arc(50, 56, 2.5, 0, TAU); g.fill();
      g.beginPath(); g.arc(70, 56, 2.5, 0, TAU); g.fill();
      // Mustache
      g.fillStyle = "#78726c";
      g.beginPath(); g.moveTo(46, 68); g.quadraticCurveTo(60, 65, 74, 68); g.quadraticCurveTo(60, 74, 46, 68); g.closePath(); g.fill();
    } else if (type === "teacher") {
      // Meena Didi: Saree & Gajra
      g.fillStyle = "#e59b20"; g.beginPath(); g.arc(60, 115, 38, Math.PI, TAU); g.fill();
      g.fillStyle = "#388e3c"; g.beginPath(); g.moveTo(40, 100); g.lineTo(60, 75); g.lineTo(80, 100); g.closePath(); g.fill();
      // Head
      g.fillStyle = skin; g.beginPath(); g.arc(60, 54, 23, 0, TAU); g.fill();
      // Hair + Bun
      g.fillStyle = dark;
      g.beginPath(); g.arc(60, 48, 23, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      g.beginPath(); g.arc(78, 42, 11, 0, TAU); g.fill();
      // Jasmine gajra
      g.fillStyle = "#ffffff";
      for (var f = 0; f < 6; f++) {
        g.beginPath(); g.arc(75 + Math.cos(f) * 10, 42 + Math.sin(f) * 10, 2.5, 0, TAU); g.fill();
      }
      // Eyes & Bindi
      g.fillStyle = dark;
      g.beginPath(); g.arc(51, 54, 2.4, 0, TAU); g.fill();
      g.beginPath(); g.arc(69, 54, 2.4, 0, TAU); g.fill();
      g.fillStyle = "#c0392b"; g.beginPath(); g.arc(60, 49, 2.5, 0, TAU); g.fill();
      // Smile
      g.strokeStyle = dark; g.lineWidth = 1.8;
      g.beginPath(); g.arc(60, 62, 5, 0.2, Math.PI - 0.2); g.stroke();
    } else {
      // Student Portrait
      var shirt = def.shirt || "#ffffff", bottom = def.bottom || "#2b4c7e";
      g.fillStyle = bottom; g.beginPath(); g.arc(60, 115, 38, Math.PI, TAU); g.fill();
      g.fillStyle = shirt; g.beginPath(); g.moveTo(44, 95); g.lineTo(60, 74); g.lineTo(76, 95); g.closePath(); g.fill();
      g.fillStyle = def.tieColor || "#c0392b"; g.fillRect(58, 80, 4, 16);
      // Head
      g.fillStyle = skin; g.beginPath(); g.arc(60, 55, 21, 0, TAU); g.fill();
      // Hair
      g.fillStyle = dark;
      g.beginPath(); g.arc(60, 48, 21, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      if (def.girl) {
        g.beginPath(); g.arc(74, 40, 9, 0, TAU); g.fill(); // ribbon bun
        g.fillStyle = "#e74c3c"; g.beginPath(); g.arc(70, 45, 4, 0, TAU); g.fill();
      }
      // Eyes & Smile
      g.fillStyle = dark;
      g.beginPath(); g.arc(52, 55, 2.2, 0, TAU); g.fill();
      g.beginPath(); g.arc(68, 55, 2.2, 0, TAU); g.fill();
      g.strokeStyle = dark; g.lineWidth = 1.6;
      g.beginPath(); g.arc(60, 62, 4.5, 0.2, Math.PI - 0.2); g.stroke();
    }
    return c;
  }

  /* =========================================================================
     SHARED PERSON RENDERER
     ========================================================================= */

  function renderPerson(p, ctx, cam, W, H, topPad) {
    var sx = p.x - cam.x, sy = p.y - cam.y;
    var cw = (ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 1920;
    var ch = (ctx.canvas && ctx.canvas.height) ? ctx.canvas.height : 1080;
    if (sx < -120 || sx > cw + 120 || sy < -180 || sy > ch + 180) return;

    if (p.sprite) {
      var sw = p.sprite.width / p.SCALE, sh = p.sprite.height / p.SCALE;
      var bob = (p.kind === "teacher") ? Math.sin(now() / 800 + p.seed) * 0.9 : 0;
      ctx.drawImage(p.sprite, sx - sw / 2, sy - sh + (topPad || 0) + bob, sw, sh);
    }

    // Soft ground contact shadow
    ctx.fillStyle = "rgba(60,45,25,0.22)";
    ctx.beginPath(); ctx.ellipse(sx, sy, 15, 5, 0, 0, TAU); ctx.fill();

    // Name tag
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    var label = p.name, lw = ctx.measureText(label).width + 14;
    ctx.fillStyle = "rgba(38,26,16,0.65)";
    rr(ctx, sx - lw / 2, sy - (p.tagY || 128) - 9, lw, 17, 8);
    ctx.fillStyle = "rgba(255,244,224,0.95)";
    ctx.fillText(label, sx, sy - (p.tagY || 128) + 3);

    // Floating Emote Bubble (if active)
    if (p.emote && now() < p.emote.until) {
      var emY = sy - (p.tagY || 128) - 34 + Math.sin(now() / 250) * 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = "#8d5325"; ctx.lineWidth = 1.6;
      rrS(ctx, sx - 13, emY - 10, 26, 22, 8); ctx.fill(); ctx.stroke();
      ctx.font = "14px sans-serif";
      ctx.fillText(p.emote.icon, sx, emY + 6);
    } else {
      // Proximity talk hint when player walks close
      var g = window.CC_G;
      if (g && g.player) {
        var d = Math.hypot(g.player.x - p.x, g.player.y - p.y);
        if (d < 170) {
          var t = Math.sin(now() / 320) * 2;
          ctx.fillStyle = "rgba(255,252,240,0.94)";
          ctx.strokeStyle = "rgba(120,86,44,0.5)"; ctx.lineWidth = 1.4;
          rrS(ctx, sx - 11, sy - (p.tagY || 128) - 32 + t, 22, 18, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#7a5a2e"; ctx.font = "700 11px ui-sans-serif, system-ui, sans-serif";
          ctx.fillText("…", sx, sy - (p.tagY || 128) - 19 + t);
        }
      }
    }
    ctx.textAlign = "left";
  }

  /* =========================================================================
     ENTITIES: TEACHERS, STUDENTS & CLASSROOM OBJECTS
     ========================================================================= */

  // Teacher Entity
  function Teacher(school, x, y, def) {
    this.school = school;
    this.x = x; this.y = y;
    this.name = (def && def.name) || "Meena Didi";
    this.role = (def && def.role) || "Village Teacher";
    this.teacherType = (def && def.teacherType) || "teacher";
    this.kind = "teacher";
    this.SCALE = 3;
    this.tagY = 114;
    this.seed = Math.random() * 10;
    this.def = def || {};
    this.sprite = (this.teacherType === "masterji") ? buildMasterjiSprite(this.def) : buildTeacherSprite(this.def);
    this.portrait = buildPortrait(this.def, this.teacherType);
    this.w = 54; this.h = 114;
    this.lessons = def.lessons || [
      "Namaste! In our village school, every child learns that curiosity has no limits! 🌟",
      "Today we're studying astronomy and solar power — light from the sun reaches us in 8 minutes! ☀️",
      "When a girl in our village is educated, she empowers the entire community! 📚",
      "Mathematics is like solving a puzzle: keep trying, and the pattern will reveal itself! ✨",
      "Books are wings for the mind — never stop asking questions! 🎓"
    ];
  }
  Teacher.prototype.render = function (ctx, cam) {
    renderPerson(this, ctx, cam, 60, 120, 0);
  };
  Teacher.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 50)) < 42;
  };
  Teacher.prototype.z = function () { return 4; };
  Teacher.prototype.talk = function () {
    var g = window.CC_G;
    if (g) g.play("pop");
    this.school.openDialog(this);
  };

  // Student Entity
  function Student(school, id, x, y, def) {
    this.school = school;
    this.id = id;
    this.x = x; this.y = y;
    this.name = (def && def.name) || "Student";
    this.role = (def && def.role) || "Class 8 Student";
    this.kind = "student";
    this.SCALE = 3;
    this.tagY = 74;
    this.seed = Math.random() * 10;
    this.def = def || {};
    this.handRaised = false;
    this.emote = null;
    this.sprite = buildStudentSprite(this.def);
    this.portrait = buildPortrait(this.def, "student");
    this.quote = (def && def.quote) || "Learning something new every day!";
    this.detail = (def && def.detail) || "Loves science experiments and reading books!";
    this.hasInteracted = false;
    this.w = 52; this.h = 76;
  }
  Student.prototype.render = function (ctx, cam) {
    renderPerson(this, ctx, cam, 50, 80, 0);
  };
  Student.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 32)) < 32;
  };
  Student.prototype.z = function () { return 3; };
  Student.prototype.raiseHand = function (dur) {
    this.handRaised = true;
    this.def.handRaised = true;
    this.sprite = buildStudentSprite(this.def);
    var self = this;
    setTimeout(function () {
      self.handRaised = false;
      self.def.handRaised = false;
      self.sprite = buildStudentSprite(self.def);
    }, dur || 4000);
  };
  Student.prototype.showEmote = function (icon, dur) {
    this.emote = { icon: icon, until: now() + (dur || 3000) };
  };
  Student.prototype.talk = function () {
    var g = window.CC_G;
    if (g) g.play("pop");
    this.raiseHand(4000);
    this.showEmote("💡", 3500);
    this.school.openDialog(this);
  };

  // Interactive School Bell Entity
  function SchoolBell(school, x, y) {
    this.school = school;
    this.x = x; this.y = y;
    this.w = 40; this.h = 70;
    this.kind = "school-bell";
    this.ringUntil = 0;
  }
  SchoolBell.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var ringing = now() < this.ringUntil;
    var swing = ringing ? Math.sin(now() / 60) * 0.4 : 0;

    // Oak post
    ctx.fillStyle = "#5c3a1b"; ctx.strokeStyle = "#321d0a"; ctx.lineWidth = 2;
    rr(ctx, sx - 4, sy - 54, 8, 54, 2); ctx.stroke();
    // Crossarm
    rr(ctx, sx - 16, sy - 54, 32, 6, 2); ctx.stroke();

    // Brass Bell (swings when rung)
    ctx.save();
    ctx.translate(sx, sy - 46);
    ctx.rotate(swing);

    var bg = ctx.createLinearGradient(-10, 0, 10, 18);
    bg.addColorStop(0, "#ffe066"); bg.addColorStop(0.5, "#d49a24"); bg.addColorStop(1, "#8a5808");
    ctx.fillStyle = bg; ctx.strokeStyle = "#4d2f03"; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-11, 8, -12, 16);
    ctx.lineTo(12, 16); ctx.quadraticCurveTo(11, 8, 4, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Clapper & rope
    ctx.fillStyle = "#4a2c00"; ctx.beginPath(); ctx.arc(0, 19, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#cfb07e"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(swing * 12, 38); ctx.stroke();
    ctx.restore();

    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillStyle = "#4a2d12";
    ctx.fillText("🔔 Bell (Ring)", sx, sy - 60);
    ctx.textAlign = "left";
  };
  SchoolBell.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 30)) < 32;
  };
  SchoolBell.prototype.z = function () { return 2; };
  SchoolBell.prototype.ring = function () {
    var g = window.CC_G;
    this.ringUntil = now() + 2400;
    if (g) {
      g.play("bell");
      g.toast("🔔 Tring-tring! The school bell rings — recess time! Students cheer with joy! 🎉");
    }
    // Make all students in the room raise hands & show celebratory emotes!
    if (this.school && this.school.students) {
      this.school.students.forEach(function (s) {
        s.raiseHand(4500);
        s.showEmote("🎉", 4000);
      });
    }
  };

  // Interactive Spinning Globe Entity
  function SpinningGlobe(school, x, y) {
    this.school = school;
    this.x = x; this.y = y;
    this.angle = 0;
    this.spinSpeed = 0.02;
    this.spinUntil = 0;
    this.kind = "globe";
    this.facts = [
      "🌍 Did you know? Earth orbits the Sun at ~107,000 km/h (67,000 mph)!",
      "🏔️ Geography Fact: Mount Everest in the Himalayas is 8,848 meters tall!",
      "🌊 Ocean Fact: The Pacific Ocean covers more area than all Earth's land combined!",
      "📮 Unique Fact: India has the world's highest post office at 14,567 ft in Hikkim, Himachal Pradesh!",
      "☀️ Solar Fact: The equator receives the most direct sunlight throughout the year."
    ];
    this.factIdx = 0;
  }
  SpinningGlobe.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var spinning = now() < this.spinUntil;
    var spd = spinning ? 0.22 : 0.02;
    this.angle += spd;

    // Brass stand
    ctx.strokeStyle = "#b8860b"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(sx, sy - 14, 16, Math.PI * 0.2, Math.PI * 1.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + 6); ctx.stroke();
    ctx.fillStyle = "#8d5325"; rr(ctx, sx - 8, sy + 6, 16, 4, 1.5);

    // Globe Sphere
    var gGrad = ctx.createRadialGradient(sx - 4, sy - 18, 2, sx, sy - 14, 14);
    gGrad.addColorStop(0, "#5dade2"); gGrad.addColorStop(0.7, "#2e86c1"); gGrad.addColorStop(1, "#1b4f72");
    ctx.fillStyle = gGrad;
    ctx.beginPath(); ctx.arc(sx, sy - 14, 13, 0, TAU); ctx.fill();

    // Continents (moving lines)
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, sy - 14, 13, 0, TAU); ctx.clip();
    ctx.fillStyle = "#27ae60";
    for (var c = -1; c <= 2; c++) {
      var cx = sx + Math.sin(this.angle + c * 1.5) * 12;
      ctx.beginPath(); ctx.ellipse(cx, sy - 14, 4, 8, 0.2, 0, TAU); ctx.fill();
    }
    ctx.restore();

    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillStyle = "#4a2d12";
    ctx.fillText("🌍 Globe (Spin)", sx, sy - 32);
    ctx.textAlign = "left";
  };
  SpinningGlobe.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 14)) < 24;
  };
  SpinningGlobe.prototype.z = function () { return 3; };
  SpinningGlobe.prototype.interact = function () {
    var g = window.CC_G;
    this.spinUntil = now() + 3500;
    this.factIdx = (this.factIdx + 1) % this.facts.length;
    if (g) {
      g.play("whoosh");
      g.toast(this.facts[this.factIdx]);
    }
  };

  // Interactive Microscope Science Station
  function MicroscopeStation(school, x, y) {
    this.school = school;
    this.x = x; this.y = y;
    this.kind = "microscope";
  }
  MicroscopeStation.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    // Wooden lab bench
    ctx.fillStyle = "#5c331a"; ctx.strokeStyle = "#381c06"; ctx.lineWidth = 2;
    rr(ctx, sx - 28, sy - 12, 56, 24, 3); ctx.stroke();

    // Brass Microscope
    ctx.fillStyle = "#d4af37"; ctx.strokeStyle = "#6b5420"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.rect(sx - 8, sy - 4, 16, 4); ctx.fill(); ctx.stroke(); // base
    ctx.beginPath(); ctx.moveTo(sx - 3, sy - 4); ctx.lineTo(sx - 3, sy - 24); ctx.stroke(); // arm
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath(); ctx.rect(sx - 6, sy - 28, 12, 10); ctx.fill(); // eyepiece
    ctx.fillStyle = "#bdc3c7";
    ctx.beginPath(); ctx.rect(sx - 3, sy - 18, 6, 8); ctx.fill(); // objective lens

    // Chemical flask with turquoise liquid
    ctx.fillStyle = "rgba(26, 188, 156, 0.85)"; ctx.strokeStyle = "#16a085"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx + 14, sy - 16); ctx.lineTo(sx + 18, sy - 4); ctx.lineTo(sx + 10, sy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillStyle = "#4a2d12";
    ctx.fillText("🔬 Science Lab", sx, sy - 34);
    ctx.textAlign = "left";
  };
  MicroscopeStation.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 12)) < 28;
  };
  MicroscopeStation.prototype.z = function () { return 2; };
  MicroscopeStation.prototype.interact = function () {
    var g = window.CC_G;
    if (g) {
      g.play("pop");
      g.toast("🔬 Looking through lens: You observe vibrant green chloroplasts in an Elodea leaf cell conducting photosynthesis! 🌱✨");
    }
  };

  // Interactive Library Bookshelf
  function LibraryBookshelf(school, x, y) {
    this.school = school;
    this.x = x; this.y = y;
    this.kind = "bookshelf";
    this.stories = [
      "📖 'Panchatantra Tale': In unity lies great strength — individual threads together make an unbreakable rope!",
      "🚀 'Wings of Fire (Dr. Kalam)': Dream, dream, dream. Dreams transform into thoughts, and thoughts result in action.",
      "🌟 'Ramanujan's Magic Number 1729': The smallest number expressible as the sum of two cubes in two different ways (10³+9³ & 12³+1³)!"
    ];
    this.storyIdx = 0;
  }
  LibraryBookshelf.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    // High-polish mahogany bookcase
    ctx.fillStyle = "#50280f"; ctx.strokeStyle = "#321606"; ctx.lineWidth = 3;
    rr(ctx, sx - 44, sy - 90, 88, 120, 6); ctx.stroke();

    var colors = ["#e74c3c", "#f39c12", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"];
    for (var row = 0; row < 3; row++) {
      var ry = sy - 80 + row * 38;
      ctx.fillStyle = "#381a07"; ctx.fillRect(sx - 38, ry + 28, 76, 4);
      for (var b = 0; b < 6; b++) {
        ctx.fillStyle = colors[(b + row) % colors.length];
        ctx.fillRect(sx - 34 + b * 11, ry + 4, 8.5, 24);
      }
    }

    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillStyle = "#4a2d12";
    ctx.fillText("📚 Library (Read)", sx, sy - 98);
    ctx.textAlign = "left";
  };
  LibraryBookshelf.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 30)) < 40;
  };
  LibraryBookshelf.prototype.z = function () { return 2; };
  LibraryBookshelf.prototype.interact = function () {
    var g = window.CC_G;
    this.storyIdx = (this.storyIdx + 1) % this.stories.length;
    if (g) {
      g.play("pop");
      g.toast(this.stories[this.storyIdx]);
    }
  };

  // Interactive Clay Water Matka
  function WaterMatka(school, x, y) {
    this.school = school;
    this.x = x; this.y = y;
    this.kind = "matka";
  }
  WaterMatka.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    // Terracotta matka pot
    var mg = ctx.createRadialGradient(sx - 4, sy - 14, 2, sx, sy - 10, 16);
    mg.addColorStop(0, "#d9885c"); mg.addColorStop(0.7, "#a64b2a"); mg.addColorStop(1, "#5e2311");
    ctx.fillStyle = mg; ctx.strokeStyle = "#3d1306"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(sx, sy - 10, 14, 0, TAU); ctx.fill(); ctx.stroke();
    // Neck & rim
    ctx.fillRect(sx - 5, sy - 24, 10, 5);
    // Brass water ladle (lota)
    ctx.fillStyle = "#d4af37"; ctx.fillRect(sx + 8, sy - 18, 7, 10);

    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillStyle = "#4a2d12";
    ctx.fillText("🏺 Water Matka", sx, sy - 30);
    ctx.textAlign = "left";
  };
  WaterMatka.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - (this.y - 10)) < 26;
  };
  WaterMatka.prototype.z = function () { return 2; };
  WaterMatka.prototype.interact = function () {
    var g = window.CC_G;
    if (g) {
      g.play("pop");
      g.toast("💧 Gulp! Sweet, refreshing earthen pot water. You feel re-energized for learning!");
    }
  };

  // School Blackboard Entity
  function SchoolBoard(school, x, y, isBig) {
    this.school = school;
    this.x = x; this.y = y;
    this.isBig = isBig;
    this.w = isBig ? 320 : 140; this.h = isBig ? 120 : 80;
    this.kind = "school-board";
    this.lessonIdx = 0;
    this.lessons = [
      "📝 Blackboard: 'ज्ञानं परमं बलम्' — Knowledge is the ultimate power!",
      "🔬 Science Fact: Earth orbits the Sun at ~107,000 km/h!",
      "📐 Math Riddle: How many sides does an octagon have? Eight!",
      "🌿 Nature Lesson: The sacred banyan tree sends aerial roots to anchor itself for centuries."
    ];
  }
  SchoolBoard.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    // Easel legs (if small board)
    if (!this.isBig) {
      ctx.strokeStyle = "#633d1c"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx - 48, sy + 32); ctx.lineTo(sx - 34, sy - 40); ctx.lineTo(sx + 34, sy - 40); ctx.lineTo(sx + 48, sy + 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, sy - 40); ctx.lineTo(sx, sy + 28); ctx.stroke();
    }

    ctx.fillStyle = "#1e3a24"; ctx.strokeStyle = "#4a2e15"; ctx.lineWidth = 3.5;
    var bw = this.isBig ? 280 : 128, bh = this.isBig ? 90 : 68;
    rr(ctx, sx - bw / 2, sy - bh / 2, bw, bh, 6); ctx.stroke();

    // Chalk text
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("क ख ग  •  A B C  •  1 2 3", sx, sy - 14);
    ctx.fillStyle = "#fce79f"; ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("7 × 8 = 56   E = mc²", sx, sy + 2);
    ctx.fillStyle = "#c1f0c8"; ctx.font = "italic 9.5px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("ज्ञानं परमं बलम् 🌟", sx, sy + 18);

    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "#5c3b16";
    ctx.fillText("📝 Blackboard (Quiz)", sx, sy - bh / 2 - 8);
    ctx.textAlign = "left";
  };
  SchoolBoard.prototype.hit = function (px, py) {
    return Math.hypot(px - this.x, py - this.y) < (this.isBig ? 70 : 45);
  };
  SchoolBoard.prototype.z = function () { return 2; };
  SchoolBoard.prototype.readLesson = function () {
    this.school.startQuiz();
  };

  /* =========================================================================
     VILLAGE SCHOOL SYSTEM COORDINATOR
     ========================================================================= */

  function VillageSchool(game) {
    this.game = game;
    this.fanAngle = 0;
    this.teacher = null;
    this.masterji = null;
    this.students = [];
    this.bell = null;
    this.board = null;
    this.globe = null;
    this.microscope = null;
    this.bookshelf = null;
    this.matka = null;
    this.quizActive = false;
    this.quizIdx = 0;

    this.initDOM();
    this.initEntities();
  }

  VillageSchool.prototype.initDOM = function () {
    if (document.getElementById("school-ui-style")) return;

    var style = document.createElement("style");
    style.id = "school-ui-style";
    style.textContent = [
      "#school-modal {",
      "  position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center;",
      "  background: rgba(18, 12, 8, 0.65); backdrop-filter: blur(4px);",
      "  opacity: 0; pointer-events: none; transition: opacity 0.22s ease;",
      "}",
      "#school-modal.open { opacity: 1; pointer-events: auto; }",
      "#school-card {",
      "  position: relative; width: 92%; max-width: 540px; background: #fffaf0;",
      "  border: 3.5px solid #6b4423; border-radius: 20px;",
      "  box-shadow: 0 16px 40px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.8);",
      "  padding: 24px; font-family: ui-sans-serif, system-ui, sans-serif; color: #3a2211;",
      "}",
      "#sc-close {",
      "  position: absolute; top: 12px; right: 14px; width: 34px; height: 34px;",
      "  border-radius: 50%; background: #eedac0; border: 2px solid #8d5325;",
      "  color: #5c331a; font-weight: bold; font-size: 16px; cursor: pointer;",
      "  display: flex; align-items: center; justify-content: center;",
      "}",
      "#sc-close:hover { background: #e59b20; color: #fff; }",
      ".sc-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }",
      ".sc-avatar { width: 76px; height: 76px; border-radius: 50%; border: 3px solid #8d5325; overflow: hidden; background: #ffeac7; flex-shrink: 0; }",
      ".sc-avatar canvas { width: 100%; height: 100%; display: block; }",
      ".sc-meta { flex: 1; }",
      ".sc-name { font-size: 20px; font-weight: 800; color: #4a270f; margin: 0 0 4px 0; }",
      ".sc-role { font-size: 13px; font-weight: 600; color: #b8621b; display: inline-block; background: #ffeed3; padding: 3px 10px; border-radius: 12px; border: 1px solid #e0b07a; }",
      ".sc-body { font-size: 15px; line-height: 1.5; color: #422917; background: #fdf5e6; border: 1.5px solid #edd3b2; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; min-height: 64px; }",
      ".sc-actions { display: flex; flex-wrap: wrap; gap: 10px; }",
      ".sc-btn {",
      "  flex: 1 1 calc(50% - 6px); padding: 11px 14px; border-radius: 12px;",
      "  border: 2px solid #8d5325; background: linear-gradient(180deg, #fce8cc 0%, #e8bc86 100%);",
      "  color: #4a270f; font-weight: 700; font-size: 13.5px; cursor: pointer;",
      "  display: flex; align-items: center; justify-content: center; gap: 6px;",
      "  transition: transform 0.1s ease, box-shadow 0.1s ease;",
      "}",
      ".sc-btn:hover { transform: translateY(-1.5px); box-shadow: 0 4px 12px rgba(141,83,37,0.25); background: #f9d8a5; }",
      ".sc-btn-primary { background: linear-gradient(180deg, #f5b041 0%, #d68910 100%); color: #fff; border-color: #873600; }",
      ".sc-quiz-card { background: #fef9e7; border: 2px solid #d4ac0d; border-radius: 12px; padding: 12px; margin-bottom: 12px; }",
      ".sc-quiz-q { font-size: 15px; font-weight: 700; color: #7d6608; margin-bottom: 10px; }",
      ".sc-quiz-opts { display: flex; flex-direction: column; gap: 8px; }",
      ".sc-opt-btn {",
      "  padding: 10px 14px; border-radius: 8px; border: 1.5px solid #d4ac0d; background: #fff;",
      "  font-size: 14px; font-weight: 600; color: #5b4606; cursor: pointer; text-align: left;",
      "}",
      ".sc-opt-btn:hover { background: #fdf2e9; border-color: #b9770e; }"
    ].join("\n");
    document.head.appendChild(style);

    var modal = document.createElement("div");
    modal.id = "school-modal";
    modal.innerHTML = [
      '<div id="school-card">',
      '  <button id="sc-close" title="Close (Esc)">✕</button>',
      '  <div class="sc-header">',
      '    <div class="sc-avatar" id="sc-avatar-box"></div>',
      '    <div class="sc-meta">',
      '      <h3 class="sc-name" id="sc-name">Meena Didi</h3>',
      '      <span class="sc-role" id="sc-role">Village Teacher</span>',
      '    </div>',
      '  </div>',
      '  <div class="sc-body" id="sc-body">Namaste! Welcome to our village classroom.</div>',
      '  <div class="sc-actions" id="sc-actions"></div>',
      '</div>'
    ].join("");
    document.body.appendChild(modal);

    var self = this;
    modal.querySelector("#sc-close").addEventListener("click", function () { self.closeDialog(); });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) self.closeDialog();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) {
        self.closeDialog();
      }
    });
  };

  VillageSchool.prototype.openDialog = function (entity) {
    var modal = document.getElementById("school-modal");
    if (!modal) return;
    var nameEl = document.getElementById("sc-name");
    var roleEl = document.getElementById("sc-role");
    var bodyEl = document.getElementById("sc-body");
    var avBox = document.getElementById("sc-avatar-box");
    var actBox = document.getElementById("sc-actions");

    nameEl.textContent = entity.name;
    roleEl.textContent = entity.role;
    bodyEl.textContent = (entity.quote || (entity.lessons ? entity.lessons[0] : "Welcome to Explore Chaupal Learning Center!"));

    avBox.innerHTML = "";
    if (entity.portrait) avBox.appendChild(entity.portrait);

    actBox.innerHTML = "";
    var self = this;

    if (entity.kind === "teacher") {
      var isMasterji = (entity.teacherType === "masterji");

      if (isMasterji) {
        // Masterji actions
        var bMath = document.createElement("button");
        bMath.className = "sc-btn sc-btn-primary";
        bMath.innerHTML = "📐 Learn Speed Math";
        bMath.onclick = function () {
          bodyEl.innerHTML = "<strong>Masterji's Speed Math Trick:</strong><br>To square any number ending in 5 (like 35):<br>Multiply 3 by the next integer 4: <code>3 × 4 = 12</code>.<br>Append 25 at the end: <code>1225</code>! Try 65²: <code>6 × 7 = 42</code> &rarr; <code>4225</code>!";
          if (window.CC_G) window.CC_G.play("pop");
        };
        actBox.appendChild(bMath);

        var bRiddle = document.createElement("button");
        bRiddle.className = "sc-btn";
        bRiddle.innerHTML = "🧩 Ancient Riddle";
        bRiddle.onclick = function () {
          bodyEl.innerHTML = "<strong>Masterji's Riddle:</strong><br><em>'What belongs to you, but everyone else uses it more than you do?'</em><br><br>💡 <strong>Answer:</strong> Your Name!";
          if (window.CC_G) window.CC_G.play("pop");
        };
        actBox.appendChild(bRiddle);
      } else {
        // Meena Didi actions
        var bQuiz = document.createElement("button");
        bQuiz.className = "sc-btn sc-btn-primary";
        bQuiz.innerHTML = "🧠 Take Classroom Quiz";
        bQuiz.onclick = function () {
          self.startQuiz();
        };
        actBox.appendChild(bQuiz);

        var bRoll = document.createElement("button");
        bRoll.className = "sc-btn";
        bRoll.innerHTML = "🙋 Roll Call (Cheer)";
        bRoll.onclick = function () {
          bodyEl.innerHTML = "Meena Didi calls out: <em>'Students, are we ready to explore and learn?'</em><br>All 14 students cheer with raised hands: <strong>'Yes Didi!' 🌟</strong>";
          if (self.students) {
            self.students.forEach(function (s) {
              s.raiseHand(4000);
              s.showEmote("⭐", 3500);
            });
          }
          if (window.CC_G) window.CC_G.play("bell");
        };
        actBox.appendChild(bRoll);
      }

      var bQuote = document.createElement("button");
      bQuote.className = "sc-btn";
      bQuote.innerHTML = "📖 Daily Lesson";
      bQuote.onclick = function () {
        var q = entity.lessons[Math.floor(Math.random() * entity.lessons.length)];
        bodyEl.textContent = q;
        if (window.CC_G) window.CC_G.play("pop");
      };
      actBox.appendChild(bQuote);
    } else {
      // Student actions
      var bDetail = document.createElement("button");
      bDetail.className = "sc-btn sc-btn-primary";
      bDetail.innerHTML = "💡 What are you studying?";
      bDetail.onclick = function () {
        bodyEl.innerHTML = "<strong>" + entity.name + ":</strong> " + entity.detail;
        entity.raiseHand(3000);
        entity.showEmote("💡", 3000);
        if (window.CC_G) window.CC_G.play("pop");
      };
      actBox.appendChild(bDetail);

      var bEncourage = document.createElement("button");
      bEncourage.className = "sc-btn";
      bEncourage.innerHTML = "⭐ Give Encouragement (+1 Shell)";
      bEncourage.onclick = function () {
        entity.showEmote("❤️", 3500);
        entity.raiseHand(3000);
        bodyEl.innerHTML = "You encourage " + entity.name + "!<br><em>'Thank you, scout! Together we make Chaupal proud!' 😊</em>";
        if (!entity.hasInteracted && window.CCE) {
          window.CCE.addShells(1);
          entity.hasInteracted = true;
          if (window.CC_G) window.CC_G.refreshHud();
        }
        if (window.CC_G) window.CC_G.play("pickup");
      };
      actBox.appendChild(bEncourage);
    }

    modal.classList.add("open");
  };

  VillageSchool.prototype.closeDialog = function () {
    var modal = document.getElementById("school-modal");
    if (modal) modal.classList.remove("open");
  };

  VillageSchool.prototype.startQuiz = function () {
    var modal = document.getElementById("school-modal");
    if (!modal) return;
    var nameEl = document.getElementById("sc-name");
    var roleEl = document.getElementById("sc-role");
    var bodyEl = document.getElementById("sc-body");
    var actBox = document.getElementById("sc-actions");

    nameEl.textContent = "Classroom Pop Quiz 🧠";
    roleEl.textContent = "Meena Didi & Masterji";

    var quizQuestions = [
      {
        q: "1. Light from the Sun takes approximately how long to reach Earth?",
        opts: ["A) 8 minutes ☀️", "B) 1 hour", "C) Instantaneous"],
        correct: 0,
        fact: "Correct! Sunlight travels 150 million km in ~8 minutes and 20 seconds!"
      },
      {
        q: "2. Which sacred tree in Chaupal sends aerial roots to live for centuries?",
        opts: ["A) Pine Tree", "B) Banyan Tree 🌳", "C) Cactus"],
        correct: 1,
        fact: "Correct! The sacred banyan tree in our Chaupal grows prop roots for stability!"
      },
      {
        q: "3. What is the main source of clean electrical power for our school?",
        opts: ["A) Solar Panels ⚡", "B) Coal", "C) Kerosene"],
        correct: 0,
        fact: "Correct! Our rooftop solar installation powers the classroom lights & ceiling fans!"
      },
      {
        q: "4. If Aarav solves 12 math puzzles each day for 5 days, how many did he solve?",
        opts: ["A) 48 puzzles", "B) 60 puzzles 📐", "C) 72 puzzles"],
        correct: 1,
        fact: "Correct! 12 × 5 = 60! Outstanding arithmetic!"
      }
    ];

    var qData = quizQuestions[this.quizIdx % quizQuestions.length];
    this.quizIdx++;

    var html = '<div class="sc-quiz-card"><div class="sc-quiz-q">' + qData.q + '</div><div class="sc-quiz-opts">';
    for (var o = 0; o < qData.opts.length; o++) {
      html += '<button class="sc-opt-btn" data-idx="' + o + '">' + qData.opts[o] + '</button>';
    }
    html += '</div></div>';
    bodyEl.innerHTML = html;

    actBox.innerHTML = "";
    var self = this;

    bodyEl.querySelectorAll(".sc-opt-btn").forEach(function (btn) {
      btn.onclick = function () {
        var chosen = parseInt(this.getAttribute("data-idx"), 10);
        if (chosen === qData.correct) {
          bodyEl.innerHTML = '<div style="color:#196f3d; font-size:16px; font-weight:800; margin-bottom:8px;">🎉 Brilliant Answer!</div>' + qData.fact + '<div style="margin-top:10px; color:#b8621b; font-weight:700;">+3 Shells Awarded • "Village Scholar" Badge Unlocked! 🎓</div>';
          if (window.CCE) {
            window.CCE.addShells(3);
            if (window.CC_G) window.CC_G.refreshHud();
          }
          if (window.CC_G) {
            window.CC_G.play("goal");
            window.CC_G.toast("🎓 Merit Badge Awarded: Village Scholar! +3 Shells!");
          }
          if (self.students) {
            self.students.forEach(function (s) {
              s.raiseHand(4000);
              s.showEmote("⭐", 3500);
            });
          }
        } else {
          bodyEl.innerHTML = '<div style="color:#922b21; font-size:15px; font-weight:700; margin-bottom:6px;">Good attempt! Keep thinking! 💭</div>' + qData.fact;
          if (window.CC_G) window.CC_G.play("pop");
        }
      };
    });

    var bNext = document.createElement("button");
    bNext.className = "sc-btn sc-btn-primary";
    bNext.innerHTML = "Next Quiz Question ➡️";
    bNext.onclick = function () { self.startQuiz(); };
    actBox.appendChild(bNext);

    modal.classList.add("open");
  };

  /* =========================================================================
     MAP ENTITIES INITIALIZATION
     ========================================================================= */

  VillageSchool.prototype.initEntities = function () {
    var isDefault = (this.game.mapId === "default");
    var isSchool = (this.game.mapId === "school");

    if (isDefault) {
      // Schoolyard Outdoor Setup (south meadow, just below the chaupal)
      var cx = 6150, cy = 2200;
      this.cx = cx; this.cy = cy;
      this.teacher = new Teacher(this, cx - 40, cy - 50, {
        name: "Meena Didi",
        role: "Head Teacher",
        teacherType: "teacher",
        skin: "#b5724a", sari: "#e59b20", blouse: "#2d733e", dupatta: "#388e3c"
      });
      this.masterji = new Teacher(this, cx + 50, cy - 50, {
        name: "Masterji Ramchandra",
        role: "Senior Guru",
        teacherType: "masterji",
        skin: "#aa683e"
      });

      this.students = [
        new Student(this, "aarav", cx - 80, cy - 10, { name: "Aarav", skin: "#a86a42", bottom: "#2b4c7e", girl: false, quote: "12 × 12 = 144! Math is my favorite subject!", detail: "Practicing Vedic speed multiplication with Masterji." }),
        new Student(this, "priya", cx - 35, cy - 10, { name: "Priya", skin: "#b8764a", bottom: "#8a2b38", girl: true, hairStyle: "braids", quote: "Girls in Chaupal dream of becoming ISRO space scientists! 🚀", detail: "Measuring shadows to calculate solar angles." }),
        new Student(this, "ananya", cx + 15, cy - 10, { name: "Ananya", skin: "#c28052", bottom: "#8a2b38", girl: true, quote: "Education lights a thousand lamps without dimming its flame. 📚", detail: "Writing a speech on clean river water for our village." }),
        new Student(this, "deepak", cx + 70, cy - 10, { name: "Deepak", skin: "#9e6138", bottom: "#2b4c7e", girl: false, hasGlasses: true, quote: "Andromeda galaxy is 2.5 million light years away! 🌌", detail: "Observing sunspots through pinhole projection." }),
        new Student(this, "chinki", cx - 85, cy + 30, { name: "Chinki", skin: "#c28052", bottom: "#8a2b38", girl: true, hairStyle: "braids", quote: "I drew the banyan tree and Mintu the sleeping cat! 🎨", detail: "Creating colorful chalk illustrations on slates." }),
        new Student(this, "rohan", cx - 35, cy + 30, { name: "Rohan", skin: "#9e6138", bottom: "#2b4c7e", girl: false, quote: "Tagore's poems inspire me to look at nature with wonder! ✨", detail: "Writing poems about the morning river mist." }),
        new Student(this, "gauri", cx + 15, cy + 30, { name: "Gauri", skin: "#b36e44", bottom: "#8a2b38", girl: true, quote: "We share our books so every child gets to read and grow! 📖", detail: "Organizing the library book exchange." }),
        new Student(this, "kabir", cx + 65, cy + 30, { name: "Kabir", skin: "#a0643c", bottom: "#2b4c7e", girl: false, quote: "I found this smooth quartz crystal along the riverbank! 💎", detail: "Studying geological mineral formations." }),
        new Student(this, "aman", cx - 55, cy + 68, { name: "Aman", skin: "#a0643c", bottom: "#2b4c7e", girl: false, quote: "Recess is coming! Let's play Kabaddi on the field! ⚽", detail: "Camp recess & sports coordinator." }),
        new Student(this, "sunita", cx + 35, cy + 68, { name: "Sunita", skin: "#b8764a", bottom: "#8a2b38", girl: true, quote: "I can name all 28 states and their capitals! 🌍", detail: "Studying mountain ranges and rivers of India." })
      ];

      this.bell = new SchoolBell(this, cx + 110, cy - 40);
      this.board = new SchoolBoard(this, cx - 246, cy - 6, false);
      this.globe = null; this.microscope = null; this.bookshelf = null; this.matka = null;

    } else if (isSchool) {
      // Interior Classroom Setup: 1718 x 966 space
      var icx = 860, icy = 500;

      // Teachers
      this.teacher = new Teacher(this, icx + 40, icy - 130, {
        name: "Meena Didi",
        role: "Head Teacher",
        teacherType: "teacher",
        skin: "#b5724a", sari: "#e59b20", blouse: "#2d733e", dupatta: "#388e3c"
      });
      this.masterji = new Teacher(this, icx - 320, icy - 130, {
        name: "Masterji Ramchandra",
        role: "Senior Guru",
        teacherType: "masterji",
        skin: "#aa683e"
      });

      // 14 Seated Students at 7 Dual Desks
      this.students = [
        // Desk Row 1 (Front: Y=535)
        new Student(this, "aarav", 480, 530, { name: "Aarav", skin: "#a86a42", bottom: "#2b4c7e", girl: false, quote: "19 × 7 = 133! Fast mental math is a superpower!", detail: "Calculating speed-distance formulas on his slate." }),
        new Student(this, "priya", 560, 530, { name: "Priya", skin: "#b8764a", bottom: "#8a2b38", girl: true, hairStyle: "braids", quote: "Sunlight takes 8 minutes and 20 seconds to reach us! 🚀", detail: "Drawing orbital ellipses for satellite orbits." }),
        new Student(this, "ananya", 820, 530, { name: "Ananya", skin: "#c28052", bottom: "#8a2b38", girl: true, quote: "Education is a flame that sparks a lifetime of curiosity. 📚", detail: "Drafting an essay on women leadership in Chaupal." }),
        new Student(this, "deepak", 900, 530, { name: "Deepak", skin: "#9e6138", bottom: "#2b4c7e", girl: false, hasGlasses: true, quote: "Our school solar meter generated 14 kWh of green energy today! ☀️", detail: "Tracking solar inverter voltage and battery storage." }),
        new Student(this, "chinki", 1160, 530, { name: "Chinki", skin: "#c28052", bottom: "#8a2b38", girl: true, hairStyle: "braids", quote: "I drew Mintu the ginger cat sleeping peacefully! 🎨", detail: "Sketching wildlife and flora of the banyan grove." }),
        new Student(this, "rohan", 1240, 530, { name: "Rohan", skin: "#9e6138", bottom: "#2b4c7e", girl: false, quote: "Rabindranath Tagore's poetry gives wings to our thoughts! ✨", detail: "Composing Hindi and English nature sonnets." }),

        // Desk Row 2 (Middle: Y=635)
        new Student(this, "gauri", 480, 630, { name: "Gauri", skin: "#b36e44", bottom: "#8a2b38", girl: true, quote: "Our school library has 50 new illustrated science books! 📖", detail: "Cataloging Panchatantra and encyclopedic folios." }),
        new Student(this, "kabir", 560, 630, { name: "Kabir", skin: "#a0643c", bottom: "#2b4c7e", girl: false, quote: "This mica stone sparkles under the window light! 💎", detail: "Analyzing mineral cleavage and crystalline structures." }),
        new Student(this, "sunita", 820, 630, { name: "Sunita", skin: "#b8764a", bottom: "#8a2b38", girl: true, quote: "I can locate every continent and ocean on Masterji's globe! 🌍", detail: "Charting the monsoon weather currents across Asia." }),
        new Student(this, "aman", 900, 630, { name: "Aman", skin: "#a0643c", bottom: "#2b4c7e", girl: false, quote: "Stay fit, study sharp! Who wants to play soccer at recess? ⚽", detail: "Organizing the inter-house school games." }),
        new Student(this, "radha_jr", 1160, 630, { name: "Radha Jr.", skin: "#b5724a", bottom: "#8a2b38", girl: true, quote: "When village girls study computers, entire communities rise! 💡", detail: "Learning coding logic and digital literacy." }),
        new Student(this, "vikram", 1240, 630, { name: "Vikram", skin: "#9e6138", bottom: "#2b4c7e", girl: false, quote: "My origami paper glider loops in smooth aerodynamic arcs! 🕊️", detail: "Experimenting with center of lift and paper craft." }),

        // Desk Row 3 (Back Center: Y=735)
        new Student(this, "tarun", 820, 730, { name: "Tarun", skin: "#a0643c", bottom: "#2b4c7e", girl: false, quote: "Our school garden uses natural marigolds to deter crop pests! 🌻", detail: "Testing organic compost and soil nitrogen levels." }),
        new Student(this, "bhavna", 900, 730, { name: "Bhavna", skin: "#b8764a", bottom: "#8a2b38", girl: true, hairStyle: "braids", quote: "Music is mathematics you can hear! Every note has pure frequency! 🎶", detail: "Leading the morning assembly harmony choir." })
      ];

      // Interactive Classroom Items
      this.bell = new SchoolBell(this, icx + 360, 360);
      this.board = new SchoolBoard(this, icx, 220, true);
      this.globe = new SpinningGlobe(this, icx - 80, 350);
      this.microscope = new MicroscopeStation(this, 180, 500);
      this.bookshelf = new LibraryBookshelf(this, 1600, 520);
      this.matka = new WaterMatka(this, 220, 780);
    } else {
      this.teacher = null;
      this.masterji = null;
      this.students = [];
      this.bell = null;
      this.board = null;
      this.globe = null;
      this.microscope = null;
      this.bookshelf = null;
      this.matka = null;
    }
  };

  VillageSchool.prototype.entities = function () {
    var arr = [];
    if (this.board) arr.push(this.board);
    if (this.bell) arr.push(this.bell);
    if (this.globe) arr.push(this.globe);
    if (this.microscope) arr.push(this.microscope);
    if (this.bookshelf) arr.push(this.bookshelf);
    if (this.matka) arr.push(this.matka);
    if (this.teacher) arr.push(this.teacher);
    if (this.masterji) arr.push(this.masterji);
    if (this.students) arr = arr.concat(this.students);
    return arr;
  };

  VillageSchool.prototype.pick = function (wx, wy) {
    if (this.globe && this.globe.hit(wx, wy)) return this.globe;
    if (this.microscope && this.microscope.hit(wx, wy)) return this.microscope;
    if (this.bookshelf && this.bookshelf.hit(wx, wy)) return this.bookshelf;
    if (this.matka && this.matka.hit(wx, wy)) return this.matka;
    if (this.bell && this.bell.hit(wx, wy)) return this.bell;
    if (this.board && this.board.hit(wx, wy)) return this.board;
    if (this.teacher && this.teacher.hit(wx, wy)) return this.teacher;
    if (this.masterji && this.masterji.hit(wx, wy)) return this.masterji;
    if (this.students) {
      for (var i = 0; i < this.students.length; i++) {
        if (this.students[i].hit(wx, wy)) return this.students[i];
      }
    }
    return null;
  };

  /* =========================================================================
     GROUND PASS: VERANDAH, DESKS, TILES, AND ARCHITECTURE
     ========================================================================= */


  // ---- schoolhouse backdrop -------------------------------------------------
  // Drawn behind the yard so the class has an actual building to sit in front of.
  function drawSchoolhouse(ctx, sx, sy, t) {
    var baseY = sy - 96, w = 470, h = 214;
    var left = sx - w / 2, top = baseY - h;

    ctx.save();
    // soft ground shadow
    ctx.fillStyle = "rgba(60,40,20,0.16)";
    ctx.beginPath(); ctx.ellipse(sx, baseY + 6, w * 0.46, 26, 0, 0, Math.PI * 2); ctx.fill();

    // whitewashed wall + plinth
    ctx.fillStyle = "#f6ecd7"; ctx.strokeStyle = "#b89773"; ctx.lineWidth = 3;
    rr(ctx, left + 28, top + 78, w - 56, h - 78, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e2d0ad";
    rr(ctx, left + 30, baseY - 26, w - 60, 26, 4); ctx.fill();
    ctx.strokeStyle = "rgba(150,120,85,0.35)"; ctx.lineWidth = 1.5;
    for (var b = 0; b < 5; b++) {
      var bx = left + 40 + b * (w - 80) / 5;
      ctx.beginPath(); ctx.moveTo(bx, top + 82); ctx.lineTo(bx, baseY - 26); ctx.stroke();
    }

    // terracotta roof with a ridge and eaves
    ctx.fillStyle = "#cf4a2e"; ctx.strokeStyle = "#8f2f1c"; ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(left - 6, top + 86);
    ctx.lineTo(left + 36, top + 18);
    ctx.lineTo(sx, top - 14);
    ctx.lineTo(left + w - 36, top + 18);
    ctx.lineTo(left + w + 6, top + 86);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#b03a24";
    rr(ctx, left - 6, top + 74, w + 12, 14, 4); ctx.fill();
    ctx.fillStyle = "#e8734f";
    for (var r = 0; r < 6; r++) {
      ctx.beginPath();
      ctx.moveTo(left + 26 + r * 72, top + 74);
      ctx.lineTo(left + 52 + r * 72, top + 22);
      ctx.lineTo(left + 68 + r * 72, top + 22);
      ctx.lineTo(left + 42 + r * 72, top + 74);
      ctx.closePath(); ctx.fill();
    }

    // door + steps
    ctx.fillStyle = "#6b4423"; ctx.strokeStyle = "#3f2611"; ctx.lineWidth = 3;
    rr(ctx, sx - 38, baseY - 84, 76, 84, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8a5a2f"; rr(ctx, sx - 29, baseY - 76, 58, 76, 4); ctx.fill();
    ctx.fillStyle = "#f0c14b";
    ctx.beginPath(); ctx.arc(sx + 18, baseY - 40, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d8c19a";
    rr(ctx, sx - 54, baseY - 12, 108, 12, 3); ctx.fill();

    // windows with teal shutters
    [-1, 1].forEach(function (side) {
      var wx = sx + side * 124 - 37;
      ctx.fillStyle = "#cfe9ea"; ctx.strokeStyle = "#2f7f7a"; ctx.lineWidth = 3;
      rr(ctx, wx, top + 100, 74, 58, 5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#2f7f7a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx + 37, top + 100); ctx.lineTo(wx + 37, top + 158);
      ctx.moveTo(wx, top + 129); ctx.lineTo(wx + 74, top + 129); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.moveTo(wx + 6, top + 190); ctx.lineTo(wx + 26, top + 132);
      ctx.lineTo(wx + 36, top + 132); ctx.lineTo(wx + 16, top + 190); ctx.closePath(); ctx.fill();
    });

    // hanging nameboard
    ctx.fillStyle = "#1e3a24"; ctx.strokeStyle = "#4a2e15"; ctx.lineWidth = 3;
    rr(ctx, sx - 112, top + 82, 224, 26, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f7e6b0"; ctx.textAlign = "center";
    ctx.font = "bold 15px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("गाँव का स्कूल · THE VILLAGE SCHOOL", sx, top + 100);

    // flag pole + pennant (gentle sway)
    var sway = Math.sin(t / 700) * 4;
    ctx.strokeStyle = "#7a5c3a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx + 232, top + 96); ctx.lineTo(sx + 232, top - 46); ctx.stroke();
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath(); ctx.moveTo(sx + 232, top - 46);
    ctx.lineTo(sx + 288 + sway, top - 34);
    ctx.lineTo(sx + 232, top - 20); ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  VillageSchool.prototype.renderGround = function (ctx, cam) {
    var isDefault = (this.game.mapId === "default");
    var isSchool = (this.game.mapId === "school");

    if (isDefault) {
      var cx = this.cx || 6150, cy = this.cy || 2200;
      var sx = cx - cam.x, sy = cy - cam.y;

      // ---- the schoolhouse itself (canvas-drawn, same palette as the camp) ----
      drawSchoolhouse(ctx, sx, sy, U.now ? U.now() : Date.now());

      // Terracotta platform
      ctx.fillStyle = "#b96b42"; ctx.strokeStyle = "#5a2b16"; ctx.lineWidth = 3;
      rr(ctx, sx - 170, sy - 110, 340, 200, 16); ctx.fill(); ctx.stroke();

      // Stone floor tiling
      ctx.fillStyle = "#d98a5b";
      rr(ctx, sx - 162, sy - 102, 324, 184, 12);
      ctx.strokeStyle = "rgba(130,90,50,0.22)"; ctx.lineWidth = 1;
      for (var tx = -140; tx < 150; tx += 38) {
        ctx.beginPath(); ctx.moveTo(sx + tx, sy - 98); ctx.lineTo(sx + tx, sy + 78); ctx.stroke();
      }

      // 4 Woven colorful Dhurrie rugs
      ctx.fillStyle = "#e69c24"; ctx.strokeStyle = "#8f5708"; ctx.lineWidth = 2;
      rr(ctx, sx - 120, sy - 30, 240, 48, 6); ctx.stroke();
      ctx.fillStyle = "#b84233"; ctx.strokeStyle = "#5e1910"; ctx.lineWidth = 2;
      rr(ctx, sx - 110, sy + 24, 220, 48, 6); ctx.stroke();
      ctx.fillStyle = "#2e7d32"; ctx.strokeStyle = "#1b5e20"; ctx.lineWidth = 2;
      rr(ctx, sx - 80, sy + 76, 160, 42, 6); ctx.stroke();

      // Hopscotch court on the lawn to the left
      var hx = sx - 230, hy = sy - 40;
      ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 2.2;
      for (var h = 0; h < 5; h++) {
        ctx.strokeRect(hx, hy + h * 24, 22, 22);
      }

      // Pillars
      var pillars = [[-154, -98], [154, -98], [-154, 78], [154, 78]];
      for (var p = 0; p < pillars.length; p++) {
        var px = sx + pillars[p][0], py = sy + pillars[p][1];
        ctx.fillStyle = "#f4f1ea"; ctx.strokeStyle = "#6b543b"; ctx.lineWidth = 2;
        rr(ctx, px - 6, py - 36, 12, 36, 3); ctx.stroke();
        ctx.fillStyle = "#a85d38"; ctx.fillRect(px - 8, py - 40, 16, 5);
      }

      // Entrance Signboard
      var signX = sx + 80, signY = sy - 102;
      ctx.fillStyle = "#4a2c14"; ctx.strokeStyle = "#251205"; ctx.lineWidth = 2.5;
      rr(ctx, signX - 75, signY - 24, 150, 26, 6); ctx.stroke();
      ctx.fillStyle = "#ffe29a"; ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏫 गाँव की पाठशाला (School)", signX, signY - 7);

    } else if (isSchool) {
      var mw = 1718, mh = 966;
      var bx = -cam.x, by = -cam.y;

      // Warm wooden floorboards
      var flGrad = ctx.createLinearGradient(0, by, 0, by + mh);
      flGrad.addColorStop(0, "#d8b68a"); flGrad.addColorStop(1, "#be9563");
      ctx.fillStyle = flGrad; ctx.fillRect(bx, by, mw, mh);

      // Floor plank lines
      ctx.strokeStyle = "rgba(90,55,25,0.2)"; ctx.lineWidth = 1.5;
      for (var ly = 120; ly < mh; ly += 50) {
        ctx.beginPath(); ctx.moveTo(bx, by + ly); ctx.lineTo(bx + mw, by + ly); ctx.stroke();
      }

      // Back teaching wall
      var wGrad = ctx.createLinearGradient(0, by, 0, by + 320);
      wGrad.addColorStop(0, "#f3ebe0"); wGrad.addColorStop(0.7, "#e4d3bc"); wGrad.addColorStop(1, "#8a4f2b");
      ctx.fillStyle = wGrad; ctx.fillRect(bx, by, mw, 320);
      ctx.fillStyle = "#5c331a"; ctx.fillRect(bx, by + 316, mw, 8);

      // Classroom Windows
      var windows = [240, 600, 1100, 1460];
      for (var w = 0; w < windows.length; w++) {
        var wx = bx + windows[w], wy = by + 60;
        ctx.fillStyle = "#9ad8fa"; ctx.strokeStyle = "#5a3518"; ctx.lineWidth = 4;
        rr(ctx, wx - 60, wy, 120, 140, 8); ctx.stroke();
        ctx.strokeStyle = "#5a3518"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + 140); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx - 60, wy + 70); ctx.lineTo(wx + 60, wy + 70); ctx.stroke();
      }

      // Big Classroom Blackboard
      var bbX = bx + mw / 2, bbY = by + 160;
      ctx.fillStyle = "#1b3320"; ctx.strokeStyle = "#5a3518"; ctx.lineWidth = 5;
      rr(ctx, bbX - 250, bbY - 70, 500, 140, 10); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.font = "bold 20px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🌟 Explore Chaupal Learning Center 🌟", bbX, bbY - 32);
      ctx.font = "14px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "#ffe29a";
      ctx.fillText("क ख ग घ ङ  •  A B C D E  •  1 2 3 4 5", bbX, bbY - 2);
      ctx.fillStyle = "#a8f0b4";
      ctx.font = "italic 13px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("\"Education is the most powerful weapon to change the world.\"", bbX, bbY + 30);
      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Solar Powered • Community Driven • Free For All", bbX, bbY + 52);

      // Teacher's Dais & Wooden Desk
      var tdX = bx + mw / 2, tdY = by + 350;
      ctx.fillStyle = "#8f5728"; ctx.strokeStyle = "#40220a"; ctx.lineWidth = 3;
      rr(ctx, tdX - 160, tdY - 30, 320, 55, 6); ctx.stroke();
      // Stack of colorful reference books on desk
      ctx.fillStyle = "#c0392b"; ctx.fillRect(tdX + 75, tdY - 36, 28, 8);
      ctx.fillStyle = "#27ae60"; ctx.fillRect(tdX + 77, tdY - 44, 25, 7);
      ctx.fillStyle = "#2980b9"; ctx.fillRect(tdX + 79, tdY - 51, 23, 6);

      // Student Wooden Dual-Desks (7 desks for 14 students)
      var desks = [
        [bx + 520, by + 535], [bx + 860, by + 535], [bx + 1200, by + 535], // Row 1
        [bx + 520, by + 635], [bx + 860, by + 635], [bx + 1200, by + 635], // Row 2
        [bx + 860, by + 740]                                                // Row 3 (Back center)
      ];

      for (var d = 0; d < desks.length; d++) {
        var dx = desks[d][0], dy = desks[d][1];
        // Desk shadow
        ctx.fillStyle = "rgba(40,25,10,0.18)";
        ctx.beginPath(); ctx.ellipse(dx, dy + 14, 82, 10, 0, 0, TAU); ctx.fill();

        // Wooden desk top
        ctx.fillStyle = "#7a461b"; ctx.strokeStyle = "#402208"; ctx.lineWidth = 2.5;
        rr(ctx, dx - 75, dy - 18, 150, 30, 4); ctx.stroke();
        // Desk compartment shadow
        ctx.fillStyle = "#4a280c"; ctx.fillRect(dx - 70, dy + 2, 140, 7);

        // Slate & book on each desk
        ctx.fillStyle = "#1e3a24"; ctx.fillRect(dx - 55, dy - 14, 24, 16);
        ctx.fillStyle = "#fff8e7"; ctx.fillRect(dx + 30, dy - 14, 22, 16);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(dx + 30, dy - 14, 4, 16);
      }

      // Exit doorway at bottom
      var exX = bx + mw / 2, exY = by + 860;
      ctx.fillStyle = "#5c331a"; ctx.strokeStyle = "#381c06"; ctx.lineWidth = 3;
      rr(ctx, exX - 100, exY - 20, 200, 50, 10); ctx.stroke();
      ctx.fillStyle = "#fff8e7"; ctx.font = "bold 13px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🚪 Exit to Schoolyard", exX, exY + 12);
    }
    ctx.textAlign = "left";
  };

  /* =========================================================================
     CANOPY PASS: BUNTING FLAGS & SPINNING CEILING FAN
     ========================================================================= */

  VillageSchool.prototype.renderCanopy = function (ctx, cam) {
    var isDefault = (this.game.mapId === "default");
    var isSchool = (this.game.mapId === "school");

    if (isDefault) {
      var cx = this.cx || 6150, cy = this.cy || 2200;
      var sx = cx - cam.x, sy = cy - cam.y;

      // Colorful bunting flags
      var sway = Math.sin(now() / 400) * 2;
      var flags = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"];
      ctx.strokeStyle = "#4a2d12"; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx - 150, sy - 110);
      ctx.quadraticCurveTo(sx, sy - 90 + sway, sx + 150, sy - 110);
      ctx.stroke();

      for (var f = 0; f < 10; f++) {
        var fx = sx - 130 + f * 28;
        var fy = sy - 105 + Math.sin(f / 9 * Math.PI) * 14 + sway * (f % 2 ? 1 : -1);
        ctx.fillStyle = flags[f % flags.length];
        ctx.beginPath();
        ctx.moveTo(fx - 7, fy); ctx.lineTo(fx + 7, fy); ctx.lineTo(fx, fy + 16);
        ctx.closePath(); ctx.fill();
      }
    } else if (isSchool) {
      // Spinning Ceiling Fan in Center
      var mw = 1718;
      var fx = mw / 2 - cam.x, fy = 200 - cam.y;
      this.fanAngle += 0.09;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.strokeStyle = "#2c3e50"; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = "#34495e"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();

      // 3 Blades
      ctx.fillStyle = "rgba(52, 73, 94, 0.85)";
      for (var b = 0; b < 3; b++) {
        var ang = this.fanAngle + (b * TAU / 3);
        ctx.save();
        ctx.rotate(ang);
        rr(ctx, 8, -6, 75, 12, 4);
        ctx.restore();
      }
      ctx.restore();
    }
  };

  VillageSchool.prototype.update = function (dt) {
    // Gentle animation tick
  };

  window.VillageSchool = VillageSchool;
  window.Teacher = Teacher;
  window.Student = Student;
  window.SchoolBell = SchoolBell;
  window.SchoolBoard = SchoolBoard;
  window.CC_SCHOOL = true;
})();
