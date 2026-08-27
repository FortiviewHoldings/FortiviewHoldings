// Turn each education guide's HTML into JSON: guide metadata plus its Q&A
// sections. One source for both rendering (Guide.jsx) and the search index.
//
//   node tools/extract-guides.mjs            all guides
//   node tools/extract-guides.mjs dp-level   one guide
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EDU = join(ROOT, "education");
const OUT = join(ROOT, "src", "data", "guides");

const only = process.argv.slice(2);
const slugs = readdirSync(EDU, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "assets")
  .map((d) => d.name)
  .filter((s) => only.length === 0 || only.includes(s));

function text(node) {
  return node.text.replace(/\s+/g, " ").trim();
}

function extract(slug) {
  const file = join(EDU, slug, "index.html");
  if (!existsSync(file)) return null;
  const doc = parse(readFileSync(file, "utf8"));

  const head = doc.querySelector(".pg-head");
  const h1 = head?.querySelector("h1");
  const title = h1 ? text(h1) : slug;
  const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";

  const lead = (head?.querySelectorAll("p") ?? []).map((p) => p.innerHTML.trim());

  const sections = doc.querySelectorAll("section.pg-tool").map((sec) => {
    const h2 = sec.querySelector(".pg-tool__title");
    const dot = h2?.querySelector(".pg-dot");
    if (dot) dot.remove();
    const question = h2 ? text(h2) : "";
    if (h2) h2.remove();
    const body = sec.innerHTML.trim();
    return { id: sec.getAttribute("id") ?? "", question, body, text: text(sec) };
  });

  const note = doc.querySelector(".pg-tablenote");

  return {
    slug,
    title,
    description,
    lead,
    sections,
    note: note ? text(note) : ""
  };
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

let count = 0;
for (const slug of slugs) {
  const data = extract(slug);
  if (!data) { console.warn("  skip (no index.html):", slug); continue; }
  writeFileSync(join(OUT, slug + ".json"), JSON.stringify(data, null, 2));
  console.log(`  ${slug}: ${data.sections.length} sections`);
  count++;
}
console.log(`  wrote ${count} guide(s) to src/data/guides/`);
