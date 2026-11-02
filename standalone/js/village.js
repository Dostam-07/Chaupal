/* Village Chaupal — banyan tree gathering.
   Figure art (women, cat, portraits, wayfinding signs) lives in village-art.js.
   Part 2: VillageZone — geometry, tree/mat/pot rendering, entity assembly. */
(function () {
  if (window.VillageZone) return;
  var U = window.U || {};
  var TAU = 6.2831853;
  function now() { return U.now ? U.now() : performance.now(); }

  /* Campground world location: east meadow near (6100, 1950) */
  var ZONE = {
    tx: 6100, ty: 1870,          // tree center (top of trunk / canopy anchor)
    matX: 6185, matY: 2000,      // mat center
    matW: 260, matH: 140,        // mat world size
    pot: [6055, 2015],           // matka (water pot)
    cat: [6025, 1960],           // cat on stone platform
    sign: [6045, 1910],          // wooden sign on tree trunk
    signs: [                     // wayfinding signs on the west approach (arrow points east)
      [5720, 2000], [5900, 2060]
    ],
    women: [
      [6165, 1980], // 0: Radha Devi (Center, Pink saree, cross-legged on rug)
      [6085, 1965], // 1: Meena (Left, Yellow saree, seated on stone platform)
      [6195, 2045], // 2: Kavita (Front, Blue school uniform student)
      [6265, 1995]  // 3: Savitri (Right, Green saree)
    ]
  };

  function VillageZone(game) {
    this.game = game;
    this.tree = { x: ZONE.tx, y: ZONE.ty };
    this.activeWoman = null;
    this.ready = false;
    this.buildEntities();
  }

  VillageZone.prototype.reset = function () { this.buildEntities(); };

  VillageZone.prototype.buildEntities = function () {
    var self = this;
    this.women = [];
    var defs = window.V_DIALOGUE.women || [];
    ZONE.women.forEach(function (pt, i) {
      if (i < defs.length) self.women.push(new CC_V.VillageWoman(self, i, pt[0], pt[1]));
    });
    this.cat = new CC_V.VCat(this, ZONE.cat[0], ZONE.cat[1]);
    // wayfinding signs on the approach path (pointing east toward the tree)
    this.signs = [];
    if (window.CC_V && CC_V.VWaySign) {
      ZONE.signs.forEach(function (pt) {
        self.signs.push(new CC_V.VWaySign(self, pt[0], pt[1], "Village Chaupal \u2192"));
      });
    }
    this.ready = true;
    if (window.VUI) VUI.init(this);
  };

  /* distance from player to tree (world) */
  VillageZone.prototype.dist = function () {
    var p = this.game.player || { x: 0, y: 0 };
    return Math.sqrt((p.x - this.tree.x) * (p.x - this.tree.x) + (p.y - this.tree.y) * (p.y - this.tree.y));
  };

  VillageZone.prototype.entities = function () {
    var arr = this.women.slice();
    arr.push(this.cat);
    if (this.signs) arr = arr.concat(this.signs);
    return arr;
  };

  VillageZone.prototype.pick = function (wx, wy) {
    for (var i = 0; i < this.women.length; i++) if (this.women[i].hit(wx, wy)) return this.women[i];
    if (this.cat.hit(wx, wy)) return this.cat;
    if (this.signs) {
      for (var si = 0; si < this.signs.length; si++) if (this.signs[si].hit(wx, wy)) return this.signs[si];
    }
    // Also if player clicks near the gathering circle / banyan tree mat:
    var dx = wx - ZONE.matX, dy = wy - ZONE.matY;
    if (dx * dx + dy * dy < 135 * 135) {
      return this.women[0] || null; // clicks on gathering talk to Radha Devi
    }
    return null;
  };

  /* ---------- ground pass: shadow, stone chabutara, dhurrie rug, pot, trunk ---------- */
  VillageZone.prototype.renderGround = function (ctx, cam) {
    var sx = this.tree.x - cam.x, sy = this.tree.y - cam.y;

    // 1. Dappled canopy ground shadow
    ctx.save();
    var sh = ctx.createRadialGradient(sx, sy + 70, 40, sx, sy + 70, 360);
    sh.addColorStop(0, "rgba(22, 35, 12, 0.32)");
    sh.addColorStop(0.7, "rgba(22, 35, 12, 0.18)");
    sh.addColorStop(1, "rgba(22, 35, 12, 0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 70, 360, 220, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 2. Circular Stone Chabutara (platform around tree base)
    this.renderStonePlatform(ctx, sx, sy);

    // 3. Handwoven Dhurrie Rug (red and coral geometric pattern)
    this.renderDhurrie(ctx, cam);

    // 4. Matka (earthen water pot)
    this.renderMatka(ctx, cam);

    // 5. Tree trunk and aerial prop roots
    this.renderTrunk(ctx, cam);
  };

  /* Raised circular stone platform (Chabutara) encircling the banyan trunk */
  VillageZone.prototype.renderStonePlatform = function (ctx, sx, sy) {
    var px = sx - 35, py = sy + 65;
    ctx.save();
    // Drop shadow under platform
    ctx.fillStyle = "rgba(10, 15, 6, 0.35)";
    ctx.beginPath();
    ctx.ellipse(px + 4, py + 14, 118, 54, 0, 0, TAU);
    ctx.fill();

    // Platform riser (stone wall thickness)
    ctx.fillStyle = "#6d6257";
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 115, 50, 0, 0, Math.PI);
    ctx.lineTo(px - 115, py);
    ctx.ellipse(px, py, 115, 50, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#463d35";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Platform top surface (smooth paved stone)
    var topGrad = ctx.createRadialGradient(px, py, 10, px, py, 120);
    topGrad.addColorStop(0, "#c5b8a9");
    topGrad.addColorStop(0.8, "#9e9182");
    topGrad.addColorStop(1, "#7d7164");
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, 115, 50, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#463d35";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Stone tile mortar seams
    ctx.strokeStyle = "rgba(70, 61, 53, 0.4)";
    ctx.lineWidth = 1.4;
    for (var a = 0; a < 6; a++) {
      var ang = -Math.PI * 0.85 + a * (Math.PI * 0.34);
      var x1 = px + Math.cos(ang) * 35;
      var y1 = py + Math.sin(ang) * 16;
      var x2 = px + Math.cos(ang) * 114;
      var y2 = py + Math.sin(ang) * 49;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    // Concentric ring on platform
    ctx.beginPath();
    ctx.ellipse(px, py, 72, 31, 0, 0, TAU);
    ctx.stroke();

    // Highlight on top outer rim
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(px, py - 1, 113, 48, 0, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();

    ctx.restore();
  };

  /* Traditional Indian Dhurrie Rug (handwoven geometric pattern in terracotta & cream) */
  VillageZone.prototype.renderDhurrie = function (ctx, cam) {
    var mx = ZONE.matX - cam.x, my = ZONE.matY - cam.y;
    var w = ZONE.matW, h = ZONE.matH;
    ctx.save();

    // Soft drop shadow
    ctx.fillStyle = "rgba(20, 25, 10, 0.28)";
    ctx.beginPath();
    ctx.ellipse(mx, my + 6, w / 2 + 6, h / 2 + 5, 0, 0, TAU);
    ctx.fill();

    // Main rug field (terracotta / brick red)
    ctx.fillStyle = "#a8392d";
    this.rr(ctx, mx - w / 2, my - h / 2, w, h, 14);
    ctx.fill();

    // Outer border (coral & cream)
    ctx.strokeStyle = "#4a1813";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.strokeStyle = "#e8c99e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.rr(ctx, mx - w / 2 + 8, my - h / 2 + 8, w - 16, h - 16, 10);
    ctx.stroke();

    ctx.strokeStyle = "#d95c47";
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.rr(ctx, mx - w / 2 + 14, my - h / 2 + 14, w - 28, h - 28, 8);
    ctx.stroke();

    // Inner diamond motif
    ctx.fillStyle = "rgba(240, 215, 175, 0.35)";
    ctx.beginPath();
    ctx.moveTo(mx, my - h / 2 + 22);
    ctx.lineTo(mx + w / 2 - 32, my);
    ctx.lineTo(mx, my + h / 2 - 22);
    ctx.lineTo(mx - w / 2 + 32, my);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffeedb";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central concentric diamond medallion
    ctx.fillStyle = "#c74a38";
    ctx.beginPath();
    ctx.moveTo(mx, my - 24);
    ctx.lineTo(mx + 38, my);
    ctx.lineTo(mx, my + 24);
    ctx.lineTo(mx - 38, my);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffd89e";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Woven horizontal weave texture lines
    ctx.strokeStyle = "rgba(70, 20, 15, 0.22)";
    ctx.lineWidth = 1.2;
    for (var k = -4; k <= 4; k++) {
      var ly = my + k * 13;
      ctx.beginPath();
      ctx.moveTo(mx - w / 2 + 16, ly);
      ctx.lineTo(mx + w / 2 - 16, ly);
      ctx.stroke();
    }

    // Fringe tassels on left and right borders
    ctx.strokeStyle = "#f3e0c4";
    ctx.lineWidth = 1.6;
    for (var f = 0; f < 9; f++) {
      var fy = my - h / 2 + 14 + f * 14;
      // Left fringes
      ctx.beginPath();
      ctx.moveTo(mx - w / 2, fy);
      ctx.lineTo(mx - w / 2 - 6, fy + (f % 2 ? 1 : -1));
      ctx.stroke();
      // Right fringes
      ctx.beginPath();
      ctx.moveTo(mx + w / 2, fy);
      ctx.lineTo(mx + w / 2 + 6, fy + (f % 2 ? -1 : 1));
      ctx.stroke();
    }

    ctx.restore();
  };

  /* Matka (earthen water pot) */
  VillageZone.prototype.renderMatka = function (ctx, cam) {
    var px = ZONE.pot[0] - cam.x, py = ZONE.pot[1] - cam.y;
    ctx.save();
    // Drop shadow
    ctx.fillStyle = "rgba(20, 15, 8, 0.35)";
    ctx.beginPath();
    ctx.ellipse(px + 2, py + 14, 15, 7, 0, 0, TAU);
    ctx.fill();

    // Clay pot belly
    var potGrad = ctx.createRadialGradient(px - 4, py - 4, 3, px, py, 18);
    potGrad.addColorStop(0, "#c96c4b");
    potGrad.addColorStop(0.7, "#a84e2f");
    potGrad.addColorStop(1, "#6b2c16");
    ctx.fillStyle = potGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, 16, 17, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#4a1f10";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Traditional white painted spiral rings
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(px, py - 2, 13, 5, 0, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(px, py + 4, 12, 4.5, 0, 0, Math.PI);
    ctx.stroke();

    // Pot neck and rim
    ctx.fillStyle = "#8a391e";
    ctx.beginPath();
    ctx.ellipse(px, py - 16, 8, 3.5, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Folded white cotton cloth over mouth
    ctx.fillStyle = "#f8f5ee";
    ctx.strokeStyle = "#c5baa8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    this.rr(ctx, px - 9, py - 19, 18, 7, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  /* Ancient Banyan trunk, bark grain, and prop roots */
  VillageZone.prototype.renderTrunk = function (ctx, cam) {
    var sx = this.tree.x - cam.x, sy = this.tree.y - cam.y;
    ctx.save();

    // Thick buttress roots plunging into stone platform
    ctx.fillStyle = "#5c3d23";
    ctx.strokeStyle = "#382313";
    ctx.lineWidth = 2.4;

    // Left buttress root
    ctx.beginPath();
    ctx.moveTo(sx - 26, sy + 65);
    ctx.quadraticCurveTo(sx - 48, sy + 88, sx - 72, sy + 95);
    ctx.quadraticCurveTo(sx - 52, sy + 74, sx - 32, sy + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right buttress root
    ctx.beginPath();
    ctx.moveTo(sx + 24, sy + 65);
    ctx.quadraticCurveTo(sx + 46, sy + 88, sx + 68, sy + 94);
    ctx.quadraticCurveTo(sx + 48, sy + 74, sx + 28, sy + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Main gnarled trunk
    var trunkGrad = ctx.createLinearGradient(sx - 36, sy, sx + 36, sy);
    trunkGrad.addColorStop(0, "#482f1b");
    trunkGrad.addColorStop(0.3, "#6b472a");
    trunkGrad.addColorStop(0.7, "#7a5231");
    trunkGrad.addColorStop(1, "#3e2716");
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(sx - 34, sy + 70);
    ctx.quadraticCurveTo(sx - 26, sy + 15, sx - 22, sy - 15);
    ctx.lineTo(sx + 22, sy - 15);
    ctx.quadraticCurveTo(sx + 26, sy + 15, sx + 34, sy + 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#382313";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Deep organic bark fissures and hollows
    ctx.strokeStyle = "rgba(40, 24, 12, 0.75)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx - 14, sy - 5);
    ctx.quadraticCurveTo(sx - 8, sy + 25, sx - 12, sy + 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy);
    ctx.quadraticCurveTo(sx + 6, sy + 30, sx + 8, sy + 62);
    ctx.stroke();

    // Tree knot / hollow
    ctx.fillStyle = "#2c1a0e";
    ctx.beginPath();
    ctx.ellipse(sx - 2, sy + 32, 5, 8, 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#5a3a20";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wooden Signboard nailed to trunk: "Learn • Listen • Support ❤️"
    var signX = sx - 60, signY = sy + 35;
    ctx.fillStyle = "rgba(20, 15, 8, 0.35)";
    ctx.beginPath();
    this.rr(ctx, signX - 2, signY - 2, 58, 62, 5);
    ctx.fill();

    // Wood board
    var signGrad = ctx.createLinearGradient(signX, signY, signX + 54, signY + 58);
    signGrad.addColorStop(0, "#9c6d3d");
    signGrad.addColorStop(1, "#734e29");
    ctx.fillStyle = signGrad;
    ctx.beginPath();
    this.rr(ctx, signX, signY, 54, 58, 4);
    ctx.fill();
    ctx.strokeStyle = "#3d2713";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Iron corner nails
    ctx.fillStyle = "#2a1c10";
    ctx.beginPath();
    ctx.arc(signX + 5, signY + 5, 1.6, 0, TAU);
    ctx.arc(signX + 49, signY + 5, 1.6, 0, TAU);
    ctx.arc(signX + 5, signY + 53, 1.6, 0, TAU);
    ctx.arc(signX + 49, signY + 53, 1.6, 0, TAU);
    ctx.fill();

    // Sign text
    ctx.fillStyle = "#ffeedb";
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Learn", signX + 27, signY + 16);
    ctx.fillText("• Listen", signX + 27, signY + 28);
    ctx.fillText("• Support", signX + 27, signY + 40);
    ctx.fillStyle = "#e64a4a";
    ctx.fillText("❤️", signX + 27, signY + 52);
    ctx.textAlign = "start";

    ctx.restore();
  };

  /* ---------- canopy pass: leaves + hanging lantern + aerial roots (above player) ---------- */
  VillageZone.prototype.renderCanopy = function (ctx, cam) {
    var sx = this.tree.x - cam.x, sy = this.tree.y - cam.y;
    if (sx < -420 || sx > 1440 || sy < -420 || sy > 920) return;
    var t = now();
    var sway = Math.sin(t / 2400) * 3;

    ctx.save();

    // Main heavy boughs spreading outward
    ctx.strokeStyle = "#5a3a22";
    ctx.lineCap = "round";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 15);
    ctx.quadraticCurveTo(sx - 60 + sway, sy - 75, sx - 170 + sway, sy - 105);
    ctx.stroke();
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 15);
    ctx.quadraticCurveTo(sx + 55 + sway, sy - 70, sx + 165 + sway, sy - 98);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, sy - 15);
    ctx.quadraticCurveTo(sx + 10 + sway, sy - 95, sx - 25 + sway, sy - 165);
    ctx.stroke();

    // Hanging aerial roots descending from boughs
    ctx.strokeStyle = "rgba(90, 60, 35, 0.85)";
    ctx.lineWidth = 2.4;
    var roots = [-140, -95, -45, 45, 95, 140];
    for (var r = 0; r < roots.length; r++) {
      var rx = sx + roots[r] + sway * (r % 2 ? 1 : -1);
      var ry = sy - 85 - Math.abs(roots[r]) * 0.15;
      var targetY = sy + 60 + (r % 2) * 25;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + (r % 2 ? 6 : -6), ry + (targetY - ry) * 0.5, rx + (r % 3 - 1) * 4, targetY);
      ctx.stroke();
    }

    // Lush foliage clusters (layered emerald, sage, and golden greens)
    var foliage = [
      [0, -130, 175, "#2d6325"],
      [-155, -85, 145, "#3b7a32"],
      [160, -80, 140, "#336d2b"],
      [-75, -180, 125, "#488c3d"],
      [85, -178, 120, "#3e8035"],
      [-235, -45, 105, "#2d6325"],
      [240, -42, 100, "#3a7731"],
      [-105, -115, 110, "#488c3d"],
      [110, -112, 105, "#428237"]
    ];

    for (var i = 0; i < foliage.length; i++) {
      var gx = sx + foliage[i][0] + sway * (i % 2 ? 1 : -1);
      var gy = sy + foliage[i][1];
      var rad = foliage[i][2];
      ctx.fillStyle = foliage[i][3];
      ctx.beginPath();
      ctx.arc(gx, gy, rad, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#1d4517";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Dappled sun highlights on canopy tops
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.arc(sx - 45 - sway, sy - 215, 60, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 95 + sway, sy - 180, 50, 0, TAU);
    ctx.fill();

    // Hanging Ornate Brass Lantern over the gathering
    var lx = sx + 88 + sway, ly = sy - 90;
    // Chain
    ctx.strokeStyle = "#2e1e12";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly + 52);
    ctx.stroke();

    // Brass Lantern Cap & Frame
    ctx.fillStyle = "#8c622d";
    ctx.strokeStyle = "#473014";
    ctx.lineWidth = 2;
    this.rr(ctx, lx - 13, ly + 50, 26, 9, 3);
    ctx.fill();
    ctx.stroke();

    // Lantern Glass Chamber
    var glassGrad = ctx.createLinearGradient(lx - 10, ly + 59, lx + 10, ly + 79);
    glassGrad.addColorStop(0, "#ffe885");
    glassGrad.addColorStop(0.5, "#ffb834");
    glassGrad.addColorStop(1, "#e67e22");
    ctx.fillStyle = glassGrad;
    this.rr(ctx, lx - 10, ly + 59, 20, 22, 5);
    ctx.fill();
    ctx.stroke();

    // Pulsing Radiant Golden Light Aura
    var pulse = 0.85 + Math.sin(t / 800) * 0.15;
    var glow = ctx.createRadialGradient(lx, ly + 70, 2, lx, ly + 70, 160 * pulse);
    glow.addColorStop(0, "rgba(255, 220, 110, 0.45)");
    glow.addColorStop(0.35, "rgba(255, 180, 50, 0.22)");
    glow.addColorStop(1, "rgba(255, 160, 40, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly + 70, 160 * pulse, 0, TAU);
    ctx.fill();

    // Lantern Base
    ctx.fillStyle = "#8c622d";
    this.rr(ctx, lx - 11, ly + 81, 22, 6, 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  VillageZone.prototype.rr = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  /* ---------- map-lifecycle helpers (UI in village-ui.js via VUI) ---------- */
  VillageZone.prototype.update = function () {
    if (window.VUI) VUI.frame(this);
  };
  VillageZone.prototype.hide = function () {
    if (window.VUI) VUI.hideAll();
  };

  window.VillageZone = VillageZone;
  window.CC_VZ = ZONE;
})();
