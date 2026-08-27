import { useState } from "react";
import { Link } from "react-router-dom";
import { answerFromGuides } from "./answerFromGuides.js";
import { ask, engineAvailable } from "./ask.js";
import "./assistant.css";

const PROVIDER_LABEL = { api: "answered by the API", webgpu: "answered on your device", none: "" };

// mode "guides" answers grounded in the field guides; "open" is a plain ask.
// Either works on its own.
export default function Assistant({ mode = "guides" }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState("");
  const [answer, setAnswer] = useState(null); // { text, provider, sources }
  const [error, setError] = useState("");

  async function run(e) {
    e.preventDefault();
    if (!q.trim() || busy) return;
    setBusy(true); setError(""); setAnswer(null); setStatus(""); setProgress("");
    try {
      const result = mode === "guides"
        ? await answerFromGuides(q, { onStatus: setStatus, onProgress: setProgress })
        : await ask({ prompt: q, onStatus: setStatus, onProgress: setProgress });
      setAnswer(mode === "guides" ? result : { ...result, sources: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false); setStatus(""); setProgress("");
    }
  }

  return (
    <div className="pg-ask">
      <form className="pg-ask__bar" onSubmit={run}>
        <input
          className="pg-ask__input"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question — the guides answer, grounded in the reference notes."
          aria-label="Ask the field assistant"
          disabled={busy}
        />
        <button className="btn btn--primary" type="submit" disabled={busy || !q.trim()}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </form>

      {!engineAvailable() && (
        <p className="pg-ask__note">
          No answer engine is set up yet. Add a free API key in the model config, or open this in a
          browser with WebGPU (Chrome or Edge) to run the on-device model.
        </p>
      )}

      {busy && (
        <p className="pg-ask__status" aria-live="polite">
          {status}{progress ? " " + progress : ""}
        </p>
      )}

      {error && <p className="pg-ask__note pg-ask__note--bad">{error}</p>}

      {answer && (
        <div className="pg-ask__answer">
          <p className="pg-ask__text">{answer.text}</p>
          {PROVIDER_LABEL[answer.provider] && (
            <p className="pg-ask__by">{PROVIDER_LABEL[answer.provider]}</p>
          )}
          {answer.sources?.length > 0 && (
            <div className="pg-ask__sources">
              <span className="pg-ask__sources-h">From these guides</span>
              {answer.sources.map((s) => (
                <Link key={s.slug + s.sectionId} to={`/education/${s.slug}#${s.sectionId}`}>{s.guide} — {s.question}</Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
