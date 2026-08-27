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
  "industrial instrumentation consultancy. Answer from the provided guide " +
  "excerpts for facts, and USE THE CALCULATORS for any arithmetic — 4-20 mA " +
  "scaling, DP/square-root flow, calibration error, number-base conversion, RTD " +
  "resistance — never compute those in your head. Be concise and practical for a " +
  "technician. Point to the guide by name when you use it. If the excerpts do " +
  "not cover the question and no calculator applies, say so plainly and suggest " +
  "submitting a Break-In. Never invent part numbers or figures.";

export function relevantSections(question, k = 5) {
  return search(index, question, k);
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
  const context = hits.length
    ? hits.map((h, i) => `[${i + 1}] ${h.guide} — ${h.question}\n${h.snippet}`).join("\n\n")
    : "(no matching guide excerpts)";

  if (!MODEL.proxyUrl) {
    return {
      text: "Pulse needs its API key set to answer. Search still works.",
      provider: "none",
      sources: hits
    };
  }

  const ragPrompt = `Guide excerpts:\n\n${context}\n\nQuestion: ${question}`;
  const contents = [{ role: "user", parts: [{ text: ragPrompt }] }];

  for (let step = 0; step < 4; step++) {
    const res = await callProxy(contents, ragPrompt);

    // An older proxy returns only { text } — no tool support. Use it directly.
    if (!res.content) {
      return { text: res.text || "", provider: "api", sources: hits };
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

    return { text: res.text || "", provider: "api", sources: hits };
  }

  return { text: "That took too many steps — try rephrasing.", provider: "api", sources: hits };
}
