import { MODEL } from "../config.js";

// The WebGPU model runs in the browser. The engine and weights are large, so
// the library is imported on demand and the engine is built once, the first
// time a local answer is needed.
let enginePromise = null;

export function webgpuSupported() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

// WebLLM's threaded WASM needs cross-origin isolation (COOP/COEP), which a
// plain static host like GitHub Pages cannot set. Without it the engine stalls
// instead of erroring, so surface it plainly up front.
export function webgpuIsolated() {
  return typeof window !== "undefined" && window.crossOriginIsolated === true;
}

function getEngine(onProgress) {
  if (!enginePromise) {
    enginePromise = import("@mlc-ai/web-llm").then(({ CreateMLCEngine }) =>
      CreateMLCEngine(MODEL.webgpuModel, {
        initProgressCallback: (r) => onProgress?.(r.text || "")
      })
    );
  }
  return enginePromise;
}

export async function webgpuGenerate({ system, prompt, onProgress }) {
  if (!webgpuSupported()) throw new Error("no webgpu");
  if (!webgpuIsolated()) {
    throw new Error(
      "The on-device model cannot start on this host: it needs cross-origin isolation " +
      "(COOP/COEP headers) that static hosting does not provide. Add a free API key to use the assistant."
    );
  }
  const engine = await getEngine(onProgress);
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  const res = await engine.chat.completions.create({ messages, temperature: 0.2, max_tokens: 800 });
  return res.choices?.[0]?.message?.content?.trim() ?? "";
}
