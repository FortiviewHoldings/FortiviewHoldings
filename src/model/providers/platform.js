// Pulse through PragOptics (2026-11-10): the site's assistant runs on the platform's public ask door,
// where its prompt, its guides (the environment's knowledge files) and its calculators (the platform's
// instrumentation tool pack) live. The browser fetches a challenge, solves a small proof of work, and
// asks; no key is anywhere in this bundle, and the Cloudflare Worker is not in the path.
//
// MODEL.platform = { api, env, install, lane }: the platform's API root, the environment Pulse is
// installed on, the install id of the Pulse assistant there, and the lane (live). All four set means
// the platform answers; any missing means the older proxy path still answers.
import { MODEL } from "../config.js";

const P = () => MODEL.platform || {};
export function platformReady() { const p = P(); return Boolean(p.api && p.env && p.install); }

// ---- the challenge: sha256(nonce + "." + counter) with `difficulty` leading zero bits, fetched ahead and solved once ----
async function leadingZeroBits(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  const dv = new DataView(buf);
  let n = 0;
  for (let i = 0; i < 8; i++) { const w = dv.getUint32(i * 4); if (w === 0) { n += 32; continue; } n += Math.clz32(w); break; }
  return n;
}
async function solve(nonce, difficulty) {
  for (let c = 0; c < 50000000; c++) { if ((await leadingZeroBits(nonce + "." + c)) >= difficulty) return String(c); }
  return "";
}
let pending = null;
function fetchChallenge() {
  if (pending) return pending;
  const p = P();
  pending = fetch(`${p.api}/public/${encodeURIComponent(p.env)}/challenge?lane=${encodeURIComponent(p.lane || "live")}`)
    .then((r) => r.json().then((d) => { if (!r.ok) throw Object.assign(new Error(d?.error || `The platform answered ${r.status}`), { status: r.status, code: d?.code }); return d; }))
    .then(async (d) => ({ nonce: d.nonce, counter: await solve(d.nonce, d.difficulty), readyAt: Date.now() + (d.minAgeMs || 2000), expiresAt: Date.parse(d.expiresAt) || (Date.now() + 15 * 60000) }))
    .catch((e) => { pending = null; throw e; });
  return pending;
}
/** A solved challenge, fetched ahead so a person never waits and never sends too soon; the next one warms while this one is used. */
async function challenge() {
  const c = await fetchChallenge();
  if (Date.now() > c.expiresAt - 30000) { pending = null; return challenge(); }
  await new Promise((res) => setTimeout(res, Math.max(0, c.readyAt - Date.now())));
  pending = null; fetchChallenge().catch(() => {});
  return { nonce: c.nonce, counter: c.counter };
}
export function warm() { if (platformReady()) { try { fetchChallenge().catch(() => {}); } catch { /* the ask will fetch one */ } } }
function visitor() {
  try { let v = localStorage.getItem("po.visitor"); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("po.visitor", v); } return v; } catch { return "anon"; }
}

// the door's refusals in Pulse's voice; the platform's own visitor sentences are kept when it has them
function words(status, d) {
  const theirs = String(d?.error || "").trim();
  const code = String(d?.code || "");
  if (["VISITOR_CAP", "MONTH_CAP", "SHARE_SPENT", "AI_NOT_CONNECTED", "AI_BALANCE_EMPTY", "AI_CALLS_EXHAUSTED"].includes(code) && theirs) return theirs;
  if (status === 429 || code === "AI_RATE_LIMITED") return "Pulse is busy right now, give it a second and try again.";
  if (status >= 500) return "Pulse is not available right now. The search still works, and a Break-In always reaches a person.";
  return theirs || "Pulse could not answer that just now.";
}

/** One question to the environment's assistant: { answer, sources (knowledge file names), actions, remaining }. */
export async function platformAsk(question, history = []) {
  const p = P();
  const pow = await challenge();
  const body = JSON.stringify({ lane: p.lane || "live", pow, visitor: visitor(), question: String(question || "").slice(0, 2000), history: (history || []).slice(-10).map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content || "").slice(0, 2000) })), hp: "" });
  // a plain POST (text/plain, no custom header) so no browser preflights it; the platform adds the site's origin to the answer
  const res = await fetch(`${p.api}/public/${encodeURIComponent(p.env)}/modules/${encodeURIComponent(p.install)}/ask?lane=${encodeURIComponent(p.lane || "live")}`, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(words(res.status, d));
  return { answer: String(d.answer || ""), sources: Array.isArray(d.sources) ? d.sources : [], actions: Array.isArray(d.actions) ? d.actions : [], remaining: Number(d.remaining || 0) };
}

// ---- Pulse's own Gemini call through the platform (2026-11-13): the Worker's job, done by the platform with the vaulted key ----
export function platformProxyReady() { const p = P(); return Boolean(p.api && p.env && p.project && p.cred); }

/** The Gemini request exactly as the Worker built it from { prompt, system, contents, tools }. */
function geminiBody({ prompt, system, contents, tools }) {
  const body = {
    contents: Array.isArray(contents) ? contents : [{ role: "user", parts: [{ text: String(prompt || "") }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
  };
  if (system) body.systemInstruction = { parts: [{ text: String(system) }] };
  if (Array.isArray(tools)) body.tools = [{ functionDeclarations: tools }];
  return body;
}

/** The Worker's answer shape from Gemini's: { content, functionCall, text }, or a thrown error with .status. */
function workerShape(data) {
  const content = data?.candidates?.[0]?.content ?? null;
  if (!content) throw Object.assign(new Error("Empty response from model"), { status: 502 });
  const parts = content.parts || [];
  const functionCall = parts.find((x) => x.functionCall)?.functionCall || null;
  const text = parts.map((x) => x.text).filter(Boolean).join("");
  return { content, functionCall, text };
}

/**
 * One Gemini request through the platform's public project-call door. Takes what the Worker took ({ prompt, system,
 * contents, tools }) and returns what the Worker returned ({ content, functionCall, text }); throws with .status on a
 * refusal, so callers that rode through 429 and 503 on the Worker ride through them here.
 */
export async function platformProxy(workerBody) {
  const p = P();
  const pow = await challenge();
  const model = String(p.model || "gemini-flash-lite-latest");
  const body = JSON.stringify({
    lane: p.lane || "live", pow, visitor: visitor(), credId: p.cred, method: "POST",
    url: "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
    headers: { "Content-Type": "application/json" },
    body: geminiBody(workerBody || {})
  });
  // a plain POST (text/plain, no custom header) so no browser preflights it; the platform adds the site's origin to the answer
  const res = await fetch(`${p.api}/public/${encodeURIComponent(p.env)}/projects/${encodeURIComponent(p.project)}/call?lane=${encodeURIComponent(p.lane || "live")}`, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(words(res.status, d)), { status: res.status, code: d?.code });
  // the door answers { ok, status, headers, body }: status and body are Gemini's own
  if (!d.ok || Number(d.status) >= 400) throw Object.assign(new Error(d?.body?.error?.message || "Gemini error"), { status: Number(d.status) || 502 });
  return workerShape(d.body);
}

