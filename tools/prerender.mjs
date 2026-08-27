// Prerender every React route to static HTML so crawlers get real content and
// the app still hydrates. Runs after the client and SSR builds.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const { render, PRERENDER_ROUTES, headFor } = await import(pathToFileURL(join(DIST, "server", "entry-server.js")).href);

const template = readFileSync(join(DIST, "index.html"), "utf8");
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function headTags(h) {
  const tags = [
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}">`,
    `<link rel="canonical" href="${esc(h.canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(h.ogTitle)}">`,
    `<meta property="og:description" content="${esc(h.ogDescription)}">`,
    `<meta property="og:image" content="${esc(h.ogImage)}">`,
    `<meta property="og:url" content="${esc(h.canonical)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${esc(h.ogImage)}">`
  ];
  for (const block of h.jsonld || []) {
    tags.push(`<script type="application/ld+json">${block}</script>`);
  }
  return tags.join("\n    ");
}

let count = 0;
for (const route of PRERENDER_ROUTES) {
  const appHtml = render(route);
  const h = headFor(route);
  let page = template
    .replace("<title>Bridges Industrial</title>", headTags(h))
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  const outDir = route === "/" ? DIST : join(DIST, route);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), page);
  count++;
}

// SPA fallback for unknown paths: an empty shell that boots and renders the
// in-app 404. GitHub Pages serves this with a 404 status.
const notFound = template.replace(
  "<title>Bridges Industrial</title>",
  "<title>Not found | Bridges Industrial</title>\n    <meta name=\"robots\" content=\"noindex\">"
);
writeFileSync(join(DIST, "404.html"), notFound);

console.log(`  prerendered ${count} routes + 404 fallback`);
