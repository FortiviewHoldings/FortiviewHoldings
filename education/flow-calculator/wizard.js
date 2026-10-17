// Flow Calculator — guided chat wizard.
// Minimal AI driving deterministic tools: the model (Pulse, via the gemini
// proxy) only collects inputs in plain language and calls solve_flow / the
// report tools. All physics is the page's own deterministic engine — the model
// never does arithmetic. Mirrors the site's Pulse function-calling loop.

const PROXY = "https://ai.bridgesindust.com/";

const SYSTEM =
  "You are the Flow Calculator wizard for Bridges Industrial. You help a field " +
  "technician set up a differential-pressure / flow calculation by talking, not " +
  "by filling a form. Be brief and plain, like an instrument tech. " +
  "Collect what the calculation needs, asking for ONE thing at a time in plain " +
  "language; never show the user a wall of questions. Translate plain answers " +
  "into the tool's fields yourself (e.g. '4 inch' -> D=4, dUnit=in; 'air' -> " +
  "fluid=gas, molarMass=28.9647; 'venturi' -> element=venturi; '100 inches of " +
  "water' -> dp=100, dpUnit=inH2O60; '100 psi' -> lineP=100, pUnit=psi). " +
  "Pressure and temperature are compensation inputs that move the result — always " +
  "CONFIRM whether a pressure is gauge or absolute (pBasis), and get the flowing " +
  "temperature; do not silently assume them. " +
  "When you have enough, CALL solve_flow with every field you have gathered. Never " +
  "compute in your head — the tool returns the exact numbers; report those. If " +
  "solve_flow returns an error, ask the user for the missing or bad value. If it " +
  "returns unverified_demo_inputs, tell the user those are still example values " +
  "and ask if they want to supply them. " +
  "After a result, state the headline flow plainly. The flow curve and the number " +
  "tables appear right here in the chat automatically, so do not say they are on a " +
  "form or page; just tell the user they can ask for a spec sheet or full report " +
  "any time. When they ask for one, call make_spec_sheet or make_full_report. " +
  "Plain text only — no Markdown, no asterisks, no headings.";

const METERS = ["venturi","orifice","nozzle","long_nozzle","venturi_nozzle","throat_nozzle","annubar","pitot","cone","wedge","custom_dp","calibrated_dp","velocity","pulse","signal","converter"];

const TOOLS = [
  {
    name: "solve_flow",
    description: "Set the flow calculator's inputs and compute, using the deterministic engine. Pass every field you have collected. Returns the computed flow, key coefficients, reference basis, and any inputs still left at demonstration defaults.",
    parameters: {
      type: "object",
      properties: {
        element: { type: "string", enum: METERS, description: "meter / calculation type" },
        fluid: { type: "string", enum: ["gas","liquid"] },
        solveFor: { type: "string", enum: ["flow","dp","ratio","coef","velocity","frequency","signal"], description: "what to solve for; almost always 'flow'" },
        dp: { type: "number", description: "measured differential pressure value" },
        dpUnit: { type: "string", enum: ["inH2O60","inH2O4","inH2Oconv","mmH2Oconv","Pa","kPa","psi","bar","mbar"], description: "DP unit; 'inches of water' = inH2O60" },
        maxDP: { type: "number", description: "optional documented DP limit, same unit as dp" },
        D: { type: "number", description: "pipe internal diameter value" },
        dUnit: { type: "string", enum: ["in","mm","m"] },
        beta: { type: "number", description: "beta ratio d/D, 0-1" },
        geometryMode: { type: "string", enum: ["ratio","dimension"], description: "ratio = enter beta; dimension = enter bore/throat size in 'feature'" },
        feature: { type: "number", description: "bore / throat / opening dimension, in dUnit" },
        cdMode: { type: "string", description: "discharge coefficient source: 'auto'/'machined' to let ISO compute it, or 'manual' to use an entered C" },
        Cd: { type: "number", description: "discharge coefficient when cdMode=manual" },
        taps: { type: "string", enum: ["flange","corner","D-D2"], description: "orifice pressure taps" },
        probeK: { type: "number", description: "dimensionless K for averaging-pitot/annubar" },
        profileFactor: { type: "number", description: "mean/local velocity factor for single pitot" },
        expMode: { type: "string", enum: ["auto","manual"], description: "gas expansion: auto equation or entered Y" },
        probeY: { type: "number", description: "entered gas expansion factor Y when expMode=manual" },
        lineP: { type: "number", description: "line / upstream static pressure value (gas)" },
        pUnit: { type: "string", enum: ["psi","kPa","bar","Pa","MPa"] },
        pBasis: { type: "string", enum: ["gauge","absolute"], description: "ALWAYS confirm this with the user" },
        lineT: { type: "number", description: "flowing temperature value (gas)" },
        tUnit: { type: "string", enum: ["F","C","K","R"] },
        molarMass: { type: "number", description: "gas molar mass in kg/kmol; air=28.9647, natural gas ~17-19" },
        densityMode: { type: "string", enum: ["eos","manual"], description: "eos = compute density from P,T,M,Z; manual = enter density directly" },
        rhoGas: { type: "number", description: "entered gas density when densityMode=manual" },
        rhoLiquid: { type: "number", description: "liquid density, kg/m3 (fluid=liquid)" },
        lineZ: { type: "number", description: "gas compressibility Z (1 = ideal)" },
        refPreset: { type: "string", enum: ["us60","us1473","iso15","metric20","normal0","custom"], description: "standard reference state for SCFM" },
        qUnit: { type: "string", description: "output/graph flow unit, e.g. scfm, acfm, nm3h, gpm, m3h" },
        velocity: { type: "number", description: "mean velocity m/s (element=velocity)" },
        frequency: { type: "number", description: "pulse frequency Hz (element=pulse)" },
        pulseK: { type: "number", description: "pulses per unit (element=pulse)" },
        signal: { type: "number", description: "signal value (element=signal)" },
        calQ: { type: "number", description: "calibration actual flow (element=calibrated_dp)" },
        calDP: { type: "number", description: "calibration differential (element=calibrated_dp)" },
        calRho: { type: "number", description: "calibration density kg/m3 (element=calibrated_dp)" }
      },
      required: ["element","fluid"]
    }
  },
  { name: "make_spec_sheet", description: "Open the deterministic one-page spec sheet (header, graph, data table) for the current result so the user can save it as PDF.", parameters: { type: "object", properties: {} } },
  { name: "make_full_report", description: "Open the full deterministic report (all inputs, equations, conversions, graph, data, sources) for the current result.", parameters: { type: "object", properties: {} } }
];

function runFlowTool(name, args) {
  const UI = window.FlowCalcUI;
  if (!UI) return { error: "calculator not ready" };
  try {
    if (name === "solve_flow") return UI.applyInputs(args || {});
    if (name === "make_spec_sheet") return UI.printReport("spec");
    if (name === "make_full_report") return UI.printReport("full");
    return { error: "unknown tool: " + name };
  } catch (e) { return { error: e.message }; }
}

async function callProxy(contents) {
  const body = JSON.stringify({ system: SYSTEM, contents, tools: TOOLS });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (res.ok) return res.json();
    if ((res.status === 503 || res.status === 429) && attempt < 2) { await new Promise(r => setTimeout(r, 900 * (attempt + 1))); continue; }
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "The wizard is busy — give it a second and try again.");
  }
}

const convo = [];
async function ask(userText) {
  convo.push({ role: "user", parts: [{ text: userText }] });
  for (let step = 0; step < 6; step++) {
    const res = await callProxy(convo);
    if (!res.content) return res.text || "I didn't catch that — try again.";
    convo.push(res.content);
    if (res.functionCall) {
      const result = runFlowTool(res.functionCall.name, res.functionCall.args);
      if (res.functionCall.name === "solve_flow" && result && result.ok) renderResultCard();
      convo.push({ role: "user", parts: [{ functionResponse: { name: res.functionCall.name, response: { result } } }] });
      continue;
    }
    return res.text || "";
  }
  return "That took too many steps — try rephrasing.";
}

// ---- UI ----
const $ = (id) => document.getElementById(id);
const log = () => $("wizLog");
function bubble(role, text) {
  const d = document.createElement("div");
  d.className = "wiz-msg wiz-msg--" + role;
  d.textContent = text;
  log().append(d);
  log().scrollTop = log().scrollHeight;
  return d;
}
function thinking(on) {
  let t = $("wizThinking");
  if (on && !t) { t = document.createElement("div"); t.id = "wizThinking"; t.className = "wiz-msg wiz-msg--pulse wiz-thinking"; t.innerHTML = "<span></span><span></span><span></span>"; log().append(t); log().scrollTop = log().scrollHeight; }
  if (!on && t) t.remove();
}

const fnum = (x) => { const f = window.FlowCalcUI && window.FlowCalcUI.fmt; return f ? f(x) : (x == null ? "—" : String(x)); };
function makeTable(headings, rows) {
  const t = document.createElement("table");
  t.className = "wiz-table";
  if (headings) { const th = document.createElement("thead"), tr = document.createElement("tr"); for (const h of headings) { const c = document.createElement("th"); c.textContent = h; tr.append(c); } th.append(tr); t.append(th); }
  const tb = document.createElement("tbody");
  for (const row of rows) { const tr = document.createElement("tr"); row.forEach((cell, i) => { const td = document.createElement("td"); if (i > 0) td.className = "num"; td.textContent = cell; tr.append(td); }); tb.append(tr); }
  t.append(tb);
  return t;
}
// After a compute, drop the flow curve and number tables straight into the chat.
function renderResultCard() {
  const UI = window.FlowCalcUI, r = UI && UI.getResult();
  if (!r) return;
  const c = UI.getConfig(), v = r.values || {};
  const card = document.createElement("div");
  card.className = "wiz-msg wiz-msg--pulse wiz-result";
  const head = document.createElement("div");
  head.className = "wiz-result__head";
  head.innerHTML = '<span class="wiz-result__lbl"></span><span class="wiz-result__num"></span>';
  head.querySelector(".wiz-result__lbl").textContent = $("resultLabel").textContent;
  head.querySelector(".wiz-result__num").textContent = $("resultValue").textContent + " " + $("resultUnit").textContent;
  card.append(head);
  const g = $("flowGraph");
  if (g) { const gw = document.createElement("div"); gw.className = "wiz-graph"; const clone = g.cloneNode(true); clone.removeAttribute("id"); gw.append(clone); card.append(gw); }
  const rows = [];
  if (c.fluid === "gas") { if (v.acfm != null) rows.push(["Actual flow", fnum(v.acfm) + " ACFM"]); if (v.scfm != null) rows.push(["Standard flow", fnum(v.scfm) + " SCFM"]); if (v.nm3h != null) rows.push(["Normal flow", fnum(v.nm3h) + " Nm³/h"]); }
  else { if (v.gpm != null) rows.push(["Actual flow", fnum(v.gpm) + " US gal/min"]); if (v.m3h != null) rows.push(["Actual flow", fnum(v.m3h) + " m³/h"]); }
  if (v.kgph != null) rows.push(["Total mass", fnum(v.kgph) + " kg/h"]);
  if (r.Re != null) rows.push(["Reynolds number", fnum(r.Re)]);
  if (r.Cd != null) rows.push(["Discharge coeff C", fnum(r.Cd)]);
  if (r.K != null) rows.push(["Flow coeff K", fnum(r.K)]);
  if (r.epsilon != null) rows.push(["Gas expansion ε", fnum(r.epsilon)]);
  const cap1 = document.createElement("div"); cap1.className = "wiz-tcap"; cap1.textContent = "Results";
  card.append(cap1, makeTable(null, rows));
  const cr = UI.getCurve ? UI.getCurve() : [], valid = cr.filter((d) => d.y != null);
  if (valid.length >= 2) {
    const pts = [0, .25, .5, .75, 1].map((f) => valid[Math.round((valid.length - 1) * f)]);
    const heads = UI.getCurveHeadings ? UI.getCurveHeadings() : ["Input", "Flow"];
    const cap2 = document.createElement("div"); cap2.className = "wiz-tcap"; cap2.textContent = "Along the curve";
    card.append(cap2, makeTable(heads, pts.map((d) => [fnum(d.x), fnum(d.y)])));
  }
  const th = $("wizThinking");
  if (th) log().insertBefore(card, th); else log().append(card);
  log().scrollTop = log().scrollHeight;
}

let busy = false;
async function send() {
  const inp = $("wizInput");
  const q = inp.value.trim();
  if (!q || busy) return;
  inp.value = ""; inp.style.height = "";
  bubble("you", q);
  busy = true; $("wizSend").disabled = true; thinking(true);
  try {
    const reply = await ask(q);
    thinking(false);
    bubble("pulse", reply);
  } catch (e) {
    thinking(false);
    bubble("pulse", e.message || "Something went wrong.");
  } finally {
    busy = false; $("wizSend").disabled = false; inp.focus();
  }
}

function init() {
  const form = $("wizForm");
  if (!form) return;
  const fc = document.querySelector(".fc"), mChat = $("modeChat"), mForm = $("modeForm");
  function setMode(chat) {
    if (!fc) return;
    fc.classList.toggle("fc--chat", chat);
    if (mChat) { mChat.classList.toggle("is-active", chat); mChat.setAttribute("aria-selected", String(chat)); }
    if (mForm) { mForm.classList.toggle("is-active", !chat); mForm.setAttribute("aria-selected", String(!chat)); }
  }
  if (mChat) mChat.addEventListener("click", () => setMode(true));
  if (mForm) mForm.addEventListener("click", () => setMode(false));
  form.addEventListener("submit", (e) => { e.preventDefault(); send(); });
  const inp = $("wizInput");
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  inp.addEventListener("input", () => { inp.style.height = "auto"; inp.style.height = Math.min(inp.scrollHeight, 120) + "px"; });
  bubble("pulse", "Hi — I'll set up the calculation with you. Tell me about your meter: the type, the fluid, and what you're reading. For example: \"4-inch venturi on air, reading 100 inches of water at 100 psig and 80 °F.\"");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
