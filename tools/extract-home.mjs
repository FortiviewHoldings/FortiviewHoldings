// Split the homepage: static intro + FAQ become content-as-data, the review
// styles move to a CSS file, and the review-submit endpoint is isolated in one
// file so it is trivial to swap for the platform API. The reviews UI itself is
// rebuilt as a component.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "index.html"), "utf8");

// index.html on this branch is the Vite entry; read the old homepage from git.
import { execSync } from "node:child_process";
const html = execSync("git show main:index.html", { cwd: ROOT, encoding: "utf8", maxBuffer: 1e7 });
const doc = parse(html);
const main = doc.querySelector("main");

const sections = main.querySelectorAll(":scope > section");
let intro = "";
let faq = "";
for (const s of sections) {
  const cls = s.getAttribute("class") || "";
  const id = s.getAttribute("id") || "";
  if (id === "reviews") continue;            // rebuilt as a component
  if (cls.includes("fv-faq")) { faq = s.outerHTML; continue; }
  intro += s.outerHTML + "\n";
}

// Review CSS: the page's inline <style> blocks, minus the font import line.
const css = doc.querySelectorAll("style").map((s) => s.innerHTML).join("\n");

// Structured data, for the head later.
const jsonld = doc.querySelectorAll('script[type="application/ld+json"]').map((s) => s.innerHTML.trim());

// The OmniTok trigger URL, isolated.
const endpoint = (html.match(/issueOmniTok:\s*'([^']+)'/) || [])[1] || "";

if (!existsSync(join(ROOT, "src", "data"))) mkdirSync(join(ROOT, "src", "data"), { recursive: true });
if (!existsSync(join(ROOT, "src", "reviews"))) mkdirSync(join(ROOT, "src", "reviews"), { recursive: true });

writeFileSync(join(ROOT, "src", "data", "home.json"), JSON.stringify({ introHtml: intro.trim(), faqHtml: faq, jsonld }, null, 2));
writeFileSync(join(ROOT, "src", "reviews", "reviews.css"), css.trim() + "\n");
writeFileSync(
  join(ROOT, "src", "reviews", "endpoint.js"),
  "// The review-submit trigger. Isolated so swapping to the platform API is a\n" +
  "// one-line change. This is the same endpoint the old homepage used.\n" +
  `export const ISSUE_OMNITOK = ${JSON.stringify(endpoint)};\n`
);

console.log("  intro:", intro.length, "chars | faq:", faq.length, "chars");
console.log("  reviews.css:", css.length, "chars");
console.log("  jsonld blocks:", jsonld.length);
console.log("  endpoint captured:", endpoint ? "yes" : "NO");
