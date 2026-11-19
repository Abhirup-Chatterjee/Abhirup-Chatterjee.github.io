/* Site behaviour. Every block checks that its element exists, so one file serves all pages. */
(function () {
  "use strict";
  var root = document.documentElement;
  var css = function (name) { return getComputedStyle(root).getPropertyValue(name).trim(); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var redrawers = [];
  function onTheme(fn) { redrawers.push(fn); }
  function redrawAll() { redrawers.forEach(function (f) { try { f(); } catch (e) {} }); }

  /* ---------- theme toggle (shared across every page of the site) ----------
     The choice is kept in several places, because some hosts and browsers block or
     partition localStorage (e.g. pages opened from disk, sandboxed previews), and it is
     also carried along in internal links (?theme=dark), so the next page always knows. */
  var THEME_KEY = "ac-theme";
  function validTheme(t) { return t === "dark" || t === "light" ? t : null; }
  function readTheme() {
    var t = null, m;
    try { m = /[?&]theme=(dark|light)/.exec(location.search); if (m) t = m[1]; } catch (e) {}
    if (!t) try { t = validTheme(localStorage.getItem(THEME_KEY)); } catch (e) {}
    if (!t) try { t = validTheme(sessionStorage.getItem(THEME_KEY)); } catch (e) {}
    if (!t) try { m = /(?:^|; )ac-theme=(dark|light)/.exec(document.cookie); if (m) t = m[1]; } catch (e) {}
    if (!t) try { m = /ac-theme=(dark|light)/.exec(window.name || ""); if (m) t = m[1]; } catch (e) {}
    return t;
  }
  function saveTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    try { sessionStorage.setItem(THEME_KEY, t); } catch (e) {}
    try { document.cookie = "ac-theme=" + t + "; path=/; max-age=31536000; SameSite=Lax"; } catch (e) {}
    try { if (!window.name || /^ac-theme=(dark|light)$/.test(window.name)) window.name = "ac-theme=" + t; } catch (e) {}
  }
  function currentTheme() { return validTheme(root.getAttribute("data-theme")); }
  function syncFrames(t) {
    document.querySelectorAll("iframe.lab-frame").forEach(function (f) {
      try { f.contentDocument.documentElement.setAttribute("data-theme", t); } catch (e) {}
      try { f.contentWindow.postMessage({ acTheme: t }, "*"); } catch (e) {}
    });
  }
  function applyTheme(t, persist) {
    t = validTheme(t); if (!t) return;
    if (root.getAttribute("data-theme") !== t) root.setAttribute("data-theme", t);
    if (persist) saveTheme(t);
    syncFrames(t);
  }
  (function initTheme() {
    var t = readTheme();
    if (t) { applyTheme(t, true); }
    // tidy the address bar once the choice has been stored
    try {
      if (/[?&]theme=/.test(location.search) && history.replaceState) {
        var q = location.search.replace(/([?&])theme=(dark|light)&?/, "$1").replace(/[?&]$/, "");
        history.replaceState(history.state, "", location.pathname + q + location.hash);
      }
    } catch (e) {}
  })();
  var themeBtn = document.getElementById("theme-btn");
  function isDark() {
    var t = currentTheme();
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(isDark() ? "light" : "dark", true);
      redrawAll();
    });
  }
  // carry the theme into internal links, so it survives even where storage does not
  function tagLink(e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    var t = currentTheme();
    if (!a || !t) return;
    var raw = a.getAttribute("href") || "";
    if (/^(#|mailto:|tel:|javascript:)/i.test(raw) || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.indexOf("//") === 0) return;
    if (!/\.html?(?:[?#]|$)|\/(?:[?#]|$)/i.test(raw)) return;
    var hash = "", i = raw.indexOf("#");
    if (i >= 0) { hash = raw.slice(i); raw = raw.slice(0, i); }
    raw = raw.replace(/([?&])theme=(dark|light)&?/, "$1").replace(/[?&]$/, "");
    a.setAttribute("href", raw + (raw.indexOf("?") >= 0 ? "&" : "?") + "theme=" + t + hash);
  }
  document.addEventListener("mousedown", tagLink, true);
  document.addEventListener("touchstart", tagLink, { capture: true, passive: true });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter") tagLink(e); }, true);
  document.addEventListener("click", tagLink, true);
  // lab iframes: start them in the page's theme
  document.querySelectorAll("iframe.lab-frame").forEach(function (f) {
    var t = currentTheme(), src = f.getAttribute("src");
    if (t && src && !/[?&]theme=/.test(src)) f.setAttribute("src", src + (src.indexOf("?") >= 0 ? "&" : "?") + "theme=" + t);
    f.addEventListener("load", function () { var c = currentTheme(); if (c) syncFrames(c); });
  });
  // another tab changed it, or this page came back from the back/forward cache
  window.addEventListener("storage", function (e) { if (e.key === THEME_KEY && validTheme(e.newValue)) applyTheme(e.newValue, false); });
  window.addEventListener("pageshow", function () { var t = readTheme(); if (t && t !== currentTheme()) applyTheme(t, false); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    var t = readTheme(); if (t && t !== currentTheme()) applyTheme(t, false);
  });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", redrawAll);
  }
  new MutationObserver(redrawAll).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById("menu-btn"), nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = o; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectNear(btn); });
      } else selectNear(btn);
    });
  });
  function selectNear(btn) {
    var el = btn.previousElementSibling; if (!el) return;
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* ---------- tag filters (blogs, art) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var target = document.querySelector(group.getAttribute("data-filter-group"));
    if (!target) return;
    group.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip"); if (!chip) return;
      group.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      var f = chip.getAttribute("data-filter");
      target.querySelectorAll("[data-tags]").forEach(function (item) {
        item.hidden = !(f === "all" || item.getAttribute("data-tags").split(" ").indexOf(f) > -1);
      });
    });
  });

  /* ---------- resources search ---------- */
  var search = document.getElementById("res-search");
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".res-group").forEach(function (g) {
        var shown = 0;
        g.querySelectorAll("li").forEach(function (li) {
          var hit = !q || li.textContent.toLowerCase().indexOf(q) > -1;
          li.hidden = !hit; if (hit) shown++;
        });
        g.hidden = shown === 0;
      });
      var empty = document.getElementById("res-empty"); if (empty) empty.hidden = !!document.querySelector(".res-group:not([hidden])");
    });
  }

  /* ---------- integer Möbius helpers ---------- */
  function factor(n) { var f = [], d = 2; while (d * d <= n) { while (n % d === 0) { f.push(d); n /= d; } d++; } if (n > 1) f.push(n); return f; }
  function muInt(n) { var f = factor(n); for (var i = 1; i < f.length; i++) if (f[i] === f[i - 1]) return 0; return f.length % 2 ? -1 : 1; }
  function fmtFactor(n) {
    if (n === 1) return "1";
    var f = factor(n), out = [], i = 0;
    while (i < f.length) { var p = f[i], k = 0; while (f[i] === p) { k++; i++; } out.push(k > 1 ? p + "^" + k : String(p)); }
    return out.join(" · ").replace(/\^(\d+)/g, function (_, e) { return e.split("").map(function (c) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]; }).join(""); });
  }

  function setupCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth || 300, h = cv.clientHeight || 300;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------- hero: Euclid's orchard (scroll to zoom, drag to move) ---------- */
  var orchard = document.getElementById("orchard");
  if (orchard) {
    var oRead = document.getElementById("orchard-readout"), og = null, oS = 0, oX = 0, oY = 0, R0 = 22, oFit = 1, TAU = Math.PI * 2;
    var beam = reduceMotion ? 7 : 0, oHover = null, drag = null, pinch = null, pointers = {}, oQueued = false, lastCount = { v: 0, t: 0 };
    var SQ2 = Math.SQRT2, S_MAX = 90;
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
    function oReset() {
      og = setupCanvas(orchard);
      oS = oFit = (Math.min(og.w, og.h) / 2 - 6) / (R0 + 0.7);
      oX = og.w / 2; oY = og.h / 2;
    }
    function toS(x, y) { return [oX + x * oS, oY - y * oS]; }
    function toW(X, Y) { return [(X - oX) / oS, (oY - Y) / oS]; }
    function angOf(x, y) { var a = Math.atan2(y, x); return a < 0 ? a + TAU : a; }
    function rgbOf(c) { c = c.trim(); if (c[0] === "#") { if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; } var m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; }
    function mixC(a, b, t) { return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")"; }
    function oDraw() {
      oQueued = false;
      if (!og) oReset();
      var c = og.ctx, W = og.w, H = og.h; c.clearRect(0, 0, W, H);
      var acc = css("--accent"), plus = css("--plus"), ink = css("--ink"), soft = css("--ink-soft"), mut = css("--muted"), rule = css("--rule");
      var accR = rgbOf(acc), cardR = rgbOf(css("--card"));
      // world-space bounding box of the canvas
      var cs = [toW(0, 0), toW(W, 0), toW(0, H), toW(W, H)];
      var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
      cs.forEach(function (p) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); });
      var x0 = Math.max(-R0, Math.floor(xmin)), x1 = Math.min(R0, Math.ceil(xmax)), y0 = Math.max(-R0, Math.floor(ymin)), y1 = Math.min(R0, Math.ceil(ymax)), RR = R0 * R0;
      var pad = oS + 4, far = R0;
      // the fence, and lattice lines when zoomed in
      c.save(); c.beginPath(); c.arc(oX, oY, (R0 + 0.5) * oS, 0, TAU); c.fillStyle = rule; c.globalAlpha = .12; c.fill(); c.globalAlpha = .7; c.strokeStyle = rule; c.lineWidth = 1; c.stroke(); c.clip();
      if (oS >= 7) {
        c.strokeStyle = rule; c.lineWidth = .8; c.globalAlpha = .55; c.beginPath();
        for (var gx = x0 - 1; gx <= x1 + 1; gx++) { var a = toS(gx, -R0 - 1), b = toS(gx, R0 + 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        for (var gy = y0 - 1; gy <= y1 + 1; gy++) { a = toS(-R0 - 1, gy); b = toS(R0 + 1, gy); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
      // collect trees on screen
      var vis = [], hid = [], v = 0, t = 0;
      if ((x1 - x0 + 1) * (y1 - y0 + 1) < 900000) {
        for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) {
          if ((x === 0 && y === 0) || x * x + y * y > RR) continue;
          var P = toS(x, y); if (P[0] < -pad || P[0] > W + pad || P[1] < -pad || P[1] > H + pad) continue;
          if (angOf(x, y) > beam + 1e-9) continue;
          var inside = P[0] >= 0 && P[0] <= W && P[1] >= 0 && P[1] <= H, g = gcd(x, y);
          if (inside) { t++; if (g === 1) v++; }
          (g === 1 ? vis : hid).push([x, y, P[0], P[1], g]);
        }
      }
      lastCount = { v: v, t: t };
      // beam wedge while sweeping
      if (beam < TAU - 1e-6) {
        c.fillStyle = acc; c.globalAlpha = .08; c.beginPath(); c.moveTo(oX, oY);
        for (var k = 0; k <= 64; k++) { var th = beam * k / 64, Q = toS((R0 + .5) * Math.cos(th), (R0 + .5) * Math.sin(th)); c.lineTo(Q[0], Q[1]); }
        c.closePath(); c.fill(); c.globalAlpha = 1;
      }
      // shadows behind visible trees
      if (oS >= 3.5 && vis.length < 3500) {
        c.strokeStyle = soft; c.lineWidth = Math.max(.6, oS * .16); c.lineCap = "round"; c.globalAlpha = .12; c.beginPath();
        vis.forEach(function (tr) { var m = R0 / Math.hypot(tr[0], tr[1]); if (m < 2) return; var B = toS(tr[0] * m, tr[1] * m); c.moveTo(tr[2], tr[3]); c.lineTo(B[0], B[1]); });
        c.stroke(); c.globalAlpha = 1; c.lineCap = "butt";
      }
      // line of sight for the hovered tree
      var sa = 0, sb = 0;
      if (oHover) {
        sa = oHover[0] / oHover[4]; sb = oHover[1] / oHover[4];
        var mE = (R0 + .5) / Math.hypot(sa, sb), E = toS(sa * mE, sb * mE); c.strokeStyle = plus; c.lineWidth = 1.4; c.beginPath(); c.moveTo(oX, oY); c.lineTo(E[0], E[1]); c.stroke();
      }
      // hidden trees
      var rH = Math.max(.7, oS * .13);
      c.fillStyle = soft; c.globalAlpha = oS < 3 ? .3 : .5;
      if (oS < 3) hid.forEach(function (tr) { c.fillRect(tr[2] - rH, tr[3] - rH, 2 * rH, 2 * rH); });
      else { c.beginPath(); hid.forEach(function (tr) { c.moveTo(tr[2] + rH, tr[3]); c.arc(tr[2], tr[3], rH, 0, 6.2832); }); c.fill(); }
      c.globalAlpha = 1;
      // visible trees: canopy (and trunk when large), shaded by distance from you
      var rC = Math.max(.8, oS * .36), maxD = R0;
      if (oS < 3) { c.fillStyle = acc; vis.forEach(function (tr) { c.fillRect(tr[2] - rC, tr[3] - rC, 2 * rC, 2 * rC); }); }
      else {
        if (oS > 7) { c.strokeStyle = soft; c.globalAlpha = .7; c.lineWidth = Math.max(1, oS * .1); c.beginPath(); vis.forEach(function (tr) { c.moveTo(tr[2], tr[3] + rC * .15); c.lineTo(tr[2], tr[3] + rC * .85); }); c.stroke(); c.globalAlpha = 1; }
        var bands = 6, paths = []; for (var bI = 0; bI < bands; bI++) paths.push(new Path2D());
        vis.forEach(function (tr) { var d = Math.min(1, Math.hypot(tr[0], tr[1]) / maxD), bi = Math.min(bands - 1, Math.floor(d * bands)); paths[bi].moveTo(tr[2] + rC, tr[3] - rC * .25); paths[bi].arc(tr[2], tr[3] - rC * .25, rC, 0, 6.2832); });
        var dk = root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
        paths.forEach(function (pa, i) { c.fillStyle = mixC(accR, cardR, i / bands * (dk ? .22 : .42)); c.fill(pa); });
        if (oS > 11) { c.fillStyle = "#fff"; c.globalAlpha = .28; c.beginPath(); vis.forEach(function (tr) { c.moveTo(tr[2] - rC * .3 + rC * .32, tr[3] - rC * .58); c.arc(tr[2] - rC * .3, tr[3] - rC * .58, rC * .32, 0, 6.2832); }); c.fill(); c.globalAlpha = 1; }
      }
      // ring every tree on the hovered line of sight
      if (oHover) {
        c.strokeStyle = plus; c.lineWidth = 1.4;
        for (var m2 = 1; m2 * Math.hypot(sa, sb) <= R0 + 1e-9; m2++) { var Pm = toS(sa * m2, sb * m2); if (Pm[0] < -20 || Pm[0] > W + 20 || Pm[1] < -20 || Pm[1] > H + 20) continue; c.beginPath(); c.arc(Pm[0], Pm[1] - (m2 === 1 ? rC * .25 : 0), (m2 === 1 ? rC : rH * 2) + 3, 0, 6.2832); c.stroke(); }
      }
      // you, at the origin
      if (oX > -10 && oX < W + 10 && oY > -10 && oY < H + 10) {
        c.fillStyle = ink; c.beginPath(); c.arc(oX, oY, 3.4, 0, 6.2832); c.fill();
        c.font = "10px " + css("--f-mono"); c.fillStyle = mut; c.textAlign = "center"; c.fillText("you", oX, oY + 14);
      }
      orchard.style.touchAction = oS > oFit * 1.001 ? "none" : "pan-y"; // let the page scroll until the picture is zoomed
      oReport();
    }
    function oQueue() { if (!oQueued) { oQueued = true; requestAnimationFrame(oDraw); } }
    function oReport() {
      if (!oRead) return;
      if (oHover) {
        var a = oHover[0] / oHover[4], b = oHover[1] / oHover[4];
        oRead.textContent = "(" + oHover[0] + ", " + oHover[1] + ")   gcd " + oHover[4] + (oHover[4] === 1 ? "   visible" : "   hidden behind (" + a + ", " + b + ")");
        return;
      }
      var C = lastCount;
      if (C.t && og && og.w < 470) { oRead.textContent = C.v.toLocaleString("en") + " / " + C.t.toLocaleString("en") + " visible = " + (100 * C.v / C.t).toFixed(1) + "%  (6/π² ≈ 60.8%)"; return; }
      oRead.textContent = C.t ? (oS > oFit * 1.001 ? "in view: " : "") + C.v.toLocaleString("en") + " of " + C.t.toLocaleString("en") + " trees visible = " + (100 * C.v / C.t).toFixed(1) + "%   ·   6/π² = 60.8%" : "scroll to zoom in, drag to move";
    }
    function treeAt(X, Y) {
      var w = toW(X, Y), x = Math.round(w[0]), y = Math.round(w[1]);
      if ((x === 0 && y === 0) || x * x + y * y > R0 * R0) return null;
      var P = toS(x, y); if (Math.hypot(P[0] - X, P[1] - Y) > Math.max(7, oS * .5)) return null;
      return [x, y, P[0], P[1], gcd(x, y)];
    }
    function zoomAt(X, Y, f) {
      var ns = Math.max(oFit, Math.min(S_MAX, oS * f)); f = ns / oS; if (f === 1) return;
      oX = X - (X - oX) * f; oY = Y - (Y - oY) * f; oS = ns; oClamp(); oQueue();
    }
    function oClamp() { // keep the orchard on screen: at full zoom-out it sits in its home position
      if (oS <= oFit * 1.0001) { oS = oFit; oX = og.w / 2; oY = og.h / 2; return; }
      var cw = toW(og.w / 2, og.h / 2), r = Math.hypot(cw[0], cw[1]);
      if (r > R0) { var P = toS(cw[0] * R0 / r, cw[1] * R0 / r); oX += og.w / 2 - P[0]; oY += og.h / 2 - P[1]; }
    }
    function local(ev) { var r = orchard.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
    orchard.addEventListener("wheel", function (ev) {
      ev.preventDefault(); var p = local(ev), d = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      zoomAt(p[0], p[1], Math.exp(-d * 0.0016)); oHover = null;
    }, { passive: false });
    orchard.addEventListener("pointerdown", function (ev) {
      pointers[ev.pointerId] = local(ev); orchard.setPointerCapture(ev.pointerId);
      var ids = Object.keys(pointers);
      if (ids.length === 1) drag = { p: pointers[ev.pointerId], moved: false };
      if (ids.length === 2) { var A = pointers[ids[0]], B = pointers[ids[1]]; pinch = { d: Math.hypot(A[0] - B[0], A[1] - B[1]) }; drag = null; }
      orchard.style.cursor = "grabbing";
    });
    orchard.addEventListener("pointermove", function (ev) {
      var p = local(ev);
      if (pointers[ev.pointerId]) pointers[ev.pointerId] = p;
      var ids = Object.keys(pointers);
      if (pinch && ids.length === 2) {
        var A = pointers[ids[0]], B = pointers[ids[1]], d = Math.hypot(A[0] - B[0], A[1] - B[1]);
        if (pinch.d > 0) zoomAt((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, d / pinch.d); pinch.d = d; return;
      }
      if (drag) {
        var dx = p[0] - drag.p[0], dy = p[1] - drag.p[1];
        if (drag.moved || Math.abs(dx) + Math.abs(dy) > 3) { drag.moved = true; oX += dx; oY += dy; oClamp(); drag.p = p; oHover = null; oQueue(); return; }
      }
      var h = treeAt(p[0], p[1]);
      if ((h && oHover && h[0] === oHover[0] && h[1] === oHover[1]) || (!h && !oHover)) return;
      oHover = h; oQueue();
    });
    function endPointer(ev) {
      var wasTap = drag && !drag.moved && ev.pointerType !== "mouse";
      delete pointers[ev.pointerId];
      if (Object.keys(pointers).length < 2) pinch = null;
      if (!Object.keys(pointers).length) { drag = null; orchard.style.cursor = ""; }
      if (wasTap) { var p = local(ev); oHover = treeAt(p[0], p[1]); oQueue(); }
    }
    orchard.addEventListener("pointerup", endPointer);
    orchard.addEventListener("pointercancel", endPointer);
    orchard.addEventListener("pointerleave", function () { if (!drag) { oHover = null; oQueue(); } });
    orchard.addEventListener("dblclick", function () { oReset(); oHover = null; oQueue(); });
    var resetBtn = document.getElementById("orchard-reset");
    if (resetBtn) resetBtn.addEventListener("click", function () { oReset(); oHover = null; oQueue(); });
    onTheme(oQueue);
    var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(function () { oReset(); oQueue(); }, 120); });
    oReset();
    if (reduceMotion) oDraw();
    else {
      var t0 = null;
      (function sweep(ts) { if (t0 === null) t0 = ts; var u = Math.min(1, (ts - t0) / 4200); beam = TAU * (1 - Math.cos(Math.PI * u)) / 2; if (u >= 1) beam = 7; oDraw(); if (u < 1) requestAnimationFrame(sweep); })(performance.now());
    }
  }

  /* ---------- polynomial Möbius over F_p (blog widget) ---------- */
  var muw = document.getElementById("mu-widget");
  if (muw) {
    var selP = document.getElementById("mu-p"), selN = document.getElementById("mu-n");
    function polyMod(a, b, p) { // a, b: coefficient arrays (low→high), b monic
      a = a.slice(); var db = b.length - 1;
      for (var i = a.length - 1; i >= db; i--) { var c = a[i] % p; if (c) for (var j = 0; j <= db; j++) a[i - db + j] = ((a[i - db + j] - c * b[j]) % p + p) % p; }
      a.length = Math.max(db, 0); return a;
    }
    function isZero(a) { for (var i = 0; i < a.length; i++) if (a[i]) return false; return true; }
    function polyDiv(a, b, p) { // exact quotient, b monic
      a = a.slice(); var db = b.length - 1, q = new Array(Math.max(a.length - db, 1)).fill(0);
      for (var i = a.length - 1; i >= db; i--) { var c = a[i] % p; q[i - db] = c; if (c) for (var j = 0; j <= db; j++) a[i - db + j] = ((a[i - db + j] - c * b[j]) % p + p) % p; }
      return q;
    }
    function monics(deg, p) { // all monic polys of exact degree deg
      var out = [], total = Math.pow(p, deg);
      for (var k = 0; k < total; k++) { var a = [], m = k; for (var i = 0; i < deg; i++) { a.push(m % p); m = Math.floor(m / p); } a.push(1); out.push(a); }
      return out;
    }
    function irreducibles(maxDeg, p) {
      var irr = [];
      for (var d = 1; d <= maxDeg; d++) monics(d, p).forEach(function (f) {
        for (var i = 0; i < irr.length; i++) { var g = irr[i]; if (2 * (g.length - 1) > d) break; if (isZero(polyMod(f, g, p))) return; }
        irr.push(f);
      });
      return irr;
    }
    function muPoly(f, irr, p) {
      var k = 0;
      for (var i = 0; i < irr.length; i++) {
        var g = irr[i], dg = g.length - 1, df = f.length - 1;
        if (df === 0) break;
        if (2 * dg > df) { k++; f = [1]; break; } // remaining f is irreducible
        if (isZero(polyMod(f, g, p))) { f = polyDiv(f, g, p); if (f.length - 1 >= dg && isZero(polyMod(f, g, p))) return 0; k++; }
      }
      if (f.length - 1 > 0) k++;
      return k % 2 ? -1 : 1;
    }
    function run() {
      var p = +selP.value, n = +selN.value;
      while (Math.pow(p, n) > 40000) n--;
      selN.value = String(n);
      var irr = irreducibles(Math.floor(n / 2), p), plus = 0, minus = 0, zero = 0;
      monics(n, p).forEach(function (f) { var m = muPoly(f, irr, p); if (m > 0) plus++; else if (m < 0) minus++; else zero++; });
      var tot = plus + minus + zero;
      document.getElementById("mu-plus").textContent = plus;
      document.getElementById("mu-minus").textContent = minus;
      document.getElementById("mu-zero").textContent = zero;
      document.getElementById("mu-sum").textContent = (plus - minus > 0 ? "+" : "") + (plus - minus);
      document.getElementById("mu-bar-plus").style.cssText = "width:" + (100 * plus / tot) + "%;background:var(--plus)";
      document.getElementById("mu-bar-minus").style.cssText = "width:" + (100 * minus / tot) + "%;background:var(--minus)";
      document.getElementById("mu-note").textContent = "Checked all " + tot.toLocaleString() + " monic polynomials of degree " + n + " over F" + p + ". Squarefree: " + (plus + minus).toLocaleString() + (n >= 2 ? " (formula q^n − q^(n−1) = " + (Math.pow(p, n) - Math.pow(p, n - 1)).toLocaleString() + ")" : "") + ".";
    }
    selP.addEventListener("change", run); selN.addEventListener("change", run); run();
  }

  /* ---------- Haga fold (rec-math widget) ---------- */
  var haga = document.getElementById("haga-svg");
  if (haga) {
    var slider = document.getElementById("haga-t"), tOut = document.getElementById("haga-tval"), hOut = document.getElementById("haga-hval");
    var S = 300, M = 40; // square size and margin in SVG units
    function X(x) { return M + x * S; } function Y(y) { return M + (1 - y) * S; }
    function P(pt) { return X(pt[0]).toFixed(2) + "," + Y(pt[1]).toFixed(2); }
    function render() {
      var t = +slider.value / 1000, c = (1 + t * t) / 2; // crease: t·x + y = c
      var sq = [[0, 0], [1, 0], [1, 1], [0, 1]], below = [], crease = [];
      var side = function (q) { return t * q[0] + q[1] - c; };
      for (var i = 0; i < 4; i++) { // clip square to half-plane side ≤ 0
        var a = sq[i], b = sq[(i + 1) % 4], sa = side(a), sb = side(b);
        if (sa <= 0) below.push(a);
        if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) { var k = sa / (sa - sb), pt = [a[0] + k * (b[0] - a[0]), a[1] + k * (b[1] - a[1])]; below.push(pt); crease.push(pt); }
      }
      var nn = t * t + 1;
      var refl = function (q) { var d = 2 * side(q) / nn; return [q[0] - d * t, q[1] - d]; };
      var flap = below.map(refl), h = (1 - t) / (1 + t);
      var col = { ink: css("--ink"), soft: css("--ink-soft"), acc: css("--accent"), card: css("--card"), wash: css("--accent-wash"), muted: css("--muted"), plus: css("--plus") };
      var s = "";
      s += '<polygon points="' + sq.map(P).join(" ") + '" fill="' + col.card + '" stroke="' + col.ink + '" stroke-width="1.5"/>';
      s += '<polygon points="' + flap.map(P).join(" ") + '" fill="' + col.wash + '" stroke="' + col.acc + '" stroke-width="1.5"/>';
      if (crease.length === 2) s += '<line x1="' + X(crease[0][0]) + '" y1="' + Y(crease[0][1]) + '" x2="' + X(crease[1][0]) + '" y2="' + Y(crease[1][1]) + '" stroke="' + col.soft + '" stroke-width="1.5" stroke-dasharray="6 5"/>';
      s += '<line x1="' + X(1) + '" y1="' + Y(h) + '" x2="' + (X(1) + 26) + '" y2="' + Y(h) + '" stroke="' + col.plus + '" stroke-width="1.5"/>';
      s += '<circle cx="' + X(1) + '" cy="' + Y(h) + '" r="5" fill="' + col.plus + '"/>';
      s += '<circle cx="' + X(t) + '" cy="' + Y(1) + '" r="5" fill="' + col.acc + '"/>';
      s += '<circle cx="' + X(0) + '" cy="' + Y(0) + '" r="3.5" fill="none" stroke="' + col.muted + '" stroke-width="1.2"/>';
      var txt = function (x, y, str, anchor, fill) { return '<text x="' + x + '" y="' + y + '" font-family="JetBrains Mono, monospace" font-size="12" fill="' + (fill || col.soft) + '" text-anchor="' + (anchor || "start") + '">' + str + "</text>"; };
      s += txt(X(t), Y(1) - 12, "corner → (t, 1)", "middle", col.ink);
      s += txt(X(1) + 30, Y(h) + 4, "h", "start", col.plus);
      s += txt(X(0) - 6, Y(0) + 18, "(0,0)", "start");
      s += txt(X(1), Y(0) + 18, "(1,0)", "end");
      haga.innerHTML = s;
      tOut.textContent = t.toFixed(3); hOut.textContent = h.toFixed(3);
    }
    slider.addEventListener("input", render); render(); onTheme(render);
    document.querySelectorAll("[data-haga]").forEach(function (b) { b.addEventListener("click", function () { slider.value = b.getAttribute("data-haga"); render(); }); });
  }

  /* ---------- generative art tiles ---------- */
  var arts = {
    miura: function (g) { // Miura-ori crease pattern: straight verticals, zigzag rows
      var ctx = g.ctx, w = g.w, h = g.h, cols = 6, rows = 7, cw = w / cols, rh = h / rows, off = rh * 0.32;
      ctx.lineWidth = 1.4;
      for (var c = 0; c <= cols; c++) {
        for (var r = 0; r < rows + 1; r++) {
          ctx.beginPath(); ctx.strokeStyle = (r + c) % 2 ? css("--plus") : css("--minus"); ctx.setLineDash((r + c) % 2 ? [] : [5, 4]);
          ctx.moveTo(c * cw, r * rh - off + (c % 2 ? off : 0)); ctx.lineTo(c * cw, (r + 1) * rh - off + (c % 2 ? off : 0)); ctx.stroke();
        }
      }
      for (var r2 = 0; r2 <= rows + 1; r2++) {
        ctx.beginPath(); ctx.strokeStyle = r2 % 2 ? css("--plus") : css("--minus"); ctx.setLineDash(r2 % 2 ? [] : [5, 4]);
        for (var c2 = 0; c2 <= cols; c2++) { var x = c2 * cw, y = r2 * rh - off + (c2 % 2 ? off : 0); c2 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    },
    ford: function (g) { // Ford circles for fractions p/q, q ≤ 14
      var ctx = g.ctx, w = g.w, h = g.h, Q = 40;
      function gcd(a, b) { return b ? gcd(b, a % b) : a; }
      ctx.lineWidth = 1.2;
      for (var q = 1; q <= Q; q++) for (var p = 0; p <= q; p++) {
        if (gcd(p, q) !== 1) continue;
        var r = w / (2 * q * q); if (r < 0.6) continue; ctx.beginPath(); ctx.strokeStyle = q % 2 ? css("--plus") : css("--minus");
        ctx.arc(p / q * w, h - r - 2, r, 0, 6.2832); if (q > 1) { ctx.fillStyle = css("--accent-wash"); ctx.fill(); } ctx.stroke();
      }
    },
    gauss: function (g) { // Gaussian primes with |a|,|b| ≤ 34
      var ctx = g.ctx, w = g.w, h = g.h, R = 34, cell = w / (2 * R + 1);
      function isP(n) { if (n < 2) return false; for (var d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }
      for (var a = -R; a <= R; a++) for (var b = -R; b <= R; b++) {
        var A = Math.abs(a), B = Math.abs(b), prime = (A && B) ? isP(a * a + b * b) : (isP(A + B) && (A + B) % 4 === 3);
        if (!prime) continue;
        ctx.fillStyle = (a * a + b * b) % 4 === 1 ? css("--plus") : css("--minus");
        ctx.fillRect((a + R) * cell + cell * 0.12, (b + R) * cell + cell * 0.12, cell * 0.76, cell * 0.76);
      }
    },
    times: function (g) { // times-table mod 240, multiplier 2 (cardioid) overlaid with 3 (nephroid)
      var ctx = g.ctx, w = g.w, h = g.h, n = 240, R = w / 2 - 10, cx = w / 2, cy = h / 2;
      [[2, "--plus"], [3, "--minus"]].forEach(function (m) {
        ctx.strokeStyle = css(m[1]); ctx.globalAlpha = 0.55; ctx.lineWidth = 0.7; ctx.beginPath();
        for (var k = 0; k < n; k++) {
          var a1 = 2 * Math.PI * k / n, a2 = 2 * Math.PI * ((k * m[0]) % n) / n;
          ctx.moveTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); ctx.lineTo(cx + R * Math.cos(a2), cy + R * Math.sin(a2));
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  };
  var tiles = document.querySelectorAll("canvas[data-art]");
  function drawTiles() { tiles.forEach(function (cv) { var g = setupCanvas(cv); g.ctx.clearRect(0, 0, g.w, g.h); arts[cv.getAttribute("data-art")](g); }); }
  if (tiles.length) { drawTiles(); onTheme(drawTiles); window.addEventListener("resize", drawTiles); }
})();

/* ---------- lab iframes: grow to fit their content (same-origin only) ---------- */
(function () {
  document.querySelectorAll('iframe[data-autoheight="1"]').forEach(function (f) {
    function fit() {
      try { var d = f.contentDocument; if (!d || !d.body) return; var h = d.documentElement.scrollHeight; if (h > 200) f.style.height = (h + 4) + "px"; } catch (e) {}
    }
    f.addEventListener("load", function () {
      fit();
      try { if (window.ResizeObserver) new ResizeObserver(fit).observe(f.contentDocument.body); } catch (e) {}
      setTimeout(fit, 800); setTimeout(fit, 2500);
    });
  });
})();

/* ---------- art page: photo lightbox ---------- */
(function () {
  var dlg = document.getElementById("lightbox");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var img = dlg.querySelector("img"), cap = dlg.querySelector(".lb-cap");
  document.querySelectorAll("[data-full]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      img.src = btn.getAttribute("data-full"); img.alt = btn.querySelector("img") ? btn.querySelector("img").alt : "";
      cap.textContent = btn.getAttribute("data-caption") || ""; dlg.showModal();
    });
  });
  dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();
