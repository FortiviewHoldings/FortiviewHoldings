import { useParams, Link } from "react-router-dom";
import { guide } from "../data/guides.js";

export default function Guide() {
  const { slug } = useParams();
  const g = guide(slug);

  if (!g) {
    return (
      <div className="pg-wrap pg-wrap--wide">
        <p className="fv-lead">That guide does not exist. <Link to="/education">Back to the Field Pocket Guide</Link>.</p>
      </div>
    );
  }

  return (
    <div className="pg-main">
      <div className="pg-wrap--wide pg-wrap">
        <header className="pg-head">
          <Link className="pg-back" to="/education">Field Pocket Guide</Link>
          <h1 className="fv-h2">{g.title}</h1>
          {g.lead.map((html, i) => (
            <p key={i} className={i === 0 ? "fv-lead" : undefined} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </header>

        {g.sections.map((s) => (
          <section className="pg-tool" id={s.id} key={s.id}>
            <h2 className="pg-tool__title"><span className="pg-dot" /> {s.question}</h2>
            <div dangerouslySetInnerHTML={{ __html: s.body }} />
          </section>
        ))}

        {g.note && <p className="pg-tablenote">{g.note}</p>}
      </div>
    </div>
  );
}
