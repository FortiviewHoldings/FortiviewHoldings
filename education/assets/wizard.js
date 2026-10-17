/* ============================================================
   Field Pocket Guide — shared guided-wizard engine (classic JS)
   One chat brain for every tool. The AI (Pulse, via the gemini
   proxy) only collects inputs in plain language and calls the
   tool's deterministic function; it never does the arithmetic.
   All math stays in PG — the wizard just talks and renders.
   A tool mounts it with a thin config: PGWizard.mount({...}).
   ============================================================ */
(function () {
  "use strict";
  var PGWizard = (window.PGWizard = window.PGWizard || {});
  var PROXY = "https://ai.bridgesindust.com/";
  var $ = function (id) { return document.getElementById(id); };

  // One round-trip to the proxy. Flash-Lite hiccups with 503/429 under load; ride through it.
  function callProxy(system, contents, tools) {
    var body = JSON.stringify({ system: system, contents: contents, tools: tools });
    return (function attempt(n) {
      return fetch(PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body: body })
        .then(function (res) {
          if (res.ok) return res.json();
          if ((res.status === 503 || res.status === 429) && n < 2) {
            return new Promise(function (r) { setTimeout(r, 900 * (n + 1)); }).then(function () { return attempt(n + 1); });
          }
          return res.json().catch(function () { return {}; }).then(function (d) {
            throw new Error(d.error || "The wizard is busy — give it a second and try again.");
          });
        });
    })(0);
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

  // The report tool is offered to the model automatically whenever a tool supplies cfg.report.
  var REPORT_TOOL = {
    name: "make_report",
    description: "Build a clean, printable report / spec sheet of the CURRENT result so the user can save it as a PDF. Only call this after a calculation has already been run and the user asks for a report, spec sheet, or printout.",
    parameters: { type: "object", properties: {} }
  };

  PGWizard.mount = function (cfg) {
    var root = typeof cfg.root === "string" ? document.querySelector(cfg.root) : cfg.root;
    var logEl = $("pgwLog"), form = $("pgwForm"), input = $("pgwInput"), send = $("pgwSend");
    if (!logEl || !form) return;
    var convo = [], busy = false;
    var lastResult = null, lastInputs = null;
    var canReport = !!cfg.report;
    var toolsOut = canReport ? cfg.tools.concat([REPORT_TOOL]) : cfg.tools;

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
      if (name === "make_report") return makeReport();
      try {
        var result = cfg.run(name, args || {});
        if (result && result.ok) { lastResult = result; lastInputs = args || {}; }
        return result;
      } catch (e) { return { error: e.message }; }
    }

    function ask(userText) {
      convo.push({ role: "user", parts: [{ text: userText }] });
      return (function step(n) {
        if (n >= 6) return "That took too many steps — try rephrasing.";
        return callProxy(cfg.system, convo, toolsOut).then(function (res) {
          if (!res.content) return res.text || "I didn't catch that — try again.";
          convo.push(res.content);
          if (res.functionCall) {
            var result = runTool(res.functionCall.name, res.functionCall.args);
            if (result && result.ok && !result.printed) resultCard(result);
            convo.push({ role: "user", parts: [{ functionResponse: { name: res.functionCall.name, response: { result: result } } }] });
            return step(n + 1);
          }
          return res.text || "";
        });
      })(0);
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
  };
})();
