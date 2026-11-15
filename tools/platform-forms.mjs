// The platform's declaration of this site's forms, pragoptics.forms.json at the repository root, generated from the forms
// themselves (src/data/forms/*.json) and the install each posts into (src/platform/config.js), so the fields the site's
// assistant fills are the fields the form shows: every key, its label, a select's choices, what is required.
//   node tools/platform-forms.mjs          writes pragoptics.forms.json
//   node tools/platform-forms.mjs --check  exits 1 with the fix named when the file is stale (the build runs this first)
// The studio sends each install its list at Build & publish; the action name stays send_message, the Intake form's own,
// so the assistant's approvals and switches on it keep standing.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PLATFORM } from "../src/platform/config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "pragoptics.forms.json");
const FORMS_DIR = join(ROOT, "src", "data", "forms");

// What each form is for, in the words the assistant reads when it decides which one a visitor needs.
const ABOUT = {
  "break-in": {
    name: "Submit a Break-In", label: "Submit a break-in",
    description: "A break-in: an instrument, measurement or control problem on the visitor's site that a Bridges Industrial specialist takes up by email, free. Use it when something is misbehaving now (a reading, a loop, a transmitter, a valve, a PLC) and the visitor wants help with it."
  },
  contact: {
    name: "Work With Us", label: "Send a website enquiry",
    description: "A website enquiry to work with Bridges Industrial: field instrumentation work, technical training, control logic (PLC or DCS), custom hardware or a print run, software or PragOptics, a referred project, or a problem with this website. Use it when the visitor wants services, a quote or a conversation, not a fix right now."
  },
  partner: {
    name: "Become a Partner", label: "Send a partner introduction",
    description: "A partner introduction from a vendor, supplier, distributor, manufacturer or rep, integrator, contractor, specialist trade, software company or referrer who wants to work alongside Bridges Industrial. Use it when the visitor offers something, not when they need help."
  }
};

const TYPE = (f) => {
  if (f.tag === "textarea" || f.block) return "textarea";
  if (f.tag === "select") return "text";
  const t = String(f.type || "text").toLowerCase();
  return t === "email" ? "email" : t === "url" ? "url" : t === "number" ? "number" : "text";
};
const flat = (config) => config.layout.flatMap((r) => r.fields).filter((f) => !f.pot);

/** One form's declaration: its install and its action list, in the platform's own shape. */
export function declare(config) {
  const install = PLATFORM.installs[config.intake];
  if (!install) return null;
  const about = ABOUT[config.intake] || { name: config.title, label: config.submitLabel, description: "" };
  const fields = flat(config);
  const params = fields.map((f) => {
    const ctrl = f.hidden && f.wrapId ? fields.find((c) => c.dataReveal === "#" + f.wrapId) : null;
    const label = ctrl ? `${f.label} (only when ${ctrl.label.replace(/\?$/, "")} is ${ctrl.dataRevealWhen})` : f.label;
    const options = f.tag === "select" ? (f.options || []).map((o) => (o && typeof o === "object" ? o.value : o)).filter(Boolean) : [];
    return { key: f.name, label, type: TYPE(f), required: !!f.required && !f.hidden, ...(options.length > 1 ? { options } : {}) };
  });
  params.push({ key: "text_ok", label: "Text me instead: permission to reply by text to the phone given", type: "boolean", required: false });
  return { install, name: about.name, actions: [{ name: "send_message", label: about.label, description: about.description, params }] };
}

export function declaration() {
  const files = readdirSync(FORMS_DIR).filter((n) => n.endsWith(".json")).sort();
  const forms = files.map((n) => declare(JSON.parse(readFileSync(join(FORMS_DIR, n), "utf8")))).filter(Boolean);
  return JSON.stringify({ forms }, null, 2) + "\n";
}

const here = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (here) {
  const text = declaration();
  if (process.argv.includes("--check")) {
    let have = ""; try { have = readFileSync(OUT, "utf8"); } catch {}
    if (have !== text) { console.error("pragoptics.forms.json is stale against src/data/forms. Run: npm run forms, then commit pragoptics.forms.json."); process.exit(1); }
    console.log("pragoptics.forms.json is current.");
  } else {
    writeFileSync(OUT, text);
    console.log(`wrote pragoptics.forms.json: ${JSON.parse(text).forms.length} forms`);
  }
}
