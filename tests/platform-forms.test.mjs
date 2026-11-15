// The platform's declaration of this site's forms (tools/platform-forms.mjs, pragoptics.forms.json): one entry per form
// that posts into an install, the fields as the form shows them, and the committed file current against the forms.
//   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { declaration, declare } from "../tools/platform-forms.mjs";
import { PLATFORM } from "../src/platform/config.js";

const d = JSON.parse(declaration());
const byName = Object.fromEntries(d.forms.map((f) => [f.name, f]));

test("three forms, each on its own install, each one send_message action", () => {
  assert.deepEqual(d.forms.map((f) => f.install).sort(), [PLATFORM.installs["break-in"], PLATFORM.installs.contact, PLATFORM.installs.partner].sort());
  for (const f of d.forms) { assert.equal(f.actions.length, 1); assert.equal(f.actions[0].name, "send_message"); assert.ok(f.actions[0].description.length > 40); }
});

test("the Break-In carries its own fields: the selects with their choices, the reveal targets not required, the text consent", () => {
  const p = Object.fromEntries(byName["Submit a Break-In"].actions[0].params.map((x) => [x.key, x]));
  assert.deepEqual(Object.keys(p), ["name", "company", "email", "phone", "sector", "sectorOther", "measuring", "product", "when", "around", "issue", "text_ok"]);
  assert.equal(p.email.type, "email"); assert.equal(p.email.required, true);
  assert.equal(p.sector.options.length, 16); assert.equal(p.sector.options[0], "Oil & Gas — Upstream"); assert.equal(p.sector.options.at(-1), "Other");
  assert.equal(p.sectorOther.required, false); assert.match(p.sectorOther.label, /only when Sector is Other/);
  assert.equal(p.measuring.options.length, 9); assert.equal(p.when.options.length, 8);
  assert.equal(p.issue.type, "textarea"); assert.equal(p.issue.required, true);
  assert.deepEqual(p.text_ok, { key: "text_ok", label: "Text me instead: permission to reply by text to the phone given", type: "boolean", required: false });
});

test("Work With Us and Become a Partner carry theirs, not the Break-In's", () => {
  const c = Object.fromEntries(byName["Work With Us"].actions[0].params.map((x) => [x.key, x]));
  assert.deepEqual(Object.keys(c), ["name", "company", "email", "phone", "topic", "topicOther", "message", "text_ok"]);
  assert.equal(c.topic.options.length, 9); assert.equal(c.topic.options[0], "Work with us, general"); assert.equal(c.message.type, "textarea");
  const p = Object.fromEntries(byName["Become a Partner"].actions[0].params.map((x) => [x.key, x]));
  assert.deepEqual(Object.keys(p), ["name", "business", "email", "phone", "site", "area", "type", "offering", "text_ok"]);
  assert.equal(p.type.options.length, 8); assert.equal(p.type.options[0], "Vendor or supplier"); assert.equal(p.offering.required, true);
  assert.ok(!("issue" in p) && !("sector" in p) && !("measuring" in c), "no break-in field on the other two");
});

test("a form whose intake has no install is left out", () => {
  assert.equal(declare({ intake: "nothing", title: "X", submitLabel: "Go", layout: [] }), null);
});

test("the committed pragoptics.forms.json is current (else: npm run forms)", () => {
  assert.equal(readFileSync(new URL("../pragoptics.forms.json", import.meta.url), "utf8"), declaration());
});
