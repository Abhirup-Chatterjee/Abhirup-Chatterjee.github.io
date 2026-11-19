/* Proofs without words: each picture is an inline SVG coloured with the
   site's CSS variables, so it follows the light/dark theme automatically.
   A proof is a list of steps; every shape says at which step it appears
   (in), disappears (out) and where it sits (tf: step -> CSS transform). */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = {
    plus: "fill:var(--plus)", acc: "fill:var(--accent)", zero: "fill:var(--zero)",
    ink: "fill:var(--ink)", none: "fill:none", card: "fill:var(--card)"
  };
  var CELL = ";stroke:var(--card);stroke-width:1.6";
  var LINE = "fill:none;stroke:var(--ink);stroke-width:1.6";
  var DASH = LINE + ";stroke-dasharray:5 4";

  function Builder(svg) { this.svg = svg; this.items = []; }
  Builder.prototype.add = function (tag, attrs, style, o, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (style) el.setAttribute("style", style);
    o = o || {};
    (parent || this.svg).appendChild(el);
    var it = { el: el, a: o.in || 0, b: o.out == null ? 1e9 : o.out, tf: o.tf };
    if (o.tf) { el.style.transformBox = "view-box"; el.style.transformOrigin = o.origin || "0px 0px"; }
    if (o.in || o.out != null || o.tf) this.items.push(it);
    return el;
  };
  Builder.prototype.g = function (o, parent) { return this.add("g", {}, "", o, parent); };
  Builder.prototype.rect = function (x, y, w, h, style, o, p) { return this.add("rect", { x: x, y: y, width: w, height: h }, style, o, p); };
  Builder.prototype.poly = function (pts, style, o, p) { return this.add("polygon", { points: pts.map(function (q) { return q[0] + "," + q[1]; }).join(" ") }, style, o, p); };
  Builder.prototype.line = function (x1, y1, x2, y2, style, o, p) { return this.add("line", { x1: x1, y1: y1, x2: x2, y2: y2 }, style || LINE, o, p); };
  Builder.prototype.path = function (d, style, o, p) { return this.add("path", { d: d }, style || LINE, o, p); };
  Builder.prototype.circle = function (x, y, r, style, o, p) { return this.add("circle", { cx: x, cy: y, r: r }, style, o, p); };
  Builder.prototype.text = function (x, y, s, o, opt, p) {
    opt = opt || {};
    var el = this.add("text", { x: x, y: y, "text-anchor": opt.anchor || "middle", "dominant-baseline": "middle" },
      "font-family:var(--f-mono);font-size:" + (opt.size || 12) + "px;fill:" + (opt.color || "var(--ink)") + (opt.weight ? ";font-weight:" + opt.weight : "") + (opt.italic ? ";font-style:italic;font-family:var(--f-display)" : ""), o, p);
    el.textContent = s;
    return el;
  };

  /* ------------------------------------------------------------------ */
  var P = {};

  P["odd-squares"] = { w: 320, h: 330, steps: 7, alt: "Odd numbers added as L-shaped borders build up a 6 by 6 square.",
    build: function (B) {
      var u = 40, ox = 40, oy = 26, n = 6;
      for (var k = 1; k <= n; k++) {
        var st = (k % 2 ? C.plus : C.acc) + CELL;
        for (var i = 0; i < k; i++) for (var j = 0; j < k; j++) {
          if (Math.max(i, j) !== k - 1) continue;
          B.rect(ox + i * u, oy + j * u, u, u, st, { in: k - 1 });
        }
        B.text(ox + (k - .5) * u, oy + (k - .5) * u, String(2 * k - 1), { in: k - 1 }, { color: "var(--card)", size: 14, weight: 600 });
      }
      B.text(160, 305, "1 + 3 + 5 + 7 + 9 + 11 = 6²", { in: 6 }, { size: 14 });
    } };

  P["triangular"] = { w: 320, h: 330, steps: 4, alt: "Two staircases of 1 to 6 cells fit together into a 6 by 7 rectangle.",
    build: function (B) {
      var u = 36, ox = 34, oy = 40, n = 6, r, c;
      var A = B.g({});
      for (r = 0; r < n; r++) for (c = 0; c <= r; c++) B.rect(ox + c * u, oy + r * u, u, u, C.plus + CELL, null, A);
      var G = B.g({ in: 1, tf: { 1: "translate(18px,-26px)", 2: "translate(0px,0px)" } });
      for (r = 0; r < n; r++) for (c = r + 1; c <= n; c++) B.rect(ox + c * u, oy + r * u, u, u, C.acc + CELL, null, G);
      B.text(ox - 14, oy + 3 * u, "6", { in: 3 }, { size: 13 });
      B.text(ox + 3.5 * u, oy + 6 * u + 16, "7", { in: 3 }, { size: 13 });
      B.text(160, 310, "2 · (1 + 2 + ⋯ + 6) = 6 · 7", { in: 3 }, { size: 14 });
    } };

  P["nicomachus"] = { w: 320, h: 330, steps: 6, alt: "A 15 by 15 square split into L-shaped borders of area 1, 8, 27, 64 and 125 cubes.",
    build: function (B) {
      var u = 16, ox = 40, oy = 34, T = function (k) { return k * (k + 1) / 2; };
      B.rect(ox, oy, 15 * u, 15 * u, "fill:none;stroke:var(--rule);stroke-width:1.2");
      for (var k = 1; k <= 5; k++) {
        var lo = T(k - 1), hi = T(k), fill = k % 2 ? C.plus : C.acc, o = { in: k - 1 };
        B.rect(ox + lo * u, oy + lo * u, k * u, k * u, fill + CELL, o);
        // arms, cut into k-by-k blocks from the corner outwards; for even k the
        // last piece is a half-block and the two halves make one square
        for (var e = lo; e > 0; e -= k) {
          var s = Math.max(0, e - k), wdt = e - s, half = wdt < k ? ";fill-opacity:.55" : "";
          B.rect(ox + s * u, oy + lo * u, wdt * u, k * u, fill + half + CELL, o);
          B.rect(ox + lo * u, oy + s * u, k * u, wdt * u, fill + half + CELL, o);
        }
        if (k > 1) B.text(ox + (lo + k / 2) * u, oy + (lo + k / 2) * u, k + "³", o, { color: "var(--card)", size: k > 2 ? 14 : 11, weight: 600 });
        B.text(ox + (lo + k / 2) * u, oy - 12, String(k), o, { size: 11, color: "var(--muted)" });
      }
      B.text(160, 310, "1³ + 2³ + ⋯ + 5³ = (1 + 2 + ⋯ + 5)²", { in: 5 }, { size: 13 });
    } };

  P["quarters"] = { w: 320, h: 330, steps: 7, alt: "A square cut into quarters again and again; each colour ends up with one third.",
    build: function (B) {
      var x = 32, y = 26, s = 256;
      for (var k = 0; k < 6; k++) {
        var h = s / 2, o = { in: k };
        B.rect(x, y, h, h, C.plus + CELL, o);
        B.rect(x + h, y, h, h, C.acc + CELL, o);
        B.rect(x, y + h, h, h, "fill:var(--muted);fill-opacity:.38" + CELL, o);
        x += h; y += h; s = h;
      }
      B.rect(32, 26, 256, 256, "fill:none;stroke:var(--ink);stroke-width:1.2");
      B.text(160, 307, "1/4 + 1/16 + 1/64 + ⋯ = 1/3", { in: 6 }, { size: 14 });
    } };

  P["tennenbaum"] = { w: 320, h: 330, steps: 5, alt: "Two b-squares placed in opposite corners of an a-square: the doubly covered middle equals the two uncovered corners.",
    build: function (B) {
      var ox = 32, oy = 22, U = 15, a = 17 * U, b = 12 * U, m = a - b;
      B.rect(ox, oy, a, a, "fill:var(--zero);stroke:var(--ink);stroke-width:1.4");
      B.text(ox + a / 2, oy + a / 2, "a²", { out: 1 }, { size: 22, italic: true });
      B.rect(ox, oy + m, b, b, C.plus + ";fill-opacity:.5;stroke:var(--plus);stroke-width:1.5", { in: 1 });
      B.text(ox + b / 2 - 30, oy + m + b / 2 + 30, "b²", { in: 1, out: 3 }, { size: 20, italic: true });
      B.rect(ox + m, oy, b, b, C.acc + ";fill-opacity:.5;stroke:var(--accent);stroke-width:1.5", { in: 2 });
      B.text(ox + m + b / 2 + 30, oy + b / 2 - 30, "b²", { in: 2, out: 3 }, { size: 20, italic: true });
      B.rect(ox + m, oy + m, b - m, b - m, "fill:var(--ink);fill-opacity:.82", { in: 3 });
      B.text(ox + a / 2, oy + a / 2, "(2b−a)²", { in: 3 }, { size: 14, color: "var(--card)", weight: 600 });
      B.rect(ox + 1.5, oy + 1.5, m - 3, m - 3, DASH, { in: 3 });
      B.rect(ox + b + 1.5, oy + b + 1.5, m - 3, m - 3, DASH, { in: 3 });
      B.text(ox + m / 2, oy + m / 2, "(a−b)²", { in: 3 }, { size: 12 });
      B.text(ox + b + m / 2, oy + b + m / 2, "(a−b)²", { in: 3 }, { size: 12 });
      B.text(160, 310, "a² = 2b²  ⟹  (2b−a)² = 2(a−b)²", { in: 4 }, { size: 13 });
    } };

  P["windmills"] = { w: 360, h: 330, steps: 4, alt: "The five windmills with x² + 4yz = 17, linked by Zagier's map and by swapping y and z; the fixed point gives 17 = 1² + 4².",
    build: function (B) {
      var u = 8.5;
      function arms(x, y, z) { // pinwheel: arm k is arm 0 rotated by k quarter turns about the square's centre
        var out = [], r = [[0, -y], [z, -y], [z, 0], [0, 0]];
        for (var k = 0; k < 4; k++) {
          var xs = r.map(function (q) { return q[0]; }), ys = r.map(function (q) { return q[1]; });
          out.push([Math.min.apply(0, xs), Math.min.apply(0, ys), Math.max.apply(0, xs), Math.max.apply(0, ys)]);
          r = r.map(function (q) { return [x - q[1], q[0]]; });
        }
        return out;
      }
      function mill(t, cx, cy, extra) {
        var x = t[0], A = arms(t[0], t[1], t[2]), lo = 0, hi = x;
        A.forEach(function (a) { lo = Math.min(lo, a[0], a[1]); hi = Math.max(hi, a[2], a[3]); });
        var c = (lo + hi) / 2, X = function (v) { return cx + (v - c) * u; }, Y = function (v) { return cy + (v - c) * u; };
        var gs = [];
        A.forEach(function (a, k) {
          var G = B.g(extra ? { tf: extra.tf[k] } : null);
          for (var i = a[0]; i < a[2]; i++) for (var j = a[1]; j < a[3]; j++) B.rect(X(i), Y(j), u, u, C.plus + ";stroke:var(--card);stroke-width:1", null, G);
          gs.push(G);
        });
        var S = B.g(extra ? { tf: extra.sq } : null);
        for (var i = 0; i < x; i++) for (var j = 0; j < x; j++) B.rect(X(i), Y(j), u, u, C.acc + ";stroke:var(--card);stroke-width:1", null, S);
        B.text(cx, cy + (hi - lo) * u / 2 + 13, "(" + t.join(",") + ")", null, { size: 11, color: "var(--ink-soft)" });
        return (hi - lo) * u;
      }
      var pos = [[62, 78], [122, 222], [182, 78], [242, 222], [300, 78]];
      var T = [[1, 1, 4], [1, 4, 1], [3, 1, 2], [3, 2, 1], [1, 2, 2]];
      // edges: g = swap y,z (marigold), ζ = Zagier (indigo)
      var E = [[0, 1, "g", 2, "var(--accent)"], [1, 2, "ζ", 1, "var(--plus)"], [2, 3, "g", 2, "var(--accent)"], [3, 4, "ζ", 1, "var(--plus)"]];
      E.forEach(function (e) {
        var p = pos[e[0]], q = pos[e[1]], up = p[1] < q[1];
        var y1 = up ? p[1] + 50 : p[1] - 52, y2 = up ? q[1] - 52 : q[1] + 50;
        var x1 = p[0] + (q[0] - p[0]) * .22, x2 = q[0] - (q[0] - p[0]) * .22;
        B.line(x1, y1, x2, y2, "fill:none;stroke:" + e[4] + ";stroke-width:2.2;stroke-linecap:round", { in: e[3] });
        B.text((x1 + x2) / 2 + (up ? -9 : 9), (y1 + y2) / 2, e[2], { in: e[3] }, { size: 15, color: e[4], italic: true });
      });
      for (var i = 0; i < 4; i++) mill(T[i], pos[i][0], pos[i][1]);
      // the g-fixed windmill: its four 2×2 sails slide together into a 4×4 square
      var s = u, sh = function (dx, dy) { return { 3: "translate(" + (dx * s) + "px," + (dy * s) + "px)" }; };
      mill(T[4], pos[4][0] - 18, pos[4][1], { sq: sh(-1, 0), tf: [sh(1.5, .5), sh(2.5, -1.5), sh(2.5, -.5), sh(5.5, 1.5)] });
      B.rect(pos[0][0] - 36, pos[0][1] - 40, 72, 72, "fill:none;stroke:var(--plus);stroke-width:1.6;stroke-dasharray:4 3;rx:8", { in: 1 });
      B.text(pos[0][0], pos[0][1] - 52, "ζ-fixed", { in: 1 }, { size: 11, color: "var(--plus)" });
      B.rect(pos[4][0] - 42, pos[4][1] - 40, 84, 72, "fill:none;stroke:var(--accent);stroke-width:1.6;stroke-dasharray:4 3;rx:8", { in: 2 });
      B.text(pos[4][0], pos[4][1] - 52, "g-fixed", { in: 2 }, { size: 11, color: "var(--accent-ink)" });
      B.text(180, 312, "x² + 4yz = 17", { out: 3 }, { size: 14 });
      B.text(180, 312, "17 = 1² + 4²", { in: 3 }, { size: 15, weight: 600 });
    } };

  P["necklaces"] = { w: 360, h: 330, steps: 4, alt: "The 32 two-colour strings of length 5: apart from the two single-colour strings they fall into 6 groups of 5 rotations.",
    build: function (B) {
      var p = 5, N = 32, rot = function (m) { return ((m << 1) | (m >> (p - 1))) & (N - 1); };
      var seen = {}, rows = [];
      for (var m = 1; m < N - 1; m++) {
        if (seen[m]) continue;
        var row = [], v = m;
        do { row.push(v); seen[v] = 1; v = rot(v); } while (v !== m);
        rows.push(row);
      }
      var target = {};
      rows.forEach(function (row, r) { row.forEach(function (v, j) { target[v] = [16 + j * 58, 34 + r * 36]; }); });
      target[0] = [100, 34 + 6 * 36 + 6]; target[N - 1] = [158, 34 + 6 * 36 + 6];
      for (var i = 0; i < N; i++) {
        var gx = 26 + (i % 4) * 80, gy = 34 + Math.floor(i / 4) * 30, t = target[i];
        var G = B.g({ tf: { 0: "translate(" + gx + "px," + gy + "px)", 1: "translate(" + t[0] + "px," + t[1] + "px)" } });
        for (var k = 0; k < p; k++) B.circle(k * 9.5, 0, 4.1, ((i >> (p - 1 - k)) & 1 ? C.plus : C.acc), null, G);
      }
      rows.forEach(function (row, r) {
        var y = 34 + r * 36;
        B.rect(6, y - 13, 296, 26, "fill:none;stroke:var(--rule);stroke-width:1.3;rx:13", { in: 2 });
        var cx = 330, rr = 11;
        for (var k = 0; k < p; k++) {
          var ang = -Math.PI / 2 + 2 * Math.PI * k / p;
          B.circle(cx + rr * Math.cos(ang), y + rr * Math.sin(ang), 3.4, ((row[0] >> (p - 1 - k)) & 1 ? C.plus : C.acc), { in: 2 });
        }
        B.circle(cx, y, rr, "fill:none;stroke:var(--rule);stroke-width:1", { in: 2 });
      });
      B.text(232, 34 + 6 * 36 + 6, "fixed", { in: 2 }, { size: 12, color: "var(--muted)" });
      B.text(180, 318, "2⁵ = 32", { out: 1 }, { size: 14 });
      B.text(180, 318, "2⁵ − 2 = 6 · 5", { in: 3 }, { size: 14, weight: 600 });
    } };

  P["eisenstein"] = { w: 320, h: 300, steps: 5, alt: "Lattice points in a 5 by 3 box are split by the diagonal into 7 below and 8 above.",
    build: function (B) {
      var s = 50, ox = 22, oy = 196, p = 11, q = 7;
      var X = function (v) { return ox + v * s; }, Y = function (v) { return oy - v * s; };
      B.line(X(0), Y(0), X(5.9), Y(0), "stroke:var(--muted);stroke-width:1.2");
      B.line(X(0), Y(0), X(0), Y(3.8), "stroke:var(--muted);stroke-width:1.2");
      B.rect(X(0), Y(3.5), 5.5 * s, 3.5 * s, "fill:none;stroke:var(--rule);stroke-width:1.4");
      B.text(X(5.5), Y(0) + 14, "p/2", null, { size: 11, color: "var(--muted)" });
      B.text(X(0) + 6, Y(3.5) - 10, "q/2", null, { size: 11, color: "var(--muted)", anchor: "start" });
      B.line(X(0), Y(0), X(5.5), Y(3.5), "stroke:var(--ink);stroke-width:1.8", { in: 1 });
      for (var i = 1; i <= 5; i++) for (var j = 1; j <= 3; j++) {
        var below = j * p < i * q;
        B.circle(X(i), Y(j), 6, C.zero);
        B.circle(X(i), Y(j), 6, below ? C.plus : C.acc, { in: below ? 2 : 3 });
      }
      B.text(160, 236, "p, q = 11, 7", { out: 2 }, { size: 13 });
      B.text(22, 236, "below: 0+1+1+2+3 = 7", { in: 2 }, { size: 13, color: "var(--plus)", anchor: "start" });
      B.text(22, 258, "above: 1+3+4 = 8", { in: 3 }, { size: 13, color: "var(--accent-ink)", anchor: "start" });
      B.text(22, 282, "7 + 8 = 5 · 3", { in: 4 }, { size: 13, weight: 600, anchor: "start" });
    } };

  P["hyperbola"] = { w: 320, h: 330, steps: 4, alt: "Lattice points under the hyperbola xy = 20, counted as two strips minus the square where they overlap.",
    build: function (B) {
      var n = 20, s = 13.2, ox = 26, oy = 300;
      var X = function (v) { return ox + v * s; }, Y = function (v) { return oy - v * s; };
      B.line(X(0), Y(0), X(21.2), Y(0), "stroke:var(--muted);stroke-width:1.2");
      B.line(X(0), Y(0), X(0), Y(21.2), "stroke:var(--muted);stroke-width:1.2");
      var d = "";
      for (var t = 0; t <= 120; t++) { var x = 20 / 21 + (21 - 20 / 21) * t / 120; d += (t ? "L" : "M") + X(x).toFixed(1) + " " + Y(n / x).toFixed(1); }
      B.path(d, "fill:none;stroke:var(--ink);stroke-width:1.6");
      B.text(X(20.6), Y(1) - 14, "xy = 20", null, { size: 11, color: "var(--muted)", anchor: "end" });
      B.rect(X(.5), Y(4.5), 4 * s, 4 * s, "fill:var(--ink);fill-opacity:.12;stroke:var(--ink);stroke-width:1.4;stroke-dasharray:4 3", { in: 3 });
      for (var a = 1; a <= n; a++) for (var b = 1; a * b <= n; b++) {
        B.circle(X(a), Y(b), 2.9, C.zero);
        if (a <= 4) B.circle(X(a), Y(b), 2.9, C.plus, { in: 1 });
        if (b <= 4 && a > 4) B.circle(X(a), Y(b), 2.9, C.acc, { in: 2 });
        if (b <= 4 && a <= 4) B.circle(X(a), Y(b), 4.9, "fill:none;stroke:var(--accent);stroke-width:1.6", { in: 2 });
      }
      B.text(130, 70, "x ≤ 4:  41 points", { in: 1 }, { size: 12, color: "var(--plus)", anchor: "start" });
      B.text(130, 92, "y ≤ 4:  41 points", { in: 2 }, { size: 12, color: "var(--accent-ink)", anchor: "start" });
      B.text(130, 114, "both:   4² = 16", { in: 3 }, { size: 12, anchor: "start" });
      B.text(130, 140, "41 + 41 − 16 = 66", { in: 3 }, { size: 13, weight: 600, anchor: "start" });
    } };

  P["bhaskara"] = { w: 320, h: 330, steps: 5, alt: "Squares on a and b are cut into a pentagon and two right triangles; turning the triangles makes the square on c.",
    build: function (B) {
      var a = 3, b = 4, s = 36, ox = 34, oy = 296;
      var X = function (v) { return ox + v * s; }, Y = function (v) { return oy - v * s; };
      var pt = function (q) { return [X(q[0]), Y(q[1])]; };
      var EDGE = ";stroke:var(--ink);stroke-width:1.5;stroke-linejoin:round";
      B.rect(X(0), Y(b), b * s, b * s, C.plus + ";fill-opacity:.85" + EDGE, { out: 1 });
      B.rect(X(b), Y(a), a * s, a * s, C.acc + ";fill-opacity:.85" + EDGE, { out: 1 });
      B.text(X(b / 2), Y(b / 2), "b²", { out: 1 }, { size: 24, italic: true, color: "var(--card)" });
      B.text(X(b + a / 2), Y(a / 2), "a²", { out: 1 }, { size: 22, italic: true, color: "var(--card)" });
      B.poly([[a, 0], [a + b, a], [b, a], [b, b], [0, b]].map(pt), "fill:var(--zero)" + EDGE, { in: 1 });
      B.poly([[0, 0], [a, 0], [0, b]].map(pt), C.plus + ";fill-opacity:.85" + EDGE, { in: 1, tf: { 2: "rotate(-90deg)" }, origin: X(0) + "px " + Y(b) + "px" });
      B.poly([[a, 0], [a + b, 0], [a + b, a]].map(pt), C.acc + ";fill-opacity:.85" + EDGE, { in: 1, tf: { 3: "rotate(90deg)" }, origin: X(a + b) + "px " + Y(a) + "px" });
      B.text(X(3.5), Y(3.5), "c²", { in: 4 }, { size: 26, italic: true });
      B.text(160, 318, "a² + b² = c²", { in: 4 }, { size: 14, weight: 600 });
    } };

  P["am-gm"] = { w: 320, h: 270, steps: 5, alt: "In a semicircle on a diameter of length a + b, the half-chord √ab is at most the radius (a + b)/2.",
    build: function (B) {
      var y0 = 222, A = 30, Bx = 290, Px = 110, O = 160, R = 130, h = 120;
      B.line(A, y0, Px, y0, "stroke:var(--accent);stroke-width:3.2;stroke-linecap:round");
      B.line(Px, y0, Bx, y0, "stroke:var(--plus);stroke-width:3.2;stroke-linecap:round");
      B.text((A + Px) / 2, y0 + 17, "a", null, { size: 16, italic: true, color: "var(--accent-ink)" });
      B.text((Px + Bx) / 2, y0 + 17, "b", null, { size: 16, italic: true, color: "var(--plus)" });
      B.path("M" + A + " " + y0 + " A " + R + " " + R + " 0 0 1 " + Bx + " " + y0, LINE, { in: 1 });
      B.line(A, y0, Px, y0 - h, "stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3", { in: 2 });
      B.line(Bx, y0, Px, y0 - h, "stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3", { in: 2 });
      B.line(Px, y0, Px, y0 - h, "stroke:var(--ink);stroke-width:2.4", { in: 2 });
      B.text(Px - 8, y0 - h / 2, "√ab", { in: 2 }, { size: 14, anchor: "end" });
      B.line(O, y0, O, y0 - R, "stroke:var(--ink);stroke-width:2.4;stroke-dasharray:6 4", { in: 3 });
      B.text(O + 8, y0 - R / 2 - 14, "a + b", { in: 3 }, { size: 13, anchor: "start" });
      B.line(O + 8, y0 - R / 2 - 3, O + 46, y0 - R / 2 - 3, "stroke:var(--ink);stroke-width:1", { in: 3 });
      B.text(O + 27, y0 - R / 2 + 9, "2", { in: 3 }, { size: 13 });
      B.circle(Px, y0 - h, 3.5, C.ink, { in: 2 });
      B.circle(O, y0, 3, C.ink, { in: 3 });
      B.text(250, 40, "√ab ≤ (a+b)/2", { in: 4 }, { size: 15, weight: 600 });
    } };

  P["lucas"] = { w: 320, h: 330, steps: 5, alt: "Pascal's triangle mod 2: rows 0 to 3, then row 4 is 1 0 0 0 1, so rows 4 to 7 are two copies of rows 0 to 3 with an empty triangle between them.",
    build: function (B) {
      var u = 34, cx = 160, oy = 30, odd = function (n, k) { return (k & (n - k)) === 0; };
      function X(n, k) { return cx + (k - n / 2) * u; }
      function Y(n) { return oy + n * u * 0.82; }
      for (var n = 0; n < 8; n++) for (var k = 0; k <= n; k++) {
        var o = odd(n, k), st, when;
        if (n < 4) { st = C.acc; when = 0; }
        else if (n === 4) { st = o ? C.acc : C.zero; when = 1; }
        else if (k <= n - 4) { st = o ? C.acc : C.zero; when = 2; }
        else if (k >= 4) { st = o ? C.acc : C.zero; when = 3; }
        else { st = C.zero; when = 4; }
        B.rect(X(n, k) - u * 0.42, Y(n) - u * 0.36, u * 0.84, u * 0.72, st + ";rx:4", { in: when });
        if (n === 4) B.text(X(n, k), Y(n), o ? "1" : "0", { in: 1 }, { size: 12, color: o ? "var(--card)" : "var(--muted)", weight: 600 });
      }
      B.text(160, 258, "row 4 ≡ 1 0 0 0 1 (mod 2)", { in: 1, out: 4 }, { size: 13 });
      B.text(160, 258, "rows 0–7 = three copies of rows 0–3", { in: 4 }, { size: 13, weight: 600 });
      B.text(160, 282, "(two odd copies, one even gap)", { in: 4 }, { size: 12, color: "var(--muted)" });
      B.text(160, 306, "repeat: Sierpiński's triangle", { in: 4 }, { size: 12, color: "var(--muted)" });
    } };

  P["calkin-wilf"] = { w: 340, h: 330, steps: 5, alt: "The Calkin–Wilf tree from 1/1 down three levels; the path from 3/5 back to 1/1 subtracts the smaller of numerator and denominator from the larger.",
    build: function (B) {
      var rows = [["1/1"], ["1/2", "2/1"], ["1/3", "3/2", "2/3", "3/1"], ["1/4", "4/3", "3/5", "5/2", "2/5", "5/3", "3/4", "4/1"]];
      var pos = function (d, i) { return [20 + 300 * (i + .5) / (1 << d), 34 + d * 62]; };
      var path = [[0, 0], [1, 0], [2, 1], [3, 2]];
      for (var d = 1; d < 4; d++) for (var i = 0; i < (1 << d); i++) {
        var a = pos(d - 1, i >> 1), b = pos(d, i), onp = path[d][1] === i && path[d - 1][1] === (i >> 1);
        B.line(a[0], a[1] + 10, b[0], b[1] - 10, "stroke:var(--rule);stroke-width:1.2", { in: d });
        if (onp) B.line(a[0], a[1] + 10, b[0], b[1] - 10, "stroke:var(--accent);stroke-width:2.6", { in: 4 });
      }
      for (d = 0; d < 4; d++) for (i = 0; i < (1 << d); i++) {
        var p = pos(d, i), onq = path[d][1] === i;
        B.text(p[0], p[1], rows[d][i], { in: d }, { size: d < 3 ? 14 : 11, weight: 600 });
        if (onq) B.circle(p[0], p[1], d < 3 ? 19 : 16, "fill:none;stroke:var(--accent);stroke-width:2", { in: 4 });
      }
      B.text(170, 262, "a/b  →  a/(a+b)  and  (a+b)/b", { out: 4 }, { size: 12, color: "var(--muted)" });
      B.text(170, 262, "3/5 → 3/2 → 1/2 → 1/1", { in: 4 }, { size: 14, weight: 600 });
      B.text(170, 286, "going up = one step of Euclid's algorithm,", { in: 4 }, { size: 12, color: "var(--muted)" });
      B.text(170, 306, "so every fraction has exactly one path to 1/1", { in: 4 }, { size: 12, color: "var(--muted)" });
    } };

  P["vieta"] = { w: 340, h: 320, steps: 5, alt: "Vieta jumping on the Markov equation: for (a, b) = (2, 5) the quadratic in c has roots 29 and 1, and b = 5 lies between them, so the triple descends towards (1, 1, 1).",
    build: function (B) {
      var ox = 26, oy = 116, sx = 9.4, sy = 0.5;
      var X = function (t) { return ox + (t + 1) * sx; }, Y = function (v) { return oy - v * sy; };
      B.text(170, 24, "x² + y² + z² = 3xyz", null, { size: 15, weight: 600 });
      B.line(X(-1.5), Y(0), X(31.5), Y(0), "stroke:var(--muted);stroke-width:1.2", { in: 1 });
      var d = "";
      for (var t = -1.2; t <= 31.2; t += 0.4) { var v = t * t - 30 * t + 29; d += (d ? "L" : "M") + X(t).toFixed(1) + " " + Math.max(44, Y(v)).toFixed(1); }
      B.path(d, "fill:none;stroke:var(--plus);stroke-width:1.8", { in: 1 });
      B.text(170, 50, "f(c) = c² − 3ab·c + a² + b²,  (a, b) = (2, 5)", { in: 1 }, { size: 11, color: "var(--plus)" });
      B.circle(X(29), Y(0), 5, C.acc, { in: 2 });
      B.circle(X(1), Y(0), 5, C.acc, { in: 2 });
      B.text(X(29), Y(0) - 14, "c = 29", { in: 2 }, { size: 11, color: "var(--accent-ink)" });
      B.text(X(1), Y(0) - 14, "c′ = 1", { in: 2 }, { size: 11, color: "var(--accent-ink)" });
      var fb = 25 - 150 + 29;
      B.line(X(5), Y(0), X(5), Y(fb), "stroke:var(--ink);stroke-width:1.2;stroke-dasharray:3 3", { in: 3 });
      B.circle(X(5), Y(fb), 4.5, C.ink, { in: 3 });
      B.text(X(5) + 8, Y(fb) + 4, "f(b) = f(5) = −96 < 0", { in: 3 }, { size: 11, anchor: "start" });
      B.text(X(5) + 8, Y(fb) + 22, "so c′ < b < c", { in: 3 }, { size: 11, anchor: "start" });
      B.text(170, 244, "(2, 5, 29) → (1, 2, 5)", { in: 4 }, { size: 13, weight: 600 });
      B.text(170, 264, "→ (1, 1, 2) → (1, 1, 1)", { in: 4 }, { size: 13, weight: 600 });
      B.text(170, 290, "jumping the largest entry shrinks it, so", { in: 4 }, { size: 11.5, color: "var(--muted)" });
      B.text(170, 308, "every Markov triple comes from (1, 1, 1)", { in: 4 }, { size: 11.5, color: "var(--muted)" });
    } };

  /* ------------------------------------------------------------------ */
  function Player(fig, def) {
    var self = this;
    var stage = fig.querySelector(".pw-stage");
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + def.w + " " + def.h);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", def.alt);
    stage.appendChild(svg);
    var B = new Builder(svg);
    def.build(B);
    this.svg = svg; this.items = B.items; this.n = def.steps; this.step = 0;
    this.playing = !reduce; this.timer = null; this.visible = false;

    var bar = document.createElement("div");
    bar.className = "pw-bar";
    bar.innerHTML =
      '<button type="button" class="pw-btn" data-a="prev" aria-label="Previous step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<button type="button" class="pw-btn" data-a="play" aria-label="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-pause" d="M9 6v12M15 6v12"/><path class="i-play" d="M8 5.5l11 6.5-11 6.5z"/></svg></button>' +
      '<button type="button" class="pw-btn" data-a="next" aria-label="Next step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<span class="pw-dots" aria-hidden="true"></span><span class="pw-count" aria-live="polite"></span>';
    stage.after(bar);
    this.bar = bar; this.count = bar.querySelector(".pw-count");
    var dots = bar.querySelector(".pw-dots");
    for (var i = 0; i < this.n; i++) dots.appendChild(document.createElement("i"));
    this.dots = dots.children;
    bar.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button"); if (!btn) return;
      var a = btn.getAttribute("data-a");
      if (a === "play") { self.setPlaying(!self.playing); return; }
      self.setPlaying(false);
      self.go(a === "next" ? Math.min(self.n - 1, self.step + 1) : Math.max(0, self.step - 1));
    });

    this.instant(function () { self.render(reduce ? self.n - 1 : 0); });
    this.setPlaying(this.playing);
  }
  Player.prototype.instant = function (fn) {
    this.svg.classList.add("pw-instant"); fn(); void this.svg.getBoundingClientRect(); this.svg.classList.remove("pw-instant");
  };
  Player.prototype.render = function (s) {
    this.step = s;
    this.items.forEach(function (it) {
      it.el.style.opacity = s >= it.a && s < it.b ? 1 : 0;
      if (it.tf) { var best = null; for (var k in it.tf) if (+k <= s && (best === null || +k > best)) best = +k; it.el.style.transform = best === null ? "none" : it.tf[best]; }
    });
    for (var i = 0; i < this.dots.length; i++) this.dots[i].className = i === s ? "on" : (i < s ? "done" : "");
    this.count.textContent = (s + 1) + " / " + this.n;
  };
  Player.prototype.go = function (s) { this.render(s); };
  Player.prototype.setPlaying = function (on) {
    this.playing = on;
    this.bar.classList.toggle("is-playing", on);
    var b = this.bar.querySelector('[data-a="play"]');
    b.setAttribute("aria-label", on ? "Pause" : "Play");
    this.schedule();
  };
  Player.prototype.schedule = function () {
    var self = this;
    clearTimeout(this.timer);
    if (!this.playing || !this.visible) return;
    var last = this.step === this.n - 1;
    this.timer = setTimeout(function () {
      if (!last) { self.render(self.step + 1); self.schedule(); return; }
      self.svg.classList.add("pw-fade");
      self.timer = setTimeout(function () {
        self.instant(function () { self.render(0); });
        self.svg.classList.remove("pw-fade");
        self.schedule();
      }, 420);
    }, last ? 3400 : (this.step === 0 ? 1500 : 1800));
  };

  var players = [];
  document.querySelectorAll("figure.pw[data-proof]").forEach(function (fig) {
    var def = P[fig.getAttribute("data-proof")];
    if (def) { var pl = new Player(fig, def); pl.fig = fig; players.push(pl); }
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        players.forEach(function (pl) { if (pl.fig === e.target) { pl.visible = e.isIntersecting; pl.schedule(); } });
      });
    }, { threshold: 0.35 });
    players.forEach(function (pl) { io.observe(pl.fig); });
  } else players.forEach(function (pl) { pl.visible = true; pl.schedule(); });
  document.addEventListener("visibilitychange", function () {
    players.forEach(function (pl) { if (document.hidden) clearTimeout(pl.timer); else pl.schedule(); });
  });
})();
