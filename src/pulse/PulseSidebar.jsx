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

  // Keep the panel inside the visual viewport so the on-screen keyboard cannot
  // cover the input while typing.
  useEffect(() => {
    const vv = window.visualViewport;
    const panel = panelRef.current;
    if (!open || !vv || !panel) return;
    const sync = () => {
      panel.style.height = vv.height + "px";
      panel.style.top = vv.offsetTop + "px";
    };
    // Focusing the input opens the keyboard; re-sync then and once more after it
    // finishes animating, so the first open lands right, not just reopens.
    const onFocusIn = () => { sync(); setTimeout(sync, 300); };
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    panel.addEventListener("focusin", onFocusIn);
    sync();
    const settle = setTimeout(sync, 320);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      panel.removeEventListener("focusin", onFocusIn);
      clearTimeout(settle);
      panel.style.height = "";
      panel.style.top = "";
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

      <aside ref={panelRef} className={"pulse-panel" + (open ? " is-open" : "")} aria-hidden={!open} aria-label="Pulse assistant">
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
