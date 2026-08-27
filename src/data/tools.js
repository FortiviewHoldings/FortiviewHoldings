// The interactive calculators stay as their own static pages — self-contained,
// already working. The hub links out to them.
export const TOOLS = [
  { href: "/education/calibration/", name: "Calibration Error", cta: "Open tool", desc: "As-Found / As-Left worksheet. Enter your readings, get error as percent of span." },
  { href: "/education/scaling/", name: "Signal Scaling", cta: "Open tool", desc: "Map any input span to any output. mA to engineering units and back, with percent." },
  { href: "/education/square-root/", name: "Square-Root Extraction", cta: "Open tool", desc: "DP flow, both directions. mA to flow and flow to mA, with the difference shown." },
  { href: "/education/rtd/", name: "RTD Tables", cta: "Open tool", desc: "Pt100 and Pt1000 resistance against temperature, IEC 60751. Generate a table." },
  { href: "/education/thermocouple/", name: "Thermocouple Tables", cta: "Open tool", desc: "Types J, K, T, E, N, R, S, B. Millivolts against temperature, ITS-90." },
  { href: "/education/formulas/", name: "Field Formulas", cta: "Open reference", desc: "The working set. mA and percent, scaling, square root, turndown, RTD and thermocouple." },
  { href: "/education/numbering-systems/", name: "Numbering Systems", cta: "Open lab", desc: "The full lab: binary, octal, hex, BCD, ASCII, and two's complement." }
];
