/* ============================================================
   Field Pocket Guide — shared toolkit (classic JS, no build step)
   Math is the product here, so it stays plain and auditable.
   Conventions: signals 4-20 mA, % is percent OF SPAN (not reading),
   temps in degrees C, RTD per IEC 60751, thermocouples per ITS-90.
   ============================================================ */
(function () {
  "use strict";
  var PG = (window.PG = window.PG || {});

  /* ---------------- number helpers ---------------- */
  PG.num = function (v) { var n = parseFloat(v); return isFinite(n) ? n : NaN; };
  PG.ok = function () { for (var i = 0; i < arguments.length; i++) { if (!isFinite(arguments[i])) return false; } return true; };
  PG.fmt = function (v, dp) {
    if (!isFinite(v)) return "—";
    if (dp == null) dp = 4;
    return v.toFixed(dp);
  };
  PG.fmtTrim = function (v, dp) {
    if (!isFinite(v)) return "—";
    if (dp == null) dp = 4;
    return String(parseFloat(v.toFixed(dp)));
  };

  /* ---------------- linear scaling ----------------
     Map a value on an input span to an output span. This is the
     spine of every transmitter: % of span is shared by both sides. */
  PG.scale = function (x, inLo, inHi, outLo, outHi) {
    if (inHi === inLo) return NaN;
    return outLo + (x - inLo) * (outHi - outLo) / (inHi - inLo);
  };
  PG.pctSpan = function (x, lo, hi) { return hi === lo ? NaN : (x - lo) / (hi - lo) * 100; };
  PG.fromPct = function (p, lo, hi) { return lo + (p / 100) * (hi - lo); };
  /* hold a value inside a range, lo/hi given in either order (handles reverse-acting and bipolar) */
  PG.clamp = function (v, a, b) { var lo = Math.min(a, b), hi = Math.max(a, b); return v < lo ? lo : v > hi ? hi : v; };

  /* ---------------- calibration error (percent OF SPAN) ----------------
     expected = ideal output for the applied input.
     error% = (actual - expected) / output-span * 100.
     The operator types magnitudes only; the sign of the error is
     produced by the math, never keyed in. */
  PG.expectedOut = function (input, inLo, inHi, outLo, outHi) {
    return PG.scale(input, inLo, inHi, outLo, outHi);
  };
  PG.errSpan = function (actual, expected, outLo, outHi) {
    var span = outHi - outLo;
    if (span === 0) return NaN;
    return (actual - expected) / span * 100;
  };

  /* ---------------- square-root extraction (DP flow) ----------------
     A DP cell measures differential pressure; flow ~ sqrt(DP).
     %DP is linear in the 4-20 mA of a DP signal; %Flow = sqrt(%DP). */
  PG.maToPct = function (ma) { return (ma - 4) / 16 * 100; };
  PG.pctToMa = function (p) { return 4 + (p / 100) * 16; };
  PG.sqrtExtract = function (pctDP) { return pctDP <= 0 ? 0 : Math.sqrt(pctDP / 100) * 100; }; // %DP -> %Flow
  PG.sqrtSquare = function (pctFlow) { var f = pctFlow / 100; return f * f * 100; };           // %Flow -> %DP

  /* ---------------- RTD: Pt platinum, IEC 60751 / ITS-90, alpha 0.00385 ---------------- */
  PG.RTD = {
    A: 3.9083e-3, B: -5.775e-7, C: -4.183e-12,
    res: function (t, R0) {                 // temperature C -> resistance ohms
      R0 = R0 || 100;
      var A = this.A, B = this.B, C = this.C;
      if (t >= 0) return R0 * (1 + A * t + B * t * t);
      return R0 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t);
    },
    temp: function (R, R0) {                 // resistance ohms -> temperature C
      R0 = R0 || 100;
      var A = this.A, B = this.B;
      if (R >= R0) {                         // t >= 0: closed-form quadratic root
        var disc = A * A - 4 * B * (1 - R / R0);
        if (disc < 0) return NaN;
        return (-A + Math.sqrt(disc)) / (2 * B);
      }
      var t = (R / R0 - 1) / A;              // t < 0: Newton-Raphson from a linear seed
      for (var i = 0; i < 60; i++) {
        var f = this.res(t, R0) - R;
        var d = (this.res(t + 1e-3, R0) - this.res(t - 1e-3, R0)) / 2e-3;
        if (d === 0) break;
        var step = f / d; t -= step;
        if (Math.abs(step) < 1e-7) break;
      }
      return t;
    }
  };

  /* ---------------- thermocouple: ITS-90, reference junction 0 C ----------------
     Coefficients are injected (verified) as PG.TC_DATA[type] = {
       tMin, tMax, subRanges:[{tMinC,tMaxC,coeffs:[c0..cn],expA0,expA1,expA2}], ... }
     emf returns mV for a temperature; temp inverts emf by bisection over
     the monotonic range. */
  PG.TC = {
    emf: function (type, t) {
      var d = (PG.TC_DATA || {})[type]; if (!d) return NaN;
      var r = null, i;
      for (i = 0; i < d.subRanges.length; i++) {
        var sr = d.subRanges[i];
        if (t >= sr.tMinC && t <= sr.tMaxC) { r = sr; break; }
      }
      if (!r) return NaN;
      var e = 0, p = 1;
      for (i = 0; i < r.coeffs.length; i++) { e += r.coeffs[i] * p; p *= t; }
      if (r.expA0 != null && isFinite(r.expA0)) {
        e += r.expA0 * Math.exp(r.expA1 * (t - r.expA2) * (t - r.expA2));
      }
      return e;
    },
    temp: function (type, mv) {
      var d = (PG.TC_DATA || {})[type]; if (!d) return NaN;
      var lo = (d.invMin != null ? d.invMin : d.tMin), hi = d.tMax;
      var elo = this.emf(type, lo), ehi = this.emf(type, hi);
      if (mv < Math.min(elo, ehi) - 1e-9 || mv > Math.max(elo, ehi) + 1e-9) return NaN;
      for (var i = 0; i < 90; i++) {
        var mid = (lo + hi) / 2, em = this.emf(type, mid);
        if (em < mv) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
  };

  /* ---------------- on-screen numpad (no negative key) ----------------
     readonly inputs => no OS keyboard, no way to type a minus. Physical
     keyboard is captured manually and the sign keys are blocked. Negative
     RANGE values are set with an explicit per-field sign toggle, never the pad. */
  PG.pad = (function () {
    var active = null, padEl = null;
    function build() {
      padEl = document.createElement("div");
      padEl.className = "pg-pad";
      padEl.setAttribute("role", "group");
      padEl.setAttribute("aria-label", "Number pad");
      var keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "back"];
      var h = '<div class="pg-pad__grid">';
      keys.forEach(function (k) {
        h += '<button type="button" class="pg-key" data-k="' + k + '">' + (k === "back" ? "⌫" : k) + "</button>";
      });
      h += '</div><div class="pg-pad__row">' +
        '<button type="button" class="pg-key pg-key--wide" data-k="clear">Clear</button>' +
        '<button type="button" class="pg-key pg-key--done" data-k="done">Done</button></div>';
      padEl.innerHTML = h;
      document.body.appendChild(padEl);
      padEl.addEventListener("mousedown", function (e) { e.preventDefault(); }); // keep focus on field
      padEl.addEventListener("click", function (e) {
        var b = e.target.closest("[data-k]"); if (b) press(b.getAttribute("data-k"));
      });
    }
    function press(k) {
      if (k === "done") { close(); return; }
      if (!active) return;
      var neg = (active.value.charAt(0) === "-"), v = neg ? active.value.slice(1) : active.value;
      if (k === "back") v = v.slice(0, -1);
      else if (k === "clear") { v = ""; neg = false; }
      else if (k === ".") { if (v.indexOf(".") === -1) v += (v === "" ? "0." : "."); }
      else v += k;
      set(active, (neg && v !== "" ? "-" : "") + v);
    }
    function set(el, v) { el.value = v; el.classList.toggle("is-neg", v.charAt(0) === "-"); el.dispatchEvent(new Event("input", { bubbles: true })); }
    function open(el) {
      if (!padEl) build();
      if (active) active.classList.remove("pg-num--active");
      active = el; el.classList.add("pg-num--active");
      padEl.classList.add("is-open"); document.body.classList.add("pg-pad-open");
    }
    function close() {
      var was = active;
      if (was) was.classList.remove("pg-num--active");
      active = null;
      if (padEl) padEl.classList.remove("is-open");
      document.body.classList.remove("pg-pad-open");
      if (was) was.blur(); // fire blur so a page can commit/validate the field (e.g. clamp to a band)
    }
    document.addEventListener("keydown", function (e) {
      if (!active) return;
      if (e.key >= "0" && e.key <= "9") { press(e.key); e.preventDefault(); }
      else if (e.key === ".") { press("."); e.preventDefault(); }
      else if (e.key === "Backspace") { press("back"); e.preventDefault(); }
      else if (e.key === "Enter") { close(); e.preventDefault(); }
      else if (e.key === "-" || e.key === "+") { e.preventDefault(); } // sign is never typed
    });
    var outsideBound = false;
    function init(root) {
      (root || document).querySelectorAll(".pg-num").forEach(function (el) {
        if (el.dataset.pgWired) return;
        el.dataset.pgWired = "1";
        el.setAttribute("readonly", "readonly");
        el.setAttribute("inputmode", "none");
        el.setAttribute("autocomplete", "off");
        el.addEventListener("focus", function () { open(el); });
        el.addEventListener("click", function () { open(el); });
      });
      if (!outsideBound) {
        outsideBound = true;
        document.addEventListener("click", function (e) {
          if (!active) return;
          if (e.target.closest(".pg-num") || e.target.closest(".pg-pad") || e.target.closest(".pg-sign")) return;
          close();
        });
      }
    }
    return { init: init, open: open, close: close, set: set };
  })();

  /* sign toggle for range fields (compound / negative ranges) */
  PG.bindSigns = function (root) {
    (root || document).querySelectorAll("[data-sign]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var el = document.querySelector(btn.getAttribute("data-sign")); if (!el) return;
        var v = el.value || "";
        if (v.charAt(0) === "-") v = v.slice(1); else if (v !== "" && parseFloat(v) !== 0) v = "-" + v;
        PG.pad.set(el, v);
        btn.classList.toggle("is-neg", v.charAt(0) === "-");
      });
    });
  };

  /* convenience: re-run a page's compute on any input and on load */
  PG.live = function (compute) {
    document.addEventListener("input", function () { compute(); });
    document.addEventListener("DOMContentLoaded", compute);
    if (document.readyState !== "loading") compute();
  };

  document.addEventListener("DOMContentLoaded", function () {
    PG.pad.init(document);
    PG.bindSigns(document);
  });
})();
