/* ============================================================
   Bridges Industrial — shared starfield + header + footer.
   One source of truth for the nav, injected on every page.
   Classic JS, no deps. Galactic glass.
   ============================================================ */
(function () {
  "use strict";

  (function () {
    var f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap";
    document.head.appendChild(f);
  })();

  /* ---- site-wide structured data (SEO + voice search) ---- */
  (function structuredData() {
    var ORG = "https://fortiviewholdings.com/#org";
    var existing = document.querySelectorAll('script[type="application/ld+json"]'), hasOrg = false;
    for (var i = 0; i < existing.length && !hasOrg; i++) {
      try {
        var parsed = JSON.parse(existing[i].textContent), nodes = parsed["@graph"] || [parsed];
        for (var n = 0; n < nodes.length; n++) {
          if (nodes[n] && nodes[n]["@type"] === "Organization") { hasOrg = true; break; }
        }
      } catch (e) { /* ignore unparseable blocks */ }
    }
    var SAME = ["https://www.linkedin.com/company/fortiviewholdings", "https://www.instagram.com/fortiviewholdings"];
    var graph = [];
    if (!hasOrg) {
      graph.push({
        "@type": "Organization", "@id": ORG, "name": "Bridges Industrial", "url": "https://fortiviewholdings.com",
        "logo": "https://fortiviewholdings.com/images/Logo.png", "email": "support@fortiviewholdings.com",
        "telephone": "+1-832-425-0421", "areaServed": "United States",
        "contactPoint": { "@type": "ContactPoint", "telephone": "+1-832-425-0421", "email": "support@fortiviewholdings.com", "contactType": "customer support" },
        "sameAs": SAME
      });
      graph.push({
        "@type": "WebSite", "@id": "https://fortiviewholdings.com/#website", "url": "https://fortiviewholdings.com",
        "name": "Bridges Industrial", "publisher": { "@id": ORG },
        "potentialAction": { "@type": "SearchAction", "target": "https://fortiviewholdings.com/?q={search_term_string}", "query-input": "required name=search_term_string" }
      });
      graph.push({
        "@type": "LocalBusiness", "@id": "https://fortiviewholdings.com/#local", "name": "Bridges Industrial",
        "url": "https://fortiviewholdings.com", "image": "https://fortiviewholdings.com/images/social-preview.png",
        "telephone": "+1-832-425-0421", "email": "support@fortiviewholdings.com", "priceRange": "$$",
        "address": { "@type": "PostalAddress", "addressLocality": "League City", "addressRegion": "TX", "addressCountry": "US" },
        "areaServed": "United States", "sameAs": SAME
      });
    }
    var p = location.pathname.replace(/index\.html$/, "");
    if (p && p !== "/") {
      var nm = (document.title || "").split("—")[0].split("|")[0].trim() || p;
      graph.push({
        "@type": "BreadcrumbList", "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fortiviewholdings.com/" },
          { "@type": "ListItem", "position": 2, "name": nm, "item": "https://fortiviewholdings.com" + p }
        ]
      });
    }
    if (!graph.length) { return; }
    var sc = document.createElement("script"); sc.type = "application/ld+json";
    sc.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(sc);
  })();

  var MAIL = "mailto:support@fortiviewholdings.com?subject=Bridges%20Industrial%20Inquiry";

  /* the parent-company nav lives here ONCE for the whole site */
  var NAV = [
    { href: "/industrial",  name: "Industrial Automation" },
    { href: "/partnerships", name: "Partnerships" },
    { href: "/integration", name: "PragOptics" },
    { href: "/idea-lab/",   name: "Idea Lab" }
  ];

  var path = location.pathname.replace(/\/index\.html$/, "/");
  function isActive(href) {
    var h = href.replace(/\/$/, ""), p = path.replace(/\/$/, "");
    return h !== "" && p === h;
  }

  /* ---------- cosmic starfield ---------- */
  (function starfield() {
    var c = document.createElement("canvas");
    c.id = "fv-stars"; c.setAttribute("aria-hidden", "true");
    document.body.insertBefore(c, document.body.firstChild);
    var ctx = c.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stars = [];
    function size() {
      c.width = window.innerWidth; c.height = window.innerHeight;
      var n = Math.min(160, Math.floor((c.width * c.height) / 11000));
      stars = [];
      for (var i = 0; i < n; i++) stars.push({
        x: Math.random() * c.width, y: Math.random() * c.height,
        r: Math.random() * 1.3 + 0.3, t: Math.random() * Math.PI * 2,
        s: Math.random() * 0.012 + 0.003,
        hue: Math.random() < 0.16 ? "#7c5cff" : (Math.random() < 0.5 ? "#3ee0ff" : "#ffffff")
      });
    }
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i]; st.t += st.s;
        ctx.globalAlpha = reduce ? 0.6 : (0.3 + Math.abs(Math.sin(st.t)) * 0.6);
        ctx.fillStyle = st.hue;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(draw);
    }
    size(); window.addEventListener("resize", size); draw();
  })();

  /* ---------- header ---------- */
  function links(klass) {
    return NAV.map(function (n) {
      return '<a class="' + klass + (isActive(n.href) ? " is-active" : "") + '" href="' + n.href + '">' + n.name + "</a>";
    }).join("");
  }
  var header = document.createElement("header");
  header.className = "fv-header";
  header.innerHTML =
    '<div class="fv-wrap fv-nav">' +
      '<a class="fv-brand" href="/">' +
        '<span class="fv-brand__name">Bridges <span>Industrial</span></span>' +
      "</a>" +
      '<nav class="fv-links" aria-label="Primary">' + links("fv-link") +
        '<a class="btn btn--primary btn--sm" href="' + MAIL + '">Work with us</a>' +
      "</nav>" +
      '<button class="fv-burger" aria-label="Menu"><span></span><span></span><span></span></button>' +
    "</div>" +
    '<div class="fv-mobile">' + links("") +
      '<a class="btn btn--primary" href="' + MAIL + '">Work with us</a>' +
    "</div>";
  document.body.insertBefore(header, document.getElementById("fv-stars").nextSibling);
  header.querySelector(".fv-burger").addEventListener("click", function () { header.classList.toggle("open"); });

  /* ---------- footer ---------- */
  var li = '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.4 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2 0-2.3 1.56-2.3 3.2V21H9z"/></svg>';
  var ig = '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71C3.21 8.5 3.2 8.85 3.2 12s.01 3.5.08 4.74c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.39-.32-1.71a2.86 2.86 0 00-.69-1.06 2.86 2.86 0 00-1.06-.69c-.32-.13-.81-.28-1.71-.32C15.5 4.01 15.15 4 12 4zm0 3.06A4.94 4.94 0 1112 17a4.94 4.94 0 010-9.88zm0 1.8a3.14 3.14 0 100 6.28 3.14 3.14 0 000-6.28zM17.84 6a1.15 1.15 0 110 2.3 1.15 1.15 0 010-2.3z"/></svg>';
  var footer = document.createElement("footer");
  footer.className = "fv-footer";
  footer.innerHTML =
    '<div class="fv-wrap fv-footer__top">' +
      '<div class="fv-footer__brand">' +
        '<a class="fv-brand" href="/"><span class="fv-brand__mark" style="background-image:url(/images/Logo.png)"></span>' +
        '<span class="fv-brand__name">Bridges <span>Industrial</span></span></a>' +
        "<p>The parent company behind industrial automation, technical training, PragOptics technology, and the Idea Lab. Engineered for clarity, accountability, and scale.</p>" +
      "</div>" +
      '<div class="fv-fcol"><h4>What we do</h4>' +
        '<a href="/industrial">Industrial Automation &amp; Training</a>' +
        '<a href="/education/">Field Pocket Guide</a>' +
        '<a href="/partnerships">Partnerships</a>' +
        '<a href="/integration">PragOptics</a>' +
        '<a href="/idea-lab/">Idea Lab</a>' +
      "</div>" +
      '<div class="fv-fcol"><h4>Connect</h4>' +
        '<a href="' + MAIL + '">support@fortiviewholdings.com</a>' +
        '<a href="tel:+18324250421">+1 (832) 425-0421</a>' +
        '<div class="fv-social" style="margin-top:12px">' +
          '<a href="https://www.linkedin.com/company/fortiviewholdings" aria-label="LinkedIn" target="_blank" rel="noopener">' + li + "</a>" +
          '<a href="https://www.instagram.com/fortiviewholdings" aria-label="Instagram" target="_blank" rel="noopener">' + ig + "</a>" +
        "</div>" +
      "</div>" +
    "</div>" +
    '<div class="fv-wrap fv-footer__bottom">' +
      "<span>&copy; <span id=\"fv-year\"></span> Bridges Industrial LLC. All rights reserved.</span>" +
      '<a href="/integration/terms/" style="color:var(--muted)">Terms &amp; Privacy</a>' +
    "</div>";
  document.body.appendChild(footer);
  var yr = document.getElementById("fv-year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- reveal on scroll ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nodes = document.querySelectorAll(".fv-reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(nodes, function (n) { n.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }
})();
