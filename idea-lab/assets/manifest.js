/* ============================================================
   Idea Lab :: manifest.js
   All content as data. Add a wing, level, or module here and it
   appears in the nav, the star map, and the track ladders.
   Classic script. Sets a global. Works on file:// and Pages.
   ============================================================ */
window.IDEA_LAB = {
  meta: {
    name: "Idea Lab",
    tagline: "A rock can become a computer. So can your idea.",
    home: "/idea-lab/"
  },

  /* explorer ranks, climbed by XP */
  ranks: [
    { name: "Stardust", min: 0 },
    { name: "Spark",    min: 50 },
    { name: "Ember",    min: 120 },
    { name: "Nova",     min: 250 },
    { name: "Pulsar",   min: 500 },
    { name: "Quasar",   min: 1000 }
  ],

  /* the five constellations */
  wings: [
    {
      key: "foundry",
      name: "The Foundry",
      tagline: "Rock to computer.",
      icon: "\u{1FAA8}",
      color: "#ffb454",
      status: "live",
      href: "foundry/",
      blurb: "From a grain of sand to writing your own code. A full build, one rung at a time.",
      levels: [
        { key: "spark",     name: "Level 1 · Spark",     sub: "From the physical world to bits." },
        { key: "circuit",   name: "Level 2 · Circuit",   sub: "From gates to a whole computer." },
        { key: "architect", name: "Level 3 · Architect", sub: "Now you write the code." }
      ],
      modules: [
        { key: "logic-gates", level: "spark", status: "live", href: "logic-gates/", badge: "first-light",
          icon: "\u{1FAA8}", name: "Grain of Sand to Logic Gate", tagline: "Cosmic web to atom, sand to a switch, switches to gates and code." },
        { key: "binary", level: "spark", status: "live", href: "binary/", badge: "binary-coder",
          icon: "\u{1F522}", name: "Binary: count in 1s and 0s", tagline: "Flip switches to count, and spell your name in bits." },
        { key: "adder", level: "spark", status: "live", href: "adder/", badge: "adder-architect",
          icon: "➕", name: "The Adder", tagline: "Wire gates into a circuit that adds two real numbers." },
        { key: "memory", level: "spark", status: "live", href: "memory/", badge: "memory-keeper",
          icon: "\u{1F4BE}", name: "Memory", tagline: "Build a switch that remembers, the start of every computer's memory." },

        { key: "pixels", level: "circuit", status: "live", href: "pixels/", badge: "pixel-painter",
          icon: "\u{1F5BC}️", name: "Pixels", tagline: "Paint a tiny grid and see the numbers behind every color." },
        { key: "cpu", level: "circuit", status: "live", href: "cpu/", badge: "cpu-operator",
          icon: "\u{1F9E0}", name: "How a CPU Thinks", tagline: "Fetch, decode, execute. Run a tiny program by hand." },
        { key: "circuit-puzzle", level: "circuit", status: "live", href: "circuit/", badge: "circuit-builder",
          icon: "\u{1F50C}", name: "Build a Circuit", tagline: "Given gates, make the output do what the goal asks." },

        { key: "first-program", level: "architect", status: "live", href: "first-program/", badge: "first-coder",
          icon: "⌨️", name: "Your First Program", tagline: "Variables and if/else in a safe sandbox. Make the screen react." },
        { key: "loops", level: "architect", status: "live", href: "loops/", badge: "loop-master",
          icon: "\u{1F501}", name: "Loops & Patterns", tagline: "Do a lot with a little. Repeat, count, and draw." },
        { key: "mini-game", level: "architect", status: "live", href: "mini-game/", badge: "game-maker-jr",
          icon: "\u{1F3AE}", name: "Make a Tiny Game", tagline: "Put it together into a game you actually play." }
      ]
    },
    {
      key: "defense",
      name: "Defense Range",
      tagline: "Find the loophole. Close it.",
      icon: "\u{1F6E1}️",
      color: "#3ee0ff",
      status: "live",
      href: "defense/",
      blurb: "Safe, sandboxed labs from everyday basics up to a real defender's mindset.",
      levels: [
        { key: "scout",    name: "Level 1 · Scout",    sub: "The everyday basics." },
        { key: "guardian", name: "Level 2 · Guardian", sub: "How the web actually protects you." },
        { key: "defender", name: "Level 3 · Defender", sub: "Think like the good guys." }
      ],
      modules: [
        { key: "glass-door", level: "scout", status: "live", href: "glass-door/", badge: "doorkeeper",
          icon: "\u{1F6AA}", name: "The Glass Door", tagline: "Why a website can never trust your browser." },
        { key: "strong-key", level: "scout", status: "live", href: "strong-key/", badge: "keymaster",
          icon: "\u{1F511}", name: "A Key That Holds", tagline: "Make a password a guesser gives up on." },
        { key: "phishing", level: "scout", status: "live", href: "phishing/", badge: "phish-spotter",
          icon: "\u{1F3A3}", name: "Spot the Phish", tagline: "A safe inbox of fakes. Learn the tells." },
        { key: "cookies", level: "scout", status: "live", href: "cookies/", badge: "crumb-tracker",
          icon: "\u{1F36A}", name: "Cookies", tagline: "What a site can, and cannot, remember about you." },

        { key: "https", level: "guardian", status: "live", href: "https/", badge: "locksmith",
          icon: "\u{1F512}", name: "The Padlock", tagline: "How HTTPS scrambles your data so snoops see gibberish." },
        { key: "twofa", level: "guardian", status: "live", href: "twofa/", badge: "double-lock",
          icon: "\u{1F510}", name: "Two Locks", tagline: "2FA and passkeys: why a stolen password isn't enough." },
        { key: "privacy", level: "guardian", status: "live", href: "privacy/", badge: "footprint-keeper",
          icon: "\u{1F463}", name: "Your Data Footprint", tagline: "What you leave behind, and how to shrink it." },
        { key: "social-eng", level: "guardian", status: "live", href: "social-eng/", badge: "people-reader",
          icon: "\u{1F3AD}", name: "Hacking People", tagline: "The con, the urgency, the trust. Calm verification wins." },

        { key: "threat-model", level: "defender", status: "live", href: "threat-model/", badge: "blue-team",
          icon: "\u{1F6E1}️", name: "Think Like a Defender", tagline: "Threat-model a lemonade-stand site. What to lock first." },
        { key: "crypto", level: "defender", status: "live", href: "crypto/", badge: "codebreaker",
          icon: "\u{1F9E9}", name: "Secret Codes", tagline: "Make and break a cipher, then see why real crypto holds." },
        { key: "disclosure", level: "defender", status: "live", href: "disclosure/", badge: "white-hat",
          icon: "\u{1F41B}", name: "Found a Bug? Report It Right", tagline: "Responsible disclosure: finders who help, not harm." }
      ]
    },
    {
      key: "ai-wing",
      name: "AI Wing",
      tagline: "Meet the machine. Outsmart the fakes.",
      icon: "\u{1F916}",
      color: "#7c5cff",
      status: "live",
      href: "ai-wing/",
      blurb: "From what AI is and spotting fakes, up to training a tiny model of your own.",
      levels: [
        { key: "observer", name: "Level 1 · Observer", sub: "What AI is, and what's real." },
        { key: "handler",  name: "Level 2 · Handler",  sub: "Using it well." },
        { key: "builder",  name: "Level 3 · Builder",  sub: "Make one yourself." }
      ],
      modules: [
        { key: "real-or-made", level: "observer", status: "live", href: "real-or-made/", badge: "truth-checker",
          icon: "\u{1FA9E}", name: "Real or Made?", tagline: "How a model guesses, and the habit that beats a fake." },
        { key: "source-hunter", level: "observer", status: "live", href: "source-hunter/", badge: "source-sleuth",
          icon: "\u{1F9ED}", name: "Source Hunter", tagline: "Trace a rumor to its source before you believe it." },
        { key: "how-ai-guesses", level: "observer", status: "live", href: "how-ai-guesses/", badge: "pattern-pro",
          icon: "\u{1F52E}", name: "How AI Really Guesses", tagline: "Why it sounds smart but doesn't actually know." },
        { key: "bias", level: "observer", status: "live", href: "bias/", badge: "fair-mind",
          icon: "⚖️", name: "Where AI Learns", tagline: "Lopsided examples make a lopsided AI. Garbage in, garbage out." },

        { key: "prompts", level: "handler", status: "live", href: "prompts/", badge: "prompt-smith",
          icon: "\u{1F4AC}", name: "Talking to AI", tagline: "Asking better gets better answers, and where it goes wrong." },
        { key: "hallucinations", level: "handler", status: "live", href: "hallucinations/", badge: "ai-fact-checker",
          icon: "\u{1F300}", name: "When AI Makes Things Up", tagline: "Confidently wrong. Why you always check its work." },
        { key: "ai-privacy", level: "handler", status: "live", href: "ai-privacy/", badge: "secret-keeper",
          icon: "\u{1F92B}", name: "What Never to Paste", tagline: "Why secrets don't go into a stranger's machine." },
        { key: "provenance", level: "handler", status: "live", href: "provenance/", badge: "truth-tracer",
          icon: "\u{1F3F7}️", name: "Proof It's Real", tagline: "Reverse image search and Content Credentials (C2PA)." },

        { key: "train-tiny", level: "builder", status: "live", href: "train-tiny/", badge: "ai-trainer",
          icon: "\u{1F9E0}", name: "Train a Tiny AI", tagline: "Teach a browser model to tell two things apart. Watch it learn." },
        { key: "chatbot", level: "builder", status: "live", href: "chatbot/", badge: "bot-builder",
          icon: "\u{1F916}", name: "How a Chatbot Is Built", tagline: "The pieces behind the magic, in plain terms." },
        { key: "responsible", level: "builder", status: "live", href: "responsible/", badge: "ai-for-good",
          icon: "✨", name: "Use AI for Good", tagline: "Design a small AI helper. The responsible-builder checklist." }
      ]
    },
    {
      key: "mission",
      name: "Mission Control",
      tagline: "Your idea. Your map.",
      icon: "\u{1F680}",
      color: "#46e0a8",
      status: "live",
      href: "mission/",
      blurb: "Turn an idea into a real website, a flyer, and business cards. Then map how to build it."
    },
    {
      key: "starcharts",
      name: "Star Charts",
      tagline: "Jobs written in the stars.",
      icon: "✨",
      color: "#ff6ea9",
      status: "live",
      href: "starcharts/",
      blurb: "The map of where to aim, and the first step into each future job."
    }
  ],

  /* badges, awarded by labs */
  badges: [
    { id: "first-light",    name: "First Light",    icon: "\u{1F4A1}", note: "Lit your first bit from a rock." },
    { id: "rocksmith",      name: "Rocksmith",      icon: "\u{1FAA8}", note: "Refined sand into a silicon wafer." },
    { id: "gatekeeper",     name: "Gatekeeper",     icon: "\u{1F517}", note: "Built a working logic gate." },
    { id: "binary-coder",   name: "Binary Coder",   icon: "\u{1F522}", note: "Counted in 1s and 0s and built numbers from bits." },
    { id: "adder-architect", name: "Adder Architect", icon: "➕", note: "Built a half-adder that adds with logic gates." },
    { id: "memory-keeper",  name: "Memory Keeper",  icon: "\u{1F4BE}", note: "Built a circuit that remembers a bit." },
    { id: "pixel-painter",  name: "Pixel Painter",  icon: "\u{1F5BC}️", note: "Saw that pictures are just grids of numbers." },
    { id: "cpu-operator",   name: "CPU Operator",   icon: "\u{1F9E0}", note: "Ran a program through fetch, decode, execute." },
    { id: "circuit-builder", name: "Circuit Builder", icon: "\u{1F50C}", note: "Built logic circuits from gates." },
    { id: "first-coder",    name: "First Coder",    icon: "⌨️", note: "Wrote a tiny program with variables and if/else." },
    { id: "loop-master",    name: "Loop Master",    icon: "\u{1F501}", note: "Made patterns with loops." },
    { id: "game-maker-jr",  name: "Game Maker",     icon: "\u{1F3AE}", note: "Built and won a game of their own." },
    { id: "phish-spotter",  name: "Phish Spotter",  icon: "\u{1F3A3}", note: "Learned to spot a fake message." },
    { id: "crumb-tracker",  name: "Crumb Tracker",  icon: "\u{1F36A}", note: "Saw what a site can and cannot remember." },
    { id: "locksmith",      name: "Locksmith",      icon: "\u{1F512}", note: "Saw how HTTPS scrambles data from snoops." },
    { id: "double-lock",    name: "Double Lock",    icon: "\u{1F510}", note: "Stopped a stolen password with 2FA." },
    { id: "footprint-keeper", name: "Footprint Keeper", icon: "\u{1F463}", note: "Shrank a data footprint." },
    { id: "people-reader",  name: "People Reader",  icon: "\u{1F3AD}", note: "Saw through a social engineering trick." },
    { id: "blue-team",      name: "Blue Team",      icon: "\u{1F6E1}️", note: "Threat-modeled and hardened a site." },
    { id: "codebreaker",    name: "Codebreaker",    icon: "\u{1F9E9}", note: "Made and broke a secret code." },
    { id: "white-hat",      name: "White Hat",      icon: "\u{1F3A9}", note: "Chose to report a bug instead of exploit it." },
    { id: "pattern-pro",    name: "Pattern Pro",    icon: "\u{1F52E}", note: "Saw AI predict from patterns, not understanding." },
    { id: "fair-mind",      name: "Fair Mind",      icon: "⚖️", note: "Learned how lopsided data makes a biased AI." },
    { id: "prompt-smith",   name: "Prompt Smith",   icon: "\u{1F4AC}", note: "Turned a vague ask into a clear one." },
    { id: "ai-fact-checker", name: "AI Fact Checker", icon: "\u{1F300}", note: "Caught AI making things up." },
    { id: "secret-keeper",  name: "Secret Keeper",  icon: "\u{1F92B}", note: "Learned what never to paste into an AI." },
    { id: "truth-tracer",   name: "Truth Tracer",   icon: "\u{1F3F7}️", note: "Checked an image with real provenance tools." },
    { id: "ai-trainer",     name: "AI Trainer",     icon: "\u{1F9E0}", note: "Trained a tiny model from their own examples." },
    { id: "bot-builder",    name: "Bot Builder",    icon: "\u{1F916}", note: "Built a tiny chatbot and saw the trick." },
    { id: "ai-for-good",    name: "AI For Good",    icon: "✨", note: "Designed a responsible AI helper." },
    { id: "loophole-scout", name: "Loophole Scout", icon: "\u{1F50E}", note: "Saw how a page shows its own secrets." },
    { id: "doorkeeper",     name: "Doorkeeper",     icon: "\u{1F6AA}", note: "Moved the lock to the server, where it belongs." },
    { id: "pattern-spotter", name: "Pattern Spotter", icon: "\u{1F52E}", note: "Saw that AI predicts patterns, it does not know." },
    { id: "truth-checker",   name: "Truth Checker",   icon: "\u{1F575}️", note: "Learned to verify another way before trusting." },
    { id: "mission-logged",  name: "Founder",         icon: "\u{1F680}", note: "Mapped an idea from problem to launch." },
    { id: "stargazer",       name: "Stargazer",       icon: "\u{1F52D}", note: "Picked a future to aim for." },
    { id: "keymaster",       name: "Keymaster",       icon: "\u{1F510}", note: "Built a password a guesser gives up on." },
    { id: "source-sleuth",   name: "Source Sleuth",   icon: "\u{1F9ED}", note: "Traced a story back before believing it." },
    { id: "brandsmith",      name: "Brandsmith",      icon: "\u{1F3A8}", note: "Turned an idea into a website, a flyer, and cards." }
  ],

  /* future jobs, shown in Star Charts. Each points back into a live lab. */
  jobs: [
    {
      key: "chip-designer", name: "Chip Designer", icon: "\u{1F52C}",
      what: "Design the tiny switches packed inside every phone, car, and console.",
      learn: ["Electricity and logic", "Math and patterns", "How materials work"],
      tryHref: "foundry/", tryLabel: "Try the Foundry"
    },
    {
      key: "security-defender", name: "Security Defender", icon: "\u{1F6E1}️",
      what: "Find the holes before attackers do, then close them.",
      learn: ["How the web works", "Careful, curious thinking", "Reading code"],
      tryHref: "defense/", tryLabel: "Try the Defense Range"
    },
    {
      key: "ai-wrangler", name: "AI Wrangler", icon: "\u{1F916}",
      what: "Guide machines, check their work, and catch them when they are wrong.",
      learn: ["How AI guesses", "Data and patterns", "Good judgment"],
      tryHref: "ai-wing/", tryLabel: "Try the AI Wing"
    },
    {
      key: "robotics-builder", name: "Robotics Builder", icon: "\u{1F9BE}",
      what: "Make machines that move, sense, and act in the real world.",
      learn: ["Motors and sensors", "Code that controls things", "Electronics"],
      tryHref: "foundry/", tryLabel: "Start in the Foundry"
    },
    {
      key: "game-maker", name: "Game Maker", icon: "\u{1F3AE}",
      what: "Build worlds and toys people cannot put down.",
      learn: ["Code", "Art and sound", "Stories and rules"],
      tryHref: "mission/", tryLabel: "Map it in Mission Control"
    },
    {
      key: "founder", name: "Founder", icon: "\u{1F680}",
      what: "Turn an idea into something real that helps people.",
      learn: ["Spotting real problems", "Money basics", "Telling your story"],
      tryHref: "mission/", tryLabel: "Open Mission Control"
    }
  ]
};
