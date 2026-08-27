import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Starfield from "./Starfield.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

// Reveal .fv-reveal children as they scroll in. Re-runs per route so freshly
// mounted pages get observed.
function useReveal(dep) {
  const root = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const nodes = root.current?.querySelectorAll(".fv-reveal") ?? [];
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [dep]);
  return root;
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const main = useReveal(pathname);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <a className="fv-skip" href="#fv-main">Skip to content</a>
      <Starfield />
      <Header />
      <main id="fv-main" tabIndex={-1} ref={main}>
        {children}
      </main>
      <Footer />
    </>
  );
}
