/* ============================================================
   Idea Lab :: shell.js
   The engine every page shares: starfield, the local progress
   store, the global nav (built once from the manifest), the
   honest disclosure, and badge toasts.
   Classic script, no modules, no fetch. window.IdeaLab is the API.
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.IDEA_LAB || { wings: [], ranks: [{ name: "Stardust", min: 0 }], badges: [] };
  var KEY = "ideaLab.v1";

  /* ---- storage: localStorage for the longest local life, with a
     safe fallback so nothing breaks on file:// or private mode ---- */
  var mem = { xp: 0, badges: {} };
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) mem = JSON.parse(raw);
    } catch (e) { /* fall back to in-memory only */ }
    if (!mem || typeof mem !== "object") mem = { xp: 0, badges: {} };
    if (typeof mem.xp !== "number") mem.xp = 0;
    if (!mem.badges) mem.badges = {};
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ }
  }
  load();

  /* ---- rank from xp ---- */
  function rank() {
    var r = DATA.ranks[0], i;
    for (i = 0; i < DATA.ranks.length; i++) {
      if (mem.xp >= DATA.ranks[i].min) r = DATA.ranks[i];
    }
    return r;
  }
  function nextRank() {
    for (var i = 0; i < DATA.ranks.length; i++) {
      if (mem.xp < DATA.ranks[i].min) return DATA.ranks[i];
    }
    return null;
  }

  /* ---- badges + xp ---- */
  function badgeDef(id) {
    for (var i = 0; i < DATA.badges.length; i++) if (DATA.badges[i].id === id) return DATA.badges[i];
    return { id: id, name: id, icon: "⭐", note: "" };
  }
  function hasBadge(id) { return !!mem.badges[id]; }
  function award(id, xp) {
    var fresh = !mem.badges[id];
    if (fresh) {
      mem.badges[id] = true;
      mem.xp += (xp || 0);
      save();
      toast(badgeDef(id));
    }
    return fresh;
  }
  function addXP(n) { mem.xp += (n || 0); save(); }
  function reset() { mem = { xp: 0, badges: {} }; save(); }

  /* ---- starfield: gentle, reduced-motion aware ---- */
  function starfield(canvasId) {
    var c = document.getElementById(canvasId || "il-stars");
    if (!c || !c.getContext) return;
    var ctx = c.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stars = [];
    function size() {
      c.width = window.innerWidth; c.height = window.innerHeight;
      var n = Math.min(180, Math.floor((c.width * c.height) / 9000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * c.width, y: Math.random() * c.height,
          r: Math.random() * 1.4 + 0.3, t: Math.random() * Math.PI * 2,
          s: Math.random() * 0.015 + 0.004,
          hue: Math.random() < 0.18 ? "#7c5cff" : (Math.random() < 0.5 ? "#3ee0ff" : "#ffffff")
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.t += st.s;
        var a = reduce ? 0.7 : (0.35 + Math.abs(Math.sin(st.t)) * 0.65);
        ctx.globalAlpha = a;
        ctx.fillStyle = st.hue;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(draw);
    }
    size();
    window.addEventListener("resize", size);
    draw();
  }

  /* ---- toast for a freshly earned badge ---- */
  function toast(b) {
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span style="font-size:1.3em">' + (b.icon || "⭐") +
      '</span><span>Badge earned: ' + esc(b.name) + "</span>";
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
    }, 3200);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  /* ---- the global nav, built ONCE from the manifest ----
     base is the path back to /idea-lab/ from the current page
     (".", "..", etc.) so it works locally and on Pages alike ---- */
  function nav(currentKey, base) {
    base = base || ".";
    var r = rank();
    var links = DATA.wings.map(function (w) {
      var href = base + "/" + w.href;
      var cur = (w.key === currentKey) ? ' aria-current="page"' : "";
      return '<a href="' + href + '"' + cur + '>' + esc(w.name) + "</a>";
    }).join("");

    var el = document.createElement("nav");
    el.className = "il-nav";
    el.innerHTML =
      '<div class="wrap il-nav__inner">' +
        '<a class="il-nav__brand" href="' + base + '/">' +
          '<img class="il-nav__logo" src="' + base + '/assets/logo.svg" alt="" width="28" height="28"> Idea Lab' +
        "</a>" +
        '<div class="il-nav__links">' + links + "</div>" +
        '<div class="il-nav__rank" title="Earned in this browser only">' +
          "Rank: <b>" + esc(r.name) + "</b> · " + mem.xp + " XP" +
        "</div>" +
      "</div>";
    document.body.insertBefore(el, document.body.firstChild);
  }

  /* ---- render a wing's lab list from the manifest, so a wing
     hub is data, not hand-built cards ---- */
  function wingByKey(key) {
    for (var i = 0; i < DATA.wings.length; i++) if (DATA.wings[i].key === key) return DATA.wings[i];
    return null;
  }
  function renderWingHub(wingKey, selector) {
    var wing = wingByKey(wingKey);
    var host = document.querySelector(selector);
    if (!wing || !host) return;
    (wing.labs || []).forEach(function (lab) {
      var live = lab.status === "live";
      var card = document.createElement(live ? "a" : "div");
      card.className = "card card--wing" + (live ? "" : " card--locked");
      if (live) card.href = lab.href;
      card.innerHTML =
        '<span class="card__glow" style="background:' + (wing.color || "#3ee0ff") + '"></span>' +
        '<span class="card__icon">' + (lab.icon || "✦") + "</span>" +
        '<span class="pill ' + (live ? "pill--live" : "pill--soon") + '">' +
          (live ? "Open" : "Charting") + "</span>" +
        "<h3>" + esc(lab.name) + "</h3>" +
        '<p class="muted" style="margin:.3em 0">' + esc(lab.tagline || "") + "</p>" +
        "<p>" + esc(lab.blurb || "") + "</p>";
      host.appendChild(card);
    });
  }

  /* ---- render a wing's progressive module ladder: grouped by
     level, completed modules marked (by their badge), and the first
     unfinished live module highlighted as "next up" ---- */
  function renderTrack(wingKey, selector) {
    var wing = wingByKey(wingKey);
    var host = document.querySelector(selector);
    if (!wing || !host) return;
    var mods = wing.modules || [];
    var live = mods.filter(function (m) { return m.status === "live"; });
    function isDone(m) { return m.badge && hasBadge(m.badge); }
    var doneCount = live.filter(isDone).length;
    var nextUp = live.filter(function (m) { return !isDone(m); })[0];
    var nextKey = nextUp ? nextUp.key : null;
    var soon = mods.length - live.length;

    var prog = document.createElement("div");
    prog.className = "card";
    prog.innerHTML =
      '<div class="track-prog"><div><b>' + doneCount + " of " + live.length + "</b> modules complete" +
      (soon ? ' · <span class="muted">' + soon + " more charting</span>" : "") +
      '</div><div class="bar"><i style="width:' + (live.length ? Math.round(doneCount / live.length * 100) : 0) + '%"></i></div></div>';
    host.appendChild(prog);

    var levels = wing.levels && wing.levels.length ? wing.levels : [{ key: null, name: "", sub: "" }];
    levels.forEach(function (lv) {
      var lvMods = mods.filter(function (m) { return (m.level || null) === lv.key; });
      if (!lvMods.length) return;
      var sec = document.createElement("div");
      sec.className = "level";
      sec.innerHTML = '<div class="level__head"><span class="level__name">' + esc(lv.name) +
        '</span><span class="level__sub">' + esc(lv.sub || "") + "</span></div>";
      var list = document.createElement("div");
      list.className = "modlist";
      lvMods.forEach(function (m) {
        var isLive = m.status === "live", done = isDone(m), next = m.key === nextKey;
        var el = document.createElement(isLive ? "a" : "div");
        el.className = "mod " + (isLive ? "mod--live" : "mod--soon") + (done ? " mod--done" : "") + (next ? " mod--next" : "");
        if (isLive) el.href = m.href;
        var label = done ? "Done ✓" : (isLive ? (next ? "Next up" : "Open") : "Charting");
        var cls = done ? "st-done" : (isLive ? (next ? "st-next" : "st-open") : "st-soon");
        el.innerHTML =
          '<span class="mod__ico">' + (m.icon || "✦") + "</span>" +
          '<span class="mod__body"><h4>' + esc(m.name) + "</h4><p>" + esc(m.tagline || m.blurb || "") + "</p></span>" +
          '<span class="mod__status ' + cls + '">' + label + "</span>";
        list.appendChild(el);
      });
      sec.appendChild(list);
      host.appendChild(sec);
    });
  }

  /* ---- glossary: clickable [data-term] elements open a sourced
     definition card. Register once with a {slug: {term,short,deep,source}} map ---- */
  function srcHost(url){ try { return String(url).replace(/^https?:\/\//, "").split("/")[0]; } catch (e) { return url; } }
  function glossary(data){
    var GLOSS = data || {};
    var modal = document.createElement("div");
    modal.className = "il-modal";
    modal.innerHTML =
      '<div class="il-modal__card" role="dialog" aria-modal="true" aria-labelledby="il-gterm">' +
        '<h3 id="il-gterm"></h3>' +
        '<p class="il-modal__short" id="il-gshort"></p>' +
        '<p class="il-modal__deep" id="il-gdeep"></p>' +
        '<div class="il-modal__foot"><span class="il-modal__src" id="il-gsrc"></span>' +
        '<button class="btn btn--go tiny" id="il-gclose" type="button">Got it</button></div>' +
      "</div>";
    document.body.appendChild(modal);
    function close(){ modal.classList.remove("open"); }
    modal.addEventListener("click", function (e){ if (e.target === modal) close(); });
    modal.querySelector("#il-gclose").addEventListener("click", close);
    document.addEventListener("keydown", function (e){ if (e.key === "Escape") close(); });
    document.body.addEventListener("click", function (e){
      var t = e.target.closest("[data-term]"); if (!t) return;
      var d = GLOSS[t.getAttribute("data-term")]; if (!d) return;
      modal.querySelector("#il-gterm").textContent = d.term || t.getAttribute("data-term");
      modal.querySelector("#il-gshort").textContent = d.short || "";
      modal.querySelector("#il-gdeep").textContent = d.deep || "";
      var src = modal.querySelector("#il-gsrc");
      if (d.source) src.innerHTML = "Source: <a href=\"" + esc(d.source) + "\" target=\"_blank\" rel=\"noopener\">" + esc(srcHost(d.source)) + "</a>";
      else src.textContent = "";
      modal.classList.add("open");
    });
  }

  /* ---- honest disclosure, shown once per session ---- */
  function disclosure(mountId) {
    var seen;
    try { seen = window.sessionStorage.getItem("ideaLab.disclosed"); } catch (e) { seen = null; }
    if (seen) return;
    var host = mountId ? document.getElementById(mountId) : null;
    var el = document.createElement("div");
    el.className = "il-disclose wrap";
    el.style.margin = "14px auto";
    el.innerHTML =
      '<span aria-hidden="true">\u{1F512}</span>' +
      "<span><b>Your progress lives only in this browser.</b> No account, no sign in, " +
      "nothing about you is sent anywhere or saved on a server. Clear your history and it resets. " +
      "Saved progress across devices is not available yet.</span>" +
      '<button class="btn btn--ghost tiny" type="button">Got it</button>';
    el.querySelector("button").addEventListener("click", function () {
      try { window.sessionStorage.setItem("ideaLab.disclosed", "1"); } catch (e) {}
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    if (host) host.appendChild(el);
    else document.body.insertBefore(el, document.body.children[1] || null);
  }

  /* ---- public API ---- */
  window.IdeaLab = {
    data: DATA,
    starfield: starfield,
    nav: nav,
    disclosure: disclosure,
    renderWingHub: renderWingHub,
    renderTrack: renderTrack,
    wingByKey: wingByKey,
    glossary: glossary,
    award: award,
    addXP: addXP,
    hasBadge: hasBadge,
    badgeDef: badgeDef,
    xp: function () { return mem.xp; },
    rank: rank,
    nextRank: nextRank,
    reset: reset,
    esc: esc
  };
})();
