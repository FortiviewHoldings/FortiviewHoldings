import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { GUIDES } from "../data/guides.js";
import { buildIndex, search } from "./index.js";
import "./search.css";

// Highlight matched terms in a plain string.
function mark(str, query) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return str;
  const re = new RegExp("(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "ig");
  return str.split(re).map((part, i) =>
    terms.some((t) => part.toLowerCase() === t)
      ? <mark key={i} className="pg-hit">{part}</mark>
      : part
  );
}

export default function SearchBox() {
  const index = useMemo(() => buildIndex(GUIDES), []);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);

  const results = useMemo(() => (query.trim().length > 1 ? search(index, query) : []), [index, query]);

  useEffect(() => { setActive(-1); }, [query]);

  function onKey(e) {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && active >= 0) {
      const link = listRef.current?.querySelectorAll("a")[active];
      link?.click();
    }
  }

  return (
    <div className="pg-search">
      <input
        type="search"
        className="pg-search__input"
        placeholder="Search the guides — a symptom, a term, a part number…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
        aria-label="Search the field guides"
        autoComplete="off"
      />

      {query.trim().length > 1 && (
        <div className="pg-search__meta">
          {results.length ? `${results.length} result${results.length > 1 ? "s" : ""}` : "No matches"}
        </div>
      )}

      {results.length > 0 && (
        <ol className="pg-search__results" ref={listRef}>
          {results.map((r, i) => (
            <li key={r.slug + r.sectionId} className={i === active ? "is-active" : undefined}>
              <Link to={`/education/${r.slug}#${r.sectionId}`}>
                <span className="pg-search__q">{mark(r.question, query)}</span>
                <span className="pg-search__guide">{r.guide}</span>
                <span className="pg-search__snip">{mark(r.snippet, query)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
