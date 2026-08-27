import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GUIDES } from "../data/guides.js";
import { TOOLS } from "../data/tools.js";
import SearchBox from "../search/SearchBox.jsx";
import Pulse from "../pulse/Pulse.jsx";

export default function Education() {
  const [mode, setMode] = useState("search");
  useEffect(() => { document.title = "Field Pocket Guide | Bridges Industrial"; }, []);

  return (
    <div className="pg-main">
      <div className="pg-wrap--wide pg-wrap">
        <header className="pg-head">
          <h1 className="fv-h2">The reference that fits in your pocket.</h1>
          <p className="fv-lead">Plain answers to the instrument questions that come up in the field, plus the calculators worth keeping. Search across every guide, ask a question, or browse below.</p>
        </header>

        <div className="pg-modes" role="tablist" aria-label="Search or ask Pulse">
          <button role="tab" aria-selected={mode === "search"} className={"pg-mode" + (mode === "search" ? " is-active" : "")} onClick={() => setMode("search")}>Search</button>
          <button role="tab" aria-selected={mode === "ask"} className={"pg-mode" + (mode === "ask" ? " is-active" : "")} onClick={() => setMode("ask")}>Ask Pulse</button>
        </div>

        {mode === "search" ? <SearchBox /> : <Pulse />}

        <section className="pg-cards" aria-label="Tools">
          {TOOLS.map((t) => (
            <a className="pg-card" href={t.href} key={t.href}>
              <div className="pg-card__body">
                <h3 className="pg-card__t">{t.name}</h3>
                <p>{t.desc}</p>
              </div>
              <span className="pg-card__go">{t.cta}</span>
            </a>
          ))}
        </section>

        <section className="pg-lib" id="reference-notes">
          <div className="pg-lib__head">
            <h2 className="fv-h3">Reference notes</h2>
            <p className="pg-lib__note">Longer reference notes on the things that go wrong in the field. Written for the technician holding the meter.</p>
          </div>
          <div className="pg-lib__grid">
            {GUIDES.map((g) => (
              <Link to={"/education/" + g.slug} key={g.slug}>
                <span className="pg-lib__t">
                  <b>{g.title}</b>
                  <span>{g.sections.length} questions</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
