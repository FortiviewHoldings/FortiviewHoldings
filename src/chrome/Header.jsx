import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV, CONTACT } from "../site.js";

function Brand() {
  return (
    <NavLink className="fv-brand" to="/">
      <span className="fv-brand__mark fv-brand__mark--plain" style={{ backgroundImage: "url(/images/Logo.png)" }} />
      <span className="fv-brand__name">Bridges <span>Industrial</span></span>
    </NavLink>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  const link = (klass) => NAV.map((n) => (
    <NavLink
      key={n.href}
      to={n.href}
      className={({ isActive }) => klass + (isActive ? " is-active" : "")}
      onClick={() => setOpen(false)}
    >
      {n.name}
    </NavLink>
  ));

  return (
    <header className={"fv-header" + (open ? " open" : "")}>
      <div className="fv-wrap fv-nav">
        <Brand />
        <nav className="fv-links" aria-label="Primary">
          {link("fv-link")}
          <a className="btn btn--primary btn--sm" href={CONTACT.work}>Work with us</a>
        </nav>
        <button
          className="fv-burger"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="fv-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
      <div className="fv-mobile" id="fv-mobile-menu">
        {link("")}
        <a className="btn btn--primary" href={CONTACT.work}>Work with us</a>
      </div>
    </header>
  );
}
