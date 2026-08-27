// The calculators Pulse can drive. Each is a pure function with a matching
// Gemini function-declaration, so the model computes with real math instead of
// doing arithmetic in its head. Mirrors the site's own reference tools.

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

// --- calibration error as % of span ---
function calibration_error({ reading, reference, span_low = 0, span_high = 100 }) {
  const span = span_high - span_low;
  if (!span) return { error: "span_high must differ from span_low." };
  return {
    error_eu: round(reading - reference, 4),
    error_percent_span: round(((reading - reference) / span) * 100, 3)
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

const RUN = { scale_4_20ma, dp_flow, calibration_error, number_base, rtd_resistance };

export function runTool(name, args) {
  const fn = RUN[name];
  if (!fn) return { error: "unknown tool: " + name };
  try { return fn(args || {}); } catch (e) { return { error: e.message }; }
}

// Gemini function declarations.
export const TOOL_DECLARATIONS = [
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
    description: "Calibration error as percent of span. Give the reading, the reference (ideal) value, and the span_low/span_high.",
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
