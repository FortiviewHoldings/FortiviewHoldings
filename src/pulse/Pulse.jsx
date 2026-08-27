import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PulseOrb from "./PulseOrb.jsx";
import { pulseAnswer } from "../model/pulseAnswer.js";
import { engineAvailable } from "../model/ask.js";
import "./pulse.css";

const GREETING = "Hi, I'm Pulse. Ask me anything about field instrumentation — I answer from the guides.";

// A small grounded chat. Used inline on the education page and inside the home
// sidebar. The orb spins faster while an answer is coming.
export default function Pulse({ compact = false }) {
  const [turns, setTurns] = useState([]); // { role: "you" | "pulse", text, sources?, provider?, question? }
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [noEngine, setNoEngine] = useState(false);
  const scroller = useRef(null);
  const navigate = useNavigate();

  // Pulse suggests a Break-In when the guides did not cover the question.
  const suggestsBreakIn = (t) => t.provider === "none" || /break[\s-]?in/i.test(t.text || "");

  function toBreakIn(question) {
    navigate("/break-in", { state: { issue: question } });
  }

  useEffect(() => { setNoEngine(!engineAvailable()); }, []);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [turns, thinking]);

  async function send(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setTurns((t) => [...t, { role: "you", text: q }]);
    setThinking(true);
    try {
      const { text, provider, sources } = await pulseAnswer(q);
      setTurns((t) => [...t, { role: "pulse", text, provider, sources, question: q }]);
    } catch (err) {
      setTurns((t) => [...t, { role: "pulse", text: err.message, error: true }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className={"pulse" + (compact ? " pulse--compact" : "")}>
      <div className="pulse__log" ref={scroller}>
        <div className="pulse__intro">
          <PulseOrb size={compact ? 64 : 84} thinking={thinking} className="pulse__orb" />
          <p className="pulse__greet">{GREETING}</p>
        </div>

        {turns.map((t, i) =>
          t.role === "you" ? (
            <div className="pulse__you" key={i}><span>{t.text}</span></div>
          ) : (
            <div className={"pulse__msg" + (t.error ? " is-error" : "")} key={i}>
              <PulseOrb size={26} className="pulse__avatar" />
              <div className="pulse__bubble">
                <p className="pulse__text">{t.text}</p>
                {suggestsBreakIn(t) && (
                  <button type="button" className="pulse__breakin" onClick={() => toBreakIn(t.question)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
                    Submit a Break-In
                  </button>
                )}
                {t.sources?.length > 0 && (
                  <div className="pulse__sources">
                    {t.sources.slice(0, 4).map((s) => (
                      <Link key={s.slug + s.sectionId} to={`/education/${s.slug}#${s.sectionId}`}>{s.question}</Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {thinking && (
          <div className="pulse__msg pulse__msg--thinking">
            <PulseOrb size={26} thinking className="pulse__avatar" />
            <div className="pulse__bubble"><span className="pulse__dots"><i /><i /><i /></span></div>
          </div>
        )}
      </div>

      {noEngine && (
        <p className="pulse__note">Pulse needs its API key set to answer. Search still works.</p>
      )}

      <form className="pulse__bar" onSubmit={send}>
        <input
          className="pulse__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Pulse a question…"
          aria-label="Ask Pulse"
          disabled={thinking}
        />
        <button className="pulse__send" type="submit" disabled={thinking || !input.trim()} aria-label="Send">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </form>
    </div>
  );
}
