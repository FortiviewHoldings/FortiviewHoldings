/* ============================================================
   Bridges Industrial — shared intake engine.

   Every contact CTA on the site ends at a form driven by this file, so
   there is ONE place to point the whole site at your mailer:

       var ENDPOINT = "https://your-mailer/…";

   Leave it empty and each form composes a mailto instead. That is the
   fallback, not the plan: a mailto only works if the visitor has a mail
   client registered, which on a desktop browser is often not the case.
   With ENDPOINT set, the form posts JSON and nothing depends on the
   visitor's machine.

   Pages are pure markup. A form opts in with class="fv-form", and the
   engine reads the fields it finds:

     data-intake="break-in"      name of the intake, sent as `source`
     data-subject="Break-In"     subject prefix for the mail path
     data-title="BREAK-IN …"     heading at the top of the body

   On each control:
     data-label="Product"        how it is named in the email body
     data-group="MEASUREMENT"    optional block heading to sit under
     data-subject-part           value gets appended to the subject
     data-block                  render as its own section, not a line
     data-msg="…"                message shown when a required field is empty
     required, minlength, type="email"   validated as you would expect
     data-pot                    honeypot; if filled, accept and send nothing

   Safety, deliberate: values are read with .value and written back only
   with textContent, so nothing a visitor types can execute. CR and LF are
   stripped from every single-line value before it reaches the subject,
   which is what stops mail header injection. Fields are length-capped by
   maxlength in the markup and again here.
   ============================================================ */
(function () {
  "use strict";

  var ENDPOINT = "";                              /* <-- your mailer URL goes here */
  var TO = "support@bridgesindust.com";
  var CAP = 4000;

  function oneLine(s, max) {
    return String(s == null ? "" : s)
      .replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max || 200);
  }
  function multiLine(s, max) {
    return String(s == null ? "" : s).replace(/\r\n?/g, "\n").trim().slice(0, max || CAP);
  }
  function looksLikeEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  }
  function pad(s, n) { while (s.length < n) { s += " "; } return s; }

  function init(form) {
    var errBox  = form.querySelector("[data-err]");
    var status  = form.querySelector("[data-status]");
    var copyBtn = form.querySelector("[data-copy]");
    var pot     = form.querySelector("[data-pot]");
    var counted = form.querySelector("[data-count-for]");
    var lastText = "";

    /* every named control except the honeypot and the buttons */
    function controls() {
      return [].slice.call(form.elements).filter(function (el) {
        return el.name && !el.hasAttribute("data-pot") &&
               el.type !== "submit" && el.type !== "button";
      });
    }

    function setStatus(msg, kind) {
      status.textContent = msg;                    /* textContent, never innerHTML */
      status.className = "fv-form__status" + (kind ? " " + kind : "");
    }
    function flag(el, bad) { el.setAttribute("aria-invalid", bad ? "true" : "false"); }
    function fail(msg, el) {
      errBox.textContent = msg;
      if (el) { flag(el, true); el.focus(); }
      return null;
    }

    /* live character count, if the page asked for one */
    if (counted) {
      var target = form.querySelector('[name="' + counted.getAttribute("data-count-for") + '"]');
      if (target) {
        var lim = parseInt(target.getAttribute("maxlength"), 10) || CAP;
        var tick = function () {
          counted.textContent = target.value.length + " / " + lim;
          counted.classList.toggle("over", target.value.length >= lim);
        };
        target.addEventListener("input", tick);
        tick();
      }
    }

    /* a select can reveal a companion field: data-reveal="#id" data-reveal-when="Other" */
    [].slice.call(form.querySelectorAll("[data-reveal]")).forEach(function (sel) {
      var wrap = form.querySelector(sel.getAttribute("data-reveal"));
      var when = sel.getAttribute("data-reveal-when") || "Other";
      if (!wrap) return;
      var inner = wrap.querySelector("input, textarea");
      var sync = function () {
        var on = sel.value === when;
        wrap.hidden = !on;
        if (inner && !on) { inner.value = ""; flag(inner, false); }
      };
      sel.addEventListener("change", function () { sync(); if (inner && !wrap.hidden) inner.focus(); });
      sync();
    });

    /* ---------- gather + validate ---------- */
    function collect() {
      errBox.textContent = "";
      var list = controls();
      list.forEach(function (el) { flag(el, false); });

      var out = [], subjectParts = [];
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.offsetParent === null && el.type !== "hidden") { continue; }   /* hidden by a reveal */
        var block = el.hasAttribute("data-block") || el.tagName === "TEXTAREA";
        var max = parseInt(el.getAttribute("maxlength"), 10) || (block ? CAP : 200);
        var val = block ? multiLine(el.value, max) : oneLine(el.value, max);
        var label = el.getAttribute("data-label") || el.name;

        if (el.hasAttribute("required") && !val) {
          return fail(el.getAttribute("data-msg") || ("Please fill in " + label.toLowerCase() + "."), el);
        }
        if (val && el.type === "email" && !looksLikeEmail(val)) {
          return fail("That email address does not look right.", el);
        }
        var min = parseInt(el.getAttribute("minlength"), 10);
        if (min && val && val.length < min) {
          return fail(el.getAttribute("data-msg") || ("Please add a little more detail to " + label.toLowerCase() + "."), el);
        }
        if (el.hasAttribute("data-subject-part") && val) { subjectParts.push(val); }
        out.push({ name: el.name, label: label, value: val, block: block,
                   group: el.getAttribute("data-group") || "" });
      }
      return { fields: out, subjectParts: subjectParts };
    }

    /* ---------- render the email body ---------- */
    function compose(got) {
      var lines = [form.getAttribute("data-title") || "SUBMISSION", ""];
      var width = 0, i;
      for (i = 0; i < got.fields.length; i++) {
        var f = got.fields[i];
        if (!f.block && f.label.length + 1 > width) { width = f.label.length + 1; }
      }
      var group = "";
      for (i = 0; i < got.fields.length; i++) {
        var fl = got.fields[i];
        if (fl.block) { continue; }
        if (fl.group !== group) {
          group = fl.group;
          if (group) { lines.push("", group, new Array(group.length + 1).join("-")); }
        }
        lines.push(pad(fl.label + ":", width + 1) + " " + (fl.value || "-"));
      }
      for (i = 0; i < got.fields.length; i++) {
        var b = got.fields[i];
        if (!b.block) { continue; }
        lines.push("", b.label.toUpperCase(), new Array(b.label.length + 1).join("-"), b.value);
      }
      lines.push("");
      return lines.join("\n");
    }

    /* ---------- clipboard fallback, so nothing typed is ever lost ---------- */
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!lastText) return;
        var done = function () { setStatus("Copied. Paste it into an email to " + TO + ".", "ok"); };
        var reveal = function () {
          setStatus("Your browser would not let us reach the clipboard. Select the text below and send it to " + TO + ".", "bad");
          if (form.querySelector(".fv-form__dump")) return;
          var ta = document.createElement("textarea");
          ta.className = "fv-form__dump";
          ta.value = lastText;                       /* value, not markup */
          ta.readOnly = true; ta.rows = 12;
          status.parentNode.insertBefore(ta, status.nextSibling);
          ta.focus(); ta.select();
        };
        var legacy = function () {
          var ta = document.createElement("textarea");
          ta.value = lastText; ta.readOnly = true;
          ta.style.cssText = "position:fixed;left:-9999px;top:0";
          document.body.appendChild(ta); ta.select();
          var ok = false;
          try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
          document.body.removeChild(ta);
          if (ok) { done(); } else { reveal(); }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lastText).then(done, legacy);
        } else { legacy(); }
      });
    }

    /* ---------- submit ---------- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("");

      /* a filled honeypot is a bot: accept silently, send nothing */
      if (pot && pot.value) {
        setStatus("Thanks. That has been recorded.", "ok");
        form.reset();
        if (copyBtn) copyBtn.hidden = true;
        return;
      }

      var got = collect();
      if (!got) return;

      var body = compose(got);
      var payload = { source: form.getAttribute("data-intake") || "intake" };
      got.fields.forEach(function (f) { payload[f.name] = f.value; });

      if (ENDPOINT) {
        setStatus("Sending…");
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (r) {
          if (!r.ok) throw new Error("bad response");
          setStatus("Sent. A specialist replies by email, in the order requests are received.", "ok");
          form.reset();
          if (copyBtn) copyBtn.hidden = true;
          lastText = "";
          form.dispatchEvent(new CustomEvent("fv:sent", { bubbles: true }));
        }).catch(function () {
          /* the endpoint is down: hand them the text rather than lose it */
          lastText = "To: " + TO + "\nSubject: " + subjectOf(got) + "\n\n" + body;
          if (copyBtn) copyBtn.hidden = false;
          setStatus("That did not go through. Use Copy the details instead, or email " + TO + " directly.", "bad");
        });
        return;
      }

      /* mailto fallback */
      var subject = subjectOf(got);
      lastText = "To: " + TO + "\nSubject: " + subject + "\n\n" + body;
      if (copyBtn) copyBtn.hidden = false;
      window.location.href = "mailto:" + TO +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      setStatus("Your email client should be opening. If nothing happened, use Copy the details instead and paste them into an email to " + TO + ".", "ok");
    });

    function subjectOf(got) {
      var base = form.getAttribute("data-subject") || "Website enquiry";
      return oneLine(base + (got.subjectParts.length ? ": " + got.subjectParts.join(" — ") : ""), 160);
    }
  }

  [].slice.call(document.querySelectorAll("form.fv-form")).forEach(init);
})();
