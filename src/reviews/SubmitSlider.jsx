import { useRef, useState } from "react";

// Slide-to-submit. The drag is the flourish; Enter/Space/arrows do the same
// thing, so it is reachable by keyboard from the start.
export default function SubmitSlider({ disabled, label = "Slide to Submit", onComplete }) {
  const track = useRef(null);
  const handle = useRef(null);
  const [fill, setFill] = useState(0); // 0..1
  const [done, setDone] = useState(false);

  function complete() {
    if (disabled || done) return;
    setDone(true);
    setFill(1);
    onComplete();
  }

  function reset() {
    setFill(0);
    setDone(false);
  }

  function onPointerDown(e) {
    if (disabled || done) return;
    const t = track.current;
    const h = handle.current;
    const max = t.offsetWidth - h.offsetWidth;
    h.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const rect = t.getBoundingClientRect();
      const x = Math.max(0, Math.min(ev.clientX - rect.left - h.offsetWidth / 2, max));
      setFill(max ? x / max : 0);
      if (x >= max) { up(); complete(); }
    };
    const up = () => {
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerup", up);
      if (!done) setFill((f) => (f >= 1 ? f : 0));
    };
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", up);
  }

  function onKeyDown(e) {
    if (["Enter", " ", "ArrowRight", "ArrowUp", "End"].includes(e.key)) {
      e.preventDefault();
      complete();
    }
  }

  return (
    <div
      ref={track}
      className={"review-slider" + (disabled ? " slider-disabled" : "") + (done ? " filled" : "")}
      role="slider"
      tabIndex={0}
      aria-label={label + " — press Enter to submit"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fill * 100)}
      aria-disabled={disabled}
      onKeyDown={onKeyDown}
    >
      <div className="slider-fill" style={{ width: `calc(${fill * 100}% )` }} aria-hidden="true" />
      <span className="slider-label">{done ? "Submitting Review…" : label}</span>
      <div
        className="slider-handle"
        ref={handle}
        aria-hidden="true"
        style={{ transform: `translateX(${fill * ((track.current?.offsetWidth || 0) - (handle.current?.offsetWidth || 0))}px)` }}
        onPointerDown={onPointerDown}
      />
    </div>
  );
}
