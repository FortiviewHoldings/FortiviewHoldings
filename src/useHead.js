import { useEffect } from "react";
import { headFor } from "./seo.js";

// An in-app navigation does not load the route's prerendered page, so each route sets the tab title and the
// canonical link itself, from the same head data the prerender writes (seo.js). A view with no address of its
// own (not found) passes no path and its own title: it gets no canonical, as the prerendered 404 page has none.
export function useHead(path, title) {
  useEffect(() => {
    const h = path ? headFor(path) : null;
    document.title = h ? h.title : title;
    let link = document.querySelector('link[rel="canonical"]');
    if (!h) {
      if (link) link.remove();
      return;
    }
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", h.canonical);
  }, [path, title]);
}
