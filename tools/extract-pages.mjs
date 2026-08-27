// Extract the static content pages into JSON: the <main> markup plus the head
// metadata. Rendered by ContentPage. Interactive pages are not in this list;
// they get real components.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "pages");

const PAGES = [
  { file: "industrial/index.html", out: "industrial", route: "/industrial" },
  { file: "instrument-support/index.html", out: "instrument-support", route: "/instrument-support" },
  { file: "partnerships/index.html", out: "partnerships", route: "/partnerships" },
  { file: "integration/index.html", out: "integration", route: "/integration" },
  { file: "integration/terms/index.html", out: "terms", route: "/integration/terms" }
];

const attr = (doc, sel, a) => doc.querySelector(sel)?.getAttribute(a) ?? "";

function extract(file, route) {
  const doc = parse(readFileSync(join(ROOT, file), "utf8"));
  const main = doc.querySelector("main");
  const extraCss = doc.querySelectorAll('link[rel="stylesheet"]')
    .map((l) => l.getAttribute("href"))
    .filter((h) => h && !h.includes("fonts.googleapis") && !h.endsWith("fortiview.css"));

  // Page-specific inline <style> (e.g. the pricing-card rules) has to travel
  // with the content, or those elements render unstyled.
  const css = doc.querySelectorAll("head style, body style").map((s) => s.innerHTML).join("\n").trim();

  return {
    route,
    title: doc.querySelector("title")?.text.trim() ?? "",
    description: attr(doc, 'meta[name="description"]', "content"),
    mainClass: main?.getAttribute("class") ?? "",
    html: main ? main.innerHTML.trim() : "",
    css,
    extraCss
  };
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
for (const p of PAGES) {
  const data = extract(p.file, p.route);
  writeFileSync(join(OUT, p.out + ".json"), JSON.stringify(data, null, 2));
  console.log(`  ${p.out}: ${data.html.length} chars${data.extraCss.length ? "  css:" + data.extraCss.join(",") : ""}`);
}
