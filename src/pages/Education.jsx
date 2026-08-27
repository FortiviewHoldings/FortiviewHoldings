import { Link } from "react-router-dom";
import { GUIDES } from "../data/guides.js";

export default function Education() {
  return (
    <div className="pg-main">
      <div className="pg-wrap--wide pg-wrap">
        <header className="pg-head">
          <h1 className="fv-h2">Field Pocket Guide</h1>
          <p className="fv-lead">Plain answers to the instrument questions that come up in the field. Search is coming next; for now, pick a guide.</p>
        </header>
        <div className="pg-lib">
          {GUIDES.map((g) => (
            <Link className="pg-lib__item" to={"/education/" + g.slug} key={g.slug}>
              <span className="pg-lib__title">{g.title}</span>
              <span className="pg-lib__meta">{g.sections.length} questions</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
