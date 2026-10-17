// The calculators Pulse can drive. Each is a pure function with a matching
// Gemini function-declaration, so the model computes with real math instead of
// doing arithmetic in its head. Mirrors the site's own reference tools.

import { solveFlow, FLOW_TOOL } from "../../education/flow-calculator/flow-solve.js";

const round = (n, d = 4) => (Number.isFinite(n) ? Number(n.toFixed(d)) : n);

// --- 4-20 mA linear scaling: give one of ma / percent / eu, get all ---
function scale_4_20ma({ ma, percent, eu, eu_low = 0, eu_high = 100 }) {
  const span = eu_high - eu_low;
  let pct;
  if (percent != null) pct = percent;
  else if (ma != null) pct = ((ma - 4) / 16) * 100;
  else if (eu != null) pct = span ? ((eu - eu_low) / span) * 100 : 0;
  else return { error: "Provide one of ma, percent, or eu." };
  return {
    ma: round(4 + (pct / 100) * 16, 3),
    percent: round(pct, 2),
    eu: round(eu_low + (pct / 100) * span, 3),
    range: `${eu_low}–${eu_high}`
  };
}

// --- DP flow with square-root extraction ---
function dp_flow({ ma, dp_percent, flow_percent, flow_max = 100 }) {
  let dpPct;
  if (dp_percent != null) dpPct = dp_percent;
  else if (ma != null) dpPct = ((ma - 4) / 16) * 100;
  else if (flow_percent != null) dpPct = (flow_percent * flow_percent) / 100;
  else return { error: "Provide one of ma, dp_percent, or flow_percent." };
  const flowPct = Math.sqrt(Math.max(0, dpPct) / 100) * 100;
  return {
    dp_percent: round(dpPct, 2),
    flow_percent: round(flowPct, 2),
    flow: round((flowPct / 100) * flow_max, 3),
    ma: round(4 + (dpPct / 100) * 16, 3)
  };
}

// --- calibration error as % of span, reading and reference in the SAME units ---
function calibration_error({ reading, reference, span_low = 0, span_high = 100 }) {
  const span = span_high - span_low;
  if (!span) return { error: "span_high must differ from span_low." };
  return {
    error_eu: round(reading - reference, 4),
    error_percent_span: round(((reading - reference) / span) * 100, 3)
  };
}

// --- error of a 4-20 mA transmitter: give the range, the applied value in
// engineering units, and the MEASURED mA. Converts internally so mA and
// engineering units are never mixed. ---
function transmitter_error({ eu_low = 0, eu_high = 100, applied_eu, measured_ma }) {
  const span = eu_high - eu_low;
  if (!span) return { error: "eu_high must differ from eu_low." };
  const ideal_ma = 4 + ((applied_eu - eu_low) / span) * 16;
  const measured_eu = eu_low + ((measured_ma - 4) / 16) * span;
  return {
    applied_eu,
    ideal_ma: round(ideal_ma, 3),
    measured_ma,
    measured_eu: round(measured_eu, 3),
    error_eu: round(measured_eu - applied_eu, 4),
    error_percent_span: round(((measured_ma - ideal_ma) / 16) * 100, 3)
  };
}

// --- number base conversion ---
function number_base({ value, from_base = 10, to_base = 16 }) {
  const n = parseInt(String(value).trim(), from_base);
  if (Number.isNaN(n)) return { error: `"${value}" is not valid base ${from_base}.` };
  return {
    decimal: n,
    binary: n.toString(2),
    octal: n.toString(8),
    hex: n.toString(16).toUpperCase(),
    result: n.toString(to_base).toUpperCase()
  };
}

// --- RTD resistance, IEC 60751 (Pt100 / Pt1000) ---
function rtd_resistance({ temp_c, type = "Pt100" }) {
  const R0 = type.toLowerCase() === "pt1000" ? 1000 : 100;
  const A = 3.9083e-3, B = -5.775e-7, C = -4.183e-12;
  const t = temp_c;
  const r = t >= 0
    ? R0 * (1 + A * t + B * t * t)
    : R0 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t);
  return { type: R0 === 1000 ? "Pt1000" : "Pt100", temp_c: t, resistance_ohms: round(r, 4) };
}

// --- multi-point calibration worksheet (As-Found / As-Left, percent of span) ---
// Same math as the on-page worksheet: expected = linear scale of the applied
// input clamped to the output limits; error = (measured - expected) / span * 100.
function solve_calibration(a = {}) {
  const { in_low, in_high, in_unit, out_low, out_high, out_unit, tol, rows } = a;
  const req = [];
  for (const k of ["in_low", "in_high", "in_unit", "out_low", "out_high", "out_unit", "tol"])
    if (a[k] == null || a[k] === "") req.push(k);
  if (!Array.isArray(rows) || !rows.length) req.push("rows");
  if (req.length) return { error: `Missing required inputs: ${req.join(", ")}. Ask the user for these; do not compute until all are captured.`, missing: req };
  const iLo = +in_low, iHi = +in_high, oLo = +out_low, oHi = +out_high, t = +tol, span = oHi - oLo;
  if (![iLo, iHi, oLo, oHi, t].every(Number.isFinite)) return { error: "Ranges and tolerance must be numbers." };
  if (iHi === iLo || span === 0) return { error: "Input and output ranges must each have a nonzero span." };
  const clampv = (v, a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); return v < lo ? lo : v > hi ? hi : v; };
  const scaleLin = (x) => oLo + (x - iLo) * (oHi - oLo) / (iHi - iLo);
  let maxAF = 0, maxAL = 0, haveAF = false, haveAL = false;
  const out = rows.map((r) => {
    const applied = +r.applied, rawExp = scaleLin(applied), exp = clampv(rawExp, oLo, oHi);
    const af = (r.as_found == null || r.as_found === "") ? null : +r.as_found;
    const al = (r.as_left == null || r.as_left === "") ? null : +r.as_left;
    const afErr = af == null ? null : (af - exp) / span * 100;
    const alErr = al == null ? null : (al - exp) / span * 100;
    if (afErr != null && Number.isFinite(afErr)) { haveAF = true; if (Math.abs(afErr) > Math.abs(maxAF)) maxAF = afErr; }
    if (alErr != null && Number.isFinite(alErr)) { haveAL = true; if (Math.abs(alErr) > Math.abs(maxAL)) maxAL = alErr; }
    return {
      applied: round(applied), percent: round((applied - iLo) / (iHi - iLo) * 100, 2),
      expected: round(exp), saturated: Math.abs(rawExp - exp) > 1e-9,
      as_found: af == null ? null : round(af), found_err_pct_span: afErr == null ? null : round(afErr, 3),
      as_left: al == null ? null : round(al), left_err_pct_span: alErr == null ? null : round(alErr, 3)
    };
  });
  let verdict;
  if (!(t > 0)) verdict = "Set a tolerance";
  else if (haveAL) verdict = Math.abs(maxAL) <= t ? "PASS, left in tolerance" : "FAIL, out of tolerance";
  else if (haveAF) verdict = Math.abs(maxAF) <= t ? "Found in tolerance" : "Found out of tolerance, needs adjustment";
  else verdict = "Enter readings";
  return {
    setup: `${iLo} to ${iHi} ${in_unit} -> ${oLo} to ${oHi} ${out_unit}, +/-${t}% span, ${rows.length} points`,
    rows: out, as_found_max_pct_span: haveAF ? round(maxAF, 3) : null, as_left_max_pct_span: haveAL ? round(maxAL, 3) : null,
    verdict, full_tool: "/education/calibration/ (open to print the worksheet report)"
  };
}

const RUN = { scale_4_20ma, dp_flow, calibration_error, transmitter_error, number_base, rtd_resistance, solve_flow: solveFlow, solve_calibration };

export function runTool(name, args) {
  const fn = RUN[name];
  if (!fn) return { error: "unknown tool: " + name };
  try { return fn(args || {}); } catch (e) { return { error: e.message }; }
}

// Gemini function declarations.
export const TOOL_DECLARATIONS = [
  FLOW_TOOL,
  {
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
  },
  {
    name: "scale_4_20ma",
    description: "Linear 4-20 mA scaling. Given one of ma, percent, or eu (engineering units) with the eu_low/eu_high range, return all three.",
    parameters: {
      type: "object",
      properties: {
        ma: { type: "number", description: "loop current, 4-20 mA" },
        percent: { type: "number", description: "percent of span, 0-100" },
        eu: { type: "number", description: "value in engineering units" },
        eu_low: { type: "number", description: "engineering value at 4 mA" },
        eu_high: { type: "number", description: "engineering value at 20 mA" }
      }
    }
  },
  {
    name: "dp_flow",
    description: "DP flow with square-root extraction. Given one of ma, dp_percent, or flow_percent (and flow_max), return DP %, flow %, flow, and mA.",
    parameters: {
      type: "object",
      properties: {
        ma: { type: "number" },
        dp_percent: { type: "number", description: "differential pressure, percent of range" },
        flow_percent: { type: "number" },
        flow_max: { type: "number", description: "flow at 100%" }
      }
    }
  },
  {
    name: "calibration_error",
    description: "Calibration error as percent of span. reading and reference MUST be in the SAME units (both mA, or both engineering units). If you have a measured mA against an applied engineering value, use transmitter_error instead.",
    parameters: {
      type: "object",
      properties: {
        reading: { type: "number" },
        reference: { type: "number" },
        span_low: { type: "number" },
        span_high: { type: "number" }
      },
      required: ["reading", "reference"]
    }
  },
  {
    name: "transmitter_error",
    description: "Error of a 4-20 mA transmitter as percent of span. Use this when you have the transmitter range, an applied process value in engineering units, and the MEASURED loop current in mA. It converts internally — never pre-convert or mix mA with engineering units. Returns ideal_ma, measured_eu, error_eu, and error_percent_span.",
    parameters: {
      type: "object",
      properties: {
        eu_low: { type: "number", description: "engineering value at 4 mA" },
        eu_high: { type: "number", description: "engineering value at 20 mA" },
        applied_eu: { type: "number", description: "the applied/process value, in engineering units" },
        measured_ma: { type: "number", description: "the measured loop current in mA" }
      },
      required: ["applied_eu", "measured_ma"]
    }
  },
  {
    name: "number_base",
    description: "Convert an integer between bases. value in from_base (2, 8, 10, or 16); returns decimal, binary, octal, hex, and the to_base result.",
    parameters: {
      type: "object",
      properties: {
        value: { type: "string" },
        from_base: { type: "integer" },
        to_base: { type: "integer" }
      },
      required: ["value"]
    }
  },
  {
    name: "rtd_resistance",
    description: "RTD resistance at a temperature per IEC 60751. Give temp_c and type (Pt100 or Pt1000).",
    parameters: {
      type: "object",
      properties: {
        temp_c: { type: "number" },
        type: { type: "string", description: "Pt100 or Pt1000" }
      },
      required: ["temp_c"]
    }
  }
];
