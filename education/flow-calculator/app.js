// Flow Calculator UI. Wires the DOM to the engine; reads nothing off window.
import { FlowCalc } from './engine.js';
import { runAllFlowChecks } from './checks.js';
(function(){
'use strict';
const F=FlowCalc,$=id=>document.getElementById(id),form=$('calcForm');
const n=id=>$(id).value.trim()===''?NaN:Number($(id).value),v=id=>$(id).value,put=(id,x)=>{$(id).value=Number.isFinite(x)?String(x):x??'';},txt=(id,t)=>{$(id).textContent=t;};
const show=(id,on)=>{$(id).hidden=!on;};
let last=null,config=null,previous={},pins=[],curveRows=[],plot=null,lastChecks=null,timer;
function fmt(x,d=7){if(x==null||!Number.isFinite(x))return '—';if(x===0)return '0';return Math.abs(x)<.0001||Math.abs(x)>=1e9?x.toExponential(Math.min(d-1,7)):new Intl.NumberFormat('en-US',{maximumSignificantDigits:d}).format(x);}
function controls(){return [...form.querySelectorAll('input[id],select[id]')];}
function snapshot(){return Object.fromEntries(controls().map(e=>[e.id,e.value]));}
function restore(o){for(const e of controls())if(Object.hasOwn(o,e.id))e.value=o[e.id];}
function toast(t){clearTimeout(timer);txt('toast',t);show('toast',true);timer=setTimeout(()=>show('toast',false),5500);}
function option(el,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;el.append(o);}
function options(id,items,chosen){$(id).replaceChildren();for(const[a,b]of items)option($(id),a,b);if(items.some(i=>i[0]===chosen))put(id,chosen);}
function fillUnits(id,actualOnly=false){$(id).replaceChildren();const gas=v('fluid')==='gas';for(const[kind,label]of Object.entries({actual:'Actual · flowing state',standard:'Standard · selected reference',normal:'Normal · fixed reference',mass:'Mass · total stream'})){
 if(actualOnly&&kind!=='actual'||!gas&&['standard','normal'].includes(kind))continue;
 const g=document.createElement('optgroup');g.label=label;for(const[id,u]of Object.entries(F.UNITS))if(u.kind===kind)option(g,id,u.label);$(id).append(g);}}
for(const group of new Set(Object.values(F.MODES).map(m=>m.group))){const g=document.createElement('optgroup');g.label=group;for(const[id,m]of Object.entries(F.MODES))if(m.group===group)option(g,id,m.name);$('element').append(g);}
fillUnits('qUnit');fillUnits('converterUnit');put('converterUnit','scfm');fillUnits('rangeUnit');fillUnits('calUnit',true);put('qUnit','scfm');put('rangeUnit','scfm');put('calUnit','acfm');
const outUnit=()=>v('element')==='converter'?v('converterUnit'):v('qUnit');
const isDP=m=>['beta','probe','calibrated'].includes(F.MODES[m].family);
function setupMode(reset=false){
 const m=v('element'),type=F.MODES[m],old=v('solveFor'),co=v('cdMode');
 const targets=type.family==='converter'?[['flow','Convert entered flow']]:[['flow','Flow rate Q']];
 if(isDP(m))targets.push(['dp','Differential pressure ΔP']);
 if(type.family==='beta')targets.push(['ratio','Beta / opening size'],['coef','Discharge coefficient C']);
 if(type.family==='probe')targets.push(['ratio','Dimensionless coefficient K']);
 if(m==='velocity')targets.push(['velocity','Mean velocity']);if(m==='pulse')targets.push(['frequency','Pulse frequency']);if(m==='signal')targets.push(['signal','Signal value']);
 options('solveFor',targets,reset?'flow':old);
 const cds=m==='venturi'?[['machined','ISO 5167-4:2022 · machined'],['cast','ISO 5167-4:2022 · as-cast'],['fabricated','ISO 5167-4:2022 · fabricated'],['manual','Entered / calibrated C · constant']]:type.auto?[['auto','ISO correlation · solve C with Reynolds number'],['manual','Entered / calibrated C · constant']]:[['manual','Entered / calibrated C · constant']];
 options('cdMode',cds,reset?undefined:co);
 if(reset){put('geometryMode','ratio');put('expMode',type.auto?'auto':'manual');pins=[];}
 visibility();
}
function visibility(){
 const m=v('element'),f=F.MODES[m].family,gas=v('fluid')==='gas',dp=isDP(m),beta=f==='beta',probe=f==='probe',target=v('solveFor');
 for(const e of document.querySelectorAll('.gas-only,.liquid-only,.meter-only'))e.hidden=(e.classList.contains('gas-only')&&!gas)||(e.classList.contains('liquid-only')&&gas)||(e.classList.contains('meter-only')&&!dp);
 show('atmosphereField',gas&&v('pBasis')==='gauge');show('converterUnitField',m==='converter');show('dpField',dp);show('maxDPField',dp);
 show('geometryCard',beta||probe||m==='velocity'&&v('areaMode')==='circle');
 for(const id of ['beta','geometryMode','feature','cdMode','Cd'])show(id+'Field',beta);
 show('featureField',beta&&(v('geometryMode')==='dimension'||target==='ratio'));
 show('tapsField',m==='orifice');show('probeKField',probe);show('profileFactorField',m==='pitot');
 show('expModeField',beta&&gas&&F.MODES[m].auto);show('probeYField',gas&&(probe||beta&&(!F.MODES[m].auto||v('expMode')==='manual')));
 show('extraCard',['velocity','pulse','signal','calibrated'].includes(f));
 const groups={areaMode:m==='velocity',width:m==='velocity'&&v('areaMode')==='rect',height:m==='velocity'&&v('areaMode')==='rect',flowArea:m==='velocity'&&v('areaMode')==='area',velocity:m==='velocity',frequency:m==='pulse',pulseK:m==='pulse',pulseUnit:m==='pulse',pulseBasis:m==='pulse'&&!['kg','lb'].includes(v('pulseUnit')),signalLaw:m==='signal',signal:m==='signal',signalLow:m==='signal',signalHigh:m==='signal',rangeLow:m==='signal',rangeHigh:m==='signal',rangeUnit:m==='signal',calQ:m==='calibrated_dp',calUnit:m==='calibrated_dp',calDP:m==='calibrated_dp',calRho:m==='calibrated_dp',calY:m==='calibrated_dp'&&gas,operatingY:m==='calibrated_dp'&&gas};
 for(const[id,on]of Object.entries(groups))show(id+'Field',on);
 $('Q').readOnly=target==='flow'&&m!=='converter';$('dp').readOnly=target==='dp';$('beta').readOnly=target==='ratio'||v('geometryMode')==='dimension';$('feature').readOnly=target==='ratio';
 $('probeK').readOnly=probe&&['ratio','coef'].includes(target);$('Cd').readOnly=beta&&(v('cdMode')!=='manual'||target==='coef');
 for(const id of ['velocity','frequency','signal'])$(id).readOnly=target===id;
 $('rhoGas').readOnly=v('densityMode')==='eos';$('lineZ').readOnly=v('densityMode')==='manual';
 txt('flowRole',$('Q').readOnly?'· calculated':'· known input');txt('dpRole',$('dp').readOnly?'· calculated':'· input');
 txt('stateHeading',gas?'Flowing gas conditions':'Flowing liquid properties');
 txt('limitUnit',$('dpUnit').selectedOptions[0].textContent);
 txt('extraHeading',m==='velocity'?'Mean velocity & cross-section':m==='pulse'?'Pulse calibration':m==='signal'?'Transmitter scaling':'DP calibration point');
 const featureLabel=m==='cone'?'Cone diameter dc':m==='wedge'?'Unobstructed wedge opening h':'Throat / bore diameter d';document.querySelector('#featureField label').textContent=featureLabel+' · '+v('dUnit');
 txt('modeNote',{
  venturi:'Classical Venturi tube. Select a construction profile or enter a calibrated discharge coefficient.',orifice:'Sharp-edged concentric orifice plate. The automatic coefficient is iterated with Reynolds number and the selected pressure taps.',nozzle:'ISA 1932 nozzle geometry. Subsonic model with a Reynolds-dependent discharge coefficient.',long_nozzle:'Long-radius flow nozzle. Subsonic model with a Reynolds-dependent discharge coefficient.',venturi_nozzle:'Venturi nozzle. This is distinct from a classical Venturi tube.',throat_nozzle:'Throat-tapped nozzle with entered C and gas Y. No automatic throat-tap calibration is assumed.',annubar:'Averaging pitot type. Enter the dimensionless coefficient for your probe and pipe bore; no brand or serial number is assumed.',pitot:'Single-point pitot. A mean/local velocity factor is required to turn a point velocity into volumetric flow.',cone:'Cone element. β² is open annular area divided by pipe area. Enter calibrated C and gas Y.',wedge:'Wedge element. β² is the open circular-segment area divided by pipe area. Enter calibrated C and gas Y.',custom_dp:'User-defined DP element using Q = K·Y·A·√(2ΔP/ρ). Coefficients must use precisely this convention.',calibrated_dp:'Scale a documented DP/actual-flow calibration point with density and entered expansion corrections.',velocity:'Continuity calculation. Use cross-sectional mean velocity and the actual flowing area.',pulse:'Convert calibrated pulse frequency into actual, reference-volume or mass flow. Pulse K is pulses per stated unit.',signal:'Scale an analog signal into flow or work backward to the signal. Choose linear flow or one square-root extraction from linear DP.',converter:'Convert an already-known flow. No primary element, pipe size or DP is required.'}[m]);
 txt('coefficientNote',probe?'K is a dimensionless DP flow coefficient. It is not a pulse factor, pressure-loss K, or valve Cv. Values here are examples until replaced with calibration data.':v('cdMode')==='manual'?'Entered C is held constant. Calibration must match the geometry, taps, expansion convention and operating range.':'Automatic profiles enforce their numerical limits; they do not verify the physical installation. See the source/edition map below.');
 txt('extraNote',m==='signal'?'Signal units can be mA, V or percent provided all three signal values use the same unit. Defaults are 4–20 mA. The square-root mode requires a zero-based flow range.':m==='pulse'?'For a meter reporting reference volume or mass, select that basis rather than assuming its pulses represent actual volume.':m==='velocity'?'All velocities are mean velocities in m/s; rectangular dimensions are metres and direct area is m².':'Calibration flow is actual volume at the calibration density. Calibration DP and operating DP use the same selected unit.');
 for(const op of $('curveType').options)if(['pressure','temperature'].includes(op.value))op.disabled=!gas;
 if(!gas&&['pressure','temperature'].includes(v('curveType')))put('curveType','response');
 show('overlayLine',gas&&['standard','normal'].includes(F.UNITS[outUnit()].kind)&&['response','pressure','temperature'].includes(v('curveType')));
}
function readConfiguration(){
 const gas=v('fluid')==='gas',m=v('element'),scale=F.LENGTH[v('dUnit')],D=n('D')*scale;let beta=n('beta');
 if(F.MODES[m].family==='beta'&&v('geometryMode')==='dimension'&&v('solveFor')!=='ratio'){
  const feature=n('feature')*scale;beta=m==='cone'?F.coneBeta(feature,D):m==='wedge'?F.wedgeBeta(feature/D):feature/D;
 }
 return {fluid:v('fluid'),element:m,solve:v('solveFor'),D,beta,K:n('probeK'),Cd:n('Cd'),cdMode:v('cdMode'),Y:m==='calibrated_dp'?n('operatingY'):n('probeY'),expMode:v('expMode'),profileFactor:n('profileFactor'),taps:v('taps'),
 dp:n('dp')*F.PRESSURE[v('dpUnit')],maxDP:Number.isFinite(n('maxDP'))?n('maxDP')*F.PRESSURE[v('dpUnit')]:null,q:n('Q'),qUnit:v('qUnit'),
 densityMode:v('densityMode'),rhoGas:n('rhoGas')*F.DENSITY[v('gasRhoUnit')],rhoLiquid:n('rhoLiquid')*F.DENSITY[v('liquidRhoUnit')],
 P:gas?F.absolutePressure(n('lineP'),v('pUnit'),v('pBasis'),n('atmosphere')*F.PRESSURE[v('atmUnit')]):null,T:gas?F.temperatureK(n('lineT'),v('tUnit')):null,Z:n('lineZ'),M:n('molarMass'),yH2O:n('waterPercent')/100,
 mu:n(gas?'muGas':'muLiquid')*.001,kappa:n('kappa'),refP:n('refP')*F.PRESSURE[v('refPUnit')],refT:gas?F.temperatureK(n('refT'),v('refTUnit')):null,refZ:n('refZ'),normalZ:n('normalZ'),refBasis:v('refBasis'),sourceNote:v('coefficientSource'),
 areaMode:v('areaMode'),width:n('width'),height:n('height'),flowArea:n('flowArea'),velocity:n('velocity'),frequency:n('frequency'),pulseK:n('pulseK'),pulseUnit:v('pulseUnit'),pulseBasis:v('pulseBasis'),
 signal:n('signal'),signalLow:n('signalLow'),signalHigh:n('signalHigh'),signalLaw:v('signalLaw'),rangeLow:n('rangeLow'),rangeHigh:n('rangeHigh'),rangeUnit:v('rangeUnit'),calQ:n('calQ'),calUnit:v('calUnit'),calDP:n('calDP')*F.PRESSURE[v('dpUnit')],calRho:n('calRho'),calY:n('calY')};
}
function basis(s){return s.fluid==='liquid'?'Actual liquid volume at the entered density. No standard-gas basis.':fmt(F.temperatureFromK(s.refT,'F'),8)+' °F / '+fmt(s.refP/F.PSI,8)+' psia · '+fmt(s.refT-273.15,8)+' °C / '+fmt(s.refP/1000,8)+' kPa abs · Zs '+fmt(s.refZ)+' · '+(s.refBasis==='dry'?'dry gas':'total mixture');}
function dimForBeta(m,b,D){if(m==='cone')return D*Math.sqrt(1-b*b);if(m==='wedge'){let lo=1e-9,hi=1-1e-9;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(F.wedgeBeta(mid)<b)lo=mid;else hi=mid;}return D*(lo+hi)/2;}return D*b;}
function datum(label,val){const d=document.createElement('div');d.className='datum';const a=document.createElement('small'),b=document.createElement('span');a.textContent=label;b.textContent=val;d.append(a,b);$('stateNumbers').append(d);}
function step(title,formula,note=''){const d=document.createElement('div');d.className='work-step';const h=document.createElement('strong'),f=document.createElement('div'),p=document.createElement('p');h.textContent=title;f.className='formula';f.textContent=formula;p.textContent=note;d.append(h,f,p);$('workContent').append(d);}
function renderWork(r,c){
 $('workContent').replaceChildren();const s=r.state,m=c.element,f=F.MODES[m].family;
 if(s.fluid==='gas')step('1 · Absolute gas state','P₁ = '+fmt(s.P,11)+' Pa absolute\nT₁ = '+fmt(s.T,11)+' K\nMmix = '+fmt(s.M,11)+' kg/mol\nρ₁ = P₁·Mmix / (Z₁·R·T₁) = '+fmt(s.rho,11)+' kg/m³\nZ₁ = '+fmt(s.Z,11),'R = 8.31446261815324 J/(mol·K). With entered density, the same equation derives the implied Z.');
 else step('1 · Flowing density','ρ₁ = '+fmt(s.rho,11)+' kg/m³','Entered liquid property; no automatic temperature correction.');
 if(f==='beta'){
  step('2 · Primary-element equation','A = πD²/4 = '+fmt(r.area,11)+' m²\nβ = '+fmt(r.beta,11)+'; C = '+fmt(r.Cd,11)+'; ε = '+fmt(r.epsilon,11)+'\nQa = C·ε·A·β² / √(1−β⁴) · √(2ΔP/ρ₁)\nQa = '+fmt(r.qa,11)+' m³/s\nΔP = '+fmt(r.dp,11)+' Pa','Inverse calculations solve this same equation. Gas expansion is recalculated at each trial when an automatic expansion model is selected.');
  if(m==='orifice'&&c.cdMode==='auto')step('3 · Reader–Harris/Gallagher coefficient','ReD = 4ρQa/(πDμ) = '+fmt(r.Re,11)+'\nA_RHG = (19000β/ReD)^0.8\nM′₂ = 2L′₂/(1−β)\nC = 0.5961 + 0.0261β² − 0.216β⁸\n  + 0.000521(10⁶β/ReD)^0.7\n  + (0.0188+0.0063A_RHG)β^3.5(10⁶/ReD)^0.3\n  + (0.043+0.080e^(−10L₁)−0.123e^(−7L₁))\n    ·(1−0.11A_RHG)β⁴/(1−β⁴)\n  − 0.031(M′₂−0.8M′₂^1.1)β^1.3\nFor D<71.12 mm add 0.011(0.75−β)(2.8−Dmm/25.4).\nC = '+fmt(r.Cd,11),'Tap coefficients: corner L₁=L′₂=0; flange both 25.4/Dmm; D–D/2 uses L₁=1, L′₂=0.47. S2.');
  if(['nozzle','long_nozzle','venturi_nozzle'].includes(m)&&c.cdMode==='auto')step('3 · Nozzle discharge coefficient',({nozzle:'C = 0.9900 − 0.2262β^4.1\n  − (0.00175β²−0.0033β^4.15)(10⁶/ReD)^1.15',long_nozzle:'C = 0.9965 − 0.00653√(10⁶β/ReD)',venturi_nozzle:'C = 0.9858 − 0.196β^4.5'})[m]+'\nC = '+fmt(r.Cd,11)+'; ReD = '+fmt(r.Re,11),'Equation and checked limits from the ISO nozzle source identified in S3.');
  if(s.fluid==='gas')step('4 · Expansion is separate from compressibility Z',c.expMode==='manual'||!F.MODES[m].auto?'ε = entered Y = '+fmt(r.epsilon,11):m==='orifice'?'τ = 1−ΔP/P₁\nε = 1−(0.351+0.256β⁴+0.93β⁸)(1−τ^(1/κ))\nε = '+fmt(r.epsilon,11):'τ = 1−ΔP/P₁\nε² = [κτ^(2/κ)/(κ−1)]\n   ·[(1−β⁴)/(1−β⁴τ^(2/κ))]\n   ·[(1−τ^((κ−1)/κ))/(1−τ)]\nε = '+fmt(r.epsilon,11),'Automatic models require τ ≥ 0.75; entered-Y calculations use a conservative ΔP/P ≤ 0.10 software envelope.');
  if(m==='cone')step('Geometry · cone','β = √[1−(dc/D)²]\nOpen area = A·β²','Entered C and Y only; no proprietary geometry correlation.');
  if(m==='wedge')step('Geometry · wedge','u = 1−2h/D\nβ = √{[acos(u)−u√(1−u²)]/π}\nOpen area = A·β²','h is the height of the unobstructed circular segment.');
 }else if(f==='probe')step('2 · DP coefficient equation','Qa = K·Y·A·√(2ΔP/ρ₁)'+(m==='pitot'?' · f_profile':'')+'\nA = '+fmt(r.area,11)+' m²\nK = '+fmt(r.K,11)+'; Y = '+fmt(r.epsilon,11)+'\nQa = '+fmt(r.qa,11)+' m³/s; ΔP = '+fmt(r.dp,11)+' Pa','K is dimensionless in precisely this equation. For single-point pitot, f_profile = mean velocity / local velocity.');
 else if(m==='calibrated_dp')step('2 · Calibration-point scaling','Qa = Qcal·√[(ΔP/ΔPcal)(ρcal/ρ₁)]·(Y/Ycal)\nQcal = '+fmt(c.calQ)+' '+F.UNITS[c.calUnit].label+'\nρcal = '+fmt(c.calRho)+' kg/m³; ΔPcal = '+fmt(c.calDP)+' Pa\nQa = '+fmt(r.qa,11)+' m³/s','Calibration flow is actual volume at the calibration state. The coefficient must remain valid.');
 else if(m==='velocity')step('2 · Continuity','Qa = v̄·A\nA = '+fmt(r.area,11)+' m²; v̄ = '+fmt(r.velocity,11)+' m/s\nQa = '+fmt(r.qa,11)+' m³/s','The velocity must be the area-average.');
 else if(m==='pulse')step('2 · Pulse factor','Flow in counted units/s = frequency / Kpulse\nf = '+fmt(r.frequency,11)+' Hz\nKpulse = '+fmt(c.pulseK,11)+' pulses/'+c.pulseUnit+'\nQa = '+fmt(r.qa,11)+' m³/s','The selected pulse basis is converted into actual flow using the same reference state and density as all other conversions.');
 else if(m==='signal')step('2 · Analog scaling','x = (signal−low)/(high−low)\nQ = Qlow + (Qhigh−Qlow)·'+(c.signalLaw==='sqrt'?'√x':'x')+'\nSignal = '+fmt(r.signal,11)+'; low = '+c.signalLow+'; high = '+c.signalHigh+'\nQa = '+fmt(r.qa,11)+' m³/s','The range uses '+F.UNITS[c.rangeUnit].label+'. Square-root extraction is not applied to an already-linear flow signal.');
 else step('2 · Convert known flow',fmt(c.q,11)+' '+F.UNITS[c.qUnit].label+'\nQa = '+fmt(r.qa,11)+' m³/s','Actual volume, reference volume and mass are distinct bases.');
 step('5 · Mass conservation','ṁ = ρ₁·Qa = '+fmt(s.rho,11)+' × '+fmt(r.qa,11)+'\nṁ = '+fmt(r.mass,11)+' kg/s','Total mass includes separately entered water vapor.');
 if(s.fluid==='gas'){
  step('6 · Selected standard volume','Qs = Qa·(P₁/Ps)·(Ts/T₁)·(Zs/Z₁)·f\n   = '+fmt(r.qa,10)+' × ('+fmt(s.P,10)+'/'+fmt(s.refP,10)+')\n   × ('+fmt(s.refT,10)+'/'+fmt(s.T,10)+') × ('+fmt(s.refZ,10)+'/'+fmt(s.Z,10)+') × '+fmt(s.referenceFraction,10)+'\nSCFM = Qs × 60 / 0.028316846592\nSCFM = '+fmt(r.values.scfm,11),'f = 1 for total mixture or 1−yH₂O for dry-gas reporting. The selected reference applies to all S-prefixed units.');
  step('7 · Normal volume','Qn = Qa·(P₁/101325)·(273.15/T₁)·(Zn/Z₁)·f\nQn × 3600 = '+fmt(r.values.nm3h,11)+' Nm³/h','0 °C and 101.325 kPa absolute; independent of the selected standard-reference preset.');
 }
}
function conversions(r){$('conversionRows').replaceChildren();for(const kind of ['actual','standard','normal','mass']){const rows=Object.entries(F.UNITS).filter(([id,u])=>u.kind===kind&&id in r.values);if(!rows.length)continue;const tr=document.createElement('tr'),th=document.createElement('td');tr.className='group-row';th.colSpan=2;th.textContent=kind==='standard'?'Selected reference · '+r.state.refBasis:kind==='normal'?'Normal · 0 °C / 101.325 kPa abs':kind==='mass'?'Total stream mass':'Actual volume · flowing conditions';tr.append(th);$('conversionRows').append(tr);for(const[id,u]of rows){const tr=document.createElement('tr'),a=document.createElement('td'),b=document.createElement('td');a.textContent=u.label;b.textContent=fmt(r.values[id],10);b.className='value';tr.append(a,b);$('conversionRows').append(tr);}}txt('tableBasis',basis(r.state));}
// ---- Print documents. Built fresh on beforeprint from the current result,
//      not by printing the live form. Spec sheet = head + specs + graph + data
//      points; Full report adds conversions, state, equations and sources.
function specRows(r,c){
 const du=$('dpUnit').selectedOptions[0].textContent,dU=v('dUnit'),rows=[],add=(k,x,wide)=>rows.push({k,x,wide});
 add('Fluid',c.fluid==='gas'?'Gas · single phase':'Liquid');
 if(c.fluid==='gas'){add('Line pressure',fmt(r.state.P/1000,7)+' kPa abs');add('Flowing temperature',fmt(r.state.T-273.15,6)+' °C · '+fmt(F.temperatureFromK(r.state.T,'F'),6)+' °F');}
 add('Flowing density',fmt(r.state.rho,7)+' kg/m³');
 if(r.dp!=null)add('Differential pressure',fmt(r.dp/F.PRESSURE[v('dpUnit')],7)+' '+du);
 if(r.dp!=null&&c.maxDP!=null)add('Documented DP limit',fmt(c.maxDP/F.PRESSURE[v('dpUnit')],7)+' '+du);
 if(r.beta!=null||r.K!=null||(c.element==='velocity'&&c.areaMode==='circle'))add('Pipe internal diameter',fmt(c.D/F.LENGTH[dU],6)+' '+dU);
 else if(r.area!=null)add('Flow area',fmt(r.area,6)+' m²');
 if(r.beta!=null){add('Beta ratio β',fmt(r.beta,6));add(c.element==='cone'?'Cone diameter dc':c.element==='wedge'?'Opening h':'Bore / throat d',fmt(dimForBeta(c.element,r.beta,c.D)/F.LENGTH[dU],6)+' '+dU);add('Discharge coefficient C',fmt(r.Cd,6));}
 if(r.K!=null)add('Flow coefficient K',fmt(r.K,6));
 if(r.Re!=null)add('Pipe Reynolds number',fmt(r.Re,6));
 if(r.epsilon!=null)add('Gas expansion ε / Y',fmt(r.epsilon,6));
 add('Reference basis',basis(r.state),true);
 if(c.sourceNote)add('Source note',c.sourceNote,true);
 add('Generated',new Date().toLocaleString(),true);
 return rows;
}
function psSection(title,cls){const s=document.createElement('section');s.className='ps-section'+(cls?' '+cls:'');if(title){const h=document.createElement('h2');h.className='ps-h';h.textContent=title;s.append(h);}return s;}
function psTable(headings,rows){const w=document.createElement('div');w.className='ps-tablewrap';const t=document.createElement('table');t.className='ps-table';const thead=document.createElement('thead'),htr=document.createElement('tr');for(const h of headings){const th=document.createElement('th');th.textContent=h;htr.append(th);}thead.append(htr);const tb=document.createElement('tbody');for(const row of rows){const tr=document.createElement('tr');row.forEach((val,i)=>{const td=document.createElement('td');if(i>0)td.className='num';td.textContent=val;tr.append(td);});tb.append(tr);}t.append(thead,tb);w.append(t);return w;}
function buildPrintSheet(){
 const host=$('printSheet');host.replaceChildren();
 if(!last){const p=document.createElement('p');p.className='ps-note';p.textContent='No valid calculation to print — correct the inputs and try again.';host.append(p);return;}
 const r=last,c=config;
 const head=document.createElement('header');head.className='ps-head';
 const brand=document.createElement('div');brand.innerHTML='<div class="ps-title">Flow Calculator</div><div class="ps-sub"></div>';
 brand.querySelector('.ps-sub').textContent=F.MODES[c.element].name+' · '+(c.fluid==='gas'?'gas':'liquid');
 const res=document.createElement('div');res.className='ps-result';res.innerHTML='<div class="ps-result__l"></div><div class="ps-result__v"></div>';
 res.querySelector('.ps-result__l').textContent=$('resultLabel').textContent;res.querySelector('.ps-result__v').textContent=$('resultValue').textContent+' '+$('resultUnit').textContent;
 head.append(brand,res);host.append(head);
 const specs=psSection('Specifications'),grid=document.createElement('div');grid.className='ps-grid';
 for(const row of specRows(r,c)){const d=document.createElement('div');d.className='ps-field'+(row.wide?' ps-field--wide':'');const k=document.createElement('span'),x=document.createElement('span');k.className='ps-field__k';x.className='ps-field__v';k.textContent=row.k;x.textContent=row.x;d.append(k,x);grid.append(d);}
 specs.append(grid);host.append(specs);
 const gs=psSection('Flow response curve','ps-graph'),g=$('flowGraph').cloneNode(true);g.removeAttribute('id');gs.append(g);
 const cap=$('dpLimitNote').textContent;if(cap){const p=document.createElement('p');p.className='ps-note';p.textContent=cap;gs.append(p);}
 host.append(gs);
 const cd=psSection('Curve data points','ps-curve');const xh=$('curveXHeading').textContent,yh=$('curveYHeading').textContent;
 const crows=[];for(let i=0;i<curveRows.length;i+=8){const d=curveRows[i];crows.push([fmt(d.x,7),d.y==null?'excluded':fmt(d.y,7),d.y==null?(d.status||''):'']);}
 cd.append(psTable([xh,yh,'Note'],crows));host.append(cd);
 const conv=psSection('Flow conversions · actual / standard / normal / mass','ps-full');const ct=$('conversionRows').closest('table').cloneNode(true);ct.className='ps-table';const cw=document.createElement('div');cw.className='ps-tablewrap';if($('tableBasis').textContent){const cap2=document.createElement('p');cap2.className='ps-cap';cap2.textContent=$('tableBasis').textContent;conv.append(cap2);}cw.append(ct);conv.append(cw);host.append(conv);
 const diag=psSection('Calculated state & diagnostics','ps-full');diag.append($('stateNumbers').cloneNode(true));host.append(diag);
 const work=psSection('Calculation · equations & substitutions','ps-full');work.append($('workContent').cloneNode(true));host.append(work);
 const warn=psSection('Assumptions & applicability','ps-full warnings');warn.append($('warningContent').cloneNode(true));host.append(warn);
 const sg=$('sourceDetails').querySelector('.source-grid');if(sg){const src=psSection('Standards & sources','ps-full');src.append(sg.cloneNode(true));host.append(src);}
}
function update(draw=true){
 visibility();
 try{
  const c=readConfiguration(),r=F.solve(c);last=r;config=c;show('errorPanel',false);
  if($('Q').readOnly)put('Q',F.actualToFlow(r.qa,c.qUnit,r.state));if($('dp').readOnly)put('dp',r.dp/F.PRESSURE[v('dpUnit')]);
  if(r.beta!=null){if($('beta').readOnly)put('beta',r.beta);if(c.solve==='ratio')put('feature',dimForBeta(c.element,r.beta,c.D)/F.LENGTH[v('dUnit')]);}
  if($('probeK').readOnly&&r.K!=null)put('probeK',r.K);if($('Cd').readOnly)put('Cd',r.Cd);
  for(const id of ['velocity','frequency','signal'])if($(id).readOnly)put(id,r[id]);
  if(c.fluid==='gas')put(c.densityMode==='eos'?'rhoGas':'lineZ',c.densityMode==='eos'?r.state.rho/F.DENSITY[v('gasRhoUnit')]:r.state.Z);
  let value=r.values[outUnit()],unit=F.UNITS[outUnit()].label,label=c.element==='converter'?'Converted flow · selected unit':'Calculated flow';
  if(c.solve==='dp'){value=r.dp/F.PRESSURE[v('dpUnit')];unit=$('dpUnit').selectedOptions[0].textContent;label='Calculated differential pressure';}
  if(c.solve==='ratio'){value=r.beta??r.K;unit=r.beta!=null?'β · dimensionless':'K · dimensionless';label=r.beta!=null?'Calculated beta ratio':'Inferred flow coefficient';}
  if(c.solve==='coef'){value=r.inferredCoefficient;unit='C · dimensionless';label='Inferred discharge coefficient';}
  if(['velocity','frequency','signal'].includes(c.solve)){value=r[c.solve];unit={velocity:'m/s',frequency:'Hz',signal:'signal units'}[c.solve];label='Calculated '+c.solve;}
  txt('resultLabel',label);txt('resultValue',fmt(value,8));txt('resultUnit',unit);txt('statusPill',r.status);txt('resultCaption',F.MODES[c.element].name+' · '+fmt(r.values[outUnit()],8)+' '+F.UNITS[outUnit()].label);txt('resultBasis',basis(r.state));txt('referencePreview',basis(r.state));
  txt('kpi1',fmt(c.fluid==='gas'?r.values.acfm:r.values.gpm));txt('kpiUnit1',c.fluid==='gas'?'ACFM':'US gal/min');txt('kpiLabel2',c.fluid==='gas'?'Normal flow':'Actual metric');txt('kpi2',fmt(c.fluid==='gas'?r.values.nm3h:r.values.m3h));txt('kpiUnit2',c.fluid==='gas'?'Nm³/h':'m³/h');txt('kpi3',fmt(r.values.kgph));
  txt('geometryResult',r.beta!=null?'β '+fmt(r.beta)+' · '+(c.element==='cone'?'cone diameter ':c.element==='wedge'?'opening h ':'bore d ')+fmt(dimForBeta(c.element,r.beta,c.D)/F.LENGTH[v('dUnit')])+' '+v('dUnit')+' · C '+fmt(r.Cd):r.K!=null?'K '+fmt(r.K)+' · area '+fmt(r.area)+' m²':r.area!=null?'Flow area '+fmt(r.area)+' m²':'');
  $('stateNumbers').replaceChildren();datum('Flowing density',fmt(r.state.rho,9)+' kg/m³');if(c.fluid==='gas'){datum('Line absolute pressure',fmt(r.state.P/1000,9)+' kPa abs');datum('Flowing absolute temperature',fmt(r.state.T,9)+' K');datum('Flowing Z',fmt(r.state.Z,9));datum('Standard / actual factor',fmt(r.state.standardFactor,9));datum('Reference density',fmt(r.state.rhoRef,9)+' kg/m³');}
  if(r.dp!=null){datum('Differential pressure',fmt(r.dp/F.PRESSURE[v('dpUnit')],9)+' '+$('dpUnit').selectedOptions[0].textContent);if(c.maxDP!=null)datum('User-entered DP limit',fmt(c.maxDP/F.PRESSURE[v('dpUnit')])+' '+$('dpUnit').selectedOptions[0].textContent);}
  for(const[key,title,unit]of [['Re','Pipe Reynolds number',''],['Cd','Discharge coefficient C',''],['K','Dimensionless coefficient K',''],['epsilon','Gas expansion ε / Y',''],['velocity','Mean velocity',' m/s'],['frequency','Frequency',' Hz'],['signal','Analog signal',''],['mach','Estimated pipe Mach',''],['throatMach','Estimated throat Mach','']])if(r[key]!=null)datum(title,fmt(r[key],9)+unit);
  renderWork(r,c);conversions(r);$('warningContent').replaceChildren();for(const w of r.warnings){const p=document.createElement('p');p.textContent=w;$('warningContent').append(p);}if(!r.warnings.length){const p=document.createElement('p');p.textContent='Verify the original measurement and input properties. Unit conversion is not instrument calibration.';$('warningContent').append(p);}
  for(const id of ['csvButton','jsonButton','pinButton'])$(id).disabled=false;
 }catch(e){
  last=null;config=null;show('errorPanel',true);txt('errorText',e.message);txt('statusPill','NO CURRENT RESULT');txt('resultValue','—');txt('resultUnit','');txt('resultCaption','Correct the highlighted calculation inputs.');txt('resultBasis','Previous results and curves are cleared.');txt('referencePreview','No valid calculation.');
  for(const id of ['kpi1','kpi2','kpi3'])txt(id,'—');for(const id of ['stateNumbers','workContent','conversionRows','warningContent'])$(id).replaceChildren();txt('geometryResult','No valid result.');
  for(const id of ['Q','dp','beta','probeK','Cd','velocity','frequency','signal','rhoGas','lineZ'])if($(id).readOnly)put(id,'');
  for(const id of ['csvButton','jsonButton','pinButton'])$(id).disabled=true;
 }
 if(draw)drawCurve();previous=snapshot();return last;
}
function driving(c,r){if(isDP(c.element))return {value:r.dp/F.PRESSURE[v('dpUnit')],label:'ΔP ['+$('dpUnit').selectedOptions[0].textContent+']'};if(c.element==='velocity')return {value:r.velocity,label:'Mean velocity [m/s]'};if(c.element==='pulse')return {value:r.frequency,label:'Frequency [Hz]'};if(c.element==='signal')return {value:r.signal,label:'Signal [configured units]'};return {value:F.actualToFlow(r.qa,v('qUnit'),r.state),label:'Input flow ['+F.UNITS[v('qUnit')].label+']'};}
function fixedConfig(c,r){return {...c,solve:'flow',beta:r.beta??c.beta,K:r.K??c.K,Cd:r.Cd??c.Cd,dp:r.dp??c.dp,cdMode:c.solve==='coef'?'manual':c.cdMode,q:c.element==='converter'?c.q:r.values[c.qUnit],velocity:r.velocity??c.velocity,frequency:r.frequency??c.frequency,signal:r.signal??c.signal};}
function point(c,r,x,kind){let cc=fixedConfig(c,r);if(kind==='pressure'||kind==='temperature'){
 if(c.densityMode!=='eos')throw Error('Pressure/temperature sweeps require density calculated from P, T, M and Z; an entered density is valid only at its supplied state.');
 if(kind==='pressure')cc.P=F.absolutePressure(x,v('pUnit'),v('pBasis'),n('atmosphere')*F.PRESSURE[v('atmUnit')]);else cc.T=F.temperatureK(x,v('tUnit'));
 }else if(kind==='inverse'){
  cc.q=x;cc.qUnit=outUnit();cc.solve=isDP(c.element)?'dp':c.element==='velocity'?'velocity':c.element==='pulse'?'frequency':c.element==='signal'?'signal':'flow';
 }else{let value=kind==='normalized'?driving(c,r).value*x/100:x;
  if(c.element==='signal'&&kind==='normalized')value=c.signalLow+(c.signalHigh-c.signalLow)*x/100;
  if(isDP(c.element))cc.dp=value*F.PRESSURE[v('dpUnit')];else if(c.element==='velocity')cc.velocity=value;else if(c.element==='pulse')cc.frequency=value;else if(c.element==='signal')cc.signal=value;else{cc.q=value;cc.qUnit=v('qUnit');}}
 const rr=F.solve(cc);
 if(rr.qa===0&&F.MODES[cc.element].auto&&cc.cdMode!=='manual')throw Error('Zero-flow endpoint: Reynolds number is outside the standard correlation.');
 const output=F.actualToFlow(rr.qa,outUnit(),rr.state);
 let y=kind==='inverse'?driving(cc,rr).value:kind==='normalized'?(c.element==='signal'?(rr.qa-F.flowToActual(c.rangeLow,c.rangeUnit,rr.state))/(F.flowToActual(c.rangeHigh,c.rangeUnit,rr.state)-F.flowToActual(c.rangeLow,c.rangeUnit,rr.state))*100:rr.qa/r.qa*100):output;
 if(!Number.isFinite(y))throw Error('Normalization requires a nonzero reference flow.');
 return {x,y,actual:rr.qa/F.UNITS[outUnit()].factor,qa:rr.qa,dp:rr.dp,Re:rr.Re,Cd:rr.Cd,Y:rr.epsilon,P:rr.state.P,T:rr.state.T,output,result:rr,status:rr.warnings.some(w=>w.startsWith('USER-ENTERED'))?'User DP limit exceeded':'Calculated'};
}
function autoRange(){if(!last){put('curveMin',0);put('curveMax',200);return;}const kind=v('curveType'),d=driving(config,last);let lo=0,hi=Math.max(1,d.value*1.6);
 if(kind==='inverse')hi=Math.max(1,last.values[outUnit()]*1.6);if(kind==='normalized'){lo=0;hi=100;}
 if(kind==='pressure'){const p=last.state.P,scale=F.PRESSURE[v('pUnit')],at=v('pBasis')==='gauge'?n('atmosphere')*F.PRESSURE[v('atmUnit')]:0;lo=(p*.5-at)/scale;hi=(p*1.5-at)/scale;}
 if(kind==='temperature'){lo=F.temperatureFromK(Math.max(1,last.state.T-30),v('tUnit'));hi=F.temperatureFromK(last.state.T+70,v('tUnit'));}
 if(config.element==='signal'&&kind==='response'){lo=config.signalLow;hi=config.signalHigh;}
 if(kind==='response'&&isDP(config.element)&&config.maxDP!=null){const lim=config.maxDP/F.PRESSURE[v('dpUnit')];if(Number.isFinite(lim)&&lim>0)hi=Math.max(hi,lim*1.12);}
 put('curveMin',Number(lo.toPrecision(8)));put('curveMax',Number(hi.toPrecision(8)));}
const NS='http://www.w3.org/2000/svg';function svg(tag,attrs={},text=''){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text)e.textContent=text;return e;}
function drawCurve(){
 const graph=$('flowGraph');graph.replaceChildren();$('curveLegend').replaceChildren();$('curveTable').replaceChildren();curveRows=[];plot=null;txt('curveReadout','Move across the graph to inspect values.');txt('dpLimitNote','');
 for(const id of ['curveCSV','curveSVG'])$(id).disabled=!last;
 if(!last){graph.append(svg('text',{x:400,y:180,'text-anchor':'middle'},'No valid calculation to plot.'));txt('curveNote','Correct the calculation inputs to restore the curve.');return;}
 const kind=v('curveType'),lo=n('curveMin'),hi=n('curveMax');if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<=lo){graph.append(svg('text',{x:400,y:180,'text-anchor':'middle'},'Enter a finite X end greater than X start.'));for(const id of ['curveCSV','curveSVG'])$(id).disabled=true;txt('curveNote','Invalid graph range.');return;}
 const driver=driving(config,last),unit=F.UNITS[outUnit()],kindLabels={pressure:'Line pressure ['+v('pUnit')+' '+v('pBasis')+']',temperature:'Flowing temperature ['+v('tUnit')+']',inverse:'Flow ['+unit.label+']',normalized:'Driving input [% of reference span]'};
 const overlay=$('actualOverlay').checked&&!$('overlayLine').hidden;
 const dimensionNames={scfm:'ft³/min',scfh:'ft³/h',scfd:'ft³/day',mscfd:'10³ ft³/day',mmscfd:'10⁶ ft³/day',sm3h:'m³/h',sm3d:'m³/day',slmin:'L/min',sccm:'cm³/min',nm3h:'m³/h',nm3d:'m³/day',nlmin:'L/min'};
 const xLabel=kindLabels[kind]||driver.label,yLabel=kind==='inverse'?driver.label:kind==='normalized'?'Flow [% of reference span]':'Flow ['+(overlay?(dimensionNames[outUnit()]+' · basis per curve'):unit.label)+']';
 const series=[{c:config,r:last,name:'Current · '+unit.label,cls:'line'}];for(let i=0;i<pins.length;i++)series.push({...pins[i],cls:'line pin'+i});
 const all=[];for(const s of series){const data=[];for(let i=0;i<=160;i++){const x=lo+(hi-lo)*i/160;try{data.push(point(s.c,s.r,x,kind));}catch(e){data.push({x,y:null,status:e.message});}}s.data=data;all.push(...data.filter(d=>d.y!=null).map(d=>d.y));}
 curveRows=series[0].data;if(overlay)all.push(...curveRows.filter(d=>d.y!=null).map(d=>d.actual));
 const normalizedIdeal=kind==='normalized'&&isDP(config.element)&&lo>=0;if(normalizedIdeal)all.push(100*Math.sqrt(hi/100));
 const valid=curveRows.filter(d=>d.y!=null),invalid=curveRows.length-valid.length;
 const W=800,H=385,L=83,R=27,T=24,B=63,gw=W-L-R,gh=H-T-B;
 let ymin=Math.min(0,...all),ymax=Math.max(1e-12,...all);if(ymax<=ymin)ymax=ymin+1;ymax=ymin+(ymax-ymin)*1.08;
 const sx=x=>L+(x-lo)/(hi-lo)*gw,sy=y=>H-B-(y-ymin)/(ymax-ymin)*gh;
 const defs=svg('defs'),clip=svg('clipPath',{id:'plotClip'});clip.append(svg('rect',{x:L,y:T,width:gw,height:gh}));defs.append(clip);graph.append(defs);
 for(let i=0;i<=5;i++){const x=lo+(hi-lo)*i/5,px=sx(x),y=ymin+(ymax-ymin)*i/5,py=sy(y);graph.append(svg('line',{x1:px,y1:T,x2:px,y2:H-B,class:'grid'}));graph.append(svg('text',{x:px,y:H-B+23,'text-anchor':'middle'},fmt(x,5)));graph.append(svg('line',{x1:L,y1:py,x2:W-R,y2:py,class:'grid'}));graph.append(svg('text',{x:L-10,y:py+4,'text-anchor':'end'},fmt(y,5)));}
 graph.append(svg('text',{x:L+gw/2,y:H-13,'text-anchor':'middle'},xLabel));graph.append(svg('text',{x:17,y:T+gh/2,transform:'rotate(-90 17 '+(T+gh/2)+')','text-anchor':'middle'},yLabel));
 function path(data,key,cls){let d='',open=false;for(const p of data){if(p.y==null||!Number.isFinite(p[key])){open=false;continue;}d+=(open?'L':'M')+sx(p.x).toFixed(3)+','+sy(p[key]).toFixed(3);open=true;}graph.append(svg('path',{d,class:cls,'clip-path':'url(#plotClip)'}));}
 function legend(name,cls){const e=document.createElement('span');e.className=cls;e.textContent=name;$('curveLegend').append(e);}
 for(const s of series){path(s.data,'y',s.cls);legend(s.name,s.cls.replace('line','').trim());}
 if(overlay){path(curveRows,'actual','line alt');legend('Actual volume · same volume/time scale','alt');}
 if(normalizedIdeal){const data=curveRows.map(d=>({x:d.x,y:Math.sqrt(d.x/100)*100}));path(data,'y','line alt');legend('Ideal fixed-coefficient √ΔP reference','alt');}
 let opx=kind==='inverse'?last.values[outUnit()]:kind==='normalized'?100:kind==='pressure'?n('lineP'):kind==='temperature'?n('lineT'):driver.value;
 try{const p=point(config,last,opx,kind);if(opx>=lo&&opx<=hi)graph.append(svg('circle',{cx:sx(opx),cy:sy(p.y),r:5.8,fill:'#2fd4c2',stroke:'#05070e','stroke-width':2}));}catch(e){}
 if(config.maxDP!=null&&kind==='response'&&isDP(config.element)){const x=config.maxDP/F.PRESSURE[v('dpUnit')];if(x>=lo&&x<=hi){graph.append(svg('line',{x1:sx(x),y1:T,x2:sx(x),y2:H-B,stroke:'#ff6b6b','stroke-dasharray':'4 5'}));graph.append(svg('text',{x:Math.min(W-R-100,sx(x)+5),y:T+13,fill:'#ff6b6b'},'User DP limit'));}}
 if(!valid.length)graph.append(svg('text',{x:L+gw/2,y:T+gh/2,'text-anchor':'middle'},'No admissible points in this range.'));
 const line=svg('line',{x1:0,y1:T,x2:0,y2:H-B,stroke:'rgba(255,255,255,.4)','stroke-dasharray':'3 4',visibility:'hidden'});graph.append(line);
 plot={lo,hi,L,R,T,B,W,H,sx,sy,line,kind,xLabel,yLabel,series};
 txt('curveXHeading',xLabel);txt('curveYHeading',yLabel);
 for(const[d,i]of curveRows.map((d,i)=>[d,i]))if(i%8===0||d.y==null&&i%4===0){const tr=document.createElement('tr');for(const val of [fmt(d.x,8),fmt(d.y,8),d.status]){const td=document.createElement('td');td.textContent=val;tr.append(td);}$('curveTable').append(tr);}
 let note='Each point recalculates the selected model. '+valid.length+'/'+curveRows.length+' current-case points are admissible. '+(invalid?'Gaps are excluded points, not interpolated estimates. First exclusion: '+curveRows.find(d=>d.y==null).status:'');
 if(['pressure','temperature'].includes(kind))note+=' Sensitivity only: composition, Z, viscosity, κ and entered coefficients stay fixed; verify fluid properties across the sweep.';
 else note+=' Fluid state and geometry remain fixed across this curve.';
 if(config.maxDP!=null&&kind==='response'&&isDP(config.element)){const lim=config.maxDP/F.PRESSURE[v('dpUnit')],lastX=valid.length?valid[valid.length-1].x:null,du=$('dpUnit').selectedOptions[0].textContent;let m='Documented DP limit '+fmt(lim,6)+' '+du;if(lim>hi)m+=' is beyond the current X-axis end; press Auto range to bring it into view.';else if(lastX!=null&&lim>lastX*(1+1e-9))m+=' is beyond this model’s valid envelope (dashed line); the curve ends where the ISO correlation stops. A calibrated manual coefficient is required past that point.';else m+=' is marked by the dashed limit line.';txt('dpLimitNote',m);}
 if(kind==='normalized')note+=' 100% uses the current operating point, except analog mode uses its entered range. This is not the hardware DP limit.';
 if(overlay)note+=' The secondary line uses actual volume in the same cubic-volume/time units; its reference basis differs.';
 note+=' Pin up to two cases to compare settings. Click an admissible response point to load its input.';
 txt('curveNote',note);
}
$('flowGraph').addEventListener('pointermove',e=>{if(!plot||!curveRows.length)return;const p=$('flowGraph').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const pt=p.matrixTransform($('flowGraph').getScreenCTM().inverse());const index=Math.max(0,Math.min(160,Math.round((pt.x-plot.L)/(plot.W-plot.L-plot.R)*160))),d=curveRows[index];plot.line.setAttribute('x1',plot.sx(d.x));plot.line.setAttribute('x2',plot.sx(d.x));plot.line.setAttribute('visibility','visible');txt('curveReadout',fmt(d.x,8)+' '+plot.xLabel+' → '+(d.y==null?'Excluded: '+d.status:fmt(d.y,9)+' '+plot.yLabel+(d.Re!=null?' · Re '+fmt(d.Re):'')+(d.Y!=null?' · ε/Y '+fmt(d.Y,6):'')+(d.status!=='Calculated'?' · '+d.status:'')));});
$('flowGraph').addEventListener('pointerleave',()=>{if(plot)plot.line.setAttribute('visibility','hidden');});
$('flowGraph').addEventListener('click',e=>{if(!plot||plot.kind!=='response')return;const p=$('flowGraph').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const pt=p.matrixTransform($('flowGraph').getScreenCTM().inverse()),i=Math.round((pt.x-plot.L)/(plot.W-plot.L-plot.R)*160),d=curveRows[i];if(!d||d.y==null)return;put('solveFor','flow');if(isDP(v('element')))put('dp',d.x);else if(v('element')==='converter')put('Q',d.x);else put({velocity:'velocity',pulse:'frequency',signal:'signal'}[v('element')],d.x);update();});
function preserveUnit(id,old,value){if(old===value||old==null)return;const linear={dUnit:[['D','feature'],F.LENGTH],dpUnit:[['dp','maxDP','calDP'],F.PRESSURE],pUnit:[['lineP'],F.PRESSURE],atmUnit:[['atmosphere'],F.PRESSURE],refPUnit:[['refP'],F.PRESSURE],gasRhoUnit:[['rhoGas'],F.DENSITY],liquidRhoUnit:[['rhoLiquid'],F.DENSITY]};
 if(linear[id]){const[fields,map]=linear[id];for(const f of fields)if(Number.isFinite(n(f)))put(f,n(f)*map[old]/map[value]);return;}
 if(['tUnit','refTUnit'].includes(id)){const f=id==='tUnit'?'lineT':'refT';if(Number.isFinite(n(f)))put(f,F.temperatureFromK(F.temperatureK(n(f),old),value));return;}
 if(id==='pBasis'){const at=n('atmosphere')*F.PRESSURE[v('atmUnit')]/F.PRESSURE[v('pUnit')];if(!Number.isFinite(at)||at<=0)throw Error('Enter a valid atmospheric pressure first.');put('lineP',n('lineP')+(old==='gauge'?at:-at));return;}
 if(['qUnit','rangeUnit','calUnit'].includes(id)){
  const fields=id==='qUnit'?['Q']:id==='rangeUnit'?['rangeLow','rangeHigh']:['calQ'];const s=last?.state||F.state(readConfiguration());for(const f of fields)if(Number.isFinite(n(f)))put(f,F.actualToFlow(F.flowToActual(n(f),old,s),value,s));
 }
}
function preset(id){const map={us60:[60,'F',14.7,'psi'],us1473:[60,'F',14.73,'psi'],iso15:[15,'C',101.325,'kPa'],metric20:[20,'C',101.325,'kPa'],normal0:[0,'C',101.325,'kPa']},p=map[id];if(!p)return;['refT','refTUnit','refP','refPUnit'].forEach((id,i)=>put(id,p[i]));if(id==='iso15')put('refBasis','dry');}
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',e=>{if(e.target.tagName==='SELECT')return;if(['refP','refT'].includes(e.target.id))put('refPreset','custom');update();if(e.target.id==='maxDP'&&last){autoRange();drawCurve();}});
form.addEventListener('change',e=>{
 if(e.target.tagName!=='SELECT')return;const id=e.target.id,old=previous[id],chosen=v(id);
 try{preserveUnit(id,old,chosen);}catch(err){put(id,old);toast('Unit change not applied: '+err.message);update();return;}
 if(id==='element')setupMode(true);
 if(id==='fluid'){
  for(const field of ['qUnit','rangeUnit','converterUnit']){
   const unit=v(field),fields=field==='qUnit'?['Q']:field==='rangeUnit'?['rangeLow','rangeHigh']:[];
   const oldActual={};if(last?.state)for(const input of fields)try{oldActual[input]=F.flowToActual(n(input),unit,last.state);}catch(ignore){}
   fillUnits(field);const retained=[...$(field).options].some(o=>o.value===unit);put(field,retained?unit:'gpm');
   if(!retained)for(const input of fields)if(Number.isFinite(oldActual[input]))put(input,oldActual[input]/F.UNITS.gpm.factor);
  }
  pins=[];
 }
 if(id==='geometryMode'&&chosen==='dimension'&&last?.beta!=null)put('feature',dimForBeta(v('element'),last.beta,n('D')*F.LENGTH[v('dUnit')])/F.LENGTH[v('dUnit')]);
 if(id==='refPreset')preset(chosen);
 if(id==='refBasis'&&chosen==='total'&&v('refPreset')==='iso15')put('refPreset','custom');
 if(id==='expMode'&&chosen==='manual'&&v('element')==='venturi')put('cdMode','manual');
 update(false);if(['element','qUnit','converterUnit','dpUnit','pUnit','pBasis','tUnit','fluid'].includes(id))autoRange();drawCurve();
});
for(const id of ['curveMin','curveMax'])$(id).addEventListener('input',drawCurve);
$('curveType').addEventListener('change',()=>{visibility();autoRange();drawCurve();});$('actualOverlay').addEventListener('change',drawCurve);$('autoRange').addEventListener('click',()=>{autoRange();drawCurve();});
$('pinButton').addEventListener('click',()=>{if(!last)return;if(pins.length>=2){toast('Two comparison cases are already pinned. Clear comparisons to replace them.');return;}const c=fixedConfig(config,last),r=JSON.parse(JSON.stringify(last)),name='Case '+(pins.length+1)+' · '+(c.fluid==='gas'?fmt(c.P/1000,5)+' kPa abs / '+fmt(c.T-273.15,5)+' °C':'ρ '+fmt(r.state.rho,6)+' kg/m³')+' · '+(r.beta!=null?'β '+fmt(r.beta,4):r.K!=null?'K '+fmt(r.K,4):F.MODES[c.element].name);pins.push({c,r,name});drawCurve();toast('Case pinned. Change an input to compare the new curve.');});
$('clearPins').addEventListener('click',()=>{pins=[];drawCurve();});
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function csvCell(x){let s=String(x??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(rows){return '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');}
function report(){return {application:'Flow Calculator',schema:2,version:F.VERSION,createdUTC:new Date().toISOString(),ui:snapshot(),inputs:config,results:last,reference:basis(last.state),chart:{type:v('curveType'),min:v('curveMin'),max:v('curveMax'),actualOverlay:$('actualOverlay').checked},comparisons:pins.map(p=>({name:p.name,inputs:p.c})),sources:[...$('sourceDetails').querySelectorAll('a[href]')].map(a=>({title:a.textContent,url:a.href})),testSummary:lastChecks?{passed:lastChecks.passed,total:lastChecks.total}:null};}
$('jsonButton').addEventListener('click',()=>{if(update())download('flow-calculator-report.json',JSON.stringify(report(),null,2),'application/json');});
$('csvButton').addEventListener('click',()=>{if(!update())return;const rows=[['Flow Calculator',F.VERSION],['Mode',last.mode],['Reference',basis(last.state)],['Source note',config.sourceNote],['Created UTC',new Date().toISOString()],[],['SI input','Value']];for(const[k,x]of Object.entries(config))rows.push([k,x]);rows.push([],['Unit / basis','Result']);for(const[id,x]of Object.entries(last.values))rows.push([F.UNITS[id].label,x]);rows.push([],['Warnings']);for(const w of last.warnings)rows.push([w]);download('flow-calculator-results.csv',csv(rows),'text/csv;charset=utf-8');});
$('curveCSV').addEventListener('click',()=>{if(!plot)return;const rows=[['Flow Calculator · curve data',F.VERSION],['Current mode',last.mode],['Current reference',basis(last.state)],['Curve',v('curveType')],['Assumptions',$('curveNote').textContent],[],['Case',plot.xLabel,plot.yLabel,'Actual m3/s','DP Pa','ReD','C','Y','P Pa abs','T K','Status']];for(const s of plot.series)for(const d of s.data)rows.push([s.name,d.x,d.y,d.qa,d.dp,d.Re,d.Cd,d.Y,d.P,d.T,d.status]);download('flow-calculator-curve.csv',csv(rows),'text/csv;charset=utf-8');});
$('curveSVG').addEventListener('click',()=>{
 if(!plot)return;const g=$('flowGraph').cloneNode(true);g.setAttribute('xmlns',NS);
 const wrap=(text,width=96)=>{const lines=[];let row='';for(const word of text.split(/\s+/)){if(row.length+word.length+1>width){lines.push(row);row=word;}else row+=(row?' ':'')+word;}if(row)lines.push(row);return lines;};
 const headings=['Flow Calculator · '+last.mode,...wrap(basis(last.state)),...wrap([...$('curveLegend').children].map(e=>e.textContent).join(' | '))];
 const top=24+20*headings.length,height=400+top;g.setAttribute('viewBox','0 -'+top+' 800 '+height);g.setAttribute('width','1200');g.setAttribute('height',String(height*1.5));
 const style=svg('style');style.textContent='.grid{stroke:#dfe8ed;stroke-width:1}text{font:12px Arial,sans-serif;fill:#4f6571}.line{fill:none;stroke:#087b80;stroke-width:2.7;stroke-linejoin:round}.alt{stroke:#8c9fbd;stroke-dasharray:6 5}.pin0{stroke:#bd791f}.pin1{stroke:#955fbe}';g.prepend(style);
 g.prepend(svg('rect',{x:0,y:-top,width:800,height,fill:'white'}));headings.forEach((text,i)=>g.append(svg('text',{x:83,y:-top+22+i*20,'font-weight':i?'normal':'bold'},text)));
 download('flow-calculator-curve.svg',new XMLSerializer().serializeToString(g),'image/svg+xml');
});
$('importButton').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;const old=snapshot();const oldChart={type:v('curveType'),min:v('curveMin'),max:v('curveMax')};try{
 if(file.size>2e6)throw Error('Report is larger than the 2 MB import limit.');const data=JSON.parse(await file.text());if(data.application!=='Flow Calculator'||data.schema!==2||typeof data.ui!=='object')throw Error('Choose a Flow Calculator v4 report (schema 2).');
 if(!F.MODES[data.ui.element]||!['gas','liquid'].includes(data.ui.fluid))throw Error('Unsupported mode or fluid.');
 put('element',data.ui.element);put('fluid',data.ui.fluid);setupMode(true);for(const id of ['qUnit','rangeUnit','converterUnit'])fillUnits(id);
 for(const el of controls()){const x=data.ui[el.id];if(typeof x!=='string'||x.length>600)throw Error('Missing or invalid field: '+el.id);if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===x))throw Error('Unsupported selection: '+el.id);if(el.type==='number'&&x!==''&&!Number.isFinite(Number(x)))throw Error('Invalid number: '+el.id);}
 restore(data.ui);pins=[];if(!update(false))throw Error($('errorText').textContent);
 if(data.chart&&[...$('curveType').options].some(o=>o.value===data.chart.type)){put('curveType',data.chart.type);for(const[id,key]of [['curveMin','min'],['curveMax','max']])if(Number.isFinite(Number(data.chart[key])))put(id,Number(data.chart[key]));$('actualOverlay').checked=data.chart.actualOverlay===true;}
 // Recalculate known comparison input objects; never trust stored result objects or evaluate text.
 if(Array.isArray(data.comparisons))for(const p of data.comparisons.slice(0,2)){if(p?.inputs?.element===config.element&&p.inputs.fluid===config.fluid&&typeof p.name==='string'&&p.name.length<250){try{const rr=F.solve(p.inputs);pins.push({c:p.inputs,r:rr,name:p.name});}catch(ignore){}}}
 visibility();drawCurve();toast('Inputs loaded and recalculated. Stored results were not trusted.');
 }catch(err){put('element',old.element);put('fluid',old.fluid);setupMode(true);for(const id of ['qUnit','rangeUnit','converterUnit'])fillUnits(id);restore(old);put('curveType',oldChart.type);put('curveMin',oldChart.min);put('curveMax',oldChart.max);update();toast('Report not loaded: '+err.message);}e.target.value='';});
function runChecks(open=false){lastChecks=runAllFlowChecks();txt('testButton','Checks '+lastChecks.passed+'/'+lastChecks.total);txt('testSummary',lastChecks.passed+' of '+lastChecks.total+' software checks passed. Not metrological certification.');$('testList').replaceChildren();for(const row of lastChecks.results){const d=document.createElement('div');d.className=row.pass?'check-pass':'check-fail';d.textContent=(row.pass?'PASS · ':'FAIL · ')+row.name+(row.error?' — '+row.error:'');$('testList').append(d);}if(open){$('checksDetails').open=true;$('checksDetails').scrollIntoView({behavior:'smooth'});}return lastChecks;}
$('testButton').addEventListener('click',()=>runChecks(true));
$('printButton').addEventListener('click',()=>window.print());
$('specSheetButton').addEventListener('click',()=>{if(update()){document.body.classList.add('print-spec');window.print();}});
window.addEventListener('beforeprint',buildPrintSheet);
window.addEventListener('afterprint',()=>{$('printSheet').replaceChildren();document.body.classList.remove('print-spec');});
setupMode(true);const defaults=snapshot();
function loadExample(name){put('element','venturi');put('fluid','gas');setupMode(true);for(const id of ['qUnit','rangeUnit','converterUnit'])fillUnits(id);restore(defaults);pins=[];put('curveType','response');
 if(name==='water'){put('fluid','liquid');fillUnits('qUnit');fillUnits('rangeUnit');fillUnits('converterUnit');put('converterUnit','m3h');put('qUnit','gpm');put('rangeUnit','gpm');put('D',8.071);put('Cd',.995);put('coefficientSource','LIQUID DEMONSTRATION — entered density/viscosity, not an automatic water-property model.');}
 if(name==='converter'){put('element','converter');setupMode(true);put('Q',100);put('qUnit','acfm');}
 update(false);autoRange();drawCurve();previous=snapshot();}
for(const b of document.querySelectorAll('[data-example]'))b.addEventListener('click',()=>loadExample(b.dataset.example));
window.FlowCalcUI={getConfig:()=>config,getResult:()=>last,refresh:update,loadExample,runChecks,drawCurve,getCurve:()=>curveRows.map(({result,...r})=>r),getPins:()=>pins,autoRange,snapshot};
loadExample('air');runChecks();
if(/[?&](report|print)=spec\b/.test(location.search))document.body.classList.add('print-spec');
})();
