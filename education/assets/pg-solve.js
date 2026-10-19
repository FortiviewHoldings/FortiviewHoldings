// DOM-less solvers for the pocket-guide calculators, used by the main-site
// Pulse. The math itself is imported from pg-math.js, the same module every
// tool page's form and wizard use, so there is exactly one implementation.
// Capture-before-compute lives here too: every required field must be supplied
// or the solver reports what is missing instead of assuming a value.
import { scale, pctSpan, fromPct, clamp, errSpan, maToPct, pctToMa, sqrtExtract, sqrtSquare, RTD } from "./pg-math.js";

const num = (x) => (x == null || x === "" ? NaN : Number(x));
const r = (n, d = 4) => (Number.isFinite(n) ? Number(n.toFixed(d)) : n);
const ok = (...xs) => xs.every(Number.isFinite);
const missing = (a, keys) => keys.filter((k) => a[k] == null || a[k] === "");

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

// ---------- CALIBRATION WORKSHEET (As-Found / As-Left, percent of span) ----------
// expected = the applied input scaled onto the output span, clamped to the output
// limits (a real signal saturates); error = (measured - expected) / span * 100.
export const CAL_TOOL = {
  name: "solve_calibration",
  description: "Grade a multi-point loop calibration (As-Found / As-Left) as error in percent of span, with a pass/fail verdict. ONLY call this once every required input has been collected from the user: the input range and units applied, the output range and units measured, the tolerance in percent of span, and the As-Found reading at each test point (plus As-Left if the device was adjusted). You may suggest a common value such as a 4-20 mA output but must confirm it; never assume one. If it replies that inputs are missing, ask the user for exactly those.",
  parameters: {
    type: "object",
    properties: {
      in_low: { type: "number", description: "input range low (LRV) applied" },
      in_high: { type: "number", description: "input range high (URV) applied" },
      in_unit: { type: "string", description: "input units, e.g. inH2O, psi, degC" },
      out_low: { type: "number", description: "output range low measured" },
      out_high: { type: "number", description: "output range high measured" },
      out_unit: { type: "string", description: "output units, e.g. mA" },
      tol: { type: "number", description: "tolerance, percent of span" },
      rows: {
        type: "array",
        description: "one entry per test point, in order",
        items: {
          type: "object",
          properties: {
            applied: { type: "number", description: "input actually applied at this point" },
            as_found: { type: "number", description: "output reading before adjustment" },
            as_left: { type: "number", description: "output reading after adjustment; omit if no adjustment was made" }
          },
          required: ["applied", "as_found"]
        }
      }
    },
    required: ["in_low", "in_high", "in_unit", "out_low", "out_high", "out_unit", "tol", "rows"]
  }
};
export function solveCalibration(a = {}) {
  const { in_low, in_high, in_unit, out_low, out_high, out_unit, tol, rows } = a;
  const m = missing(a, ["in_low", "in_high", "in_unit", "out_low", "out_high", "out_unit", "tol"]);
  if (!Array.isArray(rows) || !rows.length) m.push("rows");
  if (m.length) return miss(m);
  const iLo = num(in_low), iHi = num(in_high), oLo = num(out_low), oHi = num(out_high), t = num(tol), span = oHi - oLo;
  if (!ok(iLo, iHi, oLo, oHi, t)) return { error: "Ranges and tolerance must be numbers." };
  if (iHi === iLo || span === 0) return { error: "Input and output ranges must each have a nonzero span." };
  let maxAF = 0, maxAL = 0, haveAF = false, haveAL = false;
  const out = rows.map((row) => {
    const applied = num(row.applied), rawExp = scale(applied, iLo, iHi, oLo, oHi), exp = clamp(rawExp, oLo, oHi);
    const af = (row.as_found == null || row.as_found === "") ? null : num(row.as_found);
    const al = (row.as_left == null || row.as_left === "") ? null : num(row.as_left);
    const afErr = af == null ? null : errSpan(af, exp, oLo, oHi);
    const alErr = al == null ? null : errSpan(al, exp, oLo, oHi);
    if (afErr != null && ok(afErr)) { haveAF = true; if (Math.abs(afErr) > Math.abs(maxAF)) maxAF = afErr; }
    if (alErr != null && ok(alErr)) { haveAL = true; if (Math.abs(alErr) > Math.abs(maxAL)) maxAL = alErr; }
    return {
      applied: r(applied), percent: r(pctSpan(applied, iLo, iHi), 2),
      expected: r(exp), saturated: Math.abs(rawExp - exp) > 1e-9,
      as_found: af == null ? null : r(af), found_err_pct_span: afErr == null ? null : r(afErr, 3),
      as_left: al == null ? null : r(al), left_err_pct_span: alErr == null ? null : r(alErr, 3)
    };
  });
  let verdict;
  if (!(t > 0)) verdict = "Set a tolerance";
  else if (haveAL) verdict = Math.abs(maxAL) <= t ? "PASS, left in tolerance" : "FAIL, out of tolerance";
  else if (haveAF) verdict = Math.abs(maxAF) <= t ? "Found in tolerance" : "Found out of tolerance, needs adjustment";
  else verdict = "Enter readings";
  return {
    ok: true,
    setup: `${iLo} to ${iHi} ${in_unit} -> ${oLo} to ${oHi} ${out_unit}, +/-${t}% span, ${rows.length} points`,
    rows: out, as_found_max_pct_span: haveAF ? r(maxAF, 3) : null, as_left_max_pct_span: haveAL ? r(maxAL, 3) : null,
    verdict, full_tool: "/education/calibration/ (open to print the worksheet report)"
  };
}
