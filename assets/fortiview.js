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
    /* a noindex page (the 404) is served AT the address that missed, so emitting a
       BreadcrumbList there would assert that the missing URL is a real page */
    var robots = document.querySelector('meta[name="robots"]');
    if (robots && /noindex/i.test(robots.getAttribute("content") || "")) { return; }
    var ORG = "https://bridgesindust.com/#org";
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

    /* "areaServed: United States" told a local-intent search nothing. On-site work is a
       drive from League City; the advisory and remote half genuinely is nationwide. */
    var AREA = [
      { "@type": "GeoCircle", "name": "On-site service area",
        "geoMidpoint": { "@type": "GeoCoordinates", "latitude": 29.5075, "longitude": -95.0949 },
        "geoRadius": "120000" },
      { "@type": "Country", "name": "United States" }
    ];

    /* what the firm actually works on, in the words a plant would use */
    var TOPICS = [
      "Field instrumentation", "Instrument troubleshooting", "Transmitter calibration",
      "Flow measurement", "Level measurement", "Temperature measurement", "Pressure measurement",
      "Analytical measurement", "pH measurement", "HART communication", "4-20 mA loop diagnostics",
      "Loop verification", "Commissioning and startup", "Intermittent instrument faults",
      "Process-induced measurement error", "PLC and DCS troubleshooting",
      "Safety instrumented functions", "Instrumentation training"
    ];

    var CATALOG = {
      "@type": "OfferCatalog", "name": "Instrumentation services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Instrument troubleshooting",
          "description": "A transmitter or loop that is not working, reading wrong, drifting, or failing intermittently, diagnosed on site in the process rather than on a bench." } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Calibration and configuration",
          "description": "Field calibration, ranging, and configuration of smart and conventional devices for flow, level, temperature, pressure, and analytical measurement." } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commissioning and loop verification",
          "description": "Startup, loop checks, and verification from the device through to the control system, with documentation a technician can use." } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Hard-to-measure applications",
          "description": "Products that resist measurement: flashing and two-phase flow, low-density solids, foam, slurries, coating and buildup, entrained gas." } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Control logic troubleshooting",
          "description": "Reading, changing, and troubleshooting the logic running on PLC and DCS platforms." } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Technical training",
          "description": "Hands-on instrumentation and controls instruction, including community-college teaching." } }
      ]
    };
    var graph = [];
    if (!hasOrg) {
      graph.push({
        "@type": "Organization", "@id": ORG, "name": "Bridges Industrial",
        "alternateName": "Fortiview Holdings", /* former name: keeps the rebrand connected for search */
        "url": "https://bridgesindust.com",
        "description": "Hands-on field instrumentation and analytical measurement support: troubleshooting instruments that are not working, calibration, configuration, commissioning, and loop verification, including intermittent faults and readings that will not behave. Also control logic and PLC/DCS troubleshooting, technical training, and custom hardware and data connections through PragOptics.",
        "logo": "https://bridgesindust.com/images/Logo.png", "email": "support@bridgesindust.com",
        "telephone": "+1-832-425-0421", "areaServed": AREA,
        "knowsAbout": TOPICS,
        "contactPoint": { "@type": "ContactPoint", "telephone": "+1-832-425-0421", "email": "support@bridgesindust.com", "contactType": "technical support" },
        "sameAs": SAME
      });
      graph.push({
        "@type": "WebSite", "@id": "https://bridgesindust.com/#website", "url": "https://bridgesindust.com",
        "name": "Bridges Industrial", "publisher": { "@id": ORG }
        /* no SearchAction: the site has no search endpoint, and claiming one
           advertises a sitelinks searchbox that would not work */
      });
      graph.push({
        "@type": "LocalBusiness", "@id": "https://bridgesindust.com/#local", "name": "Bridges Industrial",
        "alternateName": "Fortiview Holdings",
        "url": "https://bridgesindust.com", "image": "https://bridgesindust.com/images/social-preview.png",
        "description": "Instrument technical support for the Texas Gulf Coast: on-site troubleshooting, calibration, configuration, commissioning, and loop verification for flow, level, temperature, pressure, and analytical measurement.",
        "telephone": "+1-832-425-0421", "email": "support@bridgesindust.com", "priceRange": "$$",
        "address": { "@type": "PostalAddress", "addressLocality": "League City", "addressRegion": "TX", "addressCountry": "US" },
        "geo": { "@type": "GeoCoordinates", "latitude": 29.5075, "longitude": -95.0949 },
        "areaServed": AREA, "knowsAbout": TOPICS, "hasOfferCatalog": CATALOG, "sameAs": SAME
      });
    }
    var p = location.pathname.replace(/index\.html$/, "");
    if (p && p !== "/") {
      var nm = (document.title || "").split("—")[0].split("|")[0].trim() || p;
      graph.push({
        "@type": "BreadcrumbList", "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bridgesindust.com/" },
          { "@type": "ListItem", "position": 2, "name": nm, "item": "https://bridgesindust.com" + p }
        ]
      });
    }
    if (!graph.length) { return; }
    var sc = document.createElement("script"); sc.type = "application/ld+json";
    sc.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(sc);
  })();

  /* the header button goes to a form that works; the footer keeps a real
     mailto so the address itself is still copyable */
  var WORK = "/contact/?topic=work-with-us";
  var MAIL = "mailto:support@bridgesindust.com";

  /* the shared nav lives here ONCE for the whole site */
  var NAV = [
    { href: "/industrial/",   name: "Industrial Automation" },
    { href: "/partnerships/", name: "Partnerships" },
    { href: "/integration/",  name: "PragOptics" },
    { href: "/idea-lab/",     name: "Idea Lab" }
  ];

  var path = location.pathname.replace(/\/index\.html$/, "/");
  function isActive(href) {
    var h = href.replace(/\/$/, ""), p = path.replace(/\/$/, "");
    /* prefix match, so /integration/terms/ still marks PragOptics current */
    return h !== "" && (p === h || p.indexOf(h + "/") === 0);
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
    size(); draw();
    /* redraw after resize: size() clears the canvas and, for reduced-motion
       users, the rAF loop is not running to paint it again */
    window.addEventListener("resize", function () { size(); draw(); });
  })();

  /* ---------- header ---------- */
  function links(klass) {
    return NAV.map(function (n) {
      var on = isActive(n.href);
      return '<a class="' + klass + (on ? " is-active" : "") + '"' + (on ? ' aria-current="page"' : "") + ' href="' + n.href + '">' + n.name + "</a>";
    }).join("");
  }
  var header = document.createElement("header");
  header.className = "fv-header";
  header.innerHTML =
    '<div class="fv-wrap fv-nav">' +
      '<a class="fv-brand" href="/">' +
        '<span class="fv-brand__mark fv-brand__mark--plain" style="background-image:url(/images/Logo.png)"></span>' +
        '<span class="fv-brand__name">Bridges <span>Industrial</span></span>' +
      "</a>" +
      '<nav class="fv-links" aria-label="Primary">' + links("fv-link") +
        '<a class="btn btn--primary btn--sm" href="' + WORK + '">Work with us</a>' +
      "</nav>" +
      '<button class="fv-burger" aria-label="Menu" aria-expanded="false" aria-controls="fv-mobile-menu"><span></span><span></span><span></span></button>' +
    "</div>" +
    '<div class="fv-mobile" id="fv-mobile-menu">' + links("") +
      '<a class="btn btn--primary" href="' + WORK + '">Work with us</a>' +
    "</div>";
  document.body.insertBefore(header, document.getElementById("fv-stars").nextSibling);
  var burger = header.querySelector(".fv-burger");
  burger.addEventListener("click", function () {
    var open = header.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* ---------- footer ---------- */
  var li = '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.4 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2 0-2.3 1.56-2.3 3.2V21H9z"/></svg>';
  var ig = '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71C3.21 8.5 3.2 8.85 3.2 12s.01 3.5.08 4.74c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.39-.32-1.71a2.86 2.86 0 00-.69-1.06 2.86 2.86 0 00-1.06-.69c-.32-.13-.81-.28-1.71-.32C15.5 4.01 15.15 4 12 4zm0 3.06A4.94 4.94 0 1112 17a4.94 4.94 0 010-9.88zm0 1.8a3.14 3.14 0 100 6.28 3.14 3.14 0 000-6.28zM17.84 6a1.15 1.15 0 110 2.3 1.15 1.15 0 010-2.3z"/></svg>';
  /* A static .fv-footer is now in the HTML of every page so non-JS crawlers
     see the internal links. Only build one if the page has none. */
  if (!document.querySelector(".fv-footer")) {
    var footer = document.createElement("footer");
    footer.className = "fv-footer";
    footer.innerHTML =
      '<div class="fv-wrap fv-footer__top">' +
        '<div class="fv-footer__brand">' +
          '<a class="fv-brand" href="/"><span class="fv-brand__mark fv-brand__mark--plain" style="background-image:url(/images/Logo.png)"></span>' +
          '<span class="fv-brand__name">Bridges <span>Industrial</span></span></a>' +
          "<p>Hands-on field instrumentation and analytical measurement, technical training, PragOptics hardware and software, and the Idea Lab. Engineered for clarity, accountability, and scale.</p>" +
          /* the site never said where the work happens, so local-intent searches had
             nothing to match on. This is the one line that appears on every page. */
          "<p>On site across the Texas Gulf Coast from League City, including Houston, Texas City, Pasadena, Baytown, Clear Lake, and Galveston. Remote and advisory work anywhere in the US.</p>" +
        "</div>" +
        '<div class="fv-fcol"><h3>What we do</h3>' +
          '<a href="/instrument-support/">Instrument Technical Support</a>' +
          '<a href="/industrial">Industrial Automation &amp; Training</a>' +
          '<a href="/education/">Field Pocket Guide</a>' +
          '<a href="/partnerships">Partnerships</a>' +
          '<a href="/integration">PragOptics</a>' +
          '<a href="/idea-lab/">Idea Lab</a>' +
        "</div>" +
        '<div class="fv-fcol"><h3>Connect</h3>' +
          '<a href="/break-in/" style="color:var(--accent)">Submit Break-In</a>' +
          '<span style="color:var(--muted);font-size:.82rem;display:block;margin:2px 0 6px">Instrument not working? Ask a specialist, free.</span>' +
          '<a href="' + MAIL + '">support@bridgesindust.com</a>' +
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
  }
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
