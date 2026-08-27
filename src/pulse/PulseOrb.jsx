import { useEffect, useRef } from "react";
import { drawOrb } from "./draw-orb.js";

// The Pulse orb. Advances at the demo's cadence; `thinking` spins it faster —
// that is the waiting animation while Pulse answers.
export default function PulseOrb({ size = 128, thinking = false, className }) {
  const ref = useRef(null);
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;

  useEffect(() => {
    const cv = ref.current;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    cv.width = size * dpr;
    cv.height = size * dpr;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let phase = 0;
    let raf = 0;
    let last = 0;

    function frame(now) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const rate = reduce ? 0 : thinkingRef.current ? 7.2 : 2.4; // demo base ~2.4/s
      phase += rate * dt;
      drawOrb(cv, phase);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: size, height: size, display: "block" }}
      aria-hidden="true"
    />
  );
}
