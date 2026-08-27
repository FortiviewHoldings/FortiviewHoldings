import { MODEL } from "../config.js";

export function hasGemini() {
  return Boolean(MODEL.proxyUrl || MODEL.geminiKey);
}

// One-shot generation. Prefers the backend proxy (key stays server-side); falls
// back to calling Google directly with a client-side key for local/private use.
// Throws on no config or a non-2xx (including 429), which tells the router to
// fall back.
export async function geminiGenerate({ system, prompt }) {
  if (MODEL.proxyUrl) {
    const res = await fetch(MODEL.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, prompt })
    });
    if (res.status === 429) throw new Error("rate limited");
    if (!res.ok) throw new Error("proxy error " + res.status);
    const data = await res.json();
    const text = data.text ?? data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    if (!text) throw new Error("proxy empty");
    return text.trim();
  }

  if (!MODEL.geminiKey) throw new Error("no gemini config");

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL.geminiModel + ":generateContent?key=" + encodeURIComponent(MODEL.geminiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
    })
  });

  if (res.status === 429) throw new Error("gemini rate limited");
  if (!res.ok) throw new Error("gemini error " + res.status);

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini empty");
  return text.trim();
}
