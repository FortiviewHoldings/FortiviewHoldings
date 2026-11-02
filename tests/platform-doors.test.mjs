// The site's half of the platform's doors, proven without a network: solve() satisfies the platform's own
// challenge check (an HMAC-signed nonce; sha256(nonce + "." + counter) with `difficulty` leading zero bits,
// checked here the way the platform checks it), and fieldsOf() sends what the platform takes (keys the
// platform keeps, values sanitized like the email body, the subject and the text consent).
//   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { sha256, solve } from "../src/platform/doors.js";
import { fieldsOf, subjectOf, flatten } from "../src/forms/compose.js";
import { PLATFORM } from "../src/platform/config.js";

const hmac = (secret, s) => crypto.createHmac("sha256", secret).update(s).digest("base64url");
function leadingZeroBits(buf) { let n = 0; for (const b of buf) { if (b === 0) { n += 8; continue; } let x = b; while ((x & 0x80) === 0) { n++; x <<= 1; } break; } return n; }
function mint(secret, difficulty) { const body = `${Date.now()}.${difficulty}.${crypto.randomBytes(8).toString("base64url")}`; return { nonce: `${body}.${hmac(secret, body)}`, difficulty }; }
function verify(secret, { nonce, counter }) {
  const [ts, diff, rand, sig] = String(nonce).split(".");
  if (hmac(secret, `${ts}.${diff}.${rand}`) !== sig) return "forged";
  const hash = crypto.createHash("sha256").update(`${nonce}.${counter}`).digest();
  return leadingZeroBits(hash) >= Number(diff) ? "ok" : "unsolved";
}

test("sha256 agrees with node's", () => {
  for (const s of ["", "abc", "a nonce.12345", "ü unicode ✓"]) {
    const words = sha256(s);
    const hex = words.map((w) => w.toString(16).padStart(8, "0")).join("");
    assert.equal(hex, crypto.createHash("sha256").update(s).digest("hex"), JSON.stringify(s));
  }
});

test("solve() passes the platform's check at its difficulty (15 bits), three fresh challenges", () => {
  for (let i = 0; i < 3; i++) {
    const c = mint("test-secret", 15);
    const counter = solve(c.nonce, c.difficulty);
    assert.ok(counter !== "", "a counter was found");
    assert.equal(verify("test-secret", { nonce: c.nonce, counter }), "ok");
    assert.equal(verify("other-secret", { nonce: c.nonce, counter }), "forged", "the signature is the platform's");
  }
});

const forms = { "break-in": "src/data/forms/break-in.json", contact: "src/data/forms/contact.json", partner: "src/data/forms/partner.json" };
const load = (p) => JSON.parse(readFileSync(new URL("../" + p, import.meta.url), "utf8"));

test("every form on the site has its own platform install", () => {
  for (const key of Object.keys(forms)) assert.match(PLATFORM.installs[key] || "", /^[0-9a-f]{16}$/, key);
  assert.match(PLATFORM.installs.reviews || "", /^[0-9a-f]{16}$/, "reviews");
  assert.equal(new Set(Object.values(PLATFORM.installs)).size, Object.keys(PLATFORM.installs).length, "no two forms share an install");
});

test("fieldsOf: the break-in form's fields, sanitized, with the subject and the text consent", () => {
  const cfg = load(forms["break-in"]);
  const values = { name: "PragOptics Test", company: "PragOptics\r\nTest", email: "test@example.com", phone: "", sector: "Manufacturing & Discrete", measuring: "Flow", product: "Test only", when: "Intermittent, no pattern found yet", around: "", issue: "Line one\r\nLine two" };
  const shown = (f) => { if (!f.hidden || !f.wrapId) return true; const ctrl = flatten(cfg).find((c) => c.dataReveal === "#" + f.wrapId); return ctrl ? values[ctrl.name] === ctrl.dataRevealWhen : true; };
  const subject = subjectOf(cfg, values, shown);
  const out = fieldsOf(cfg, values, shown, { subject, textOk: true });
  assert.equal(out.name, "PragOptics Test");
  assert.equal(out.company, "PragOptics Test", "a single-line value loses its line breaks");
  assert.equal(out.issue, "Line one\nLine two", "a block keeps its lines, normalised");
  assert.equal(out.email, "test@example.com");
  assert.equal(out.sector, "Manufacturing & Discrete");
  assert.ok(!("phone" in out) && !("around" in out), "empty fields are not sent");
  assert.ok(!("sectorOther" in out), "a hidden reveal field is not sent");
  assert.equal(out.subject, subject);
  assert.equal(out.text_ok, "yes");
  for (const k of Object.keys(out)) assert.match(k, /^[a-zA-Z_][a-zA-Z0-9_]{0,40}$/, "the platform keeps the key " + k);
  assert.ok(!("website" in out), "the honeypot is never a field");
});

test("fieldsOf: the contact and partner forms send their own field names", () => {
  const c = load(forms.contact), p = load(forms.partner);
  const yes = () => true;
  const co = fieldsOf(c, { name: "A", email: "a@example.com", topic: "Work with us, general", message: "Hello" }, yes);
  assert.deepEqual(Object.keys(co).sort(), ["email", "message", "name", "topic"]);
  const po = fieldsOf(p, { name: "B", email: "b@example.com", type: "Other", offering: "Parts" }, yes);
  assert.deepEqual(Object.keys(po).sort(), ["email", "name", "offering", "type"]);
});
