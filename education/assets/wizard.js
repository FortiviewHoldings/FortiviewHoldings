/* ============================================================
   Field Pocket Guide — shared guided-wizard engine (classic JS)
   One chat brain for every tool. Pulse collects the inputs in
   plain language; the math stays on the page (pg-math.js and
   friends), the wizard just talks and renders.
   A tool mounts it with a thin config: PGWizard.mount({...}).

   PULSE THROUGH PRAGOPTICS (2026-11-15). The chat box asks the
   platform's public assistant door, the same door Ask Pulse on
   /education uses: Pulse's prompt, the guides and the calculators
   live there, and the key is the environment's own, vaulted on
   the platform. The old proxy at ai.bridgesindust.com is gone.
   The platform runs the calculator and answers in words; the
   calculator's arguments come back with the answer, the page
   runs the same calculation itself (cfg.run) and draws the result
   card and the printable report exactly as before. The ids are
   the same four as src/model/config.js. cfg.system and the tool
   declarations stay on the page for reference only; the prompt
   that rules is the one on Pulse's install.
   ============================================================ */
(function () {
  "use strict";
  var PGWizard = (window.PGWizard = window.PGWizard || {});
  var PLATFORM = { api: "https://api.pragoptics.com/api/v1", env: "7a677248-2920-4aee-9bde-dab0782e0439", install: "084c9aba02dc115f", lane: "live" };
  var MAX_TURNS = 10;   // the door reads the last ten turns of history
  var $ = function (id) { return document.getElementById(id); };

  // ---- the challenge: sha256(nonce + "." + counter) with `difficulty` leading zero bits, fetched ahead and solved once ----
  function leadingZeroBits(str) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
      var dv = new DataView(buf), n = 0;
      for (var i = 0; i < 8; i++) { var w = dv.getUint32(i * 4); if (w === 0) { n += 32; continue; } n += Math.clz32(w); break; }
      return n;
    });
  }
  function solve(nonce, difficulty) {
    return (function step(c) {
      if (c > 50000000) return Promise.resolve("");
      return leadingZeroBits(nonce + "." + c).then(function (n) { return n >= difficulty ? String(c) : step(c + 1); });
    })(0);
  }
  var pending = null;
  function fetchChallenge() {
    if (pending) return pending;
    pending = fetch(PLATFORM.api + "/public/" + encodeURIComponent(PLATFORM.env) + "/challenge?lane=" + encodeURIComponent(PLATFORM.lane))
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error((d && d.error) || ("The platform answered " + r.status)); return d; }); })
      .then(function (d) {
        return solve(d.nonce, d.difficulty).then(function (counter) {
          return { nonce: d.nonce, counter: counter, readyAt: Date.now() + (d.minAgeMs || 2000), expiresAt: Date.parse(d.expiresAt) || (Date.now() + 15 * 60000) };
        });
      })
      .catch(function (e) { pending = null; throw e; });
    return pending;
  }
  /** A solved challenge, fetched ahead so a person never waits and never sends too soon; the next one warms while this one is used. */
  function challenge() {
    return fetchChallenge().then(function (c) {
      if (Date.now() > c.expiresAt - 30000) { pending = null; return challenge(); }
      var wait = Math.max(0, c.readyAt - Date.now());
      return new Promise(function (r) { setTimeout(r, wait); }).then(function () {
        pending = null; fetchChallenge().catch(function () {});
        return { nonce: c.nonce, counter: c.counter };
      });
    });
  }
  function visitor() {
    try {
      var v = localStorage.getItem("po.visitor");
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("po.visitor", v); }
      return v;
    } catch (e) { return "anon"; }
  }
  // the door's refusals in Pulse's voice; the platform's own visitor sentences are kept when it has them
  function words(status, d) {
    var theirs = String((d && d.error) || "").trim(), code = String((d && d.code) || "");
    if (["VISITOR_CAP", "MONTH_CAP", "SHARE_SPENT", "AI_NOT_CONNECTED", "AI_BALANCE_EMPTY", "AI_CALLS_EXHAUSTED"].indexOf(code) >= 0 && theirs) return theirs;
    if (status === 429 || code === "AI_RATE_LIMITED") return "Pulse is busy right now. Give it a second and try again.";
    if (status >= 500) return "Pulse is not available right now. The manual form on this page still works.";
    return theirs || "Pulse could not answer that just now.";
  }
  /** One question to Pulse on the platform: { answer, actions } where a calculator action is { name, ok, args, result }. */
  function askPlatform(question, history) {
    return challenge().then(function (pow) {
      var body = JSON.stringify({ lane: PLATFORM.lane, pow: pow, visitor: visitor(), question: String(question || "").slice(0, 2000), history: history });
      var url = PLATFORM.api + "/public/" + encodeURIComponent(PLATFORM.env) + "/modules/" + encodeURIComponent(PLATFORM.install) + "/ask?lane=" + encodeURIComponent(PLATFORM.lane);
      // a plain POST (text/plain, no custom header) so no browser preflights it; the platform adds the site's origin to the answer
      return (function attempt(n) {
        return fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: body }).then(function (res) {
          if (res.status === 503 && n < 1) return new Promise(function (r) { setTimeout(r, 900); }).then(function () { return attempt(n + 1); });
          return res.json().catch(function () { return {}; }).then(function (d) {
            if (!res.ok) { var e = new Error(words(res.status, d)); e.status = res.status; throw e; }
            return { answer: String(d.answer || ""), actions: Array.isArray(d.actions) ? d.actions : [] };
          });
        });
      })(0);
    });
  }

  function makeTable(headings, rows, cls) {
    var t = document.createElement("table");
    t.className = cls || "pgw-table";
    if (headings) {
      var th = document.createElement("thead"), htr = document.createElement("tr");
      headings.forEach(function (h) { var c = document.createElement("th"); c.textContent = h; htr.appendChild(c); });
      th.appendChild(htr); t.appendChild(th);
    }
    var tb = document.createElement("tbody");
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      row.forEach(function (cell, i) {
        var td = document.createElement("td");
        if (i > 0) td.className = "num";
        td.textContent = cell;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  // Build the standard result card body from a plain spec the tool returns:
  //   { label, value, unit, tables:[{caption, headings, rows}] }
  // A tool can instead return a DOM node from render() and we just drop it in.
  function cardFromSpec(spec) {
    var frag = document.createDocumentFragment();
    if (spec.label != null || spec.value != null) {
      var head = document.createElement("div");
      head.className = "pgw-result__head";
      var lbl = document.createElement("span"); lbl.className = "pgw-result__lbl"; lbl.textContent = spec.label || "";
      var num = document.createElement("span"); num.className = "pgw-result__num";
      num.textContent = (spec.value != null ? spec.value : "") + (spec.unit ? " " + spec.unit : "");
      head.appendChild(lbl); head.appendChild(num); frag.appendChild(head);
    }
    (spec.tables || []).forEach(function (tb) {
      if (tb.caption) { var cap = document.createElement("div"); cap.className = "pgw-tcap"; cap.textContent = tb.caption; frag.appendChild(cap); }
      var wrap = document.createElement("div"); wrap.className = "pgw-twrap";
      wrap.appendChild(makeTable(tb.headings || null, tb.rows || []));
      frag.appendChild(wrap);
    });
    return frag;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Build a clean, print-only report document from a declarative spec a tool returns:
  //   { title, subtitle, result:{label,value}, sections:[{title, grid:[{k,v,wide}], table:{headings,rows}, note}] }
  function buildReport(spec) {
    var frag = document.createDocumentFragment();
    var head = el("header", "pgwps-head");
    var brand = el("div");
    brand.appendChild(el("div", "pgwps-title", spec.title || "Report"));
    if (spec.subtitle) brand.appendChild(el("div", "pgwps-sub", spec.subtitle));
    head.appendChild(brand);
    if (spec.result) {
      var res = el("div", "pgwps-result");
      res.appendChild(el("div", "pgwps-result__l", spec.result.label || ""));
      res.appendChild(el("div", "pgwps-result__v", spec.result.value || ""));
      head.appendChild(res);
    }
    frag.appendChild(head);
    (spec.sections || []).forEach(function (sec) {
      var s = el("section", "pgwps-section");
      if (sec.title) s.appendChild(el("h2", "pgwps-h", sec.title));
      if (sec.grid) {
        var g = el("div", "pgwps-grid");
        sec.grid.forEach(function (f) {
          var d = el("div", "pgwps-field" + (f.wide ? " pgwps-field--wide" : ""));
          d.appendChild(el("span", "pgwps-field__k", f.k));
          d.appendChild(el("span", "pgwps-field__v", f.v));
          g.appendChild(d);
        });
        s.appendChild(g);
      }
      if (sec.table) {
        var w = el("div", "pgwps-tablewrap");
        w.appendChild(makeTable(sec.table.headings || null, sec.table.rows || [], "pgwps-table"));
        s.appendChild(w);
      }
      if (sec.note) s.appendChild(el("p", "pgwps-note", sec.note));
      frag.appendChild(s);
    });
    return frag;
  }

  PGWizard.mount = function (cfg) {
    var root = typeof cfg.root === "string" ? document.querySelector(cfg.root) : cfg.root;
    var logEl = $("pgwLog"), form = $("pgwForm"), input = $("pgwInput"), send = $("pgwSend");
    if (!logEl || !form) return;
    var convo = [], busy = false;   // the text turns so far: { role: "user" | "assistant", content }
    var lastResult = null, lastInputs = null;
    var canReport = !!cfg.report;

    // Resolve the body-level print target lazily (the config may mount before the
    // #pgwPrintSheet element is parsed); create it if the page did not supply one.
    function getPrintSheet() {
      var ps = $("pgwPrintSheet");
      if (!ps) { ps = el("section", "pgw-print"); ps.id = "pgwPrintSheet"; ps.setAttribute("aria-hidden", "true"); document.body.appendChild(ps); }
      return ps;
    }

    function bubble(role, text) {
      var d = document.createElement("div");
      d.className = "pgw-msg pgw-msg--" + role;
      d.textContent = text;
      logEl.appendChild(d);
      logEl.scrollTop = logEl.scrollHeight;
      return d;
    }
    function thinking(on) {
      var t = $("pgwThinking");
      if (on && !t) {
        t = document.createElement("div"); t.id = "pgwThinking";
        t.className = "pgw-msg pgw-msg--pulse pgw-thinking";
        t.innerHTML = "<span></span><span></span><span></span>";
        logEl.appendChild(t); logEl.scrollTop = logEl.scrollHeight;
      }
      if (!on && t) t.remove();
    }
    function resultCard(result) {
      if (!cfg.render) return;
      var out = cfg.render(result, { makeTable: makeTable });
      if (!out) return;
      var card = document.createElement("div");
      card.className = "pgw-msg pgw-msg--pulse pgw-result";
      if (out.nodeType) card.appendChild(out);        // a DOM node from the tool
      else card.appendChild(cardFromSpec(out));        // a plain spec object
      // the printable report is one press under the result (the model no longer carries a report tool)
      if (canReport) {
        var row = el("div", "pgw-result__act");
        var btn = el("button", "pgw-send pgw-report-btn", "Print report");
        btn.type = "button";
        btn.addEventListener("click", function () { var r = makeReport(); if (r && r.error) bubble("pulse", r.error); });
        row.appendChild(btn); card.appendChild(row);
      }
      var th = $("pgwThinking");
      if (th) logEl.insertBefore(card, th); else logEl.appendChild(card);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function makeReport() {
      if (!canReport) return { error: "No report is available for this tool." };
      if (!lastResult) return { error: "Run the calculation first; there is nothing to report yet." };
      try {
        var spec = cfg.report(lastResult, lastInputs || {});
        var printSheet = getPrintSheet();
        printSheet.replaceChildren();
        printSheet.appendChild(buildReport(spec));
        document.body.classList.add("pgw-printing");
        window.print();
        return { ok: true, printed: true, message: "Opened the print dialog. Choose Save as PDF to keep the report." };
      } catch (e) { return { error: e.message }; }
    }

    function runTool(name, args) {
      try {
        var result = cfg.run(name, args || {});
        if (result && result.ok) { lastResult = result; lastInputs = args || {}; }
        return result;
      } catch (e) { return { error: e.message }; }
    }

    // The platform's calculator names map onto this page's own (cfg.platformTools, e.g. solve_scaling -> scale_span); a name the
    // page declares itself passes through; anything else is not this page's business and draws nothing.
    function localToolFor(name) {
      if (cfg.platformTools && cfg.platformTools[name]) return cfg.platformTools[name];
      return (cfg.tools || []).some(function (t) { return t.name === name; }) ? name : "";
    }
    // The history the door reads: a first turn that says which tool page this is (Pulse's own prompt rules the rest), Pulse's
    // greeting, then the conversation so far, within the door's ten turns.
    function historyFor() {
      var note = { role: "user", content: "You are helping me on the Field Pocket Guide's " + (cfg.page || "tool") + " page on bridgesindust.com. Walk me through it: ask for whatever is missing, use the matching calculator, and report its numbers with their units." };
      var hello = { role: "assistant", content: cfg.greeting || "Hi. Tell me the inputs and I will work it with you." };
      return [note, hello].concat(convo.slice(-(MAX_TURNS - 2)));
    }
    function ask(userText) {
      return askPlatform(userText, historyFor()).then(function (d) {
        convo.push({ role: "user", content: userText });
        convo.push({ role: "assistant", content: d.answer });
        d.actions.forEach(function (a) {
          if (!a || !a.ok || !a.args || typeof a.args !== "object") return;
          var local = localToolFor(a.name);
          if (!local) return;
          var result = runTool(local, a.args);
          if (result && result.ok) resultCard(result);
        });
        return d.answer || "I did not catch that. Try again.";
      });
    }

    function submit() {
      var q = input.value.trim();
      if (!q || busy) return;
      input.value = ""; input.style.height = "";
      bubble("you", q);
      busy = true; send.disabled = true; thinking(true);
      ask(q).then(function (reply) { thinking(false); bubble("pulse", reply); })
        .catch(function (e) { thinking(false); bubble("pulse", e.message || "Something went wrong."); })
        .then(function () { busy = false; send.disabled = false; input.focus(); });
    }

    // mode switch: chat is the default view, the manual form hides behind it
    var mChat = $("pgwModeChat"), mForm = $("pgwModeForm");
    function setMode(chat) {
      if (root) root.classList.toggle("pgw--chat", chat);
      if (mChat) { mChat.classList.toggle("is-active", chat); mChat.setAttribute("aria-selected", String(chat)); }
      if (mForm) { mForm.classList.toggle("is-active", !chat); mForm.setAttribute("aria-selected", String(!chat)); }
    }
    if (mChat) mChat.addEventListener("click", function () { setMode(true); });
    if (mForm) mForm.addEventListener("click", function () { setMode(false); });

    form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } });
    input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });

    if (canReport) window.addEventListener("afterprint", function () {
      document.body.classList.remove("pgw-printing");
      var ps = $("pgwPrintSheet");
      if (ps) ps.replaceChildren();
    });

    if (cfg.greeting) bubble("pulse", cfg.greeting);
    try { fetchChallenge().catch(function () {}); } catch (e) { /* the first question fetches one */ }
  };
})();
