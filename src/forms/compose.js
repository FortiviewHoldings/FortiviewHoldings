// Intake logic, no React. Builds the email body and subject, and the mailto,
// exactly as the old engine did: single-line values are stripped of CR/LF so
// nothing can inject a mail header, and everything is length-capped.

export const TO = "support@bridgesindust.com";
const CAP = 4000;

export function oneLine(s, max = 200) {
  return String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}
export function multiLine(s, max = CAP) {
  return String(s ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}
export function looksLikeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

const pad = (s, n) => (s.length < n ? s + " ".repeat(n - s.length) : s);

export function flatten(config) {
  return config.layout.flatMap((r) => r.fields).filter((f) => !f.pot);
}

// active = fields currently shown (a reveal target that is hidden is skipped).
function active(config, isShown) {
  return flatten(config).filter((f) => isShown(f));
}

export function compose(config, values, isShown) {
  const fields = active(config, isShown).map((f) => ({
    label: f.dataLabel,
    value: f.block ? multiLine(values[f.name], f.maxlength || CAP) : oneLine(values[f.name], f.maxlength || 200),
    group: f.dataGroup || "",
    block: f.block
  }));

  const lines = [config.title || "SUBMISSION", ""];
  const width = Math.max(0, ...fields.filter((f) => !f.block).map((f) => f.label.length + 1));

  let group = "";
  for (const f of fields) {
    if (f.block) continue;
    if (f.group !== group) {
      group = f.group;
      if (group) lines.push("", group, "-".repeat(group.length));
    }
    lines.push(pad(f.label + ":", width + 1) + " " + (f.value || "-"));
  }
  for (const f of fields) {
    if (!f.block) continue;
    lines.push("", f.label.toUpperCase(), "-".repeat(f.label.length), f.value);
  }
  lines.push("");
  return lines.join("\n");
}

export function subjectOf(config, values, isShown) {
  const parts = active(config, isShown)
    .filter((f) => f.subjectPart && values[f.name])
    .map((f) => oneLine(values[f.name]));
  const base = config.subject || "Website enquiry";
  return oneLine(base + (parts.length ? ": " + parts.join(" — ") : ""), 160);
}

export function mailto(subject, body) {
  return "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

// The fields a form sends to its platform module: every shown field with a value, sanitized exactly as the
// email body is (single-line values stripped of CR/LF, everything length-capped), plus the composed subject
// and, when the visitor ticked it, text_ok. Keys are the form's own field names (letters, digits, _ only).
export function fieldsOf(config, values, isShown, { subject = "", textOk = false } = {}) {
  const out = {};
  for (const f of active(config, isShown)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,40}$/.test(f.name)) continue;
    const v = f.block ? multiLine(values[f.name], f.maxlength || CAP) : oneLine(values[f.name], f.maxlength || 200);
    if (v) out[f.name] = v;
  }
  if (subject) out.subject = oneLine(subject, 160);
  if (textOk) out.text_ok = "yes";
  return out;
}
