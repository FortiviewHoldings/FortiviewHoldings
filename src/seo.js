// Per-route head data and the list of routes to prerender. One source for the
// build-time prerender and any client-side title updates.
import { GUIDES } from "./data/guides.js";
import home from "./data/home.json";
import industrial from "./data/pages/industrial.json";
import instrumentSupport from "./data/pages/instrument-support.json";
import partnerships from "./data/pages/partnerships.json";
import integration from "./data/pages/integration.json";
import terms from "./data/pages/terms.json";

export const SITE = "https://bridgesindust.com";
const OG_IMAGE = SITE + "/images/social-preview.png";

const HOME = {
  title: "Bridges Industrial | Field Instrumentation & Industrial Automation",
  description: "Hands-on field instrumentation and analytical measurement: calibration, commissioning, and diagnostics for readings that will not behave. Plus technical training, one-off custom hardware, and custom data connections served in your system or hosted in ours."
};

const FORMS = {
  "/contact": { title: "Work With Us | Bridges Industrial", description: "Tell us what you need — instrumentation and field work, training, control logic, custom hardware, or the software side. A specialist answers by email." },
  "/break-in": { title: "Submit a Break-In | Bridges Industrial", description: "Free intake for an instrument problem. Tell us what is wrong and a specialist answers personally, by email, at no cost." },
  "/partnerships/apply": { title: "Become a Partner | Bridges Industrial", description: "Tell us what you do well and who you serve. An introduction, not an application with a scoring rubric." }
};

const CONTENT = [industrial, instrumentSupport, partnerships, integration, terms];

function head({ title, description, path, jsonld }) {
  const canonical = SITE + (path === "/" ? "/" : path + "/");
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: OG_IMAGE,
    jsonld: jsonld || []
  };
}

export const PRERENDER_ROUTES = [
  "/",
  "/education",
  ...GUIDES.map((g) => "/education/" + g.slug),
  "/contact",
  "/break-in",
  "/partnerships/apply",
  ...CONTENT.map((p) => p.route)
];

export function headFor(path) {
  const clean = path.replace(/\/$/, "") || "/";

  if (clean === "/") return head({ title: HOME.title, description: HOME.description, path: "/", jsonld: home.jsonld });

  if (clean === "/education")
    return head({ title: "Field Pocket Guide | Bridges Industrial", description: "Plain answers to the instrument questions that come up in the field, plus the calculators worth keeping.", path: clean });

  const guideSlug = clean.startsWith("/education/") ? clean.slice("/education/".length) : null;
  if (guideSlug) {
    const g = GUIDES.find((x) => x.slug === guideSlug);
    if (g) return head({ title: g.title + " | Field Pocket Guide", description: g.description, path: clean });
  }

  if (FORMS[clean]) return head({ ...FORMS[clean], path: clean });

  const page = CONTENT.find((p) => p.route === clean);
  if (page) return head({ title: page.title, description: page.description, path: clean });

  return head({ title: "Bridges Industrial", description: HOME.description, path: clean });
}
