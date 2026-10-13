// Flow Element Solver core (SI). Lifted verbatim; scoped to this module.
const root = {};
/* Flow Element Solver 3.0.0 — deterministic SI core.
 * Inputs/outputs use SI except q/qUnit. No network, storage, DOM or dependencies.
 * ISO 5167-4:2022 equations 1–2 and coefficient ranges, not a conformity certificate.
 * Annubar K is dimensionless in Qa = K*Y*A*sqrt(2*dp/rho), NOT a pulse K or valve Cv.
 */
(function (root) {
  'use strict';
  const VERSION = '3.0.0';
  const C = Object.freeze({
    R: 8.31446261815324, inch: 0.0254, foot: 0.3048, lb: 0.45359237,
    gravity: 9.80665, gallonUS: 0.003785411784, gallonImp: 0.00454609,
    atm: 101325, normalT: 273.15, waterM: 18.01528
  });
  const FT3 = C.foot ** 3;
  const PSI = C.lb * C.gravity / C.inch ** 2;
  const PRESSURE = Object.freeze({Pa:1, kPa:1000, MPa:1e6, bar:1e5, mbar:100, psi:PSI,
    inH2O60:248.84, inH2O4:249.082, inH2Oconv:249.0889, mmH2Oconv:9.80665});
  const LENGTH = Object.freeze({in: C.inch, mm:0.001, m:1});
  const DENSITY = Object.freeze({kgm3:1, lbft3:C.lb/FT3, gcm3:1000});
  const UNITS = Object.freeze({
    gpm:     {label:'US gal/min', kind:'actual', factor:C.gallonUS/60},
    igpm:    {label:'Imperial gal/min', kind:'actual', factor:C.gallonImp/60},
    acfm:    {label:'ACFM', kind:'actual', factor:FT3/60},
    acfh:    {label:'ACFH', kind:'actual', factor:FT3/3600},
    m3s:     {label:'m³/s actual', kind:'actual', factor:1},
    m3min:   {label:'m³/min actual', kind:'actual', factor:1/60},
    m3h:     {label:'m³/h actual', kind:'actual', factor:1/3600},
    m3d:     {label:'m³/day actual', kind:'actual', factor:1/86400},
    ls:      {label:'L/s actual', kind:'actual', factor:0.001},
    lmin:    {label:'L/min actual', kind:'actual', factor:0.001/60},
    lh:      {label:'L/h actual', kind:'actual', factor:0.001/3600},
    bpd:     {label:'bbl/day (42 US gal)', kind:'actual', factor:42*C.gallonUS/86400},
    scfm:    {label:'SCFM', kind:'standard', factor:FT3/60},
    scfh:    {label:'SCFH', kind:'standard', factor:FT3/3600},
    scfd:    {label:'SCF/day', kind:'standard', factor:FT3/86400},
    mscfd:   {label:'10³ SCF/day', kind:'standard', factor:1000*FT3/86400},
    mmscfd:  {label:'10⁶ SCF/day', kind:'standard', factor:1e6*FT3/86400},
    sm3h:    {label:'Sm³/h (selected reference)', kind:'standard', factor:1/3600},
    sm3d:    {label:'Sm³/day (selected reference)', kind:'standard', factor:1/86400},
    slmin:   {label:'SL/min (selected reference)', kind:'standard', factor:0.001/60},
    sccm:    {label:'sccm (selected reference)', kind:'standard', factor:1e-6/60},
    nm3h:    {label:'Nm³/h (0 °C, 101.325 kPa abs)', kind:'normal', factor:1/3600},
    nm3d:    {label:'Nm³/day (0 °C, 101.325 kPa abs)', kind:'normal', factor:1/86400},
    nlmin:   {label:'NL/min (0 °C, 101.325 kPa abs)', kind:'normal', factor:0.001/60},
    kgps:    {label:'kg/s total', kind:'mass', factor:1},
    kgph:    {label:'kg/h total', kind:'mass', factor:1/3600},
    kgpd:    {label:'kg/day total', kind:'mass', factor:1/86400},
    tph:     {label:'tonne/h total', kind:'mass', factor:1000/3600},
    lbmin:   {label:'lbm/min total', kind:'mass', factor:C.lb/60},
    lbh:     {label:'lbm/h total', kind:'mass', factor:C.lb/3600}
  });
  const PROFILES = Object.freeze({
    cast: {name:'ISO 5167-4:2022 · as-cast', Dmin:0.100,Dmax:0.800,bmin:0.30,bmax:0.75,Remin:2e5,Remax:2e6,Cd:0.984},
    machined: {name:'ISO 5167-4:2022 · machined', Dmin:0.050,Dmax:0.350,bmin:0.40,bmax:0.75,Remin:2e5,Remax:Infinity},
    fabricated: {name:'ISO 5167-4:2022 · fabricated', Dmin:0.200,Dmax:1.200,bmin:0.40,bmax:0.70,Remin:2e5,Remax:2e6,Cd:0.985}
  });
  function requireThat(ok, text) { if (!ok) throw new Error(text); }
  function number(n, label, min=-Infinity, exclusive=false) {
    requireThat(typeof n==='number' && Number.isFinite(n), label+' must be a finite number.');
    requireThat(exclusive ? n>min : n>=min, label+' must be '+(exclusive?'greater than ':'at least ')+min+'.');
    return n;
  }
  function positive(n,label) { return number(n,label,0,true); }
  function temperatureK(value, unit) {
    number(value,'Temperature');
    const k = unit==='K'?value:unit==='C'?value+273.15:unit==='F'?(value+459.67)*5/9:unit==='R'?value*5/9:NaN;
    return positive(k,'Absolute temperature (K)');
  }
  function temperatureFromK(k,unit) {
    positive(k,'Absolute temperature');
    const value=unit==='K'?k:unit==='C'?k-273.15:unit==='F'?k*9/5-459.67:unit==='R'?k*9/5:NaN;
    return number(value,'Converted temperature');
  }
  function absolutePressure(value,unit,basis,atmosphere=C.atm) {
    number(value,'Line pressure'); positive(PRESSURE[unit],'Pressure-unit scale');
    requireThat(basis==='absolute'||basis==='gauge','Choose absolute or gauge pressure.');
    if(basis==='gauge') positive(atmosphere,'Local atmospheric pressure');
    return positive(value*PRESSURE[unit]+(basis==='gauge'?atmosphere:0),'Absolute line pressure (Pa)');
  }
  function state(c) {
    requireThat(c.fluid==='gas'||c.fluid==='liquid','Choose gas or liquid.');
    if(c.fluid==='liquid') return {fluid:'liquid',rho:positive(c.rhoLiquid,'Liquid density'),standardFactor:null,normalFactor:null};
    const P=positive(c.P,'Absolute line pressure'), T=positive(c.T,'Absolute line temperature');
    const dryM=positive(c.M,'Dry-gas molar mass')/1000;
    const y=number(c.yH2O,'Water-vapor mole fraction',0);
    requireThat(y<1,'Water-vapor mole fraction must be below 1; this is not a steam-property solver.');
    requireThat(c.refBasis==='dry'||c.refBasis==='total','Choose dry or total reference-gas basis.');
    const M=(1-y)*dryM+y*C.waterM/1000;
    requireThat(c.densityMode==='eos'||c.densityMode==='manual','Choose a gas-density method.');
    const rho=c.densityMode==='manual'?positive(c.rhoGas,'Entered flowing gas density'):P*M/(positive(c.Z,'Flowing Z')*C.R*T);
    const Z=c.densityMode==='manual'?P*M/(rho*C.R*T):c.Z;
    const refP=positive(c.refP,'Reference absolute pressure'),refT=positive(c.refT,'Reference absolute temperature');
    const refZ=positive(c.refZ,'Reference Z'),normalZ=positive(c.normalZ,'Normal-condition Z');
    const same=(a,b)=>Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b));
    if(same(refT,C.normalT)&&same(refP,C.atm))
      requireThat(same(refZ,normalZ),'Selected and normal references have identical P/T/composition but different Z values. Use the same Z for the same state.');
    if((y===0||c.refBasis==='total')&&same(P,refP)&&same(T,refT))
      requireThat(same(Z,refZ),'Flowing and selected-reference states have identical P/T/composition but different Z values. Check the property inputs.');
    if((y===0||c.refBasis==='total')&&same(P,C.atm)&&same(T,C.normalT))
      requireThat(same(Z,normalZ),'Flowing and normal-reference states have identical P/T/composition but different Z values. Check the property inputs.');
    const f=c.refBasis==='dry'?1-y:1;
    const referenceM=c.refBasis==='dry'?dryM:M;
    const standardFactor=(P/refP)*(refT/T)*(refZ/Z)*f;
    const normalFactor=(P/C.atm)*(C.normalT/T)*(normalZ/Z)*f;
    const rhoRef=refP*referenceM/(refZ*C.R*refT);
    const rhoNormal=C.atm*referenceM/(normalZ*C.R*C.normalT);
    const dryMassFraction=(1-y)*dryM/M;
    [rho,Z,standardFactor,normalFactor,rhoRef,rhoNormal].forEach(v=>positive(v,'Gas-state result'));
    return {fluid:'gas',rho,Z,P,T,M,dryM,y,refP,refT,refZ,normalZ,refBasis:c.refBasis,
      referenceFraction:f,standardFactor,normalFactor,rhoRef,rhoNormal,dryMassFraction};
  }
  function flowToActual(value,unit,s) {
    number(value,'Flow',0); const u=UNITS[unit]; requireThat(!!u,'Unknown flow unit.');
    if(u.kind==='standard'||u.kind==='normal') requireThat(s.fluid==='gas','Reference gas-volume units are not applicable to liquids.');
    const scale=u.kind==='mass'?s.rho:u.kind==='standard'?s.standardFactor:u.kind==='normal'?s.normalFactor:1;
    return number(value*u.factor/scale,'Actual flow',0);
  }
  function actualToFlow(qa,unit,s) {
    number(qa,'Actual flow',0); const u=UNITS[unit]; requireThat(!!u,'Unknown flow unit.');
    if(u.kind==='standard'||u.kind==='normal') requireThat(s.fluid==='gas','Reference gas-volume units are not applicable to liquids.');
    const scale=u.kind==='mass'?s.rho:u.kind==='standard'?s.standardFactor:u.kind==='normal'?s.normalFactor:1;
    return number(qa*scale/u.factor,'Converted flow',0);
  }
  function venturiExpansion(beta,dp,P,kappa) {
    positive(beta,'Beta'); requireThat(beta<1,'Beta must be below 1.');
    number(dp,'Differential pressure',0);positive(P,'Absolute upstream pressure');positive(kappa-1,'Isentropic exponent minus one');
    const x=dp/P;
    requireThat(x<=0.25+2e-15,'Venturi gas expansion is outside its p₂/p₁ ≥ 0.75 limit (ΔP/P₁ ≤ 0.25).');
    if(dp===0) return 1;
    const L=Math.log1p(-x),a=(kappa-1)/kappa,b4=beta**4;
    const t=Math.exp(2*L/kappa);
    // expm1/log1p prevent cancellation as dp/P approaches zero or kappa approaches 1.
    const eps2=t*(1-b4)/((1-b4)-b4*Math.expm1(2*L/kappa))*(-Math.expm1(a*L)/(a*x));
    return positive(Math.sqrt(eps2),'Venturi expansion factor');
  }
  function bisectIncreasing(fn,lo,hi,target,label) {
    const fLo=fn(lo),fHi=fn(hi),tol=Math.max(Math.abs(target)*2e-13,Number.MIN_VALUE);
    requireThat(Number.isFinite(fLo)&&Number.isFinite(fHi),label+': non-finite bracket.');
    requireThat(target>=fLo-tol&&target<=fHi+tol,label+' has no solution inside the supported range. Check flow, ΔP, geometry and pressure.');
    if(Math.abs(target-fLo)<=tol) return lo;
    if(Math.abs(target-fHi)<=tol) return hi;
    for(let i=0;i<160;i++) {
      const mid=lo+(hi-lo)/2,f=fn(mid);
      if(Math.abs(f-target)<=tol||mid===lo||mid===hi) return mid;
      if(f<target)lo=mid;else hi=mid;
    }
    throw new Error(label+': numerical solver did not converge.');
  }
  function solve(c) {
    requireThat(c&&typeof c==='object','Missing configuration.');
    requireThat(['venturi','annubar','converter'].includes(c.element),'Choose a supported primary element or converter.');
    const s=state(c),warnings=[];
    let qa,dp=null,beta=null,K=null,Cd=null,epsilon=null,Re=null,area=null,throat=null,mach=null,throatMach=null;
    if(s.fluid==='gas') {
      if(s.Z===1)warnings.push('Flowing Z = 1: the gas state is treated as ideal. Enter a suitable real-gas Z or a measured/EOS density when needed.');
      if(s.refZ===1||s.normalZ===1)warnings.push('A reference Z of 1 is an explicit ideal-gas approximation; reference Z values are not calculated from composition.');
      if(s.y>0)warnings.push('Water content is an entered mole fraction, not relative humidity. No dew-point, saturation or condensation calculation is performed.');
      if(s.Z<0.5||s.Z>1.5)warnings.push('The entered/implied flowing Z is unusual. Verify composition, pressure, temperature and phase.');
    }
    if(c.element==='converter') {
      qa=flowToActual(c.q,c.qUnit,s);
    } else {
      requireThat(['flow','dp','ratio'].includes(c.solve),'Choose flow, ΔP or β/K as the target.');
      const D=positive(c.D,'Internal pipe diameter'),mu=positive(c.mu,'Dynamic viscosity');
      area=Math.PI*D*D/4;
      positive(area,'Pipe area');
      const reynolds=q=>4*s.rho*q/(Math.PI*D*mu);
      if(s.fluid==='gas') { positive(c.kappa-1,'Isentropic exponent minus one'); }
      if(c.solve!=='flow') qa=flowToActual(c.q,c.qUnit,s);
      if(c.solve!=='dp') dp=number(c.dp,'Differential pressure',0);
      if(c.solve==='ratio') { positive(qa,'Flow for β/K solving');positive(dp,'ΔP for β/K solving'); }
      if(c.element==='venturi') {
        requireThat(c.cdMode==='manual'||!!PROFILES[c.cdMode],'Choose a Venturi coefficient profile.');
        const p=PROFILES[c.cdMode];
        if(p) requireThat(D>=p.Dmin-1e-12&&D<=p.Dmax+1e-12,
          p.name+' requires D = '+(p.Dmin*1000)+'–'+(p.Dmax*1000)+' mm. Use a calibrated manual coefficient for a nonstandard meter.');
        const bmin=p?p.bmin:1e-9,bmax=p?p.bmax:s.fluid==='gas'?0.75:1-1e-9;
        if(c.solve!=='ratio') {
          beta=positive(c.beta,'Beta');requireThat(beta<1,'Beta must be below 1.');
          requireThat(beta>=bmin-1e-13&&beta<=bmax+1e-13,'Beta is outside this profile’s supported range: '+bmin+' to '+bmax+'.');
        }
        const cdForRe=r=>!p?positive(c.Cd,'Entered discharge coefficient'):c.cdMode==='machined'?(r<=1e6?0.995:1):p.Cd;
        const checkRe=r=>{ if(p&&r!==0)requireThat(r>=p.Remin*(1-1e-12)&&r<=p.Remax*(1+1e-12),
          p.name+' requires ReD ≥ '+p.Remin+(Number.isFinite(p.Remax)?' and ≤ '+p.Remax:'')+'. Calculated ReD = '+r.toPrecision(7)+'. Use a calibrated manual coefficient outside this range.'); };
        const exp=(b,d)=>s.fluid==='gas'?venturiExpansion(b,d,s.P,c.kappa):1;
        const forward=(b,d,co)=>co*area*b*b/Math.sqrt(1-b**4)*exp(b,d)*Math.sqrt(2*d/s.rho);
        if(c.solve==='flow') {
          if(p&&c.cdMode==='machined'&&dp>0) {
            const qLow=forward(beta,dp,0.995),qHigh=forward(beta,dp,1);
            const lowOK=reynolds(qLow)<=1e6, highOK=reynolds(qHigh)>1e6;
            requireThat(!(lowOK&&highOK),'Machined-Venturi coefficient transition near ReD = 10⁶ gives two self-consistent branches. Use a calibrated manual Cd; the solver will not choose one silently.');
            Cd=lowOK?0.995:1;qa=lowOK?qLow:qHigh;
          } else {Cd=cdForRe(0);qa=forward(beta,dp,Cd);}
        } else {
          Cd=cdForRe(reynolds(qa));checkRe(reynolds(qa));
          if(c.solve==='dp') {
            if(qa===0)dp=0;
            else if(s.fluid==='liquid')dp=s.rho/2*(qa*Math.sqrt(1-beta**4)/(Cd*area*beta*beta))**2;
            else dp=bisectIncreasing(d=>forward(beta,d,Cd),0,0.25*s.P,qa,'Gas ΔP');
          } else beta=bisectIncreasing(b=>forward(b,dp,Cd),bmin,bmax,qa,'Beta');
        }
        Re=reynolds(qa);checkRe(Re);epsilon=exp(beta,dp);throat=D*beta;
        if(p)warnings.push('D, β, ReD and gas pressure-ratio limits are checked. Surface finish, tap geometry, straight lengths, installation, phase and the uncertainty budget are NOT verified.');
        else warnings.push('Entered Cd is held constant. This is a calibrated/user-coefficient calculation, not automatic ISO conformity; gas ε is not independently validated outside ISO geometry/Re limits.');
        if(Re===0)warnings.push('Zero flow is a mathematical result. ISO Reynolds-number applicability is not met at zero flow.');
        if(s.fluid==='gas') {
          const tau=1-dp/s.P,rho2=s.rho*Math.pow(tau,1/c.kappa);
          const v2=qa*s.rho/(rho2*area*beta*beta);
          throatMach=v2/Math.sqrt(c.kappa*s.P*tau/rho2);
          requireThat(throatMach<1,'Estimated throat flow is sonic/supersonic; this Venturi model is not applicable.');
        }
      } else {
        K=c.solve==='ratio'?null:positive(c.K,'Dimensionless probe coefficient K');
        epsilon=s.fluid==='gas'?positive(c.Y,'Entered probe gas-expansion factor Y'):1;
        requireThat(epsilon<=1,'Probe expansion factor Y must not exceed 1 in this implementation.');
        if(c.solve==='flow')qa=K*epsilon*area*Math.sqrt(2*dp/s.rho);
        else if(c.solve==='dp')dp=s.rho/2*(qa/(K*epsilon*area))**2;
        else K=qa/(epsilon*area*Math.sqrt(2*dp/s.rho));
        Re=reynolds(qa);
        warnings.push('Probe K must match Qa = K·Y·A·√(2ΔP/ρ₁). No device-specific K curve or installation correction is supplied.');
        if(s.fluid==='gas') {
          requireThat(dp/s.P<=0.10+1e-14,'This calculator limits gas averaging-pitot operation to ΔP/Pstatic ≤ 0.10. This conservative software envelope is NOT a manufacturer limit; use factory sizing beyond it.');
          warnings.push('Probe Y is held fixed at the entered value, including inverse ΔP calculations. Re-evaluate it from the manufacturer’s method when ΔP or operating conditions change.');
          if(epsilon===1)warnings.push('Probe gas Y = 1 neglects local expansion. This is an approximation, not an automatically compensated Annubar result.');
        }
        if(c.solve==='ratio')warnings.push('The inferred K reproduces this one operating point; it is not a substitute for a traceable flow calibration.');
      }
      if(s.fluid==='gas') {
        mach=(qa/area)/Math.sqrt(c.kappa*s.P/s.rho);
        requireThat(mach<1,'Estimated pipe velocity is sonic/supersonic; this meter model is not applicable.');
      } else warnings.push('Liquid density and viscosity are entered at flowing conditions. Cavitation, flashing and temperature correction to a liquid reference volume are not modeled.');
      warnings.push('Measured differential pressure is not permanent pressure loss. No unsupported permanent-loss estimate is reported.');
    }
    number(qa,'Calculated actual flow',0);
    if(dp!==null)number(dp,'Calculated differential pressure',0);
    const values={};
    for(const [id,u] of Object.entries(UNITS))if(s.fluid==='gas'||u.kind==='actual'||u.kind==='mass')values[id]=actualToFlow(qa,id,s);
    const mass=qa*s.rho;
    number(mass,'Total mass flow',0);
    return {version:VERSION,state:s,qa,mass,standard:s.fluid==='gas'?qa*s.standardFactor:null,
      normal:s.fluid==='gas'?qa*s.normalFactor:null,dryMass:s.fluid==='gas'?mass*s.dryMassFraction:null,
      dp,beta,K,Cd,epsilon,Re,area,throat,velocity:area?qa/area:null,mach,throatMach,values,warnings,
      status:c.element==='converter'?'State conversion':c.element==='venturi'&&c.cdMode!=='manual'?'Numeric profile limits checked':'Entered-coefficient calculation'};
  }
  const api=Object.freeze({VERSION,C,PRESSURE,LENGTH,DENSITY,UNITS,PROFILES,PSI,FT3,temperatureK,temperatureFromK,
    absolutePressure,state,flowToActual,actualToFlow,venturiExpansion,solve});
  root.FlowCalc=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(root);
export const FlowCalc = root.FlowCalc;
