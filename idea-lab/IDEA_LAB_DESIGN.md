# Idea Lab

> A cosmic academy where a kid walks in holding a rock and walks out having built with it.

Built into the Fortiview Holdings front end as a self-contained subsystem under `/idea-lab/`.
Free. No accounts. No servers in the loop. Pure front end. Real facts.

---

## 1. North star

Everything real is made of the same stuff, repeating at every scale. A grain of sand becomes
silicon becomes a switch becomes a bit becomes a thought you are reading right now. The solar
system and the atom rhyme. The golden ratio shows up in a nautilus, a galaxy, and the helix on
this company's own loader.

The Idea Lab teaches a kid to notice that pattern, and then to build with it on purpose. That is
the entire pitch. Wonder first, skill second, both true.

Coding and electronics are foundational literacy now, the way reading and arithmetic were.
A child who learns to build with the planet's own materials is not learning a hobby. They are
learning the language the next century is written in. This is for kids everywhere, not just kids
with money, which is why it is free and asks for nothing.

## 2. Who it is for

- Ages roughly 6 through the teens. Readable by a six year old with a grownup nearby, deep enough
  to hold a fifteen year old.
- Tone: an RPG, not a textbook. Short words. Big visuals. You *do* the thing, then a sentence tells
  you what you just did. Never a wall of text.
- Global audience. Plain language, no slang that ages out, no local assumptions.

## 3. Hard rules (non negotiable)

These are constraints, not suggestions. Every screen obeys them.

| Rule | What it means |
| --- | --- |
| Free | No price, no paywall, no tier gate, ever. |
| No accounts | No sign up, no login, no email, no name required. |
| No social | No messaging, no profiles, no sharing between kids, no comments. |
| Client only | No data ever leaves the browser. No analytics on children. |
| Local storage | Progress lives in `localStorage` (longest local preservation) and `sessionStorage`. |
| Honest disclosure | A clear, always reachable note: progress is local only, can vanish, nothing is saved on a server. "No saved progress at this time." |
| Factual | No invented threats, no scare myths, no folklore. Every claim is checkable. |
| Responsible | We teach attack classes that are already public and already defended. We never publish a novel hole or a working weapon. |
| Kid safe | Browser manipulation labs run inside a sandboxed iframe on a fake target. Nothing a kid does can reach a real site. |
| No build step | Hand authored HTML, CSS, and classic JS. Opens by double click and on GitHub Pages alike. |

## 4. The cosmic RPG shell

A light game layer wraps every wing so learning feels like progress, not homework.

- **Explorer rank** earned by XP: Stardust, Spark, Ember, Nova, Pulsar, Quasar.
- **Badges** for finishing labs, e.g. *First Light*, *Rocksmith*, *Loophole Scout*.
- **Star Map** is the home hub: each wing is a constellation node you fly to.
- Progress is stored locally and shown with pride, with the honest disclosure that it is local only.

No timers, no streaks, no loss aversion, no dark patterns. A kid can wander. Nothing punishes them.

## 5. The five wings

Each wing is a constellation on the star map. Content inside a wing is data, not new code, so the
wing grows by adding entries to a manifest.

### Wing 1: The Foundry  *(rock to computer)*
The foundational science. What is real, and how a planet's plain elements become a computer.
- *Grain of Sand to Logic Gate* (flagship, built first): zoom from galaxy to a silicon atom, refine
  sand into a wafer, build a switch, wire a logic gate, light the first bit.
- Piezoelectricity: squeeze a quartz crystal (also silicon dioxide) and make a spark.
- Doping, transistors, what a bit really is.
- Chemistry of the everyday: what glass, sand, and a chip share.

### Wing 2: The Defense Range  *(cybersecurity, hands on, safe)*
How attackers find loopholes and how defenders close them, using only public, well understood
classes. Every lab runs against a fake target in a sandboxed iframe.
- Passwords: why length beats symbols, watch a weak one fall and a strong one hold.
- Phishing: spot the fake login, learn the three tells.
- "Inspect element is not hacking": why the browser trusts you on your own screen, and why a real
  server must never trust the screen. The single most important security idea, taught with a toy.
- Cookies and local storage: what a site can and cannot remember about you.
- Each lab ends with the fix, named and real (OWASP grade concepts, kid scaled).

### Wing 3: The AI Wing  *(the machine, and the fakes)*
What AI actually is, and the real defenses people use today. Factual and current.
- "It is words and math": a plain look at what a model is and is not.
- Deepfakes and synthetic media: how to check before you believe, real verification habits.
- Misinformation at scale: provenance, sources, slowing down.
- Prompt manipulation, framed as "why you do not paste secrets into a stranger's machine."
- Always the defense that exists right now, never a hypothetical.

### Wing 4: Mission Control  *(your idea, made real)*
The reformed entrepreneur piece, now a hands-on **Studio** that turns a kid's idea into real,
printable artifacts, all client-side. Two tabs:
- **Studio:** a brand form (name, tagline, what it does, who it helps, button text, maker, a logo
  emoji, a color theme) drives a **live website preview** in a device frame. From there the kid can
  open the site full screen, **download it as a real `.html` file** (the shell website), and **print
  a flyer** or a **sheet of business cards** to PDF. Real utilities, made in the browser.
- **Plan:** the quest map. A six-stage path from "spot the problem" to "tell the world," saved locally.
- Everything saved to `localStorage` only, with the honest disclosure. No invoices, no upsell.

### Wing 5: Star Charts  *(jobs written in the stars)*
Selected future jobs as constellations. Each node answers three things plainly: what it is, what to
learn, and one lab or game that lets you taste it.
- Examples: chip designer, security defender, robotics builder, AI wrangler, materials scientist,
  game maker. Each points back into the wings above.
- The message: here is the map of where to aim, and the first step is a click away.

## 6. Architecture

The opposite of the rest of the site today, on purpose. One shared stylesheet, one shared shell
script, and content as data. This subsystem is the worked example of the efficiency lesson.

```
/idea-lab/
  index.html                 the Star Map hub
  IDEA_LAB_DESIGN.md          this document
  assets/
    cosmos.css               one theme, built on the site's existing tokens
    shell.js                 starfield, progress store, global nav, disclosure
    manifest.js              all wings, labs, jobs, and badges as data
  foundry/
    index.html               flagship lab: Grain of Sand to Logic Gate
  (defense/, ai-wing/, mission/, starcharts/ follow the same shape)
```

Principles:
- **One nav object.** The top navigation is built once in `shell.js` from the manifest. Add a wing
  to the data, it appears everywhere. This is the fix for the copy pasted dropdown, demonstrated.
- **Classic scripts, global objects.** No ES modules, no fetch for local JSON, no bundler. It runs
  by double clicking a file and on GitHub Pages without change.
- **Content is data.** A new lab is a manifest entry plus one page, never a change to the shell.
- **Accessible and kind.** Keyboard reachable, `prefers-reduced-motion` honored, mobile first,
  high contrast, large tap targets for small hands.

## 7. Truth and safety model

- **Citation register.** Every factual claim and every attack class gets a source, gathered in a
  citation pass at the end of the project, not as running noise. Tracked in `CITATIONS.md` (added
  when the science and security content lands).
- **Responsible disclosure.** Only attack classes that are already public knowledge and already
  defended. No zero days, no novel techniques, no working malware, no evasion tradecraft. If a thing
  cannot be shown safely and truthfully to a child, it does not go in.
- **No misinformation.** If we are not sure it is true, it does not ship. Simplified is fine.
  False is not.
- **Sandboxed labs.** Browser manipulation happens inside `<iframe sandbox>` against a fake page
  bundled with the lab. A kid can never point a lab at a real site.

## 8. What this replaces

The old youth business program is removed and its idea is reborn here, free.

- Remove pages: `YouthBusinessEducationSandbox/`, `TierBreakdown/`, `ParentLegalGuide/`.
- Rewire references in 13 files: the services dropdown (copied into every page), the homepage
  services card, and the sitemap. The dropdown slot "Youth Entrepreneur Education" becomes
  "Idea Lab" pointing at `/idea-lab/`.
- The parent facing material is not lost. A short, honest "for grownups and teachers" panel lives
  inside the Idea Lab itself (no accounts, no data, what we teach, how to help), replacing the old
  parent legal guide with something that fits a free tool.

This is staged so nothing breaks: the Idea Lab is built and reviewable first, then the swap happens
in one clean pass.

## 9. Monetization hooks (kept open, never on the backs of kids)

The product stays free for children. You mentioned an idea; drop it in and we will shape the build
around it. Options the architecture leaves open without ever gating a kid:

- Sponsored "lab packs" credited quietly, content stays free.
- School and teacher licensing for dashboards and classroom tools, the kid facing lab stays free.
- An optional future sync to a container app and table storage for saved progress across devices,
  offered, never required.
- Talent and scholarship pipelines, where partners fund the lab in exchange for reach, not for gates.

Nothing above is built yet. The free core comes first and stands on its own.

## 10. Roadmap

- [x] Recon: map the site, the live endpoints, the kill list, the theme.
- [x] Design locked (this document).
- [x] Foundation: `cosmos.css`, `shell.js`, `manifest.js`, the Star Map hub.
- [x] Flagship lab: Grain of Sand to Logic Gate (the Foundry).
- [x] Defense Range wing live, with its flagship lab: The Glass Door (client-side trust, safe sandbox).
- [x] AI Wing live, with its flagship lab: Real or Made? (how a model guesses, deepfakes, verify-another-way).
- [x] Mission Control live: name an idea, walk a six-stage quest map, saved locally (the reformed sandbox).
- [x] Star Charts live: six future-job constellations, each pointing into a live lab.
- [x] ALL FIVE WINGS OPEN on the Star Map.
- [x] Defense Range second lab: A Key That Holds (honest password strength, length over squiggles).
- [x] AI Wing second lab: Source Hunter (provenance, trace a rumor to its source).
- [ ] Swap pass: remove the old youth pages, rewire the 13 references, update the sitemap (pending owner go-ahead).
- [x] Mission Control upgraded to a Studio: idea -> live website preview, downloadable .html, printable
      flyer (PDF) and business cards (PDF). Quest map kept as the Plan tab.
- [ ] Global nav refactor offered to the rest of the site (the dropdown becomes one object site wide).
- [ ] Citation pass and `CITATIONS.md` (the dedicated final step).

## 11. Open questions for you

Small ones. Everything is built to be easy to change.

1. Your monetization idea, when you are ready, so the hooks fit it.
2. Route name confirmed as `/idea-lab/` (clean and modern), or do you want it Pascal like the
   neighbors (`/IdeaLab/`)?
3. After you test the flagship, which wing do I build next: Defense Range (the hacking labs) or
   the Foundry's piezo and transistor follow ups?
