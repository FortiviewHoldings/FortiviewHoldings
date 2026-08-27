import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Starfield from "./Starfield.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

// Reveal .fv-reveal children as they scroll in. IO-independent: anything in
// view is shown at once, the rest animate in on scroll, and a safety timer
// guarantees nothing is ever left hidden — content must never depend on the
// observer firing.
function useReveal(dep) {
  const root = useRef(null);
  useEffect(() => {
    const nodes = [...(root.current?.querySelectorAll(".fv-reveal") ?? [])];
    if (!nodes.length) return;
    const show = (n) => n.classList.add("in");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(show);
      return;
    }

    // reveal whatever is already on screen right now
    const vh = window.innerHeight || 800;
    nodes.forEach((n) => { if (n.getBoundingClientRect().top < vh * 0.95) show(n); });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((n) => { if (!n.classList.contains("in")) io.observe(n); });

    // nothing stays hidden even if the observer never fires
    const safety = setTimeout(() => nodes.forEach(show), 2000);
    return () => { io.disconnect(); clearTimeout(safety); };
  }, [dep]);
  return root;
}

export default function Layout({ children }) {
  const { pathname, hash } = useLocation();
  const main = useReveal(pathname);

  // Top on a new page, but leave anchor navigation (search results) alone.
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);

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
