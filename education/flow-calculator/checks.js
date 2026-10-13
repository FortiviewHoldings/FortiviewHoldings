// Deterministic regression checks. Golden values independently evaluated.
import { FlowCalc } from './engine.js';
const root = { FlowCalc };
/* Deterministic regression checks. Golden forward results were independently
 * evaluated with 65-decimal mpmath arithmetic; ISO epsilon points are rounded
 * cross-checks from ISO 5167-4:2003 Annex A (not an interpolation algorithm). */
(function(root){
'use strict';
function runFlowChecks(){
 const F=root.FlowCalc,results=[];
 function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
 function near(a,b,rt=2e-11,at=1e-13){if(!Number.isFinite(a)||Math.abs(a-b)>Math.max(at,Math.abs(b)*rt))throw new Error(a+' ≠ '+b);}
 function fails(fn,text){let caught=false;try{fn();}catch(e){caught=true;if(text&&!e.message.includes(text))throw e;}if(!caught)throw new Error('Expected rejection.');}
 const base={fluid:'gas',element:'venturi',solve:'flow',D:4.026*.0254,beta:.65,cdMode:'machined',Cd:.995,K:.621,Y:1,
 dp:24884,q:100,qUnit:'acfm',densityMode:'eos',rhoGas:1.2,rhoLiquid:62.36*F.DENSITY.lbft3,
 P:100*F.PSI+101325,T:F.temperatureK(80,'F'),Z:1,M:28.96546,yH2O:0,mu:.0000185,kappa:1.4,
 refP:14.7*F.PSI,refT:F.temperatureK(60,'F'),refZ:1,normalZ:1,refBasis:'dry'};
 const liquid={...base,fluid:'liquid',D:8.071*.0254,mu:.001,cdMode:'manual'};
 test('Exact US gallon volume',()=>near(F.C.gallonUS,.003785411784,0,1e-17));
 test('US gallon per minute in m³/s',()=>near(F.UNITS.gpm.factor,.0000630901964,0,1e-18));
 test('International cubic foot',()=>near(F.FT3,.028316846592,0,1e-16));
 test('Standard gravity psi conversion',()=>near(F.PSI,6894.757293168361));
 test('Water-column 60 °F is explicit',()=>near(F.PRESSURE.inH2O60,248.84));
 test('Conventional water column is distinct',()=>near(F.PRESSURE.inH2Oconv,249.0889));
 test('32 °F → K',()=>near(F.temperatureK(32,'F'),273.15));
 test('60 °F → K',()=>near(F.temperatureK(60,'F'),288.70555555555555));
 test('20 °C → K',()=>near(F.temperatureK(20,'C'),293.15));
 test('Rankine → K',()=>near(F.temperatureK(540,'R'),300));
 test('K → °F',()=>near(F.temperatureFromK(273.15,'F'),32));
 test('Gauge pressure includes local atmosphere',()=>near(F.absolutePressure(100,'psi','gauge',101325),790800.7293168361));
 test('Absolute pressure excludes atmosphere',()=>near(F.absolutePressure(100,'psi','absolute'),689475.7293168361));
 const s=F.state(base);
 test('Gas density: independent high-precision result',()=>near(s.rho,9.188773249464356));
 test('100 ACFM → SCFM: independent reference',()=>near(F.actualToFlow(F.flowToActual(100,'acfm',s),'scfm',s),751.3289325609676));
 test('Identical flowing/reference state gives identity',()=>{const t=F.state({...base,P:base.refP,T:base.refT});near(t.standardFactor,1);});
 test('Z reference/flow ratio points in the correct direction',()=>near(F.state({...base,Z:.8,refZ:.96}).standardFactor/s.standardFactor,1.2));
 test('ISO normal vs 15 °C reference ratio',()=>{const t=F.state({...base,refP:101325,refT:288.15});near(t.standardFactor/t.normalFactor,288.15/273.15);});
 test('Entered density derives a consistent implied Z',()=>{const t=F.state({...base,densityMode:'manual',rhoGas:s.rho/0.9});near(t.Z,.9);near(t.standardFactor,s.standardFactor/.9);});
 test('Dry-mole accounting excludes exactly entered vapor fraction',()=>{const wet=F.state({...base,yH2O:.02,refBasis:'total'}),dry=F.state({...base,yH2O:.02,refBasis:'dry'});near(dry.standardFactor/wet.standardFactor,.98);});
 test('Dry reference mass is not total wet-stream mass',()=>{const t=F.state({...base,yH2O:.05});near(t.standardFactor*t.rhoRef,t.rho*t.dryMassFraction);});
 for(const id of Object.keys(F.UNITS))test('Unit round trip: '+id,()=>near(F.flowToActual(F.actualToFlow(.123456789,id,s),id,s),.123456789));
 test('Gas Venturi epsilon: high-precision result',()=>near(F.venturiExpansion(.65,24884,base.P,1.4),.9782645086203825));
 test('Zero differential gives epsilon = 1',()=>near(F.venturiExpansion(.65,0,base.P,1.4),1));
 test('Very small differential remains numerically stable',()=>near(F.venturiExpansion(.65,base.P*1e-14,base.P,1.4),1,2e-13));
 test('Exponent close to unity remains finite',()=>{const e=F.venturiExpansion(.65,base.P*.01,base.P,1+1e-10);if(!(e>0&&e<1))throw Error('Bad epsilon');});
 [[.3,1.4,.75,.8546],[.75,1.4,.75,.7960],[.3,1.2,.9,.9354],[.75,1.3,.8,.8246],[.75,1.66,.75,.8228]]
 .forEach(([b,k,t,e])=>test('ISO Annex epsilon point β='+b+', κ='+k+', τ='+t,()=>near(F.venturiExpansion(b,1-t,1,k),e,0,.000051)));
 const g=F.solve(base),w=F.solve(liquid);
 test('Gas Venturi Qa: independent high-precision result',()=>near(g.qa,.2756335392615589));
 test('Gas Venturi SCFM: independent high-precision result',()=>near(g.values.scfm,4388.019382565618));
 test('2022 machined high-Re coefficient',()=>near(g.Cd,1));
 test('2022 machined low-Re coefficient',()=>near(F.solve({...base,dp:2000}).Cd,.995));
 test('Liquid Venturi Qa: independent high-precision result',()=>near(w.qa,.10806157325022839));
 test('Liquid Venturi US GPM: independent high-precision result',()=>near(w.values.gpm,1712.8108551937935));
 const a=F.solve({...liquid,element:'annubar',D:base.D});
 test('Liquid probe Qa: independent high-precision result',()=>near(a.qa,.036000461696618045));
 test('Liquid probe GPM: independent high-precision result',()=>near(a.values.gpm,570.61895113419));
 for(const [name,c] of [['gas Venturi',base],['liquid Venturi',liquid],['gas probe',{...base,element:'annubar',Y:.992}],['liquid probe',{...liquid,element:'annubar'}]]) {
  const r=F.solve(c);
  test(name+' inverse ΔP',()=>near(F.solve({...c,solve:'dp',q:r.qa,qUnit:'m3s'}).dp,c.dp));
  test(name+' inverse β/K',()=>{const rr=F.solve({...c,solve:'ratio',q:r.qa,qUnit:'m3s'});near(c.element==='annubar'?rr.K:rr.beta,c.element==='annubar'?c.K:c.beta);});
  test(name+' mass conservation',()=>near(r.mass,r.qa*r.state.rho));
 }
 test('SCFM input solves the same gas ΔP',()=>near(F.solve({...base,solve:'dp',q:g.values.scfm,qUnit:'scfm'}).dp,base.dp));
 test('Normal-volume input solves the same gas ΔP',()=>near(F.solve({...base,solve:'dp',q:g.values.nm3h,qUnit:'nm3h'}).dp,base.dp));
 test('Mass input solves the same liquid ΔP',()=>near(F.solve({...liquid,solve:'dp',q:w.values.lbh,qUnit:'lbh'}).dp,liquid.dp));
 test('Flow converter does not require primary-element data',()=>near(F.solve({...base,element:'converter',D:NaN,dp:NaN,mu:NaN}).values.scfm,751.3289325609676));
 test('Zero liquid differential gives zero flow',()=>near(F.solve({...liquid,dp:0}).qa,0));
 test('Zero gas flow gives zero differential',()=>near(F.solve({...base,solve:'dp',q:0}).dp,0));
 test('β = 1 is rejected',()=>fails(()=>F.solve({...liquid,beta:1}),'Beta'));
 test('Negative differential is rejected',()=>fails(()=>F.solve({...base,dp:-1})));
 test('Blank/non-number flow is rejected',()=>fails(()=>F.solve({...base,solve:'dp',q:NaN})));
 test('Infinite diameter is rejected',()=>fails(()=>F.solve({...base,D:Infinity})));
 test('Absolute zero is rejected',()=>fails(()=>F.temperatureK(-273.15,'C')));
 test('Nonpositive absolute pressure is rejected',()=>fails(()=>F.state({...base,P:0})));
 test('Liquid SCFM input is rejected',()=>fails(()=>F.solve({...liquid,solve:'dp',qUnit:'scfm'})));
 test('Missing standard pressure is rejected',()=>fails(()=>F.state({...base,refP:NaN})));
 test('Invalid vapor mole fraction is rejected',()=>fails(()=>F.state({...base,yH2O:1})));
 test('Identical reference states cannot have different Z values',()=>fails(()=>F.state({...base,refT:273.15,refP:101325,refZ:.99,normalZ:1}),'identical'));
 test('Identical flowing/reference states require consistent Z',()=>fails(()=>F.state({...base,P:base.refP,T:base.refT,Z:.9}),'identical'));
 test('ISO gas expansion does not extrapolate below τ = 0.75',()=>fails(()=>F.solve({...base,dp:base.P*.251}),'0.75'));
 test('ISO diameter range is enforced',()=>fails(()=>F.solve({...base,D:.4}),'requires D'));
 test('ISO beta range is enforced',()=>fails(()=>F.solve({...base,beta:.8}),'Beta'));
 test('ISO Reynolds range is enforced',()=>fails(()=>F.solve({...base,dp:.1}),'ReD'));
 test('Impossible gas ΔP inversion is rejected',()=>fails(()=>F.solve({...base,solve:'dp',q:1e9,qUnit:'scfm'})));
 test('Underdetermined zero-flow beta is rejected',()=>fails(()=>F.solve({...liquid,solve:'ratio',q:0})));
 test('Probe expansion above 1 is rejected',()=>fails(()=>F.solve({...base,element:'annubar',Y:1.1})));
 test('Probe conservative software envelope is enforced',()=>fails(()=>F.solve({...base,element:'annubar',dp:base.P*.101})));
 test('Machined transition ambiguity is not silently resolved',()=>{
  // Scale liquid rho/mu so the low-C branch has Re = 997500 and high-C has Re > 1e6.
  const c={...liquid,cdMode:'machined'},r=F.solve(c);c.mu=c.mu*r.Re/997500;
  fails(()=>F.solve(c),'two self-consistent');
 });
 return {version:F.VERSION,passed:results.filter(r=>r.pass).length,total:results.length,results};
}
root.runFlowChecks=runFlowChecks;
})(root);
(function(root){
'use strict';
function runAllFlowChecks(){
 const F=root.FlowCalc,old=root.runFlowChecks(),results=[...old.results];
 const test=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
 const near=(a,b,rel=3e-10)=>{if(!Number.isFinite(a)||Math.abs(a-b)>Math.max(2e-12,Math.abs(b)*rel))throw Error(a+' ≠ '+b);};
 const fails=fn=>{let hit=false;try{fn();}catch(e){hit=true;}if(!hit)throw Error('Expected validation error.');};
 const gas={fluid:'gas',element:'orifice',solve:'flow',D:.1022604,beta:.65,cdMode:'auto',Cd:.62,K:.62,Y:.995,expMode:'auto',profileFactor:.9,taps:'flange',
 dp:24884,q:100,qUnit:'acfm',densityMode:'eos',rhoGas:9.2,rhoLiquid:998,mu:.0000185,kappa:1.4,P:790800.7293168361,T:299.81666666666666,Z:1,M:28.96546,yH2O:0,refP:14.7*F.PSI,refT:F.temperatureK(60,'F'),refZ:1,normalZ:1,refBasis:'dry'};
 const liquid={...gas,fluid:'liquid',mu:.001,dp:20000,D:.2,beta:.5};
 test('Sixteen generic calculation modes',()=>near(Object.keys(F.MODES).length,16));
 test('Cone geometric beta',()=>near(F.coneBeta(.06,.1),.8));
 test('Half-open wedge geometry',()=>near(F.wedgeBeta(.5),Math.SQRT1_2));
 test('Complementary wedge areas',()=>near(F.wedgeBeta(.25)**2+F.wedgeBeta(.75)**2,1));
 test('Bad cone diameter rejected',()=>fails(()=>F.coneBeta(.2,.1)));
 test('Bad wedge opening rejected',()=>fails(()=>F.wedgeBeta(1.1)));
 test('RHG corner golden coefficient',()=>near(F.rhg(.5,1e6,.1,'corner'),.6037770890602403379389908501944149));
 test('RHG flange golden coefficient',()=>near(F.rhg(.5,1e6,.1,'flange'),.6031317181130178176006626889062535));
 test('Orifice expansion at zero DP',()=>near(F.orificeExpansion(.6,0,1e5,1.4),1));
 test('Orifice expansion golden point',()=>near(F.orificeExpansion(.6,1e4,1e5,1.4),1-(.351+.256*.6**4+.93*.6**8)*(1-.9**(1/1.4))));
 test('Orifice high pressure ratio rejected',()=>fails(()=>F.orificeExpansion(.5,26000,1e5,1.4)));
 test('Long-radius coefficient source table (β=.2, Re=10000)',()=>near(F.nozzleCd('long_nozzle',.2,10000),.9672969522138527465648961918863695));
 test('Venturi-nozzle beta-only coefficient',()=>near(F.nozzleCd('venturi_nozzle',.5,1e6),.9771379419304648));
 for(const fluid of ['gas','liquid']){
  const base=fluid==='gas'?gas:liquid;
  for(const element of ['orifice','nozzle','long_nozzle','venturi_nozzle','cone','wedge','throat_nozzle']){
   const auto=['orifice','nozzle','long_nozzle','venturi_nozzle'].includes(element);
   const c={...base,element,cdMode:auto?'auto':'manual',Cd:.8,Y:.994,expMode:auto?'auto':'manual'};
   test(fluid+' '+element+' forward / inverse DP',()=>{const r=F.solve(c),rr=F.solve({...c,solve:'dp',q:r.qa,qUnit:'m3s'});near(rr.dp,c.dp);});
   test(fluid+' '+element+' inverse geometry',()=>{const r=F.solve(c),rr=F.solve({...c,solve:'ratio',q:r.qa,qUnit:'m3s'});near(rr.beta,c.beta);});
   test(fluid+' '+element+' mass conservation',()=>{const r=F.solve(c);near(r.mass,r.qa*r.state.rho);});
   test(fluid+' '+element+' zero differential',()=>near(F.solve({...c,dp:0}).qa,0));
  }
 }
 for(const taps of ['corner','flange','D-D2'])test('Orifice tap '+taps+' equation closes',()=>{const c={...gas,taps},r=F.solve(c),rho=r.state.rho,A=Math.PI*c.D*c.D/4;near(r.qa,F.rhg(c.beta,r.Re,c.D,taps)*r.epsilon*A*c.beta*c.beta/Math.sqrt(1-c.beta**4)*Math.sqrt(2*c.dp/rho));});
 test('Orifice subminimum Reynolds rejects rather than extrapolates',()=>fails(()=>F.solve({...liquid,dp:.00001})));
 test('Orifice bore under 12.5 mm rejected',()=>fails(()=>F.solve({...liquid,D:.05,beta:.1})));
 test('Single-point profile factor is explicit',()=>{const c={...gas,element:'pitot',dp:100,K:1},r=F.solve(c),rr=F.solve({...c,element:'annubar'});near(r.qa,rr.qa*c.profileFactor);});
 test('Single-point coefficient inverse retains profile factor',()=>{const c={...gas,element:'pitot',dp:100,K:.99},r=F.solve(c);near(F.solve({...c,solve:'ratio',q:r.qa,qUnit:'m3s'}).K,c.K);});
 test('Orifice inferred coefficient',()=>{const r=F.solve(gas),rr=F.solve({...gas,solve:'coef',q:r.qa,qUnit:'m3s'});near(rr.inferredCoefficient,r.Cd);near(rr.qa,r.qa);});
 test('Venturi inferred coefficient',()=>{const c={...gas,element:'venturi',cdMode:'manual',Cd:.99},r=F.solve(c);near(F.solve({...c,solve:'coef',q:r.qa,qUnit:'m3s'}).inferredCoefficient,.99);});
 test('Generic DP inverse coefficient',()=>{const c={...gas,element:'custom_dp'},r=F.solve(c);near(F.solve({...c,solve:'ratio',q:r.qa,qUnit:'m3s'}).K,c.K);});
 for(const areaMode of ['circle','rect','area'])test('Mean velocity inverse: '+areaMode,()=>{const c={...gas,element:'velocity',areaMode,width:.5,height:.3,flowArea:.2,velocity:4},r=F.solve(c);near(F.solve({...c,solve:'velocity',q:r.qa,qUnit:'m3s'}).velocity,4);});
 test('Rectangular continuity golden point',()=>near(F.solve({...liquid,element:'velocity',areaMode:'rect',width:.5,height:.3,velocity:4}).qa,.6));
 for(const pulseUnit of ['L','USgal','m3','ft3','kg','lb'])for(const pulseBasis of ['actual','standard','normal'])test('Pulse round trip '+pulseUnit+' / '+pulseBasis,()=>{const c={...gas,element:'pulse',pulseUnit,pulseBasis,pulseK:100,frequency:25},r=F.solve(c);near(F.solve({...c,solve:'frequency',q:r.qa,qUnit:'m3s'}).frequency,25);});
 test('100 pulses per litre, 100 Hz = 60 L/min',()=>near(F.solve({...liquid,element:'pulse',pulseK:100,pulseUnit:'L',pulseBasis:'actual',frequency:100}).values.lmin,60));
 for(const signalLaw of ['linear','sqrt'])for(const signal of [4,8,12,16,20])test('Analog '+signalLaw+' '+signal+' mA round trip',()=>{const c={...gas,element:'signal',signal,signalLow:4,signalHigh:20,signalLaw,rangeLow:0,rangeHigh:1000,rangeUnit:'scfm'},r=F.solve(c);near(F.solve({...c,solve:'signal',q:r.values.scfm,qUnit:'scfm'}).signal,signal);});
 test('Analog 12 mA linear midpoint',()=>near(F.solve({...gas,element:'signal',signal:12,signalLow:4,signalHigh:20,signalLaw:'linear',rangeLow:0,rangeHigh:1000,rangeUnit:'scfm'}).values.scfm,500));
 test('Analog 8 mA square root = 50% flow',()=>near(F.solve({...gas,element:'signal',signal:8,signalLow:4,signalHigh:20,signalLaw:'sqrt',rangeLow:0,rangeHigh:1000,rangeUnit:'scfm'}).values.scfm,500));
 test('Analog overrange is rejected',()=>fails(()=>F.solve({...gas,element:'signal',signal:21,signalLow:4,signalHigh:20,signalLaw:'linear',rangeLow:0,rangeHigh:1000,rangeUnit:'scfm'})));
 test('Square-root nonzero origin is rejected',()=>fails(()=>F.solve({...gas,element:'signal',signal:12,signalLow:4,signalHigh:20,signalLaw:'sqrt',rangeLow:100,rangeHigh:1000,rangeUnit:'scfm'})));
 const cal={...liquid,element:'calibrated_dp',calUnit:'lmin',calQ:60,calRho:998,calDP:10000,dp:40000,calY:1,Y:1};
 test('Calibration point square-root golden result',()=>near(F.solve(cal).values.lmin,120));
 test('Calibration DP inverse',()=>{const r=F.solve(cal);near(F.solve({...cal,solve:'dp',q:r.qa,qUnit:'m3s'}).dp,cal.dp);});
 test('Calibration density compensation',()=>near(F.solve({...cal,rhoLiquid:3992}).values.lmin,60));
 test('User DP limit warns without changing the equation',()=>{const r=F.solve({...gas,maxDP:1});near(r.qa,F.solve(gas).qa);if(!r.warnings.some(w=>w.includes('USER-ENTERED DP LIMIT EXCEEDED')))throw Error('Missing warning');});
 return {version:F.VERSION,passed:results.filter(r=>r.pass).length,total:results.length,results};
}
root.runAllFlowChecks=runAllFlowChecks;
})(root);
export const runAllFlowChecks = root.runAllFlowChecks;
