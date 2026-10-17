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

  function makeTable(headings, rows) {
    var t = document.createElement("table");
    t.className = "pgw-table";
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

  PGWizard.mount = function (cfg) {
    var root = typeof cfg.root === "string" ? document.querySelector(cfg.root) : cfg.root;
    var logEl = $("pgwLog"), form = $("pgwForm"), input = $("pgwInput"), send = $("pgwSend");
    if (!logEl || !form) return;
    var convo = [], busy = false;

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

    function runTool(name, args) {
      try { return cfg.run(name, args || {}); }
      catch (e) { return { error: e.message }; }
    }

    function ask(userText) {
      convo.push({ role: "user", parts: [{ text: userText }] });
      return (function step(n) {
        if (n >= 6) return "That took too many steps — try rephrasing.";
        return callProxy(cfg.system, convo, cfg.tools).then(function (res) {
          if (!res.content) return res.text || "I didn't catch that — try again.";
          convo.push(res.content);
          if (res.functionCall) {
            var result = runTool(res.functionCall.name, res.functionCall.args);
            if (result && result.ok) resultCard(result);
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

    if (cfg.greeting) bubble("pulse", cfg.greeting);
  };
})();
