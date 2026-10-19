// The one implementation of the pocket-guide math. Every tool page (form and
// wizard) and the main-site Pulse import these; nothing else computes them.
// Conventions: signals 4-20 mA, % is percent OF SPAN, temps in degrees C,
// RTD per IEC 60751. Thermocouples live in tc-core.js.

// linear scaling: map a value on an input span to an output span. % of span is
// shared by both sides, which is the spine of every transmitter.
export const scale = (x, inLo, inHi, outLo, outHi) => (inHi === inLo ? NaN : outLo + (x - inLo) * (outHi - outLo) / (inHi - inLo));
export const pctSpan = (x, lo, hi) => (hi === lo ? NaN : (x - lo) / (hi - lo) * 100);
export const fromPct = (p, lo, hi) => lo + (p / 100) * (hi - lo);
// hold a value inside a range, lo/hi in either order (reverse-acting and bipolar spans)
export const clamp = (v, a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); return v < lo ? lo : v > hi ? hi : v; };

// calibration error, percent OF SPAN: expected = ideal output for the applied input;
// error% = (actual - expected) / output span * 100. The sign comes from the math.
export const expectedOut = (input, inLo, inHi, outLo, outHi) => scale(input, inLo, inHi, outLo, outHi);
export const errSpan = (actual, expected, outLo, outHi) => { const span = outHi - outLo; return span === 0 ? NaN : (actual - expected) / span * 100; };

// square-root extraction: a DP cell is linear in pressure; flow ~ sqrt(DP).
export const maToPct = (ma) => (ma - 4) / 16 * 100;
export const pctToMa = (p) => 4 + (p / 100) * 16;
export const sqrtExtract = (pctDP) => (pctDP <= 0 ? 0 : Math.sqrt(pctDP / 100) * 100); // %DP -> %Flow
export const sqrtSquare = (pctFlow) => { const f = pctFlow / 100; return f * f * 100; };   // %Flow -> %DP

// RTD: platinum, IEC 60751 / ITS-90, alpha 0.00385 (Callendar-Van Dusen)
export const RTD = {
  A: 3.9083e-3, B: -5.775e-7, C: -4.183e-12,
  res(t, R0) {                             // temperature C -> resistance ohms
    R0 = R0 || 100; const { A, B, C } = this;
    return t >= 0 ? R0 * (1 + A * t + B * t * t) : R0 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t);
  },
  temp(R, R0) {                            // resistance ohms -> temperature C
    R0 = R0 || 100; const A = this.A, B = this.B;
    if (R >= R0) { const disc = A * A - 4 * B * (1 - R / R0); return disc < 0 ? NaN : (-A + Math.sqrt(disc)) / (2 * B); }
    let t = (R / R0 - 1) / A;              // t < 0: Newton-Raphson from a linear seed
    for (let i = 0; i < 60; i++) {
      const f = this.res(t, R0) - R, d = (this.res(t + 1e-3, R0) - this.res(t - 1e-3, R0)) / 2e-3;
      if (d === 0) break;
      const step = f / d; t -= step;
      if (Math.abs(step) < 1e-7) break;
    }
    return t;
  }
};
