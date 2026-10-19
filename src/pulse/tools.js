// The calculators Pulse can drive. Each is a pure function with a matching
// Gemini function-declaration, so the model computes with real math instead of
// doing arithmetic in its head. Mirrors the site's own reference tools.

import { solveFlow, FLOW_TOOL } from "../../education/flow-calculator/flow-solve.js";
import { solveScaling, SCALE_TOOL, solveSqrt, SQRT_TOOL, solveRtd, RTD_TOOL, solveCalibration, CAL_TOOL } from "../../education/assets/pg-solve.js";
import { solveThermocouple, TC_TOOL } from "../../education/assets/tc-core.js";

const round = (n, d = 4) => (Number.isFinite(n) ? Number(n.toFixed(d)) : n);

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

const RUN = {
  solve_flow: solveFlow, solve_calibration: solveCalibration,
  solve_scaling: solveScaling, solve_sqrt: solveSqrt, solve_rtd: solveRtd, thermocouple_convert: solveThermocouple,
  calibration_error, transmitter_error, number_base
};

export function runTool(name, args) {
  const fn = RUN[name];
  if (!fn) return { error: "unknown tool: " + name };
  try { return fn(args || {}); } catch (e) { return { error: e.message }; }
}

// Gemini function declarations.
export const TOOL_DECLARATIONS = [
  FLOW_TOOL,
  SCALE_TOOL,
  SQRT_TOOL,
  RTD_TOOL,
  TC_TOOL,
  CAL_TOOL,
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
  }
];
