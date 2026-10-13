// Flow Calculator engine: the 16 modes layered on the core.
import { FlowCalc as __core } from './core.js';
const root = { FlowCalc: __core };
/* Flow Calculator 4.0.0. Generic types; no instrument serial-number presets.
 * SI throughout. Numeric profile checks are not installation certification.
 * RHG(1998) and nozzle correlations are transcribed from ISO 5167-2/-3:2003;
 * classical Venturi profiles use ISO 5167-4:2022. See the in-file source map.
 */
(function(root){
'use strict';
const B=root.FlowCalc;
const MODES=Object.freeze({
 venturi:{name:'Venturi tube',group:'Differential-pressure elements',family:'beta',auto:true},
 orifice:{name:'Orifice plate · concentric, sharp-edged',group:'Differential-pressure elements',family:'beta',auto:true},
 nozzle:{name:'Flow nozzle · ISA 1932 geometry',group:'Differential-pressure elements',family:'beta',auto:true},
 long_nozzle:{name:'Flow nozzle · long-radius',group:'Differential-pressure elements',family:'beta',auto:true},
 venturi_nozzle:{name:'Venturi nozzle',group:'Differential-pressure elements',family:'beta',auto:true},
 throat_nozzle:{name:'Flow nozzle · throat-tapped (entered C)',group:'Differential-pressure elements',family:'beta'},
 annubar:{name:'Annubar / averaging pitot',group:'Differential-pressure elements',family:'probe'},
 pitot:{name:'Pitot tube · single-point + profile factor',group:'Differential-pressure elements',family:'probe'},
 cone:{name:'Cone meter (entered C)',group:'Differential-pressure elements',family:'beta'},
 wedge:{name:'Wedge meter (entered C)',group:'Differential-pressure elements',family:'beta'},
 custom_dp:{name:'Custom DP element (entered K)',group:'Differential-pressure elements',family:'probe'},
 calibrated_dp:{name:'DP meter · calibrated operating point',group:'Differential-pressure elements',family:'calibrated'},
 velocity:{name:'Velocity × area',group:'Conversion & instrument signals',family:'velocity'},
 pulse:{name:'Pulse / frequency meter',group:'Conversion & instrument signals',family:'pulse'},
 signal:{name:'Analog transmitter · linear / square-root',group:'Conversion & instrument signals',family:'signal'},
 converter:{name:'Actual / standard / normal / mass converter',group:'Conversion & instrument signals',family:'converter'}
});
function ok(v,m){if(!v)throw Error(m);}
function num(v,n,min=-Infinity){ok(Number.isFinite(v)&&v>=min,n+' must be finite and ≥ '+min+'.');return v;}
function pos(v,n){num(v,n);ok(v>0,n+' must be greater than zero.');return v;}
function bound(v,lo,hi,n){num(v,n);ok(v>=lo-1e-12&&v<=hi+1e-12,n+' must be in '+lo+'–'+hi+'.');return v;}
function bisect(fn,lo,hi,target,label){
 let a=fn(lo)-target,b=fn(hi)-target; const tol=Math.max(1e-30,Math.abs(target)*1e-12);
 ok(Number.isFinite(a)&&Number.isFinite(b)&&a*b<=0,label+': no solution in the supported range.');
 if(Math.abs(a)<=tol)return lo;if(Math.abs(b)<=tol)return hi;
 for(let i=0;i<150;i++){let m=lo+(hi-lo)/2,f=fn(m)-target;if(Math.abs(f)<=tol||m===lo||m===hi)return m;if((f>0)===(a>0)){lo=m;a=f;}else{hi=m;b=f;}}
 throw Error(label+': iteration did not converge.');
}
function rhg(beta,Re,D,taps='flange'){
 pos(Re,'Reynolds number');pos(D,'Pipe diameter');bound(beta,0.000001,.999999,'Beta');
 ok(['corner','flange','D-D2'].includes(taps),'Choose corner, flange or D–D/2 taps.');
 let L1=taps==='corner'?0:taps==='flange'?.0254/D:1;
 let L2=taps==='corner'?0:taps==='flange'?.0254/D:.47;
 let A=(19000*beta/Re)**.8,M2=2*L2/(1-beta);
 let C=.5961+.0261*beta**2-.216*beta**8+.000521*(1e6*beta/Re)**.7
  +(.0188+.0063*A)*beta**3.5*(1e6/Re)**.3
  +(.043+.080*Math.exp(-10*L1)-.123*Math.exp(-7*L1))*(1-.11*A)*beta**4/(1-beta**4)
  -.031*(M2-.8*M2**1.1)*beta**1.3;
 if(D<.07112)C+=.011*(.75-beta)*(2.8-D/.0254);
 return pos(C,'Calculated orifice C');
}
function orificeExpansion(beta,dp,P,k){
 bound(beta,.000001,.999999,'Beta');num(dp,'DP',0);pos(P,'Absolute pressure');pos(k-1,'κ − 1');
 ok(dp/P<=.25+1e-14,'Orifice expansion requires p₂/p₁ ≥ 0.75.');
 return 1+(.351+.256*beta**4+.93*beta**8)*Math.expm1(Math.log1p(-dp/P)/k);
}
function nozzleCd(type,b,Re){
 pos(Re,'Reynolds number');
 if(type==='nozzle')return pos(.9900-.2262*b**4.1-(.00175*b*b-.0033*b**4.15)*(1e6/Re)**1.15,'Nozzle C');
 if(type==='long_nozzle')return pos(.9965-.00653*Math.sqrt(1e6*b/Re),'Long-radius nozzle C');
 if(type==='venturi_nozzle')return pos(.9858-.196*b**4.5,'Venturi-nozzle C');
 throw Error('No coefficient correlation for this nozzle type.');
}
function wedgeBeta(hOverD){
 bound(hOverD,1e-9,1-1e-9,'Wedge opening h/D');
 const u=1-2*hOverD;
 return Math.sqrt((Math.acos(u)-u*Math.sqrt(1-u*u))/Math.PI);
}
function coneBeta(dc,D){pos(D,'Pipe diameter');bound(dc,1e-12,D*(1-1e-12),'Cone diameter');return Math.sqrt(1-(dc/D)**2);}
function profile(c,b){
 let p;
 if(c.element==='orifice')p={Dmin:.05,Dmax:1,bmin:.1,bmax:.75,dmin:.0125,Remin:c.taps==='flange'?Math.max(5000,170*b*b*c.D*1000):(b<=.56?5000:16000*b*b),Remax:Infinity};
 if(c.element==='nozzle')p={Dmin:.05,Dmax:.5,bmin:.3,bmax:.8,dmin:0,Remin:b<.44?70000:20000,Remax:1e7};
 if(c.element==='long_nozzle')p={Dmin:.05,Dmax:.63,bmin:.2,bmax:.8,dmin:0,Remin:10000,Remax:1e7};
 if(c.element==='venturi_nozzle')p={Dmin:.065,Dmax:.5,bmin:.316,bmax:.775,dmin:.05,Remin:150000,Remax:2e6};
 return p;
}
function betaExpansion(c,s,b,dp){
 if(s.fluid==='liquid')return 1;
 if(c.expMode==='manual'||['cone','wedge','throat_nozzle'].includes(c.element))return bound(pos(c.Y,'Entered expansion factor'),0,1,'Expansion factor');
 if(c.element==='orifice')return orificeExpansion(b,dp,s.P,c.kappa);
 return B.venturiExpansion(b,dp,s.P,c.kappa);
}
function betaSolve(c,s){
 const D=pos(c.D,'Pipe internal diameter'),mu=pos(c.mu,'Dynamic viscosity'),area=Math.PI*D*D/4;
 const auto=c.cdMode==='auto', rev=q=>4*s.rho*q/(Math.PI*D*mu), qRev=r=>r*Math.PI*D*mu/(4*s.rho);
 const cfun=(b,Re)=>auto?(c.element==='orifice'?rhg(b,Re,D,c.taps):nozzleCd(c.element,b,Re)):pos(c.Cd,'Entered C');
 const maxDP=s.fluid==='gas'?(c.expMode==='manual'||['cone','wedge','throat_nozzle'].includes(c.element)?.1:.25)*s.P:Infinity;
 let b=c.beta,dp,qa,Cd,epsilon,Re;
 function validateGeometry(b){bound(b,.000001,.999999,'Beta');
  if(auto){const p=profile(c,b);ok(p,'No automatic C for this type.');bound(D,p.Dmin,p.Dmax,'Profile pipe ID (m)');bound(b,p.bmin,p.bmax,'Profile beta');ok(D*b>=p.dmin-1e-12,'Bore must be at least '+p.dmin*1000+' mm.');}
 }
 function checkRe(b,r){if(auto&&r>0){const p=profile(c,b);ok(r>=p.Remin*(1-1e-10)&&r<=p.Remax*(1+1e-10),'ReD = '+r.toPrecision(6)+' is outside the selected correlation range ('+p.Remin+'–'+p.Remax+'). Use a calibrated entered C; do not extrapolate.');}}
 function forward(b,dp,qKnown){
  validateGeometry(b);num(dp,'DP',0);ok(dp<=maxDP+1e-9,'Gas ΔP exceeds this model’s supported pressure-ratio envelope.');
  const e=betaExpansion(c,s,b,dp),G=area*b*b/Math.sqrt(1-b**4)*e*Math.sqrt(2*dp/s.rho);
  if(dp===0)return {qa:0,Cd:auto?null:pos(c.Cd,'C'),epsilon:1};
  if(qKnown!=null){const cc=cfun(b,rev(qKnown));return {qa:G*cc,Cd:cc,epsilon:e};}
  if(!auto)return {qa:G*pos(c.Cd,'C'),Cd:c.Cd,epsilon:e};
  const p=profile(c,b),lo=qRev(p.Remin);let hi=Number.isFinite(p.Remax)?qRev(p.Remax):Math.max(G*2,lo*10);
  const fn=q=>q/cfun(b,rev(q));
  if(!Number.isFinite(p.Remax)){let i=0;while(fn(hi)<G&&i++<60)hi*=2;}
  const q=bisect(fn,lo,hi,G,'Flow / Reynolds-number iteration');
  return {qa:q,Cd:cfun(b,rev(q)),epsilon:e};
 }
 if(c.solve!=='flow')qa=B.flowToActual(c.q,c.qUnit,s);
 if(c.solve!=='dp')dp=num(c.dp,'Differential pressure',0);
 if(c.solve==='flow'){({qa,Cd,epsilon}=forward(b,dp));}
 else if(c.solve==='dp'){
  validateGeometry(b);checkRe(b,rev(qa));
  if(qa===0){dp=0;Cd=auto?null:c.Cd;epsilon=1;}
  else {Cd=cfun(b,rev(qa));const incompressible=s.rho/2*(qa*Math.sqrt(1-b**4)/(Cd*area*b*b))**2;
   dp=s.fluid==='liquid'?incompressible:bisect(d=>forward(b,d,qa).qa,0,maxDP,qa,'DP');epsilon=betaExpansion(c,s,b,dp);}
 }else if(c.solve==='ratio'){
  pos(qa,'Flow for beta solving');pos(dp,'DP for beta solving');
  let lo=1e-5,hi=s.fluid==='gas'?.8:.999;
  if(auto){const p=profile(c,.5);lo=Math.max(p.bmin,p.dmin/D);hi=p.bmax;}
  // Valid intervals are scanned so a beta-dependent Re limit cannot be crossed silently.
  const roots=[];let previous=null;
  for(let i=0;i<=240;i++){const x=lo+(hi-lo)*i/240;try{validateGeometry(x);checkRe(x,rev(qa));const y=forward(x,dp,qa).qa-qa;
   if(Math.abs(y)<=Math.max(qa*1e-12,1e-30))roots.push(x);
   else if(previous&&y*previous.y<0)roots.push(bisect(z=>forward(z,dp,qa).qa,previous.x,x,qa,'Beta'));
   previous={x,y};}catch(e){previous=null;}}
  const unique=roots.filter((v,i)=>!i||Math.abs(v-roots[i-1])>1e-7);
  ok(unique.length===1,'Beta has '+unique.length+' admissible solutions; check geometry, flow and profile limits.');b=unique[0];({Cd,epsilon}=forward(b,dp,qa));
 }else throw Error('Unsupported beta-element solve target.');
 Re=rev(qa);checkRe(b,Re);
 let mach=null,throatMach=null;
 if(s.fluid==='gas'){
  pos(c.kappa-1,'κ − 1');mach=(qa/area)/Math.sqrt(c.kappa*s.P/s.rho);ok(mach<1,'Estimated pipe flow is sonic; this model is not applicable.');
  if(['nozzle','long_nozzle','venturi_nozzle','throat_nozzle'].includes(c.element)){
   const tau=1-dp/s.P,rho2=s.rho*tau**(1/c.kappa);throatMach=(qa*s.rho/(rho2*area*b*b))/Math.sqrt(c.kappa*s.P*tau/rho2);
   ok(throatMach<1,'Estimated nozzle throat flow is sonic; use a critical-flow model, not this subsonic equation.');
  }
 }
 const warnings=[auto?'Correlation D, bore, beta and Reynolds limits checked; tap geometry, roughness, edge condition and installation are not verified.':'Entered C is held fixed. Supply a coefficient calibrated for this geometry, tap arrangement and Reynolds-number range.'];
 if(Re===0)warnings.push('Zero flow is a mathematical endpoint, not a valid Reynolds-number point for a standard correlation.');
 if(s.fluid==='gas'&&(c.expMode==='manual'||['cone','wedge','throat_nozzle'].includes(c.element)))warnings.push('Entered gas expansion Y is held fixed. The ΔP/P ≤ 0.10 envelope is a software restriction, not a universal equipment rating. Re-evaluate Y at each operating point.');
 if(['cone','wedge','throat_nozzle'].includes(c.element))warnings.push('This mode implements the specified geometry with entered C and Y; it does not supply an automatic ISO coefficient or conformity claim.');
 if(s.fluid==='liquid')warnings.push('Single-phase incompressible calculation: no cavitation, flashing or liquid reference-temperature correction.');
 return {qa,dp,beta:b,Cd,K:null,epsilon,Re,area,throat:D*b,velocity:qa/area,mach,throatMach,warnings,status:auto?'Correlation numeric limits checked':'Entered-coefficient calculation'};
}
function finish(c,r){
 if(r.dp!=null&&c.maxDP!=null){pos(c.maxDP,'User DP limit');if(r.dp>c.maxDP*(1+1e-12))r.warnings.push('USER-ENTERED DP LIMIT EXCEEDED: '+r.dp+' Pa > '+c.maxDP+' Pa. This is not an equipment safety assessment.');}
 r.version='4.0.0';r.mode=MODES[c.element].name;
 return r;
}
function converted(c,qa,extras={}){const r=B.solve({...c,element:'converter',q:qa,qUnit:'m3s'});return {...r,...extras,warnings:[...r.warnings,...(extras.warnings||[])]};}
function solve(input){
 const c={taps:'flange',expMode:'auto',profileFactor:1,...input};ok(MODES[c.element],'Choose a supported calculation type.');
 const type=MODES[c.element],s=B.state(c);let r;
 if(c.solve==='coef'&&['beta','probe'].includes(type.family)){
  const target=B.flowToActual(c.q,c.qUnit,s);pos(target,'Flow for coefficient solving');pos(c.dp,'DP for coefficient solving');
  const test=solve({...c,solve:'flow',cdMode:'manual',Cd:1,K:1});
  const factor=target/test.qa;pos(factor,'Inferred coefficient');
  r=solve({...c,solve:'flow',cdMode:'manual',Cd:factor,K:factor});
  r.inferredCoefficient=factor;r.warnings.push('Coefficient inferred from ONE operating point; not a traceable calibration or a Reynolds-number correlation.');return finish(c,r);
 }
 if(c.element==='venturi'){
  if(c.expMode!=='manual')r=B.solve(c);
  else{const d=betaSolve({...c,element:'throat_nozzle',cdMode:'manual'},s);r=converted(c,d.qa,d);}
 }else if(c.element==='converter')r=B.solve(c);
 else if(['annubar','pitot','custom_dp'].includes(c.element)){
  const pf=c.element==='pitot'?bound(pos(c.profileFactor,'Mean/local velocity factor'),0,1,'Mean/local velocity factor'):1;
  r=B.solve({...c,element:'annubar',K:c.K*pf});r.effectiveK=r.K;r.K=r.K/pf;
  r.warnings=r.warnings.map(w=>w.replace(/Annubar/g,'averaging-pitot'));
  if(c.element==='pitot'){r.pointVelocity=r.velocity/pf;r.warnings.push('A single-point pitot measures local velocity. The entered mean/local velocity factor must come from a traverse or a validated profile; it is not derived from pipe size.');if(s.fluid==='gas')ok(r.pointVelocity/Math.sqrt(c.kappa*s.P/s.rho)<=.3,'Single-point pitot mode is limited to estimated local Mach ≤ 0.3.');}
 }else if(type.family==='beta'){const d=betaSolve(c,s);r=converted(c,d.qa,d);}
 else if(c.element==='calibrated_dp'){
  const u=B.UNITS[c.calUnit];ok(u&&u.kind==='actual','Calibration flow must use actual-volume units at the calibration state.');
  const q0=pos(c.calQ,'Calibration flow')*u.factor,dp0=pos(c.calDP,'Calibration DP'),rho0=pos(c.calRho,'Calibration density');
  const Y=s.fluid==='gas'?bound(pos(c.Y,'Operating Y'),0,1,'Operating Y'):1,Y0=s.fluid==='gas'?bound(pos(c.calY,'Calibration Y'),0,1,'Calibration Y'):1;
  let dp,qa;const scale=q0*Math.sqrt(rho0/s.rho)*Y/Y0;
  if(c.solve==='flow'){dp=num(c.dp,'DP',0);qa=scale*Math.sqrt(dp/dp0);}else{qa=B.flowToActual(c.q,c.qUnit,s);dp=dp0*(qa/scale)**2;}
  if(s.fluid==='gas')ok(dp/s.P<=.1+1e-12,'Calibrated DP mode is limited to ΔP/P ≤ 0.10 with entered expansion factors.');
  r=converted(c,qa,{dp,epsilon:Y,calScale:scale,warnings:['Single-point DP scaling assumes unchanged meter coefficient/geometry and applicable density and expansion corrections. Do not extrapolate outside the calibration range.'],status:'Single-point calibrated scaling'});
 }else if(c.element==='velocity'){
  const area=c.areaMode==='rect'?pos(c.width,'Duct width')*pos(c.height,'Duct height'):c.areaMode==='area'?pos(c.flowArea,'Flow area'):Math.PI*pos(c.D,'Pipe ID')**2/4;
  const qa=c.solve==='flow'?num(c.velocity,'Mean velocity',0)*area:B.flowToActual(c.q,c.qUnit,s);
  r=converted(c,qa,{area,velocity:qa/area,warnings:['Velocity input must be cross-sectional mean velocity, not an uncorrected single-point reading.'],status:'Continuity · mean velocity × area'});
 }else if(c.element==='pulse'){
  const unit=c.pulseUnit;ok(['m3','L','USgal','ft3','kg','lb'].includes(unit),'Unsupported pulse K unit.');
  const scale={m3:1,L:.001,USgal:B.C.gallonUS,ft3:B.FT3,kg:1,lb:B.C.lb}[unit];
  const kind=unit==='kg'||unit==='lb'?'mass':c.pulseBasis;
  ok(['actual','standard','normal','mass'].includes(kind),'Choose pulse reporting basis.');ok(s.fluid==='gas'||!['standard','normal'].includes(kind),'Gas-reference pulse units are not liquid units.');
  const K=pos(c.pulseK,'Pulse K (pulses per unit)'),fac=kind==='mass'?s.rho:kind==='standard'?s.standardFactor:kind==='normal'?s.normalFactor:1;
  const qa=c.solve==='flow'?num(c.frequency,'Frequency',0)/K*scale/fac:B.flowToActual(c.q,c.qUnit,s);
  const frequency=qa*fac/scale*K;
  r=converted(c,qa,{frequency,pulseK:K,warnings:['Pulse K is pulses per stated volume or mass; it is NOT the dimensionless K used for DP probes. Calibration, viscosity effects and pulse validity are external inputs.'],status:'Pulse / frequency conversion'});
 }else if(c.element==='signal'){
  const lo=num(c.signalLow,'Low signal'),hi=num(c.signalHigh,'High signal');ok(hi>lo,'Signal high must exceed signal low.');
  const qLo=B.flowToActual(c.rangeLow,c.rangeUnit,s),qHi=B.flowToActual(c.rangeHigh,c.rangeUnit,s);ok(qHi>qLo,'Flow range high must exceed low.');
  ok(['linear','sqrt'].includes(c.signalLaw),'Choose linear or square-root signal mapping.');if(c.signalLaw==='sqrt')ok(qLo===0,'Square-root DP scaling requires a zero flow origin.');
  let qa,signal,p;
  if(c.solve==='flow'){signal=bound(c.signal,lo,hi,'Signal');p=(signal-lo)/(hi-lo);qa=qLo+(qHi-qLo)*(c.signalLaw==='sqrt'?Math.sqrt(p):p);}
  else{qa=B.flowToActual(c.q,c.qUnit,s);p=(qa-qLo)/(qHi-qLo);bound(p,0,1,'Flow span fraction');signal=lo+(hi-lo)*(c.signalLaw==='sqrt'?p*p:p);}
  r=converted(c,qa,{signal,warnings:[c.signalLaw==='sqrt'?'Square root is applied ONCE to a linear-DP signal with zero-based DP/flow spans; density is assumed consistent with the entered flow range. Do not use for a transmitter already outputting linearized flow.':'Linear scaling: use for a transmitter already reporting linear flow. No second square root or automatic density compensation is applied.','Out-of-range inputs are rejected, not silently clipped. This is signal scaling, not transmitter fault diagnosis.'],status:'Analog signal scaling'});
 }
 ok(r,'No result produced.');num(r.qa,'Actual flow',0);return finish(c,r);
}
const api=Object.freeze({...B,VERSION:'4.0.0',MODES,rhg,nozzleCd,orificeExpansion,wedgeBeta,coneBeta,profile,solve});root.FlowCalc=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(root);
export const FlowCalc = root.FlowCalc;
