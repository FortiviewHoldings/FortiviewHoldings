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
