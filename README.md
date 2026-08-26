# bridgesindust.com

The website for **Bridges Industrial LLC**, a hands-on industrial automation and
instrumentation consultancy in League City, Texas.

Static site, no build step, no framework. GitHub Pages serves this repository
directly at [bridgesindust.com](https://bridgesindust.com).

## What is on it

**Field instrumentation and analytical measurement** is the business: calibration,
configuration, commissioning, loop verification, and the diagnostics for readings
that will not behave. There is a free intake for measurement problems at
[/break-in/](https://bridgesindust.com/break-in/) — describe a symptom, a
specialist answers by email, no account and no obligation.

**PragOptics** is the hardware and software side: the Omni line of published
field hardware, custom boards and control logic, MSLA resin production, and
custom data connections served as an API or hosted.

**The Field Pocket Guide** at [/education/](https://bridgesindust.com/education/)
publishes free instrumentation calculators and twelve reference notes. The
calculators run entirely in the browser and work offline once loaded. The written
reference material is CC BY 4.0 — quote it, republish it, build on it.

**The Idea Lab** is a free coding and cybersecurity academy for kids. No accounts,
no cost, runs in the browser.

## Layout

```
assets/            sitewide CSS, the header/footer/starfield injector,
                   and the shared intake engine behind every contact form
education/         Field Pocket Guide: calculators, reference notes, and its
                   own stylesheet and scripts
idea-lab/          the kids' academy, with its own design system
industrial/        the field instrumentation page
instrument-support/  "your transmitter is not working" — the support page
break-in/          free intake for measurement problems
contact/           general intake, topic-driven
partnerships/      partner network, and the partner intake under /apply/
integration/       PragOptics, and the Terms under /terms/
scripts/           IndexNow submission
.github/workflows/ IndexNow automation
llms.txt           what this business is, written for language models
```

## Running it locally

Any static server works. There is nothing to install and nothing to build.

```bash
python -m http.server 8321
```

Then open http://localhost:8321.

Paths are absolute (`/assets/...`), so opening the HTML files directly off disk
will not load the stylesheets. Use a server.

## Conventions worth knowing before editing

**The header, footer and structured data are injected by `assets/fortiview.js`.**
Do not hand-write a nav into a page. Every page also carries a static
`<footer class="fv-footer">` in its HTML so crawlers see the internal links
without running JavaScript; the injector checks for one and skips building
another if it finds it.

**Contact forms are markup only.** `assets/fv-intake.js` drives all of them and
holds the single endpoint constant for the whole site. A form opts in with
`class="fv-form"` and describes itself with `data-` attributes. Adding an intake
means writing markup, not JavaScript. The contract is documented at the top of
that file.

**Nothing a visitor types is ever assigned to `innerHTML`.** Values are read as
values and written back with `textContent`. CR and LF are stripped from every
single-line field before it can reach a mail subject. Keep it that way.

**The sitemap is not generated.** Add a page, add its URL. `llms.txt` is
hand-written for the same reason: it is a description of the business, not a
dump of the site.

Pushing HTML, `sitemap.xml`, `llms.txt` or `robots.txt` to `main` notifies
IndexNow so Bing and the engines that feed AI assistants recrawl. A weekly run
catches anything a push missed.

## Licence

Two licences apply. **[LICENSES.md](LICENSES.md)** maps which is which; the short
version:

- The **written reference material** under `/education/` is **CC BY 4.0**. Quote
  it and cite it.
- **Everything else is all rights reserved.** Readable and clonable, not licensed
  for reuse.
- **Names and logos are trademarks** and no licence here grants them.

Hardware, firmware and the PragOptics platform live elsewhere and carry their own
terms. The Omni design files are source-available, not open source: build one for
yourself or your employer, do not manufacture them for resale.

## Contact

support@bridgesindust.com · +1 (832) 425-0421 · League City, TX

On site across the Texas Gulf Coast. Remote and advisory work anywhere in the US.
