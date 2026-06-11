# Idea Lab — Curriculum

The three academy wings are tracks now, not single labs. Each is weeks of modules that build on each
other, from "I just touched a rock" to "I just wrote a program / defended a site / trained a model."
Three levels per track. Every module is one interactive lab in the style already built. Modules marked
**live** exist today; the rest are **charting** (designed, queued to build).

Pacing idea: a level is roughly a week or two of curious afternoons. A kid can wander, but the ladder
shows a clear path and a clear "next up." Nothing is hard-locked.

---

## 🪨 The Foundry — *rock to computer, then you write the code*

**Level 1 · Spark** — from the physical world to bits
- **Grain of Sand to Logic Gate** *(live)* — cosmic web to atom, refine sand, build a switch, wire AND/OR/NAND/NOR/XOR, see them as code.
- **Binary: count in 1s and 0s** — flip switches to count; why 8 bits make a byte; spell your initial in binary.
- **The Adder: add numbers with gates** — wire an XOR + AND into a half-adder, then add two real numbers the way a chip does.
- **Memory: a switch that remembers** — build a latch; the moment a circuit can *hold* a bit is the moment it can remember.

**Level 2 · Circuit** — from gates to a whole computer
- **Pixels: pictures made of bits** — paint a tiny grid, watch the numbers behind each color; how an image is just data.
- **How a CPU thinks** — fetch, decode, execute on a toy machine; run a 3-instruction "program" by hand.
- **Build a circuit** — open-ended puzzle: given gates, make the output do what the goal asks.

**Level 3 · Architect** — now *you* write it
- **Your first program** — a tiny safe in-browser sandbox: variables and if/else, make the screen react.
- **Loops & patterns** — repeat, count, and draw with a few lines; the "aha" of doing a lot with a little.
- **Make a tiny game** — combine it all into a guess-the-number or dodge game they actually play.

*Ceiling:* understands how a computer works from the atom up, and can write small real programs.

---

## 🛡️ The Defense Range — *security literacy to junior defender*

**Level 1 · Scout** — the everyday basics
- **The Glass Door** *(live)* — why a website can never trust your browser (client-side vs server-side).
- **A Key That Holds** *(live)* — why length beats squiggles, and why common words fall instantly.
- **Spot the Phish** — a safe inbox of real-looking messages; learn the tells and the one rule (check another way).
- **Cookies: what a site remembers** — see your own (fake) cookies; what sites can and cannot know about you.

**Level 2 · Guardian** — how the web actually protects you
- **The Padlock** — what HTTPS does: scramble it so snoops on the wifi see gibberish; why the lock matters.
- **Two Locks** — 2FA and passkeys; why a stolen password isn't enough when a second lock exists.
- **Your Data Footprint** — what you leave behind online and how to shrink it; privacy as a habit.
- **Hacking People** — social engineering: the con, the urgency, the trust; the strongest lock is a calm "let me verify."

**Level 3 · Defender** — think like the good guys
- **Think Like a Defender** — threat-model a kid's lemonade-stand website: what could go wrong, what to lock first.
- **Secret Codes** — make and break a Caesar cipher by hand, then see why real encryption is unbreakable by guessing.
- **Found a Bug? Report It Right** — responsible disclosure and bug bounties: finders who help instead of harm.

*Ceiling:* real security literacy, a defender's mindset, and a feel for how encryption works. No exploitation.

---

## 🤖 The AI Wing — *AI literacy to responsible builder*

**Level 1 · Observer** — what AI is, and what's real
- **Real or Made?** *(live)* — how a model guesses, why fakes fool your eyes, and the habit that beats them.
- **Source Hunter** *(live)* — trace a rumor back to its source before you believe or share it.
- **How AI Really Guesses** — go deeper than the next-word toy: patterns, training, why it sounds smart but doesn't *know*.
- **Where AI Learns** — data and bias; if the examples are lopsided, the AI is too; garbage in, garbage out.

**Level 2 · Handler** — using it well
- **Talking to AI** — prompts: how asking better gets better answers, and where AI quietly goes wrong.
- **When AI Makes Things Up** — hallucinations; AI states wrong things confidently, so you always check its work.
- **What Never to Paste** — privacy: why you don't hand secrets, passwords, or other people's info to a machine.
- **Proof It's Real** — content provenance: reverse image search and Content Credentials (C2PA) for the photo age.

**Level 3 · Builder** — make one yourself
- **Train a Tiny AI** — teach an in-browser model to tell two things apart with your own examples; watch it learn.
- **How a Chatbot Is Built** — the pieces behind a chatbot, in plain terms; demystify the magic.
- **Use AI for Good (capstone)** — design a small AI helper for a real problem; the responsible-builder checklist.

*Ceiling:* genuine AI literacy, safe-use habits, and a hands-on feel for training and building.

---

## How it's wired

- The manifest (`assets/manifest.js`) carries each wing's `levels` and ordered `modules`. Adding a
  module is data plus one page, never a change to the shell.
- The wing hub renders the ladder grouped by level, marks completed modules (by the badge each one
  awards), and highlights the **next up** live module. Progress is local-only, same honest disclosure.
- Every new module gets the same treatment as the originals: interactive, factual, sourced in
  `CONTENT_PACK.md`, and a citation pass before it ships near a kid.

## Build order (proposed)

Top-down by level, so a kid always has a complete next rung: finish **Foundry Level 1** (Binary,
Adder, Memory), then **Defense Level 1** (Phish, Cookies), then **AI Level 1** (How AI Guesses, Bias),
then climb to Level 2 across all three, then Level 3. Content for each batch can be generated and
fact-checked in an ultracode pass, then hand-built into modules and verified in the browser.
