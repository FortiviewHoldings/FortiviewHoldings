// Shared site config. One place the chrome and pages read from.

export const CONTACT = {
  email: "support@bridgesindust.com",
  phone: "+1 (832) 425-0421",
  phoneHref: "tel:+18324250421",
  work: "/contact/?topic=work-with-us"
};

// `static: true` links to a page served outside the React app (a full load),
// not a React route.
export const NAV = [
  { href: "/industrial", name: "Industrial Automation" },
  { href: "/partnerships", name: "Partnerships" },
  { href: "/integration", name: "PragOptics" },
  { href: "/idea-lab/", name: "Idea Lab", static: true }
];

export const FOOTER_LINKS = [
  { href: "/instrument-support", name: "Instrument Technical Support" },
  { href: "/industrial", name: "Industrial Automation & Training" },
  { href: "/education", name: "Field Pocket Guide" },
  { href: "/partnerships", name: "Partnerships" },
  { href: "/integration", name: "PragOptics" },
  { href: "/idea-lab", name: "Idea Lab" }
];
