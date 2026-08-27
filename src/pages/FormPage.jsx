import Intake from "../forms/Intake.jsx";

// Hero copy plus the intake form. Each form page passes its heading, leads,
// and config.
export default function FormPage({ eyebrow, title, leads, config, initial }) {
  return (
    <section className="fv-section">
      <div className="fv-wrap fv-split">
        <div className="fv-split__intro">
          {eyebrow && <p className="fv-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {leads.map((l, i) => (
            <p className="fv-lead" key={i} style={i > 0 ? { marginTop: "14px" } : undefined}>{l}</p>
          ))}
        </div>
        <div className="fv-split__form">
          <Intake config={config} initial={initial} />
        </div>
      </div>
    </section>
  );
}
