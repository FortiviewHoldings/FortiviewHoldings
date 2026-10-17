// Shared, DOM-less flow solve. Mirrors the calculator page's readConfiguration
// (same defaults, same unit conversions) so Pulse computes identical numbers to
// the tool, without the form. The engine itself stays the single source of math.
import { FlowCalc as F } from "./engine.js";

// Default friendly inputs = the page's air / venturi example, verbatim.
const D = {
  fluid: "gas", element: "venturi", solveFor: "flow",
  dp: 100, dpUnit: "inH2O60", maxDP: null,
  D: 4.026, dUnit: "in", beta: 0.65, geometryMode: "ratio", feature: 2.6169,
  cdMode: "machined", Cd: 0.995, taps: "flange", probeK: 0.62, profileFactor: 0.9,
  expMode: "auto", probeY: 1, operatingY: 1,
  lineP: 100, pUnit: "psi", pBasis: "gauge", atmosphere: 101.325, atmUnit: "kPa",
  lineT: 80, tUnit: "F",
  densityMode: "eos", rhoGas: 1.2, gasRhoUnit: "kg/m3", rhoLiquid: 1000, liquidRhoUnit: "kg/m3",
  lineZ: 1, molarMass: 28.96546, waterPercent: 0, muGas: 0.0185, muLiquid: 1.0, kappa: 1.4,
  refPreset: "us60", refP: 14.7, refPUnit: "psi", refT: 60, refTUnit: "F", refZ: 1, normalZ: 1, refBasis: "dry",
  qUnit: "scfm", areaMode: "circle", width: 0.5, height: 0.3, flowArea: 0.15, velocity: 10,
  frequency: 100, pulseK: 100, pulseUnit: "L", pulseBasis: "actual",
  signal: 12, signalLow: 4, signalHigh: 20, signalLaw: "linear", rangeLow: 0, rangeHigh: 1000, rangeUnit: "scfm",
  calQ: 100, calUnit: "acfm", calDP: 100, calRho: 9.188773249464356, calY: 1,
  Q: 100, sourceNote: "DEMONSTRATION INPUTS"
};

const METERS = ["venturi","orifice","nozzle","long_nozzle","venturi_nozzle","throat_nozzle","annubar","pitot","cone","wedge","custom_dp","calibrated_dp","velocity","pulse","signal","converter"];

// One tool definition, shared by the page wizard and the main-site Pulse.
export const FLOW_TOOL = {
  name: "solve_flow",
  description: "Compute differential-pressure / flow-meter flow with the deterministic ISO engine (never estimate it yourself). Provide the meter type, fluid, the measured value, geometry, and gas state as plain fields with their units. Returns the flow in several units plus key coefficients, and flags any input still left at a demonstration default.",
  parameters: {
    type: "object",
    properties: {
      element: { type: "string", enum: METERS, description: "meter / calculation type" },
      fluid: { type: "string", enum: ["gas", "liquid"] },
      dp: { type: "number", description: "measured differential pressure value" },
      dpUnit: { type: "string", enum: ["inH2O60","inH2O4","inH2Oconv","mmH2Oconv","Pa","kPa","psi","bar","mbar"], description: "DP unit; 'inches of water' = inH2O60" },
      maxDP: { type: "number", description: "optional documented DP limit, same unit as dp" },
      D: { type: "number", description: "pipe internal diameter value" },
      dUnit: { type: "string", enum: ["in","mm","m"] },
      beta: { type: "number", description: "beta ratio d/D, 0-1" },
      geometryMode: { type: "string", enum: ["ratio","dimension"] },
      feature: { type: "number", description: "bore / throat / opening dimension, in dUnit" },
      cdMode: { type: "string", description: "'auto'/'machined' = let ISO compute C; 'manual' = use entered Cd" },
      Cd: { type: "number", description: "discharge coefficient when cdMode=manual" },
      taps: { type: "string", enum: ["flange","corner","D-D2"] },
      probeK: { type: "number", description: "dimensionless K for averaging-pitot/annubar" },
      profileFactor: { type: "number", description: "mean/local velocity factor for single pitot" },
      expMode: { type: "string", enum: ["auto","manual"] },
      probeY: { type: "number", description: "entered gas expansion factor Y when expMode=manual" },
      lineP: { type: "number", description: "line/upstream static pressure value (gas)" },
      pUnit: { type: "string", enum: ["psi","kPa","bar","Pa","MPa"] },
      pBasis: { type: "string", enum: ["gauge","absolute"], description: "ALWAYS confirm with the user" },
      lineT: { type: "number", description: "flowing temperature value (gas)" },
      tUnit: { type: "string", enum: ["F","C","K","R"] },
      molarMass: { type: "number", description: "gas molar mass kg/kmol; air=28.9647, natural gas ~17-19" },
      densityMode: { type: "string", enum: ["eos","manual"] },
      rhoGas: { type: "number", description: "entered gas density when densityMode=manual" },
      rhoLiquid: { type: "number", description: "liquid density kg/m3 (fluid=liquid)" },
      lineZ: { type: "number", description: "gas compressibility Z (1=ideal)" },
      refPreset: { type: "string", enum: ["us60","us1473","iso15","metric20","normal0","custom"], description: "standard reference for SCFM" },
      qUnit: { type: "string", description: "output flow unit, e.g. scfm, acfm, nm3h, gpm, m3h" },
      velocity: { type: "number", description: "mean velocity m/s (element=velocity)" },
      frequency: { type: "number", description: "pulse frequency Hz (element=pulse)" },
      pulseK: { type: "number", description: "pulses per unit (element=pulse)" },
      signal: { type: "number", description: "signal value (element=signal)" },
      calQ: { type: "number", description: "calibration actual flow (element=calibrated_dp)" },
      calDP: { type: "number", description: "calibration differential (element=calibrated_dp)" },
      calRho: { type: "number", description: "calibration density kg/m3 (element=calibrated_dp)" }
    },
    required: ["element", "fluid"]
  }
};

const num = (x) => (x == null || x === "" ? NaN : Number(x));

export function buildConfig(inp) {
  const c = { ...D, ...(inp || {}) };
  const auto = !!(F.MODES[c.element] && F.MODES[c.element].auto);
  if (inp.cdMode == null) c.cdMode = c.element === "venturi" ? "machined" : auto ? "auto" : "manual";
  if (inp.expMode == null) c.expMode = auto ? "auto" : "manual";
  const gas = c.fluid === "gas", m = c.element, scale = F.LENGTH[c.dUnit];
  const Dm = num(c.D) * scale;
  let beta = num(c.beta);
  if (F.MODES[m].family === "beta" && c.geometryMode === "dimension" && c.solveFor !== "ratio") {
    const feature = num(c.feature) * scale;
    beta = m === "cone" ? F.coneBeta(feature, Dm) : m === "wedge" ? F.wedgeBeta(feature / Dm) : feature / Dm;
  }
  return {
    fluid: c.fluid, element: m, solve: c.solveFor, D: Dm, beta, K: num(c.probeK), Cd: num(c.Cd), cdMode: c.cdMode,
    Y: m === "calibrated_dp" ? num(c.operatingY) : num(c.probeY), expMode: c.expMode, profileFactor: num(c.profileFactor), taps: c.taps,
    dp: num(c.dp) * F.PRESSURE[c.dpUnit], maxDP: (c.maxDP != null && c.maxDP !== "") ? num(c.maxDP) * F.PRESSURE[c.dpUnit] : null, q: num(c.Q), qUnit: c.qUnit,
    densityMode: c.densityMode, rhoGas: num(c.rhoGas) * F.DENSITY[c.gasRhoUnit], rhoLiquid: num(c.rhoLiquid) * F.DENSITY[c.liquidRhoUnit],
    P: gas ? F.absolutePressure(num(c.lineP), c.pUnit, c.pBasis, num(c.atmosphere) * F.PRESSURE[c.atmUnit]) : null,
    T: gas ? F.temperatureK(num(c.lineT), c.tUnit) : null, Z: num(c.lineZ), M: num(c.molarMass), yH2O: num(c.waterPercent) / 100,
    mu: num(gas ? c.muGas : c.muLiquid) * 0.001, kappa: num(c.kappa), refP: num(c.refP) * F.PRESSURE[c.refPUnit], refT: gas ? F.temperatureK(num(c.refT), c.refTUnit) : null,
    refZ: num(c.refZ), normalZ: num(c.normalZ), refBasis: c.refBasis, sourceNote: c.sourceNote,
    areaMode: c.areaMode, width: num(c.width), height: num(c.height), flowArea: num(c.flowArea), velocity: num(c.velocity),
    frequency: num(c.frequency), pulseK: num(c.pulseK), pulseUnit: c.pulseUnit, pulseBasis: c.pulseBasis,
    signal: num(c.signal), signalLow: num(c.signalLow), signalHigh: num(c.signalHigh), signalLaw: c.signalLaw,
    rangeLow: num(c.rangeLow), rangeHigh: num(c.rangeHigh), rangeUnit: c.rangeUnit, calQ: num(c.calQ), calUnit: c.calUnit,
    calDP: num(c.calDP) * F.PRESSURE[c.dpUnit], calRho: num(c.calRho), calY: num(c.calY)
  };
}

const r4 = (n) => (Number.isFinite(n) ? Number(n.toFixed(4)) : n);
const GAS_KEYS = { dp: "ΔP", D: "pipe bore", beta: "beta ratio", lineP: "line pressure", lineT: "flowing temperature", molarMass: "gas molar mass", lineZ: "compressibility Z", refP: "reference pressure", refT: "reference temperature" };

export function solveFlow(inp) {
  inp = inp || {};
  try {
    if (!inp.element) return { error: "Specify the meter type (element), e.g. venturi, orifice, nozzle." };
    const cfg = buildConfig(inp), r = F.solve(cfg), v = r.values || {};
    const unit = inp.qUnit || D.qUnit;
    const out = { ok: true, meter: F.MODES[cfg.element].name, fluid: cfg.fluid, flow: r4(v[unit]), flow_unit: unit };
    if (cfg.fluid === "gas") { out.acfm = r4(v.acfm); out.scfm = r4(v.scfm); out.nm3h = r4(v.nm3h); }
    else { out.gpm = r4(v.gpm); out.m3h = r4(v.m3h); }
    out.mass_kgph = r4(v.kgph);
    if (r.Re != null) out.reynolds = r4(r.Re);
    if (r.Cd != null) out.discharge_coeff_C = r4(r.Cd);
    if (r.K != null) out.coefficient_K = r4(r.K);
    if (r.epsilon != null) out.gas_expansion = r4(r.epsilon);
    const keys = cfg.fluid === "gas" ? GAS_KEYS : { dp: "ΔP", D: "pipe bore", beta: "beta ratio" };
    const dflt = Object.keys(keys).filter((k) => inp[k] == null || inp[k] === "").map((k) => keys[k]);
    if (dflt.length) out.using_default_values_for = dflt;
    out.full_tool = "/education/flow-calculator/ (open for the live graph and a printable spec sheet)";
    return out;
  } catch (e) { return { error: e.message }; }
}
