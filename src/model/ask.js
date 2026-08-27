import { hasGemini, geminiGenerate } from "./providers/gemini.js";
import { webgpuSupported, webgpuGenerate } from "./providers/webllm.js";

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

  if (webgpuSupported()) {
    onStatus?.("Running a model in your browser…");
    const text = await webgpuGenerate({ system, prompt, onProgress });
    return { text, provider: "webgpu" };
  }

  throw new Error(
    "No answer engine is available: there is no API key set, and this browser has no WebGPU. Try Chrome or Edge, or add an API key."
  );
}

export function engineAvailable() {
  return hasGemini() || webgpuSupported();
}
