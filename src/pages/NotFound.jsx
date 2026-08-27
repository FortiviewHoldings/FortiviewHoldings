import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => { document.title = "Not found | Bridges Industrial"; }, []);

  return (
    <section className="fv-section">
      <div className="fv-wrap" style={{ textAlign: "center", maxWidth: "60ch" }}>
        <p className="fv-eyebrow">404</p>
        <h1>That page is not here.</h1>
        <p className="fv-lead">The link may be old, or the page moved. Start from the homepage, or tell us what you were after.</p>
        <div className="fv-actions" style={{ justifyContent: "center", marginTop: "18px" }}>
          <Link className="btn btn--primary" to="/">Home</Link>
          <Link className="btn btn--ghost" to="/education">Field Pocket Guide</Link>
          <Link className="btn btn--ghost" to="/break-in">Submit a Break-In</Link>
        </div>
      </div>
    </section>
  );
}
