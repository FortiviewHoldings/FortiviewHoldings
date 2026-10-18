// Shared, DOM-less solvers for the pocket-guide calculators so the main-site
// Pulse computes the same numbers the tool pages do. The pages run on the
// window.PG global (pocketguide.js); this module mirrors that math as ESM the
// React bundle can import. The primitives below are identical to PG's, and the
// outputs are verified against the pages. Capture-before-compute lives here too:
// every required field must be supplied or the solver reports what is missing.

const num = (x) => (x == null || x === "" ? NaN : Number(x));
const r = (n, d = 4) => (Number.isFinite(n) ? Number(n.toFixed(d)) : n);
const ok = (...xs) => xs.every(Number.isFinite);
const missing = (a, keys) => keys.filter((k) => a[k] == null || a[k] === "");

// --- primitives, identical to window.PG ---
const scale = (x, iLo, iHi, oLo, oHi) => (iHi === iLo ? NaN : oLo + (x - iLo) * (oHi - oLo) / (iHi - iLo));
const pctSpan = (x, lo, hi) => (hi === lo ? NaN : (x - lo) / (hi - lo) * 100);
const fromPct = (p, lo, hi) => lo + (p / 100) * (hi - lo);
const maToPct = (ma) => (ma - 4) / 16 * 100;
const pctToMa = (p) => 4 + (p / 100) * 16;
const sqrtExtract = (pDP) => (pDP <= 0 ? 0 : Math.sqrt(pDP / 100) * 100);
const sqrtSquare = (pF) => { const f = pF / 100; return f * f * 100; };

const RTD = {
  A: 3.9083e-3, B: -5.775e-7, C: -4.183e-12,
  res(t, R0) { R0 = R0 || 100; const { A, B, C } = this; return t >= 0 ? R0 * (1 + A * t + B * t * t) : R0 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t); },
  temp(R, R0) {
    R0 = R0 || 100; const A = this.A, B = this.B;
    if (R >= R0) { const disc = A * A - 4 * B * (1 - R / R0); return disc < 0 ? NaN : (-A + Math.sqrt(disc)) / (2 * B); }
    let t = (R / R0 - 1) / A;
    for (let i = 0; i < 60; i++) { const f = this.res(t, R0) - R, d = (this.res(t + 1e-3, R0) - this.res(t - 1e-3, R0)) / 2e-3; if (d === 0) break; const step = f / d; t -= step; if (Math.abs(step) < 1e-7) break; }
    return t;
  }
};

const miss = (m) => ({ error: "Missing required inputs: " + m.join(", ") + ". Ask the user for these; do not compute until all are captured.", missing: m });

// ---------- SCALING ----------
export const SCALE_TOOL = {
  name: "solve_scaling",
  description: "General linear two-way signal scaling. Maps a value from any input span to any output span (4-20 mA, 3-15 psi, temperature spans, already-linearized flow, etc.) and returns the scaled value and percent of span. ONLY for genuinely linear relationships. A differential pressure mapped to a flow rate is NOT linear (flow is proportional to the square root of DP) - use solve_sqrt for that. Capture every required input first.",
  parameters: {
    type: "object",
    properties: {
      value: { type: "number", description: "the single value to convert" },
      in_low: { type: "number", description: "input range low (LRV)" },
      in_high: { type: "number", description: "input range high (URV)" },
      in_unit: { type: "string", description: "input units, e.g. C, psi, %" },
      out_low: { type: "number", description: "output range low" },
      out_high: { type: "number", description: "output range high" },
      out_unit: { type: "string", description: "output units, e.g. mA" },
      direction: { type: "string", enum: ["i2o", "o2i"], description: "i2o = value is on the input side, solve the output; o2i = the reverse" }
    },
    required: ["value", "in_low", "in_high", "out_low", "out_high", "direction"]
  }
};
export function solveScaling(a = {}) {
  const m = missing(a, ["value", "in_low", "in_high", "out_low", "out_high", "direction"]);
  if (m.length) return miss(m);
  const inU = a.in_unit || "", outU = a.out_unit || "";
  const dpUnit = /h2o|h₂o|water|w\.?c\b|inwc|mmh2o|wg\b/i, flowUnit = /scf|acf|gpm|gph|lpm|m3\/?h|m³|nm3|nm³|mscfd|bbl|ft3|l\/min|gal\/|flow/i;
  if ((dpUnit.test(inU) && flowUnit.test(outU)) || (flowUnit.test(inU) && dpUnit.test(outU)))
    return { error: "That maps a differential pressure to a flow rate, which is a square-root relationship, not linear. Use solve_sqrt (square-root extraction) instead of linear scaling, and tell the user why." };
  const inLo = num(a.in_low), inHi = num(a.in_high), outLo = num(a.out_low), outHi = num(a.out_high), val = num(a.value);
  const dir = a.direction === "o2i" ? "o2i" : "i2o";
  if (!ok(val, inLo, inHi, outLo, outHi)) return { error: "The value and ranges must all be numbers." };
  let res, pct, resU;
  if (dir === "i2o") { res = scale(val, inLo, inHi, outLo, outHi); pct = pctSpan(val, inLo, inHi); resU = outU; }
  else { res = scale(val, outLo, outHi, inLo, inHi); pct = pctSpan(val, outLo, outHi); resU = inU; }
  if (!ok(res)) return { error: "That range has no span (low equals high)." };
  return {
    ok: true, direction: dir, result_label: dir === "i2o" ? "output" : "input",
    result_value: r(res), result_unit: resU, percent_of_span: r(pct, 2),
    reference_table: [0, 25, 50, 75, 100].map((p) => ({ percent: p, input: r(fromPct(p, inLo, inHi)), output: r(fromPct(p, outLo, outHi)) })),
    full_tool: "/education/scaling/ (open for a printable spec sheet)"
  };
}

// ---------- SQUARE-ROOT EXTRACTION (DP flow) ----------
export const SQRT_TOOL = {
  name: "solve_sqrt",
  description: "Differential-pressure flow square-root extraction, both directions. Flow is proportional to the square root of differential pressure. Give the DP range, the flow range, the direction, and the reading. Returns percent DP, percent flow, DP and flow in engineering units, and BOTH the DP-linear and flow-extracted milliamp signals for the same condition. Capture every required input first.",
  parameters: {
    type: "object",
    properties: {
      value: { type: "number", description: "the reading: a DP-linear mA when direction=sig, a differential pressure VALUE in DP units (e.g. inches of water) when direction=dp, a flow in engineering units when direction=flow" },
      direction: { type: "string", enum: ["sig", "dp", "flow"], description: "sig = DP-linear mA to flow; dp = a measured differential pressure value to flow; flow = flow back to the DP signal" },
      dp_low: { type: "number", description: "DP range low" },
      dp_high: { type: "number", description: "DP range high" },
      dp_unit: { type: "string", description: "DP units, e.g. inH2O" },
      flow_low: { type: "number", description: "flow range low" },
      flow_high: { type: "number", description: "flow range high" },
      flow_unit: { type: "string", description: "flow units, e.g. SCFH, GPM" }
    },
    required: ["value", "direction", "dp_low", "dp_high", "flow_low", "flow_high"]
  }
};
export function solveSqrt(a = {}) {
  const m = missing(a, ["value", "direction", "dp_low", "dp_high", "flow_low", "flow_high"]);
  if (m.length) return miss(m);
  const dpLo = num(a.dp_low), dpHi = num(a.dp_high), flLo = num(a.flow_low), flHi = num(a.flow_high), val = num(a.value);
  const dpU = a.dp_unit || "inH2O", flU = a.flow_unit || "GPM", dir = (a.direction === "flow" || a.direction === "dp") ? a.direction : "sig";
  if (!ok(val, dpLo, dpHi, flLo, flHi)) return { error: "The value and ranges must all be numbers." };
  let pctDP, pctFL;
  if (dir === "sig") { pctDP = maToPct(val); pctFL = sqrtExtract(pctDP); }
  else if (dir === "dp") { pctDP = pctSpan(val, dpLo, dpHi); pctFL = sqrtExtract(pctDP); }
  else { pctFL = pctSpan(val, flLo, flHi); pctDP = sqrtSquare(pctFL); }
  if (!ok(pctDP, pctFL)) return { error: "Check the ranges and the value." };
  return {
    ok: true, direction: dir, dp_unit: dpU, flow_unit: flU,
    percent_dp: r(pctDP, 2), percent_flow: r(pctFL, 2),
    dp: r(fromPct(pctDP, dpLo, dpHi), 3), flow: r(fromPct(pctFL, flLo, flHi), 3),
    dp_linear_mA: r(pctToMa(pctDP), 3), flow_extracted_mA: r(pctToMa(pctFL), 3),
    full_tool: "/education/square-root/ (open for a printable spec sheet)"
  };
}

// ---------- RTD (IEC 60751) ----------
export const RTD_TOOL = {
  name: "solve_rtd",
  description: "Platinum RTD per IEC 60751 (alpha 0.00385). Convert a reading either direction: a temperature to resistance, or a measured resistance to temperature. Needs the sensor (Pt100, Pt500, or Pt1000), the direction, and the value. Valid -200 to 850 C. Capture every required input first.",
  parameters: {
    type: "object",
    properties: {
      sensor: { type: "number", description: "ice-point resistance R0: 100, 500, or 1000" },
      direction: { type: "string", enum: ["t2r", "r2t"], description: "t2r = temperature to resistance; r2t = resistance to temperature" },
      value: { type: "number", description: "the reading (degrees C for t2r, ohms for r2t)" }
    },
    required: ["sensor", "direction", "value"]
  }
};
export function solveRtd(a = {}) {
  const m = missing(a, ["sensor", "direction", "value"]);
  if (m.length) return miss(m);
  const R0 = num(a.sensor);
  if (R0 !== 100 && R0 !== 500 && R0 !== 1000) return { error: "Sensor must be Pt100, Pt500, or Pt1000." };
  const dir = a.direction === "r2t" ? "r2t" : "t2r", val = num(a.value);
  if (!ok(val)) return { error: "The reading must be a number." };
  let res, unit, note = "";
  if (dir === "t2r") { if (val < -200 || val > 850) note = "Outside the -200 to 850 C validity range."; res = RTD.res(val, R0); unit = "ohms"; }
  else { res = RTD.temp(val, R0); unit = "degrees C"; if (ok(res) && (res < -200 || res > 850)) note = "Result is outside the -200 to 850 C validity range."; }
  if (!ok(res)) return { error: "That reading has no valid RTD solution." };
  const out = { ok: true, sensor: R0, direction: dir, value: r(res, dir === "t2r" ? 3 : 2), unit, full_tool: "/education/rtd/ (open for a printable report or a full table)" };
  if (note) out.note = note;
  return out;
}
