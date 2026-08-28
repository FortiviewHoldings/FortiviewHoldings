// Derive sitemap.xml from what actually landed in dist: every index.html is one
// URL. Runs last in the build, after prerender and the static staging, so it
// covers the React routes, the calculator pages, and the Idea Lab alike — add a
// page anywhere and it shows up here with no second edit.
import { readdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE = "https://bridgesindust.com";
const SKIP = new Set(["server"]); // the SSR build output, not a public route

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Every index.html under dist, as a path relative to dist.
function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (relative(DIST, full).split(sep).some((p) => SKIP.has(p))) continue;
    if (statSync(full).isDirectory()) walk(full, found);
    else if (name === "index.html") found.push(relative(DIST, full));
  }
  return found;
}

// dist/education/rtd/index.html -> https://bridgesindust.com/education/rtd/
function toUrl(rel) {
  const dir = rel.split(sep).slice(0, -1).join("/");
  return SITE + "/" + (dir ? dir + "/" : "");
}

function priority(url) {
  const path = url.slice(SITE.length);
  if (path === "/") return "1.0";
  if (path.startsWith("/idea-lab/") && path !== "/idea-lab/") return "0.5";
  return "0.7";
}

const today = new Date().toISOString().slice(0, 10);
const urls = walk(DIST).map(toUrl).sort();
const body = urls
  .map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod><priority>${priority(u)}</priority></url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), xml);

console.log(`  wrote sitemap.xml (${urls.length} urls)`);
