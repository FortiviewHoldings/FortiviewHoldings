// Pull each intake form's config out of its page HTML so the React Intake
// component renders from data, not hand-transcribed field lists.
//
//   node tools/extract-forms.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "forms");

const PAGES = [
  { file: "contact/index.html", out: "contact" },
  { file: "break-in/index.html", out: "break-in" },
  { file: "partnerships/apply/index.html", out: "partner" }
];

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

function control(field) {
  const el = field.querySelector("input, select, textarea");
  if (!el) return null;
  const a = el.attributes;
  const labelEl = field.querySelector("label");
  const label = labelEl ? clean(labelEl.text.replace("*", "")) : "";

  const f = {
    tag: el.tagName.toLowerCase(),
    name: a.name || "",
    label,
    wrapId: field.getAttribute("id") || null,
    hidden: field.hasAttribute("hidden"),
    type: a.type || null,
    required: el.hasAttribute("required"),
    maxlength: a.maxlength ? Number(a.maxlength) : null,
    minlength: a.minlength ? Number(a.minlength) : null,
    autocomplete: a.autocomplete || null,
    inputmode: a.inputmode || null,
    placeholder: a.placeholder || null,
    dataLabel: a["data-label"] || label,
    dataGroup: a["data-group"] || null,
    dataMsg: a["data-msg"] || null,
    dataHintFor: a["data-hint-for"] || null,
    dataCountFor: a["data-count-for"] || null,
    dataReveal: a["data-reveal"] || null,
    dataRevealWhen: a["data-reveal-when"] || null,
    subjectPart: el.hasAttribute("data-subject-part"),
    block: el.hasAttribute("data-block"),
    pot: el.hasAttribute("data-pot")
  };

  if (f.tag === "select") {
    f.options = el.querySelectorAll("option").map((o) => ({
      value: o.hasAttribute("value") ? o.getAttribute("value") : clean(o.text),
      text: clean(o.text),
      hint: o.getAttribute("data-hint") || null,
      key: o.getAttribute("data-key") || null
    }));
  }
  return f;
}

function extract(file) {
  const doc = parse(readFileSync(join(ROOT, file), "utf8"));
  const form = doc.querySelector("form.fv-form");
  const submit = form.querySelector('[type="submit"]');

  const layout = [];
  let pot = null;

  for (const child of form.childNodes) {
    if (child.nodeType !== 1) continue;
    const cls = child.getAttribute("class") || "";
    if (cls.includes("fv-form__pot")) {
      const f = control(child);
      if (f) pot = f.name;
      continue;
    }
    if (cls.includes("fv-form__row")) {
      const fields = child.querySelectorAll(".fv-form__field").map(control).filter(Boolean);
      layout.push({ row: true, fields });
    } else if (cls.includes("fv-form__field")) {
      const f = control(child);
      if (f) layout.push({ row: false, fields: [f] });
    }
  }

  return {
    intake: form.getAttribute("data-intake"),
    subject: form.getAttribute("data-subject"),
    title: form.getAttribute("data-title"),
    submitLabel: submit ? clean(submit.text) : "Send",
    pot,
    layout
  };
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
for (const p of PAGES) {
  const cfg = extract(p.file);
  writeFileSync(join(OUT, p.out + ".json"), JSON.stringify(cfg, null, 2));
  const n = cfg.layout.reduce((a, r) => a + r.fields.length, 0);
  console.log(`  ${p.out}: ${n} fields`);
}
