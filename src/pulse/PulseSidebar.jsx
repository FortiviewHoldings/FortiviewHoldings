import { useState, useEffect, useRef } from "react";
import PulseOrb from "./PulseOrb.jsx";
import Pulse from "./Pulse.jsx";
import "./pulse-sidebar.css";

// A launcher orb that expands into a Pulse chat sidebar. Collapsed by default.
export default function PulseSidebar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Fit the panel to the visible area so the browser's top URL bar can't cover
  // the header and the keyboard can't cover the input. Only react to real size
  // changes — syncing on scroll/focus/timers is what dragged the keyboard's own
  // accessory bar last time. resize fires for both the URL bar and the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    const panel = panelRef.current;
    if (!open || !vv || !panel) return;
    const fit = () => {
      panel.style.top = vv.offsetTop + "px";
      panel.style.height = vv.height + "px";
    };
    fit();
    vv.addEventListener("resize", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      panel.style.top = "";
      panel.style.height = "";
    };
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
