/* Village Chaupal — Part A: soft-shaded figure art (pre-rendered 3x sprites),
   cat, wayfinding signs. Quasi-3D look via gradients, rim light, ground shadows
   matching the authentic rural Chaupal gathering aesthetic. */
(function () {
  if (window.CC_V) return;
  var TAU = 6.2831853;
  var U = window.U || {};
  function now() { return U.now ? U.now() : performance.now(); }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); ctx.fill(); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
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

  function shade(color, amt) {
    var n = parseInt(color.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + gg + "," + b + ")";
  }

  /* ---- portrait painter (used for speech bubble avatar & chooser cards) ---- */
  function paintPortrait(canvas, woman) {
    var g = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    g.clearRect(0, 0, W, H);

    // Warm radial parchment background
    var bg = g.createRadialGradient(W / 2, H * 0.4, 4, W / 2, H / 2, H * 0.65);
    bg.addColorStop(0, "#fff5e3");
    bg.addColorStop(1, "#ecd1a8");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    var idx = woman.idx;
    var skin = woman.skin || "#c68a56";
    var dark = "#22170f";

    // Shoulders & Clothing
    g.fillStyle = woman.sari;
    g.beginPath();
    g.ellipse(W / 2, H * 1.02, W * 0.46, H * 0.36, 0, Math.PI, 0);
    g.fill();
    g.strokeStyle = "#382313";
    g.lineWidth = 2.4;
    g.stroke();

    // Collar / Dupatta / Pallu drape
    if (idx === 2) {
      // Kavita: White student uniform collar
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(W * 0.38, H * 0.62);
      g.lineTo(W * 0.5, H * 0.74);
      g.lineTo(W * 0.62, H * 0.62);
      g.closePath();
      g.fill();
      g.stroke();
    } else {
      // Saree pallu drape
      g.fillStyle = woman.dupatta || woman.sari;
      g.beginPath();
      g.moveTo(W * 0.3, H * 0.62);
      g.quadraticCurveTo(W * 0.5, H * 0.55, W * 0.72, H * 0.62);
      g.quadraticCurveTo(W * 0.68, H * 0.75, W * 0.32, H * 0.75);
      g.closePath();
      g.fill();
      // Gold zari border
      g.strokeStyle = "#f5c542";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(W * 0.3, H * 0.62);
      g.quadraticCurveTo(W * 0.5, H * 0.55, W * 0.72, H * 0.62);
      g.stroke();
    }

    // Neck
    g.fillStyle = skin;
    g.fillRect(W * 0.44, H * 0.48, W * 0.12, H * 0.12);

    // Head
    g.fillStyle = skin;
    g.beginPath();
    g.arc(W / 2, H * 0.34, W * 0.22, 0, TAU);
    g.fill();
    g.strokeStyle = "#382313";
    g.lineWidth = 2.2;
    g.stroke();

    // Hair & Head covering
    g.fillStyle = dark;
    if (idx === 0) {
      // Radha Devi: pink pallu draped over head framing face (like in reference mockup)
      g.fillStyle = "#c23b6b";
      g.beginPath();
      g.arc(W / 2, H * 0.33, W * 0.25, Math.PI * 0.75, Math.PI * 2.25);
      g.lineTo(W * 0.72, H * 0.65);
      g.lineTo(W * 0.28, H * 0.65);
      g.closePath();
      g.fill();
      g.strokeStyle = "#f5c542";
      g.lineWidth = 2.2;
      g.stroke();

      // Hair showing under pallu
      g.fillStyle = dark;
      g.beginPath();
      g.arc(W / 2, H * 0.31, W * 0.17, Math.PI * 0.95, Math.PI * 2.05);
      g.fill();
    } else if (idx === 2) {
      // Kavita: ponytail with ribbon
      g.beginPath();
      g.arc(W / 2, H * 0.32, W * 0.225, Math.PI * 0.9, Math.PI * 2.1);
      g.fill();
      // Side sweep
      g.beginPath();
      g.ellipse(W * 0.38, H * 0.35, W * 0.12, W * 0.08, -0.3, 0, TAU);
      g.fill();
      // Ponytail puff
      g.beginPath();
      g.ellipse(W * 0.74, H * 0.25, W * 0.1, W * 0.15, 0.4, 0, TAU);
      g.fill();
      // Blue hair ribbon
      g.fillStyle = "#3b6bb0";
      g.beginPath();
      g.arc(W * 0.66, H * 0.27, 4.5, 0, TAU);
      g.fill();
    } else if (idx === 3) {
      // Savitri: green pallu covering hair
      g.fillStyle = woman.sari;
      g.beginPath();
      g.arc(W / 2, H * 0.32, W * 0.245, Math.PI * 0.8, Math.PI * 2.2);
      g.fill();
      g.strokeStyle = "#f5c542";
      g.lineWidth = 2;
      g.stroke();
      // Face opening
      g.fillStyle = dark;
      g.beginPath();
      g.arc(W / 2, H * 0.28, W * 0.16, Math.PI * 0.95, Math.PI * 2.05);
      g.fill();
    } else {
      // Meena: hair bun with jasmine flowers
      g.beginPath();
      g.arc(W / 2, H * 0.32, W * 0.225, Math.PI * 0.95, Math.PI * 2.05);
      g.arc(W / 2 - W * 0.2, H * 0.36, W * 0.12, -Math.PI / 2, Math.PI / 2, true);
      g.fill();
      // Hair bun
      g.beginPath();
      g.arc(W * 0.72, H * 0.25, W * 0.09, 0, TAU);
      g.fill();
      // Meena: white gajra flowers
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(W * 0.68, H * 0.21, 3.2, 0, TAU);
      g.arc(W * 0.76, H * 0.23, 3, 0, TAU);
      g.arc(W * 0.73, H * 0.28, 2.8, 0, TAU);
      g.fill();
    }

    // Eyes
    g.fillStyle = dark;
    g.beginPath();
    g.ellipse(W * 0.43, H * 0.40, 2.5, 3.5, 0, 0, TAU);
    g.ellipse(W * 0.57, H * 0.40, 2.5, 3.5, 0, 0, TAU);
    g.fill();
    // Catchlight in eyes
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(W * 0.415, H * 0.385, 1.1, 0, TAU);
    g.arc(W * 0.555, H * 0.385, 1.1, 0, TAU);
    g.fill();

    // Bindi
    g.fillStyle = "#c1272d";
    g.beginPath();
    g.arc(W / 2, H * 0.42, 2.5, 0, TAU);
    g.fill();

    // Warm Smile
    g.strokeStyle = "#5a2216";
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(W / 2, H * 0.47, W * 0.08, 0.25, Math.PI - 0.25);
    g.stroke();

    // Gold earrings (jhumkas)
    if (idx !== 2) {
      g.fillStyle = "#f5c542";
      g.beginPath();
      g.arc(W * 0.26, H * 0.45, 3, 0, TAU);
      g.arc(W * 0.74, H * 0.45, 3, 0, TAU);
      g.fill();
    }
  }

  /* ---------- Bespoke Seated Sprites for Each Woman ---------- */

  // 1. Radha Devi (Center, sitting cross-legged on rug, pink saree, gesturing)
  function buildRadhaSprite(woman) {
    var W = 240, H = 300, S = 3;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.scale(S, S);
    g.translate(40, 98);

    var skin = woman.skin, dark = "#22170f", ln = "#382313";
    var sar = woman.sari, blu = woman.blouse, dup = woman.dupatta;

    // Seated skirt / folded cross legs
    g.fillStyle = lgrad(g, -24, -48, 12, 0, [0, sar, 0.6, sar, 1, shade(sar, -28)]);
    g.beginPath();
    g.moveTo(-16, -48);
    g.quadraticCurveTo(-26, -26, -22, -4);
    g.quadraticCurveTo(-10, 3, 0, 3);
    g.quadraticCurveTo(12, 3, 22, -4);
    g.quadraticCurveTo(26, -26, 16, -48);
    g.closePath();
    g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.8; g.stroke();

    // Golden Zari hem border
    g.strokeStyle = "#f5c542"; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-20, -4); g.quadraticCurveTo(0, 2, 20, -4);
    g.stroke();

    // Torso & Blouse
    g.fillStyle = lgrad(g, -14, -76, 4, -48, [0, shade(blu, 14), 0.5, blu, 1, shade(blu, -20)]);
    g.beginPath();
    g.moveTo(-11, -76); g.lineTo(-15, -48); g.lineTo(15, -48); g.lineTo(11, -76);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Pink Dupatta draped over shoulder
    g.fillStyle = dup;
    g.beginPath();
    g.moveTo(-13, -76); g.quadraticCurveTo(-18, -60, -9, -50);
    g.lineTo(4, -47); g.quadraticCurveTo(14, -44, 11, -42);
    g.lineTo(-7, -45); g.quadraticCurveTo(-16, -56, -11, -76);
    g.closePath(); g.fill();

    // Left arm raised in gesture (speaking!)
    g.strokeStyle = skin; g.lineWidth = 4.2; g.lineCap = "round";
    g.beginPath();
    g.moveTo(-12, -68); g.quadraticCurveTo(-24, -58, -20, -42); g.stroke();
    // Left open gesturing hand
    g.fillStyle = skin;
    g.beginPath(); g.arc(-20, -40, 3.4, 0, TAU); g.fill();
    // Gold bangles on left wrist
    g.strokeStyle = "#f5c542"; g.lineWidth = 1.6;
    g.beginPath(); g.arc(-19, -44, 2.4, 0, TAU); g.stroke();

    // Right arm resting on lap
    g.strokeStyle = skin; g.lineWidth = 4.2;
    g.beginPath();
    g.moveTo(11, -68); g.quadraticCurveTo(18, -56, 12, -45); g.stroke();
    g.fillStyle = skin;
    g.beginPath(); g.arc(12, -43, 3.2, 0, TAU); g.fill();
    // Gold bangles on right wrist
    g.strokeStyle = "#f5c542"; g.lineWidth = 1.6;
    g.beginPath(); g.arc(12, -47, 2.4, 0, TAU); g.stroke();

    // Head
    g.fillStyle = skin;
    g.beginPath(); g.arc(0, -88, 11, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Hair & Bun
    g.fillStyle = dark;
    g.beginPath(); g.arc(0, -90, 10.8, Math.PI * 0.98, Math.PI * 2.02); g.fill();
    g.beginPath(); g.arc(8, -96, 5, 0, TAU); g.fill(); // bun

    // Face features
    g.fillStyle = dark;
    g.beginPath(); g.arc(-3.5, -88.5, 1.2, 0, TAU); g.arc(3.5, -88.5, 1.2, 0, TAU); g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath(); g.arc(-4, -89, 0.45, 0, TAU); g.arc(3, -89, 0.45, 0, TAU); g.fill();
    // Bindi
    g.fillStyle = "#c1272d";
    g.beginPath(); g.arc(0, -90, 1.4, 0, TAU); g.fill();
    // Warm Smile
    g.strokeStyle = "#5a2216"; g.lineWidth = 1.1;
    g.beginPath(); g.arc(0, -85.5, 2.6, 0.2, Math.PI - 0.2); g.stroke();
    // Gold Earrings
    g.fillStyle = "#f5c542";
    g.beginPath(); g.arc(-9.5, -86, 1.6, 0, TAU); g.arc(9.5, -86, 1.6, 0, TAU); g.fill();

    return c;
  }

  // 2. Meena (Left, sitting sideways on stone platform, yellow saree)
  function buildMeenaSprite(woman) {
    var W = 240, H = 300, S = 3;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.scale(S, S);
    g.translate(40, 98);

    var skin = woman.skin, dark = "#22170f", ln = "#382313";
    var sar = woman.sari, blu = woman.blouse;

    // Seated in side profile facing right
    g.fillStyle = lgrad(g, -18, -48, 14, 0, [0, sar, 0.6, sar, 1, shade(sar, -28)]);
    g.beginPath();
    g.moveTo(-14, -50);
    g.quadraticCurveTo(-22, -26, -18, -2);
    g.quadraticCurveTo(0, 4, 18, 0);
    g.quadraticCurveTo(24, -20, 16, -50);
    g.closePath();
    g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.8; g.stroke();

    // Red border on saree hem
    g.strokeStyle = "#c23b2b"; g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-16, -2); g.quadraticCurveTo(0, 3, 17, 0); g.stroke();

    // Torso
    g.fillStyle = blu;
    g.beginPath();
    g.moveTo(-10, -74); g.lineTo(-13, -50); g.lineTo(13, -50); g.lineTo(10, -74);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Red Dupatta
    g.fillStyle = "#c23b2b";
    g.beginPath();
    g.moveTo(-10, -74); g.quadraticCurveTo(-14, -60, -7, -49);
    g.lineTo(8, -48); g.quadraticCurveTo(12, -60, 9, -74);
    g.closePath(); g.fill();

    // Arms resting serenely in lap
    g.strokeStyle = skin; g.lineWidth = 4; g.lineCap = "round";
    g.beginPath();
    g.moveTo(-9, -66); g.quadraticCurveTo(-4, -54, 4, -46); g.stroke();
    g.beginPath();
    g.moveTo(9, -66); g.quadraticCurveTo(14, -56, 8, -46); g.stroke();
    g.fillStyle = skin;
    g.beginPath(); g.arc(6, -45, 3.2, 0, TAU); g.fill();

    // Head facing right
    g.fillStyle = skin;
    g.beginPath(); g.arc(2, -87, 10.5, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Hair bun with white flowers (gajra)
    g.fillStyle = dark;
    g.beginPath(); g.arc(1, -89, 10.2, Math.PI * 0.95, Math.PI * 2.05); g.fill();
    g.beginPath(); g.arc(-6, -92, 5.2, 0, TAU); g.fill(); // back bun
    // Jasmine flowers (white)
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(-7, -95, 1.8, 0, TAU);
    g.arc(-4, -96, 1.6, 0, TAU);
    g.arc(-8, -91, 1.6, 0, TAU);
    g.fill();

    // Profile eyes & smile
    g.fillStyle = dark;
    g.beginPath(); g.arc(6, -87.5, 1.2, 0, TAU); g.fill();
    g.fillStyle = "#c1272d";
    g.beginPath(); g.arc(8, -89, 1.2, 0, TAU); g.fill(); // bindi
    g.strokeStyle = "#5a2216"; g.lineWidth = 1.1;
    g.beginPath(); g.arc(5, -84.5, 2.2, 0.1, Math.PI * 0.8); g.stroke();

    return c;
  }

  // 3. Kavita (Front center, blue school uniform student)
  function buildKavitaSprite(woman) {
    var W = 240, H = 300, S = 3;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.scale(S, S);
    g.translate(40, 98);

    var skin = woman.skin, dark = "#22170f", ln = "#382313";
    var sar = woman.sari; // deep school blue

    // Blue school uniform skirt / folded legs
    g.fillStyle = lgrad(g, -22, -48, 10, 0, [0, sar, 0.7, sar, 1, shade(sar, -30)]);
    g.beginPath();
    g.moveTo(-15, -48);
    g.quadraticCurveTo(-24, -26, -18, -2);
    g.quadraticCurveTo(0, 3, 18, -2);
    g.quadraticCurveTo(24, -26, 15, -48);
    g.closePath();
    g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.8; g.stroke();

    // School Kurti Torso
    g.fillStyle = sar;
    g.beginPath();
    g.moveTo(-11, -74); g.lineTo(-14, -48); g.lineTo(14, -48); g.lineTo(11, -74);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Crisp White Collar
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(-6, -74); g.lineTo(0, -66); g.lineTo(6, -74);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.2; g.stroke();

    // Arms listening attentively
    g.strokeStyle = skin; g.lineWidth = 3.8; g.lineCap = "round";
    g.beginPath();
    g.moveTo(-10, -66); g.quadraticCurveTo(-14, -54, -6, -46); g.stroke();
    g.beginPath();
    g.moveTo(10, -66); g.quadraticCurveTo(14, -54, 6, -46); g.stroke();
    g.fillStyle = skin;
    g.beginPath(); g.arc(0, -45, 3.2, 0, TAU); g.fill();

    // Head
    g.fillStyle = skin;
    g.beginPath(); g.arc(0, -86, 10, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Dark hair & Ponytail with blue hair ribbon
    g.fillStyle = dark;
    g.beginPath(); g.arc(0, -88, 9.8, Math.PI * 0.95, Math.PI * 2.05); g.fill();
    // Ponytail trailing down side
    g.beginPath();
    g.quadraticCurveTo(10, -94, 12, -84);
    g.quadraticCurveTo(16, -76, 14, -70);
    g.quadraticCurveTo(11, -72, 8, -82);
    g.closePath(); g.fill();

    // Blue Hair Ribbon
    g.fillStyle = "#3b6bb0";
    g.beginPath(); g.arc(9, -89, 2.2, 0, TAU); g.fill();

    // Young attentive eyes & smile
    g.fillStyle = dark;
    g.beginPath(); g.arc(-3, -86.5, 1.1, 0, TAU); g.arc(3, -86.5, 1.1, 0, TAU); g.fill();
    g.strokeStyle = "#5a2216"; g.lineWidth = 1;
    g.beginPath(); g.arc(0, -83.5, 2, 0.2, Math.PI - 0.2); g.stroke();

    return c;
  }

  // 4. Savitri (Right on rug, forest green saree with pallu over head)
  function buildSavitriSprite(woman) {
    var W = 240, H = 300, S = 3;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.scale(S, S);
    g.translate(40, 98);

    var skin = woman.skin, dark = "#22170f", ln = "#382313";
    var sar = woman.sari; // forest green

    // Seated green saree skirt
    g.fillStyle = lgrad(g, -20, -48, 12, 0, [0, sar, 0.6, sar, 1, shade(sar, -28)]);
    g.beginPath();
    g.moveTo(-15, -48);
    g.quadraticCurveTo(-24, -26, -18, -2);
    g.quadraticCurveTo(0, 3, 18, -2);
    g.quadraticCurveTo(24, -26, 15, -48);
    g.closePath();
    g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.8; g.stroke();

    // Gold zari hem border
    g.strokeStyle = "#f5c542"; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-17, -2); g.quadraticCurveTo(0, 2.5, 17, -2); g.stroke();

    // Torso
    g.fillStyle = sar;
    g.beginPath();
    g.moveTo(-11, -74); g.lineTo(-14, -48); g.lineTo(14, -48); g.lineTo(11, -74);
    g.closePath(); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.6; g.stroke();

    // Traditional Pallu draped over head & shoulders
    g.fillStyle = sar;
    g.beginPath();
    g.arc(0, -88, 13, Math.PI * 0.8, Math.PI * 2.2);
    g.lineTo(14, -58);
    g.lineTo(-14, -58);
    g.closePath();
    g.fill();
    g.strokeStyle = "#d4a017"; g.lineWidth = 1.8; g.stroke();

    // Arms resting on knees with gold bangles
    g.strokeStyle = skin; g.lineWidth = 4; g.lineCap = "round";
    g.beginPath();
    g.moveTo(-10, -66); g.quadraticCurveTo(-15, -54, -9, -46); g.stroke();
    g.beginPath();
    g.moveTo(10, -66); g.quadraticCurveTo(15, -54, 9, -46); g.stroke();
    g.fillStyle = skin;
    g.beginPath(); g.arc(-8, -44, 3, 0, TAU); g.arc(8, -44, 3, 0, TAU); g.fill();
    // Bangles
    g.strokeStyle = "#f5c542"; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-9, -48, 2.2, 0, TAU); g.arc(9, -48, 2.2, 0, TAU); g.stroke();

    // Head inside pallu
    g.fillStyle = skin;
    g.beginPath(); g.arc(0, -86, 9.5, 0, TAU); g.fill();
    g.strokeStyle = ln; g.lineWidth = 1.4; g.stroke();

    // Face features
    g.fillStyle = dark;
    g.beginPath(); g.arc(-3, -86.5, 1.1, 0, TAU); g.arc(3, -86.5, 1.1, 0, TAU); g.fill();
    g.fillStyle = "#c1272d";
    g.beginPath(); g.arc(0, -88, 1.3, 0, TAU); g.fill(); // bindi
    g.strokeStyle = "#5a2216"; g.lineWidth = 1.1;
    g.beginPath(); g.arc(0, -83.5, 2.4, 0.2, Math.PI - 0.2); g.stroke();

    return c;
  }

  function buildSprite(woman) {
    if (woman.idx === 0) return buildRadhaSprite(woman);
    if (woman.idx === 1) return buildMeenaSprite(woman);
    if (woman.idx === 2) return buildKavitaSprite(woman);
    return buildSavitriSprite(woman);
  }

  /* ---------- VillageWoman Entity ---------- */
  function VillageWoman(zone, idx, x, y) {
    var def = (window.V_DIALOGUE && window.V_DIALOGUE.women[idx]) || {};
    this.zone = zone;
    this.idx = idx;
    this.x = x;
    this.y = y;
    this.name = def.name || "Village Didi";
    this.role = def.role || "";
    this.sari = def.sari || "#c23b6b";
    this.blouse = def.blouse || "#992255";
    this.skin = def.skin || "#c68a56";
    this.dupatta = def.dupatta || this.sari;
    this.zbase = 3;
    this.waveUntil = 0;
    this.talkUntil = 0;
    this.seed = Math.random() * 6.28;
    this.W = 84;
    this.H = 105; // world size

    this.sprite = buildSprite(this);
    this.portrait = document.createElement("canvas");
    this.portrait.width = 96;
    this.portrait.height = 96;
    paintPortrait(this.portrait, this);
  }

  VillageWoman.prototype.z = function () { return this.zbase; };

  VillageWoman.prototype.hit = function (px, py) {
    return Math.abs(px - this.x) < 38 && Math.abs(py - this.y) < 50;
  };

  VillageWoman.prototype.wave = function () { this.waveUntil = now() + 1400; };
  VillageWoman.prototype.talking = function () { this.talkUntil = now() + 400; };

  VillageWoman.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, syy = this.y - cam.y;
    if (sx < -160 || sx > 1440 || syy < -180 || syy > 920) return;

    var t = now();
    var bob = Math.sin(t / 950 + this.seed) * 1.5;
    var hop = t < this.talkUntil ? Math.sin(t / 120) * 2.2 : 0;
    var y = syy - bob + hop;
    var tilt = Math.sin(t / 2200 + this.seed) * 0.04;

    ctx.save();
    ctx.translate(sx, y);
    ctx.rotate(tilt);
    ctx.drawImage(this.sprite, -this.W / 2, -this.H + 4, this.W, this.H);
    ctx.restore();

    // Name badge on hover / interaction
    var tag = this.name;
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    var tw = ctx.measureText(tag).width + 14;
    ctx.fillStyle = "rgba(40, 25, 12, 0.88)";
    rr(ctx, sx - tw / 2, syy - this.H - 12, tw, 18, 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(tag, sx, syy - this.H + 1);
    ctx.textAlign = "start";
    ctx.strokeStyle = "rgba(255, 230, 160, 0.65)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - tw / 2, syy - this.H - 12, tw, 18, 6);
    ctx.stroke();

    // Talking speech indicator
    if (t < this.talkUntil) {
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("💬", sx + 18, syy - this.H - 4);
    }

    // Active selection golden halo
    if (this.zone && this.zone.activeWoman === this) {
      ctx.strokeStyle = "#ffd34d";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(sx, syy + 4, 26, 8, 0, 0, TAU);
      ctx.stroke();
    }
  };

  /* ---------- Sleeping Ginger Tabby Cat on Stone Platform (Mintu) ---------- */
  function VCat(zone, x, y) {
    this.zone = zone;
    this.x = x;
    this.y = y;
    this.zbase = 2.2;
    this.seed = Math.random() * 6.28;
    this.mewUntil = 0;
  }

  VCat.prototype.z = function () { return this.zbase; };
  VCat.prototype.talking = function () { this.mewUntil = now() + 1400; };
  VCat.prototype.hit = function (px, py) {
    return Math.abs(px - this.x) < 32 && Math.abs(py - this.y) < 26;
  };

  VCat.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    if (sx < -60 || sx > 1440 || sy < -60 || sy > 920) return;
    var t = now();

    // Gentle breathing rise and fall
    var breath = Math.sin(t / 800 + this.seed) * 1.2;

    ctx.save();

    // Drop shadow on stone platform
    ctx.fillStyle = "rgba(40, 30, 20, 0.35)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 10, 26, 11, 0, 0, TAU);
    ctx.fill();

    // Curled Ginger Body
    var bodyGrad = ctx.createRadialGradient(sx - 2, sy - 2, 4, sx, sy, 22);
    bodyGrad.addColorStop(0, "#f5a042");
    bodyGrad.addColorStop(0.7, "#e68424");
    bodyGrad.addColorStop(1, "#b85d14");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(sx, sy + breath * 0.5, 22, 14 + breath * 0.5, -0.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#5a2d0a";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // White chest and tucked tummy
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy + 3, 11, 7, 0.2, 0, TAU);
    ctx.fill();

    // Tabby Orange Stripes
    ctx.strokeStyle = "#a84e0e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy - 6); ctx.lineTo(sx - 5, sy - 1);
    ctx.moveTo(sx - 4, sy - 8); ctx.lineTo(sx, sy - 2);
    ctx.moveTo(sx + 4, sy - 8); ctx.lineTo(sx + 5, sy - 3);
    ctx.stroke();

    // Curled Tail wrapping around body
    ctx.strokeStyle = "#e68424";
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx - 18, sy + 2);
    ctx.quadraticCurveTo(sx - 24, sy + 12, sx - 12, sy + 12);
    ctx.stroke();
    // White tail tip
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(sx - 16, sy + 12);
    ctx.lineTo(sx - 10, sy + 12);
    ctx.stroke();

    // Cat Head resting on paws
    ctx.fillStyle = "#f5a042";
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy - 2, 10, 9, 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#5a2d0a";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Triangular Sleeping Ears
    ctx.fillStyle = "#e68424";
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy - 9); ctx.lineTo(sx + 12, sy - 17); ctx.lineTo(sx + 17, sy - 9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f8b7b7"; // inner pink ear
    ctx.beginPath();
    ctx.moveTo(sx + 11.5, sy - 9.5); ctx.lineTo(sx + 13, sy - 15); ctx.lineTo(sx + 16, sy - 9.5);
    ctx.closePath(); ctx.fill();

    // Tucked White Paws
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(sx + 11, sy + 7, 5, 3.5, 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#5a2d0a"; ctx.lineWidth = 1; ctx.stroke();

    // Closed Sleeping Eyes (∪ ∪) & Pink Nose
    ctx.strokeStyle = "#4a2408";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(sx + 14, sy - 1, 2, 0.2, Math.PI - 0.2); // closed eye 1
    ctx.arc(sx + 18, sy - 2, 2, 0.2, Math.PI - 0.2); // closed eye 2
    ctx.stroke();
    ctx.fillStyle = "#f8a0a0";
    ctx.beginPath();
    ctx.arc(sx + 19, sy + 2, 1.2, 0, TAU); // nose
    ctx.fill();

    // Sleeping "Zzz" or Purring Hearts
    if (t < this.mewUntil) {
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#e64a4a";
      ctx.textAlign = "center";
      ctx.fillText("❤️", sx + 16, sy - 20 - Math.sin((t % 1000) / 1000 * Math.PI) * 8);
    } else {
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.textAlign = "center";
      ctx.fillText("z", sx + 18, sy - 12 - Math.sin(t / 800) * 3);
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText("z", sx + 23, sy - 18 - Math.sin(t / 800) * 4);
    }

    ctx.restore();
  };

  /* ---------- Approach Wayfinding Signs ---------- */
  function VWaySign(zone, x, y, text) {
    this.zone = zone; this.x = x; this.y = y; this.text = text || "Village Chaupal \u2192";
    this.zbase = 1.5; this.talkUntil = 0;
  }
  VWaySign.prototype.z = function () { return this.zbase; };
  VWaySign.prototype.hit = function (px, py) {
    return Math.abs(px - this.x) < 32 && Math.abs(py - this.y) < 28;
  };
  VWaySign.prototype.talk = function () { this.talkUntil = now() + 2400; };
  VWaySign.prototype.render = function (ctx, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    if (sx < -80 || sx > 1440 || sy < -80 || sy > 920) return;

    // Wooden post
    ctx.fillStyle = "#5c3d23";
    ctx.fillRect(sx - 4, sy - 34, 8, 34);

    // Carved arrow sign
    ctx.fillStyle = "#9c6d3d";
    ctx.strokeStyle = "#3d2713";
    ctx.lineWidth = 2.2;
    rr(ctx, sx - 44, sy - 48, 88, 26, 5);
    ctx.stroke();

    ctx.fillStyle = "#ffeedb";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.text, sx, sy - 31.5);
    ctx.textAlign = "start";
  };

  window.CC_V = {
    VillageWoman: VillageWoman,
    VCat: VCat,
    VWaySign: VWaySign,
    paintPortrait: paintPortrait,
    shade: shade,
    lgrad: lgrad,
    rgrad: rgrad,
    rr: rr
  };
})();
