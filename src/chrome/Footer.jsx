import { CONTACT, FOOTER_LINKS } from "../site.js";

export default function Footer() {
  return (
    <footer className="fv-footer">
      <div className="fv-wrap fv-footer__top">
        <div className="fv-footer__brand">
          <a className="fv-brand" href="/">
            <span className="fv-brand__mark fv-brand__mark--plain" style={{ backgroundImage: "url(/images/Logo.png)" }} />
            <span className="fv-brand__name">Bridges <span>Industrial</span></span>
          </a>
          <p>Hands-on field instrumentation and analytical measurement, technical training, PragOptics hardware and software, and the Idea Lab. Engineered for clarity, accountability, and scale.</p>
          <p>On site across the Texas Gulf Coast from League City, including Houston, Texas City, Pasadena, Baytown, Clear Lake, and Galveston. Remote and advisory work anywhere in the US.</p>
        </div>
        <div className="fv-fcol">
          <h3>What we do</h3>
          {FOOTER_LINKS.map((l) => <a key={l.href} href={l.href}>{l.name}</a>)}
        </div>
        <div className="fv-fcol">
          <h3>Connect</h3>
          <a href="/break-in/" style={{ color: "var(--accent)" }}>Submit Break-In</a>
          <span style={{ color: "var(--muted)", fontSize: ".82rem", display: "block", margin: "2px 0 6px" }}>
            Instrument not working? Ask a specialist, free.
          </span>
          <a href={"mailto:" + CONTACT.email}>{CONTACT.email}</a>
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
        </div>
      </div>
      <div className="fv-wrap fv-footer__bottom">
        <span>&copy; {new Date().getFullYear()} Bridges Industrial LLC. All rights reserved.</span>
        <a href="/integration/terms/" style={{ color: "var(--muted)" }}>Terms &amp; Privacy</a>
      </div>
    </footer>
  );
}
