// Model config, isolated so keys and model choices live in one place.
//
// The primary is a free, US-hosted API (Google AI Studio / Gemini). Use a
// free-tier key with NO billing account attached: it rate-limits and refuses
// rather than ever charging. Leave GEMINI_KEY empty to skip the API and run
// only the local WebGPU model.
//
// The fallback is a model that runs entirely in the browser over WebGPU — no
// server, no key, no cost — used when the API has no key, is rate-limited, or
// the visitor is offline.
export const MODEL = {
  // PULSE THROUGH PRAGOPTICS (2026-11-10): the platform's public ask door answers, with Pulse's prompt, guides and
  // calculators living on the platform (src/model/providers/platform.js). env is the environment Pulse is installed
  // on and install is that assistant's install id; with both set the Worker below is not in the path.
  platform: { api: "https://api.pragoptics.com/api/v1", env: "", install: "", lane: "live" },

  // The safe path for a PUBLIC site: point this at your own backend endpoint,
  // which holds the key server-side and forwards to Gemini. The browser never
  // sees the key. Leave geminiKey empty when proxyUrl is set.
  proxyUrl: "https://ai.bridgesindust.com/",

  // Direct-to-Google. Only for local/private use — a key here ships in the
  // public bundle and gets scraped and revoked. Prefer proxyUrl in production.
  geminiKey: "",
  geminiModel: "gemini-flash-lite-latest",

  // Runs in the browser over WebGPU. Needs a cross-origin-isolated host
  // (COOP/COEP), which static hosting does not provide.
  webgpuModel: "Llama-3.2-1B-Instruct-q4f32_1-MLC"
};
