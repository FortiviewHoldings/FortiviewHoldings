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
  geminiKey: "",
  geminiModel: "gemini-1.5-flash",
  // Small enough to download and run in a browser tab; swap for a larger one
  // where the device can take it.
  webgpuModel: "Llama-3.2-1B-Instruct-q4f32_1-MLC"
};
