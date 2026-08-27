// Cloudflare Worker: Gemini proxy for the site assistant.
//
// The browser POSTs { system, prompt }; the Worker adds the key (kept as a
// secret) and forwards to Gemini, so the key never reaches the client.
//
// Setup:
//   1. Set the secret:   npx wrangler secret put GEMINI_API_KEY
//      (or Dashboard -> the Worker -> Settings -> Variables -> add a Secret)
//   2. Optional vars:    GEMINI_MODEL (default gemini-3.6-flash)
//   3. Deploy, then put the Worker URL in the site as MODEL.proxyUrl.
//
// Only the site's own origins may call it, so the key's free quota is not open
// to the whole internet.

const ALLOWED_ORIGINS = new Set([
  "https://bridgesindust.com",
  "https://www.bridgesindust.com",
  "http://localhost:5180",
  "http://127.0.0.1:5180"
]);

const MAX_PROMPT = 8000;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://bridgesindust.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json({ error: "Method Not Allowed" }, 405, origin);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "Server is not configured" }, 500, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
    const system = typeof payload.system === "string" ? payload.system.trim() : "";
    // Advanced path: a full conversation and tool declarations, for Pulse's
    // calculator function-calling. Simple path: a single prompt.
    const contents = Array.isArray(payload.contents) ? payload.contents : null;
    const tools = Array.isArray(payload.tools) ? payload.tools : null;
    if (!contents && !prompt) {
      return json({ error: "No prompt provided" }, 400, origin);
    }
    if (prompt && prompt.length > MAX_PROMPT) {
      return json({ error: "Prompt too long" }, 413, origin);
    }

    // Flash-Lite only — the cheapest tier. Overridable by a GEMINI_MODEL var,
    // but the default never reaches a heavier model.
    const model = env.GEMINI_MODEL || "gemini-flash-lite-latest";
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model + ":generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY);

    const body = {
      contents: contents || [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    if (tools) body.tools = [{ functionDeclarations: tools }];

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (e) {
      return json({ error: "Upstream request failed" }, 502, origin);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Pass the status through so the client can fall back (e.g. 429).
      return json({ error: data?.error?.message || "Gemini error" }, res.status, origin);
    }

    const content = data?.candidates?.[0]?.content ?? null;
    if (!content) {
      return json({ error: "Empty response from model" }, 502, origin);
    }
    const parts = content.parts || [];
    const functionCall = parts.find((p) => p.functionCall)?.functionCall || null;
    const text = parts.map((p) => p.text).filter(Boolean).join("");

    // `text` keeps the simple client working; `content`/`functionCall` drive the
    // tool loop.
    return json({ content, functionCall, text }, 200, origin);
  }
};
