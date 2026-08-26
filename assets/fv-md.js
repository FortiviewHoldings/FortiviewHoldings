/* Markdown, rendered in place.
 *
 * Any link that points at a .md file opens rendered in an overlay instead of
 * dumping raw markdown into the browser. Nothing needs a page of its own, and
 * no page needs editing: fortiview.js loads this on the first click of such a
 * link, and this file pulls markdown-it and highlight.js only at that moment.
 *
 * The renderer is markdown-it with the anchor plugin, plus highlight.js for
 * code fences. Only the presentation below is this site's. */
(function () {
  "use strict";

  var LIBS = [
    "/assets/md/markdown-it.min.js",
    "/assets/md/markdownItAnchor.umd.js",
    "/assets/md/highlight.min.js"
  ];

  var md = null;          /* the markdown-it instance, built once */
  var overlay = null;
  var lastFocus = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) { return resolve(); }
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("could not load " + src)); };
      document.head.appendChild(s);
    });
  }

  /* markdown-it must be present before the anchor plugin registers against it,
     so these load in order rather than in parallel. */
  function loadLibs() {
    return LIBS.reduce(function (p, src) {
      return p.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  function build() {
    if (md) { return md; }
    md = window.markdownit({
      html: false,            /* the source is ours, but there is no reason to run its HTML */
      linkify: true,
      breaks: false,
      highlight: function (str, lang) {
        if (lang && window.hljs && window.hljs.getLanguage(lang)) {
          try { return window.hljs.highlight(str, { language: lang }).value; } catch (e) { /* fall through */ }
        }
        return "";
      }
    });
    if (window.markdownItAnchor) {
      md.use(window.markdownItAnchor["default"] || window.markdownItAnchor, {
        permalink: false,
        slugify: function (s) {
          return String(s).trim().toLowerCase().replace(/[^\wÀ-￿\- ]/g, "").replace(/\s+/g, "-");
        }
      });
    }
    return md;
  }

  function close() {
    if (!overlay) { return; }
    overlay.remove();
    overlay = null;
    document.documentElement.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab" || !overlay) { return; }
    /* keep tabbing inside the dialog while it is open */
    var f = overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    if (!f.length) { return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(url, label) {
    lastFocus = document.activeElement;

    overlay = document.createElement("div");
    overlay.className = "fv-md";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", label || "Document");
    overlay.innerHTML =
      '<div class="fv-md__panel">' +
        '<header class="fv-md__head">' +
          '<div class="fv-md__title"></div>' +
          '<div class="fv-md__actions">' +
            '<a class="fv-md__raw" target="_blank" rel="noopener noreferrer">Raw</a>' +
            '<button class="fv-md__x" type="button" aria-label="Close">Close</button>' +
          "</div>" +
        "</header>" +
        '<div class="fv-md__body"><p class="fv-md__note">Loading&hellip;</p></div>' +
      "</div>";

    overlay.querySelector(".fv-md__title").textContent = label || url;
    overlay.querySelector(".fv-md__raw").href = url;
    overlay.querySelector(".fv-md__x").addEventListener("click", close);
    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) { close(); }
    });

    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    overlay.querySelector(".fv-md__x").focus();

    var body = overlay.querySelector(".fv-md__body");

    Promise.all([
      fetch(url, { credentials: "same-origin" }).then(function (r) {
        if (!r.ok) { throw new Error(r.status + " " + r.statusText); }
        return r.text();
      }),
      loadLibs()
    ]).then(function (got) {
      if (!overlay) { return; }                 /* closed while it was loading */
      body.innerHTML = build().render(got[0]);
      /* anything the document itself links to opens in a new tab, except its
         own in-page anchors, which scroll within the panel */
      [].slice.call(body.querySelectorAll("a[href]")).forEach(function (a) {
        var href = a.getAttribute("href");
        if (href.charAt(0) === "#") {
          a.addEventListener("click", function (e) {
            var t = body.querySelector('[id="' + href.slice(1) + '"]');
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); }
          });
          return;
        }
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      });
      body.scrollTop = 0;
    }).catch(function (err) {
      if (!overlay) { return; }
      body.innerHTML = '<p class="fv-md__note"></p>';
      body.querySelector(".fv-md__note").textContent =
        "That document could not be loaded (" + err.message + "). Use Raw to open the file directly.";
    });
  }

  /* one delegated listener, so links added later still work */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.hasAttribute("data-md-skip")) { return; }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) { return; }
    var href = a.getAttribute("href") || "";
    if (!/\.md(?:[?#].*)?$/i.test(href)) { return; }
    if (a.host && a.host !== location.host) { return; }      /* someone else's markdown: let it go */
    e.preventDefault();
    open(a.href, a.getAttribute("data-md-title") || a.textContent.trim());
  });

  window.fvOpenMarkdown = open;
}());
