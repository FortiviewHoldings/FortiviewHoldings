import { hasGemini, geminiGenerate } from "./providers/gemini.js";
import { webgpuSupported, webgpuIsolated, webgpuGenerate } from "./providers/webllm.js";

// The local model can only actually run when WebGPU is present AND the page is
// cross-origin isolated (COOP/COEP), which static hosts do not provide.
function localModelUsable() {
  return webgpuSupported() && webgpuIsolated();
}

// The router: free API first, WebGPU model as the fallback. Standalone — this
// knows nothing about the guides. Returns the text and which provider answered.
export async function ask({ system, prompt, onStatus, onProgress }) {
  if (hasGemini()) {
    try {
      onStatus?.("Asking the model…");
      const text = await geminiGenerate({ system, prompt });
      return { text, provider: "api" };
    } catch {
      onStatus?.("The API was unavailable — switching to the on-device model…");
    }
  }

  if (localModelUsable()) {
    onStatus?.("Running a model in your browser…");
    const text = await webgpuGenerate({ system, prompt, onProgress });
    return { text, provider: "webgpu" };
  }

  throw new Error(
    "The assistant needs an answer engine to run. Add a free API key (Gemini) in the model config — " +
    "the on-device WebGPU model can't run on a static host, which has no cross-origin isolation. Search still works without it."
  );
}

export function engineAvailable() {
  return hasGemini() || localModelUsable();
}
