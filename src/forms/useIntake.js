import { useMemo, useState } from "react";
import { flatten, compose, subjectOf, mailto, looksLikeEmail, TO } from "./compose.js";

// The backend is not wired yet, so submit falls back to mailto. One constant
// to point every form at the mailer later.
const ENDPOINT = "";

export function useIntake(config, initial = {}) {
  const fields = useMemo(() => flatten(config), [config]);
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState(null); // { text, tone: "ok" | "bad" }
  const [error, setError] = useState(null); // { name, text }
  const [copy, setCopy] = useState(false);
  const [dump, setDump] = useState("");
  const [pot, setPot] = useState("");
  const [textOk, setTextOk] = useState(false);

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  // Body plus the text-consent note when the visitor opted in.
  function bodyWith() {
    let b = compose(config, values, shown);
    if (textOk) {
      const phone = (values.phone || "").trim();
      b += "\nRESPONSE PREFERENCE\n-------------------\n" +
        "Text OK to " + (phone || "(no number given)") +
        " — permission granted to reply by text; message and data rates may apply, reply STOP to opt out.\n";
    }
    return b;
  }

  // A reveal target shows only when its controlling select matches.
  const shown = (f) => {
    if (!f.hidden || !f.wrapId) return true;
    const ctrl = fields.find((c) => c.dataReveal === "#" + f.wrapId);
    return ctrl ? values[ctrl.name] === ctrl.dataRevealWhen : true;
  };

  function validate() {
    for (const f of fields) {
      if (!shown(f)) continue;
      const val = (values[f.name] ?? "").trim();
      if (f.required && !val) return { name: f.name, text: f.dataMsg || `Please complete ${f.label.toLowerCase()}.` };
      if (val && f.type === "email" && !looksLikeEmail(val)) return { name: f.name, text: "That email address does not look right." };
      if (f.minlength && val && val.length < f.minlength) return { name: f.name, text: f.dataMsg || "Please add a little more detail." };
    }
    return null;
  }

  function submit(e) {
    e.preventDefault();
    setStatus(null);
    setError(null);

    if (pot) { // honeypot filled: accept, send nothing
      setStatus({ text: "Thanks. That has been recorded.", tone: "ok" });
      return;
    }

    const bad = validate();
    if (bad) { setError(bad); return; }
    if (textOk && !(values.phone || "").trim()) {
      setError({ name: "phone", text: "Add a phone number so we can text you, or uncheck the text option." });
      return;
    }

    const body = bodyWith();
    const subject = subjectOf(config, values, shown);
    const text = "To: " + TO + "\nSubject: " + subject + "\n\n" + body;
    setDump("");

    if (ENDPOINT) {
      setStatus({ text: "Sending…", tone: "ok" });
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: config.intake, ...values }) })
        .then((r) => { if (!r.ok) throw new Error("bad"); setStatus({ text: "Sent. A specialist replies by email, in the order requests are received.", tone: "ok" }); setValues({}); setCopy(false); })
        .catch(() => { setCopy(true); setStatus({ text: "That did not go through. Use Copy the details instead, or email " + TO + " directly.", tone: "bad" }); });
      return;
    }

    setCopy(true);
    const href = mailto(subject, body);

    // Browsers refuse an over-long URL; a long mailto arrives truncated. Past a
    // safe ceiling, hand over the text instead of opening a half-empty draft.
    if (href.length > 1900) {
      setDump(text);
      setStatus({ text: "Your message is long enough that a browser cannot hand the whole thing to an email app. It is ready below — copy it and send it to " + TO + ", or use Copy the details.", tone: "bad" });
      return;
    }

    try {
      window.location.href = href;
    } catch {
      setDump(text);
      setStatus({ text: "Your browser would not open an email app. The message is ready below — copy it and send it to " + TO + ".", tone: "bad" });
      return;
    }
    setStatus({ text: "If your email app did not open — some browsers have none set, or block it — use Copy the details, or send the message to " + TO + " yourself. Nothing was lost.", tone: "ok" });
    return text;
  }

  function copyDetails() {
    const subject = subjectOf(config, values, shown);
    const text = "To: " + TO + "\nSubject: " + subject + "\n\n" + bodyWith();
    const reveal = () => { setDump(text); setStatus({ text: "Select the text below and send it to " + TO + ".", tone: "bad" }); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => setStatus({ text: "Copied. Paste it into an email to " + TO + ".", tone: "ok" }),
        reveal
      );
    } else {
      reveal();
    }
  }

  return { values, set, status, error, copy, dump, pot, setPot, textOk, setTextOk, shown, submit, copyDetails };
}
