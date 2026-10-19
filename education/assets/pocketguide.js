/* ============================================================
   Field Pocket Guide — shared toolkit (classic JS, no build step)
   Number helpers and the on-screen numpad. The math itself lives in
   pg-math.js (scaling, error, square-root, RTD) and tc-core.js
   (thermocouples), imported as ES modules by every tool page and by
   the main-site Pulse, so there is exactly one implementation.
   Conventions: signals 4-20 mA, % is percent OF SPAN (not reading).
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
