import { useEffect, useRef } from "react";

// Canvas starfield, drawn once and animated unless reduced-motion is set.
export default function Starfield() {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let stars = [];
    let raf = 0;

    function size() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      const n = Math.min(160, Math.floor((c.width * c.height) / 11000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.3 + 0.3,
        t: Math.random() * Math.PI * 2,
        s: Math.random() * 0.012 + 0.003,
        hue: Math.random() < 0.16 ? "#7c5cff" : Math.random() < 0.5 ? "#3ee0ff" : "#ffffff"
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const st of stars) {
        st.t += st.s;
        ctx.globalAlpha = reduce ? 0.6 : 0.3 + Math.abs(Math.sin(st.t)) * 0.6;
        ctx.fillStyle = st.hue;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    }

    const onResize = () => { size(); draw(); };
    size();
    draw();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="fv-stars" ref={ref} aria-hidden="true" />;
}
