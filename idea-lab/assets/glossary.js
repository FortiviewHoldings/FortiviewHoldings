/* ============================================================
   Idea Lab :: glossary.js
   Verified term definitions (see CONTENT_PACK.md for the full
   fact-check + sources). Any element with data-term="<slug>"
   opens its card. Keep it true: simplified is fine, false is not.
   ============================================================ */
window.IDEA_LAB_GLOSSARY = {
  /* ---------- The Foundry ---------- */
  silica: {
    term: "Silica (silicon dioxide, SiO₂)",
    short: "The hard, glassy stuff most sand is made of: silicon and oxygen joined together.",
    deep: "Silica is one silicon atom bonded to two oxygen atoms (SiO₂), repeated in a giant network. It is one of the most common compounds in Earth's crust and the main ingredient in quartz sand, glass, and quartz crystals. Because the silicon is locked to oxygen, silica can't be used in electronics as-is. The oxygen has to be removed first to get pure silicon, the shiny grey semiconductor that chips are made from.",
    source: "https://en.wikipedia.org/wiki/Silicon_dioxide"
  },
  quartz: {
    term: "Quartz",
    short: "A hard, see-through crystal that is just silica grown into a neat, repeating pattern.",
    deep: "Quartz is the crystalline form of silica (SiO₂) and one of Earth's most abundant minerals. Its atoms line up in an orderly 3D pattern, giving crystals their flat faces and points. Melt it and cool it without that order and you get glass; weather it into grains and you get much of the world's sand. Quartz is also piezoelectric.",
    source: "https://en.wikipedia.org/wiki/Quartz"
  },
  silicon: {
    term: "Silicon",
    short: "A shiny grey material we pull out of sand and use to make computer chips.",
    deep: "Silicon is chemical element number 14. In nature it is almost always combined with oxygen as silica, not found pure. Strip the oxygen away in a furnace and you get solid silicon, a brittle grey semiconductor. That semiconductor property is exactly why it is the heart of every transistor and chip. Pure silicon is not the same as silica or quartz, which still contain oxygen.",
    source: "https://en.wikipedia.org/wiki/Silicon"
  },
  semiconductor: {
    term: "Semiconductor",
    short: "A material that can be switched between letting electricity flow and blocking it.",
    deep: "A semiconductor conducts better than an insulator (like glass) but worse than a metal (like copper), and its conductivity can be changed on demand. Silicon is the most common one. By doping it with tiny amounts of other elements and applying voltages, engineers make it switch current on or off, the basis of every transistor and chip.",
    source: "https://en.wikipedia.org/wiki/Semiconductor"
  },
  doping: {
    term: "Doping",
    short: "Mixing in a tiny pinch of another element so silicon carries electricity the way we want.",
    deep: "Doping means deliberately adding a very small impurity, such as phosphorus or boron, to pure silicon to control how it conducts. Phosphorus adds spare electrons (n-type); boron makes 'holes' where electrons are missing (p-type). The amounts are astonishingly small, often about one dopant atom per ten million silicon atoms, yet this is what lets a transistor switch.",
    source: "https://en.wikipedia.org/wiki/Doping_(semiconductor)"
  },
  wafer: {
    term: "Wafer",
    short: "A thin, round slice of silicon crystal that chips are built on, like a flat cracker for circuits.",
    deep: "A wafer is a thin, polished disc cut from a single large silicon crystal (an ingot). Thousands of identical chips are built across one wafer at the same time using many print-and-etch steps, then the wafer is cut into individual chips. Modern wafers reach about 300 mm (12 inches) across.",
    source: "https://en.wikipedia.org/wiki/Wafer_(electronics)"
  },
  transistor: {
    term: "Transistor",
    short: "A tiny electric switch with no moving parts: a small voltage turns a bigger flow on or off.",
    deep: "A transistor switches or amplifies electric signals. In the common MOSFET type, a voltage on the 'gate' forms or removes a conducting channel, controlling a larger current, without the gate itself drawing current. Because it switches by electric field and not by moving parts, it can flip billions of times per second, and a single chip holds billions of them.",
    source: "https://en.wikipedia.org/wiki/Transistor"
  },
  "logic-gate": {
    term: "Logic gate",
    short: "A tiny circuit that takes on/off inputs and follows a rule to decide its on/off output.",
    deep: "A logic gate, built from a few transistors, performs one basic operation on binary inputs. AND outputs 1 only when both inputs are 1; OR outputs 1 when at least one is. NAND and NOR are their opposites, and XOR outputs 1 when the inputs differ. Combine many gates and a computer can do arithmetic, make decisions, and store information.",
    source: "https://en.wikipedia.org/wiki/Logic_gate"
  },
  bit: {
    term: "Bit",
    short: "The smallest piece of computer information: a single on/off, 1 or 0.",
    deep: "A bit (short for 'binary digit') has only two values, 0 or 1. Inside a chip a bit is a voltage being high or low, a switch on or off. Group bits and you represent bigger things: 8 bits make a byte, which can stand for a letter, a small number, or part of a color.",
    source: "https://en.wikipedia.org/wiki/Bit"
  },
  piezoelectricity: {
    term: "Piezoelectricity",
    short: "Squeezing certain crystals like quartz makes a jolt of electricity, and electricity makes them squeeze back.",
    deep: "Squeezing a piezoelectric crystal shifts its positive and negative charges slightly out of balance, creating a voltage; applying a voltage makes it flex. Quartz (which is also silicon dioxide) is a classic example. This effect powers spark lighters, the precise timing 'tick' in quartz watches, and ultrasound and sonar.",
    source: "https://en.wikipedia.org/wiki/Piezoelectricity"
  },

  /* ---------- The Defense Range ---------- */
  "client-server": {
    term: "Client-side vs server-side check",
    short: "A client-side check happens on your computer where you can change it; a server-side check happens on the website's computer where you can't.",
    deep: "Browser code (JavaScript) is fully visible and editable by the visitor, so any rule it enforces can be bypassed by editing the page or sending requests directly. Server-side checks run on the website's own machine, out of reach. They are the only checks that can actually keep someone out, so the real decision must always be repeated on the server.",
    source: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html"
  },
  "inspect-element": {
    term: "Inspect Element / Dev Tools",
    short: "A built-in browser window that lets you see and temporarily change the real code of any page on your own screen.",
    deep: "Right-click and choose Inspect and the browser reveals a page's HTML, CSS, and JavaScript and lets you edit them live. Those edits only affect your copy of the page and vanish when you reload, because the change never reaches the website's server. This is exactly why anything the browser shows you, you can read and change, and why a site can never trust what the browser sends back.",
    source: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools"
  },
  "brute-force": {
    term: "Brute-force guessing",
    short: "An attack that tries every possible password one after another until one works.",
    deep: "A brute-force attack systematically tests every combination of characters, so its time grows extremely fast as a password gets longer. It is guaranteed to work eventually in theory, but for a long, unpredictable password the number of combinations is so huge it would take far longer than is practical.",
    source: "https://owasp.org/www-community/attacks/Brute_force_attack"
  },
  "dictionary-attack": {
    term: "Dictionary attack",
    short: "A smarter guessing attack that tries common words, leaked passwords, and predictable patterns first.",
    deep: "Instead of every random combination, a dictionary attack uses a prepared wordlist (real words, names, leaked passwords, common patterns) plus rules like adding 123 or swapping letters for look-alikes (p@ssw0rd). It fails when the password is something a wordlist would never contain: random characters, or unrelated words that aren't a real word, name, leak, or pattern. The real key is being unpredictable, not just long.",
    source: "https://owasp.org/www-project-automated-threats-to-web-applications/"
  },
  entropy: {
    term: "Password length and entropy",
    short: "Entropy measures how unpredictable a password is; each random character multiplies the guesses needed, so length beats squiggles.",
    deep: "Entropy is roughly the bits of randomness in a password, from how many characters could appear and how long it is. Because length is an exponent, adding characters beats adding complexity. Important catch: the math assumes the password is truly random, so a long but predictable password (a common word or pattern) has far less real entropy than it looks. NIST now recommends length over forced complexity.",
    source: "https://pages.nist.gov/800-63-4/sp800-63b.html"
  },
  passphrase: {
    term: "Passphrase",
    short: "A password made of several random words strung together: long, hard to guess, easy to remember.",
    deep: "A passphrase chains unrelated words (for example river-purple-engine-cloud) to gain length and unpredictability without being hard to recall. The words must be chosen randomly, not a famous quote, or a dictionary attack can target it. NIST encourages long memorized secrets, allows spaces, and supports lengths of at least 64 characters.",
    source: "https://pages.nist.gov/800-63-4/sp800-63b.html"
  },
  "password-manager": {
    term: "Password manager",
    short: "An app that makes, remembers, and fills a different long password for every site.",
    deep: "A password manager generates long random passwords, stores them encrypted, and autofills them, so you only memorize one master password. Because it remembers the rest, every account can be unique and strong, so one leaked site does not endanger the others. It is the practical way to follow the rule of a different strong password everywhere.",
    source: "https://pages.nist.gov/800-63-4/sp800-63b.html"
  },
  hashing: {
    term: "Hashing",
    short: "A one-way scramble that turns a password into a jumble that can't be un-scrambled.",
    deep: "A hash function turns a password into a fixed-length value that cannot be reversed, so a site stores the hash and compares hashes instead of keeping your real password. Good practice adds a unique random salt to each one and uses a deliberately slow function (bcrypt, scrypt, Argon2, PBKDF2) so attackers can't test guesses quickly.",
    source: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"
  },
  phishing: {
    term: "Phishing",
    short: "A trick where a fake message or website pretends to be someone you trust to steal your password.",
    deep: "Phishing is social engineering: attackers send emails, texts, or messages that look like they come from a trusted person or company to get you to click a harmful link or hand over your login. A common version sends you to an imposter login page that captures what you type. No password strength helps, because you give the secret away; the defenses are recognizing fakes and using phishing-resistant multi-factor login.",
    source: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing"
  }
};
