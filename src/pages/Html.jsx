import { useNavigate } from "react-router-dom";

// Render trusted extracted markup, routing internal links through the app
// instead of reloading. Shared by the content pages and the homepage sections.
export default function Html({ html, className, as: Tag = "div" }) {
  const navigate = useNavigate();

  function onClick(e) {
    const a = e.target.closest?.("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//")) return;
    if (/\.\w+($|[?#])/.test(href)) return; // real files (.md, images) pass through
    if (a.hasAttribute("target")) return;
    e.preventDefault();
    const url = new URL(href, window.location.origin);
    const path = url.pathname.replace(/\/index\.html$/, "").replace(/(.)\/$/, "$1");
    navigate(path + url.search + url.hash);
  }

  return <Tag className={className || undefined} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
