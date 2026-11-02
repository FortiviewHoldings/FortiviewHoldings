// The PragOptics platform this site posts into: its environment, the lane, and the module install each
// form writes. Every form has its OWN install and its OWN table in the environment, so each kind of
// message is read, mailed and handled on its own:
//   Submit a Break-In  -> install 6e1d99e5c54888d6 -> table breakins
//   Work with us       -> install ee7c0bfaf726bbec -> table contacts   (the contact form)
//   Become a Partner   -> install 5f30a9de0d5d6099 -> table partners
//   Reviews            -> install 458b88e1caad1c6a -> table reviews    (moderated: a new review shows once approved)
// The ids are the installs' own (PragOptics -> the environment -> Modules). A form whose intake key has no
// install here falls back to composing an email, as before.
export const PLATFORM = {
  api: "https://api.pragoptics.com/api/v1",
  env: "7a677248-2920-4aee-9bde-dab0782e0439",
  lane: "live",
  installs: {
    "break-in": "6e1d99e5c54888d6",
    contact: "ee7c0bfaf726bbec",
    partner: "5f30a9de0d5d6099",
    reviews: "458b88e1caad1c6a"
  }
};
