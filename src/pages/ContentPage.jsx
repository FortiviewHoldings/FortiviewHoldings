import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Renders a static content page extracted from the old HTML. Internal links
// inside the markup route through the app instead of reloading; the form CTAs
// (/break-in, /contact, /partnerships/apply) are real routes now.
export default function ContentPage({ data }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (data.title) document.title = data.title;
  }, [data.title]);

  function onClick(e) {
    const a = e.target.closest?.("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//")) return;
    if (/\.\w+($|[?#])/.test(href)) return; // let real files (.md, .png) go
    if (a.hasAttribute("target")) return;
    e.preventDefault();
    const url = new URL(href, window.location.origin);
    const path = url.pathname.replace(/\/index\.html$/, "").replace(/(.)\/$/, "$1");
    navigate(path + url.search + url.hash);
  }

  // A div, not a <main> — Layout already provides the single main landmark.
  return (
    <div
      ref={ref}
      className={data.mainClass || undefined}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: data.html }}
    />
  );
}
