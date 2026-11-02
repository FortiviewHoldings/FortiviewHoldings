// The platform's public doors, from this site's own pages: a message from a form lands in the module's
// table in the environment, and a reader module's approved rows (reviews) come back for display.
// This is the page half of the platform's automatic captcha: a challenge fetched ahead of time and
// solved by work (sha256 in plain script, fast), used once and never sooner than the platform allows,
// a visitor key for the per-visitor cap, and the form's honeypot passed through. Every send is a POST
// as text/plain, so no browser preflights it; the platform answers with the site's own origin.
// No React in here. doors.test.mjs proves solve() against the platform's own check.
import { PLATFORM } from "./config.js";

const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

/** sha256 of a string, as eight 32-bit words. */
export function sha256(str) {
  const bytes = new TextEncoder().encode(str), l = bytes.length, padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  padded.set(bytes); padded[l] = 0x80;
  const dv = new DataView(padded.buffer), bits = l * 8;
  dv.setUint32(padded.length - 4, bits >>> 0); dv.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], W = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    let i;
    for (i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (i = 16; i < 64; i++) {
      const s0 = ((W[i - 15] >>> 7) | (W[i - 15] << 25)) ^ ((W[i - 15] >>> 18) | (W[i - 15] << 14)) ^ (W[i - 15] >>> 3);
      const s1 = ((W[i - 2] >>> 17) | (W[i - 2] << 15)) ^ ((W[i - 2] >>> 19) | (W[i - 2] << 13)) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H;
}
function leadingZeros(H) { let n = 0; for (let i = 0; i < 8; i++) { const w = H[i]; if (w === 0) { n += 32; continue; } n += Math.clz32(w); break; } return n; }
/** The counter that makes sha256(nonce + "." + counter) start with `difficulty` zero bits ("" when none is found). */
export function solve(nonce, difficulty) {
  for (let c = 0; c < 50000000; c++) if (leadingZeros(sha256(nonce + "." + c)) >= difficulty) return String(c);
  return "";
}

/** A key for the per-visitor cap: random, kept in this browser, naming no one. */
export function visitor() {
  try {
    let v = localStorage.getItem("po.visitor");
    if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("po.visitor", v); }
    return v;
  } catch { return "anon"; }
}

const pending = {};
function fetchChallenge(cfg) {
  const key = cfg.env + "|" + cfg.lane;
  if (pending[key]) return pending[key];
  pending[key] = fetch(cfg.api + "/public/" + encodeURIComponent(cfg.env) + "/challenge?lane=" + encodeURIComponent(cfg.lane))
    .then((r) => r.json().then((d) => { if (!r.ok) throw platformError(r, d); return d; }))
    .then((d) => ({ nonce: d.nonce, counter: solve(d.nonce, d.difficulty), readyAt: Date.now() + (d.minAgeMs || 2000), expiresAt: Date.parse(d.expiresAt) || (Date.now() + 15 * 60000) }))
    .catch((e) => { delete pending[key]; throw e; });
  return pending[key];
}
/** A solved challenge, ready to use: fetched ahead of time so a person never waits and never sends too soon. */
export function challenge(cfg = PLATFORM) {
  const key = cfg.env + "|" + cfg.lane;
  return fetchChallenge(cfg).then((c) => {
    if (Date.now() > c.expiresAt - 30000) { delete pending[key]; return challenge(cfg); }
    const wait = Math.max(0, c.readyAt - Date.now());
    return new Promise((res) => setTimeout(() => { delete pending[key]; fetchChallenge(cfg).catch(() => {}); res({ nonce: c.nonce, counter: c.counter }); }, wait));
  });
}
/** Fetch and solve the next challenge now (a form calls this when it appears, so the send is instant). */
export function warm(cfg = PLATFORM) { try { fetchChallenge(cfg).catch(() => {}); } catch { /* the send will fetch one */ } }

function platformError(r, d) {
  const e = new Error((d && d.error) || ("The platform answered " + r.status));
  e.status = r.status; e.code = d && d.code; e.platform = true;
  return e;
}
function installOf(key, cfg) {
  const id = cfg.installs && cfg.installs[key];
  if (!id) throw new Error("No platform install for " + key + ".");
  return id;
}

/** A form's message into its module's table: resolves { ok, id, at }; throws the platform's sentence. */
export async function submitForm(key, fields, { hp = "", cfg = PLATFORM } = {}) {
  const install = installOf(key, cfg);
  const pow = await challenge(cfg);
  const r = await fetch(cfg.api + "/public/" + encodeURIComponent(cfg.env) + "/modules/" + encodeURIComponent(install) + "/submit?lane=" + encodeURIComponent(cfg.lane), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ lane: cfg.lane, pow, visitor: visitor(), fields, hp: hp || "" })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw platformError(r, d);
  return d;
}

/** A reader module's rows for display (reviews): [{ id, at, fields }], newest first, approved only. */
export async function readItems(key, { limit = 50, cfg = PLATFORM } = {}) {
  const install = installOf(key, cfg);
  const r = await fetch(cfg.api + "/public/" + encodeURIComponent(cfg.env) + "/modules/" + encodeURIComponent(install) + "/items?lane=" + encodeURIComponent(cfg.lane) + "&limit=" + encodeURIComponent(limit));
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw platformError(r, d);
  return Array.isArray(d.items) ? d.items : [];
}
