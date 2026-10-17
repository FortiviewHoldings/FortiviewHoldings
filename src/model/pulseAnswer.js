import { buildIndex, search } from "../search/index.js";
import { GUIDES } from "../data/guides.js";
import { MODEL } from "./config.js";
import { TOOL_DECLARATIONS, runTool } from "../pulse/tools.js";

// Pulse's brain: retrieve the relevant guide sections, then answer with the
// calculators available so it computes with real math. One worker round-trip
// per tool call, capped so it always terminates.
const index = buildIndex(GUIDES);

const SYSTEM =
  "You are Pulse, the field-reference assistant for Bridges Industrial, an " +
  "industrial instrumentation and automation consultancy. Talk like an " +
  "experienced instrument tech: concise, plain, practical. You cover field " +
  "instrumentation, calibration, control, and industrial measurement; if a " +
  "question is outside that world, say it is not your area. " +

  "Answer in tiers. " +
  "(1) General concepts and definitions — what a transmitter is, what 4-20 mA " +
  "means, how a device works — just explain them clearly from what you know. " +
  "The guide excerpts below are supporting context, not a cage: lean on them " +
  "when they fit, ignore them when they do not. " +
  "(2) Anything with arithmetic — error, scaling, flow, resistance, base " +
  "conversion — USE THE CALCULATORS, never do the math in your head, and report " +
  "exactly the numbers the tool returns. Units matter: a loop current in mA and " +
  "a process value in engineering units are NOT the same number. For the " +
  "accuracy or error of a 4-20 mA transmitter given an applied engineering value " +
  "and a measured mA, call transmitter_error with the range, applied_eu, and " +
  "measured_ma — do not convert by hand and do not pass mA and engineering units " +
  "into calibration_error together. " +
  "For differential-pressure and flow-meter flow (venturi, orifice, nozzle, " +
  "pitot, annubar, cone, wedge, and the rest) call solve_flow and report exactly " +
  "what it returns; never estimate a flow rate. Line pressure is almost always " +
  "read on a gauge, so confirm gauge versus absolute before you trust the number, " +
  "and confirm the gas if it is not air. solve_flow tells you which inputs it " +
  "left at a demonstration default; say plainly what you assumed (k factor, line " +
  "pressure, temperature, molar mass) instead of passing an assumed value off as " +
  "fact. For a full working session with the live curve, a results table, and a " +
  "printable spec sheet, point the user to the Flow Calculator reference page at " +
  "/education/flow-calculator/. " +
  "For a multi-point loop calibration or an As-Found / As-Left worksheet, use " +
  "solve_calibration. Collect every required input from the user before you call " +
  "it: the input range and units you apply, the output range and units you " +
  "measure, the tolerance in percent of span, and the As-Found reading at each " +
  "test point, plus the As-Left reading if the device was adjusted. You may " +
  "suggest a common value such as a 4 to 20 mA output or a half percent tolerance, " +
  "but confirm it with the user; never assume one silently, and do not compute " +
  "until every value is captured. After the result, tell the user they can open " +
  "the Calibration worksheet at /education/calibration/ to print a clean report. " +
  "More generally, never fill a measurement, range, pressure, temperature or " +
  "tolerance with an assumed value to get a number out; if a required input is " +
  "missing, ask for it. " +
  "(3) A specific plant problem you cannot resolve from concepts or the guides, " +
  "or anything that needs a human to look at the actual setup — point them to a " +
  "Break-In. Do not reach for Break-In on a question you can simply answer. " +

  "When a guide excerpt carries the answer, name the guide. Never mention the " +
  "calculators or tools by name — just give the numbers. Never invent part " +
  "numbers, model specifics, or figures; if you are not sure of an exact spec, " +
  "say so instead of guessing. " +
  "Write plain prose — no Markdown and no LaTeX: no asterisks for emphasis, no " +
  "headings, no dollar-sign math, no backslash commands. If a formula helps, " +
  "write it inline in plain text, like: error % of span = (actual − ideal) ÷ " +
  "span × 100. Refer to a guide by its name, never as a bracketed number.";

export function relevantSections(question, k = 5) {
  return search(index, question, k);
}

// Show only guide links close to the best match, so a plain concept answer does
// not trail three barely-related sections. The model still sees every hit as
// context; this only trims what we surface as sources.
function trimSources(hits) {
  if (hits.length < 2) return hits;
  const top = hits[0].score || 0;
  return hits.filter((h) => h.score >= top * 0.4).slice(0, 4);
}

// The model sometimes formats with Markdown or LaTeX, but the chat renders
// plain text — so convert it to something readable instead of showing raw
// $$\frac. Order matters: resolve \text and symbols before \frac, and \frac
// before the catch-all backslash strip.
function toPlainText(s) {
  return String(s || "")
    .replace(/\\times/g, "×").replace(/\\cdot/g, "·").replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±").replace(/\\leq?/g, "≤").replace(/\\geq?/g, "≥")
    .replace(/\\approx/g, "≈").replace(/\\Delta/g, "Δ").replace(/\\%/g, "%")
    .replace(/\\(?:text|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1) / ($2)")
    .replace(/\\[,;:!]/g, " ").replace(/\\\\/g, " ")
    .replace(/\\([a-zA-Z]+)/g, "$1")
    .replace(/\${1,2}/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]*\[\d+\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// `prompt` is sent too so a not-yet-upgraded worker (which only reads prompt)
// still answers — just without the calculators. The upgraded worker prefers
// `contents` + `tools`.
async function callProxy(contents, prompt) {
  const body = JSON.stringify({ system: SYSTEM, prompt, contents, tools: TOOL_DECLARATIONS });
  // Flash-Lite intermittently returns 503/429 under load; ride through it.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(MODEL.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    if (res.ok) return res.json();
    if ((res.status === 503 || res.status === 429) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
      continue;
    }
    throw new Error("Pulse is busy right now — give it a second and try again.");
  }
}

export async function pulseAnswer(question) {
  const hits = relevantSections(question);
  const sources = trimSources(hits);
  const context = hits.length
    ? hits.map((h, i) => `[${i + 1}] ${h.guide} — ${h.question}\n${h.snippet}`).join("\n\n")
    : "(no matching guide excerpts)";

  if (!MODEL.proxyUrl) {
    return {
      text: "Pulse needs its API key set to answer. Search still works.",
      provider: "none",
      sources
    };
  }

  const ragPrompt = `Guide excerpts (may or may not be relevant):\n\n${context}\n\nQuestion: ${question}`;
  const contents = [{ role: "user", parts: [{ text: ragPrompt }] }];

  for (let step = 0; step < 4; step++) {
    const res = await callProxy(contents, ragPrompt);

    // An older proxy returns only { text } — no tool support. Use it directly.
    if (!res.content) {
      return { text: toPlainText(res.text), provider: "api", sources };
    }

    contents.push(res.content); // the model's turn

    if (res.functionCall) {
      const result = runTool(res.functionCall.name, res.functionCall.args);
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: res.functionCall.name, response: { result } } }]
      });
      continue; // let the model read the result and reply
    }

    return { text: res.text || "", provider: "api", sources };
  }

  return { text: "That took too many steps — try rephrasing.", provider: "api", sources };
}
