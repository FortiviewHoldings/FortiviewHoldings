import { useState, useEffect } from "react";
import PulseOrb from "./PulseOrb.jsx";
import Pulse from "./Pulse.jsx";
import "./pulse-sidebar.css";

// A launcher orb that expands into a Pulse chat sidebar. Collapsed by default.
export default function PulseSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {!open && (
        <button className="pulse-launch" type="button" onClick={() => setOpen(true)} aria-label="Ask Pulse">
          <PulseOrb size={44} className="pulse-launch__orb" />
          <span>Ask Pulse</span>
        </button>
      )}

      <aside className={"pulse-panel" + (open ? " is-open" : "")} aria-hidden={!open} aria-label="Pulse assistant">
        <header className="pulse-panel__head">
          <div className="pulse-panel__id">
            <PulseOrb size={30} thinking={false} />
            <span>Pulse</span>
          </div>
          <button className="pulse-panel__close" type="button" onClick={() => setOpen(false)} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        {open && <Pulse compact />}
      </aside>

      {open && <div className="pulse-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}
