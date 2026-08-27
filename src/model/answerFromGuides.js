import { buildIndex, search } from "../search/index.js";
import { GUIDES } from "../data/guides.js";
import { ask } from "./ask.js";

// The layer that composes search and the model: pull the most relevant guide
// sections, then answer grounded in them. Search and ask each work on their
// own; this is what joins them.
const index = buildIndex(GUIDES);

const SYSTEM =
  "You are the field-reference assistant for Bridges Industrial, an industrial " +
  "instrumentation consultancy. Answer only from the provided guide excerpts. " +
  "Be concise and practical, for a technician in the field. If the excerpts do " +
  "not cover the question, say so plainly and suggest submitting a Break-In. " +
  "Never invent part numbers or figures.";

export function relevantSections(question, k = 5) {
  return search(index, question, k);
}

export async function answerFromGuides(question, handlers = {}) {
  const hits = relevantSections(question);
  if (!hits.length) {
    return {
      text: "Nothing in the guides covers that yet. You can submit a Break-In and a specialist will answer by email.",
      provider: "none",
      sources: []
    };
  }

  const context = hits
    .map((h, i) => `[${i + 1}] ${h.guide} — ${h.question}\n${h.snippet}`)
    .join("\n\n");

  const prompt =
    `Guide excerpts:\n\n${context}\n\n` +
    `Question: ${question}\n\n` +
    `Answer from the excerpts above, and point to the guide by name.`;

  const { text, provider } = await ask({ system: SYSTEM, prompt, ...handlers });
  return { text, provider, sources: hits };
}
