// Thermocouple ITS-90 core as ESM, so the main-site Pulse computes the same
// millivolts the thermocouple tool page does (which runs on window.PG.TC +
// window.PG.TC_DATA from tc-data.js). The reference functions and the NIST
// SRD 60 / Monograph 175 coefficients below are a verified copy of tc-data.js;
// Pulse output is checked against the page's anchor points.

export const TC_DATA = {
  J: {
    name: "Type J", alloy: "Iron / Constantan", range: "-210 to 1200 C",
    tMin: -210, tMax: 1200, invMin: -210,
    subRanges: [
      { tMinC: -210, tMaxC: 760, coeffs: [0, 0.050381187815, 0.00003047583693, -8.568106572e-8, 1.3228195295e-10, -1.7052958337e-13, 2.0948090697e-16, -1.2538395336e-19, 1.5631725697e-23] },
      { tMinC: 760, tMaxC: 1200, coeffs: [296.45625681, -1.4976127786, 0.0031787103924, -0.0000031847686701, 1.5720819004e-9, -3.0691369056e-13] }
    ]
  },
  K: {
    name: "Type K", alloy: "NiCr / NiAl (Chromel / Alumel)", range: "-270 to 1372 C",
    tMin: -270, tMax: 1372, invMin: -270,
    subRanges: [
      { tMinC: -270, tMaxC: 0, coeffs: [0, 0.039450128025, 0.000023622373598, -3.2858906784e-7, -4.9904828777e-9, -6.7509059173e-11, -5.7410327428e-13, -3.1088872894e-15, -1.0451609365e-17, -1.9889266878e-20, -1.6322697486e-23] },
      { tMinC: 0, tMaxC: 1372, coeffs: [-0.017600413686, 0.038921204975, 0.000018558770032, -9.9457592874e-8, 3.1840945719e-10, -5.6072844889e-13, 5.6075059059e-16, -3.2020720003e-19, 9.7151147152e-23, -1.2104721275e-26], expA0: 0.1185976, expA1: -0.0001183432, expA2: 126.9686 }
    ]
  },
  T: {
    name: "Type T", alloy: "Copper / Constantan", range: "-270 to 400 C",
    tMin: -270, tMax: 400, invMin: -270,
    subRanges: [
      { tMinC: -270, tMaxC: 0, coeffs: [0, 0.038748106364, 0.000044194434347, 1.1844323105e-7, 2.0032973554e-8, 9.0138019559e-10, 2.2651156593e-11, 3.6071154205e-13, 3.8493939883e-15, 2.8213521925e-17, 1.4251594779e-19, 4.8768662286e-22, 1.079553927e-24, 1.3945027062e-27, 7.9795153927e-31] },
      { tMinC: 0, tMaxC: 400, coeffs: [0, 0.038748106364, 0.00003329222788, 2.0618243404e-7, -2.1882256846e-9, 1.0996880928e-11, -3.0815758772e-14, 4.547913529e-17, -2.7512901673e-20] }
    ]
  },
  E: {
    name: "Type E", alloy: "NiCr / Constantan (Chromel / Constantan)", range: "-270 to 1000 C",
    tMin: -270, tMax: 1000, invMin: -270,
    subRanges: [
      { tMinC: -270, tMaxC: 0, coeffs: [0, 0.058665508708, 0.000045410977124, -7.7998048686e-7, -2.5800160843e-8, -5.9452583057e-10, -9.3214058667e-12, -1.0287605534e-13, -8.0370123621e-16, -4.3979497391e-18, -1.6414776355e-20, -3.9673619516e-23, -5.5827328721e-26, -3.4657842013e-29] },
      { tMinC: 0, tMaxC: 1000, coeffs: [0, 0.05866550871, 0.000045032275582, 2.8908407212e-8, -3.3056896652e-10, 6.502440327e-13, -1.9197495504e-16, -1.2536600497e-18, 2.1489217569e-21, -1.4388041782e-24, 3.5960899481e-28] }
    ]
  },
  N: {
    name: "Type N", alloy: "Nicrosil / Nisil", range: "-270 to 1300 C",
    tMin: -270, tMax: 1300, invMin: -270,
    subRanges: [
      { tMinC: -270, tMaxC: 0, coeffs: [0, 0.026159105962, 0.000010957484228, -9.3841111554e-8, -4.6412039759e-11, -2.6303357716e-12, -2.2653438003e-14, -7.6089300791e-17, -9.3419667835e-20] },
      { tMinC: 0, tMaxC: 1300, coeffs: [0, 0.025929394601, 0.00001571014188, 4.3825627237e-8, -2.5261169794e-10, 6.4311819339e-13, -1.0063471519e-15, 9.9745338992e-19, -6.0863245607e-22, 2.0849229339e-25, -3.0682196151e-29] }
    ]
  },
  R: {
    name: "Type R", alloy: "Pt-13%Rh / Pt", range: "-50 to 1768 C",
    tMin: -50, tMax: 1768.1, invMin: -50,
    subRanges: [
      { tMinC: -50, tMaxC: 1064.18, coeffs: [0, 0.00528961729765, 0.0000139166589782, -2.38855693017e-8, 3.56916001063e-11, -4.62347666298e-14, 5.00777441034e-17, -3.73105886191e-20, 1.57716482367e-23, -2.81038625251e-27] },
      { tMinC: 1064.18, tMaxC: 1664.5, coeffs: [2.95157925316, -0.00252061251332, 0.0000159564501865, -7.64085947576e-9, 2.05305291024e-12, -2.93359668173e-16] },
      { tMinC: 1664.5, tMaxC: 1768.1, coeffs: [152.232118209, -0.268819888545, 0.000171280280471, -3.45895706453e-8, -9.34633971046e-15] }
    ]
  },
  S: {
    name: "Type S", alloy: "Pt-10%Rh / Pt", range: "-50 to 1768 C",
    tMin: -50, tMax: 1768.1, invMin: -50,
    subRanges: [
      { tMinC: -50, tMaxC: 1064.18, coeffs: [0, 0.00540313308631, 0.000012593428974, -2.32477968689e-8, 3.22028823036e-11, -3.31465196389e-14, 2.55744251786e-17, -1.25068871393e-20, 2.71443176145e-24] },
      { tMinC: 1064.18, tMaxC: 1664.5, coeffs: [1.32900444085, 0.00334509311344, 0.00000654805192818, -1.64856259209e-9, 1.29989605174e-14] },
      { tMinC: 1664.5, tMaxC: 1768.1, coeffs: [146.628232636, -0.258430516752, 0.000163693574641, -3.30439046987e-8, -9.43223690612e-15] }
    ]
  },
  B: {
    name: "Type B", alloy: "Pt-30%Rh / Pt-6%Rh", range: "0 to 1820 C",
    tMin: 0, tMax: 1820, invMin: 130,
    subRanges: [
      { tMinC: 0, tMaxC: 630.615, coeffs: [0, -0.00024650818346, 0.0000059040421171, -1.3257931636e-9, 1.5668291901e-12, -1.694452924e-15, 6.2990347094e-19] },
      { tMinC: 630.615, tMaxC: 1820, coeffs: [-3.8938168621, 0.02857174747, -0.000084885104785, 1.5785280164e-7, -1.6835344864e-10, 1.1109794013e-13, -4.4515431033e-17, 9.8975640821e-21, -9.3791330289e-25] }
    ]
  }
};

export function emf(type, t) {
  const d = TC_DATA[type]; if (!d) return NaN;
  let rng = null;
  for (const sr of d.subRanges) { if (t >= sr.tMinC && t <= sr.tMaxC) { rng = sr; break; } }
  if (!rng) return NaN;
  let e = 0, p = 1;
  for (let i = 0; i < rng.coeffs.length; i++) { e += rng.coeffs[i] * p; p *= t; }
  if (rng.expA0 != null && Number.isFinite(rng.expA0)) e += rng.expA0 * Math.exp(rng.expA1 * (t - rng.expA2) * (t - rng.expA2));
  return e;
}

export function temp(type, mv) {
  const d = TC_DATA[type]; if (!d) return NaN;
  let lo = d.invMin != null ? d.invMin : d.tMin, hi = d.tMax;
  const elo = emf(type, lo), ehi = emf(type, hi);
  if (mv < Math.min(elo, ehi) - 1e-9 || mv > Math.max(elo, ehi) + 1e-9) return NaN;
  for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (emf(type, mid) < mv) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

const r = (n, d = 3) => (Number.isFinite(n) ? Number(n.toFixed(d)) : n);

export const TC_TOOL = {
  name: "thermocouple_convert",
  description: "Convert a thermocouple reading either direction with the deterministic ITS-90 engine and cold-junction compensation, for types J, K, T, E, N, R, S, B. c2mv = a hot-junction temperature to the meter millivolts; mv2c = a measured millivolt reading to temperature. ALWAYS ask for the cold-junction (reference) temperature; never assume it. Capture every required input first.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["J", "K", "T", "E", "N", "R", "S", "B"], description: "thermocouple letter type" },
      direction: { type: "string", enum: ["c2mv", "mv2c"], description: "c2mv = temperature to meter mV; mv2c = measured mV to temperature" },
      value: { type: "number", description: "hot-junction temperature in C (c2mv) or measured mV at the meter (mv2c)" },
      ref_c: { type: "number", description: "cold-junction / reference temperature in C; ask for it, never assume" }
    },
    required: ["type", "direction", "value", "ref_c"]
  }
};

export function solveThermocouple(a = {}) {
  const need = ["type", "direction", "value", "ref_c"].filter((k) => a[k] == null || a[k] === "");
  if (need.length) return { error: "Missing required inputs: " + need.join(", ") + ". Ask the user, especially the cold-junction reference; do not compute until all are captured.", missing: need };
  const type = String(a.type || "").toUpperCase(), dir = a.direction === "mv2c" ? "mv2c" : "c2mv";
  const val = Number(a.value), ref = Number(a.ref_c), d = TC_DATA[type];
  if (!d) return { error: "Pick a thermocouple type: J, K, T, E, N, R, S, or B." };
  if (!Number.isFinite(val)) return { error: "The reading must be a number." };
  if (!Number.isFinite(ref)) return { error: "The cold-junction reference must be a number." };
  const eRef = emf(type, ref);
  if (!Number.isFinite(eRef)) return { error: `The reference temperature is outside the ${d.name} range (${d.range}).` };
  if (dir === "c2mv") {
    const eHot = emf(type, val);
    if (!Number.isFinite(eHot)) return { error: `That hot-junction temperature is outside the ${d.name} range (${d.range}).` };
    const meter = eHot - eRef;
    return { ok: true, direction: dir, type: d.name, ref_c: ref, range: d.range, meter_mV: r(meter), e_hot_mV: r(eHot), e_reference_mV: r(eRef), full_tool: "/education/thermocouple/ (open for a printable report or a full table)" };
  }
  const hot = temp(type, val + eRef);
  if (!Number.isFinite(hot)) return { error: `That reading is outside the ${d.name} range with this reference.` };
  return { ok: true, direction: dir, type: d.name, ref_c: ref, range: d.range, hot_junction_C: r(hot, 2), e_absolute_mV: r(val + eRef), e_reference_mV: r(eRef), full_tool: "/education/thermocouple/ (open for a printable report or a full table)" };
}
